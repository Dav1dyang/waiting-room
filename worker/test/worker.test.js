// The Worker end to end: a real `wrangler dev`, real HTTP, real WebSockets, real alarms.
// One wait from register to goodbye. If wrangler cannot start here the test says so and skips
// rather than failing, because a missing local runtime is not a broken lobby.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIN = path.join(DIR, 'node_modules', '.bin', 'wrangler');
const A = 'tokenaaaa1';
const B = 'tokenbbbb2';

let child = null;
let base = '';
let persist = '';
let why = '';
const log = [];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

before(async () => {
  if (!fs.existsSync(BIN)) {
    why = 'wrangler is not installed in worker/node_modules; run npm install';
    return;
  }
  persist = fs.mkdtempSync(path.join(os.tmpdir(), 'wr-state-'));
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  child = spawn(BIN, [
    'dev', '--port', String(port), '--ip', '127.0.0.1', '--inspector-port', '0',
    '--persist-to', persist,
    '--var', 'T:1000', '--var', 'INVITES:DUCK', '--var', 'N:8000',
  ], {
    cwd: DIR,
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => log.push(String(d)));
  child.stderr.on('data', (d) => log.push(String(d)));
  child.on('error', (e) => log.push('spawn error: ' + e.message));
  const up = await waitForServer(30_000);
  if (!up) why = 'wrangler dev did not answer on ' + base + '\n' + log.join('').slice(-2000);
});

after(async () => {
  if (child && child.exitCode === null) {
    child.kill('SIGINT');
    const done = await Promise.race([
      new Promise((r) => child.once('exit', () => r(true))),
      sleep(5000).then(() => false),
    ]);
    if (!done) child.kill('SIGKILL');
  }
  if (persist) fs.rmSync(persist, { recursive: true, force: true });
});

test('one whole wait, through the Worker', { timeout: 55_000 }, async (t) => {
  if (why) {
    t.skip(why);
    return;
  }

  // The home page is a sign of life, not a page.
  const home = await fetch(base + '/');
  assert.equal(home.status, 200);
  assert.equal((await home.text()).trim(), 'waiting-room');

  // Bodies that are not small JSON objects are refused.
  assert.equal((await fetch(base + '/api/hook', { method: 'POST', body: 'nope' })).status, 400);
  assert.equal((await fetch(base + '/api/hook', { method: 'POST', body: JSON.stringify({ pad: 'x'.repeat(5000) }) })).status, 400);

  // A ticket nobody issued gets in the door and is shown out again.
  const nobody = connect(base + '/room?t=nope');
  assert.equal(await closedCode(nobody), 4001, 'bad ticket closes with 4001');

  // Registration needs the invite.
  const wrong = await post('/api/register', { token: A, invite: 'WRONG' });
  assert.deepEqual(wrong.body, { ok: false, error: 'invite' });
  assert.equal(wrong.res.headers.get('cache-control'), 'no-store');
  assert.match(wrong.res.headers.get('content-type'), /application\/json/);

  const ra = await post('/api/register', { token: A, invite: 'DUCK' });
  assert.equal(ra.body.ok, true);
  assert.equal(ra.body.setup, base + '/setup?t=' + A);
  assert.equal((await post('/api/register', { token: B, invite: 'DUCK' })).body.ok, true);

  // Nothing opens before T, which is one second here.
  assert.deepEqual((await post('/api/hook', { token: A, event: 'started' })).body, {});
  assert.deepEqual((await post('/api/hook', { token: B, event: 'started' })).body, {});
  await sleep(1200);
  const openA = (await post('/api/hook', { token: A, event: 'tick' })).body.open;
  const openB = (await post('/api/hook', { token: B, event: 'tick' })).body.open;
  assert.match(openA, new RegExp('^' + base + '/room\\?t=[0-9a-f]+$'));
  assert.ok(openB);

  // Two windows, and the second one completes the pair.
  const a = connect(openA);
  const helloA = (await waitFor(a, (m) => m.type === 'hello')).m;
  assert.equal(helloA.state, 'shaded');
  assert.equal(helloA.rehearsal, false);
  assert.equal(helloA.cfg.countdown, 10);

  const b = connect(openB);
  await waitFor(b, (m) => m.type === 'hello');

  const matchA = (await waitFor(a, (m) => m.type === 'match')).m;
  const matchB = (await waitFor(b, (m) => m.type === 'match')).m;
  assert.equal(matchA.role, 'offer');
  assert.equal(matchB.role, 'answer');
  assert.equal(matchA.room, matchB.room);
  assert.equal(matchA.iceServers[0].urls, 'stun:stun.cloudflare.com:3478');
  for (const box of [a, b]) {
    await waitFor(box, (m) => m.type === 'state' && m.state === 'room');
    await waitFor(box, (m) => m.type === 'line' && m.key === 'entered');
    await waitFor(box, (m) => m.type === 'line' && m.key === 'hear' && m.who === 'soft');
  }

  // A signal goes to the other side and nowhere else.
  send(a, { type: 'signal', room: matchA.room, data: { sdp: 'v=0 fake' } });
  const relayed = (await waitFor(b, (m) => m.type === 'signal')).m;
  assert.deepEqual(relayed.data, { sdp: 'v=0 fake' });
  assert.equal(relayed.room, matchA.room);
  assert.equal(a.frames.filter((f) => f.m.type === 'signal').length, 0);

  // A's Claude stops. Both sides count down, one second apart, on the alarm.
  await post('/api/hook', { token: B, event: 'tick' });
  await post('/api/hook', { token: A, event: 'stopped' });
  await waitFor(a, (m) => m.type === 'state' && m.state === 'closing');
  await waitFor(b, (m) => m.type === 'state' && m.state === 'closing');
  assert.equal((await waitFor(a, (m) => m.type === 'countdown' && m.n === 10)).m.mine, true);
  assert.equal((await waitFor(b, (m) => m.type === 'countdown' && m.n === 10)).m.mine, false);

  const beats = [];
  for (const n of [4, 3, 2, 1]) {
    beats.push((await waitFor(a, (m) => m.type === 'countdown' && m.n === n, 9000)).at);
    if (n === 3) await post('/api/hook', { token: B, event: 'tick' }); // keep B's Claude alive
  }
  for (let i = 1; i < beats.length; i++) {
    const gap = beats[i] - beats[i - 1];
    // A busy machine stretches the beats; the point is that they keep coming, one by one.
    assert.ok(gap > 300 && gap < 4000, `countdown beat ${i} came ${gap} ms after the last one`);
  }

  // A's window is told to close; B is told and shades. The window closes itself on the frame:
  // under wrangler dev a socket the Worker closes stays open on the client, see NOTES.md.
  assert.equal((await waitFor(a, (m) => m.type === 'close', 18000)).m.reason, 'done');
  await waitFor(b, (m) => m.type === 'line' && m.key === 'left');
  await waitFor(b, (m) => m.type === 'state' && m.state === 'shaded');
  await waitFor(b, (m) => m.type === 'line' && m.key === 'requeued');

  // One person is left waiting. `count` is other people, so B sees nobody and A sees B.
  assert.deepEqual((await get('/api/count?t=' + B)).body, { count: 0, enabled: true, window: true }, 'B saw ' + trace(b));
  assert.deepEqual((await get('/api/count?t=' + A)).body, { count: 1, enabled: true, window: true }, 'A just registered: setup grace');

  // Off closes the last window.
  assert.deepEqual((await post('/api/off', { token: B })).body, { ok: true });
  assert.equal((await waitFor(b, (m) => m.type === 'close')).m.reason, 'off');
  assert.deepEqual((await get('/api/count?t=' + B)).body, { count: 0, enabled: false, window: false }, 'off: the browser may go');
  assert.deepEqual((await get('/api/count?t=' + A)).body, { count: 0, enabled: true, window: true }, 'nobody left');

  // A rehearsal window rides the next hook, says so, and joins no queue.
  const C = 'tokenccccc3';
  assert.equal((await post('/api/register', { token: C, invite: 'DUCK' })).body.ok, true);
  assert.deepEqual((await post('/api/rehearse', { token: C })).body, { ok: true });
  const openC = (await post('/api/hook', { token: C, event: 'started' })).body.open;
  assert.ok(openC, 'a rehearsal opens at once, before T');
  const c = connect(openC);
  assert.equal((await waitFor(c, (m) => m.type === 'hello')).m.rehearsal, true);
  await waitFor(c, (m) => m.type === 'line' && m.key === 'rehearsal');
  assert.deepEqual((await get('/api/count?t=' + C)).body, { count: 0, enabled: true, window: true }, 'a rehearsal joins no queue');
  c.ws.close();

  // Nobody asked: a token nobody registered gets no count, and an oversized body is refused
  // before it is read whole.
  assert.deepEqual((await get('/api/count?t=nobodyzzzz9')).body, { count: 0, enabled: false, window: false });
  const big = await fetch(base + '/api/hook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"token":"' + 'x'.repeat(5000) + '"}',
  });
  assert.equal(big.status, 400);

  // A window that floods the lobby is closed with 1008.
  const D = 'tokenddddd4';
  assert.equal((await post('/api/register', { token: D, invite: 'DUCK' })).body.ok, true);
  await post('/api/hook', { token: D, event: 'started' });
  await sleep(1300);
  const openD = (await post('/api/hook', { token: D, event: 'tick' })).body.open;
  assert.ok(openD, 'a window for D');
  const d = connect(openD);
  await waitFor(d, (m) => m.type === 'hello');
  for (let i = 0; i < 200; i += 1) send(d, { type: 'speech', active: i % 2 === 0 });
  assert.equal(await closedCode(d), 1008, 'flooding closes the socket');

  // Under wrangler dev the client address header passes through, so each section below can
  // be its own address. (Cloudflare overwrites the header at the edge; a client cannot pick it.)
  // Thirty registrations from one address in an hour, then 429: the door of an open lobby.
  const flood = { 'cf-connecting-ip': '10.9.9.2' };
  let cappedAt = -1;
  for (let i = 0; i < 35 && cappedAt < 0; i += 1) {
    const r = await post('/api/register', { token: 'floodtoken' + String(i).padStart(2, '0'), invite: 'DUCK' }, flood);
    if (r.res.status === 429) cappedAt = i;
    else assert.equal(r.body.ok, true);
  }
  assert.equal(cappedAt, 30, 'thirty registrations, then 429');
  assert.equal((await post('/api/register', { token: 'tokenaaaa1', invite: 'DUCK' })).body.ok, true, 'another address is unaffected');

  // Invite guessing: ten wrong codes, then registration answers 429 for a while.
  const guess = { 'cf-connecting-ip': '10.9.9.1' };
  let busyAt = -1;
  for (let i = 0; i < 12 && busyAt < 0; i += 1) {
    const r = await post('/api/register', { token: 'guesserrrr' + i, invite: 'NOPE' + i }, guess);
    if (r.res.status === 429) busyAt = i;
    else assert.deepEqual(r.body, { ok: false, error: 'invite' });
  }
  assert.equal(busyAt, 10, 'ten wrong codes, then 429; got it at ' + busyAt);
  const blocked = await post('/api/register', { token: 'guesserrrr9', invite: 'DUCK' }, guess);
  assert.equal(blocked.res.status, 429, 'even the right code waits now');
  assert.deepEqual(blocked.body, { ok: false, error: 'busy' });
});

// ---------- helpers ----------
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForServer(ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (child && child.exitCode !== null) return false;
    try {
      const res = await fetch(base + '/', { signal: AbortSignal.timeout(1000) });
      if (res.ok && (await res.text()).includes('waiting-room')) return true;
    } catch {
      // not up yet
    }
    await sleep(250);
  }
  return false;
}

async function post(route, body, headers = {}) {
  const res = await fetch(base + route, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return { res, body: await res.json() };
}

async function get(route) {
  const res = await fetch(base + route);
  return { res, body: await res.json() };
}

function connect(openUrl) {
  const u = new URL(openUrl);
  u.protocol = 'ws:';
  u.pathname = '/ws';
  const ws = new WebSocket(u.toString());
  const box = { ws, frames: [], closed: null };
  ws.on('message', (d) => {
    try { box.frames.push({ at: Date.now(), m: JSON.parse(String(d)) }); } catch { /* not ours */ }
  });
  ws.on('close', (code) => { box.closed = code; });
  ws.on('error', () => { /* the close event says enough */ });
  return box;
}

async function closedCode(box, ms = 8000) {
  const stop = Date.now() + ms;
  while (Date.now() < stop) {
    if (box.closed !== null) return box.closed;
    await sleep(20);
  }
  throw new Error('the socket never closed');
}

/** A one line summary of everything a window heard, for a failure message. */
function trace(box) {
  return box.frames.map((f) => f.m.type + (f.m.key || f.m.state || f.m.reason || (f.m.n ?? '') || '')).join(' ');
}

function send(box, msg) {
  box.ws.send(JSON.stringify(msg));
}

async function waitFor(box, pred, ms = 12000) {
  const stop = Date.now() + ms;
  while (Date.now() < stop) {
    const hit = box.frames.find((f) => pred(f.m));
    if (hit) return hit;
    await sleep(20);
  }
  throw new Error('no frame matched in ' + ms + ' ms; saw ' + JSON.stringify(box.frames.map((f) => f.m)));
}
