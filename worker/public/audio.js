// Three cues, synthesized with Web Audio, no files (D-60).
// The door in when a stranger enters, the door out when one leaves, the knock on the countdown.
// A fresh app window has no user gesture, so the AudioContext may refuse to start. When it does,
// we knock through a macOS notification instead, and we record which path ran for the probe.

import { LINES, UI } from './copy.js';
import { rmsLevel, store } from './ui.js';

let ctx = null;
let zero = null;
let enabled = true;
let lastPath = 'none'; // 'audio', 'notification', or 'blocked'

const SOUND_KEY = 'wr-sounds';

/** Read the persisted preference. Defaults to on. */
export function loadSoundPref() {
  enabled = store(SOUND_KEY) !== '0';
  return enabled;
}

export function soundsEnabled() {
  return enabled;
}

export function setSounds(on) {
  enabled = !!on;
  store(SOUND_KEY, enabled ? '1' : '0');
  return enabled;
}

export function lastSoundPath() {
  return lastPath;
}

/** One shared context, created on demand so nothing exists until a sound is wanted. */
export function audioContext() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    zero = ctx.createGain();
    zero.gain.value = 0;
    zero.connect(ctx.destination);
  }
  return ctx;
}

/** A silent sink, so an analyser is always pulled even when nothing is audible. */
export function silentSink() {
  audioContext();
  return zero;
}

export async function resumeAudio() {
  const c = audioContext();
  if (!c) return 'missing';
  if (c.state === 'suspended') {
    try {
      await c.resume();
    } catch {
      // no gesture yet; the caller falls back
    }
  }
  return c.state;
}

/** Schedule one short tone. */
function tone(c, at, { freq, dur, gain, type = 'triangle', slide = 0 }) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

const CUES = {
  // Two short rising tones. The one cue that has to cut through a terminal.
  doorIn: (c, t) => {
    tone(c, t, { freq: 587.33, dur: 0.10, gain: 0.30 });
    tone(c, t + 0.11, { freq: 880.0, dur: 0.14, gain: 0.30 });
  },
  // The same voice going down, softer.
  doorOut: (c, t) => {
    tone(c, t, { freq: 493.88, dur: 0.09, gain: 0.16 });
    tone(c, t + 0.09, { freq: 329.63, dur: 0.13, gain: 0.16 });
  },
  // Three clicks: a knuckle on a door, not a chime.
  knock: (c, t) => {
    for (let i = 0; i < 3; i++) {
      tone(c, t + i * 0.085, { freq: 190, dur: 0.035, gain: 0.22, type: 'square', slide: -60 });
    }
  },
};

/**
 * Play a cue. Returns the path that ran: 'audio', 'notification', 'blocked' or 'off'.
 * The notification fallback is not silent, so something still knocks (D-79 fallback).
 */
export async function play(name, { notifyBody = '', allowNotify = true } = {}) {
  if (!enabled) {
    lastPath = 'off';
    return lastPath;
  }
  const c = audioContext();
  if (c) {
    const state = await resumeAudio();
    if (state === 'running') {
      try {
        CUES[name](c, c.currentTime + 0.02);
        lastPath = 'audio';
        return lastPath;
      } catch {
        // fall through to the notification
      }
    }
  }
  if (allowNotify && notify(UI.title, notifyBody || LINES.entered, { silent: false })) {
    lastPath = 'notification';
    return lastPath;
  }
  lastPath = 'blocked';
  return lastPath;
}

export const doorIn = (o) => play('doorIn', { notifyBody: LINES.entered, ...o });
export const doorOut = (o) => play('doorOut', { notifyBody: LINES.left, allowNotify: false, ...o });
export const knock = (o) => play('knock', { notifyBody: LINES.done_you, allowNotify: false, ...o });

/** A macOS notification, when permission is already granted. Never asks here. */
export function notify(title, body, opts = {}) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
    const n = new Notification(title, { body, ...opts });
    setTimeout(() => {
      try {
        n.close();
      } catch {
        // already gone
      }
    }, 6000);
    return true;
  } catch {
    return false;
  }
}

/**
 * An RMS meter on one MediaStream. The analyser also runs into a zero gain node so the
 * graph is always pulled, which Chrome needs for a stream it is not otherwise playing.
 */
export function makeMeter(stream) {
  const c = audioContext();
  if (!c || !stream || stream.getAudioTracks().length === 0) {
    return { level: () => 0, stop: () => {} };
  }
  let src;
  try {
    src = c.createMediaStreamSource(stream);
  } catch {
    return { level: () => 0, stop: () => {} };
  }
  const an = c.createAnalyser();
  an.fftSize = 512;
  an.smoothingTimeConstant = 0.2;
  src.connect(an);
  an.connect(silentSink());
  const buf = new Uint8Array(an.fftSize);
  let stopped = false;
  return {
    level() {
      if (stopped) return 0;
      an.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      return rmsLevel(Math.sqrt(sum / buf.length));
    },
    stop() {
      stopped = true;
      try {
        src.disconnect();
        an.disconnect();
      } catch {
        // already torn down
      }
    },
  };
}
