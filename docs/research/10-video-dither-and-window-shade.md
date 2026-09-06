# Dot-Screen Video, the Window Shade, and Opening the Window When Queued

Research date: 2026-09-06. Sits on top of [08-auto-popup-window-mechanics.md](08-auto-popup-window-mechanics.md);
sections 0, 1 and 9 there are not repeated. Three questions:

**A.** How to make the two 176x99 video feeds look like a Poolsuite-style dot screen, cheaply. **B.** Can
the OS window actually shade to about 380x64 and grow to about 380x300. **C.** What changes if the window
opens when you are **queued** instead of when you are **matched**.

Every claim carries a source; anything not confirmed against a primary source is marked **(unverified)**.
Source-code claims are read from Chromium `main` on 2026-09-06 and cross-checked against tag
**152.0.7977.76**, the Chrome build the live tests ran on, where the answer matters.

---

## 0. Verdict table

Rows marked **measured** were tested live on 2026-09-06 in Chrome 152.0.7977.76, macOS 26.6.2 (A.6).

| # | Question | Answer | Source |
|---|---|---|---|
| A1 | CSS dot-screen overlay over a `<video>` | **Yes, use it.** Absolutely positioned sibling (or `::after` on the wrapper) tiling a dot pattern. **measured** to composite correctly over a MediaStream `<video>`, including with forced GPU layers. Gap: not yet tested against a hardware-decoded remote track (macOS CoreAnimation overlay promotion) - untested, not disproven | A.6 items 1 and the closing note |
| A2 | Does it need `mix-blend-mode: multiply`? | **No.** With pure black dots `multiply` is mathematically identical to plain alpha compositing (**measured** bit-identical), and `mix-blend-mode` over `<video>` has real Chromium bugs. Poolsuite itself uses `mix-blend-mode: normal` | [compositing-1](https://drafts.fxtf.org/compositing-1/#blendingmultiply); [jen.dev](https://jen.dev/blog/video-blend-mode/); A.1, A.6 |
| A3 | CSS overlay CPU / latency / bitrate at 15 and 30 fps | **Zero, zero, zero.** No per-frame JS, no readback, no second encode; the dots never reach the encoder | A.4 |
| A4 | How Poolsuite actually does it | A cross-origin YouTube iframe at `brightness(130%)` under a sibling `<div>` tiling a **101-byte 4x4 1-bit PNG** at `background-size: 2px 2px`, `image-rendering: pixelated` site-wide, no blend mode. 25% coverage, no partial alpha | A.1, live DOM inspection |
| A5 | Fullscreen / PiP | **measured**: container fullscreen keeps the overlay, `video.requestFullscreen()` does not. Native PiP shows raw video; use `disablepictureinpicture` | A.5, A.6 item 3 |
| A6 | `image-rendering: pixelated` on a scaled-up `<video>` | **Works** (**measured**, CSS width/height path; `transform: scale()` untested) | A.6 item 2 |
| A7 | Sender-side canvas dither (fallback) | Works. **measured** 4x4 Bayer from a `<video>`: 0.265 ms/frame at 176x99 (0.8% of a 33 ms budget), 0.532 ms at 352x198. From a GPU canvas it is 1.4 to 1.6 ms because `getImageData` readback dominates | A.6 item 5, A.7 |
| A8 | `contentHint = "text"` really changes the encoder | **Yes**, verified end to end: it sets `options.is_screencast = true`, selecting `VideoCodecMode::kScreensharing`, which sets `AV1E_SET_TUNE_CONTENT = AOM_CONTENT_SCREEN` | [`pc/rtp_sender.cc`](https://webrtc.googlesource.com/src/+/main/pc/rtp_sender.cc); [`libaom_av1_encoder.cc`](https://webrtc.googlesource.com/src/+/main/modules/video_coding/codecs/av1/libaom_av1_encoder.cc) |
| A9 | API support | `canvas.captureStream` Chrome 51 / FF 43 / Safari 11. `MediaStreamTrackProcessor` Chrome 94 (partial) and Safari 18, **never Firefox**; `MediaStreamTrackGenerator` Chrome-only, Safari 18 ships `VideoTrackGenerator` instead | [MDN BCD](https://github.com/mdn/browser-compat-data) |
| B1 | `window.resizeTo()` in a Chrome `--app` window opened by the OS | **Yes.** Blink has no "opened by script" gate, and the browser-side gate rejects only `TYPE_NORMAL` | [`local_dom_window.cc`](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/core/frame/local_dom_window.cc); [`browser.cc` @152](https://chromium.googlesource.com/chromium/src.git/+/refs/tags/152.0.7977.76/chrome/browser/ui/browser.cc) |
| B2 | The spec says the opposite | CSSOM View: "If target is not an auxiliary browsing context that was created by a script ... then return." Chromium does not implement that step | [CSSOM View](https://drafts.csswg.org/cssom-view/#dom-window-resizeto) |
| B3 | Hard minimum window size | **100 x 100** CSS px, from `AdjustWindowRectForMinimum(bounds, blink::kMinimumWindowSize)` with `kMinimumWindowSize = 100` | [`web_contents_impl.cc`](https://chromium.googlesource.com/chromium/src/+/main/content/browser/web_contents/web_contents_impl.cc); [`constants.cc`](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/common/widget/constants.cc) |
| B4 | So is 380 x 64 reachable? | **Not as an outer window.** `resizeTo` sets the *frame* rect, so 380 x 64 becomes at least 380 x 100, leaving roughly 62 to 72 px of page under the title bar - which is near enough the design's 64 px line. See B5 for a possible higher floor | B.3 |
| B5 | A possible higher macOS floor | `BrowserFrameViewMac::GetMinimumSize()` forces min height >= 3/4 of the client **minimum** width. That minimum width was not computed (`MultiContentsView` uses a `DelegatingLayoutManager`), so the real floor may be above 100. **Phase 0: `resizeTo(380,100)` then read `outerHeight`** | [`browser_frame_view_mac.mm`](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/ui/views/frame/browser_frame_view_mac.mm) |
| B6 | Does an installed PWA behave differently? | **Yes, and worse.** A real web app sets `is_web_app`, forcing contents width >= `kMainBrowserContentsMinimumWidth = 500`. **A PWA window cannot be 380 px wide.** Confirmed at tag 152.0.7977.76 | [`browser_view_app_layout_impl.cc`](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/ui/views/frame/layout/browser_view_app_layout_impl.cc) |
| B7 | Does a plain `--app=URL` window set `is_web_app`? | **No.** `--app` names the window `host_/path`, which lacks the `_crx_` prefix, so the app id is empty, `GetExtensionById("")` is null, no `AppBrowserController` is created, and the 500 px floor is skipped | [`web_app_helpers.cc`](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/web_applications/web_app_helpers.cc); [`web_app_launch_utils.cc`](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/ui/web_applications/web_app_launch_utils.cc) |
| B8 | Recommended shade geometry | **380 x 300 open, 380 x 100 shaded**, then measure `innerHeight` and size the shade line to that. Do not hardcode 64, and do not ship until B5 is measured | B.5 |
| B9 | Can the window at least *start* small? | Yes: doc 08's per-app-name bounds memory (`host_/path` key) plus a `resizeTo` at load | doc 08 s1; B1 |
| B10 | WindowShade provenance | Rob Johnston / Interactive Technologies for System 6.0.7, bought by Apple, standard in **System 7.5**, folded into the Appearance Manager in Mac OS 8, gone in Mac OS X | [Wikipedia](https://en.wikipedia.org/wiki/WindowShade); [WindowMizer](https://www.windowmizer.com/windowshade-history) |
| C1 | Windows per day, open-when-queued | 10 to 30 open/close cycles, one per long turn, each a chance to steal focus | C |
| C2 | Recommendation | **Open when queued, but one window per session, not per turn**, and require a click before the mic goes live | C.2, C.3 |

---

## A. The dot screen on the video feeds

### A.0 What the look actually is

Not a 1-bit ordered dither. The target is a **fine black dot grid over colour video**, roughly 3 px pitch,
reading as a halftone screen while the picture underneath stays in colour. That is far cheaper than
dithering: the dots are a fixed pattern, not computed from the pixels, so nothing has to touch the video
data. Hence **the dots belong on the receiving end, in CSS, over the `<video>`.** The rest is fallback.

### A.1 How Poolsuite does it

Inspected live on 2026-09-06 (Chrome 152.0.7977.76, macOS 26.6.2, DPR 2). **There is no `<video>` and no
`<canvas>` in the page**: the TV widget is a cross-origin YouTube `<iframe>`, sized 135% and re-centred with
a transform so YouTube's own chrome is cropped off, carrying `filter: brightness(130%)`. The dot screen is a
**plain absolutely positioned sibling `<div class="overlay">`** tiling a base64 PNG:

```css
.overlay { position:absolute; inset:0; width:100%; height:100%;
           background: url(data:image/png;base64,iVBORw0KGgo...);   /* 101 bytes */
           background-size: 2px 2px; }                              /* repeat, opacity 1 */
* { image-rendering: pixelated; -webkit-font-smoothing: none; }      /* site-wide */
```

Computed style confirms `mix-blend-mode: normal`, `opacity: 1`, no filter, no mask, `z-index: auto`. The PNG
decodes to **4x4, 1-bit, palette**, index 0 fully transparent and index 1 fully opaque black, rows
`1100 / 1100 / 0000 / 0000`: a 2x2 opaque black block in a 4x4 tile, **25% coverage, no partial alpha
anywhere**. At DPR 2 the 2 CSS px tile is 4 device px, so it lands exactly one image pixel per device pixel;
on screen the dots are pure `0,0,0`, hard-edged, no antialiasing, and `brightness(130%)` pays back the light
they eat. No blend mode, no gradient, no canvas, no shader - a tiled 1-bit PNG on a sibling div aligned to
the device pixel grid, over a video the page does not own. That is the whole effect.

### A.2 The recipe

Structure. The overlay must be a **sibling painted after the video**, not an ancestor: blend or filter
effects on a video's *parent* break in Safari and have a history of breaking in Chromium, while an
absolutely positioned following sibling works everywhere ([jen.dev](https://jen.dev/blog/video-blend-mode/)).
Poolsuite uses a real sibling div; a `::after` on the wrapper is the same box and saves an element.

```html
<div class="feed"><video autoplay playsinline muted disablepictureinpicture></video></div>
```

```css
.feed { position: relative; width: 176px; height: 99px; overflow: hidden; background: #000; }
.feed video {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: contrast(1.12) saturate(0.9) brightness(1.25);   /* dots eat light; put it back */
}
.feed::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle, rgba(0,0,0,0.60) 0 0.8px, transparent 1px);
  background-size: 3px 3px;                                /* no mix-blend-mode: see A.3 */
}
```

Tune in this order: **pitch** (3px default; 2px reads as texture, 4px as printed halftone), **dot radius**
(the `0.8px` stop, transparent stop about 0.2px beyond), **dot alpha** (`0.60`, the "how strong" knob), then
**brightness/contrast on the video**. Measured geometry of this exact recipe is in A.6 item 4.

**The Poolsuite-exact variant.** If the gradient's plus-shaped dot is not the look, copy what Poolsuite
ships (A.1): a 4x4 1-bit PNG tile as a data URI, transparent except a 2x2 block of opaque black, at
`background-size: 2px 2px` with `image-rendering: pixelated`. 101 bytes, no partial alpha, one image pixel
per device pixel at DPR 2. Crisper but less tunable, which is why the gradient is the default above.

**Retina and the chunky variant.** `background-size: 3px` is 3 **CSS** px, so 6 device px at 2x with a
0.4 device px ramp; the pattern therefore reads lighter at DPR 1 than at DPR 2 (A.6 item 4). If that matters,
add a `@media (min-resolution: 2dppx)` block halving the numbers, or use the PNG tile. For the
low-resolution-blown-up look, negotiate a genuinely small stream (176x99, or 88x50) and scale it up in CSS
with `image-rendering: pixelated`, which is **measured working on `<video>` in Chrome 152** (A.6 item 2) -
that was the one uncertain part.

### A.3 Why not `mix-blend-mode: multiply`

**Mathematical.** Multiply is `B(Cb, Cs) = Cb x Cs`, composited as
`Co = as x [(1 - ab) x Cs + ab x B(Cb, Cs)] + ab x Cb x (1 - as)`
([CSS Compositing and Blending 1](https://drafts.fxtf.org/compositing-1/#blendingmultiply)). With a **black**
source (`Cs = 0`) the bracket collapses to 0, leaving `Co = ab x Cb x (1 - as)`, exactly what plain
source-over with a black source gives. **Black dots under `multiply` are pixel-for-pixel identical to black
dots with no blend mode at all** - confirmed bit-exact in A.6. It buys nothing and costs a stacking-context
change. It only matters if the dots become grey or coloured; revisit then.

**Practical.** `mix-blend-mode` and `<video>` have a bad history in Chromium: the blend can behave as if the
backdrop were ignored, and a `transform` on an ancestor can silently disable it
([chromium-bugs 429468](https://groups.google.com/a/chromium.org/g/chromium-bugs/c/zyS2CDR27eg)); the
overlay-over-background-video pattern is a known source of GPU-compositing dimming bugs
([elementor#30914](https://github.com/elementor/elementor/issues/30914)). Poolsuite, which had every reason
to reach for it, uses `mix-blend-mode: normal`. Skipping it removes a class of "works on my machine" failure.

### A.4 Cost

**CPU: effectively zero, at 15 fps and at 30 fps alike.** No per-frame JavaScript, no `getImageData`, no
readback, no second encode; the dot tile is painted once into a composited layer and re-composited by the
GPU alongside the video quad it already had. Frame rate does not enter into it because nothing per-frame
changed. **Latency: zero**, against at least one frame of buffering for any canvas pipeline. **Bitrate: zero
change**, because the dots never reach the encoder - the CSS route sends an ordinary camera picture, which
VP8/VP9/AV1/H.264 are all tuned for, and paints the dots after decode. **GPU: one extra composited layer per
feed**, 176x99 CSS px. For scale, A.6 measures a full per-frame Bayer dither off a `<video>` at 0.265 ms;
a static repeating background is far below that.

### A.5 Fullscreen and Picture-in-Picture

- **Fullscreen: fullscreen the container, never the `<video>`.** `requestFullscreen()` promotes the element
  and its subtree to the top layer and hides the rest behind the `::backdrop`
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)), so the sibling
  overlay only travels if the wrapper is the element. Measured both ways in A.6 item 3. Simplest of all:
  this window offers no fullscreen affordance.
- **Picture-in-Picture.** Native PiP renders the track in a browser-owned window with no page CSS, so a
  PiP'd feed is raw camera. `disablepictureinpicture` is the fix - "the user agent will not suggest
  picture-in-picture to users, or request it automatically" - though it "only represents a request from the
  website to the user agent" and users can override it
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/disablePictureInPicture)).
  Document PiP moves real DOM, so the overlay travels with it, at the cost of a gesture every time.

### A.6 Live test in Chrome

Tested 2026-09-06, Chrome **152.0.7977.76**, macOS 26.6.2, M1 Max, DPR 2, headful with a live GPU process.
A 352x198 canvas through `captureStream(30)` fed five `<video>` elements, giving real MediaStream-backed
video elements.

1. **The overlay composites correctly over a MediaStream `<video>`.** The dot grid is visible over the
   moving colour video. Black dots with `multiply` came out **bit-identical** to black dots with no blend
   mode, exactly as A.3 predicts. The discriminating control was **white** dots under `multiply`, which gave
   a bit-exact no-op against the no-overlay panel - only possible if Chrome really blends against the video
   layer's pixels. Repeated with `will-change: transform`, `translateZ(0)`, `position: fixed` and
   `opacity: .999` to force separate GPU layers: all four still drew the dots at exactly `0.4x` the
   underlying video pixel.
2. **`image-rendering: pixelated` works on a scaled-up `<video>`.** A 44x25 source at CSS 176x99 rendered
   hard square pixels and kept 1px checkerboard detail; the `auto` control smeared it into a blur. CSS
   width/height path tested; `transform: scale()` not.
3. **Fullscreen, with real user activation.** Container fullscreen kept the overlay (dots still `0.4x`);
   `video.requestFullscreen()` gave raw video. A.5's rule is measured, not just quoted.
4. **Gradient geometry at DPR 2.** The 3px-pitch `radial-gradient` renders as a 6 device px grid whose dot
   is a plus/cross of 8 device px in every 36 (**22.2% coverage**), every pixel either untouched or exactly
   `0.4x` the backdrop - the `.8px -> 1px` ramp is 0.4 device px wide, so no antialiased intermediates. At
   DPR 1 it reads lighter (roughly 1 pixel in 9) and the emulated measurement was self-contradictory, so
   **check the look on a real non-Retina display**.
5. **Bayer 4x4 dither cost**, mean of 120 frames, warm-up discarded:

   | source | 176x99 | 352x198 | 640x360 |
   |---|---|---|---|
   | from a `<video>` element (realistic) | **0.265 ms** (0.8% of a 33 ms frame) | **0.532 ms** (1.6%) | 1.854 ms (5.6%) |
   | from a GPU-backed `<canvas>` | 1.384 ms (4.2%) | 1.588 ms (4.8%) | - |

   `getImageData` dominates the canvas path (1.1 to 1.3 ms, inferred to be a GPU-to-CPU readback); from a
   `<video>` it is 0.04 to 0.09 ms, and the dither arithmetic is about 3.5 ns/pixel. Halve the percentages
   for 15 fps. Best-case on an idle machine: a re-run under load gave 4.0 and 5.3 ms.

**The one gap.** All of this used `captureStream` frames, not a hardware-decoded remote track: macOS
CoreAnimation overlay promotion, the real mechanism behind video punch-through, was not exercised, and the
screenshots are compositor read-backs that bypass CoreAnimation. Poolsuite's own evidence is an overlay over
an iframe. **Phase 0 must re-confirm against a genuine remote WebRTC track.** Nothing seen suggests it will
fail.

### A.7 Fallback: sender-side canvas dither, in brief

In the drawer. It earns its cost only if the CSS overlay cannot give the look, or if the project later wants
a genuinely 1-bit image where the *stranger's own copy* is guaranteed 1-bit. Pipeline: `getUserMedia` ->
`<video>` (or `MediaStreamTrackProcessor`) -> 2D canvas -> ordered dither -> `canvas.captureStream(fps)` ->
`pc.addTrack`. A.6 item 5 measured the cost at **0.265 ms/frame at 176x99 from a `<video>` source**, 0.8% of
a 30 fps budget, so the arithmetic is not the problem; only a GPU-canvas source is expensive, because
`getImageData` then forces a readback.

```js
const B4 = [0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5];        // 4x4 Bayer
const T  = Uint8Array.from(B4, v => (v + 0.5) * 16);           // thresholds 0..255
const W = 176, H = 99;
const src = new OffscreenCanvas(W, H), sctx = src.getContext('2d', { willReadFrequently: true });
const out = Object.assign(document.createElement('canvas'), { width: W, height: H });
const octx = out.getContext('2d'), img = octx.createImageData(W, H);

function frame() {
  sctx.drawImage(video, 0, 0, W, H);
  const d = sctx.getImageData(0, 0, W, H).data, o = img.data;
  for (let y = 0, i = 0; y < H; y++) {
    const row = (y & 3) << 2;
    for (let x = 0; x < W; x++, i += 4) {
      const lum = (d[i] * 77 + d[i+1] * 150 + d[i+2] * 29) >> 8;   // Rec.601
      o[i] = o[i+1] = o[i+2] = lum > T[row + (x & 3)] ? 255 : 0;
      o[i+3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

const track = out.captureStream(15).getVideoTracks()[0];
track.contentHint = 'text';
pc.addTrack(track, new MediaStream([track]));
```

The same loop on the **receiving** side is the cheaper cousin: identical cost, no encoder involvement, no
privacy claim, switchable per viewer. If a true 1-bit look is ever wanted, do it there, not on the sender.

**What `captureStream` needs.** A frame is added only "If new content has been drawn to the canvas since it
was last painted" ([mediacapture-fromelement](https://w3c.github.io/mediacapture-fromelement/)), so **the
canvas must keep being drawn**; omit the argument and a frame is captured on every change, pass `0` and
frames come only from `track.requestFrame()`. Support: Chrome 51, Firefox 43, Safari 11. Beware
`requestAnimationFrame` throttling when the window is occluded; `setInterval` is the defensive choice.

**Insertable Streams as a cleaner alternative.** `MediaStreamTrackProcessor` hands you a `ReadableStream` of
`VideoFrame`s and `MediaStreamTrackGenerator` takes them back: frame-driven rather than clock-driven,
timestamps survive, no hidden `<video>`, no rAF throttling. The cost is support - `MediaStreamTrackProcessor`
is **Chrome 94** (flagged `partial_implementation`, "Exposed on `Window` instead of `DedicatedWorker`") and
**Safari 18**, **never Firefox**; `MediaStreamTrackGenerator` is **Chrome 94 only**, while Safari 18 ships
the renamed `VideoTrackGenerator` which Chrome lacks
([BCD](https://github.com/mdn/browser-compat-data/blob/main/api/MediaStreamTrackProcessor.json)). A
cross-browser build needs both spellings plus a `captureStream` fallback.

**How the codecs handle dither noise.** An ordered dither is the worst case for a DCT-based encoder:
maximum amplitude at maximum spatial frequency, and the pattern *moves* as luma crosses each threshold, so
inter-frame prediction fails too. At a fixed bitrate the encoder quantises harder, smearing the dither into
grey mush. Two partial mitigations.

**First, `track.contentHint = 'text'`.** The spec says for `"text"` use `maintain-resolution`, and "In
addition, if the encoding codec is AV1, activate encoding tools for `text` mode"
([mst-content-hint](https://w3c.github.io/mst-content-hint/), which is also where
`RTCDegradationPreference` and `degradationPreference` are actually defined; they are **not** in
webrtc-pc). The chain is implemented: Blink maps `contentHint` to
`webrtc::VideoTrackInterface::ContentHint` (`media_stream_video_webrtc_sink.cc`), libwebrtc turns
`kDetailed`/`kText` into `options.is_screencast = true` (`pc/rtp_sender.cc`), and that selects
`VideoCodecMode::kScreensharing`, which the AV1 encoder reads directly as
`SET_ENCODER_PARAM(AV1E_SET_TUNE_CONTENT, AOM_CONTENT_SCREEN)` (`libaom_av1_encoder.cc`) - full paths in
section D. AV1's screen-content tools are mandatory parts of the format (palette mode, 2 to 8 colours per
block, plus intra block copy) and a two-tone image with repeated 4x4 patterns is near their best case
([AOMedia](https://aomedia.org/docs/AV1_ToolDescription_v11-clean.pdf);
[Visionular](https://visionular.ai/av1-screen-content-coding/)); H.264 in WebRTC has no equivalent, so an
H.264 fallback looks worse. **(unverified)** whether AV1 is actually negotiated between two Chrome peers
here; check `getStats()` in Phase 0.

**Second, send small.** 176x99 at 15 fps is about 261k pixels/sec against 1.7M for 640x360. But note the
trap: **a "1-bit-looking" image is not automatically cheap** - two-tone noise can cost more than the smooth
colour image it replaced. Only the small resolution is reliably cheap.

### A.8 Privacy

The CSS overlay is **cosmetic on the receiving end**: raw camera frames are captured, encoded and
transmitted exactly as in any video call, and the stranger's browser draws the dots. A sender-side canvas
pipeline is genuinely different, because the raw frame never leaves the machine. For this product that
difference does not earn its cost: video is **mutually opt-in**, both people click to turn it on, and the
honest framing is "a video call that looks like 1994", not "a privacy feature". Say so in the UI rather than
implying the dots protect anyone.

### A.9 Recommendation for the alpha

**Ship the CSS overlay.** Absolutely positioned sibling (or `::after` on the wrapper), dot tile at 3px
pitch, `rgba(0,0,0,0.6)`, no `mix-blend-mode`, `filter: contrast(1.12) saturate(0.9) brightness(1.25)` on
the video, `disablepictureinpicture` on the `<video>`. Zero CPU, zero latency, zero bitrate change, zero
codec risk, about fifteen lines of CSS, measured working over a MediaStream `<video>` in Chrome 152, and
tunable live in DevTools while David watches - which for a look-and-feel decision beats every technical
argument. Every alternative costs a per-frame loop, a second encode path, or a browser-support matrix, for
an effect the viewer cannot distinguish. Keep A.7 written down and unbuilt.

---

## B. Window shade and window size

### B.1 The resize chain, verified end to end

Can a page inside an OS-launched `open -na "Google Chrome" --args --app=URL` window resize its own window?
Doc 08 item 16 marked this **(unverified)** on the strength of MDN's wording. It is now verified: **yes**,
with a floor. Four stages, each read from source.

1. **Blink imposes nothing about the opener.** `LocalDOMWindow::resizeTo` has exactly three guards: the
   frame must exist and be the outermost main frame, the document must not be prerendering, and *if the
   window is a document Picture-in-Picture window* it must consume transient user activation. Then it calls
   `ChromeClient::ResizeWindowTo` (or `SetWindowRect`)
   ([`local_dom_window.cc`](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/core/frame/local_dom_window.cc)).
2. **The browser process clamps to 100 px.** `AdjustWindowRectForMinimum(bounds, minimum_size)` raises any
   non-zero width or height to `minimum_size`, called from `WebContentsImpl::AdjustWindowRect`, which sits
   on the path of `SetWindowRect`, `MoveWindowTo` **and** `ResizeWindowTo`
   ([`web_contents_impl.cc`](https://chromium.googlesource.com/chromium/src/+/main/content/browser/web_contents/web_contents_impl.cc)),
   with `blink::kMinimumWindowSize = 100` (`third_party/blink/common/widget/constants.cc`, which also has
   `kMinimumUnframedWindowSize = 29` for `display-mode: unframed` apps holding Window Management permission).
3. **The delegate gates on window *type*, not on the opener.** `Browser::SetContentsBounds` is, in full,
   `if (is_type_normal()) { return; } ... window_->SetBounds(bounds);`
   ([`browser.cc` at tag 152.0.7977.76](https://chromium.googlesource.com/chromium/src.git/+/refs/tags/152.0.7977.76/chrome/browser/ui/browser.cc);
   on `main` the same logic moved to `browser_web_contents_delegate.cc`). A `--app` window is `TYPE_APP`, so
   it passes; an ordinary tabbed window is `TYPE_NORMAL`, which is why "resizeTo does nothing" is most
   people's experience. **Nothing in the chain asks whether the window came from `window.open()`.**
4. **`BrowserView::SetBounds` applies it**, after `ExitFullscreen()` - so a `resizeTo` silently drops the
   window out of fullscreen
   ([`browser_view.cc`](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/ui/views/frame/browser_view.cc)).

### B.2 What the spec says, and why it does not matter

The task framed this as a WHATWG rule; it is actually **CSSOM View**. `resizeTo`, `resizeBy`, `moveTo` and
`moveBy` all carry the step *"If target is not an auxiliary browsing context that was created by a script
(as opposed to by an action of the user), then return"*, and separately *"Optionally, clamp width and height
in a user-agent-defined manner so that the window does not get too small"*
([CSSOM View](https://drafts.csswg.org/cssom-view/#dom-window-resizeto)). MDN paraphrases the first step,
which is where doc 08's pessimism came from. **Chromium implements the second and not the first.** Firefox
and Safari are **(unverified)**; the alpha is Chrome-only. Build on the code, not the spec text, and re-test
after Chrome major upgrades.

### B.3 The floors, stacked

For a `--app` window on macOS the effective minimum is the maximum of three things:

1. **100 x 100**, the `AdjustWindowRectForMinimum` clamp from B.1. `resizeTo(380, 64)` reaches the window
   manager as `380 x 100`.
2. **The layout minimum**, `BrowserViewAppLayoutImpl::GetMinimumSize`, which sums window title, web app
   frame toolbar, infobar container and contents view. A `--app` shortcut window has no web app frame
   toolbar, so this stays small - except for one branch,
   `if (is_web_app) contents_size.SetToMax(gfx::Size(kMainBrowserContentsMinimumWidth, 1));`
   (`browser_view_app_layout_impl.cc`), with `kMainBrowserContentsMinimumWidth = 500`, whose header comment
   explains the number: "This value provides a trade-off between browser usability and privacy -
   specifically, the ability to browse in a very small window, even on large monitors (which is why a
   minimum height is not specified)" (`browser_view_layout.h`, confirmed unchanged at tag 152.0.7977.76).
3. **A macOS aspect rule, and this is the open question.** `BrowserFrameViewMac::GetMinimumSize()` ends with
   `client_size.SetToMax(gfx::Size(0, (client_size.width() * 3) / 4));`, commented "macOS apps generally
   don't allow their windows to get shorter than a certain height, which empirically seems to be related to
   their *minimum* width rather than their current width" (`browser_frame_view_mac.mm`). Minimum width, so
   asking for 380 wide does not force 285 tall. But **I could not compute what that minimum width is**: it
   bottoms out in `MultiContentsView::GetMinimumSize()`, which has no override and goes through a
   `DelegatingLayoutManager`. If it lands above about 134, this rule pushes the height floor above 100 (a
   200 px minimum width would mean a 150 px floor). **The one number in section B that is inference.**

**Net: 380 x 64 as an outer window is not reachable; 380 x 100 probably is.** And 100 is better than it
looks, because of *which* rectangle is being set. `SetContentsBounds` is a misleading name: it ends at
`BrowserView::SetBounds`, which forwards to `frame_view->SetFrameBounds(bounds)`
([`browser_view.cc`](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/ui/views/frame/browser_view.cc)),
so the rect you pass to `resizeTo` is the **whole window, title bar included**. A 380 x 100 window leaves
roughly 62 to 72 px of web contents, near enough the 64 px line the design asked for.

**Phase 0, one minute, settles both unknowns.** In a `--app` window run `window.resizeTo(380, 100)` then log
`outerWidth, outerHeight, innerWidth, innerHeight` half a second later: `outerHeight` gives the real floor,
`innerHeight` gives the shade line height.

### B.4 The PWA is worse, not better

Doc 08 section 7 ranked the installed PWA as the "v1" upgrade, mostly for its documented window-bounds
memory. For a shade window that ranking inverts, because of floor 2 above. The chain, all source-read:
`--app=https://host/room` names the window `host_/room` via `GenerateApplicationNameFromURL`;
`MaybeCreateAppBrowserController` derives an app id with `GetAppIdFromApplicationName(app_name)`, which
returns the empty string unless the name starts with `_crx_`; an empty id matches no installed app and
`GetExtensionById("")` is null, so no controller is created; `AppBrowserController::IsWebApp(browser)` is
literally `browser && From(browser)`, so it is false; and `BrowserViewLayout::CreateLayout` therefore builds
`BrowserViewAppLayoutImpl(..., is_web_app=false)` and skips the 500 px floor. (Files:
`web_app_helpers.cc`, `web_app_launch_utils.cc`, `app_browser_controller.cc`, `browser_view_layout.cc`;
full paths in section D.)

An **installed** PWA launched by app id gets `_crx_<appid>`, a controller, `is_web_app = true`, and the
500 px minimum content width, plus its own frame toolbar. **An installed PWA window cannot be 380 px wide.**
So: `--app` for the shade. If the PWA route is wanted later for its other benefits (protocol handler,
autoplay scope exemption), the window has to widen to 500+ first. Worth confirming in Phase 0 test 8, since
this is a source read and not a measurement.

### B.5 Recommended shade design

- **Open: 380 x 300 outer.** As designed.
- **Shaded: `resizeTo(380, 100)`**, then read back `outerHeight`/`innerHeight` and lay the shade line out to
  whatever came back (B.3). If the Mac aspect rule pushes the floor to ~150 the design still works, it just
  shows two lines instead of one. Draw the line inside the page on the desktop-textured background so the
  visual shade and the real window edge coincide. Never hardcode 64.
- **Transitions:** one `resizeTo` each way, no gesture (B.1); `AdjustWindowRectForDisplay` already clamps the
  rect into the work area, so growth cannot push the window off-screen.
- **Fallback if `resizeTo` is ever blocked:** hold 380 x 300 for the session and draw the shaded state
  inside the page, filling the closed area with the desktop pattern. Worse-looking, one CSS class,
  guaranteed correct - build it first and let `resizeTo` be the enhancement.
- **Starting small:** doc 08 s1 established that Chrome stores `--app` placement per app window name
  (`host_/path`, query excluded), so a window the user once sized comes back that way; combine with a
  `resizeTo` at load. **(unverified)** whether it lands before first paint; expect a brief flash.

### B.6 WindowShade, for the design note

Rob Johnston at Interactive Technologies wrote WindowShade for System 6.0.7 as a third-party extension;
Apple bought the rights and shipped it as a standard control panel in **System 7.5**, where double-clicking
a title bar rolled the window up to nothing but the title bar. It stopped being a separate control panel in
Mac OS 8, when the behaviour moved into the Appearance Manager with a collapse widget, and disappeared in
Mac OS X, replaced by Dock minimisation and later Expose; WindowShade X and WindowMizer kept it alive
([Wikipedia](https://en.wikipedia.org/wiki/WindowShade);
[WindowMizer](https://www.windowmizer.com/windowshade-history)).

The design point: WindowShade was never a minimise. The window stayed **where it was**, **on top**, and
**addressable** - exactly the semantics the queued state wants, and why a Dock minimise would read wrong.

---

## C. Opening the window when queued, not on match

### C.1 What changes

| | Open on match | Open when queued |
|---|---|---|
| Windows per day | 0 to 3 | 10 to 30, one per long turn |
| First thing you see | A stranger, already connected | An honest count: "3 people waiting" |
| Lie surface | The window existing implies a match | None; the count is the truth |
| Mic at open | Live (needed for autoplay, doc 08 s4) | **Should be off.** See C.3 |
| Matching latency | Bounded by hook cadence (doc 08 s8) | Zero; the window already holds a WebSocket |
| Focus interruptions | Rare | 10 to 30 per day |

That last row is the whole risk. Doc 08 Phase 0 test 3 (`open -g`, and whether it really stops focus theft)
was a nice-to-have under open-on-match. Under open-when-queued it is a **gate**: 30 focus steals a day while
you are typing is not a quirk, it is an uninstall.

### C.2 One window per session, not one per turn

Closing the window when your Claude finishes the turn means 10 to 30 open/close cycles a day, each a
LaunchServices round trip, a fresh WebSocket, a fresh page load, a fresh chance to steal focus, and a thrown
away queue position.

**Recommendation: open once per Claude Code session, keep it shaded, close it on a quiet timeout.** The
window heartbeats to the lobby, which knows when the last hook fired; if nothing has fired for N (start at
3 minutes) the lobby tells the window to close, and the window also closes itself when its own heartbeat
response says the session went quiet. This handles Escape too, where the hooks simply stop and there is no
"user cancelled" event: the silence timeout is the only honest signal, and it is the same mechanism either
way, so build it once.

### C.3 The consent moment

A window that sits open while you work is a window a stranger can walk into at any moment. Doc 08's
capture-first ordering (`getUserMedia` before `play()`) is still required for autoplay, but it must not run
at open time - the mic indicator would then be lit for every long turn of every day, which is both a real
privacy problem and the sort of thing that gets a tool banned from a work laptop.

**Recommendation: entering requires a click on your side.** (1) The window opens shaded and **silent**: no
mic, no capture, just the honest count. (2) A stranger is matched: the door sound plays, the window unshades
to 380 x 300, and the chatroom shows "someone entered". (3) **Nothing is transmitted yet**; the only control
is one large "Say hello" button. (4) Clicking it calls `getUserMedia`, then attaches the remote audio - and
that click is the user activation that unlocks mic and playback together, which deletes every autoplay
fallback from doc 08.

One click buys: no hot mic while you work, a real consent boundary, an honest "they have not joined yet"
state, and a simpler autoplay story. It also improves the emotional shape of the thing, because the door
opening and you choosing to answer become separate acts.

The door sound must work *before* the click, and without capture or a prior gesture autoplay is blocked
(doc 08 s4 item 11). Degrade to a visual knock - the shade line changing, the title bar flashing - and have
setup take a one-time gesture on the origin. **(unverified)** whether that accrues enough Media Engagement
for later `--app` windows to be audible.

### C.4 New failure modes

1. **Window accumulation**, far more likely now the window opens on a common event. Doc 08's `mkdir` lock,
   the deliver-once server mark and a `BroadcastChannel` ping from any live window are now load-bearing.
2. **Zombie window after Escape.** C.2's quiet timeout covers it, but the window must survive the lobby
   being unreachable too: local self-destruct at, say, 30 minutes with no successful heartbeat.
3. **A stranger matched to a window whose human left.** Open-on-match had an implicit liveness check;
   open-when-queued does not. The lobby needs presence from the window, and should refuse to match one that
   has missed two heartbeats.
4. **Wrong Space.** The window opens on whatever Space is active; no browser fix, a native helper (doc 08 option iv) is the only real answer.
5. **Two Claude Code sessions in two terminals**, each wanting a window. Key the lobby on session id and make
   the local lock per session, or you get two shades stacked on each other.

---

## D. Sources

**Specs.** [CSSOM View `resizeTo`](https://drafts.csswg.org/cssom-view/#dom-window-resizeto) - [CSS Compositing and Blending 1](https://drafts.fxtf.org/compositing-1/#blendingmultiply) - [Media Capture from DOM Elements](https://w3c.github.io/mediacapture-fromelement/) - [MediaStreamTrack Content Hints](https://w3c.github.io/mst-content-hint/) (also defines `RTCDegradationPreference` and `RTCRtpSendParameters.degradationPreference`) - [Insertable Media Processing using Streams](https://w3c.github.io/mediacapture-transform/). **MDN**, all under `https://developer.mozilla.org/en-US/docs/Web/API/`: `HTMLCanvasElement/captureStream`, `MediaStreamTrack/contentHint`, `MediaStreamTrackProcessor`, `HTMLVideoElement/disablePictureInPicture`, `Element/requestFullscreen`; compat data read raw from [browser-compat-data](https://github.com/mdn/browser-compat-data).

**Chromium**, all under `https://chromium.googlesource.com/chromium/src/+/main/`: `third_party/blink/renderer/core/frame/local_dom_window.cc`, `.../core/frame/web_frame_widget_impl.cc`, `third_party/blink/common/widget/constants.cc`, `content/browser/web_contents/web_contents_impl.cc`, `chrome/browser/ui/browser_web_contents_delegate/browser_web_contents_delegate.cc`, `chrome/browser/ui/views/frame/browser_view.cc`, `.../frame/browser_frame_view_mac.mm`, `.../frame/layout/browser_view_layout.{h,cc}`, `.../frame/layout/browser_view_app_layout_impl.cc`, `chrome/browser/web_applications/web_app_helpers.cc`, `chrome/browser/ui/web_applications/{web_app_launch_utils,app_browser_controller}.cc`, `chrome/browser/ui/extensions/{application_launch,hosted_app_browser_controller}.cc`, `chrome/browser/ui/startup/startup_browser_creator.cc`, `third_party/blink/renderer/modules/peerconnection/media_stream_video_webrtc_sink.cc`, `ui/views/view.cc`. Shipping cross-check at [tag 152.0.7977.76](https://chromium.googlesource.com/chromium/src.git/+/refs/tags/152.0.7977.76/chrome/browser/ui/browser.cc). **WebRTC**, under `https://webrtc.googlesource.com/src/+/main/`: `pc/rtp_sender.cc`, `modules/video_coding/codecs/av1/libaom_av1_encoder.cc`.

**Other.** [AOMedia AV1 tool description](https://aomedia.org/docs/AV1_ToolDescription_v11-clean.pdf) - [Visionular on AV1 screen content](https://visionular.ai/av1-screen-content-coding/) - [jen.dev, mix-blend-mode on video](https://jen.dev/blog/video-blend-mode/) - [chromium-bugs 429468](https://groups.google.com/a/chromium.org/g/chromium-bugs/c/zyS2CDR27eg) - [elementor#30914](https://github.com/elementor/elementor/issues/30914) - [Wikipedia, WindowShade](https://en.wikipedia.org/wiki/WindowShade) - [WindowMizer, History of WindowShade](https://www.windowmizer.com/windowshade-history) - poolsuite.net, live DOM and CSS inspection 2026-09-06. Sibling docs: `08-auto-popup-window-mechanics.md`, `02-claude-code-plugin-mechanics.md`.
