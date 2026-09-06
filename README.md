# waiting-room

A Claude Code plugin idea: while your Claude is busy on a long task, you get a
live call with a stranger whose Claude is also busy. The call ends the moment
one Claude finishes. Every wait, a different stranger.

This folder is the **plan**, not the code yet.

| Path | What it is |
| --- | --- |
| `docs/index.html` | The plan, v0.5. Open it in a browser. Start here. v0.1 to v0.4 are in `docs/archive/`. |
| `docs/archive/plan-v0.1.html` | The first plan, kept for the record. |
| `design/` | Mockup v2.3 (Classic Mac OS, Poolsuite grammar, final tokens): `build.py`, the `.dc.html` artboards, `canvas.json`, `fonts/` (ChiKareGo2, CC BY). `v1-wait-together/` is the archived first design. Live canvas: https://claude.ai/code/artifact/447cf200-0465-4dcf-8ff0-984537a43877 |
| `docs/DECISIONS.md` | Decision log (D-xx). Every non-obvious choice and why. |
| `docs/QUESTIONS.md` | Open questions for David (Q-xx) with the default assumed. |
| `docs/CHANGELOG.md` | What changed in the plan, by date. |
| `docs/research/01-art-theory-lineage.md` | Art, games, media theory on waiting with strangers. |
| `docs/research/02-claude-code-plugin-mechanics.md` | Verified plugin + hook facts with doc links. |
| `docs/research/03-free-hosting-and-webrtc.md` | Free-tier hosting, WebRTC, TURN cost model. |
| `docs/research/04-product-history-and-safety.md` | Omegle, Chatroulette, Portal, Focusmate lessons. |
| `docs/research/05-omegle-ui-and-2009-web-design.md` | Omegle UI anatomy from Wayback captures; 2009 web grammar; homage style guide. |
| `docs/research/06-plugin-ecosystem-and-naming.md` | Marketplaces explained, 60+ plugin names, naming patterns, fun plugins, name collision check. |
| `docs/research/07-retro-chat-window-design.md` | 2000s/2010s chat-window anatomy, CSS-recreatable OS chrome, retro-revival taste, three directions for the small window. |
| `docs/research/07-retro-chat-window-design.md` | 2000s and 2010s chat-window anatomy, CSS-recreatable textures, retro-without-cheap rules, three directions. |
| `docs/research/08-auto-popup-window-mechanics.md` | Can a window open and close itself from a hook: verified browser rules and the alpha mechanism. |
| `docs/research/09-poolsuite-color-and-retro-modern.md` | Poolsuite's colours, nine themes, icons, buttons, meter, verified live; pastel palette, icon grid, and retro-but-modern rules for our window. |
| `docs/research/10-video-dither-and-window-shade.md` | The dot screen as CSS (no processing), window shade and resize verified in Chromium source, open-when-queued consequences. |
| `prototype/plugin/` | Validated plugin skeleton: seven hooks, `/waiting-room:on|off|status`, on-machine pause classifier, open-on-match. Phase 0 starting point, not a product. |

Plan v0.1 written 2026-09-05, v0.2 to v0.5 on 2026-09-06, with Claude Code (Fable 5.1) and ten Opus 5 research agents.
Plan artifact: https://claude.ai/code/artifact/7f5e1d8a-4c07-46ab-9506-507936b4ff27
