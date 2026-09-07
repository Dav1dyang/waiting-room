#!/usr/bin/env bash
# Every hook runs this. It reads the hook JSON on stdin, tells the lobby one of five words,
# and opens the room window when the lobby asks for one.
#
# Three rules, in order of importance:
#   1. exit 0 no matter what happens
#   2. print nothing, to stdout or to stderr
#   3. be quick, and never make Claude wait
set -u

WR_HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$WR_HERE/config.sh"

# Off is the common case and it must cost almost nothing. Read stdin first so the hook
# never sees a closed pipe, then stop.
if ! wr_is_enabled; then cat >/dev/null 2>&1; exit 0; fi

WR_TOKEN_VALUE="$(wr_token)"
if [ -z "$WR_TOKEN_VALUE" ]; then cat >/dev/null 2>&1; exit 0; fi

# node does the classifying, so the prompt text never leaves this process tree.
if ! command -v node >/dev/null 2>&1; then cat >/dev/null 2>&1; exit 0; fi

# Empty means either bad JSON or an event we do not report. Either way, say nothing.
BODY="$(WR_TOKEN="$WR_TOKEN_VALUE" node "$WR_HERE/classify.js" 2>/dev/null || true)"
[ -n "$BODY" ] || exit 0

# A stop is delivered by a detached process: Claude Code kills async hooks that are still
# running when a session ends, and the lobby must hear "stopped" even then. Everything else
# is delivered right here; the hook is async anyway, so nobody waits.
case "$BODY" in
  *'"event":"stopped"'*) wr_detach bash "$WR_HERE/deliver.sh" "$BODY" ;;
  *) bash "$WR_HERE/deliver.sh" "$BODY" ;;
esac

exit 0
