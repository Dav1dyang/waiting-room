// A mock stranger on the live lobby: its own token, hooks kept alive, its window in a scripted
// Chrome whose microphone is a WAV file, so whoever it meets hears a voice.
//
//   BASE=https://… INVITE=… WAV=/path/stranger.wav node stranger.mjs
//   VIDEO_AT=40     seconds after the match: the stranger clicks Show video (0 = never)
//   STOP_AT=120     seconds after the match: the stranger's Claude "finishes" (its stop hook)
//   MAX_WAIT=240    seconds to wait for a match before giving up
//   DRY=1           also open a fake peer (fake mic) and report what it hears
import { chromium } from 'playwright';

const BASE = process.env.BASE;
const INVITE = process.env.INVITE;
const WAV = process.env.WAV;
const VIDEO_AT = Number(process.env.VIDEO_AT ?? 40);
const STOP_AT = Number(process.env.STOP_AT ?? 120);
const MAX_WAIT = Number(process.env.MAX_WAIT ?? 240);
const DRY = process.env.DRY === '1';
if (!BASE || !INVITE || !WAV) throw new Error('BASE, INVITE, WAV are required');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
async function post(route, body) {
  const r = await fetch(BASE + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
const rand = () => Math.random().toString(36).slice(2, 12);

/** One token: register, start a task, tick until the lobby hands out a room URL. */
async function armed(name, T = 15500) {
  const token = name + rand();
  const reg = await post('/api/register', { token, invite: INVITE });
  if (!reg.ok) throw new Error('register ' + name + ': ' + JSON.stringify(reg));
  const session = rand();
  const hook = (event) => post('/api/hook', { token, event, why: null, session, ts: Date.now() });
  await hook('started');
  await wait(T);
  let open = null;
  for (let i = 0; i < 5 && !open; i += 1) {
    const r = await hook('tick');
    open = r.open || null;
    if (!open) await wait(1000);
  }
  if (!open) throw new Error('no open for ' + name);
  // Keep the task alive: a tick every 20 s until told to stop.
  const keep = setInterval(() => hook('tick').catch(() => {}), 20000);
  return { token, url: open, hook, stop: async () => { clearInterval(keep); await hook('stopped'); }, off: () => post('/api/off', { token }) };
}

const HEADED = process.env.HEADED === '1';
const common = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required', '--disable-features=WebRtcHideLocalIpsWithMdns'];
const snapshot = (page) => page.evaluate(() => {
  const w = window.__wr; if (!w) return null;
  return { state: w.state, lines: w.lines, count: w.count, pc: w.pcState, mic: w.micLive };
}).catch(() => null);

const s = await armed('stranger');
log('stranger token', s.token.slice(0, 12) + '…', 'window opening');
const stranger = await chromium.launch({
  channel: 'chrome', headless: !HEADED,
  args: [...common, `--use-file-for-fake-audio-capture=${WAV}`, '--window-size=400,320', '--window-position=1400,700'],
});
const sctx = await stranger.newContext({ viewport: { width: 380, height: 268 }, permissions: ['microphone', 'camera'] });
const spage = await sctx.newPage();
await spage.goto(s.url);

let peer = null;
if (DRY) {
  const p = await armed('peer');
  const pb = await chromium.launch({ channel: 'chrome', headless: !HEADED, args: [...common, '--window-size=400,320', '--window-position=1400,300'] });
  const pctx = await pb.newContext({ viewport: { width: 380, height: 268 }, permissions: ['microphone', 'camera'] });
  const ppage = await pctx.newPage();
  await ppage.goto(p.url);
  peer = { p, pb, ppage };
  log('peer window open');
}

// Wait for the match.
let matchedAt = null;
let last = '';
const t0 = Date.now();
while (Date.now() - t0 < MAX_WAIT * 1000) {
  const snap = await snapshot(spage);
  const key = snap && snap.state + '|' + (snap.lines || []).join('|');
  if (key !== last) { log('stranger sees', JSON.stringify(snap)); last = key; }
  if (snap && snap.state === 'room' && !matchedAt) { matchedAt = Date.now(); log('MATCHED'); break; }
  await wait(1500);
}
if (!matchedAt) { log('no match in time'); await s.off(); await stranger.close(); if (peer) { await peer.p.off(); await peer.pb.close(); } process.exit(1); }

// In the room: report what the peer hears (dry run), show video when asked, stop when asked.
const inRoom = async () => (Date.now() - matchedAt) / 1000;
let videoDone = VIDEO_AT <= 0;
let stopped = false;
while (!stopped) {
  const t = await inRoom();
  const snap = await snapshot(spage);
  const key = snap && snap.state + '|' + (snap.lines || []).join('|');
  if (key !== last) { log('stranger sees', JSON.stringify(snap)); last = key; }
  if (peer && Math.round(t) % 10 === 0) {
    const lv = await peer.ppage.evaluate(() => window.__wr.statsLevels()).catch(() => null);
    const ps = await snapshot(peer.ppage);
    log('peer hears', JSON.stringify(lv), 'peer sees', JSON.stringify(ps && { state: ps.state, lines: ps.lines }));
  }
  if (!videoDone && t >= VIDEO_AT) {
    await spage.click('#videoBtn').catch(() => {});
    videoDone = true;
    log('stranger clicked Show video');
    if (peer) await wait(1500), await peer.ppage.click('#videoBtn').catch(() => {}), log('peer clicked Show video too');
  }
  if (t >= STOP_AT) {
    log("stranger's Claude is done: sending stopped");
    await s.stop();
    stopped = true;
  }
  await wait(1000);
}
// Watch the goodbye on both sides.
for (let i = 0; i < 12; i += 1) {
  const snap = await snapshot(spage);
  const key = snap && snap.state + '|' + (snap.lines || []).join('|');
  if (key !== last) { log('stranger sees', JSON.stringify(snap)); last = key; }
  if (peer) { const ps = await snapshot(peer.ppage); if (ps) log('peer sees', JSON.stringify({ state: ps.state, lines: ps.lines })); }
  await wait(1000);
}
await s.off().catch(() => {});
await stranger.close().catch(() => {});
if (peer) { await peer.p.off().catch(() => {}); await peer.pb.close().catch(() => {}); }
log('done');
