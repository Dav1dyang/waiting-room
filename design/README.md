# design/

Mockup v2.3 for waiting-room (2026-09-06). A Classic Mac OS room window in the Poolsuite grammar (D-59),
with the final tokens from research 09 and 10 (D-64, D-74 to D-77): flat pastel tints, 1-bit icons,
ledge buttons, two bar-graph meters, the dot screen on video, the shaded queued state, the pick-up click.

- `build.py` generates every `*.dc.html` artboard and `canvas.json`. Edit it, never the artboards.
- `fonts/ChiKareGo2.ttf` (Giles Booth, CC BY) is embedded as base64 for titles and buttons.
- `waiting-room-mockup.html` is the seeded canvas (regenerated; do not hand-edit).
- Live canvas: https://claude.ai/code/artifact/447cf200-0465-4dcf-8ff0-984537a43877
- `v1-wait-together/` is the archived first design (2009 Omegle homage).

To change something: edit `build.py`, run `python3 build.py`, re-seed with the Claude Code `/design`
skill helper (see the command in the session log or README of v1), republish to the same artifact URL.
