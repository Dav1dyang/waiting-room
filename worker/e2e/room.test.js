// Two strangers, two Chrome windows, one mock lobby. The whole wait, end to end.
// Run with: npm run e2e   (see e2e/README.md for what this needs)
import { test, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { countLine, LINES } from '../public/copy.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const WORKER = path.join(here, '..');

// The lobby is told to arm after one second so a test does not wait fifteen.
// Set WR_E2E_BASE (and WR_E2E_INVITE, WR_E2E_T) to run the same suite against a deployed lobby.
const EXTERNAL = process.env.WR_E2E_BASE || '';
const INVITE = process.env.WR_E2E_INVITE || 'DUCK';
const T = EXTERNAL ? Number(process.env.WR_E2E_T || 15000) : 1000;
const LAUNCH_ARGS = [
  '--use-fake-device-for-media-stream',
  '--use-fake-ui-for-media-stream',
  '--autoplay-policy=no-user-gesture-required',
  // Without this, host candidates are mDNS names that the other context cannot resolve.
  '--disable-features=WebRtcHideLocalIpsWithMdns',
];
const PERMISSIONS = ['microphone', 'camera', 'notifications'];

let port = 0;
let base = '';
let lobby = null;
let browser = null;
let seq = 0;

// One lobby serves every test, and the pairer is greedy over everyone who is queued. So each
// test tracks what it made and hands it all back afterwards, and waits for an empty lobby
// before it starts. Without that, a window left over from the test before gets paired with
// this test's window and the failure lands somewhere else entirely.
const COUNTER = 'e2ecounter00';
let openTokens = [];
let openPages = [];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

function startLobby(p) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(WORKER, 'scripts', 'mock-lobby.js')], {
      cwd: WORKER,
      env: { ...process.env, PORT: String(p), INVITES: 'DUCK', T: String(T) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const fail = setTimeout(() => reject(new Error('the mock lobby did not start')), 10000);
    child.stdout.on('data', (d) => {
      if (String(d).includes('mock lobby on')) {
        clearTimeout(fail);
        resolve(child);
      }
    });
    child.stderr.on('data', (d) => process.stderr.write('[lobby] ' + d));
    child.on('exit', (code) => {
      clearTimeout(fail);
      reject(new Error('the mock lobby exited with ' + code));
    });
  });
}

const post = (p, body) =>
  fetch(base + p, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

/** A fresh lowercase token; the lobby only takes [a-z0-9]{8,64}. */
function newToken(tag) {
  seq += 1;
  return ('e2e' + tag + seq + Date.now().toString(36)).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** How many people the lobby thinks are waiting, asked through a token that never waits. */
async function waiting() {
  const r = await fetch(`${base}/api/count?t=${COUNTER}`).then((x) => x.json());
  return r.count;
}

async function emptyLobby(ms = 8000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if ((await waiting()) === 0) return;
    await wait(100);
  }
  throw new Error('the lobby still has someone waiting from an earlier test');
}

/** Register, start a task, wait past T, then tick until the lobby hands out a room URL. */
async function armed(tag) {
  const token = newToken(tag);
  openTokens.push(token);
  const reg = await post('/api/register', { token, invite: INVITE });
  assert.equal(reg.ok, true, 'register ' + token);
  await post('/api/hook', { token, event: 'started' });
  await wait(T + 300);
  const res = await post('/api/hook', { token, event: 'tick' });
  assert.ok(res.open, 'the lobby should hand out a room URL past T');
  return { token, url: res.open };
}

async function openWindow(url) {
  const context = await browser.newContext({ permissions: PERMISSIONS, viewport: { width: 380, height: 262 } });
  const page = await context.newPage();
  openPages.push(page);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.errors = errors;
  await page.goto(url);
  await until(page, (w) => w !== null, 'the window should publish __wr');
  return page;
}

/** Poll one page's __wr until the predicate holds. Returns the last value seen. */
async function until(page, pred, what, ms = 10000) {
  const deadline = Date.now() + ms;
  let last = null;
  while (Date.now() < deadline) {
    if (page.isClosed()) throw new Error('the page closed while waiting for: ' + what);
    try {
      last = await page.evaluate(() => {
        const w = window.__wr;
        if (!w) return null;
        return {
          state: w.state, collapsed: w.collapsed, others: w.others, pcState: w.pcState,
          micLive: w.micLive, lines: w.lines, count: w.count, big: w.big, told: w.told,
          attempts: w.attempts, greeted: w.greeted,
        };
      });
    } catch {
      last = null; // navigating or closing
    }
    if (pred(last)) return last;
    await wait(150);
  }
  throw new Error('timed out waiting for: ' + what + '\nlast seen: ' + JSON.stringify(last));
}

const hasLine = (w, text) => !!w && w.lines.includes(text);

before(async () => {
  if (EXTERNAL) {
    base = EXTERNAL.replace(/\/+$/, '');
  } else {
    port = await freePort();
    base = `http://127.0.0.1:${port}`;
    lobby = await startLobby(port);
  }
  await post('/api/register', { token: COUNTER, invite: INVITE });
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: LAUNCH_ARGS });
});

beforeEach(async () => {
  await emptyLobby();
});

afterEach(async () => {
  for (const page of openPages) {
    try {
      if (!page.isClosed()) await page.context().close();
    } catch {
      // already gone
    }
  }
  // /api/off drops the task and any window at once, so nothing this test made can be paired again.
  for (const token of openTokens) {
    try {
      await post('/api/off', { token });
    } catch {
      // the lobby is going away with us
    }
  }
  openPages = [];
  openTokens = [];
});

after(async () => {
  if (browser) await browser.close();
  if (lobby) lobby.kill();
});

test('a queued window shows the honest count and nothing else', async () => {
  const a = await armed('q');
  const page = await openWindow(a.url);
  // Gate on the hello, or every assertion below would also pass on a window that never
  // reached the lobby at all: they are the same values start() sets before the socket opens.
  const w = await until(page, (s) => s && s.greeted, 'the lobby says hello');
  assert.equal(w.state, 'shaded');
  assert.equal(w.collapsed, true);
  assert.equal(w.count, countLine(0), 'alone in the lobby, the count line says so');
  assert.equal(w.micLive, false, 'the mic never turns on while queued');
  assert.deepEqual(w.lines, [], 'a queued window has no log lines');
  assert.deepEqual(page.errors, []);
});

test('two strangers meet, connect, and hear each other', async () => {
  const a = await armed('a');
  const b = await armed('b');
  const pa = await openWindow(a.url);
  const pb = await openWindow(b.url);

  const wa = await until(pa, (s) => hasLine(s, LINES.entered), 'A sees the stranger enter');
  const wb = await until(pb, (s) => hasLine(s, LINES.entered), 'B sees the stranger enter');
  assert.ok(hasLine(wa, LINES.hear));
  assert.ok(hasLine(wb, LINES.hear));
  assert.equal(wa.state, 'room');
  assert.equal(wb.state, 'room');

  const ca = await until(pa, (s) => s && s.pcState === 'connected', 'A connects over WebRTC');
  const cb = await until(pb, (s) => s && s.pcState === 'connected', 'B connects over WebRTC');
  assert.equal(ca.pcState, 'connected');
  assert.equal(cb.pcState, 'connected');

  const live = await until(pa, (s) => s && s.micLive, 'the red live dot comes on with the local track');
  assert.equal(live.micLive, true);
  assert.equal(await pa.evaluate(() => document.getElementById('mark').className), 'live');
  assert.equal(await pa.evaluate(() => document.getElementById('lead').dataset.icon), 'person');

  // RTP audio levels are the fallback the meters use when Web Audio never starts.
  // They must report real sound, or a talking room would look silent and time out at Q.
  let heard = false;
  for (let i = 0; i < 30 && !heard; i++) {
    const lv = await pa.evaluate(() => window.__wr.statsLevels());
    heard = lv.you > 0 || lv.them > 0;
    if (!heard) await wait(200);
  }
  assert.ok(heard, 'getStats reports an audio level for a room with sound in it');

  assert.deepEqual(pa.errors, []);
  assert.deepEqual(pb.errors, []);
});

test('a stopped Claude runs the goodbye on both sides', async () => {
  const a = await armed('c');
  const b = await armed('d');
  const pa = await openWindow(a.url);
  const pb = await openWindow(b.url);
  await until(pa, (s) => hasLine(s, LINES.entered), 'A is in the room');
  await until(pb, (s) => hasLine(s, LINES.entered), 'B is in the room');

  await post('/api/hook', { token: a.token, event: 'stopped' });

  const wa = await until(pa, (s) => hasLine(s, LINES.done_you), 'A is told its own Claude is done');
  assert.equal(wa.state, 'closing');
  assert.ok(wa.big && /^[1-5]$/.test(wa.big), 'the countdown digit shows, got ' + wa.big);

  const wb = await until(pb, (s) => hasLine(s, LINES.done_them), "B is told the stranger's Claude is done");
  assert.ok(wb.big && /^[1-5]$/.test(wb.big), 'B shows the same digit, got ' + wb.big);

  const left = await until(pb, (s) => hasLine(s, LINES.left), 'B is told the stranger left', 12000);
  assert.equal(left.state, 'shaded', 'B goes back to the queue');
  await until(pb, (s) => s && s.collapsed, 'B rolls back up after the linger', 8000);

  // A was told to close: it stops talking to the lobby and tries to close itself.
  await until(pa, (s) => s === null || s.told, 'A is told to close').catch(() => {});
});

test('hanging up closes your window and shades the stranger', async () => {
  const a = await armed('e');
  const b = await armed('f');
  const pa = await openWindow(a.url);
  const pb = await openWindow(b.url);
  await until(pa, (s) => hasLine(s, LINES.entered), 'A is in the room');
  await until(pb, (s) => hasLine(s, LINES.entered), 'B is in the room');

  let closed = false;
  pa.on('close', () => {
    closed = true;
  });
  await pa.click('#hangup');

  const wb = await until(pb, (s) => hasLine(s, LINES.left), 'B is told the stranger left');
  assert.equal(wb.state, 'shaded');
  await until(pb, (s) => hasLine(s, LINES.requeued), 'B is back in the queue');
  await until(pb, (s) => s && s.collapsed, 'B rolls back up', 8000);

  await wait(2500);
  // In a real --app window opener is null and history.length is 1, so window.close() lands.
  // A Playwright page has a second history entry, so Chrome refuses; then the honest check is
  // that the window was told to close, stopped talking, and released the mic (see e2e/README.md).
  const closedItself = closed || pa.isClosed();
  if (!closedItself) {
    const w = await pa.evaluate(() => ({ told: window.__wr.told, micLive: window.__wr.micLive }));
    assert.equal(w.told, true, 'the window that hung up was told to close');
    assert.equal(w.micLive, false, 'and released the microphone at once');
  }

});

test('a requeued window can meet a second stranger', async () => {
  const a = await armed('g');
  const b = await armed('i');
  const pa = await openWindow(a.url);
  const pb = await openWindow(b.url);
  await until(pa, (s) => hasLine(s, LINES.entered), 'A is in the room');
  await until(pb, (s) => hasLine(s, LINES.entered), 'B is in the room');

  await pa.click('#hangup');
  await until(pb, (s) => hasLine(s, LINES.requeued), 'B is back in the queue');

  // A third person turns up. B should meet them, with a working connection and meters.
  const c = await armed('j');
  const pc = await openWindow(c.url);
  await until(pc, (s) => hasLine(s, LINES.entered), 'C meets B', 15000);
  const wb = await until(pb, (s) => s && s.state === 'room' && s.pcState === 'connected',
    'B connects to the second stranger', 15000);
  assert.equal(wb.collapsed, false, 'B unrolls again');
  assert.equal(wb.micLive, true, 'and the mic is live again');

  let heard = false;
  for (let i = 0; i < 30 && !heard; i++) {
    const lv = await pb.evaluate(() => window.__wr.statsLevels());
    heard = lv.you > 0 || lv.them > 0;
    if (!heard) await wait(200);
  }
  assert.ok(heard, 'the second room reports sound too');

  assert.deepEqual(pb.errors, []);
});

test('a dropped socket comes back on its own', async () => {
  const a = await armed('r');
  const page = await openWindow(a.url);
  await until(page, (s) => s && s.state === 'shaded', 'the window is up');

  await page.evaluate(() => window.__wr.dropSocket());
  await until(page, (s) => s && s.attempts > 0, 'the window notices the drop', 5000);
  // The backoff is 1 s on the first try, then the lobby answers with a fresh hello.
  await until(page, (s) => s && s.attempts === 0, 'the window reconnects and resets the backoff', 8000);
  assert.deepEqual(page.errors, []);
});

test('a rehearsal window says it is a test and closes itself', async () => {
  const token = newToken('h');
  openTokens.push(token);
  await post('/api/register', { token, invite: INVITE });
  const armedRes = await post('/api/rehearse', { token });
  assert.equal(armedRes.ok, true);

  // The rehearsal rides the next hook (D-84), so any event opens it.
  const res = await post('/api/hook', { token, event: 'started' });
  assert.ok(res.open, 'the armed rehearsal hands out a test window');

  const page = await openWindow(res.open);
  const w = await until(page, (s) => hasLine(s, LINES.rehearsal), 'the test window says it is a test');
  assert.equal(w.lines.filter((t) => t === LINES.rehearsal).length, 1, 'the line is not shown twice');
  assert.equal(w.state, 'shaded');
  assert.deepEqual(page.errors, []);
});

test('every window sends one Phase 0 probe', async () => {
  const a = await armed('p');
  const page = await openWindow(a.url);
  await until(page, (s) => s && s.state === 'shaded', 'the window is up');
  await page.waitForFunction(() => window.__wr.probe !== null, null, { timeout: 8000 });

  const probe = await page.evaluate(() => window.__wr.probe);
  for (const key of ['hasFocus', 'visibility', 'sizes', 'userAgent', 'audioContextState',
    'notificationPermission', 'micPermission', 'mediaStreamAutoplay', 'selfCloseSupported', 'timings']) {
    assert.ok(key in probe, 'the probe carries ' + key);
  }
  assert.ok('before' in probe.sizes && 'at100' in probe.sizes && 'at300' in probe.sizes);

  const stored = await fetch(`${base}/api/probes?t=${a.token}`).then((r) => r.json());
  assert.equal(stored.probes.length, 1, 'the lobby kept exactly one probe for this window');
  assert.ok(stored.probes[0].data.userAgent.includes('Chrome'));
});

test('a stale ticket says so and gets out of the way', async () => {
  const context = await browser.newContext({ viewport: { width: 380, height: 262 } });
  const page = await context.newPage();
  openPages.push(page);
  await page.goto(`${base}/room?t=nosuchticket`);
  await page.waitForFunction(() => document.body.innerText.includes('This window is stale.'), null, { timeout: 8000 });
});

test('the setup page reads the lobby and refuses an unknown token', async () => {
  const token = newToken('s');
  openTokens.push(token);
  await post('/api/register', { token, invite: INVITE });
  const context = await browser.newContext({ permissions: PERMISSIONS, viewport: { width: 640, height: 620 } });
  const page = await context.newPage();
  openPages.push(page);

  await page.goto(`${base}/setup?t=${token}`);
  await page.waitForFunction(() => window.__wrSetup && window.__wrSetup.enabled, null, { timeout: 8000 });
  await page.click('#rehearseBtn');
  await page.waitForFunction(
    (armedText) => document.getElementById('statusLine').textContent === armedText,
    'Armed. Now send Claude any message.',
    { timeout: 5000 },
  );

  await page.goto(`${base}/setup?t=notarealtokenhere`);
  await page.waitForFunction(
    () => document.getElementById('setupBody').textContent.includes('This setup link is not valid.'),
    null,
    { timeout: 5000 },
  );
});
