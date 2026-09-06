#!/usr/bin/env bash
# Shared settings for the waiting-room plugin. Sourced by signal.sh and toggle.sh.
# Nothing in here prints anything and nothing in here touches the network.
set -u

# The lobby that ships with the plugin. The lead fills this in after the first deploy.
DEFAULT_ENDPOINT="https://waiting-room.REPLACE-ME.workers.dev"

# Everything this plugin remembers lives in one directory you can delete:
#   token     20 characters, made once, the only name the lobby knows you by
#   enabled   an empty file; present means on
#   invite    the code you registered with, so "on" works a second time with no code
#   endpoint  an optional lobby URL, one line, no trailing slash
WR_DIR="${HOME}/.waiting-room"
WR_TOKEN_FILE="$WR_DIR/token"
WR_FLAG_FILE="$WR_DIR/enabled"
WR_INVITE_FILE="$WR_DIR/invite"
WR_ENDPOINT_FILE="$WR_DIR/endpoint"
WR_LOCK_DIR="$WR_DIR/opening.lock"

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

# Open the room window, behind whatever you are looking at.
# WAITING_ROOM_OPEN_CMD replaces the whole thing; the URL arrives as its one argument.
# The tests use that to capture the URL instead of launching a browser.
wr_open_url() {
  local url="$1"
  if [ -n "${WAITING_ROOM_OPEN_CMD:-}" ]; then
    sh -c "$WAITING_ROOM_OPEN_CMD \"\$1\"" wr "$url" >/dev/null 2>&1 || true
    return 0
  fi
  # -n is needed so the --app switch reaches a Chrome that is already running.
  # -g keeps the new window behind the terminal (research 08).
  open -g -na "Google Chrome" --args --app="$url" >/dev/null 2>&1 && return 0
  # No Chrome: the default browser, still in the background.
  open -g "$url" >/dev/null 2>&1 || true
  return 0
}
