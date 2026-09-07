'use strict';
// classify.js on its own: the five words, and the two things it must never do
// (invent an event, or copy anything out of the payload).

const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { CLASSIFY, readFixture } = require('./helpers');
const classifier = require('../scripts/classify.js');

// One row per fixture in test/fixtures: the payload, and the word it has to become.
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

test('every fixture becomes the word the protocol says', () => {
  for (const [name, event, why] of CASES) {
    const input = JSON.parse(readFixture(name));
    assert.deepStrictEqual(classifier.classify(input), { event, why }, name);
  }
});

test('a Stop with a background task is a pause, question or not', () => {
  const input = JSON.parse(readFixture('stop-background'));
  input.last_assistant_message = 'Shall I keep going?';
  assert.deepStrictEqual(classifier.classify(input), { event: 'paused', why: 'bg' });
});

test('the last line with anything on it decides the question', () => {
  const q = classifier.endsWithQuestion;
  assert.strictEqual(q('Which one?'), true);
  assert.strictEqual(q('Which one?\n\n   \n'), true, 'trailing blank and whitespace lines are not the last line');
  assert.strictEqual(q('Which one?\nI will start with the first.'), false);
  assert.strictEqual(q('Done.'), false);
  assert.strictEqual(q(''), false);
  assert.strictEqual(q(undefined), false);
  assert.strictEqual(q(null), false);
  assert.strictEqual(q({ text: 'huh?' }), false);
});

test('an event we do not handle says nothing at all', () => {
  for (const name of ['PreCompact', 'SessionStart', 'Notification', '', 'Stopped']) {
    assert.strictEqual(classifier.classify({ hook_event_name: name }), null, name);
  }
  assert.strictEqual(classifier.classify({}), null);
});

test('the session is 16 hex of the sha256 of the session id, and nothing else', () => {
  const id = '0f3c1c5e-7b0e-4c9a-9d1a-1234567890ab';
  const want = crypto.createHash('sha256').update(id).digest('hex').slice(0, 16);
  assert.strictEqual(classifier.sessionHash(id), want);
  assert.match(classifier.sessionHash(id), /^[0-9a-f]{16}$/);
  assert.match(classifier.sessionHash(undefined), /^[0-9a-f]{16}$/);
});

test('the body has five fields, in the protocol order', () => {
  const body = classifier.build(JSON.parse(readFixture('stop-question')), 'tok', 123);
  assert.deepStrictEqual(Object.keys(body), ['token', 'event', 'why', 'session', 'ts']);
  assert.strictEqual(body.token, 'tok');
  assert.strictEqual(body.ts, 123);
});

test('run as a program it prints one JSON object, or nothing', () => {
  const ok = spawnSync(process.execPath, [CLASSIFY], {
    input: readFixture('stop-question'),
    env: { ...process.env, WR_TOKEN: 'tok' },
    encoding: 'utf8',
  });
  assert.strictEqual(ok.status, 0);
  assert.strictEqual(ok.stderr, '');
  const body = JSON.parse(ok.stdout);
  assert.deepStrictEqual(Object.keys(body).sort(), ['event', 'session', 'token', 'ts', 'why']);

  for (const junk of ['', 'not json', '[]', 'null', '{"hook_event_name":"PreCompact"}']) {
    const r = spawnSync(process.execPath, [CLASSIFY], { input: junk, env: { ...process.env, WR_TOKEN: 'tok' }, encoding: 'utf8' });
    assert.strictEqual(r.status, 0, `exit 0 on ${JSON.stringify(junk)}`);
    assert.strictEqual(r.stdout, '', `silent on ${JSON.stringify(junk)}`);
    assert.strictEqual(r.stderr, '', `no stderr on ${JSON.stringify(junk)}`);
  }
});
