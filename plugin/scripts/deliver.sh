#!/usr/bin/env bash
# The second half of a hook, once the five fields exist: tell the lobby, then act on the reply.
# signal.sh runs this inline for most hooks and fully detached for a stop, so a session
# teardown (which kills async hooks still running) can never lose the "stopped" word.
#
#   deliver.sh '{"token":...}'      send one body, act on the reply
#   deliver.sh --open URL           open the window, hold the lock, release it (detached)
#   deliver.sh --idle-check         a few seconds after a stop, quit the browser if nothing is up (detached)
#
# Same three rules as signal.sh: exit 0 always, print nothing, be quick.
set -u

WR_HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$WR_HERE/config.sh"

case "${1:-}" in
  --open)
    # deliver.sh --open URL [--keep] --owner NAME
    # "--keep": a test window; leave the running instance (and the setup page in it) alone.
    OPEN_URL="${2:-}"; shift 2
    KEEP=""; OWNER=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --keep) KEEP=1 ;;
        --owner) OWNER="${2:-}"; shift ;;
      esac
      shift
    done
    # Only the lock's owner touches the browser. An opener that slept through a stale takeover
    # would otherwise quit the window the next owner just opened.
    wr_lock_owned "$OWNER" || exit 0
    if [ -n "$KEEP" ]; then WR_KEEP_INSTANCE=1 wr_open_url "$OPEN_URL"; else wr_open_url "$OPEN_URL"; fi
    sleep "$WR_LOCK_HOLD"
    wr_lock_release "$OWNER"
    exit 0
    ;;
  --idle-check)
    sleep "$WR_IDLE_WAIT"
    wr_quit_if_idle
    exit 0
    ;;
esac

BODY="${1:-}"
[ -n "$BODY" ] || exit 0
command -v curl >/dev/null 2>&1 || exit 0
ENDPOINT="$(wr_endpoint)"
REPLY="$(printf '%s' "$BODY" | curl -s -m 3 --connect-timeout 1 \
  -H 'Content-Type: application/json' --data-binary @- \
  "$ENDPOINT/api/hook" 2>/dev/null || true)"

# Phase 0 logging, opt in: WAITING_ROOM_LOG=path appends one line per hook, the five fields
# that were sent and what the reply was (open, quit, empty). Nothing from the hook input itself
# is written, and no room URL: a ticket is a key, not a log line.
if [ -n "${WAITING_ROOM_LOG:-}" ]; then
  case "${REPLY:-}" in
    '') KIND='(no reply)' ;;
    *'"open"'*) KIND='open' ;;
    *'"quit":true'*) KIND='quit' ;;
    '{}') KIND='-' ;;
    *) KIND='other' ;;
  esac
  printf '%s %s %s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$BODY" "$KIND" >> "$WAITING_ROOM_LOG" 2>/dev/null || true
fi
[ -n "$REPLY" ] || exit 0

# After a stop with nothing on screen the lobby says so, and the plugin's Chrome can go.
# After any stop, ask again a few seconds later, once the goodbye countdown has run (D-87).
case "$REPLY" in *'"quit":true'*) wr_quit_chrome ;; esac
case "$BODY" in
  *'"event":"stopped"'*) wr_detach bash "$WR_HERE/deliver.sh" --idle-check ;;
esac

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
KEEP=""
case "$REPLY" in *'"rehearsal":true'*) KEEP="--keep" ;; esac
# A room lives on our lobby at /room. Anything else is a broken lobby, and we do not open it.
wr_url_ok "$URL" /room || exit 0

# Several hooks can fire in the same second, and each one gets its own process. The lock is
# atomic, so exactly one of them opens a window. A few retries cover the reaper, which holds
# the lock for a moment while it quits an idle browser.
OWNER="open.$$.$RANDOM"
if wr_lock_take "$OWNER" 5; then
  # The opener outlives this hook and releases the lock a few seconds after the open, so the
  # hooks right behind this one stay quiet. Detached, so a teardown cannot leave the lock stuck.
  wr_detach bash "$WR_HERE/deliver.sh" --open "$URL" $KEEP --owner "$OWNER"
fi

exit 0
