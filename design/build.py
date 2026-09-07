#!/usr/bin/env python3
"""waiting-room mockup v2.2: generates the .dc.html artboards and canvas.json.

Direction (accepted, D-59): a Classic Mac OS room window in the Poolsuite grammar.
Tokens and anatomy come from research 09 (D-76, D-77) and the mechanics from research 10 (D-64, D-74) and automatic connect (D-79):
flat pastel desktop tints (Pool default), black at 1px, cream panel, two pastel button fills, one yellow
highlight, one red live dot, eight 1-bit icons on an 11x11 grid drawn as inline SVG, ledge buttons,
two 28-bar RMS meters, ChiKareGo2 at 16px with -1px tracking, Geneva 12px lines, a 6px inner panel so the
frame reads double, the dot screen on video as a CSS overlay (no blend mode), and the pick-up click.

Fonts: ChiKareGo2 by Giles Booth (CC BY, see fonts/README.md). Nothing here is an Apple or Poolsuite asset.
Run: python3 build.py, then seed (see README.md).
"""
import base64
import json
import os

# ---------- tokens (research 09 section 3, OURS) ----------
W = 380
INK, PAPER, CREAM = '#000000', '#FFFFFF', '#F5EEDF'
HILITE = '#FFF1A8'                      # the one line that matters now
LIVE = '#D01D21'                        # the mic is live; the only other colour with meaning
TINTS = [('Pool', '#91CECF'), ('Shell', '#E6B1B2'), ('Mint', '#A7CDAB'), ('Dusk', '#BBBCE9')]
DESK = TINTS[0][1]
CYAN, BLUSH = '#B7E7E8', '#FBD0D0'       # the one default action; hang up
CHI = "'ChiKareGo2', 'Chicago', Geneva, Verdana, sans-serif"
GEN = "Geneva, Verdana, 'Lucida Grande', sans-serif"
TB, TOPIC, PAD, LOGH, STATUS, CTL, FEEDH = 20, 24, 6, 106, 22, 44, 99

FONT_B64 = ''
if os.path.exists('fonts/ChiKareGo2.ttf'):
    FONT_B64 = base64.b64encode(open('fonts/ChiKareGo2.ttf', 'rb').read()).decode()

DITHER = ("background-color:#fff;background-image:conic-gradient(#000 25%,transparent 0 50%,"
          "#000 0 75%,transparent 0);background-size:2px 2px")

# ---------- icons: 11x11, 1-bit, from research 09 section 3.3 ----------
ICONS = {
 'door': """.#########.
.#.......#.
.#.......#.
.#.......#.
.#.......#.
.#.....#.#.
.#.......#.
.#.......#.
.#.......#.
.#.......#.
.#########.""",
 'hangup': """...........
...........
###.....###
###.....###
###.....###
.#########.
..#######..
...........
.#########.
...........
...........""",
 'camera': """...........
...........
.#######...
.#.....#...
.#.....####
.#.....#..#
.#.....#..#
.#.....####
.#######...
...........
...........""",
 'flag': """.#.........
.########..
.#......#..
.#......#..
.#......#..
.########..
.#.........
.#.........
.#.........
.#.........
.#.........""",
 'speaker': """...........
....#......
...##..#...
..###.#..#.
#####.#..#.
#####.#..#.
#####.#..#.
..###.#..#.
...##..#...
....#......
...........""",
 'muted': """...........
....#......
...##......
..###.#...#
#####..#.#.
#####...#..
#####..#.#.
..###.#...#
...##......
....#......
...........""",
 'person': """...###.....
..#...#....
..#...#....
...###.....
...........
..#####....
.#.....#...
.#.....#...
.#.....#...
.#.....#...
.#.....#...""",
 'watch': """...#####...
...#...#...
..#######..
.##.....##.
.#...#...#.
.#...###.#.
.#.......#.
.##.....##.
..#######..
...#...#...
...#####...""",
 'shade': """...........
...........
...........
...........
...........
.#########.
...........
...........
...........
...........
...........""",
}


def icon(name, color=INK, extra=''):
    rows = ICONS[name].split('\n')
    rects = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1"/>'
                    for y, r in enumerate(rows) for x, ch in enumerate(r) if ch == '#')
    return (f'<svg class="ic" viewBox="0 0 11 11" width="11" height="11" fill="{color}" '
            f'shape-rendering="crispEdges" style="{extra}">{rects}</svg>')


CSS = '''
@font-face{font-family:'ChiKareGo2';src:url(data:font/ttf;base64,@B64) format('truetype');font-display:block}
*{box-sizing:border-box}
body{margin:0;background:@DESK}
.desk{position:relative;width:100%;height:100%;background:@DESK}
.win{position:absolute;background:@CREAM;border:1px solid @INK;box-shadow:1px 1px 0 @INK;font:12px/18px @GEN;color:@INK}
.ic{display:inline-block;vertical-align:-1px;image-rendering:pixelated}
.tb{position:relative;height:@TBpx;background:@PAPER}
.tb .stripes{position:absolute;left:3px;right:3px;top:4px;height:11px;background:repeating-linear-gradient(@INK 0 1px,@PAPER 1px 2px)}
.tb .title{position:absolute;left:50%;top:0;transform:translateX(-50%);padding:0 7px;background:@PAPER;font:16px/19px @CHI;letter-spacing:-1px;white-space:nowrap}
.tb .box{position:absolute;top:4px;width:11px;height:11px;border:1px solid @INK;background:@PAPER}
.tb .door{position:absolute;left:8px;top:4px;width:11px;height:11px;background:@PAPER}
.tb .door .ic{position:absolute;left:0;top:0}
.tb .zoom{right:8px}
.tb .zoom:after{content:'';position:absolute;left:0;top:0;width:6px;height:6px;border-right:1px solid @INK;border-bottom:1px solid @INK}
.tb .shadebox{right:24px}
.tb .shadebox .ic{position:absolute;left:-1px;top:-1px}
.topic{min-height:@TOPICpx;padding:4px 9px 3px;border-top:1px solid @INK;background:@CREAM;font:12px/16px @GEN;display:flex;align-items:flex-start;gap:6px}.topic .ic,.topic .dot,.topic .live{margin-top:4px}.topic .text{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-width:0}
.dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:@PAPER;border:1px solid @INK}
.live{display:inline-block;width:4px;height:4px;border-radius:50%;background:@LIVE;box-shadow:0 0 0 3px rgba(208,29,33,.28);margin:0 3px 0 2px}
.body{padding:@PADpx;border-top:1px solid @INK;background:@CREAM}
.log{position:relative;height:@LOGHpx;padding:8px 26px 6px 10px;overflow:hidden;background:@PAPER;border:1px solid @INK}
.log p{margin:0}
.log .sys:before{content:'***';display:inline-block;width:24px;letter-spacing:1px}
.log .sys.soft{color:#6b6b6b}
.log .say b{font:16px/16px @CHI;letter-spacing:-1px;font-weight:normal}
.log .hi{background:@HILITE;margin:0 -6px;padding:0 6px}
.log .big{position:absolute;right:34px;bottom:0;font:64px/64px @CHI;letter-spacing:-2px}
.sb{position:absolute;top:0;right:0;bottom:0;width:16px;border-left:1px solid @INK;@DITHER}
.sb .up,.sb .dn{position:absolute;left:0;width:15px;height:15px;background:@PAPER}
.sb .up{top:0;border-bottom:1px solid @INK}
.sb .dn{bottom:0;border-top:1px solid @INK}
.sb .up:after{content:'';position:absolute;left:3px;top:4px;border:4px solid transparent;border-top:0;border-bottom:5px solid @INK}
.sb .dn:after{content:'';position:absolute;left:3px;top:5px;border:4px solid transparent;border-bottom:0;border-top:5px solid @INK}
.sb .thumb{position:absolute;left:0;width:15px;height:24px;background:@PAPER;border-top:1px solid @INK;border-bottom:1px solid @INK}
.status{height:@STATUSpx;margin-top:@PADpx;padding:0 2px;font:11px/22px @GEN;display:flex;justify-content:space-between;align-items:center;white-space:nowrap}
.status > span{display:inline-flex;align-items:center;gap:6px}
.meter{display:inline-flex !important;align-items:flex-end !important;gap:1px !important;width:84px;height:11px;border-bottom:1px solid @INK;padding-bottom:0;flex:none;overflow:hidden}
.meter i{display:block;width:2px;background:@INK;flex:none}
.meter i.peak{margin-left:auto}
.ctl{height:@CTLpx;border-top:1px solid @INK;background:@CREAM;padding:0 10px;display:flex;gap:8px;align-items:center}
.btn{display:inline-block;height:22px;padding:0 10px;min-width:64px;text-align:center;border:1px solid @INK;border-radius:4px;background:@PAPER;box-shadow:0 1px 0 0 @INK,inset 0 1px 0 0 @PAPER;font:16px/20px @CHI;letter-spacing:-1px;color:@INK;white-space:nowrap}
.btn.cyan{background:@CYAN}
.btn.blush{background:@BLUSH}
.btn.dis{color:#999;border-color:#000;border-style:dotted;background:@CREAM;box-shadow:none}
.btn.def{box-shadow:0 1px 0 0 @INK,0 0 0 2px @PAPER,0 0 0 5px @INK}
.snd{display:inline-flex;align-items:center;gap:5px;font:11px/12px @GEN;margin-left:auto;white-space:nowrap}
.stage{display:flex;gap:@PADpx;margin-bottom:@PADpx}
.feed{position:relative;flex:1;height:@FEEDHpx;border:1px solid @INK;background:@PAPER;overflow:hidden}
.feed .scene{position:absolute;inset:0;background:linear-gradient(180deg,#A9D6E6 0%,#F4E3CB 58%,#D8B892 100%);filter:contrast(1.12) saturate(.9) sepia(.08)}
.feed .bodyish{position:absolute;left:50%;bottom:-1px;transform:translateX(-50%);width:84px;height:40px;border-radius:42px 42px 0 0;background:#2E3340}
.feed .head{position:absolute;left:50%;bottom:44px;transform:translateX(-50%);width:34px;height:36px;border-radius:50%;background:#3A3F4C}
.feed .dots{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(0,0,0,.60) 0 .8px,transparent 1px);background-size:3px 3px;pointer-events:none}
.feed .cap{position:absolute;left:-1px;bottom:-1px;padding:0 5px;background:@PAPER;border:1px solid @INK;font:9px/13px @GEN;display:inline-flex;align-items:center;gap:4px}
.radio{display:inline-flex;align-items:center;font:12px/14px @GEN;margin-right:12px}
.radio i{display:inline-block;width:12px;height:12px;border:1px solid @INK;border-radius:50%;background:@PAPER;margin-right:5px;position:relative}
.radio i.on:after{content:'';position:absolute;left:2px;top:2px;width:6px;height:6px;border-radius:50%;background:@INK}
.radio b{display:inline-block;width:14px;height:14px;border:1px solid @INK;margin-right:4px}
.cb{display:inline-block;width:12px;height:12px;border:1px solid @INK;background:@PAPER;flex:none;margin-top:3px}
.cb.on{background-image:linear-gradient(45deg,transparent 45%,@INK 45% 55%,transparent 55%),linear-gradient(-45deg,transparent 45%,@INK 45% 55%,transparent 55%)}
.note{position:absolute;font:10px/14px @GEN;color:@INK;background:@HILITE;border:1px solid @INK;padding:4px 6px;max-width:220px}
'''
for k, v in [('@B64', FONT_B64), ('@DESK', DESK), ('@PAPER', PAPER), ('@INK', INK), ('@CREAM', CREAM),
             ('@HILITE', HILITE), ('@LIVE', LIVE), ('@CYAN', CYAN), ('@BLUSH', BLUSH), ('@GEN', GEN), ('@CHI', CHI),
             ('@DITHER', DITHER), ('@TBpx', f'{TB}px'), ('@TOPICpx', f'{TOPIC}px'), ('@PADpx', f'{PAD}px'),
             ('@LOGHpx', f'{LOGH}px'), ('@STATUSpx', f'{STATUS}px'), ('@CTLpx', f'{CTL}px'), ('@FEEDHpx', f'{FEEDH}px')]:
    CSS = CSS.replace(k, v)

HEAD = '''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>''' + CSS + '''</style>
</helmet>
'''
TAIL = '''</x-dc>
</body>
</html>
'''
FRAMES = {}


def write(name, body, w, h, desk=DESK):
    open(f'{name}.dc.html', 'w').write(HEAD + f'<div class="desk" style="width:{w}px;height:{h}px;background:{desk};">\n' + body + '</div>\n' + TAIL)
    FRAMES[name] = (w, h)


# ---------- pieces ----------
def titlebar(title):
    return (f'<div class="tb"><div class="stripes"></div><span class="door">{icon("door")}</span>'
            f'<span class="title">{title}</span><span class="box shadebox">{icon("shade")}</span><span class="box zoom"></span></div>\n')


def count_line(others, state):
    """state: 'queued' (watch icon, hollow dot), 'knock' (person, hollow), 'live' (person, red live dot)."""
    if others == 0:
        text = 'Nobody else is waiting right now. Your Claude is still working.'
    elif others == 1:
        text = '1 other is waiting for their Claude.'
    else:
        text = f'{others} others are waiting for their Claude.'
    lead = icon('watch') if state == 'queued' else icon('person')
    mark = '<span class="live"></span>' if state == 'live' else '<span class="dot"></span>'
    return f'<div class="topic">{lead}{mark}<span>{text}</span></div>\n'


def line(kind, text):
    if kind == 'sys':
        return f'<p class="sys">{text}</p>'
    if kind == 'soft':
        return f'<p class="sys soft">{text}</p>'
    who, hi = kind.split('-') if '-' in kind else (kind, '')
    label = 'YOU' if who == 'you' else 'STRANGER'
    return f'<p class="{"say hi" if hi else "say"}"><b>{label}:</b> {text}</p>'


def log(lines, *, big=None, thumb_top=16):
    body = ''.join(line(k, t) for k, t in lines)
    if big is not None:
        body += f'<div class="big">{big}</div>'
    sb = f'<div class="sb"><span class="up"></span><span class="thumb" style="top:{thumb_top}px"></span><span class="dn"></span></div>'
    return f'<div class="log">{body}{sb}</div>\n'


def meter(level, peak=None):
    """D-77: 28 bars at a 3px pitch, lit from the left, unlit absent, a peak-hold bar, 1px baseline."""
    lit = round(level / 5 * 28)
    bars = ''.join(f'<i style="height:{2 + round(i * 8 / 27)}px;"></i>' for i in range(lit))
    if peak and peak > lit:
        gap = (peak - lit - 1) * 3
        bars += f'<i style="height:{2 + round(peak * 8 / 27)}px;margin-left:{gap}px;"></i>'
    return f'<span class="meter">{bars}</span>'


def status(you, them, you_peak=None, them_peak=None):
    return (f'<div class="status"><span>YOU {meter(you, you_peak)}</span>'
            f'<span>STRANGER {meter(them, them_peak)}</span></div>\n')


def controls(kind, sounds=True):
    snd = f'<span class="snd">{icon("speaker" if sounds else "muted")}Sounds</span>'
    if kind == 'room':
        b = '<span class="btn blush">Hang up</span><span class="btn cyan">Show video</span><span class="btn">Report</span>'
    elif kind == 'video':
        b = '<span class="btn blush">Hang up</span><span class="btn">Hide video</span><span class="btn">Report</span>'
    elif kind == 'closing':
        b = '<span class="btn blush def">Hang up</span><span class="btn dis">Show video</span><span class="btn">Report</span>'
    elif kind == 'left':
        b = '<span class="btn dis">Hang up</span><span class="btn dis">Show video</span><span class="btn">Report</span>'
    return f'<div class="ctl">{b}{snd}</div>\n'


def stage():
    def feed(cap):
        return (f'<div class="feed"><div class="scene"></div><div class="head"></div><div class="bodyish"></div>'
                f'<div class="dots"></div><span class="cap">{icon("camera")}{cap}</span></div>')
    return f'<div class="stage">{feed("YOU")}{feed("STRANGER")}</div>\n'


def room(name, *, others, state, lines, ctl, lv=(0, 0), peaks=(None, None), big=None, video=False, note=None, thumb_top=16, desk=DESK):
    h = TB + TOPIC + 1 + PAD + LOGH + PAD + STATUS + PAD + CTL + (FEEDH + 2 + PAD if video else 0) + 2
    inner = titlebar('Waiting Room') + count_line(others, state) + '<div class="body">'
    if video:
        inner += stage()
    inner += log(lines, big=big, thumb_top=thumb_top) + status(*lv, *peaks) + '</div>\n' + controls(ctl)
    body = f'<div class="win" style="left:20px;top:20px;width:{W}px;height:{h}px;">\n{inner}</div>\n'
    if note:
        body += f'<div class="note" style="left:20px;top:{h + 32}px;">{note}</div>\n'
    write(name, body, W + 40, h + 40 + (60 if note else 0), desk)


def shaded(name, *, others, note=None, desk=DESK, top=20):
    """D-62/D-74: the queued state, shaded to the title bar and the count line."""
    h = TB + TOPIC + 2
    inner = titlebar('Waiting Room') + count_line(others, 'queued')
    body = f'<div class="win" style="left:20px;top:{top}px;width:{W}px;height:{h}px;">\n{inner}</div>\n'
    if note:
        body += f'<div class="note" style="left:20px;top:{h + top + 12}px;">{note}</div>\n'
    write(name, body, W + 40, h + top + 20 + (104 if note else 0), desk)


# ---------- room states, in the order of one wait ----------
shaded('Queued', others=2,
       note='Your Claude passed 15 s. The window opens behind the terminal, silently, shaded to the title bar and the honest count (Mac OS 7.5 WindowShade). Alone it reads "Nobody else is waiting right now. Your Claude is still working." Close it by hand and it stays away until your next task. Chrome\'s own thin title bar sits above this one; the outer window is 380 by 100.')
room('Main', others=2, state='live',
     lines=[('sys', 'Stranger has entered the room.'), ('soft', 'They can hear you. Say hi.')],
     ctl='room', lv=(2, 4), peaks=(None, 5),
     note='A match. Both windows unroll, a notification knocks, the door plays, the mic turns on, and the red dot means it is live (D-79). Nothing to click. The meters move only with real sound. Quiet for 45 s and the room shades back up (D-80).')
room('NeedsYou', others=2, state='live',
     lines=[('sys', 'Stranger has entered the room.'), ('soft', 'They can hear you. Say hi.'),
            ('you-hi', 'brb, my Claude needs me'), ('you', 'back')],
     ctl='room', lv=(3, 0), peaks=(4, None),
     note='Your Claude asked something. The line posts itself, the call stays on. Answer in the terminal; "back" posts when Claude continues.')
room('StrangerAway', others=2, state='live',
     lines=[('sys', 'Stranger has entered the room.'), ('soft', 'They can hear you. Say hi.'),
            ('them-hi', 'brb, my Claude needs me')],
     ctl='room', lv=(0, 0),
     note='What the stranger sees while your Claude needs you. Nothing about the task, only that you stepped away.')
room('Closing', others=1, state='live',
     lines=[('sys', 'Stranger has entered the room.'), ('you-hi', 'brb, my Claude needs me'), ('you', 'back'),
            ('sys', 'Your Claude is done. Closing in 5.')],
     ctl='closing', lv=(0, 3), big='5',
     note='The only task-related thing a stranger ever sees is this countdown. Knock on 3, 2, 1. Then the window closes itself.')
room('StrangerLeft', others=1, state='knock',
     lines=[('sys', "Stranger's Claude is done. Leaving in 5."), ('sys', 'Stranger has left the room.'),
            ('soft', 'Back in the queue. 1 other is waiting.')],
     ctl='left', lv=(0, 0), thumb_top=40,
     note='Their Claude finished first. The mic is released (no red dot). Report stays clickable. After a few seconds the window shades back up to screen 3 and you are queued again.')
room('Video', others=2, state='live',
     lines=[('sys', 'Stranger has entered the room.'), ('sys', 'Video is on.')],
     ctl='video', lv=(1, 3), video=True,
     note='Both clicked Show video. Two feeds in the same window with the dot screen: a CSS overlay on the video, colour underneath, no processing, no blend mode (D-64).')


# ---------- the four tints, for Q-26 ----------
def tints():
    rows = ''
    y = 0
    for name, hex_ in TINTS:
        rows += (f'<div style="position:absolute;left:0;top:{y}px;width:460px;height:96px;background:{hex_};">'
                 f'<div class="win" style="left:20px;top:26px;width:{W}px;height:{TB + TOPIC + 2}px;">{titlebar("Waiting Room")}{count_line(2, "queued")}</div>'
                 f'<div style="position:absolute;right:12px;top:8px;font:10px/12px {GEN};color:{INK};">{name} {hex_}{" (default)" if name == "Pool" else ""}</div></div>')
        y += 96
    write('Tints', rows, 460, y, TINTS[0][1])


tints()


# ---------- setup page (one time, a normal browser tab) ----------
def setup():
    w, h = 560, 424
    rows = [
        (True, 'Microphone allowed.', 'It turns on only when a stranger enters, never while you wait. Pick "Allow on every visit".', 'Allow microphone', 'dis'),
        (True, 'Notifications allowed.', 'The knock when a stranger arrives. The window opens behind your terminal, so this is how you notice.', 'Allow notifications', 'dis'),
        (True, 'Sound check.', 'This is the door. It plays when a stranger enters, softer when someone leaves.', 'Play the door', ''),
        (False, 'Rehearsal.', 'A shaded test window opens behind this one and closes itself in 5 seconds.', 'Open a test window', 'cyan def'),
    ]
    steps = ''
    for done, head, sub, btn, cls in rows:
        steps += (f'<div style="display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-bottom:1px solid {INK};">'
                  f'<i class="cb {"on" if done else ""}"></i><div style="flex:1;"><b>{head}</b> <span style="color:#444;">{sub}</span></div>'
                  f'<span class="btn {cls}" style="flex:none;">{btn}</span></div>')
    radios = ''.join(f'<span class="radio"><i class="{"on" if i == 0 else ""}"></i><b style="background:{hx};"></b>{n}</span>' for i, (n, hx) in enumerate(TINTS))
    theme = (f'<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid {INK};">'
             f'<b style="white-space:nowrap;">Desktop tint.</b> {radios}</div>')
    rules = ('<div style="margin-top:10px;padding:7px 10px;border:1px solid ' + INK + ';background:' + PAPER + ';font:10px/15px ' + GEN + ';">'
             '<b>The rules.</b> Audio first, video only when you both click. Nothing about your task is shared, ever. '
             'Nothing is recorded. Rooms end after 30 minutes. Be kind; Report is one click.</div>')
    inner = (titlebar('Waiting Room Setup') +
             f'<div style="padding:10px 16px 0;border-top:1px solid {INK};">'
             f'<p style="margin:0 0 4px;">Set up once. From now on, when your Claude works for more than 15 s, a small shaded window opens by itself with the count. When a stranger arrives it unrolls, knocks, and you are talking. It closes when your Claude is done.</p>'
             f'{steps}{theme}{rules}'
             f'<div style="display:flex;align-items:center;margin-top:12px;font:10px/12px {GEN};gap:6px;">{icon("person")}<span class="dot"></span>Nobody else is waiting right now. That is normal.'
             f'<span class="btn" style="margin-left:auto;">Done</span></div></div>')
    body = f'<div class="win" style="left:60px;top:40px;width:{w}px;height:{h}px;">\n{inner}</div>\n'
    write('Setup', body, w + 120, h + 80)


setup()


# ---------- terminal ----------
def terminal():
    lines = [
        ('#8be9a0', '$ claude'),
        ('#c8ccd2', '&gt; /waiting-room:on DUCK-7731'),
        ('#c8ccd2', ''),
        ('#c8ccd2', '  waiting-room is on.'),
        ('#9aa3ad', '  While your Claude works for more than 15 s, a small shaded window opens with the'),
        ('#9aa3ad', '  count of others waiting. When a stranger arrives it knocks and you are talking.'),
        ('#c8ccd2', ''),
        ('#c8ccd2', '  Set up once (mic, notifications, sound, a test window, your desktop tint):'),
        ('#7fb3ff', '  https://waiting-room.&lt;you&gt;.workers.dev/setup?t=k8s2vq7m'),
        ('#c8ccd2', ''),
        ('#c8ccd2', '  Nobody else is waiting right now. That is normal.'),
        ('#c8ccd2', ''),
        ('#c8ccd2', '&gt; Refactor the parser, add tests, and fix whatever breaks.'),
        ('#c8ccd2', ''),
        ('#e0b35a', '&#10047; Simmering&hellip; (1m 12s &middot; 14 tool uses)'),
    ]
    rows = ''.join(f'<div style="min-height:18px;color:{c};">{t}</div>' for c, t in lines)
    w, h = 720, 420
    body = (f'<div style="position:absolute;left:0;top:0;width:{w}px;height:{h}px;background:#14171C;border:1px solid #2B3038;border-radius:6px;overflow:hidden;font:12.5px/1.45 Menlo, Monaco, monospace;color:#c8ccd2;">'
            '<div style="height:26px;background:linear-gradient(#3A3F47,#2A2E35);display:flex;align-items:center;padding:0 10px;gap:6px;border-bottom:1px solid #1A1D22;">'
            '<span style="width:11px;height:11px;border-radius:50%;background:#EC6A5E;display:inline-block;"></span>'
            '<span style="width:11px;height:11px;border-radius:50%;background:#F4BF4F;display:inline-block;"></span>'
            '<span style="width:11px;height:11px;border-radius:50%;background:#61C554;display:inline-block;"></span>'
            f'<span style="flex:1;text-align:center;font:11px {GEN};color:#9aa3ad;margin-right:45px;">Terminal &mdash; claude</span></div>'
            f'<div style="padding:14px 16px;">{rows}</div></div>')
    open('Terminal.dc.html', 'w').write(HEAD + f'<div style="position:relative;width:{w}px;height:{h}px;background:#14171C;">' + body + '</div>' + TAIL)
    FRAMES['Terminal'] = (w, h)


terminal()


# ---------- canvas ----------
def ab(file, x, y, title):
    w, h = FRAMES[file]
    return {"file": f"{file}.dc.html", "x": x, "y": y, "w": w, "h": h, "title": title}


GAP = 80


def row(files, y):
    x, out = 0, []
    for f in files:
        out.append((f, x, y))
        x += FRAMES[f][0] + GAP
    return out


Y2, Y3, Y4 = 720, 1300, 1900
titles = {
    'Queued': '3 · Queued: shaded, with the count',
    'Main': '4 · A stranger arrived: talking',
    'NeedsYou': '5 · Your Claude needs you',
    'StrangerAway': "6 · Stranger's Claude needs them",
    'Closing': '7 · Your Claude is done: closing in 5',
    'StrangerLeft': '8 · Stranger left: shades back up',
    'Video': '9 · Video on, dot screen',
    'Tints': '10 · The four desktop tints: Pool is the default (D-78)',
}
boards = [ab('Terminal', 0, 0, '1 · Terminal: /waiting-room:on, once'),
          ab('Setup', 820, 0, '2 · Setup page, once')]
for f, x, y in row(['Queued', 'Main', 'NeedsYou', 'StrangerAway'], Y2) + row(['Closing', 'StrangerLeft', 'Video'], Y3) + row(['Tints'], Y4):
    boards.append(ab(f, x, y, titles[f]))
canvas = {
    "artboards": boards,
    "annotations": [
        {"id": "note-surfaces", "x": 0, "y": -170, "w": 760,
         "text": "Three surfaces only (D-46). 1: the terminal, where you turn it on and read the rules. 2: a setup page you visit once: mic, notifications, the door sound, a rehearsal window, your desktop tint. After that the only thing you ever see is the room window."},
        {"id": "note-lead", "x": 0, "y": Y2 - 220, "w": 940,
         "text": "v2.3, final tokens from research 09 and 10. Flat pastel desktop (Pool #91CECF by default), black at 1 px, cream panel #F5EEDF with a 6 px inner frame, two pastel button fills (Cyan for Show video, the one inviting action, Blush for Hang up), one yellow highlight, one red live dot. Eight 1-bit icons on an 11 by 11 grid: door (close), shade, person, watch, camera, speaker. Ledge buttons, text only. Two 28-bar meters. ChiKareGo2 16 px with -1 px tracking; Geneva 12 px lines. The window opens shaded when you are queued, knocks on a match, connects on its own (D-79), and closes when your Claude is done."},
        {"id": "note-lines", "x": 0, "y": Y3 - 140, "w": 900,
         "text": "The lines are the whole interface (D-42, D-43). *** lines are the room talking. YOU: and STRANGER: are away messages the plugin posts for you; nobody types. The count always means other people (D-70). The red dot means the mic is live; the hollow dot means it is not."},
    ],
    "launch": {"view": "canvas"}
}
json.dump(canvas, open('canvas.json', 'w'), indent=2)
print('built', len(boards), 'artboards; font embedded:', bool(FONT_B64))
