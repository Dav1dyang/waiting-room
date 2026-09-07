// The window's pure helpers and its small DOM painters.
// Nothing here touches document at import time, so worker/test/ui.test.js can import it in node.
// The helpers above the divider are the ones under unit test.

import { LINES, UI, countLine } from './copy.js';

// ---------- pure helpers ----------

export const LOG_MAX = 5;
export const METER_BARS = 28;
export const METER_GATE = 0.04; // Poolsuite gates at 10/255; research 09 section 3.7

/** Append one entry and drop the oldest so the log never holds more than max. */
export function pushLine(lines, entry, max = LOG_MAX) {
  const next = lines.concat([entry]);
  while (next.length > max) next.shift();
  return next;
}

/** RMS to a 0..1 level on a roughly logarithmic curve, so speech uses the middle of the meter. */
export function rmsLevel(rms) {
  if (!(rms > 0)) return 0;
  const db = 20 * Math.log10(rms);
  const level = (db + 60) / 60; // -60 dB is silence, 0 dB is full scale
  return level < 0 ? 0 : level > 1 ? 1 : level;
}

/** How many bars are lit. Below the noise gate a quiet room shows nothing, not a shimmer. */
export function litBars(level, bars = METER_BARS) {
  if (!(level > METER_GATE)) return 0;
  const n = Math.round(level * bars);
  return n < 1 ? 1 : n > bars ? bars : n;
}

/** The rising staircase from the mockup: bar i is 2px tall at the left, 10px at the right. */
export function barHeight(i, bars = METER_BARS) {
  return 2 + Math.round((i * 8) / (bars - 1));
}

/** Heights for all 28 bars: the lit run from the left, plus one held peak bar. */
export function meterHeights(level, peak = -1, bars = METER_BARS) {
  const lit = litBars(level, bars);
  const out = new Array(bars).fill(0);
  for (let i = 0; i < lit; i++) out[i] = barHeight(i, bars);
  if (peak >= lit && peak >= 0 && peak < bars) out[peak] = barHeight(peak, bars);
  return out;
}

/** Peak hold: keep the highest bar for holdMs, then fall one bar per decayMs. */
export function makePeakHold({ holdMs = 800, decayMs = 100 } = {}) {
  let peak = 0;
  let at = 0;
  return function step(lit, now) {
    if (lit >= peak) {
      peak = lit;
      at = now;
    } else if (now - at > holdMs) {
      const fallen = Math.floor((now - at - holdMs) / decayMs);
      const target = peak - fallen;
      if (target <= lit) {
        peak = lit;
        at = now;
      } else {
        return target - 1;
      }
    }
    return peak - 1;
  };
}

/**
 * The speech gate: hysteresis on the level, then a rate limit.
 * Returns true or false on a change worth sending, null otherwise.
 * At most one message every minGapMs, which is the protocol's rule for `speech`.
 */
export function makeSpeechGate({ on = 0.10, off = 0.05, minGapMs = 2000, releaseMs = 400, repeatMs = 10000 } = {}) {
  let active = false;
  let sent = false;
  let lastSentAt = -Infinity;
  let quietSince = 0;
  return function step(level, now) {
    if (level >= on) {
      active = true;
      quietSince = 0;
    } else if (level < off) {
      if (!quietSince) quietSince = now;
      if (now - quietSince >= releaseMs) active = false;
    }
    if (active === sent) {
      // Still talking: say so again now and then. The lobby drops a flag it has not heard of
      // in Q, so one long monologue with no pause would otherwise read as a quiet room.
      if (active && now - lastSentAt >= repeatMs) {
        lastSentAt = now;
        return true;
      }
      return null;
    }
    if (now - lastSentAt < minGapMs) return null;
    sent = active;
    lastSentAt = now;
    return active;
  };
}

/** Reconnect delays: 1 s, 2 s, then 4 s forever, up to maxTries attempts. */
export function backoffMs(attempt, maxTries = 10) {
  if (attempt > maxTries) return null;
  return Math.min(4000, 1000 * Math.pow(2, attempt - 1));
}

/** localStorage that survives a private window, a disabled store, or a quota error. */
export function store(key, value) {
  try {
    if (value === undefined) return window.localStorage.getItem(key);
    window.localStorage.setItem(key, value);
  } catch {
    return null;
  }
  return value;
}

// ---------- DOM painters ----------

/** Build the 28 bars once. */
export function buildMeter(el, bars = METER_BARS) {
  el.textContent = '';
  for (let i = 0; i < bars; i++) el.appendChild(document.createElement('i'));
  return el;
}

/** Set the bar heights. Transition lives in CSS at 0.1 s, no JS smoothing. */
export function paintMeter(el, level, peak) {
  const heights = meterHeights(level, peak);
  const bars = el.children;
  for (let i = 0; i < bars.length; i++) {
    const h = heights[i] + 'px';
    if (bars[i].style.height !== h) bars[i].style.height = h;
  }
}

/** One log line as an element. Newest carries the yellow highlight. */
export function lineEl(entry, newest) {
  const p = document.createElement('p');
  if (entry.who === 'you' || entry.who === 'them') {
    p.className = newest ? 'say hi' : 'say';
    const b = document.createElement('b');
    b.textContent = (entry.who === 'you' ? UI.you : UI.them) + ':';
    p.appendChild(b);
    p.appendChild(document.createTextNode(' ' + entry.text));
  } else {
    p.className = (entry.who === 'soft' ? 'sys soft' : 'sys') + (newest ? ' hi' : '');
    p.textContent = entry.text;
  }
  return p;
}

/** Redraw the whole log; five lines is cheap and it keeps the highlight honest. */
export function paintLog(el, lines) {
  el.textContent = '';
  lines.forEach((entry, i) => el.appendChild(lineEl(entry, i === lines.length - 1)));
}

/** The decorative scroll thumb; the log never scrolls, it drops its oldest line. */
export function paintThumb(el, count, max = LOG_MAX) {
  const travel = 40;
  const top = 16 + Math.round((Math.min(count, max) / max) * travel);
  el.style.top = top + 'px';
}

/** The count line: watch while queued, person in a room, hollow dot or red live dot. */
export function paintCount(els, { others, inRoom, micLive }) {
  els.lead.setAttribute('data-icon', inRoom ? 'person' : 'watch');
  els.mark.className = micLive ? 'live' : 'dot';
  els.text.textContent = countLine(others);
}

/** Look up a protocol line key. Unknown keys render as the key, which is honest and visible. */
export function textFor(key) {
  return LINES[key] || key;
}
