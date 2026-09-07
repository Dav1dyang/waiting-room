import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Lobby, DEFAULTS } from '../src/lobby-core.js';

const S = 1000;
const ORIGIN = 'https://wr.test';

function mk(cfg = {}) {
  let n = 0;
  const lobby = new Lobby({ invites: ['DUCK'], ...cfg }, null, () => 'id' + (++n));
  return lobby;
}
function reg(l, token, now = 0, invite = 'DUCK') {
  return l.apply({ kind: 'register', token, invite, now, origin: ORIGIN }).find((f) => f.type === 'reply').body;
}
function hook(l, token, event, now, why = null) {
  return l.apply({ kind: 'hook', token, event, why, session: 'abcd', now, origin: ORIGIN }).find((f) => f.type === 'reply').body;
}
function ticketOf(reply) { return new URL(reply.open).searchParams.get('t'); }
function wsOpen(l, ticket, now) { return l.apply({ kind: 'ws_open', ticket, now }); }
function wsMsg(l, token, msg, now) { return l.apply({ kind: 'ws_msg', token, msg, now }); }
function tick(l, now) { return l.apply({ kind: 'tick', now }); }
const sends = (fx, token) => fx.filter((f) => f.type === 'send' && (!token || f.token === token)).map((f) => f.msg);
const kinds = (fx, token) => sends(fx, token).map((m) => m.type + (m.key ? ':' + m.key : '') + (m.type === 'state' ? ':' + m.state : '') + (m.n !== undefined ? ':' + m.n : ''));

/** A token that has a task past T and a connected shaded window, at time `now`. */
function bringUp(l, token, start) {
  reg(l, token, start);
  hook(l, token, 'started', start);
  const r = hook(l, token, 'tick', start + DEFAULTS.T);
  assert.ok(r.open, 'open at T');
  const fx = wsOpen(l, ticketOf(r), start + DEFAULTS.T + 200);
  assert.equal(fx.find((f) => f.type === 'attach').ok, true);
  return start + DEFAULTS.T + 200;
}

test('registration needs an invite unless the list is empty', () => {
  const l = mk();
  assert.deepEqual(reg(l, 'tokenaaaa1', 0, 'WRONG'), { ok: false, error: 'invite' });
  const ok = reg(l, 'tokenaaaa1', 0);
  assert.equal(ok.ok, true);
  assert.equal(ok.setup, ORIGIN + '/setup?t=tokenaaaa1');
  const open = mk({ invites: [] });
  assert.equal(reg(open, 'tokenbbbb2', 0, '').ok, true);
  assert.deepEqual(reg(l, 'short', 0), { ok: false, error: 'token' });
});

test('hooks from unknown or disabled tokens are ignored', () => {
  const l = mk();
  assert.deepEqual(hook(l, 'nobodyxxxx', 'started', 0), {});
  reg(l, 'tokenaaaa1');
  l.apply({ kind: 'off', token: 'tokenaaaa1', now: 1 });
  assert.deepEqual(hook(l, 'tokenaaaa1', 'started', 2), {});
});

test('nothing opens before T; one open per task, one retry if the window never came', () => {
  const l = mk();
  reg(l, 'tokenaaaa1');
  assert.deepEqual(hook(l, 'tokenaaaa1', 'started', 0), {});
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 10 * S), {});
  const r = hook(l, 'tokenaaaa1', 'tick', 15 * S);
  assert.match(r.open, /^https:\/\/wr\.test\/room\?t=id\d+$/);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 16 * S), {}, 'a window is on its way: no quit');
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 40 * S), {});
  assert.ok(hook(l, 'tokenaaaa1', 'tick', 46 * S).open, 'retry after OPEN_RETRY');
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 80 * S), {}, 'never a third');
});

test('a quick task never opens; a stop under T ends it silently', () => {
  const l = mk();
  reg(l, 'tokenaaaa1');
  hook(l, 'tokenaaaa1', 'started', 0);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'stopped', 5 * S), {}, 'just registered: the setup page may be open, so no quit');
  hook(l, 'tokenaaaa1', 'started', 700 * S);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'stopped', 705 * S), { quit: true }, 'later, nothing on screen: the browser may quit');
  assert.equal(l.s.tokens.tokenaaaa1.task.phase, 'done');
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 720 * S), {}, 'a hook after done starts a fresh armed task');
  assert.equal(l.s.tokens.tokenaaaa1.task.phase, 'armed');
});

test('window connects with its ticket, gets hello, and no second open while live', () => {
  const l = mk();
  reg(l, 'tokenaaaa1');
  hook(l, 'tokenaaaa1', 'started', 0);
  const r = hook(l, 'tokenaaaa1', 'tick', 15 * S);
  const fx = wsOpen(l, ticketOf(r), 16 * S);
  const at = fx.find((f) => f.type === 'attach');
  assert.equal(at.ok, true); assert.equal(at.token, 'tokenaaaa1'); assert.equal(at.rehearsal, false); assert.ok(at.conn);
  const hello = sends(fx)[0];
  assert.equal(hello.type, 'hello');
  assert.equal(hello.others, 0);
  assert.equal(hello.state, 'shaded');
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 60 * S), {});
  assert.equal(l.count(), 1);
  assert.equal(wsOpen(l, 'nope', 17 * S).find((f) => f.type === 'attach').ok, false, 'bad ticket');
  assert.equal(wsOpen(l, ticketOf(r), 17 * S).find((f) => f.type === 'attach').ok, false, 'one live window per token');
});

test('two fresh queued windows are paired: roles, lines, others', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  assert.equal(l.othersFor('tokenaaaa1'), 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  const fx = tick(l, now + 100);
  // pairing happened inside bringUp's ws_open apply; check state
  assert.ok(l.s.tokens.tokenaaaa1.room && l.s.tokens.tokenaaaa1.room === l.s.tokens.tokenbbbb2.room);
  assert.equal(l.count(), 0);
  assert.equal(sends(fx).length, 0, 'nothing more to say on a plain tick');
});

test('match messages carry the roles and the ice servers, in order', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  reg(l, 'tokenbbbb2', 1 * S);
  hook(l, 'tokenbbbb2', 'started', 1 * S);
  const r = hook(l, 'tokenbbbb2', 'tick', 16 * S);
  const fx = wsOpen(l, ticketOf(r), 17 * S);
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['match', 'state:room', 'line:entered', 'line:hear']);
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['hello', 'match', 'state:room', 'line:entered', 'line:hear', 'others:0']);
  const ma = sends(fx, 'tokenaaaa1')[0], mb = sends(fx, 'tokenbbbb2')[1];
  assert.equal(ma.role, 'offer');
  assert.equal(mb.role, 'answer');
  assert.equal(ma.room, mb.room);
  assert.deepEqual(ma.iceServers, DEFAULTS.iceServers);
});

test('others counts everyone else with a live shaded window', () => {
  const l = mk({ F: 1 }); // freshness so short that nobody pairs
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  assert.equal(l.othersFor('tokenaaaa1'), 1);
  assert.equal(l.othersFor('tokenbbbb2'), 1);
  const r = reg(l, 'tokencccc3', now);
  assert.equal(r.count, 2);
});

test('signals relay to the peer only', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  const room = l.s.tokens.tokenaaaa1.room;
  const fx = wsMsg(l, 'tokenaaaa1', { type: 'signal', room, data: { sdp: 'x' } }, now + 1);
  assert.deepEqual(sends(fx), [{ type: 'signal', room, data: { sdp: 'x' } }]);
  assert.equal(fx.find((f) => f.type === 'send').token, 'tokenbbbb2');
});

test('a pause posts brb on both sides, the next tick posts back', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  let fx = l.apply({ kind: 'hook', token: 'tokenaaaa1', event: 'needs_you', now: now + S, origin: ORIGIN });
  assert.deepEqual(sends(fx).map((m) => [m.key, m.who]), [['brb', 'you'], ['brb', 'them']]);
  assert.equal(fx.find((f) => f.type === 'send' && f.msg.who === 'them').token, 'tokenbbbb2');
  fx = l.apply({ kind: 'hook', token: 'tokenaaaa1', event: 'needs_you', now: now + 2 * S, origin: ORIGIN });
  assert.equal(sends(fx).length, 0, 'a second pause signal is silent');
  fx = l.apply({ kind: 'hook', token: 'tokenaaaa1', event: 'tick', now: now + 3 * S, origin: ORIGIN });
  assert.deepEqual(sends(fx).map((m) => [m.key, m.who]), [['back', 'you'], ['back', 'them']]);
});

test('stop in a room: countdown on both sides, then close and shade', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const t0 = bringUp(l, 'tokenbbbb2', 1 * S) + S;
  let fx = l.apply({ kind: 'hook', token: 'tokenaaaa1', event: 'stopped', session: 'abcd', now: t0, origin: ORIGIN });
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['state:closing', 'countdown:10']);
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['state:closing', 'countdown:10']);
  assert.equal(sends(fx, 'tokenaaaa1')[1].mine, true);
  assert.equal(sends(fx, 'tokenbbbb2')[1].mine, false);
  for (let i = 1; i <= 9; i++) {
    fx = tick(l, t0 + i * S);
    assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['countdown:' + (10 - i)]);
  }
  fx = tick(l, t0 + 10 * S);
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['close']);
  assert.ok(fx.find((f) => f.type === 'close' && f.token === 'tokenaaaa1'));
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['line:left', 'state:shaded', 'line:requeued']);
  assert.equal(l.count(), 1, 'the peer is waiting again');
  assert.equal(l.s.tokens.tokenbbbb2.room, null);
});

test('stop while shaded and alone closes at once', () => {
  const l = mk();
  const now = bringUp(l, 'tokenaaaa1', 0);
  const fx = l.apply({ kind: 'hook', token: 'tokenaaaa1', event: 'stopped', session: 'abcd', now: now + S, origin: ORIGIN });
  assert.deepEqual(sends(fx), [{ type: 'close', reason: 'done' }]);
  assert.ok(fx.find((f) => f.type === 'close'));
});

test('hang up: you close, they shade, you are out for this task', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S) + S;
  let fx = wsMsg(l, 'tokenaaaa1', { type: 'hangup' }, now);
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['close']);
  assert.equal(sends(fx, 'tokenaaaa1')[0].reason, 'hangup');
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['line:left', 'state:shaded', 'line:requeued']);
  l.apply({ kind: 'ws_close', token: 'tokenaaaa1', now: now + 100 });
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', now + 20 * S), {}, 'no reopen this task');
  assert.equal(l.count(), 1);
  hook(l, 'tokenaaaa1', 'stopped', now + 21 * S);
  hook(l, 'tokenaaaa1', 'started', now + 22 * S);
  assert.ok(hook(l, 'tokenaaaa1', 'tick', now + 37 * S).open, 'the next task opens again');
});

test('closing the window by hand means not this task; a network drop does not', () => {
  const l = mk();
  const now = bringUp(l, 'tokenaaaa1', 0);
  wsMsg(l, 'tokenaaaa1', { type: 'bye', reason: 'manual' }, now + S);
  l.apply({ kind: 'ws_close', token: 'tokenaaaa1', now: now + S });
  assert.equal(l.s.tokens.tokenaaaa1.task.optedOut, true);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', now + 60 * S), {});

  const m = mk();
  const t1 = bringUp(m, 'tokenbbbb2', 0);
  m.apply({ kind: 'ws_close', token: 'tokenbbbb2', now: t1 + S });
  assert.equal(m.s.tokens.tokenbbbb2.task.optedOut, false);
  assert.deepEqual(hook(m, 'tokenbbbb2', 'tick', t1 + 5 * S), {}, 'no new window: the page reconnects on its own');
  assert.deepEqual(hook(m, 'tokenbbbb2', 'tick', t1 + 50 * S), {}, 'the retry is only for a window that never connected');
});

test('a quiet room ends softly and the pair is not rematched right away', () => {
  const l = mk({ PEER_COOLDOWN: 60 * S });
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  wsMsg(l, 'tokenaaaa1', { type: 'speech', active: true }, now + 10 * S);
  let fx = tick(l, now + 50 * S);
  assert.equal(sends(fx).length, 0, 'still speaking at 50 s: no quiet');
  wsMsg(l, 'tokenaaaa1', { type: 'speech', active: false }, now + 12 * S);
  fx = tick(l, now + 56 * S);
  assert.equal(sends(fx).length, 0, 'silence started at 12 s, so 56 s is not yet quiet');
  fx = tick(l, now + 58 * S);
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['line:quiet_room', 'state:shaded', 'others:1']);
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['line:quiet_room', 'state:shaded', 'others:1']);
  assert.equal(l.count(), 2);
  hook(l, 'tokenaaaa1', 'tick', now + 57 * S);
  hook(l, 'tokenbbbb2', 'tick', now + 57 * S);
  tick(l, now + 58 * S);
  assert.equal(l.s.tokens.tokenaaaa1.room, null, 'cooldown holds');
  hook(l, 'tokenaaaa1', 'tick', now + 120 * S);
  hook(l, 'tokenbbbb2', 'tick', now + 120 * S);
  tick(l, now + 121 * S);
  assert.ok(l.s.tokens.tokenaaaa1.room, 'rematched after the cooldown');
});

test('silence: Claude went quiet closes the window; in a room the peer shades', () => {
  const l = mk();
  const now = bringUp(l, 'tokenaaaa1', 0);
  let fx = tick(l, now + 89 * S);
  assert.equal(sends(fx).length, 0);
  fx = tick(l, now + 91 * S);
  assert.deepEqual(sends(fx), [{ type: 'close', reason: 'quiet' }]);
  assert.equal(l.s.tokens.tokenaaaa1.task.phase, 'done');

  const m = mk();
  bringUp(m, 'tokenaaaa1', 0);
  const t1 = bringUp(m, 'tokenbbbb2', 1 * S);
  for (let t = t1; t <= t1 + 80 * S; t += 10 * S) {
    hook(m, 'tokenbbbb2', 'tick', t);
    wsMsg(m, 'tokenbbbb2', { type: 'speech', active: true }, t);
  }
  fx = tick(m, t1 + 91 * S);
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['close']);
  assert.equal(sends(fx, 'tokenaaaa1')[0].reason, 'quiet');
  assert.deepEqual(kinds(fx, 'tokenbbbb2').slice(0, 3), ['line:left', 'state:shaded', 'line:requeued']);
});

test('grace: a question ends the task after G; waiting on you lasts P', () => {
  const l = mk();
  const now = bringUp(l, 'tokenaaaa1', 0);
  hook(l, 'tokenaaaa1', 'paused', now, 'question');
  assert.equal(sends(tick(l, now + 89 * S)).length, 0);
  assert.deepEqual(sends(tick(l, now + 91 * S)), [{ type: 'close', reason: 'done' }]);

  const m = mk();
  const t1 = bringUp(m, 'tokenaaaa1', 0);
  hook(m, 'tokenaaaa1', 'needs_you', t1);
  assert.equal(sends(tick(m, t1 + 500 * S)).length, 0, 'still waiting on you at 500 s');
  assert.equal(m.candidates(t1 + 5 * S).length, 0, 'paused is not pairable');
  assert.deepEqual(sends(tick(m, t1 + 601 * S)), [{ type: 'close', reason: 'done' }]);
});

test('rehearsal rides the next hook and touches no queue', () => {
  const l = mk();
  reg(l, 'tokenaaaa1');
  assert.deepEqual(l.apply({ kind: 'rehearse', token: 'tokenaaaa1', now: 0 }).find((f) => f.type === 'reply').body, { ok: true });
  const r = hook(l, 'tokenaaaa1', 'started', 1 * S);
  assert.ok(r.open, 'opens at once, before T');
  const fx = wsOpen(l, ticketOf(r), 2 * S);
  const at = fx.find((f) => f.type === 'attach');
  assert.equal(at.ok, true); assert.equal(at.rehearsal, true); assert.ok(at.conn);
  assert.deepEqual(kinds(fx), ['hello', 'line:rehearsal']);
  assert.equal(sends(fx)[0].rehearsal, true);
  assert.equal(l.count(), 0);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 3 * S), {}, 'once');
  assert.ok(hook(l, 'tokenaaaa1', 'tick', 16 * S).open, 'the real open still comes at T');
});

test('flags from two different people block a token; a report is also a hang-up', () => {
  const l = mk({ REPORT_BLOCK: 2, PEER_COOLDOWN: 0 });
  bringUp(l, 'tokenaaaa1', 0);
  let now = bringUp(l, 'tokenbbbb2', 1 * S) + S;
  let fx = wsMsg(l, 'tokenaaaa1', { type: 'report' }, now);
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['line:reported', 'close']);
  assert.deepEqual(kinds(fx, 'tokenbbbb2').slice(0, 2), ['line:left', 'state:shaded']);
  assert.equal(l.s.tokens.tokenbbbb2.blockedUntil, 0);
  wsMsg(l, 'tokenaaaa1', { type: 'report' }, now + 1);
  assert.equal(Object.keys(l.s.tokens.tokenbbbb2.reports).length, 1, 'one flag per reporter');
  now = bringUp(l, 'tokencccc3', now + 2 * S);
  hook(l, 'tokenbbbb2', 'tick', now);
  tick(l, now + 1);
  assert.ok(l.s.tokens.tokenbbbb2.room, 'B and C paired');
  fx = wsMsg(l, 'tokencccc3', { type: 'report' }, now + S);
  assert.ok(l.s.tokens.tokenbbbb2.blockedUntil > now, 'blocked by two people');
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['line:left', 'close'], 'a blocked window closes instead of shading');
  assert.deepEqual(hook(l, 'tokenbbbb2', 'tick', now + 2 * S), {});
});

test('off closes the window and forgets the task', () => {
  const l = mk();
  const now = bringUp(l, 'tokenaaaa1', 0);
  const fx = l.apply({ kind: 'off', token: 'tokenaaaa1', now: now + S });
  assert.deepEqual(sends(fx), [{ type: 'close', reason: 'off' }]);
  assert.equal(l.s.tokens.tokenaaaa1.task, null);
  assert.equal(l.count(), 0);
});

test('video: both on posts the line once; the peer learns each toggle', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S) + S;
  let fx = wsMsg(l, 'tokenaaaa1', { type: 'video', on: true }, now);
  assert.deepEqual(sends(fx), [{ type: 'peer', video: true }]);
  fx = wsMsg(l, 'tokenbbbb2', { type: 'video', on: true }, now + 1);
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['peer', 'line:video_on']);
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['line:video_on']);
  fx = wsMsg(l, 'tokenbbbb2', { type: 'video', on: false }, now + 2);
  assert.deepEqual(sends(fx), [{ type: 'peer', video: false }]);
});

test('probes are kept per token and read back', () => {
  const l = mk();
  const now = bringUp(l, 'tokenaaaa1', 0);
  wsMsg(l, 'tokenaaaa1', { type: 'probe', data: { focus: false, inner: 62 } }, now);
  const body = l.apply({ kind: 'probes', token: 'tokenaaaa1', now }).find((f) => f.type === 'reply').body;
  assert.deepEqual(body.probes, [{ at: now, data: { focus: false, inner: 62 } }]);
});

test('state survives a JSON round trip', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  const copy = new Lobby({ invites: ['DUCK'] }, JSON.parse(JSON.stringify(l.s)), () => 'z');
  const fx = copy.apply({ kind: 'hook', token: 'tokenaaaa1', event: 'stopped', session: 'abcd', now: now + S, origin: ORIGIN });
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['state:closing', 'countdown:10']);
});

test('golden trace: one whole wait', () => {
  const l = mk();
  const log = [];
  const run = (ev) => { for (const f of l.apply(ev)) if (f.type === 'send') log.push(f.token.slice(5, 6) + ' ' + (f.msg.type === 'line' ? 'line:' + f.msg.key : f.msg.type === 'countdown' ? 'countdown:' + f.msg.n : f.msg.type === 'state' ? 'state:' + f.msg.state : f.msg.type)); };
  const H = (token, event, now, why = null) => { run({ kind: 'hook', token, event, why, now, origin: ORIGIN }); return l.fx.find((f) => f.type === 'reply').body; };
  reg(l, 'tokenaaaa1'); reg(l, 'tokenbbbb2');
  H('tokenaaaa1', 'started', 0);
  H('tokenaaaa1', 'tick', 5 * S);
  const ra = H('tokenaaaa1', 'tick', 15 * S);
  run({ kind: 'ws_open', ticket: ticketOf(ra), now: 16 * S });
  H('tokenbbbb2', 'started', 10 * S);
  const rb = H('tokenbbbb2', 'tick', 25 * S);
  run({ kind: 'ws_open', ticket: ticketOf(rb), now: 26 * S });
  H('tokenaaaa1', 'needs_you', 30 * S);
  H('tokenaaaa1', 'tick', 40 * S);
  H('tokenaaaa1', 'stopped', 50 * S);
  for (let t = 51; t <= 60; t++) run({ kind: 'tick', now: t * S });
  assert.deepEqual(log, [
    'a hello',
    'b hello', 'a match', 'b match', 'a state:room', 'a line:entered', 'a line:hear', 'b state:room', 'b line:entered', 'b line:hear', 'b others',
    'a line:brb', 'b line:brb',
    'a line:back', 'b line:back',
    'a state:closing', 'b state:closing', 'a countdown:10', 'b countdown:10',
    'a countdown:9', 'b countdown:9', 'a countdown:8', 'b countdown:8', 'a countdown:7', 'b countdown:7', 'a countdown:6', 'b countdown:6', 'a countdown:5', 'b countdown:5',
    'a countdown:4', 'b countdown:4', 'a countdown:3', 'b countdown:3', 'a countdown:2', 'b countdown:2', 'a countdown:1', 'b countdown:1',
    'a close', 'b line:left', 'b state:shaded', 'b line:requeued',
  ]);
});

test('a pause before T does not open a window, and resuming below T goes back to armed', () => {
  const l = mk();
  reg(l, 'tokenaaaa1');
  hook(l, 'tokenaaaa1', 'started', 0);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'needs_you', 1), {});
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 2), {});
  assert.equal(l.s.tokens.tokenaaaa1.task.phase, 'armed');
  assert.ok(hook(l, 'tokenaaaa1', 'tick', 15 * S).open);
});

test('a rehearsal waits while a real window is live', () => {
  const l = mk();
  const now = bringUp(l, 'tokenaaaa1', 0);
  l.apply({ kind: 'rehearse', token: 'tokenaaaa1', now });
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', now + S), {}, 'deferred');
  l.apply({ kind: 'ws_close', token: 'tokenaaaa1', conn: l.s.tokens.tokenaaaa1.win.conn, now: now + 2 * S });
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', now + 3 * S), {}, 'still deferred: the window may come back');
  const r = hook(l, 'tokenaaaa1', 'tick', now + 3 * S + DEFAULTS.RECONNECT_GRACE);
  assert.ok(r.open);
  assert.equal(l.s.tickets[ticketOf(r)].rehearsal, true);
});

test('a ticket dies with its task, its hang-up, and its hand close', () => {
  const l = mk();
  reg(l, 'tokenaaaa1');
  hook(l, 'tokenaaaa1', 'started', 0);
  const r = hook(l, 'tokenaaaa1', 'tick', 15 * S);
  hook(l, 'tokenaaaa1', 'stopped', 16 * S);
  assert.equal(wsOpen(l, ticketOf(r), 17 * S).find((f) => f.type === 'attach').ok, false, 'task done');
  hook(l, 'tokenaaaa1', 'started', 20 * S);
  const r2 = hook(l, 'tokenaaaa1', 'tick', 35 * S);
  wsOpen(l, ticketOf(r2), 36 * S);
  wsMsg(l, 'tokenaaaa1', { type: 'hangup' }, 37 * S);
  assert.equal(wsOpen(l, ticketOf(r2), 38 * S).find((f) => f.type === 'attach').ok, false, 'hung up');
  assert.equal(wsOpen(l, 'constructor', 38 * S).find((f) => f.type === 'attach').ok, false, 'inherited key is not a ticket');
});

test('a signal for another room is dropped', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  const fx = wsMsg(l, 'tokenaaaa1', { type: 'signal', room: 'rOLD', data: { sdp: 'x' } }, now + 1);
  assert.equal(sends(fx).length, 0);
});

test('a socket event from a superseded connection is ignored', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  const fx = l.apply({ kind: 'ws_close', token: 'tokenaaaa1', conn: 'stale', now: now + 1 });
  assert.equal(sends(fx).length, 0);
  assert.ok(l.s.tokens.tokenaaaa1.room, 'still in the room');
  l.apply({ kind: 'ws_close', token: 'tokenaaaa1', conn: l.s.tokens.tokenaaaa1.win.conn, now: now + 2 });
  assert.ok(l.s.tokens.tokenaaaa1.room, 'a drop keeps the room for a grace period');
  tick(l, now + 2 + DEFAULTS.RECONNECT_GRACE + 1);
  assert.equal(l.s.tokens.tokenaaaa1.room, null);
});

test('the peer cooldown is per pair, not per last peer', () => {
  const l = mk({ PEER_COOLDOWN: 60 * S, Q: 5 * S });
  bringUp(l, 'tokenaaaa1', 0);
  let now = bringUp(l, 'tokenbbbb2', 1 * S);
  now = now + 6 * S; tick(l, now); // quiet: A-B ends
  assert.equal(l.s.tokens.tokenaaaa1.room, null);
  now = bringUp(l, 'tokencccc3', now);
  hook(l, 'tokenaaaa1', 'tick', now); tick(l, now + 1); // A is fresh again: A-C pair
  assert.ok(l.s.tokens.tokencccc3.room && l.s.tokens.tokenaaaa1.room === l.s.tokens.tokencccc3.room);
  now = now + 6 * S; tick(l, now); // quiet: A-C ends
  for (const tk of ['tokenaaaa1', 'tokenbbbb2', 'tokencccc3']) hook(l, tk, 'tick', now);
  wsMsg(l, 'tokencccc3', { type: 'hangup' }, now);
  tick(l, now + 1);
  assert.equal(l.s.tokens.tokenaaaa1.room, null, 'A and B met 12 s ago, so no rematch');
});

test('a token named like an object property is just a token', () => {
  const l = mk();
  assert.deepEqual(reg(l, 'constructor', 0, 'WRONG'), { ok: false, error: 'invite' });
  assert.equal(reg(l, 'constructor', 0).ok, true);
  assert.equal(typeof l.s.tokens.constructor, 'object');
  assert.deepEqual(reg(l, '__proto__', 0), { ok: false, error: 'token' });
  assert.deepEqual(hook(l, 'toString', 'started', 1), {});
});

test('if a new task starts during the goodbye, the window stays and shades', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const t0 = bringUp(l, 'tokenbbbb2', 1 * S) + S;
  hook(l, 'tokenaaaa1', 'stopped', t0);
  hook(l, 'tokenaaaa1', 'started', t0 + 2 * S);
  const fx = tick(l, t0 + 10 * S);
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['state:shaded', 'line:requeued', 'others:1']);
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['line:left', 'state:shaded', 'line:requeued', 'others:1']);
});

test('the count leaves out people whose Claude is waiting on them', () => {
  const l = mk({ F: 1 });
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  assert.equal(l.count(), 2);
  hook(l, 'tokenaaaa1', 'needs_you', now);
  assert.equal(l.count(), 1);
});

test('a late stop from an earlier turn cannot end the task; a late tick cannot revive it', () => {
  const l = mk();
  reg(l, 'tokenaaaa1');
  const H = (event, now, ts) => l.apply({ kind: 'hook', token: 'tokenaaaa1', event, session: 's1', ts, now, origin: ORIGIN }).find((f) => f.type === 'reply').body;
  H('started', 0, 1000);
  H('tick', 20 * S, 21000);
  H('stopped', 21 * S, 20500);
  assert.equal(l.s.tokens.tokenaaaa1.task.phase, 'queued', 'the stop was older than the last tick');
  H('stopped', 22 * S, 22000);
  assert.equal(l.s.tokens.tokenaaaa1.task.phase, 'done');
  H('tick', 23 * S, 21900);
  assert.equal(l.s.tokens.tokenaaaa1.task.phase, 'done', 'a tick older than the stop is ignored');
  H('tick', 24 * S, 24000);
  assert.equal(l.s.tokens.tokenaaaa1.task.phase, 'armed', 'a newer tick starts a fresh task');
});

test('two Claude sessions on one machine: the task ends when the last one stops', () => {
  const l = mk();
  reg(l, 'tokenaaaa1');
  const H = (event, session, now) => l.apply({ kind: 'hook', token: 'tokenaaaa1', event, session, now, origin: ORIGIN }).find((f) => f.type === 'reply').body;
  H('started', 's1', 0);
  H('started', 's2', 1 * S);
  assert.ok(H('tick', 's1', 15 * S).open);
  H('stopped', 's1', 16 * S);
  assert.equal(l.s.tokens.tokenaaaa1.task.phase, 'queued', 's2 still works');
  H('stopped', 's2', 17 * S);
  assert.equal(l.s.tokens.tokenaaaa1.task.phase, 'done');
});

test('a dropped socket reconnects into its room within the grace; beyond it the peer is told', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  const ta = l.s.tokens.tokenaaaa1;
  const ticket = ta.win.ticket;
  let fx = l.apply({ kind: 'ws_close', token: 'tokenaaaa1', conn: ta.win.conn, now: now + S });
  assert.equal(sends(fx, 'tokenbbbb2').length, 0, 'the peer hears nothing yet');
  fx = wsOpen(l, ticket, now + 3 * S);
  assert.equal(fx.find((f) => f.type === 'attach').ok, true);
  assert.equal(sends(fx, 'tokenaaaa1')[0].state, 'room');
  assert.ok(ta.room);
  l.apply({ kind: 'ws_close', token: 'tokenaaaa1', conn: ta.win.conn, now: now + 4 * S });
  fx = tick(l, now + 4 * S + DEFAULTS.RECONNECT_GRACE + 1);
  assert.deepEqual(kinds(fx, 'tokenbbbb2').slice(0, 2), ['line:left', 'state:shaded']);
  assert.equal(ta.win, null);
});

test('a speaking flag that stops being refreshed counts as silence', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  wsMsg(l, 'tokenaaaa1', { type: 'speech', active: true }, now + S);
  assert.equal(sends(tick(l, now + 40 * S)).length, 0);
  const fx = tick(l, now + 47 * S);
  assert.deepEqual(kinds(fx, 'tokenaaaa1').slice(0, 1), ['line:quiet_room']);
});

test('reporting after the stranger left flags them and keeps your window', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  wsMsg(l, 'tokenbbbb2', { type: 'hangup' }, now + S);
  const fx = wsMsg(l, 'tokenaaaa1', { type: 'report' }, now + 2 * S);
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['line:reported']);
  assert.ok(l.s.tokens.tokenbbbb2.reports.tokenaaaa1);
  assert.equal(l.s.tokens.tokenaaaa1.task.optedOut, false);
  assert.ok(l.s.tokens.tokenaaaa1.win.connected);
});

test('nextDeadline points at the next thing that changes on its own', () => {
  const l = mk();
  assert.equal(l.nextDeadline(0), null);
  reg(l, 'tokenaaaa1');
  hook(l, 'tokenaaaa1', 'started', 0);
  assert.equal(l.nextDeadline(1), DEFAULTS.T, 'the threshold');
  const now = bringUp(l, 'tokenaaaa1', 0);
  assert.equal(l.nextDeadline(now), DEFAULTS.T + DEFAULTS.N, 'the silence limit after the last hook');
  const t0 = bringUp(l, 'tokenbbbb2', 1 * S) + S;
  hook(l, 'tokenaaaa1', 'stopped', t0);
  assert.equal(l.nextDeadline(t0), t0 + 1000, 'the next countdown second');
  assert.ok(l.nextDeadline(t0 + 999) >= t0 + 999 + 250, 'never sooner than 250 ms out');
});

test('an old snapshot hydrates and runs', () => {
  const old = { tokens: { tokenaaaa1: { enabled: true, invite: 'DUCK', lastHookAt: 0, task: { id: 1, startedAt: 0, lastSignalAt: 0, phase: 'queued', opens: 1, lastOpenAt: 0, optedOut: false },
    win: { connected: true, since: 0, ticket: 'id1', conn: 'c1' }, room: 'r1', lastPeer: 'tokenbbbb2', lastPeerAt: 0, rehearse: false, reports: [], blockedUntil: 0, probes: [] },
    tokenbbbb2: { enabled: true, invite: 'DUCK', lastHookAt: 0, task: { id: 2, startedAt: 0, lastSignalAt: 0, phase: 'queued', opens: 1, lastOpenAt: 0, optedOut: false },
    win: { connected: true, since: 0, ticket: 'id2', conn: 'c2' }, room: 'r1', lastPeer: null, lastPeerAt: 0, rehearse: false, reports: [], blockedUntil: 0, probes: [] } },
    rooms: { r1: { id: 'r1', a: 'tokenaaaa1', b: 'tokenbbbb2', createdAt: 0, lastSpeechAt: 0, video: {}, closing: null } },
    tickets: { id1: { token: 'tokenaaaa1', exp: 1e12 }, id2: { token: 'tokenbbbb2', exp: 1e12 } }, seq: 2 };
  const l = new Lobby({ invites: ['DUCK'] }, old, () => 'z');
  assert.equal(l.s.v, 2);
  const fx = l.apply({ kind: 'ws_close', token: 'tokenaaaa1', conn: 'c1', now: 1 * S });
  assert.ok(Array.isArray(fx));
  assert.deepEqual(kinds(tick(l, 50 * S), 'tokenbbbb2').slice(0, 2), ['line:left', 'state:shaded'], 'the dropped window gave up, the peer shades');
});

test('a window adopted by a new task during the goodbye needs no second window', () => {
  const l = mk();
  bringUp(l, 'tokenaaaa1', 0);
  const t0 = bringUp(l, 'tokenbbbb2', 1 * S) + S;
  hook(l, 'tokenaaaa1', 'stopped', t0);
  hook(l, 'tokenaaaa1', 'started', t0 + 2 * S);
  tick(l, t0 + 10 * S);
  const ta = l.s.tokens.tokenaaaa1;
  assert.ok(ta.win && ta.win.connected);
  assert.equal(l.s.tickets[ta.win.ticket].taskId, ta.task.id, 'the ticket now belongs to the new task');
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', t0 + 20 * S), {}, 'no second window');
  l.apply({ kind: 'ws_close', token: 'tokenaaaa1', conn: ta.win.conn, now: t0 + 21 * S });
  assert.equal(wsOpen(l, ta.win.ticket, t0 + 22 * S).find((f) => f.type === 'attach').ok, true, 'and it can reconnect');
});

test('an unknown event word changes nothing', () => {
  const l = mk();
  reg(l, 'tokenaaaa1');
  assert.deepEqual(hook(l, 'tokenaaaa1', '', 0), {});
  assert.deepEqual(hook(l, 'tokenaaaa1', 'constructor', 0), {});
  assert.equal(l.s.tokens.tokenaaaa1.task, null);
});

test('the quit hint and the count reply say whether a window exists or is coming', () => {
  const l = mk();
  reg(l, 'tokenaaaa1');
  assert.deepEqual(hook(l, 'tokenaaaa1', 'started', 0), {});
  const r = hook(l, 'tokenaaaa1', 'tick', 15 * S);
  assert.ok(r.open);
  let c = l.apply({ kind: 'count', token: 'tokenaaaa1', now: 16 * S }).find((f) => f.type === 'reply').body;
  assert.equal(c.window, true, 'told to open, not yet connected');
  wsOpen(l, ticketOf(r), 17 * S);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 18 * S), {});
  hook(l, 'tokenaaaa1', 'stopped', 19 * S);
  c = l.apply({ kind: 'count', token: 'tokenaaaa1', now: 20 * S }).find((f) => f.type === 'reply').body;
  assert.equal(c.window, true, 'closed by the lobby, but the setup grace still holds');
  c = l.apply({ kind: 'count', token: 'tokenaaaa1', now: 700 * S }).find((f) => f.type === 'reply').body;
  assert.equal(c.window, false, 'after the setup grace');
  hook(l, 'tokenaaaa1', 'started', 700 * S);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'stopped', 701 * S), { quit: true });
});

test('the reaper leaves the browser alone right after setup and around a test window', () => {
  const l = mk();
  reg(l, 'tokenaaaa1', 0);
  hook(l, 'tokenaaaa1', 'started', 1 * S);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'stopped', 4 * S), {}, 'a short first turn must not kill the setup page');
  // Inside the setup grace, as on a real first run: the test window must still open at once.
  l.apply({ kind: 'rehearse', token: 'tokenaaaa1', now: 30 * S });
  const r = hook(l, 'tokenaaaa1', 'started', 31 * S);
  assert.ok(r.open, 'the test window opens during the setup grace');
  wsOpen(l, ticketOf(r), 32 * S);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'stopped', 34 * S), {}, 'the test window is still closing itself');
  hook(l, 'tokenaaaa1', 'started', 680 * S);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'stopped', 682 * S), { quit: true }, 'twenty seconds later the browser may go');
  reg(l, 'tokenaaaa1', 690 * S);
  l.apply({ kind: 'off', token: 'tokenaaaa1', now: 691 * S });
  const c = l.apply({ kind: 'count', token: 'tokenaaaa1', now: 692 * S }).find((f) => f.type === 'reply').body;
  assert.equal(c.window, false, 'off ends the setup grace too');
});

test('a ticket that never connected cannot take over a window that is only dropped', () => {
  const l = mk();
  reg(l, 'tokenaaaa1', 0);
  hook(l, 'tokenaaaa1', 'started', 0);
  const first = hook(l, 'tokenaaaa1', 'tick', 16 * S);
  assert.ok(first.open, 'the first ticket');
  // Nobody connected, so after OPEN_RETRY the lobby hands out a second one.
  const second = hook(l, 'tokenaaaa1', 'tick', 50 * S);
  assert.ok(second.open, 'the retry ticket');
  assert.notEqual(ticketOf(first), ticketOf(second));
  const ok = wsOpen(l, ticketOf(second), 51 * S).find((f) => f.type === 'attach');
  assert.equal(ok.ok, true, 'the second ticket connects');
  l.apply({ kind: 'ws_close', token: 'tokenaaaa1', conn: ok.conn, now: 52 * S }); // a drop, not a goodbye
  assert.equal(l.s.tokens.tokenaaaa1.win.connected, false, 'in its grace');
  const late = wsOpen(l, ticketOf(first), 53 * S).find((f) => f.type === 'attach');
  assert.equal(late.ok, false, 'an older ticket cannot replace a window in its grace');
  const back = wsOpen(l, ticketOf(second), 54 * S).find((f) => f.type === 'attach');
  assert.equal(back.ok, true, 'the same ticket comes back');
});

test('a full lobby sweeps register-only tokens first, then says busy', () => {
  const l = mk({ MAX_TOKENS: 3, UNHOOKED_TTL: 60 * S });
  reg(l, 'tokenaaaa1', 0);
  hook(l, 'tokenaaaa1', 'started', 1 * S); // a person: hooked
  reg(l, 'floodaaaa1', 2 * S);
  reg(l, 'floodaaaa2', 3 * S);
  assert.deepEqual(reg(l, 'floodaaaa3', 4 * S), { ok: false, error: 'busy' }, 'full, and nothing old enough to sweep');
  assert.equal(reg(l, 'tokenaaaa1', 5 * S).ok, true, 'a known token always re-registers');
  const late = reg(l, 'floodaaaa3', 70 * S);
  assert.equal(late.ok, true, 'an hour on, the register-only tokens are swept and there is room');
  assert.ok(l.tok('tokenaaaa1'), 'the person stays');
  assert.ok(!l.tok('floodaaaa1') && !l.tok('floodaaaa2'), 'the flood is gone');
});

test('three reports from one address count as one; three homes block', () => {
  const l = mk({ PEER_COOLDOWN: 0 });
  const home = (token, ipHash, now) => l.apply({ kind: 'register', token, invite: 'DUCK', now, origin: ORIGIN, ipHash }).find((f) => f.type === 'reply').body;
  // One room per reporter: both come up, the reporter reports, both stop, the sweep runs.
  const meetAndReport = (tk, now) => {
    bringUp(l, 'victimaaa1', now);
    bringUp(l, tk, now + S);
    l.apply({ kind: 'ws_msg', token: tk, msg: { type: 'report' }, now: now + 20 * S });
    hook(l, 'victimaaa1', 'stopped', now + 21 * S);
    hook(l, tk, 'stopped', now + 21 * S);
    tick(l, now + 30 * S);
  };
  home('victimaaa1', 'hash-v', 0);
  for (const [i, tk] of ['griefer001', 'griefer002', 'griefer003'].entries()) {
    home(tk, 'hash-g', 0);
    meetAndReport(tk, (i + 1) * 100 * S);
  }
  assert.equal(l.tok('victimaaa1').blockedUntil, 0, 'one home reporting three times is one report');
  assert.deepEqual(Object.keys(l.tok('victimaaa1').reports), ['hash-g']);
  for (const [i, tk] of ['neighbor01', 'neighbor02'].entries()) {
    home(tk, 'hash-n' + i, 0);
    meetAndReport(tk, (i + 10) * 100 * S);
  }
  assert.ok(l.tok('victimaaa1').blockedUntil > 0, 'three homes block');
});

test('probes are two per token and forty in all, oldest out; a stray false is not speech', () => {
  const l = mk();
  for (let i = 0; i < 25; i++) reg(l, 'probetok' + String(i).padStart(2, '0'), 0);
  for (let i = 0; i < 25; i++) {
    const tk = 'probetok' + String(i).padStart(2, '0');
    const now = bringUp(l, tk, i * 100 * S);
    for (let k = 0; k < 3; k++) wsMsg(l, tk, { type: 'probe', data: { k } }, now + k);
    hook(l, tk, 'stopped', now + 5 * S);
  }
  const mine = l.apply({ kind: 'probes', token: 'probetok24', now: 0 }).find((f) => f.type === 'reply').body.probes;
  assert.equal(mine.length, 2, 'two per token');
  assert.deepEqual(mine.map((p) => p.data.k), [1, 2], 'the oldest of the three went');
  assert.equal(l.s.probes.length, 40, 'forty in all');
  assert.equal(l.apply({ kind: 'probes', token: 'probetok00', now: 0 }).find((f) => f.type === 'reply').body.probes.length, 0, 'the earliest token has none left');

  const m = mk();
  bringUp(m, 'tokenaaaa1', 0);
  const now = bringUp(m, 'tokenbbbb2', 1 * S);
  wsMsg(m, 'tokenaaaa1', { type: 'speech', active: true }, now + 10 * S);
  wsMsg(m, 'tokenbbbb2', { type: 'speech', active: false }, now + 40 * S); // B never spoke: noise
  const fx = tick(m, now + 56 * S);
  assert.deepEqual(kinds(fx, 'tokenaaaa1').slice(0, 1), ['line:quiet_room'], 'a stray false from the other side did not stretch the room');
});
