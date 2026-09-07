// The room window. One WebSocket to the lobby, one peer connection to the stranger.
// Protocol: docs/PROTOCOL.md sections 5, 6, 7. Copy: copy.js. Look: design/build.py.

import { LINES, UI, countLine } from './copy.js';
import { paintIcons } from './icons.js';
import {
  LOG_MAX, backoffMs, buildMeter, makePeakHold, makeSpeechGate, litBars,
  paintCount, paintLog, paintMeter, paintThumb, pushLine, rmsLevel, store, textFor,
} from './ui.js';
import * as sound from './audio.js';
import { Peer, stopStream } from './rtc.js';

const SIZES = { shaded: [380, 100], room: [380, 300], video: [380, 400] };
// The desk showing above and below the panel (style.css --edge-top + --edge-bottom) and the
// panel's 1px shadow. Chrome's own title bar is measured, 32px on a Mac when it cannot be.
const EDGE_Y = 16 + 1;
const CHROME_BAR_FALLBACK = 32;
const TINT_DEFAULT = '#91CECF';
const LINGER_MS = 3000;   // the room stays up a moment after the stranger leaves, then it rolls up
const CLOSE_MS = 1000;    // how long the last line stays before the window closes itself
const STUCK_MS = 500;     // and how long after that we admit the window would not close
const STALE_MS = 3000;
const PROBE_AT = 800;
const PROBE_CLOSE_MS = 6000;
const TICK_MS = 40;
const STATS_MS = 200;  // the fallback poll, when Web Audio never started

const q = new URLSearchParams(location.search);
const ticket = q.get('t') || '';
const probeMode = q.get('probe') === '1';

const el = {};
for (const id of ['win', 'tb', 'door', 'shadebox', 'zoom', 'topic', 'lead', 'mark', 'countText',
  'stage', 'localVideo', 'remoteVideo', 'log', 'lines', 'big', 'thumb', 'meterYou', 'meterThem',
  'hangup', 'videoBtn', 'report', 'sounds', 'soundIcon', 'remoteAudio']) {
  el[id] = document.getElementById(id);
}

const state = {
  ws: null,
  attempts: 0,
  told: false,        // a `close` arrived; do not reconnect, do not send bye
  gone: false,        // the page is finished with the lobby
  win: 'shaded',      // the logical state the lobby last named
  collapsed: true,    // the visual shade
  userShaded: false,  // the shade widget, which is ours alone
  others: 0,
  room: null,
  lines: [],
  countdownSeen: false,
  greeted: false,     // a hello has arrived, so the state below came from the lobby
  rehearsal: false,
  rehearsalLine: false,
  localVideoOn: false,
  peerVideoOn: false,
  micLive: false,
  pcState: 'new',
  lingerTimer: 0,
};

let peer = null;
let youMeter = null;
let themMeter = null;
let tickTimer = 0;
let statsTimer = 0;
let statsLevels = { you: 0, them: 0 };
let usingStats = false;
// One room's worth of state each: a requeued window gets a fresh set, or a gate left
// "speaking" by a room that ended would never report the new room's first word.
let peakYou = makePeakHold();
let peakThem = makePeakHold();
let speechGate = makeSpeechGate({ releaseMs: 1500, minGapMs: 2000 });

function resetLevels() {
  peakYou = makePeakHold();
  peakThem = makePeakHold();
  speechGate = makeSpeechGate({ releaseMs: 1500, minGapMs: 2000 });
  statsLevels = { you: 0, them: 0 };
}

// ---------- chrome ----------

function tint() {
  const t = store('wr-tint') || TINT_DEFAULT;
  document.body.style.background = t;
  document.documentElement.style.setProperty('--desk', t);
}

function stageVisible() {
  return state.localVideoOn || state.peerVideoOn;
}

function chromeBar() {
  const d = window.outerHeight - window.innerHeight;
  return d > 0 && d < 120 ? d : CHROME_BAR_FALLBACK;
}

/** Shaded, the window fits the panel: one count line or two, never a cropped frame (D-94). */
function sizeFor() {
  if (state.collapsed) {
    const need = Math.ceil(el.win.getBoundingClientRect().height) + EDGE_Y + chromeBar();
    return [SIZES.shaded[0], Math.max(SIZES.shaded[1], need)];
  }
  // Unrolled, a two-line count line takes its extra height from the window, not from the log.
  const extra = Math.max(0, el.topic.offsetHeight - 24);
  const [w, h] = stageVisible() ? SIZES.video : SIZES.room;
  return [w, h + extra];
}

function applySize() {
  const [w, h] = sizeFor();
  try {
    window.resizeTo(w, h);
  } catch {
    // some hosts refuse; the page lays out to whatever it got (D-74)
  }
}

function render() {
  el.win.dataset.shaded = state.collapsed ? '1' : '0';
  el.win.dataset.video = stageVisible() ? '1' : '0';
  // Still the person, not the watch, while the room lingers open after the stranger left.
  const inRoom = state.win !== 'shaded' || state.lingerTimer !== 0;
  paintCount(
    { lead: el.lead, mark: el.mark, text: el.countText },
    { others: state.others, inRoom, micLive: state.micLive },
  );
  paintIcons(el.topic);

  el.videoBtn.textContent = state.localVideoOn ? UI.hideVideo : UI.showVideo;
  setBtn(el.hangup, state.win === 'room' || state.win === 'closing', 'blush');
  // Cyan is the one inviting action, so it leaves the button once video is already on.
  setBtn(el.videoBtn, state.win === 'room', '');
  el.videoBtn.classList.toggle('cyan', state.win === 'room' && !state.localVideoOn);
  setBtn(el.report, true, '');
  // The mockup marks the default ring on Hang up during the goodbye, and nowhere else.
  el.hangup.classList.toggle('def', state.win === 'closing');
  applySize();
}

function setBtn(node, on, fill) {
  node.disabled = !on;
  node.classList.toggle('dis', !on);
  if (fill) node.classList.toggle(fill, on);
}

function setCollapsed(on) {
  state.collapsed = !!on;
  render();
}

// ---------- log ----------

function append(key, who = 'sys') {
  state.lines = pushLine(state.lines, { key, who, text: textFor(key) }, LOG_MAX);
  paintLog(el.lines, state.lines);
  paintThumb(el.thumb, state.lines.length);
}

// ---------- the socket ----------

function wsUrl() {
  const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${scheme}//${location.host}/ws?t=${encodeURIComponent(ticket)}`;
}

function connect() {
  let ws;
  try {
    ws = new WebSocket(wsUrl());
  } catch {
    return scheduleReconnect();
  }
  state.ws = ws;
  ws.onopen = () => {};
  ws.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    handle(msg);
  };
  ws.onclose = (ev) => {
    if (state.gone) return;
    if (ev.code === 4001) return stale();
    if (state.told) return;
    scheduleReconnect();
  };
  ws.onerror = () => {};
}

function scheduleReconnect() {
  state.attempts += 1;
  const wait = backoffMs(state.attempts);
  if (wait === null) return stale();
  setTimeout(() => {
    if (!state.told && !state.gone) connect();
  }, wait);
}

function send(msg) {
  const ws = state.ws;
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  try {
    ws.send(JSON.stringify(msg));
    return true;
  } catch {
    return false;
  }
}

/** The ticket is spent or the lobby forgot us. Say so once, then get out of the way. */
function stale() {
  if (state.gone) return;
  state.gone = true;
  state.told = true;
  teardown();
  el.win.textContent = '';
  const p = document.createElement('div');
  p.className = 'stale';
  p.textContent = UI.stale;
  el.win.appendChild(p);
  setTimeout(closeSelf, STALE_MS);
}

// ---------- messages ----------

function handle(msg) {
  switch (msg.type) {
    case 'hello':
      state.attempts = 0; // a real hello, not just an open socket, resets the backoff
      state.greeted = true;
      state.others = msg.others || 0;
      if (msg.rehearsal) {
        state.rehearsal = true;
        setWin('shaded');
        showRehearsal();
      } else {
        setWin(msg.state || 'shaded');
      }
      render();
      break;

    case 'others':
      state.others = msg.n || 0;
      render();
      break;

    case 'state':
      setWin(msg.state);
      break;

    case 'line':
      // `count` is in the protocol table but the count line lives in the title strip, not the log.
      if (msg.key === 'count') {
        if (typeof msg.n === 'number') state.others = msg.n;
        render();
        break;
      }
      if (msg.key === 'rehearsal') {
        if (state.rehearsalLine) break;
        state.rehearsalLine = true;
      }
      if (msg.key === 'left') sound.doorOut();
      append(msg.key, msg.who || 'sys');
      break;

    case 'match':
      startRoom(msg);
      break;

    case 'signal':
      if (!peer) break;
      if (msg.room && state.room && msg.room !== state.room) break;
      peer.handleSignal(msg.data);
      break;

    case 'peer':
      state.peerVideoOn = !!msg.video;
      if (!state.peerVideoOn) el.remoteVideo.srcObject = null;
      render();
      break;

    case 'countdown':
      onCountdown(msg);
      break;

    case 'close':
      onClose(msg.reason);
      break;

    default:
      break;
  }
}

function showRehearsal() {
  if (!state.rehearsalLine) {
    state.rehearsalLine = true;
    append('rehearsal', 'sys');
  }
  sound.doorIn();
  setTimeout(closeSelf, 5000);
}

function setWin(next) {
  if (next !== 'shaded' && next !== 'room' && next !== 'closing') return;
  const was = state.win;
  state.win = next;
  clearTimeout(state.lingerTimer);
  state.lingerTimer = 0;

  if (next === 'shaded') {
    // Out of a room: release everything at once, but leave the lines up for a moment
    // before the window rolls back up (the StrangerLeft board).
    if (was === 'room' || was === 'closing') {
      teardownMedia();
      render();
      state.lingerTimer = setTimeout(() => {
        state.lingerTimer = 0;
        if (state.win === 'shaded' && !state.gone) setCollapsed(true);
      }, LINGER_MS);
      return;
    }
    setCollapsed(true);
    return;
  }
  setCollapsed(state.userShaded);
}

function startRoom(msg) {
  state.room = msg.room || null;
  state.countdownSeen = false;
  el.big.hidden = true;
  if (peer) peer.close();
  resetLevels();
  state.pcState = 'new'; // a new room is a new connection, not the last one's result

  peer = new Peer({
    role: msg.role,
    room: state.room,
    iceServers: msg.iceServers || [],
    send,
    onTrack: (kind, stream) => {
      if (kind === 'audio') {
        el.remoteAudio.srcObject = stream;
        el.remoteAudio.play().catch(() => {});
        themMeter = sound.makeMeter(stream);
      } else {
        el.remoteVideo.srcObject = stream;
        state.peerVideoOn = true;
        render();
      }
    },
    onTrackGone: (kind) => {
      if (kind !== 'video') return;
      el.remoteVideo.srcObject = null;
      state.peerVideoOn = false;
      render();
    },
    onState: (s) => {
      state.pcState = s;
    },
  });

  // The knock, then the door. If the sound is blocked the notification is the knock.
  const knocked = sound.notify(UI.title, LINES.entered, { silent: false });
  sound.doorIn({ allowNotify: !knocked });

  peer.ready.then(() => {
    if (!peer) return;
    // Capture sometimes unlocks a context that had no gesture; try once more here.
    sound.resumeAudio();
    if (peer.localAudio) youMeter = sound.makeMeter(peer.localAudio);
    state.micLive = peer.micIsLive();
    render();
  });
  startTicking();
  render();
}

function onCountdown(msg) {
  if (!state.countdownSeen) {
    state.countdownSeen = true;
    append(msg.mine ? 'done_you' : 'done_them', 'sys');
  }
  el.big.hidden = false;
  el.big.textContent = String(msg.n);
  if (msg.n === 3 || msg.n === 2 || msg.n === 1) sound.knock();
}

function onClose(reason) {
  state.told = true;
  if (reason === 'done' && !state.countdownSeen) append('done_alone');
  else if (reason === 'quiet') append('quiet_claude');
  else if (reason === 'off') append('off');
  // hangup and manual say nothing; the person already knows.
  teardown();
  setTimeout(() => {
    closeSelf();
    setTimeout(() => {
      el.countText.textContent = UI.canClose;
    }, STUCK_MS);
  }, CLOSE_MS);
}

function closeSelf() {
  state.gone = true;
  try {
    window.close();
  } catch {
    // a window nobody opened by script may refuse; the count line says so
  }
}

// ---------- media teardown ----------

function teardownMedia() {
  if (peer) {
    peer.close();
    peer = null;
  }
  if (youMeter) youMeter.stop();
  if (themMeter) themMeter.stop();
  youMeter = null;
  themMeter = null;
  stopStream(el.localVideo.srcObject);
  el.localVideo.srcObject = null;
  el.remoteVideo.srcObject = null;
  el.remoteAudio.srcObject = null;
  state.micLive = false;
  state.pcState = 'closed';
  state.localVideoOn = false;
  state.peerVideoOn = false;
  state.room = null;
  paintMeter(el.meterYou, 0, -1);
  paintMeter(el.meterThem, 0, -1);
  stopTicking();
}

function teardown() {
  teardownMedia();
  clearTimeout(state.lingerTimer);
  state.lingerTimer = 0;
}

// ---------- meters and the speech gate ----------

function startTicking() {
  if (tickTimer) return;
  tickTimer = setInterval(tick, TICK_MS);
  if (!statsTimer) statsTimer = setInterval(pollStats, STATS_MS);
}

function stopTicking() {
  clearInterval(tickTimer);
  clearInterval(statsTimer);
  tickTimer = 0;
  statsTimer = 0;
  usingStats = false;
  statsLevels = { you: 0, them: 0 };
}

/** Decide once per poll whether the analyser is alive, and keep the fallback numbers warm. */
async function pollStats() {
  const ctx = sound.audioContext();
  usingStats = !ctx || ctx.state !== 'running';
  if (!usingStats || !peer) return;
  const raw = await peer.statsLevels();
  statsLevels = { you: rmsLevel(raw.you), them: rmsLevel(raw.them) };
}

function tick() {
  const now = performance.now();
  // The analyser is the real meter. When Web Audio never started, RTP levels stand in.
  const you = usingStats ? statsLevels.you : youMeter ? youMeter.level() : 0;
  const them = usingStats ? statsLevels.them : themMeter ? themMeter.level() : 0;
  paintMeter(el.meterYou, you, peakYou(litBars(you), now));
  paintMeter(el.meterThem, them, peakThem(litBars(them), now));
  const edge = speechGate(you, now);
  if (edge !== null && state.room) send({ type: 'speech', active: edge });
  if (peer && state.micLive !== peer.micIsLive()) {
    state.micLive = peer.micIsLive();
    render();
  }
}

// ---------- buttons ----------

function wireButtons() {
  el.hangup.onclick = () => {
    if (el.hangup.disabled) return;
    send({ type: 'hangup' });
  };
  el.report.onclick = () => {
    send({ type: 'report' });
  };
  el.videoBtn.onclick = async () => {
    if (el.videoBtn.disabled || !peer || state.videoBusy) return;
    state.videoBusy = true;
    try {
      await toggleVideo();
    } finally {
      state.videoBusy = false;
    }
  };
  async function toggleVideo() {
    if (state.localVideoOn) {
      peer.removeVideo();
      stopStream(el.localVideo.srcObject);
      el.localVideo.srcObject = null;
      state.localVideoOn = false;
      send({ type: 'video', on: false });
      render();
      return;
    }
    try {
      const stream = await peer.addVideo();
      if (!stream) return;
      el.localVideo.srcObject = stream;
      state.localVideoOn = true;
      send({ type: 'video', on: true });
      render();
    } catch {
      // camera refused; the button stays as it was
    }
  }
  el.sounds.onclick = () => {
    const on = sound.setSounds(!sound.soundsEnabled());
    el.soundIcon.setAttribute('data-icon', on ? 'speaker' : 'muted');
    paintIcons(el.sounds);
  };

  // The title bar widgets. The door closes by hand, which means "not this turn" (D-68).
  el.door.onclick = () => {
    send({ type: 'bye', reason: 'manual' });
    state.told = true;
    if (peer) {
      peer.close(); // the mic and camera stop now, whether or not the window manages to close
      peer = null;
    }
    closeSelf();
  };
  el.shadebox.onclick = toggleUserShade;
  el.zoom.onclick = () => {
    state.userShaded = false;
    setCollapsed(state.win === 'shaded');
  };
  el.tb.ondblclick = (ev) => {
    if (ev.target.closest('button')) return;
    toggleUserShade();
  };
  // No Enter binding here on purpose. The only button the mockup rings in this window is
  // Hang up during the goodbye, and Enter cutting the countdown short for both people is not
  // what that ring means. The ring is drawn; the key belongs to the setup page.
}

function toggleUserShade() {
  state.userShaded = !state.userShaded;
  setCollapsed(state.userShaded || state.win === 'shaded');
}

// ---------- the Phase 0 probe ----------

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const sizes = () => ({
  inner: [window.innerWidth, window.innerHeight],
  outer: [window.outerWidth, window.outerHeight],
});

async function runProbe() {
  const t0 = performance.now();
  const before = sizes();
  const audioContextState = await sound.resumeAudio();

  try {
    window.resizeTo(380, 100);
  } catch {
    // recorded below as "no change"
  }
  await wait(200);
  const at100 = sizes();
  try {
    window.resizeTo(380, 300);
  } catch {
    // same
  }
  await wait(200);
  const at300 = sizes();
  applySize(); // put the window back where this state wants it

  let micPermission = 'unknown';
  try {
    micPermission = (await navigator.permissions.query({ name: 'microphone' })).state;
  } catch {
    micPermission = 'unavailable';
  }
  let mediaStreamAutoplay = await probeMediaStreamAutoplay();
  // With the mic already allowed (the setup page did that), capture is what unlocks audio in
  // Chrome. Measure the real path once: capture, then check the context and autoplay again.
  let afterCapture = null;
  if (micPermission === 'granted') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const contextState = await sound.resumeAudio();
      const autoplay = await probeMediaStreamAutoplay();
      for (const track of stream.getTracks()) track.stop();
      afterCapture = { contextState, autoplay };
      if (autoplay.ok) mediaStreamAutoplay = autoplay;
    } catch (err) {
      afterCapture = { error: String(err) };
    }
  }

  const data = {
    hasFocus: document.hasFocus(),
    visibility: document.visibilityState,
    sizes: { before, at100, at300 },
    devicePixelRatio: window.devicePixelRatio,
    userAgent: navigator.userAgent,
    audioContextState,
    soundPath: sound.lastSoundPath(),
    notificationPermission: typeof Notification === 'undefined' ? 'unavailable' : Notification.permission,
    micPermission,
    mediaStreamAutoplay,
    afterCapture,
    selfCloseSupported: { openerNull: window.opener === null, historyLength: history.length },
    probeMode,
    timings: { loadToProbeMs: Math.round(t0), probeMs: Math.round(performance.now() - t0) },
  };
  send({ type: 'probe', data });
  if (window.__wr) window.__wr.probe = data;
  return data;
}

/** Does a MediaStream source play with no gesture? The whole of D-79 leans on this. */
async function probeMediaStreamAutoplay() {
  let osc = null;
  let node = null;
  try {
    const c = sound.audioContext();
    if (!c) return { ok: false, why: 'no AudioContext' };
    const dest = c.createMediaStreamDestination();
    osc = c.createOscillator();
    const g = c.createGain();
    g.gain.value = 0.0001;
    osc.connect(g);
    g.connect(dest);
    osc.start();
    node = document.createElement('audio');
    node.autoplay = true;
    node.playsInline = true;
    node.srcObject = dest.stream;
    document.body.appendChild(node);
    await wait(300);
    return { ok: !node.paused && node.currentTime > 0, paused: node.paused, currentTime: node.currentTime };
  } catch (err) {
    return { ok: false, error: String(err) };
  } finally {
    try {
      if (osc) osc.stop();
      if (node) {
        node.srcObject = null;
        node.remove();
      }
    } catch {
      // nothing to clean
    }
  }
}

// ---------- start ----------

function start() {
  tint();
  buildMeter(el.meterYou);
  buildMeter(el.meterThem);
  const on = sound.loadSoundPref();
  el.soundIcon.setAttribute('data-icon', on ? 'speaker' : 'muted');
  paintIcons(document);
  el.countText.textContent = countLine(0);
  wireButtons();
  render();

  window.__wr = {
    get state() { return state.win; },
    get collapsed() { return state.collapsed; },
    get others() { return state.others; },
    get pcState() { return state.pcState; },
    get micLive() { return state.micLive; },
    get room() { return state.room; },
    get told() { return state.told; },
    get greeted() { return state.greeted; },
    get soundPath() { return sound.lastSoundPath(); },
    get lines() { return state.lines.map((l) => l.text); },
    get count() { return el.countText.textContent; },
    get big() { return el.big.hidden ? null : el.big.textContent; },
    get attempts() { return state.attempts; },
    // A test seam: drop the socket the way a flaky network would, so the backoff can be exercised.
    dropSocket() { if (state.ws) state.ws.close(1000, 'test'); },
    statsLevels() { return peer ? peer.statsLevels() : Promise.resolve({ you: 0, them: 0 }); },
    probe: null,
  };

  if (!ticket) return stale();
  connect();

  // The Phase 0 probe (resizes, permissions, autoplay, user agent) runs only when asked for
  // with ?probe=1; an ordinary window measures nothing and sends nothing about the machine.
  if (probeMode) {
    setTimeout(() => {
      runProbe().catch(() => {});
    }, PROBE_AT);
    setTimeout(closeSelf, PROBE_CLOSE_MS);
  }

  const bye = () => {
    if (state.told || state.gone) return;
    send({ type: 'bye', reason: 'manual' });
  };
  window.addEventListener('pagehide', bye);
  window.addEventListener('beforeunload', bye);
}

start();
