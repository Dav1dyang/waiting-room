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

command -v curl >/dev/null 2>&1 || exit 0
ENDPOINT="$(wr_endpoint)"
REPLY="$(printf '%s' "$BODY" | curl -s -m 3 --connect-timeout 1 \
  -H 'Content-Type: application/json' --data-binary @- \
  "$ENDPOINT/api/hook" 2>/dev/null || true)"
[ -n "$REPLY" ] || exit 0

# The lobby answers {} most of the time, and {"open": "https://.../room?t=..."} at most
# once per task.
URL="$(printf '%s' "$REPLY" | node -e '
let d = "";
process.stdin.setEncoding("utf8");
process.stdin.on("error", () => process.exit(0));
process.stdin.on("data", (c) => { d += c; });
process.stdin.on("end", () => {
  try {
    const j = JSON.parse(d);
    if (j && typeof j.open === "string") process.stdout.write(j.open);
  } catch (e) {}
});' 2>/dev/null || true)"
[ -n "$URL" ] || exit 0
# A room lives on the web. Anything else is a broken lobby, and we do not hand it to open.
case "$URL" in
  http://*|https://*) ;;
  *) exit 0 ;;
esac

# Seconds since a path was last touched. If we cannot tell, say 0: an age we do not know
# is not a reason to take someone else's lock away.
wr_age() {
  node -e '
const fs = require("node:fs");
try {
  const s = fs.statSync(process.argv[1]);
  process.stdout.write(String(Math.floor((Date.now() - s.mtimeMs) / 1000)));
} catch (e) { process.stdout.write("0"); }' "$1" 2>/dev/null || printf '0'
}

# Several hooks can fire in the same second, and each one gets its own process.
# mkdir is atomic, so exactly one of them opens a window.
if [ -d "$WR_LOCK_DIR" ]; then
  AGE="$(wr_age "$WR_LOCK_DIR")"
  case "$AGE" in
    ''|*[!0-9]*) AGE=0 ;;
  esac
  # Older than half a minute means the process holding it died. Take it back.
  if [ "$AGE" -ge "$WR_LOCK_STALE" ]; then rmdir "$WR_LOCK_DIR" 2>/dev/null || true; fi
fi
if mkdir "$WR_LOCK_DIR" 2>/dev/null; then
  # Hold the lock a few seconds past the open, so the hooks right behind this one stay quiet.
  # Detached and silent: this outlives the hook, and it must not hold the hook's pipes open.
  ( wr_open_url "$URL"; sleep "$WR_LOCK_HOLD"; rmdir "$WR_LOCK_DIR" 2>/dev/null || true ) >/dev/null 2>&1 &
fi

exit 0
