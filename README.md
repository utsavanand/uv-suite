# UV Suite

A portable layer that turns Claude Code, Cursor, or Codex into a labeled, observable, anti-slop dev environment — with named sessions, a real-time observability dashboard, anti-slop guardrails, and per-session memory across launches.

## Install

```bash
npm install -g uv-suite
uvs claude pro                # auto-installs into the current project on first launch
```

Or with npx:

```bash
npx uv-suite install          # explicit install only
```

> **Note:** The CLI is `uvs`, not `uv`. The name `uv` belongs to Astral's Python package manager and likely already exists on your system.

## Quick Start

```bash
uvs claude pro                # Claude Code, Professional persona
uvs codex auto                # Codex, Auto persona
uvs pro                       # Shorthand for uvs claude pro
uvs install                   # Explicit install (also runs automatically on launch)
uvs watch                     # Open the Watchtower observability dashboard
uvs info                      # Show what's installed
```

On every `uvs` launch, you'll be prompted to label the session:

```
Label this session (Enter to skip — you'll be reminded):
  name:                     payments retry refactor
  kind [long/outcome]:      outcome
  purpose:                  ship retry-on-5xx for the Stripe webhook handler
  priority [low/med/high]:  high
```

Skip any field with Enter. If you skip the name, `/session-init` will be suggested every few prompts until you label it. Set `UVS_NO_PROMPT=1` to suppress prompts entirely.

## Start here

After `uvs claude pro`, pick the path that matches what you're doing. Each path names the first skill to run and the canonical next steps.

### Existing codebase (you didn't write this)
1. `/map-codebase` — builds a knowledge graph + architecture overview in `uv-out/map-codebase.md`. Other skills (`/architect`, `/review`, `/security-review`) read it automatically.
2. `/checkpoint` — captures your baseline understanding so `/restore` can bring it back next session.
3. Then: `/review` on the current diff, or `/spec` for the next feature.

### New project (you're starting from scratch)
1. `/spec` — converts your idea into a structured spec in `uv-out/specs/`.
2. `/architect` — breaks the spec into Acts with cycle budgets. Reads the spec automatically.
3. Then: implement Act by Act. Use `/write-tests` and `/review` per Act.

### Reviewing a PR
1. `/review [branch-name]` — reads diff + `CLAUDE.md` + `DANGER-ZONES.md` + prior `uv-out/` artifacts.
2. `/security-review` if the diff touches auth, payments, data access, or external inputs.

### Shipping
1. `/checkpoint` to capture state.
2. `/commit` — runs slop-check, tests, commits, optionally opens a PR.

Picking a persona (Spike / Sport / Professional / Auto) is a separate axis from picking a first skill — see [Personas](#personas) below for which mode fits which situation.

## Sessions and Watchtower

Each `uvs` launch generates a `UVS_SESSION_ID` and writes metadata to `.uv-suite-state/sessions/<id>.json`. This unlocks:

- **Concurrent terminals don't collide.** Two `uvs` launches in the same repo run as distinct sessions with separate names, checkpoints, and dashboard rows.
- **`uvs watch` shows them all.** The Watchtower dashboard at `localhost:4200` streams every tool call across every session in real time — labeled by your name, sorted by priority (high to top, low dimmed), color-coded by persona.
- **Per-session checkpoints.** `/checkpoint` writes to `uv-out/checkpoints/<sid>/`, and `/restore` auto-picks the current session's latest. Pass a session id prefix or name to restore from a different one.
- **Status line shows it all.** The Claude Code status bar shows session name, persona, priority, and elapsed time continuously.

### Watchtower at a glance

```
Sessions               Events    Tool calls    Errors    Need human
4                      1,247     914           2         0

[payments retry [auto]   [P:high]  [outcome]      ] (147)
[infra cleanup  [pro]    [P:med]   [long-running] ] (382)
[exec deck      [spike]  [P:low]   [outcome]      ] (89)
```

Hooks fire on every Claude Code event (`PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `SessionStart`, `Stop`, `PermissionRequest`, ...) and forward to the dashboard with the session metadata merged in. Zero dependencies — vanilla Node + SSE.

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

| Command | What it does |
|---|---|
| `/map-codebase [dir]` | Build a knowledge graph of the codebase |
| `/map-stack [dir]` | Map multiple services and their connections |
| `/spec [requirements]` | Write a technical specification |
| `/architect [spec]` | Design architecture, decompose into Acts |
| `/prototype [concept]` | Build a static React prototype |
| `/write-tests [file]` | Generate tests matching project conventions |
| `/write-evals [prompt]` | Write AI/LLM evaluation cases ([DeepEval](https://github.com/confident-ai/deepeval) compatible) |
| `/review` | Code review: correctness, security, performance, slop |
| `/slop-check` | Detect 6 categories of AI-generated slop |
| `/security-review` | OWASP audit, dependency scan, secret detection |
| `/investigate` | Systematic root-cause debugging |
| `/commit` | Review → test → slop-check → commit (and optionally PR) |
| `/checkpoint [label]` | Save session state to `uv-out/checkpoints/<sid>/` |
| `/restore [sid-prefix\|name]` | Load the latest checkpoint for the current (or named) session |
| `/session-init [name\|--kind\|--purpose\|--priority]` | Label or relabel the current session |
| `/confirm [on\|off\|<n>]` | Toggle reframe-and-confirm for prompts over `<n>` words |
| `/uv-help` | List every skill, agent, hook, guardrail, and persona |

## Hooks (lifecycle automation)

Fire automatically on Claude Code events. You never invoke these.

| Hook | Fires on | What it does |
|---|---|---|
| auto-lint | File write | Runs prettier, ruff, or gofmt |
| slop-grep | File write | Greps for obvious slop patterns (over-commented code, vague docs) |
| doc-slop-grep | File write | Catches vague adjectives in markdown |
| danger-zone-check | File edit | Warns if file is in DANGER-ZONES.md |
| block-destructive | Bash command | Blocks `rm -rf /`, force push to main, `DROP TABLE` |
| confirm-prompt | UserPromptSubmit | For prompts over the threshold, requires Claude to restate before any work starts |
| session-label-nag | UserPromptSubmit | Reminds you to run `/session-init` every Nth prompt while the session has no name |
| context-warning | PostToolUse | Warns when context usage crosses thresholds |
| watchtower-send | All events | Forwards every event (with session metadata) to `localhost:4200` |
| session-start | SessionStart | Records start time, fires bootstrap event with session metadata |
| session-timer | PostToolUse | Reminders at 45 / 90 / 180 minutes |
| session-end | Stop | Shows duration, today's total, reflection prompt |
| session-review-reminder | Stop | Nudges you to review uncommitted changes |
| status-line | Continuous | Renders session label, persona, priority, and timer in the Claude Code status bar |

## Agents

10 agents, each in 4 formats (Claude Code, Cursor, Codex, portable):

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
| DevOps | Acts | Opus | 2 |
| Security | Guard | Opus | 1 |

## Artifacts

Agents write persistent output to `uv-out/`. Each agent reads prior artifacts automatically.

| Output | Read by |
|---|---|
| `uv-out/map-codebase.md` | /architect, /review, /security-review |
| `uv-out/specs/*.md` | /architect, /write-tests, /write-evals |
| `uv-out/architecture/*.md` | /review, /write-tests, /slop-check |
| `uv-out/review-*.md` | /slop-check, /security-review |
| `uv-out/checkpoints/<sid>/*.md` | /restore |

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
  agents/                10 agent definitions
  skills/                17 slash commands
  hooks/                 14 hook scripts + 2 helpers
  rules/                 6 anti-slop guardrails (Pro / Auto only)
  personas/              4 persona configs
.codex/agents/           10 Codex agent definitions
.cursor/rules/           10 Cursor rule definitions
AGENTS.md                Codex instruction file
DANGER-ZONES.md          Risky areas (commit this)
.uv-suite-state/         Session metadata + counters (gitignored)
  current-session.txt
  sessions/<sid>.json
uv-out/                  Agent output artifacts (gitignored)
  checkpoints/<sid>/     Per-session checkpoints
```

## Documentation

| Document | What it covers |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Working on UV Suite — adding skills/agents/hooks, running the tests |
| [usage-guide.md](usage-guide.md) | Full SDLC mapped to exact commands |
| [personas.md](personas.md) | 4 personas, 7 knobs, when to use each |
| [practices.md](practices.md) | Working principles (honesty, parallelism, scope, completion) |
| [acts-methodology.md](acts-methodology.md) | Acts delivery framework with worked examples |
| [methodology/human-in-the-loop.md](methodology/human-in-the-loop.md) | Cycle budgets, intervention types, learning loops |
| [collaboration/sharing-and-standards.md](collaboration/sharing-and-standards.md) | Danger zones, team standards, sharing levels |
| [landscape.md](landscape.md) | Open source tools and references for each agent |
| [comparison.md](comparison.md) | UV Suite vs gstack vs Claude Code built-in — feature comparison + prompt-depth deep dive |
| [tool-comparison.md](tool-comparison.md) | Claude Code vs Cursor vs Codex — how UV Suite works across all three |
| [best-practices.md](best-practices.md) | Subagent patterns, remote sessions, sharing with engineers, cost optimization |

## License

MIT
