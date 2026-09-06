---
description: Turn waiting-room on for this machine (one-time setup prints the rules and opens the setup page once).
argument-hint: [invite-code]
disable-model-invocation: true
allowed-tools: Bash(${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh *)
---

## waiting-room

!`"${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh" on "$ARGUMENTS"`

Relay the lines above to the user verbatim. Do nothing else.
