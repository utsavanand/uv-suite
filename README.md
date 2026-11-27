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
Six slop rules in two files (over-engineering, architecture, error-handling, comment, test, and
architecture slop) run ambiently on the Pro / Auto personas, catching
AI-generated noise as it's written rather than at review time.

### 📜 Per-session memory
survives across launches, compaction, and terminal restarts.

## Start here

After `uvs claude pro`, pick the path that matches what you're doing. Each path names the first skill to run and the canonical next steps.

### Existing codebase (you didn't write this)
1. `/uvs-map-codebase` — builds a knowledge graph + architecture overview in `uv-out/map-codebase.md`. Other skills (`/uvs-plan`, `/uvs-review`, `/uvs-review --security`) read it automatically.
3. Then: `/uvs-review` on the current diff, or `/uvs-spec` for the next feature.

### New project (you're starting from scratch)
1. `/uvs-spec` — converts your idea into a structured spec in `uv-out/specs/`.
2. `/uvs-plan` — breaks the spec into Acts with cycle budgets. Reads the spec automatically.
3. Then: implement Act by Act. Use `/uvs-test` and `/uvs-review` per Act.

### Reviewing a PR
1. `/uvs-review [branch-name]` — reads diff + `CLAUDE.md` + `DANGER-ZONES.md` + prior `uv-out/` artifacts.
2. `/uvs-review --security` if the diff touches auth, payments, data access, or external inputs.

### Shipping
2. `/uvs-ship` — runs review, tests, commits, optionally opens a PR.

Picking a persona (Spike / Sport / Professional / Auto) is a separate axis from picking a first skill — see [Personas](#personas) below for which mode fits which situation.

## Sessions and Watchtower

Each `uvs` launch generates a `UVS_SESSION_ID` and writes metadata to `.uv-suite-state/sessions/<id>.json`. This unlocks:

- **Concurrent terminals don't collide.** Two `uvs` launches in the same repo run as distinct sessions with separate names, checkpoints, and dashboard rows.
- **`uvs watch` shows them all.** The Watchtower control plane at `localhost:4200` streams every session live and lets you act on them from the browser — see [Watchtower at a glance](#watchtower-at-a-glance).
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

9 skills. Each `skills/<name>/SKILL.md` is a thin orchestrator that dispatches to agents or does one job itself.

| Command | What it does |
|---|---|
| `/uvs-map-codebase [dir]` | Map a codebase or whole stack — auto-detects repo vs stack |
| `/uvs-spec [requirements]` | Write a technical specification |
| `/uvs-plan [spec]` | Design architecture, decompose into Acts |
| `/uvs-test [file]` | Write tests or evals: `--unit` / `--integration` / `--eval` ([DeepEval](https://github.com/confident-ai/deepeval) compatible) |
| `/uvs-review` | Multi-specialist code review; add `--security` (OWASP via Semgrep/Gitleaks/Trivy), `--slop` (anti-slop audit), or `--architecture` (trace design vs. constraints) |
| `/uvs-implement [concept]` | Build a static React prototype |
| `/uvs-qa` | Browser QA via Playwright MCP |
| `/uvs-debug` | Systematic root-cause debugging |
| `/uvs-ship` | Review → test → commit (and optionally PR) |

## Flows (sequences DuckTerm runs step by step)

A flow is a sequence of skills the DuckTerm runner drives, with gates the owner answers in the Flows tab. Four flows, each with the input it needs:

| Flow | Input | Steps |
|---|---|---|
| `pr-review` | a pull request number or URL | review decides: approve ends, revise or reject fails with the findings |
| `build` | a spec file | plan → gate "Approve the plan?" → implement → review decides; revise returns to implement up to three times |
| `qa` | the running app's URL | browser QA decides pass or fail |
| `ship` | a spec file and the app URL | plan → gate → implement → review and QA together → one verdict (`scripts/verdict.py`, no model) → commit and open the PR; revise returns to implement up to three times |

`/uvs-spec` writes the spec a build starts from; `/uvs-review` without a flow reviews the working tree.

## Permissions (an opinion on top of the harness's own)

The MetaHarness's permission rules sit on top of each harness's own permissioning. They allow without a prompt what a coding session does all day (reading, searching, the read-only git commands, the project's test, lint and build runners) and deny what should never run (`rm -rf` of root, home or the current folder, `sudo rm`, force push to main, hard reset to origin). Everything else keeps the harness's default, so `git commit`, `git push` and `gh pr` still ask. Copilot takes the rules as launch flags; Codex takes the shell rules only.

Validate warns that the MetaHarness combines private data (`read: *`), untrusted content (the Playwright MCP server the QA skill drives) and a way out (shell). That is inherent to browser QA; `/uvs-qa` drives only the app URL you give it, and the warning is accepted knowingly.

## Hooks (lifecycle automation)

One hook, because a hook is the only component that can stop a command by its content before it runs; everything else a hook used to do here (formatting, slop greps, danger-zone warnings, reminders) is the project's own tooling or a skill's job.

| Hook | Fires on | What it does |
|---|---|---|
| block-destructive | Before every shell command | Blocks `rm -rf` of root, home or the current folder, `DROP TABLE` and `TRUNCATE`, force push to main, `git reset --hard origin` |

## Agents

7 agents. The canonical definitions are `agents/claude-code/*.md`. The Cursor (`.mdc`) and Codex (`.toml`) variants are generated from those by `agents/generate.py` at install — they're not hand-maintained.

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
| `uv-out/map-codebase.md` | /uvs-plan, /uvs-review, /uvs-review --security |
| `uv-out/specs/*.md` | /uvs-plan, /uvs-test, /uvs-test --eval |
| `uv-out/architecture/*.md` | /uvs-review, /uvs-test, /uvs-review --slop |
| `uv-out/review-*.md` | /uvs-review --slop, /uvs-review --security |

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
  agents/                7 agent definitions (canonical .md)
  skills/                9 slash commands
  hooks/kit/             1 hook script (block-destructive); hooks/ holds the old installer's scripts
  rules/                 slop rules (Pro / Auto only)
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
| [knowledge/agent-working-rules.md](knowledge/agent-working-rules.md) | How the agent works: honesty, simplicity, surgical changes, verification, when to stop |
| [knowledge/acts-build-planning.md](knowledge/acts-build-planning.md) | Planning a build as Acts: structure, decomposition, sizing, cycle budgets |
| [knowledge/danger-zones.md](knowledge/danger-zones.md) | The DANGER-ZONES.md format and inline @danger markers |
| [knowledge/code-slop-rules.md](knowledge/code-slop-rules.md) · [doc-slop-rules.md](knowledge/doc-slop-rules.md) | The slop rules the reviewer and the anti-slop guard check |
| [research/landscape.md](research/landscape.md) | Open source tools and references for each agent |
| [research/comparison.md](research/comparison.md) | UV Suite vs gstack vs Claude Code built-in — feature comparison + prompt-depth deep dive |
| [research/tool-comparison.md](research/tool-comparison.md) | Claude Code vs Cursor vs Codex — how UV Suite works across all three |
| [research/best-practices.md](research/best-practices.md) | Subagent patterns, remote sessions, sharing with engineers, cost optimization |

## Author

Built by [Utsav](https://www.utsava.xyz/) — [utsava.xyz](https://www.utsava.xyz/).

## License

MIT
