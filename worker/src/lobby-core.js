// The lobby, as a pure state machine. No Cloudflare imports, no clock, no randomness of its own.
// The Durable Object wraps it; the mock lobby and the tests drive it directly.
// Every event carries `now` (ms). apply() returns a list of effects:
//   {type:'reply', body}                  answer to the HTTP request that caused the event
//   {type:'send', token, msg}             a WebSocket frame to that token's window
//   {type:'close', token}                 close that token's socket (after any sends)
//   {type:'attach', ok, token, rehearsal} result of a ws_open: which token this socket belongs to
// See docs/PROTOCOL.md for the words.

export const DEFAULTS = {
  T: 15_000, F: 20_000, N: 90_000, G: 90_000, P: 600_000, Q: 45_000,
  COUNTDOWN: 5, ROOM_MAX: 1_800_000, PEER_COOLDOWN: 60_000, OPEN_RETRY: 30_000,
  TICKET_TTL: 600_000, MAX_OPENS: 2, RECONNECT_GRACE: 15_000,
  REPORT_BLOCK: 3, BLOCK_MS: 86_400_000, PROBES_KEPT: 20,
  invites: [],
  iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
};

export function emptyState() {
  return { tokens: {}, rooms: {}, tickets: {}, seq: 0 };
}

export class Lobby {
  /** @param {object} cfg overrides for DEFAULTS  @param {object|null} state a previous snapshot  @param {() => string} rand id source */
  constructor(cfg = {}, state = null, rand = defaultRand) {
    this.cfg = { ...DEFAULTS, ...cfg };
    this.s = state || emptyState();
    this.rand = rand;
  }

  apply(ev) {
    this.fx = [];
    const now = ev.now;
    switch (ev.kind) {
      case 'register': this.register(ev); break;
      case 'off': this.off(ev); break;
      case 'count': this.reply({ count: this.count(), enabled: !!this.s.tokens[ev.token]?.enabled }); break;
      case 'rehearse': this.rehearse(ev); break;
      case 'probes': this.reply({ probes: this.s.tokens[ev.token]?.probes || [] }); break;
      case 'hook': this.hook(ev); break;
      case 'ws_open': this.wsOpen(ev); break;
      case 'ws_close': this.wsClose(ev); break;
      case 'ws_msg': this.wsMsg(ev); break;
      case 'tick': break;
      default: throw new Error('unknown event ' + ev.kind);
    }
    this.sweep(now);
    this.pair(now);
    this.broadcastOthers();
    return this.fx;
  }

  // ---------- effects ----------
  reply(body) { this.fx.push({ type: 'reply', body }); }
  send(token, msg) { this.fx.push({ type: 'send', token, msg }); }
  line(token, key, who = 'sys', extra = {}) { this.send(token, { type: 'line', key, who, ...extra }); }
  closeSocket(token) { this.fx.push({ type: 'close', token }); }
  /** Server-initiated close: say why, forget the window, then drop the socket. */
  closeWindow(token, reason) {
    const t = this.s.tokens[token];
    this.send(token, { type: 'close', reason });
    if (t) t.win = null;
    this.closeSocket(token);
  }

  // ---------- registration ----------
  register({ token, invite, now, origin = '' }) {
    if (!token || typeof token !== 'string' || token.length < 8 || token.length > 64) return this.reply({ ok: false, error: 'token' });
    const known = this.s.tokens[token];
    const open = this.cfg.invites.length === 0;
    if (!known && !open && !this.cfg.invites.includes(invite)) return this.reply({ ok: false, error: 'invite' });
    const t = known || this.newToken();
    t.enabled = true;
    t.invite = invite || t.invite || null;
    t.registeredAt = t.registeredAt || now;
    this.s.tokens[token] = t;
    this.reply({ ok: true, count: this.count(), setup: origin + '/setup?t=' + token });
  }

  newToken() {
    return { enabled: false, invite: null, lastHookAt: 0, task: null, win: null, room: null,
      lastPeer: null, lastPeerAt: 0, rehearse: false, reports: [], blockedUntil: 0, probes: [] };
  }

  off({ token, now }) {
    const t = this.s.tokens[token];
    if (!t) return this.reply({ ok: true });
    t.enabled = false;
    t.rehearse = false;
    if (t.room) this.leaveRoom(token, now, 'off');
    else if (this.live(t)) { this.closeWindow(token, 'off'); }
    t.task = null;
    this.reply({ ok: true });
  }

  rehearse({ token }) {
    const t = this.s.tokens[token];
    if (!t || !t.enabled) return this.reply({ ok: false, error: 'token' });
    t.rehearse = true;
    this.reply({ ok: true });
  }

  // ---------- hooks ----------
  hook({ token, event, why, now, origin = '' }) {
    const t = this.s.tokens[token];
    if (!t || !t.enabled) return this.reply({});
    t.lastHookAt = now;
    if (t.blockedUntil > now) return this.reply({});
    let task = t.task;
    if (event === 'stopped') {
      if (task && task.phase !== 'done') this.endTask(token, now, 'done');
    } else {
      if (!task || task.phase === 'done') {
        if (event === 'paused') return this.finishHook(t, token, now, origin);
        task = t.task = this.newTask(now);
      }
      task.lastSignalAt = now;
      if (event === 'started' || event === 'tick') {
        if (task.phase === 'paused') {
          task.phase = 'queued';
          task.pausedAt = 0;
          if (t.room) this.pairLines(token, 'back');
        }
      } else if (event === 'needs_you' || event === 'paused') {
        const wasPaused = task.phase === 'paused';
        task.phase = 'paused';
        task.pausedAt = now;
        task.pauseKind = event === 'needs_you' ? 'needs_you' : (why === 'bg' ? 'bg' : 'question');
        if (!wasPaused && t.room) this.pairLines(token, 'brb');
      }
      this.promote(task, now);
    }
    this.finishHook(t, token, now, origin);
  }

  finishHook(t, token, now, origin) {
    if (t.rehearse) {
      t.rehearse = false;
      const ticket = this.makeTicket(token, now, true);
      return this.reply({ open: origin + '/room?t=' + ticket });
    }
    const task = t.task;
    const eligible = task && (task.phase === 'queued' || task.phase === 'paused') && !task.optedOut;
    const winBusy = t.win && (t.win.connected || (t.win.disconnectedAt && now - t.win.disconnectedAt < this.cfg.RECONNECT_GRACE));
    const canOpen = eligible && !winBusy &&
      (task.opens === 0 || (task.opens < this.cfg.MAX_OPENS && now - task.lastOpenAt > this.cfg.OPEN_RETRY));
    if (canOpen) {
      task.opens += 1;
      task.lastOpenAt = now;
      const ticket = this.makeTicket(token, now, false);
      return this.reply({ open: origin + '/room?t=' + ticket });
    }
    this.reply({});
  }

  newTask(now) {
    this.s.seq += 1;
    return { id: this.s.seq, startedAt: now, lastSignalAt: now, phase: 'armed', pausedAt: 0, pauseKind: null,
      opens: 0, lastOpenAt: 0, optedOut: false };
  }

  promote(task, now) {
    if (task.phase === 'armed' && now - task.startedAt >= this.cfg.T) task.phase = 'queued';
  }

  /** Away lines for a pair: 'brb' or 'back'. */
  pairLines(token, key) {
    const peer = this.peerOf(token);
    this.line(token, key, 'you');
    if (peer) this.line(peer, key, 'them');
  }

  // ---------- task end ----------
  endTask(token, now, reason) {
    const t = this.s.tokens[token];
    const task = t.task;
    task.phase = 'done';
    task.pausedAt = 0;
    if (t.room) {
      const room = this.s.rooms[t.room];
      if (reason === 'done') {
        if (!room.closing) this.startClosing(room, token, now);
      } else {
        this.leaveRoom(token, now, reason);
      }
      return;
    }
    if (this.live(t)) {
      this.closeWindow(token, reason === 'quiet' ? 'quiet' : 'done');
    }
  }

  startClosing(room, by, now) {
    room.closing = { by, startedAt: now, n: this.cfg.COUNTDOWN };
    const peer = room.a === by ? room.b : room.a;
    for (const tk of [by, peer]) this.send(tk, { type: 'state', state: 'closing' });
    this.send(by, { type: 'countdown', n: this.cfg.COUNTDOWN, mine: true, reason: 'done' });
    this.send(peer, { type: 'countdown', n: this.cfg.COUNTDOWN, mine: false, reason: 'done' });
  }

  finishClosing(room, now) {
    const by = room.closing.by;
    const peer = room.a === by ? room.b : room.a;
    this.dissolve(room, now);
    this.closeWindow(by, 'done');
    const pt = this.s.tokens[peer];
    if (pt.task && pt.task.phase === 'done') {
      this.closeWindow(peer, 'done');
    } else if (this.live(pt)) {
      this.line(peer, 'left');
      this.requeue(peer);
    }
  }

  /** One side leaves now: hangup, report, manual close, quiet Claude, off. The peer shades. */
  leaveRoom(token, now, reason) {
    const t = this.s.tokens[token];
    const room = this.s.rooms[t.room];
    if (!room) return;
    const peer = room.a === token ? room.b : room.a;
    this.dissolve(room, now);
    if (t.task) t.task.optedOut = t.task.optedOut || reason === 'hangup' || reason === 'report' || reason === 'manual';
    if (this.live(t)) {
      if (reason === 'report') this.line(token, 'reported');
      const r = reason === 'report' ? 'hangup' : reason === 'manual' ? 'manual' : reason;
      this.closeWindow(token, r);
    }
    const pt = this.s.tokens[peer];
    if (this.live(pt)) {
      this.line(peer, 'left');
      if (pt.task && pt.task.phase !== 'done') this.requeue(peer);
      else { this.closeWindow(peer, 'done'); }
    }
  }

  /** Both stay: quiet room or time up. */
  endRoomSoft(room, now, key) {
    const [a, b] = [room.a, room.b];
    this.dissolve(room, now);
    for (const tk of [a, b]) {
      const t = this.s.tokens[tk];
      if (!this.live(t)) continue;
      this.line(tk, key);
      this.requeue(tk);
    }
  }

  dissolve(room, now) {
    for (const tk of [room.a, room.b]) {
      const t = this.s.tokens[tk];
      if (!t) continue;
      t.room = null;
      t.lastPeer = tk === room.a ? room.b : room.a;
      t.lastPeerAt = now;
    }
    delete this.s.rooms[room.id];
  }

  requeue(token) {
    this.send(token, { type: 'state', state: 'shaded' });
    this.line(token, 'requeued', 'soft');
  }

  // ---------- windows ----------
  makeTicket(token, now, rehearsal) {
    const id = this.rand();
    this.s.tickets[id] = { token, exp: now + this.cfg.TICKET_TTL, rehearsal };
    return id;
  }

  wsOpen({ ticket, now }) {
    const tk = this.s.tickets[ticket];
    if (!tk || tk.exp < now) return this.fx.push({ type: 'attach', ok: false });
    const t = this.s.tokens[tk.token];
    if (!t || !t.enabled) return this.fx.push({ type: 'attach', ok: false });
    const token = tk.token;
    if (tk.rehearsal) {
      delete this.s.tickets[ticket];
      this.fx.push({ type: 'attach', ok: true, token, rehearsal: true });
      this.send(token, { type: 'hello', others: this.othersFor(token), state: 'shaded', rehearsal: true, cfg: this.clientCfg() });
      this.line(token, 'rehearsal');
      return;
    }
    if (t.win && t.win.connected) return this.fx.push({ type: 'attach', ok: false });
    t.win = { connected: true, since: now, ticket, disconnectedAt: 0, bye: null, lastOthers: null };
    this.fx.push({ type: 'attach', ok: true, token, rehearsal: false });
    this.send(token, { type: 'hello', others: this.othersFor(token), state: t.room ? 'room' : 'shaded', rehearsal: false, cfg: this.clientCfg() });
    t.win.lastOthers = this.othersFor(token);
  }

  clientCfg() { return { Q: this.cfg.Q, countdown: this.cfg.COUNTDOWN }; }

  wsClose({ token, now, rehearsal }) {
    if (rehearsal) return;
    const t = this.s.tokens[token];
    if (!t || !t.win) return;
    const manual = t.win.bye === 'manual';
    t.win.connected = false;
    t.win.disconnectedAt = now;
    if (t.room) this.leaveRoom(token, now, manual ? 'manual' : 'dropped');
    else if (manual && t.task) t.task.optedOut = true;
  }

  wsMsg({ token, msg, now }) {
    const t = this.s.tokens[token];
    if (!t || !this.live(t)) return;
    const peer = this.peerOf(token);
    const room = t.room ? this.s.rooms[t.room] : null;
    switch (msg.type) {
      case 'signal':
        if (peer) this.send(peer, { type: 'signal', data: msg.data });
        break;
      case 'speech':
        if (room && msg.active) room.lastSpeechAt = now;
        break;
      case 'video':
        if (!room) break;
        room.video[token] = !!msg.on;
        if (peer) this.send(peer, { type: 'peer', video: !!msg.on });
        if (room.video[room.a] && room.video[room.b] && !room.videoLined) {
          room.videoLined = true;
          this.line(room.a, 'video_on');
          this.line(room.b, 'video_on');
        }
        break;
      case 'hangup':
        if (room) this.leaveRoom(token, now, 'hangup');
        else { if (t.task) t.task.optedOut = true; this.closeWindow(token, 'hangup'); }
        break;
      case 'report':
        if (peer) {
          const p = this.s.tokens[peer];
          p.reports = p.reports.filter((at) => now - at < this.cfg.BLOCK_MS);
          p.reports.push(now);
          if (p.reports.length >= this.cfg.REPORT_BLOCK) p.blockedUntil = now + this.cfg.BLOCK_MS;
        }
        if (room) this.leaveRoom(token, now, 'report');
        else { if (t.task) t.task.optedOut = true; this.closeWindow(token, 'hangup'); }
        break;
      case 'bye':
        t.win.bye = msg.reason === 'manual' ? 'manual' : null;
        break;
      case 'probe':
        t.probes.push({ at: now, data: msg.data });
        if (t.probes.length > this.cfg.PROBES_KEPT) t.probes.shift();
        break;
      default:
        break;
    }
  }

  // ---------- sweep and pairing ----------
  sweep(now) {
    const c = this.cfg;
    for (const [token, t] of Object.entries(this.s.tokens)) {
      const task = t.task;
      if (!task || task.phase === 'done') continue;
      this.promote(task, now);
      if (task.phase === 'paused') {
        const limit = task.pauseKind === 'question' ? c.G : c.P;
        if (now - task.pausedAt > limit) this.endTask(token, now, 'done');
      } else if (now - task.lastSignalAt > c.N) {
        this.endTask(token, now, 'quiet');
      }
    }
    for (const room of Object.values(this.s.rooms)) {
      if (room.closing) {
        const n = c.COUNTDOWN - Math.floor((now - room.closing.startedAt) / 1000);
        if (n <= 0) { this.finishClosing(room, now); continue; }
        if (n !== room.closing.n) {
          room.closing.n = n;
          const by = room.closing.by;
          const peer = room.a === by ? room.b : room.a;
          this.send(by, { type: 'countdown', n, mine: true, reason: 'done' });
          this.send(peer, { type: 'countdown', n, mine: false, reason: 'done' });
        }
        continue;
      }
      if (now - room.createdAt > c.ROOM_MAX) this.endRoomSoft(room, now, 'time_up');
      else if (now - room.lastSpeechAt > c.Q) this.endRoomSoft(room, now, 'quiet_room');
    }
    for (const [id, tk] of Object.entries(this.s.tickets)) if (tk.exp < now) delete this.s.tickets[id];
  }

  candidates(now) {
    const out = [];
    for (const [token, t] of Object.entries(this.s.tokens)) {
      const task = t.task;
      if (!t.enabled || !task || task.phase !== 'queued' || task.optedOut) continue;
      if (!this.live(t) || t.room || t.blockedUntil > now) continue;
      if (now - task.lastSignalAt > this.cfg.F) continue;
      out.push(token);
    }
    out.sort((a, b) => this.s.tokens[a].task.startedAt - this.s.tokens[b].task.startedAt);
    return out;
  }

  pair(now) {
    const cands = this.candidates(now);
    const used = new Set();
    for (let i = 0; i < cands.length; i++) {
      const a = cands[i];
      if (used.has(a)) continue;
      for (let j = i + 1; j < cands.length; j++) {
        const b = cands[j];
        if (used.has(b)) continue;
        const ta = this.s.tokens[a], tb = this.s.tokens[b];
        if (ta.lastPeer === b && now - ta.lastPeerAt < this.cfg.PEER_COOLDOWN) continue;
        used.add(a); used.add(b);
        this.makeRoom(a, b, now);
        break;
      }
    }
  }

  makeRoom(a, b, now) {
    const id = 'r' + this.rand();
    const room = { id, a, b, createdAt: now, lastSpeechAt: now, video: {}, videoLined: false, closing: null };
    this.s.rooms[id] = room;
    this.s.tokens[a].room = id;
    this.s.tokens[b].room = id;
    const ice = this.cfg.iceServers;
    this.send(a, { type: 'match', role: 'offer', room: id, iceServers: ice });
    this.send(b, { type: 'match', role: 'answer', room: id, iceServers: ice });
    for (const tk of [a, b]) {
      this.send(tk, { type: 'state', state: 'room' });
      this.line(tk, 'entered');
      this.line(tk, 'hear', 'soft');
    }
  }

  // ---------- counts ----------
  /** People with a live shaded window and a running task, not in a room. */
  waiting() {
    const out = [];
    for (const [token, t] of Object.entries(this.s.tokens)) {
      const task = t.task;
      if (!t.enabled || !task || task.phase === 'done' || task.optedOut) continue;
      if (!this.live(t) || t.room) continue;
      out.push(token);
    }
    return out;
  }
  count() { return this.waiting().length; }
  othersFor(token) { const w = this.waiting(); return w.length - (w.includes(token) ? 1 : 0); }

  broadcastOthers() {
    for (const [token, t] of Object.entries(this.s.tokens)) {
      if (!this.live(t)) continue;
      const n = this.othersFor(token);
      if (t.win.lastOthers !== n) {
        t.win.lastOthers = n;
        this.send(token, { type: 'others', n });
      }
    }
  }

  // ---------- helpers ----------
  live(t) { return !!(t && t.win && t.win.connected); }
  peerOf(token) {
    const t = this.s.tokens[token];
    if (!t || !t.room) return null;
    const room = this.s.rooms[t.room];
    if (!room) return null;
    return room.a === token ? room.b : room.a;
  }
}

function defaultRand() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}
