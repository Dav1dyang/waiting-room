'use strict';
// signal.sh end to end, against a fake lobby. This is the file that guards the promise on
// the tin: five fields leave the machine, nothing is printed, and a window opens once.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { startLobby } = require('./fake-lobby');
const {
  makeHome, removeHome, makeOpener, readFixture, runSignal, until, sleep, TOKEN,
} = require('./helpers');

const SESSION = '0f3c1c5e-7b0e-4c9a-9d1a-1234567890ab';
const SESSION_HASH = crypto.createHash('sha256').update(SESSION).digest('hex').slice(0, 16);

const CASES = [
  ['user-prompt-submit', 'started', null],
  ['pre-tool-use-bash', 'tick', null],
  ['post-tool-use', 'tick', null],
  ['pre-tool-use-ask', 'needs_you', null],
  ['permission-request', 'needs_you', null],
  ['elicitation', 'needs_you', null],
  ['stop-background', 'paused', 'bg'],
  ['stop-question', 'paused', 'question'],
  ['stop-plain', 'stopped', null],
  ['stop-failure', 'stopped', null],
  ['session-end', 'stopped', null],
];

// Things that live in the fixtures and must never live in a POST body.
const SECRETS = [
  '/Users/x',
  'Refactor the parser',
  'The parser is refactored',
  'rm -rf build',
  'npm test',
  'npm run build',
  'Which one?',
  'Enter a value',
  'transcript',
  '.jsonl',
  SESSION,
  'task-1',
  'rate_limit',
];

function assertSilent(run, label) {
  assert.strictEqual(run.status, 0, `${label}: exit 0`);
  assert.strictEqual(run.stdout, '', `${label}: nothing on stdout`);
  assert.strictEqual(run.stderr, '', `${label}: nothing on stderr`);
}

test('every hook fixture reaches the lobby as the right word', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome();
  t.after(async () => { await lobby.close(); removeHome(home); });

  for (const [name, event, why] of CASES) {
    lobby.requests.length = 0;
    const before = Date.now();
    const run = await runSignal(readFixture(name), home, { WAITING_ROOM_URL: lobby.url });
    assertSilent(run, name);

    // A stop is delivered by a detached process, so give it a moment; a stop also schedules a
    // delayed GET on the count route (the browser reaper), so only hook POSTs count here.
    await until(() => lobby.requests.some((r) => r.method === 'POST'), 3000);
    const posts = lobby.requests.filter((r) => r.method === 'POST');
    assert.strictEqual(posts.length, 1, `${name}: exactly one POST`);
    const req = posts[0];
    assert.strictEqual(req.method, 'POST');
    assert.strictEqual(req.path, '/api/hook');

    const body = req.json;
    assert.deepStrictEqual(Object.keys(body).sort(), ['event', 'session', 'token', 'ts', 'why'], `${name}: five keys`);
    assert.strictEqual(body.event, event, `${name}: event`);
    assert.strictEqual(body.why, why, `${name}: why`);
    assert.strictEqual(body.token, TOKEN, `${name}: token`);
    assert.strictEqual(body.session, SESSION_HASH, `${name}: hashed session`);
    assert.match(body.session, /^[0-9a-f]{16}$/, `${name}: 16 hex`);
    assert.ok(typeof body.ts === 'number' && body.ts >= before && body.ts <= Date.now(), `${name}: ts is now`);
  }
});

test('nothing about the task leaves the machine', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome();
  t.after(async () => { await lobby.close(); removeHome(home); });

  for (const [name] of CASES) {
    lobby.requests.length = 0;
    await runSignal(readFixture(name), home, { WAITING_ROOM_URL: lobby.url });
    await until(() => lobby.requests.some((r) => r.method === 'POST'), 3000);
    const raw = lobby.requests.find((r) => r.method === 'POST').raw;
    for (const secret of SECRETS) {
      assert.ok(!raw.includes(secret), `${name}: body must not contain ${JSON.stringify(secret)}`);
    }
    assert.ok(raw.length < 160, `${name}: the body stays small (${raw.length} bytes)`);
  }
});

test('off means the lobby never hears from us', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome({ enabled: false });
  t.after(async () => { await lobby.close(); removeHome(home); });

  const run = await runSignal(readFixture('user-prompt-submit'), home, { WAITING_ROOM_URL: lobby.url });
  assertSilent(run, 'disabled');
  assert.strictEqual(lobby.requests.length, 0);
});

test('no token yet means no signal', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome({ token: null });
  t.after(async () => { await lobby.close(); removeHome(home); });

  const run = await runSignal(readFixture('user-prompt-submit'), home, { WAITING_ROOM_URL: lobby.url });
  assertSilent(run, 'no token');
  assert.strictEqual(lobby.requests.length, 0);
});

test('nonsense on stdin, or an event we do not report, sends nothing', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome();
  t.after(async () => { await lobby.close(); removeHome(home); });

  const junk = [
    '',
    'not json at all',
    '{"hook_event_name":',
    '[]',
    '{"hook_event_name":"PreCompact","session_id":"x"}',
    '{"hook_event_name":"SessionStart","session_id":"x"}',
  ];
  for (const input of junk) {
    lobby.requests.length = 0;
    const run = await runSignal(input, home, { WAITING_ROOM_URL: lobby.url });
    assertSilent(run, JSON.stringify(input));
    assert.strictEqual(lobby.requests.length, 0, `no POST for ${JSON.stringify(input)}`);
  }
});

test('the endpoint file is used, and the environment beats it', async (t) => {
  const fromFile = await startLobby();
  const fromEnv = await startLobby();
  const { home } = makeHome({ endpoint: `${fromFile.url}/` });
  t.after(async () => { await fromFile.close(); await fromEnv.close(); removeHome(home); });

  await runSignal(readFixture('post-tool-use'), home);
  assert.strictEqual(fromFile.requests.length, 1, 'the file decides when nothing else does');
  assert.strictEqual(fromFile.requests[0].path, '/api/hook', 'no double slash in the path');

  await runSignal(readFixture('post-tool-use'), home, { WAITING_ROOM_URL: fromEnv.url });
  assert.strictEqual(fromEnv.requests.length, 1, 'the environment wins');
  assert.strictEqual(fromFile.requests.length, 1);
});

test('a lobby that never answers costs less than four seconds', async (t) => {
  const lobby = await startLobby();
  lobby.hang = true;
  const { home } = makeHome();
  t.after(async () => { await lobby.close(); removeHome(home); });

  const started = Date.now();
  const run = await runSignal(readFixture('user-prompt-submit'), home, { WAITING_ROOM_URL: lobby.url });
  const elapsed = Date.now() - started;
  assertSilent(run, 'hanging lobby');
  assert.ok(elapsed < 4000, `gave up in ${elapsed} ms`);
});

test('a lobby that is not there at all costs less than four seconds', async (t) => {
  const { home } = makeHome();
  t.after(() => removeHome(home));

  const started = Date.now();
  // 192.0.2.0/24 is the reserved documentation range: nothing answers there.
  const run = await runSignal(readFixture('user-prompt-submit'), home, { WAITING_ROOM_URL: 'http://192.0.2.1:8788' });
  const elapsed = Date.now() - started;
  assertSilent(run, 'unreachable lobby');
  assert.ok(elapsed < 4000, `gave up in ${elapsed} ms`);
});

test('an open reply opens one window', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome();
  const opener = makeOpener(home);
  lobby.reply.hook = { open: `${lobby.url}/room?t=ticket1` };
  t.after(async () => { await lobby.close(); removeHome(home); });

  const run = await runSignal(readFixture('pre-tool-use-bash'), home, {
    WAITING_ROOM_URL: lobby.url,
    WAITING_ROOM_OPEN_CMD: opener.script,
  });
  assertSilent(run, 'open');
  assert.ok(await until(() => opener.lines().length === 1), 'the window opened');
  assert.deepStrictEqual(opener.lines(), [`${lobby.url}/room?t=ticket1`]);
});

test('an ordinary open quits the running browser first; a test window keeps it', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome();
  const opener = makeOpener(home);
  const quitFile = path.join(home, 'quit.txt');
  const quitCmd = `touch ${JSON.stringify(quitFile)}`;
  t.after(async () => { await lobby.close(); removeHome(home); });

  // A test window rides beside the setup page: the instance must stay.
  lobby.reply.hook = { open: `${lobby.url}/room?t=ticketr`, rehearsal: true };
  let run = await runSignal(readFixture('pre-tool-use-bash'), home, {
    WAITING_ROOM_URL: lobby.url, WAITING_ROOM_OPEN_CMD: opener.script, WAITING_ROOM_QUIT_CMD: quitCmd,
  });
  assertSilent(run, 'rehearsal open');
  assert.ok(await until(() => opener.lines().length === 1), 'the test window opened');
  assert.ok(!fs.existsSync(quitFile), 'no quit before a test window');

  // An ordinary window gets a fresh, hidden launch: quit first, then open.
  fs.rmSync(path.join(home, '.waiting-room', 'opening.lock'), { recursive: true, force: true });
  lobby.reply.hook = { open: `${lobby.url}/room?t=ticket2` };
  run = await runSignal(readFixture('pre-tool-use-bash'), home, {
    WAITING_ROOM_URL: lobby.url, WAITING_ROOM_OPEN_CMD: opener.script, WAITING_ROOM_QUIT_CMD: quitCmd,
  });
  assertSilent(run, 'open');
  assert.ok(await until(() => opener.lines().length === 2), 'the window opened');
  assert.ok(fs.existsSync(quitFile), 'the running browser was quit before the open');
});

test('two hooks at once still open exactly one window', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome();
  const opener = makeOpener(home);
  lobby.reply.hook = { open: `${lobby.url}/room?t=race` };
  t.after(async () => { await lobby.close(); removeHome(home); });

  const input = readFixture('pre-tool-use-bash');
  const extra = { WAITING_ROOM_URL: lobby.url, WAITING_ROOM_OPEN_CMD: opener.script };
  const runs = await Promise.all([
    runSignal(input, home, extra),
    runSignal(input, home, extra),
  ]);
  for (const run of runs) assertSilent(run, 'racing hook');
  assert.strictEqual(lobby.requests.length, 2, 'both hooks reported in');

  assert.ok(await until(() => opener.lines().length >= 1), 'a window opened');
  await sleep(400);
  assert.strictEqual(opener.lines().length, 1, 'the lock let exactly one through');
});

test('a lock someone else is holding keeps this hook quiet', async (t) => {
  const lobby = await startLobby();
  const { home, dir } = makeHome();
  const opener = makeOpener(home);
  lobby.reply.hook = { open: `${lobby.url}/room?t=held` };
  fs.mkdirSync(path.join(dir, 'opening.lock'));
  t.after(async () => { await lobby.close(); removeHome(home); });

  const run = await runSignal(readFixture('pre-tool-use-bash'), home, {
    WAITING_ROOM_URL: lobby.url,
    WAITING_ROOM_OPEN_CMD: opener.script,
  });
  assertSilent(run, 'held lock');
  await sleep(500);
  assert.deepStrictEqual(opener.lines(), [], 'no second window');
});

test('a lock left behind by a dead hook is cleared', async (t) => {
  const lobby = await startLobby();
  const { home, dir } = makeHome();
  const opener = makeOpener(home);
  lobby.reply.hook = { open: `${lobby.url}/room?t=stale` };
  const lock = path.join(dir, 'opening.lock');
  fs.mkdirSync(lock);
  // Older than the 30 s the plugin waits before deciding nobody is coming back.
  const long = (Date.now() - 60000) / 1000;
  fs.utimesSync(lock, long, long);
  t.after(async () => { await lobby.close(); removeHome(home); });

  const run = await runSignal(readFixture('pre-tool-use-bash'), home, {
    WAITING_ROOM_URL: lobby.url,
    WAITING_ROOM_OPEN_CMD: opener.script,
  });
  assertSilent(run, 'stale lock');
  assert.ok(await until(() => opener.lines().length === 1), 'the stale lock did not block the window');
  assert.deepStrictEqual(opener.lines(), [`${lobby.url}/room?t=stale`]);
});

test('a lobby talking nonsense never reaches the opener', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome();
  const opener = makeOpener(home);
  t.after(async () => { await lobby.close(); removeHome(home); });

  const bad = [
    'not json',
    '{"open":',
    JSON.stringify({ open: 'file:///etc/passwd' }),
    JSON.stringify({ open: '; touch /tmp/waiting-room-should-not-exist' }),
    JSON.stringify({ open: 42 }),
    JSON.stringify({ open: null }),
    JSON.stringify({}),
  ];
  for (const reply of bad) {
    lobby.rawReply = reply;
    const run = await runSignal(readFixture('pre-tool-use-bash'), home, {
      WAITING_ROOM_URL: lobby.url,
      WAITING_ROOM_OPEN_CMD: opener.script,
    });
    assertSilent(run, reply);
  }
  await sleep(400);
  assert.deepStrictEqual(opener.lines(), [], 'nothing was opened');
  assert.ok(!fs.existsSync('/tmp/waiting-room-should-not-exist'), 'no command injection through the URL');
});
