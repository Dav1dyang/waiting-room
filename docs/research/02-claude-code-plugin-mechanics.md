# claude-omegle — Claude Code plugin mechanics research

**Researched:** 2026-09-05
**Claude Code version on this machine:** `2.1.261` (`claude --version`)
**Primary sources:** raw Markdown of the official docs at `https://code.claude.com/docs/en/*.md`, fetched 2026-09-05.

Every fact below is either (a) cited to a doc URL, or (b) labeled **(observed)** — empirically
measured on this machine at v2.1.261 — or (c) labeled **(unverified)** where the docs are silent.
Nothing here is written from memory.

Doc URLs used throughout:

| Short name | URL |
| :-- | :-- |
| hooks ref | https://code.claude.com/docs/en/hooks |
| hooks guide | https://code.claude.com/docs/en/hooks-guide |
| plugins | https://code.claude.com/docs/en/plugins |
| plugins ref | https://code.claude.com/docs/en/plugins-reference |
| marketplaces | https://code.claude.com/docs/en/plugin-marketplaces |
| discover plugins | https://code.claude.com/docs/en/discover-plugins |
| skills (slash commands) | https://code.claude.com/docs/en/skills |
| statusline | https://code.claude.com/docs/en/statusline |
| settings ref | https://code.claude.com/docs/en/settings-reference |
| env vars | https://code.claude.com/docs/en/env-vars |

> Note: `https://code.claude.com/docs/en/slash-commands.md` now serves the **same content** as
> `skills.md` (byte-identical, 100582 bytes, both titled "Extend Claude with skills"). Slash-command
> frontmatter is documented on the Skills page.

---

## 0. Read this first — the four facts that shape the design

These change the architecture, so they lead.

### 0.1 `Stop` does NOT fire on user interrupt

> "Runs when the main Claude Code agent has finished responding. **Does not run if the stoppage
> occurred due to a user interrupt.** API errors fire [StopFailure](#stopfailure) instead."
> — hooks ref, `### Stop` section (https://code.claude.com/docs/en/hooks#stop)

**Consequence for claude-omegle:** pressing `Esc` / `Ctrl+C` mid-turn produces a "started" signal with
no matching "stopped" signal. The WebRTC call would hang open forever. You must either:

- give the server a **TTL / heartbeat** (treat a session as stopped if no signal for N seconds), and/or
- hook **`StopFailure`** (turn ended on an API error) and **`SessionEnd`** as additional "stopped" edges, and
- treat the next **`UserPromptSubmit`** as an idempotent "started" that implicitly closes any prior call.

The minimal example in §12 hooks `UserPromptSubmit`, `Stop`, `StopFailure`, `SessionEnd`, and
`Notification(permission_prompt)` for exactly this reason.

### 0.2 `Notification` / `permission_prompt` is gated behind ~6 seconds of idle typing

> "Expect `permission_prompt` once you haven't typed for about six seconds. The timer starts when the
> permission prompt appears, and each keystroke defers it. **To run a hook immediately when Claude asks
> for permission to use a tool, use [PermissionRequest](#permissionrequest) instead.**"
> — hooks ref, `### Notification` (https://code.claude.com/docs/en/hooks#notification)

And from the `PermissionRequest` section:

> "Use this event when you need a signal the moment Claude asks for permission to use a tool. Claude
> Code runs a [Notification](#notification) hook with the `permission_prompt` type only after the
> prompt has waited about six seconds."
> — hooks ref (https://code.claude.com/docs/en/hooks#permissionrequest)

`PermissionRequest` is **safe to use as a passive observer**: decisions are only made through the
`decision` object, and

> "A hook that exits 2 without a `decision` object leaves the permission flow unchanged, and its
> stderr is discarded. Only the `decision` object can grant or deny the request."
> — hooks ref, `#### PermissionRequest decision control`

One caveat, quoted so you can judge it:

> "In sessions that can't show a prompt, such as background subagents in
> [non-interactive mode](/docs/en/headless), Claude Code still runs these hooks, and if no hook returns
> a decision, it denies the tool call." — hooks ref, `### PermissionRequest`

That auto-deny is the pre-existing behavior for prompt-less sessions, not something your silent hook
introduces. Also note `PermissionRequest` hooks **do not** fire for a sandboxed command's network
request — for that prompt only the `permission_prompt` notification type fires (hooks ref, same section).

### 0.3 `async: true` is the documented fire-and-forget — you do not need `cmd &`

> "By default, hooks block Claude's execution until they complete. ... set `"async": true` to run the
> hook in the background while Claude continues working. Async hooks can't block or control Claude's
> behavior: response fields like `decision`, `permissionDecision`, and `continue` have no effect"
> — hooks ref, `## Run hooks in the background` (https://code.claude.com/docs/en/hooks#run-hooks-in-the-background)

- `async` is available **only on `type: "command"` hooks** (hooks ref, same section).
- "Once an async hook is running in the background, Claude Code doesn't enforce `timeout` on it."
- "Async hook completion notifications are suppressed by default. To see them, enable verbose mode with
  `Ctrl+O` or start Claude Code with `--verbose`."
- "Each execution creates a separate background process. There is no deduplication across multiple
  firings of the same async hook."
- `-p` caveat: "In [non-interactive mode](/docs/en/headless) with the `-p` flag, Claude Code kills any
  async hook still running at teardown and finalizes it with outcome `cancelled`" and "If your hook's
  work must outlive a `claude -p` session, start a fully detached process from it."

`async` explicitly applies on `UserPromptSubmit` (hooks ref: "Apart from a command hook you run with
`async: true`, a `UserPromptSubmit` command, HTTP, or MCP tool hook that reaches its timeout is
canceled…"). **(observed, v2.1.261)** it also works on `Stop` and `SessionEnd` — see §12.6.
An `async` `Notification` hook passes `claude plugin validate --strict` but was **not exercised**: a
headless run never idles long enough to cross the ~6-second `permission_prompt` gate.

### 0.4 Hooks run without a controlling TTY

> "On macOS and Linux, command hooks run in their own session without a controlling terminal. The hook
> process and any child processes can't open `/dev/tty` or send escape sequences directly to the Claude
> Code interface. Windows has no `/dev/tty`."
> — hooks ref, `### Common input fields` area (https://code.claude.com/docs/en/hooks)

**(observed)** a plugin hook's stdin is not a TTY (`[ -t 0 ]` → false).

---

## 1. Plugin anatomy

### 1.1 Directory layout

Source: plugins ref, `## Plugin directory structure` (https://code.claude.com/docs/en/plugins-reference#plugin-directory-structure)
and plugins, `## Plugin structure overview` (https://code.claude.com/docs/en/plugins#plugin-structure-overview).

```text
claude-omegle/
├── .claude-plugin/
│   └── plugin.json           # manifest — the ONLY thing that goes in .claude-plugin/
├── skills/                   # skills as <name>/SKILL.md dirs (preferred for new plugins)
│   └── omegle/SKILL.md
├── commands/                 # skills as flat .md files (legacy but supported)
│   └── omegle.md
├── agents/                   # subagent definitions
├── hooks/
│   └── hooks.json            # event handlers
├── .mcp.json                 # MCP server configs
├── .lsp.json                 # LSP server configs
├── monitors/monitors.json    # background monitors (experimental)
├── bin/                      # executables added to the Bash tool's PATH while enabled
├── settings.json             # plugin default settings (only `agent`, `subagentStatusLine`)
├── scripts/                  # your hook/utility scripts (convention, not special-cased)
├── README.md
└── LICENSE
```

> **Common mistake**: "Don't put `commands/`, `agents/`, `skills/`, or `hooks/` inside the
> `.claude-plugin/` directory. Only `plugin.json` goes inside `.claude-plugin/`. All other directories
> must be at the plugin root level." — plugins

`scripts/` has no special meaning to Claude Code; it is just where the docs' examples keep hook scripts.
`bin/` **is** special: "Executables added to the Bash tool's `PATH` while the plugin is enabled" (plugins).

A plugin shipping exactly one skill may put `SKILL.md` at the plugin root instead of creating `skills/`
(plugins ref, `### Skills`).

### 1.2 `plugin.json` fields

Source: plugins ref, `### Plugin manifest schema` (https://code.claude.com/docs/en/plugins-reference#plugin-manifest-schema).

**Required:** `name` only — "Unique identifier in kebab-case … Used for namespacing components."

| Field | Type | Notes |
| :-- | :-- | :-- |
| `name` | string | **required**, kebab-case, becomes the `/name:` namespace prefix |
| `displayName` | string | UI label; falls back to `name` |
| `version` | string | semver; if set, users only get updates when you bump it |
| `description` | string | shown in the plugin manager |
| `author` | object | `{name, email, url}` |
| `homepage` | string | |
| `repository` | string | |
| `license` | string | |
| `keywords` | array | |
| `metadata` | object | free-form, not interpreted by Claude Code |
| `defaultEnabled` | boolean | default `true`; overridden by user settings |
| `skills` | string\|array | **adds to** the default `skills/` |
| `commands` | string\|array | **replaces** the default `commands/` |
| `agents` | string\|array | **replaces** the default `agents/` |
| `workflows` | string\|array | **replaces** default `workflows/` |
| `hooks` | string\|array\|object | inline hook config or path(s) to hook JSON files |
| `mcpServers` | string\|array\|object | inline or path(s) |
| `outputStyles` | string\|array | replaces `output-styles/` |
| `lspServers` | string\|array\|object | inline or path(s) |
| `experimental.themes` / `experimental.monitors` | string\|array | replace their default dirs |
| `userConfig` | object | user-configurable options collected at enable time |
| `channels` | array | message channel declarations |
| `dependencies` | array | `["name"]` or `[{"name": "x", "version": "~2.1.0"}]` |

Replace-vs-add matters: "when the manifest specifies `commands`, the default `commands/` directory is
not scanned. To keep the default and add more, list it explicitly: `"commands": ["./commands/", "./extras/"]`"
(plugins ref, `#### Path behavior rules`).

`userConfig` option schema: `type` (`string|number|boolean|directory|file`), `title`, `description`
(all three required), plus optional `sensitive`, `required`, `default`, `multiple`, `min`, `max`.
Sensitive values are exposed **only** as `CLAUDE_PLUGIN_OPTION_<KEY>` env vars; non-sensitive values
also substitute as `${user_config.KEY}`. Note the injection guard:

> "Hook commands reject `${user_config.*}` to prevent shell injection; use exec form or read from
> environment" — plugins ref, `### User configuration`

This is the right mechanism for the claude-omegle service URL and any shared secret.

### 1.3 `${CLAUDE_PLUGIN_ROOT}` and friends

Source: plugins ref, `### Environment variables` (https://code.claude.com/docs/en/plugins-reference#environment-variables).

| Placeholder | Resolves to |
| :-- | :-- |
| `${CLAUDE_PLUGIN_ROOT}` | "Absolute path to the plugin's installation directory" |
| `${CLAUDE_PLUGIN_DATA}` | "`~/.claude/plugins/data/{id}/`, where `{id}` is the plugin identifier with characters outside `a-z`, `A-Z`, `0-9`, `_`, and `-` replaced by `-`" — e.g. `formatter@my-marketplace` → `~/.claude/plugins/data/formatter-my-marketplace/`. Created on first reference; survives plugin updates; deleted when the plugin is uninstalled from the last scope |
| `${CLAUDE_PROJECT_DIR}` | "The project root" |

> "All three are exported as environment variables to hook processes and to MCP and LSP server
> subprocesses." — plugins ref

Caveat on `CLAUDE_PLUGIN_ROOT`: it changes when the plugin updates (marketplace installs cache per
version), so never persist state under it — that is what `CLAUDE_PLUGIN_DATA` is for.

**(observed, v2.1.261)** for a plugin loaded with `--plugin-dir /path/to/probe`, a hook process saw:

```
CLAUDE_PLUGIN_ROOT = /…/scratchpad/probe          # exactly the --plugin-dir path
CLAUDE_PLUGIN_DATA = ~/.claude/plugins/data/omegle-probe-inline
CLAUDE_PROJECT_DIR = /…/scratchpad
CLAUDE_EFFORT      = xhigh
CLAUDE_CODE_REMOTE = (unset)
CLAUDE_SESSION_ID  = (unset)
stdin is a TTY?    = no
```

So `${CLAUDE_PLUGIN_DATA}` **does** work for `--plugin-dir` plugins; the identity suffix is `-inline`
(consistent with plugins ref noting that `--plugin-dir` plugins use the `@inline` identity).

### 1.4 Other environment variables available to hook commands

Source: hooks ref (`### Common input fields` prose) and env vars (https://code.claude.com/docs/en/env-vars).

| Variable | Meaning |
| :-- | :-- |
| `CLAUDE_PROJECT_DIR` | project root where the session started; "Script sees `export CLAUDE_PROJECT_DIR=…` even if run from a worktree" |
| `CLAUDE_PLUGIN_ROOT` | plugin install dir (plugin hooks) |
| `CLAUDE_PLUGIN_DATA` | plugin persistent data dir (plugin hooks) |
| `CLAUDE_PLUGIN_OPTION_<KEY>` | value of a `userConfig` option, including sensitive ones |
| `CLAUDE_EFFORT` | `low`/`medium`/`high`/`xhigh`/`max` — "The level is also available to hook commands and the Bash tool as the `$CLAUDE_EFFORT` environment variable" |
| `CLAUDE_CODE_REMOTE` | `"true"` in cloud environments, unset locally |
| `CLAUDE_CODE_BRIDGE_SESSION_ID` | Remote Control session ID (v2.1.199+) |
| `CLAUDE_ENV_FILE` | **Not general.** "SessionStart hooks have access to the `CLAUDE_ENV_FILE` environment variable, which provides a file path where you can persist environment variables for subsequent Bash commands" (hooks ref). Also available to `Setup`, `CwdChanged`, `FileChanged` hooks (env vars: "Also populated dynamically by SessionStart, Setup, CwdChanged, and FileChanged hooks"). It is a path to a shell preamble script Claude Code sources before each Bash command — **not** a source of session metadata. Irrelevant to claude-omegle. |

Explicitly **not** available:

> "There is no `$CLAUDE_MODEL` environment variable." — hooks ref
> "A hook process inherits the parent environment, apart from the `OTEL_*` exporter variables that
> Claude Code removes from every subprocess it spawns and, when `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is
> set to `1`, the variables it strips." — hooks ref

`${CLAUDE_SESSION_ID}` exists, but as a **skill/command content placeholder**, not a hook env var
(skills: "`${CLAUDE_SESSION_ID}` — The current session ID. Useful for logging, creating session-specific
files, or correlating skill output with sessions."). **(observed)** it is not exported to hook processes.
Hooks get the session id from the stdin JSON instead.

---

## 2. Hooks in plugins — `hooks/hooks.json`

### 2.1 Wrapper shape: **`{"hooks": {...}}`**, not the bare map

Source: plugins ref, `### Hooks` (https://code.claude.com/docs/en/plugins-reference#hooks); plugins,
migration step "Copy the `hooks` object from your `.claude/settings.json` … since the format is the same."

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "\"${CLAUDE_PLUGIN_ROOT}\"/scripts/format-code.sh" }
        ]
      }
    ]
  }
}
```

Two nesting levels: `hooks.<EventName>` is an array of **matcher groups**, each with an inner `hooks`
array of **handlers**.

### 2.2 Matcher semantics

Source: hooks ref, `### Matchers` / matcher tables.

| Matcher value | Interpreted as |
| :-- | :-- |
| `"*"`, `""`, or omitted | match everything |
| only letters, digits, `_`, `-`, spaces, `,`, `\|` | exact string, or a list separated by `\|` / `,` |
| anything else | JavaScript regex, **unanchored** |

Per-event matcher targets (hooks ref):

| Event(s) | Matcher filters on |
| :-- | :-- |
| `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PermissionDenied` | tool name |
| `SessionStart` | `startup`, `resume`, `clear`, `compact`, `fork` |
| `SessionEnd` | `clear`, `resume`, `logout`, `prompt_input_exit`, `other` |
| `Notification` | notification type (full list in §3.1) |
| `SubagentStart`, `SubagentStop` | agent type |
| `Setup` | `init`, `maintenance` |
| `PreCompact`, `PostCompact` | `manual`, `auto` |
| `PreModelSwitch`, `PostModelSwitch` | canonical model name |
| `ConfigChange` | `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills` |
| `FileChanged` | literal filenames to watch |
| `StopFailure` | `rate_limit`, `overloaded`, `authentication_failed`, `server_error` |
| `InstructionsLoaded` | `session_start`, `nested_traversal`, `path_glob_match`, `include`, `compact` |
| `UserPromptExpansion` | command name |
| `Elicitation`, `ElicitationResult` | MCP server name |
| **`UserPromptSubmit`, `Stop`, `PostToolBatch`, `TeammateIdle`, `TaskCreated`, `TaskCompleted`, `CwdChanged`, `WorktreeCreate`, `WorktreeRemove`, `MessageDisplay`** | **no matcher support — always fires** |

Note for plugin-scoped subagents: "The colon places a plugin-scoped name on the regular-expression
path, so anchor the matcher with `^` and `$` for an exact match: `^my-plugin:reviewer$`" (hooks ref).

### 2.3 Handler fields

**Handler types (5):** `command`, `http`, `mcp_tool`, `prompt`, `agent` (hooks ref, `## Hook types`).

**Common fields (all types):**

| Field | Req | Description |
| :-- | :-- | :-- |
| `type` | yes | one of the five above |
| `if` | no | permission-rule condition, tool events only, e.g. `"Bash(git *)"` |
| `timeout` | no | seconds. Defaults **600** (`command`/`http`/`mcp_tool`), 30 (`prompt`), 60 (`agent`). Lowered to **30 on `UserPromptSubmit`**, `PreModelSwitch`, `PostModelSwitch`; **10 on `MessageDisplay`**; `SessionEnd` hooks share a **1.5 s** budget (raisable to 60 s). Not enforced on `async: true` command hooks |
| `statusMessage` | no | custom spinner text while the hook runs |
| `once` | no | remove after first successful run (skill frontmatter only) |

**`type: "command"` fields:**

| Field | Req | Description |
| :-- | :-- | :-- |
| `command` | yes | shell command or executable path; supports `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}` |
| `args` | no | argument array. **Present → exec form** (direct spawn, no shell). **Absent → shell form** (`sh -c` on Unix, PowerShell on Windows) |
| `async` | no | `true` = run in background, non-blocking |
| `asyncRewake` | no | `true` = background, and wake Claude on exit code 2 (stderr, or stdout if stderr empty, shown as a system reminder) |
| `shell` | no | `"bash"` or `"powershell"`; ignored when `args` is set |

**Exec form vs shell form**, verbatim from hooks ref, `##### Exec form and shell form`:

> "A command hook runs as exec form when `args` is set, and shell form when `args` is omitted.
> **Set `args` whenever the hook references a [path placeholder](#reference-scripts-by-path), since each
> element is passed as one argument with no quoting.** Omit `args` when you need shell features like
> pipes or `&&`, or when neither concern applies."

> "**Exec form** runs when `args` is present. Claude Code resolves `command` as an executable on `PATH`
> and spawns it directly with `args` as the argument vector. There is no shell, so each `args` element
> is one argument exactly as written, and path placeholders like `${CLAUDE_PLUGIN_ROOT}` are substituted
> into `command` and into each `args` element as plain strings."

> "**Shell form** runs when `args` is absent. The `command` string is passed to a shell: `sh -c` on
> macOS and Linux, Git Bash on Windows, or PowerShell when Git Bash isn't installed."

Since claude-omegle's hooks reference `${CLAUDE_PLUGIN_ROOT}`, the docs say to use **exec form**. The
§12 example does.

Two more exec-form-only rules for plugin hooks:

> "Plugin hooks additionally substitute `${user_config.*}` values, **in exec form only**"
> "A shell-form plugin hook whose `command` references `${user_config.*}` **fails with an error**
> instead of running. To use an option value from a shell-form hook, read the
> `$CLAUDE_PLUGIN_OPTION_<KEY>` environment variable, such as `$CLAUDE_PLUGIN_OPTION_WEBHOOK_URL` for a
> `webhook_url` option, or set `args` to switch the hook to exec form."

Windows caveat: "exec form requires `command` to resolve to a real executable such as a `.exe`. The
`.cmd` and `.bat` shims that npm, npx, eslint, and other tools install in `node_modules/.bin` are not
executables and can't be spawned without a shell."

### 2.4 Fire-and-forget: what to use

**Use `"async": true`.** It is the documented, first-class mechanism (§0.3). You do **not** need
`cmd >/dev/null 2>&1 &`. The docs never mention `&` backgrounding for hooks.

`cmd &` in shell form would also work mechanically but is strictly worse: you lose Claude Code's
process bookkeeping, you inherit the (unenforced-anyway) timeout semantics unpredictably, and on `-p`
teardown Claude Code will not know to finalize it. The one documented case for detaching yourself:

> "If your hook's work must outlive a `claude -p` session, start a fully detached process from it."

For claude-omegle a 2-second `curl` finishes long before teardown, so plain `async: true` is right —
**(observed)** it delivered all three signals successfully inside a `claude -p` run (§12.4).

**Alternative worth knowing: `type: "http"`.** It POSTs the hook's JSON input directly to a URL with
`Content-Type: application/json` — **no script at all**. Fields: `url` (required), `headers`,
`allowedEnvVars`, `timeout` (hooks ref, `### HTTP hook fields`). Two frictions:

1. **`http` hooks have no `async` field** — `async` is "only available on `type: "command"` hooks". So
   an HTTP hook blocks the turn until it returns or times out (default 600 s, 30 s on `UserPromptSubmit`).
   For a local service that is probably fine, but a hung service stalls Claude.
2. Users/admins may restrict it via the **`allowedHttpHookUrls`** setting: "Limit which URLs HTTP hooks
   can target. When you define this key, Claude Code runs an HTTP hook only if its URL matches one of
   the patterns and blocks the rest without running them; an empty array blocks every HTTP hook. …
   The allowlist applies to hooks from every source, including managed settings."
   (settings ref, https://code.claude.com/docs/en/settings-reference#allowedhttphookurls). Example:
   `{"allowedHttpHookUrls": ["http://localhost:*"]}`.

**Recommendation:** `type: "command"` + `async: true` + a tiny `curl` script. Keeps non-blocking
behavior and avoids the allowlist.

---

## 3. Full list of hook events

Source: hooks ref, `## Hook events` table (https://code.claude.com/docs/en/hooks#hook-events). This is
the complete v2.1.261 list — 33 events.

| Event | When it fires |
| :-- | :-- |
| `SessionStart` | When a session begins or resumes |
| `Setup` | When you start with `--init-only`, or `--init`/`--maintenance` in `-p` mode. For one-time preparation in CI or scripts |
| `UserPromptSubmit` | When you submit a prompt, before Claude processes it |
| `UserPromptExpansion` | When a user-typed command expands into a prompt, before it reaches Claude. Can block the expansion |
| `PreToolUse` | Before a tool call executes. Can block it |
| `PermissionRequest` | When a tool call needs a permission decision |
| `PermissionDenied` | When auto mode denies a tool call, including denials without a classifier verdict |
| `PostToolUse` | After a tool call succeeds |
| `PostToolUseFailure` | After a tool call fails |
| `PostToolBatch` | After a full batch of parallel tool calls resolves, before the next model call |
| `Notification` | When Claude Code sends a notification |
| `MessageDisplay` | While assistant message text is displayed |
| `SubagentStart` | When a subagent is spawned |
| `SubagentStop` | When a subagent finishes |
| `TaskCreated` | When a task is being created via `TaskCreate` |
| `TaskCompleted` | When a task is being marked as completed |
| `Stop` | When Claude finishes responding |
| `StopFailure` | When the turn ends due to an API error |
| `TeammateIdle` | When an agent team teammate is about to go idle |
| `InstructionsLoaded` | When a CLAUDE.md or `.claude/rules/*.md` file is loaded into context |
| `ConfigChange` | When a configuration file changes during a session |
| `CwdChanged` | When the working directory changes, e.g. when Claude executes a `cd` command |
| `DirectoryAdded` | When a working directory is added mid-session via `/add-dir` or the SDK `register_repo_root` control request |
| `FileChanged` | When a watched file changes on disk. The `matcher` field specifies which filenames to watch |
| `WorktreeCreate` | When a worktree is being created via `--worktree`, `isolation: "worktree"`, or for a background session. Replaces default git behavior |
| `WorktreeRemove` | When a worktree is being removed at session exit, when a subagent finishes, or when you delete a background session |
| `PreCompact` | Before context compaction |
| `PostCompact` | After context compaction completes |
| `PreModelSwitch` | Before Claude Code applies a model switch that you or a client requested. Can block the switch |
| `PostModelSwitch` | After the session's model changes |
| `Elicitation` | When an MCP server requests user input during a tool call |
| `ElicitationResult` | After a user responds to an MCP elicitation, before the response is sent back to the server |
| `SessionEnd` | When a session terminates |

Answering the "any newer events?" list from the brief: **`PermissionRequest`, `StopFailure`,
`Elicitation`, `SubagentStart`, `PostToolUseFailure`, `TaskCompleted`, `ConfigChange`, `WorktreeCreate`
all exist**, exactly as guessed. Also present and not guessed: `PermissionDenied`, `PostToolBatch`,
`MessageDisplay`, `TeammateIdle`, `InstructionsLoaded`, `CwdChanged`, `DirectoryAdded`, `FileChanged`,
`WorktreeRemove`, `UserPromptExpansion`, `Setup`, `TaskCreated`, `ElicitationResult`, `PreModelSwitch`,
`PostModelSwitch`, `PostCompact`.

Cadence (hooks ref, `## Hook events` intro): once per session — `SessionStart`, `SessionEnd`;
once per turn — `UserPromptSubmit`, `Stop`, `StopFailure`; per tool call — `PreToolUse`, `PostToolUse`.

### 3.1 `Notification` matcher types (complete list)

Source: hooks ref, `### Notification`.

| Type | When |
| :-- | :-- |
| `permission_prompt` | Claude needs you to approve a tool use or a sandboxed command's network request, **and the prompt has waited about six seconds** |
| `idle_prompt` | Claude finished responding about 60 seconds ago and you haven't typed since |
| `auth_success` | Authentication completes |
| `elicitation_dialog` | An MCP server opens an elicitation form and you haven't typed for ~6 s |
| `elicitation_url_dialog` | An MCP server asks you to open a browser URL and you haven't typed for ~6 s |
| `elicitation_complete` | An MCP server reports that a URL-mode elicitation is complete |
| `elicitation_response` | An MCP elicitation response is sent back to the server |
| `agent_needs_input` | A background session starts waiting on your input while agent view is open in a terminal, or the current session asks an agent-team teammate terminal setup question (v2.1.198+) |
| `agent_completed` | A background session finishes or fails. Fires only while agent view is open in a terminal (v2.1.198+) |
| `quota_auto_resume_fired` | Claude Code continues your task after a claude.ai usage limit paused it (v2.1.234+) |
| `quota_auto_resume_stale` | A usage limit reset while your computer slept >~30 min (v2.1.234+) |
| `quota_auto_resume_disabled` | Claude Code ends its wait without continuing your task (v2.1.234+) |

Useful: "You receive these hook events even with desktop notifications turned off: the
`preferredNotifChannel` setting, including `notifications_disabled`, changes only how you're alerted,
not whether your hook runs." (hooks ref)

---

## 4. Exact stdin payloads

### 4.1 Common input fields (every event)

Source: hooks ref, `### Common input fields`.

| Field | Description |
| :-- | :-- |
| `session_id` | "Current session identifier" |
| `prompt_id` | "UUID identifying the user prompt currently being processed. Matches the `prompt.id` attribute on OpenTelemetry events… Absent until the first user input. Requires Claude Code v2.1.196 or later" |
| `transcript_path` | "Path to conversation JSON. The transcript file is written asynchronously and may lag the in-memory conversation" |
| `cwd` | "Current working directory when the hook is invoked" |
| `permission_mode` | `"default"`, `"plan"`, `"acceptEdits"`, `"auto"`, `"dontAsk"`, `"bypassPermissions"`. "**Not all events receive this field.**" The **Manual** mode arrives as `"default"` |
| `effort` | `{ "level": "low"\|"medium"\|"high"\|"xhigh"\|"max" }`. "Present for events that fire within a tool-use context, such as `PreToolUse`, `PostToolUse`, `Stop`, and `SubagentStop`, when the current model supports the effort parameter" |
| `hook_event_name` | Name of the event that fired |
| `agent_id`, `agent_type` | Only when running with `--agent` or inside a subagent |

### 4.2 `UserPromptSubmit`

Extra field: `prompt` — "the text the user submitted".

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf-....jsonl",
  "cwd": "/Users/...",
  "permission_mode": "default",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "Write a function to calculate the factorial of a number"
}
```

**(observed, v2.1.261, `claude -p`)** actual keys: `cwd`, `hook_event_name`, `permission_mode`,
`prompt`, `prompt_id`, `session_id`, `transcript_path`.

### 4.3 `Stop`

Extra fields: `stop_hook_active`, `last_assistant_message`, `background_tasks`, `session_crons`.

```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../00893aaf-....jsonl",
  "cwd": "/Users/...",
  "permission_mode": "default",
  "hook_event_name": "Stop",
  "stop_hook_active": true,
  "last_assistant_message": "I've completed the refactoring. Here's a summary...",
  "background_tasks": [
    { "id": "task-001", "type": "shell", "status": "running",
      "description": "tail logs", "command": "tail -f /var/log/syslog" }
  ],
  "session_crons": []
}
```

Notes from hooks ref, `#### Stop input`:

- "`last_assistant_message` … contains the text content of Claude's final response, so hooks can access
  it without parsing the transcript file. For hooks that act on the just-completed turn, such as
  read-aloud or notification hooks, use this field rather than reading `transcript_path`."
- "The `background_tasks` and `session_crons` arrays let hooks distinguish 'session is done' from
  'session is paused waiting for background work to wake it back up'. Both arrays are present when the
  task registry is reachable and are empty when nothing is in flight or scheduled."
  → **useful for claude-omegle**: a non-empty `background_tasks` means the session is not really idle.
  `background_tasks[]` entries have `id`, `type` (`shell`, `subagent`, `monitor`, `workflow`,
  `teammate`, `cloud session`, `MCP task`), `status`, `description`, `command`.

**(observed)** actual keys: `background_tasks`, `cwd`, `hook_event_name`, `last_assistant_message`,
`permission_mode`, `prompt_id`, `session_crons`, `session_id`, `stop_hook_active`, `transcript_path`.

### 4.4 `Notification`

Extra fields: `message`, optional `title`, `notification_type`.

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf-....jsonl",
  "cwd": "/Users/...",
  "hook_event_name": "Notification",
  "message": "Claude needs your permission",
  "title": "Permission needed",
  "notification_type": "permission_prompt"
}
```

No `permission_mode` in the documented example.

### 4.5 `SessionStart`

Extra fields: `source` (required), optional `model`, `agent_type`, `session_title`.

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf-....jsonl",
  "cwd": "/Users/...",
  "hook_event_name": "SessionStart",
  "source": "resume",
  "model": "claude-opus-5",
  "seconds_since_last_response": 5400,
  "context_tokens": 182340,
  "prompt_cache_likely_expired": true,
  "estimated_cache_write_usd": 1.1396
}
```

- `source`: `"startup"` | `"resume"` | `"clear"` | `"compact"` | `"fork"`.
- `model` "can be omitted, for example after `/clear` or when a session is restored through conversation
  recovery, so check for the field before reading it".
- The last four fields appear **only** when `source` is `"resume"` or `"fork"` and the transcript has at
  least one Claude response; they require **v2.1.251+**.
- `seconds_since_last_response` is "Wall-clock seconds since the last response in the resumed
  transcript" — the closest thing to a timestamp anywhere in the hook payloads, and it exists only here.
- Only `type: "command"` and `type: "mcp_tool"` hooks are supported on `SessionStart`.

**(observed, `claude -p`)** keys: `cwd`, `hook_event_name`, `session_id`, `source` (`"startup"`),
`transcript_path`. **No `permission_mode`, no `model`, no `prompt_id`** in a fresh headless session.

### 4.6 `SessionEnd`

Extra field: `reason`.

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../00893aaf-....jsonl",
  "cwd": "/Users/...",
  "hook_event_name": "SessionEnd",
  "reason": "other"
}
```

`reason` values: `clear`, `resume`, `logout`, `prompt_input_exit`, `other`
(`bypass_permissions_disabled` was removed in v2.1.234 — "Drop it from your `SessionEnd` matchers").

Timing constraint that matters: "SessionEnd hooks have a default timeout of **1.5 seconds**… The
overall budget is automatically raised to the highest per-hook timeout configured in settings files, up
to 60 seconds. **Timeouts set on plugin-provided hooks don't raise the budget.**" Override with
`CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS` (milliseconds). → A plugin's SessionEnd hook effectively has
1.5 s. Use `async: true` so it isn't waited on, and keep `curl -m 2` short.

**(observed)** keys: `cwd`, `hook_event_name`, `prompt_id`, `reason` (`"other"`), `session_id`,
`transcript_path`.

### 4.7 Is there a timestamp / turn / elapsed-time field?

**No.** No hook event carries a wall-clock timestamp, turn duration, or elapsed time. The only
time-shaped field anywhere is `seconds_since_last_response` on a **resumed/forked `SessionStart`**
(v2.1.251+). **(observed)** confirms: no timestamp key in any captured payload.

Correlators that do exist:

- `prompt_id` — stable across `UserPromptSubmit` and `Stop` for the same prompt **(observed:** identical
  UUID on both, and also present on `SessionEnd`**)**; matches the OpenTelemetry `prompt.id`.
- `turn_id` and `message_id` — on `MessageDisplay` only.
- `session_id` — stable for the whole session (see §9).

**Your server must stamp its own arrival times.** That is fine — it also makes the server the single
clock, which you need anyway for the interrupt-TTL in §0.1.

---

## 5. `Stop` semantics in detail

| Question | Answer | Source |
| :-- | :-- | :-- |
| Fires at the end of every assistant turn? | Yes for normal completion — "Runs when the main Claude Code agent has finished responding"; listed as a **once-per-turn** event | hooks ref, `### Stop`, `## Hook events` |
| Fires when Claude ends by asking the user a question? | **(inferred, not stated)** — the docs define `Stop` purely as "finished responding" with no carve-out for questions, and `AskUserQuestion`/`EndConversation` are not listed as exceptions. Ending a turn with a question is still finishing a response, so `Stop` should fire. **Test this before relying on it.** | inference from hooks ref |
| Fires after a permission denial? | **(inferred)** — a denial is a tool-call outcome, not a turn end. The turn continues and ends normally, so `Stop` fires then. `PermissionDenied` is a separate event for the denial itself. | inference from hooks ref |
| Fires on Escape / Ctrl+C interrupt? | **No.** "Does not run if the stoppage occurred due to a user interrupt." | hooks ref, `### Stop` |
| Fires on API error? | **No** — `StopFailure` fires instead, with `error_type` (`rate_limit`, `overloaded`, `authentication_failed`, `server_error`) and `error_message` | hooks ref, `### Stop`, `### StopFailure` |
| Fires for subagent completions? | **No** — that is `SubagentStop`. In **subagent frontmatter** only, "Claude Code converts a `Stop` hook here to `SubagentStop`" | hooks ref |
| Can it fire more than once per turn? | Yes, indirectly: if a `Stop` hook **blocks** (exit 2 or `decision: "block"` / `additionalContext`), Claude keeps working and `Stop` fires again when it next finishes. Capped: "Claude Code overrides the hook and ends the turn after **8 consecutive blocks**." A hook that never blocks fires once per turn. | hooks ref, `#### Stop input` |

**`stop_hook_active`**, verbatim:

> "The `stop_hook_active` field is `true` when Claude Code is already continuing as a result of a stop
> hook. Check this value or process the transcript to avoid blocking on a condition that will never
> resolve. Claude Code overrides the hook and ends the turn after 8 consecutive blocks."
> — hooks ref, `#### Stop input`

For claude-omegle you never block, so `stop_hook_active` will always be `false` **(observed:** `false`
in a normal `-p` turn**)**. You can safely ignore it — or use `stop_hook_active === true` to skip
sending a duplicate "stopped" signal if some *other* plugin's Stop hook is looping.

### 5.1 Recommended state machine

```
UserPromptSubmit  ->  START   (idempotent; also closes any stale call)
Stop              ->  STOP
StopFailure       ->  STOP    (API error ended the turn)
SessionEnd        ->  STOP    (+ retire the session)
Notification(permission_prompt) or PermissionRequest -> PAUSE/"needs you"
[server-side TTL] ->  STOP    (covers Esc / Ctrl+C, crash, kill -9)
```

The TTL is not optional. It is the only thing covering the interrupt path.

---

## 6. Exit codes, stdout, and staying invisible

Source: hooks ref, `#### Exit code 0`, `#### Exit code 2`, `## JSON output`.

### 6.1 Exit code 0

> "For most events, Claude Code writes stdout to the debug log and doesn't show it in the transcript.
> **The exceptions are `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, and `PostModelSwitch`,
> where Claude Code adds plain-text stdout as context that Claude can see and act on.**"

How stdout is classified (whitespace ignored):

- starts `{` and ends `}` → parsed as JSON output
- starts `{` but doesn't end `}` → plain text
- starts with anything else (including a JSON array or quoted string) → plain text

And the trap:

> "For events that use the standard decision model, when Claude Code tries to parse your stdout as JSON
> and can't, it reports a non-blocking error on every exit code other than 2. The transcript shows a
> `<hook name> hook error` notice with the parse message."

Stderr on exit 0: "goes to the debug log only, never the transcript, and Claude never sees it."

### 6.2 Exit code 2 — blocking, per event

| Event | Effect of exit 2 |
| :-- | :-- |
| `PreToolUse` | tool call prevented |
| `UserPromptSubmit` | prompt erased and rejected |
| `UserPromptExpansion` | expansion blocked |
| `Stop`, `SubagentStop` | conversation continues (stop prevented) |
| `TeammateIdle` | teammate keeps working |
| `TaskCreated` / `TaskCompleted` | creation rolled back / not marked complete |
| `ConfigChange` | change not applied (except `policy_settings`) |
| `PostToolBatch` | agentic loop stops before next model call |
| `PostToolUse`, `PostToolUseFailure` | no block; stderr shown to Claude as a warning |
| `PermissionRequest` | not honored — use the `decision` object |
| `Elicitation` / `ElicitationResult` | denies / blocks; stderr not shown anywhere |
| `WorktreeCreate` | **any nonzero exit** aborts worktree creation |
| `Notification`, `MessageDisplay`, `StopFailure`, `SessionEnd`, `InstructionsLoaded`, `Setup` | no decision control; JSON output discarded |

Also: "even a JSON `permissionDecision` of `"allow"` can't override it [exit 2]".

### 6.3 The clean way to be invisible

Rules for the claude-omegle hook script:

1. **Print nothing to stdout. Ever.** Redirect every subprocess: `curl … >/dev/null 2>&1`.
   This is the whole answer for `Stop`/`Notification`/`SessionEnd` (their stdout goes to the debug log
   anyway), and it is *essential* for `UserPromptSubmit`, whose stdout would be injected into Claude's
   context.
2. **Always `exit 0`.** Never 2 (blocks the event). Never a nonzero exit generally: on any code other
   than 2 the transcript can show a `<hook name> hook error` notice, and "the first line of stderr" is
   surfaced in it.
3. **Use `async: true`.** Async hooks deliver only `additionalContext` and `systemMessage` from valid
   JSON output, and "Unlike a synchronous hook's `systemMessage`, neither field is shown to you"; async
   completion notifications are "suppressed by default". Emitting no output at all means nothing is
   delivered and nothing is displayed.
4. **Do not set `statusMessage`** (it renders custom spinner text).
5. **`suppressOutput` is a red herring** — hooks ref, `## JSON output`: "`suppressOutput` … **Has no
   effect**: Claude Code accepts the field but doesn't act on it. A successful hook's stdout is never
   shown in the transcript and is recorded in the debug log."
6. Guard stdin: `cat >/dev/null` on the early-exit path so Claude Code's writer never sees `EPIPE`.

Combined, a hook that reads stdin, POSTs, prints nothing and exits 0 is invisible to both the user and
the model. **(observed)** the §12 plugin ran cleanly across repeated `-p` runs and never blocked or
errored. I did **not** inspect a rendered interactive transcript, so "invisible in the TUI" rests on the
doc statements above, not on measurement.

---

## 7. Slash commands in plugins

Source: skills (https://code.claude.com/docs/en/skills) — the authoritative page for slash-command
frontmatter — plus plugins ref, `### Skills`.

### 7.1 File format

- `commands/<name>.md` → a flat Markdown file, one command per file. "File under `.claude/commands/` →
  **File name without extension**" (skills, command-name table).
- `skills/<name>/SKILL.md` → the preferred layout for new plugins. "Skills as flat Markdown files.
  Use `skills/` for new plugins" (plugins ref).
- Precedence: "A command at `.claude/commands/deploy.md` and skill at `.claude/skills/deploy/SKILL.md`
  both create `/deploy`, but the skill takes precedence if both exist."

### 7.2 Frontmatter fields

| Field | Notes |
| :-- | :-- |
| `name` | In a **plugin skill**, sets the last segment of the command (`/plugin:name`). In a personal/project skill or a `commands/*.md` file, it is only a display label — the command name comes from the file/directory name |
| `description` | "What the skill does and when to use it. Claude uses this to decide when to apply the skill." Recommended |
| `argument-hint` | Autocomplete hint, e.g. `[issue-number]` or `[filename] [format]` |
| `disable-model-invocation` | `true` prevents Claude from auto-loading it; only you can run `/name`. Default `false` |
| `user-invocable` | `false` hides it from the `/` menu; only Claude can invoke |
| `allowed-tools` | Tools pre-approved for the turn that invokes the command. Space- or comma-separated string, or a YAML list. **Grant clears when you send your next message** |
| `disallowed-tools` | Tools removed from the pool while active |
| `model` | Model for the rest of the current turn; accepts `/model` values or `inherit` |
| `effort` | `low`/`medium`/`high`/`xhigh`/`max` |
| `context` | `fork` runs the skill in a forked subagent |
| `paths` | Globs limiting automatic activation |
| `shell` | `bash` (default) or `powershell` for `` !`…` `` blocks |
| `metadata` | Free-form YAML map, ignored by Claude Code |

Boolean fields accept `yes`/`no`/`on`/`off`/`1`/`0`/`true`/`false` in any case (v2.1.218+) — plugins ref.

### 7.3 Arguments

| Placeholder | Meaning |
| :-- | :-- |
| `$ARGUMENTS` | all arguments as typed |
| `$ARGUMENTS[N]` | 0-based index |
| `$N` | shorthand for `$ARGUMENTS[N]` — `$0` is the **first** argument |

- "Indexed arguments use shell-style quoting, so wrap multi-word values in quotes."
- "If you invoke a skill with arguments but no placeholder … receives one, Claude Code appends
  `ARGUMENTS: <your input>` to the end of the skill content."
- Escape a literal `$` before a digit or `ARGUMENTS` with a backslash: `\$1.00`.

### 7.4 Inline bash with `` ! ``

> "The `` !`<command>` `` syntax runs shell commands before the skill content is sent to Claude. The
> command output replaces the placeholder, so Claude receives actual data, not the command itself."

- "The inline form is only recognized when `!` appears at the start of a line or immediately after
  whitespace. If `!` follows another character, as in `` KEY=!`cmd` ``, the placeholder is left as
  literal text and the command does not run."
- Multi-line form: a fenced block opened with ` ```! `.
- "Substitution runs once over the original file. Command output … is not re-scanned."
- Pre-approve with `allowed-tools` to avoid a permission prompt. `${CLAUDE_SKILL_DIR}`,
  `${CLAUDE_PROJECT_DIR}` and, in plugin skills, `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_PLUGIN_DATA}` are
  substituted **both** in the body and in Bash rules in `allowed-tools` — "Using the same variable in
  both places lets a skill run a bundled script without a permission prompt."
- Timeout is 2 minutes per command; a failed command aborts the whole invocation.
- Kill switch: `"disableSkillShellExecution": true` in settings replaces each command with
  `[shell command execution disabled by policy]`. Design the command to degrade gracefully.

### 7.5 Namespace

**`/claude-omegle:omegle`**, not `/omegle`.

> "Plugin skills are always namespaced (like `/my-first-plugin:hello`) to prevent conflicts when
> multiple plugins have skills with the same name. To change the namespace prefix, update the `name`
> field in `plugin.json`." — plugins

But note: "The bare `/fancy` also invokes the skill unless another command already uses that name."
(skills). So `/omegle` will usually also work — just don't document it as the contract.

`commands/` subdirectories are **not** auto-discovered as namespaces; list nested files explicitly in
the manifest `commands` array (plugins ref, path behavior rules). Project-level nesting is different:
`apps/web/.claude/skills/deploy/SKILL.md` → `/apps/web:deploy`.

---

## 8. Distribution, install, and auditing

### 8.1 `marketplace.json`

At `.claude-plugin/marketplace.json` in the marketplace repo root (marketplaces):

```json
{
  "name": "davidyang-plugins",
  "owner": { "name": "David Yang", "url": "https://github.com/davidyang" },
  "plugins": [
    {
      "name": "claude-omegle",
      "source": "./plugins/claude-omegle",
      "description": "Open a WebRTC call with a stranger while Claude works."
    }
  ]
}
```

Required: `name` (kebab-case, this is the `@marketplace` half of the install id), `owner` (object with
required `name`), `plugins` (each entry needs `name` and `source`).

Source types: relative path (`"./plugins/x"`), `github`, `url` (any git URL), `git-subdir`, `npm`,
`archive` (with `sha256`), and `command` (v2.1.229+).

Optional plugin-entry fields: `displayName`, `description`, `version`, `author`, `homepage`,
`repository`, `license`, `keywords`, `category`, `tags`, `strict`, `defaultEnabled`, plus component
overrides (`skills`, `commands`, `agents`, `hooks`, `mcpServers`, `lspServers`) and
`headers`/`headersHelper`.

Optional marketplace fields: `$schema`, `description`, `version`, `metadata.pluginRoot`,
`allowCrossMarketplaceDependenciesOn`, `renames`.

Validate before publishing: `claude plugin validate .` (or `/plugin validate .`).

### 8.2 Add / install / enable / disable

Source: discover plugins, marketplaces.

```bash
# in-session
/plugin marketplace add davidyang/claude-plugins      # GitHub owner/repo shorthand
/plugin marketplace add https://gitlab.com/x/y.git#v1.0.0
/plugin marketplace add ./local-marketplace
/plugin install claude-omegle@davidyang-plugins
/plugin list [--enabled|--disabled]
/plugin enable  claude-omegle@davidyang-plugins
/plugin disable claude-omegle@davidyang-plugins
/plugin uninstall claude-omegle@davidyang-plugins
/plugin marketplace list | update <name> | remove <name>
/reload-plugins           # add --force if it warns about the prompt cache

# from a shell (scripting; doesn't open the panel)
claude plugin marketplace add davidyang/claude-plugins
claude plugin install claude-omegle@davidyang-plugins --scope project
claude plugin uninstall claude-omegle@davidyang-plugins --keep-data
claude plugin list --json
claude plugin details <name>
claude plugin validate ./claude-omegle [--strict]
```

Shortcuts: `/plugin market` for `/plugin marketplace`, `rm` for `remove`.

Install scopes: **User** (all your projects), **Project** (`.claude/settings.json`, shared with
collaborators), **Local** (this repo, just you), plus admin-installed **managed** scope.

Removing a marketplace uninstalls the plugins you installed from it.

### 8.3 Do plugin hooks require approval on install?

**No.** I searched the raw text of `plugin-marketplaces.md`, `discover-plugins.md`, and
`plugins-reference.md` for any hook-specific consent step and found none. The model is
trust-the-plugin, review-before-install:

> "Plugins and marketplaces are highly trusted components that can execute arbitrary code on your
> machine with your user privileges. Only install plugins and add marketplaces from sources you trust.
> Organizations can restrict which marketplaces users are allowed to add using managed marketplace
> restrictions." — discover plugins, `## Security`

> "Make sure you trust a plugin before installing it. Anthropic doesn't control what MCP servers,
> files, or other software are included in plugins and can't verify that they work as intended. Check
> each plugin's homepage for more information." — discover plugins, `## Install plugins`

The **only** per-install acceptance prompts documented are for two specific things, and neither is
about hooks:

1. **`command`-source plugins** — "Claude Code runs your command on the user's machine, so it binds
   every run to the user's explicit acceptance… Claude Code shows them the exact command string first
   and records the accepted command for that installation… In a non-interactive shell… pass `--yes`."
   Admins can block these entirely with `disableCommandPluginSources`.
2. **`headersHelper` commands** — "A user accepts a plugin entry's command each time they install or
   update that one plugin by itself… Claude Code shows the command and the archive URL, and runs the
   command only after the user accepts."

One adjacent nuance for **project-scope skills-directory plugins**: "MCP servers it declares go through
the same per-server approval as a project `.mcp.json`" (plugins ref). That is MCP-server approval, not
hook approval, and it does not apply to marketplace installs.

**Bottom line for claude-omegle:** installing your plugin silently arms hooks on `UserPromptSubmit`,
`Stop`, `StopFailure`, `SessionEnd`, and `Notification` with no extra prompt. That makes the disclosure
in your README and the `/hooks` audit trail (§8.4) the user's real protection — and it is why the §12
design ships **disabled by default**, gated on a flag file the user must create with the slash command.

### 8.4 How a user audits your hooks

1. **Before install** — the `/plugin` **Discover** tab detail pane shows a **"Will install"** section
   "listing the plugin's commands, agents, skills, hooks, and MCP and LSP servers, so you can review
   exactly what it adds before installing", plus a **Context cost** estimate and **Last updated**
   (discover plugins). Local/custom marketplaces may show "Components will be discovered at
   installation" instead.
2. **After install** — `/plugin` → **Installed** → the plugin's detail view "shows the components the
   plugin contributes: commands, skills, agents, hooks, MCP servers, and LSP servers. The same
   inventory is available from the command line with `claude plugin details`."
3. **Live hook browser** — `/hooks`: "a read-only browser for your configured hooks. The menu shows
   every hook event with a count of configured hooks, lets you drill into matchers, and shows the full
   details of each hook handler. Use it to verify configuration, check which settings file a hook came
   from, or inspect a hook's command, prompt, or URL." (hooks ref)
4. **Errors tab** — `/plugin` → **Errors** for load failures.
5. **Kill switches** — `"disableAllHooks": true` in settings (user/project/local, or
   `--settings '{"disableAllHooks": true}'` for one run); `allowManagedHooksOnly` for orgs; and
   `allowedHttpHookUrls` to restrict HTTP hooks.

Given `/hooks` exposes your exact command and URL, put the endpoint in `userConfig` rather than
hardcoding it — users can then see and change it in one place.

### 8.5 Local development

```bash
claude --plugin-dir ./claude-omegle          # load a local dir for this session
claude --plugin-dir ./claude-omegle.zip      # a .zip of the plugin dir also works
claude --plugin-dir ./a --plugin-dir ./b     # repeatable
claude --plugin-url https://example.com/p.zip
```

- "When a `--plugin-dir` plugin has the same name as an installed marketplace plugin, the local copy
  takes precedence for that session." Exception: plugins force-enabled/disabled by managed settings.
- "As you make changes to your plugin, run `/reload-plugins` to pick up the updates without restarting.
  This reloads plugins, skills, agents, hooks, plugin MCP servers, and plugin LSP servers." `SKILL.md`
  content changes are picked up live; hooks/agents/MCP need the reload.
- Note for `claude plugin list`: a `--plugin-dir` plugin appears "only when the same flag precedes the
  subcommand, as in `claude --plugin-dir <dir> plugin list`".
- Alternative dev loop: `claude plugin init my-tool` scaffolds `~/.claude/skills/my-tool/` with a
  manifest; it auto-loads as `my-tool@skills-dir` with no marketplace or install step.

---

## 9. Concurrency and `session_id` stability

The docs state only two relevant things:

> "All matching hooks run in parallel." — hooks ref
> "`session_id` — Current session identifier" — hooks ref

Whether concurrent sessions' hooks are independent, and whether `session_id` is stable across a
session's lifetime, are **not documented**. Measured instead:

**(observed, v2.1.261)** — single session, four events:

```
SessionStart     session_id = ae76c3e5-2034-40b1-831c-7ae737fceb8c
UserPromptSubmit session_id = ae76c3e5-2034-40b1-831c-7ae737fceb8c
Stop             session_id = ae76c3e5-2034-40b1-831c-7ae737fceb8c
SessionEnd       session_id = ae76c3e5-2034-40b1-831c-7ae737fceb8c
```

`session_id` is a **UUID, identical across all four events of one session**. `prompt_id` was also
identical across `UserPromptSubmit`, `Stop`, and `SessionEnd` for the single-prompt run.

**(observed)** — two `claude -p` processes started simultaneously against the same plugin:

```
21c09a84-08c1-4a98-8167-424e85ce2063  ['SessionStart', 'UserPromptSubmit', 'Stop', 'SessionEnd']
5a8afd33-e8fc-4a08-bdff-0d29042af032  ['SessionStart', 'UserPromptSubmit', 'Stop', 'SessionEnd']
```

Distinct `session_id`s; each session fired its **own complete, independent** hook sequence. So: yes,
hooks from concurrent sessions run independently, and `session_id` is a safe pairing key.

**(unverified)** — what happens to `session_id` across `/clear`, `--resume`, `--continue`, `/fork`, and
`/branch`. `SessionStart` reports these via `source` (`clear`/`resume`/`fork`), which strongly suggests
a new session identity, but the docs don't say and I didn't measure it. **Have the server key on
`session_id` but treat a `SessionStart` with `source` in `{clear, resume, fork}` as "retire any prior
call for this terminal".** Also note `CLAUDE_CODE_BRIDGE_SESSION_ID` is a *different* id for Remote
Control sessions.

---

## 10. Is there a "Claude is thinking" signal beyond UserPromptSubmit→Stop?

**No dedicated thinking/spinner event exists.** The nearest options, in order of usefulness:

1. **`MessageDisplay`** (hooks ref) — "Runs while an assistant message streams to the screen… each
   time a batch of newly completed lines is ready to render, the hook runs once with those lines".
   Payload: `turn_id`, `message_id`, `index`, `final`, `delta`. This is the only event that fires
   *during* generation, so it is the closest thing to a liveness heartbeat.
   **Serious caveats:** "Claude Code holds each batch until your hook returns, so keep the hook fast."
   Default timeout is 10 s. It has no `matcher`, fires for every text-bearing assistant message, and
   `async` on a display-path hook is untested here. Using it as a keepalive would put your `curl` on the
   render path — **don't**, unless you use `async: true` and measure the cost.
2. **`PreToolUse` / `PostToolUse` / `PostToolBatch`** — fire throughout the agentic loop and are a
   cheap, high-frequency "still working" heartbeat that refreshes the server-side TTL. This is the
   practical answer to the interrupt problem in §0.1: a session that stops emitting tool events *and*
   never sent `Stop` was interrupted.
3. **`Notification` / `idle_prompt`** — fires ~60 s after Claude finishes responding if you haven't
   typed. A useful "user has walked away" signal, not a thinking signal.
4. **`statusMessage`** on a hook handler changes the spinner text but is display-only.

### Statusline

Configured in settings, not by plugins:

```json
{ "statusLine": { "type": "command", "command": "~/.claude/statusline.sh", "padding": 0 } }
```

The script receives a rich JSON object on stdin (statusline, `## Available data`) including
`session_id`, `session_name`, `prompt_id`, `transcript_path`, `model.{id,display_name}`,
`workspace.{current_dir,project_dir,added_dirs,git_worktree,repo}`, `version`, `output_style.name`,
`cost.{total_cost_usd,total_duration_ms,total_api_duration_ms,total_lines_added,total_lines_removed}`,
`context_window.{…,used_percentage,…}`, `exceeds_200k_tokens`, `prompt_cache.{…}`, and `effort`.

Cadence: event-driven plus an optional `refreshInterval` (minimum 1 second). "Claude Code debounces
updates at 300ms… If a new update triggers while your script is still running, Claude Code cancels the
in-flight script."

**Two reasons the statusline is the wrong tool here:**

1. **There is no busy/thinking/processing flag in the payload.** `cost.total_duration_ms` is cumulative,
   not per-turn. Nothing marks "a turn is in progress".
2. **A plugin cannot ship a `statusLine`.** Plugin `settings.json` supports "only the `agent` and
   `subagentStatusLine` keys" (plugins). Statusline says plugins "can ship a default
   `subagentStatusLine`" — the subagent row renderer, not the main status line. A `statusLine` must be
   configured by the user in their own settings.

Also, a custom status line has a visible side effect: "With a custom status line configured, Claude Code
stops showing most of the footer's keyboard hints, including `esc to interrupt`" — you don't want a
fun plugin doing that.

**Conclusion:** `UserPromptSubmit` → `Stop` plus `StopFailure`/`SessionEnd` plus a server-side TTL
(optionally refreshed by `PostToolUse`) is the right design. There is no better built-in signal.

---

## 11. TTY and opening a browser

**Documented:**

> "On macOS and Linux, command hooks run in their own session without a controlling terminal. The hook
> process and any child processes can't open `/dev/tty` or send escape sequences directly to the Claude
> Code interface. Windows has no `/dev/tty`." — hooks ref

**(observed)** stdin is not a TTY inside a plugin hook.

Consequences:

- Anything that needs to prompt on the terminal, or draw to it, will not work.
- To surface terminal output, use the JSON `systemMessage` field (sync hooks) — but note async hooks'
  `systemMessage` "is not shown to you".
- For bells/desktop notifications/window titles, use the `terminalSequence` JSON field instead:
  "Restricted to OSC `0`/`1`/`2`/`9`/`99`/`777` and BEL. If the value contains anything outside the
  allowlist, the field is ignored. Use this instead of writing to `/dev/tty`, which is unavailable to
  hooks." → **OSC 8 hyperlinks are not on the allowlist**, so you cannot emit a clickable link.

**Opening a browser from a hook:** the docs say **nothing** about launching applications from hooks.
**(unverified against Claude Code docs)** — on macOS, `open <url>` goes through LaunchServices and does
not require a controlling terminal, so it should work from a hook process; the lack of a TTY is not a
blocker for `open`. It is still untested here, and there is no documented statement either way.

**Recommendation anyway: don't `open` from the hook.** Hooks fire on every turn; you would spawn a new
tab per prompt. Open the tab **once** from the `/claude-omegle:omegle` slash command (which runs in the
user's foreground context), have that tab hold a WebSocket/SSE connection to your service, and let the
hooks only push state. That also gives you a clean "off" story.

---

## 12. Minimal, correct example plugin

This plugin was created, validated, **and run end to end on this machine** (Claude Code 2.1.261).
Full results in §12.6. It is not a sketch — an earlier draft of it had two real bugs, both caught by
running it and both documented below so you don't reintroduce them.

```
$ claude plugin validate ./claude-omegle          # and --strict
✔ Validation passed
```

### 12.1 `.claude-plugin/plugin.json`

```json
{
  "name": "claude-omegle",
  "displayName": "Claude Omegle",
  "description": "Opens a WebRTC call with a stranger while Claude is working, and hangs up when Claude stops.",
  "version": "0.1.0",
  "author": { "name": "David Yang" },
  "keywords": ["hooks", "webrtc", "fun"]
}
```

Consider adding `userConfig` so users can set the endpoint from the `/plugin` UI instead of an env var:

```json
"userConfig": {
  "endpoint": {
    "type": "string",
    "title": "claude-omegle service URL",
    "description": "Base URL of your claude-omegle web service",
    "default": "http://127.0.0.1:8787"
  }
}
```

Read it in the script as `$CLAUDE_PLUGIN_OPTION_ENDPOINT` (shell form cannot use `${user_config.*}`).

### 12.2 `hooks/hooks.json`

Exec form (`command` + `args`) — required by the docs' rule "Set `args` whenever the hook references a
path placeholder, since each element is passed as one argument with no quoting" (§2.3).

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "bash",
                     "args": ["${CLAUDE_PLUGIN_ROOT}/scripts/signal.sh"], "async": true } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "bash",
                     "args": ["${CLAUDE_PLUGIN_ROOT}/scripts/signal.sh"], "async": true } ] }
    ],
    "StopFailure": [
      { "hooks": [ { "type": "command", "command": "bash",
                     "args": ["${CLAUDE_PLUGIN_ROOT}/scripts/signal.sh"], "async": true } ] }
    ],
    "SessionEnd": [
      { "hooks": [ { "type": "command", "command": "bash",
                     "args": ["${CLAUDE_PLUGIN_ROOT}/scripts/signal.sh"], "async": true } ] }
    ],
    "Notification": [
      { "matcher": "permission_prompt",
        "hooks": [ { "type": "command", "command": "bash",
                     "args": ["${CLAUDE_PLUGIN_ROOT}/scripts/signal.sh"], "async": true } ] }
    ]
  }
}
```

Why these five: `UserPromptSubmit` = start; `Stop` = normal end; `StopFailure` = API-error end;
`SessionEnd` = session gone; `Notification/permission_prompt` = "Claude needs the human".
`UserPromptSubmit` and `Stop` take no matcher (§2.2), so the group has no `matcher` key.

Optional additions:

- `"PermissionRequest": [{ "hooks": [ …same… ] }]` — fires **immediately** rather than after the ~6 s
  idle gate (§0.2). Safe as a passive observer: it changes nothing unless it returns a `decision` object.
- `"PostToolUse": [{ "hooks": [ …same… ] }]` — a cheap TTL heartbeat so an interrupted turn expires
  quickly server-side. Note it fires on **every** tool call; rate-limit in the script or on the server.

### 12.3 `scripts/signal.sh`

```bash
#!/usr/bin/env bash
# Reads the hook's JSON payload on stdin and forwards it verbatim to the
# claude-omegle web service. Never blocks, never prints, never fails the hook.
set -u

STATE_DIR="${HOME}/.claude-omegle"
ENDPOINT="${CLAUDE_PLUGIN_OPTION_ENDPOINT:-${CLAUDE_OMEGLE_URL:-http://127.0.0.1:8787}}"

# Toggled by /claude-omegle:omegle. No flag file -> stay silent.
[ -f "$STATE_DIR/enabled" ] || { cat >/dev/null; exit 0; }

curl -sS -m 2 --connect-timeout 1 -X POST \
  -H 'Content-Type: application/json' \
  --data-binary @- \
  "$ENDPOINT/signal" >/dev/null 2>&1

exit 0
```

Design notes:

- **No `jq` dependency.** `--data-binary @-` streams the hook's own JSON straight through, so the
  server already receives `session_id`, `hook_event_name`, `notification_type`, `prompt_id`, `cwd`,
  `permission_mode`, and (on `Stop`) `last_assistant_message` / `background_tasks`. Do not forward
  `prompt` or `last_assistant_message` off-machine unless you mean to — strip them server-side, or add
  a `jq` projection here if you want to be strict about it.
- `-m 2` is curl's **total** timeout (the brief's "2s curl timeout"); `--connect-timeout 1` fails fast
  when the service is down.
- `>/dev/null 2>&1` plus no other output = zero context pollution (§6.3), which matters most on
  `UserPromptSubmit`.
- `exit 0` unconditionally: never block, never trigger a `hook error` notice.
- `cat >/dev/null` on the disabled path drains stdin so Claude Code's writer never hits `EPIPE`.
- The endpoint prefers `$CLAUDE_PLUGIN_OPTION_ENDPOINT` (a `userConfig` option, §12.1) so users can set
  it from the `/plugin` UI; shell-form hooks cannot use `${user_config.*}` directly (§2.3).

#### Why `STATE_DIR` is `$HOME/.claude-omegle`, not `${CLAUDE_PLUGIN_DATA}`

`${CLAUDE_PLUGIN_DATA}` is the "right" answer on paper and it works correctly **in hook processes**
(§1.3, observed). But it is **not reliable in the `` !`…` `` inline-bash context of a slash command**,
and the two contexts must agree on where the flag file lives or the toggle silently does nothing.

**(observed, v2.1.261)** running `/claude-omegle:omegle on` via `claude -p --plugin-dir ./claude-omegle`,
the `` !`…` `` script saw:

```
HOME=/Users/davidyang
CLAUDE_PLUGIN_DATA=/Users/davidyang/.claude/plugins/data/codex-openai-codex   # <- WRONG plugin
```

`CLAUDE_PLUGIN_DATA` had been **inherited from the surrounding environment** (a different plugin's
value, leaked from the parent Claude Code session) rather than set to `claude-omegle`'s own data
directory. The toggle wrote its flag into the wrong plugin's directory, and the hook — which *did* get
the correct `CLAUDE_PLUGIN_DATA` — never saw it. Symptom: the command cheerfully prints
`STATE: ENABLED` and no signals are ever sent.

Using a single fixed path in **both** scripts removes the failure mode entirely. **(observed)** after
this change, `/claude-omegle:omegle on` wrote `~/.claude-omegle/enabled` and the next prompt delivered
all three signals; `/claude-omegle:omegle off` produced complete silence.

**(unverified)** whether this is documented behavior, a `--plugin-dir` artifact, or a bug. The docs say
the three placeholders are "exported as environment variables to hook processes and to MCP and LSP
server subprocesses" (plugins ref) — note that list does **not** mention slash-command `` !`…` ``
execution. Treat `${CLAUDE_PLUGIN_DATA}` as hook-only. Worth a `/feedback` report either way.

### 12.4 `commands/omegle.md`

```markdown
---
description: Toggle claude-omegle on or off for this machine and print the pairing URL.
argument-hint: [on|off]
disable-model-invocation: true
allowed-tools: Bash(${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh *)
---

## claude-omegle

!`"${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh" "$ARGUMENTS" "${CLAUDE_SESSION_ID}"`

Relay the STATE and PAIRING URL lines above to the user verbatim, in two lines. Do nothing else.
```

### 12.5 `scripts/toggle.sh`

```bash
#!/usr/bin/env bash
# $1 = on|off|<empty = flip>   $2 = session id (may be empty)
set -u

STATE_DIR="${HOME}/.claude-omegle"
ENDPOINT="${CLAUDE_PLUGIN_OPTION_ENDPOINT:-${CLAUDE_OMEGLE_URL:-http://127.0.0.1:8787}}"

mkdir -p "$STATE_DIR"
FLAG="$STATE_DIR/enabled"
case "${1:-}" in
  on)  : > "$FLAG" ;;
  off) rm -f "$FLAG" ;;
  *)   if [ -f "$FLAG" ]; then rm -f "$FLAG"; else : > "$FLAG"; fi ;;
esac

if [ -f "$FLAG" ]; then
  echo "STATE: ENABLED"
  echo "PAIRING URL: ${ENDPOINT}/pair?session=${2:-unknown}"
else
  echo "STATE: DISABLED"
  echo "PAIRING URL: (none while disabled)"
fi
exit 0
```

Notes on the command:

- **Build the URL in the script, not in the markdown body.** An earlier draft put
  `${CLAUDE_OMEGLE_URL:-http://127.0.0.1:8787}/pair?session=${CLAUDE_SESSION_ID}` in the prose. Claude
  Code substitutes `${CLAUDE_*}` placeholders in command content, but it does **not** evaluate shell
  `:-` default syntax there — the `:-` fallback would reach Claude as literal text. Anything needing
  shell evaluation belongs inside the `` !`…` `` script.
- **(observed, v2.1.261)** `${CLAUDE_SESSION_ID}` **is** substituted inside the `` !`…` `` command
  before it runs: the script received a real session UUID
  (`bae46ef7-1238-4240-b80b-c8396264e3e5`) as `$2`. This is not stated explicitly in the docs, which
  only list `${CLAUDE_SESSION_ID}` as a skill-content variable — so it is measured, not cited.
- **(observed)** `allowed-tools: Bash(${CLAUDE_PLUGIN_ROOT}/scripts/toggle.sh *)` matched the quoted
  invocation and ran with no permission prompt. In `-p` a prompt would have failed the run, so this is
  unambiguous. Mechanism per skills: "Claude Code substitutes `${CLAUDE_SKILL_DIR}` and
  `${CLAUDE_PROJECT_DIR}` in two places: the skill's markdown content, and Bash rules in the
  `allowed-tools` frontmatter. In a plugin skill, Claude Code substitutes `${CLAUDE_PLUGIN_ROOT}` and
  `${CLAUDE_PLUGIN_DATA}` in the same two places."
- `disable-model-invocation: true` stops Claude from flipping the toggle on its own; only the user can
  run `/claude-omegle:omegle`.
- If a user has `disableSkillShellExecution: true`, the `` !`…` `` line becomes
  `[shell command execution disabled by policy]` and the command degrades to a no-op that says nothing
  useful. Mention this in your README.
- Invoke as **`/claude-omegle:omegle`**. Bare `/omegle` usually resolves too, but is not guaranteed.
- For a new plugin, prefer `skills/omegle/SKILL.md` over `commands/omegle.md` (`skills/` is the
  recommended layout); the frontmatter is identical.
- The model is asked to relay the output verbatim. **(observed)** it filtered extra lines when told
  "two lines" — if you add diagnostic output to the script, the model may drop it. Write diagnostics to
  a file, not stdout.

### 12.6 Empirical verification of this exact plugin

Environment: macOS 25.6.0, Claude Code **2.1.261**, `--model claude-haiku-4-5`,
loaded with `--plugin-dir`, local listener on `127.0.0.1:8787`.

**Structure:** `claude plugin validate ./claude-omegle` and `--strict` both print `✔ Validation passed`.

**Enable via the slash command:**

```
$ claude -p "/claude-omegle:omegle on" --plugin-dir ./claude-omegle --model claude-haiku-4-5
STATE: ENABLED
PAIRING URL: http://127.0.0.1:8787/pair?session=bae46ef7-1238-4240-b80b-c8396264e3e5

$ ls ~/.claude-omegle/
enabled
```

**Signals with the flag ON:**

```
$ claude -p "reply with just: hi" --plugin-dir ./claude-omegle --model claude-haiku-4-5

server received:
  UserPromptSubmit  4e30f6a7-567b-4b15-a6bc-373fae759199
  Stop              4e30f6a7-567b-4b15-a6bc-373fae759199
  SessionEnd        4e30f6a7-567b-4b15-a6bc-373fae759199
```

All three async hooks fired, all carried the same `session_id`, and all arrived inside the `-p` run's
lifetime despite the documented "Claude Code kills any async hook still running at teardown".

**Silence with the flag OFF:**

```
$ claude -p "/claude-omegle:omegle off" …
STATE: DISABLED
PAIRING URL: (none while disabled)

$ claude -p "reply with just: bye" …
server received:   (nothing)
```

**Not tested — do these before shipping:**

- `Notification` / `permission_prompt`: never fired in headless runs (the ~6 s idle gate is never
  crossed). Exercise it interactively by triggering a permission prompt and walking away for 10 s.
- `StopFailure`: no API error was induced.
- `Stop` when Claude ends the turn with a question (`AskUserQuestion`) — §5, inferred only.
- `Stop` after a permission denial — §5, inferred only.
- The Escape / `Ctrl+C` interrupt path — the docs say `Stop` won't fire; confirm, and size your
  server-side TTL from what you see.
- `session_id` continuity across `/clear`, `--resume`, `/fork` — §9.
- Whether `open <url>` works from a hook process on macOS — §11.
- Behavior after a real marketplace install (all testing used `--plugin-dir`, whose plugin identity is
  `<name>@inline`).

---

## 13. Open items / things I could not verify

| Item | Status |
| :-- | :-- |
| `Stop` fires when Claude ends by asking a question | **(inferred)** from "finished responding"; no explicit statement |
| `Stop` fires after a permission denial | **(inferred)**; a denial doesn't end a turn |
| `session_id` stability across `/clear`, resume, fork | **(unverified)** — docs silent; `SessionStart.source` implies new identities |
| Multiple concurrent sessions run hooks independently | **(observed)** yes; **(unverified)** in the docs |
| `open <url>` from a hook on macOS | **(unverified against Claude Code docs)**; no TTY is not a blocker for LaunchServices |
| `async: true` on `Notification` / `StopFailure` | **Not exercised.** Both pass `claude plugin validate --strict`; neither fired in headless runs (no 6 s idle gate crossed, no API error induced). `async` is confirmed working on `UserPromptSubmit`, `Stop`, `SessionEnd` |
| Any timestamp in hook payloads | **None exist** (confirmed by doc read + observation); server must stamp arrival time |
| A "thinking" / spinner hook event | **Does not exist**; `MessageDisplay` is the closest, on the render path |
| Plugins shipping a main `statusLine` | **Not supported** — plugin `settings.json` allows only `agent` and `subagentStatusLine` |
| Do plugin hooks require approval on install? | **No** — verified by searching raw `plugin-marketplaces.md`, `discover-plugins.md`, `plugins-reference.md`. Only `command` sources and `headersHelper` commands prompt for acceptance (§8.3) |
| `${CLAUDE_PLUGIN_DATA}` inside a slash command's `` !`…` `` block | **(observed)** unreliable — leaked a *different* plugin's value under `--plugin-dir`. Correct in hook processes. Docs don't list `!` execution among the substitution contexts. Use a fixed path instead (§12.3) |
| `${CLAUDE_SESSION_ID}` inside a `` !`…` `` block | **(observed)** substituted correctly before the command runs; not stated in the docs |
| Marketplace-install behavior of the §12 plugin | **(unverified)** — all testing used `--plugin-dir` (identity `<name>@inline`) |

If any of these turn out to be wrong or missing from the docs, `/feedback` is the channel for reporting
a docs gap or requesting the event/field.
