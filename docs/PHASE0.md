# Phase 0: what was measured

Browser tests from plan section 06, run on David's Mac on 2026-09-06 with `scripts/probe-mac.sh`: one real room window, opened through the real path (`open -g -na "Google Chrome" --args --app=URL`), measuring itself and reporting through the lobby. Chrome 152, macOS, a 2x display. The week of hook logging has not happened yet; the timing numbers stay provisional (PROTOCOL section 2).

## Results

| Test | Result | Consequence |
| --- | --- | --- |
| 1. App window reaches the running Chrome | Yes. A chromeless window, no tab, in the normal profile. | D-40 holds. |
| 3. Focus | Into the everyday Chrome: the new window took focus within half a second in seven of ten tries, whatever app was in front. Into a second Chrome instance with its own profile, launched hidden: it stayed behind every time, on launch and for later windows. | The plugin opens its own Chrome instance (D-87). The open-when-queued model survives (D-62, D-71). |
| 4. Self-close from an OS-opened app window | Yes. `window.opener` null, history length 1, the window was gone after `window.close()`. | D-69, D-84 hold. |
| 6. Resize floor | `resizeTo(380, 100)` gives outer 380 by 100, inner 380 by 68 (Chrome's own title bar is 32 px). `resizeTo(380, 300)` gives inner 268. | Shaded is 380 by 100 outer as planned (D-74); the 150 px fear did not materialise. The shade lays out to the real 68 px. |
| 7. Audio with no click, cold | Everyday Chrome, mic not yet allowed: AudioContext `suspended`, a MediaStream element did not play. The plugin's own instance, launched with `--autoplay-policy=no-user-gesture-required`: AudioContext `running`, the MediaStream element played, no permission and no click involved. | D-79 stands as built. The door sound and the stranger's voice need no gesture. |
| 9. Notification | Not granted on the test origin, so not exercised here. | The setup page asks once. |
| 10. Two hooks, one window | Verified in the plugin tests (two concurrent `signal.sh` runs, one open) and live in a real `claude -p` run. | D-58 holds. |
| Rehearsal (D-84) | The test window opened behind the terminal, showed "This is a test. Closing in 5.", and closed itself. | The setup page's rehearsal is the real path. |

Also found and fixed on the way: `AudioContext.resume()` never settles without a gesture, so the window now gives it 400 ms and moves on; before that fix the door sound and the probe both hung. And the plugin's instance quits itself when the lobby says nothing is on screen, so no stray Chrome stays in the Dock.

## Still to do, ten minutes at the keyboard

1. Open the setup page for your token, allow the microphone ("on every visit") and notifications, play the door.
2. Run `BASE=https://<your lobby> INVITE=<code> WAIT=16 bash scripts/probe-mac.sh probe` once against the deployed lobby: same checks over the real origin, plus `micPermission: granted` after step 1.
3. Type in the terminal while a window opens (send Claude a long task): do all keystrokes land? The probe says the window never took focus; this is the human check.
4. A week of hook logging for the four timing numbers; nothing in the code needs to change for that, the lobby's vars are the knobs.
