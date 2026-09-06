---
description: Turn waiting-room on for this machine. Prints the rules, a one-time setup link, and how many other people are waiting.
argument-hint: [invite-code]
disable-model-invocation: true
allowed-tools: Bash(${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh *)
---

!`"${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh" on "$ARGUMENTS"`

Relay the lines above to the user verbatim, blank lines and all. Add nothing, explain nothing, do nothing else.
