# Questions for David

## Answered 2026-09-06

| # | Question | David's answer | Logged as |
| --- | --- | --- | --- |
| Q-01 | Name | "wait-together for now" | D-27 |
| Q-02 | Audience | Friends first, then Claude Code Reddit | D-28 |
| Q-03 | Channel | Audio-first, mutual show-video click | D-20 accepted |
| Q-04 | Lurker mode | No, never. Maybe a Codex version later, out of scope | D-29 |
| Q-05 | What the stranger sees | Nothing. Only the countdown when your task completes | D-30 |
| Q-06 | Hosting | Separate workers.dev address, same account, not byproductlab.com | D-32 |
| Q-07 | Ending | 5-second goodbye | D-10 accepted |
| Q-08 | Several sessions | Yes, any | D-09 accepted |
| Q-09 | Distribution | Wants marketplaces explained (done in plan v0.2, section 08); alpha stays private | D-22 |
| Q-10 | Repo | Yes, private until the name is confirmed | D-27 |
| Q-11 | Office hours | Not understood; dropped. Solo screen just says it is waiting | D-33 |

## Answered 2026-09-06, second round

| # | Question | David's answer | Logged as |
| --- | --- | --- | --- |
| Q-12 | Popup | Separate small window, minimal, system lines only, opens and closes by itself; setup once from the CLI | D-39, D-40, D-43 |
| Q-13 | Pause indicator | No interruption of the call; just a chatroom line both sides see | D-42 |
| Q-14 | Reddit tier | A public link in an r/ClaudeAI community post | D-45 |
| Q-15 | Presence count | Yes, honest | D-44 |
| Q-16 | Folder | Rename to waiting-room | D-38 |
| Q-17 | Home page | Garnished, but redo the whole design: polished retro, 2000s and 2010s textures, funny yet smooth | D-46 |
| Q-18 | Typed chat | No typing; system lines in retro chatroom style | D-43 |
| Q-19 | Name | waiting-room | D-38 |

## Open

Each has the default assumed in the plan. Answer any and the logs get updated.

(None open. Q-26 to Q-28 were answered on 2026-09-06; see below.)


**Q-20  Alpha browser.** May the alpha require Chrome on macOS?
Answer (2026-09-06): yes. (D-67)

**Q-21  When does the window open?** Only on a match, or as soon as you are queued?
Answer (2026-09-06): "see the count. I want indication of waiting room is active in minimal way but still matches the theme and uiux goal." Resolved as a shaded window: the window opens when you are queued, collapsed to its title bar and one count line, and unrolls when a stranger enters. (D-62)

**Q-22  When the stranger leaves but your Claude is still working.**
Answer (2026-09-06): keep it on while queued. The window shades back up instead of closing. (D-63)

**Q-23  Voice of the pause lines.**
Answer (2026-09-06): the default: away messages for pauses, deadpan room lines for enter, leave, and the countdown. (D-42 accepted)

**Q-24  Sounds.**
Answer (2026-09-06): yes. (D-47 and D-60 accepted)

**Q-25  Design direction.**
Answer (2026-09-06): the leading one (Classic Mac OS, Poolsuite grammar), with notes: apply the dot filter to the video call; make the chat area shorter; research colors with reference to poolsuite.net's color usage, themes, icons, and buttons, and think hard about retro but also modern and fun; pastel colors would be nice; the video effect could be just a CSS filter on the feed, the simplest way without processing. "I love what we have already, just need some small adjustments to make it feel right." (D-59 accepted; D-64, D-65, D-66)

**Q-26  Default desktop tint.**
Answer (2026-09-06): "pool." (D-78)

**Q-27  Pick up with one click, or connect automatically?**
Answer (2026-09-06): "connect automatically. because they enabled the plugin so that itself is agreeing to have this interaction?" Yes. Turning the plugin on is the consent. (D-79; D-75 superseded and kept as the fallback if the no-gesture audio test fails; D-80 adds the quiet-room rule)

**Q-28  Geneva or a pixel font for the lines?**
Answer (2026-09-06): "geneva." (D-81)

## Action items for David (not questions)

- ~~Cloudflare dashboard: can a free-plan account create a Realtime TURN key without a card?~~ Answered 2026-09-06: no, enabling Realtime needs a card (community thread plus Cloudflare's billing rule; the docs themselves are silent). Plan: STUN only until a pair fails to connect, then the card with our own cap (D-82). Add the card in Phase 2 at the earliest, before the Reddit post at the latest.
- Ten minutes in r/ClaudeAI and r/cursor searching for anything like this; the research agents cannot crawl Reddit. This matters more now that Reddit is the second audience.
