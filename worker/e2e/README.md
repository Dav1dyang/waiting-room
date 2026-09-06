# worker/e2e

One file, `room.test.js`, drives two real Chrome windows through a whole wait: register, arm,
queue, match, WebRTC, the goodbye, hanging up. It is the only place the window, the lobby and
the browser are all exercised together.

```
cd worker
npm i                 # playwright is a devDependency, package only, no browser download
npm run e2e           # node --test e2e/*.test.js
```

## What it needs

- **Google Chrome installed.** The tests launch `chromium.launch({ channel: 'chrome' })`, which
  uses the Chrome on this machine. There is no Playwright browser download; `playwright` was
  installed with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`. Verified against Chrome on macOS 26.6.2.
- **Headless.** `headless: true`. Everything passes headless, including WebRTC over loopback.
- **No network.** The test picks a free port, starts `scripts/mock-lobby.js` on it with
  `INVITES=DUCK T=1000`, and kills it afterwards. Nothing leaves the machine. The STUN server in
  the default `iceServers` is never reached and is not needed: both peers are on loopback and
  connect on host candidates.

## Launch flags, and why

| Flag | Why |
| --- | --- |
| `--use-fake-device-for-media-stream` | A synthetic camera and a beeping microphone, so the meters and the RTP audio levels see real sound. |
| `--use-fake-ui-for-media-stream` | Auto-accepts the capture prompt. Contexts also grant `microphone`, `camera` and `notifications`. |
| `--autoplay-policy=no-user-gesture-required` | The window never gets a gesture. This makes the harness match the real app window, where mic permission already unlocks audio. |
| `--disable-features=WebRtcHideLocalIpsWithMdns` | Without it, host candidates are `.local` mDNS names that the other browser context cannot resolve, and both peers sit in `connecting` forever. |

## What the tests assert

1. A queued window is shaded, has no log lines, has no live mic, and shows `countLine(0)`.
2. Two windows match: both log "Stranger has entered the room." and "They can hear you. Say hi.",
   both peer connections reach `connectionState === "connected"`, the red live dot appears with
   the local track, the lead icon becomes the person, and `getStats` reports a real audio level.
3. A `stopped` hook starts the goodbye: "Your Claude is done. Closing in 5." plus the big digit on
   one side, "Stranger's Claude is done. Leaving in 5." then "Stranger has left the room." and a
   shade on the other.
4. Hanging up shades the stranger and re-queues them (see the caveat below).
5. A re-queued window meets a *second* stranger: it unrolls again, the mic comes back, the new
   connection reaches `connected`, and the new room reports sound. This is the path where
   per-room state (the speech gate, the peak holds, `pcState`) has to be reset, so it earns a test.
6. A dropped socket reconnects on its own and resets the backoff.
7. A rehearsal window says "This is a test. Closing in 5." exactly once.
8. Every window sends one Phase 0 probe and the lobby keeps it.
9. A stale ticket shows "This window is stale."
10. The setup page reads `/api/count`, arms a rehearsal, and refuses an unknown token.

## Isolation between tests

One lobby serves the whole file and the pairer is greedy over everyone who is queued, so a window
left over from the test before will happily pair with this test's window and the failure then
lands in a test that did nothing wrong. Two rules keep that from happening, and they are the
reason the suite is stable:

- `beforeEach` waits until `GET /api/count` reports nobody waiting, asked through a token
  (`e2ecounter00`) that is registered but never starts a task, so it never counts itself.
- `afterEach` closes every context the test opened and then `POST /api/off` for every token it
  used, which drops the task and any window at once. Closing the browser context alone is not
  enough: the lobby learns about the socket closing a moment later, and a moment is all it takes.

The window exposes `window.__wr` for the tests: `state`, `collapsed`, `others`, `pcState`,
`micLive`, `lines`, `count`, `big`, `told`, `attempts`, `probe`, plus two seams,
`dropSocket()` and `statsLevels()`. It is read-only apart from those two.

## Two things this harness cannot test

- **`window.close()`.** A Playwright page has two session-history entries (`about:blank` then the
  navigation), so Chrome refuses to let a script close it; measured directly. The real `--app`
  window has `opener === null` and `history.length === 1`, which is script-closable per the HTML
  spec, so it should work there. Test 4 therefore accepts either a real close or "was told to
  close and released the microphone". The probe records `selfCloseSupported` so Phase 0 settles it.
- **`window.resizeTo()`.** It only applies to `TYPE_APP` windows (research 10 B.1); a Playwright
  page is `TYPE_NORMAL`, so every resize is a silent no-op and the probe's `sizes.before`,
  `sizes.at100` and `sizes.at300` all come back identical here. The 380x100, 380x300 and 380x400
  sizes are unmeasured until a real app window runs the probe. The page never depends on the
  resize landing: it lays out to whatever `innerHeight` it is given.

## Developing by hand

```
cd worker
INVITES=DUCK T=2000 npm run mock          # http://127.0.0.1:8788
curl -s -XPOST localhost:8788/api/register -H 'content-type: application/json' \
  -d '{"token":"tokenaaaa1","invite":"DUCK"}'
curl -s -XPOST localhost:8788/api/hook -H 'content-type: application/json' \
  -d '{"token":"tokenaaaa1","event":"started"}'
sleep 3
curl -s -XPOST localhost:8788/api/hook -H 'content-type: application/json' \
  -d '{"token":"tokenaaaa1","event":"tick"}'   # -> {"open":"...room?t=TICKET"}
```

Tokens must match `[a-z0-9]{8,64}`. `GET /api/state` dumps the whole lobby, which is the fastest
way to see why a pair did not happen.
