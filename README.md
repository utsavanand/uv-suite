<div align="center">

# 🛠️ UV Suite

### A labeled, observable, anti-slop layer over every AI coding agent you run.

Turn Claude Code, Cursor, or Codex into a named, observable dev environment —
with real-time observability **and control**, anti-slop guardrails, and
per-session memory that survives across launches. One dashboard over every
session, on your machine.

**[Install](#install) · [Quick Start](#quick-start) · [Start here](#start-here) · [Watchtower](#sessions-and-watchtower)**

Works with **Claude Code · Cursor · Codex**

</div>

---

## Install

```sh
npm install -g uv-suite
uvs claude pro                # auto-installs into the current project on first launch
```

Or with npx:

```sh
npx uv-suite install          # explicit install only
```

> **Note:** The CLI is `uvs`, not `uv`. The name `uv` belongs to Astral's Python package manager and likely already exists on your system.

## Quick Start

```sh
uvs claude pro                # Claude Code, Professional persona
uvs codex auto                # Codex, Auto persona
uvs pro                       # Shorthand for uvs claude pro
uvs install                   # Explicit install (also runs automatically on launch)
uvs watch                     # Open the Watchtower observability + control dashboard
uvs info                      # Show what's installed
```

On every `uvs` launch, you'll be prompted to label the session:

```
Label this session (Enter to skip — you'll be reminded):
  name:     payments retry refactor
  kind (1=long-running  2=outcome, Enter to skip): 2
  purpose:  ship retry-on-5xx for the Stripe webhook handler
  priority (1=low  2=med  3=high, Enter to skip): 3
```

Skip any field with Enter. If you skip the name, `/uvs-session init` will be suggested every few prompts until you label it. Set `UVS_NO_PROMPT=1` to suppress prompts entirely.

## What it does

### 🏷️ Named, labeled sessions
Every `uvs` launch generates a `UVS_SESSION_ID` and writes metadata to
`.uv-suite-state/sessions/<id>.json`. Two launches in the same repo run as
distinct sessions with separate names, checkpoints, and dashboard rows — so
concurrent terminals never collide.

### 🔭 Watchtower — observability and control
`uvs watch` starts a dashboard at `localhost:4200` — Python + embedded SQLite,
no Docker and no database to set up. It's a control plane, not just a viewer:
stream every session live, then **checkpoint, fork, compact, close, or delete**
any of them from the browser.

### 🔔 Human in the loop
The **Needs human** panel surfaces the sessions waiting on you — a
tool-permission prompt or an idle wait — with the tool and command as context.
**Approve / Deny** from the browser; for `uvs`-launched (tmux-owned) sessions
the keystroke is sent for you.

### 🛡️ Anti-slop guardrails
Six guardrails (comment, doc, test, error-handling, over-engineering, and
architecture slop) run ambiently on the Pro / Auto personas, catching
AI-generated noise as it's written rather than at review time.

### 📜 Per-session memory
`/uvs-session checkpoint` writes to `uv-out/sessions/<sid>/checkpoints/`, and
`/uvs-session restore` auto-picks the current session's latest — so context
survives across launches, compaction, and terminal restarts.

## Start here

After `uvs claude pro`, pick the path that matches what you're doing. Each path names the first skill to run and the canonical next steps.

### Existing codebase (you didn't write this)
1. `/uvs-understand` — builds a knowledge graph + architecture overview in `uv-out/map-codebase.md`. Other skills (`/uvs-architect`, `/uvs-review`, `/uvs-review --security`) read it automatically.
2. `/uvs-session checkpoint` — captures your baseline understanding so `/uvs-session restore` can bring it back next session.
3. Then: `/uvs-review` on the current diff, or `/uvs-spec` for the next feature.

### New project (you're starting from scratch)
1. `/uvs-spec` — converts your idea into a structured spec in `uv-out/specs/`.
2. `/uvs-architect` — breaks the spec into Acts with cycle budgets. Reads the spec automatically.
3. Then: implement Act by Act. Use `/uvs-test` and `/uvs-review` per Act.

### Reviewing a PR
1. `/uvs-review [branch-name]` — reads diff + `CLAUDE.md` + `DANGER-ZONES.md` + prior `uv-out/` artifacts.
2. `/uvs-review --security` if the diff touches auth, payments, data access, or external inputs.

### Shipping
1. `/uvs-session checkpoint` to capture state.
2. `/uvs-commit` — runs review, tests, commits, optionally opens a PR.

Picking a persona (Spike / Sport / Professional / Auto) is a separate axis from picking a first skill — see [Personas](#personas) below for which mode fits which situation.

## Sessions and Watchtower

Each `uvs` launch generates a `UVS_SESSION_ID` and writes metadata to `.uv-suite-state/sessions/<id>.json`. This unlocks:

- **Concurrent terminals don't collide.** Two `uvs` launches in the same repo run as distinct sessions with separate names, checkpoints, and dashboard rows.
- **`uvs watch` shows them all.** The Watchtower control plane at `localhost:4200` streams every session live and lets you act on them from the browser — see [Watchtower at a glance](#watchtower-at-a-glance).
- **Per-session checkpoints.** `/uvs-session checkpoint` writes to `uv-out/sessions/<sid>/checkpoints/`, and `/uvs-session restore` auto-picks the current session's latest. Pass a session id prefix or name to restore from a different one.
- **Status line shows it all.** The Claude Code status bar shows session name, persona, priority, and elapsed time continuously.

### Watchtower at a glance

`uvs watch` starts the dashboard at `localhost:4200` — Python + **embedded SQLite**, no Docker and no database to set up (it provisions its own deps on first run). It's a control plane, not just a viewer, laid out in three panes:

- **Heartbeat** (left) — a live, scrolling stream of what every agent is doing, as it happens.
- **Sessions** (center) — each session as a flat row (state · tokens · tool calls · last activity). Filter by time / priority / kind and search by name; expand a row to **checkpoint, view checkpoint history, compact, fork, close, or delete** it.
- **Needs human** (right) — sessions waiting on you (a tool-permission prompt or an idle wait), with the tool + command as context. **Approve / Deny** from the browser; for `uvs`-launched (tmux-owned) sessions the keystroke is sent for you.

Sessions launched via `uvs` run inside a transparent tmux so Watchtower can act on them. Hooks forward every Claude Code event (`PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Notification`, `SessionStart`, `Stop`, ...) with session metadata merged in. A Node-only fallback (no Python) is available via `uvs watch --legacy`.

## Personas

Four modes for different contexts. Pick one when you start a session.

```
             Spike          Sport        Professional       Auto
             ─────          ─────        ────────────       ────
Purpose      Research       Build new    Ship to prod       Let it run
             & document     things

Model        Opus           Sonnet       Inherit            Inherit
Effort       max            high         high               max

Writes       New files      Anything     Anything           Anything
             only                        (reviewed)         (autonomous)
Edits        Blocked        Allowed      Allowed            Allowed

Guardrails   Doc slop       None         All 6              All 6
Human gates  After each     End only     Every Act          Final output
             map                         boundary           only
```

### When to use what

| Situation | Mode | Why |
|---|---|---|
| Joining a new codebase | **Spike** | Understand before changing. Writes docs, not code. |
| Architecture review | **Spike** | Map the system, write ADRs, document findings. |
| Prototyping a demo | **Sport** | Move fast, iterate freely, quality comes later. |
| Hackathon or new project | **Sport** | Get the foundation down without review gates. |
| Fixing a bug in production code | **Professional** | Every change matters. Full review rigor. |
| Adding a feature to an existing service | **Professional** | Team depends on this code. Slop-checked. |
| Well-scoped task with a clear spec | **Auto** | Let the agent build, test, review end-to-end. |
| Batch of small tasks | **Auto** | Agent handles repetitive work autonomously. |

**Common progressions:**
- Spike → Sport → Professional (understand, explore, harden)
- Spike → Auto (research thoroughly, then let the agent execute)
- Sport → Professional (prototype fast, switch to rigor when it matters)

## Skills (slash commands)

12 skills. Each `skills/<name>/SKILL.md` is a thin orchestrator that dispatches to agents.

| Command | What it does |
|---|---|
| `/uvs-understand [dir]` | Map a codebase or whole stack — auto-detects repo vs stack |
| `/uvs-spec [requirements]` | Write a technical specification |
| `/uvs-architect [spec]` | Design architecture, decompose into Acts |
| `/uvs-test [file]` | Write tests or evals: `--unit` / `--integration` / `--eval` ([DeepEval](https://github.com/confident-ai/deepeval) compatible) |
| `/uvs-review` | Multi-specialist code review; add `--security` (OWASP via Semgrep/Gitleaks/Trivy), `--slop` (anti-slop audit), or `--architecture` (trace design vs. constraints) |
| `/uvs-prototype [concept]` | Build a static React prototype |
| `/uvs-qa` | Browser QA via Playwright MCP |
| `/uvs-investigate` | Systematic root-cause debugging |
| `/uvs-commit` | Review → test → commit (and optionally PR) |
| `/uvs-session init\|checkpoint\|restore\|end\|auto` | Session lifecycle — label, checkpoint, restore, end, or auto-checkpoint |
| `/uvs-lite [on\|off]` | Toggle terse output mode — no preamble, no summaries; persists across turns |
| `/uvs-help` | List every skill, agent, hook, guardrail, and persona |

## Hooks (lifecycle automation)

Fire automatically on Claude Code events. You never invoke these. ~28 scripts live in `hooks/`.

| Hook | Fires on | What it does |
|---|---|---|
| auto-lint | File write | Runs prettier, ruff, or gofmt |
| slop-grep | File edit/write | Ambient slop detection on sport / professional / auto personas |
| doc-slop-grep | File edit/write | Catches vague adjectives in markdown on the spike persona |
| danger-zone-check | File edit | Warns if file is in DANGER-ZONES.md |
| block-destructive | Bash command | Blocks `rm -rf /`, force push to main, `DROP TABLE` |
| session-label-nag | UserPromptSubmit | Reminds you to run `/uvs-session init` every Nth prompt while the session has no name |
| watchtower-send | All events | Forwards every event (with session metadata) to the dashboard at `localhost:4200` |
| watchtower-notify | Notification / PermissionRequest | Surfaces "needs human" approvals to the dashboard |
| watchtower-tokens | Stop | Reports per-session token usage (parsed from the transcript) |
| watchtower-end | SessionEnd | Marks the session terminated on the dashboard |
| session-start | SessionStart | Records start time, fires bootstrap event with session metadata |
| session-timer | PostToolUse | Reminders at 45 / 90 / 180 minutes |
| session-end | Stop | Shows duration, today's total, reflection prompt |
| session-review-reminder | Stop | Nudges you to review uncommitted changes |
| uv-out-* | Session events | Manage session-scoped artifacts under `uv-out/sessions/<sid>/` |
| status-line | Continuous | Renders session label, persona, priority, and timer in the Claude Code status bar |

## Agents

8 agents. The canonical definitions are `agents/claude-code/*.md`. The Cursor (`.mdc`) and Codex (`.toml`) variants are generated from those by `agents/generate.py` at install — they're not hand-maintained.

| Agent | Subsystem | Model | Cycle Budget |
|---|---|---|---|
| Cartographer | Index | Opus | 1 |
| Spec Writer | Acts | Opus | 1 |
| Architect | Acts | Opus | 2 |
| Reviewer | Guard | Opus | 1 |
| Test Writer | Acts | Sonnet | 3 |
| Eval Writer | Acts | Opus | 2 |
| Anti-Slop Guard | Guard | Opus | 1 |
| Prototype Builder | Acts | Sonnet | 3 |

## Artifacts

Agents write persistent output to `uv-out/`. Each agent reads prior artifacts automatically.

| Output | Read by |
|---|---|
| `uv-out/map-codebase.md` | /uvs-architect, /uvs-review, /uvs-review --security |
| `uv-out/specs/*.md` | /uvs-architect, /uvs-test, /uvs-test --eval |
| `uv-out/architecture/*.md` | /uvs-review, /uvs-test, /uvs-review --slop |
| `uv-out/review-*.md` | /uvs-review --slop, /uvs-review --security |
| `uv-out/sessions/<sid>/checkpoints/*.md` | /uvs-session restore |

## Integrations

| Tool | Used by | Purpose |
|---|---|---|
| [Graphify](https://github.com/safishamsi/graphify) | Cartographer | Knowledge graph from codebase via Tree-sitter |
| [Semgrep](https://github.com/semgrep/semgrep) | Security | SAST with 4000+ OWASP-mapped rules |
| [Gitleaks](https://github.com/gitleaks/gitleaks) | Security | Secret detection in git repos |
| [Trivy](https://github.com/aquasecurity/trivy) | Security | Dependency vulnerability scanning |
| [DeepEval](https://github.com/confident-ai/deepeval) | Eval Writer | Pytest-compatible LLM evaluation |
| [Playwright](https://playwright.dev/docs/getting-started-mcp) | Prototype, Test Writer | Browser automation and e2e testing |

## Project Structure After Install

```
.claude/
  settings.json          Permissions and hooks (seeded from your persona on first install)
  agents/                8 agent definitions (canonical .md)
  skills/                12 slash commands
  hooks/                 ~28 hook scripts
  rules/                 6 anti-slop guardrails (Pro / Auto only)
  personas/              4 persona configs
.codex/agents/           8 Codex agent definitions (generated from .claude/agents)
.cursor/rules/           8 Cursor rule definitions (generated from .claude/agents)
AGENTS.md                Codex instruction file
DANGER-ZONES.md          Risky areas (commit this)
.uv-suite-state/         Session metadata + counters (gitignored)
  current-session.txt
  sessions/<sid>.json
uv-out/                  Agent output artifacts (gitignored)
  sessions/<sid>/checkpoints/   Per-session checkpoints
```

## Documentation

| Document | What it covers |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Working on UV Suite — adding skills/agents/hooks, running the tests |
| [personas.md](personas.md) | 4 personas, 7 knobs, when to use each |
| [knowledge/practices.md](knowledge/practices.md) | Working principles (honesty, parallelism, scope, completion) |
| [acts-methodology.md](acts-methodology.md) | Acts delivery framework with worked examples |
| [knowledge/human-in-the-loop.md](knowledge/human-in-the-loop.md) | Cycle budgets, intervention types, learning loops |
| [knowledge/sharing-and-standards.md](knowledge/sharing-and-standards.md) | Danger zones, team standards, sharing levels |
| [research/landscape.md](research/landscape.md) | Open source tools and references for each agent |
| [research/comparison.md](research/comparison.md) | UV Suite vs gstack vs Claude Code built-in — feature comparison + prompt-depth deep dive |
| [research/tool-comparison.md](research/tool-comparison.md) | Claude Code vs Cursor vs Codex — how UV Suite works across all three |
| [research/best-practices.md](research/best-practices.md) | Subagent patterns, remote sessions, sharing with engineers, cost optimization |

## Author

Built by [Utsav](https://www.utsava.xyz/) — [utsava.xyz](https://www.utsava.xyz/).

## License

MIT
