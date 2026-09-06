# design/

Mockup of wait-together in the look of a 2009 web page (Omegle as the joke, our own words and logo).

- `build.py` generates every `*.dc.html` artboard and `canvas.json` from one set of tokens.
  Tokens and geometry come from `docs/research/05-omegle-ui-and-2009-web-design.md`.
- `wait-together-mockup.html` is the seeded, publishable canvas (generated; do not hand-edit).
- Live canvas: https://claude.ai/code/artifact/447cf200-0465-4dcf-8ff0-984537a43877

To change something: edit `build.py`, run `python3 build.py`, re-seed with the Claude Code `/design` skill helper, republish to the same artifact URL.

Screens: terminal, home (faithful), home (garnished), popup idle, waiting, on a call, video on, your Claude needs you, stranger away, your Claude finished, stranger disconnected.
