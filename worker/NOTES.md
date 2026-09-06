# Worker notes

What the lead should know about `wrangler.jsonc`, `src/index.js`, `src/lobby-do.js`,
`src/turn.js`, `test/worker.test.js`. The core was not touched.

## Decisions I made

- **Bad ticket: upgrade, then close with 4001.** `scripts/mock-lobby.js` does exactly that,
  and the brief said the Worker must look the same from outside, so the page can have one
  code path. Verified: the client sees open and then close 4001 "bad ticket" about four
  milliseconds later, so this one does travel (see the surprise below). The alternative, a
  400 without upgrading, is one line away in `LobbyObject.openSocket`.
- **`html_handling: "none"` in the assets block**, which the brief did not list. Static assets
  are served before the Worker runs, and the default `auto-trailing-slash` would answer
  `/room` with `public/room.html` directly, skipping the Permissions-Policy and nosniff
  headers. With `none`, only exact paths are asset hits, so `/room` and `/setup` reach the
  router. A direct `/room.html` request still bypasses the two headers; if that matters,
  the page can be named something else and only `/room` published.
- **The DO builds each event field by field** instead of spreading the request body the way
  the mock does. A body of `{"kind":"ws_msg"}` would otherwise pick its own event kind.
  Worth copying into the mock if it ever leaves the laptop.
- **Effects of a `ws_open` go straight to the new socket**, not through the tag lookup: the
  socket is not visible to `getWebSockets()` until the upgrade response is returned. Same
  shape as mock-lobby line 72, and it is what makes the rehearsal `hello` work, since a
  rehearsal socket is tagged `r:` plus the token and no later effect ever addresses it.
- **Frame size limits in the DO, not the core:** frames over 64 KB are dropped, and `probe`
  frames over 2 KB. Probes are kept in the state blob, twenty per token, and a Durable Object
  storage value stops at 128 KiB, so an unbounded probe payload from one window could wedge
  the whole lobby. Move these into the core if you prefer them tested there.
- **Cold start reconciles lost windows.** After an eviction or a deploy, a token can be
  marked connected with no socket left. The constructor feeds `ws_close` for those through
  the core, or the token could never open another window. It uses the stored `conn`.
- Hooks are rate limited to 10 a second per token, in memory, dropped extras answer `{}`.
  The map is not persisted, which is fine: a cold start is not a burst.
- Ping and pong are handled by `setWebSocketAutoResponse`, so a keepalive never wakes the
  object. The pair is the literal strings `ping` and `pong`, not JSON.

## Surprises

- **A socket the Worker closes stays open under `wrangler dev`.** Once a window is
  established, `ws.close()` from the Durable Object delivers no close to the client. I
  reproduced it in a ten line Worker with hibernatable sockets, from a fetch handler and
  from an alarm, with and without a preceding `send`: no close inside four seconds, while
  every JSON frame arrived. One earlier probe did see the close land 750 ms later, once the
  object had nothing left to do, so it looks deferred rather than dropped. Sockets closed
  during the upgrade itself, the 4001 above, are unaffected. Plain `accept()` sockets were
  not tested; the lobby has none. So the test asserts the `close` frame and not the socket
  state, and **the window must close itself when it sees `{type:"close"}`**, which is what
  PROTOCOL section 6 already says. Unverified in production, where close should be immediate.
- The alarm chain behaves: `getAlarm()` returns null inside `alarm()`, so rescheduling from
  the handler works, and beats land 1000 to 1020 ms apart locally. One early run of the test
  saw no beat for four seconds; I could not reproduce it in about twenty runs since and never
  found the cause. The countdown assertions therefore allow 0.3 to 4 s between beats: they
  prove the beats keep coming rather than pinning the clock, which also survives a machine
  busy with everyone else's tests. The test failed once at a load average of 80 and has been
  clean since at every load I could produce.
- `wrangler dev` keeps Durable Object storage in `.wrangler/state` between runs, so a killed
  run leaves windows marked connected and the next run cannot open a socket for those tokens.
  The test uses a fresh `--persist-to` directory and deletes it afterwards. If you drive a
  dev lobby by hand and it starts refusing tickets, delete `.wrangler/state`.
- `/api/count` answers with `othersFor(token)`, not the size of the queue, since the core
  change at 15:50. PROTOCOL section 3 just says `{ count, enabled }`, which reads like a
  total until you get to section 9. Worth one word in the table. The test now pins both
  sides of it: the last person waiting sees 0, and someone whose window has closed sees 1.

## Configuration

- `vars` carries every number from PROTOCOL section 2 plus COUNTDOWN, MAX_OPENS,
  RECONNECT_GRACE and RELAY_BUDGET_GB. COUNTDOWN is in seconds, everything else in
  milliseconds. `INVITES` is `""` in the file, which means open; the real list is a secret.
- **RECONNECT_GRACE is no longer read by the core** (it left `DEFAULTS` in the rewrite). The
  var is still there and still passed in, so it works again the moment the core wants it.
- `compatibility_date` is 2026-09-01. The installed workerd is 1.20260903.1; a later date
  makes wrangler warn.
- **`INVITES` is both a var and a secret**, which the brief asked for, and wrangler keeps
  vars and secrets in one namespace. Check on the first deploy whether the `""` in `vars`
  overwrites the secret; if it does the alpha would quietly go open. The fix is to delete
  the line from `vars`, since `cfgFrom` already reads a missing INVITES as open.

## TURN

Untested against the real API: I have no key. Without `TURN_KEY_ID` and `TURN_API_TOKEN`
nothing in `turn.js` runs and every match keeps the core's STUN entry. With keys, one
credential is minted per room, both match frames share it, and the STUN entry stays first
in the list. The response is normalised whether `iceServers` comes back as an object (what
the docs show) or an array. Any non-200, any throw, any three second timeout means STUN.
The budget counter is one storage key per calendar month, `turn:YYYY-MM`, counting rooms at
an assumed 22.5 MB each; old months are never deleted, at a few bytes a year.

## Not verified

- A real deploy. I never ran `wrangler deploy` or touched an account.
- Hibernation eviction and wake: local dev does not evict, so the constructor path that
  reloads state and reconciles windows has only been exercised on a fresh start.
- Whether a `close` from an established socket reaches a real browser on Cloudflare.

Checked by hand instead of by the test: `/room` and `/setup` come back as HTML with the
microphone and nosniff headers, `/style.css` and the other page assets are served by the
asset server directly, `/nope` falls through to a plain 404, and a POST with no body at all
answers `{"ok":true}`. The worker test never touches the pages, so it keeps passing while
they change. Nothing here reads or writes anything outside `worker/`.
