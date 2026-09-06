# Change log

Newest first. One line per change to the plan. Decisions live in DECISIONS.md.

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
