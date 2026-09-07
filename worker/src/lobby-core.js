// The lobby, as a pure state machine. No Cloudflare imports, no clock, no randomness of its own.
// The Durable Object wraps it; the mock lobby and the tests drive it directly.
// Every event carries `now` (ms, server clock). apply() returns a list of effects:
//   {type:'reply', body}                             answer to the HTTP request that caused the event
//   {type:'send', token, msg, rehearsal?}            a WebSocket frame to that token's window (or its rehearsal window)
//   {type:'close', token}                            close that token's socket (after any sends)
//   {type:'attach', ok, token, rehearsal, conn}      result of a ws_open: which token and connection id
// Socket events (ws_msg, ws_close) carry the `conn` from attach so a late callback from an old
// socket can never touch its replacement. Hook events carry the plugin's own `ts` and a hashed
// `session`, because hooks are async and can arrive out of order, and one machine can run several
// Claude sessions at once. nextDeadline(now) tells the wrapper when the next sweep is due.
// See docs/PROTOCOL.md for the words.

export const DEFAULTS = {
  T: 15_000, F: 20_000, N: 90_000, G: 90_000, P: 600_000, Q: 45_000,
  COUNTDOWN: 5, ROOM_MAX: 1_800_000, PEER_COOLDOWN: 60_000, OPEN_RETRY: 30_000,
  TICKET_TTL: 600_000, MAX_OPENS: 2, RECONNECT_GRACE: 15_000,
  REPORT_BLOCK: 3, BLOCK_MS: 86_400_000, PROBES_KEPT: 20, PROBE_BYTES: 2048,
  TOKEN_TTL: 30 * 86_400_000,
  SETUP_GRACE: 600_000, REHEARSAL_GRACE: 20_000,
  invites: [],
  iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
};

export const STATE_VERSION = 2;
const TOKEN_RE = /^[a-z0-9]{8,64}$/;
const EVENTS = { started: 'run', tick: 'run', needs_you: 'pause', paused: 'pause', stopped: 'stop' };
const own = (obj, key) => (obj && typeof key === 'string' && Object.hasOwn(obj, key) ? obj[key] : undefined);

export function emptyState() {
  return { v: STATE_VERSION, tokens: {}, rooms: {}, tickets: {}, seq: 0 };
}

/** Fill in fields an older snapshot lacks. A newer snapshot keeps its extra fields. */
export function hydrate(state) {
  const s = state && typeof state === 'object' ? state : emptyState();
  s.v = STATE_VERSION;
  s.tokens = s.tokens || {}; s.rooms = s.rooms || {}; s.tickets = s.tickets || {}; s.seq = s.seq || 0;
  for (const t of Object.values(s.tokens)) {
    t.lastPeers = t.lastPeers && !Array.isArray(t.lastPeers) ? t.lastPeers : {};
    t.reports = t.reports && !Array.isArray(t.reports) ? t.reports : {};
    t.probes = Array.isArray(t.probes) ? t.probes : [];
    t.blockedUntil = t.blockedUntil || 0;
    t.lastHookAt = t.lastHookAt || 0;
    t.registeredAt = t.registeredAt || 0;
    t.rehearse = !!t.rehearse;
    t.lastRegisterAt = t.lastRegisterAt || 0; t.lastRehearsalAt = t.lastRehearsalAt || 0;
    if (t.task) {
      const k = t.task;
      k.everConnected = !!k.everConnected; k.optedOut = !!k.optedOut; k.opens = k.opens || 0; k.lastOpenAt = k.lastOpenAt || 0;
      k.sessions = k.sessions && typeof k.sessions === 'object' ? k.sessions : {};
      k.lastTs = k.lastTs || 0; k.endedTs = k.endedTs || 0;
    }
    if (t.win) { t.win.disconnectedAt = t.win.disconnectedAt || 0; t.win.connected = !!t.win.connected; }
  }
  for (const r of Object.values(s.rooms)) {
    r.speaking = r.speaking || {}; r.video = r.video || {}; r.videoLined = !!r.videoLined; r.closing = r.closing || null;
    r.lastSpeechAt = r.lastSpeechAt || r.createdAt || 0;
  }
  return s;
}

export class Lobby {
  /** @param {object} cfg overrides for DEFAULTS  @param {object|null} state a previous snapshot  @param {() => string} rand id source */
  constructor(cfg = {}, state = null, rand = defaultRand) {
    this.cfg = { ...DEFAULTS, ...cfg };
    this.s = hydrate(state || emptyState());
    this.rand = rand;
    this.now = 0;
  }

  apply(ev) {
    this.fx = [];
    const now = ev.now;
    this.now = now;
    // Time passes first: a deadline that already went by is applied before the new event is read.
    this.sweep(now);
    switch (ev.kind) {
      case 'register': this.register(ev); break;
      case 'off': this.off(ev); break;
      case 'count': {
        const t = this.tok(ev.token);
        this.reply(t ? { count: this.othersFor(ev.token), enabled: !!t.enabled, window: this.hasWindow(ev.token, now) } : { count: 0, enabled: false, window: false });
        break;
      }
      case 'rehearse': this.rehearse(ev); break;
      case 'probes': this.reply({ probes: this.tok(ev.token)?.probes || [] }); break;
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
  send(token, msg, rehearsal = false) { this.fx.push(rehearsal ? { type: 'send', token, rehearsal: true, msg } : { type: 'send', token, msg }); }
  line(token, key, who = 'sys', extra = {}) { this.send(token, { type: 'line', key, who, ...extra }); }
  closeSocket(token) { this.fx.push({ type: 'close', token }); }
  /** Server-initiated close: say why, forget the window and its ticket, then drop the socket. */
  closeWindow(token, reason) {
    const t = this.tok(token);
    this.send(token, { type: 'close', reason });
    if (t && t.win) { delete this.s.tickets[t.win.ticket]; t.win = null; }
    this.closeSocket(token);
  }

  // ---------- registration ----------
  register({ token, invite, now, origin = '' }) {
    if (typeof token !== 'string' || !TOKEN_RE.test(token)) return this.reply({ ok: false, error: 'token' });
    const known = this.tok(token);
    const open = this.cfg.invites.length === 0;
    if (!known && !open && !this.cfg.invites.includes(invite)) return this.reply({ ok: false, error: 'invite' });
    const t = known || this.newToken(now);
    t.enabled = true;
    t.invite = typeof invite === 'string' && invite ? invite.slice(0, 64) : t.invite || null;
    t.lastHookAt = now;
    t.lastRegisterAt = now;
    this.s.tokens[token] = t;
    this.reply({ ok: true, count: this.othersFor(token), setup: origin + '/setup?t=' + token });
  }

  newToken(now) {
    return { enabled: false, invite: null, registeredAt: now, lastHookAt: now, task: null, win: null, room: null,
      lastPeers: {}, rehearse: false, reports: {}, blockedUntil: 0, probes: [], lastRegisterAt: 0, lastRehearsalAt: 0 };
  }

  off({ token, now }) {
    const t = this.tok(token);
    if (!t) return this.reply({ ok: true });
    t.enabled = false;
    t.rehearse = false;
    t.lastRegisterAt = 0; t.lastRehearsalAt = 0; // off means the browser may go now
    if (t.room) this.leaveRoom(token, now, 'off');
    else if (this.live(t)) this.closeWindow(token, 'off');
    t.win = null;
    this.dropTickets(token);
    t.task = null;
    this.reply({ ok: true });
  }

  rehearse({ token }) {
    const t = this.tok(token);
    if (!t || !t.enabled) return this.reply({ ok: false, error: 'token' });
    t.rehearse = true;
    this.reply({ ok: true });
  }

  // ---------- hooks ----------
  hook({ token, event, why, session, ts, now, origin = '' }) {
    const kind = own(EVENTS, event);
    const t = this.tok(token);
    if (!kind || !t || !t.enabled) return this.reply({});
    t.lastHookAt = now;
    if (t.blockedUntil > now) {
      if (t.task && t.task.phase !== 'done') this.endTask(token, now, 'done', now);
      return this.reply({});
    }
    const at = Number.isFinite(ts) ? ts : now;
    const sid = typeof session === 'string' && session ? session.slice(0, 32) : 'one';
    let task = t.task;
    if (kind === 'stop') {
      if (task && task.phase !== 'done' && at >= task.lastTs) {
        delete task.sessions[sid];
        if (Object.keys(task.sessions).length === 0) this.endTask(token, now, 'done', at);
        else { task.lastSignalAt = now; task.lastTs = at; }
      }
      return this.finishHook(t, token, now, origin, true);
    }
    if (!task || task.phase === 'done') {
      if (task && task.phase === 'done' && at < task.endedTs) return this.finishHook(t, token, now, origin);
      if (event === 'paused') return this.finishHook(t, token, now, origin);
      task = t.task = this.newTask(now, at);
    }
    task.sessions[sid] = now;
    task.lastSignalAt = now;
    task.lastTs = Math.max(task.lastTs, at);
    if (kind === 'run') {
      if (task.phase === 'paused') {
        task.phase = 'armed';
        task.pausedAt = 0;
        if (t.room) this.pairLines(token, 'back');
      }
    } else {
      const wasPaused = task.phase === 'paused';
      task.phase = 'paused';
      task.pausedAt = now;
      task.pauseKind = event === 'needs_you' ? 'needs_you' : (why === 'bg' ? 'bg' : 'question');
      if (!wasPaused && t.room) this.pairLines(token, 'brb');
    }
    this.promote(task, now);
    this.finishHook(t, token, now, origin);
  }

  finishHook(t, token, now, origin, stopping = false) {
    const hasWindow = !!t.win;
    if (t.rehearse && !hasWindow) {
      t.rehearse = false;
      t.lastRehearsalAt = now;
      const ticket = this.makeTicket(token, now, true, null);
      return this.reply({ open: origin + '/room?t=' + ticket, rehearsal: true });
    }
    const task = t.task;
    const pastT = task && now - task.startedAt >= this.cfg.T;
    const eligible = pastT && task.phase !== 'done' && !task.optedOut;
    const canOpen = eligible && !hasWindow &&
      (task.opens === 0 || (!task.everConnected && task.opens < this.cfg.MAX_OPENS && now - task.lastOpenAt > this.cfg.OPEN_RETRY));
    if (canOpen) {
      task.opens += 1;
      task.lastOpenAt = now;
      const ticket = this.makeTicket(token, now, false, task.id);
      return this.reply({ open: origin + '/room?t=' + ticket });
    }
    // After a stop with no window and none on its way, the plugin may quit its browser (D-87).
    this.reply(stopping && !this.hasWindow(token, now) ? { quit: true } : {});
  }

  /**
   * Something is, or may be, on screen in the plugin's browser: a window, one reconnecting, one
   * just told to open, a test window from the last few seconds, or the setup page right after
   * registration (the browser also hosts that page, so the reaper must leave it alone, D-87).
   */
  hasWindow(token, now) {
    const t = this.tok(token);
    if (!t) return false;
    if (t.win) return true;
    if (now - (t.lastRegisterAt || 0) < this.cfg.SETUP_GRACE) return true;
    if (now - (t.lastRehearsalAt || 0) < this.cfg.REHEARSAL_GRACE) return true;
    const task = t.task;
    return !!(task && task.phase !== 'done' && task.opens > 0 && !task.everConnected && now - task.lastOpenAt < this.cfg.OPEN_RETRY);
  }

  newTask(now, ts) {
    this.s.seq += 1;
    return { id: this.s.seq, startedAt: now, lastSignalAt: now, lastTs: ts, endedTs: 0, phase: 'armed', pausedAt: 0, pauseKind: null,
      opens: 0, lastOpenAt: 0, everConnected: false, optedOut: false, sessions: {} };
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
  endTask(token, now, reason, ts = now) {
    const t = this.tok(token);
    const task = t.task;
    task.phase = 'done';
    task.pausedAt = 0;
    task.endedTs = Math.max(task.endedTs, ts);
    task.sessions = {};
    this.dropTickets(token, t.win?.ticket);
    if (t.room) {
      const room = this.s.rooms[t.room];
      if (reason === 'done') {
        if (!room.closing) this.startClosing(room, token, now);
      } else {
        this.leaveRoom(token, now, reason);
      }
      return;
    }
    if (t.win) this.closeWindow(token, reason === 'quiet' ? 'quiet' : 'done');
  }

  startClosing(room, by, now) {
    const peer = peerIn(room, by);
    room.closing = { by, startedAt: now, n: this.cfg.COUNTDOWN };
    for (const tk of [by, peer]) this.send(tk, { type: 'state', state: 'closing' });
    this.countdown(room, this.cfg.COUNTDOWN);
  }

  countdown(room, n) {
    const by = room.closing.by;
    this.send(by, { type: 'countdown', n, mine: true, reason: 'done' });
    this.send(peerIn(room, by), { type: 'countdown', n, mine: false, reason: 'done' });
  }

  /** The goodbye is over. Whoever still has a running task keeps the window and shades. */
  finishClosing(room, now) {
    const by = room.closing.by;
    const peer = peerIn(room, by);
    this.dissolve(room, now);
    for (const tk of [by, peer]) {
      const t = this.tok(tk);
      if (!t.win) continue;
      const cur = t.task;
      if (cur && cur.phase !== 'done') {
        if (tk === peer) this.line(tk, 'left');
        this.adoptWindow(t, cur);
        this.requeue(tk);
      } else {
        this.closeWindow(tk, 'done');
      }
    }
  }

  /** A window that outlived its task now belongs to the token's new task. */
  adoptWindow(t, task) {
    const tk = own(this.s.tickets, t.win.ticket);
    if (tk && tk.taskId !== task.id) tk.taskId = task.id;
    if (task.opens === 0) { task.opens = 1; task.lastOpenAt = this.now; }
    task.everConnected = true;
  }

  /** One side leaves now: hangup, report, manual close, quiet Claude, off, dropped. The peer shades. */
  leaveRoom(token, now, reason) {
    const t = this.tok(token);
    const room = t.room ? own(this.s.rooms, t.room) : null;
    if (!room) { t.room = null; return; }
    const peer = peerIn(room, token);
    this.dissolve(room, now);
    if (t.task) t.task.optedOut = t.task.optedOut || reason === 'hangup' || reason === 'report' || reason === 'manual';
    if (this.live(t)) {
      if (reason === 'report') this.line(token, 'reported');
      this.closeWindow(token, reason === 'report' ? 'hangup' : reason);
    } else if (t.win && reason !== 'dropped') {
      t.win = null;
    }
    this.settle(peer, now);
  }

  /** After a room ends for the other side: shade if their Claude still works, close if not or if blocked. */
  settle(token, now) {
    const t = this.tok(token);
    if (!t.win) return;
    this.line(token, 'left');
    if (t.blockedUntil > now) {
      if (t.task && t.task.phase !== 'done') { t.task.phase = 'done'; t.task.sessions = {}; }
      this.closeWindow(token, 'done');
    } else if (t.task && t.task.phase !== 'done') {
      this.requeue(token);
    } else {
      this.closeWindow(token, 'done');
    }
  }

  /** Both stay: quiet room or time up. */
  endRoomSoft(room, now, key) {
    const [a, b] = [room.a, room.b];
    this.dissolve(room, now);
    for (const tk of [a, b]) {
      const t = this.tok(tk);
      if (!t.win) continue;
      this.line(tk, key);
      this.requeue(tk);
    }
  }

  dissolve(room, now) {
    for (const tk of [room.a, room.b]) {
      const t = this.tok(tk);
      if (!t) continue;
      t.room = null;
      t.lastPeers[peerIn(room, tk)] = now;
      for (const [p, at] of Object.entries(t.lastPeers)) if (now - at > this.cfg.PEER_COOLDOWN) delete t.lastPeers[p];
    }
    delete this.s.rooms[room.id];
  }

  requeue(token) {
    this.send(token, { type: 'state', state: 'shaded' });
    this.line(token, 'requeued', 'soft');
  }

  // ---------- tickets and windows ----------
  makeTicket(token, now, rehearsal, taskId) {
    const id = this.rand();
    this.s.tickets[id] = { token, exp: now + this.cfg.TICKET_TTL, rehearsal, taskId };
    return id;
  }

  dropTickets(token, keep = null) {
    for (const [id, tk] of Object.entries(this.s.tickets)) {
      if (tk.token === token && !tk.rehearsal && id !== keep) delete this.s.tickets[id];
    }
  }

  wsOpen({ ticket, now }) {
    const tk = own(this.s.tickets, ticket);
    if (!tk || tk.exp < now) return this.fx.push({ type: 'attach', ok: false });
    const t = this.tok(tk.token);
    if (!t || !t.enabled) return this.fx.push({ type: 'attach', ok: false });
    const token = tk.token;
    const conn = this.rand();
    if (tk.rehearsal) {
      delete this.s.tickets[ticket];
      this.fx.push({ type: 'attach', ok: true, token, rehearsal: true, conn });
      this.send(token, { type: 'hello', others: this.othersFor(token), state: 'shaded', rehearsal: true, cfg: this.clientCfg() }, true);
      this.send(token, { type: 'line', key: 'rehearsal', who: 'sys' }, true);
      return;
    }
    const task = t.task;
    const valid = task && task.id === tk.taskId && task.phase !== 'done' && !task.optedOut && t.blockedUntil <= now;
    if (!valid || this.live(t)) return this.fx.push({ type: 'attach', ok: false });
    t.win = { connected: true, since: now, ticket, conn, bye: null, lastOthers: null, disconnectedAt: 0 };
    tk.exp = now + this.cfg.ROOM_MAX + this.cfg.TICKET_TTL;
    task.everConnected = true;
    this.fx.push({ type: 'attach', ok: true, token, rehearsal: false, conn });
    this.send(token, { type: 'hello', others: this.othersFor(token), state: t.room ? 'room' : 'shaded', rehearsal: false, cfg: this.clientCfg() });
    t.win.lastOthers = this.othersFor(token);
  }

  clientCfg() { return { Q: this.cfg.Q, countdown: this.cfg.COUNTDOWN }; }

  /** Does this socket event belong to the window we know? */
  current(t, conn) { return this.live(t) && (!conn || t.win.conn === conn); }

  wsClose({ token, conn, now, rehearsal }) {
    if (rehearsal) return;
    const t = this.tok(token);
    if (!t || !this.current(t, conn)) return;
    if (t.win.bye === 'manual') {
      t.win = null;
      if (t.room) this.leaveRoom(token, now, 'manual');
      else if (t.task) t.task.optedOut = true;
      return;
    }
    // A drop. Keep the window record and the room for a short grace; the page reconnects with its ticket.
    t.win.connected = false;
    t.win.disconnectedAt = now;
  }

  wsMsg({ token, conn, msg, now }) {
    const t = this.tok(token);
    if (!t || !this.current(t, conn) || !msg || typeof msg !== 'object') return;
    const peer = this.peerOf(token);
    const room = t.room ? own(this.s.rooms, t.room) : null;
    switch (msg.type) {
      case 'signal':
        if (room && peer && msg.room === room.id) this.send(peer, { type: 'signal', room: room.id, data: msg.data });
        break;
      case 'speech':
        if (!room) break;
        room.speaking[token] = !!msg.active;
        room.lastSpeechAt = now;
        break;
      case 'video':
        if (!room) break;
        room.video[token] = !!msg.on;
        if (peer) this.send(peer, { type: 'peer', video: !!msg.on });
        if (own(room.video, room.a) && own(room.video, room.b) && !room.videoLined) {
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
        this.report(token, peer, room, now);
        break;
      case 'bye':
        t.win.bye = msg.reason === 'manual' ? 'manual' : null;
        break;
      case 'probe': {
        let size = 0;
        try { size = JSON.stringify(msg.data ?? null).length; } catch { break; }
        if (size > this.cfg.PROBE_BYTES) break;
        t.probes.push({ at: now, data: msg.data });
        if (t.probes.length > this.cfg.PROBES_KEPT) t.probes.shift();
        break;
      }
      default:
        break;
    }
  }

  /** Flag the peer (one flag per reporter per day). In a room this is also a hang-up; alone, the last peer is flagged. */
  report(token, peer, room, now) {
    const target = peer || this.recentPeer(token, now);
    if (target) {
      const p = this.tok(target);
      for (const [who, at] of Object.entries(p.reports)) if (now - at >= this.cfg.BLOCK_MS) delete p.reports[who];
      p.reports[token] = now;
      if (Object.keys(p.reports).length >= this.cfg.REPORT_BLOCK) p.blockedUntil = now + this.cfg.BLOCK_MS;
    }
    if (room) return this.leaveRoom(token, now, 'report');
    if (target) this.line(token, 'reported');
  }

  recentPeer(token, now) {
    const t = this.tok(token);
    let best = null, at = 0;
    for (const [p, when] of Object.entries(t.lastPeers)) if (now - when < this.cfg.PEER_COOLDOWN && when > at) { best = p; at = when; }
    return best;
  }

  // ---------- sweep, deadlines, pairing ----------
  sweep(now) {
    const c = this.cfg;
    for (const [token, t] of Object.entries(this.s.tokens)) {
      if (t.win && !t.win.connected && now - t.win.disconnectedAt > c.RECONNECT_GRACE) {
        t.win = null;
        if (t.room) this.leaveRoom(token, now, 'dropped');
      }
      const task = t.task;
      if (!task || task.phase === 'done') {
        if (!t.win && !t.room && now - t.lastHookAt > c.TOKEN_TTL) delete this.s.tokens[token];
        continue;
      }
      for (const [sid, at] of Object.entries(task.sessions)) if (now - at > c.N) delete task.sessions[sid];
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
        if (n !== room.closing.n) { room.closing.n = n; this.countdown(room, n); }
        continue;
      }
      if (now - room.createdAt > c.ROOM_MAX) this.endRoomSoft(room, now, 'time_up');
      else if (!this.anySpeaking(room, now) && now - room.lastSpeechAt > c.Q) this.endRoomSoft(room, now, 'quiet_room');
    }
    for (const [id, tk] of Object.entries(this.s.tickets)) if (tk.exp < now) delete this.s.tickets[id];
  }

  /** A "speaking" flag counts only while speech frames keep coming; a stale flag is silence. */
  anySpeaking(room, now) {
    const flag = own(room.speaking, room.a) || own(room.speaking, room.b);
    return !!flag && now - room.lastSpeechAt <= this.cfg.Q;
  }

  /** When the next sweep must run, or null when nothing is pending. */
  nextDeadline(now) {
    const c = this.cfg;
    let next = Infinity;
    const at = (x) => { if (x < next) next = x; };
    for (const t of Object.values(this.s.tokens)) {
      if (t.win && !t.win.connected) at(t.win.disconnectedAt + c.RECONNECT_GRACE);
      const task = t.task;
      if (!task || task.phase === 'done') continue;
      if (task.phase === 'armed') at(task.startedAt + c.T);
      if (task.phase === 'paused') at(task.pausedAt + (task.pauseKind === 'question' ? c.G : c.P));
      else at(task.lastSignalAt + c.N);
    }
    for (const room of Object.values(this.s.rooms)) {
      if (room.closing) { at(room.closing.startedAt + (c.COUNTDOWN - room.closing.n + 1) * 1000); continue; }
      at(room.createdAt + c.ROOM_MAX);
      at(room.lastSpeechAt + c.Q);
    }
    if (next === Infinity) return null;
    return Math.max(next, now + 250);
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
        if (used.has(b) || this.tooSoon(a, b, now)) continue;
        used.add(a); used.add(b);
        this.makeRoom(a, b, now);
        break;
      }
    }
  }

  tooSoon(a, b, now) {
    const last = Math.max(own(this.tok(a).lastPeers, b) || 0, own(this.tok(b).lastPeers, a) || 0);
    return last > 0 && now - last < this.cfg.PEER_COOLDOWN;
  }

  makeRoom(a, b, now) {
    const id = 'r' + this.rand();
    const room = { id, a, b, createdAt: now, lastSpeechAt: now, speaking: {}, video: {}, videoLined: false, closing: null };
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
  /** People whose Claude is working: a live shaded window, a task that runs, not paused, not in a room, not blocked. */
  waiting() {
    const now = this.now;
    const out = [];
    for (const [token, t] of Object.entries(this.s.tokens)) {
      const task = t.task;
      if (!t.enabled || !task || task.phase === 'done' || task.phase === 'paused' || task.optedOut) continue;
      if (!this.live(t) || t.room || t.blockedUntil > now) continue;
      out.push(token);
    }
    return out;
  }
  count() { return this.waiting().length; }
  othersFor(token) { const w = this.waiting(); return w.length - (w.includes(token) ? 1 : 0); }

  broadcastOthers() {
    const w = this.waiting();
    const set = new Set(w);
    for (const [token, t] of Object.entries(this.s.tokens)) {
      if (!this.live(t)) continue;
      const n = w.length - (set.has(token) ? 1 : 0);
      if (t.win.lastOthers !== n) {
        t.win.lastOthers = n;
        this.send(token, { type: 'others', n });
      }
    }
  }

  // ---------- helpers ----------
  tok(token) { return own(this.s.tokens, token); }
  live(t) { return !!(t && t.win && t.win.connected); }
  peerOf(token) {
    const t = this.tok(token);
    if (!t || !t.room) return null;
    const room = own(this.s.rooms, t.room);
    return room ? peerIn(room, token) : null;
  }
}

function peerIn(room, token) { return room.a === token ? room.b : room.a; }

function defaultRand() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}
