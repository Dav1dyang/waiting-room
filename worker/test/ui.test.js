// The window's pure helpers. Nothing here touches a DOM, so plain node runs it.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  LOG_MAX, METER_BARS, backoffMs, barHeight, litBars, makePeakHold, makeSpeechGate,
  meterHeights, pushLine, rmsLevel, textFor,
} from '../public/ui.js';
import { countLine, LINES } from '../public/copy.js';

test('the log holds five lines and drops the oldest', () => {
  let lines = [];
  for (let i = 1; i <= 7; i++) lines = pushLine(lines, { who: 'sys', text: 'line ' + i });
  assert.equal(lines.length, LOG_MAX);
  assert.equal(lines[0].text, 'line 3');
  assert.equal(lines[4].text, 'line 7');
});

test('pushLine does not mutate the array it was given', () => {
  const before = [{ who: 'sys', text: 'a' }];
  const after = pushLine(before, { who: 'sys', text: 'b' });
  assert.equal(before.length, 1);
  assert.equal(after.length, 2);
});

test('the meter gate keeps a quiet room at zero bars', () => {
  assert.equal(litBars(0), 0);
  assert.equal(litBars(0.03), 0);
  assert.equal(litBars(0.04), 0); // the gate is exclusive: 4% is still silence
  assert.equal(litBars(0.05), 1);
});

test('meter quantisation is a lit run from the left', () => {
  assert.equal(litBars(0.5), 14);
  assert.equal(litBars(1), METER_BARS);
  assert.equal(litBars(9), METER_BARS); // clamped
  const h = meterHeights(0.5);
  assert.equal(h.length, METER_BARS);
  assert.ok(h.slice(0, 14).every((v) => v > 0));
  assert.ok(h.slice(14).every((v) => v === 0));
});

test('bar heights rise from 2px to 10px across the meter', () => {
  assert.equal(barHeight(0), 2);
  assert.equal(barHeight(METER_BARS - 1), 10);
});

test('the held peak lights one bar past the run', () => {
  const h = meterHeights(0.2, 20);
  assert.equal(h[20], barHeight(20));
  assert.equal(h[19], 0);
  // a peak inside the lit run is not drawn twice
  const inside = meterHeights(0.9, 3);
  assert.ok(inside[3] > 0);
});

test('peak hold rises at once and falls one bar per 100 ms after 800 ms', () => {
  const peak = makePeakHold({ holdMs: 800, decayMs: 100 });
  assert.equal(peak(20, 0), 19);
  assert.equal(peak(2, 100), 19); // held
  assert.equal(peak(2, 800), 19); // still inside the hold
  assert.equal(peak(2, 1000), 17); // two bars gone
  assert.equal(peak(2, 3000), 1); // fallen back to the run
});

test('rms maps to a level on a log curve and clamps', () => {
  assert.equal(rmsLevel(0), 0);
  assert.equal(rmsLevel(-1), 0);
  assert.equal(rmsLevel(1), 1);
  assert.ok(rmsLevel(0.001) < 0.05); // -60 dB is the floor
  const mid = rmsLevel(0.03);
  assert.ok(mid > 0.35 && mid < 0.55);
});

test('the speech gate is edge triggered and never faster than one message per 2 s', () => {
  const gate = makeSpeechGate({ on: 0.1, off: 0.05, minGapMs: 2000, releaseMs: 1500 });
  assert.equal(gate(0.0, 0), null); // silence at the start says nothing
  assert.equal(gate(0.5, 10), true); // speech starts
  assert.equal(gate(0.5, 20), null); // no repeats while it holds
  assert.equal(gate(0.0, 100), null); // inside the release window
  assert.equal(gate(0.0, 1600), null); // released, but inside the 2 s rate limit
  assert.equal(gate(0.0, 2100), false); // and now the off edge goes out
  assert.equal(gate(0.0, 3000), null);
});

test('the speech gate has hysteresis: a dip between words does not drop it', () => {
  const gate = makeSpeechGate({ on: 0.1, off: 0.05, minGapMs: 2000, releaseMs: 1500 });
  assert.equal(gate(0.5, 0), true);
  assert.equal(gate(0.07, 500), null); // between on and off: still speaking
  assert.equal(gate(0.5, 1000), null); // back up, no new message
  assert.equal(gate(0.07, 5000), null); // a long stretch in the dead band stays on
});

test('the speech gate reports off after about 1.5 s of real silence', () => {
  const gate = makeSpeechGate({ on: 0.1, off: 0.05, minGapMs: 2000, releaseMs: 1500 });
  gate(0.5, 0);
  gate(0.0, 100); // silence starts here, and the release counts from here
  assert.equal(gate(0.0, 1000), null);
  assert.equal(gate(0.0, 1700), null); // released at 1600 ms, but inside the 2 s rate limit
  assert.equal(gate(0.0, 2100), false);
});

test('reconnect backs off 1, 2, then 4 seconds and gives up after ten tries', () => {
  assert.equal(backoffMs(1), 1000);
  assert.equal(backoffMs(2), 2000);
  assert.equal(backoffMs(3), 4000);
  assert.equal(backoffMs(9), 4000);
  assert.equal(backoffMs(10), 4000);
  assert.equal(backoffMs(11), null);
});

test('every protocol line key has copy', () => {
  const keys = ['entered', 'hear', 'brb', 'back', 'done_you', 'done_them', 'left', 'requeued',
    'video_on', 'quiet_claude', 'quiet_room', 'time_up', 'reported', 'rehearsal', 'done_alone', 'off'];
  for (const k of keys) {
    assert.equal(typeof LINES[k], 'string', k);
    assert.equal(textFor(k), LINES[k]);
  }
  assert.equal(textFor('nosuchkey'), 'nosuchkey');
});

test('the count line always means other people', () => {
  assert.equal(countLine(0), 'Nobody else is waiting right now. Your Claude is still working.');
  assert.equal(countLine(1), '1 other is waiting for their Claude.');
  assert.equal(countLine(4), '4 others are waiting for their Claude.');
});
