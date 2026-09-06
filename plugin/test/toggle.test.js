'use strict';
// toggle.sh against a fake lobby: what the three commands print, and what they leave on disk.
// Claude relays these lines word for word, so the tests check them word for word.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { startLobby } = require('./fake-lobby');
const { makeHome, removeHome, runToggle, TOKEN } = require('./helpers');

const lines = (run) => run.stdout.replace(/\n$/, '').split('\n');

const RULES = [
  'Audio first. Video only when you both click.',
  'Nothing about your task is shared, ever.',
  'Nothing is recorded.',
  'Be kind. Report is one click.',
];

test('on prints the whole welcome and turns the plugin on', async (t) => {
  const lobby = await startLobby();
  const { home, dir } = makeHome({ enabled: false, token: null });
  lobby.reply.register = { ok: true, count: 0, setup: `${lobby.url}/setup?t=xyz` };
  t.after(async () => { await lobby.close(); removeHome(home); });

  const run = await runToggle(['on', 'DUCK'], home, { WAITING_ROOM_URL: lobby.url });
  assert.strictEqual(run.status, 0);
  assert.strictEqual(run.stderr, '');
  assert.deepStrictEqual(lines(run), [
    'waiting-room is on.',
    '',
    ...RULES,
    '',
    'Set up once. A page just opened in its own Chrome window (mic, notifications, sound, a test window, your tint). If it did not, open this:',
    `${lobby.url}/setup?t=xyz`,
    '',
    'Nobody else is waiting right now. That is normal.',
    '',
    'From now on, when Claude works for more than 15 s, a small shaded window opens by itself.',
  ]);

  // The token is made once, and it is twenty lowercase letters and digits.
  const token = fs.readFileSync(path.join(dir, 'token'), 'utf8');
  assert.match(token, /^[a-z0-9]{20}$/);
  assert.ok(fs.existsSync(path.join(dir, 'enabled')), 'the flag is set');
  assert.strictEqual(fs.readFileSync(path.join(dir, 'invite'), 'utf8'), 'DUCK', 'the code is remembered');

  const req = lobby.requests.at(-1);
  assert.strictEqual(req.path, '/api/register');
  assert.deepStrictEqual(req.json, { token, invite: 'DUCK' });
});

test('on again reuses the token and the remembered code', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome({ enabled: false, invite: 'DUCK' });
  lobby.reply.register = { ok: true, count: 1, setup: `${lobby.url}/setup?t=${TOKEN}` };
  t.after(async () => { await lobby.close(); removeHome(home); });

  const run = await runToggle(['on'], home, { WAITING_ROOM_URL: lobby.url });
  assert.deepStrictEqual(lobby.requests.at(-1).json, { token: TOKEN, invite: 'DUCK' });
  assert.ok(lines(run).includes('1 other is waiting for their Claude.'));
});

test('the count line counts other people', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome({ enabled: false });
  t.after(async () => { await lobby.close(); removeHome(home); });

  for (const [count, want] of [[0, 'Nobody else is waiting right now. That is normal.'], [1, '1 other is waiting for their Claude.'], [7, '7 others are waiting for their Claude.']]) {
    lobby.reply.register = { ok: true, count, setup: `${lobby.url}/setup?t=${TOKEN}` };
    const run = await runToggle(['on', 'DUCK'], home, { WAITING_ROOM_URL: lobby.url });
    assert.ok(lines(run).includes(want), `count ${count}`);
  }
});

test('a bad invite code is one line, and leaves the plugin off', async (t) => {
  const lobby = await startLobby();
  const { home, dir } = makeHome({ enabled: false });
  lobby.reply.register = { ok: false, error: 'invite' };
  t.after(async () => { await lobby.close(); removeHome(home); });

  const run = await runToggle(['on', 'NOPE'], home, { WAITING_ROOM_URL: lobby.url });
  assert.strictEqual(run.status, 0);
  assert.deepStrictEqual(lines(run), ['That invite code did not work.']);
  assert.ok(!fs.existsSync(path.join(dir, 'enabled')), 'still off');
  assert.ok(!fs.existsSync(path.join(dir, 'invite')), 'a rejected code is not remembered');
});

test('a lobby that is not there is one line, and leaves the plugin off', async (t) => {
  const { home, dir } = makeHome({ enabled: false });
  t.after(() => removeHome(home));

  const run = await runToggle(['on', 'DUCK'], home, { WAITING_ROOM_URL: 'http://192.0.2.1:8788' });
  assert.strictEqual(run.status, 0);
  assert.deepStrictEqual(lines(run), ['The lobby is not reachable right now.']);
  assert.ok(!fs.existsSync(path.join(dir, 'enabled')), 'still off');
});

test('off tells the lobby and clears the flag', async (t) => {
  const lobby = await startLobby();
  const { home, dir } = makeHome();
  t.after(async () => { await lobby.close(); removeHome(home); });

  const run = await runToggle(['off'], home, { WAITING_ROOM_URL: lobby.url });
  assert.strictEqual(run.status, 0);
  assert.deepStrictEqual(lines(run), ['waiting-room is off.']);
  assert.ok(!fs.existsSync(path.join(dir, 'enabled')));
  const req = lobby.requests.at(-1);
  assert.strictEqual(req.path, '/api/off');
  assert.deepStrictEqual(req.json, { token: TOKEN });
});

test('off works even when the lobby is down', async (t) => {
  const { home, dir } = makeHome();
  t.after(() => removeHome(home));

  const run = await runToggle(['off'], home, { WAITING_ROOM_URL: 'http://192.0.2.1:8788' });
  assert.deepStrictEqual(lines(run), ['waiting-room is off.']);
  assert.ok(!fs.existsSync(path.join(dir, 'enabled')), 'a quiet lobby never leaves this machine on');
});

test('status says on or off and how many others are waiting', async (t) => {
  const lobby = await startLobby();
  const on = makeHome();
  const off = makeHome({ enabled: false });
  t.after(async () => { await lobby.close(); removeHome(on.home); removeHome(off.home); });

  lobby.reply.count = { count: 2, enabled: true };
  const run = await runToggle(['status'], on.home, { WAITING_ROOM_URL: lobby.url });
  assert.deepStrictEqual(lines(run), ['waiting-room is on.', '2 others are waiting for their Claude.']);
  const req = lobby.requests.at(-1);
  assert.strictEqual(req.path, '/api/count');
  assert.strictEqual(req.query.get('t'), TOKEN);

  lobby.reply.count = { count: 0, enabled: false };
  const run2 = await runToggle(['status'], off.home, { WAITING_ROOM_URL: lobby.url });
  assert.deepStrictEqual(lines(run2), ['waiting-room is off.', 'Nobody else is waiting right now. That is normal.']);
});

test('status says so when the lobby is not reachable', async (t) => {
  const { home } = makeHome();
  t.after(() => removeHome(home));

  const run = await runToggle(['status'], home, { WAITING_ROOM_URL: 'http://192.0.2.1:8788' });
  assert.deepStrictEqual(lines(run), ['waiting-room is on.', '(lobby not reachable)']);
});

test('status survives a lobby that answers with nonsense', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome();
  lobby.rawReply = 'not json';
  t.after(async () => { await lobby.close(); removeHome(home); });

  const run = await runToggle(['status'], home, { WAITING_ROOM_URL: lobby.url });
  assert.strictEqual(run.status, 0);
  assert.deepStrictEqual(lines(run), ['waiting-room is on.', '(lobby not reachable)']);
});

test('an invite code with shell in it is just characters', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome({ enabled: false });
  lobby.reply.register = { ok: true, count: 0, setup: `${lobby.url}/setup?t=${TOKEN}` };
  t.after(async () => { await lobby.close(); removeHome(home); });

  await runToggle(['on', 'DUCK"; touch /tmp/waiting-room-toggle-should-not-exist; #'], home, { WAITING_ROOM_URL: lobby.url });
  // Only the characters an invite code could really hold survive the trip.
  assert.strictEqual(lobby.requests.at(-1).json.invite, 'DUCKtouchtmpwaiting-room-toggle-should-not-exist');
  assert.ok(!fs.existsSync('/tmp/waiting-room-toggle-should-not-exist'));
});

test('no line anywhere uses an em dash', async (t) => {
  const lobby = await startLobby();
  const { home } = makeHome({ enabled: false });
  lobby.reply.register = { ok: true, count: 3, setup: `${lobby.url}/setup?t=${TOKEN}` };
  t.after(async () => { await lobby.close(); removeHome(home); });

  const all = [
    (await runToggle(['on', 'DUCK'], home, { WAITING_ROOM_URL: lobby.url })).stdout,
    (await runToggle(['status'], home, { WAITING_ROOM_URL: lobby.url })).stdout,
    (await runToggle(['off'], home, { WAITING_ROOM_URL: lobby.url })).stdout,
  ].join('');
  assert.ok(!all.includes('—'), 'no em dash');
  assert.ok(!all.includes('–'), 'no en dash');
});
