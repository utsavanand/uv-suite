# UV Suite

Portable framework for AI-assisted software development. Works with Claude Code, Cursor, and OpenAI Codex.

## Install

```bash
npm install -g uv-suite
uv install
```

Or with npx:

```bash
npx uv-suite install
```

This installs 10 agents, 10 skills, 8 hooks, 6 guardrails, and 4 personas into your project.

## Quick Start

```bash
uv install                    # Install UV Suite into current project
uv claude pro                 # Start Claude Code, Professional persona
uv codex auto                 # Start Codex, Auto persona
uv pro                        # Shorthand for uv claude pro
```

## Modes

Four personas for different contexts. Pick one when you start a session.

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

Hooks        1              1            8                  3
             doc-slop       lint         all                lint, block,
                                                            timer

Guardrails   Doc slop       None         All 6              All 6

Human gates  After each     End only     Every Act          Final output
             map                         boundary           only
```

### When to use what

| Situation | Mode | Why |
|-----------|------|-----|
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

## What You Get

| Category | Count | What |
|----------|-------|------|
| Agents | 10 | Subagent definitions for Claude Code, Cursor, and Codex |
| Skills | 10 | Slash commands with dynamic context injection |
| Hooks | 8 | Auto-lint, slop check, danger zones, session tracking, destructive blocks |
| Guardrails | 6 | Anti-slop rules (comments, overengineering, tests, docs, architecture, errors) |
| Personas | 4 | Spike, Sport, Professional, Auto |

## Three Subsystems

```
UV Index          UV Acts           UV Guard
Understand        Build             Review
Learn             Deliver           Harden
Remember          Present           Protect
```

**UV Index** maps codebases using [Graphify](https://github.com/safishamsi/graphify) knowledge graphs, captures context, builds persistent memory.

**UV Acts** delivers software in sequential phases (Acts) with parallel tasks, human-in-the-loop cycle budgets, and spec-driven development.

**UV Guard** catches AI slop in real time, reviews code for security (OWASP, [Semgrep](https://github.com/semgrep/semgrep)), and enforces danger zones.

## Skills

| Command | What it does |
|---------|-------------|
| `/map-codebase [dir]` | Build a knowledge graph of the codebase |
| `/map-stack [dir]` | Map multiple services and their connections |
| `/spec [requirements]` | Write a technical specification |
| `/architect [spec]` | Design architecture, decompose into Acts |
| `/review` | Code review: correctness, security, performance, slop |
| `/write-tests [file]` | Generate tests matching project conventions |
| `/write-evals [prompt]` | Write AI/LLM evaluation cases ([DeepEval](https://github.com/confident-ai/deepeval) compatible) |
| `/slop-check` | Detect 6 categories of AI-generated slop |
| `/prototype [concept]` | Build a static React prototype |
| `/security-review` | OWASP audit, dependency scan, secret detection |

## Hooks

Fire automatically. You never invoke these.

| Hook | Fires on | What it does |
|------|----------|-------------|
| auto-lint | File write | Runs prettier, ruff, or gofmt |
| Slop check | File write | Haiku scans for obvious slop patterns |
| Danger zone | File edit | Warns if file is in DANGER-ZONES.md |
| Destructive block | Bash command | Blocks rm -rf, force push, DROP TABLE |
| Session start | Session start | Records start time for duration tracking |
| Session timer | Every 20th tool call | Checkpoint reminders at 45/90/180 min |
| Session end | Session stop | Shows duration, today's total, reflection prompt |
| Status line | Continuous | Shows session time in Claude Code's status bar |

## Agents

10 agents, each in 4 formats (Claude Code, Cursor, Codex, Portable):

| Agent | Subsystem | Model | Cycle Budget |
|-------|-----------|-------|-------------|
| Cartographer | UV Index | Opus | 1 |
| Spec Writer | UV Acts | Opus | 1 |
| Architect | UV Acts | Opus | 2 |
| Reviewer | UV Guard | Opus | 1 |
| Test Writer | UV Acts | Sonnet | 3 |
| Eval Writer | UV Acts | Opus | 2 |
| Anti-Slop Guard | UV Guard | Opus | 1 |
| Prototype Builder | UV Acts | Sonnet | 3 |
| DevOps | UV Acts | Opus | 2 |
| Security | UV Guard | Opus | 1 |

## Artifacts

Agents write persistent output to `uv-out/`. Each agent reads prior artifacts automatically.

| Agent output | Read by |
|-------------|---------|
| `uv-out/map-codebase.md` | /architect, /review, /security-review |
| `uv-out/specs/*.md` | /architect, /write-tests, /write-evals |
| `uv-out/architecture/*.md` | /review, /write-tests, /slop-check |
| `uv-out/review-*.md` | /slop-check, /security-review |

## Integrations

| Tool | Used by | Purpose |
|------|---------|---------|
| [Graphify](https://github.com/safishamsi/graphify) | Cartographer | Knowledge graph from codebase via Tree-sitter |
| [Semgrep](https://github.com/semgrep/semgrep) | Security Agent | SAST with 4000+ OWASP-mapped rules |
| [Gitleaks](https://github.com/gitleaks/gitleaks) | Security Agent | Secret detection in git repos |
| [Trivy](https://github.com/aquasecurity/trivy) | Security Agent | Dependency vulnerability scanning |
| [DeepEval](https://github.com/confident-ai/deepeval) | Eval Writer | Pytest-compatible LLM evaluation |
| [Playwright](https://playwright.dev/docs/getting-started-mcp) | Prototype Builder, Test Writer | Browser automation and e2e testing |

## Project Structure After Install

```
.claude/
  settings.json        Permissions, hooks (from persona)
  agents/              10 agent definitions
  skills/              10 slash commands
  hooks/               7 hook scripts
  rules/               6 anti-slop guardrails
  personas/            4 persona configs
.codex/agents/         10 Codex agent definitions
.cursor/rules/         10 Cursor rule definitions
AGENTS.md              Codex instruction file
DANGER-ZONES.md        Risky areas (commit this)
uv-out/                Agent output artifacts (gitignored)
```

## Documentation

| Document | What it covers |
|----------|---------------|
| [usage-guide.md](usage-guide.md) | Full SDLC mapped to exact commands |
| [personas.md](personas.md) | 4 personas, 7 knobs, when to use each |
| [practices.md](practices.md) | Working principles (honesty, parallelism, scope, completion) |
| [acts-methodology.md](acts-methodology.md) | Acts delivery framework with worked examples |
| [methodology/human-in-the-loop.md](methodology/human-in-the-loop.md) | Cycle budgets, intervention types, learning loops |
| [collaboration/sharing-and-standards.md](collaboration/sharing-and-standards.md) | Danger zones, team standards, sharing levels |
| [landscape.md](landscape.md) | Open source tools and references for each agent |

## License

MIT
