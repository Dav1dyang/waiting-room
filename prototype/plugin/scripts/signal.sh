#!/usr/bin/env bash
# Hook entry point. Reads the hook JSON on stdin, sends only {token, event, session hash}
# to the lobby, and acts on the lobby's one-word instruction. Never prints, never blocks.
set -u
STATE_DIR="${HOME}/.waiting-room"
ENDPOINT="${CLAUDE_PLUGIN_OPTION_ENDPOINT:-${WAITING_ROOM_URL:-http://127.0.0.1:8787}}"
[ -f "$STATE_DIR/enabled" ] || { cat >/dev/null; exit 0; }
TOKEN="$(cat "$STATE_DIR/token" 2>/dev/null || echo none)"

# Project the payload on this machine: event name, hashed session id, and the pause verdict.
# (node is available wherever Claude Code runs.)
BODY="$(WR_TOKEN="$TOKEN" node -e '
let d=""; process.stdin.on("data",c=>d+=c).on("end",()=>{
  let j={}; try{ j=JSON.parse(d); }catch(e){}
  const crypto=require("crypto");
  const sid=crypto.createHash("sha256").update(String(j.session_id||"")).digest("hex").slice(0,16);
  const ev=j.hook_event_name||"";
  let event="tick";
  if(ev==="UserPromptSubmit") event="started";
  else if(ev==="SessionEnd"||ev==="StopFailure") event="stopped";
  else if(ev==="Stop"){
    const bg=(j.background_tasks||[]).length>0;
    const last=String(j.last_assistant_message||"").trim();
    const asks=/\?\s*$/.test(last.split("\n").filter(Boolean).pop()||"");
    event=(bg||asks)?"paused":"stopped";
  } else if(ev==="PermissionRequest"||ev==="Elicitation") event="needs_you";
  else if(ev==="PreToolUse"&&j.tool_name==="AskUserQuestion") event="needs_you";
  process.stdout.write(JSON.stringify({token:process.env.WR_TOKEN,event,session:sid}));
});' 2>/dev/null)"
[ -n "$BODY" ] || exit 0

RESP="$(WR_TOKEN="$TOKEN" curl -sS -m 2 --connect-timeout 1 -X POST -H 'Content-Type: application/json' \
  --data "$BODY" "$ENDPOINT/signal" 2>/dev/null || true)"

# The lobby may answer {"open":"https://.../room?..."} when a stranger is matched.
URL="$(printf '%s' "$RESP" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const j=JSON.parse(d);if(j.open)process.stdout.write(j.open)}catch(e){}})' 2>/dev/null)"
if [ -n "$URL" ]; then
  # Several hooks can fire within milliseconds; mkdir is atomic, so exactly one of them opens.
  LOCK="$STATE_DIR/opening.lock"
  # A lock older than 30 s is stale (its subshell was killed); remove it so windows are never blocked forever.
  if [ -d "$LOCK" ] && [ -n "$(find "$LOCK" -maxdepth 0 -mmin +0.5 2>/dev/null)" ]; then rmdir "$LOCK" 2>/dev/null; fi
  if mkdir "$LOCK" 2>/dev/null; then
    # Chromeless window in the user's normal Chrome profile (research 08: -n is required so the
    # --app switch reaches the running Chrome; size flags are ignored, so none are passed).
    # -g: do not bring Chrome to the front. The window opens shaded and silent when you are queued (D-62);
    # the lobby sends "open" at most once per task (D-68). Phase 0 test 3 decides if -g holds (D-71).
    # Fallback: the default browser.
    (open -g -na "Google Chrome" --args --app="$URL" >/dev/null 2>&1 || open -g "$URL" >/dev/null 2>&1
     sleep 5; rmdir "$LOCK" 2>/dev/null) &
  fi
fi
exit 0
