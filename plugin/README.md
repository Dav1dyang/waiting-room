# waiting-room

While your Claude works, a small window opens by itself and puts you on a call with a
stranger whose Claude is also working. It closes when either Claude finishes.

The stranger sees nothing about your task. Ever.

## Install

From the marketplace:

```
claude plugin marketplace add Dav1dyang/waiting-room
claude plugin install waiting-room@waiting-room
```

Or, in a session, `/plugin marketplace add Dav1dyang/waiting-room` then `/plugin install`.

To run this checkout instead of an installed copy:

```
claude --plugin-dir ./plugin
```

Then turn it on with the invite code you were given:

```
/waiting-room:on DUCK
```

## The three commands

| Command | What it does |
| --- | --- |
| `/waiting-room:on [code]` | Registers this machine, prints the rules and a one-time setup link. The code is only needed the first time. |
| `/waiting-room:off` | Stops all of it and closes any open window. |
| `/waiting-room:status` | On or off, and how many people are waiting on their Claude right now. |

Visit the setup link once. It asks for the microphone and for notifications, plays the
door sound, opens a test window, and lets you pick a desktop tint.

## What leaves your machine

One small POST per hook, to `POST /api/hook`, with exactly five fields and nothing else:

```json
{ "token": "k8s2vq7m...", "event": "tick", "why": null, "session": "3f9a...", "ts": 1757200000000 }
```

| Field | What it is |
| --- | --- |
| `token` | 20 random characters made on your machine. Not your name, not your email, not your account. |
| `event` | One of `started`, `tick`, `needs_you`, `paused`, `stopped`. |
| `why` | `bg` or `question` on a pause, `null` the rest of the time. |
| `session` | The first 16 hex of the sha256 of the session id. The id itself never leaves. |
| `ts` | Milliseconds since the epoch. |

Your prompt, your working directory, the tool being run, the transcript path, and the
assistant's message are read on your machine by `scripts/classify.js` and thrown away.
None of them are ever sent. `plugin/test/signal.test.js` checks the bytes of every POST
against the contents of every sample payload, so this stays true.

The room itself is peer to peer. Audio starts only when a stranger is matched, video only
when you both click, and nothing is recorded.

## Pointing at a different lobby

Highest wins:

1. `WAITING_ROOM_URL` in the environment
2. one line in `~/.waiting-room/endpoint`
3. `DEFAULT_ENDPOINT` in `scripts/config.sh`

`WAITING_ROOM_OPEN_CMD` replaces the window opener. It is run as a shell command with the
URL added as one more argument, which is how the tests capture a URL instead of launching
a browser. Without it, the window is a Chrome app window opened in the background, and the
default browser if there is no Chrome.

## State on your machine

Everything lives in one directory you can delete: `~/.waiting-room/`

```
token      20 characters, made once
enabled    an empty file; present means on
invite     the code you registered with
endpoint   an optional lobby URL (you create this one)
```

## Uninstall

```
/waiting-room:off
claude plugin uninstall waiting-room@waiting-room
rm -rf ~/.waiting-room
```

Removing the marketplace (`/plugin marketplace remove waiting-room`) uninstalls it too.

## Tests

```
bash plugin/test/run.sh          # or: node --test plugin/test/*.test.js
```

No dependencies. The tests start a fake lobby on a random port, point a throwaway `HOME`
at a temporary directory, and drive the real scripts.
