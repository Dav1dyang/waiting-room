---
description: Turn waiting-room on and open setup once.
argument-hint: [invite-code]
disable-model-invocation: true
allowed-tools: Bash(${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh *)
---

!`"${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh" on "$ARGUMENTS"`

Relay the lines above to the user verbatim, blank lines and all. Add nothing, explain nothing, do nothing else.
