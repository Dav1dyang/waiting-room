#!/usr/bin/env bash
# The three commands behind /waiting-room:on, :off and :status.
#   toggle.sh on [INVITE]
#   toggle.sh off
#   toggle.sh status
#
# Every line a person ever reads comes out of say(), so all the copy is in one place.
set -u

WR_HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$WR_HERE/config.sh"

# ---------------------------------------------------------------- the copy

say() {
  case "$1" in
    on)          printf '%s\n' "waiting-room is on." ;;
    off)         printf '%s\n' "waiting-room is off." ;;
    rules)
      printf '%s\n' "Audio first. Video only when you both click Show video."
      printf '%s\n' "Your task stays on your machine."
      printf '%s\n' "waiting-room records nothing."
      printf '%s\n' "Be kind. Report is one click."
      ;;
    setup)       printf '%s\n' "Set up once, in the window that just opened. If it did not open, use this link:" ;;
    nobody)      printf '%s\n' "Nobody else is waiting right now. That is normal." ;;
    one_other)   printf '%s\n' "1 other is waiting for their Claude." ;;
    n_others)    printf '%s\n' "${2} others are waiting for their Claude." ;;
    from_now_on) printf '%s\n' "When Claude works for more than 15 seconds, a small window opens behind your terminal." ;;
    bad_invite)  printf '%s\n' "That invite code did not work." ;;
    busy)        printf '%s\n' "Too many wrong codes for now. Wait ten minutes, then try again." ;;
    refused)     printf '%s\n' "Could not turn waiting-room on. Ask whoever gave you the invite code." ;;
    unreachable) printf '%s\n' "Cannot reach waiting-room right now. Try again in a minute." ;;
    no_lobby)    printf '%s\n' "Cannot reach waiting-room right now. Try again in a minute." ;;
    line)        printf '%s\n' "${2}" ;;
    blank)       printf '\n' ;;
  esac
}

# 0 is "nobody", 1 gets the singular, everything else is plural.
count_line() {
  local n="${1:-}"
  case "$n" in
    ''|*[!0-9]*) return 0 ;;
  esac
  if [ "$n" -eq 0 ]; then
    say nobody
  elif [ "$n" -eq 1 ]; then
    say one_other
  else
    say n_others "$n"
  fi
}

# ---------------------------------------------------------------- the lobby

# POST some JSON. Prints the reply body. Returns 1 when the lobby never answered.
post_json() {
  local url="$1" body="$2" out="" status=0
  command -v curl >/dev/null 2>&1 || return 1
  out="$(printf '%s' "$body" | curl -s -m 5 --connect-timeout 3 \
    -H 'Content-Type: application/json' --data-binary @- "$url" 2>/dev/null)"
  status=$?
  [ "$status" -eq 0 ] || return 1
  printf '%s' "$out"
}

# GET some JSON. Same contract as post_json.
get_json() {
  local url="$1" out="" status=0
  command -v curl >/dev/null 2>&1 || return 1
  out="$(curl -s -m 5 --connect-timeout 3 "$url" 2>/dev/null)"
  status=$?
  [ "$status" -eq 0 ] || return 1
  printf '%s' "$out"
}

# Read a lobby reply and print four lines: ok, error, count, setup.
# Anything missing comes back as an empty line, so the caller never has to think about it.
lobby_fields() {
  command -v node >/dev/null 2>&1 || { printf '\n\n\n\n'; return 0; }
  printf '%s' "$1" | node -e '
let d = "";
process.stdin.setEncoding("utf8");
process.stdin.on("error", () => process.stdout.write("\n\n\n\n"));
process.stdin.on("data", (c) => { d += c; });
process.stdin.on("end", () => {
  let j = {};
  try { j = JSON.parse(d) || {}; } catch (e) { j = {}; }
  const one = (v) => (v === undefined || v === null || typeof v === "object" ? "" : String(v).replace(/[\r\n]+/g, " "));
  process.stdout.write([one(j.ok), one(j.error), one(j.count), one(j.setup)].join("\n") + "\n");
});' 2>/dev/null || printf '\n\n\n\n'
}

field() {
  printf '%s\n' "$1" | sed -n "${2}p"
}

# ---------------------------------------------------------------- the commands

do_on() {
  local token invite endpoint reply fields ok error count setup
  wr_dir
  token="$(wr_make_token)"

  # An invite code is a short word from whoever runs the lobby. Keep it to characters a
  # code could actually contain, so nothing odd from the command line reaches the JSON.
  invite="$(printf '%s' "${1:-}" | LC_ALL=C tr -cd 'A-Za-z0-9._-' | head -c 64)"
  # No code this time means we reuse the one that worked before, so "on" is repeatable.
  [ -n "$invite" ] || invite="$(wr_invite)"

  endpoint="$(wr_endpoint)"
  reply="$(post_json "$endpoint/api/register" "{\"token\":\"$token\",\"invite\":\"$invite\"}")" || {
    say unreachable
    return 0
  }

  fields="$(lobby_fields "$reply")"
  ok="$(field "$fields" 1)"
  error="$(field "$fields" 2)"
  count="$(field "$fields" 3)"
  setup="$(field "$fields" 4)"

  if [ "$ok" != "true" ]; then
    if [ "$error" = "invite" ]; then
      say bad_invite
    elif [ "$error" = "busy" ]; then
      say busy
    elif [ -n "$error" ]; then
      say refused
    else
      say unreachable
    fi
    return 0
  fi

  : > "$WR_FLAG_FILE"
  [ -n "$invite" ] && printf '%s' "$invite" > "$WR_INVITE_FILE"

  say on
  say blank
  say rules
  say blank
  if [ -n "$setup" ] && wr_url_ok "$setup" /setup; then
    say setup
    say line "$setup"
    wr_open_setup "$setup"
    say blank
  fi
  count_line "$count"
  say blank
  say from_now_on
  return 0
}

do_off() {
  wr_quit_chrome
  local token endpoint
  token="$(wr_token)"
  endpoint="$(wr_endpoint)"
  # Tell the lobby, but never let a quiet lobby leave this machine stuck on.
  if [ -n "$token" ]; then
    post_json "$endpoint/api/off" "{\"token\":\"$token\"}" >/dev/null 2>&1 || true
  fi
  rm -f "$WR_FLAG_FILE" 2>/dev/null || true
  say off
  return 0
}

do_status() {
  local token endpoint reply count
  token="$(wr_token)"
  endpoint="$(wr_endpoint)"

  if wr_is_enabled; then say on; else say off; fi
  # Never turned on: there is no token to ask with, and nothing to count.
  [ -n "$token" ] || return 0

  reply="$(get_json "$endpoint/api/count?t=$token")" || {
    say no_lobby
    return 0
  }
  count="$(field "$(lobby_fields "$reply")" 3)"
  case "$count" in
    ''|*[!0-9]*) say no_lobby ;;
    *) count_line "$count" ;;
  esac
  return 0
}

case "${1:-status}" in
  on)  do_on "${2:-}" ;;
  off) do_off ;;
  *)   do_status ;;
esac
exit 0
