'use strict';
// Shared plumbing for the plugin tests: a throwaway HOME, a throwaway state directory,
// and one way to run the two shell scripts.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const PLUGIN = path.join(__dirname, '..');
const SIGNAL = path.join(PLUGIN, 'scripts', 'signal.sh');
const TOGGLE = path.join(PLUGIN, 'scripts', 'toggle.sh');
const CLASSIFY = path.join(PLUGIN, 'scripts', 'classify.js');
const FIXTURES = path.join(__dirname, 'fixtures');

const TOKEN = 'abcdefghij0123456789';

/** A temporary HOME, so ~/.waiting-room is a directory we can throw away. */
function makeHome({ enabled = true, token = TOKEN, invite = null, endpoint = null } = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'waiting-room-test-'));
  const dir = path.join(home, '.waiting-room');
  fs.mkdirSync(dir);
  if (token !== null) fs.writeFileSync(path.join(dir, 'token'), token);
  if (enabled) fs.writeFileSync(path.join(dir, 'enabled'), '');
  if (invite !== null) fs.writeFileSync(path.join(dir, 'invite'), invite);
  if (endpoint !== null) fs.writeFileSync(path.join(dir, 'endpoint'), endpoint);
  return { home, dir };
}

function removeHome(home) {
  fs.rmSync(home, { recursive: true, force: true });
}

/** A capture script standing in for Chrome. It appends every URL it is handed. */
function makeOpener(home) {
  const log = path.join(home, 'opened.txt');
  const script = path.join(home, 'open.sh');
  fs.writeFileSync(script, `#!/bin/sh\nprintf '%s\\n' "$1" >> ${JSON.stringify(log)}\n`);
  fs.chmodSync(script, 0o755);
  return { script, log, lines: () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []) };
}

/** A small, explicit environment. The test machine's own settings must never leak in. */
function env(home, extra = {}) {
  const out = { PATH: process.env.PATH, HOME: home, LANG: 'C' };
  for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== null) out[k] = v;
  return out;
}

function readFixture(name) {
  return fs.readFileSync(path.join(FIXTURES, `${name}.json`), 'utf8');
}

// Everything below is asynchronous on purpose. The fake lobby answers from this very
// process, so a blocking spawnSync would deadlock: the script waits for a reply that the
// blocked event loop can never send.

/** Run a script, feed it stdin, and resolve with {status, stdout, stderr}. */
function run(command, args, input, home, extraEnv) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { env: env(home, extraEnv), stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (c) => { stdout += c; });
    child.stderr.on('data', (c) => { stderr += c; });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
    child.stdin.on('error', () => {});
    child.stdin.end(input === undefined ? '' : input);
  });
}

/** Run signal.sh with a hook payload on stdin. */
function runSignal(input, home, extraEnv = {}) {
  return run('bash', [SIGNAL], input, home, extraEnv);
}

/** Run toggle.sh: on, off or status. */
function runToggle(args, home, extraEnv = {}) {
  return run('bash', [TOGGLE, ...args], '', home, extraEnv);
}

/** Wait until a condition holds, or give up. Used where a background job does the work. */
async function until(check, ms = 4000) {
  const stop = Date.now() + ms;
  for (;;) {
    if (check()) return true;
    if (Date.now() > stop) return false;
    await new Promise((r) => setTimeout(r, 25));
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = {
  PLUGIN, SIGNAL, TOGGLE, CLASSIFY, FIXTURES, TOKEN,
  makeHome, removeHome, makeOpener, env, readFixture,
  run, runSignal, runToggle, until, sleep,
};
