# Retro chat-window design: a visual reference for the small waiting-room window

Research date 2026-09-06. Companion to `05-omegle-ui-and-2009-web-design.md`, which already verified the 2009 Omegle stylesheet (`#EEE` page, white boxes with 1px `#CCC` borders, 16px Arial, `blue`/`red` keyword labels) and the title-flash trick. Nothing from doc 05 is re-verified here. This doc covers the wider chat-window grammar of 2000 to 2015, the CSS recipes that reproduce that chrome, current retro-revival taste, and three candidate directions for the window.

**The thing being designed.** A small window that opens by itself when a stranger is matched and closes by itself when the room empties. No text input. It shows retro-chatroom system lines only ("Stranger has entered the room.", "You: brb, my Claude needs me", "Stranger: back", "Hanging up in 5.", "Stranger has left the room."), a live "3 people waiting on their Claudes" count, two tiny audio level meters, and three actions (Hang up, Show my video, Report). When both people click, two small video feeds appear. Brief: "inspired by Omegle but more polished and fun, with 2000s and 2010s web textures, not overly complicated and unpolished; funny yet smooth."

**Sourcing rule, same as doc 05.** Every hex, size and string below either came out of a file I fetched (URL given inline) or is marked **(unverified)**. A third tier exists and is labelled where it occurs: a claim marked **(via search summary; page not fetched)** comes from a web-search result's summary of a real page I did not open, so the page is real but the wording is second-hand. Recreation libraries (98.css, XP.css, 7.css) are cited as *recreation values*: they are one developer's careful reading of a Microsoft bitmap, not Microsoft's published spec. That distinction matters for a homage but not for a lawsuit.

**What I could not verify.** AIM's IM-window font, its exact chrome hexes, and its sound file names. Microsoft's own Luna title-bar hexes (only recreations are public). Facebook's chat-tab pixel width. The literal AIM strings "has signed on" / "has signed off". Each is flagged at the point of use.

---

## 1. Chat-window anatomy of the era, 2000s

### 1.1 AIM 5.x (2003 to 2005) and AIM 6 (2006)

AIM's IM window was a **tall, narrow, two-pane box**: title bar naming the screen name, an optional buddy-icon square on the right, a scrolling message log filling most of the height, a formatting bar (bold, italic, underline, font, colour, link, emoticon) as a strip of small toolbar buttons, a single-line-growing compose field, and a Send button bottom-right, with a status/warning strip along the bottom. The buddy list was a separate always-on-top window with collapsible groups (Buddies, Family, Co-Workers, Offline) and a count in each group header. **(unverified as to exact pixel metrics and hexes: no archived AIM stylesheet or published spec exists; the layout description above is from period screenshots and recall, not a fetched file.)**

Two facts are verifiable. The mascot was "a yellow stickman-like figure, often called the 'Running Man'", designed by JoRoan Lazaro and implemented in 1997, dropped in 2011 and brought back in 2013 ([Wikipedia, AIM](https://en.wikipedia.org/wiki/AIM_(software))). And the away message was a genuine social form, not a feature footnote: "teens and college students were known to use the messenger's away message feature to keep in touch with friends, often frequently changing their away message throughout a day" (same source). That is the single most useful behavioural precedent for this product, because our window is also a way of being present while absent.

Because AIM ran on Windows, its chrome was the OS chrome. On Windows 2000 and XP the system font was **8 point MS Shell Dlg 2, which maps to Tahoma** ([Microsoft, Fonts, UX guide](https://learn.microsoft.com/windows/win32/uxguide/vis-fonts#guidelines)); Tahoma is Matthew Carter's narrow companion to Verdana ([Microsoft, Tahoma font family](https://learn.microsoft.com/typography/font-list/tahoma)). So "AIM font" in practice means **Tahoma at 8pt, which is 11px at 96 DPI**, for every label, menu and button. The message-log font was user-selectable and shipped with a different default, which I could not verify.

The sounds are the era's strongest non-visual signature: a door-opening creak when a buddy signed on and a door-closing slam when they signed off, plus a separate incoming-message tone. Only secondary sources document this ([Defragg, history of AIM](https://defragg.com/history-of-aim-aol-instant-messenger/); [Door County Pulse](https://doorcountypulse.com/commentary-aol-instant-messenger-signs-off/); sound rips at [Myinstants "Door Open AIM"](https://www.myinstants.com/en/instant/door-open-aim-93903/) and ["Door Close AIM"](https://www.myinstants.com/en/instant/door-close-aim-30947/)). Treat "door open / door close" as a **verified convention** and the specific waveform as **(unverified)**.

**AIM 6.0** shipped November 2006, built on the "Triton" rewrite ([TechCrunch, AIM 6.0 Goes State of the Art](https://techcrunch.com/2006/11/15/aim-60-goes-state-of-the-art)). It was widely disliked: criticised as "more and more bloated with every release", resource-hungry, and ad-heavy, with many users staying on AIM Classic 5.9 (period forum threads, e.g. [Head-Fi, "AIM Triton sucks"](https://www.head-fi.org/threads/aim-triton-sucks-whats-better.160875/); [Joe Casabona, AIM 6.0](https://casabona.org/2007/03/aim-60/)). **Design lesson for us: the version people are nostalgic for is 5.x, not 6. The window that reads as "AIM" is the small square-cornered XP-era one, not the glossy 2006 refresh.**

### 1.2 AOL chat rooms

The room grammar is the direct ancestor of our system lines. A chat room had a **roster panel** listing every screen name present, a scrolling transcript, and a single-line input. The transcript mixed two speakers: people (`ScreenName: message`) and one non-person, **`OnlineHost:`**, which announced arrivals and departures with `X has entered the room.` and `X has left the room.` The mechanic that makes this worth copying is that the room itself is a character with its own name and its own voice, distinct from the humans. Our window has exactly that shape: a system speaker, two humans, no typing. Rooms were capped (23 or 25 people depending on room type) so the roster stayed short and the arrivals felt like events, not noise. **(unverified: the OnlineHost string casing, the trailing period, and the room caps. Wikipedia's [AOL Community Leader Program](https://en.wikipedia.org/wiki/AOL_Community_Leader_Program) and the retrospectives at [Vice](https://www.vice.com/en/article/aols-1995-chat-rooms-were-the-original-ask-me-anything/) and [Washington Post](https://www.washingtonpost.com/news/the-intersect/wp/2014/10/30/a-complete-history-of-the-rise-and-fall-and-reincarnation-of-the-beloved-90s-chatroom/) describe the rooms but do not quote the system strings or show a stylesheet.)** Since we are writing our own copy anyway (D-35), the safe move is to keep the *shape* (a named system speaker, enter/leave sentences in third person, a period at the end) and write our own words.

### 1.3 MSN Messenger 7 and Windows Live Messenger 8 (2005 to 2007)

Dates are verifiable ([Wikipedia, Windows Live Messenger](https://en.wikipedia.org/wiki/Windows_Live_Messenger)): **7.0 on 2005-04-07** introduced winks; **7.5 on 2005-08-23** added dynamic backgrounds and voice clips; the rename to Windows Live Messenger came with **8.0**, beta 2005-12-13 and final **2006-06-19**, then **8.1 on 2007-01-29**. The client added "customization for the nicknames of individual contacts, timestamps on messages ... and color schemes for the entire application", and from 6.0 onward "customizable elements such as emoticons, personalized avatars, and backgrounds".

Visually MSN 7 was the high-water mark of pre-Aero Windows gloss: a rounded window with a coloured gradient header (the green-to-white of the MSN butterfly era, later the blue of Windows Live), large display pictures for both parties flanking the log, a heavy formatting/emoticon strip, and a status line under the log reading "*X* is writing a message." The two interaction inventions worth naming: the **nudge**, which physically shook both windows ("Both your own and your contacts MSN Messenger window will shake", [trovster, MSN Messenger 7 review, 2005](https://www.trovster.com/blog/2005/04/msn-messenger-7-review)), and the **wink**, a full-window animation triggered by the other person. Both are *the remote party doing something to your window*. That is a mechanic we have a use for: the stranger's Claude finishing is an event that happens *to* your window.

**(unverified: the MSN 7 header gradient hexes and the exact string "is writing a message". No archived MSN stylesheet exists; MSN was a native Win32 app, so there is no CSS to fetch. Treat any hex you see quoted online for MSN green as a screenshot eyedrop.)**

### 1.4 iChat (Tiger 2005, Leopard 2007)

iChat arrived in Mac OS X 10.2 Jaguar in 2002 "with an Aqua interface featuring dialogue bubbles and buddy photos". Its layout is the closest historical relative of what we are building: **no chrome inside the log at all**. A single scrolling column of rounded speech bubbles, each tinted per speaker (the local user one colour, the remote user another), the speaker's photo squared off at the outside edge of each run of bubbles, and a compose field at the bottom. Nothing else. iChat AV added a video window whose feeds were stacked in perspective with a drop shadow, which is exactly the "two small feeds" problem we have.

The window chrome around it changed under our feet during the period: **Tiger 10.4 (2005) introduced the unified titlebar scheme** and **Leopard 10.5 (2007) extended the metal-like titlebar background down over the toolbar so the two read as one slab**, while **pinstriped backgrounds were removed entirely in Leopard** ([Wikipedia, Aqua](https://en.wikipedia.org/wiki/Aqua_(user_interface))). Pinstripes had already been "gradually toned down starting with Jaguar (10.2)". So "Aqua room, 2006" sits precisely on the seam: pinstripes present but faint, unified toolbar available, brushed metal still around (it "first appeared in QuickTime Player 4.0 (1999)" and was "phased out since Leopard").

The two Aqua facts that define the register are quotes, not hexes. Jobs: "it's liquid, one of the design goals was when you saw it you wanted to lick it." Pogue, less kindly: "lickable globs of Crest Berrylicious Toothpaste Gel" (both via the Wikipedia article above). And one behaviour worth stealing outright: **the blue default button pulsed** to prompt the user.

### 1.5 Yahoo! Messenger, briefly

Purple-and-yellow chrome, a buddy list with a large ad rail, IMVironments (themed animated backgrounds inside the IM window), audibles (an animated character speaks a canned line at the other person), and a genuinely loud "Yahooooo!" yodel on sign-in. Yahoo is the counter-example in this set: it is what happens when every surface is a slot for an ad or an animation. Cite it in a design review as the failure mode, not the model. **(unverified: colours, sizes, and feature dates. I did not fetch a Yahoo source.)**

### 1.6 IRC conventions

Worth separating protocol from client rendering, because the strings everyone remembers are **client** decisions.

The protocol side is exactly specified. When a user joins, the server relays `:WiZ!jto@tolsun.oulu.fi JOIN #Twilight_zone` to every channel member; leaving is `:WiZ!jto@tolsun.oulu.fi PART #playzone :I lost`; disconnecting is `:syrk!kalt@millennium.stealth.net QUIT :Gone to have lunch`; the topic is `:WiZ!jto@tolsun.oulu.fi TOPIC #test :New topic` ([RFC 2812](https://datatracker.ietf.org/doc/html/rfc2812)). **The RFC does not specify any human-readable text.** There is no "has joined" in the standard.

The familiar rendering, `*** Nick (user@host) has joined #channel`, is the client's own formatting, and clients differ. Verified from the fetched [mIRC IRC Options](https://www.mirc.com/help/html/irc_options.html) page: "The events dialog allows you to change the default display settings for channel-related events, such as joins, parts, etc.", and "Show short joins/parts. Checking this option makes mIRC display the join and part messages in a different, more compact format." So the display of a join is explicitly a per-user preference in the era's dominant client. mIRC also exposes per-event colours (`$color(join)`, `$color(part)`, `$color(quit)`) and a `/timestamp` option that stamps messages using `$asctime()` **(via search summary; pages not fetched: [WikiChip, /timestamp](https://en.wikichip.org/wiki/mirc/commands/timestamp))**. **(unverified: the literal default format string for any one client. The three-asterisk prefix is a strong convention, not a spec.)**

The transferable conventions: a **three-asterisk or similar non-alphabetic prefix** marks a line as system rather than speech; **`/me` renders in third person** as an italic action line rather than a quote (CTCP ACTION, a convention layered on PRIVMSG, not part of RFC 2812) **(unverified as to spec citation)**; the **topic** is a persistent one-line statement of what the room is for, pinned outside the scroll; **timestamps are opt-in per user** and are a fixed-width prefix when on.

---

## 2. Chat-window anatomy, 2010s

### 2.1 Facebook chat, 2008 to 2012 (verified palette)

I pulled the three stylesheets linked from the 2010-06-15 Wayback capture of `facebook.com` (fetched with the `id_` modifier so the archive's rewriting is excluded), from `static.ak.fbcdn.net/rsrc.php/zDDGA/hash/1260oeyv.css`, `zEMPN/hash/3wefa409.css` and `zLN4X/hash/bgt0tze9.css`. Verified from those files:

```css
font-family: "lucida grande", tahoma, verdana, arial, sans-serif;
```

That exact stack appears ten times across the three files with only quoting and casing varying. **`font-size: 11px` is the dominant size (32 declarations)**, ahead of 13px (12) and 9px (11). The palette, by frequency of use:

| Hex | Uses | Role |
| --- | --- | --- |
| `#fff` | 36 | surface |
| `#3b5998` | 35 | the Facebook blue, headers and primary chrome |
| `#333` | 17 | body text |
| `#6d84b4` | 13 | mid blue, secondary chrome and hovers |
| `#bdc7d8` | 8 | pale blue border |
| `#203360` | 6 | dark blue, pressed and deep chrome |
| `#f7f7f7`, `#f2f2f2` | 6, 6 | page greys |
| `#dd3c10` | 6 | the notification red |
| `#29447e` | 4 | dark blue text on light blue |
| `#d8dfea` | 4 | light blue fill |
| `#fff9d7` | 4 | the pale-yellow highlight strip |
| `#edeff4` | 3 | palest blue background |
| `#ffebe8` | 3 | error pink |

That is a genuinely disciplined system: **one hue, five steps of it, two accents (red for count, yellow for highlight), three greys, one text colour, one font stack, one size.** The chat window itself was a **docked tab in the bottom-right corner**, a header strip in the blue with the friend's name and a close X, a white log with plain left-aligned lines, no bubbles at first, an inline typing indicator, and a one-line input. Multiple tabs stacked leftward along the bottom edge. **(unverified: the tab's pixel width. It is commonly given as roughly 250 to 270 px; I could not find it in a fetched stylesheet, because chat CSS lived behind login.)**

**What polished retro borrows:** the tab-docked-to-a-screen-edge idea (our window is a real OS window, but the *size* and the *header-plus-log* proportion come from here), and the one-hue-five-steps discipline.

### 2.2 Gmail chat pop-out

Gmail's chat lived as a roster in the left rail under the label list, opened conversations as small windows stacked in the bottom-right, and offered a **"pop-out"** control that moved a conversation into its own browser window that survived navigating away from the inbox. That is precisely our mechanic and worth naming as prior art: **the reason a chat gets its own window is that the main surface is doing something else.** In our case the main surface is a terminal. **(unverified: dimensions and colours. Gmail CSS from that era is obfuscated and behind login.)**

### 2.3 Skype 4 and 5 (2009 to 2012)

Microsoft's own published guidance names the colour but does not print a hex. The fetched [Microsoft Learn, Skype URIs branding guidelines](https://learn.microsoft.com/en-us/skype-sdk/skypeuris/skypeuris_brandingguidelines) states only that brand elements come "in two colors: Skype Blue (preferred), White", that the white variant is used "only when your background conflicts with the element's Skype Blue variant", and that clear space means "maintaining 100% spacing or 16 pixels, whichever is larger". The hex **`#00AFF0`** and its Pantone Process Cyan C / CMYK 100/0/0/0 / RGB 0/175/240 equivalents, and the tint rule "100% for general use, 50% for straplines, and 20% for boxes", are consistently reproduced by colour references and by a circulated Skype brandbook deck **(via search summary; pages not fetched)**. Skype 5's chat used rounded bubbles with a tail, the local user's bubble tinted blue and the remote user's white or grey, timestamps hovering at the right edge of each bubble, and a large green call button and red hang-up button as the two dominant controls.

**What we borrow: the two-button colour law.** Green means start, red means end, and they are the largest, most saturated things on the surface. Our window has exactly one destructive primary action (Hang up), and Skype is the reason a red button in a call window needs no label to be understood. The reported tint discipline is also directly reusable whatever its provenance: one hue at 100%, 50% and 20% gives a chrome colour, a secondary and a panel fill, and that is how a single hue becomes a system.

### 2.4 Early Slack, 2014

Slack shipped with a dark plum sidebar against a white message column, the inverse of every other tool at the time. The original default theme's sidebar is **`#4D394B`**, part of an eight-value theme string commonly reproduced as `#4D394B, #5D475C, #8A7B89, #FFFFFF, #5D475C, #FFFFFF, #38978D, #E01E5A` (positions: sidebar background, hover background, active item, active item text, hover item, text, present indicator, mention badge) **(via search summary; page not fetched: [Suptask, Best Slack Themes](https://www.suptask.com/blog/best-slack-themes). I did fetch the [slack-theme project](https://github.com/slack-theme/slack-theme) README hoping for the source string and it contains no hex values, so that repo is named here for context only, not as the source.)** Slack's post-2019 brand aubergine is the different, brighter **`#4A154B`**. **(unverified against any Slack-published source. Treat `#4D394B` and `#38978D` as strong secondary: they are reproduced identically across many independent theme sites, which is weak evidence of a common origin and no evidence of correctness.)**

Two things transfer. First, **`#38978D` as the presence colour**: a desaturated teal-green, not a traffic-light green, which is why a Slack roster full of online people does not look like a Christmas tree. Our "3 people waiting" count and our meters want exactly that restraint. Second, **the sidebar/content inversion as the whole identity**: one dark surface, one light surface, and the brand lives entirely in the dark one. A two-surface split is cheap to execute and reads as designed.

### 2.5 iOS 6 to iOS 7, and Metro

**iOS 7 (2013)** stripped "stitched leather, green felt, wooden shelves, curling pages", replaced textures with white or "subtle punchy gradients", removed button backgrounds in favour of thin outlines, and flattened the icons. The typography overreached: the ultra-thin Helvetica Neue weights drew enough criticism on legibility grounds that Apple changed them by the third beta ([Creative Bloq, Apple ditches "too thin" font from iOS 7](https://www.creativebloq.com/app-design/apple-ditches-too-thin-font-ios7-7133513); [Typographica, Beyond Helvetica](https://typographica.org/on-typography/beyond-helvetica-the-real-story-behind-fonts-in-ios-7/); overview at [iMore](https://www.imore.com/ios/ios-7/jony-ive-killed-skeuomorphic-design-with-ios-7-ten-years-ago-and-he-was-right-to)).

**Metro** predates it: the Zune interface in **2006**, Windows Phone 7 in **2010**, Windows 8 in **2012**, superseded by Fluent in 2017. Its principles were "focused on typography and simplified icons, absence of clutter, increased content to chrome ratio", Segoe as the type system (Zegoe UI for Zune, Segoe WP for Windows Phone), flat colour tiles as "atomic units of information", and public-transport signage plus Swiss graphic design as the stated influences ([Wikipedia, Metro design language](https://en.wikipedia.org/wiki/Metro_(design_language))).

**What polished retro borrows from the flat era, and what it must not.** Borrow: the content-to-chrome ratio, the willingness to delete a border, the confidence to let type do the work. Do not borrow: thin weights at small sizes (iOS 7's own mistake, corrected in beta), and the removal of button *affordance*. In a window that is glanced at for one second while the user's attention is in a terminal, a control needs to look like a control. That is an argument for a pre-2013 grammar, not a post-2013 one.

---

## 3. OS chrome and textures that are CSS-recreatable

Values below are quoted from files I fetched. Where a value comes from a recreation library it is labelled as such.

### 3.1 Windows 98 bevels, from 98.css

Source file: [`jdan/98.css` `style.css`](https://raw.githubusercontent.com/jdan/98.css/main/style.css). Recreation values.

```css
--text-color: #222222;
--surface: #c0c0c0;
--button-highlight: #ffffff;
--button-face: #dfdfdf;
--button-shadow: #808080;
--window-frame: #0a0a0a;
--dialog-blue: #000080;
--dialog-blue-light: #1084d0;
--link-blue: #0000ff;

--border-raised-outer: inset -1px -1px var(--window-frame),
  inset 1px 1px var(--button-highlight);
--border-raised-inner: inset -2px -2px var(--button-shadow),
  inset 2px 2px var(--button-face);
--border-sunken-outer: inset -1px -1px var(--button-highlight),
  inset 1px 1px var(--window-frame);
--border-sunken-inner: inset -2px -2px var(--button-face),
  inset 2px 2px var(--button-shadow);
--border-field: inset -1px -1px var(--button-highlight),
  inset 1px 1px var(--button-shadow), inset -2px -2px var(--button-face),
  inset 2px 2px var(--window-frame);

.title-bar { background: linear-gradient(90deg, var(--dialog-blue), var(--dialog-blue-light)); }
```

Fonts in the same file: `body { font-family: Arial; font-size: 12px }`, and `"Pixelated MS Sans Serif", Arial` at `11px` for controls.

**Read this as a technique, not a look.** The four-shadow `--border-field` is the canonical **sunken panel**: dark on top-left, light on bottom-right, doubled. Invert it and you get a raised button. Two `box-shadow` insets at 1px and 2px is the entire 3D language of 1995 to 2001, and it costs nothing, never blurs, and stays crisp at any DPI. A message log wants `--border-field`; a button wants `--border-raised-outer` plus `--border-raised-inner`, swapping to sunken on `:active`.

### 3.2 Windows XP Luna, from XP.css

Source file: [`xp.css@0.2.6` `dist/XP.css`](https://cdn.jsdelivr.net/npm/xp.css@0.2.6/dist/XP.css). Recreation values, not Microsoft's; I found no public source for the real Luna bitmap hexes.

```css
.title-bar {
  background: linear-gradient(180deg, #0997ff, #0053ee 8%, #0050ee 40%,
    #06f 88%, #06f 93%, #005bff 95%, #003dd7 96%, #003dd7);
  border-top: 1px solid #0831d9;
  border-left: 1px solid #0831d9;
  border-right: 1px solid #001ea0;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
.title-bar-text { color: #fff; text-shadow: 1px 1px #0f1089; font-weight: 700; }

.window {
  box-shadow: inset -1px -1px #00138c, inset 1px 1px #0831d9,
    inset -2px -2px #001ea0, inset 2px 2px #166aee,
    inset -3px -3px #003bda, inset 3px 3px #0855dd;
  border-top-left-radius: 8px; border-top-right-radius: 8px;
}

button {
  border: none; background: #ece9d8; border-radius: 0;
  min-width: 75px; min-height: 23px; padding: 0 12px;
  box-shadow: inset -1px -1px #0a0a0a, inset 1px 1px #fff,
    inset -2px -2px grey, inset 2px 2px #dfdfdf;
}
button:not(:disabled):active {
  box-shadow: inset -1px -1px #fff, inset 1px 1px #0a0a0a,
    inset -2px -2px #dfdfdf, inset 2px 2px grey;
}
```

Three things are worth extracting even if you never ship Luna blue. **The eight-stop title bar** is the era's signature: a bright 1px lip at the very top, a fast fall to the body colour by 8%, a long flat middle, then a hard dark 3-stop terminator in the last 4% that reads as a bevel, not a gradient. **`#ece9d8`** is the XP button face and the single most period-correct "warm grey" available. **`min-height: 23px`** and **`min-width: 75px`** are the real XP button metrics and they are why XP UI feels dense.

The Luna title-bar typeface was Trebuchet MS Bold, succeeding MS Sans Serif and Tahoma ([BetaWiki, Luna](https://betawiki.net/wiki/Luna)) **(secondary source; not from a Microsoft spec)**. Everything else in XP is Tahoma 8pt per the Microsoft UX guide cited in section 1.1.

### 3.3 Windows 7 Aero glass, from 7.css

Source file: [`7.css` `dist/7.css`](https://cdn.jsdelivr.net/npm/7.css/dist/7.css) (v0.21.1). Recreation values.

```css
/* base */
font: 9pt "Segoe UI", "SegoeUI", "Noto Sans", sans-serif;

/* glass */
-webkit-backdrop-filter: blur(4px);
backdrop-filter: blur(4px);

/* window sheen over the frame colour */
background: linear-gradient(transparent 20%, #ffffffb3 40%, transparent 41%), var(--w7-w-grad);
background-color: #4580c4;

/* title text legible over arbitrary wallpaper */
color: #000;
text-shadow: 0 0 10px #fff, 0 0 10px #fff, 0 0 10px #fff, 0 0 10px #fff,
             0 0 10px #fff, 0 0 10px #fff, 0 0 10px #fff, 0 0 10px #fff;

/* button */
background: linear-gradient(var(--w7-el-bg) 45%, var(--w7-el-bg-s-1) 45%, var(--w7-el-bg-s-2));
border: 1px solid #8e8f8f;
border-radius: 3px;
```

Note `9pt` for Segoe UI, which matches Microsoft's own rule: "Segoe UI (pronounced 'SEE-go') is the Windows system font. The standard font size has been increased to 9 point" and "for Segoe UI, use a 9 point font size or larger" ([Microsoft, Fonts](https://learn.microsoft.com/windows/win32/uxguide/vis-fonts)). Segoe UI became the Windows default with Vista in 2007 ([Microsoft, Segoe UI font family](https://learn.microsoft.com/typography/font-list/segoe-ui#overview)).

Two reusable tricks here. The **repeated `text-shadow` glow** (the same shadow eight times to build opacity) is the correct way to keep dark text legible over an unpredictable background, and we will need it if text ever sits over a video feed. The **45% hard stop** in the button gradient is the Web 2.0 gloss split, expressed exactly.

### 3.4 Web 2.0 gloss: the 50% split, versus the 2009 clean gradient

The defining move of 2005 to 2009 is that a "glossy" surface is **two gradients with a hard boundary**, not one soft gradient. Top half: light to lighter, the simulated reflection. Bottom half: a darker base, sometimes with its own upward lift at the very bottom to fake bounced light. The terminator between them is a single hard stop, usually a little above centre (7.css uses 45%; period Photoshop tutorials place it "roughly half the top of the button", and typically add a white shape at **Overlay blend around 70% opacity**, sometimes a second at **Soft Light or Overlay at 30 to 70%** ([Photoshop Star, Designing Glossy Web 2.0 Badges](https://photoshopstar.com/star-badges/); [Cemetech, GIMP Trendy Glossy "Web 2.0" Buttons, 2006](https://www.cemetech.net/news/2006/12/277/_/gimp-tutorial-trendy-glossy-web-20-buttons))).

A CSS-native pair, so the difference is legible side by side:

```css
/* Web 2.0 gloss, 2006: hard split at 48% */
.gloss {
  background:
    linear-gradient(#7fc3ff 0%, #37a0f5 48%, #0d7fe0 48%, #0a63b8 100%);
  border: 1px solid #06529b;
  border-radius: 6px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.55), 0 1px 2px rgba(0,0,0,.25);
}

/* 2009 clean gradient: one soft ramp, one hairline lip, no split */
.clean {
  background: linear-gradient(#80bfff, #0180fe);
  border: none;
  border-radius: 4px;
}
```

The `.clean` recipe is the 2009 button verified in doc 05 (`#80BFFF` to `#0180FE`, borderless). **The single most efficient way to move a design from 2009 to 2006 is to add the hard stop; the way to move it forward is to delete it.**

**OKLab note, per the standing gradient rule.** Every gradient above was authored in sRGB, and that is part of why the era can look cheap: a blue-to-blue sRGB ramp dips grey and chalky through its middle. Author the period stops, then interpolate in OKLab and the same stops stay saturated:

```css
background: linear-gradient(in oklab, #80bfff, #0180fe);
```

Use `in oklab` for every ramp in the final design and keep the period endpoints. This is the concrete lever that separates "polished retro" from "screenshot of 2006".

### 3.5 Mac OS X Aqua: pinstripes, gel, brushed metal

**Pinstripes** are a 1px light-on-lighter horizontal rule repeated on a small pitch, at very low contrast. Apple published no CSS, and I could not verify the original pitch from a primary source **(unverified)**; recreations converge on a 4px pitch. Both variants, sRGB and OKLab:

```css
/* window/panel pinstripe, ~4px pitch, very low contrast */
.pinstripe {
  background-image: repeating-linear-gradient(
    #ffffff 0px, #ffffff 2px, #f2f2f2 2px, #f2f2f2 4px);
}
/* the fine, almost-invisible variant closer to 10.4 */
.pinstripe-fine {
  background-image: repeating-linear-gradient(
    to bottom, rgba(0,0,0,.035) 0 1px, transparent 1px 4px);
  background-color: #f4f4f4;
}
```

The `.pinstripe-fine` form is better practice: a transparent overlay pattern over a solid, so the panel colour is a single token you can change without re-deriving the stripe.

**Leopard / Snow Leopard unified toolbar.** The unified look "extends the title bar downwards and places icons on top of it, as if the window has one large title bar" (Wikipedia, Aqua, cited above), and the surface is a short vertical grey ramp with a bright 1px lip and a dark 1px terminator, sitting above a hairline that separates it from the content. No published spec exists, so this is **my own approximation, not a measured match**:

```css
.unified-toolbar {
  background-image: linear-gradient(in oklab, #e8e8e8, #c9c9c9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .7),   /* top lip */
    inset 0 -1px 0 #a8a8a8;                   /* terminator */
  border-bottom: 1px solid #9b9b9b;           /* separator from content */
}
.unified-toolbar.inactive {                   /* Aqua dims the whole chrome */
  background-image: linear-gradient(in oklab, #f3f3f3, #e4e4e4);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.6), inset 0 -1px 0 #cccccc;
  border-bottom-color: #c4c4c4;
}
```

The active/inactive pair matters more than the exact greys: Aqua used "drop shadows ... to separate and distinguish active from inactive windows" (same source), and a small always-on-top window that never signals focus state reads as a screenshot pasted on the desktop.

**Gel / glossy blue button.** Two fetched recipes. The period one, from a 2009 post ([girliemac, CSS3 Gradients: No Image Aqua Button](https://girliemac.com/blog/2009/04/30/css3-gradients-no-image-aqua-button/)):

```css
background-image: -webkit-gradient(linear, 0% 0%, 0% 90%,
  from(rgba(28, 91, 155, 0.8)), to(rgba(108, 191, 255, .9)));
-webkit-border-radius: 16px;
-moz-border-radius: 16px;
-webkit-box-shadow: rgba(66, 140, 240, 0.5) 0px 10px 16px;
/* separate gloss element on top: */
background-image: -webkit-gradient(linear, 0% 0%, 0% 95%,
  from(rgba(255, 255, 255, 0.7)), to(rgba(255, 255, 255, 0)));
```

and a modern one ([btxx.org, Aqua UI CSS Buttons](https://btxx.org/posts/aui/)):

```css
button {
  border: 1px solid #ccc;
  border-radius: 125px;
  box-shadow: inset 0 13px 25px rgba(255,255,255,0.5),
              0 3px 5px rgba(0,0,0,0.2),
              0 10px 13px rgba(0,0,0,0.1);
  font-family: 'Lucida Grande', Helvetica, Arial, sans-serif;
}
button.confirm { background: #4A90E2; border-color: #3672B6; color: #fff; }
button.cancel  { background: #D0D0D0; border-color: #B8B8B8; color: #6F6F6F; }
button:before {
  background: linear-gradient(rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);
  border-radius: 125px;
  content: ''; height: 50px; left: 4%; top: 1px; width: 92%; position: absolute;
}
```

Note the structure both share and that a single `background` cannot express: **a solid or gradient base, plus a separate gloss element inset from the edges (4% left, 92% wide, starting 1px down) that fades to nothing before the bottom.** The inset is the point. A gloss that runs edge to edge reads as plastic wrap; a gloss inset by a few percent reads as a curved surface. `--aqua-accent` plus `color-mix()` derived gel gradients is how a current library does the same thing with one variable ([igorfelipeduca/aqua](https://github.com/igorfelipeduca/aqua)).

**Brushed metal**: fine vertical noise over a grey vertical ramp. There is no published recipe; a serviceable CSS-only approximation is a repeating 1px vertical gradient at very low alpha over a `linear-gradient(#e8e8e8, #c9c9c9)` **(unverified as a match to Apple's texture)**. Aqua brushed metal first appeared in QuickTime Player 4.0 in 1999 and was phased out from Leopard onward (Wikipedia, Aqua). **Recommendation: skip it.** It is the one Aqua texture that has aged into pure kitsch.

**Noise.** For a subtle grain, an inline SVG `feTurbulence` as a `background-image` data URI at 2 to 4% opacity is the cheapest option and needs no asset:

```css
background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
```

**One texture, not five.** See rule 1 in section 4.

---

## 4. Retro-revival taste today

### 4.1 The discourse, with dates

**Frutiger Aero** is the name the revival gave to the 2005 to 2013 corporate gloss aesthetic: "glossy, reflective surfaces and skeuomorphic elements", "bright colors, especially blues and greens, three-dimensional graphics", and nature imagery, "blue skies, grass, aurorae, lens flares, and bokeh effects" ([Wikipedia, Frutiger Aero](https://en.wikipedia.org/wiki/Frutiger_Aero)). The term was coined by Sofi Xian of the **Consumer Aesthetics Research Institute**; Wikipedia dates the coinage to 2018 and the [Frutiger Aero Archive](https://frutigeraeroarchive.org/) to 2017 **(sources disagree; treat as "2017 or 2018")**. CARI's own framing gives the useful design reason for the gloss: Evan Collins notes companies adopted the style "to create a sense of friendliness and approachability", easing people who were "unfamiliar and uncomfortable" with technology into it **(via search summary; page not fetched. `frutigeraeroarchive.org` returned HTTP 403 to both fetch attempts, so this quote is second-hand and the wording should be checked before it is used in public copy.)** **That is our situation almost exactly.** We are asking someone to take an unsolicited audio call from a stranger. Friendliness and approachability is the brief, not irony.

The revival surged **early 2023 through 2024**, mostly among Gen Z, on YouTube and TikTok, and critics attributed it to "reactions against artificial intelligence proliferation and desire for alternatives to contemporary minimalist interfaces" (Wikipedia, as above). Note the irony that a Claude Code plugin is on the wrong side of that particular reaction; the counter is that this window is the *human* part of the tool.

The **Y2K revival** carried into 2025 and 2026 in design-trend writing: "glossy skeuomorphism and pre-flat design charm", "3D 'gel' buttons", "XP-style cloud wallpapers", pixel fonts and raw borders ([Setproduct, Retro and brutalist UI design: a 2026 field guide](https://www.setproduct.com/blog/retro-brutalist-ui-design-2026); [aigoodies, aesthetics in the AI era: visual and web design trends for 2026](https://aigoodies.beehiiv.com/p/aesthetics-2026)). **(Trend-blog tier. Directionally useful, not authoritative.)** The consistent stated motive across them is the same one Frutiger Aero writers give: AI-generated design converges on sameness, and deliberately dated, hand-made-feeling surfaces read as authored.

The **CSS libraries** are the practical face of it: [98.css](https://jdan.github.io/98.css/), [XP.css](https://botoxparty.github.io/XP.css/), [7.css](https://cdn.jsdelivr.net/npm/7.css/dist/7.css), and a family including NES.css, PSone.css and BOOTSTRA.386 ([retro-css list](https://github.com/matt-auckland/retro-css); [DEV, 10 Retro CSS frameworks](https://dev.to/khangnd/10-retro-css-frameworks-to-relive-your-childhood-nph)). **This is also the cheesiness risk.** Windows 9x and XP chrome is now the single most-used retro costume on the web. Wearing it unmodified reads as "I npm-installed a joke", which is the specific failure the brief is asking us to avoid.

### 4.2 Poolsuite as the exemplar, verified

[poolsuite.net](https://poolsuite.net/) is the canonical case of polished retro, and unlike AIM it is live and inspectable. Values below are from the live page on 2026-09-06, computed styles read in DevTools plus `poolsuite.net/css/index.5278903b.css`.

Palette, by usage across the DOM:

| Value | Hex | Role |
| --- | --- | --- |
| `rgb(246, 213, 213)` | `#f6d5d5` | body, dusty sun-bleached pink |
| `rgb(249, 239, 228)` | `#f9efe4` | root, warm cream |
| `rgb(249, 240, 233)` | `#f9f0e9` | panel fill, 37 elements |
| `#ffffff` | `#ffffff` | window and field surfaces, 33 elements |
| `rgb(250, 244, 198)` | `#faf4c6` | pale yellow accent, 15 elements |
| `rgb(175, 226, 229)` | `#afe2e5` | pale cyan accent, 7 elements |
| `rgb(251, 39, 141)` | `#fb278d` | hot pink, exactly 1 element |
| `#000000` | `#000000` | black background on 54 elements; every frame and rule reads as 1px black |

Type, from computed styles: **`Pixolde` at 16px** for the menu bar ("Become a member / Log in"), **`Ishmeria` at 16px** for the "Poolsuite" wordmark, **`Everyday` at 10px** for filenames, **`Everyday` at 8px** for the smallest labels ("Live"), **`ChiKareGo2` at 16px** for the now-playing header, and **`Pixelated Times New Roman` at 32px** for display. `Perfect DOS VGA 437` is loaded too. All are self-hosted woff2 (`/fonts/ChiKareGo2.171fcb10.woff2`, `/fonts/Everyday...`, `/fonts/PerfectDOSVGA437...`).

Four things it does that are directly transferable:

1. **Pixel type at native size, including 8px and 10px.** No pixel font is ever scaled off its grid. This is the whole reason it looks sharp rather than blurry-nostalgic.
2. **One structural colour, black, at 1px.** Black is the most-used background colour in the DOM (54 elements, measured), and every window frame, panel divider and control outline reads as a 1px black line in the rendered page. **(The 1px-line reading is from the screenshot, not from a measured border query.)** There are no bevels, no shadows, no gradients (the only `linear-gradient` in the stylesheet is Tailwind's unused placeholder). The era is carried by *type and layout*, not by chrome effects.
3. **A tiny number of saturated accents used sparingly.** Hot pink appears on exactly one element in the whole DOM.
4. **Custom cursors as a signature**: `/img/pointer-1.svg`, `pointer-3.svg`, `grab.svg`, `resize.svg`, `click.svg`, `insert.svg`. And a joke that costs nothing: the menu bar clock reads a fake date, `SUN 6 SEP 1997`, matched to today's weekday. The close control on windows is a martini glass.

Background, verified from the fetched [Wikipedia, Poolsuite](https://en.wikipedia.org/wiki/Poolsuite): "Poolsuite began as Poolside.FM in 2014, when founder Marty Bell launched an upbeat 1980s music" site; in **2019** it adopted "a Classic Mac OS-styled desktop environment to play 1980s music", with Grant MacLennan collaborating with Bell on that relaunch; a 2020 mobile app was "styled like a Nokia 3310 mobile phone". Note the correction to a common claim: the desktop metaphor is **Classic Mac OS**, not Windows 3.1 or 95, which matches the 1px black frames and square chrome in the live page. Period write-ups describe the build as done "pixel by pixel" by a perfectionist designer **(via search summary; pages not fetched: [Creative Boom](https://www.creativeboom.com/inspiration/poolside-fm-gets-a-refresh-with-a-90s-operating-system-in-your-browser-with-super-summer-music-and-vhs-visuals/), [Domus interview](https://www.domusweb.it/en/design/gallery/2020/07/08/poolsidefm-is-a-window-to-the-happiest-eighties-right-into-the-web-browser.html))**. The method is the finding either way: **it is not a CSS framework drop-in, it is a hand-drawn system with a consistent joke.**

### 4.3 Eight rules for retro without looking cheap

1. **One texture, and make it structural.** Pick pinstripes or noise or a bevel language, never two. Apple itself toned pinstripes down from 10.2 and deleted them by 10.5 (Wikipedia, Aqua), which is the strongest possible evidence that the texture was the weakest part.
2. **Period fonts at their native pixel size.** Tahoma at 11px (8pt) for XP-era, Segoe UI at 9pt minimum per Microsoft's own rule, Lucida Grande at 11 to 13px for Aqua, and any pixel font only at its designed size and integer multiples. Poolsuite's 8px and 10px labels are the proof.
3. **One era, one decade, one machine.** Do not put a Luna title bar on an Aqua panel. Every mixed-era pastiche reads as a costume shop.
4. **Gloss is a hard split, not a blur.** One terminator, slightly above centre (7.css uses 45%), and a gloss overlay inset from the edges so it reads as curvature. Edge-to-edge gloss reads as plastic wrap.
5. **Author period stops, interpolate in OKLab.** `linear-gradient(in oklab, ...)`. The 2006 hexes with a 2026 colour space is the entire "polished" delta, because sRGB's grey midpoint is a real part of why the era looks cheap.
6. **Pixel discipline: 1px means 1px.** Crisp `box-shadow` insets (98.css style) instead of blurred shadows, no fractional borders, no `border-radius` on a bevel that the era would have drawn square.
7. **Restrained sound: an event vocabulary, never decoration.** One short cue per state change, nothing on continuous data, nothing repeating. AIM had three sounds total and they are still recognisable thirty years later.
8. **No blink, no marquee, no fake activity, no CRT-scanline overlay on live video.** D-11 already rules out fake activity for product reasons; the same rule protects the look. Put the humour in **copy and one signature detail** instead, the way Poolsuite puts it in a martini-glass close button and a 1997 clock.

---

## 5. Three candidate directions for the tiny window

Common constraints for all three, from the decision log. Video is 360p Opus/VP8 at 16:9 (D-24). The stranger sees nothing about your task (D-30). The only task-derived thing they ever see is the 5-second goodbye (D-10). Sizes below are **content box**; a `window.open` popup adds roughly 30 to 70px of browser chrome depending on platform, and all three stay well inside D-34's 720 by 580 ceiling. Note the mechanic in one line: a browser cannot open a window with no gesture, so "opens by itself" means the popup is opened once on the existing user click, parked or hidden, then grown with `window.resizeTo` and focused on match, and shrunk or closed when the room empties.

Each direction assumes the same content: a title bar, a system-line log, a presence count, two audio meters (You, Stranger), and three actions (Hang up, Show my video, Report).

---

### Direction A: "AIM buddy window, 2004"

**Concept.** The window your friend's screen name used to open, except the friend is a stranger and the conversation is the room talking about itself.

**Palette (7).**

| Token | Hex | Role |
| --- | --- | --- |
| Frame | `#0831d9` | window bevel and title-bar border (XP.css) |
| Title | `#0053ee` | title-bar body, top of the 8-stop ramp |
| Face | `#ece9d8` | button face and control strip (XP.css) |
| Surface | `#ffffff` | the log, sunken |
| Ink | `#222222` | system-line text (98.css `--text-color`) |
| You | `#000080` | the "You:" label (98.css `--dialog-blue`) |
| Running-man yellow | `#ffcc00` | one accent only: the presence dot **(unverified as AIM's exact yellow)** |

**Fonts.** `Tahoma, "Segoe UI", Verdana, sans-serif` at **11px** for every label, control and system line, 11px bold for the title bar, `"Trebuchet MS"` bold 12px only if you want the Luna title voice. No web font. Tahoma ships on Windows, and Verdana is the correct fallback shape on macOS. **(Verified: 8pt MS Shell Dlg 2 maps to Tahoma on XP, Microsoft UX guide.)**

**Textures.** Exactly one: the 98.css `--border-field` sunken inset on the log, and its inverse on the buttons. No gradients anywhere except the title bar. No noise, no pinstripe.

**Sizes.** Lines-only **300 x 340**. Video **300 x 500**, adding a stacked pair of 276 x 155 feeds (16:9) above the log, which shrinks to five visible lines.

**System lines.** Left-aligned, 11px, 15px line-height, no bubbles, no avatars. Third-person system sentences in `#555` italic; speech lines with a bold coloured label and `#222222` body:

```
*  Stranger has entered the room.
   You: brb, my Claude needs me
   Stranger: back
*  Hanging up in 5.
*  Stranger has left the room.
```

Timestamps off by default, available as a `hh:mm` fixed-width `#999` prefix behind a preference, exactly the mIRC `/timestamp` convention.

**Count and meters.** The count sits in the title bar right side as `3 waiting`, 11px, white at 80%. Meters are two 60 x 6px sunken troughs (the `--border-field` recipe again) with a solid `#3b6e22` fill (the verified Facebook 2010 green, dark enough to sit inside a sunken trough without glowing), no gradient, no peak-hold, updating at 10 Hz.

**Signature detail.** A small yellow figure in the title bar left, our own drawing, not AOL's, that changes stance: standing when solo, running when a stranger is in the room, sitting when the countdown starts.

**Tradeoff.** Funniest and most legible of the three, and the copy grammar is native to it. But XP chrome is the most-copied retro costume on the web (section 4.1), so it starts one step closer to cheesy and has to be earned back with restraint. It is also the least "smooth" register available.

---

### Direction B: "Aqua room, 2006"

**Concept.** A Tiger-era utility window that happens to contain a stranger. Calm, glossy, slightly absurd, and quiet enough to sit beside a terminal for twenty minutes.

**Palette (7).**

| Token | Hex | Role |
| --- | --- | --- |
| Chrome | `#e8e8e8` | unified title bar and toolbar, top of the ramp |
| Chrome deep | `#c9c9c9` | bottom of the same ramp |
| Panel | `#f4f4f4` | the log panel, carrying the pinstripe |
| Ink | `#1c1c1c` | system-line text |
| Gel blue | `#4a90e2` | the primary control, from the fetched Aqua recipe |
| Gel blue deep | `#3672b6` | its border, same source |
| Alert red | `#dd3c10` | Hang up only (Facebook 2010's verified notification red, a warmer red than pure) |

**Fonts.** `"Lucida Grande", "Helvetica Neue", Helvetica, Arial, sans-serif` at **13px** for system lines and **11px** for labels and the count. Lucida Grande is present on every Mac and the Helvetica Neue fallback is close in colour on other platforms. If a Google Font is wanted for cross-platform consistency, **Nunito Sans** at the same sizes is the nearest available humanist with Lucida's open apertures. No thin weights, per iOS 7's own correction.

**Textures.** Exactly one: the fine pinstripe on the log panel at roughly 3.5% black on a 4px pitch (`.pinstripe-fine` from section 3.5). The title bar and toolbar are one slab using the `.unified-toolbar` recipe from section 3.5, including its inactive variant, which is the unified-toolbar move dated to Tiger 10.4 / Leopard 10.5. No brushed metal.

**Sizes.** Lines-only **360 x 288**. Video **360 x 420**, adding one stage panel holding two side-by-side 164 x 92 feeds (16:9) with 8px gutters, above a log that shrinks to five lines.

**System lines.** A single scrolling column, 13px, 19px line-height, **no bubbles for system lines and bubbles only for the two speakers**, which is the iChat rule and keeps the room's voice visually distinct from the people in it. System sentences are centred, `#8a8a8a`, 11px, with generous space above and below, so they read as stage directions. Speech gets a 12px-radius pill: yours right-aligned in `#dce9f8` with `#1c1c1c` text, the stranger's left-aligned in `#eeeeee`.

```
            Stranger has entered the room.

  Stranger: back                        (left pill)
                    brb, my Claude needs me   (right pill)

            Hanging up in 5.
            Stranger has left the room.
```

Timestamps off. If ever on, a 10px `#b0b0b0` right-aligned stamp on hover only, never a fixed column.

**Count and meters.** The count lives in the toolbar as small caps `3 people waiting on their Claudes`, 11px `#6a6a6a`, with a `#38978D` presence dot (Slack's classic present colour: desaturated, not traffic-light). Meters are two 70 x 4px rounded troughs in `rgba(0,0,0,.08)` with a `#38978D` fill and a 120ms ease-out on decay, sitting under each feed in video mode and under each speaker name otherwise.

**Signature detail.** **The pulsing default button, repurposed.** Aqua's blue default button pulsed to prompt the user (Wikipedia, Aqua). Ours does not pulse when idle, which would be nagging. It pulses **only during the five-second goodbye**, and it is labelled with the count: `Hang up (5)`, `(4)`, `(3)`. The one animation in the entire product is the one moment the product is about.

**On rule 3 (one era, one machine).** `#dd3c10` comes from Facebook 2010 and `#38978D` from Slack 2014, and that is deliberate. Rule 3 governs **chrome and type**, which here are Aqua and Lucida Grande with nothing borrowed from another decade. These two are utility colours chosen for a measured property (a warm red that is not alarm-red; a desaturated green that does not glow at small sizes), not era signifiers, and neither appears in a shape that reads as belonging to another system. Chrome is a costume; a level meter's fill is not.

**Tradeoff.** The most "polished and smooth" by construction, and the least-copied of the three costumes, so it starts further from cheesy. Two risks. Gloss is easy to overdo, so the design must hold to one glossy element (the button) and one texture (the pinstripe). And in 2026 an Aqua window can read as a Liquid Glass knockoff rather than a 2006 homage, which is an argument for keeping the frame square-shouldered and the type unmistakably Lucida.

---

### Direction C: "2010 flat chat"

**Concept.** The Facebook chat tab, promoted to its own window and given the polish it never had.

**Palette (7).** All seven verified from the 2010-06-15 Facebook stylesheets (section 2.1).

| Token | Hex | Role |
| --- | --- | --- |
| Header | `#3b5998` | title bar |
| Header hover | `#6d84b4` | control hovers, secondary chrome |
| Border | `#bdc7d8` | every hairline |
| Tint | `#edeff4` | log background, palest step |
| Surface | `#ffffff` | speech rows |
| Ink | `#333333` | text |
| Alert | `#dd3c10` | Hang up and the count badge |

**Fonts.** `"Lucida Grande", Tahoma, Verdana, Arial, sans-serif` at **11px**, exactly the verified 2010 stack and its dominant size, with 13px for the system lines so they stay readable at a glance. This is the period-correct stack, and it is why this direction is *not* a repeat of the rejected 2009 Omegle round: that round was 16px Arial on `#EEE` with `blue`/`red` keyword labels, which is Omegle's own idiosyncratic and unpolished choice (verified in doc 05). Facebook 2010 is the opposite: a designed system with one hue in five steps at one size.

**Textures.** None. One hairline `#bdc7d8`, one flat header, one tint. The polish comes entirely from spacing, from a 1px inner top highlight on the header (`inset 0 1px 0 rgba(255,255,255,.18)`), and from the count badge shape.

**Sizes.** Lines-only **268 x 320** (the chat-tab proportion). Video **268 x 460**, two stacked 244 x 137 feeds pinned above the log.

**System lines.** 13px, 20px line-height, full-width rows alternating `#ffffff` and `#edeff4`. System sentences in `#8b8b8b` with no prefix; speech with a `#3b5998` bold `You:` and a `#333333` bold `Stranger:`, deliberately not blue-versus-red, because the two-hue split is what made the 2009 round look unpolished.

**Count and meters.** The count is a `#dd3c10` pill badge in the header, `3`, with the sentence `people waiting on their Claudes` in 11px white at 70% beside it. Meters are 2px `#3b5998` underlines that grow from the left under each speaker name. Flattest possible reading of a level meter.

**Signature detail.** The window **docks**: when the room empties it does not vanish, it shrinks to a 268 x 32 header-only strip for two seconds showing `Stranger has left the room.` and then closes. The tab-collapse gesture of 2010, used as the exit animation.

**Tradeoff.** The most restrained and the easiest to make look professional, and it will never be accused of being a costume. But it is also the least funny, and it is the closest to the round David already rejected, so it has to win on execution rather than on idea. It is the safe answer, and the brief did not ask for safe.

---

### Recommendation: **B, "Aqua room, 2006"**

Five reasons.

1. **It matches the two adjectives that are hardest to hit together.** "Smooth" and "polished" are literally what Aqua was engineered to be, so restraint is the default rather than a discipline you have to impose. Direction A has to fight its own chrome to get there.
2. **The joke survives the polish.** "Funny" in this product lives in copy ("Stranger has entered the room." above a live call about nothing) and in one signature detail (a Hang up button that pulses only during the goodbye). Neither needs a loud costume. Poolsuite is the proof that a single consistent joke plus real craft beats five era references.
3. **It is the least-worn costume of the three.** 98.css and XP.css are everywhere (section 4.1). Aqua recreations exist but are rarer, and none of them is a one-line npm drop-in, which means the result will look authored.
4. **It is the right emotional register for the actual product.** CARI's account of why the era went glossy, to make unfamiliar technology "friendly and approachable" for people who were uncomfortable with it, is a precise description of asking a stranger to accept an unsolicited audio call. Direction C's flatness gives the user nothing to be reassured by; direction A's bevels are funny but not warm.
5. **It scales to the video state without redesign.** Aqua's grammar already had a "stage panel plus controls" idiom (iChat AV, QuickTime), so the two-feed state is a continuation rather than a second design.

**Execution rules, borrowed from the verified exemplar.** One texture (the pinstripe) and one gloss (the button). Every gradient `in oklab`. Lucida Grande at 13px and 11px, never scaled, never thin. One accent green (`#38978D`) for all presence and level, one red (`#dd3c10`) for the one destructive action, nothing else saturated. One animation in the entire product, the goodbye pulse. And one costless joke in a corner, Poolsuite-style, that does not move.

**If David wants it louder**, direction A is the fallback and the two are compatible at the copy layer: the system-line vocabulary in section 6 works unchanged in either. Do not blend them.

---

## 6. Copy and behaviour conventions to reuse

### 6.1 Away and presence copy

The away message is the era's genuinely useful invention and the one this product needs (Wikipedia, AIM, cited in 1.1). AIM prefixed the automatic reply with **"Auto response from *ScreenName*:"** followed by the user's own text **(convention widely attested in period forum posts; I could not verify the exact casing or punctuation from a primary source)**.

Our version, mapped to D-31's two pause kinds:

| Event | Line the stranger sees | Line you see |
| --- | --- | --- |
| Exact pause (permission request, AskUserQuestion, MCP elicitation) | `Stranger is away for a moment (their Claude needs them).` | `Your Claude needs you. The call stays on.` |
| Prose-question pause | same as above | same as above |
| Resume | `Stranger is back.` | nothing |
| Goodbye starts (D-10) | `Stranger's Claude finished. Hanging up in 5.` | `Your Claude finished. Hanging up in 5.` |
| Room empties | `Stranger has left the room.` | `Stranger has left the room.` |

Keep the AIM cadence: third person, one sentence, a full stop, no exclamation marks. The parenthetical is the joke and it should be the only one per line.

### 6.2 Enter and leave

AOL's `X has entered the room.` / `X has left the room.` is the shape. IRC's `*** Nick has joined #channel` is the same shape with a system prefix (section 1.6). We write our own words, per D-35. Rules: **third person, present perfect, terminal period, the room named as the place.** Never "Stranger joined" (too modern), never "Stranger has connected" (too technical), never an emoji.

A "topic" line is worth stealing from IRC: one fixed sentence pinned above the log that never scrolls, stating what the room is. `Two people are waiting on their Claudes.` That single line makes the empty state legible and gives the window a reason to exist when a stranger has left but the countdown has not finished.

### 6.3 Typing, which we do not have

There is no text input (brief). But the *slot* where "is typing" lived is the right place for the audio state. MSN's phrasing was `X is writing a message.` and Facebook's was an animated ellipsis. Our equivalent is the meter, which is a continuous "is speaking" indicator, so **do not also write a line for it.** Never emit a system line for a state that a meter already shows. That is rule 7 in section 4.3.

### 6.4 Status dot colours

Every client of the era used green / yellow / red / grey, and the semantics were stable: **green = available, yellow = away or idle, red = busy or do not disturb, grey = offline or appearing offline.** Windows Live Messenger showed "a green box ... to indicate that the friend is online" and "a yellow clock ... that they are away, and their computer has been idle", with Busy, Be Right Back, Away, On The Phone, Out to Lunch and Appear Offline as the status list **(secondary sources only; I could not find a Microsoft-published colour table)**.

For actual hexes, use Slack's classic Aubergine string, where the present-indicator slot is **`#38978D`** (section 2.4). It is the best value available because it is a *desaturated* green, so a window full of presence does not glow. Suggested set, three states only, since our model is simpler than a messenger's:

| State | Hex | Meaning |
| --- | --- | --- |
| In the room | `#38978D` | a stranger is connected |
| Away | `#c9a227` | their Claude needs them (D-31) **(our value, not sourced)** |
| Waiting alone | `#b0b0b0` | D-11's default state |

No red dot. Red is reserved for the Hang up button, so the eye never has to decide which red means what.

### 6.5 Title-bar flash

Already decided in D-14 and verified as Omegle's own 2009 trick in doc 05: alternate the document title between two forms every 500ms with a swapped favicon, cancel on any mousemove, keypress or focus. Nothing to add except one constraint that follows from this doc: **the flash and the sound must not both fire for the same event.** Sound for the arrival, flash for the arrival only if the window is not focused, and never both plus a system line plus a meter jump. One event, at most two channels.

### 6.6 Sound vocabulary, synthesised with WebAudio

AIM shipped three sounds: door open, door close, message received. That is the whole vocabulary and it is still recognisable. Ours needs three too: **enter, leave, countdown**. No audio files.

**Enter (door opening).** A rising two-note chime. Two triangle oscillators, 90ms each with a 70ms overlap, D5 to A5 (587.33 Hz to 880.00 Hz), each with an exponential gain ramp from `peak` to `0.0001`.

**Leave (door closing).** The same two notes reversed, 880.00 Hz to 587.33 Hz, 110ms each, sine rather than triangle so it lands softer.

**Countdown (wood-block knock).** A 25ms white-noise burst through a bandpass at 1200 Hz with `Q = 6`, one knock per second for the last three seconds only, not all five.

```js
// one gesture-gated context, reused; nothing plays before this resolves
let ctx;
async function arm() {              // call from D-12's existing first click
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") await ctx.resume();
}

const PEAK = 0.06;                  // about -24 dBFS, see etiquette below

function note(freq, at, dur, type = "triangle", peak = PEAK) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ctx.destination);
  o.start(at); o.stop(at + dur + 0.02);
}

export function enterCue() {        // rising: someone arrived
  const t = ctx.currentTime;
  note(587.33, t, 0.09); note(880.00, t + 0.07, 0.11);
}

export function leaveCue() {        // falling: the room emptied
  const t = ctx.currentTime;
  note(880.00, t, 0.11, "sine"); note(587.33, t + 0.09, 0.13, "sine");
}

export function knockCue() {        // countdown tick, last 3 seconds only
  const t = ctx.currentTime, n = 0.025;
  const buf = ctx.createBuffer(1, Math.round(ctx.sampleRate * n), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass";
  bp.frequency.value = 1200; bp.Q.value = 6;
  const g = ctx.createGain(); g.gain.value = PEAK * 0.8;
  src.connect(bp).connect(g).connect(ctx.destination);
  src.start(t);
}
```

**Volume etiquette.** `PEAK = 0.06` linear is roughly -24 dBFS, which is audible over a quiet room and inaudible over a video call, which is the correct asymmetry: the cue exists to reach someone looking at a terminal, not to interrupt a conversation. Hard rules:

- **Total duration under 300ms per cue.** No cue may be longer than the event it announces.
- **Nothing repeating.** The knock is the only repeat and it is capped at three.
- **Duck to `PEAK * 0.4` while a remote audio track is live**, so a cue during a call is a tap, not an interruption.
- **Nothing on meters, nothing on the count changing, nothing on hover, nothing on the video reveal.** Three events, three sounds, that is the entire vocabulary.
- **A mute toggle in the window, persisted in `localStorage`, and the state visible**, because a sound the user cannot find the source of is the worst possible outcome for a plugin that fires while they are working.
- **`AudioContext` needs a user gesture to start.** Piggyback on D-12's existing first click; never construct the context on load, because a suspended context that silently never resumes is the most common cause of "the chime does not work sometimes".

---

## 7. Sources

**Fetched and quoted directly.** Everything in this group was opened and read. Sources listed further down under "not fetched" were reached only through a web-search result's summary; their quotes are second-hand and are flagged as such at each point of use.

Files:

- 98.css stylesheet, https://raw.githubusercontent.com/jdan/98.css/main/style.css
- XP.css 0.2.6 distribution, https://cdn.jsdelivr.net/npm/xp.css@0.2.6/dist/XP.css
- 7.css 0.21.1 distribution, https://cdn.jsdelivr.net/npm/7.css/dist/7.css
- Facebook 2010 stylesheets, Wayback capture 2010-06-15 with the `id_` modifier: `static.ak.fbcdn.net/rsrc.php/zDDGA/hash/1260oeyv.css`, `zEMPN/hash/3wefa409.css`, `zLN4X/hash/bgt0tze9.css`, all reached from `https://web.archive.org/web/20100615000000id_/http://www.facebook.com/`
- poolsuite.net live page and `https://poolsuite.net/css/index.5278903b.css`, computed styles read in Chrome DevTools on 2026-09-06

Specifications and vendor documentation (all fetched):

- RFC 2812, Internet Relay Chat: Client Protocol, https://datatracker.ietf.org/doc/html/rfc2812
- Microsoft, Fonts (Windows UX guide), https://learn.microsoft.com/windows/win32/uxguide/vis-fonts
- Microsoft, Tahoma font family, https://learn.microsoft.com/typography/font-list/tahoma
- Microsoft, Segoe UI font family, https://learn.microsoft.com/typography/font-list/segoe-ui
- Microsoft, Skype URIs branding guidelines, https://learn.microsoft.com/en-us/skype-sdk/skypeuris/skypeuris_brandingguidelines
- mIRC, IRC Options, https://www.mirc.com/help/html/irc_options.html
- mIRC, on JOIN/PART, https://www.mirc.com/help/html/on_joinopart.html
- WikiChip, mIRC /timestamp, https://en.wikichip.org/wiki/mirc/commands/timestamp

Encyclopaedic (all fetched):

- Wikipedia, AIM (software), https://en.wikipedia.org/wiki/AIM_(software)
- Wikipedia, Windows Live Messenger, https://en.wikipedia.org/wiki/Windows_Live_Messenger
- Wikipedia, Aqua (user interface), https://en.wikipedia.org/wiki/Aqua_(user_interface)
- Wikipedia, Metro (design language), https://en.wikipedia.org/wiki/Metro_(design_language)
- Wikipedia, Frutiger Aero, https://en.wikipedia.org/wiki/Frutiger_Aero
- Wikipedia, Consumer Aesthetics Research Institute, https://en.wikipedia.org/wiki/Consumer_Aesthetics_Research_Institute
- Wikipedia, Poolsuite, https://en.wikipedia.org/wiki/Poolsuite (fetched)
- Wikipedia, AOL Community Leader Program, https://en.wikipedia.org/wiki/AOL_Community_Leader_Program

CSS recreations and technique (girliemac, btxx.org, Photoshop Star, slack-theme and both distribution files were fetched; the rest are listed for reference and were not opened):

- XP.css project page, https://botoxparty.github.io/XP.css/
- 98.css project page, https://jdan.github.io/98.css/
- igorfelipeduca/aqua, Mac OS X interface as a shadcn registry, https://github.com/igorfelipeduca/aqua
- girliemac, CSS3 Gradients: No Image Aqua Button (2009), https://girliemac.com/blog/2009/04/30/css3-gradients-no-image-aqua-button/
- btxx.org, Aqua UI CSS Buttons, https://btxx.org/posts/aui/
- Photoshop Star, Designing Glossy (Web 2.0) Badges, https://photoshopstar.com/star-badges/
- Cemetech, GIMP Tutorial: Trendy Glossy "Web 2.0" Buttons (2006), https://www.cemetech.net/news/2006/12/277/_/gimp-tutorial-trendy-glossy-web-20-buttons
- matt-auckland/retro-css, list of retro CSS frameworks, https://github.com/matt-auckland/retro-css
- DEV, 10 Retro CSS frameworks to relive your childhood, https://dev.to/khangnd/10-retro-css-frameworks-to-relive-your-childhood-nph
- slack-theme, colour scheme from Slack's default themes, https://github.com/slack-theme/slack-theme
- Suptask, Best Slack Themes, https://www.suptask.com/blog/best-slack-themes

Design history and revival discourse (Wikipedia entries above were fetched; the items in this group were not opened and are cited via search-result summaries):

- Frutiger Aero Archive, History, https://frutigeraeroarchive.org/history **(not fetched: the host returned HTTP 403 to two attempts. Everything attributed to it here is via a search-result summary.)**
- 512 Pixels, On the Past, Present and Future of Apple's Aqua User Interface, https://512pixels.net/2014/04/aqua-past-future/
- Creative Bloq, Apple ditches "too thin" font from iOS 7, https://www.creativebloq.com/app-design/apple-ditches-too-thin-font-ios7-7133513
- Typographica, Beyond Helvetica: The Real Story Behind Fonts in iOS 7, https://typographica.org/on-typography/beyond-helvetica-the-real-story-behind-fonts-in-ios-7/
- iMore, Jony Ive killed skeuomorphic design with iOS 7 ten years ago, https://www.imore.com/ios/ios-7/jony-ive-killed-skeuomorphic-design-with-ios-7-ten-years-ago-and-he-was-right-to
- Setproduct, Retro and brutalist UI design: a 2026 field guide, https://www.setproduct.com/blog/retro-brutalist-ui-design-2026
- aigoodies, aesthetics in the AI era: visual and web design trends for 2026, https://aigoodies.beehiiv.com/p/aesthetics-2026
- Creative Boom, Poolside FM gets a refresh with a '90s operating system in your browser, https://www.creativeboom.com/inspiration/poolside-fm-gets-a-refresh-with-a-90s-operating-system-in-your-browser-with-super-summer-music-and-vhs-visuals/
- Domus, Interview with Marty Bell, founder of poolside.fm, https://www.domusweb.it/en/design/gallery/2020/07/08/poolsidefm-is-a-window-to-the-happiest-eighties-right-into-the-web-browser.html

Not fetched. Reached via search-result summaries only, and used where nothing better exists. Every quote attributed to one of these is second-hand:

- BetaWiki, Luna, https://betawiki.net/wiki/Luna
- TechCrunch, AIM 6.0 Goes State of the Art (2006), https://techcrunch.com/2006/11/15/aim-60-goes-state-of-the-art
- Joe Casabona, AIM 6.0 (2007), https://casabona.org/2007/03/aim-60/
- Head-Fi, AIM Triton sucks, what's better? (2005), https://www.head-fi.org/threads/aim-triton-sucks-whats-better.160875/
- trovster, MSN Messenger 7 Review (2005), https://www.trovster.com/blog/2005/04/msn-messenger-7-review
- Defragg, The Forgotten History of AIM, https://defragg.com/history-of-aim-aol-instant-messenger/
- Door County Pulse, Remembering How AOL Instant Messenger Changed Communication, https://doorcountypulse.com/commentary-aol-instant-messenger-signs-off/
- Myinstants, Door Open AIM / Door Close AIM sound rips, https://www.myinstants.com/en/instant/door-open-aim-93903/ and https://www.myinstants.com/en/instant/door-close-aim-30947/
- Vice, AOL's 1995 Chat Rooms Were the Original 'Ask Me Anything', https://www.vice.com/en/article/aols-1995-chat-rooms-were-the-original-ask-me-anything/
- Washington Post, A complete history of the rise and fall of the beloved '90s chatroom, https://www.washingtonpost.com/news/the-intersect/wp/2014/10/30/a-complete-history-of-the-rise-and-fall-and-reincarnation-of-the-beloved-90s-chatroom/

Internal:

- `docs/research/05-omegle-ui-and-2009-web-design.md` for the verified 2009 Omegle tokens, the `#80BFFF` to `#0180FE` button, the title-flash trick and the count-polling pattern
- `docs/DECISIONS.md` for D-10, D-11, D-12, D-14, D-20, D-24, D-30, D-31, D-34, D-35
