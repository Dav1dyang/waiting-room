// The setup page: one normal tab, visited once (D-46).
// Five things to allow or choose, the rules, the honest count, and a Done button.

import { SETUP, TINTS, UI, countLine } from './copy.js';
import { paintIcons } from './icons.js';
import { store } from './ui.js';
import * as sound from './audio.js';
import { stopStream } from './rtc.js';

const TINT_DEFAULT = TINTS[0][1];
const token = new URLSearchParams(location.search).get('t') || '';

const el = {};
for (const id of ['win', 'setupBody', 'intro', 'title', 'rules', 'tints', 'countText', 'statusLine',
  'cbMic', 'micHead', 'micSub', 'micBtn',
  'cbNotif', 'notifHead', 'notifSub', 'notifBtn',
  'cbSound', 'soundHead', 'soundSub', 'soundBtn',
  'cbRehearse', 'rehearseHead', 'rehearseSub', 'rehearseBtn',
  'tintHead', 'doneBtn']) {
  el[id] = document.getElementById(id);
}

function tint(hex) {
  document.body.style.background = hex;
  document.documentElement.style.setProperty('--desk', hex);
}

function check(node, on) {
  node.classList.toggle('on', !!on);
}

function say(text) {
  el.statusLine.textContent = text;
}

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

function fillCopy() {
  el.title.textContent = UI.setupTitle;
  el.intro.textContent = SETUP.intro;
  el.micHead.textContent = SETUP.mic;
  el.micSub.textContent = SETUP.micSub;
  el.micBtn.textContent = SETUP.micBtn;
  el.notifHead.textContent = SETUP.notif;
  el.notifSub.textContent = SETUP.notifSub;
  el.notifBtn.textContent = SETUP.notifBtn;
  el.soundHead.textContent = SETUP.sound;
  el.soundSub.textContent = SETUP.soundSub;
  el.soundBtn.textContent = SETUP.soundBtn;
  el.rehearseHead.textContent = SETUP.rehearsal;
  el.rehearseSub.textContent = SETUP.rehearsalSub;
  el.rehearseBtn.textContent = SETUP.rehearsalBtn;
  el.tintHead.textContent = SETUP.tint;
  el.rules.textContent = SETUP.rules;
  el.doneBtn.textContent = SETUP.done;
  el.countText.textContent = SETUP.nobody;
}

function buildTints() {
  const chosen = store('wr-tint') || TINT_DEFAULT;
  el.tints.textContent = '';
  for (const [name, hex] of TINTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'radio';
    b.dataset.hex = hex;
    const dot = document.createElement('i');
    if (hex === chosen) dot.className = 'on';
    const swatch = document.createElement('b');
    swatch.style.background = hex;
    b.append(dot, swatch, document.createTextNode(name));
    b.onclick = () => {
      store('wr-tint', hex);
      tint(hex);
      for (const other of el.tints.querySelectorAll('.radio i')) {
        other.className = other.parentElement.dataset.hex === hex ? 'on' : '';
      }
    };
    el.tints.appendChild(b);
  }
  tint(chosen);
}

/** Mic: ask, then let go at once. It turns on only when a stranger enters (D-57). */
async function askMic() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stopStream(stream);
  } catch {
    // denied or no device; the permission read below tells the truth
  }
  await readMic();
}

async function readMic() {
  let granted = false;
  try {
    const st = await navigator.permissions.query({ name: 'microphone' });
    granted = st.state === 'granted';
  } catch {
    granted = false;
  }
  check(el.cbMic, granted);
  return granted;
}

async function askNotifications() {
  try {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    check(el.cbNotif, perm === 'granted');
  } catch {
    check(el.cbNotif, false);
  }
}

async function loadCount() {
  const res = await fetch('/api/count?t=' + encodeURIComponent(token));
  return res.json();
}

/** A bad or unknown token: one line, nothing else. */
function badToken() {
  el.setupBody.textContent = '';
  const p = document.createElement('p');
  p.className = 'intro';
  p.textContent = SETUP.badToken;
  el.setupBody.appendChild(p);
}

async function start() {
  fillCopy();
  paintIcons(document);
  buildTints();
  sound.loadSoundPref();

  el.micBtn.onclick = askMic;
  el.notifBtn.onclick = askNotifications;
  el.soundBtn.onclick = async () => {
    const path = await sound.doorIn({ allowNotify: false });
    check(el.cbSound, path === 'audio');
    if (path !== 'audio') say('The browser would not let that play. Click again.');
  };
  el.rehearseBtn.onclick = async () => {
    try {
      const res = await post('/api/rehearse', { token });
      if (res && res.ok) {
        check(el.cbRehearse, true);
        say(SETUP.rehearsalArmed);
      } else {
        say(SETUP.badToken);
      }
    } catch {
      say(SETUP.badToken);
    }
  };
  el.doneBtn.onclick = () => say(SETUP.closeTab);

  // Enter presses the one default button the mockup marks.
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') el.rehearseBtn.click();
  });

  if (typeof Notification !== 'undefined') check(el.cbNotif, Notification.permission === 'granted');
  readMic();

  let info = null;
  try {
    info = await loadCount();
  } catch {
    info = null;
  }
  if (!info || !info.enabled) return badToken();
  el.countText.textContent = info.count > 0 ? countLine(info.count) : SETUP.nobody;

  window.__wrSetup = { enabled: true, count: info.count };
}

start();
