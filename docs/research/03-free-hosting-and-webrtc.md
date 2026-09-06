# Free hosting and WebRTC for a 1:1 stranger-pairing call app

Research date: 2026-09-05. Every number below carries the URL it came from. Anything not confirmed on an official page is tagged **(unverified)**.

Project shape assumed: a web app that pairs two waiting strangers into a 1:1 audio/video call, hangs up when one side's agent finishes. Scale: tens of users now, 10 to 100 calls/day of 1 to 10 minutes, maybe a few hundred users later. Budget target: $0/month.

---

## Headline numbers

| Thing | Number | Source |
| --- | --- | --- |
| Workers Free requests | 100,000/day | <https://developers.cloudflare.com/workers/platform/limits/> |
| Workers Free CPU per invocation | 10 ms (active CPU, not wall clock) | same |
| Static asset requests | free and unlimited, do not count | <https://developers.cloudflare.com/workers/platform/pricing/> |
| Durable Objects on Free plan | yes, SQLite-backed only | <https://developers.cloudflare.com/durable-objects/platform/pricing/> |
| DO Free requests | 100,000/day (separate meter from Workers) | same |
| DO Free duration | 13,000 GB-s/day | same |
| DO Free storage | 5 GB total, 5M rows read/day, 100k rows written/day | same |
| Incoming WebSocket messages billed as DO requests | **20:1** | same |
| Duration while hibernated | **not billed** | same |
| WebSocket connections per DO | 32,768 | <https://developers.cloudflare.com/durable-objects/api/state/> |
| Cloudflare TURN free allowance | **1,000 GB/month egress** (shared with SFU) | <https://developers.cloudflare.com/realtime/sfu/pricing/> |
| Cloudflare TURN price after | $0.05/GB | same |
| What Cloudflare TURN meters | **egress only** (relay to TURN client) | <https://developers.cloudflare.com/realtime/turn/faq/> |
| Cloudflare STUN | free and unlimited | <https://developers.cloudflare.com/realtime/turn/faq/> |
| Turnstile Free | unlimited challenges, 20 widgets | <https://developers.cloudflare.com/turnstile/plans/> |

**Estimated monthly cost at 100 calls/day x 5 min, 720p video, 20% relayed: $0.**

The TURN bill would be about 22.5 GB against a 1,000 GB free allowance. Cloudflare compute would be roughly 600 DO requests/day against 100,000. You would need somewhere around **4,400 five-minute calls a day** before TURN costs a cent, and around **16,000 calls a day** before the Durable Object request meter does.

The one open question: **whether a Free-plan Cloudflare account can create a TURN key without a card on file could not be verified.** Test that in the dashboard before committing. Everything else in the stack is confirmed available on Free.

---

## Comparison table

| Option | Free tier | What runs out first | Free-tier headroom at 5-min 1:1 calls | Custom UI | Auto hang-up | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| **Worker + DO signaling + P2P WebRTC + Cloudflare TURN** | 100k Worker req/day, 100k DO req/day, 13k GB-s/day, **1,000 GB TURN egress/mo** | TURN egress | **~4,400 calls/day** | total | your own `leave` message | **recommended** |
| Daily.co | 10,000 participant-min/mo | minutes, then **uncapped billing** | ~33 calls/day | yes (headless call object) | `eject` REST + `leave()` | best hosted option, but no spend cap |
| LiveKit Cloud (Build) | 5,000 min, 50 GB, 100 concurrent | minutes, **hard cap** | ~17 calls/day | yes | `removeParticipant` / `deleteRoom` | safest billing, smallest ceiling |
| Whereby Embedded (Explore) | 2,000 participant-min/mo | minutes, no overage allowed | ~7 calls/day | **no** ("Limited white labelling") | `endMeeting()` | does not fit |
| JaaS (Developer) | 25 users (MAU) | MAU, **undefined for anonymous users** | unknown | via iframe API | `hangup` command | untestable premise |
| meet.jit.si public | 25 active endpoints/month (ToS) | ToS, and **login required since 2023** | n/a | via iframe | `hangup` command | disqualified |
| PeerJS cloud | undocumented | no SLA, open reliability issues | n/a | n/a | n/a | **no matchmaking**, redundant with your DO |
| Cloudflare RealtimeKit (ex-Dyte) | none listed | immediately | 0 | yes | SDK | no free tier |
| Self-hosted coturn on Oracle Always Free | 2 ARM OCPUs, 10 TB egress/mo | **idle reclamation policy** | n/a | n/a | n/a | free VM actively reclaims idle boxes |
| Self-hosted coturn on fly.io | 2 hours trial only | trial ends in 7 days | n/a | n/a | n/a | UDP model cannot host coturn |
| Metered "Open Relay" (TURN only) | 20 GB/mo | relay bandwidth | ~90 calls/day | n/a | n/a | reasonable fallback if Cloudflare TURN needs a card |
| Xirsys (TURN only) | 500 MB/mo after 30-day trial | relay bandwidth, hard cap | ~2 calls/day | n/a | n/a | too small |
| Twilio NTS (TURN only) | STUN free, no TURN free tier | immediately | 0 | n/a | n/a | $0.40 to $0.80/GB, 8x to 16x Cloudflare |

Headroom columns are computed, not quoted. Participant-minute tiers are divided by 2 because a 1:1 call bills two participants. TURN rows assume 720p VP8 at 1 Mbps with Cloudflare's egress-only metering and 20% of calls relayed; Metered's and Xirsys's own metering basis differs, so those two rows are indicative only.

---

## Recommended stack

**Cloudflare Worker with a static assets binding, one SQLite-backed Durable Object as the global lobby using the WebSocket Hibernation API, browser-to-browser WebRTC, Cloudflare STUN always and Cloudflare Realtime TURN as fallback, Turnstile on the join action.**

| Layer | Choice | Why |
| --- | --- | --- |
| Static hosting | Workers static assets binding | free and uncounted |
| Signaling and matchmaking | one Durable Object, hibernating WebSockets | globally consistent queue, no duration charges when idle |
| Media | `RTCPeerConnection`, P2P | never touches your infrastructure, so it never costs anything |
| NAT traversal | `stun.cloudflare.com` + Cloudflare TURN | documented, free, 1,000 GB/mo relay allowance |
| Abuse gate | Turnstile Invisible + DO-side rate limit | unlimited free challenges |
| Auto hang-up | `leave` message on the existing WebSocket | you already own the channel |

### Why the existing Worker + DO pattern fits this problem unusually well

The author already runs exactly this shape: a Cloudflare Worker with a SQLite-backed Durable Object, WebSocket hibernation, and a static assets binding, on the Free plan (the `mistcontrol.byproductlab.com` relay for the phone-sensors demo). That is not merely convenient, it is the right architecture for this problem for three independent reasons.

**1. Matchmaking is a consistency problem, and a DO is a consistency primitive.** Pairing two strangers means popping two entries from a shared queue without ever handing the same person to two partners. On stateless infrastructure that needs a lock, a transaction, or a compare-and-swap against some external store. A Durable Object is single-threaded and globally unique for a given name, so "check the queue, pop a peer, mark both as matched" is just three lines of ordinary JavaScript with no race to reason about. This is the part of the app that would be genuinely annoying anywhere else, and it is free here.

**2. The billing model happens to match the traffic shape.** A stranger-pairing app is bursty and mostly idle: long stretches with an empty lobby, punctuated by short flurries. Hibernation means an idle lobby costs nothing at all, while the 20:1 discount on inbound WebSocket messages means even the flurries are cheap. Contrast this with a hosted room service, which meters wall-clock participant-minutes and therefore charges the same whether the network was cooperative or not. The projected cost difference at 100 calls/day is $0 versus roughly $80/month, and the reason is structural rather than a matter of tier shopping.

**3. Media never touches your infrastructure.** Because the calls are 1:1, there is no reason for an SFU. The 80% or so of calls that connect peer-to-peer cost literally nothing, and only the relayed minority draws on the TURN allowance. This is the single biggest lever in the whole design, and it is only available if you own the signaling. Every hosted alternative bills you for all 100% of calls regardless.

The one thing to watch, and it is worth repeating because it is easy to get wrong: **hibernation is load-bearing, not an optimization.** A lobby DO that holds WebSockets with `ws.accept()` instead of `ctx.acceptWebSocket()` burns 85% of the entire free daily duration budget doing nothing (see the arithmetic in section 1). Get this right on day one and the app is free forever at this scale. Get it wrong and you hit a hard stop mid-day, every day, for no reason.

### Suggested build order

1. Worker + static assets + one lobby DO with hibernating WebSockets. Join, match, relay, leave. No media yet, just prove two browsers get paired and can exchange JSON.
2. Add `RTCPeerConnection` with perfect negotiation and `stun.cloudflare.com` only. Most calls will connect. This is the ~150 lines.
3. Add Cloudflare TURN credentials minted in the DO at match time, shipped in the `matched` message. Instrument how often `remoteCandidateType === "relay"` so you learn your own relay rate instead of guessing at 20%.
4. Add Turnstile on join, DO-side rate limiting, and a report button before sharing the URL with anyone.

### Things worth deciding early

- **Audio-only mode is nearly free and worth offering.** At 64 kbps the TURN cost is about 1/16th of 720p video, and it sidesteps most of the camera-permission friction. For an app about talking to a stranger while you both wait, it may also be the better product.
- **Default to 360p, not 720p.** 400 kbps versus 1 Mbps is a 2.5x difference in relay cost, and for a small talking-head window nobody will notice.
- **Keep calls short by default.** It bounds cost, bounds abuse exposure, and matches the premise (you are both waiting on an agent, not scheduling a meeting).

---

## 1. Cloudflare Workers Free plan, today

### Workers account limits

| Feature | Workers Free | Workers Paid |
| --- | --- | --- |
| Requests | 100,000/day | No limit |
| CPU time per invocation | 10 ms | 5 min |
| Memory per isolate | 128 MB | 128 MB |
| Subrequests | 50/request | 10,000/request |
| Simultaneous outgoing connections per request | 6 | 6 |
| Worker size | 64 MiB | 64 MiB |
| Number of Workers | 100 | 500 |
| Static asset files per version | 20,000 | 100,000 |
| Individual static asset file size | 25 MiB | 25 MiB |

Source: <https://developers.cloudflare.com/workers/platform/limits/> ("Requests | 100,000/day", "CPU time | 10 ms", "Memory | 128 MB").

Two clarifications that matter here:

The "6 simultaneous outgoing connections" limit is about connections your Worker opens *outbound*, not about how many browsers can connect *inbound*. It is not a cap on WebSocket clients. Same page: "Simultaneous outgoing connections/request | 6".

CPU time is active processing, not wall clock. The Durable Objects docs spell this out: "Note that CPU time is active processing time: not time spent waiting on network requests, storage calls, or other general I/O, which don't count towards your CPU time or Durable Objects compute consumption." (<https://developers.cloudflare.com/durable-objects/platform/limits/>). A signaling Worker that mostly forwards small JSON blobs uses almost no CPU, so the 10 ms free-plan CPU ceiling is not a real constraint for this workload.

### Static assets: free and uncounted

"Requests to static assets are free and unlimited." (<https://developers.cloudflare.com/workers/platform/pricing/>)

This is a bigger deal than it sounds. The HTML, JS, and CSS for the app do not eat into the 100,000 requests/day. Only requests that actually run your Worker code count.

### What counts as a request

"WebSocket connections made to a Worker are charged as a request, representing the initial `Upgrade` connection made to establish the WebSocket." and "WebSocket messages routed through a Worker do not count as requests." (<https://developers.cloudflare.com/workers/platform/pricing/>)

So at the Worker layer, one call = 2 WebSocket upgrades = 2 requests. Messages after that are free at the Worker layer. The DO layer bills differently (see below).

### Durable Objects on the Free plan: yes, SQLite-backed only

"**Workers Free plan**: Only Durable Objects with SQLite storage backend are available." (<https://developers.cloudflare.com/durable-objects/platform/pricing/>)

Compute:

| | Workers Free plan | Workers Paid plan |
| --- | --- | --- |
| Requests | 100,000 / day | 1 million / month, + $0.15/million |
| Duration | 13,000 GB-s / day | 400,000 GB-s / month, + $12.50/million GB-s |

Storage (SQLite backend):

| | Workers Free plan | Workers Paid plan |
| --- | --- | --- |
| Rows read | 5 million / day | First 25 billion / month + $0.001/million |
| Rows written | 100,000 / day | First 50 million / month + $1.00/million |
| SQL stored data | 5 GB (total) | 5 GB-month, + $0.20/GB-month |

Source: <https://developers.cloudflare.com/durable-objects/platform/pricing/>

Overrun behavior on Free is a hard stop, not a bill: "If you exceed any one of the free tier limits, further operations of that type will fail with an error." and "Daily free limits reset at 00:00 UTC." (same page).

Note that SQLite storage billing only turned on recently: "Storage billing for SQLite-backed Durable Objects will be enabled in January 2026, with a target date of January 7, 2026 (no earlier)." (same page). As of September 2026 it is live, and Free plan accounts get 5 GB total.

### WebSocket hibernation and how it changes billing

Incoming WebSocket messages are billed as DO requests at a 20:1 discount:

"A request is needed to create a WebSocket connection. There is no charge for outgoing WebSocket messages, nor for incoming WebSocket protocol pings. For compute requests billing-only, a 20:1 ratio is applied to incoming WebSocket messages to factor in smaller messages for real-time communication. For example, 100 WebSocket incoming messages would be charged as 5 requests for billing purposes. The 20:1 ratio does not affect Durable Object metrics and analytics, which reflect actual usage." (<https://developers.cloudflare.com/durable-objects/platform/pricing/>)

Duration is **not** billed while hibernated:

"Durable Objects that are idle and eligible for hibernation are not billed for duration, even before the runtime has hibernated them." (<https://developers.cloudflare.com/durable-objects/platform/pricing/>)

And the anti-pattern is explicit:

"Calling `accept()` on a WebSocket in an Object will incur duration charges for the entire time the WebSocket is connected. It is recommended to use the WebSocket Hibernation API to avoid incurring duration charges once all event handlers finish running." (footnote 4, same page)

Duration bills for the full 128 MB regardless of what you actually use: "Duration billing charges for the 128 MB of memory your Durable Object is allocated, regardless of actual usage." (footnote 5, same page)

**This is the single most important number in the whole document.** Do the arithmetic:

```
Free duration budget      = 13,000 GB-s/day
DO memory billed          = 128 MB = 0.128 GB
Seconds of "awake DO" free per day
                          = 13,000 / 0.128
                          = 101,562 s/day
                          = 28.2 hours/day
One DO awake 24/7         = 86,400 s x 0.128 GB
                          = 11,059 GB-s/day
                          = 85% of the entire free daily budget
```

So a *single* lobby Durable Object that holds WebSockets open with the non-hibernating `ws.accept()` API consumes 85% of the free daily duration allowance by itself, and two such objects blow through it. With the Hibernation API, an idle lobby costs essentially nothing. **Hibernation is not an optimization here, it is the thing that makes $0/month possible.**

Practical consequences:

- Use `ctx.acceptWebSocket(ws)` and the `webSocketMessage` / `webSocketClose` handlers, not `ws.accept()` plus `addEventListener`. "Unlike `ws.accept()`, `state.acceptWebSocket(ws)` allows the Durable Object to be hibernated" (<https://developers.cloudflare.com/durable-objects/best-practices/websockets/>).
- Never use `setInterval` for keepalive. "Events such as alarms, incoming requests, and scheduled callbacks prevent hibernation. This includes `setTimeout` and `setInterval` usage." (same page)
- Use `state.setWebSocketAutoResponse()` for ping/pong. "Application level auto-response messages handled by `state.setWebSocketAutoResponse()` will not incur additional wall-clock time, and so they will not be charged." (<https://developers.cloudflare.com/durable-objects/platform/pricing/>, footnote 3)
- Persist per-connection state with `serializeAttachment` / `deserializeAttachment`, because "In-memory state is reset" during hibernation and "When an event arrives, the Durable Object is re-initialized and its `constructor` runs" (<https://developers.cloudflare.com/durable-objects/best-practices/websockets/>).
- Keep the constructor cheap: "If an event occurs for a hibernated Durable Object, the runtime re-initializes it by calling the constructor. Minimize work in the constructor when using hibernation." (same page)

### Concurrent WebSocket connections per DO

"The WebSocket Hibernation API permits a maximum of 32,768 WebSocket connections per Durable Object, but the CPU and memory usage of a given workload may further limit the practical number of simultaneous connections." (<https://developers.cloudflare.com/durable-objects/api/state/>, `acceptWebSocket`)

Other relevant DO limits (<https://developers.cloudflare.com/durable-objects/platform/limits/>):

| Feature | Limit (SQLite-backed) |
| --- | --- |
| WebSocket message size | 32 MiB (only for received messages) |
| CPU per request | 30 seconds (default), configurable to 5 minutes |
| Storage per account | Unlimited (Paid) / 5 GB (Free) |
| Storage per Durable Object | 10 GB |
| Max DO classes per account | 500 (Paid) / 100 (Free) |
| Number of objects | Unlimited |
| Wall time for DO with a live WebSocket | "Unlimited. No hard limit while the caller stays connected to the Durable Object." |

Note the CPU footnote: "Each incoming HTTP request or WebSocket *message* resets the remaining available CPU time to 30 seconds." So a DO gets a fresh 30 s CPU budget per message, which is separate from and far more generous than the Worker's 10 ms free-plan figure.

---

## 2. TURN and STUN

### Cloudflare Realtime TURN (formerly Cloudflare Calls)

The product was renamed from Calls to Realtime; the docs now live under `/realtime/`. Note that `developers.cloudflare.com/realtime/pricing` is a 404, the canonical page is `/realtime/sfu/pricing/`.

**Free allowance: 1,000 GB/month. Price after: $0.05/GB.**

"Cloudflare Realtime SFU and TURN services cost $0.05 per GB of data egress." and "There is a free tier of 1,000 GB before any charges start. This free tier includes usage from both SFU and TURN services, not two independent free tiers." (<https://developers.cloudflare.com/realtime/sfu/pricing/>)

"Each account gets 1,000GB/month of data transfer from Cloudflare to your client for free." (<https://developers.cloudflare.com/realtime/sfu/limits/>)

The public pricing page agrees: "| Data Egress | 1,000 GB / month | $0.05 / GB |" under the TURN/SFU heading (<https://www.cloudflare.com/pricing/>).

**What is metered: egress only.** This is the most consequential detail in the whole cost model.

"Cloudflare TURN pricing is based on the data sent from the Cloudflare edge to the TURN client, as described in RFC 8656 Figure 1. This means data sent from the TURN server to the TURN client and captures all data, including TURN overhead, following successful authentication." (<https://developers.cloudflare.com/realtime/turn/faq/>)

The FAQ diagram labels the three legs explicitly: `Client -->|"Ingress (free)"| Server`, `Server -->|"Egress (charged)"| Client`, and `Server <-->|Not part of billing| PeerA[Peer A]`. Reinforced by "Data transfer from your client to Cloudflare is always free of charge." (<https://developers.cloudflare.com/realtime/sfu/limits/>)

So for a 1:1 call where one peer needs relay, Cloudflare bills only that peer's **downstream** leg. The peer's uploads are free, and the leg between the TURN server and the far peer is not billed at all. That is roughly a 4x saving versus a naive "everything through the relay counts twice" model, and a clean 2x versus providers that meter ingress plus egress.

**TURN and SFU share one meter, not two.** "Traffic between Cloudflare Realtime TURN and Cloudflare Realtime SFU or Cloudflare Stream (WHIP/WHEP) does not get double charged, so if you are using both SFU and TURN at the same time, you will get charged for only one." and "Cloudflare Realtime billing appears as a single line item on your Cloudflare bill, covering both SFU and TURN." (<https://developers.cloudflare.com/realtime/sfu/pricing/>)

Also worth knowing: TURN is free outright if you are also using the SFU. "Using Cloudflare Realtime TURN service is available free of charge when used together with the Realtime SFU. Otherwise, it costs $0.05/real-time GB outbound from Cloudflare to the TURN client." (<https://developers.cloudflare.com/realtime/turn/>). Not relevant for pure P2P, but it means adding an SFU later does not double your bill.

**Can a Free-plan account enable TURN without a card? (unverified.)** No official page states this either way. The 1,000 GB TURN/SFU line does appear in the "Free Tier Summary" table on <https://www.cloudflare.com/pricing/> next to Workers, D1, and R2. The TURN FAQ contrasts enterprise against "self-serve (pay with your credit card) plans" without saying free is excluded. A Cloudflare Community thread titled "No-CC TURN free tier" exists at <https://community.cloudflare.com/t/no-cc-turn-free-tier/846152> but returns HTTP 403 to automated fetches, so its content could not be read. **This is the one fact worth five minutes of empirical testing in the dashboard before committing to the stack**, because it is the only thing that would change the recommendation below.

### Getting short-lived TURN credentials

A POST to the credentials endpoint, with a TTL, returns a ready-to-use `iceServers` array (<https://developers.cloudflare.com/realtime/turn/generate-credentials/>):

```bash
curl https://rtc.live.cloudflare.com/v1/turn/keys/$TURN_KEY_ID/credentials/generate-ice-servers \
--header "Authorization: Bearer $TURN_KEY_API_TOKEN" \
--header "Content-Type: application/json" \
--data '{"ttl": 86400}'
```

"The **201 (Created)** response below can then be passed on to your front-end application" (same page). The response is shaped as `{"iceServers": [{"urls": ["stun:..."]}, {"urls": ["turn:...", "turns:..."], "username": "...", "credential": "..."}]}`.

Details that will bite you otherwise:

- TTL ceiling: "You can set a expiration time for a credential up to 48 hours in the future." (<https://developers.cloudflare.com/realtime/turn/faq/>)
- Format caveat: "The Cloudflare Realtime credential generation function returns a JSON structure similar to the expired RFC draft 'draft-uberti-behave-turn-rest-00', but it does not include the TTL value." (same page)
- Port 53 gotcha: "The alternate port 53 is known to be blocked by web browsers, and the TURN URL will time out if used in browsers. If you are using trickle ICE, this will not cause issues. Without trickle ICE you might want to filter out the URL with port 53 to avoid waiting for a timeout." (same page)
- Credentials can be revoked early: `POST https://rtc.live.cloudflare.com/v1/turn/keys/$TURN_KEY_ID/credentials/$USERNAME/revoke` returns "A **204 (No Content)** response ... if the credential is successfully revoked." (<https://developers.cloudflare.com/realtime/turn/generate-credentials/>)
- Key creation uses a different host and still says `calls`, not `realtime`: `POST /accounts/{account_id}/calls/turn_keys` on `https://api.cloudflare.com/client/v4/` (<https://developers.cloudflare.com/api/resources/calls/subresources/turn/methods/create>).

For this app: mint credentials in the lobby DO at match time with a short TTL (an hour is plenty for a call that lasts minutes) and ship them inside the `matched` message. Never put the `TURN_KEY_API_TOKEN` in client code.

### STUN

**stun.cloudflare.com is documented, free, and unlimited.** "Cloudflare's STUN service at `stun.cloudflare.com` is free and unlimited." (<https://developers.cloudflare.com/realtime/turn/faq/>)

The service table (<https://developers.cloudflare.com/realtime/turn/>):

| Service | Host | Port | Alternate |
| --- | --- | --- | --- |
| STUN over UDP | stun.cloudflare.com | 3478/udp | 53/udp |
| TURN over UDP | turn.cloudflare.com | 3478/udp | 53/udp |
| TURN over TCP | turn.cloudflare.com | 3478/tcp | 80/tcp |
| TURN over TLS | turn.cloudflare.com | 5349/tcp | 443/tcp |

TURN over TLS on 443 is what gets you through restrictive corporate firewalls. Also: "TURN service at `turn.cloudflare.com` will also respond to binding requests ('STUN requests')." (same page)

**stun.l.google.com:19302 is not an official Google product. (unverified/unofficial, no SLA.)** There is no Google product page, terms of service, or support commitment for this host. It appears only as an example value in sample code: `const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}` (<https://webrtc.org/getting-started/peer-connections>), and as a preset dropdown option in the WebRTC samples repo (<https://github.com/webrtc/samples>). Treat it as best-effort community infrastructure that may change or disappear without notice. Since `stun.cloudflare.com` is documented and free, there is no reason to depend on Google's.

### TURN alternatives with free tiers

| Provider | Free tier | Metering | Price after | Notes |
| --- | --- | --- | --- | --- |
| **Cloudflare Realtime TURN** | **1,000 GB/mo** (shared with SFU) | **egress only** | $0.05/GB | Free with SFU. Card requirement on Free plan **(unverified)** |
| Metered "Open Relay" | 20 GB/mo | not stated on that page | n/a (separate product) | Signup now required for an API key |
| Metered premium TURN | 500 MB "FREE TRIAL" | ingress + egress | $99/mo for 150 GB, $0.40/GB overage | Entry tier is a trial, not an ongoing free tier |
| Xirsys | 500 MB/mo after a 30-day trial | not stated | fragmentary tiers, roughly $0.09 to $0.50/GB | Also caps at 2 channels, 25 concurrent WebSockets |
| Twilio NTS | STUN free, **no TURN free tier stated** | per GB | $0.40/GB (US, EU), $0.60 to $0.80/GB (APAC, SA) | 8x to 16x Cloudflare |

Quotes for each:

- Metered Open Relay: "Open Relay is a free TURN server provided by Metered Video that you can use in your WebRTC applications." and "The TURN Server provides 20 GB of free TURN Usage every month." and "To Connect to the Open Relay TURN Server, you need to sign-up for a free account and obtain your API Key." (<https://www.metered.ca/tools/openrelay/>). It runs on ports 80 and 443 "to bypass corporate firewalls" and supports "turns + SSL for maximum compatibility". The page footer reads "Copyright © 2026 Next Path Software Consulting Inc.", which is the evidence it still operates.
- Metered premium: "FREE TRIAL 500 MB $0 /mo 500 MB monthly TURN usage (ingress + egress)" and "GROWTH 150 GB $99 /mo ... Overage: $0.40/GB" and "Free STUN Unlimited STUN usage included free" (<https://www.metered.ca/stun-turn>). Note the verbatim "(ingress + egress)": Metered's GB do not go as far as Cloudflare's.
- Xirsys: "After day 30, your account stays active for free forever with one region, 2 channels, 25 concurrent WebSocket connections, unlimited STUN, and 500 MB/mo TURN." and "The 500 MB monthly TURN allowance is a hard cap. After the cap is reached, TURN relay stops functioning for the account until the monthly allowance resets or the account upgrades to a Production plan." (<https://xirsys.com/pricing/>, extracted from page source; the rendered page is JS-only).
- Twilio: "STUN - Globally available in all regions - Free", "TURN - US West - $0.400/GB", "TURN - Asia Pacific - Located in Singapore - $0.600/GB", "TURN - Asia Pacific - Located in Sydney, Australia - $0.800/GB" (<https://www.twilio.com/en-us/stun-turn/pricing>). The page states no free TURN allowance.

### Self-hosting coturn on a free VM: probably not worth it

coturn needs a wide UDP relay port range. From the shipped config (<https://github.com/coturn/coturn/blob/master/examples/etc/turnserver.conf>):

```
# TURN listener port for UDP and TCP (Default: 3478).
# TURN listener port for TLS (Default: 5349).
# Lower and upper bounds of the UDP relay endpoints:
# (default values are 49152 and 65535)
```

That roughly 16,000-port UDP range is the constraint that rules hosts in or out.

**Oracle Cloud Always Free** looks great on paper: "For Always Free tenancies, this is equivalent to 2 OCPUs and 12 GB of memory" and "As part of your Always Free resources, you get 10 TB per month of outbound data." (<https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm>)

But the same page has the killer clause: "Idle Always Free compute instances may be reclaimed by Oracle. Oracle will deem virtual machine and bare metal compute instances as idle if, during a 7-day period, the following are true: CPU utilization for the 95th percentile is less than 20% / Network utilization is less than 20% / Memory utilization is less than 20%". A hobby TURN box relaying a handful of short calls per day sits far below all three thresholds, which is exactly the profile Oracle reclaims. The same page also warns about "an 'out of host capacity' error" for Always Free shapes.

**fly.io is out on two counts.** The free tier is now a trial: "A free trial on Fly.io includes 2 hours of machine runtime or 7 days of access, whichever comes first." and "If you don't add a payment method by the end of your 7-day trial, or if you use up the included resources, your apps will stop running." (<https://fly.io/docs/about/free-trial/>). And "All organizations (except for Linked Organizations) require a credit card on file." (<https://fly.io/docs/about/pricing/>). Separately, its UDP model cannot host coturn: "You need a dedicated IPv4 address. You can't use a shared IPv4 address or an IPv6 address for UDP." and "The UDP side of your app needs to bind to the same port that is used externally." (<https://fly.io/docs/networking/udp-and-tcp/>), with each UDP port declared individually as a service. That is irreconcilable with a 49152 to 65535 relay range.

**Verdict:** self-hosting trades a $0 line item for a server you must patch, monitor, secure against being used as an open relay, and re-provision when it gets reclaimed. Cloudflare's 1,000 GB/month free tier is roughly two orders of magnitude more than this project will use (see section 3). Self-hosting is negative value here.

### How often is TURN actually needed?

There is no current, 1:1-specific measured statistic in the public record. Grading what exists:

**Vendor-measured but dated and skewed.** From callstats.io data covering "Jan 2015 - Feb 2016, corresponding to billions of minutes": "we already observe that 22% of the conferences need some kind of TURN relay server. About 9% of the conferences required TCP" (<https://webrtchacks.com/usage-stats/>). Critically, the same article states "More than half of the WebRTC sessions (65%) monitored by callstats.io have three participants ... Roughly a third of WebRTC sessions have two participants." A conference needs relay if *any* participant does, so 22% overstates the per-1:1-session rate. It is also about ten years old.

**Industry rule of thumb.** "You can expect anywhere between 5-20% of your sessions to require the use of TURN servers." (<https://bloggeek.me/how-webrtc-works/>, Tsahi Levent-Levi). No measurement cited; this is where the commonly quoted 10 to 20% figure comes from.

**Expert opinion on variance.** "There's no specific number that will work. I've seen anything between 0-50% of TURN relay. It ends up depending who your users are and where do they use their devices from. For most of the industry, I think 30% is a tad high." (<https://bloggeek.me/webrtc-turn/>, comment reply, 2 March 2022)

The defensible planning statement: **commonly estimated at 5 to 20%, with one 2016 conference-level vendor measurement at 22%, and real-world variance of 0 to 50% depending on your user population.** The model below uses 20% and also shows 100% so the worst case is visible. Instrument `RTCIceCandidatePair.remoteCandidateType === "relay"` in production and measure your own rate rather than trusting any of these.

---

## 3. Bandwidth and TURN cost model

### Bitrate inputs

Video, webcam content at 30 fps, targeting VMAF 90 (<https://livekit.com/webrtc/bitrate-guide>, "All tests were conducted at 30 frames per second"):

| Resolution | VP8 | H.264 | AV1 |
| --- | --- | --- | --- |
| 360p (640x360) | 400 kbps | 400 kbps | 190 kbps |
| 720p (1280x720) | 1.00 Mbps | 1.25 Mbps | 550 kbps |

Audio, Opus at a 20 ms frame size (<https://www.rfc-editor.org/rfc/rfc7587.txt>, section 3.1.1 "Recommended Bitrate"):

- "8-12 kbit/s for NB speech"
- "16-20 kbit/s for WB speech"
- "28-40 kbit/s for FB speech"

Opus overall range is "6 kbit/s to 510 kbit/s" (<https://www.rfc-editor.org/rfc/rfc6716.txt>).

For on-the-wire audio I use 64 kbps, which is 40 kbps of Opus plus RTP/UDP/IP/SRTP and TURN framing overhead at 50 packets/s. That overhead estimate is my own arithmetic, not a cited figure. **(unverified)**

### Unit conversion

```
1 Mbps sustained for 1 minute
  = 1,000,000 bits/s x 60 s
  = 60,000,000 bits
  = 7,500,000 bytes
  = 7.5 MB
```

### How much traffic a TURN relay actually touches, and how much of it Cloudflare bills

In a 1:1 call where one peer must use a relay candidate, all of that peer's media crosses the TURN allocation in both directions:

```
peer A (relayed)  --(uplink)-->  TURN  --(forward)-->  peer B
peer A (relayed)  <--(down)----  TURN  <--(recv)-----  peer B
```

Cloudflare bills **only the downstream leg to the TURN client**, per its FAQ: "data sent from the TURN server to the TURN client", with `Client -->|"Ingress (free)"| Server` and `Server <-->|Not part of billing| PeerA` (<https://developers.cloudflare.com/realtime/turn/faq/>).

So the billable quantity is simply **the media the relayed peer receives**, which is one direction's worth of bitrate, not two and not four:

```
Cloudflare billable egress per relayed call-minute
  = (per-direction bitrate) x 60 s              [one peer relayed]
  = 2 x (per-direction bitrate) x 60 s          [both peers relayed]
```

The FAQ notes the meter "captures all data, including TURN overhead", so add a few percent for TURN channel-data framing on top of the media bitrate. The tables below do not include that margin; treat them as roughly 5% optimistic. **(unverified: the exact overhead percentage is not published)**

This is worth pausing on, because it is a genuine 4x difference from the intuitive model. Someone reasoning "the relay handles 2 streams in and 2 streams out, so 4x the call bitrate" would overestimate the Cloudflare bill by a factor of four. Providers that meter "ingress + egress" (Metered states this verbatim) are closer to that intuitive model, which is why their headline GB figures are not comparable to Cloudflare's.

### Volume

```
100 calls/day x 5 min      =    500 call-minutes/day
x 30 days                  = 15,000 call-minutes/month
20% relayed via TURN       =  3,000 relayed call-minutes/month
```

### Cost table, Cloudflare Realtime TURN (1,000 GB/month free, then $0.05/GB)

| Scenario | Per-direction bitrate | Billable MB per relayed call-min | Relayed call-min/mo | Billable GB/mo | Cost |
| --- | --- | --- | --- | --- | --- |
| Audio only, 20% relayed | 64 kbps | 0.48 | 3,000 | **1.4 GB** | **$0** |
| 360p video (VP8), 20% relayed | 400 kbps | 3.00 | 3,000 | **9 GB** | **$0** |
| 720p video (VP8), 20% relayed | 1.0 Mbps | 7.50 | 3,000 | **22.5 GB** | **$0** |
| 720p video (H.264), 20% relayed | 1.25 Mbps | 9.375 | 3,000 | **28 GB** | **$0** |
| 720p (H.264), 100% relayed, worst case | 1.25 Mbps | 9.375 | 15,000 | **141 GB** | **$0** |
| 720p (H.264), 100% relayed, both peers relayed | 1.25 Mbps | 18.75 | 15,000 | **281 GB** | **$0** |
| 720p (VP8), 20% relayed, **10x the traffic** | 1.0 Mbps | 7.50 | 30,000 | **225 GB** | **$0** |

Arithmetic, shown for two rows:

```
720p VP8, one peer relayed:
  1,000,000 bits/s x 60 s / 8 = 7,500,000 B = 7.5 MB per relayed call-minute
  7.5 MB x 3,000 relayed call-min = 22,500 MB = 22.5 GB/month
  22.5 GB < 1,000 GB free  ->  $0

Audio only:
  64,000 bits/s x 60 s / 8 = 480,000 B = 0.48 MB per relayed call-minute
  0.48 MB x 3,000 = 1,440 MB = 1.44 GB/month  ->  $0
```

### What growth would actually break $0

```
Free allowance            = 1,000 GB/month = 1,000,000 MB
720p VP8, one peer relayed, 20% relay rate:
  1,000,000 MB / 7.5 MB   = 133,333 relayed call-minutes/month
  / 0.20 relay rate       = 666,667 total call-minutes/month
  / 30 days               =  22,222 call-minutes/day
  / 5 min per call        =   4,444 calls/day
```

| Scenario | Five-minute calls/day before TURN costs a cent |
| --- | --- |
| Audio only, 20% relayed | ~69,000 |
| 360p video, 20% relayed | ~11,000 |
| 720p VP8, 20% relayed | ~4,400 |
| 720p H.264, 20% relayed | ~3,600 |

The stated plan is 10 to 100 calls/day. **The TURN free tier is roughly 40x to 700x oversized for that**, and even at 100% relay it is not close. The first dollar of TURN spend arrives somewhere around a thousand times the current traffic, and by then the project has other problems. Also note the relay rate is a linear multiplier: if your users turn out to be 50% relayed instead of 20%, divide those headroom numbers by 2.5 and they are still enormous.

Caveat on the free tier: it is shared, not per-service. "This free tier includes usage from both SFU and TURN services, not two independent free tiers." (<https://developers.cloudflare.com/realtime/sfu/pricing/>) Pure P2P uses no SFU, so the whole 1,000 GB is yours.

### Cloudflare-side compute cost: not close to a limit

The Workers request meter (100,000/day) and the Durable Objects request meter (100,000/day) are separate line items on separate pricing pages, so you get both.

Per call, at the Worker layer: 2 WebSocket upgrades, so 2 requests. The page load itself is free ("Requests to static assets are free and unlimited").

Per call, at the DO layer: 2 connection-creating requests, plus the signaling messages at the 20:1 discount. Budget 40 inbound messages per participant per call (join, offer or answer, roughly 15 trickled ICE candidates, a few state changes, leave):

```
100 calls/day x 2 participants          =   200 connections/day
Worker requests                         =   200/day        (0.2% of 100,000)

DO connection requests                  =   200/day
DO inbound messages 200 x 40            = 8,000/day
  billed at 20:1                        =   400/day
DO requests total                       =   600/day        (0.6% of 100,000)

Headroom before the DO request cap bites ~ 16,000 calls/day
```

One caveat on that arithmetic: the 20:1 ratio is described as "For compute requests billing-only" and "does not affect Durable Object metrics and analytics, which reflect actual usage" (<https://developers.cloudflare.com/durable-objects/platform/pricing/>), and the Free plan produces no bill. Whether the free daily cap is evaluated on billed or raw requests is not stated, so check the conclusion the pessimistic way too: at flat 1:1 accounting the same traffic is 200 + 8,000 = 8,200 DO requests/day, which is 8.2% of the 100,000/day cap. The conclusion holds either way.

Duration, assuming the Hibernation API is used correctly, is near zero because the lobby sleeps between joins. Rows written stay in the low hundreds per day if pairing state lives in `serializeAttachment` rather than SQL. Storage is kilobytes against a 5 GB free allowance.

**Conclusion: signaling and matchmaking are free at this scale with a very wide margin. The only line item with any risk of costing money is TURN relay bandwidth.**

---

## 4. Buy vs build for the call itself

### The unit that decides this

Every minute-metered vendor bills **per participant**, not per call. Daily states it plainly: "A participant minute refers to a minute for each participant on a call" (<https://www.daily.co/pricing/video-sdk/>). A 1:1 call therefore burns 2x wall-clock minutes, which quietly halves every free tier before you start.

The stated target, 100 calls/day at 5 minutes, is:

```
100 calls/day x 5 min x 2 participants x 30 days = 30,000 participant-minutes/month
```

### Free tiers, and where each one runs out

| Service | Free tier | Behavior past it | Five-minute 1:1 calls/day the free tier covers | Cost at 100 calls/day x 5 min |
| --- | --- | --- | --- | --- |
| **Cloudflare Realtime TURN + own signaling** | **1,000 GB/mo egress** | $0.05/GB | **~4,400** | **$0** |
| Daily.co | 10,000 participant-min/mo | **billed, no cap** at $0.004/min | ~33 | ~$80/mo |
| LiveKit Cloud (Build) | 5,000 min, 50 GB, 100 concurrent | **hard cap, calls fail** | ~17 | blocked, or $50/mo (Ship) |
| Whereby Embedded (Explore) | 2,000 participant-min/mo | **no additional minutes** | ~7 | $9.99/mo + $0.004/min |
| JaaS (Jitsi as a Service, Developer) | 25 users (MAU) | $0.99 per extra MAU | depends on MAU definition **(unverified)** | unclear |
| meet.jit.si public | 25 active endpoints/month (ToS) | ToS violation | n/a | n/a |
| PeerJS cloud | brokering only, no stated limits | no SLA, no stated terms | n/a (no matchmaking, no media) | $0 but unreliable |
| Cloudflare RealtimeKit (ex-Dyte) | none listed on the pricing page | $0.002/min A/V participant | 0 | ~$60/mo |
| Agora | "First 10,000 combined RTC minutes free every month" | "Starts at $0.59 per 1000 minutes" | ~33 (if per-participant, **unverified**) | ~$80/mo |
| 100ms | 10,000 min/mo | $0.004/min per participant | ~33 | ~$80/mo |

Crossover arithmetic, worked once:

```
Daily free tier    = 10,000 participant-min/month
/ 2 participants   =  5,000 call-minutes/month
/ 30 days          =    167 call-minutes/day
/ 5 min per call   =     33 five-minute calls/day
```

**That is the headline result of this section.** The stated range is 10 to 100 calls/day. Every minute-metered free tier runs dry somewhere *inside* that range, most of them near the bottom of it. Cloudflare's TURN allowance runs dry at roughly 4,400 calls/day. The gap is two orders of magnitude, and it exists because P2P WebRTC only pays for the minority of calls that actually need a relay, whereas a hosted room service meters every second of every call whether it needed help or not.

### Per-vendor notes

**Daily.co** is the best of the hosted options. "10,000 free minutes every month" and "After you have used your free 10,000 participant minutes for the month, you will be billed $0.004 for each additional participant minute" (<https://www.daily.co/pricing/video-sdk/>). Custom UI is genuinely supported: "Call object mode is headless. Daily loads its media engine but renders no UI." and "Your application receives participant state and media tracks, and you render everything yourself." (<https://docs.daily.co/guides/products/call-object>). Auto-hangup has three levers: client `leave()`, admin `updateParticipant()` with `eject: true`, and a server REST `POST /rooms/{room_name}/eject` that "Ejects participants from a room" (<https://docs.daily.co/reference/rest-api/rooms/session/eject.md>).

The risk is stated verbatim on their own pricing page: "Daily Video is pay-as-you-go, so after your 10,000 free participant minutes for the month, there is no hard cap that stops your calls." For a hobby project with a public URL and no login, an uncapped meter is a real hazard.

**LiveKit Cloud** has the API you would want and the safest billing posture, but the smallest useful ceiling. Server-side hangup exists exactly as hoped: "The RemoveParticipant API forcibly disconnects the participant from the room" (<https://docs.livekit.io/home/server/managing-participants/>) and "Deleting a room causes all Participants to be disconnected" (<https://docs.livekit.io/home/server/managing-rooms/>). And the free tier cannot bill you: "For projects on the free Build plan, the included allowance acts as a hard cap, after you exceed it, new requests fail rather than incurring overage charges." (<https://docs.livekit.io/home/cloud/quotas-and-limits/>). Free tier is "5,000 minutes included", "50GB included", "100" concurrent connections (<https://livekit.com/pricing>). Note `livekit.io/pricing` now redirects to `livekit.com/pricing`.

**Whereby Embedded** does not fit. The Explore plan is "Up to 2,000 participant minutes/mo" with "No additional participant minutes" and "Limited white labelling" (<https://whereby.com/information/embedded/pricing/>). That last phrase is the disqualifier for a custom-UI project: you get attribute toggles on Whereby's own iframe (`topToolbar=on/off`, `leaveButton=on/off`, `logo=off`, `minimal`, per <https://docs.whereby.com/reference/using-the-whereby-embed-element.md>), not your own interface. Hangup is available via `endMeeting()` and `leaveRoom()`. 2,000 participant-minutes is about 7 five-minute calls a day.

**Jitsi, public instance:** anonymous room creation ended three years ago. "Starting on August 24th, we will no longer support the anonymous creation of rooms on meet.jit.si" (<https://jitsi.org/blog/authentication-on-meet-jit-si/>, 22 August 2023). And the ToS caps free use hard: "Your Use of the Service at no cost is limited to a maximum aggregate total of 25 Active End Points per calendar month" (<https://jitsi.org/meet-jit-si-terms-of-service/>). Requiring every stranger to sign in with Google or GitHub before they can be paired is fatal to this product's premise.

**JaaS** is the one vendor that bills by people rather than minutes, which structurally suits "tens of users who talk a lot". Developer plan is "25 Users", then "Basic" at "300 Users" for "$99", with "an overage charge of $0.99 per MAU" (<https://cpaas.8x8.com/en/pricing/jitsi-as-a-service-pricing/>). But the page does not define MAU, and whether each anonymous stranger counts as one is **(unverified)**. That single undefined term is the whole bet, so it cannot be recommended without testing.

**PeerJS cloud: do not use it.** The site's entire statement about the service is one sentence, "Use our free cloud server or host your own PeerServer" (<https://peerjs.com/>), with no limits, SLA, or terms. It does peer-ID brokering only, with no matchmaking or pairing primitive, so it duplicates nothing you need and supplies nothing you lack (your DO already does the hard part). Its default ICE config hardcodes a shared TURN relay with public credentials `username: "peerjs", credential: "peerjsp"` alongside Google's undocumented STUN host (<https://github.com/peers/peerjs>, `lib/util.ts`). And reliability is visibly unattended: issue #1350, "Extreme WebSocket connection delay (6+ minutes) on 0.peerjs.com", was opened in October 2025 and remains open with no maintainer response (<https://github.com/peers/peerjs/issues/1350>). Note the repo is `peers/peerjs`, not `peerjs/peerjs`.

**Two 2026 status corrections worth recording:**

- **Twilio Programmable Video is NOT shutting down.** The EOL was reversed: "We previously announced in March 2024 that Twilio was going to End of Life (EOL) Twilio Video on December 5, 2026" and "After considering your feedback ... we've reversed our earlier decision to retire Twilio Video in 2026" and "Twilio Video will remain a standalone product" (<https://www.twilio.com/en-us/changelog/-twilio-video-will-remain-a-standalone-product/>). Current free-tier terms **(unverified)**.
- **Dyte is now Cloudflare RealtimeKit.** "The Dyte SDKs are now in maintenance mode and will no longer receive feature updates or bug fixes" and "As Dyte joins Cloudflare, we are transitioning all Dyte SDKs to the new Cloudflare RealtimeKit SDKs" (<https://docs.dyte.io/guides/realtimekit-migration/sdk-guide>). RealtimeKit pricing is "$0.002 / minute" for an audio/video participant and "$0.0005 / minute" audio-only, with no free tier shown on that page (<https://developers.cloudflare.com/realtime/realtimekit/pricing/>).

### Recommendation: DIY RTCPeerConnection

For a 1:1 call with custom UI and programmatic auto hang-up, **build it**. Three reasons, in order of weight:

1. **It is the only option that stays at $0 across the whole stated range.** Every hosted free tier runs out between 7 and 33 calls/day. The target is up to 100.
2. **You have already built the hard part.** Matchmaking and signaling in a Durable Object is the piece that no hosted service gives you anyway (none of them do stranger-pairing), and it is where most of the complexity lives. What remains is the `RTCPeerConnection` dance, which is genuinely on the order of 150 lines with the perfect negotiation pattern.
3. **Auto hang-up is trivial when you own the signaling channel.** It is a `peer_left` message on a WebSocket you already have open, then `pc.close()`. With a hosted service you would be calling an eject REST API from your Worker and hoping the client notices, which is more moving parts, not fewer.

The honest counterargument: Cloudflare Realtime is infrastructure, not a room service. There is no room abstraction, no prebuilt SDK, no reconnection logic, and no adaptive-quality tuning done for you. If this were a product with a deadline and paying users, Daily's headless call object would be the right call. For a hobby project where the custom UI is the point and the budget is zero, it is not.

**If you would rather buy anyway:** take LiveKit's Build tier specifically *because* its hard cap cannot generate a bill, and accept that calls stop working past roughly 17 calls/day. Daily is the better product but its uncapped meter is the wrong risk profile for an unauthenticated public URL.

---

## 5. Practical WebRTC 1:1 checklist

### HTTPS and secure context

`navigator.mediaDevices` exists only in a secure context. "This feature is available only in secure contexts (HTTPS), in some or all supporting browsers." (<https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaDevices>) and "The `getUserMedia()` method is only available in secure contexts." (<https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia>). The spec makes it normative via `[SameObject, SecureContext] readonly attribute MediaDevices mediaDevices;` (<https://www.w3.org/TR/mediacapture-streams/>). Chrome enforced this in M74 (<https://chromestatus.com/feature/4924861776396288>).

`http://localhost` counts as secure: "A secure context is, in short, a page loaded using HTTPS or the `file:///` URL scheme, or a page loaded from localhost." (<https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia>)

**Gotcha:** a LAN IP like `http://192.168.1.50` is *not* on that list. Testing on a phone against your laptop's LAN address will silently have no `mediaDevices`. Use a tunnel or deploy to the real origin. Since the plan is Workers with a static assets binding, `wrangler dev` on localhost plus a deployed preview covers both cases.

### Permission prompts, per browser

The baseline, from the spec and MDN: "Browsers may offer a once-per-domain permission feature, but they must ask at least the first time, and the user must specifically grant ongoing permission if they choose to do so." (<https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia>)

**The outcome most implementations forget:** the promise may never settle. "It's possible for the returned promise to neither resolve nor reject, as the user is not required to make a choice at all and may ignore the request." (same page), and the spec confirms "If the user never responds, this algorithm stalls on this step." (<https://www.w3.org/TR/mediacapture-streams/>). For a matchmaking app this matters a lot: a user who ignores the prompt will sit in your lobby holding a slot forever. Put a timeout on "waiting for media" and drop them out of the pool.

| Browser | Default grant | Scope | Notes |
| --- | --- | --- | --- |
| Chrome | "Allow this time" offered since M116; persistent is a separate choice | per-origin | One-time grants expire after "16 hours" or "The page has been in the background for at least 5 minutes" |
| Firefox | **one-time by default**, persistence is an opt-in checkbox | per-device and all-of-a-kind | since Firefox 115 |
| Safari | **one-time only** by default | all devices of a kind | persistent only via Settings > Websites |

Sources: "With a gradual rollout from Chrome 116, we will be adding the Allow this time option to permission prompts." and the four outcomes "Allow this time: Temporary allow. / Allow on every visit: Persistent allow. / Don't allow: Persistent block. / Clicking the x button: Temporary block." and "By default, all web permissions are bound to an origin" (<https://developer.chrome.com/blog/one-time-permissions>). Mozilla's summary table gives "Firefox | one-time & persisted | per-device & all of a kind | after use" and "Safari | one-time only | all of a kind | after use" (<https://blog.mozilla.org/webrtc/one-time-permissions-are-here-to-stay/>).

Safari prompts per media kind, not per device: "Safari does not require the user to choose specific devices; instead the prompt requests access for all devices of a specific type, like all cameras or microphones ... subsequent calls to getUserMedia for the same device type will avoid presenting additional prompts to the user." (<https://webkit.org/blog/7763/a-closer-look-into-webrtc/>). Persistence is a settings control: "the user can decide to always allow or deny access to the camera and microphone through Safari preferences ... on a per-origin basis" (same page), surfaced as Ask / Deny / Allow per site (<https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac>).

**On a hard deny you cannot re-prompt.** The Permissions spec short-circuits: "To request permission to use a descriptor ... If current state is not 'prompt', return current state and abort these steps." (<https://www.w3.org/TR/permissions/>). And getUserMedia rejects immediately: "Remove from candidateSet any candidate whose device's permission state is 'denied'. ... If candidateSet is now empty ... Permission Failure: Reject p with a new DOMException object whose name attribute has the value 'NotAllowedError'." (<https://www.w3.org/TR/mediacapture-streams/>). There is no shipped programmatic request API (`Permissions.request` is `false` in Firefox and Safari, flag-gated in Chrome, per <https://github.com/mdn/browser-compat-data/blob/main/api/Permissions.json>).

So on `NotAllowedError`, render instructions pointing at the address-bar lock or camera icon. **Never loop on `getUserMedia()`.** "With Chrome M116, users can easily reset permissions from the URL bar in all modern browsers." (<https://blog.mozilla.org/webrtc/one-time-permissions-are-here-to-stay/>)

**Permissions API now works in all three engines.** `Permissions.permission_camera` and `permission_microphone`: `chrome 64`, `firefox 132`, `safari 16` (<https://github.com/mdn/browser-compat-data/blob/main/api/Permissions.json>). Firefox caught up in 132, so `navigator.permissions.query({name:'camera'})` is finally usable for pre-flight UI. One caveat: "if an API is restricted by permissions policy, the returned permission would be denied and the user would not be prompted for access" (<https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API>). And an unexpired one-time grant is indistinguishable from a persistent one: "If the user picks Allow this time, the Permission API status is set to granted." (<https://developer.chrome.com/blog/one-time-permissions>)

Also worth heeding for a stranger-pairing flow: "Do not use the prompt state as a signal that a user is a first-time user." (same page)

### Safari quirks

**Autoplay.** "`<video>` elements will be allowed to autoplay without a user gesture if their source media contains no audio tracks." and "`<video muted>` elements will also be allowed to autoplay without a user gesture." and "If a `<video>` element gains an audio track or becomes un-muted without a user gesture, playback will pause." (<https://webkit.org/blog/6784/new-video-policies-for-ios/>). On macOS the default is stricter: "Websites should assume any use of `<video>` or `<audio>` requires a user gesture click to play." (<https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/>)

**Remote audio: WebKit carves out an exception, and it applies to this app.** (<https://webkit.org/blog/7763/a-closer-look-into-webrtc/>)

> "MediaStream-backed media will autoplay if the web page is already capturing."
> "MediaStream-backed media will autoplay if the web page is already playing audio. A user gesture will still be required to initiate audio playback."

Because this app always calls `getUserMedia()` first (both parties are on camera or mic), the page *is* already capturing, so attaching the remote stream and calling `play()` should work without a fresh gesture. That said, always `await el.play().catch(...)` and fall back to a visible "tap to join audio" button. A listen-only mode, if you ever add one, would not get this latitude.

**`playsinline` on iOS.** "On iPhone, `<video playsinline>` elements will now be allowed to play inline, and will not automatically enter fullscreen mode when playback begins. `<video>` elements **without** playsinline attributes will continue to require fullscreen mode for playback on iPhone." (<https://webkit.org/blog/6784/new-video-policies-for-ios/>). Both video elements get `playsinline autoplay`; the self-view also gets `muted` (which you want anyway, for echo).

**Handle mid-call mute.** Safari lets the user pause capture from the browser chrome: "The user may click or tap that icon to pause the camera and microphone mid-stream. Here WebKit will send silent audio and black video frames, and your website can present appropriate UI by listening for the mute and unmute events on MediaStreamTrack." (<https://webkit.org/blog/7763/a-closer-look-into-webrtc/>)

**Other iOS notes.** One capturing tab at a time: "WebKit only allows one tab to capture video or audio at a time. Tabs already using capture devices will see their MediaStreamTracks silenced and receive the mute event when a new tab gains access." (same page, 2017; **unverified** whether unchanged in 2026, but handling `mute`/`unmute` covers you either way). Device enumeration needs prior capture, so the rule is "use first, list later" (<https://blog.mozilla.org/webrtc/one-time-permissions-are-here-to-stay/>). And without capture permission WebKit withholds host candidates: "Without access to capture devices, WebKit only exposes Server Reflexive and TURN ICE candidates ... When access is granted, WebKit will expose host ICE candidates, which maximizes the chance the connection succeeds" (<https://webkit.org/blog/7763/a-closer-look-into-webrtc/>). Practical effect: get permission *before* you start ICE, or you will relay more calls than you need to.

Safari 26 (2025) removed two encoding parameters: "Safari 26.0 removed the fec and rtx from WebRTC encoding parameters." (<https://webkit.org/blog/17333/webkit-features-in-safari-26-0/>)

### Perfect negotiation

Use the canonical pattern verbatim. "Perfect negotiation is a recommended pattern to manage negotiation transparently, abstracting this asymmetric task away from the rest of an application." (<https://www.w3.org/TR/webrtc/>, section 10.7; also <https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation>)

Roles: "A polite peer, which uses ICE rollback to prevent collisions with incoming offers." and "An impolite peer, which always ignores incoming offers that collide with its own offers ... Any time a collision occurs, the impolite peer wins." Assignment is your call: "It could be as simple as assigning the polite role to the first peer to connect to the signaling server" (MDN). In this app the lobby DO assigns it at match time and ships it in the `matched` message.

```js
let makingOffer = false;

pc.onnegotiationneeded = async () => {
  try {
    makingOffer = true;
    await pc.setLocalDescription();
    signaler.send({ description: pc.localDescription });
  } catch (err) {
    console.error(err);
  } finally {
    makingOffer = false;
  }
};
```

```js
let ignoreOffer = false;
let isSettingRemoteAnswerPending = false;

const readyForOffer =
  !makingOffer &&
  (pc.signalingState === "stable" || isSettingRemoteAnswerPending);
const offerCollision = description.type === "offer" && !readyForOffer;

ignoreOffer = !polite && offerCollision;
if (ignoreOffer) {
  return;
}
isSettingRemoteAnswerPending = description.type === "answer";
await pc.setRemoteDescription(description);
isSettingRemoteAnswerPending = false;
if (description.type === "offer") {
  await pc.setLocalDescription();
  signaler.send({ description: pc.localDescription });
}
```

Three details that make it work:

- No-argument `setLocalDescription()`. "Note that setLocalDescription() without arguments automatically creates and sets the appropriate description based on the current signalingState." (MDN)
- Track `makingOffer` yourself rather than reading `signalingState`. "the value of signalingState changes asynchronously, introducing a potential collision of an outgoing and an incoming call ('glare')." (MDN)
- **Never call rollback explicitly.** "await pc.setRemoteDescription(description); // SRD rolls back as needed" (<https://www.w3.org/TR/webrtc/>). MDN: "If we're the polite peer, and we're receiving a colliding offer, we don't need to do anything special, because our existing offer will automatically be rolled back in the next step."

Candidate errors must be suppressed on the impolite side when an offer was ignored: wrap `await pc.addIceCandidate(candidate)` in a try and only rethrow `if (!ignoreOffer)`. The spec explains why: "The ignoreOffer variable is needed, because the RTCPeerConnection object on the impolite side is never told about ignored offers. We must therefore suppress errors from incoming candidates belonging to such offers."

Support floor: `setLocalDescription.description_parameter_optional` is `chrome 80`, `firefox 75`, `safari 14.1` (<https://github.com/mdn/browser-compat-data/blob/main/api/RTCPeerConnection.json>). Anything shipping in 2026 clears this comfortably.

### ICE restart on network change

"The restartIce() method ... allows a web application to request that ICE candidate gathering be redone on both ends of the connection." and it plugs straight into perfect negotiation: "restartIce() causes the negotiationneeded event to be fired on the RTCPeerConnection to inform the application that it should perform negotiation using its signaling channel." (<https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/restartIce>)

So you write no extra offer code. It is also self-healing under collisions: "If negotiation fails to complete ... the RTCPeerConnection will remember that you requested ICE restart. The next time the connection's signalingState changes to stable, the connection will fire the negotiationneeded event. This process continues until an ICE restart has been successfully completed." And media is not interrupted: "Existing media transmissions continue uninterrupted during this process."

**Trigger on `failed`, not `disconnected`.** MDN's own example:

```js
pc.addEventListener("iceconnectionstatechange", (event) => {
  if (pc.iceConnectionState === "failed") {
    pc.restartIce();
  }
});
```

The spec agrees: "Performing an ICE restart is recommended when iceConnectionState transitions to 'failed'. An application may additionally choose to listen for the iceConnectionState transition to 'disconnected' and then use other sources of information (such as using getStats to measure if the number of bytes sent or received over the next couple of seconds increases) to determine whether an ICE restart is advisable." (<https://www.w3.org/TR/webrtc/>)

Support: `restartIce` is `chrome 77`, `firefox 70`, `safari 14.1`.

### Detecting that the peer left, quickly

`connectionState` values are "new, connecting, connected, disconnected, failed, or closed" and it "essentially represents the aggregate state of all ICE transports ... being used by the connection" (<https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/connectionState>). `iceConnectionState` values are "new, checking, connected, completed, failed, disconnected, and closed" and it "describes the current state of the ICE agent and its connection to the ICE server" (<https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState>). Drive UI from `connectionState`; drive `restartIce()` from `iceConnectionState`.

**There is no specified timeout.** The spec is explicit that `disconnected` is "a transient state that may trigger intermittently (and resolve itself without action) on a flaky network. **The way this state is determined is implementation dependent.**" (<https://www.w3.org/TR/webrtc/>). Any "5 seconds to disconnected, 30 seconds to failed" number you have seen is a browser implementation detail, **(unverified)** as a contract. Do not build UX on it.

**The only documented number is ICE consent freshness, and it is slow.** RFC 7675 (<https://www.rfc-editor.org/rfc/rfc7675.txt>):

> "This document establishes a 30-second expiry time on consent."
> "Consent expires after 30 seconds. That is, if a valid STUN binding response has not been received from the remote peer's transport address in 30 seconds, the endpoint MUST cease transmission on that 5-tuple."
> "Implementations SHOULD set a default interval of 5 seconds, resulting in a period between checks of 4 to 6 seconds."

Thirty seconds is far too slow for "the other person's agent finished". The RFC also declines to trust an in-band goodbye: "receiving an unauthenticated end-of-session message SHOULD continue sending media ... until consent expires or it receives an authenticated message revoking consent" and "an authenticated SRTCP BYE does not terminate consent".

**Therefore: the WebSocket is your fast path.** The signaling socket's close event fires as soon as the tab closes or the connection drops, and an explicit leave message is instant. MDN's reference implementation does exactly this with a `hang-up` message: "It then builds a 'hang-up' message and sends it to the other end of the call to tell the other peer to neatly shut itself down." (<https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling>)

Three-layer teardown detection:

1. Explicit `leave` message over the WebSocket. Sub-second. This is the path the agent-finished trigger uses.
2. `webSocketClose` firing in the Durable Object when a client's socket drops. Seconds. Covers crashes and lost network.
3. `connectionState === "failed"` on the client. Tens of seconds. Last-resort backstop for when both the socket and media die together.

### Minimal signaling message set

WebRTC does not specify a transport: "You can use anything you like, from WebSocket to fetch() to carrier pigeons to exchange the signaling information between the two peers." And the server stays dumb: "It's important to note that the server doesn't need to understand or interpret the signaling data content. Although it's SDP, even this doesn't matter so much: the content of the message going through the signaling server is, in effect, a black box. ... All you have to do is channel the information back and forth." (<https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling>)

MDN's set is four types: `"video-offer"`, `"video-answer"`, `"new-ice-candidate"`, `"hang-up"`. A `join` message is your app's business, not WebRTC's. See Appendix A for the concrete protocol for this app.

Your entire responsibility during ICE, per MDN: "accepting outgoing candidates from the ICE layer and sending them across the signaling connection to the other peer when your onicecandidate handler is executed, and receiving ICE candidate messages from the signaling server ... and delivering them to your ICE layer by calling RTCPeerConnection.addIceCandidate(). That's it."

**Trickle ICE, and the two different end-of-candidates signals.** These get conflated constantly (<https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity>):

- Empty-string candidate: **send it.** "At the end of each generation of candidates, an end-of-candidates notification is sent in the form of an RTCIceCandidate whose candidate property is an empty string. This candidate should still be added to the connection using addIceCandidate() method, as usual, in order to deliver that notification to the remote peer."
- `null` candidate: **do not send it.** "When there are no more candidates at all to be expected during the current negotiation exchange, an end-of-candidates notification is sent by delivering a RTCIceCandidate whose candidate property is null. **This message does not need to be sent to the remote peer.** It's a legacy notification of a state which can be detected instead by watching for the iceGatheringState to change to complete."

Trickle by default. Guard the handler so a `null` candidate is not serialized and shipped, which is a common 1:1 bug. Trickling also sidesteps the Cloudflare port-53 timeout noted in section 2.

### 2025 to 2026 API changes worth knowing

**Things already removed. Do not write them.**

- Plan B is gone. "M102: Prior to this version, Plan B was allowed behind Deprecation Trial. With M102, sdpSemantics is ignored (you get Unified Plan no matter what)." (<https://chromestatus.com/feature/5823036655665152>)
- Callback-based `getStats()` is gone, and even the escape hatch expired. "The callback-based was removed in M117, with a Deprecation Trial available until M121. **As of M122, the API does not anymore, even if you use the Deprecation Trial.**" (<https://chromestatus.com/feature/4631626228695040>). Use the promise form only (<https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats>).
- Prefixed constructors are ancient history: unprefixed since Firefox 44 and Chrome 56 (browser-compat-data). Exact removal release for `mozRTCPeerConnection` **(unverified)**.

**The one 2025 change that can silently break an existing app.** Chrome M134 removed the non-standard `goog*` getUserMedia audio constraints: "Applications using these constraints will continue to work, but will get audio with default settings (as if no constraints were passed). They can easily migrate to standard constraints." (<https://chromestatus.com/feature/5097536380207104>). If you copy an old tutorial's `googEchoCancellation` / `googAutoGainControl` block it is now inert with no error. Use standard `echoCancellation`, `noiseSuppression`, `autoGainControl`.

**Encoded Transform finally aligned across browsers in Chrome M141 (October 2025).** "Chrome shipped an early version of this API in 2020. Since then, the specification has changed and other browsers have shipped the updated version (Safari in 2022 and Firefox in 2023). This launch aligns Chrome with the updated specification as part of Interop 2025." (<https://developer.chrome.com/release-notes/141>). `RTCRtpScriptTransform` is now `chrome 141`, `firefox 117`, `safari 15.4`. Not needed for a plain 1:1 call, but if you ever want E2EE on top of the media it is finally portable.

**`setCodecPreferences` is now cross-browser**: `chrome 76`, `firefox 128`, `safari 13.1`. Useful if you want to pin a codec for predictable bitrate. The footgun is on the same MDN page: "Codecs that are not included in the preferences list will not be part of the negotiation" (<https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpTransceiver/setCodecPreferences>), so an over-narrow list fails negotiation outright.

**Insertable Streams is still not portable.** `MediaStreamTrackProcessor` is `chrome 94` (partial), `safari 18`, and **`firefox: false`**. Do not make background blur a hard dependency.

**Not shipped, do not plan on it:** declarative `<camera>` and `<microphone>` capability elements are still "Proposed" (<https://chromestatus.com/feature/5153829504024576>). Mozilla's take: "There are also promising discussions about PEPC (Page-Embedded Permission Control) ... But it is still early days here." (<https://blog.mozilla.org/webrtc/one-time-permissions-are-here-to-stay/>)

### Condensed checklist

1. Serve over HTTPS. `http://localhost` is fine for dev, a LAN IP is not.
2. Call `getUserMedia()` at the point of use, not on a priming page. One-time grants are the default in Firefox and Safari.
3. Handle three outcomes, not two: resolve, reject, and **never settles**. Time out the "waiting for media" state so an ignored prompt does not park a user in your lobby forever.
4. On `NotAllowedError`, show address-bar reset instructions. Never retry in a loop.
5. Get camera/mic permission *before* starting ICE, so Safari exposes host candidates.
6. `<video playsinline autoplay>` on both elements, `muted` on the self-view. `await el.play().catch(...)` with a "tap for audio" fallback.
7. Listen for `mute`/`unmute` on `MediaStreamTrack` so a Safari-side pause shows in your UI.
8. Use perfect negotiation verbatim. No-arg `setLocalDescription()`, implicit rollback, never call rollback yourself.
9. Trickle candidates. Send the empty-string end-of-candidates, drop `null`.
10. `restartIce()` on `iceConnectionState === "failed"`. Treat `disconnected` as transient and show a spinner.
11. Detect the peer leaving via the WebSocket, not ICE. Consent freshness takes 30 seconds.
12. Standard audio constraints only. Promise-based `getStats()` only.

---

## 6. Matchmaking with one Durable Object as a global lobby

### Is a single DO fine for hundreds of concurrent WebSockets?

Yes, comfortably. The documented ceiling is:

"The WebSocket Hibernation API permits a maximum of 32,768 WebSocket connections per Durable Object, but the CPU and memory usage of a given workload may further limit the practical number of simultaneous connections." (<https://developers.cloudflare.com/durable-objects/api/state/>)

A few hundred concurrent waiters is roughly 1% of that ceiling. The caveat in the second half of that sentence is the real one: a DO that fans out a broadcast to N sockets on every message does O(N) work per message, and that scales badly. A *lobby* does not need to broadcast. Matchmaking is a queue operation: someone joins, you pop a waiting peer, you send exactly two messages. That is O(1) per join regardless of lobby size.

Other limits worth knowing:

| Limit | Value | Source |
| --- | --- | --- |
| WebSocket connections per DO (hibernation API) | 32,768 | <https://developers.cloudflare.com/durable-objects/api/state/> |
| WebSocket message size (received) | 32 MiB | <https://developers.cloudflare.com/durable-objects/platform/limits/> |
| CPU per DO request/message | 30 s default, up to 5 min | <https://developers.cloudflare.com/durable-objects/platform/limits/> |
| Wall time while a WebSocket is connected | "Unlimited" | <https://developers.cloudflare.com/durable-objects/platform/limits/> |
| Rows written/day (Free) | 100,000 | <https://developers.cloudflare.com/durable-objects/platform/pricing/> |

32 MiB is absurdly generous for signaling. An SDP offer is a few kilobytes; an ICE candidate is a couple hundred bytes.

### One global lobby, or one per region?

For this project: **one global lobby DO.** Reasoning:

Durable Objects do not roam. "Durable Objects do not currently change locations after they are created. By default, a Durable Object is instantiated in a data center close to where the initial `get()` request is made." (<https://developers.cloudflare.com/durable-objects/reference/data-location/>). So a global lobby physically lives wherever the first user to ever hit it happened to be, and everyone else pays a round trip to that location.

That is fine here, because of what actually flows through the DO. The DO carries signaling only: a join, an offer, an answer, a handful of ICE candidates, a leave. Call it 20 to 40 small messages per participant per call, none of them latency-critical in the way media is. Media goes browser to browser and never touches the DO. So an extra 150 ms on the signaling path costs you 150 ms of extra call setup time, once, and nothing after that.

The argument *against* regional lobbies is stronger than the argument for them. Sharding the lobby by region splits your matchmaking pool, and with a few dozen users the pool is the scarce resource. A user in Taipei waiting alone in an APAC lobby while three people wait in a US lobby is a worse outcome than a Taipei user paying 200 ms extra to match instantly with someone in Chicago. Shard the lobby only once you have enough simultaneous waiters that the pool stays non-empty in each shard, which for this app is a long way off.

If you want to bias the placement, pass `locationHint` on the `get()` / `getByName()` call: "An optional object with the key `locationHint`" (<https://developers.cloudflare.com/durable-objects/api/namespace/>). Pick the region where most users are and forget about it.

The docs also warn against warming the object artificially: "It can negatively impact latency to pre-create Durable Objects prior to the first client request or when the first client request is not representative of where the majority of requests will come from." (<https://developers.cloudflare.com/durable-objects/reference/data-location/>)

### Suggested topology

One `LOBBY` DO (fixed name, e.g. `getByName("global")`) holding every waiting client's WebSocket, plus per-pair routing done inside that same object. You do not need a second DO per call: once matched, the two sockets are already attached to the lobby DO, and relaying offer/answer/ICE between two known sockets is trivial. Keeping it to one class also keeps you inside the Free plan's 100-classes limit with room to spare.

Store the pairing state on the socket itself via `serializeAttachment` (peer id, role, match id) rather than in SQL. It survives hibernation: "Serialized attachments persist through hibernation as long as the WebSocket remains healthy", though note "If either side closes the connection, attachments are lost" (<https://developers.cloudflare.com/durable-objects/best-practices/websockets/>). Because it does not go through the SQL storage API, it should keep you well clear of the free 100,000 rows written/day. No size limit for attachments is documented on either the state API or the WebSockets best-practices page **(unverified)**; a few identifiers will not be near any plausible ceiling, but do not park large blobs there.

---

## 7. Abuse and safety minimums that cost $0

A stranger-pairing video app is a category with real abuse exposure, so this section is not optional even at hobby scale. Everything listed here is free.

### Cloudflare Turnstile: free, and generous

| | Free | Enterprise |
| --- | --- | --- |
| Pricing | Free | Contact Sales |
| Number of widgets | Up to 20 widgets | Unlimited |
| All widget types | Yes | Yes |
| Unlimited challenges (traffic or verification requests) | **Yes** | Yes |
| Hostname management | 10 hostnames per widget | 200 per widget |
| Analytics lookback | 7 days maximum | 30 days |
| Ephemeral IDs | No | Yes |

Source: <https://developers.cloudflare.com/turnstile/plans/>

The row that matters is "Unlimited challenges (traffic or verification requests): Yes" on Free. There is no request cap and no card required. Widget types are "Managed", "Non-interactive", and "Invisible" (<https://developers.cloudflare.com/turnstile/>), and Invisible is the right pick for gating a "find me a partner" button without adding friction.

Gate the *matchmaking* action, not the page load. Verify the token server-side in the Worker before the WebSocket upgrade, and only then let the client into the lobby. Turnstile is also "WCAG 2.2 AA compliant" (<https://developers.cloudflare.com/turnstile/>), which is more than you get from a homegrown check.

Note: "Ephemeral IDs: No" on Free. Ephemeral IDs are Cloudflare's way of giving you a stable per-visitor identifier for repeat-abuser detection without you handling PII. On the Free plan you do not get them, so repeat-offender tracking has to be your own (see below).

### Rate limiting

Two options, and you want the second one.

**Cloudflare WAF rate limiting rules** are available on Free, but barely (<https://developers.cloudflare.com/waf/rate-limiting-rules/>):

| Feature | Free | Pro | Business |
| --- | --- | --- | --- |
| Number of rules | **1** | 2 | 5 |
| Available fields in rule expression | Path, Verified Bot | Host, URI, Path, Full URI, Query, Verified Bot | + Method, Source IP, User Agent |
| Counting characteristics | IP | IP | IP, IP with NAT support |
| Counting periods | **10 s** | up to 1 min | up to 10 min |
| Mitigation timeout periods | **10 s** | up to 1 h | up to 1 day |

One rule, IP-keyed, 10 second window, 10 second block. That is enough to blunt a crude flood and nothing more. It also only applies to a zone, so it does nothing for a `*.workers.dev` hostname; you need the Worker on a custom domain in your Cloudflare zone for it to apply at all.

**Rate limiting inside the DO** is the real answer, and it is free and unlimited. The lobby DO already sees every join, so it is the natural chokepoint. Keep a small in-memory or SQL map of `hash(ip) -> [timestamps]` and reject joins above N per minute. Because the DO is single-threaded and globally unique for a given name, this is a genuine global counter with no race conditions, which is exactly the thing that is annoying to build on stateless infrastructure and free here.

Read the client IP from the `CF-Connecting-IP` header on the upgrade request, hash it with a secret (so you are not storing raw IPs), and use that as the key for both rate limiting and blocklisting.

### IP-hash blocklist in DO storage

Store `sha256(ip + secret) -> {blocked_until, reason}` in the DO's SQLite. Free plan gives 5 GB of DO storage and 100,000 rows written/day (<https://developers.cloudflare.com/durable-objects/platform/pricing/>), which is several orders of magnitude more than a hobby blocklist needs. Check it on join, before the match.

Pair it with a **report button** in the call UI. On report, write the reporter's and reportee's IP hashes plus a timestamp, and auto-block at a threshold. Even a naive "3 reports in 24 h = 24 h block" is meaningful deterrence, and it gives you an audit trail. Keep a short retention window and delete old rows so the table cannot grow unbounded.

### Cloudflare Access / an invite code

For a genuinely private launch, **Cloudflare Access** (Zero Trust) puts an identity gate in front of the whole app with no code. Cloudflare's own announcement states the free tier covers up to 50 users (<https://blog.cloudflare.com/teams-plans/>); the docs confirm a distinct "Zero Trust Free" plan tier exists alongside Standard and Enterprise (<https://developers.cloudflare.com/cloudflare-one/account-limits/>). The exact current seat count is not restated on the docs pages I could reach, so treat "50" as Cloudflare-stated but not re-confirmed on a live 2026 pricing page **(unverified)**.

The cheaper and more flexible option for a hobby project is a **shared invite code**: a secret in the Worker, checked before the WebSocket upgrade, rotated by editing a secret. Zero infrastructure, and unlike Access it does not require each participant to have an identity provider account or receive an email OTP. For an app whose entire premise is talking to a stranger, forcing an identity login is also somewhat at odds with the product.

### Other free Cloudflare pieces worth switching on

- **Bot Fight Mode** is available on Free plans: "Bot Fight Mode is a simple, free product that helps detect and mitigate bot traffic on your domain" and it "Issues computationally expensive challenges that force the requesting client to perform CPU-intensive calculations" (<https://developers.cloudflare.com/bots/get-started/bot-fight-mode/>). Zone-level, so again it needs the Worker on a custom domain rather than `workers.dev`.
- **Turnstile pre-clearance** is available on Free ("Pre-clearance support: Yes", <https://developers.cloudflare.com/turnstile/plans/>), which lets one Turnstile solve clear subsequent requests instead of re-challenging.
- **Free-plan hard stops as a safety net.** Because "If you exceed any one of the free tier limits, further operations of that type will fail with an error" (<https://developers.cloudflare.com/durable-objects/platform/pricing/>), a runaway abuse event on the Free plan produces an outage, not an invoice. That is genuinely the behavior you want for a hobby project. It is also an argument for *staying* on Free rather than adding a card "just in case".

### What none of this covers

Cloudflare gives you nothing free for **content moderation of the media itself**. The video and audio are peer-to-peer and never touch your infrastructure, so you cannot inspect them even if you wanted to. Your only levers are the pre-call gate (Turnstile, invite code), the post-hoc report button, and a short session length. Design the product around that: keep calls short by default, make the report and skip buttons prominent and instant, and do not promise moderation you cannot deliver.

---

## Appendix A: concrete signaling protocol for this app

Everything below is design, not a cited fact. It is included because the "which messages do I need" question in the checklist is answered best by a worked example.

### Message set

Client to server:

| Type | Payload | When |
| --- | --- | --- |
| `join` | `{turnstileToken, mode: "audio" \| "video"}` | On entering the waiting pool |
| `offer` | `{sdp}` | Polite/impolite negotiation, sent by whichever side needs to |
| `answer` | `{sdp}` | Reply to an offer |
| `ice` | `{candidate}` | Trickled as gathered; `null` candidate signals end of gathering |
| `leave` | `{reason: "agent_done" \| "user_hangup" \| "report"}` | Explicit teardown |
| `report` | `{}` | Abuse report, implies leave |

Server to client:

| Type | Payload | When |
| --- | --- | --- |
| `waiting` | `{position}` | Queued, no partner yet |
| `matched` | `{matchId, polite: bool, iceServers: [...]}` | Pair formed |
| `offer` / `answer` / `ice` | forwarded verbatim | Relay between the pair |
| `peer_left` | `{reason}` | Partner disconnected or their agent finished |
| `error` | `{code}` | Rate limited, blocked, bad Turnstile token |

Six client verbs and six server verbs. That is the whole protocol.

Two details worth calling out. The server assigns `polite` at match time (one side true, one side false), which is what makes the perfect negotiation pattern work without the two peers having to negotiate roles themselves. And `iceServers` is delivered *in* the `matched` message rather than fetched separately, because TURN credentials are short-lived and this is the natural moment to mint them.

### Auto hang-up

This is the feature that makes a hosted room service awkward and DIY natural. The trigger is "this user's AI agent finished", which is a fact only your own backend knows.

The flow: the client detects its agent finished, sends `leave` with `reason: "agent_done"`, the lobby DO looks up the partner socket by the `matchId` in its `serializeAttachment`, sends `peer_left`, and both clients call `pc.close()` and stop their local tracks. Elapsed time is one round trip to the DO, so tens to low hundreds of milliseconds.

The fallback, for the case where the leaving client crashes or loses network rather than exiting cleanly, is the DO's `webSocketClose` handler firing on the dropped socket and doing the same partner notification. That is why the WebSocket presence signal beats waiting on ICE state: the socket close is observed by the DO within seconds, whereas ICE `disconnected` and `failed` take considerably longer and are implementation-defined.

Belt and braces: also listen to `pc.connectionState` on the client and tear down on `failed`, in case both the socket and the media path die together.

### Why the lobby DO does not need a second DO per call

Both participants' WebSockets are already attached to the lobby DO from the moment they joined. Relaying offer/answer/ICE between two sockets you already hold is a map lookup and a `send()`. Spinning up a per-call DO would add a hop, a second object to bill duration for, and a distributed-state problem, in exchange for nothing. Keep it in one object until you have a measured reason not to.

---

## Sources

All fetched 2026-09-05 unless noted. Cloudflare docs pages carry "Last updated" stamps; those checked ranged from April to September 2026.

### Cloudflare Workers and Durable Objects

- Workers limits: <https://developers.cloudflare.com/workers/platform/limits/>
- Workers pricing (static assets, what counts as a request): <https://developers.cloudflare.com/workers/platform/pricing/>
- Durable Objects pricing (Free plan, 20:1 WebSocket ratio, hibernation and duration): <https://developers.cloudflare.com/durable-objects/platform/pricing/>
- Durable Objects limits: <https://developers.cloudflare.com/durable-objects/platform/limits/>
- Durable Objects WebSockets best practices (Hibernation API, `serializeAttachment`, what prevents hibernation): <https://developers.cloudflare.com/durable-objects/best-practices/websockets/>
- `DurableObjectState.acceptWebSocket` (32,768 connection limit): <https://developers.cloudflare.com/durable-objects/api/state/>
- Durable Objects namespace API (`locationHint`): <https://developers.cloudflare.com/durable-objects/api/namespace/>
- Durable Objects data location: <https://developers.cloudflare.com/durable-objects/reference/data-location/>
- SQLite storage billing changelog: <https://developers.cloudflare.com/changelog/2025-12-12-durable-objects-sqlite-storage-billing/>

### Cloudflare Realtime (TURN / STUN / SFU)

- Realtime overview: <https://developers.cloudflare.com/realtime/>
- TURN service and endpoint table: <https://developers.cloudflare.com/realtime/turn/>
- TURN FAQ (egress-only metering, STUN free, TTL ceiling, port 53 caveat): <https://developers.cloudflare.com/realtime/turn/faq/>
- Generate TURN credentials: <https://developers.cloudflare.com/realtime/turn/generate-credentials/>
- TURN key creation API: <https://developers.cloudflare.com/api/resources/calls/subresources/turn/methods/create>
- SFU pricing (1,000 GB shared free tier, $0.05/GB): <https://developers.cloudflare.com/realtime/sfu/pricing/>
- SFU limits: <https://developers.cloudflare.com/realtime/sfu/limits/>
- Cloudflare public pricing page (Free Tier Summary): <https://www.cloudflare.com/pricing/>
- RealtimeKit pricing (ex-Dyte successor): <https://developers.cloudflare.com/realtime/realtimekit/pricing/>
- Community thread "No-CC TURN free tier" (returns HTTP 403 to automated fetches, content unread): <https://community.cloudflare.com/t/no-cc-turn-free-tier/846152>

### Cloudflare security and abuse

- Turnstile plans: <https://developers.cloudflare.com/turnstile/plans/>
- Turnstile overview (widget types, WCAG): <https://developers.cloudflare.com/turnstile/>
- WAF rate limiting rules availability by plan: <https://developers.cloudflare.com/waf/rate-limiting-rules/>
- Bot Fight Mode: <https://developers.cloudflare.com/bots/get-started/bot-fight-mode/>
- Cloudflare One account limits (confirms a Zero Trust Free tier exists): <https://developers.cloudflare.com/cloudflare-one/account-limits/>
- Zero Trust free-for-50-users announcement: <https://blog.cloudflare.com/teams-plans/>

### Bitrate and codecs

- LiveKit WebRTC bitrate guide (360p and 720p by codec, VMAF 90, 30 fps): <https://livekit.com/webrtc/bitrate-guide>
- RFC 7587, RTP Payload Format for Opus (recommended bitrates, section 3.1.1): <https://www.rfc-editor.org/rfc/rfc7587.txt>
- RFC 6716, Definition of the Opus Audio Codec (6 to 510 kbit/s range): <https://www.rfc-editor.org/rfc/rfc6716.txt>

### TURN alternatives

- Metered Open Relay (20 GB/month free): <https://www.metered.ca/tools/openrelay/>
- Metered STUN/TURN pricing (ingress + egress metering): <https://www.metered.ca/stun-turn>
- Xirsys pricing (500 MB/month after trial; figures extracted from page source, the rendered page is JS-only): <https://xirsys.com/pricing/>
- Twilio Network Traversal Service pricing: <https://www.twilio.com/en-us/stun-turn/pricing>
- coturn example configuration (UDP relay port range): <https://github.com/coturn/coturn/blob/master/examples/etc/turnserver.conf>
- Oracle Cloud Always Free resources (including idle reclamation policy): <https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm>
- fly.io free trial: <https://fly.io/docs/about/free-trial/>
- fly.io pricing: <https://fly.io/docs/about/pricing/>
- fly.io UDP and TCP services: <https://fly.io/docs/networking/udp-and-tcp/>

### TURN usage rate

- webrtcHacks, "The Big Churn, learning from real usage stats" (callstats.io data, Jan 2015 to Feb 2016, 22% of conferences needed relay): <https://webrtchacks.com/usage-stats/>
- BlogGeek.me, "How WebRTC works" (5 to 20% rule of thumb): <https://bloggeek.me/how-webrtc-works/>
- BlogGeek.me, WebRTC TURN article comment thread (0 to 50% observed variance, 2 March 2022): <https://bloggeek.me/webrtc-turn/>

### Hosted call services

- Daily.co video SDK pricing (10,000 free participant-minutes, $0.004/min after, no hard cap): <https://www.daily.co/pricing/video-sdk/>
- Daily.co call object mode (headless custom UI): <https://docs.daily.co/guides/products/call-object>
- Daily.co eject REST API: <https://docs.daily.co/reference/rest-api/rooms/session/eject.md>
- Whereby Embedded pricing: <https://whereby.com/information/embedded/pricing/>
- Whereby embed web component reference: <https://docs.whereby.com/reference/using-the-whereby-embed-element.md>
- LiveKit pricing (note `livekit.io/pricing` now redirects to `livekit.com/pricing`): <https://livekit.com/pricing>
- LiveKit Cloud quotas and limits (hard cap on Build plan): <https://docs.livekit.io/home/cloud/quotas-and-limits/>
- LiveKit managing participants (`removeParticipant`): <https://docs.livekit.io/home/server/managing-participants/>
- LiveKit managing rooms (`deleteRoom`): <https://docs.livekit.io/home/server/managing-rooms/>
- Jitsi, end of anonymous room creation on meet.jit.si (22 August 2023): <https://jitsi.org/blog/authentication-on-meet-jit-si/>
- meet.jit.si Terms of Service (25 Active End Points per month): <https://jitsi.org/meet-jit-si-terms-of-service/>
- JaaS pricing: <https://cpaas.8x8.com/en/pricing/jitsi-as-a-service-pricing/>
- Jitsi IFrame API commands (`hangup`): <https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe-commands/>
- PeerJS site: <https://peerjs.com/>
- PeerJS repository (note: `peers/peerjs`, not `peerjs/peerjs`; default ICE config with shared TURN credentials): <https://github.com/peers/peerjs>
- PeerJS issue #1350, 6-minute connection delays on 0.peerjs.com, open since October 2025: <https://github.com/peers/peerjs/issues/1350>
- Twilio changelog, Programmable Video EOL reversed: <https://www.twilio.com/en-us/changelog/-twilio-video-will-remain-a-standalone-product/>
- Dyte to Cloudflare RealtimeKit migration: <https://docs.dyte.io/guides/realtimekit-migration/sdk-guide>
- Agora pricing: <https://www.agora.io/en/pricing/>
- 100ms pricing: <https://www.100ms.live/pricing>

### WebRTC browser APIs

- MDN, `MediaDevices.getUserMedia()`: <https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia>
- MDN, `Navigator.mediaDevices`: <https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaDevices>
- MDN, Secure Contexts: <https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts>
- MDN, Perfect negotiation: <https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation>
- MDN, `RTCPeerConnection.restartIce()`: <https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/restartIce>
- MDN, `RTCPeerConnection.connectionState`: <https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/connectionState>
- MDN, `RTCPeerConnection.iceConnectionState`: <https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState>
- MDN, WebRTC connectivity (trickle ICE, end-of-candidates): <https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity>
- MDN, Signaling and video calling: <https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling>
- MDN, Permissions API: <https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API>
- MDN, `setCodecPreferences()`: <https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpTransceiver/setCodecPreferences>
- MDN, `RTCRtpScriptTransform`: <https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpScriptTransform>
- MDN, `RTCPeerConnection.getStats()`: <https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats>
- MDN browser-compat-data (raw support tables): <https://github.com/mdn/browser-compat-data>
- W3C WebRTC 1.0 (perfect negotiation section 10.7, ICE restart guidance, transport states): <https://www.w3.org/TR/webrtc/>
- W3C Media Capture and Streams: <https://www.w3.org/TR/mediacapture-streams/>
- W3C Permissions: <https://www.w3.org/TR/permissions/>
- RFC 7675, STUN Usage for Consent Freshness (30-second expiry): <https://www.rfc-editor.org/rfc/rfc7675.txt>

### Browser-vendor notes

- WebKit, New video policies for iOS (`playsinline`, autoplay): <https://webkit.org/blog/6784/new-video-policies-for-ios/>
- WebKit, Auto-play policy changes for macOS: <https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/>
- WebKit, A closer look into WebRTC (MediaStream autoplay carve-out, permission model, ICE candidate exposure): <https://webkit.org/blog/7763/a-closer-look-into-webrtc/>
- WebKit features in Safari 26.0: <https://webkit.org/blog/17333/webkit-features-in-safari-26-0/>
- Chrome, One-time permissions: <https://developer.chrome.com/blog/one-time-permissions>
- Chrome 141 release notes (Encoded Transform V2): <https://developer.chrome.com/release-notes/141>
- Chrome, getStats migration: <https://developer.chrome.com/blog/getstats-migration>
- Chrome Platform Status, secure-context getUserMedia (M74): <https://chromestatus.com/feature/4924861776396288>
- Chrome Platform Status, Plan B removal (M102): <https://chromestatus.com/feature/5823036655665152>
- Chrome Platform Status, callback getStats removal (M122): <https://chromestatus.com/feature/4631626228695040>
- Chrome Platform Status, `goog*` constraint removal (M134): <https://chromestatus.com/feature/5097536380207104>
- Chrome Platform Status, `<camera>` / `<microphone>` capability elements (Proposed): <https://chromestatus.com/feature/5153829504024576>
- Mozilla, One-time permissions are here to stay (11 June 2025): <https://blog.mozilla.org/webrtc/one-time-permissions-are-here-to-stay/>
- Apple, Safari website settings for camera and microphone: <https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac>
- Apple, Alternative browser engines in the EU: <https://developer.apple.com/support/alternative-browser-engines/>
- webrtc.org, Peer connections sample (source of the `stun.l.google.com:19302` convention): <https://webrtc.org/getting-started/peer-connections>
- WebRTC samples repository: <https://github.com/webrtc/samples>

---

## Items marked unverified in this document

Collected here so they are easy to re-check later.

| Claim | Status |
| --- | --- |
| Whether a Cloudflare Free-plan account can create a TURN key without a card on file | not stated on any official page; **test in the dashboard before committing** |
| Exact TURN protocol overhead percentage on top of media bitrate | not published; cost tables are roughly 5% optimistic |
| Size limit for `serializeAttachment` payloads | not documented on the state API or WebSockets best-practices pages |
| Whether the Free-plan daily DO request cap counts billed (20:1) or raw WebSocket messages | not stated; section 3 checks the conclusion both ways |
| `stun.l.google.com:19302` as a supported service | no Google product page, ToS, or SLA exists; sample-code convention only |
| Metered Open Relay's metering basis (egress vs ingress+egress) | not stated on the Open Relay page |
| Whereby Explore free tier recurring monthly vs one-time trial | inferred from the "Monthly price: Free" column, page says only "Test for free" |
| Whether an anonymous stranger counts as one JaaS MAU | MAU is not defined on the JaaS pricing page |
| Twilio Programmable Video current free-tier terms | not checked (only the EOL reversal was verified) |
| Agora's "10,000 combined RTC minutes" being per-participant | not stated on their pricing page |
| Cloudflare Zero Trust free tier at exactly 50 seats today | stated in a Cloudflare blog post, not restated on a current docs pricing page |
| Safari's one-capturing-tab-at-a-time limit still current in 2026 | documented in 2017, no newer WebKit page restating or retracting it |
| Firefox's exact "Remember this decision" UI string | support.mozilla.org would not serve content to automated fetches; the behavior is verified, the string is not |
| Browser timings for ICE `disconnected` and `failed` | implementation-defined; the spec specifies no timeout |
| Release in which `mozRTCPeerConnection` was removed | browser-compat-data records no `version_removed` |
| `getUserMedia` in WKWebView since iOS 14.3 | could not confirm on an Apple or WebKit page |
