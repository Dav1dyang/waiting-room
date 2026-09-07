# waiting-room

A Claude Code plugin. While your Claude works for more than 15 seconds, a small window opens behind your terminal and puts you on an audio call with a stranger whose Claude is also working. It closes itself with a five-second countdown when either Claude finishes. Every wait, a different stranger. The stranger never learns anything about your task.

Status, 2026-09-06: the alpha is built, tested, and the lobby is live on workers.dev. Invite only.

## Try it

```
claude --plugin-dir ./plugin          # or install it, see plugin/README.md
/waiting-room:on <invite code>        # prints the rules, opens the setup page once
```

The setup page opens in the plugin's own Chrome window: allow the microphone ("on every visit") and notifications, play the door, pick a tint, then arm a test window and send Claude any message. From then on, give Claude something that takes a while.

```
/waiting-room:status                  # on or off, and how many others are waiting
/waiting-room:off                     # stops everything and closes any window
```

## What leaves your machine

One small POST per hook: your token, one of five words (`started`, `tick`, `needs_you`, `paused`, `stopped`), why, a hash of the session id, and a timestamp. Nothing else. The classifier runs on your machine (`plugin/scripts/classify.js`) and the tests check that no prompt, path, or tool input ever reaches the body.

## Map

| Path | What it is |
| --- | --- |
| `plugin/` | The Claude Code plugin: eight async hooks, three commands, the classifier, the window opener, 36 tests. `plugin/README.md` for install and uninstall. |
| `worker/` | The lobby: one Cloudflare Worker, one Durable Object, the pure state machine in `src/lobby-core.js`, the room and setup pages in `public/`, 59 unit and integration tests, 10 Playwright end-to-end cases. `worker/README.md` for deploy. |
| `scripts/probe-mac.sh` | Opens one real room window through the real path and reads back what it measured. |
| `docs/PROTOCOL.md` | The contract between plugin, lobby, and window: routes, messages, numbers, states. |
| `docs/PHASE0.md` | What was measured on a Mac, and the ten-minute checklist that is left. |
| `docs/index.html` | The plan, v0.6. Older plans in `docs/archive/`. |
| `docs/DECISIONS.md`, `docs/CHANGELOG.md`, `docs/QUESTIONS.md` | Decision log D-01 to D-92, change log, the questions and their answers. |
| `docs/research/` | Ten research memos: lineage, plugin mechanics, hosting and WebRTC, product history and safety, Omegle UI, ecosystem and naming, retro chat windows, auto-open windows, Poolsuite colour, video dither and window shade. |
| `design/` | Mockup v2.3: the generator, ten artboards, the canvas, the font (ChiKareGo2, CC BY). |

## Tests

```
cd worker && npm install
npm test                              # core, pages, one whole wait through wrangler dev
npm run e2e                           # two Chrome windows meet through the mock lobby
WR_E2E_BASE=https://<lobby> WR_E2E_INVITE=<code> npm run e2e   # the same, against a live lobby
bash ../plugin/test/run.sh            # the plugin against a fake lobby
claude plugin validate --strict ../plugin
bash ../scripts/probe-mac.sh          # one real window on this Mac (needs Google Chrome)
```

Set `WAITING_ROOM_LOG=~/.waiting-room/log.txt` in your shell for a week and every hook appends one line, the five fields and what the reply was (open, quit, or nothing): that is the Phase 0 log the timing numbers come from.

## Look

Classic Mac OS chrome in the Poolsuite grammar: cream panel, one-pixel black, pastel desktop tints, pixel type for the title and labels, Geneva for the lines, a bar-graph meter, and a CSS dot screen over video. Nothing here is an Apple or Poolsuite asset. Omegle is the joke and the reference, never the copy.

Plan written 2026-09-05 to 2026-09-06 with Claude Code (Fable 5.1), ten Opus 5 research agents, three Opus 5 builders, and two review passes (Codex, Claude). Plan artifact: https://claude.ai/code/artifact/7f5e1d8a-4c07-46ab-9506-507936b4ff27. Canvas: https://claude.ai/code/artifact/447cf200-0465-4dcf-8ff0-984537a43877.
