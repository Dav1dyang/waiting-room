# Auto-Popup Window Mechanics: Can a Window Open Itself, Grab the Mic, Play Audio, and Close Itself?

Research date: 2026-09-06. Question: a Claude Code hook (async background process, no controlling
terminal) reads `{"open": "https://.../room?t=..."}` from its HTTP response and must produce a small
browser window that captures the mic with no prompt, plays a stranger's WebRTC audio with no click,
shows a few lines of text, closes itself when the call ends, and ideally reopens at the same size and
place.

Every claim below carries a source. Claims I could not confirm against an official document are marked
**(unverified)** and moved into the Phase 0 test list. Nothing here was tested on a live browser; this
is a documentation and source-code pass.

---

## 0. Verdict table

| # | Mechanism | Works? | Gesture needed? | Browsers | Source |
|---|---|---|---|---|---|
| 1 | `open <url>` from a hook with no controlling TTY | **Yes**, LaunchServices does not need a TTY | n/a | macOS | `man open(1)` (local); hooks doc says only that `/dev/tty` is unavailable ([hooks](https://code.claude.com/docs/en/hooks)) |
| 2 | `open -na "Google Chrome" --args --app=URL` opens a chromeless window in the **running** Chrome | **Yes (unverified)** (`-n` is required for `--args` to reach `main()`; the new process forwards its command line to the singleton) | n/a | Chrome, Edge, Brave | `man open(1)` (local) for `-n`/`--args`; [`StartupBrowserCreator::ProcessCommandLineAlreadyRunning`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/ui/startup/startup_browser_creator.cc). That `--app` specifically survives the forward is **(unverified)** |
| 3 | `--window-size=W,H` / `--window-position=X,Y` on that forwarded command line | **No** when Chrome is already running. Honoured when it is not (that process is the real one) | n/a | Chrome | [chromium-discuss](https://groups.google.com/a/chromium.org/g/chromium-discuss/c/oE-KOCMMtrg): "Almost all command line flags only apply when Chrome is initially launched"; [crbug 40847839](https://issues.chromium.org/issues/40847839); [brave#7206](https://github.com/brave/brave-browser/issues/7206) |
| 3b | A Chrome `--app` window reopens at its **last user-set bounds** for the same host and path | **Likely yes (unverified)** | No | Chrome | [`GenerateApplicationNameFromURL`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/web_applications/web_app_helpers.cc) returns `host + "_" + path`, no query; [`browser_window_state.cc`](https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/ui/browser_window_state.cc) keys `prefs::kAppWindowPlacement` by window name |
| 4 | `open -g` keeps the new window from stealing focus | **(unverified)** for the `-n -g -a ... --args --app=` combination | n/a | macOS | `man open(1)` (local): "-g Do not bring the application to the foreground" |
| 5 | `window.close()` on a top-level window the OS opened, session history size 1 | **Yes** | No | Chrome, Safari, Firefox | [WHATWG HTML `close()`](https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-window-close); [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/close); [text/plain](https://textslashplain.com/2021/02/04/window-close-restrictions/) |
| 6 | `window.close()` after any navigation, redirect, or `history.pushState` | **No**, silently refused | No | all three | same as #5. Session history size must stay 1 |
| 7 | Page detects that its own `close()` was refused | **(unverified)**, no API. Poll `window.closed` after a timeout | No | all three | [MDN `Window.closed`](https://developer.mozilla.org/en-US/docs/Web/API/Window/closed) does not document this use |
| 8 | Mic with no prompt after a persisted grant ("Allow on every visit" / Safari "Allow" / Firefox "Remember this decision") | **Yes** | No | Chrome 116+, Safari, Firefox | [Chrome one-time permissions](https://developer.chrome.com/blog/one-time-permissions); [Safari websites settings](https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac); [Firefox camera/mic](https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions) |
| 9 | `getUserMedia()` called on page load with no click | **Yes**, no gesture requirement is documented | No | all three | [MDN `getUserMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) documents no activation requirement |
| 10 | Remote WebRTC audio autoplays **while the page is capturing** | **Yes** in all three | No | Chrome, Safari, Firefox | Chrome: [`autoplay_policy.cc`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/core/html/media/autoplay_policy.cc) `DocumentIsCapturingUserMedia`; Safari: [WebKit 7763](https://webkit.org/blog/7763/a-closer-look-into-webrtc/); Firefox: [`AutoplayPolicy.cpp`](https://searchfox.org/mozilla-central/source/dom/media/autoplay/AutoplayPolicy.cpp) `IsActivelyCapturingOrHasAPermission` |
| 11 | Remote audio autoplays with **no** capture and no click | **No** | Yes | Chrome, Safari, Firefox | [discuss-webrtc PSA](https://groups.google.com/g/discuss-webrtc/c/BwJOWloyS34); [Chrome autoplay](https://developer.chrome.com/blog/autoplay) |
| 12 | Installed desktop PWA window restores its last size and position | **Yes** | No | Chrome desktop | [web.dev PWA windows](https://web.dev/learn/pwa/windows) |
| 13 | `open "web+waitingroom://join?t=..."` launches an installed PWA window | **Yes** from Chrome 96, after a one-time permission dialog | One dialog, once | Chrome desktop | [URL protocol handler](https://developer.chrome.com/docs/web-platform/best-practices/url-protocol-handler) |
| 14 | Document Picture-in-Picture window (always on top, small) | **Yes** | **Yes, every time** | Chrome/Edge 116+, Firefox 151+, not Safari | [Document PiP](https://developer.chrome.com/docs/web-platform/document-picture-in-picture) |
| 15 | Service worker notification click opens/focuses a window | **Yes** | The click is the activation | Chrome, Firefox (notificationclick only) | [MDN `Clients.openWindow`](https://developer.mozilla.org/en-US/docs/Web/API/Clients/openWindow) |
| 16 | `window.resizeTo()` / `moveTo()` inside a Chrome `--app` window | **(unverified)**. MDN says only `window.open()` windows can be resized | No | Chrome | [MDN `resizeTo`](https://developer.mozilla.org/en-US/docs/Web/API/Window/resizeTo) |
| 17 | Plain `open <url>` opens a new **tab** in the user's **default browser**, which may not be Chrome | **(unverified)**, expected. This is the "hijacks your window" case | n/a | macOS default browser | LaunchServices default handler, `man open(1)` (local) |

---

## 1. Opening a browser from a headless-ish process on macOS

### `open` does not need a TTY

`open(1)` is a LaunchServices client: "The open command opens a file (or a directory or URL), just as
if you had double-clicked the file's icon" (`man open(1)`). Nothing in the man page
requires a controlling terminal, and the Claude Code hooks reference restricts only terminal access:
"On macOS and Linux, command hooks run in their own session without a controlling terminal. The hook
process and any child processes can't open `/dev/tty` or send escape sequences directly to the Claude
Code interface" ([hooks](https://code.claude.com/docs/en/hooks)). A missing TTY is not a blocker for
`open`.

Two failure modes to keep in mind, both **(unverified)**:

- `open` needs a GUI (Aqua) login session. Hooks fire inside the user's own session when Claude Code
  runs in Terminal or iTerm, so this is fine. Over a plain `ssh` session with no GUI login, `open`
  should fail.
- If Claude Code ever applies its Bash sandbox to hook commands, `open` could be denied. The hooks doc
  does not say either way.

### `-n` is the load-bearing flag

The man page is explicit about `--args`: "All remaining arguments are passed to the opened application
in the argv parameter to main()." Arguments only reach `main()` when a process is actually launched.
With Chrome already running, `open -a "Google Chrome" --args --app=URL` sends an Apple event to the
live app and your switches go nowhere.

`-n` ("Open a new instance of the application(s) even if one is already running") does launch a real
second Chrome process, which gets your full `argv`. That second process finds the profile's singleton
lock, hands its command line to the running browser, and exits. The receiving side is
`StartupBrowserCreator::ProcessCommandLineAlreadyRunning`, which resolves the profile and then calls
`ProcessCommandLineWithProfile`, that is, the same startup path that interprets switches
([source](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/ui/startup/startup_browser_creator.cc)).
So `--app=` is re-interpreted by the running browser and you get a chromeless app window in the user's
normal profile, with their cookies and their site permissions. I could not find an official statement
naming `--app` as a forwarded switch, so treat this as **(unverified)** and confirm it in Phase 0
test 1.

### Size and position are not forwarded

Chromium's own position, from Torne (Richard Coles) on chromium-discuss: "Almost all command line flags
only apply when Chrome is initially launched. When it's already running, the URL you give is just
passed to the already-running instance and only a few command line flags are passed on, the rest are
assumed to control global behaviour of the process and are only read at startup time"
([chromium-discuss](https://groups.google.com/a/chromium.org/g/chromium-discuss/c/oE-KOCMMtrg)). The
open tracking bug is [crbug 40847839](https://issues.chromium.org/issues/40847839), "Chrome should
respect window-size and window-position"; Brave has the same report at
[brave#7206](https://github.com/brave/brave-browser/issues/7206). The only known workaround is a
separate `--user-data-dir`, which means a second Chrome profile with none of the user's saved mic
permission, which defeats the whole point.

Two caveats. First, none of this applies when Chrome is **not** already running: then the `-n` process
is the real browser and the switches are read normally. Second, and more useful, the flags are not the
only route to remembered geometry.

### Chrome already remembers `--app` window bounds, probably

Chrome derives an app window's internal name from the URL:

```cpp
std::string GenerateApplicationNameFromURL(const GURL& url) {
  return base::StrCat({url.host(), "_", url.path()});
}
```

([`web_app_helpers.cc`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/web_applications/web_app_helpers.cc)).
Host and path only, **no query string**. Chrome then stores window placement per app window name under
`prefs::kAppWindowPlacement`, "a single dictionary preference, with per-window-name nested dictionaries"
([`browser_window_state.cc`](https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/ui/browser_window_state.cc)).

If that path is live for `--app` windows, then every `--app=https://host/room?t=ANYTHING` window shares
the key `host_/room`, and Chrome restores the user's last size and position for free. That would satisfy
requirement (e) in the alpha, with no PWA and no code. It is **(unverified)** end to end, and it is
Phase 0 test 2b, which matters more than test 6.

The design lever it implies: **keep the path constant and never put anything varying in the path.** Carry
the room token in the query string (already excluded from the key) or, better for the address bar, in the
URL fragment, so the placement key never changes between calls.

Practical consequence: **requirement (e) is not achievable via command line flags**, but is probably
achievable anyway. Ranked options: Chrome's own per-app-name placement memory (test 2b), then
`window.resizeTo`/`moveTo` from inside the page (test 6), then the installed PWA route, which documents
the behaviour explicitly.

### Focus stealing

`man open` documents `-g` as "Do not bring the application to the foreground" and `-j` as "Launches the
app hidden". Whether `-g` survives the `-n` plus singleton-forward path, and whether Chrome then still
raises the new app window, is **(unverified)**. Chrome has no documented switch for "open this window
without activating". This matters a lot: the user is typing in a terminal, and a window that takes key
focus mid-sentence is a bug, not a feature. Phase 0 test 3 is the deciding experiment. If `-g` does not
hold, the honest fallbacks are: open the window muted-and-silent and let a system notification be the
attention-getter (section 6), or accept the interruption and make the window trivially dismissable, or
go native (section 7), where a non-activating `NSPanel` solves this properly.

---

## 2. `window.close()` rules

### The spec

A navigable is **script-closable** if it is a top-level traversable and either "its is created by web
content is true; or its session history entries's size is 1"
([WHATWG HTML](https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-window-close)). The
`close()` steps return early unless the traversable is top-level, is not already closing, and is
script-closable.

MDN says the same in prose: windows are script-closable if created by web content (`window.open()`,
`<a target="_blank">`, `<form target="_blank">` without modifier keys). "Windows opened by browser UI
actions ... are often not script-closable" but "may only be closed if they have not been navigated
(history length remains 1)"
([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/close)). A refused close is silent to
the page; the browser only logs a console warning, "Scripts may not close windows that were not opened
by script."

### Per browser

Eric Lawrence's survey ([text/plain](https://textslashplain.com/2021/02/04/window-close-restrictions/))
maps the implementations:

- **Chromium 88+**: closeable if the window has an opener, or if the back/forward stack has fewer than
  two entries. Refusal logs "Scripts may close only the windows that were opened by them."
- **Firefox**: implements the spec, checking that back/forward history contains only one document.
  `dom.allow_scripts_to_close_windows` in `about:config` overrides the restriction entirely
  ([bugzilla 177827](https://bugzilla.mozilla.org/show_bug.cgi?id=177827)).
- **Safari/WebKit**: similar to Chromium; refusal logs "Can't close the window since it was not opened
  by JavaScript."

### What this means for us

A window that the OS opened at `https://host/room?t=TOKEN` and that **never navigates** has session
history size 1, so `window.close()` works in all three, with no user gesture. This holds for a Chrome
`--app` window and for an installed PWA window, because both are top-level traversables.

Three design rules follow, and they are strict:

1. **No server redirect** on the room URL. A 302 from `/room?t=...` to `/room/abc` creates a second
   session history entry and permanently blocks `close()`.
2. **No `history.pushState`.** It appends an entry. `history.replaceState` does not, so use that if you
   want to scrub the token out of the address bar.
3. **No client-side router, no `location.href = ...`.** If you must navigate, `location.replace()`
   replaces the current entry instead of pushing.

### Detecting a refused close (accumulation guard)

There is no API that tells a page it is not allowed to close. `close()` "silently does nothing" per the
spec, and MDN's `Window.closed` page does not document this use
([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/closed)). The spec queues a task to
close, so `closed` is not guaranteed to flip synchronously. The practical pattern, **(unverified)** but
cheap, is:

```js
function endCall() {
  window.close();
  setTimeout(() => {
    if (!window.closed) showManualCloseScreen(); // "Call over. You can close this window."
  }, 400);
}
```

Belt and braces for the accumulation risk: before opening, the hook script should ask the server
whether a window is already live for this session, and the page should announce itself (a
`BroadcastChannel` ping or a heartbeat to the Worker) so the server can refuse to hand out a second
`open` directive while one window is alive. Also give the page a self-destruct timeout so an orphaned
window that failed to close still shows the manual-close screen instead of sitting there capturing the
microphone.

---

## 3. Microphone permission persistence

### Chrome

From Chrome 116 the permission prompt gained "Allow this time" alongside the persistent option: "With a
gradual rollout from Chrome 116, we will be adding the Allow this time option to permission prompts",
and "Allow this time will initially be available on desktop for some of the most common permissions:
geolocation, camera, and microphone"
([one-time permissions](https://developer.chrome.com/blog/one-time-permissions)). A one-time grant dies
when "The page has been closed, was navigated away from, or was discarded", after 16 hours, or after 5
minutes in the background (with an exception while camera or microphone are actively in use).

So the setup step must make the user pick **"Allow on every visit"**, not "Allow this time". If they
pick the one-time option, every future window prompts again, which kills the zero-friction story.
Chrome content settings are stored per origin per profile, which is why the `--app` route deliberately
stays in the user's default profile.

### Safari

Safari on Mac has per-website Camera and Microphone settings with three values: "Ask: The site must ask
if it can use the microphone on your Mac. Deny: The site can't use your microphone. Allow: The site can
always use your microphone"
([Apple](https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac)). WebKit also notes that
once granted, "subsequent calls to `getUserMedia` for the same device type will avoid presenting
additional prompts to the user" ([WebKit 7763](https://webkit.org/blog/7763/a-closer-look-into-webrtc/)).
Note these settings are deliberately excluded from iCloud sync, so each Mac needs its own grant.

### Firefox

The prompt carries a "Remember this decision" checkbox, off by default, and Mozilla's stance is that
Firefox "does not grant persistent permissions for repeat use of camera and microphone implicitly"
([Firefox help](https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions)).
So the Firefox setup flow needs an explicit "tick this box" instruction.

### Does the prompt itself need a gesture?

MDN's `getUserMedia` page documents no user-activation requirement; it only says "getUserMedia() must
always get user permission before opening any media gathering input"
([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)). Calling it at page
load is legal in all three. With a persisted grant it resolves without any UI. **(unverified)** whether
Firefox's `media.getusermedia.window.focus_required`-style behaviors interfere in a background window;
worth a look only if you support Firefox.

---

## 4. Autoplay of remote audio with no click

This was the item most likely to sink the design, and the answer is good.

### Chrome

The public policy ([Chrome autoplay](https://developer.chrome.com/blog/autoplay)) lists three ways to
get audible autoplay: "The user has interacted with the domain (click, tap, etc.)", crossing the Media
Engagement Index threshold on desktop, or "The user has added the site to their home screen on mobile
or installed the PWA on desktop." None of those describe a fresh window on first use, and the WebRTC
PSA is blunt: "MediaStreamTracks from PeerConnections or local devices that are played out in
audio/video elements or in an AudioContext may not autoplay"
([discuss-webrtc](https://groups.google.com/g/discuss-webrtc/c/BwJOWloyS34)).

But the blog is incomplete. Blink's `autoplay_policy.cc` has an explicit capture exemption:

```cpp
bool AutoplayPolicy::DocumentIsCapturingUserMedia(const Document& document) {
  if (auto* local_frame = document.GetFrame())
    return local_frame->IsCapturingMedia();
  return false;
}
```

and `IsDocumentAllowedToPlay` short-circuits on it:

```cpp
bool AutoplayPolicy::IsDocumentAllowedToPlay(const Document& document) {
  if (DocumentHasForceAllowFlag(document))
    return true;
  if (DocumentIsCapturingUserMedia(document))
    return true;
  ...
```

([source](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/core/html/media/autoplay_policy.cc)).
`IsDocumentAllowedToPlay` is consulted by `IsLockedPendingUserGesture()` when the policy is
`kDocumentUserActivationRequired`, which is the desktop policy (it is the branch that also consults the
Media Engagement Index, and the blog says MEI applies on desktop).

The same file also shows the installed-app exemption:

```cpp
AutoplayPolicy::Type AutoplayPolicy::GetAutoplayPolicyForDocument(
    const Document& document) {
  if (!document.GetSettings())
    return Type::kNoUserGestureRequired;
  if (document.IsInWebAppScope())
    return Type::kNoUserGestureRequired;
  ...
```

In-scope documents of an installed web app skip the gesture requirement entirely. Note that the
shipping intent for this was written for Android WebAPKs
([blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/DW7_yxL_HjE)); the desktop PWA case
is stated by the Chrome blog rather than by that intent, so lean on the blog for desktop.

**Verdict for Chrome: if the page awaits `getUserMedia()` and only then attaches and plays the remote
stream, audible playback is allowed with no click.** The ordering is the whole trick. Play before
capture and you are back to `NotAllowedError`.

`--autoplay-policy=no-user-gesture-required` is a real switch
([Chrome autoplay](https://developer.chrome.com/blog/autoplay)), but it is read out of settings at
renderer startup (`document.GetSettings()->GetAutoplayPolicy()`), and per chromium-discuss it is not
one of the switches forwarded to a running instance. Do not plan around it.

### Safari

"MediaStream-backed media will autoplay if the web page is already capturing" and "MediaStream-backed
media will autoplay if the web page is already playing audio"
([WebKit 7763](https://webkit.org/blog/7763/a-closer-look-into-webrtc/)). Same capture-first rule. On
top of that, macOS Safari has a per-site Auto-Play setting with "Allow All Auto-Play", "Stop Media with
Sound" (the default posture) and "Never Auto-Play"
([Apple](https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac)), so a user who has set
"Never Auto-Play" for the origin will still be blocked. **(unverified)** whether the per-site
"Never Auto-Play" overrides the capture exemption; assume it does and keep the fallback button.

### Firefox

Gecko's `AutoplayPolicy.cpp` has the most explicit statement of the three:

```cpp
static bool IsActivelyCapturingOrHasAPermission(nsPIDOMWindowInner* aWindow) {
  // Pages which have been granted permission to capture WebRTC camera or
  // microphone or screen are assumed to be trusted, and are allowed to
  // autoplay.
  ...
}
```

and `IsWindowAllowedToPlayByTraits` returns true when that holds
([searchfox](https://searchfox.org/mozilla-central/source/dom/media/autoplay/AutoplayPolicy.cpp)).
Firefox is stronger than the other two: a **persisted** camera or mic permission is enough, capture
does not have to be live. The preferences are `media.autoplay.default` (0 allowed, 1 blocked, 2 prompt)
and `media.autoplay.blocking_policy`
([MDN Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)); MDN records
the default of `media.autoplay.default` as 0, while shipping Firefox defaults the UI to "Block Audio",
**(unverified)** which of those is current.

### Practical verdict

In a freshly opened window that immediately captures the mic, remote WebRTC audio plays with no click
in Chrome, Safari, and Firefox, provided the page does capture first and play second. The fallback,
which you should build anyway because it costs one button, is: catch the rejected `play()` promise and
swap the page to a single large "Click to hear them" control, which is a gesture that unlocks
everything for the rest of the document's life.

```js
const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // capture FIRST
audioEl.srcObject = remoteStream;
try { await audioEl.play(); }
catch { showClickToHearButton(); }                                        // then fall back
```

---

## 5. Installed PWA route (Chrome desktop)

**Installability today**: served over HTTPS, a manifest with `name` or `short_name`, `icons` including
a 192px and a 512px icon, `start_url`, `display`, and `prefer_related_applications` absent or false.
Chrome additionally wants engagement, "click/tap the page at least once and spend at least 30 seconds
viewing it" ([web.dev install criteria](https://web.dev/articles/install-criteria)). Note that a
service worker with a fetch handler is not listed in the current criteria.

**Window bounds**: this is the one place requirement (e) is documented to just work. "By default, when
the user opens the PWA for the first time after installation, the PWA gets a default window size of a
percentage of the current screen, with a maximum resolution of 1920x1080 positioned at the top-left
corner of the screen", and "The user can move and resize the window, and the browser will remember the
last preference. The next time the user opens the app, the window will retain the size and position
from the previous usage" ([web.dev PWA windows](https://web.dev/learn/pwa/windows)). There is no
manifest field for preferred size; `moveTo()` and `resizeTo()` are the programmatic route.

**`protocol_handlers`**: available from Chrome 96 on desktop. The manifest member takes "an array of
objects with the two required keys `protocol` and `url`". Custom schemes must "begin with `web+`,
followed by at least one or more lowercase ASCII letters", or be one of the safelisted schemes such as
`mailto`, `bitcoin`, `magnet`. "On the first launch of the PWA due to an invoked protocol, the user
will be presented with a permission dialog" showing the app name and origin
([URL protocol handler](https://developer.chrome.com/docs/web-platform/best-practices/url-protocol-handler)).
So `open "web+waitingroom://join?t=TOKEN"` becomes a legitimate one-liner for the hook, with a single
one-time dialog at first use. **(unverified)**: whether macOS LaunchServices routes a `web+` scheme to
the Chrome PWA app shim without extra registration. Phase 0 test 8.

**Link capturing**: Chromium implements per-app "Open supported links in" and an omnibox "Open with"
intent picker, and the Launch Handler API's `launch_handler.client_mode` decides what happens on
relaunch: `navigate-existing` navigates the most recently used app window to the target URL,
`focus-existing` focuses it and fires a `LaunchParams` event instead
([Launch Handler](https://developer.chrome.com/docs/web-platform/launch-handler/),
[navigation management](https://developer.chrome.com/docs/capabilities/pwa-navigation-management)).
Careful: `navigate-existing` is a navigation, and a navigation adds a session history entry, which
breaks `window.close()` per section 2. For our purpose `focus-existing` plus in-page handling of the
`LaunchParams` URL is the right choice, or `client_mode: "navigate-new"` so each call gets a fresh
one-entry window.

**`open -a "<App Name>" <url>` for a Chrome PWA on macOS**: Chrome creates an app shim in
`~/Applications/Chrome Apps/`, so this should work. **(unverified)**, Phase 0 test 8.

---

## 6. Document Picture-in-Picture and Notifications

**Document PiP** shipped in Chrome and Edge 116, Firefox 151, and is not supported in Safari. The
window "floats on top of other windows". `documentPictureInPicture.requestWindow()` "rejects if it's
called without a user gesture", and takes `width`, `height`, `disallowReturnToOpener` and
`preferInitialWindowPlacement` options, with the caveat that "Chrome may reduce the option values if
they are too large or too small to fit a user-friendly window size"
([Document PiP](https://developer.chrome.com/docs/web-platform/document-picture-in-picture)).

It cannot be the auto-open mechanism, because it needs a gesture every time and needs an existing page
to call it from. It is a good **second-stage** move: the auto-opened window shows "Stranger connected",
the user clicks once, and the call moves into a small always-on-top PiP panel while the opener window
gets out of the way. Note the PiP window is tied to its opener, so calling `window.close()` on the
opener would take the PiP window with it; keep the opener alive (minimised or tiny) for the duration.

**Notifications**: MDN advises that `Notification.requestPermission()` "should be made in response to
user interaction", so the setup page must ask for it behind a button
([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission_static)).
Showing a notification from a page that is about to close is fragile; the durable way is a service
worker, which can show notifications without an open window. Clicking a notification is a user
activation: `clients.openWindow()` requires that "at least one window in the app's origin must have
transient activation", and in Firefox "the method is allowed to show popups only when called as the
result of a notification click event"
([MDN `Clients.openWindow`](https://developer.mozilla.org/en-US/docs/Web/API/Clients/openWindow)).

That gives a genuinely attractive **no-focus-stealing** variant: the hook never opens a window; a Web
Push notification arrives, and the user clicks it to enter the call. It trades instant presence for
zero interruption, and it is the natural answer if Phase 0 test 3 shows `open -g` cannot stop focus
theft. It does require Web Push plumbing (VAPID keys, a service worker, a subscription per user).

---

## 7. Alternatives, ranked

**(i) Plain `open <url>`.** One line, no flags, works from a hook. It goes to whatever the user's
**default browser** is, which may not be Chrome at all, and lands as a tab in that browser's active
window **(unverified)**, which pushes their work aside and gives you a full browser chrome, a
tab that survives the call, and no useful size control. `window.close()` still works if that tab never
navigates. Ranked last for anything but a smoke test.

**(ii) `open -na "Google Chrome" --args --app=URL`.** Chromeless window, user's normal profile so the
saved mic permission applies, one-entry history so `close()` works, capture-first so audio plays. Costs
nothing to build. Loses on size, position, and remembered geometry (section 1), and possibly on focus
(Phase 0 test 3). This is the alpha.

**(iii) Installed PWA plus `web+` protocol handler.** Adds remembered bounds, a dock icon, the
`IsInWebAppScope` autoplay exemption, and a clean `open "web+waitingroom://..."` call. Costs a manifest,
icons, an install step in setup, and a one-time protocol dialog per user. This is the v1. It is
strictly additive to (ii): the same page, same permissions, same close rules.

**(iv) Native helper.** A Swift menu-bar app with a non-activating floating `NSPanel` (the only route
that genuinely solves focus stealing, window geometry, and always-on-top at once), owning the mic via
macOS TCC and doing WebRTC through a Swift SDK such as LiveKit's, or a Tauri app if you prefer to keep
the web UI. Rough size: **one to three weeks** for a working alpha, plus signing and notarisation, plus
an update channel, plus you now ship a binary to friends. What it buys: no browser permission dance, no
autoplay policy, no `window.close()` rules, exact geometry memory, always-on-top, and a mic indicator
users trust. What it costs: it stops being "install a Claude Code plugin" and starts being "install an
app", which is a different product.

**Recommendation.** Alpha among friends on Macs: **(ii)**, with the click-to-hear fallback wired in and
a manual-close screen if `close()` is refused. Later: **(iii)**, because it is the same code plus a
manifest and it fixes the two things (ii) cannot. Keep **(iv)** as the answer only if focus stealing
turns out to be unfixable and people care more about the call than about the install.

---

## 8. Latency and hook compatibility

The relevant events are `PreToolUse` (before a tool call), `PostToolUse` (after a tool call succeeds),
`PostToolUseFailure`, and `PostToolBatch` ("After a full batch of parallel tool calls resolves, before
the next model call") ([hooks](https://code.claude.com/docs/en/hooks)). The documentation states **no
ordering guarantees and no rate limits**; events simply fire at their lifecycle points. Doc
[02](02-claude-code-plugin-mechanics.md) sections 0.3, 6 and 11 cover the rest of the hook contract in
detail.

Three consequences for the open-on-next-response design:

1. **Latency is bounded by tool cadence, not by the network.** During a long stretch of model thinking
   with no tool calls, no hook fires and no window opens. In a tool-heavy loop, hooks fire many times a
   second. So worst-case pairing-to-window latency is however long Claude goes without touching a tool.
   If that matters, `MessageDisplay` and `Notification` also exist, but doc 02 warns against putting a
   `curl` on the render path.
2. **Several hooks can fire within milliseconds of each other**, including in parallel from a batch.
   The server must mark the `open` directive delivered exactly once, and the script needs a local
   mutual-exclusion guard. `mkdir "$LOCKDIR"` is atomic on macOS and is the right primitive; the lock
   should also be checked before spawning, not only after.
3. **`async: true` is compatible with reading a response and calling `open`.** The field is documented
   as "If `true`, runs in the background without blocking". The stdout rule is the one to respect:
   capture the response into a shell variable and never echo it. Doc 02 section 6 spells out that
   stdout on `UserPromptSubmit` is injected into Claude's context, so redirect everything. The `sed`
extraction below avoids `/usr/bin/python3`, which can trigger the Xcode Command Line Tools install
dialog on a fresh Mac; use a real JSON parser only if you ship one:

```sh
resp="$(curl -sS -m 2 -X POST "$ENDPOINT" -d "$payload" 2>/dev/null)" || exit 0
url="$(printf '%s' "$resp" | sed -n 's/.*"open"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
[ -n "$url" ] || exit 0

# Per-directive lock: guards only the millisecond race between concurrent hooks
# for the SAME url. The server's deliver-once mark is the real guard.
key="$(printf '%s' "$url" | /usr/bin/shasum | cut -c1-16)"
mkdir "$LOCKBASE/$key" 2>/dev/null || exit 0   # another hook is already opening this one

open -na "Google Chrome" --args --app="$url" >/dev/null 2>&1
exit 0
```

Note this supersedes doc 02 section 11's advice not to `open` from a hook. That advice assumed the hook
would open a window on every turn. Here the open is gated on a server-issued `open` field that is
handed out at most once per pairing, so the tab-per-prompt objection does not apply.

---

## 9. Recommended alpha mechanism, step by step

**Setup, once per machine.** The `/waiting-room:setup` command runs `open "https://host/setup"` in a
normal tab. That page: (1) calls `getUserMedia({audio:true})` and instructs the user to choose
**"Allow on every visit"**, not "Allow this time"; (2) plays a one-second test tone so the origin
accrues a little Media Engagement as a bonus; (3) optionally asks for notification permission behind a
button; (4) writes the pairing token. Verify with `navigator.permissions.query({name:'microphone'})`
returning `granted` before declaring setup complete.

**Waiting.** Hooks POST a small JSON event, `async: true`, output redirected, no stdout.

**Pairing.** The Worker pairs two waiting users and marks an `open` directive pending for each, with a
short-lived room token.

**Open.** The next hook response for that session carries `{"open": "https://host/room?t=..."}`. The
script takes the `mkdir` lock and runs `open -na "Google Chrome" --args --app="$url"` (add `-g` if
Phase 0 test 3 says it helps).

**Room page, and this part is the contract.**

1. The URL must be served **directly**, HTTP 200, no redirect. Session history size stays 1.
2. `await navigator.mediaDevices.getUserMedia({ audio: true })` runs first, at page load, with no
   gesture. With the persisted grant it resolves silently and, crucially, sets the frame's
   "is capturing" state.
3. Only then attach the remote track and `await audioEl.play()`. Chrome's `DocumentIsCapturingUserMedia`,
   Safari's "already capturing" rule, and Firefox's `IsActivelyCapturingOrHasAPermission` all allow it.
   Catch a rejection and show a single "Click to hear them" button.
4. Never `pushState`, never navigate. `history.replaceState` only, if you want the token gone.
5. Keep the path constant, `/room`, and carry the token in the query or the fragment. Chrome keys app
   window placement on host plus path only, so every call reuses the user's last size and position
   (Phase 0 test 2b). If that turns out not to hold, fall back to `window.resizeTo(360, 480)` and
   `moveTo(...)` at load plus geometry in `localStorage` (Phase 0 test 6).
6. On call end: `window.close()`, then after 400ms check `window.closed` and, if still open, replace the
   body with "Call over. You can close this window." Stop all tracks first so the mic indicator clears
   either way.
7. Heartbeat to the Worker while open, so the server never issues a second `open` while one window is
   alive.

---

## 10. Phase 0 test list (about 30 minutes)

Run each from a shell with Chrome already running and a normal profile.

1. **Does `--app` reach a running Chrome?** `open -na "Google Chrome" --args --app=https://example.com`.
   Expect a chromeless window in the existing profile. If you get a tab or a second full browser
   instead, the alpha mechanism changes.
2. **Are size and position honoured?**
   `open -na "Google Chrome" --args --app=https://example.com --window-size=380,520 --window-position=1200,80`.
   Run it twice: once with Chrome already running (expected: ignored) and once with Chrome fully quit
   (expected: honoured). Confirm both, so you know exactly what you can and cannot plan around.
2b. **Does Chrome remember `--app` bounds by host and path?** Open `--app=https://example.com/room?t=aaa`,
   resize and move the window, close it. Reopen with a **different** token,
   `--app=https://example.com/room?t=bbb`. Does it come back at your bounds? If yes, requirement (e) is
   already solved for the alpha and test 6 is optional. If no, fall through to test 6.
3. **Focus.** Type into the terminal, then have a background `sleep 3; open -g -na "Google Chrome" --args --app=...`
   fire while you are mid-word. Does the window appear behind the terminal and do your keystrokes all
   land? Repeat without `-g` to see the difference. This is the single most important test for whether
   the whole idea is pleasant or hostile.
4. **`window.close()` from an OS-opened `--app` window.** Serve a page whose only content is a button
   calling `window.close()`. Open it with `--app`. Then repeat after adding a 302 redirect, and again
   after a `history.pushState`, and confirm both break it. Watch the console for the refusal message.
5. **Close-refusal detection.** In the broken case, does the `setTimeout` `window.closed` check fire and
   render the manual-close screen?
6. **`resizeTo` / `moveTo` in an `--app` window.** Call `window.resizeTo(360,480); window.moveTo(1200,80)`
   on load. If this works, requirement (e) is solvable without a PWA.
7. **Mic plus autoplay, cold.** Grant "Allow on every visit" once in a normal tab. Then open a fresh
   `--app` window on a page that captures first and plays a remote (or looped local) stream second, with
   no click. Confirm no prompt and audible sound. Then reverse the order (play before capture) and
   confirm it is blocked, so you know the ordering rule is really what is doing the work.
8. **PWA and protocol handler.** Install the page as a PWA, quit and relaunch it twice and confirm the
   window bounds are remembered. Then try `open -a "Waiting Room" https://host/room?t=x` and
   `open "web+waitingroom://join?t=x"` and see which launches the app window and what dialog appears.
9. **Two hooks at once.** Fire the hook script twice concurrently and confirm the `mkdir` lock produces
   exactly one window.
10. **Safari and Firefox spot check**, only if you care: `open -a Safari <url>` and `open -a Firefox <url>`,
    then repeat tests 4 and 7.

---

## 11. Sources

- macOS: `man open(1)` (local, macOS 25.6.0)
- Claude Code hooks reference: https://code.claude.com/docs/en/hooks
- WHATWG HTML, `window.close()` and script-closable: https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-window-close
- MDN `Window.close()`: https://developer.mozilla.org/en-US/docs/Web/API/Window/close
- MDN `Window.closed`: https://developer.mozilla.org/en-US/docs/Web/API/Window/closed
- MDN `Window.resizeTo()`: https://developer.mozilla.org/en-US/docs/Web/API/Window/resizeTo
- text/plain, window.close() Restrictions (Eric Lawrence): https://textslashplain.com/2021/02/04/window-close-restrictions/
- Bugzilla 177827, `dom.allow_scripts_to_close_windows`: https://bugzilla.mozilla.org/show_bug.cgi?id=177827
- Chrome for Developers, Autoplay policy: https://developer.chrome.com/blog/autoplay
- Blink `autoplay_policy.cc`: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/core/html/media/autoplay_policy.cc
- Chromium `startup_browser_creator.cc`: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/ui/startup/startup_browser_creator.cc
- Chromium `web_app_helpers.cc`, `GenerateApplicationNameFromURL`: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/web_applications/web_app_helpers.cc
- Chromium `browser_window_state.cc`, `prefs::kAppWindowPlacement`: https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/ui/browser_window_state.cc
- chromium-discuss, command line switches on a running instance: https://groups.google.com/a/chromium.org/g/chromium-discuss/c/oE-KOCMMtrg
- crbug 40847839, window-size and window-position: https://issues.chromium.org/issues/40847839
- brave-browser#7206, same symptom: https://github.com/brave/brave-browser/issues/7206
- discuss-webrtc, autoplay and extensions policy PSA: https://groups.google.com/g/discuss-webrtc/c/BwJOWloyS34
- blink-dev, autoplay in WebAPK manifest scope: https://groups.google.com/a/chromium.org/g/blink-dev/c/DW7_yxL_HjE
- WebKit blog 7763, a closer look into WebRTC: https://webkit.org/blog/7763/a-closer-look-into-webrtc/
- Apple, Change settings for a website in Safari on Mac: https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac
- searchfox, Gecko `AutoplayPolicy.cpp`: https://searchfox.org/mozilla-central/source/dom/media/autoplay/AutoplayPolicy.cpp
- MDN Autoplay guide: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- Mozilla support, camera and microphone permissions: https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions
- MDN `getUserMedia()`: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- Chrome for Developers, one-time permissions: https://developer.chrome.com/blog/one-time-permissions
- web.dev, installability criteria: https://web.dev/articles/install-criteria
- web.dev, PWA window management: https://web.dev/learn/pwa/windows
- Chrome for Developers, URL protocol handler: https://developer.chrome.com/docs/web-platform/best-practices/url-protocol-handler
- Chrome for Developers, Launch Handler API: https://developer.chrome.com/docs/web-platform/launch-handler/
- Chrome for Developers, navigation management into installed PWAs: https://developer.chrome.com/docs/capabilities/pwa-navigation-management
- Chrome for Developers, Document Picture-in-Picture: https://developer.chrome.com/docs/web-platform/document-picture-in-picture
- MDN `Clients.openWindow()`: https://developer.mozilla.org/en-US/docs/Web/API/Clients/openWindow
- MDN `Notification.requestPermission()`: https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission_static
- Chromium webapps concepts (scope): https://chromium.googlesource.com/chromium/src/+/HEAD/docs/webapps/concepts.md
- Sibling doc: `docs/research/02-claude-code-plugin-mechanics.md` sections 0.3, 6, 11
