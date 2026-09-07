#!/usr/bin/env bash
# Shared settings for the waiting-room plugin. Sourced by signal.sh and toggle.sh.
# Nothing in here prints anything and nothing in here touches the network.
set -u

# The lobby that ships with the plugin. The lead fills this in after the first deploy.
DEFAULT_ENDPOINT="https://waiting-room.davidyangemail.workers.dev"

# Everything this plugin remembers lives in one directory you can delete:
#   token     20 characters, made once, the only name the lobby knows you by
#   enabled   an empty file; present means on
#   invite    the code you registered with, so "on" works a second time with no code
#   endpoint  an optional lobby URL, one line, no trailing slash
# WAITING_ROOM_DIR moves the whole directory, which the tests and the probe script use.
WR_DIR="${WAITING_ROOM_DIR:-${HOME}/.waiting-room}"
WR_TOKEN_FILE="$WR_DIR/token"
WR_FLAG_FILE="$WR_DIR/enabled"
WR_INVITE_FILE="$WR_DIR/invite"
WR_ENDPOINT_FILE="$WR_DIR/endpoint"
WR_LOCK_DIR="$WR_DIR/opening.lock"
# The room window runs in its own Chrome instance with its own profile (D-87). Opened into the
# everyday Chrome, a new window took keyboard focus within half a second; opened into a second
# instance launched hidden, it stays behind the terminal every time, and that instance can take
# an autoplay flag so the door and the stranger's voice play with no click.
WR_CHROME_DIR="$WR_DIR/chrome"
WR_CHROME_FLAGS="--user-data-dir=$WR_CHROME_DIR --no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required"
# How long after a stop to ask the lobby whether a window is still up before quitting that Chrome.
WR_IDLE_WAIT="${WAITING_ROOM_IDLE_WAIT:-8}"

# A lock this old belonged to a process that died before it could clean up.
WR_LOCK_STALE=30
# How long the winner holds the lock, so the hooks firing right behind it stay quiet.
WR_LOCK_HOLD=5

# Make the state directory if this is the first run. Never fails loudly.
wr_dir() {
  mkdir -p "$WR_DIR" 2>/dev/null || true
}

# The lobby URL: the environment first, then the file, then the built-in default.
wr_endpoint() {
  local url=""
  if [ -n "${WAITING_ROOM_URL:-}" ]; then
    url="$WAITING_ROOM_URL"
  elif [ -s "$WR_ENDPOINT_FILE" ]; then
    IFS= read -r url < "$WR_ENDPOINT_FILE" || true
    url="${url%$'\r'}"
  fi
  [ -n "$url" ] || url="$DEFAULT_ENDPOINT"
  # A trailing slash would give us //api/hook, which some routers do not like.
  while [ "${url%/}" != "$url" ]; do url="${url%/}"; done
  printf '%s' "$url"
}

# The token as it is on disk. Prints nothing if this machine has never been turned on.
wr_token() {
  local t=""
  if [ -s "$WR_TOKEN_FILE" ]; then
    IFS= read -r t < "$WR_TOKEN_FILE" || true
    t="${t%$'\r'}"
  fi
  printf '%s' "$t"
}

# The token, made once if it is missing. Only "on" calls this; a hook never invents a token.
wr_make_token() {
  wr_dir
  if [ ! -s "$WR_TOKEN_FILE" ]; then
    local fresh=""
    fresh="$(LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom 2>/dev/null | head -c 20 || true)"
    if [ "${#fresh}" -ne 20 ] && command -v node >/dev/null 2>&1; then
      # No /dev/urandom is unlikely, but node is here either way.
      fresh="$(node -e 'const c=require("node:crypto");const a="abcdefghijklmnopqrstuvwxyz0123456789";let s="";for(let i=0;i<20;i++)s+=a[c.randomInt(36)];process.stdout.write(s)' 2>/dev/null || true)"
    fi
    if [ "${#fresh}" -eq 20 ]; then
      local tmp="$WR_TOKEN_FILE.$$"
      printf '%s' "$fresh" > "$tmp" 2>/dev/null && mv "$tmp" "$WR_TOKEN_FILE" 2>/dev/null || rm -f "$tmp" 2>/dev/null || true
    fi
  fi
  wr_token
}

# The invite code we registered with last time, if any.
wr_invite() {
  local code=""
  if [ -s "$WR_INVITE_FILE" ]; then
    IFS= read -r code < "$WR_INVITE_FILE" || true
    code="${code%$'\r'}"
  fi
  printf '%s' "$code"
}

# True when the plugin is on for this machine.
wr_is_enabled() {
  [ -f "$WR_FLAG_FILE" ]
}

# Run a command in its own session, with no pipes and no tty, so a hook teardown cannot kill it.
# Claude Code kills async hooks still running when a session ends; the window opener, the lock
# release, the idle check, and the "stopped" delivery must outlive that.
wr_detach() {
  if command -v node >/dev/null 2>&1; then
    node -e 'const { spawn } = require("node:child_process"); spawn(process.argv[1], process.argv.slice(2), { detached: true, stdio: "ignore" }).unref();' "$@" >/dev/null 2>&1 || true
  else
    ( "$@" ) >/dev/null 2>&1 < /dev/null &
  fi
  return 0
}

# Open the room window, behind whatever you are looking at, in the plugin's own Chrome.
# WAITING_ROOM_OPEN_CMD replaces the whole thing; the URL arrives as its one argument.
# The tests use that to capture the URL instead of launching a browser.
wr_open_url() {
  local url="$1"
  if [ -n "${WAITING_ROOM_OPEN_CMD:-}" ]; then
    sh -c "$WAITING_ROOM_OPEN_CMD \"\$1\"" wr "$url" >/dev/null 2>&1 || true
    return 0
  fi
  mkdir -p "$WR_CHROME_DIR" 2>/dev/null || true
  # -n starts a second instance (the profile keeps it apart from your own Chrome); -g keeps it behind.
  # shellcheck disable=SC2086
  open -g -na "Google Chrome" --args $WR_CHROME_FLAGS --app="$url" >/dev/null 2>&1 && return 0
  # No Chrome: the default browser, still in the background.
  open -g "$url" >/dev/null 2>&1 || true
  return 0
}

# Open the setup page in that same Chrome, in front, as a normal window: the permissions it
# grants land in the profile the room window uses.
wr_open_setup() {
  local url="$1"
  if [ -n "${WAITING_ROOM_OPEN_CMD:-}" ]; then
    sh -c "$WAITING_ROOM_OPEN_CMD \"\$1\"" wr "$url" >/dev/null 2>&1 || true
    return 0
  fi
  mkdir -p "$WR_CHROME_DIR" 2>/dev/null || true
  # shellcheck disable=SC2086
  open -na "Google Chrome" --args $WR_CHROME_FLAGS "$url" >/dev/null 2>&1 && return 0
  open "$url" >/dev/null 2>&1 || true
  return 0
}

# Quit the plugin's Chrome. Nothing else runs with that profile path, so the match is exact.
# WAITING_ROOM_QUIT_CMD replaces it for the tests.
wr_quit_chrome() {
  if [ -n "${WAITING_ROOM_QUIT_CMD:-}" ]; then
    sh -c "$WAITING_ROOM_QUIT_CMD" >/dev/null 2>&1 || true
    return 0
  fi
  if pgrep -f -- "--user-data-dir=$WR_CHROME_DIR" >/dev/null 2>&1; then
    pkill -f -- "--user-data-dir=$WR_CHROME_DIR" >/dev/null 2>&1 || true
  fi
  return 0
}

# Ask the lobby whether a window is up or on its way; if not, quit the plugin's Chrome.
wr_quit_if_idle() {
  local token endpoint reply
  token="$(wr_token)"
  [ -n "$token" ] || return 0
  command -v curl >/dev/null 2>&1 || return 0
  endpoint="$(wr_endpoint)"
  reply="$(curl -s -m 5 --connect-timeout 3 "$endpoint/api/count?t=$token" 2>/dev/null || true)"
  case "$reply" in
    *'"window":false'*) wr_quit_chrome ;;
  esac
  return 0
}
