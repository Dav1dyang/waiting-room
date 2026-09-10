// The one lobby. A thin shell around the pure core in lobby-core.js: it owns the clock,
// the sockets and the storage, and it never decides anything the core could decide.
//
// Sockets use the hibernation API, so the object can be evicted while windows stay open.
// Each socket carries a tag for routing (the token, or "r:" plus the token for a rehearsal)
// and an attachment {token, rehearsal, conn}. The conn goes back into every socket event so
// a late callback from a replaced socket cannot touch the window that took its place.
//
// State is small, so the whole snapshot is written after every apply. The sweep alarm lands
// exactly when the core says the next deadline is (a threshold, a silence, a countdown second).

import { DurableObject } from 'cloudflare:workers';
import { Lobby } from './lobby-core.js';
import { addTurn } from './turn.js';

const MS_VARS = ['T', 'F', 'N', 'G', 'P', 'Q', 'ROOM_MAX', 'PEER_COOLDOWN', 'OPEN_RETRY', 'TICKET_TTL',
  'COUNTDOWN', 'MAX_OPENS', 'RECONNECT_GRACE', 'SETUP_GRACE', 'REHEARSAL_GRACE'];
const POST_KINDS = { '/api/register': 'register', '/api/hook': 'hook', '/api/off': 'off', '/api/rehearse': 'rehearse' };
const HOOKS_PER_SECOND = 10;
const HEALTH_MEMO_MS = 5000;
// A window sends a handful of frames a second at most (ICE bursts, speech edges, one probe).
const FRAME_RATE = 40;
const FRAME_BURST = 120;
// Invite guessing: ten wrong codes from one address in ten minutes, three hundred from everyone
// in an hour, and registration answers 429 until the window passes. The plugin says "try again".
const REG_FAILS_IP = 10;
const REG_FAILS_IP_MS = 600_000;
const REG_FAILS_ALL = 300;
const REG_FAILS_ALL_MS = 3_600_000;
// With an open lobby (no invite code) this is the door: thirty new registrations from one
// address in an hour, then 429. A home has one address; a person turns it on once.
const REG_PER_IP = 30;
const REG_PER_IP_MS = 3_600_000;
const TICK_MS = 1000;
// Frames bigger than this are nonsense; an SDP offer with video is a few kilobytes.
const MAX_FRAME = 65536;
// A probe is kept in the state blob, twenty per token, so it gets a tighter limit.
const MAX_PROBE = 2048;

export class LobbyObject extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.hits = new Map();
    this.frames = new WeakMap();
    this.regFails = new Map();
    this.regFailsAll = { n: 0, until: 0 };
    this.regOk = new Map();
    this.capsDirty = false;
    this.healthMemo = { at: 0, body: null };
    ctx.blockConcurrencyWhile(async () => {
      // The caps outlive an eviction: they are written with the state whenever they change.
      const caps = await ctx.storage.get('caps');
      if (caps) {
        this.regFails = new Map(caps.fails || []);
        this.regOk = new Map(caps.ok || []);
        this.regFailsAll = caps.all || { n: 0, until: 0 };
      }
      this.salt = await ctx.storage.get('salt');
      if (!this.salt) {
        this.salt = crypto.randomUUID();
        await ctx.storage.put('salt', this.salt);
      }
      const saved = await ctx.storage.get('state');
      this.lobby = new Lobby(cfgFrom(env), saved || null);
      // Ping and pong never wake this object up.
      ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
      await this.forgetLostWindows();
    });
  }

  // ---------- HTTP ----------
  async fetch(request) {
    const url = new URL(request.url);
    const now = Date.now();
    const origin = request.headers.get('x-wr-origin') || url.origin;
    const ip = ipKey(request.headers.get('x-wr-ip') || '');

    if (url.pathname === '/ws') return this.openSocket(url, now);

    // Reads that cannot change anything never run the core, so a poller cannot spend the
    // object's request budget on state writes. Health is computed at most once every five seconds.
    if (url.pathname === '/api/health') {
      // At most once every five seconds the clock advances (rooms and tasks that are over end)
      // and the numbers are read. Everyone gets the one-bit answer; the operator's key, kept as a
      // secret, unlocks the counts (D-102).
      if (now - this.healthMemo.at > HEALTH_MEMO_MS) {
        await this.run({ kind: 'tick', now });
        this.healthMemo = { at: now, body: this.lobby.health(now) };
      }
      const h = this.healthMemo.body;
      const key = url.searchParams.get('k') || '';
      const exact = typeof this.env.HEALTH_KEY === 'string' && this.env.HEALTH_KEY.length >= 16 && key === this.env.HEALTH_KEY;
      return json(exact ? h : { ok: true, paired: h.roomsEver > 0 });
    }
    if (url.pathname === '/api/count' || url.pathname === '/api/probes') {
      const kind = url.pathname === '/api/count' ? 'count' : 'probes';
      const t = url.searchParams.get('t') || '';
      if (!this.lobby.tok(t)) return json(kind === 'count' ? { count: 0, enabled: false, window: false } : { probes: [] });
      return json(await this.run({ kind, token: t, now }));
    }

    const kind = POST_KINDS[url.pathname];
    if (!kind) return json({ error: 'route' }, 404);
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'json' }, 400);
    }
    if (!body || typeof body !== 'object') return json({ error: 'json' }, 400);
    const token = typeof body.token === 'string' ? body.token : '';
    // A hook from a token nobody registered changes nothing and never touches the limiter.
    if (kind === 'hook' && (!this.lobby.tok(token) || !this.allowHook(token, now))) return json({});
    // A token the lobby already knows is a person turning it on again, not a new registration.
    // The slot is taken before the first await, so two requests in flight cannot both pass the cap.
    const known = kind === 'register' && !!this.lobby.tok(token);
    if (kind === 'register' && !known) {
      if (!this.allowRegister(ip, now)) return json({ ok: false, error: 'busy' }, 429);
      this.noteRegisterOk(ip, now);
    }
    // Only the fields the core reads are copied across, so a body can never set its own event kind.
    const ev = { kind, token, now, origin };
    if (kind === 'register') ev.invite = typeof body.invite === 'string' ? body.invite : '';
    if (kind === 'hook') {
      ev.event = typeof body.event === 'string' ? body.event : '';
      ev.why = typeof body.why === 'string' ? body.why : null;
      // The plugin's own clock and hashed session id: hooks are async and can arrive out of order,
      // and one machine can run several Claude sessions. Nothing else from the body is read.
      ev.session = typeof body.session === 'string' ? body.session.slice(0, 32) : '';
      if (Number.isFinite(body.ts)) ev.ts = body.ts;
    }
    if (kind === 'register') ev.ipHash = await this.hashAddress(ip);
    // A token from before the home hash existed picks it up from its next hook.
    if (kind === 'hook' && ip && !this.lobby.tok(token)?.ipHash) ev.ipHash = await this.hashAddress(ip);
    const out = await this.run(ev);
    if (kind === 'register' && out && out.error === 'invite') this.noteRegisterFailure(ip, now);
    if (kind === 'register' && !known && !(out && out.ok)) this.unnoteRegister(ip, now);
    if (this.capsDirty) await this.saveCaps();
    if (kind === 'register' && out && out.error === 'busy') return json(out, 429);
    return json(out);
  }

  /** Ten hooks a second per token is plenty; the rest get an empty answer and change nothing. */
  allowHook(token, now) {
    const sec = Math.floor(now / 1000);
    let hit = this.hits.get(token);
    if (!hit || hit.sec !== sec) {
      hit = { sec, n: 0 };
      this.hits.set(token, hit);
    }
    hit.n += 1;
    if (this.hits.size > 1000) {
      for (const [k, v] of this.hits) if (v.sec !== sec) this.hits.delete(k);
    }
    return hit.n <= HOOKS_PER_SECOND;
  }

  allowRegister(ip, now) {
    const byIp = this.regFails.get(ip);
    if (byIp && byIp.until > now && byIp.n >= REG_FAILS_IP) return false;
    if (this.regFailsAll.until > now && this.regFailsAll.n >= REG_FAILS_ALL) return false;
    const ok = this.regOk.get(ip);
    if (ok && ok.until > now && ok.n >= REG_PER_IP) return false;
    return true;
  }

  /** A salted hash of the address, kept on the token so three reports from one home count once. */
  async hashAddress(ip) {
    if (!ip) return null;
    const bytes = new TextEncoder().encode(this.salt + '|' + ip);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  noteRegisterOk(ip, now) {
    let ok = this.regOk.get(ip);
    if (!ok || ok.until <= now) {
      ok = { n: 0, until: now + REG_PER_IP_MS };
      this.regOk.set(ip, ok);
    }
    ok.n += 1;
    if (this.regOk.size > 1000) {
      for (const [k, v] of this.regOk) if (v.until <= now) this.regOk.delete(k);
    }
    this.capsDirty = true;
  }

  /** A reserved slot given back when the registration did not happen. */
  unnoteRegister(ip, now) {
    const ok = this.regOk.get(ip);
    if (ok && ok.until > now && ok.n > 0) ok.n -= 1;
    this.capsDirty = true;
  }

  async saveCaps() {
    const now = Date.now();
    for (const [k, v] of this.regFails) if (v.until <= now) this.regFails.delete(k);
    for (const [k, v] of this.regOk) if (v.until <= now) this.regOk.delete(k);
    await this.ctx.storage.put('caps', { fails: [...this.regFails], ok: [...this.regOk], all: this.regFailsAll });
    this.capsDirty = false;
  }

  noteRegisterFailure(ip, now) {
    let byIp = this.regFails.get(ip);
    if (!byIp || byIp.until <= now) {
      byIp = { n: 0, until: now + REG_FAILS_IP_MS };
      this.regFails.set(ip, byIp);
    }
    byIp.n += 1;
    if (this.regFails.size > 1000) {
      for (const [k, v] of this.regFails) if (v.until <= now) this.regFails.delete(k);
    }
    if (this.regFailsAll.until <= now) this.regFailsAll = { n: 0, until: now + REG_FAILS_ALL_MS };
    this.regFailsAll.n += 1;
    this.capsDirty = true;
  }

  /** A token bucket per socket. Past it the socket is closed with 1008 and the core told. */
  allowFrame(ws, now) {
    let b = this.frames.get(ws);
    if (!b) {
      b = { tokens: FRAME_BURST, at: now };
      this.frames.set(ws, b);
    }
    b.tokens = Math.min(FRAME_BURST, b.tokens + ((now - b.at) / 1000) * FRAME_RATE);
    b.at = now;
    if (b.tokens < 1) return false;
    b.tokens -= 1;
    return true;
  }

  // ---------- sockets ----------
  /**
   * A window arrives with a ticket. A bad ticket is upgraded and then closed with 4001,
   * which is what scripts/mock-lobby.js does, so the page sees the same thing either way.
   */
  async openSocket(url, now) {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const fx = this.lobby.apply({ kind: 'ws_open', ticket: url.searchParams.get('t') || '', now });
    const attach = fx.find((f) => f.type === 'attach');
    await this.save();
    if (!attach || !attach.ok) {
      // The core still swept on this event; deliver whatever it decided for other windows.
      await addTurn(fx, this.env, this.ctx);
      this.dispatch(fx);
      server.accept();
      server.close(4001, 'bad ticket');
      return new Response(null, { status: 101, webSocket: client });
    }
    const { token, rehearsal, conn } = attach;
    this.ctx.acceptWebSocket(server, [rehearsal ? 'r:' + token : token]);
    server.serializeAttachment({ token, rehearsal, conn });
    await addTurn(fx, this.env, this.ctx);
    // The new socket is not in getWebSockets() results until this request returns, so its own
    // frames (hello, and a match if this connection completed a pair) are handed over directly.
    this.dispatch(fx, server, token, rehearsal);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, data) {
    const who = whoIs(this.ctx, ws);
    if (!who) return dropSocket(ws); // no attachment: nothing vouches for this socket
    if (who.rehearsal) return; // rehearsal windows are talked at, never listened to
    const now = Date.now();
    if (!this.allowFrame(ws, now)) {
      try {
        ws.close(1008, 'too fast');
      } catch {
        // already gone
      }
      await this.run({ kind: 'ws_close', token: who.token, conn: who.conn, rehearsal: false, now });
      return;
    }
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    if (text.length > MAX_FRAME) return;
    let msg;
    try {
      msg = JSON.parse(text);
    } catch {
      return; // bad JSON is not worth an answer
    }
    if (msg && msg.type === 'probe' && text.length > MAX_PROBE) return;
    await this.run({ kind: 'ws_msg', token: who.token, conn: who.conn, msg, now: Date.now() });
  }

  async webSocketClose(ws, code, reason) {
    const who = whoIs(this.ctx, ws);
    try {
      ws.close(code >= 1000 && code < 5000 && code !== 1005 && code !== 1006 ? code : 1000, reason || 'bye');
    } catch {
      // already gone
    }
    if (!who) return;
    await this.run({ kind: 'ws_close', token: who.token, conn: who.conn, rehearsal: who.rehearsal, now: Date.now() });
  }

  async webSocketError(ws) {
    const who = whoIs(this.ctx, ws);
    if (!who) return;
    await this.run({ kind: 'ws_close', token: who.token, conn: who.conn, rehearsal: who.rehearsal, now: Date.now() });
  }

  // ---------- the sweep ----------
  async alarm() {
    await this.run({ kind: 'tick', now: Date.now() });
  }

  /** The core knows when something next changes on its own; the alarm lands exactly then. */
  async schedule() {
    const next = this.lobby.nextDeadline(Date.now());
    if (next === null) {
      if ((await this.ctx.storage.getAlarm()) !== null) await this.ctx.storage.deleteAlarm();
      return;
    }
    const current = await this.ctx.storage.getAlarm();
    if (current !== null && Math.abs(current - next) < TICK_MS / 4) return;
    await this.ctx.storage.setAlarm(next);
  }

  // ---------- plumbing ----------
  async run(ev) {
    const fx = this.lobby.apply(ev);
    await this.save();
    await addTurn(fx, this.env, this.ctx);
    this.dispatch(fx);
    return fx.find((f) => f.type === 'reply')?.body ?? {};
  }

  async save() {
    await this.ctx.storage.put('state', this.lobby.s);
    await this.schedule();
  }

  /** Sends first, closes after, exactly in the order the core listed them. */
  dispatch(fx, direct = null, directToken = null, directRehearsal = false) {
    for (const f of fx) {
      if (f.type === 'send') {
        const text = JSON.stringify(f.msg);
        const rehearsal = !!f.rehearsal;
        if (direct && f.token === directToken && rehearsal === directRehearsal) {
          try { direct.send(text); } catch { /* the window went away */ }
          continue;
        }
        for (const ws of this.ctx.getWebSockets(rehearsal ? 'r:' + f.token : f.token)) {
          try { ws.send(text); } catch { /* the window went away */ }
        }
      } else if (f.type === 'close') {
        for (const ws of this.ctx.getWebSockets(f.token)) {
          try { ws.close(1000, 'bye'); } catch { /* already closing */ }
        }
      }
    }
  }

  /**
   * A cold start after an eviction or a deploy can leave a window marked connected whose
   * socket did not survive. Tell the core those windows closed, or the token can never
   * open another one.
   */
  async forgetLostWindows() {
    const now = Date.now();
    for (const [token, t] of Object.entries(this.lobby.s.tokens)) {
      if (!t.win || !t.win.connected) continue;
      if (this.ctx.getWebSockets(token).length > 0) continue;
      const fx = this.lobby.apply({ kind: 'ws_close', token, conn: t.win.conn, rehearsal: false, now });
      this.dispatch(fx);
    }
    await this.save();
  }
}

/** Config from the environment. Everything is a number except the invite list. */
function cfgFrom(env) {
  const cfg = {};
  for (const k of MS_VARS) {
    if (env[k] === undefined || env[k] === '') continue;
    const n = Number(env[k]);
    if (Number.isFinite(n)) cfg[k] = n;
  }
  cfg.invites = String(env.INVITES || '').split(',').map((s) => s.trim()).filter(Boolean);
  return cfg;
}

/**
 * Which window is this socket? The attachment survives hibernation and names the connection.
 * A socket without one gets no say: a null conn would read as "any connection" in the core.
 */
function whoIs(ctx, ws) {
  let att = null;
  try {
    att = ws.deserializeAttachment();
  } catch {
    att = null;
  }
  return att && typeof att.token === 'string' && att.token && att.conn ? att : null;
}

/**
 * The address as the caps see it. An IPv6 host has a whole /64 to itself, so the key is the
 * first four groups; an IPv4 address is itself.
 */
function ipKey(ip) {
  if (!ip || !ip.includes(':')) return ip;
  const [head, tail = ''] = ip.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  return groups.slice(0, 4).map((g) => g.toLowerCase().replace(/^0+(?=.)/, '') || '0').join(':') + '::/64';
}

function dropSocket(ws) {
  try {
    ws.close(4001, 'stale');
  } catch {
    // already gone
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body ?? {}), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
