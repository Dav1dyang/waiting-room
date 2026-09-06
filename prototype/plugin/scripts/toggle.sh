#!/usr/bin/env bash
# $1 = on|off|status   $2 = invite code (only with "on", may be empty)
# Prototype: state lives at a fixed path; the real service URL is set later.
set -u
STATE_DIR="${HOME}/.waiting-room"
ENDPOINT="${CLAUDE_PLUGIN_OPTION_ENDPOINT:-${WAITING_ROOM_URL:-http://127.0.0.1:8787}}"
mkdir -p "$STATE_DIR"
FLAG="$STATE_DIR/enabled"
TOKEN_FILE="$STATE_DIR/token"
[ -f "$TOKEN_FILE" ] || LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 20 > "$TOKEN_FILE"
TOKEN="$(cat "$TOKEN_FILE")"
case "${1:-status}" in
  on)
    : > "$FLAG"
    [ -n "${2:-}" ] && printf '%s' "$2" > "$STATE_DIR/invite"
    echo "waiting-room: on"
    echo "Rules: 18+, be decent, calls are audio until you both click, never recorded, nobody sees your task."
    echo "One-time setup (mic permission and a sound check): ${ENDPOINT}/setup?t=${TOKEN}"
    echo "From now on, when your Claude has been working for 30 s and a stranger is waiting too, a small room window opens by itself."
    ;;
  off)
    rm -f "$FLAG"
    echo "waiting-room: off"
    ;;
  status)
    if [ -f "$FLAG" ]; then echo "waiting-room: on"; else echo "waiting-room: off"; fi
    N="$(curl -sS -m 2 "${ENDPOINT}/count" 2>/dev/null || true)"
    [ -n "$N" ] && echo "people waiting on their Claudes right now: $N" || echo "people waiting on their Claudes right now: (service not reachable)"
    ;;
esac
exit 0
