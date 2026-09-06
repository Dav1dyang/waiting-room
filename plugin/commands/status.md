---
description: Show whether waiting-room is on, and how many other people are waiting on their Claude right now.
disable-model-invocation: true
allowed-tools: Bash(${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh *)
---

!`"${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh" status`

Relay the lines above to the user verbatim. Add nothing, explain nothing, do nothing else.
