#!/usr/bin/env bash
# Phase 0 on a Mac: open one real room window through the real path and read back what it measured.
#   bash scripts/probe-mac.sh            (needs Google Chrome; uses the mock lobby on 127.0.0.1:8791)
# Prints the probe record (focus, sizes, autoplay, permissions) and whether the window closed itself.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8791}"
BASE="${BASE:-http://127.0.0.1:${PORT}}"   # set BASE to a deployed lobby to probe the real origin
INVITE="${INVITE:-PROBE}"
TOKEN="probe$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 12)"
MODE="${1:-probe}"   # probe | rehearsal

front() { osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true' 2>/dev/null; }
post() { curl -sS -m 3 -X POST -H 'content-type: application/json' --data "$2" "$BASE$1"; }

cd "$ROOT/worker" || exit 1
MOCK=""
if [ "${BASE#http://127.0.0.1}" != "$BASE" ]; then
  PORT="$PORT" INVITES="$INVITE" T=1000 node scripts/mock-lobby.js >/tmp/wr-probe-mock.log 2>&1 &
  MOCK=$!
  trap 'kill $MOCK 2>/dev/null' EXIT
  sleep 1
fi

post /api/register "{\"token\":\"$TOKEN\",\"invite\":\"$INVITE\"}" >/dev/null
post /api/hook "{\"token\":\"$TOKEN\",\"event\":\"started\",\"session\":\"p\",\"ts\":$(date +%s000)}" >/dev/null
if [ "$MODE" = "rehearsal" ]; then post /api/rehearse "{\"token\":\"$TOKEN\"}" >/dev/null; fi
sleep "${WAIT:-1.2}"   # a deployed lobby waits the real threshold: WAIT=16
REPLY="$(post /api/hook "{\"token\":\"$TOKEN\",\"event\":\"tick\",\"session\":\"p\",\"ts\":$(date +%s000)}")"
URL="$(printf '%s' "$REPLY" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write(JSON.parse(d).open||"")}catch{}})')"
[ -n "$URL" ] || { echo "no open URL in reply: $REPLY"; exit 1; }
[ "$MODE" = "probe" ] && URL="${URL}&probe=1"
case "$MODE" in plain|plainq) (sleep 9; post /api/off "{\"token\":\"$TOKEN\"}" >/dev/null) & ;; esac   # a normal shaded window, closed by the lobby after 9 s
[ "$MODE" = "plainq" ] && URL="${URL}&x=1"

echo "front before: $(front)"
echo "opening: $URL"
T0=$(date +%s)
. "$ROOT/plugin/scripts/config.sh"   # the plugin's own launcher: a dedicated, hidden Chrome (D-87)
wr_open_url "$URL"
sleep 2
echo "front after 2 s: $(front)"
sleep 6
echo "front after 8 s: $(front)"
echo "--- probe record"
curl -sS "$BASE/api/probes?t=$TOKEN" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);for(const p of j.probes)console.log(JSON.stringify(p.data,null,1))})'
if [ -n "$MOCK" ]; then
  echo "--- lobby view of the window after $(( $(date +%s) - T0 )) s"
  curl -sS "$BASE/api/state" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const s=JSON.parse(d);const t=s.tokens[process.argv[1]];console.log("win:",JSON.stringify(t&&t.win),"task:",t&&t.task&&t.task.phase)})' "$TOKEN"
fi
echo "--- Chrome windows still open with our title"
osascript -e 'tell application "Google Chrome" to get title of every window' 2>/dev/null | tr ',' '\n' | grep -i 'waiting room' || echo "(none)"
sleep 2
wr_quit_chrome
echo "quit the plugin's Chrome: $(pgrep -f -- "--user-data-dir=$WR_CHROME_DIR" | wc -l | tr -d ' ') processes left"
