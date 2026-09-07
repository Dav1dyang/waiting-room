#!/usr/bin/env bash
# Every plugin test. The same thing as: node --test plugin/test/*.test.js
set -eu

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

for tool in node curl bash; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "waiting-room tests need $tool on the PATH." >&2
    exit 1
  fi
done

exec node --test plugin/test/*.test.js
