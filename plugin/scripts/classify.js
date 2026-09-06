#!/usr/bin/env node
// One Claude Code hook payload in, one of the five words out (docs/PROTOCOL.md section 3).
//
// Reads the hook JSON on stdin and writes {token, event, why, session, ts} on stdout.
// Nothing else from the input is ever written: no prompt, no cwd, no transcript path,
// no tool input, no assistant message. That is decision D-30, and the tests check the
// bytes, not just the key names.
//
// An event we do not handle prints nothing at all, so the caller sends nothing at all.
'use strict';

const crypto = require('node:crypto');

/** The five words. Returns null when this event is none of our business. */
function classify(input) {
  const name = typeof input.hook_event_name === 'string' ? input.hook_event_name : '';
  switch (name) {
    case 'UserPromptSubmit':
      return { event: 'started', why: null };
    case 'PostToolUse':
      return { event: 'tick', why: null };
    case 'PreToolUse':
      // A structured question is Claude waiting on you. Every other tool is a heartbeat.
      return input.tool_name === 'AskUserQuestion'
        ? { event: 'needs_you', why: null }
        : { event: 'tick', why: null };
    case 'PermissionRequest':
    case 'Elicitation':
      return { event: 'needs_you', why: null };
    case 'StopFailure':
    case 'SessionEnd':
      return { event: 'stopped', why: null };
    case 'Stop': {
      // A background task will wake Claude up, so the turn is a pause, not an ending.
      const bg = Array.isArray(input.background_tasks) && input.background_tasks.length > 0;
      if (bg) return { event: 'paused', why: 'bg' };
      // A turn that ends with a question usually means you are about to answer it.
      if (endsWithQuestion(input.last_assistant_message)) return { event: 'paused', why: 'question' };
      return { event: 'stopped', why: null };
    }
    default:
      return null;
  }
}

/** The last line with anything on it decides. A trailing "?" means Claude asked you something. */
function endsWithQuestion(message) {
  if (typeof message !== 'string') return false;
  const lines = message.split('\n').map((line) => line.trim()).filter(Boolean);
  const last = lines.length > 0 ? lines[lines.length - 1] : '';
  return /\?$/.test(last);
}

/** The session id never leaves the machine; the lobby only ever sees 16 hex of its hash. */
function sessionHash(id) {
  const text = id === undefined || id === null ? '' : String(id);
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/** The whole POST body, or null when there is nothing to say. */
function build(input, token, now) {
  const verdict = classify(input);
  if (!verdict) return null;
  return {
    token: token,
    event: verdict.event,
    why: verdict.why,
    session: sessionHash(input.session_id),
    ts: now,
  };
}

module.exports = { classify, endsWithQuestion, sessionHash, build };

if (require.main === module) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('error', () => process.exit(0));
  process.stdin.on('data', (chunk) => { raw += chunk; });
  process.stdin.on('end', () => {
    let input = null;
    try {
      input = JSON.parse(raw);
    } catch (e) {
      process.exit(0);
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) process.exit(0);
    const body = build(input, process.env.WR_TOKEN || '', Date.now());
    if (body) process.stdout.write(JSON.stringify(body));
  });
}
