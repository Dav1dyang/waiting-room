# Change log

Newest first. One line per change to the plan. Decisions live in DECISIONS.md.

## 2026-09-08 (v0.6.4, counts)

- `GET /api/stats`: registrations, opens, rooms, and reports since the lobby first counted, plus the now numbers; counts only, never who (D-101).

## 2026-09-07 (v0.6.3, public)

- The repo is public under MIT (the ChiKareGo2 font keeps its CC BY 4.0). Commit authors rewritten to the GitHub no-reply address first. README rewritten in David's voice after a Codex copy review, with a screenshot of the room.
- The lobby is open: the invite secret is deleted, `/waiting-room:on` needs no code (D-98). Registrations are capped at thirty per address per hour, tested under wrangler dev with per-section client addresses.
- Codex on the open door (D-100): caps persisted and reserved before any await, probes capped lobby-wide, only true speech frames count, the sweep counts from the latest registration, old tokens pick up the home hash from a hook, local countdown ticks between frames, no cue after close. Not taken: relay-only ICE.
- Edge walk for the open door (D-99): caps key IPv6 by /64, a ceiling of three thousand tokens with a sweep of register-only ones, reports count per home (a salted address hash on the token), known tokens bypass the cap, the busy line no longer blames codes.

## 2026-09-07 (v0.6.2, after the mock conversation)

- A scripted stranger on the live lobby (a token whose window runs in a scripted Chrome with a synthetic voice as its mic) met David's real window twice. Everything held: knock, unroll, voice both ways, video both ways, the goodbye. Found and fixed: a window talking with no pause sent the lobby nothing after its first "speaking" frame, so the room was called quiet at 45 s mid-sentence (the flag now repeats every 10 s); a doubled "Back in the queue." line.
- From David's notes during the run (D-96, D-97): the countdown is ten seconds with a tick each second and the digit in the desk tint's complement; Mute replaces Sounds; the room count line drops its second sentence. Mockup v2.5.

## 2026-09-07 (v0.6.1, after the first checklist run)

- Checklist run on David's Mac with the installed plugin: mic and notifications granted in the plugin's Chrome profile, the test window and a real window opened through real hooks, the hook log is on for the week. Two findings.
- Focus: a room window opened into a Chrome instance that had been in front (the setup page) took focus. Fixed: an ordinary open quits the running instance and launches hidden; a test window, marked `rehearsal: true` by the lobby, keeps it (D-93). Plugin test added.
- Type and padding: the count line was 10 px aliased and smudged on a 2x display, and the frame was cut by the window's rounded corners. Geneva is smoothed, the count line is 12 px and may wrap to two lines, small labels go up one size, the desk shows 8/6/10 px around the panel, and the shaded window sizes itself to the panel (D-94). Mockup v2.4 regenerated and the canvas republished.
- Codex review of the fixes (D-95): the opening lock carries an owner and the reaper runs under it, the quit-wait fails on timeout, the core refuses a second ticket while a window exists, the profile path is quoted and escaped, the unrolled window grows with a two-line count line. The mockup generator had missed the D-94 tokens; regenerated and republished.
- Installed from the private GitHub marketplace on David's Mac to prove the path; the plugin README warns about running the checkout beside an installed copy.

## 2026-09-06 (v0.6, the alpha built)

- Plan v0.6 published; v0.5 archived at `docs/archive/plan-v0.5.html`. Mockup stays v2.3.
- Built on `feat/alpha`, contract first: docs/PROTOCOL.md, then the pure lobby core (43 tests), then three parallel builders: the Worker and Durable Object (one whole wait through wrangler dev), the room and setup pages (14 unit tests, 10 Playwright end-to-end cases with two Chrome contexts and fake media), and the plugin (35 tests, `claude plugin validate --strict` clean for plugin and marketplace).
- Two review rounds on the core: Codex (12 findings) and the internal code review (15 findings), all applied; D-85 and D-86 record the model as built.
- Phase 0 browser tests on David's Mac (docs/PHASE0.md): focus, self-close, resize floor, rehearsal, audio with no click. Finding: a window opened into the everyday Chrome takes focus within half a second; the plugin now opens its own Chrome instance, launched hidden, with the autoplay flag, and quits it when idle (D-87). `AudioContext.resume()` capped at 400 ms.
- Deployed to workers.dev on the free plan with the invite code as a secret; real Claude Code hooks (`claude -p`) opened a room URL at 26 s against the live lobby; the ten end-to-end cases pass against it too.
- Opt-in hook log (`WAITING_ROOM_LOG`) for the Phase 0 week; `WAITING_ROOM_DIR` for tests.
- Root README rewritten for the built repo; plugin and worker READMEs by the builders.
- The internal code review of the whole branch was cut short by the session limit; its one finished verifier confirmed that background hook work can die at session teardown, fixed by a detached delivery step (D-89).
- Codex copy review (43 notes): the clarity and privacy-scope fixes applied across the window, the setup page, the terminal, the commands, and the READMEs; the chatroom voice kept on purpose (D-88). The internal code review of the whole branch ran after the build.
- Found on the final walk-through: a short first turn after `on` made the lobby tell the plugin to quit its Chrome, setup page and all. The lobby now holds off for ten minutes after register and twenty seconds after a test window (D-90); `off` ends both. New vars SETUP_GRACE and REHEARSAL_GRACE, one core test, redeployed and checked live. The wrangler-dev test and the hang-up end-to-end case had loose expectations; tightened.
- Whole-branch review read by hand after the review agents hit the session limit (D-92): status says when the lobby forgot the machine, Done closes the setup window, the global invite cap noted. Tests: 59 worker, 10 end-to-end, 36 plugin.
- Third review round (Codex, 20 findings on the Worker wrapper, plugin scripts, and WebRTC code): fourteen applied, six deferred to Phase 2 with reasons (D-91). Probe only on request, frame and invite-guess limits, bounded bodies, listen-only fallback, stricter URL checks and file modes in the plugin. Tests: 59 worker, 10 end-to-end, 35 plugin.

## 2026-09-06 (v0.5, fourth round of answers)

- Plan v0.5 published to the plan artifact; mockup v2.3 to the design canvas (same URLs). v0.4 archived at `docs/archive/plan-v0.4.html`.
- Q-26 (Pool), Q-27 (connect automatically), Q-28 (Geneva) answered; no questions open. D-78, D-79, D-81 accepted.
- D-79 replaces D-75: no pick-up click; the Knock state, the Say hello button, and the "Nobody picked up" timeout are removed; Phase 0 test 7 (audio with no gesture) becomes a gate with three checks and three fallbacks. D-80: a quiet room shades back up after Q seconds. Wording in D-52, D-57, D-60, the plan's Sounds bullet, and the setup page follows D-79 (it had been aligned to the click earlier the same day).
- D-82: TURN billing verified against Cloudflare's pages (1,000 GB free, $0.05/GB, STUN free without a key, budget alerts informational only, no hard cap); a card is needed to enable Realtime. Plan: STUN only through Phase 1, then the card with a self-built cap. Action item closed.
- Mockup v2.3: Knock artboard removed (ten artboards), Main shows the automatic entry, setup and terminal copy updated.
- D-83: arm threshold 15 s (was 30 s), David's change; every "30 s" in the plan, the mockup, and the scripts follows. D-84: the rehearsal rides the next hook instead of a popup.
- Build started: repo initialised on `main` with the docs and design baseline; the alpha is built on `feat/alpha`.
- Lobby core built as a pure state machine (worker/src/lobby-core.js) with docs/PROTOCOL.md as the contract, 24 node:test cases, a mock lobby, and eleven hook fixtures. D-85 logs the model as built.
- Codex review of the core (12 findings) applied: tickets bound to their task and dropped at task end; signal frames scoped to a room id; connection ids on socket events so a late close from an old socket cannot touch a new window; token names checked with own-property lookups (no "constructor" or "__proto__" surprises); a pause can no longer open a window before T; rehearsal waits while a real window is live; the open retry only applies when no window ever connected; quiet-room timing tracks speech start and stop; peer cooldown is per pair; a task restarted during the goodbye keeps its window; the count leaves out paused and blocked people. 33 tests pass.
- Memos 09 and 10 final (agents finished); memo 09 gained the exemplar section.

## 2026-09-06 (v0.4, third round of answers)

- Plan v0.4 published to the plan artifact; mockup v2.2 published to the design canvas (same URLs). Eleven artboards: terminal, setup, queued, knock, talking, needs you, stranger away, closing, stranger left, video, tints.
- Q-20 to Q-25 answered; Q-26 (default tint) and Q-27 (click to let a stranger in?) opened.
- D-62 to D-67: window opens when queued as a shaded window and unrolls on a match; stays while queued; dot-screen video look, CSS first; five-line log; pastel tints; Chrome-only alpha. D-42, D-47, D-59, D-60 accepted.
- Research 09 and 10 delivered. D-73 (per-task window stays, per-session is the fallback), D-74 (shade geometry verified: 380 by 100 floor, resizeTo works in app windows, PWA dropped), D-75 (pick up with one click, replaces the no-click default; Q-27 reworded), D-76 (palette v2 hexes), D-77 (icons, buttons, meter, type); D-64 amended (no blend mode). Q-28 opened (Geneva or pixel font). Mockup v2.1 rebuilt with the final tokens.
- D-72: bar-graph audio meter after David's note on Poolsuite's radio level meter.
- After review: D-68 (one open per task, manual close = out for the turn), D-69 (quiet Claude closes the window quickly), D-70 (count means others), D-71 (focus test decides D-62); D-57 mic timing amended; D-60 queued open silent. Plan v0.3 archived at `docs/archive/plan-v0.3.html`.
- Research 09 (Poolsuite color system, themes, icons, buttons; retro but modern) and 10 (CSS dot-screen on video; window shade and resize mechanics; open-when-queued consequences) commissioned.

## 2026-09-06 (v0.3, second round of answers)

- After a second review: freshness window F becomes the fourth measured number (D-61); Elicitation hook added (eight hooks); stale-lock guard in signal.sh; text alignments (window size, countdown line, D-40/D-46 statuses).
- Plan v0.3 republished to the plan artifact; mockup v2 republished to the design canvas artifact (same URLs as before). ChiKareGo2 used at its native 16 px after a render check.
- Name is waiting-room (D-38). Folder renamed from `claude-omegle`; memory and README updated.
- Q-12 to Q-19 answered; QUESTIONS.md updated; new Q-20 to Q-25.
- New decisions D-38 to D-48: no persistent window, CLI-first setup, self-opening and self-closing room window driven by the lobby's reply to a hook, fresh-heartbeat pairing, pauses as chatroom lines, system-lines-only window, honest count, public Reddit tier, design redo, sounds, video inside the window.
- Research 07 delivered (retro chat-window design, eight rules, three directions, sounds); D-59 (Classic Mac OS lead, Poolsuite grammar) and D-60 (three sounds) added; Q-25 reworded. Mockup v2 built in `design/` (11 artboards: terminal, setup, seven room states, two alternates); ChiKareGo2 font (CC BY) added under `design/fonts/`.
- Research 08 delivered: browser mechanics verified from specs and Chromium source; D-57 (room page contract) and D-58 (one window, mkdir lock, no size flags) added; prototype signal.sh gained the lock and lost the ignored size flag; plan sections 02 and 06 filled in.
- D-56: Poolsuite (Classic Mac OS desktop styling) named by David as a design reference; research 07 re-briefed to treat it as a leading direction.
- Plan v0.3 drafted in `docs/index.html`; v0.2 archived at `docs/archive/plan-v0.2.html`.
- Added D-49 to D-55 after review: hang-up semantics, single live window, PreToolUse tick, open in the background with the door sound, room tickets, setup rehearsal, four window states.
- Prototype plugin renamed and extended: `/waiting-room:on|off|status`, pause classifier on the machine (node), open-on-match handling; passes `claude plugin validate --strict`.
- v1 mockup archived under `design/v1-wait-together/`. Two research memos commissioned: 07 (retro chat-window design), 08 (auto-open and auto-close window mechanics).

## 2026-09-06 (v0.2, after David's answers)

- Working name is now wait-together (D-27). Folder stays `claude-omegle` until the name is confirmed (Q-16).
- Eleven questions answered; QUESTIONS.md split into answered and open. Seven new questions (Q-12 to Q-18).
- New decisions D-27 to D-37: two-tier audience, no lurker mode ever, stranger sees nothing, the pause rule, workers.dev hosting, no office hours, popup call window, homage stance, static mockups, v0.2 replaces v0.1.
- Accepted: D-05, D-09, D-10, D-11, D-20. Superseded: D-15 (name), D-26 (opening question).
- Two new research memos commissioned: 05 (Omegle UI from Wayback captures and 2009 web conventions), 06 (plugin ecosystem, marketplaces, naming patterns, name collision check).
- v0.1 archived at `docs/archive/plan-v0.1.html`. v0.2 written shorter and plainer by request.
- Mockup second pass: two lines that were still Omegle's words replaced with our own, popup header and control-bar overflow fixed, log padding, Report enabled after a disconnect, Away toggle on the idle screen, stranger-side countdown added, plan copy list synced.
- UI mockup canvas added under `design/` (eleven screens; tokens and geometry from Omegle's verified 2009 stylesheet; two home-page humor levels).
- D-14, D-34, D-35 refined with verified 2009 values (Arial 16px, #EEE/#CCC/#555, blue/red keywords, borderless gradient button, 720 by 580 popup, title-flash trick).
- Q-19 added (name, second look) after research 06 flagged the Together AI overlap.

## 2026-09-05 (v0.1, initial plan)

- Created project folder, README, decision log, open questions, change log.
- Commissioned four research memos (art/theory, plugin mechanics, free hosting + WebRTC, product history + safety); all delivered the same day.
- After research: default channel changed from camera-on to audio-first with mutual reveal (D-20, Q-03). Goodbye countdown 3 s to 5 s (D-10). Threshold placeholder 20 s to 30 s (D-06). Hook mechanism changed from shell backgrounding to `"async": true` (D-05).
- Added D-19 to D-26: interrupt safety (Stop does not fire on Escape), PermissionRequest hook, plugin disabled by default with a fixed state path, payload projection, 360p default, socket-based presence, opening question.
- Added Q-11 (office hours) and two action items (TURN key without card; manual Reddit prior-art check).
- Saved the tested plugin skeleton from memo 02 under `prototype/plugin/`; passes `claude plugin validate --strict`.
- Wrote `docs/index.html`, the plan.
