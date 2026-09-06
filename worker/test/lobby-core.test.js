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
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 16 * S), {});
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 40 * S), {});
  assert.ok(hook(l, 'tokenaaaa1', 'tick', 46 * S).open, 'retry after OPEN_RETRY');
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 80 * S), {}, 'never a third');
});

test('a quick task never opens; a stop under T ends it silently', () => {
  const l = mk();
  reg(l, 'tokenaaaa1');
  hook(l, 'tokenaaaa1', 'started', 0);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'stopped', 5 * S), {});
  assert.equal(l.s.tokens.tokenaaaa1.task.phase, 'done');
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 20 * S), {}, 'a hook after done starts a fresh armed task');
  assert.equal(l.s.tokens.tokenaaaa1.task.phase, 'armed');
});

test('window connects with its ticket, gets hello, and no second open while live', () => {
  const l = mk();
  reg(l, 'tokenaaaa1');
  hook(l, 'tokenaaaa1', 'started', 0);
  const r = hook(l, 'tokenaaaa1', 'tick', 15 * S);
  const fx = wsOpen(l, ticketOf(r), 16 * S);
  assert.deepEqual(fx.find((f) => f.type === 'attach'), { type: 'attach', ok: true, token: 'tokenaaaa1', rehearsal: false });
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
  const fx = wsMsg(l, 'tokenaaaa1', { type: 'signal', data: { sdp: 'x' } }, now + 1);
  assert.deepEqual(sends(fx), [{ type: 'signal', data: { sdp: 'x' } }]);
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
  let fx = l.apply({ kind: 'hook', token: 'tokenaaaa1', event: 'stopped', now: t0, origin: ORIGIN });
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['state:closing', 'countdown:5']);
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['state:closing', 'countdown:5']);
  assert.equal(sends(fx, 'tokenaaaa1')[1].mine, true);
  assert.equal(sends(fx, 'tokenbbbb2')[1].mine, false);
  for (let i = 1; i <= 4; i++) {
    fx = tick(l, t0 + i * S);
    assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['countdown:' + (5 - i)]);
  }
  fx = tick(l, t0 + 5 * S);
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['close']);
  assert.ok(fx.find((f) => f.type === 'close' && f.token === 'tokenaaaa1'));
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['line:left', 'state:shaded', 'line:requeued']);
  assert.equal(l.count(), 1, 'the peer is waiting again');
  assert.equal(l.s.tokens.tokenbbbb2.room, null);
});

test('stop while shaded and alone closes at once', () => {
  const l = mk();
  const now = bringUp(l, 'tokenaaaa1', 0);
  const fx = l.apply({ kind: 'hook', token: 'tokenaaaa1', event: 'stopped', now: now + S, origin: ORIGIN });
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
  assert.deepEqual(hook(m, 'tokenbbbb2', 'tick', t1 + 5 * S), {}, 'reconnect grace: no new window yet');
  assert.ok(hook(m, 'tokenbbbb2', 'tick', t1 + 50 * S).open, 'after the grace and the retry delay, one more open');
});

test('a quiet room ends softly and the pair is not rematched right away', () => {
  const l = mk({ PEER_COOLDOWN: 60 * S });
  bringUp(l, 'tokenaaaa1', 0);
  const now = bringUp(l, 'tokenbbbb2', 1 * S);
  wsMsg(l, 'tokenaaaa1', { type: 'speech', active: true }, now + 10 * S);
  let fx = tick(l, now + 50 * S);
  assert.equal(sends(fx).length, 0, 'speech at 10 s keeps the room alive at 50 s');
  fx = tick(l, now + 56 * S);
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['line:quiet_room', 'state:shaded', 'line:requeued', 'others:1']);
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['line:quiet_room', 'state:shaded', 'line:requeued', 'others:1']);
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
  assert.deepEqual(fx.find((f) => f.type === 'attach'), { type: 'attach', ok: true, token: 'tokenaaaa1', rehearsal: true });
  assert.deepEqual(kinds(fx), ['hello', 'line:rehearsal']);
  assert.equal(sends(fx)[0].rehearsal, true);
  assert.equal(l.count(), 0);
  assert.deepEqual(hook(l, 'tokenaaaa1', 'tick', 3 * S), {}, 'once');
  assert.ok(hook(l, 'tokenaaaa1', 'tick', 16 * S).open, 'the real open still comes at T');
});

test('three reports in a day block a token; report also hangs up', () => {
  const l = mk({ REPORT_BLOCK: 2, PEER_COOLDOWN: 0 });
  bringUp(l, 'tokenaaaa1', 0);
  let now = bringUp(l, 'tokenbbbb2', 1 * S) + S;
  let fx = wsMsg(l, 'tokenaaaa1', { type: 'report' }, now);
  assert.deepEqual(kinds(fx, 'tokenaaaa1'), ['line:reported', 'close']);
  assert.deepEqual(kinds(fx, 'tokenbbbb2').slice(0, 2), ['line:left', 'state:shaded']);
  assert.equal(l.s.tokens.tokenbbbb2.blockedUntil, 0);
  // a new task for A, pair again, report again
  l.apply({ kind: 'ws_close', token: 'tokenaaaa1', now });
  hook(l, 'tokenaaaa1', 'stopped', now + S);
  now = bringUp(l, 'tokenaaaa1', now + 2 * S);
  hook(l, 'tokenbbbb2', 'tick', now);
  tick(l, now + 1);
  assert.ok(l.s.tokens.tokenbbbb2.room, 'paired again');
  wsMsg(l, 'tokenaaaa1', { type: 'report' }, now + S);
  assert.ok(l.s.tokens.tokenbbbb2.blockedUntil > now, 'blocked');
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
  const fx = copy.apply({ kind: 'hook', token: 'tokenaaaa1', event: 'stopped', now: now + S, origin: ORIGIN });
  assert.deepEqual(kinds(fx, 'tokenbbbb2'), ['state:closing', 'countdown:5']);
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
  for (let t = 51; t <= 55; t++) run({ kind: 'tick', now: t * S });
  assert.deepEqual(log, [
    'a hello',
    'b hello', 'a match', 'b match', 'a state:room', 'a line:entered', 'a line:hear', 'b state:room', 'b line:entered', 'b line:hear', 'b others',
    'a line:brb', 'b line:brb',
    'a line:back', 'b line:back',
    'a state:closing', 'b state:closing', 'a countdown:5', 'b countdown:5',
    'a countdown:4', 'b countdown:4', 'a countdown:3', 'b countdown:3', 'a countdown:2', 'b countdown:2', 'a countdown:1', 'b countdown:1',
    'a close', 'b line:left', 'b state:shaded', 'b line:requeued',
  ]);
});
