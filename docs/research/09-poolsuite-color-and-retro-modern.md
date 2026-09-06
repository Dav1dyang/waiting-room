# Poolsuite colour, and how to be retro, modern and fun

Research memo 09. Written 2026-09-06 for the waiting-room room window (D-40, 380px wide; D-56, D-59).

David's brief: "I love what we have already, just need some small adjustments to make it feel right", plus "pastel colors would be nice", plus a note that Poolsuite's radio waveform is a fun model for audio.

Everything in section 1 was measured on the live site on 2026-09-06 by fetching the page, its stylesheet, its JavaScript chunks and its image assets, and by rendering the page in headless Chrome at devicePixelRatio 2 and reading computed styles. Values are exact unless marked (unverified). Nothing here copies a Poolsuite or Apple asset; only the visual grammar is being read.

Prior memos this one builds on: 07 sections 4.2 and 4.3 (the eight rules), and `design/build.py` (current tokens: black 1px lines, cream `#F5EEDF`, pale yellow `#FFF1A8`, desktop dither `#CFDAE3`/`#93A7B8`, ChiKareGo2 16px, Geneva 12px).

---

## 1. Poolsuite, verified

Sources fetched: `https://poolsuite.net` (HTML), `/css/index.5278903b.css` (the path from memo 07 is unchanged), `/js/index.4e1f2c57.js`, `/js/view-DefaultPage-vue.809c33fa.js`, `/lib/psapi.min.js`, `/img/*.svg`, `/dock/*.png`.

### 1.a Every colour, and where it is used

Poolsuite does not have a fixed palette. It has a **five-token theme contract** written into CSS custom properties on `<html>`, plus seven more tokens derived from those five by JavaScript. This is the single most important structural finding.

Authored per theme (5 values):

| Token | Role |
| --- | --- |
| `--primary` | reserved; equal to `--secondary` in 8 of 9 themes |
| `--secondary` | panel and window fill |
| `--tertiary` | highlight fill (see below) |
| `--button` | primary button fill |
| `--secondary-button` | secondary button fill |
| `--backgroundOverwrite` | desktop fill; also written to `<meta name="theme-color">` and to `body`'s background |

Derived at runtime (7 values), by darkening or lightening the authored ones:

| Token | Derived from | Default value |
| --- | --- | --- |
| `--secondary-shadow` | secondary, 0.2/0.9 | `rgba(199,192,186,0.9)` |
| `--secondary-lighter` | secondary, 0.5/1 | `#FCF8F4` |
| `--secondary-darker` | secondary, 0.2/1 | `#C7C0BA` |
| `--button-shadow` | button, 0.5/1 | `#7B6B6B` |
| `--button-focus` | button, 0.1/1 | `#DDC0C0` |
| `--secondary-button-shadow` | secondaryButton, 0.5/1 | `#587173` |
| `--secondary-button-focus` | secondaryButton, 0.1/1 | `#9ECBCE` |

So a theme author picks five pastels and the bevel colours, the focus colours and the shadow colours all fall out automatically, in family. That is why no Poolsuite theme ever looks like it has a foreign grey in it.

Structural colours, outside the theme system and never themed:

| Value | Role |
| --- | --- |
| `#000000` | every frame, rule, divider, control outline, icon. Always 1px. |
| `#FFFFFF` | field and content surfaces (the now-playing panel, inputs), and the 1px inset top highlight on buttons |
| `#EF4444` with `#F87171` halo | the "ON AIR" dot. Tailwind red-500 and red-400. The only saturated colour in the running interface. |
| `#313131` | the outline colour inside the 32px dock icons (not `#000000`) |

Counts from memo 07 still hold directionally: black is the most-used background colour in the DOM, and hot pink `#FB278D` appears on exactly one element.

### 1.b Themes: yes, nine of them

There is a theme picker. It lives in the Settings window (verified: the `SettingsInner` component registers `ThemeSelectionHandler`). It is not day/night and not a colour-mode toggle; it is a wallpaper-and-palette switcher, and each swatch is a tiny live mock of the desktop drawn in that theme's own colours. Themes are fetched from a CMS at runtime, so the list can change; this is the list on 2026-09-06, read from the running application's store.

| Slug | Title | secondary (panel) | tertiary | button | secondaryButton | desktop |
| --- | --- | --- | --- | --- | --- | --- |
| `poolsuite-os` | Poolsuite OS **(default)** | `#F9F0E9` | `#FCF4C5` | `#F6D5D5` | `#AFE2E5` | `#F6D5D5` |
| `palermo-weekends` | Palermo Weekends | `#DFF5F2` | `#DFF5F2` | `#FCF4C5` | `#AFE2E5` | `#85C9C9` |
| `pacific-breeze` | Pacific Breeze | `#EDF6FA` | `#EDF6FA` | `#FCF4C5` | `#BAE0F3` | `#8DCAE9` |
| `martini-picnic` | Martini Picnic | `#E8F9E2` | `#A1E6BA` | `#FCF4C5` | `#A1E6BA` | `#73C792` |
| `kamakura` | Kamakura Sunrise | `#FFFFFF` | `#D4E9FD` | `#BAE0F3` | `#FFEDED` | `#7EB0E1` |
| `poolside-fm` | Poolside OG | `#FFEDED` | `#FFEDED` | `#C6C5E8` | `#F6D5D5` | `#6968AF` |
| `terra` | Terracotta Dawn | `#FBE4DD` | `#FFCAB9` | `#FFC47D` | `#FFC47D` | `#B85F42` |
| `members-only` | Members Only | `#F9F0E9` | `#FFDCC0` | `#FFDCC0` | `#FCF4C5` | `#E9C600` |
| `partners` | Poolsuite Partners | `#F9F0E9` | `#F6D5D5` | `#F6D5D5` | `#F6D5D5` | `#17070D` |

Answers to David's question 2, directly: the **teal is `#85C9C9`** (Palermo Weekends desktop), the **pink desktop is `#F6D5D5`**, the **cyan Play button is `#AFE2E5`**, and the **pink shuffle button is `#F6D5D5`**, which is the same token as the pink desktop in the default theme. The cream panel is `#F9F0E9`. His eyeball readings of `#7EC4CB`, `#F1D3D3`, `#BDE6E8` and `#F1CFD1` were all within a few points, so his eye is calibrated; screenshot compression accounts for the drift.

Observations worth carrying:

- Eight of the nine panels sit between L 0.94 and L 0.97 in OKLCH; the ninth (Kamakura) is pure white. Six of the nine desktops are mid pastels between L 0.74 and L 0.90, and the outliers are the two deliberately dark ones plus Poolside OG. The panel is always much lighter than the desktop, so the window separates by lightness, not by the 1px line alone.
- The default theme is the exception: its desktop `#F6D5D5` and panel `#F9F0E9` are only 6.6 OKLab units apart, so the window barely separates. It relies on the frame and a soft shadow. That is a deliberate soft, sunlit look and it is the one David screenshotted.
- Desktops are **flat solid colour** plus a very faint CMS background image. There is no dither, no checker, no noise on the desktop.
- Only two themes go dark-ish (`terra` `#B85F42`, `partners` `#17070D`). There is no dark palette.

**The actual dark mode is a filter.** A Settings toggle sets `isInverted`, which adds Tailwind's `invert` class to the app root, applying `filter: invert(1)` to the entire interface. That is the whole implementation. There is no second palette, and `prefers-color-scheme` appears exactly zero times in the 139KB stylesheet. The only `dark` selectors in the CSS belong to the OverlayScrollbars and vue-select libraries and are unused.

### 1.c Icons

Poolsuite runs **two icon registers and never mixes them**. This is the answer to David's question 3.

**Register 1: window chrome, strictly 1-bit.** Every icon inside a window is a PNG with a 2-entry palette (opaque black plus a transparent index), inlined as a base64 data URI, `image-rendering: pixelated`. Measured logical sizes, all rendered at exactly half their source size:

| Icon | Source px | Displayed CSS px |
| --- | --- | --- |
| dropdown caret | 10x6 | 5x3 |
| fullscreen | 10x10 | 5x5 |
| play (transport) | 12x20 | 6x10 |
| video prev / next | 12x10 | 6x5 |
| close (X) | 14x14 | 7x7 |
| stop | 24x24 | 9x9 |
| track prev / next | 20x16 | 10x8 |
| TV toggle | 22x22 | 11x11 |
| palm tree, share | 24x24 | 12x12 |
| favourite (heart) | 28x24 | 14x12 |
| clock | 32x32 | 16x16 |

I checked every one of these programmatically: **all of them are exact 2x pixel doublings.** Each is drawn on the small grid, exported at 2x, and displayed at the small size. On a retina screen one source pixel lands on one device pixel and the icon is perfectly sharp; on a 1x screen the nearest-neighbour downsample is lossless because the art is already doubled. That is the whole crispness trick, and it costs nothing.

Five described precisely, by construction rather than by copying the art:

1. **Close, 7x7.** A pure diagonal cross: two 1px diagonals corner to corner, meeting in the centre pixel. It is not a Classic Mac close box. It sits in the top-left of the title bar with no surrounding box.
2. **Play, 6x10.** A right-pointing solid triangle built by adding one pixel per row for five rows and removing one per row for five rows, so the apex is a 2px-tall flat, not a single point. Flat apexes are why pixel triangles read as solid rather than as a snag.
3. **Previous track, 10x8.** A 2px-wide solid vertical bar on the left, then two solid left-pointing triangles filling the remaining 8 columns. All three elements share the same 8px height, so the glyph reads as one object.
4. **Heart (favourite), 14x12.** A 1px outline only, no fill. Two 4px-wide lobes across the top separated by a 2px notch, walls dropping straight for four rows, then a 45-degree taper to a 2px point. Outline weight is exactly 1px everywhere including the diagonals.
5. **Wristwatch-style clock, 16x16.** A filled 1-bit disc, radius stepped 6,5,5,4,3,3,2,1 pixels in from the corners, so the circle is round with no jaggies at 16px. In the colour original it carries five palette entries; reduced to its silhouette it is a solid disc.

**Register 2: the dock, multi-colour pixel art.** The nine dock icons are `poolsuite.net/dock/*.png`, all **32x32 RGBA**, displayed at 32 CSS px inside 80x80 tiles with a text label under them.

| Icon | Unique colours | Opaque pixels |
| --- | --- | --- |
| newsroom (envelope) | 6 | 504 |
| fm (martini) | 7 | 327 |
| mixtapes (CD) | 8 | 521 |
| eventCalendar | 9 | 603 |
| members (certificate) | 9 | 592 |
| guestbook (book) | 10 | 452 |
| vacation (sunscreen) | 12 | 387 |
| instagram (camera) | 15 | 556 |
| settings (monitor) | 7 (indexed) | n/a |

Precise characterisation of that style:

- **Zero anti-aliasing.** I counted semi-transparent pixels in all eight RGBA icons: exactly 0 in every one. Every pixel is fully opaque or fully absent. Every edge is hard.
- **6 to 15 colours, median 9.** These are small palettes, hand-picked per icon, not photographic.
- **A single 1px outline in `#313131`,** a charcoal, not pure black. It appears in every icon at 45 to 118 pixels. Using charcoal rather than black is what makes them sit *on* the pastel desktop instead of punching holes in it.
- **A shared system-grey ramp:** `#FFFFFF`, `#D9D9D9`, `#C0C0C0`, `#A2A2A2`, `#808080`, `#313131`. These are the period Mac and Windows greys and they recur across icons, which is what makes nine unrelated objects look like one set.
- **Theme colours leak in as accents:** `#F9F0E9` (the cream panel) and `#F6D5D5` (the pink button) appear inside the icons, tying the art to the palette.
- **A few fully saturated hits** where the object demands it: `#00FFFF`, `#FFFF00`, `#00FF00` on the CD; `#000080`, `#008080` on the camera. Loud colour is rationed to one or two objects.

Cursors are the third piece of the icon language: seven custom SVGs (`pointer-1` 20x21, `pointer-3` 22x22, `click` 20x23, `grab` 20x20, `pointer-loading` 20x25, `resize` 9x9, `insert` 9x18), each built from 1px `<rect>` elements and 1px-step paths, that is, drawn on a pixel grid but shipped as vectors. Each carries a very soft drop shadow: `feOffset dy=1`, `feGaussianBlur stdDeviation=0.5`, black at 10% alpha. The cursor is user-switchable in Settings.

### 1.d Buttons and controls

There are exactly **three button anatomies** in the whole site, and no fourth.

**1. Tinted bevel button** (`.bg-button`, the main one). No border property at all; the entire frame is box-shadow.

```
rest:   inset -1px -1px 0 var(--button-shadow),
        inset  1px  1px 0 #ffffff,
        0 0 0 1px #000000
active: inset  1px  1px 0 var(--button-shadow),
        inset -1px -1px 0 #ffffff,
        0 0 0 1px #000000
```

The bevel inverts on press. The dark side of the bevel is `--button-shadow`, derived from the button's own tint, so a pink button gets a pink-brown bevel and a cyan button gets a teal bevel. Total travel: zero. Nothing moves.

**2. Media button** (`.shadow-is-media-button`, the transport row). `border: 1px solid #000`, `border-radius: 4px`, and:

```
rest:   0 1px 0 0 #000000,          (a hard 1px black ledge beneath)
        inset 0 1px 0 0 #ffffff     (a 1px white highlight along the top)
active: position: relative; top: 1px; border-bottom-width: 0
```

On press the button drops exactly 1px and gives up its bottom border, so it lands in its own ledge and the total height is unchanged. This is the nicest control on the site and it is four lines of CSS.

**3. Plain button** (`.is-basic-button`). `box-shadow: 0 0 0 1px #000`, identical on `:active`. Text only, no movement.

The transport group is drawn as one bordered strip: the four buttons share edges (`border-left-width: 0` on the inner ones) and only the outer corners are rounded (`4px 0 0 4px` on the first, `0 4px 4px 0` on the last). Sizes measured: Play 52x35, Stop 52x34, prev and next 35x35, shuffle 53x35.

**Hover: essentially none.** Ten `:hover` rules exist in a 139KB stylesheet, and eight of them belong to the scrollbar library. No button changes on hover. This is period-correct; Classic Mac OS had no hover state because it predates the idea.

**Focus** is a fill change, never a ring: `focus-visible` swaps the background to `--button-focus` or `--secondary-button-focus`, which are the same tint darkened by 10%. Text inputs use `focus-visible:bg-[#F2F2F2]`, and `border-color` goes to `#383838`.

**Disabled** is `pointer-events: none` plus `opacity: 0.5` on the icon inside. The colour is not changed.

**Window chrome.** The window is:

```
background: var(--secondary);
border: 1px solid #000000;
border-radius: 6px;
padding: 6px;
box-shadow: 0 50px 80px -50px rgba(0,0,0,0.3);
```

That padding is the whole trick. The outer 1px black rounded box holds 6px of cream, and inside that sits the content, each region with its own 1px black box. **What reads in a screenshot as a "1px black offset shadow" is this double frame, not a shadow.** The actual shadow is enormous and almost invisible: 80px of blur, pushed 50px down and pulled back 50px, at 30% black. It reads as a faint bloom under the window, not as an edge.

The title bar has **no stripes**. It is a bare strip of the panel colour carrying, left to right, a 7x7 close X, a camera button, a contract button, then the wordmark "POOLSUITE" flush right in a pixel face. The menu bar is likewise not a full-width bar: it is a cream block at top-left (`border-radius: 0 0 4px`, 185x32) and a second cream block at top-right, with the desktop showing between them.

Resize is a custom `resize.svg` cursor plus a 9x9 corner handle image. There is a "contract" widget but no Classic Mac collapse box.

**Scrollbars** are the OverlayScrollbars library restyled: `--os-size: 25px`, `--os-padding-axis: 17px`. The arrows are 5px-wide PNGs centred in 25x17 pseudo-element zones pinned to the top and bottom of the track. The handle is normally unstyled and on hover becomes `background: var(--tertiary)` with `border: 1px solid #000`, `border-radius: 2px`, `box-shadow: 0 1px 0 0 #000`.

**Where the pale yellow actually goes.** `--tertiary` (`#FCF4C5` in the default theme) is not a static accent. Its only visible job in the running interface is the scrollbar-handle hover fill. It is a transient highlight. Worth knowing before we decide what our own `#FFF1A8` is for.

There are no checkboxes and no radio buttons in the main interface. The player's volume control is not a slider: it is a strip of discrete states (the asset manifest carries `volume-20`, `volume-50`, `volume-70`, `volume-full` over a `volume-bg`), so volume is a four-position icon swap. A real slider component exists but only inside the Settings window.

### 1.e Layout, spacing, and why it feels modern

- **Type is pixel type at native size, always.** ChiKareGo2 at 16px with `letter-spacing: -1px` and `line-height: 16px` for headings and buttons. Everyday at 10px for filenames and channel labels, and at 8px for the "LIVE" badge, both at `letter-spacing: -1px`. Pixolde at 16px for the menu bar. Nothing is ever scaled off its grid, and the tight tracking is what stops the pixel faces reading as clip-art.
- **Retina handling is the 2x rule**, described in 1.c: every raster asset is authored at exactly double and displayed at half, with `image-rendering: pixelated` inherited from the app root. That plus native-size fonts is the entire sharpness story. There is no `@media (min-resolution)` anywhere.
- **The spacing rhythm is 1px, 4px, 6px.** Frames are 1px. Radii are 2px (small), 4px (buttons, menu blocks), 6px (windows). Window padding is 6px. Gaps are 6px and 10px. The whole system is built on a 2px grid with 1px lines, which is why nothing looks approximate.
- **Modernity comes from restraint and from generosity of space,** not from effects. There are no gradients (the only `linear-gradient` in the stylesheet is an unused Tailwind placeholder), no bevelled window frames, no drop shadows on text, no textures on the desktop. A big window floats in a large flat field of one pastel. That combination, a 1995 grammar laid out with 2020s whitespace, is the actual formula.

### 1.f Sound and motion

**Sound: two one-shot samples in the entire application.** `sega.mp3`, a boot chime played once at `volume = 0.3` behind an audio-permission check, and `bsod.mp3`, played when the joke crash screen mounts. There are no click sounds, no hover sounds, no window-open or window-close sounds. Everything else that comes out of the site is the radio stream itself.

**Motion is a complete, tiny vocabulary.** The whole stylesheet contains five `@keyframes`, two of which belong to libraries:

| Animation | Definition | Where |
| --- | --- | --- |
| `ping` | `75%,to { opacity:0; transform:scale(2) }`, `1s cubic-bezier(0,0,.2,1) infinite` | the "ON AIR" dot only |
| `flashing-dots` | `to { visibility:hidden }`, `1s steps(2,start) infinite`, children delayed 0.2s and 0.4s | loading ellipsis |
| `dimBackground` | five discrete stops from transparent to `#00000080`, `2s steps(1) forwards` | modal scrim |
| `os-size-observer-appear` | library plumbing | OverlayScrollbars |
| `vSelectSpinner` | library, unused | vue-select |

Transitions are `0.1s` and `0.15s` only, plus one `0.3s` opacity fade. Button presses have no transition at all; the 1px drop is instant.

Two things stand out. First, **even the fade is stepped**: `dimBackground` uses `steps(1)` across five hand-written stops instead of interpolating. Second, **the loading blink is `steps(2,start)`**, a hard on/off, never a fade. The site quantises its motion the same way it quantises its pixels. That is a rule worth stealing outright.

### 1.g The video dot-screen (David's question 4)

It is a **CSS background pattern, not a canvas and not a shader**. Exactly:

```css
.overlay {
  position: absolute; inset: 0; width: 100%; height: 100%;
  background: url(data:image/png;base64,...);   /* a 4x4 PNG */
  background-size: 2px 2px;
}
.youtube-only iframe {
  filter: brightness(130%);
  width: 135%; height: 135%;
  transform: translate(-50%,-50%);
}
```

I decoded the PNG. It is **4x4 pixels, 1-bit, 2 palette entries both `#000000`, with a `tRNS` chunk making index 0 fully transparent**. The bit pattern is:

```
1 1 0 0
1 1 0 0
0 0 0 0
0 0 0 0
```

So a 2x2 opaque black block in one quadrant: **25% coverage**. Scaled to `background-size: 2px 2px`, that becomes a 1 CSS px black dot on a 2 CSS px grid, and on a 2x display each source pixel lands on one device pixel. Underneath, the video **stays in full colour** and is brightened 130% to pay back the light the dots take away, and blown up to 135% and centred so the dot grid never shows an edge. Before playback a `static.gif` TV-static loop fills the frame.

This matters because it is not what our plan says. Poolsuite does **not** reduce the video to 1-bit. It leaves colour video alone and lays a fixed, non-adaptive 25% dot screen over it. See section 3.6.

### 1.h The radio meter and volume control (David's audio question)

**The meter is real, live, and drawn in the DOM.** Not canvas, not SVG, not a GIF.

- 60 `<i>` elements when wide, 48 when narrow (`Math.floor(0.8 * 60)`).
- Each bar: `width: 2px`, `margin-right: 1px`, so a **3px pitch**. `background: black`, `border-radius: 3px` (which on a 2px bar just rounds the caps), `transition: height 0.1s linear`.
- Container: `height: 20px`, `align-items: flex-end` (bars grow up from the baseline), `flex-direction: row-reverse`, `overflow: hidden`. Measured 144x20 for the 48-bar variant, and the static placeholder SVGs are 179x20 (60 bars) and 77x20 (26 bars).
- Audio path: `AudioContext` plus `AnalyserNode` with `fftSize = 256`, giving 128 frequency bins. Each bar samples one bin, striding `Math.floor(128 / numBars)`, with **no averaging**.
- Noise gate: `value > 10 ? value : 0`. Anything at or below 10 of 255 is floored to zero, so silence is genuinely flat.
- Height mapping: `Math.round(value / 255 * 20)` px. Linear, max 20px.
- Driven by `requestAnimationFrame` only while playing; `cancelAnimationFrame` on stop.

So it is a **spectrum analyser, not a level meter**, and it is mirrored (`row-reverse`), which is why the low frequencies, the loud ones in music, pile up on the right and produce the rising `......iiIIl` silhouette David liked. The two static SVGs `temp-waveform.svg` and `temp-waveform-thin.svg` are hand-drawn placeholders in exactly the same geometry (2px rects, 3px pitch, 20px tall, `rx="1"`, black), used where a decorative meter is wanted, including the small one on the "LIVE" tab. The decay is not modelled in JavaScript at all; the entire smoothing is the `transition: height 0.1s linear` on the CSS side.

The volume control is not a slider. It is a four-state icon swap (`volume-20`, `volume-50`, `volume-70`, `volume-full`) over a `volume-bg` strip, sitting next to a dithered grey block that is decorative fill.

---

## 2. Retro but modern and fun: exemplars and principles

The useful question is not "which of these looks good" but "what separates the ones that read as *made* from the ones that read as *dressed up*". Verification level is marked per row.

| Exemplar | What it is | The specific move | Why it reads modern |
| --- | --- | --- | --- |
| **Playdate** (Panic, 2022) | Handheld console, 2.7in **400x240 1-bit** Sharp Memory LCD at 173ppi, no backlight, plus a crank | The 1-bit is the *hardware*, not a filter. Exactly one saturated colour exists, **`#ffc833`**, and Panic's own CSS sets `--accent` and `--link` to it, so the same yellow is the plastic, the accent and every link ([play.date colors.css](https://play.date/static/assets/colors/colors.45e2a71d042c.css)) | The constraint is real, so nothing on screen has to pretend. One colour does every job, everywhere, which is why the brand survives a screen that cannot show it. |
| **Teenage Engineering** (OP-1 2011, site ongoing) | Instruments and a product site; co-designed the Playdate | Four saturated encoders (blue, green, white, orange) on an otherwise white and grey object, and the colour is **positional, not fixed**: "A green graphical element or text hints that the green encoder will change its value or position" ([TE, OP-1 layout](https://teenage.engineering/guides/op-1/original/layout)) | Colour is an **index**, not decoration. Each hue does one job, which is to bind a physical control to a thing on the screen. Nothing is coloured for mood. |
| **Nothing** (2021 to now) | Phones and Nothing OS; the **Ndot-55 / Ndot-57** dot-matrix typeface (Colophon Foundry) and the Glyph LED interface | Ndot is used **only** for the logo, the category label and the product name; body text is a normal grotesque (NType82). One accent red `#C8102E`, and in their live CSS **11 rules reference it against 218 referencing greyscale** | The retro element is scoped to three uses and everything around it is current. The dot face reads as a signature, not a skin. |
| **Return of the Obra Dinn** (Lucas Pope, 2018) | 1-bit dithered 3D game | A modern 3D renderer output through a 1-bit dither, with the temporal stability problem *solved* rather than tolerated (section 3.6) | The retro layer sits on top of contemporary technique, and the hard problem was engineered rather than hand-waved. |
| **macintosh.js** (Felix Rieseberg, 2020) | Mac OS 8 running in Electron | It is not a recreation; it is the original system emulated | Authenticity by construction. Nothing is approximated, so nothing is slightly wrong. |
| **Are.na** (2011) | A research and collecting tool | Body `#000` on `#FFF`, links `#333` with no underline, one 3px radius doing almost all the work, and **every hue reserved for state**: green `#238020` public, red `#B93D3D` private, grey `#333` closed. In 2025 they commissioned a variable typeface whose brief was to be indistinguishable from Arial ([Are.na, Introducing Areal](https://www.are.na/editorial/introducing-areal-are-nas-new-typeface)) | Restraint that is **engineered rather than subtracted**. Commissioning a face to look like the plainest default is a harder, more deliberate act than picking a fashionable one. |
| **98.css** (2020) vs **system.css** (2022) | CSS libraries recreating Windows 98 and System 6 | 98.css uses integer inset shadows for bevels and sets `font-smoothing: none` at 11px. system.css draws its title-bar stripes with a gradient at `background-size: 6.667%`, which lands on **fractional ~2.03px stripes**, and sets no `image-rendering` or smoothing hints, so antialiasing stays on | **The costume line, and it is measurable: 98.css honours the pixel grid, system.css only depicts it.** Dropped in unmodified either one also reads as "I installed a joke", because the system is someone else's. |
| **Susan Kare's original Mac icons** (1984) | The 1-bit icon language everything here descends from | **32x32, 1-bit, 1024 dots** (Hertzfeld, [folklore.org](https://www.folklore.org/Steve,_Icon.html)); 16x16 did not exist until 1987. She drew on graph paper first and compares bitmaps to "mosaics and needlepoint" ([Stanford oral history, 2000](https://web.stanford.edu/dept/SUL/sites/mac/primary/interviews/kare/trans.html)) | The constraint produced clarity, not charm. Kare, on her own site: "good icons are more akin to **road signs** rather than illustrations, and ideally should present an idea in a clear, concise, and memorable way." |

*(Verification: every row above is checked against a primary source, either the company's own live CSS and guides, the author's own devlog, or the designer's own words. Two warnings on values that circulate wrongly. Playdate's yellow is **`#ffc833`** from Panic's stylesheet, not the `#FFD100` or the Pantone 1235C conversion that gets quoted second-hand. Nothing's red is **`#C8102E`** from their live CSS; the `#D71921` that circulates comes from a third-party file, not from Nothing. And for the record, Chicago was a single-size **12pt** face with **9px cap height**, and the widely repeated "9pt Chicago" is a conflation of the two; Kare limited its letterforms "to vertical, horizontal or 45-degree lines".)*

**The pattern across all of them.** Every one that reads as made rather than dressed up does the same four things. It takes **one** retro element and surrounds it with contemporary craft, rather than assembling a whole retro world. It treats the old constraint as a real constraint and obeys it completely, rather than applying it as an effect and then cheating around the edges. It rations colour hard, usually to one saturated note. And it puts the humour in a single detail, never spread across the interface.

### Six principles for our window

1. **The constraint is the style. Obey it everywhere or drop it.**
   Do: keep every icon, meter and control strictly 1-bit, including the video.
   Don't: allow one anti-aliased icon, one soft shadow or one gradient in "because it looked better there".

2. **One retro element, scoped, with contemporary everything else.** Nothing uses its dot-matrix face for the logo, the category label and the product name, and nothing else; the body copy is an ordinary grotesque.
   Do: let the Classic Mac chrome be the single period reference, and let the layout, spacing and colour handling be 2026.
   Don't: add a CRT scanline overlay, a fake boot sequence, a Comic Sans joke or a second era's chrome.

3. **Colour is an index, not decoration.** Teenage Engineering binds each hue to one control, and Are.na reserves every hue for one channel state. Neither uses colour for mood.
   Do: black, white, cream, one desktop tint, two pastel button fills, one red dot that means "live", one yellow band that means "this line, now".
   Don't: colour-code the two speakers, tint the video, or give the countdown its own colour.

4. **Honour the pixel grid, do not merely depict it.** This is the whole difference between 98.css and system.css: one uses integer shadows and kills font smoothing, the other draws 2.03px stripes and leaves antialiasing on.
   Do: draw on 11x11, export 22x22, display at 11px with `image-rendering: pixelated`, and keep every rule and stripe on an integer.
   Don't: scale a pixel icon to 13px, use a percentage that lands on a fraction, or put an SVG icon set next to pixel type.

5. **Quantise the motion the way you quantise the pixels.**
   Do: `steps()` on blinks and on the window shade, instant press states, 0.1s to 0.15s elsewhere.
   Don't: ease anything over 300ms, or add a spring, a bounce or a fade-in on open.

6. **Put the wit in one detail and in the copy, and make it a metaphor rather than a pun.** Kare's own rule: "I tried not to use words, and not to use puns, because they don't translate."
   Do: the door as the close icon and the watch as the waiting icon, both of which are metaphors for the actual action, plus system lines that are dry rather than cute.
   Don't: distribute jokes across the interface, or pick an icon that only works if you already know the wordplay. Poolsuite has a martini close button and a 1997 clock, and it stops there.

---

## 3. Recommendations for waiting-room

Minimal on purpose. Everything below is either a value change or a small addition; nothing here restructures the window.

### 3.1 A pastel palette system

Keep the structure exactly as it is. **Black `#000000` at 1px is the only structural colour, white `#FFFFFF` is paper, cream `#F5EEDF` is the panel.** Colour never carries meaning and never carries structure. It carries mood, and it lives in one place: the desktop field around the window, plus two button fills.

The tints below were generated in OKLCH at one lightness (L 0.81) and one chroma (C 0.062), with only the hue rotated. That is why they look like one family rather than four separate swatches, and it is what keeps them ours rather than a re-mix of Poolsuite's.

**Desktop tints, pick one. Default is Pool.**

| Name | Hex | OKLCH | vs black 1px lines | vs cream panel |
| --- | --- | --- | --- | --- |
| **Pool** (default) | `#91CECF` | 0.81 / 0.062 / 197 | 11.93:1 | 15.8 dE, 1.52:1 |
| Shell | `#E6B1B2` | 0.81 / 0.062 / 18 | 11.30:1 | 15.3 dE, 1.61:1 |
| Mint | `#A7CDAB` | 0.81 / 0.062 / 148 | 11.96:1 | 15.0 dE, 1.57:1 |
| Dusk | `#BBBCE9` | 0.81 / 0.062 / 283 | 11.48:1 | 16.4 dE, 1.58:1 |

I drew all four behind a mock of the window to check them rather than trusting the numbers. A warm tan at hue 88 (`#D2BF93`) was in the set first and is out: it clears contrast fine but it sits too close to the cream in warmth, so the window stops looking like a window on a desk and starts looking like a panel on a panel. Mint replaces it. Cool tints frame a warm cream panel better than warm ones do, which is also why Pool is the default.

**Panel and paper (unchanged):** cream `#F5EEDF`, 18.18:1 against black; white `#FFFFFF`, 21.00:1.

**Two pastel button fills**, a lightness step above the desktop tints so a button on a cream panel reads as a raised thing, not as a hole:

| Name | Hex | Use | vs black |
| --- | --- | --- | --- |
| **Cyan** | `#B7E7E8` | the one default action (Answer, Join) | 15.61:1 |
| **Blush** | `#FBD0D0` | the one destructive-ish action (Hang up, Leave) | 15.04:1 |

Contrast, checked: **12px black Geneva is 18.18:1 on cream, 21.00:1 on white, 18.40:1 on the yellow highlight, and 11.30:1 to 11.96:1 on any of the four desktop tints.** WCAG AA for body text is 4.5:1, so every surface clears it by more than double. The black 1px lines clear 11:1 against everything. There is no contrast risk anywhere in this palette; the only real question was whether the desktop separates from the panel, and at 15.0 to 16.4 OKLab units it clearly does. For comparison, Poolsuite's own default theme separates by only 6.6, which is why its window relies on the frame.

Why Pool as the default: the window is 380px wide inside a popup, so the desktop is a **thin band framing the window** rather than a field. That is exactly the "outer frame in pastel teal" reading David had of the Poolsuite screenshot, and a cool tint frames a warm cream panel better than a warm one does. Shell is the friendlier alternative if the room ever needs to feel softer.

**Should there be a dark theme in a 1-bit language?** Yes, one, because this window opens by itself while someone is working, often at night, and a cream rectangle appearing unbidden in a dark room is hostile. But do it as a **token swap, not as a filter.**

I tested Poolsuite's approach. `filter: invert(1)` on our palette turns Pool `#91CECF` into `#703532`, a muddy brown, and the cream panel into `#0A1120`, a cold blue-black. Inversion destroys hue. Poolsuite gets away with it because it is offered as a novelty in Settings, not as a night mode.

Ours, four values:

| Token | Light | Dark |
| --- | --- | --- |
| paper | `#FFFFFF` | `#000000` |
| ink | `#000000` | `#FFFFFF` |
| panel | `#F5EEDF` | `#1E1A14` (17.31:1 with white text) |
| desktop | `#91CECF` | `#225657` (8.28:1 with white text) |
| highlight | `#FFF1A8` | `#524100` (9.93:1 with white text) |

The dark tint is the same hue at OKLCH L 0.42, so Pool stays Pool (Shell becomes `#684142`, Mint `#38553C`, Dusk `#49496A`). Two extra rules and one media query. That is the whole dark mode.

One decision it forces: the video feed. In dark mode the dither's two levels swap with everything else, so a face comes out as a negative. That is legitimate in a 1-bit language and it looks striking, but it is also the one place a viewer might read it as a fault. Recommendation: **keep the video positive in both modes**, that is, dither to ink-on-panel in light and to panel-on-ink in dark, which is the same image with the levels reassigned rather than inverted. One conditional in the dither's output mapping.

### 3.2 The accent rule

**One highlight, one signal, and nothing else has colour.**

1. **Highlight: pale yellow `#FFF1A8`, unchanged.** Its job is to mark *the one line that matters right now*, and only ever one line at a time: the pause line today, the connect line, the goodbye. Black text on it is 18.40:1. Poolsuite's `--tertiary` does the same job as a hover fill, which is a useful confirmation that a pale yellow band is the right instrument for "this, now".

2. **Signal: a single 4px red dot, `#D01D21`.** One element, never more. Its only job is "the mic is live". 4.69:1 against cream, 5.41:1 against white. Give it Poolsuite's `ping`: a 6px halo of the same hue at 40% opacity scaling to 2x and fading out over 1s, infinite. This is the one place a continuous animation earns its keep, because it is reporting a genuine continuous fact.

3. **The countdown digit gets no colour.** It is already 64px ChiKareGo2 against 12px Geneva; it is the largest thing in the window by a factor of five. Adding red would be emphasis on emphasis, and it would compete with the live dot for the one saturated slot. Keep it black. If it needs more weight at the end, invert it: black block, white digits, for the last three seconds. That is 1-bit-honest and it is louder than red without adding a colour.

So: two colours carry meaning in the entire interface, and one of them is a dot.

### 3.3 Icon set: 8 icons on an 11x11 grid

**Grid: 11x11, 1-bit, exported at 22x22, displayed at 11px with `image-rendering: pixelated`.** Reasons: 11 is odd, so every icon has a true centre pixel, which matters for a triangle, a cross, a dot and an arrow; 11px sits correctly inside the existing 22px `.btn` height with 5 to 6px of padding; 11px reads next to 12px Geneva without either one dominating; and Poolsuite's own chrome icons cluster from 5 to 16px logical, so 11 is mid-range and safe. The 2x export rule is copied directly from their practice and is the single highest-value technical detail in this memo.

**Use 1-bit, not multi-colour pixel icons.** This is Poolsuite's own rule, not a preference: every icon *inside* a window on their site is strictly 1-bit black; the multi-colour 32px art appears only in the dock, where it is doing app-identity work. We have no dock and no app identities. A multi-colour 32px icon inside a 380px window would be the only richly coloured object in the interface, and it would immediately become the thing the eye goes to, which is wrong when the content is a person's voice.

Below, `#` is a black pixel and `.` is transparent. These are ours, drawn for this memo.

**1. Door (close / leave the room).** A door, not an X. The joke costs nothing and it is the right metaphor for a room.

```
.#########.
.#.......#.
.#.......#.
.#.......#.
.#.......#.
.#.....#.#.
.#.......#.
.#.......#.
.#.......#.
.#.......#.
.#########.
```

**2. Hang up.** A handset resting on its base line.

```
...........
...........
###.....###
###.....###
###.....###
.#########.
..#######..
...........
.#########.
...........
...........
```

**3. Camera (show my video).** Body plus lens barrel.

```
...........
...........
.#######...
.#.....#...
.#.....####
.#.....#..#
.#.....#..#
.#.....####
.#######...
...........
...........
```

**4. Flag (report).** Rectangular flag on a full-height pole.

```
.#.........
.########..
.#......#..
.#......#..
.#......#..
.########..
.#.........
.#.........
.#.........
.#.........
.#.........
```

**5. Speaker on.** Cone plus two waves.

```
...........
....#......
...##..#...
..###.#..#.
#####.#..#.
#####.#..#.
#####.#..#.
..###.#..#.
...##..#...
....#......
...........
```

**6. Speaker muted.** Same cone, waves replaced by a cross. Never use a diagonal slash across the whole icon; at 11px it destroys the cone.

```
...........
....#......
...##......
..###.#...#
#####..#.#.
#####...#..
#####..#.#.
..###.#...#
...##......
....#......
...........
```

**7. Person (count).** Head and shoulders.

```
...###.....
..#...#....
..#...#....
...###.....
...........
..#####....
.#.....#...
.#.....#...
.#.....#...
.#.....#...
.#.....#...
```

**8. Watch (waiting).** A wristwatch with a hand at ten past two. Use this rather than an hourglass; the watch is the Classic Mac wait signal and it is the wittier reference.

```
...#####...
...#...#...
..#######..
.##.....##.
.#...#...#.
.#...###.#.
.#.......#.
.##.....##.
..#######..
...#...#...
...#####...
```

**Plus one title-bar widget, the shade bar,** an 11x11 box containing a single 9px horizontal rule on row 5. It collapses the window (section 3.5) and it goes at the **far right of the title bar, outboard of the zoom box**, which is where Apple put the collapse box. That means the zoom box shifts left in `build.py`, from `right: 8px` to roughly `right: 25px`, to make room.

```
...........
...........
...........
...........
...........
.#########.
...........
...........
...........
...........
...........
```

### 3.4 Buttons

**Keep them text-only.** Do not put icons inside the buttons. There are only three actions in the window, their labels are one or two words, and at 16px ChiKareGo2 a label is faster to read than a glyph. Icons go where there is no room for a word: the title bar (close, shade, zoom), the status strip (person count, mute toggle), and the video panes (camera). That split is also Poolsuite's: their transport buttons are icon-only because "play" has no good short word, and their text buttons carry no icons.

Adopt **one** button anatomy, Poolsuite's media button, because it is the one that feels good and it is four lines:

```css
.btn {
  height: 22px; padding: 0 10px; min-width: 64px;
  border: 1px solid #000; border-radius: 4px;
  background: #FFFFFF;
  box-shadow: 0 1px 0 0 #000, inset 0 1px 0 0 #FFF;
  font: 16px/20px ChiKareGo2;
}
.btn:active { position: relative; top: 1px; border-bottom-width: 0; box-shadow: inset 0 1px 0 0 #FFF; }
```

The 1px ledge under the button and the 1px white line inside its top edge are the entire effect. On press it drops into the ledge, total height unchanged, no transition.

States, in a 1-bit language:

- **Hover: nothing.** No colour change, no shadow change. This is period-correct, it is what Poolsuite does, and it removes a whole class of fiddly decisions. Change the cursor and that is enough.
- **Press: the 1px drop above.** Do not also invert the fill; pick one press signal. If David prefers inversion, use inverted fill (black background, white text) and drop the ledge instead, but not both.
- **Disabled: 1px dotted black border, black text at 40% (`#999999`), no ledge, no fill.** Dotted is the 1-bit way to say "outline, but not really", it survives at 1px, and it does not require a grey ramp. The current `build.py` already does this and it is right.
- **Default (the one action Return triggers): the thick ring.** `box-shadow: 0 0 0 2px #FFF, 0 0 0 5px #000` around the button, that is a 2px gap then a 3px black ring, the System 7 default-button treatment. `build.py` already has it. Poolsuite has no equivalent, which is fine; it is a keyboard affordance and it is one of the few places we should be more Mac than they are.
- **Focus (keyboard, not the default button): fill with the tint.** Cyan `#B7E7E8` for the affirmative action, Blush `#FBD0D0` for the negative one. This is Poolsuite's focus model, a fill change rather than a ring, and it gives the two pastel button fills a job.

That is one filled Cyan button (the default action), one filled Blush button (hang up), and everything else white. Two coloured buttons in the whole window.

### 3.5 The shaded window

**History, verified.** WindowShade began as a third-party control panel by **Rob Johnston** at Interactive Technologies, shipping as shareware somewhere between 1989 and 1992 (sources disagree; v1.2 is dated March 1992). **Apple absorbed it into System 7.5**, released 12 September 1994, where it was its own WindowShade control panel and the trigger was a double-click on the title bar. **The collapse box widget itself arrived with Mac OS 8.0** (26 July 1997) and the Platinum appearance, and the control moved into the Appearance control panel.

Three details that change my recommendation:

- **The collapse box sits at the far right of the title bar, outboard of the zoom box.** Apple's *Mac OS 8 Human Interface Guidelines* is explicit: "the zoom box appears on the right side of the title bar, just to the left of the collapse box" ([thig-62](https://dev.os9.ca/techpubs/mac/HIGOS8Guide/thig-62.html)). The common assumption that collapse sits inboard of zoom is backwards.
- **When collapsed, the entire title bar remained and stayed live.** Apple: "the content region of the window disappears, but the title bar remains visible and active... A collapsed window follows standard window conventions; it may be moved, closed, activated, or made inactive" ([thig-61](https://dev.os9.ca/techpubs/mac/HIGOS8Guide/thig-61.html)). No scroll bars, no size box, no drop shadow (Classic windows had none).
- **There was a sound, and in Mac OS 8 it was on by default.** Apple: "Opening and collapsing actions are normally accompanied by a sound, but this can be disabled by the user through the Appearance control panel." Collapse and expand were two separate sounds (`kThemeSoundWindowCollapseUp` and `...CollapseDown`, shipped as `wcol` and `wexp` in the Platinum Sounds set). There is **no period source for a configurable number of animation lines**; that detail appears to be misremembered, and no period source gives an official adjective for the sound either.

Title bar height, from Apple's own HIG: "at least **19 pixels** high, the height of a document window title bar" ([thig-60](https://dev.os9.ca/techpubs/mac/HIGOS8Guide/thig-60.html)). Our 20px is one pixel over and is fine. For the record, the active System 7 title bar carried **6 stripes, 1px on and 1px off**, knocked out behind the centred title and behind both widgets; an **inactive** title bar went entirely blank, losing the stripes and every widget. Our `build.py` already draws this correctly.

**Recommended geometry.** Current heights in `build.py` are title bar 20, topic 22, log 104, status 24, controls 44, video stage 116. So:

| State | Content height | Share of full |
| --- | --- | --- |
| Shaded (queued, nobody here yet) | **44px** (1 + 20 + 22 + 1) | 20% of audio, 13% of video |
| Open, audio only | 216px | |
| Open, with video | 332px | |

**44px is the number.** That is the 1px top border, the full 20px title bar unchanged, the 22px topic line carrying the count, and the 1px bottom border. Width stays 380.

Rules for the shaded state:

- **The title bar does not change.** Same stripes, same close box, same title, same zoom box, plus the new shade widget. A collapsed window that redraws its own title bar is a different window; a collapsed window that keeps it is the same window, smaller. That distinction is the entire reason WindowShade felt good.
- **Exactly one line of content**, the topic line, and it says only the count: "3 people are waiting for their Claude right now." No log, no controls, no meters, no buttons. If there is nothing to act on, showing a disabled button is worse than showing nothing.
- **The shade widget goes at the far right of the title bar, outboard of the zoom box**, per the HIG above. Double-clicking the title bar does the same thing. Support both, because both were true on the Mac and because the double-click is the one people find by accident.
- **The transition is the shade, not a fade.** Animate `height` from 216 to 44 over about 150ms with `steps(6)`, so the window collapses in six visible jumps rather than gliding. Poolsuite quantises its motion the same way (section 1.f) and it is the difference between "a window rolling up" and "a div animating".
- **On match, unshade rather than open.** The window is already there and already shaded; the match event grows it. That is a smaller, calmer event than a window appearing, and it is also the honest description of what is happening.
- **No sound on shade or unshade**, despite Apple shipping one on by default. Their window could be collapsed by hand a hundred times a session and the sound was feedback for a deliberate act. Ours unshades once, on match, when the match cue is already firing, and two sounds on one event is one too many.

### 3.6 The video dither

There is a real fork here and it should be decided deliberately, because what David screenshotted and what the plan says are not the same thing.

**What Poolsuite does:** colour video, untouched, with a fixed 25% black dot screen over it and a 130% brightness lift underneath (section 1.g). The video reads as a colour memory seen through a screen door. It is cheap, it is temporally perfect because the pattern never changes, and it is unmistakably the thing David responded to.

**What our plan says:** reduce the live feed to 1-bit with an ordered Bayer dither.

**Recommendation: 1-bit Bayer, but borrow two things from Poolsuite.** Reasons to stay 1-bit: the whole window is 1-bit, and a colour video pane inside it would be the only colour object in the interface, which breaks memo 07's rule 3 (one era, one machine) far more badly than a dot screen would; 1-bit also does real privacy work, because a dithered face is recognisable as a person and as a mood but is a poor photograph, which is the right posture for a stranger call; and it renders identically on any camera in any lighting once the pre-processing is right, whereas a dot screen over raw webcam colour will look muddy on bad webcams.

Aesthetic specification:

- **Bayer 4x4, not 8x8.** 8x8 gives 65 tonal levels and a finer, more photographic result, which is exactly wrong here: it reads as a printing process. 4x4 gives 17 levels and a visible, chunky, legible pattern at 176x99 pane size, and its cell matches both the 2px grid the rest of the window is built on and Poolsuite's own 4x4 tile. The pattern should be a thing you can see, not a texture you infer.
- **Threshold at the device pixel, not the CSS pixel.** Render the pane at `devicePixelRatio` and dither there. Dithering in CSS pixels and letting the browser scale up produces grey fringes and undoes the entire point.
- **Pre-process before thresholding, or it will look like mud.** Webcam output is low-contrast and centred around mid-grey, and mid-grey is precisely the value a Bayer matrix turns into a flat checkerboard. Apply a contrast stretch (map roughly the 10th and 90th luminance percentiles to 0 and 1, updated slowly, maybe once a second) and a small brightness lift before the threshold. This is the same correction Poolsuite makes with `brightness(130%)`, done properly.
- **Tint the two levels.** Do not use pure black and pure white. Use ink `#000000` and the panel cream `#F5EEDF` as the two levels, so the video pane sits in the window instead of glaring out of it. That is one line and it is the difference between "a photo" and "part of the interface".
- **Do not animate the matrix and do not add noise.** A blue-noise or error-diffusion dither looks better in a single frame and boils horribly in motion, because one changed pixel rewrites the pattern downstream of it. A fixed ordered matrix pinned to the screen is stable: a still subject produces a still image. Stability is worth more than per-frame quality here.

  Worth knowing that Lucas Pope hit the limit of this on *Return of the Obra Dinn* and had to work around it: with a screen-fixed dither, a **moving camera** drags the scene through a stationary pattern, which he describes as erratic and bad for both playability and video compression, so he shifted the screen-mapped dither to follow camera rotation ([dukope.com devlog, 2017](https://dukope.com/devlogs/obra-dinn/tig-32/)). **That problem does not apply to us.** Our camera is a fixed webcam; the frame does not translate or rotate, a person moves inside it. A plain screen-fixed Bayer matrix is therefore exactly right here, and it is right for the same reason it was wrong for him.

### 3.7 The audio meter

**Two meters, not one shared room meter.** The entire point of this window is that there is another person in it. Two labelled meters, YOU and STRANGER, answer "is anyone there" and "who is talking" at a glance, and they make the silence legible when nobody is speaking, which is a real and frequent state. A single combined meter would answer neither question.

**Use RMS level, not a spectrum.** Poolsuite's meter is a spectrum analyser, which is right for music and produces that lovely rising silhouette because bass is loud and it renders right-to-left. Speech through a 380px window does not produce that shape, and a spectrum of a voice is noise. What we need to show is "how loud is this person right now", which is one number.

Specification, at 84x10:

- **28 bars**, 2px wide, 1px gap, 3px pitch. Poolsuite's exact geometry, at our scale. 84px fits comfortably beside a label in the status strip.
- **10px tall**, bars grow up from a shared baseline, left to right.
- Take `AnalyserNode.getByteTimeDomainData`, compute RMS over the frame, map to 0 to 1 with a roughly logarithmic curve so normal speech uses the middle of the range rather than pinning.
- **Light the first N bars**, where N is `round(level * 28)`. This is a bar-graph level meter, not 28 independent values, so it reads instantly.
- **Noise gate at about 4% of full scale**, so a quiet room shows zero lit bars and not a shimmer. Poolsuite gates at 10/255, which is 3.9%; that number is well chosen and worth copying.
- **Decay: attack instant, release about 300ms.** Rising is immediate so a syllable registers; falling is slow so the meter reads as speech rather than as strobing. Add a **peak-hold dot**: one lit bar at the highest level of the last 800ms, decaying one bar per 100ms after that. The peak dot is what makes a meter feel like an instrument.
- **Unlit bars: absent, not dotted and not grey.** In a 1-bit language a grey bar is a lie and a dotted bar at 2px wide is unreadable. Draw only the lit ones. The meter's total width is fixed by its container, so the empty space still reads as headroom. Keep a 1px black baseline rule under the full 84px so the meter has an extent even at silence.
- Smooth it in CSS the way Poolsuite does: `transition: height 0.1s linear` on each bar, and let `requestAnimationFrame` do the rest. No JavaScript smoothing filter needed.

**They fit side by side on one row**, so the status strip does not need to grow. The arithmetic at 380px wide with 10px padding: 10 + 22 ("YOU" at 10px Geneva) + 6 + 84 + 16 + 52 ("STRANGER") + 6 + 84 + 10 = 290px, leaving 90px of air. A 10px meter in the existing 24px strip leaves 7px above and below.

```
  YOU ███████████████████·          STRANGER █████·
      ────────────────────────               ────────────────────────
      |<------- 84px, 28 bars ------>|       lit run + held peak dot
```

A lit run of 19 with a peak dot held at 21 is what a normal speaking voice looks like. Silence is a bare 1px baseline, which is the whole reason to draw the baseline at all.

### 3.8 Sound

Poolsuite has exactly two sounds, one of which is a joke, and both are one-shots. It has no click sounds and no hover sounds. That is the strongest possible endorsement of memo 07 rule 7.

For our three cues:

- **Match**, when the window opens by itself. This is the only cue that must cut through, because it is competing with a terminal the person is already looking at. One short rising two-tone figure, under 400ms. Play it at about 30% volume, which is where Poolsuite sets its boot chime, and which is quiet enough not to startle.
- **Stranger left.** One short falling tone, the same voice as the match cue, an octave down. Under 250ms.
- **Room closing / goodbye.** Nothing, or the softest of the three. The 5-second goodbye already has the countdown carrying it visually.

Rules: no sound on button presses, no sound on mute, no sound on the meter, nothing repeating, nothing on continuous data. Three cues total, and one of them may end up being silence. Gate all of them behind the same kind of permission check Poolsuite uses, and behind a preference that defaults to on but is one click to kill.

---

## 4. What to change in the current mockup, by impact

1. **Replace the 2px blue-grey desktop dither with a flat pastel tint, Pool `#91CECF`.** A 50% checker of any pastel over white perceives as its own 50% mix, which for Pool is `#C8E6E7`, only 6.5 OKLab units from the cream panel, so the window stops separating. Poolsuite's desktops are flat and this is the single biggest step toward "pastel".
2. **Fill exactly two buttons and leave the rest white:** the default action Cyan `#B7E7E8`, hang up Blush `#FBD0D0`.
3. **Swap the button press treatment to the 1px ledge**, `box-shadow: 0 1px 0 #000` with `inset 0 1px 0 #FFF`, dropping 1px on `:active`. It is the best-feeling control on Poolsuite and it costs two declarations.
4. **Add the two RMS meters** (section 3.7) to the status strip, 84x10, 28 bars, replacing the current six-square `.lvl` indicators.
5. **Add the 11x11 icon set** to the title bar and status strip, exported at 22x22 with `image-rendering: pixelated`, and keep the buttons text-only.
6. Add the shade widget to the title bar and build the queued state as a shaded window (section 3.5).
7. Tighten ChiKareGo2 with `letter-spacing: -1px` and set `line-height` equal to `font-size`; Poolsuite does this everywhere and it is why their pixel type looks set rather than typed.
8. Add the live red dot `#D01D21` at 4px with a 1s `ping` halo, and remove colour from anything else.
9. Give the window 6px of cream padding inside its 1px black frame so the inner regions read as a double frame, which is what makes Poolsuite's windows look built. Keep our existing hard `1px 1px 0 #000` window shadow; that is the correct Classic Mac idiom and Poolsuite reaches the same read by other means.
10. Quantise the remaining motion: `steps()` on any blink, no transition on presses, 0.1s to 0.15s everywhere else, and nothing over 0.3s.
11. Consider replacing 12px Geneva with a pixel face at native size. Geneva is anti-aliased and every label on Poolsuite is a pixel font at 8px or 10px, so we are currently mixing registers against our own rule 2. Memo 07 chose Geneva deliberately, so this is a question for David, not a change to make.

---

## 5. Sources

Poolsuite, all fetched or measured 2026-09-06:

- `https://poolsuite.net` (HTML)
- `https://poolsuite.net/css/index.5278903b.css` (stylesheet)
- `https://poolsuite.net/js/index.4e1f2c57.js` (store, theme application, mount)
- `https://poolsuite.net/js/view-DefaultPage-vue.809c33fa.js` (desktop application, visualizer, icons)
- `https://poolsuite.net/css/view-DefaultPage-vue.69037d60.css` (the video overlay rule)
- `https://poolsuite.net/lib/psapi.min.js`
- `https://poolsuite.net/dock/{fm,newsroom,mixtapes,members,eventCalendar,instagram,vacation,guestbook,settings}.png`
- `https://poolsuite.net/img/{pointer-1,pointer-3,click,grab,resize,insert,pointer-loading}.svg`
- `https://poolsuite.net/img/temp-waveform.2ecd762f.svg`, `temp-waveform-thin.4cf9511b.svg`
- Theme list read from the running application's state in headless Chrome at devicePixelRatio 2
- [Wikipedia, Poolsuite](https://en.wikipedia.org/wiki/Poolsuite) for background (via memo 07)

WindowShade and Classic Mac window chrome:

- Apple, *Mac OS 8 Human Interface Guidelines*, ch. 5: [Collapsing a Window](https://dev.os9.ca/techpubs/mac/HIGOS8Guide/thig-61.html), [Zoom Boxes](https://dev.os9.ca/techpubs/mac/HIGOS8Guide/thig-62.html), [title bar height](https://dev.os9.ca/techpubs/mac/HIGOS8Guide/thig-60.html)
- Apple, *Macintosh Human Interface Guidelines* (1992), [The Active Window](https://dev.os9.ca/techpubs/mac/HIGuidelines/HIGuidelines-114.html) for the "racing stripes" and the inactive state
- [Wikipedia, System 7](https://en.wikipedia.org/wiki/System_7) for the 7.5 absorption; [Macintosh Garden](https://macintoshgarden.org/apps/windowshade) and [WindowMizer history](https://www.windowmizer.com/windowshade-history) for Rob Johnston and the dates
- Stripe counts and title bar heights measured from native 1:1 screenshots at [GUIdebook](https://guidebookgallery.org/screenshots/macos753)

Retro-modern exemplars, all read from primary sources: [Panic, play.date colors.css](https://play.date/static/assets/colors/colors.45e2a71d042c.css) and [The story of Playdate](https://panic.com/blog/the-story-of-playdate/) for `#ffc833`; Nothing's live `tailwind` bundle on nothing.tech for `--accent-red: 200 16 46`, plus [Nothing community, ndot57](https://nothing.community/d/104-ndot57-the-nothing-typeface); [Lucas Pope, Obra Dinn devlog](https://dukope.com/devlogs/obra-dinn/tig-32/); [Teenage Engineering, OP-1 layout](https://teenage.engineering/guides/op-1/original/layout) and [OP-1 LFO](https://teenage.engineering/guides/op-1/original/lfo); [Are.na, Introducing Areal](https://www.are.na/editorial/introducing-areal-are-nas-new-typeface) plus live are.na CSS; [Kare oral history, Stanford Making the Macintosh](https://web.stanford.edu/dept/SUL/sites/mac/primary/interviews/kare/trans.html), [her own design statement](https://web.archive.org/web/20110216021154id_/http://www.kare.com/design_bio.html), [Hertzfeld on folklore.org](https://www.folklore.org/Steve,_Icon.html) and [Smithsonian, 2019](https://www.smithsonianmag.com/innovation/how-susan-kare-designed-user-friendly-icons-for-first-macintosh-180973286/); [system.css](https://github.com/sakofchit/system.css); [98.css](https://jdan.github.io/98.css/).

Prior memos: `07-retro-chat-window-design.md` sections 4.2 and 4.3; `design/build.py`.
