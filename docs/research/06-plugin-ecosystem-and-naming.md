# Claude Code Plugin Ecosystem, Naming Patterns, and the "wait-together" Name

Research date: 2026-09-06. Primary data pulled directly from `marketplace.json` catalogs (291 official plugins, 2,282 community plugins) plus the official docs. Anything not verified against a primary source is marked **(unverified)**.

---

## 1. Marketplaces in plain terms

### What a marketplace actually is

A marketplace is just a **git repository with a `.claude-plugin/marketplace.json` file at its root**. That file is a catalog: a name, an owner, and an array of plugin entries. There is no server, no registry database, no publish step. Claude Code clones the repo and reads the JSON.

Minimum viable catalog:

```json
{
  "name": "marketplace-identifier",
  "owner": { "name": "Your Name", "email": "optional@example.com" },
  "plugins": [
    { "name": "plugin-name", "source": "./plugins/plugin-name", "description": "Brief description" }
  ]
}
```

The `name` field is the identifier users type after the `@` in install commands. It must be kebab-case.

In the real Anthropic catalogs, each entry looks like this (from `claude-plugins-community`):

```json
{
  "name": "8-habit-ai-dev",
  "description": "8-habit-ai-dev replaces ad-hoc AI prompting with a structured 7-step workflow...",
  "source": {
    "source": "url",
    "url": "https://github.com/pitimon/8-habit-ai-dev.git",
    "sha": "42d03b42fcbc73f43652832973faa8a411e1dae6"
  },
  "homepage": "https://github.com/pitimon/8-habit-ai-dev"
}
```

Note the `sha`. Community plugins are pinned to a specific commit, so the catalog controls exactly which code users get.

### The two official marketplaces

| Marketplace name | Repo | Added how | What it is |
|---|---|---|---|
| `claude-plugins-official` | [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) (35,969 stars) | Automatically, on first interactive launch | Curated by Anthropic. 291 plugins as of 2026-09-06. |
| `claude-community` | [anthropics/claude-plugins-community](https://github.com/anthropics/claude-plugins-community) (3,518 stars) | Manually | Third-party submissions that passed automated review. 2,282 plugins. |

There is also a **demo** marketplace, `claude-code-plugins`, living inside the main [anthropics/claude-code](https://github.com/anthropics/claude-code) repo (144,257 stars). It has 13 example plugins and must be added manually.

Note the marketplace `name` does not always match the repo name: the repo `claude-plugins-community` declares itself as `claude-community`, so you install with `@claude-community`.

### How plugins get in

**Official marketplace:** no application process. Anthropic curates it at its discretion. The docs are explicit: "There is no application process, and the submission form does not add plugins to the official marketplace."

**Community marketplace:** there is a real pipeline.

1. Run `claude plugin validate ./your-plugin` locally. Passing prints `✔ Validation passed`. Add `--strict` to treat warnings as errors.
2. Submit via one of two in-app forms:
   - claude.ai: `claude.ai/admin-settings/directory/submissions/plugins/new` (requires a Team or Enterprise org with directory management access)
   - Console: `platform.claude.com/plugins/submit` (the route for individual authors)
3. The review pipeline runs the same validation plus automated safety screening.
4. Approved plugins get pinned to a commit SHA in the catalog. CI bumps the pin automatically as you push.
5. The public catalog **syncs nightly**, so there is a lag between approval and installability.

For a solo hobbyist author, the Console form is the relevant path.

### Community marketplaces

Anyone can publish one. You add a `.claude-plugin/marketplace.json` to a repo and tell people the `owner/repo` string. No review, no gatekeeper. Sizeable examples verified today:

| Marketplace `name` | Repo | Stars | Plugins |
|---|---|---|---|
| `claude-code-workflows` | wshobson/agents | 39,459 | 94 |
| `buildwithclaude` | davepoon/buildwithclaude | 3,421 | 86 |
| `superpowers-marketplace` | obra/superpowers-marketplace | 1,251 | 10 |
| `cc-marketplace` | ananddtyagi/cc-marketplace | 687 | 119 |
| `skills-curated` | trailofbits/skills-curated | 495 | 29 |

### The exact commands

```shell
# Add a marketplace (GitHub shorthand)
/plugin marketplace add owner/repo
/plugin marketplace add anthropics/claude-plugins-community

# Other sources
/plugin marketplace add https://gitlab.com/company/plugins.git
/plugin marketplace add https://gitlab.com/company/plugins.git#v1.0.0   # branch or tag
/plugin marketplace add ./my-marketplace                                # local dir
/plugin marketplace add https://example.com/marketplace.json            # remote file

# Install
/plugin install plugin-name@marketplace-name
/plugin install github@claude-plugins-official
/plugin install commit-commands@claude-code-plugins

# Manage
/plugin                       # interactive panel
/plugin list                  # add --enabled or --disabled
/plugin disable name@market
/plugin enable  name@market
/plugin uninstall name@market
/plugin marketplace list
/plugin marketplace update marketplace-name
/plugin marketplace remove marketplace-name
/reload-plugins               # add --force if it warns about cache invalidation
```

Shortcuts: `/plugin market` for `/plugin marketplace`, and `rm` for `remove`.

Shell equivalents exist for scripting and do not open the interactive panel: `claude plugin marketplace add`, `claude plugin install name@market --scope project`, `claude plugin validate`, `claude plugin details`, `claude plugin init`.

### Local development

```bash
claude --plugin-dir ./my-plugin              # load a local plugin directory
claude --plugin-dir ./my-plugin.zip          # a zip archive also works
claude --plugin-dir ./one --plugin-dir ./two # repeat the flag for several
claude --plugin-url https://example.com/my-plugin.zip  # hosted archive, session only
```

A `--plugin-dir` plugin **overrides an installed marketplace plugin of the same name** for that session, so you can iterate on something you already have installed. Run `/reload-plugins` to pick up edits without restarting.

There is also a no-flag path: `claude plugin init my-tool` scaffolds `~/.claude/skills/my-tool/` and it auto-loads next session as `my-tool@skills-dir`, with no marketplace involved. That is the fastest loop for a plugin you are still designing.

### What the user sees when installing

Selecting a plugin in the **Discover** tab shows a details pane with:

- **Context cost**: token estimate added to every turn
- **Last updated** date
- **Will install**: an itemized list of the commands, agents, skills, hooks, MCP servers, and LSP servers it adds

Then a scope choice: **User** (all your projects), **Project** (committed to `.claude/settings.json`, shared with collaborators), or **Local** (this repo, just you).

After install, the summary says either `Plugin is now active.` or `Run /reload-plugins to activate.`

This matters for the "wait-together" concept: the **Will install** panel exposes hooks and MCP servers before the user commits. A plugin that opens an audio call to a stranger will be read closely at this screen. Naming and description carry real weight here.

### What a plugin can contain

Everything lives at the plugin root. Only `plugin.json` goes inside `.claude-plugin/`.

| Path | Purpose |
|---|---|
| `.claude-plugin/plugin.json` | Manifest: `name`, `description`, `version`, `author` |
| `skills/<name>/SKILL.md` | Skills, model-invoked or user-invoked |
| `commands/` | Legacy flat-file skills. Use `skills/` for new plugins |
| `agents/` | Subagent definitions |
| `hooks/hooks.json` | Event handlers (`PostToolUse`, `Stop`, `Notification`, etc.) |
| `.mcp.json` | MCP server configs |
| `.lsp.json` | Language server configs |
| `monitors/monitors.json` | Background monitors that stream stdout lines to Claude as notifications |
| `bin/` | Executables added to the Bash tool `PATH` while enabled |
| `settings.json` | Default settings; only `agent` and `subagentStatusLine` supported |

**The `monitors/` directory is directly relevant to this project.** A monitor runs a long-lived command in the background and delivers each stdout line to Claude as a notification. That is a plausible transport for "the other side's Claude finished" without polling.

The `name` in `plugin.json` is the **skill namespace**. A plugin named `my-first-plugin` with `skills/hello/` produces `/my-first-plugin:hello`. Namespacing is mandatory and cannot be turned off; changing the prefix means changing the plugin name.

Docs: [plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces), [discover-plugins](https://code.claude.com/docs/en/discover-plugins), [plugins](https://code.claude.com/docs/en/plugins), [plugins-reference](https://code.claude.com/docs/en/plugins-reference).

---

## 2. Naming table: 94 real Claude Code plugins

Marketplace keys: **OFF** = `claude-plugins-official`, **COM** = `claude-community`, **DEMO** = `claude-code-plugins` (anthropics/claude-code), **SUP** = `superpowers-marketplace`, **WF** = `claude-code-workflows` (wshobson/agents), **CCM** = `cc-marketplace`, **TOB** = `skills-curated` (trailofbits), **BWC** = `buildwithclaude`.

Categories are mine where the catalog left the field blank (only 157 of 2,282 community entries carry one).

| # | Name | Source | What it does | Category |
|---|---|---|---|---|
| 1 | `github` | OFF | GitHub MCP server: issues, PRs, repo management | integrations |
| 2 | `gitlab` | OFF | GitLab repos, merge requests, CI/CD | integrations |
| 3 | `linear` | OFF | Linear issue tracking | integrations |
| 4 | `notion` | OFF | Notion pages and databases | integrations |
| 5 | `figma` | OFF | Figma design file access | integrations |
| 6 | `vercel` | OFF | Vercel deployments and build status | integrations |
| 7 | `sentry` | OFF | Sentry error reports and stack traces | integrations |
| 8 | `slack` | OFF | Slack messages, channels, threads | integrations |
| 9 | `asana` | OFF | Asana project management | integrations |
| 10 | `atlassian` | OFF | Jira and Confluence | integrations |
| 11 | `supabase` | OFF | Supabase database, auth, storage | integrations |
| 12 | `firebase` | OFF | Firestore, auth, cloud functions | integrations |
| 13 | `stripe` | OFF | Stripe payments development | integrations |
| 14 | `cloudflare` | OFF | Workers, Durable Objects, Agents SDK | integrations |
| 15 | `airtable` | OFF | Airtable as an ops and database layer | integrations |
| 16 | `postman` | OFF | API lifecycle, collection sync | integrations |
| 17 | `datadog` | OFF | Datadog observability via MCP | monitoring |
| 18 | `honeycomb` | OFF | Honeycomb query patterns and prod debugging | monitoring |
| 19 | `sonarqube` | OFF | SonarQube quality and security gates | code quality |
| 20 | `security-guidance` | OFF | Reviews each edit for vulnerabilities inline | code quality |
| 21 | `playwright` | OFF | Browser automation and E2E testing | testing |
| 22 | `chrome-devtools-mcp` | OFF | Drive and inspect a live Chrome browser | development |
| 23 | `typescript-lsp` | OFF | TypeScript language server for code intelligence | code intelligence |
| 24 | `pyright-lsp` | OFF | Python type checking via Pyright | code intelligence |
| 25 | `rust-analyzer-lsp` | OFF | Rust language server | code intelligence |
| 26 | `gopls-lsp` | OFF | Go language server | code intelligence |
| 27 | `commit-commands` | OFF, DEMO | Git commit, push, PR creation workflows | workflow |
| 28 | `pr-review-toolkit` | OFF, DEMO | Specialized PR review agents | workflow |
| 29 | `code-review` | OFF, DEMO | Multi-agent automated code review | code quality |
| 30 | `feature-dev` | OFF, DEMO | End-to-end feature development workflow | workflow |
| 31 | `frontend-design` | OFF, DEMO | Distinctive production-grade frontend UI | design |
| 32 | `agent-sdk-dev` | OFF, DEMO | Development kit for the Claude Agent SDK | development |
| 33 | `plugin-dev` | OFF, DEMO | Toolkit for building Claude Code plugins | development |
| 34 | `hookify` | OFF, DEMO | Generates custom hooks from conversation patterns | workflow |
| 35 | `explanatory-output-style` | OFF, DEMO | Adds educational commentary to responses | output style |
| 36 | `learning-output-style` | OFF, DEMO | Interactive learning mode | output style |
| 37 | `ralph-wiggum` | DEMO | Self-referential loops; Claude reworks one task repeatedly | fun / novelty |
| 38 | `claude-opus-4-5-migration` | DEMO | Migrates code and prompts to a newer model | workflow |
| 39 | `render` | OFF | Deploy, debug, monitor on Render | deployment |
| 40 | `deploy-on-aws` | OFF | AWS deploys with cost estimates | deployment |
| 41 | `build-with-wordpress` | OFF | WordPress themes and sites | development |
| 42 | `learn-with-coursera` | OFF | Turns a learning intent into a Coursera path | learning |
| 43 | `save-to-spotify` | OFF | Builds TTS audio episodes with cover art | fun / novelty |
| 44 | `adobe-for-creativity` | OFF | Adobe creative AI tools | design |
| 45 | `superpowers` | SUP | Core skills library: TDD, debugging, collaboration | workflow |
| 46 | `elements-of-style` | SUP | Writing guidance from Strunk's 1918 manual | writing |
| 47 | `episodic-memory` | SUP | Semantic search across past conversations | research |
| 48 | `double-shot-latte` | SUP | Stops "Would you like me to continue?" interruptions | workflow |
| 49 | `claude-session-driver` | SUP | Launch and monitor other Claude sessions via tmux | orchestration |
| 50 | `private-journal-mcp` | SUP | Private journaling MCP with semantic search | research |
| 51 | `debugging-toolkit` | WF | Interactive debugging workflows | workflow |
| 52 | `tdd-workflows` | WF | Red-green-refactor methodology | workflow |
| 53 | `code-refactoring` | WF | Cleanup and technical debt management | code quality |
| 54 | `git-pr-workflows` | WF | Git and PR automation, team onboarding | workflow |
| 55 | `operating-kit` | WF | Session lifecycle agents and pre-ship review | workflow |
| 56 | `sugar` | CCM | Autonomous dev with rich task context and specs | workflow |
| 57 | `lyra` | CCM | Prompt optimization specialist | workflow |
| 58 | `ultrathink` | CCM | Coordinator agent directing four specialist subagents | orchestration |
| 59 | `bug-detective` | CCM | Step-by-step debugging | workflow |
| 60 | `refractor` | CCM | Refactoring to design patterns (misspelling is theirs) | code quality |
| 61 | `humanizer` | TOB | Strips AI tells from generated writing | writing |
| 62 | `skill-extractor` | TOB | Extracts reusable skills from work sessions | workflow |
| 63 | `planning-with-files` | TOB | Crash-proof file-based planning for long tasks | workflow |
| 64 | `claude-hud` | BWC | Real-time statusline HUD: context, tools, agents | UI / status |
| 65 | `claude-pager` | BWC | Native desktop notifications when Claude needs you | notifications |
| 66 | `slopmop` | BWC | Quality gates for AI-assisted codebases | code quality |
| 67 | `tlsradar` | BWC | TLS cert scanning and Let's Encrypt issuance | security |
| 68 | `claude-tamagotchi` | COM | A pet in your status line that can die of neglect | fun / novelty |
| 69 | `jelly-pet` | COM | Output tokens become jelly; your pet eats and evolves | fun / novelty |
| 70 | `duck-duck-duck` | COM | Companion reacting with voice, animation, optional hardware | fun / novelty |
| 71 | `rubber-duck` | COM | Socratic thinking partner; the duck talks back | fun / novelty |
| 72 | `cc-group-chat` | COM | Multiple Claude sessions join a shared room and @-mention | social / presence |
| 73 | `claude-code-achievements` | COM | Steam-style achievement system, 26 achievements | fun / novelty |
| 74 | `phone-a-friend` | COM | Relays your prompt to Codex, Gemini, or Ollama | orchestration |
| 75 | `idle-timing` | COM | Injects idle time and turn duration into prompts | UI / status |
| 76 | `background-timer` | COM | Delayed checks without blocking the conversation | workflow |
| 77 | `claude-music` | COM | Streams lofi, jazz, ambient in the terminal | fun / novelty |
| 78 | `claude-sounds` | COM | 21 sound files across 10 Claude Code events | notifications |
| 79 | `notify-sounds` | COM | System sounds on task finish and permission prompts | notifications |
| 80 | `claude-voice-cue` | COM | Speaks "Input needed" in under 100ms | notifications |
| 81 | `voice-bridge` | COM | Text-to-speech via five engines | notifications |
| 82 | `cc-meme` | COM | Notifications delivered as custom animations and images | fun / novelty |
| 83 | `16minds` | COM | Agents modeled on 16 personality types that debate | fun / novelty |
| 84 | `magic-powers` | COM | Routes tasks to cheaper models, ~75% cost cut | workflow |
| 85 | `wizard` | COM | Turns a recurring task into a reusable "spell" | workflow |
| 86 | `statusline` | COM | Themeable status line, four built-in themes | UI / status |
| 87 | `claude-co2-status-line` | COM | Status line estimating energy, CO2, and water use | UI / status |
| 88 | `ghostty-dynamic-themes` | COM | Applies a random Ghostty theme on session start | fun / novelty |
| 89 | `chess-coach-ai` | COM | Four agents coaching chess via the Lichess API | fun / novelty |
| 90 | `game-of-cards` | COM | Agile as durable Markdown cards agents pull | workflow |
| 91 | `claude-english-buddy` | COM | Corrects a non-native speaker's English as they prompt | learning |
| 92 | `vibe-replay` | COM | Turns coding sessions into shareable animated replays | fun / novelty |
| 93 | `security-watchdog` | COM | Scans newly installed plugins for prompt injection | security |
| 94 | `chat-namer` | COM | Names every conversation from its first message | workflow |

That is 94 rows across 8 marketplaces, comfortably past the 60 requested.

---

## 3. Naming pattern analysis

Computed over the full catalogs, not a sample: n=291 official, n=2,282 community.

| Metric | Official | Community |
|---|---|---|
| Strict kebab-case (lowercase, digits, hyphens only) | 291 / 291 (100%) | 2,281 / 2,282 (99.96%) |
| Contains a hyphen | 155 (53%) | 1,476 (65%) |
| Single token, no hyphen | 136 (47%) | 806 (35%) |
| Any uppercase, underscore, or dot | 0 | 0 |
| Starts with `claude` | 3 (1%) | 138 (6%) |
| Contains `claude` anywhere | 4 | 191 |
| Starts with `cc-` | 0 | 10 |
| Average hyphen-separated segments | 1.82 | 2.03 |
| Verb-first (heuristic) | ~2% | ~2% |

### Ten observations

**1. Kebab-case is not a convention, it is enforced.** 100% of official and 99.96% of community names are strict kebab-case. Zero names anywhere contain an uppercase letter, underscore, or dot. The single community exception is a truncated name ending in a stray hyphen (`socialclaw-social-media-scheduling-posting-and-analytics-for-ai-`), which is a submission accident, not a style choice. Treat lowercase-and-hyphens as a hard requirement.

**2. The `claude-` prefix is a minority habit, and it shrinks as quality rises.** 6% in the community catalog, 1% in the official one. Anthropic's own curated plugins are named `github`, `figma`, `sentry`, not `claude-github`. Prefixing with `claude-` reads as amateur or as an early-2025 habit. `cc-` is rarer still: 10 plugins total out of 2,573.

**3. Official names are brands; community names are descriptions.** 47% of official plugins are single tokens, and almost all of those tokens are company names: `aikido`, `airtable`, `alloydb`, `stripe`, `vercel`. Community authors have no brand to lean on, so they describe: `debugging-toolkit`, `accessibility-audit`, `dependency-management`. If you are not a company, a two-word descriptive compound is the native shape.

**4. Two words is the sweet spot.** Community distribution: 806 one-word, 848 two-word, 474 three-word, 108 four-word, and a long tail out to eight. Two segments is the single most common length. Anything past three reads as a sentence and gets truncated in the UI, as the `socialclaw` and `wezterm-agent-cards-multipanel-sidebar-with-notifications-inspir` entries demonstrate (both visibly cut off mid-word in the catalog).

**5. Verb-first naming is rare, roughly 2% in both catalogs.** Hand-checked genuine examples: `deploy-on-aws`, `save-to-spotify`, `learn-with-coursera`, `build-with-wordpress`. Note the shape: all four are official, all four are verb + preposition + brand, and they read as marketing taglines for a partner integration. That is the only place verb-first thrives. A bare verb-adverb pair like `wait-together` has essentially no precedent. (The 2% figure is a token heuristic and over-counts: it wrongly flags `open-crab`, `clean-architecture`, and `plan-first`, where the first token is not acting as a verb.)

**6. Nobody owns a prefix, but families accrete.** Counting names by first segment: `claude-*` 135, `agent-*` 22, `ai-*` 17, `mcp-*` 12, `vibe-*` 11, `skill-*` 11, `session-*` 10, `cc-*` 10. The `vibe-*` family (`vibe-flow`, `vibe-test`, `vibe-doc`, `vibe-replay`, `vibe-thesis`, and six more) came from unrelated authors piling onto a trend word. Joining a family gets you nothing and costs you distinctiveness.

**7. Puns exist and they are memorable, but they are a small minority.** The genuine ones: `duck-duck-duck` (search engine plus rubber duck plus the children's game), `phone-a-friend` (game show), `gobreaker` (Go plus circuit breaker plus breaking changes), `vibesurfer`, `slopmop` (mopping up AI slop), `double-shot-latte`, `ralph-wiggum`, `magic-powers`, `jelly-pet`. Anthropic itself shipped `ralph-wiggum` in the demo marketplace, so humor is not disqualifying at the official tier.

**8. Names map to slash commands as `/plugin-name:skill-name`, and this is mandatory.** A plugin named `waiting-room` with `skills/join/SKILL.md` yields `/waiting-room:join`. The namespace equals the `name` field in `plugin.json`; you cannot alias it. Long names are punished twice, once in the catalog and once every time the user types a command. `/dungeon-crawler-carl-achievement-skill:generate` is unusable.

**9. Hook-only plugins have no slash commands at all, which changes what the name is for.** Every sound and notification plugin in the catalog (`claude-sounds`, `notify-sounds`, `claude-voice-cue`, `cc-meme`, `notif-sound`) works purely through hooks. Their names never appear as a command prefix, only in `/plugin install` and the Installed tab. For a mostly-hook plugin like this one, the name is an **install string and a shelf label**, not a command ergonomic. That argues for memorable over descriptive.

**10. Descriptive collisions are rampant and unpunished.** There are two `claude-music`-shaped plugins by the same author (`claude-music`, `code-music`), two `phone-a-friend` entries (`phone-a-friend`, `phone-a-friend-paf`), two RTL chat fixers, two Together AI skill packs, and four sound plugins with near-identical names (`claude-sounds`, `sounds`, `notif-sound`, `notify-sounds`). Generic descriptive names get lost. Distinctiveness is the scarce resource.

### Verdict on "wait-together"

**Recommendation: rename.** Three concrete problems, in order of severity.

**1. "together" already means Together AI in this exact catalog.** Both `together-ai-skills` and `togetherai-skills` are live in the community marketplace. A user scanning `/plugin` search results for "together" gets Together AI inference SDKs and then your plugin. You would be fighting an established vendor for the token inside the one UI where discovery happens. This is the strongest single argument and it is verifiable, not a matter of taste.

**2. Verb-first is a 2% pattern, and the 2% that works looks nothing like this.** The real verb-first names are `deploy-on-aws`, `save-to-spotify`, `learn-with-coursera`: verb plus preposition plus a brand you already recognize. `wait-together` is verb plus adverb with no anchor. It reads as an instruction to the user rather than a name for a thing, and the ecosystem overwhelmingly names things, not actions.

**3. It undersells the product.** The interesting part is the stranger, the call, and the synchronized finish. "Wait" is the boring half of the concept and it is also the part users dislike. Naming the plugin after the pain rather than the payoff is a positioning error independent of any ecosystem convention.

What the name gets right: it is kebab-case, two segments, lowercase, and produces a readable `/wait-together:on`. Structurally fine. Semantically weak.

### Five alternatives

All five were checked against both catalogs on 2026-09-06: **none exists as a plugin name in `claude-plugins-official` or `claude-community`**, and none appears as a substring of any existing name.

| Name | Slash command | Register | Why it fits |
|---|---|---|---|
| `meanwhile` | `/meanwhile:on`, `/meanwhile:skip` | Plain | Single token, which is the 47%-of-official shape. Says "while your Claude works" in one word without naming the waiting. Highly typeable. Weakest on being self-explanatory in a search result. |
| `waiting-room` | `/waiting-room:join`, `/waiting-room:leave` | Plain | Two-segment noun compound, the single most common community shape. Instantly legible, and the metaphor already implies other people are in it with you. Safest choice. |
| `hold-music` | `/hold-music:start`, `/hold-music:mute` | Punny | The best pun available here. "On hold" plus audio, and it tells you the plugin is about sound while you wait. Fits the `duck-duck-duck` and `phone-a-friend` humor tier. Slight risk: implies music rather than a person. |
| `watercooler` | `/watercooler:join` | Punny, warm | Single token, unambiguous social metaphor, and it foregrounds the payoff (talking to someone) rather than the wait. Reads as a place you go, which matches what the product is. |
| `deskmate` | `/deskmate:call`, `/deskmate:mute` | Portmanteau | Desk plus mate. Companion framing that sits naturally beside `claude-tamagotchi` and `rubber-duck` in the fun tier, but sounds like a product rather than a toy. |

My ranking: **`waiting-room`** if you want the safest, most self-explanatory name, **`watercooler`** if you want the one that best sells the payoff, **`hold-music`** if you want the one people repeat to their friends.

Runners-up also verified free: `earshot`, `layover`, `interlude`, `standby`, `crosstalk`.

---

## 4. Name collision check: wait-together

Checked 2026-09-06.

**GitHub.** No meaningful collision. A repo-name search for `wait together` returns 3 results, all zero-star personal projects: `silasokorie/waiting_together`, `omedbb/buffalo-wait-together`, `Annicaaux/WAIT-We-re-All-In-this-Together` (a university project). A full-text search returns 129 results but they are incidental phrase matches in descriptions ("waiting for it to give you", "wait while the pieces are put together"), not products. `lh00000000/waittogether` exists with 0 stars and no description.

**npm.** Both `wait-together` and `waittogether` return HTTP 404 from the registry. **Both package names are available.** The npm namespace is crowded with adjacent utility names (`wait-on`, `wait-port`, `p-wait-for`, `@hapi/teamwork`), so the token "wait" reads as a build-tooling primitive there, which is another mild argument against the name.

**Claude Code plugins.** Zero collisions, and notably: **no plugin in either Anthropic catalog has "wait" anywhere in its name**, across all 2,573 entries. The closest functional neighbours are `idle-timing`, `background-timer`, and `cc-group-chat`. The word "together" appears in exactly two names, both Together AI (`together-ai-skills`, `togetherai-skills`), which is the semantic collision described above.

**Domains.** NS lookups plus a direct fetch of each registered domain.

- `wait-together.com`: **registered** (GoDaddy NS), but serves a blank 114-byte page with no title and no content. A placeholder, not a product.
- `waittogether.com`: **registered**, and redirects to a HugeDomains resale listing. **For sale at $3,795.** Not a product.
- `wait-together.app`: no NS record, likely available **(unverified)**.
- `wait-together.dev`: no NS record, likely available **(unverified)**.

**Existing products.** A web search for a "wait together" app or startup returns nothing using that name. The nearest neighbour in the waiting space is Waitwhile, a waitlist and scheduling platform, which is a different name and a different category. **No existing product, app, or Claude Code plugin uses the name "wait together."**

**Verdict on collisions specifically:** the name is legally and technically clear. There is no existing Claude Code plugin, no npm package, and no notable GitHub project using it. Both `.com` variants are held by parking or resale interests rather than products, so a clean `.com` would need a purchase (waittogether.com is listed at $3,795). The case against `wait-together` is not collision, it is the Together AI semantic clash inside the plugin UI plus the weak verb-first shape. Collision is the one axis on which the name passes.

For comparison, `deskmate.dev` also shows no NS record (likely available), while `meanwhile.dev` is registered (NS at OVH).

---

## 5. Fun and unusual plugins

A caveat that matters for positioning, stated plainly: **the fun tier of this ecosystem has almost no traction.** Star counts below are live from the GitHub API today. Outside two outliers, nearly every novelty plugin sits in the 0 to 30 star range despite the community catalog holding 2,282 plugins. That reads as low competition and also as low proven demand. Nobody has won this category, and nobody has clearly shown it is winnable.

### Directly relevant to the wait-together concept

**1. `cc-group-chat`** (KARPED1EM/CC-Group-Chat, 4 stars). The closest existing thing to your idea. Multiple Claude Code sessions join a shared room and message each other via @-mentions, and an addressed session wakes automatically through the Channels mechanism. This is multi-session presence already working, minus the stranger-matching and minus audio. Worth reading before you build.

**2. `phone-a-friend`** (freibergergarcia/phone-a-friend, 9 stars) and its sibling `phone-a-friend-paf`. A CLI relay that lets Claude call out to Codex, Gemini, or Ollama for a second opinion. The name is the game-show pun and it is the best-executed pun in the catalog. Relevant as naming precedent for the "call someone" frame, though it connects agents rather than humans.

**3. `idle-timing`** (clankercode/claude-inject-idle-time, 5 stars). Injects local time, idle time since the last turn ended, and prior turn duration into prompts, then surfaces `[after Xm Ys]` to the user via a post-submit hook. This is the measurement layer your plugin needs, already solved and readable as a reference implementation.

**4. `background-timer`** (culminationAI/background-timer, 0 stars). Delayed checks that do not block the conversation. Small, but it is the pattern for "do something on a timer without stalling the session."

**5. `claude-tamagotchi`** (ncrohn/claude-tamagotchi, 0 stars). A persistent creature living in the status line that evolves through emoji stages, has session-level moods, and can die from neglect, leaving an egg with inherited XP. The catalog entry is low-traction, but the **concept** is the highest-traction novelty idea in the whole ecosystem: the separate and much older [Ido-Levi/claude-code-tamagotchi](https://github.com/Ido-Levi/claude-code-tamagotchi) has **435 stars** and was posted to Hacker News ([item 44955764](https://news.ycombinator.com/item?id=44955764)), was covered by Product Hunt, and Anthropic was reported to have a "Claude Buddy" tamagotchi feature discovered in leaked Claude Code source (Futurism, Cybernews) **(unverified, press reporting only)**. Takeaway: companionship-during-agent-work is a proven attention magnet.

**6. `duck-duck-duck`** (ideo/Rubber-Duck, 25 stars). A coding companion that watches your sessions and reacts with **voice, animations, and optional physical hardware**, scoring every prompt and response on-device via Apple Foundation Models. The only plugin combining audio, presence, and hardware. Triple-word name is a rare and effective pun.

### Games, pets, and gamification

**7. `claude-code-achievements`** (subinium/claude-code-achievements, **84 stars**). Steam-style achievements: 26 across 4 skill trees, native notifications on all three platforms, 5 languages. The highest-star purpose-built novelty plugin in the community catalog and it was posted to the Korean dev aggregator news.hada.io. The clearest evidence that gamifying Claude Code usage finds an audience.

**8. `jelly-pet`** (0 stars; homepage repo returns 404, so the source may have moved **(unverified)**). Converts your output tokens into "jelly" that your pet eats to grow and evolve, across 5 species. The token-spend-as-food mechanic is genuinely clever: it turns a cost you resent into a resource you accumulate.

**9. `ralph-wiggum`** (DEMO marketplace, shipped by Anthropic). Interactive self-referential loops where Claude works the same task repeatedly. Anthropic named a plugin after a Simpsons character in its own demo marketplace, which is your permission slip for a playful name.

**10. `chess-coach-ai`** (datoga/chess-coach-ai, 0 stars). Four specialized agents coaching chess, with opponent scouting through the Lichess API. An entire non-coding hobby smuggled into a coding tool.

**11. `game-of-cards`**. Agile process reimagined as durable Markdown cards that agents pull autonomously. Fun framing wrapped around a serious workflow, which is a useful model for how to be playful without being a toy.

**12. `16minds`** (yukurash/16minds-plugin, 5 stars). Summons agents modeled on 16 distinct personality types, each with its own values and tone, to debate or review your work. The "several personalities argue about your code" genre.

**13. `dungeon-crawler-carl-achievement-skill`**. Generates achievement notifications in the voice of the System AI from Matt Dinniman's LitRPG series. The homepage is a Substack post literally titled "Build Something Stupid," which is the most honest artist's statement in the catalog. Also the best cautionary example on name length: it is 5 hyphen segments and unusable as a slash command.

### Sound, voice, and presence

**14. `claude-music`** (kennethleungty/claude-music, 21 stars). Streams lofi, jazz, classical, ambient, and EDM in the terminal with no accounts and no setup. The same author's `code-music` redirects to it. Strong for a fun plugin, and direct evidence that people want ambient audio during agent work.

**15. `claude-code-music`** (shdowofdeath, 0 stars). A different take: an "intelligent coding DJ" that adjusts Spotify based on your coding mood, with `/music` modes for focus, hype, chill, debug, refactor, and flow.

**16. `claude-sounds`** (culminationAI, 2 stars). 21 sound files mapped to 10 key events (writes, reads, bash, web, agents, prompts) with random selection for variety, and you can drop in your own mp3s. Its pitch line is the best in the catalog: "Your Claude Code shouldn't be silent."

**17. `claude-voice-cue`** (arpan-k09, 1 star). Speaks "Input needed" the instant Claude is waiting on you, with sub-100ms reaction via PermissionRequest and Notification hooks. Precise, single-purpose, and the fastest audio-attention implementation listed.

**18. `voice-bridge`** (distributed on PyPI as `ai-voice-bridge`, so no star count). Gives Claude a spoken voice through five TTS engines: edge-tts, ElevenLabs, Kokoro, macOS `say`, and espeak-ng. The reference for how to do multi-engine TTS portably.

**19. `cc-meme`** (wuyouMaster/cc-meme, 6 stars). Delivers task notifications not as text or sound but as **custom animations and images**. The purest "why not" plugin in the catalog.

**20. `tts-attention-alert`** (PettHa, 0 stars). Windows-only. Speaks the notification aloud and pulses a colored light when the agent needs you. Notable for reaching into physical ambient signaling.

### Status line and vanity

**21. `claude-co2-status-line`** (stuartshields, 0 stars). Estimates the environmental cost of your session live: energy in Wh, CO2 in grams, water in ml, updating as you go. Guilt as a status line.

**22. `ghostty-dynamic-themes`** (CharlieGreenman, repo now 404 **(unverified)**). Applies one of Ghostty's 463 built-in themes at random on every session start, no config and no restart. Pure aesthetic novelty.

**23. `vibe-replay`** (vibe-replay.com, not a GitHub repo). Turns coding sessions into shareable interactive replays: PR artifacts, animated GIFs, self-contained HTML, and session analytics. The social-sharing angle on agent work.

### Oddities worth knowing

**24. `double-shot-latte`** (superpowers-marketplace). Stops "Would you like me to continue?" interruptions by automatically judging whether Claude should keep going. A caffeine pun for a plugin that keeps your agent awake, from a 1,251-star marketplace.

**25. `claude-english-buddy`** (xiaolai, **29 stars**). A UserPromptSubmit hook that helps non-native English speakers improve while they use Claude Code, with three modes dispatching automatically based on what you type. Quietly one of the highest-star community novelty plugins, and a reminder that the winning ideas here are often warm rather than silly.

### Traction summary

| Plugin | Stars | Signal |
|---|---|---|
| Ido-Levi/claude-code-tamagotchi | 435 | HN front page, Product Hunt |
| claude-code-achievements | 84 | news.hada.io post |
| claude-english-buddy | 29 | none found |
| duck-duck-duck (ideo/Rubber-Duck) | 25 | none found |
| claude-music | 21 | none found |
| phone-a-friend | 9 | none found |
| cc-meme | 6 | none found |
| 16minds, idle-timing | 5 | none found |
| cc-group-chat | 4 | none found |
| everything else listed | 0 to 3 | none found |

I searched Hacker News and Product Hunt for the leading candidates. Only the tamagotchi concept and `claude-code-achievements` surfaced any external discussion. For the rest, no HN or Product Hunt signal was found.

---

## 6. Sources

**Official documentation**
- https://code.claude.com/docs/en/plugin-marketplaces
- https://code.claude.com/docs/en/discover-plugins
- https://code.claude.com/docs/en/plugins
- https://code.claude.com/docs/en/plugins-reference
- https://claude.com/plugins (public catalog browser)

**Catalogs fetched directly (raw `marketplace.json`)**
- https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/.claude-plugin/marketplace.json (291 plugins)
- https://raw.githubusercontent.com/anthropics/claude-plugins-community/main/.claude-plugin/marketplace.json (2,282 plugins)
- https://raw.githubusercontent.com/anthropics/claude-code/main/.claude-plugin/marketplace.json (13 plugins)
- https://raw.githubusercontent.com/obra/superpowers-marketplace/main/.claude-plugin/marketplace.json (10)
- https://raw.githubusercontent.com/wshobson/agents/main/.claude-plugin/marketplace.json (94)
- https://raw.githubusercontent.com/ananddtyagi/cc-marketplace/main/.claude-plugin/marketplace.json (119)
- https://raw.githubusercontent.com/trailofbits/skills-curated/main/.claude-plugin/marketplace.json (29)
- https://raw.githubusercontent.com/davepoon/buildwithclaude/main/.claude-plugin/marketplace.json (86)

**Submission**
- https://claude.ai/admin-settings/directory/submissions/plugins/new
- https://platform.claude.com/plugins/submit

**Repos and traction**
- https://github.com/anthropics/claude-plugins-official
- https://github.com/anthropics/claude-plugins-community
- https://github.com/Ido-Levi/claude-code-tamagotchi
- https://github.com/subinium/claude-code-achievements
- https://github.com/KARPED1EM/CC-Group-Chat
- https://github.com/ideo/Rubber-Duck
- https://github.com/freibergergarcia/phone-a-friend
- https://github.com/kennethleungty/claude-music
- https://github.com/xiaolai/claude-english-buddy-for-claude
- https://clankercode.github.io/claude-inject-idle-time/
- https://news.ycombinator.com/item?id=44955764

**Aggregators and lists (surveyed, not used as primary data)**
- https://github.com/jqueryscript/awesome-claude-code
- https://github.com/rohitg00/awesome-claude-code-toolkit
- https://github.com/ccplugins/awesome-claude-code-plugins
- https://github.com/composio-community/awesome-claude-plugins
- https://github.com/davila7/claude-code-templates (aitmpl.com)

**APIs used**
- `https://api.github.com/search/repositories?q=...`
- `https://api.github.com/repos/{owner}/{repo}` (star counts, 2026-09-06)
- `https://registry.npmjs.org/{package}` (name availability)
