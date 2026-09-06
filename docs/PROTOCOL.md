# waiting-room protocol, alpha

The contract between the three parts: the plugin on your machine, the lobby (one Cloudflare Worker, one Durable Object), and the room window. Every message, every state, every number, in one place. Copy for the window lives in `worker/public/copy.js`; the lobby sends keys, the window renders text.

## 1. Parts

| Part | Where | Talks to |
| --- | --- | --- |
| Plugin | `plugin/`, installed in Claude Code | Lobby over HTTPS, one POST per hook |
| Lobby | `worker/`, Worker + `Lobby` Durable Object (SQLite, free plan) | Plugin (HTTP), windows (WebSocket) |
| Window | `worker/public/room.html` in a Chrome app window | Lobby (WebSocket), the stranger (WebRTC) |
| Setup page | `worker/public/setup.html`, visited once | Lobby (HTTP) |

Nothing about the task leaves the machine. A hook POST carries a token, an event name, a hashed session id, and a timestamp. That is all.

## 2. Numbers

All in the lobby's config (`worker/wrangler.jsonc` `vars`), provisional until Phase 0 logging.

| Name | Value | Meaning |
| --- | --- | --- |
| `T` | 15 s | Arm threshold. A task shorter than this never makes a window (D-83). |
| `F` | 20 s | Freshness. Pairing needs a hook within the last F seconds (D-41). |
| `N` | 90 s | Silence. No hook for N seconds while not paused means Claude went quiet (D-69). |
| `G` | 90 s | Grace after a turn that ends with a question (D-13). |
| `P` | 10 min | Patience while Claude waits on you (permission, question, tool input) or on a background task. |
| `Q` | 45 s | Quiet room. No speech from either side for Q seconds ends the room (D-80). |
| `COUNTDOWN` | 5 | Seconds of goodbye (D-10). |
| `ROOM_MAX` | 30 min | Longest room. |
| `PEER_COOLDOWN` | 60 s | Do not re-pair the same two people within this window. |
| `OPEN_RETRY` | 30 s | If no window ever connected after "open", one more "open" is allowed. |
| `TICKET_TTL` | 10 min | A room ticket must be used within this time. |

## 3. Hook events

The plugin classifies on the machine (`plugin/scripts/signal.sh`) and sends one of five words.

| Claude Code hook | Sent as | Notes |
| --- | --- | --- |
| `UserPromptSubmit` | `started` | New task, or resume after a pause. |
| `PreToolUse` (any tool except `AskUserQuestion`), `PostToolUse` | `tick` | Heartbeat. |
| `PreToolUse` with `tool_name == "AskUserQuestion"`, `PermissionRequest`, `Elicitation` | `needs_you` | Claude is waiting on you. |
| `Stop` with `background_tasks` non-empty | `paused` with `why: "bg"` | Claude will be woken by a task. |
| `Stop` whose `last_assistant_message` ends with a question | `paused` with `why: "question"` | Grace G, then stopped. |
| `Stop` otherwise, `StopFailure`, `SessionEnd` | `stopped` | Task over. |

`POST /api/hook`

```json
{ "token": "k8s2vq7m…", "event": "tick", "why": null, "session": "3f9a…(16 hex of sha256)", "ts": 1757200000000 }
```

Reply `{}` or, at most once per task, `{ "open": "https://…/room?t=TICKET" }`. The plugin opens that URL in a Chrome app window behind the terminal, under an atomic lock, and never prints anything.

Other HTTP routes:

| Route | Body or query | Reply |
| --- | --- | --- |
| `POST /api/register` | `{ token, invite }` | `{ ok, count, setup }` or `{ ok:false, error:"invite" }` |
| `POST /api/off` | `{ token }` | `{ ok }`, closes any window |
| `GET /api/count?t=TOKEN` | | `{ count, enabled }` |
| `POST /api/rehearse` | `{ token }` | `{ ok }`, next hook opens a test window (D-84) |
| `GET /api/probes?t=TOKEN` | | own Phase 0 probe records |
| `GET /ws?t=TICKET` | | WebSocket upgrade |

## 4. Task states, per token

```
none ──started──▶ armed ──T──▶ queued ◀──▶ paused ──G or P──▶ done
                    │            │
                 stopped      stopped, or N silence ("quiet")
                    ▼            ▼
                  done         done
```

- `armed`: started less than T ago. Nothing visible.
- `queued`: past T. Eligible for "open" (once) and, with a connected shaded window and a fresh hook, for pairing.
- `paused`: `needs_you` or `paused` arrived. Not pairable. If in a room, the away line posts. Any `started` or `tick` resumes to `queued` and posts "back".
- `done`: `stopped`, or grace over, or silence. A connected window closes with a countdown if in a room, at once if alone. A later hook of any kind starts a new task.

Rules: one "open" per task (D-68), plus one retry after OPEN_RETRY only if no window ever connected; a window that drops reconnects on its own with the same ticket. A ticket is bound to its task and dies with it. Closing the window by hand marks the task opted out: no reopen, no pairing, until the next task. Hanging up does the same (D-49). One live window per token (D-50).

## 5. Window states

```
shaded ──match──▶ room ──peer left / quiet / time──▶ shaded
   │                │
 close            closing (countdown) ──▶ closed
```

Sizes: shaded 380 by 100 outer, room 380 by 300, video 380 by 400 (D-74). The window resizes itself; the lobby never sends sizes.

## 6. WebSocket messages

JSON, one object per frame, `type` first. Server to window:

| type | fields | when |
| --- | --- | --- |
| `hello` | `others`, `state`, `rehearsal`, `cfg:{Q, countdown}` | on connect |
| `others` | `n` | whenever the count of other queued people changes |
| `state` | `state: "shaded" \| "room" \| "closing"` | on every change |
| `line` | `key`, `who: "sys" \| "you" \| "them" \| "soft"`, `n?` | a log line; text from `copy.js` |
| `match` | `role: "offer" \| "answer"`, `room`, `iceServers` | a stranger; start WebRTC |
| `signal` | `room`, `data` (SDP or ICE, opaque) | relayed from the peer; drop it if `room` is not your current room |
| `peer` | `video: bool` | the peer toggled video |
| `countdown` | `n`, `mine: bool`, `reason: "done"` | once a second, n from COUNTDOWN down to 1; then `close` (or `left` on the other side) |
| `close` | `reason: "done" \| "hangup" \| "quiet" \| "off" \| "rehearsal" \| "manual"` | close yourself after the line |

Window to server:

| type | fields | meaning |
| --- | --- | --- |
| `signal` | `room`, `data` | relay to the peer; the lobby drops frames for a room you are not in |
| `speech` | `active: bool` | edge-triggered from the local meter: true when speech starts, false about 1.5 s after it stops; at most one frame per 2 s |
| `video` | `on: bool` | toggled video |
| `hangup` | | leave; out for this task |
| `report` | | leave and flag the peer |
| `bye` | `reason: "manual"` | sent on pagehide when the window was not told to close |
| `probe` | `data` | Phase 0 measurements, stored per token |

## 7. Line keys

| key | who | text |
| --- | --- | --- |
| `count` | sys | count line; `n` others |
| `entered` | sys | Stranger has entered the room. |
| `hear` | soft | They can hear you. Say hi. |
| `brb` | you / them | brb, my Claude needs me |
| `back` | you / them | back |
| `done_you` | sys | Your Claude is done. Closing in 5. |
| `done_them` | sys | Stranger's Claude is done. Leaving in 5. |
| `left` | sys | Stranger has left the room. |
| `requeued` | soft | Back in the queue. |
| `video_on` | sys | Video is on. |
| `quiet_claude` | sys | Your Claude went quiet. Closing. |
| `quiet_room` | sys | Quiet room. Back in the queue. |
| `time_up` | sys | Thirty minutes. Back in the queue. |
| `reported` | sys | Reported. Leaving. |
| `rehearsal` | sys | This is a test. Closing in 5. |
| `done_alone` | sys | Your Claude is done. |

## 8. One wait, as a trace

```
plugin  → hook started            ← {}
plugin  → hook tick (×n)          ← {}
plugin  → hook tick at 15 s       ← {open: /room?t=abc}
window  → ws connect t=abc        ← hello {others:1, state:"shaded"}
                                   ← line count n=1
(another token reaches the same point)
                                   ← match {role:"offer"}  · state room · line entered · line hear
window  → signal (offer)  …  ← signal (answer) … ice both ways
plugin  → hook needs_you          ← {}     window ← line brb (you)   peer ← line brb (them)
plugin  → hook tick               ← {}     window ← line back        peer ← line back
plugin  → hook stopped            ← {}     window ← state closing · countdown 5…0 · close done
                                           peer   ← countdown 5…0 (mine:false) · line left · state shaded · line requeued
```

## 9. Pairing

Candidates: task `queued` (not paused), a hook within F, a connected window that is not a rehearsal, not in a room, not blocked, not opted out. Sort by task start, oldest first. Pair greedily, skipping a pair that were together within PEER_COOLDOWN. The first of the pair gets `role: "offer"`.

`others` and the terminal's count are the people whose Claude is working: a live shaded window, a task that is not done, not paused (Claude waiting on them), not in a room, not blocked. Freshness is not applied to the count, so a long tool call does not make the number flicker (D-85).

## 10. TURN

`iceServers` is `[{ urls: "stun:stun.cloudflare.com:3478" }]` until a TURN key exists (D-82). With `TURN_KEY_ID` and `TURN_API_TOKEN` set, the lobby mints a credential per room with a TTL of ROOM_MAX and stops minting when its monthly relay estimate passes `RELAY_BUDGET_GB`.

## 11. Abuse and safety

Every route needs a registered token; registration needs an invite code from `INVITES` (empty means open, alpha uses a code). Report flags the peer; three flags in a day block a token for a day. Rooms never carry text. Nothing is stored beyond the lobby's in-memory state, a small SQLite blob for restarts, and the probe records you asked for.
