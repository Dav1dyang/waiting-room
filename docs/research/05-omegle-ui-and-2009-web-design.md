# Omegle UI and 2009 web design: a visual reference for "wait-together"

Research date 2026-09-06. Primary sources are Internet Archive Wayback captures of `omegle.com`, `chatroulette.com` and five mainstream 2009 sites, fetched raw with the `id_` modifier so the archive's own toolbar and URL rewriting are excluded. Every hex value, font stack and copy string below was read out of an archived file unless it carries **(unverified)**.

Two sourcing notes up front.

**Omegle's `?N` query strings are not reliable content identifiers in the archive.** Omegle busted its cache by bumping `/static/style.css?N` and `/static/omegle.js?N`, but the server ignored the query string, so Wayback indexes all versions of a file under one URL and a request for `omegle.js?39` dated 2010 can silently 302 to a 2013 capture of the same path. Every asset used below had its real capture date confirmed with the response's `memento-datetime` header, and where a stated date and a version number disagree the `memento-datetime` wins. Three files I initially trusted turned out to be 2013 captures and were discarded.

**`style.css?14` genuinely is the 2009 stylesheet.** Its earliest capture is 2010-01-13, but the homepage captures of 2009-06-27, 2009-12-02 and 2010-02-01 all link `?14` with no bump in between, so nothing changed across that window. `omegle.js?29` is one bump later than the `?28` linked on 2009-12-02, and is the earliest archived Omegle script; `?5`, `?25` and `?28` were never captured. Read it as the January 2010 file, which is the closest thing to 2009 that exists.

Three premises in the brief turned out to be wrong against the archive. They are corrected in place rather than worked around:

1. The three-state button did **not** exist in 2009. Through the 2010-02-01 homepage there is one `Disconnect` button plus a JavaScript `confirm()`. The three states are `Disconnect → Really? → New` (never "Stop"), and they arrive with or shortly after the March 2010 video launch: absent from `omegle.js?29` (captured 2010-01-13), present in `omegle.js?44` (captured 2010-06-20).
2. The 2009 disconnect line is **"Your conversational partner has disconnected."**, not "Stranger has disconnected." The shorter wording arrives around 2012 and only becomes the primary wording by 2015.
3. Chatroulette in 2010 was **not** a black page. In the June 2010 stylesheet `body` is white at `font: 14px Arial`; the March 2010 page set no font at all and ran on browser defaults. Only the 352x572 webcam block was `background: #000`.

---

## 1. Omegle UI anatomy, 2009 text mode

### 1.1 Document shell

`<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN">` strict in March 2009, switched to Transitional by June 2009. `<title>Omegle</title>`. Two scripts: MooTools 1.2.1 off the Google Ajax CDN, then `/static/omegle.js?N`. A PNG favicon (`<link rel="icon" type="image/png" href="/static/favicon.png">`) appears from June 2009. The Google Analytics urchin snippet at the bottom is the `document.write(unescape("%3Cscript..."))` form, account `UA-1307731-4`.

There is no CSS reset, no grid framework, no jQuery. The whole stylesheet is 4,609 bytes.

### 1.2 Base typography and colour

```css
body {
    margin: 0;
    padding: 0;
    background: #EEE;
    height: 100%;
    font-family: Arial, sans-serif;
}
```

No `font-size` is ever set on `body`, so the entire page runs at the browser default of 16px and every other size is an `em` fraction of it. This is the single most surprising fact about the page: Omegle in 2009 was **not** the 11-13px Verdana/Tahoma of the 2009 mainstream. It was 16px Arial. Copy that, and the homage reads as Omegle; use 11px Verdana and it reads as Facebook.

The palette is four greys and two CSS keywords:

| Token | Value | Used for |
| --- | --- | --- |
| page | `#EEE` | `body` background |
| surface | `#FFF` / `white` | header, `#intro`, log box, buttons, textarea |
| border | `#CCC` | literally every border and rule on the page |
| muted | `#555` | status lines, form labels, online count, the "or" separator |
| you | `blue` (keyword, `#0000FF`) | `You:` label |
| stranger | `red` (keyword, `#FF0000`) | `Stranger:` label |

The two chat labels are CSS colour keywords, not tuned hexes. Reddit 2009 did the same thing (`.title { color: blue }`). It is period-correct to use the raw keywords.

### 1.3 Page structure, top to bottom

**`#header`**. White band, `padding: 0.5em`, `border-bottom: 1px solid #CCC`. Contains two image headings:

```html
<h1 id="logo"><img src="/static/logo.png" width="236" height="57" alt="Omegle"></h1>
<h2 id="tagline"><img src="/static/tagline.png" width="220" height="57" alt="Talk to strangers!"></h2>
```

`#logo { float: left; margin-left: 1em; margin-right: 5em; font-size: 1em }`, both images `display: block`. Text in images was standard practice in 2009 because webfonts were not usable yet.

The logo art (do not reproduce; described for grammar only): a rounded-square blue tile `#3F9FFF` holding a white two-arrow swirl, followed by the wordmark "omegle" in lowercase orange `#FF8000` in a soft geometric rounded sans. The tagline art is "Talk to strangers!" in heavy black italic sans, baseline tilted a few degrees upward, on white. Two typefaces, two accent colours, both set as pictures.

**`#onlinecount`**, injected by JS into `#header`:

```css
#onlinecount {
    font-weight: bold;
    font-size: 0.9em;
    color: #555;
    position: absolute;
    right: 1.66666666em;
    top: 28px;
}
```

Text is `"<N> users online"`, refetched from `/count?rand=<random>` every 120,000 ms. The `1.66666666em` is the kind of number you get from dividing in your head and not rounding, and it is very 2009.

**`#adwrapper`**. `position: absolute; right: 1em; width: 160px; margin-top: 1em`. A 160x600 skyscraper. March 2009 instead had a 468x15 AdSense link unit inside `#intro`; June 2009 briefly ran a Harren Media 160x600 iframe; by December 2009 it is AdSense slot `0571358342`, comment `/* 160x600, created 6/2/09 */`. `.inconversation #adwrapper { display: none }`, so the ad disappears the moment you are in a chat.

**`#intro`**, the main white card:

```css
#intro {
    line-height: 1.5;
    margin: 1em;
    margin-right: 192px;
    padding: 0.5em;
    padding-top: 0;
    border: 1px solid #CCC;
    background: white;
    border-radius: 0.5em;
    -moz-border-radius: 0.5em;
    -webkit-border-radius: 0.5em;
}
```

`margin-right: 192px` = 160px ad + 32px of gutter. The layout is **fluid full-width with a fixed right rail**, not a centred 960px column. Note the three-property radius: unprefixed plus `-moz-` plus `-webkit-`, which is the exact 2009 shape of that declaration.

Intro paragraph, verbatim, March through December 2009:

> Omegle is a brand-new service for meeting new friends. When you use Omegle, we pick another user at random and let you have a one-on-one chat with each other. Chats are completely anonymous, although there is nothing to stop you from revealing personal details if you would like.

March 2009 only, an AIM bridge:

> Or you can send `$connect` to OmegleBot on AIM.

marked up as `<kbd>$connect</kbd>` with an `aim:goim?screenname=OmegleBot&message=$connect` link and an `aim.gif` buddy icon. `#aim { margin: 0; text-align: center; font-size: 0.9em }`.

June 2009 onward, replacing it:

> If you like Omegle, be sure to check out [the Omegle blog](http://omegler.blogspot.com/)!

**`p#chatbutton`**. `text-align: center; margin-bottom: 0.25em`, image inside is `display: block; margin: auto; cursor: hand; cursor: pointer`. The doubled `cursor` declaration is the IE6 hack.

`chatbutton.png` is 200x50. Sampled column by column, it is a pure vertical linear gradient with no gloss split, no border and no shadow:

- top row `#80BFFF`
- bottom row `#0180FE`
- linearly interpolated in between (`#66B2FF` at y=12, `#4DA5FF` at y=24, `#2993FE` at y=36)
- corner radius approximately 3px, anti-aliased into white

The top colour is exactly the bottom colour mixed 50% with white. Label is "Start a chat" in white, light weight, a Lucida-Grande-ish humanist sans, centred. That same gradient survives to 2015 as real CSS, which confirms the reading: `background-image: -webkit-linear-gradient(top, #80c0ff 0, #017ffe 100%)`.

**`#feedback`**, a collapsible block, class toggled between `collapsed` and `expanded`, opening automatically if `location.hash == "#feedback"`.

```css
#feedback h2 { font-size: 1.1em; font-weight: bold; margin: 0; padding: 0; padding-left: 20px; }
#feedback.expanded h2 { background: url(/static/feedbackexpanded.png) no-repeat center left; }
#feedback.collapsed h2 { background: url(/static/feedbackcollapsed.png) no-repeat center left; }
#feedback form { margin-left: 20px; }
#feedback.collapsed form { display: none; }
#feedback label { font-size: 0.9em; font-weight: bold; color: #555; }
```

The disclosure triangles are two tiny PNGs, 9x10 and 10x9. Heading text: "Send feedback to Omegle" (2012: "Send feedback to Omegle's staff"). The form carries a honeypot:

```css
#emailfield { position: absolute; top: -5000px; left: -5000px; }
```

with the label "Leave this field alone:". Real fields: "Your email address:" plus "(only required if you want a response)", a `cols="80" rows="5"` textarea, and `<input type="submit" value="Send feedback">`.

**`#appstore`**, from mid-2009, a centred iTunes badge, `margin: 10px; margin-right: 192px`, alt text "Omegle app for iPhone and iPod Touch". Destroyed by JS when a chat starts.

There is no footer in 2009. The feedback form is the footer.

### 1.4 The chat screen

Clicking the chat button records `contentTop = $("intro").offsetTop`, disposes `#intro`, adds class `inconversation` to `<body>` and builds the whole chat UI in JavaScript. `.inconversation` sets `#adwrapper { display: none }`, `.controlwrapper { padding-right: 0 }` and `.logwrapper { margin-right: 0 }`, so the chat fills the viewport edge to edge.

Everything is absolutely positioned off the viewport. There is no fixed-width column anywhere in the chat screen:

```css
.logwrapper {
    border: 1px solid #CCC;
    border-radius-topleft: 0.5em;    /* plus -moz- and -webkit- variants */
    background: white;
    position: absolute;
    left: 1em;
    right: 1em;
    bottom: 6.5em;
    _width: 96%;      /* IE6-only star-hack sibling */
    _height: 250px;
}
.logbox {
    position: absolute;
    top: 0.5em; bottom: 0; left: 0.5em; right: 0;
    overflow: auto;
    _width: 97%;
    _height: 230px;
}
.controlwrapper {
    position: absolute;
    bottom: 1em; left: 1em; right: 1em;
    height: 5em;
}
```

`.logwrapper`'s `top` is set inline in pixels to `contentTop`, i.e. the log box begins exactly where the intro card began. The `_width` / `_height` declarations are the underscore hack, applied only by IE6, with the comment `/* Dimensions for IE: */`.

The control bar is a three-cell `<table class="controltable" cellpadding="0" cellspacing="0" border="0">` with `border-collapse: separate; border-spacing: 0`:

```css
.disconnectbtnwrapper { margin-right: 0.5em; border: 1px solid #CCC; border-radius-bottomleft: 0.5em; }
.disconnectbtn  { font-family: sans-serif; font-size: 1em; background: white;
                  width: 7em; height: 5em; padding: 0; margin: 0; border: 0 none;
                  border-radius-bottomleft: 0.5em; }
.chatmsgcell    { width: 100%; }
.chatmsgwrapper { background: white; border: 1px solid #CCC; height: 4.5em; padding: 0.25em; }
.chatmsg        { width: 100%; background: white; font-family: sans-serif; font-size: 1em;
                  border: 0 none; padding: 0; margin: 0; height: 4.5em; overflow: auto; }
.sendbtnwrapper { margin-left: 0.5em; border: 1px solid #CCC; border-radius-bottomright: 0.5em; }
.sendbtn        { /* identical to .disconnectbtn, bottom-right radius */ }
textarea:focus  { outline: none; }
```

So: a 7em x 5em white `Disconnect` button on the left, a full-width `<textarea class="chatmsg" cols="80" rows="3">` in the middle, a 7em x 5em white `Send` button on the right. All three ship `disabled: true` and are enabled on the `connected` event. The buttons are plain white rectangles with a 1px `#CCC` wrapper that rounds only the outer bottom corner, so log box and control bar read as one continuous rounded panel. The buttons are **not** the blue gradient; the blue gradient in 2009 exists only as the homepage PNGs.

Enter sends (`keypress` with `code == 13` and no shift/alt/meta); Shift+Enter inserts a newline.

### 1.5 Log line styling

```css
.logitem  { padding-bottom: 0.5em; }
.statuslog { color: #555; font-size: 0.9em; font-weight: bold; }
.youmsg      .msgsource { color: blue; font-weight: bold; }
.strangermsg .msgsource { color: red;  font-weight: bold; }
```

Message markup is built as `div.youmsg` or `div.strangermsg` containing `span.msgsource` with the literal text `You:` or `Stranger:`, then a plain text space, then the message; embedded newlines become `<br>`. There is no timestamp, no avatar, no bubble, no alternating row background. Just a bold coloured prefix and a paragraph, with 0.5em between entries.

System lines are `div.statuslog` inside a `.logitem`: bold, `#555`, one size down. The transient "Stranger is typing..." line is also a `.statuslog` but is appended at the bottom and removed the moment a message arrives or typing stops.

### 1.6 Copy strings, verbatim (`omegle.js?29`, the December 2009 file)

Status lines, in the order you meet them:

- `Connecting to server...`
- `Looking for someone you can chat with. Hang on.`
- `You're now chatting with a random stranger. Say hi!`
- `Stranger is typing...`
- `Your conversational partner has disconnected.`
- `You have disconnected.`
- `Error connecting to server. Please try again.`
- `Connection asploded.`
- `Connection imploded.`
- `Verifying...` (after submitting a reCAPTCHA)

Note `asploded` and `imploded`. `Connection imploded.` fires when `/events` returns null; `Connection asploded.` fires after three consecutive failures. Two different failure modes with two joke words, both deadpan and both in the same bold grey as everything else. This is the tonal centre of the whole design.

Inline safety interjection, appended as a status line whenever a stranger's message contains `FBI` or `federal bureau`:

> If the above message says you have been reported to the FBI, it is not legitimate. Please ignore it.

Browser dialogs:

- `confirm()` on the Disconnect button: `Are you sure you want to disconnect?`
- `beforeunload`: `Leaving this page will end your conversation.`

End-of-chat row, assembled as a single log item: an `<input type="submit" value="Start a new conversation">`, then the literal text ` or `, then a link reading `save this log` (POSTs the log HTML plus an ISO date to `/downloadlog`), then ` or `, then a link reading `send us feedback`, then `.`.

Header counter: `<N> users online`.

Buttons: `Disconnect`, `Send`, `Submit` (reCAPTCHA), `Send feedback`.

### 1.7 The title-flash trick

Worth stealing. When a stranger's message or a status change lands while you are not looking, `omegle.js` alternates the document title every 500ms between two strings and swaps the favicon with it:

```js
[["___Omegle___", "/static/favicon.png"],
 ["\xAF\xAF\xAFOmegle\xAF\xAF\xAF", "/static/altfavicon.png"]]
```

`\xAF` is U+00AF MACRON. So the title bounces between three underscores and three overbars flanking the word, which reads as the word jumping up and down in the tab. Any `mousemove`, `keydown` or `focus` on `document` or `window` cancels it and restores `document.title = "Omegle"` and the normal favicon. Both favicons are 16x16 PNGs.

### 1.8 The three-state button, correctly dated

**Not 2009.** In `omegle.js?29`, captured 2010-01-13 and linked by the 2010-02-01 homepage, there is exactly one button, `value: "Disconnect"`, wired to `confirm("Are you sure you want to disconnect?")`. That is the last archived state of the text-only site.

**Arrived with video, spring 2010.** `omegle.js?44`, captured 2010-06-20, already has all three states, implemented by swapping the input's `value` and rebinding its click handler:

```js
function b(ac) {
    K.removeEvent("click", c); K.removeEvent("click", ab); K.removeEvent("click", E);
    switch (ac) {
        case "disconnect": K.set("value", "Disconnect"); K.addEvent("click", c);  break;
        case "really":     K.set("value", "Really?");    K.addEvent("click", ab); break;
        case "new":        K.set("value", "New");        K.addEvent("click", E);  break
    }
}
b("disconnect");
```

The `confirm()` dialog is gone; the second click *is* the confirmation. So the window is between the 2010-02-01 homepage (`omegle.js?29`, single button) and 2010-06-20, which brackets the March 2010 video launch. It is still present unchanged in `omegle.js?67` (captured 2010-12-01).

The mature form, with the keyboard badge, is what later builds look like (`omegle.js?211`, captured 2013-03-29 at the `?211` path that the 2012-06-13 homepage links):

```js
function M(a, b) {
    var c;
    switch (a) {
        case "disconnect": c = "Disconnect"; break;
        case "really":     c = "Really?";    break;
        case "new":        c = "New"
    }
    void 0 !== b && (c += " (" + b + ")");
    V.set("text", c);
    V.grab(new Element("div", {"class": "btnkbshortcut", text: "Esc"}));
    xa = a
}
```

So the labels are `Disconnect` → `Really?` → `New`, never "Stop". Details worth copying:

- The 2010 version is a plain `<input type="button">` whose `value` changes. The badge, the countdown and the CSS state classes below all belong to the 2012-2015 builds.
- The button carries a small keyboard-shortcut badge reading `Esc`, styled `.btnkbshortcut { font-size: .8em; color: #9cf; font-weight: bold; margin-top: .25em; height: 0; overflow: show }`, greying to `#a1c3e6` when the button is disabled. `height: 0` means it hangs below the label without changing the button's box.
- Sending a message calls `M("disconnect")`, resetting the confirm. You cannot arm the disconnect and then keep chatting.
- An optional countdown suffix is appended in parentheses: `New (3)`, `New (2)`.
- By 2015 the state is expressed in CSS on the wrapper: `.disconnectbtnwrapper.newbtn` gets `background: #409ffe` with `linear-gradient(top, #80c0ff 0, #017ffe 100%)` and `.newbtn .disconnectbtn { color: white; font-weight: bold }`; `.reallybtn .disconnectbtn { font-weight: bold }` only. So `New` is the loud blue one and `Really?` is just bold on white.

There *is* a "Stop" button in 2012, but it is unrelated: it cancels video auto-reroll, alongside the strings `Automatically rerolling in: <n> second(s)`, `Not automatically rerolling.` and a checkbox labelled ` Auto-reroll next time`.

---

## 2. Omegle UI, 2010 video mode

Video chat launched in March 2010. The first archived homepage after it, 2010-04-03, already carries `style.css?16` and `omegle.js?39`.

### 2.1 What changed on the homepage

The intro paragraph drops "brand-new service":

> Omegle is a great way of meeting new friends. When you use Omegle, we pick another user at random and let you have a one-on-one chat with each other. Chats are completely anonymous, although there is nothing to stop you from revealing personal details if you would like.

and a second paragraph is added:

> Video chat is a brand-new feature! It's still experimental, so if you try it out, please use the feedback form to tell us how you like it.

The single "Start a chat" PNG is replaced by a heading and a mode picker:

```html
<h2 id="startachat">Start a chat:</h2>
<table id="chattypes">
  <tr>
    <td id="chattypetextcell"><img src="/static/textbtn.png" alt="" id="textbtn"></td>
    <td id="chattypeorcell">or</td>
    <td id="chattypevideocell"><img src="/static/videobtn-disabled.png" alt="" id="videobtn" class="disabled"></td>
  </tr>
  <tr><td></td><td></td><td id="videobtnstatus">Loading...</td></tr>
</table>
```

```css
#startachat {
    text-align: center; margin: 0; padding: 0; margin-bottom: 0.2em;
    color: #777; font-weight: normal; font-size: 1.25em;
    font-family: 'Lucida Grande', 'Lucida Sans Unicode', sans-serif;
}
#chattypes { text-align: center; margin: auto; border-collapse: collapse; }
#chattypes td { padding: 0; }
#chattypeorcell { color: #555; font-size: 0.9em; font-weight: bold; padding: 0.5em !important; }
#textbtn, #videobtn { display: block; margin: auto; cursor: hand; cursor: pointer; }
#videobtn.disabled { cursor: default; }
#videobtnstatus { color: #AAA; font-size: 0.7em; }
```

`#startachat` is the only place on the whole site that uses Lucida Grande. Everything else is Arial or generic `sans-serif`.

`textbtn.png` and `videobtn-enabled.png` are both 124x50 with the identical `#80BFFF → #0180FE` gradient and ~3px corners, labelled "Text" and "Video" in white. `videobtn-disabled.png` is the same button desaturated to grey (`#BFBFBF` top → `#818181` bottom). `#videobtnstatus` reads `Loading...` and then resolves to one of:

- `Requires <a href="http://get.adobe.com/flashplayer/">Flash 10</a>.`
- `Requires a webcam.`

or, on success, an empty `&nbsp;` while the button image swaps to `videobtn-enabled.png`.

### 2.2 Video pane geometry

The video is a single Flash object, `#flashwrapper > #flash`, loaded via SWFObject 2.2 and parked offscreen until needed:

```css
#flashwrapper {
    position: absolute;
    top: -5000px; left: -5000px; right: 1em;
    margin-top: 1em;
    width: 0; height: 0; overflow: hidden;
}
.videochat #flashwrapper {
    width: 320px; height: 520px;
    top: auto; left: auto; right: 1em;
}
.videochat .logwrapper   { margin-right: 336px; _width: 60%; }
.videochat .controlwrapper { padding-right: 336px; }
```

So in video mode:

- a **320px wide, 520px tall** column is pinned to the right gutter at `right: 1em`
- the chat log and the control bar keep their full-height absolute layout and simply reserve `336px` on the right (320 + 16px gutter)
- everything else, including the `Disconnect` / textarea / `Send` bar and the `You:` / `Stranger:` log, is byte-identical to text mode

Both video panes live inside that one 320x520 SWF, stacked vertically: stranger on top, you below. 2 x 240 = 480 for two 4:3 feeds at 320 wide, leaving ~40px for the label and control strip. **(The vertical split is inferred from the 320x520 box and the component names below; the exact pane pixel heights are inside the SWF and could not be read.)**

By 2015 the column moves to the left: `.videochat .logwrapper { margin-left: 328px; margin-right: 0 }`.

### 2.3 Inside the SWF

`omegle.swf` is an Adobe Flex 4 application. The archived copy at `bajor.omegle.com/static/omegle.swf?8` carries an XMP date of **Oct 9, 2013**, so it is a later build than the 2010 original; treat the component list as indicative of the mature video UI rather than the launch build. Extracted symbol names and literals:

- `strangerCanvas`, `strangerRounding`, `strangerLabel`, `videoLabel`
- `strangerVideoDisplay`, `strangerVideoDisplay2` (a second stranger, for spy mode), `youVideoDisplay`
- `cameraComboBox`, `microphoneComboBox`, `cameraOffBtn`, `muteMicrophoneBtn`
- literal strings `Camera:`, `Microphone:`, `Mouseover for options.`, `Take Snapshot`, `Omegle screenshot `

So each pane was a `VideoDisplay` inside a rounded canvas with a **text label overlay** (`strangerLabel`), and the controls were a hover-revealed strip carrying two device dropdowns labelled `Camera:` and `Microphone:` plus a camera-off toggle and a mic-mute toggle, with `Mouseover for options.` as the resting hint. There were no chrome-heavy buttons; the pane was mostly video.

The exact rendered text of the two pane labels ("Stranger" and "You", presumably) could not be read out of the archived SWF. **(unverified)**

### 2.4 Video-mode copy

New in `omegle.js?44` (June 2010), on top of everything in section 1.6:

- `Error connecting to Adobe Stratus. Please try again.` The P2P transport was Adobe Stratus / RTMFP
- Facebook Connect log sharing: `Was this conversation great? `, `Share the log on Facebook`, `You must authorize Omegle on Facebook to share logs.`, `Enter a title for your Facebook note:`, `Omegle conversation log`, `Log posted to your Facebook notes successfully.`, `Error posting log to Facebook: `
- `THE STRANGER DOES NOT KNOW YOUR FACEBOOK INFO. The above link directs anyone to their own profile; it is not really a link to your profile specifically.` A second inline debunk line, sibling to the FBI one
- the end-of-chat row gains `switch to ` and `download it`
- log download header: `<h1>Conversation log from <a href="http://omegle.com/">Omegle</a>:</h1>`

The `Looking for someone you can chat with. Hang on.` / `You're now chatting with a random stranger. Say hi!` / `Your conversational partner has disconnected.` / `Connection asploded.` / `Connection imploded.` set is unchanged from 2009.

---

## 3. Evolution 2011-2015

The 2009 skeleton survived essentially intact for six years: same `#EEE` (later `#fff7ee`) page, same 1px `#CCC` white cards, same absolutely-positioned full-viewport chat, same `blue`/`red` labels, same 7em x 5em buttons, same bold-grey `.statuslog`. What accreted on top was, in order: a **frames-based load balancer** in 2011 (`<frameset cols="100%"><frame src="http://bajor.omegle.com/">` with the source comment "Yes, I'm using frames as a load balancing measure. Yes, I know this is horrible, insane, absurd, ridiculous, stupid, and broken."); **interest tags**, entered into a `.topictageditor` (a 1px `#CCC` box you click into) and rendered as `.topictag` pills on `#6cb5ff` with `border-radius: .25em` and a bold delete `x`, driven by "What are you into? (Type your interests here.)", " Use my Facebook likes as interests", later "Add my Tumblr tags as topics", and matched with "You and the stranger both like <tag>" (2012) or "You both like <tag>" (2015), falling back to "Omegle couldn't find anyone who shares interests with you, so this stranger is completely random. Try adding more interests!"; **spy (question) mode**, a collapsible `#tryspymode` block whose `.questionHeading` is white-on-`#6cb5ff` and whose `.questionText` sits on `#DEF`, offering "Or try spy (question) mode..." and explaining "Spy mode gives you and a stranger a random question to discuss. The question is submitted by a third stranger who can watch the conversation, but can't join in." / "Spy mode lets you ask a question and watch two strangers discuss it. (The strangers volunteer to be watched.)", with "Looking for two strangers. Hang on.", "You're now watching two strangers discuss your question!", "Question to discuss:", speakers relabelled `Stranger 1` / `Stranger 2`, and the scold "Please try to discuss the question, not just disconnect!"; **monitoring notices**, starting as the 2012 plain-text peril paragraph ("Do not behave inappropriately on Omegle, and understand that human behavior is fundamentally uncontrollable...") and hardening by 2015 into a boxed `#monitoringnotice` (1px `#CCC`, `border-radius: .5em`, `box-shadow: 0 0 .75em #bfdeff`, `h2` on `#bfdeff`) headed "Video is monitored. Keep it clean*" with an "( Unmoderated Section )" escape hatch, in-chat "switch to monitored section / unmonitored section" links, and a ban state `#monitoringnotice.banned { background: red }` reading "Your computer/network is banned for possible bad behavior."; **college chat** in 2015 ("Find strangers from my college", "College student chat", "Please enter a college email address ending in .edu or .edu.XX or .ac.XX to verify you're in college."); the **mobile note**, 2012's "» Omegle has a new, simpler mobile site. Check it out on your phone or tablet! «" (chevrons as `&raquo;` / `&laquo;` spans) becoming 2015's "Omegle's mobile site is awesome on a smartphone or tablet!" alongside a real `viewport` meta and `IS_MOBILE` branches throughout the JS; and finally **ad decay**, from a single tasteful AdSense skyscraper in 2009 to 2012's in-chat buttons labelled "Pervy Girls (Free, 18+)" and " gay cams  (free, 18+)" styled with `box-shadow: 0 0 40px 10px #F0F inset` and `background: #FF7F00` and randomly swapped on a timer. The **Text | or | Video** picker itself never changed visually between 2010 and 2015; 2015 just renders the same PNGs from JS with `<noscript>` fallbacks. The 2015 skin is the one real repaint: `body { background: #fff7ee; font-family: Helvetica, Arial, sans-serif }`, a `box-shadow: 0 .25em .75em #CCC` under the header, and status copy losing its full stops ("Looking for someone you can chat with..." instead of "...Hang on.", "Stranger has disconnected." instead of "Your conversational partner has disconnected.").

Dating for this section: the frameset is from the homepage capture of 2011-06-02; interest tags and spy mode are first visible in the markup and stylesheet of the 2012-06-13 homepage and its `style.css?46` (captured 2012-05-23); the JS copy strings quoted here come from the `omegle.js?211` and `omegle.js?554` paths, captured 2013-03-29 and 2015-05-13. They may therefore have shipped somewhat earlier than 2012; there is no archived Omegle script between 2010-12-01 and 2013-02-01, so the interval cannot be narrowed further.

---

## 4. Chatroulette 2010, for contrast

The premise needs correcting: Chatroulette's page was **white**, not black. The March 2010 capture is a bare HTML 4 page whose entire body is a two-row `<table width="100%" height="100%">` containing one Flash object (`mesos.swf`) with `bgcolor="#ffffff"`, and under it a single centred text ad link to a dating site styled `font: 12.5px Arial; color: #173288`. By June 2010 the page has grown a real DOM around the Flash: `body { font: 14px Arial; color: #000 }`; a 37px `#topbar` with a repeating background image, `font: 13px Verdana`, holding two `.button` spans (`butPlay`, `butStop`, each 97x23px, `font: 10px Verdana`, labels injected from Flash, three-state sprite hover/active via `background-position` offsets on `buttons_bg.png`), a `#topCounter` pinned `top: 0; right: 10px`, an "(ad) Dating" button wedged in beside it, and a `#butUpperMenu` opening a two-item layout switcher ("Center layout" / "Horizontal layout"); then `#cams`, a **352px-wide left column** whose `.cam { height: 572px; width: 352px; background: #000 }` holds one Flash object containing **both webcams stacked vertically** (this black block is the only black thing on the page, and it is where the "black Chatroulette" memory comes from); and to its right an absolutely positioned `#chat { top: 50px; bottom: 0; left: 372px; right: 10px }` containing a `.log` on `background: #fff` at `font: 14px Verdana` with `overflow-y: auto`, and a 20px-tall full-width `textarea` at the bottom, `resize: none`. Rounded corners are attempted with the classic four-empty-div idiom (`.topcorners > .topcorner`, `.bottomcorners > .bottomcorner`, all sized `0px`). Reporting was inside the SWF and is not readable from the archive; contemporary descriptions place a "report" alongside "next" **(unverified)**. Against Omegle the contrast is instructive: Chatroulette put the video on the left and the chat on the right, sized the video block in hard pixels rather than `em`, used Verdana at 10-14px rather than 16px Arial, and drove its two top-bar buttons through image sprites rather than native `<input type="button">`.

Sources: `web.archive.org/web/20100301000000id_/http://chatroulette.com/`, `web.archive.org/web/20100601000000id_/http://chatroulette.com/`, `.../chatroulette.com/style.css`, plus [CNN, 22 Feb 2010](https://www.cnn.com/2010/TECH/02/22/chatroulette.random.chat/index.html) and [HiLobrow, 15 Mar 2010](https://www.hilobrow.com/2010/03/15/chatroulette/) for the "activate your webcam and click play, then click next" flow description.

---

## 5. 2009 web design conventions

### 5.1 What the Web Design Museum's 2009 gallery actually contains

`webdesignmuseum.org` blocks direct fetching (Cloudflare 403), so this was read through a 2023-12-31 Wayback capture of the gallery page. It holds **32 sites**, listed newest-first across two pages:

Minecraft, Airbnb, Fox News Channel, Star Wars, The Pirate Bay, Tesla Motors, McDonald's, Yahoo! GeoCities, IGN, The Simpsons, YouTube, Yelp, iTunes, Tumblr, Nintendo, Google, Time, Compaq, Skype, Netflix, MailChimp, Lycos, Škoda Auto, The White House, MySpace, Twitter, Samsung, Dell, Apple, AOL, Adobe, KFC.

The museum's own style facets available for 2009 are worth noting as a period taxonomy: **Creative, Illustration, Dark, 00s, 3 Column Layout, Clean, Corporate, Funny, Gradients, Minimal, Pattern, Photography, Texture**. "3 Column Layout" and "Gradients" as first-class style categories is the tell.

### 5.2 Verified 2009 CSS values

Read from archived stylesheets, June 2009 captures:

| Site | Body font | Body / page colour | Key values |
| --- | --- | --- | --- |
| **Twitter** | `font: .75em/1.5 'Lucida Grande', sans-serif` (= 12px) | `background: #9AE4E8 url(bg.gif) no-repeat fixed left top`, `color: #333` | link `#0084b4`; `#container { width: 763px; margin: 1em auto }`; `body#front .wrapper { width: 722px; padding: 17px 20px }`; buttons `background-color: #E6E6E6; border: 1px solid #ccc; padding: 4px 8px` with `:hover { background-color: #999 }`; `.beta { font-size: .9em; background-color: #f9f6ba }`; `-moz-border-radius: 5px 5px 0 0` |
| **Facebook** | `'lucida grande', tahoma, verdana, arial, sans-serif`, `font-size: 11px` | `#f2f2f2` / `#eeeeee` app backgrounds | `#3B5998` (borders, links, dialog frames, 20 occurrences); `#6d84b4` dialog title bars, white bold 14px; `#D8DFEA` hairlines and typeahead highlight; `#edeff4`, `#eceff5` tinted boxes; `#BDC7D8` rules; `.UIRoundedBox_Box { background-color: #f7f7f7; border: 1px solid #cccccc; padding: 4px 0 }` |
| **YouTube** | `body, input, textarea { font: 12px Arial, sans-serif }` | `body { background: #fff }` | `#baseDiv { width: 960px; margin-left: auto; margin-right: auto; padding: 0 5px 25px 5px }`, `#masthead { width: 960px }`; link blue `#03C`; most-used greys `#CCC` (37x), `#666` (25x), `#999`, `#EEE`; accents `#ECF1FA`, `#A1B4D9`, `#994800`, `#FFC`; masthead entirely sprite-driven, logo is an 84x33 `button` with a `background-position` |
| **Reddit** (stylesheet captured 2011-05-27; no 2009 capture of `reddit.css` exists) | `font: normal x-small verdana, arial, helvetica, sans-serif`; headings `font: bold 18px "Trebuchet MS", Helvetica, "Helvetica Neue", Arial, sans-serif` | `body.border { background-color: #ffc }` | link `#336699` / `#369`, visited `#551a8b`, `.title { color: blue }`; orange `#FF6600`, upvoted arrow `#FF8B60`; `#EFF7FF` and `#CEE3F8` pale blue fills; `#5F99CF`, `#E0E0E0`, `#F0F0F0`, `#FFF088`, `#F6E69F` |
| **Digg** | `font: 85% tahoma, sans-serif` and `font: 83%/1.4 arial, helvetica, sans-serif` (percentage sizing off 16px) | `#FFF` / `#EEE` | blue `#105CB6`, `#A5C2E3`; green `#A5CC7A`, `#EFF6E8`; yellow `#FFEB68`; greys `#DDD` (20x), `#666`, `#999`, `#333`; stylesheets pulled with `@import "/css/224/global.css"` |

The brief asked whether Twitter's 2009 blue was `#33CCFF`. It was not: that value does not occur anywhere in the June 2009 `front.css`. Twitter's two blues in 2009 were the page background `#9AE4E8` and the link colour `#0084b4`.

The 2009 pattern is legible across all five: a very small number of greys (`#CCC`, `#DDD`, `#999`, `#666`, `#333`), one saturated brand accent, one or two pale tints of that accent for highlighted rows, and everything at 11-13px.

### 5.3 Twelve reusable rules

1. **Set the base size explicitly and small, in `%` or `em`, then never in `px` again.** Digg: `font: 85% tahoma`. Twitter: `font: .75em/1.5 'Lucida Grande'`. Reddit: `font: normal x-small verdana`. Nobody wrote `font-size: 12px` on `body`; they wrote a fraction of the browser default and let the cascade do the rest.
2. **Pick one of five faces and stop.** Verdana (Reddit), Tahoma (Digg, Facebook), Arial (YouTube, Omegle, Chatroulette), Lucida Grande (Twitter, Facebook, Omegle's one heading), Trebuchet MS (Reddit's headings). The stack always ends `sans-serif` and always lists Arial or Helvetica as the safety net. No webfonts: `@font-face` was not usable in 2009, which is why every logo and every fancy button is a PNG.
3. **Fixed centred column at 960px, or a fluid body with a fixed right rail.** YouTube is the textbook 960 (`#baseDiv { width: 960px; margin: auto }`). Twitter is 763px. Omegle is the other family: fluid `body` with `margin-right: 192px` reserving a 160px skyscraper. Both target 1024x768; 960 is what fits inside 1024 once you allow for a scrollbar.
4. **One-pixel solid borders, no shadows.** Omegle's whole stylesheet uses exactly one border value: `1px solid #CCC`. Facebook's rounded box is `1px solid #cccccc`. Twitter's loader is `1px solid #CCC`. `box-shadow` was not in shipping CSS; if a page had a drop shadow it was a repeating PNG (Facebook's chat window uses `background: url(/images/chat/window_shadow.png) no-repeat center top` on a wrapper with `padding: 6px 7px 0px 8px`).
5. **Rounded corners are triple-declared or faked with images.** The period-correct declaration is all three of `border-radius`, `-moz-border-radius`, `-webkit-border-radius` on the same rule, with the per-corner longhands spelled inconsistently (`border-radius-topleft` next to `-webkit-border-top-left-radius`). Where CSS radius was not trusted, the four-empty-div corner idiom was used instead: Chatroulette's `.topcorners > .topcorner` / `.bottomcorners > .bottomcorner`.
6. **Glossy blue button = a vertical gradient PNG with ~3px corners, white light-weight label, no border.** Omegle's is `#80BFFF` at the top to `#0180FE` at the bottom, linear, 200x50 or 124x50. The tell that it is 2009 rather than 2007 is that there is *no* mid-height gloss split; the 2005-2007 Web 2.0 button had a hard highlight break at 50%. Disabled state = the same PNG desaturated to grey.
7. **Native form controls stay native.** Twitter's submit is `background-color: #E6E6E6; border: 1px solid #ccc; padding: 4px 8px`, i.e. a slightly nicer OS button. Omegle's `Disconnect` and `Send` are `background: white; border: 0 none` inside a bordered wrapper. Nobody restyled a `<select>`.
8. **Two accent colours, maximum, plus a pale tint of each for row highlights.** Reddit: `#336699` and `#FF6600`, tinted to `#EFF7FF` and `#FFF088`. Facebook: `#3B5998` and `#6d84b4`, tinted to `#D8DFEA` / `#edeff4`. Omegle: `#3F9FFF` icon and `#FF8000` wordmark, tinted to nothing at all.
9. **Status and secondary text is bold, one size down, mid-grey.** Omegle `.statuslog { color: #555; font-size: .9em; font-weight: bold }`, its form labels the same, its "or" separator the same. Facebook's `.time_stamp { color: #999; font-size: 9px }`. Bold-and-smaller was how you said "this is chrome, not content".
10. **Yellow means notice, pink-red means error, and both are pale.** Facebook 2009: `.msg_warning { background: #FFF9D7 }`, `.msg_error { background: #FFEBE8 }`, `.chat_notice { background-color: #FFF9D7; font-size: 9px }`. Twitter's beta badge is `#f9f6ba`. Reddit's `body.border { background-color: #ffc }`. Pale yellow is the single most 2009 background colour there is.
11. **Ads are declared in-page as a `google_ad_width` / `google_ad_height` pair and sized 160x600 or 468x60.** Omegle carried `google_ad_client = "pub-0674509822553405"` inline with a `/* 160x600, created 6/2/09 */` comment. A 160px right rail with the content margin set to `160 + gutter` is the layout signature.
12. **Ship the IE hacks visibly.** `_width: 96%` under a `/* Dimensions for IE: */` comment (Omegle), `cursor: hand; cursor: pointer` doubled (Omegle), `display: -moz-inline-block; display: inline-block; zoom: 1; *display: inline` (Omegle 2012), separate `ie6.css` / `ie7.css` files (Facebook, Digg), `.ff2 .UIRoundedBox_Box` browser-class prefixes on `<html>` (Facebook), `<!--[if lt IE 7]> <html class="no-js ie6 oldie">` conditional comments. In an homage these are invisible to the user but they are what makes the source view convincing.

**Conventions the sources confirm but which need care in a homage:** visitor counters (Omegle's real `"<N> users online"` is the good version of this, polled from the server rather than a hit counter GIF); "Tell a friend" and social-bookmarking rows (Omegle's own 2012 header is a Facebook Like + a Tweet button + a Google Translate dropdown in a row, which is the same instinct one generation on); orange RSS icons and tag clouds (present across 2009 blogs generally, but **not** on any of the five sites I read, so **unverified** as a mainstream-2009 signal rather than a blog-2009 one); "Best viewed in" notices (a 1999 convention that had largely died by 2009, **unverified** for 2009 and probably an anachronism); `<kbd>` for literal input strings (Omegle's `<kbd>$connect</kbd>`, genuinely period).

---

## 6. Chat-window conventions of the era, 2008-2009

This matters because the wait-together call UI may live in a small window. Two of these are verified from archived CSS; the desktop clients are from recollection and secondary sources and are marked.

### 6.1 Facebook chat, 2008-2009 (verified from `fbcdn` package CSS, June 2009 capture)

The whole thing lives in a bottom bar, `#presence`, 26px tall, with `#chat_tab_bar` floated left and a `#buddy_list_tab` 159px wide on the right. Each open conversation is a **tab**, not a window:

- `.tab_handle`: `height: 25px; color: #333; border-left: 1px solid #b5b5b5; border-right: 1px solid #e0e0e0`. A raised strip separated by a light/dark border pair
- `.tab_hit_area`: `width: 110px; padding: 3px 4px 6px 6px; overflow: hidden; cursor: pointer`
- `.tab_handle.highlight`: `color: #fff; height: 27px; border-color: #3b5998` plus a repeating sprite background, i.e. the unread tab grows 2px and turns Facebook blue
- `.tab_handle.focused`: `color: #111; border-color: #333; border-bottom: 1px solid #333; background: #fff`. The open tab is white with a dark outline
- `.tab_count`: an 18x16 sprite badge at `top: -3px; right: 12px`, `font-size: 9px; color: white; font-weight: bold`
- presence is a dot GIF trailing the name: `im_online_dot.gif`, `im_idle_dot.gif`, `im_grey_dot.gif`, all `background-position: right 5px` with `padding-right: 12px`

The conversation panel opens upward from the tab:

```css
.chat_window_wrapper { position: absolute; bottom: 24px; margin-left: -99px;
                       padding: 6px 7px 0px 8px;
                       background: url(/images/chat/window_shadow.png) no-repeat center top;
                       z-index: 12; }
.chat_window .chat_conv { overflow: auto; overflow-x: hidden; background: white; color: black;
                          cursor: default;
                          border-right: 1px solid #333; border-left: 1px solid #333;
                          border-bottom: 1px solid #B9C4DA; }
.chat_window .chat_conv h5 { font-size: 11px; margin: 2px 0 0 0; padding: 3px 6px 1px;
                             border-top: 1px solid #eee; }
.chat_window .chat_conv h5.self { color: #777; }
.chat_window .chat_conv p { color: #000; padding: 2px 3px; margin: 0 4px; line-height: 14px; }
.chat_window .time_stamp { color: #999; float: right; font-size: 9px; font-weight: normal;
                           padding: 1px 0; }
```

Log grammar: **name as an `<h5>` on its own line at 11px with a hairline `#eee` rule above it, timestamp floated right in 9px `#999`, then the message as a `<p>` at `line-height: 14px`.** Your own name is `#777`; the other person's is a link. This is not a bubble UI; it is a run of small labelled paragraphs, which is exactly the same grammar as Omegle's `You:` / `Stranger:` in a denser form.

System notices are a distinct class with an icon:

```css
.chat_notice { font-size: 9px; padding: 4px 5px 5px 26px; margin: 5px 0 0 0;
               background-position: 4px 3px; background-repeat: no-repeat;
               background-color: #FFF9D7; }
.chat_notice.sending        { background-image: url(/images/loaders/indicator_blue_small.gif); }
.chat_notice.chat_signed_on  { background-image: url(/images/im_online.gif); }
.chat_notice.chat_signed_off { background-image: url(/images/im_offline.gif); }
.chat_notice.chat_msg_not_sent { background-color: #FFEBE8;
                                 background-image: url(/images/im_offline.gif); }
.visibility_change { background: #f7f7f7; color: #999999; margin: 0; padding: 3px 6px 2px 6px; }
```

So a sign-off notice was a 9px line on pale yellow `#FFF9D7` with a 16px status icon in a 26px left gutter, and a failed send was the same on pale red `#FFEBE8`. **The typing indicator was an animated GIF** (`/images/chat/typ.gif`) swapped in as the background of the tab's name, `background-position: right 2px; padding-right: 18px`, replacing the presence dot. It was a picture, not the word "typing".

### 6.2 Desktop clients (unverified, from recollection and secondary sources)

- **AIM 6.x (2006-2008).** A tall narrow buddy list window, roughly 200x500, and a separate IM window per conversation of roughly **400x300** with the input box occupying the bottom third and a formatting toolbar between log and input. Title bar reads the screen name. Log lines are `ScreenName (10:42:13 AM): message` with each participant's name in a user-chosen colour (blue and red were the defaults, which is very likely where Omegle's `blue`/`red` came from). Typing showed as a small pencil/paper icon in the window's status strip plus the phrase "<name> is typing"; sign-off produced a system line and a door-slam sound. The away message was a per-user block of text shown when you IMed someone away, prefixed by an auto-response marker. Wikipedia confirms the centrality of away messages and buddy-list presence but carries no UI dimensions.
- **MSN / Windows Live Messenger 2009 (Wave 3).** Conversation window around **500x400**, contact display picture on the left, the other party's "Scene" background image behind the window chrome, an emoticon/font/nudge toolbar above the input, chat history button in the window. Status line at the bottom of the log area reading "<name> is typing a message." Presence limited to Available / Away / Busy / Appear offline. The Fandom/Wikipedia articles confirm the Scene, the display-picture move to the left, the history button and the four statuses; the pixel dimensions and the exact typing string are unverified.
- **Gmail chat, 2008-2009.** In-page chat in the left rail, plus a "pop-out" that opened a real browser window at roughly **320x350** via `window.open`. Log grammar was `me: message` / `name: message` on alternating rows with no timestamps by default, and a small "<name> is typing..." line under the log.

### 6.3 Typical popup dimensions to target

For a small floating call window in the homage, the period-plausible sizes are:

| Reference | Size |
| --- | --- |
| Gmail pop-out chat (unverified) | 320 x 350 |
| AIM IM window (unverified) | 400 x 300 |
| MSN conversation window (unverified) | 500 x 400 |
| Facebook chat panel, 2009 (verified geometry) | ~200 wide, opening upward from a 110px tab |
| Chatroulette webcam block (verified) | 352 x 572, two feeds stacked |
| Omegle video column (verified) | 320 x 520, two feeds stacked |

**320 x 520** is the best single number to reach for: it is Omegle's own verified video column, it holds two 4:3 feeds stacked at 320 wide, and it is a plausible `window.open` size in both 2009 and today.

---

## 7. A practical style guide for the homage: "2009 tokens"

Everything here is derived from a value verified above. Where I have deviated from the source for a reason, the reason is stated.

### 7.1 Fonts

```css
--font-body:  Arial, "Helvetica Neue", Helvetica, sans-serif;   /* Omegle 2009, verbatim */
--font-alt:   "Lucida Grande", "Lucida Sans Unicode", "Segoe UI", sans-serif;  /* Omegle's one heading */
--font-dense: Verdana, Geneva, Tahoma, sans-serif;              /* Chatroulette / Reddit / Digg */
--font-mono:  "Courier New", Courier, monospace;                /* for agent output, log dumps */
```

No Google Fonts, no `@font-face`. Webfonts did not exist in 2009 and adding one is the single fastest way to break the illusion. All four stacks render natively on macOS, Windows and Linux today; Lucida Grande falls through to Segoe UI on Windows, which is close enough.

**Size the body at 16px, not 12px.** This is the counterintuitive call and it is the right one: Omegle's own `body` sets `font-family` and no `font-size`, so it ran at the browser default. Set everything else in `em`:

```css
body     { font: 16px/1.5 var(--font-body); }   /* line-height 1.5 is Omegle's #intro value */
.status  { font-size: 0.9em; font-weight: bold; }   /* 14.4px */
.smallcaption { font-size: 0.7em; }                  /* 11.2px, Omegle's #videobtnstatus */
h2.section    { font-size: 1.25em; font-weight: normal; font-family: var(--font-alt); }
```

Use the dense 11-13px Verdana register only for deliberately "other" chrome: a fake ad, a footer disclaimer, a counter.

### 7.2 Palette

Eight values, all sourced:

```css
--page:        #EEEEEE;  /* Omegle 2009 body */
--surface:     #FFFFFF;  /* header, cards, log box, buttons */
--border:      #CCCCCC;  /* every border on the page, no exceptions */
--muted:       #555555;  /* status lines, labels, the "or" separator */
--you:         #0000FF;  /* CSS keyword `blue`, the You: label */
--stranger:    #FF0000;  /* CSS keyword `red`, the Stranger: label */
--btn-top:     #80BFFF;  /* Omegle button gradient, top stop */
--btn-bottom:  #0180FE;  /* Omegle button gradient, bottom stop */
```

Optional extensions, each with a source:

```css
--accent-orange: #FF8000;  /* Omegle wordmark; good for a "your Claude" accent */
--icon-blue:     #3F9FFF;  /* Omegle logo tile */
--tag-blue:      #6CB5FF;  /* Omegle 2011+ interest-tag pill and spy-mode heading */
--tint-blue:     #DDEEFF;  /* Omegle's #DEF, spy-mode body fill */
--notice-yellow: #FFF9D7;  /* Facebook 2009 .chat_notice */
--error-pink:    #FFEBE8;  /* Facebook 2009 .msg_error */
--link:          #0000EE;  /* browser default link blue; period-correct because 2009 pages
                              routinely just let links be default blue */
--visited:       #551A8B;  /* Reddit 2009 .title:visited, also the browser default */
```

Do **not** introduce a shadow colour, a "primary/secondary/tertiary" ramp, or an OKLCH scale. The whole point is that 2009 had four greys and stopped.

### 7.3 Button recipe

```css
.btn2009 {
    display: inline-block;
    padding: 0.75em 1.25em;
    border: 0 none;
    border-radius: 3px;
    background: #409FFE;                                  /* fallback */
    background-image: linear-gradient(to bottom, #80BFFF 0%, #0180FE 100%);
    color: #FFFFFF;
    font: 1em var(--font-body);
    text-shadow: none;
    cursor: pointer;
}
.btn2009:active { background-image: linear-gradient(to bottom, #0180FE 0%, #80BFFF 100%); }
.btn2009[disabled] {
    background-image: linear-gradient(to bottom, #BFBFBF 0%, #818181 100%);
    cursor: default;
}
```

Three notes. **No border**, because the archived PNG has none, and neither does the 2015 CSS. **3px radius, not 6 or 8**, measured off the anti-aliasing of `textbtn.png`. **No inner highlight and no 50% gloss split**, because that is 2006, not 2009; Omegle's gradient is a single clean interpolation, and the top stop is exactly the bottom stop mixed 50% with white, so any other blue can be derived the same way.

The plain white buttons (the `Disconnect` / `Send` pair) are their own recipe and should stay white:

```css
.btnplain-wrap { border: 1px solid #CCC; background: #FFF; display: inline-block; }
.btnplain      { width: 7em; height: 5em; padding: 0; margin: 0; border: 0 none;
                 background: transparent; font: 1em sans-serif; }
.btnplain-wrap.armed  .btnplain { font-weight: bold; }                 /* "Really?" */
.btnplain-wrap.newbtn { background-image: linear-gradient(to bottom, #80C0FF 0%, #017FFE 100%); }
.btnplain-wrap.newbtn .btnplain { color: #FFF; font-weight: bold; }    /* "New" */
.kbshortcut { font-size: 0.8em; color: #9CF; font-weight: bold; margin-top: 0.25em;
              height: 0; overflow: visible; }
```

7em x 5em is a genuinely odd, genuinely period button size and it is worth keeping.

### 7.4 Box recipe

```css
.card2009 {
    background: #FFF;
    border: 1px solid #CCC;
    border-radius: 0.5em;
    padding: 0.5em;
    padding-top: 0;
    line-height: 1.5;
}
```

No `box-shadow`. If you want one anyway, the period-plausible move is the 2015 Omegle header, `box-shadow: 0 .25em .75em #CCC`, or a soft tinted glow like `#monitoringnotice`'s `0 0 .75em #bfdeff`. Both are already past 2009 and should be used sparingly.

The log-plus-controls panel is one visual unit: log box with `border-radius` on the **top two corners only**, control bar below with radius on the outer **bottom** corners only, 1px `#CCC` throughout.

### 7.5 Layout

- Target **1024 x 768**. That is what 960 grids exist for.
- Content column **700-960px**. Use 960 for a centred fixed layout (YouTube's `#baseDiv { width: 960px; margin: auto; padding: 0 5px 25px 5px }`), or 722-763 for the narrower Twitter feel.
- Better still, use Omegle's actual layout: **fluid body, `margin-right: 192px`, and a 160px right rail** holding either a real skyscraper-shaped block or the joke that stands in for one.
- The call/chat screen should go **full viewport with absolute positioning**, not a centred card: log box `left: 1em; right: 1em; bottom: 6.5em`, control bar `bottom: 1em; left: 1em; right: 1em; height: 5em`. This is the strongest single layout signature of Omegle and it is nothing like a modern centred chat.
- Video column: **320px wide, 520px tall**, pinned to one gutter, with the log reserving `336px` on that side.

### 7.6 Copy strings in the Omegle voice, adapted

The voice is: flat, declarative, second person, full stops, no exclamation marks except the one after "Say hi!", and exactly one joke word per failure mode. Fifteen strings:

1. `Connecting to server...`
2. `Waiting for someone else to be waiting for their Claude. Hang on.`
3. `You're now on a call with a random stranger. Say hi!`
4. `You're both waiting on your agents. Neither of you can do anything about it.`
5. `Stranger is typing...`
6. `Stranger's Claude has finished. Your conversational partner has disconnected.`
7. `Your Claude has finished.`
8. `You have disconnected.`
9. `Stranger wants to turn on video. Click Video to agree.`
10. `You're both on video now. Try not to look at yourself.`
11. `Stranger's build failed. They may be a while.`
12. `Connection asploded.`
13. `Connection imploded.`
14. `Error connecting to server. Please try again.`
15. `Leaving this page will end your call.`

Plus the surrounding chrome, in the same register:

- header counter: `<N> people waiting on their agents`
- button trio: `Hang up` → `Really?` → `New`, with the `Esc` badge under it
- confirm dialog: `Are you sure you want to hang up?`
- end-of-call row: `Start a new call` ` or ` `save this log` ` or ` `send us feedback` `.`
- textarea placeholder (2012-era, so optional): `Type your message...`
- the debunk line, which is the funniest thing to port faithfully: `If the above message claims your agent has deleted your repository, it is not legitimate. Please ignore it.`

Two rules for writing more of these. First, the system voice always calls the other person "Stranger" and never "they" or "your partner" in short lines, but expands to "Your conversational partner" for the disconnect, which is the one moment it gets formal. Second, failures get invented words (`asploded`, `imploded`), never apologies. `Technical error. Sorry. :(` arrives in 2012 and is already a decline in nerve.

### 7.7 The title-flash, ported

Cheap and exactly right for this project, because the whole premise is that the user is not looking at the tab:

```js
const flash = ["___waiting___", "¯¯¯waiting¯¯¯"];
```

alternate every 500ms, swap between two 16x16 PNG favicons with it, cancel on `mousemove` / `keydown` / `focus`. Fire it when a stranger speaks, when their agent finishes, and when yours does.

### 7.8 Chaos garnishes, ranked

**Funny, keep:**

- **The online counter.** `<N> people waiting on their agents`, polled every 120 seconds like the real one. It is the honest version of a visitor counter and it doubles as real product information.
- **The 160px right rail** left in the layout, holding a single house ad for something absurd but harmless. The layout reserves the space whether or not anything fills it, and the empty reserved gutter is itself funny.
- **The ad that vanishes when you connect.** `.oncall #adwrapper { display: none }`. A one-line CSS rule that reproduces the exact 2009 economics.
- **The title-flash and the swapping favicon.** Section 7.7.
- **`<kbd>` around literal strings**, e.g. a `/wait` command rendered as `<kbd>/wait</kbd>`.
- **The honeypot field** on the feedback form, label and all: `Leave this field alone:` at `top: -5000px`. Nobody sees it, but it is in the source, and the source is part of the joke.
- **The collapsible feedback form at the bottom**, with a 9x10 triangle GIF and the heading `Send feedback to <project>'s staff`.
- **The IE hacks in the stylesheet** under a `/* Dimensions for IE: */` comment. Zero user-facing cost, enormous payoff for anyone who reads the source.
- **`asploded` / `imploded`.**

**Reads as noise, skip:**

- **A hit counter GIF.** Odometer digits are a 1997 signal, not a 2009 one, and none of the five sites I read had one. It would say "old web" generically instead of "2009" specifically.
- **"Tell a friend" and a social-bookmarking row of Digg / del.icio.us / StumbleUpon icons.** These existed but they were already visual clutter in 2009 and they will read as clutter now, not as a joke. If you want the social row, use the *actual* 2012 Omegle header instead: a Facebook Like button, a Tweet button and a Google Translate dropdown, in that order, in the header. That is funnier because it is true.
- **"Best viewed in" notices.** Anachronistic by 2009.
- **A `<blink>` tag or a marquee.** Wrong decade by fifteen years.
- **Tag clouds and orange RSS chiclets.** Blog furniture, not app furniture; unverified as a 2009 app convention.
- **The sleazy cam-site buttons.** Real, and they are the most vivid thing in the 2012 source, but reproducing that register in a project about waiting for a build is a different joke than the one being told.

**Borderline, use at most one:** a "beta" badge in Twitter's exact style (`font-size: .9em; background-color: #f9f6ba`, no border, no pill) next to the wordmark. It is verified, it is period, and it says the right thing about a hobby project. Two would be one too many.

---

## 8. Sources

All Wayback URLs below use the `id_` modifier and were read raw, except the Web Design Museum entry, which was read through a normal (rewritten) capture. Every asset URL had its real capture date confirmed with `memento-datetime`; dates in parentheses are the confirmed dates, not the timestamps in the URLs.

**Omegle, 2009 text mode**

- `https://web.archive.org/web/20090328064809id_/http://omegle.com/` (earliest capture, ~3 days after launch)
- `https://web.archive.org/web/20090627002016id_/http://omegle.com/`
- `https://web.archive.org/web/20091202012230id_/http://omegle.com/`
- `https://web.archive.org/web/20100201090551id_/http://omegle.com/` (confirmed 2010-02-01; last archived homepage still linking `style.css?14` / `omegle.js?29`)
- `https://web.archive.org/web/20100113030713id_/http://omegle.com/static/style.css?14` (confirmed 2010-01-13; the stylesheet linked unchanged by the 2009-06-27, 2009-12-02 and 2010-02-01 pages)
- `https://web.archive.org/web/20100113030729id_/http://omegle.com/static/omegle.js?29` (confirmed 2010-01-13; earliest archived Omegle script, one bump past the `?28` linked on 2009-12-02)
- Images: `.../20100113030713id_/http://omegle.com/static/{logo,tagline,chatbutton,favicon,altfavicon,feedbackcollapsed,feedbackexpanded}.png`

**Omegle, 2010 video mode**

- `https://web.archive.org/web/20100403104411id_/http://www.omegle.com/` (first post-launch capture, `omegle.js?39`)
- `https://web.archive.org/web/20100601102839id_/http://www.omegle.com/` (`omegle.js?42`)
- `https://web.archive.org/web/20100620005813id_/http://omegle.com/static/style.css?16` (confirmed 2010-06-20)
- `https://web.archive.org/web/20100620005830id_/http://omegle.com/static/omegle.js?44` (confirmed 2010-06-20; earliest archived script with `Disconnect → Really? → New`)
- `https://web.archive.org/web/20100620005813id_/http://omegle.com/static/{textbtn,videobtn-enabled,videobtn-disabled}.png`
- `https://web.archive.org/web/20101201112555id_/http://bajor.omegle.com/static/style.css?18` (confirmed 2010-12-01)
- `https://web.archive.org/web/20101201112558id_/http://bajor.omegle.com/static/omegle.js?67` (confirmed 2010-12-01)
- `https://web.archive.org/web/20101201112558id_/http://bajor.omegle.com/static/omegle.swf?8` (Flex 4 app, XMP date Oct 9 2013, so a later build)

**Omegle, 2011-2015**

- `https://web.archive.org/web/20110602134925id_/http://www.omegle.com/` (the frameset load balancer)
- `https://web.archive.org/web/20110602000000id_/http://bajor.omegle.com/static/omegle.js?73` **resolves to a 2013-02-01 capture** and was discarded as a 2011 source; likewise `.../omegle.js?39` at a 2010 timestamp resolves to 2013-02-10. Both are listed here so the mistake is not repeated.
- `https://web.archive.org/web/20120613213202id_/http://www.omegle.com/` (confirmed 2012-06-13) plus `.../static/style.css?46` (confirmed 2012-05-23) and `.../static/omegle.js?211` (confirmed 2013-03-29, the later capture of the path the 2012 page links)
- `https://web.archive.org/web/20150601000000id_/http://www.omegle.com/` plus `.../static/style.css?95` and `.../static/omegle.js?554` (both confirmed 2015-05-13)
- CDX index used to enumerate captures: `https://web.archive.org/cdx/search/cdx?url=omegle.com&matchType=domain&from=20090101&to=20110101&output=text&fl=timestamp,original,mimetype,statuscode&collapse=urlkey`

**Chatroulette**

- `https://web.archive.org/web/20100301000000id_/http://chatroulette.com/`
- `https://web.archive.org/web/20100601000000id_/http://chatroulette.com/`
- `https://web.archive.org/web/20100601000000id_/http://chatroulette.com/style.css`
- `https://web.archive.org/web/20100601000000id_/http://chatroulette.com/style_um.css`
- [CNN, "Chatroulette offers random webcam titillation", 22 Feb 2010](https://www.cnn.com/2010/TECH/02/22/chatroulette.random.chat/index.html)
- [HiLobrow, "Chatroulette", 15 Mar 2010](https://www.hilobrow.com/2010/03/15/chatroulette/)

**Web Design Museum**

- `https://www.webdesignmuseum.org/gallery/year-2009` (blocked by Cloudflare on direct fetch; read via `https://web.archive.org/web/20231231071004/https://www.webdesignmuseum.org/gallery/year-2009` and its page 2)

**2009 mainstream sites, all captured 2009-06-15**

- Twitter: `https://web.archive.org/web/20090615000000id_/http://twitter.com/` and `.../http://assets0.twitter.com/static/1244761712/front.css`
- Facebook: `https://web.archive.org/web/20090615000000id_/http://facebook.com/` and the three `static.ak.fbcdn.net/rsrc.php/.../css/*.pkg.css` packages, in particular `aubdlzq1p80sw40o.pkg.css` (chat) and `5xxvsqmpkl4wk0kg.pkg.css` (site chrome)
- YouTube: `https://web.archive.org/web/20090615000000id_/http://youtube.com/` and `.../http://s.ytimg.com/yt/cssbin/www-core-vfl102866.css`
- Reddit: `https://web.archive.org/web/20090615000000id_/http://reddit.com/` (page confirmed June 2009) and `.../http://www.reddit.com/static/reddit.css` (**resolves to 2011-05-27**; no 2009 capture of the stylesheet exists, so the Reddit values in 5.2 are 2011 values for a design that changed little in between)
- Digg: `https://web.archive.org/web/20090615000000id_/http://digg.com/` and `.../http://digg.com/css/224/global.css`
- Meebo: `https://web.archive.org/web/20090615000000id_/http://www.meebo.com/` (checked for web-IM window conventions; the skin CSS carries no window geometry, so it contributed nothing)

**Secondary, for section 6.2 only**

- [Wikipedia, AIM (software)](https://en.wikipedia.org/wiki/AIM_(software)): confirms away messages and buddy-list presence as defining features; no UI dimensions
- [Wikipedia, Windows Live Messenger](https://en.wikipedia.org/wiki/Windows_Live_Messenger) and the Versions Wiki entries for WLM 2009 builds: confirm the Wave 3 Scene backgrounds, display picture on the left of the conversation window, chat history button and the four-status list; no UI dimensions

### Explicitly unverified

- The rendered text of the Omegle video pane labels ("Stranger" / "You"). The label components exist (`strangerLabel`, `videoLabel`) but the strings are inside the SWF.
- The exact vertical split of the two feeds inside the 320x520 video column. Inferred from the box size.
- Chatroulette's in-Flash report flow and the exact `butPlay` / `butStop` label text; both were injected from the SWF.
- All pixel dimensions and exact status strings for AIM, MSN / Windows Live Messenger and Gmail chat in section 6.2 and the popup table in 6.3.
- Whether tag clouds, orange RSS chiclets, hit counters and "Best viewed in" notices were live 2009 app conventions. None appeared on any of the five archived sites read here; they are blog-and-personal-site furniture of the period, and are flagged as such in section 7.8.
- The claim that AIM's default blue/red screen-name colouring is the origin of Omegle's `blue`/`red` labels. Plausible, unproven.
- The precise arrival dates of interest tags, spy mode and the `Esc` badge. See the dating note at the end of section 3; the archive has no Omegle script between 2010-12-01 and 2013-02-01.
- Reddit's 2009 stylesheet values, which are read from a 2011 capture (section 5.2).
