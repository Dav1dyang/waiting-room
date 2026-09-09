# Decision log

Format: **D-xx  Title** (status). What was decided. Why. What it rules out.
Status: proposed = my recommendation, awaiting David; accepted = came from David's brief; superseded = replaced by a later D-xx.
All entries dated 2026-09-05. "Amended" entries changed after the four research memos came back the same day.

---

**D-01  This deliverable is a plan, not code** (accepted)
David asked for concept feedback and a build plan. No product code is written yet; a validated plugin skeleton exists under `prototype/plugin/` for Phase 0.
Rules out: shipping a prototype in this pass.

**D-02  "Claude is working" = the span between the UserPromptSubmit hook and the Stop hook; observe, never predict** (proposed)
No hook payload carries a timestamp, a duration, or an estimate (verified in memo 02). The plugin only ever knows "started" and "stopped".
Rules out: any duration-estimation model.

**D-03  One persistent browser tab; hooks never open a browser** (proposed)
Opening a tab per prompt would be hostile, and hook processes have no controlling terminal anyway (memo 02). `/claude-omegle:omegle on` prints the URL once. Tab open = available; tab closed = unavailable, with no other state to clean.
Rules out: `open <url>` inside hooks.

**D-04  Hooks talk to the tab through the cloud lobby, not a local server** (proposed)
The hook POSTs a tiny event to the Worker; the Worker forwards it to the tab over the tab's WebSocket. Same Worker + Durable Object + hibernation + static assets pattern as `MistMaker/extras/phone-app`. No local daemon; the tab can be on any device.
Rules out: localhost servers, launch agents.

**D-05  Hooks are invisible: `"async": true`, print nothing, always exit 0, 2 s curl timeout** (accepted 2026-09-06)
Originally "detached subshell". Memo 02 found `async: true` is the documented fire-and-forget for command hooks, so shell backgrounding is unnecessary. UserPromptSubmit stdout would be injected into Claude's context, so the script prints nothing.
Rules out: blocking hooks, hooks that return JSON, `type: "http"` hooks (no async, subject to an allowlist).

**D-06  Threshold T before entering the queue; placeholder 30 s; real value from Phase 0** (amended from 20 s; amended to 15 s by D-83)
Quick replies must never trigger a call, and the blameless exit needs a floor (memo 01, insight 1). The tab arms a timer on "started" and joins only if "stopped" has not arrived by T. Phase 0 measures how often a turn that passes 30 s goes on to pass 3 min.
Rules out: guessing T.

**D-07  Media is browser-to-browser WebRTC; Cloudflare STUN; Cloudflare TURN as fallback; Metered Open Relay if needed** (verified)
Cloudflare Realtime TURN gives 1,000 GB/month free, egress-only metering, then $0.05/GB (memo 03). One open item: whether a free-plan account can create a TURN key without a card. If not, Metered Open Relay offers 20 GB/month free.
Rules out: hosted room services (free tiers exhaust at 7 to 33 calls/day; about $80/month after).

**D-08  Backend = one Worker + one global Lobby Durable Object; hibernation API mandatory; no database; no accounts** (proposed)
Pairing is a consistency problem and a Durable Object is a consistency primitive. Free plan: 100k requests/day and 13,000 GB-s/day; a lobby that holds sockets without hibernation burns about 85 percent of that budget idle (memo 03). Use `ctx.acceptWebSocket`, auto-response ping/pong, `serializeAttachment`, no `setInterval`.
Rules out: KV/D1, auth providers, multi-region logic, per-call objects.

**D-09  Identity = random per-machine pairing token; session ids hashed; "working" is a set** (accepted 2026-09-06: "any session" counts, Q-08)
`/claude-omegle:omegle on` creates the token once. Hooks send token + hash(session_id). The tab is "waiting" while the set of working sessions is non-empty. Concurrent sessions run hooks independently with stable ids (observed in memo 02).
Rules out: sending raw session ids or prompts anywhere.

**D-10  The call ends when the starting wait ends; the other person is re-queued; five-second goodbye** (accepted 2026-09-06, Q-07)
Asymmetric endings are the concept. The countdown softens the cut without changing who decides.
Rules out: mutual-consent endings; manual "end call" as the primary exit (Skip still exists).

**D-11  "Waiting alone" is the default state; matching is the bonus** (accepted 2026-09-06; the screen just says "Waiting for someone to wait for their Claude...", see D-33)
With ten scattered friends the chance someone else is waiting is about 10 percent (liquidity table in the plan). The solo screen must be worth keeping open.
Rules out: a UI that looks broken when nobody is there; fake activity of any kind.

**D-12  Consent in three layers; mic acquired on match, camera on mutual reveal, both released on hang-up** (amended)
(1) Plugin install + explicit `on`. (2) Rules screen once, Available/Away always. (3) Browser prompt per site. First click satisfies the user-gesture rule for remote audio. Browsers may never settle the permission promise, so a 20 s media timeout drops an unresponsive user from the queue (memo 03).
Rules out: silent capture; auto-join on first visit; re-prompt loops after a deny.

**D-13  Safety MVP: invite code, rules + 18+ screen, Skip limited to three per hour, Report, block by token, 30-minute hard cap, kill switch, never record** (amended)
Memo 04: instant unlimited "Next" was Omegle's most dangerous feature; the Portal's fix was mechanical and blameless; invite-only is the primary legal mitigation because Omegle's liability turned on matcher design, which Section 230 did not cover. Public launch needs automated video moderation, accounts, a real report workflow, terms, privacy notice, and a lawyer.
Rules out: public anonymous access in MVP.

**D-14  Attention routing: chime + title flash in MVP; Document Picture-in-Picture mini window later** (proposed; refined 2026-09-06)
David is looking at the terminal, not the browser. The title flash is Omegle's own 2009 trick, ported: alternate the window title between ___wait-together___ and ¯¯¯wait-together¯¯¯ every 500 ms with a swapped favicon; cancel on any mouse move, key, or focus.
Rules out: relying on a background tab being noticed.

**D-15  "claude-omegle" stays a working title; recommendation: Meanwhile** (superseded by D-27)
Omegle is a trademark with a litigation legacy, and omegle.com is live again under a new registrant (memo 01), so the name now points at someone else's product. Other candidates: Long Poll, Yield, Blocking, Interstice, Standby; "civil inattention" as a tagline.

**D-16  `docs/index.html` is the canonical plan; research stays in Markdown** (accepted; v0.2 replaces v0.1 on 2026-09-06, v0.1 archived under `docs/archive/`)

**D-17  Phase 0 is instrumentation only** (proposed)
A week of logged start/stop/tick timestamps gives the turn-duration histogram (sets T), the longest silent gap (sets N), and confirms whether Escape skips Stop.
Rules out: picking T or N by intuition.

**D-18  PostToolUse heartbeat feeds the silence timeout and a visible pulse** (proposed)
Cheap because hooks are async. Rate-limit if it ever matters.

**D-19  Interrupt safety: silence timeout N (placeholder 5 min) + StopFailure + SessionEnd hooks + "started" closes any stale call** (new)
The Stop hook does not run on a user interrupt (documented, memo 02). Without this a call could hang open. Trade-off: a build longer than N with no tool events causes an early goodbye. N is measured in Phase 0.
Rules out: trusting start/stop pairs alone.

**D-20  Audio first; video by mutual one-click reveal; video-on-mic-off tested as a Phase 3 experiment** (accepted 2026-09-06, Q-03)
Memo 01 (Journey, Goffman), memo 03 (audio is 1/16 the relay cost), and memo 04 (Clubhouse, harm surface) converge on "restrict the channel first". The reveal is an added video track after both click; perfect negotiation handles the renegotiation.
Rules out: camera-on-first-frame in MVP.

**D-21  Use the PermissionRequest hook as a passive observer; "Claude needs you" is a banner, not a state change** (new)
Notification/permission_prompt waits about six seconds of idle typing; PermissionRequest fires immediately and changes nothing unless it returns a decision (memo 02). Hanging up on a permission prompt would hit the insult floor; the timeout covers a user who wanders off.
Rules out: pause/resume logic in MVP.

**D-22  Plugin ships disabled; flag and token live at a fixed `~/.claude-omegle` path** (new)
Plugin hooks install with no approval prompt (memo 02), so the user must turn it on. `${CLAUDE_PLUGIN_DATA}` leaked another plugin's value inside a slash command's inline bash (observed), so both scripts use one fixed path.
Rules out: relying on plugin data variables in command bodies.

**D-23  The signal script projects the hook payload to {token, event, session hash}** (new)
Hook payloads include the prompt text and, on Stop, the last assistant message. The prototype forwards the whole payload (fine for a local logger); the real script must not.
Rules out: any transcript content leaving the machine.

**D-24  360p video and Opus audio by default** (new)
A small window nobody looks at closely; 2.5× less relay traffic than 720p (memo 03).

**D-25  "Partner left" is detected from the WebSocket closing, not from ICE state** (new)
The lobby sees a dropped socket in seconds; media state can take half a minute (memo 03).

**D-26  Each match opens with one question: "What is your Claude doing?"** (superseded by D-30: the stranger sees nothing about your task)
Portals opened every eight-minute conversation with one question and it rescued agenda-less encounters (memo 01). Answering is optional and the text stays between the two people.

---

## Added 2026-09-06 after David's answers (v0.2)

**D-27  Working name: wait-together** (accepted 2026-09-06, Q-01)
David chose it "for now". Research 06 (2026-09-06): no collisions (no plugin has "wait" in its name, npm free, .app/.dev likely free) but two soft flags: "together" is Together AI in the plugin search, and verb-first names are rare. Alternatives checked free: waiting-room, watercooler, hold-music, meanwhile, deskmate (Q-19). Folder and repo stay `claude-omegle` until the name is confirmed (Q-16).

**D-28  Audience in two tiers: friends first, then r/ClaudeAI** (proposed; Q-14)
Phase 3 = friends by invite. Phase 4 = a post on r/ClaudeAI, gated by the public-launch checklist in research 04 (accounts, terms, privacy notice, a real report path, camera-off default kept). A public Reddit link is a different risk class from friends; it does not get the friends-tier safety.
Rules out: posting a public link before the checklist is done.

**D-29  No lurker mode, ever** (accepted 2026-09-06, Q-04)
Only people whose Claude is working can be matched. A Codex CLI version is a possible later fork, out of scope for alpha.

**D-30  The stranger sees nothing about your task** (accepted 2026-09-06, Q-05)
No elapsed time, no tool pulses, no label, no opening question. The only task-related thing the stranger ever sees is the 5-second goodbye countdown when your Claude finishes, so they know why you left.
Supersedes D-26 and the "elapsed + pulses" default.

**D-31  The pause rule: "Claude needs you" is not "Claude is done"** (proposed; Q-13)
Two kinds of pause, both blameless because the machine caused them.
Exact pauses (primary): a permission request (PermissionRequest hook), a structured question (PreToolUse with matcher AskUserQuestion), an MCP elicitation, or a Stop whose payload lists running background tasks. The call stays on. Your popup says "Your Claude needs you. The call stays on." The stranger's log says "Stranger is away for a moment (their Claude needs them)" and later "Stranger is back."
Prose-question pause (secondary, a guess): a Stop whose last message ends like a question. The signal script classifies this on your machine (a small node one-liner, so the message never leaves the Mac) and sends only the verdict, `stopped` or `paused`. A `paused` holds the call for a grace window G (placeholder 90 s). A new turn within G resumes the call and skips the arm threshold. No new turn within G means the countdown and hang-up. This heuristic is a toggle; its cost is a delayed goodbye of up to G when Claude ends with a rhetorical question.
Everything else stays as D-10: a plain Stop means the countdown.
Phase 0 must test which hooks fire for: a prose question, AskUserQuestion, a permission prompt, Escape, and a background task. Two of these are still inferred in research 02.
Rules out: hanging up on a permission prompt; the user having to click anything to keep a call.

**D-32  Hosting: a separate Worker on workers.dev, same Cloudflare account, no byproductlab.com domain** (accepted 2026-09-06, Q-06)

**D-33  No office hours; the waiting screen just waits** (accepted 2026-09-06, Q-11)
"Office hours" meant asking friends to agree on a daily window so more people overlap. Dropped. The solo screen says "Waiting for someone to wait for their Claude..." and nothing else, with at most a one-line honest presence count in the footer (Q-15).

**D-34  The call lives in a small popup window, 720 by 580** (proposed; Q-12)
Opened once by a click on the main page (browsers only allow popups on a click). The popup owns the WebSocket and the media, so it keeps working when the main page is closed. It sits beside the terminal. Size follows Omegle's verified video geometry (a 320 by 520 feed column beside the log, scaled to 300 wide). If the browser blocks popups, the main page becomes the call UI.
Rules out: a full-size tab as the primary call surface.

**D-35  Homage stance for the 2009 look** (proposed; tokens verified 2026-09-06 in research 05)
Original wordmark, tagline, and intro paragraph. The period grammar belongs to the era, not to one company: #EEE page, white boxes with 1px #CCC borders, Arial at the browser default 16px with em sizes, blue and red keyword labels, a borderless #80BFFF to #0180FE gradient button, a reserved 160px ad rail, a log box plus 5em control bar with 7em white buttons, feeds stacked in one column. Omegle's logo, tagline, intro paragraph, and its exact strings and button labels are not reproduced; system lines get our own words in the same flat voice (own invented failure words, own button labels Hang up / Sure? / Stop waiting).
Rules out: copying Omegle's logo, tagline, or intro paragraph.

**D-36  Mockups are static, about eight artboards, inline SVG only** (accepted by request: "mock it up in details")
Working files live in `design/`. Two home-page variants at different humor levels are offered for David to pick (Q-17); the popup states are one direction.

**D-37  Plan v0.2 replaces v0.1** (accepted by request: "updated plan")
v0.1 is archived at `docs/archive/plan-v0.1.html`. v0.2 is shorter: decided things are stated as facts, the concept review is one paragraph linking the archive, research stays in the memos.

---

## Added 2026-09-06, second round of answers (v0.3)

**D-38  Name: waiting-room** (accepted, Q-16 and Q-19; supersedes D-27)
Folder renamed to `~/Documents/GitHub/waiting-room`. Plugin name `waiting-room`; commands `/waiting-room:on <invite-code>`, `/waiting-room:off`, `/waiting-room:status`. State at `~/.waiting-room/`.

**D-39  No persistent window; setup once from the CLI** (accepted in principle, Q-12)
`/waiting-room:on <invite-code>` prints the rules in the terminal and a one-time setup link. The setup page exists only because the microphone permission has to be granted in a browser once (plus a sound check). After that nothing is open between calls. There is no home page in the alpha; a landing page comes with the public tier (D-45).
Rules out: the persistent tab of D-03 and the always-open popup of D-34.

**D-40  You are queued from hook signals alone; the room window opens by itself only when a stranger is matched, and closes by itself when the room empties** (proposed mechanism; Q-21, Q-22; mechanics verified in research 08, Phase 0 browser tests remain)
The lobby learns "working" from the started signal and the ticks. After 30 s you are in the queue with no window. When two queued people both have fresh heartbeats, the lobby pairs them and answers each side's next hook POST with `{"open": url}`. The signal script launches a small chromeless Chrome window with that URL; the page acquires the mic (permission persisted at setup), connects, and shows the room lines. The page calls `window.close()` when the call ends, which browsers allow for a window whose history has a single entry. If nobody is ever waiting, nothing ever appears.
Latency: the next tool call after the match, usually seconds during agentic work. Fallback if a browser blocks any step: a plain tab and one "click to hear" button.
Rules out: a local daemon; a window that pops up on every long turn.

**D-41  Pairing needs fresh heartbeats on both sides; an unconnected pairing dissolves silently** (proposed; the freshness window F is the fourth number Phase 0 measures, D-61)
Only tokens whose last tick is under 20 s old are paired, so the open instruction arrives quickly. If either window has not connected within 60 s, both go back to the queue with nothing shown.

**D-42  Pauses are lines, not states** (accepted, Q-13 and Q-23; supersedes the Paused state in D-31, keeps its hang-up rule; away-message voice confirmed)
The call is never dimmed or muted when a Claude needs its person. Both sides just see an auto-posted away message in first person, chatroom style: "You: brb, my Claude needs me" on your side, "Stranger: brb, my Claude needs me" on theirs, then "back". The grace window for a turn that ends in a prose question still decides whether a Stop is a real finish.

**D-43  The window is system lines only** (accepted, Q-18)
Room lines (deadpan, grey): "Stranger has entered the room.", "Stranger has left the room.", "Hanging up in 5." Auto-posted lines with You / Stranger labels for pauses. An honest count, two tiny level meters, and three actions: Hang up, Show my video, Report. No typing.

**D-44  Honest count, shown in the window and by `/waiting-room:status`** (accepted, Q-15)

**D-45  Tier 2 is a public link in an r/ClaudeAI post** (accepted, Q-14)
Phase 4 is gated by the public checklist in research 04 (accounts, terms, privacy notice, a real report path, camera-off default kept, a lawyer's read) and needs a landing page.

**D-46  Design redo: polished retro, 2000s and 2010s chat-window grammar, three surfaces only** (accepted by request, Q-17; direction chosen in D-59)
Surfaces: the terminal (text), the one-time setup page, the room window (system lines; video state). The v1 mockup is archived under `design/v1-wait-together/`. The canvas shows one leading direction built out plus two low-fi alternates to choose from (Q-25).

**D-47  Sounds: door-style cues synthesized in the browser, quiet, with a mute** (accepted, Q-24)

**D-48  Video inside the small window** (proposed)
When both click, two small feeds appear inside the window; no resizing, no second window. Document Picture-in-Picture is a later option because the click that reveals video is a user gesture.

**D-49  Hang up means: leave this stranger and stay away for the rest of this turn** (proposed)
Without this, hanging up while still queued would pop a new window at once if someone else is waiting. The next started signal re-arms you. The per-hour limit becomes mostly moot but stays as a backstop.

**D-50  The lobby sends "open" only when no window for that token is already connected; a new match is routed into a live window** (proposed)
Prevents a second window while the first is still closing after "Stranger has left the room."; the live window just shows "Stranger has entered the room." again.

**D-51  PreToolUse is a tick too, not only PostToolUse** (proposed)
PostToolUse fires after a tool finishes, so a match during a three-minute test run would wait three minutes. PreToolUse fires before it starts; the script already branches on the tool name for AskUserQuestion. Halves the worst-case open latency.

**D-52  The room window opens behind the terminal; a notification announces a match and the door sound plays as the stranger enters** (proposed; wording follows D-79; Phase 0 test with `open -g`)
A window that steals keyboard focus while you are typing to Claude would eat your keystrokes. So it opens in the background and the chime is how you learn the room opened. This is the main reason sounds are on by default (D-47).

**D-53  The open URL carries a short-lived room ticket, not the machine token** (proposed)
The URL lands in browser history and window titles; the lobby mints a ticket per match.

**D-54  The one-time setup rehearses the mechanism** (proposed)
After the mic permission and sound check, the setup page opens a test room window that closes itself after five seconds. If it works once, you trust it; if it fails on your machine, you learn at setup, not mid-call.

**D-55  Four window states** (proposed)
Connecting (opened, partner not yet up; "Nobody came." and close at 60 s), In the room, Closing (countdown or "Stranger has left the room."), Video (two small feeds inside the window).

**D-56  Design reference: Poolsuite's Classic Mac OS desktop styling** (accepted as reference, David 2026-09-06)
David saw the research pass over poolsuite.net and said he loves the style. The room window should be judged against that bar: a pixel-exact, restrained Classic Mac OS window (System 7 to Mac OS 8 chrome, 1-bit patterns, pixel-era type) with the AIM/IRC system-line grammar inside it. Visual language only: no Apple or Poolsuite assets.

**D-57  Room page contract** (proposed; from research 08; amended for D-62)
Served directly with HTTP 200 and no redirect; the mic is captured only when a match arrives (not at load: with the window open for the whole wait, an early capture would light the mic indicator while nobody is there) and released when the room empties; getUserMedia first, remote audio second (that ordering is what makes autoplay legal in Chrome, Safari, and Firefox); never navigate or pushState (replaceState only), so session history stays at one entry and window.close() is allowed; on end stop all tracks, close, check window.closed after 400 ms, and show "You can close this window now." if refused; heartbeat to the lobby while open. Fallback for a refused play(): one big "Click to hear them" button.

**D-58  One window per machine is enforced on both ends** (proposed; from research 08)
The lobby hands out "open" at most once per pairing and only when no window heartbeat is live (D-50); the hook script takes an atomic mkdir lock before calling open, because several hooks can fire within milliseconds; a lock older than 30 s is treated as stale and removed, so a killed subshell can never block windows forever. Window size flags are not passed: a running Chrome ignores them. Instead the room URL keeps a constant path with the ticket in the query, because Chrome remembers app-window bounds per host and path (research 08, likely, Phase 0 test 2). An installed web app with a protocol link is the v1 upgrade for remembered bounds; a native helper is the last resort if focus stealing cannot be fixed.

**D-59  Design v2 lead direction: Classic Mac OS room window in the Poolsuite grammar** (accepted, Q-25, 2026-09-06)
Built from research 07's reading of Poolsuite (one structural colour, pixel type at native size, few accents, one costless joke) and its eight rules, plus David's note that he loves that style (D-56). ChiKareGo2 (CC BY, Giles Booth) for titles and buttons, Geneva for lines; one accent (pale yellow behind a pause line); one texture (the dither); the close box is a door. Alternates on the canvas: B "Aqua room, 2006" (research 07's own recommendation) and A "AIM buddy window, 2004". One era per window; never blend. Open point: the lead is 1980s and 90s Mac, not the 2000s David first named; the Aqua alternate is the 2000s answer with identical copy.

**D-60  Three sounds, no audio files** (accepted, Q-24; research 07 section 6.6; the queued open is silent, the door plays when a stranger enters, the knock for a match is the macOS notification, per D-79)
Enter (rising two-note door), leave (the same falling), knock on the last three seconds of the countdown. All under 300 ms, about -24 dBFS, ducked during a call, visible mute persisted locally. Nothing on meters, hover, count changes, or the video reveal. One event, at most two channels (sound or title flash plus the line, never all three).

**D-61  The freshness window F is measured, not guessed** (proposed; after review)
During a long stretch of pure reasoning no hook fires (research 08 section 8), so a short F makes you unpairable exactly when waits are longest, and a long F risks a phantom window after Escape. Phase 0's hook-gap log sets it. Placeholder 20 s.

**D-62  The window opens when you are queued, shaded; it unrolls when a stranger enters** (accepted in principle, Q-21; supersedes the open-on-match half of D-40)
David wants to see the count and a minimal sign that the waiting room is active. Mac OS 7.5 and 8 had WindowShade: a window collapsed to its title bar. Our queued state is that: the lobby replies "open" on the first hook call after the 30 s threshold, the window appears behind the terminal, silently, collapsed to its title bar and one line ("2 people are waiting for their Claude right now."), and it unrolls, with the door sound, when a stranger enters. Everything after the open happens over the window's WebSocket, so the hook path only ever says started, stopped, paused, tick and receives at most one "open" per wait. Research 10 checks whether the OS window can actually shrink (resizeTo) or whether the shade is drawn inside a fixed window.

**D-63  The window stays while you are queued; it shades back up when the stranger leaves** (accepted, Q-22; supersedes the close-after-10 s default)
It closes only when your Claude finishes (countdown if in a room, a short "Your Claude is done." if alone), when you hang up, or after the silence timeout N.

**D-64  Video feeds get a dot-screen look, CSS first** (accepted in principle, Q-25; research 10 verifies)
Poolsuite's player: color video under a fine black dot grid. David asked for the simplest way without processing, so the first candidate is a CSS overlay (radial-gradient dot pattern, mix-blend-mode multiply, a light contrast filter) on the receiving side. A sender-side canvas dither is the fallback. Privacy is unchanged from any video call; video is mutual opt-in.

**D-65  The log is five lines tall** (accepted, Q-25)
"Could the chat interface take up less space, just shorter?" The log shrinks from about ten lines to five; the window is about 380 by 215 without video and about 380 by 330 with it.

**D-66  Pastel tints, one accent, 1 px black** (accepted in principle, Q-25; hexes from research 09)
"Pastel colors would be nice." Everything structural stays black on white or cream; the desktop and one or two button fills take a pastel tint from a small set chosen once on the setup page. Research 09 supplies the hexes, contrast checks, and the icon grid.

**D-67  The alpha is Chrome on macOS** (accepted, Q-20)
Safari and Firefox get a plain tab and a click, later.

**D-68  One "open" per task, and closing the window yourself means "not this turn"** (accepted after review; amends D-50 and D-58)
The lobby sends "open" at most once per started event. If you close the shaded window by hand, nothing reopens it until your next task (the D-49 rule). Without this, a window that appears by itself would also reappear by itself, which is the worst possible behavior.

**D-69  A window whose Claude went quiet closes on its own, quickly** (accepted after review; amends D-63)
After Escape no hook fires, so the shaded window would otherwise linger for up to N minutes. The lobby tells the window "your Claude went quiet" after the freshness window F; the window shows the line and closes after a short grace (placeholder 20 s). The silence timeout N remains the backstop for the lobby's own state.

**D-70  The count means other people** (accepted after review; amends D-44)
"2 others are waiting for their Claude." and, alone, "Nobody else is waiting right now. Your Claude is still working." Never a count that might include you.

**D-71  Phase 0 test 3 (focus) decides whether D-62 survives** (accepted after review)
Open-when-queued means a window on every long turn, not a few a week. If the no-focus flag does not hold, the fallback is the notification-click path from research 08, not a window that steals focus.

**D-72  The audio meter is a small bar-graph, in the spirit of Poolsuite's radio level meter** (proposed; David's note 2026-09-06; research 09 details it)
A row of thin ascending bars per speaker (YOU, STRANGER) lit from the left by the WebAudio level, 1-bit, about 80 px wide. It replaces the five-block meter. It is the one continuously moving thing in the window, and it moves only with real sound.

**D-73  One window per task stays for the alpha; one window per session is the fallback** (proposed; research 10 C.2)
Research 10 argues for one shaded window per Claude Code session (closed on a quiet timeout) because a window per long task means 10 to 30 open-and-close cycles a day. The product premise is that the window closes when your Claude is done, so the alpha keeps that. If Phase 2 shows the churn annoys, switch to per-session; the quiet timeout is built either way.

**D-74  Shade geometry: the Chrome app window can shrink to 380 by 100, and our title bar is drawn under Chrome's** (accepted; research 10 B)
resizeTo works in a Chrome app window opened by the OS (Chromium ignores the spec's opener check, verified in source), with a hard floor of 100 px outer. Shaded = 380 by 100 outer: Chrome's own thin title bar plus about 62 to 72 px of page, enough for our striped title bar and the count line, drawn on the desktop tint. Open = 380 by 300. The page measures innerHeight after the resize rather than assuming 64. The fallback, built first, is a fixed 380 by 300 window with the shade drawn inside it. An installed web app cannot be 380 wide (Chromium forces 500 px for real web apps), so the PWA route is dropped for the shade window.

**D-75  Pick up: a stranger's arrival needs one click on each side before any audio flows** (superseded by D-79 on 2026-09-06; kept as the fallback if Phase 0 test 7 fails; research 10 C.3)
With the window open while you work, a stranger can arrive at any moment. On a match the window unrolls silently with "Stranger has entered the room." and one big Say hello button; a macOS notification is the knock (permission asked once at setup). Clicking Say hello is the gesture: it turns the mic on, plays the door sound, and connects the audio; the other side sees "Waiting for the stranger to pick up." If nobody picks up within 30 s, "Nobody picked up." and both go back to the queue. Costs one click per match, a rare event; buys no hot mic while you work, a real consent boundary, and no autoplay tricks at all. This replaces the "no click" default proposed earlier.

**D-76  Palette v2 (final hexes from research 09)** (proposed, Q-26)
Structure: black #000000 at 1 px, paper #FFFFFF, panel cream #F5EEDF. Desktop tints, flat, no dither, one lightness and chroma in OKLCH with the hue rotated: Pool #91CECF (default), Shell #E6B1B2, Mint #A7CDAB, Dusk #BBBCE9. Two button fills, a lightness step above the tints: Cyan #B7E7E8 on the one default action, Blush #FBD0D0 on Hang up. Accents: pale yellow #FFF1A8 behind the one line that matters now; a single 4 px red dot #D01D21 with a 1 s halo meaning "the mic is live". Nothing else has color. Dark mode later as a token swap, never a filter. Contrast: black text 11.3:1 or better on every surface.

**D-77  Icons, buttons, meter, type (research 09)** (proposed)
Eight 1-bit icons on an 11 by 11 grid (door, hang up, camera, flag, speaker on, speaker muted, person, watch) plus a shade widget in the title bar; buttons stay text-only; icons live in the title bar, the count line, the status strip, and the video panes. Button anatomy: 1 px black border, 4 px radius, a 1 px ledge below and a 1 px white line inside the top; press drops it 1 px; no hover state; disabled is dotted; the default action wears the thick ring. Meter: two per-speaker RMS bar graphs, 28 bars at a 3 px pitch, 84 by 10 px, lit from the left, unlit bars absent, a 1 px baseline, instant attack, 300 ms release, peak-hold dot, noise gate at 4 percent. Type: ChiKareGo2 with letter-spacing -1 px and line-height equal to font size. 6 px of panel padding inside the frame so the inner regions read as a double frame. Motion quantized: nothing over 0.3 s.

**D-64 amended  Dot screen: CSS overlay, no blend mode** (accepted; research 10 A)
An absolutely positioned overlay after the video (or ::after on the wrapper): radial-gradient dots at a 3 px pitch, black at 60 percent, no mix-blend-mode (with black dots it is mathematically identical to plain compositing and it has real Chromium bugs over video); filter contrast 1.12, saturate 0.9, sepia 0.08 on the video; disablepictureinpicture. Zero CPU, zero latency, zero bitrate change. Poolsuite's own effect is the same idea: a 4 by 4 one-bit PNG tile at 25 percent coverage over color video brightened 130 percent. Research 09 prefers a true 1-bit Bayer dither for language purity and privacy; it stays written down and unbuilt (research 10 A.7). If the color pane reads too loud in the 1-bit window, grayscale(1) is a one-line knob.

**D-78  Default desktop tint is Pool** (accepted, Q-26)
David: "26. pool." Pool #91CECF is the default on the setup page and in the mockup; Shell, Mint, and Dusk stay as the one-time choice. D-76 stands as written.

**D-79  Connect automatically: no pick-up click** (accepted, Q-27; replaces D-75)
David: "27. connect automatically. because they enabled the plugin so that itself is agreeing to have this interaction?" Yes: turning the plugin on is the consent, given once in the terminal with the rules printed. On a match both windows unroll, the door plays, the mic turns on, the red dot shows, and the log says "Stranger has entered the room." Hang up is one click. What stays from the click model: the mic is captured only on a match, never while queued (D-57); the queued open is silent (D-60); the macOS notification is the knock (D-52). What changes: the Knock state, the Say hello button, and the "Nobody picked up" timeout are gone. Consequence: Phase 0 test 7 becomes a gate on par with the focus test, because without a click three things must work with no user gesture in a fresh app window, and each has its own fallback. Remote audio through a MediaStream-backed element: expected to play without a gesture (Chromium exempts MediaStream sources from autoplay gating); if it does not, D-79 falls back to D-75. Mic capture with a persisted "Allow on every visit": expected fine. The synthesized door and knock through Web Audio: the one most likely to be blocked without activation; the fallback is the notification's own system sound, which the knock already uses.

**D-80  A quiet room shades back up** (proposed; follows from D-79)
With no click there is no "Nobody picked up" timeout, so a room where nobody speaks would stay open with a live mic until a Claude finishes. New rule: after Q seconds with both meters at zero, post "Quiet room. Back in the queue." on both sides, release the mic, and shade back up; both are queued again. Q starts at 45 s and is tuned in Phase 2. Speaking at any point resets it.

**D-81  Lines set in Geneva** (accepted, Q-28)
David: "28. geneva." The five log lines, the count line, and the status strip are Geneva 12 px; pixel type (ChiKareGo2 at its native 16 px) stays for the title, the YOU and STRANGER labels, and the big countdown digit. The mockup already does this, so no design change.

**D-82  TURN: STUN only until a pair fails to connect, then a card with our own cap** (proposed; research 03 plus 2026-09-06 checks)
Verified on Cloudflare's own pages: STUN at stun.cloudflare.com is free, unlimited, and needs no key; Realtime TURN has 1,000 GB of free egress a month, then $0.05 per GB; budget alerts are "informational only" and "do not pause or cap usage"; Cloudflare offers no hard spending cap on usage-based products. Not on Cloudflare's pages, but consistent across a community thread ("No-CC TURN free tier") and the general billing rule (a valid payment method before enabling a subscription): enabling Realtime, and so creating a TURN key, requires a card. So "free and capped" is something we build, in four layers. (1) Phase 0 and 1 run STUN only: no key, no card; most home-network pairs connect directly. (2) When a TURN key exists, the Worker mints short-lived credentials (the generate-ice-servers endpoint takes a ttl in seconds; credentials can be revoked) only for a matched pair, for the length of one room. (3) The lobby keeps a monthly relay budget: relay seconds times the bitrate cap we set on the sender is an upper bound on egress; when the running total passes a self-set ceiling (500 GB to start), it stops minting TURN credentials and rooms fall back to STUN only for the rest of the month. (4) A Cloudflare budget alert at $1 as the backstop. Trigger for adding the card: the first time two friends cannot connect in Phase 2, and before the r/ClaudeAI post at the latest. Research 03 headroom stands: an audio-only alpha cannot approach 1,000 GB.

**D-83  Arm threshold 15 s** (accepted, David 2026-09-06: "instead of waiting for 30 secs do 15 secs"; amends D-06)
The window opens 15 s into a task instead of 30. Cost: more turns cross the line, so more shaded windows a day (fifteen to forty for heavy use instead of ten to thirty), which raises the stakes of the focus test (D-71). Benefit: company arrives sooner, and a 15 s turn is already long enough that a quick answer never makes a window. Still provisional: the Phase 0 log decides the final number. The value lives in one place in the lobby config so it can change without a code change.

**D-84  The rehearsal rides the next hook** (proposed; replaces the popup rehearsal in D-54)
The setup page's Rehearsal button tells the lobby "rehearse once for this token". The next hook call from that machine, which happens the moment you send Claude any message, is answered with "open" for a test room. So the test window opens through the real path: the hook script, the mkdir lock, `open -g`, a shaded window behind the terminal, the door sound, and a self-close after 5 s. A popup from the setup page would test none of that. The setup page says what to do: "Now send Claude any message. A test window opens behind the terminal and closes itself in 5 seconds."

**D-85  Lobby model, as built** (proposed; worker/src/lobby-core.js, docs/PROTOCOL.md)
Facts the code fixes that the plan left open. (1) The count and "others" mean people with a live shaded window and a running task, not in a room; someone in a room is not waiting. (2) Pairing candidates are the same set narrowed to queued (not paused), a hook within F, not blocked, not opted out, sorted by task start; the older task offers. (3) A silence close (no hook for N) ends the task, and the next hook of any kind starts a new task that may open again after T; only a hand close or a hang-up consumes the open for the task (D-68). (4) One "open" per task, plus one retry after OPEN_RETRY if no window ever connected; a network drop keeps the task and waits RECONNECT_GRACE before that retry. (5) A pause from a permission, question, or tool input waits P (10 min) before the task ends; a turn that ends with a question waits G (90 s); a stop with background tasks waits P. (6) A room ends softly, both back in the queue, on Q seconds of silence or at ROOM_MAX; the same two are not re-paired within PEER_COOLDOWN. (7) A report is a hang-up that flags the peer; three flags in a day block a token for a day. (8) The server closes a window by sending `close` and forgetting it; the socket close that follows is not a hand close. All numbers live in the Worker's vars.

**D-86  Lobby model, second review** (proposed; after the internal code review of the core)
Fifteen findings, all applied. The ones that change behaviour: (1) hooks carry the plugin's timestamp and a hashed session id, so an out-of-order `stopped` cannot end a task that a newer `started` or `tick` continues, and a task on a machine with several Claude sessions ends when the last of them stops (D-09 set semantics, at last built). (2) A dropped socket keeps its window and its room for 15 s and reconnects with the same ticket; only a hand close or a hang-up ends things at once. (3) The lobby's alarm lands on the next real deadline instead of every second, which keeps an idle lobby inside the free plan's daily request budget. (4) Reports count one flag per reporter per day, three different people block, a blocked window closes, and a report after the stranger left still flags them. (5) A window that outlives its task is adopted by the token's next task instead of being doubled. (6) Snapshots carry a version and are hydrated on load, so a deploy over live state cannot throw. (7) Unknown event words change nothing; probe payloads are capped; tokens idle for 30 days are forgotten. 42 core tests.

**D-87  The room window lives in its own Chrome instance** (accepted; Phase 0 on David's Mac, 2026-09-06)
Measured, not guessed: a window opened into the running Chrome with `open -g -na "Google Chrome" --args --app=URL` took keyboard focus within half a second in seven of ten tries, whatever was in front (the three that stayed behind were luck). The same window opened into a second Chrome instance with its own profile (`--user-data-dir=~/.waiting-room/chrome`) stayed behind the terminal every time, on launch and through the singleton path for later windows. That instance also takes `--autoplay-policy=no-user-gesture-required`, so the door sound and the stranger's audio play with no click and no dependence on capture: `AudioContext` running, a MediaStream element playing, measured in the same probe. So D-71's gate passes, by changing the launch, and D-79 stands with no fallback needed. Costs: a second Chrome process (about 150 MB) while a window is open, and a second Chrome icon in the Dock while it runs. The plugin quits the instance when the lobby says no window exists or is on its way (`quit: true` in a hook reply, or `window: false` from the count route eight seconds after a stop), and on `/waiting-room:off`. The setup page opens in the same instance, so the mic and notification permissions land in the profile the room uses. Flags: `--no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required`. Later: a tiny wrapper app bundle would hide the Dock icon.

**D-88  Copy review outcome** (accepted; Codex copy review, 43 notes, 2026-09-06)
Taken: privacy promises are scoped to what the plugin does ("Your task stays on your machine. waiting-room records nothing.") instead of absolute claims about the call; "seconds" spelled out where a sentence needs it; the setup page loses "shaded", "unrolls", "armed" and "rehearsal" in favour of plain words (test window, ready); the terminal says the window opens behind the terminal; error lines name waiting-room, not "the lobby"; command descriptions shortened; the stale window says "out of date". Kept, on purpose: "Stranger" and "STRANGER", "Stranger has entered the room.", "Stranger has left the room.", "Closing in 5." with the big digit, "Quiet room. Back in the queue.", "Your Claude went quiet. Closing.", and "Play the door". Those are the deadpan chatroom voice David approved in the lines table (D-42, D-43) and the Omegle nod that is the joke, not the copy (D-56). The reviewer's alternatives ("Someone joined. Their Claude is working too.", "They left the room.") read as a chat app, not a room.

**D-89  Hook work that must outlive the hook runs detached** (accepted; internal review verifier, 2026-09-06)
Claude Code kills async hooks that are still running when a session ends (documented for `claude -p`; unspecified for an interactive exit). A plain `&` subshell dies with its hook, so the lock release, the idle check, and the final "stopped" POST could all be lost, and a stuck lock would block the next window for up to 30 s. Now `signal.sh` only classifies; `deliver.sh` does the POST and acts on the reply, inline for most hooks and in its own session (node `spawn` with `detached`) for a stop, the window opener, and the idle check. The plugin tests wait for the detached POST instead of assuming it landed before the hook exited.


**D-90  The browser reaper waits out setup and the test window** (accepted; final advisor review, 2026-09-06)
The plugin's Chrome instance hosts the setup page as well as the room window, and it quits on a stop reply of `{quit:true}` or on `window:false` from the idle check (D-87). Walked as a first run: `on` opens the setup page, Claude answers a short prompt, the stop finds no window, the lobby says quit, and the setup page dies under the user, test window included. The lobby now withholds the quit hint and reports `window:true` for SETUP_GRACE (10 min) after `register` and for REHEARSAL_GRACE (20 s) after a test window is issued; `off` ends both graces at once, so `/waiting-room:off` still clears the Dock. Fixed in the core so the hook reply and `/api/count` stay consistent; verified live: on, a four-second turn, the Chrome survived, off quit it. The cost is an idle Dock icon for up to ten minutes after setup.

**D-91  Third review round: the edges** (accepted; Codex review of the Worker wrapper, plugin scripts, and WebRTC code, 20 findings, 2026-09-06)
Applied, fourteen: the Phase 0 probe (resizes, permissions, user agent) runs only in a window opened with `?probe=1`, never in an ordinary room; a per-socket token bucket (40 frames a second, burst 120) closes a flooding window with 1008; a hook from a token nobody registered never touches the rate limiter; invite guessing meets 429 after ten wrong codes from one address in ten minutes or three hundred from everyone in an hour; `/api/count` answers nothing for a token nobody registered; the router reads a body in bounded chunks instead of buffering it before the size check; a socket with no attachment is closed instead of being trusted as "any connection"; the plugin runs under `umask 077` with a 700 state directory, opens only URLs on the configured lobby at `/room` or `/setup` made of URL characters, logs what the reply was (open, quit, nothing) instead of the reply itself, skips the count when there is no token, and the classifier gives up after five seconds or four megabytes; the window resets its reconnect backoff on a real `hello`, stops the mic and camera before closing by hand, goes listen-only if the microphone prompt is not answered in ten seconds, shares one capture between two quick Show video clicks, and puts a remote video track back on `unmute`. Deferred to Phase 2, six, all in worker/NOTES.md under known limits: the single state blob and its 2 MB ceiling, effects lost if the object dies between save and dispatch (the quiet-room timer heals it in 45 s), the TURN counter race and the missing sender bitrate cap (TURN is off, D-82), the lock owner nonce, and the sweep alarm ignoring ticket and token expiry. Tests added for the flood, the throttle, the count, the body cap, and the plain window sending no probe.

**D-92  The whole-branch review, done inline** (accepted; 2026-09-07)
The internal code-review agents died twice on the session limit, so the last pass was read by hand: the diff of everything changed since the second review round, then the setup page, which no round had covered. Found and fixed: `/waiting-room:status` now says "waiting-room does not know this machine any more. Run /waiting-room:on again." when the flag is on here but the lobby answers `enabled:false` (a month away, or a lobby reset, would otherwise leave a machine silently windowless); the setup page's Done button closes its window when the browser allows, and keeps the "close this tab" line when it does not; the global invite-guess cap is written down as a Phase 2 limit (anyone with the URL can spend it). Nothing else in the diff needed a change. A fresh multi-agent review can still be run once the limit resets; the branch does not wait on it.

**D-93  An ordinary window always gets a fresh, hidden launch** (accepted; measured on David's Mac, 2026-09-07)
Phase 0 measured a hidden launch (stays behind) and later windows into a hidden instance (stay behind). It never measured an instance that had been in front. The setup page opens that way on purpose, and the first checklist run showed the cost: with the setup page open, the next room window took focus at once, and so did a window opened into an instance that had only ever shown an app window in front. Chrome brings new windows of an already-active instance forward, and `open -g` cannot stop that. So `wr_open_url` now quits a running instance and waits for the profile to free before an ordinary open, and the launch is hidden every time. A test window is the exception: the lobby marks its open with `rehearsal: true`, and the plugin keeps the instance, since the setup page is meant to be open beside it. The idle reaper already quits the instance after most stops, so the quit before open costs a Chrome cold start only within the setup and test-window graces (D-90). Cost accepted: a setup page still open when a real window is due is closed with it.

**D-94  Type at 12 px, and the desk shows around the panel** (accepted; David, 2026-09-07)
David: "the font is a bit hard to read at the size. some words smudge together", and the frame was cut by the Mac window's rounded corners. Two causes. The count line was Geneva at 10 px, and `-webkit-font-smoothing: none` on the whole page drew it aliased on a 2x display, where the pixel grid does not match and letters run together. And the panel sat 4 px from the window edge, inside Chrome's corner radius. Now: Geneva is smoothed everywhere and only the pixel font (title, digits, button labels) is drawn hard-edged; the count line is 12 px on 16 px, the same as the lines, and may take two lines (the alone line needs two); status labels, the sound label, and the video captions go up one size; the desk shows 8 px at the sides, 6 above, 10 below. Shaded, the window sizes itself to the panel (one count line or two) with 100 px as the floor, instead of a fixed 100 (D-74 amended). Mockup v2.4 carries the same tokens.

**D-95  Review of the checklist fixes: the lock has an owner** (accepted; Codex review, 6 findings, 2026-09-07)
Quitting the browser before an open (D-93) made the opening lock matter more. Codex found the holes: a detached opener that slept past the 30 s stale threshold could wake, quit the window the next owner had just opened, and hand its old ticket to the lobby, which would accept it over a window in its reconnect grace; the idle reaper could read `window:false` and quit a browser that a hook launched a moment later; and the quit-then-wait returned success on timeout, so a window could be handed to a dying instance. Applied: the lock directory carries its owner's name, only the owner opens, quits, or releases, and it checks again right before touching the browser; the reaper takes the same lock and skips the quit when an open is in flight; the quit-wait fails on timeout and the open is skipped (the lobby retries in 30 s); the core refuses a different ticket while any window exists, connected or in grace; the profile path is quoted on launch and escaped for pgrep; unrolled, a two-line count line adds its height to the window instead of squeezing the log. Also caught: the mockup generator had not taken the D-94 tokens (the edit had failed silently), so the canvas was regenerated and republished with the count line at 12 px.

**D-96  The goodbye: ten seconds, a tick a second, the digit in the desk's complement** (accepted; David, after the mock conversation, 2026-09-07)
David missed the first five-second countdown while talking, then saw it and asked for three things: a tick each second, ten seconds instead of five, and a digit that is "playful, complementary pastel to the background" instead of black. So COUNTDOWN is 10 (D-10 amended), the lines say "Closing in 10." and "Leaving in 10.", a short square-wave click plays each second and rises a shade on the last three (the knuckle knock on 3, 2, 1 goes), and each desk tint carries an accent: its hue turned half way round in OKLCH at the same lightness and chroma (Pool gets a peach, Shell an aqua, Mint an orchid; Dusk's yellow is lifted, since a yellow that dark is mud). The digit is drawn in the accent with a one-pixel ink outline, so a pastel still reads on the white paper. Mockup v2.5 carries the same tokens.

**D-97  Mute replaces Sounds; the room count line loses its second sentence** (accepted; David, 2026-09-07)
In the room David asked what Sounds did and whether it muted the mic. It toggled the door sound, which the setup page already owns. A speaker icon in a call window reads as mute, and a mute is what a call needs, so the control is now Mute: a mic icon, the local track sends silence while it is on, the live dot goes hollow and the meter drops, and every new stranger starts with the mic open. The door-sound preference lives on the setup page only. Also from the screenshot: in a room with nobody else waiting, the count line said "Your Claude is still working" beside a stranger; in a room it now says only "Nobody else is waiting right now."

**D-98  The lobby is open** (accepted; David, 2026-09-07)
With the repo public, David asked for the invite code to be optional. The core already treated an empty `INVITES` as open, so the door is the secret itself, now deleted from the Worker; `/waiting-room:on` needs no argument, and a code is still accepted and ignored, so a lobby of one's own can keep asking for one. Before opening: an open door on a public repo lets a script register tokens until the single state value fills (about six thousand), so the Durable Object now caps registrations at thirty per address per hour (429 `busy`), beside the existing invite-guess caps; idle tokens are still forgotten after thirty days. The README, the plugin README, the protocol, and the worker README say so.

**D-99  What an open door needs** (accepted; edge walk after D-98, 2026-09-07)
Walked with the lobby open and the repo public. Four holes, all closed. An IPv6 host has a whole /64 to itself, so a per-address cap keyed on the full address was no cap at all; the caps now key on the /64. The Durable Object's counters live in memory and reset when it is evicted, so a patient script could register thirty tokens per wake until the single 2 MB state value filled; the core now holds a ceiling of three thousand tokens and, when full, sweeps first the tokens that registered and never sent a hook (a flood, never a person), then says busy. "Three reports block a token" was, with open registration, one person with three tokens; reports now count per home, a salted hash of the registering address kept on the token (the salt is made once and stored only in the lobby), so a report from a second token in the same home is the same report. And the plugin's busy line said "Too many wrong codes" for a cap that has nothing to do with codes; it now says the lobby is busy. A token the lobby already knows never counts against the cap: turning waiting-room on again is not a registration.

**D-100  Codex on the open door: nine findings, eight taken** (accepted; 2026-09-07)
The counters behind the caps lived in memory, so an eviction handed out a fresh thirty; they are written to storage with the state now. The cap was checked before two awaits and counted after, so requests in flight could all pass; the slot is taken first and given back if the registration fails. Any hand-written client could post twenty probe records of 2 KB per token into the one state value until it filled; probes are two per token and forty in all, oldest out, one list for the lobby. Only a `true` speech frame is speech: the other side's `false` used to freshen a stale flag and could stretch a silent room by 45 s. The sweep of register-only tokens counts from the latest registration, so a person turning it on again during a full hour is not swept mid-setup. Tokens from before the home hash pick it up from their next hook, so old tokens do not count as three reporters. The window counts on its own clock between the lobby's countdown frames, so a late alarm never swallows a digit or its tick, and a cue still waiting on the audio context when the window is told to close stays silent. Not taken: forcing every call through TURN with `iceTransportPolicy: relay` to hide addresses from the peer. A WebRTC call exchanges network addresses by design; TURN is off (D-82), the README says so, and a relay for everyone is a Phase 2 cost decision. Also noted for Phase 2: Turnstile or edge rate limiting, so a shared address is not the only identity the caps see.

**D-101  Counts, never who** (accepted; David, after the Reddit post, 2026-09-08)
David asked whether anyone used it and how many pairs met. The lobby records nothing about people, and the one trace of a pairing (`lastPeers`) is pruned after the sixty-second cooldown, so until now the answer was unknowable. Now the lobby keeps five numbers and nothing else: registrations, window opens, rooms formed, and reports since it first counted, plus what is true right now (people, people who ran Claude with it on, on now, waiting now, rooms now, blocked now). `GET /api/stats` returns them, no token needed, since a count of strangers is not a record of any of them. Cloudflare's own analytics would have said more about traffic, but the CLI login has no analytics scope, and a dashboard number was not worth a new API token.
