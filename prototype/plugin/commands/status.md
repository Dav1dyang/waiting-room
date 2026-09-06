---
description: Show whether waiting-room is on and how many people are waiting on their Claudes right now.
disable-model-invocation: true
allowed-tools: Bash(${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh *)
---

## waiting-room

!`"${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh" status`

Relay the lines above to the user verbatim. Do nothing else.
