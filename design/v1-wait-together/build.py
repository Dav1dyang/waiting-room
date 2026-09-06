#!/usr/bin/env python3
"""Generates the wait-together mockup artboards (.dc.html) and canvas.json.
Every value below is sourced from docs/research/05-omegle-ui-and-2009-web-design.md
(Omegle's 2009 stylesheet via Wayback captures) unless marked OURS.
Run: python3 build.py  then seed the canvas (see README)."""
import json

# ---------- 2009 tokens ----------
BODY = "Arial, 'Helvetica Neue', Helvetica, sans-serif"          # Omegle body, verbatim
ALT  = "'Lucida Grande', 'Lucida Sans Unicode', 'Segoe UI', sans-serif"  # Omegle's one heading
DENSE= "Verdana, Geneva, Tahoma, sans-serif"                      # 'other' chrome only
MONO = "'Courier New', Courier, monospace"
PAGE, SURF, BORDER, MUTED = '#EEEEEE', '#FFFFFF', '#CCCCCC', '#555555'
YOU, THEM = 'blue', 'red'                                         # CSS keywords, period-correct
BTN_TOP, BTN_BOT = '#80BFFF', '#0180FE'                            # sampled from chatbutton.png
DIS_TOP, DIS_BOT = '#BFBFBF', '#818181'
LINK, BETA_BG, NOTICE, ERROR = '#0000EE', '#f9f6ba', '#FFF9D7', '#FFEBE8'
BRAND = '#0180FE'   # OURS: wordmark uses the button blue, not Omegle's orange/blue logo pair

HEAD = '''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
    body { margin: 0; background: #DDDDDD; }
    a { color: %s; } a:hover { color: #551A8B; }
    * { box-sizing: border-box; }
    /* Dimensions for IE: */
    .logwrapper { _width: 96%%; _height: 250px; }
  </style>
</helmet>
''' % LINK
TAIL = '''</x-dc>
</body>
</html>
'''

def status(t, extra=''):
    """.statuslog: bold, #555, 0.9em, 0.5em below. Omegle 1.5."""
    return '<div style="padding-bottom:0.5em;font:bold 0.9em %s;color:%s;%s">%s</div>' % (BODY, MUTED, extra, t)

def notice(t):
    """Facebook-2009 pale yellow notice, for 'Your Claude needs you'."""
    return status(t, 'background:%s;padding:0.35em 0.5em;margin:0 0.5em 0.5em 0;' % NOTICE)

def bluebtn(label, disabled=False, size='1em', pad='0.75em 1.25em'):
    g = (DIS_TOP, DIS_BOT) if disabled else (BTN_TOP, BTN_BOT)
    return ('<span style="display:inline-block;padding:%s;border:0;border-radius:3px;'
            'background:linear-gradient(to bottom,%s 0%%,%s 100%%);color:#fff;font:%s %s;cursor:%s;">%s</span>'
            % (pad, g[0], g[1], size, BODY, 'default' if disabled else 'pointer', label))

def plainbtn(label, corner='left', armed=False, disabled=False, w='6em', h='78px'):
    """Omegle's 7em x 5em white button in a 1px #CCC wrapper, outer bottom corner rounded."""
    rad = 'border-bottom-left-radius:0.5em;' if corner == 'left' else 'border-bottom-right-radius:0.5em;'
    col = '#AAA' if disabled else '#000'
    return ('<span style="display:inline-block;border:1px solid %s;background:#fff;%s">'
            '<span style="display:inline-flex;align-items:center;justify-content:center;width:%s;height:%s;'
            'font:%s1em sans-serif;color:%s;%s">%s</span></span>'
            % (BORDER, rad, w, h, 'bold ' if armed else '', col, rad, label))

def wordmark(size='2em'):
    return ('<span style="display:inline-flex;align-items:baseline;gap:0.5em;">'
            '<span style="font:bold %s %s;color:%s;letter-spacing:-0.02em;">wait-together</span>'
            '<span style="font:0.9em %s;background:%s;padding:0 0.3em;">beta</span></span>'
            % (size, BODY, BRAND, BODY, BETA_BG))

def counter(n):
    return '<span style="font:bold 0.9em %s;color:%s;">%d people waiting on their Claudes</span>' % (BODY, MUTED, n)

def silhouette(w, h, dim=False):
    op = '0.35' if dim else '0.7'
    return ('<svg viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-label="no video yet">'
            '<rect width="%d" height="%d" fill="#D9D9D9"/>'
            '<g fill="#FFFFFF" opacity="%s" transform="translate(%d,%d)">'
            '<circle cx="0" cy="-26" r="26"/><path d="M-54,60 C-54,14 54,14 54,60 Z"/></g></svg>'
            % (w, h, w, h, w, h, op, w//2, h//2 + 10))

def video_frame(w, h, seed=0):
    g = ['linear-gradient(160deg,#7A8C99 0%,#3F4A54 55%,#26303A 100%)',
         'linear-gradient(200deg,#A38F7B 0%,#5C4E44 60%,#2E2722 100%)'][seed % 2]
    return ('<div style="width:%dpx;height:%dpx;background:%s;position:relative;overflow:hidden;">'
            '<div style="position:absolute;left:%dpx;top:%dpx;width:96px;height:120px;border-radius:50%%;background:rgba(255,255,255,.16);"></div></div>'
            % (w, h, g, w//2-48, h//2-36))

def meter(level):
    bars = ''.join('<span style="display:inline-block;width:5px;height:%dpx;background:%s;margin-right:2px;"></span>'
                   % (3 + i*2, '#39B54A' if i < level else '#D0D0D0') for i in range(7))
    return '<span style="display:inline-flex;align-items:flex-end;height:16px;">%s</span>' % bars

# ---------- popup (Omegle chat-screen geometry, video column at right) ----------
PW, PH = 720, 580
CHROME, HDR = 24, 40
VW, VH = 300, 225          # 4:3 feeds, two stacked = Omegle's 320x520 column scaled to fit

def popup(name, *, mine, log, panes, hang='Hang up', hang_armed=False, hang_disabled=False,
          video_label='Show my video', video_disabled=False, report_disabled=False, dim_stranger=False, countdown=None, count=4):
    def pane(label, who):
        if panes == 'video':
            body = video_frame(VW, VH, 0 if who == 'them' else 1)
        elif panes == 'audio':
            body = silhouette(VW, VH, dim=(dim_stranger and who == 'them'))
        else:
            body = '<div style="width:%dpx;height:%dpx;background:#E4E4E4;"></div>' % (VW, VH)
        lvl = 0 if panes == 'empty' else (5 if who == 'them' else 3)
        if dim_stranger and who == 'them': lvl = 0
        away = ('<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;'
                'background:rgba(255,255,255,.6);font:bold 0.9em %s;color:%s;">away for a moment</div>' % (BODY, MUTED)) if (dim_stranger and who == 'them') else ''
        color = THEM if who == 'them' else YOU
        return ('<div style="position:relative;width:%dpx;height:%dpx;background:#000;">%s%s</div>'
                '<div style="height:20px;display:flex;justify-content:space-between;align-items:center;padding:0 2px;'
                'font:bold 0.9em %s;color:%s;"><span>%s</span>%s</div>' % (VW, VH, body, away, BODY, color, label, meter(lvl)))
    loghtml = ''.join(log)
    big = ''
    if countdown is not None:
        big = ('<div style="position:absolute;left:0;right:0;bottom:8px;text-align:center;font:bold 7em %s;color:%s;line-height:1;">%s</div>'
               % (BODY, MUTED, countdown))
    log_w = PW - 16 - (VW + 16) - 16
    log_h = PH - CHROME - HDR - 16 - 8 - 80 - 16
    html = HEAD + '''<div style="width:%(PW)dpx;height:%(PH)dpx;background:%(PAGE)s;position:relative;overflow:hidden;font:16px/1.5 %(BODY)s;color:#000;border:1px solid #AAA;">
  <div style="height:%(CHROME)dpx;background:linear-gradient(#E8E8E8,#C9C9C9);border-bottom:1px solid #9C9C9C;display:flex;align-items:center;padding:0 8px;gap:6px;">
    <span style="width:11px;height:11px;border-radius:50%%;background:#EC6A5E;border:1px solid #C9483C;display:inline-block;"></span>
    <span style="width:11px;height:11px;border-radius:50%%;background:#F4BF4F;border:1px solid #C69A2E;display:inline-block;"></span>
    <span style="width:11px;height:11px;border-radius:50%%;background:#61C554;border:1px solid #3E9B33;display:inline-block;"></span>
    <span style="flex:1;text-align:center;font:11px %(ALT)s;color:#333;margin-right:45px;">wait-together</span>
  </div>
  <div style="position:absolute;left:16px;width:%(LOG_W)dpx;top:%(HDR_TOP)dpx;height:%(HDR)dpx;display:flex;justify-content:space-between;align-items:center;">
    %(wm)s<span style="font:bold 0.9em %(BODY)s;color:%(MUTED)s;">%(mine)s</span>
  </div>
  <div class="logwrapper" style="position:absolute;left:16px;top:%(LOG_TOP)dpx;width:%(LOG_W)dpx;height:%(LOG_H)dpx;background:#fff;border:1px solid %(BORDER)s;border-radius:0.5em 0.5em 0 0;padding:0.5em 0.5em 0 0.5em;overflow:hidden;">
    %(log)s%(big)s
  </div>
  <div style="position:absolute;left:16px;bottom:16px;width:%(LOG_W)dpx;height:80px;display:flex;align-items:stretch;">
    %(hang)s
    <div style="flex:1;margin:0 0.5em;background:#fff;border:1px solid %(BORDER)s;padding:0.5em;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.35em;">
      %(video)s
      <span style="font:0.8em %(BODY)s;color:%(MUTED)s;">%(mute)s</span>
    </div>
    %(report)s
  </div>
  <div style="position:absolute;right:16px;top:%(HDR_TOP)dpx;width:%(VW)dpx;">
    %(pane_them)s%(pane_you)s
  </div>
</div>
''' % dict(PW=PW, PH=PH, PAGE=PAGE, BODY=BODY, ALT=ALT, MUTED=MUTED, BORDER=BORDER, CHROME=CHROME, HDR=HDR,
           HDR_TOP=CHROME+8, LOG_TOP=CHROME+HDR+16, LOG_W=log_w, LOG_H=log_h, VW=VW,
           wm=wordmark('1.25em'), mine=mine, log=loghtml, big=big,
           hang=plainbtn(hang, 'left', armed=hang_armed, disabled=hang_disabled),
           mute=('<span style="color:#AAA;">Mute</span>' if video_disabled else '<a href="#">Mute</a>'),
           video=bluebtn(video_label, disabled=video_disabled, size='0.9em', pad='0.45em 0.8em'),
           report=plainbtn('Report', 'right', disabled=report_disabled),
           pane_them=pane('Stranger', 'them'), pane_you=pane('You', 'you')) + TAIL
    open(name + '.dc.html', 'w').write(html)

S = status
L_CONN = S('Connecting to the lobby...')
L_WAIT = S('Waiting for someone to wait for their Claude. Hang on.')
L_HI   = S("A random stranger is on the line. Say hi!")
L_BOTH = S("You're both waiting on your Claudes. Neither of you can do anything about it.")

popup('PopupIdle', mine='Claude idle', panes='empty',
      log=[S("Your Claude isn't working right now."), S('Give it something to do. After 30 seconds of work you join the queue.')],
      hang='Away', video_disabled=True, report_disabled=True)
popup('PopupWaiting', mine='Claude working 1:12', panes='empty',
      log=[L_CONN, L_WAIT], hang='Stop waiting', video_disabled=True, report_disabled=True)
popup('PopupCall', mine='Claude working 3:40', panes='audio',
      log=[L_CONN, L_WAIT, L_HI, L_BOTH])
popup('PopupVideo', mine='Claude working 6:05', panes='video',
      log=[L_CONN, L_WAIT, L_HI, L_BOTH, S('Stranger wants to turn on video. Click Show my video to agree.'), S("You're both on video now. Try not to look at yourself.")],
      hang='Sure?', hang_armed=True, video_label='Hide my video')
popup('PopupNeedsYou', mine='Claude needs you', panes='audio',
      log=[L_CONN, L_WAIT, L_HI, L_BOTH, notice('Your Claude needs you. The call stays on.')])
popup('PopupPaused', mine='Claude working 8:20', panes='audio', dim_stranger=True,
      log=[L_CONN, L_WAIT, L_HI, L_BOTH, S('Stranger is away for a moment. Their Claude needs them.')])
popup('PopupGoodbye', mine='Claude finished', panes='audio',
      log=[L_CONN, L_WAIT, L_HI, L_BOTH, S('Your Claude has finished. Hanging up in 5.')], countdown='5')
popup('PopupDisconnected', mine='Claude working 9:02', panes='empty',
      log=[L_CONN, L_WAIT, L_HI, L_BOTH, S("Stranger's Claude has finished. Hanging up in 5."), S('Stranger is gone.'), L_WAIT],
      hang='Stop waiting', video_disabled=True)

# ---------- home page (Omegle 2009 layout: fluid body, 160px right rail reserved) ----------
HW, HH = 1024, 768
def home(name, garnished=False):
    rail = ''
    sticker = ''
    social = ''
    if garnished:
        rail = ('<div style="width:160px;height:600px;border:1px solid %s;background:#fff;padding:12px 10px;display:flex;flex-direction:column;gap:10px;font:11px/1.4 %s;color:#333;">'
                '<div style="font:bold 12px %s;color:%s;">Programmable Mist Maker</div>'
                '<svg viewBox="0 0 140 140" width="138" height="138" role="img" aria-label="mist maker"><rect width="140" height="140" fill="#EAF3FB"/>'
                '<ellipse cx="70" cy="112" rx="42" ry="10" fill="#8FB8D9"/><rect x="52" y="70" width="36" height="42" rx="6" fill="#4C86B8"/>'
                '<circle cx="70" cy="52" r="6" fill="#B9D6EC"/><circle cx="58" cy="38" r="8" fill="#CFE3F3"/><circle cx="84" cy="34" r="10" fill="#DCEBF6"/><circle cx="66" cy="20" r="7" fill="#E7F1F9"/></svg>'
                '<div>A CR2032 will not run it. Everything else will.</div>'
                '<div>Kits, boards, and a library that works on the Uno.</div>'
                '<div style="margin-top:auto;font:bold 11px %s;color:%s;">shop.byproductlab.com</div>'
                '<div style="font:9px %s;color:#999;">house ad &middot; 160&times;600</div></div>'
                % (BORDER, DENSE, DENSE, BRAND, DENSE, LINK, DENSE))
        sticker = ('<div style="position:absolute;right:210px;top:66px;transform:rotate(8deg);background:%s;color:#B00;'
                   'font:bold 0.8em %s;padding:0.3em 0.8em;border:1px solid #E0C400;">NOW WITH AUDIO</div>' % (BETA_BG, BODY))
        social = ('<span style="display:inline-flex;gap:6px;align-items:center;font:11px %s;">'
                  '<span style="border:1px solid #9DACCF;background:#ECEFF5;color:#3B5998;padding:1px 5px;font-weight:bold;">Like</span>'
                  '<span style="border:1px solid #8FC7E0;background:#E9F5FB;color:#0084b4;padding:1px 5px;font-weight:bold;">Tweet</span>'
                  '<span style="border:1px solid #BBB;background:#fff;color:#333;padding:1px 5px;">Select language &#9662;</span></span>' % DENSE)
    else:
        rail = '<div style="width:160px;height:600px;"></div>'   # the reserved, empty gutter
    html = HEAD + '''<div style="width:%(HW)dpx;height:%(HH)dpx;background:%(PAGE)s;position:relative;overflow:hidden;font:16px/1.5 %(BODY)s;color:#000;">
  <div style="background:#fff;border-bottom:1px solid %(BORDER)s;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;">
    %(wm)s
    <div style="display:flex;align-items:center;gap:18px;">%(social)s%(count)s</div>
  </div>
  %(sticker)s
  <div style="position:absolute;left:16px;top:80px;right:192px;background:#fff;border:1px solid %(BORDER)s;border-radius:0.5em;padding:0 1em 1em;line-height:1.5;">
    <p style="margin:1em 0 0.75em;"><b>wait-together</b> is a way to meet a stranger while your Claude works. Once your Claude has been busy for 30 seconds, we find someone else whose Claude is also busy and put you on a call. When either Claude finishes, the call ends. Every wait, a different stranger.</p>
    <p style="margin:0 0 1em;">Calls are audio until you both click. Nobody sees what your Claude is doing. Calls are anonymous unless you say who you are (not recommended), and they are never recorded.</p>
    <h2 style="margin:0.5em 0 0.25em;text-align:center;font:1.25em %(ALT)s;color:#777;">Start a call</h2>
    <div style="text-align:center;">%(cta)s<div style="font:0.7em %(BODY)s;color:#AAA;margin-top:0.4em;">Opens a small window. Keep it next to your terminal.</div></div>
    <div style="display:flex;gap:2em;align-items:flex-start;margin-top:1.25em;padding-top:1em;border-top:1px solid %(BORDER)s;">
      <label style="display:flex;align-items:center;gap:0.5em;font:bold 0.9em %(BODY)s;color:%(MUTED)s;white-space:nowrap;">Invite code
        <span style="display:inline-block;width:9em;padding:0.2em 0.4em;border:1px solid %(BORDER)s;background:#fff;font:1em %(MONO)s;color:#000;font-weight:normal;">HELLO-2009</span></label>
      <label style="display:flex;align-items:flex-start;gap:0.5em;font:bold 0.9em %(BODY)s;color:%(MUTED)s;"><span style="display:inline-block;width:13px;height:13px;border:1px solid #777;background:#fff;margin-top:3px;flex:none;"></span><span>I am 18 or older and I will be decent to the stranger.</span></label>
    </div>
    <div style="margin-top:1em;font:0.9em %(BODY)s;color:%(MUTED)s;">Install the plugin, run <kbd style="font:0.95em %(MONO)s;background:#F4F4F4;border:1px solid %(BORDER)s;padding:0 0.3em;">/wait-together on</kbd>, open the link it prints. Quick answers never make a call. If your Claude asks you something mid-task, the call stays on and the stranger sees you are away for a moment.</div>
  </div>
  <div style="position:absolute;right:16px;top:80px;">%(rail)s</div>
  <div style="position:absolute;left:16px;right:192px;bottom:16px;font:0.9em %(BODY)s;color:%(MUTED)s;display:flex;justify-content:space-between;align-items:baseline;">
    <span style="font:bold 1.1em %(BODY)s;color:#000;"><span style="display:inline-block;width:0;height:0;border-left:5px solid #000;border-top:5px solid transparent;border-bottom:5px solid transparent;margin-right:8px;"></span>Send feedback to wait-together's staff</span>
    <span><a href="#">Rules</a> &middot; <a href="#">Privacy</a> &middot; <a href="#">Report a problem</a></span>
  </div>
</div>
''' % dict(HW=HW, HH=HH, PAGE=PAGE, BODY=BODY, ALT=ALT, MONO=MONO, BORDER=BORDER, MUTED=MUTED,
           wm=wordmark('2em'), social=social, count=counter(4), sticker=sticker,
           cta=bluebtn('Start waiting together', size='1.1em', pad='0.75em 1.5em'), rail=rail) + TAIL
    open(name + '.dc.html', 'w').write(html)

home('Main')
home('HomeGarnished', True)

# ---------- terminal ----------
def terminal():
    lines = [
        ('#8be9a0', '$ claude'),
        ('#c8ccd2', '&gt; /wait-together on'),
        ('#c8ccd2', 'wait-together: on'),
        ('#c8ccd2', 'Open this link once and keep the small window next to your terminal:'),
        ('#7fb3ff', 'https://wait-together.&lt;you&gt;.workers.dev/p/7f3a9c'),
        ('#c8ccd2', ''),
        ('#c8ccd2', '&gt; Refactor the parser, add tests, and fix whatever breaks.'),
        ('#c8ccd2', ''),
        ('#e0b35a', '&#10047; Simmering&hellip; (1m 12s &middot; 14 tool uses)'),
    ]
    body = ''.join('<div style="min-height:18px;color:%s;">%s</div>' % (c, t) for c, t in lines)
    html = HEAD + '''<div style="width:720px;height:360px;background:#14171C;border:1px solid #2B3038;border-radius:6px;overflow:hidden;font:13px/1.4 Menlo, Monaco, monospace;color:#c8ccd2;">
  <div style="height:26px;background:linear-gradient(#3A3F47,#2A2E35);display:flex;align-items:center;padding:0 10px;gap:6px;border-bottom:1px solid #1A1D22;">
    <span style="width:11px;height:11px;border-radius:50%%;background:#EC6A5E;display:inline-block;"></span>
    <span style="width:11px;height:11px;border-radius:50%%;background:#F4BF4F;display:inline-block;"></span>
    <span style="width:11px;height:11px;border-radius:50%%;background:#61C554;display:inline-block;"></span>
    <span style="flex:1;text-align:center;font:11px %s;color:#9aa3ad;margin-right:45px;">Terminal &mdash; claude</span>
  </div>
  <div style="padding:14px 16px;">%s</div>
</div>
''' % (ALT, body) + TAIL
    open('TerminalOn.dc.html', 'w').write(html)
terminal()

# ---------- canvas ----------
step = PW + 80
canvas = {
  "artboards": [
    {"file": "TerminalOn.dc.html", "x": 0, "y": 0, "w": 720, "h": 360, "title": "1 · Terminal: /wait-together on"},
    {"file": "Main.dc.html", "x": 820, "y": 0, "w": HW, "h": HH, "title": "2a · Home, faithful 2009 (empty ad rail)"},
    {"file": "HomeGarnished.dc.html", "x": 1944, "y": 0, "w": HW, "h": HH, "title": "2b · Home, garnished (house ad, sticker, social row)"},
    {"file": "PopupIdle.dc.html", "x": 0, "y": 920, "w": PW, "h": PH, "title": "3 · Popup: idle"},
    {"file": "PopupWaiting.dc.html", "x": step, "y": 920, "w": PW, "h": PH, "title": "4 · Popup: waiting"},
    {"file": "PopupCall.dc.html", "x": 2*step, "y": 920, "w": PW, "h": PH, "title": "5 · Popup: on a call (audio)"},
    {"file": "PopupVideo.dc.html", "x": 3*step, "y": 920, "w": PW, "h": PH, "title": "6 · Popup: video on, Hang up clicked once"},
    {"file": "PopupNeedsYou.dc.html", "x": 0, "y": 1620, "w": PW, "h": PH, "title": "7 · Popup: your Claude needs you"},
    {"file": "PopupPaused.dc.html", "x": step, "y": 1620, "w": PW, "h": PH, "title": "8 · Popup: stranger is away (their Claude needs them)"},
    {"file": "PopupGoodbye.dc.html", "x": 2*step, "y": 1620, "w": PW, "h": PH, "title": "9 · Popup: your Claude has finished"},
    {"file": "PopupDisconnected.dc.html", "x": 3*step, "y": 1620, "w": PW, "h": PH, "title": "10 · Popup: stranger disconnected, waiting again"},
  ],
  "annotations": [
    {"id": "note-home", "x": 820, "y": -150, "w": 560, "text": "Home page, two humor levels (Q-17). 2a keeps the 2009 reference layout faithfully (research 05): fluid page, a 160px ad rail reserved on the right and left empty. 2b fills the rail with a house ad for your Mist Maker and adds a sticker and the 2012-style Like / Tweet / Translate row. Values from research 05: Arial 16px, #EEE page, #CCC borders, the blue gradient button with no border."},
    {"id": "note-popup", "x": 0, "y": 800, "w": 700, "text": "Popup states in the order of one call. 720 x 580 (Q-12). Layout follows the 2009 reference chat screen (research 05): log box, a 5em control bar with 7em-wide white buttons, and the two feeds stacked in one column at the right. Audio first; video after both click. The stranger sees nothing about your task except the countdown."},
    {"id": "note-pause", "x": 0, "y": 1515, "w": 700, "text": "Screens 7 and 8 are the two sides of the pause rule (D-31, Q-13). 7: your Claude needs you, pale yellow notice, call stays on. 8: what the stranger sees while you are away. Screen 9 is the only task-related thing a stranger ever sees: the countdown."},
    {"id": "note-typed", "x": 3*step, "y": 1515, "w": 420, "text": "Q-18: with typed chat, the middle cell of the control bar becomes a textarea and the log gains blue You: and red Stranger: lines. Not drawn; not in alpha unless you want it."},
  ],
  "launch": {"view": "canvas"}
}
json.dump(canvas, open('canvas.json', 'w'), indent=2)
print('built', len(canvas['artboards']), 'artboards')
