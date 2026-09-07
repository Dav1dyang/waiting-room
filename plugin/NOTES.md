# plugin/NOTES.md

Build notes for the machine half of waiting-room. Written 2026-09-06 for the lead.

## What is here

```
plugin/
  .claude-plugin/plugin.json   manifest, version 0.3.0
  hooks/hooks.json             eight events, all async, all one script
  commands/on.md off.md status.md
  scripts/config.sh            state dir, endpoint precedence, token, opener
  scripts/classify.js          hook payload in, one of five words out
  scripts/signal.sh            the hook: POST, then maybe open a window
  scripts/toggle.sh            the three commands, all copy in one say()
  test/                        fake lobby, helpers, three test files, run.sh
  README.md
.claude-plugin/marketplace.json (repo root)
```

`prototype/` is gone (`git rm -r prototype`, staged, not committed, as asked).

## The shape of things

**hooks.json** is eight identical entries, one per event: `UserPromptSubmit`, `Stop`,
`StopFailure`, `SessionEnd`, `Elicitation`, `PermissionRequest`, `PreToolUse`,
`PostToolUse`. All exec form (`"command": "bash"`, `"args": ["${CLAUDE_PLUGIN_ROOT}/scripts/signal.sh"]`),
all `"async": true`. Research 02 section 2.3 says exec form is the documented choice
whenever a hook references a path placeholder, so the prototype's one shell-form entry
(`Elicitation`) is now the same as the rest.

**classify.js** is a module with a `main`. The tests import it for the table of words and
also run it as a program for the stdin behavior. An event it does not recognize prints
nothing, so signal.sh sends nothing. Notably it does **not** fall back to `tick`: a stray
tick would resume a paused task in the lobby.

**signal.sh** exits 0 on every path and prints nothing anywhere. Off is the cheap path:
drain stdin, exit, measured at 12 ms. On with a lobby that answers is 87 ms. On with a
lobby that does not resolve is 89 ms. A lobby that accepts and never answers costs the
full `-m 3`.

**The lock.** The prototype's staleness check was `find "$LOCK" -maxdepth 0 -mmin +0.5`.
BSD `find` rounds the age up to the next whole minute before comparing, so a lock one
second old already counts as older than half a minute: the check fired every time and the
lock protected nothing. It is now an mtime read through node, which is exact and behaves
the same on macOS and Linux. Held 5 s after the open, cleared after 30 s.

**Copy.** Every user-visible string in toggle.sh is a case in `say()`, near the top of the
file. Nothing else in the plugin prints. There are no em dashes anywhere in `plugin/` or
`.claude-plugin/`, and one test greps the actual command output for them.

**Two small hardenings** beyond the brief, both tested:

- The `open` URL must start with `http://` or `https://`, so a broken lobby cannot hand
  `file:///...` or a shell fragment to the opener.
- An invite code is filtered to `[A-Za-z0-9._-]` and capped at 64 characters before it
  goes into the register JSON, so `$ARGUMENTS` cannot become shell or JSON.

## Verified

`bash plugin/test/run.sh` and `node --test plugin/test/*.test.js`, both 32 of 32:

```
# tests 32
# suites 0
# pass 32
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 10206.342292
```

What those cover: all eleven fixtures to the exact `event` and `why`; a body with exactly
the keys `token, event, why, session, ts`; a 16 hex session that equals sha256 of the
fixture's session id; nothing on stdout or stderr on any path; off means no request; no
token means no request; garbage stdin and unhandled events mean no request; the endpoint
file works and the environment beats it; an unreachable lobby returns in under 4 s with
exit 0 (both a hanging lobby and a black hole address); an `open` reply runs
`WAITING_ROOM_OPEN_CMD` exactly once, including two `signal.sh` racing; a held lock keeps
a second window shut; a 60 s old lock is cleared; a lobby answering nonsense never reaches
the opener. The privacy test greps the raw POST bytes for thirteen strings out of the
fixtures (the prompt, the cwd, `rm -rf build`, the transcript path, the raw session id and
so on), because a key-set check alone would still pass if something leaked inside `why`.
toggle.sh is checked line for line for on, on again, all three count lines, a rejected
invite, an unreachable lobby, off, off with the lobby down, status on, status off, status
unreachable, and status against a lobby talking nonsense.

Validators, all clean (note that pointing the validator at the plugin root checks the
manifest only, so the command frontmatter needs its own run):

```
$ claude plugin validate --strict plugin
Validating plugin manifest: /Users/davidyang/Documents/GitHub/waiting-room/plugin/.claude-plugin/plugin.json

✔ Validation passed

$ claude plugin validate --strict .
Validating marketplace manifest: /Users/davidyang/Documents/GitHub/waiting-room/.claude-plugin/marketplace.json

✔ Validation passed

$ claude plugin validate --strict plugin/commands
Validating components in: /Users/davidyang/Documents/GitHub/waiting-room/plugin/commands

✔ Validation passed
```

Claude Code 2.1.263, node 22.19.0, curl 8.7.1, macOS 25.6.

**A real session.** I ran a throwaway logging lobby on 127.0.0.1:8799 and a real headless
Claude with the plugin loaded:

```
claude --plugin-dir ./plugin -p 'Run exactly one bash command: echo hello. Then say done.' --allowedTools 'Bash(echo:*)'
```

The lobby saw, in order:

```
POST /api/register {"token":"...","invite":"DUCK"}
POST /api/hook {"token":"...","event":"started","why":null,"session":"e660e284e816efab","ts":...}
POST /api/hook {"token":"...","event":"tick",...}      PreToolUse
POST /api/hook {"token":"...","event":"tick",...}      PostToolUse
POST /api/hook {"token":"...","event":"stopped",...}   Stop
POST /api/hook {"token":"...","event":"stopped",...}   SessionEnd
```

A second run with the lobby answering `{"open": ...}` to both ticks opened exactly one
window, so the lock holds across two real hook processes and the background subshell
survives `claude -p` teardown. `on`, `status` and `off` were exercised live against the
same lobby. `~/.waiting-room` did not exist before this and does not exist now; the whole
test was cleaned up.

**The slash commands, through Claude Code.** `claude --plugin-dir ./plugin -p "/waiting-room:status"`
printed exactly:

```
waiting-room is off.
(lobby not reachable)
```

So the `!` inline-bash form expands `${CLAUDE_PLUGIN_ROOT}`, the `allowed-tools` scope
lets it run, and Claude relays the lines and adds nothing. I dropped the prototype's
`## waiting-room` heading from the three command bodies: Claude was relaying that too, and
"verbatim, nothing else" should mean nothing else. `status` writes no state, so this left
`~/.waiting-room` absent.

**Against the real lobby core.** Your `worker/scripts/mock-lobby.js` happened to be
running on 8788 with `INVITES` set, so I pointed the real scripts at it. `on WRONG`
printed one line ("That invite code did not work.") and left the machine off; `on DUCK`
registered and printed the setup URL the lobby minted; hook POSTs were accepted. So the
route names and the field names match what `lobby-core.js` expects, not just what my fake
expects. Your lobby went away partway through, which is why the open-past-T check below
is still open, and which `status` reported as "(lobby not reachable)", correctly.

## Not verified

- **A marketplace install.** Everything above used `--plugin-dir`. `claude plugin
  marketplace add Dav1dyang/waiting-room` needs the repo pushed with `.claude-plugin/marketplace.json`
  on the default branch. The manifest validates, but the round trip is untested, and there
  is no git remote on this checkout yet.
- **An `open` from the real lobby core.** The open path is tested against my fake lobby
  and against a live headless Claude, but `mock-lobby.js` shut down before a task of mine
  crossed T, so a ticket minted by `lobby-core.js` has never actually reached
  `signal.sh`. Worth one minute of Phase 0: `INVITES=DUCK T=2000 node scripts/mock-lobby.js`,
  `/waiting-room:on DUCK`, then any prompt that lasts a few seconds.
- **`Elicitation` and `PermissionRequest` in the wild.** Both are covered by fixtures and
  by hooks.json, but a headless run never produced one. Phase 0 should confirm they fire
  and land as `needs_you`.
- **`StopFailure`.** Same: fixture yes, real API error no.
- **The real endpoint.** `DEFAULT_ENDPOINT` in `scripts/config.sh` is still
  the deployed lobby (filled in after the first deploy).
- **Chrome.** `WAITING_ROOM_OPEN_CMD` stood in for the browser everywhere, so the actual
  `open -g -na "Google Chrome" --args --app=...` was never fired here. Research 08 says it
  works; Phase 0 test 3 is where it gets decided.
- **Windows and Linux.** The opener is macOS `open`. Everything else is portable.

## For the lead

1. **`/api/count` returns the wrong number for the terminal.** PROTOCOL section 9 says
   "the terminal's `status` shows the same count" as the window's `others`, but the lobby
   answers `count()`, which is `waiting().length` and includes you when you are waiting.
   `status` renders whatever number arrives with the "N others" grammar, so it can say
   "1 other is waiting" when that one is you. The fix is a line in the lobby:
   `count` on `/api/count?t=TOKEN` and in the register reply could be `othersFor(token)`.
   Want me to leave it, or should the plugin subtract one when the lobby says
   `enabled: true`? Subtracting on this side would be a guess.
2. **`register` is enable.** The plugin writes the `enabled` flag only after `ok: true`,
   and `off` removes the flag even when the POST fails, so a lobby that is down can never
   leave a machine stuck on. The lobby's own `enabled` field is not consulted.
3. **Timeouts.** The hook uses `-m 3 --connect-timeout 1`, as specified. `toggle.sh` uses
   `-m 5 --connect-timeout 3`, since a person is standing there watching it. Say if you
   want those the same.
4. **Version.** `plugin.json` is 0.3.0 (the prototype was 0.2.0) and
   `marketplace.json` repeats it. They have to be bumped together, or installs will not
   see updates.
5. **The root `README.md` still points at `prototype/plugin/`.** I did not touch it, since
   docs are not mine.
6. **One line you did not ask for.** `say refused` ("The lobby turned that down. Ask
   whoever gave you the invite code.") covers an `ok:false` that is not an invite problem,
   such as the lobby's `error: "token"`. Saying "not reachable" there would have been a
   lie. Cut it if you would rather have three states than four.
7. **The rehearsal.** `POST /api/rehearse` is in the protocol and the setup page calls it,
   so the plugin has no command for it. Say if you want `/waiting-room:test`.
