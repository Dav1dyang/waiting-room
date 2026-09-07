'use strict';
// The plugin's Chrome instance must go away when nothing is on screen (D-87):
// at once when a stop reply says {quit:true}, and a moment after any stop when the
// lobby's count route says no window is up or on its way.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { startLobby } = require('./fake-lobby');
const { makeHome, removeHome, readFixture, runSignal, until, sleep } = require('./helpers');

function quitMarker(home) {
  const file = path.join(home, 'quit.txt');
  return { cmd: `touch ${JSON.stringify(file)}`, hit: () => fs.existsSync(file) };
}

test('a stop reply with quit:true quits the browser at once', async () => {
  const lobby = await startLobby();
  const { home } = makeHome();
  const q = quitMarker(home);
  try {
    lobby.reply.hook = { quit: true };
    lobby.reply.count = { count: 0, enabled: true, window: true };
    const run = await runSignal(readFixture('stop-plain'), home, { WAITING_ROOM_URL: lobby.url, WAITING_ROOM_QUIT_CMD: q.cmd });
    assert.strictEqual(run.status, 0);
    assert.strictEqual(run.stdout, '');
    await until(() => q.hit(), 3000);
    assert.ok(q.hit(), 'quit command ran');
  } finally {
    await lobby.close();
    removeHome(home);
  }
});

test('after a stop, the plugin asks the lobby and quits only when no window is up', async () => {
  const lobby = await startLobby();
  const { home } = makeHome();
  const q = quitMarker(home);
  try {
    lobby.reply.hook = {};
    lobby.reply.count = { count: 0, enabled: true, window: true };
    let run = await runSignal(readFixture('stop-plain'), home, { WAITING_ROOM_URL: lobby.url, WAITING_ROOM_QUIT_CMD: q.cmd, WAITING_ROOM_IDLE_WAIT: '0.2' });
    assert.strictEqual(run.status, 0);
    await sleep(1200);
    assert.ok(lobby.requests.some((r) => r.path === '/api/count'), 'the lobby was asked');
    assert.ok(!q.hit(), 'a window is up, so no quit');

    lobby.reply.count = { count: 0, enabled: true, window: false };
    run = await runSignal(readFixture('session-end'), home, { WAITING_ROOM_URL: lobby.url, WAITING_ROOM_QUIT_CMD: q.cmd, WAITING_ROOM_IDLE_WAIT: '0.2' });
    assert.strictEqual(run.status, 0);
    await until(() => q.hit(), 3000);
    assert.ok(q.hit(), 'no window, so the browser quits');
  } finally {
    await lobby.close();
    removeHome(home);
  }
});

test('the reaper leaves the browser alone while an open is in flight', async () => {
  const lobby = await startLobby();
  const { home, dir } = makeHome();
  const q = quitMarker(home);
  try {
    lobby.reply.hook = {};
    lobby.reply.count = { count: 0, enabled: true, window: false };
    fs.mkdirSync(path.join(dir, 'opening.lock'), { recursive: true }); // fresh: someone is opening
    await runSignal(readFixture('stop-plain'), home, { WAITING_ROOM_URL: lobby.url, WAITING_ROOM_QUIT_CMD: q.cmd, WAITING_ROOM_IDLE_WAIT: '0.2' });
    await sleep(900);
    assert.ok(!q.hit(), 'the lock is held, so no quit');
  } finally {
    await lobby.close();
    removeHome(home);
  }
});

test('a tick never asks about quitting', async () => {
  const lobby = await startLobby();
  const { home } = makeHome();
  const q = quitMarker(home);
  try {
    lobby.reply.hook = {};
    lobby.reply.count = { count: 0, enabled: true, window: false };
    await runSignal(readFixture('post-tool-use'), home, { WAITING_ROOM_URL: lobby.url, WAITING_ROOM_QUIT_CMD: q.cmd, WAITING_ROOM_IDLE_WAIT: '0.2' });
    await sleep(900);
    assert.ok(!lobby.requests.some((r) => r.path === '/api/count'));
    assert.ok(!q.hit());
  } finally {
    await lobby.close();
    removeHome(home);
  }
});
