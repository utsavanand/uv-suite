# UV Suite

Portable framework for AI-assisted software development. Works with Claude Code, Cursor, and OpenAI Codex.

## Install

```bash
npx uv-suite install
```

Or clone and run directly:

```bash
git clone https://github.com/utsavanand/uv-suite.git
cd uv-suite
./install.sh
```

This installs 10 agents, 9 skills, 5 hooks, 6 guardrails, and 4 personas into your project's `.claude/` directory.

## What You Get

| Category | Count | What |
|----------|-------|------|
| Agents | 10 | Subagent definitions for Claude Code, Cursor, and Codex |
| Skills | 9 | Slash commands with dynamic context injection |
| Hooks | 5 | Auto-lint, slop check, danger zones, destructive blocks, review reminder |
| Guardrails | 6 | Anti-slop rules (comments, overengineering, tests, docs, architecture, errors) |
| Personas | 4 | Spike, Sport, Professional, Auto — different rigor for different contexts |

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

## Skills (Slash Commands)

| Command | What it does |
|---------|-------------|
| `/map-codebase [dir]` | Build a knowledge graph of the codebase |
| `/spec [requirements]` | Write a technical specification |
| `/architect [spec]` | Design architecture, decompose into Acts |
| `/review` | Code review: correctness, security, performance, slop |
| `/write-tests [file]` | Generate tests matching project conventions |
| `/write-evals [prompt]` | Write AI/LLM evaluation cases ([DeepEval](https://github.com/confident-ai/deepeval) compatible) |
| `/slop-check` | Detect 6 categories of AI-generated slop |
| `/prototype [concept]` | Build a static React prototype |
| `/security-review` | OWASP audit, dependency scan, secret detection |

## Personas

Different contexts need different rigor. Pick a persona when you start a session.

```bash
./uv.sh spike        # Research & docs (Opus, max effort, doc-slop checked)
./uv.sh sport        # New projects (Sonnet, high effort, lint only)
./uv.sh pro          # Production code (all hooks, all guardrails)
./uv.sh auto         # Fully autonomous (max effort, everything approved)
```

Or launch Claude directly:

```bash
claude --settings .claude/personas/professional.json
```

| Persona | For | Effort | Hooks | Guardrails |
|---------|-----|--------|-------|------------|
| **Spike** | Research, documentation | max | 1 (doc slop) | Doc slop |
| **Sport** | New projects, prototyping | high | 1 (lint) | None |
| **Professional** | Production code (default) | high | All 5 | All 6 |
| **Auto** | Fully autonomous execution | max | 2 (lint + block) | All 6 |

## Hooks (Automatic)

These fire without invocation. You never type these.

| Hook | Fires on | What it does |
|------|----------|-------------|
| auto-lint | Every file write | Runs prettier, ruff, or gofmt |
| Slop check | Every file write | Haiku scans for obvious slop patterns |
| Danger zone | Every file edit | Warns if file is in DANGER-ZONES.md |
| Destructive block | Every bash command | Blocks rm -rf, force push, DROP TABLE |
| Review reminder | Session ending | Reminds to /review if uncommitted changes |

## Agents

10 agents, each available in 4 formats:

| Agent | Subsystem | Model | Read-only | Cycle Budget |
|-------|-----------|-------|-----------|-------------|
| Cartographer | UV Index | Opus | Yes | 1 |
| Spec Writer | UV Acts | Opus | No | 1 |
| Architect | UV Acts | Opus | No | 1 |
| Reviewer | UV Guard | Opus | Yes | 1 |
| Test Writer | UV Acts | Sonnet | No | 3 |
| Eval Writer | UV Acts | Opus | No | 2 |
| Anti-Slop Guard | UV Guard | Opus | Yes | 1 |
| Prototype Builder | UV Acts | Sonnet | No | 3 |
| DevOps | UV Acts | Sonnet | No | 2 |
| Security | UV Guard | Opus | Yes | 1 |

Each agent has definitions for:
- **Claude Code** — `.claude/agents/*.md`
- **Cursor** — `.cursor/rules/*.mdc`
- **Codex** — `.codex/agents/*.toml`
- **Portable** — tool-agnostic Markdown

## Human-in-the-Loop

Agents get cycle budgets — maximum attempts before mandatory escalation to the human. Four intervention types:

- **Teach** — domain knowledge the agent lacks
- **Debug** — when the agent is stuck after retries
- **Taste** — subjective and aesthetic decisions
- **Clarify** — ambiguous or conflicting requirements

Every intervention gets persisted so the agent doesn't need re-teaching.

## Collaboration

- **DANGER-ZONES.md** — mark risky areas, agents check before modifying
- **Inline annotations** — `@danger`, `@agent-skip`, `@agent-ask` in code
- **Sharing levels** — personal, project, team, community
- **Team-evolved standards** — best practices that improve through use

## Integrations

UV Suite works with the open source ecosystem:

| Tool | Used by | Purpose |
|------|---------|---------|
| [Graphify](https://github.com/safishamsi/graphify) | Cartographer | Knowledge graph from codebase via Tree-sitter |
| [Semgrep](https://github.com/semgrep/semgrep) | Security Agent | SAST with 4000+ OWASP-mapped rules |
| [Gitleaks](https://github.com/gitleaks/gitleaks) | Security Agent | Secret detection in git repos |
| [Trivy](https://github.com/aquasecurity/trivy) | Security Agent | Dependency vulnerability scanning |
| [DeepEval](https://github.com/confident-ai/deepeval) | Eval Writer | Pytest-compatible LLM evaluation |
| [Ruff](https://github.com/astral-sh/ruff) | auto-lint hook | Python linting and formatting |

## Project Structure After Install

```
.claude/
  settings.json        Permissions, hooks (from persona)
  agents/              10 agent definitions
  skills/              9 slash commands
  hooks/               4 hook scripts
  rules/               6 anti-slop guardrails
  personas/            4 persona configs
DANGER-ZONES.md        Risky areas (commit this)
uv.sh                  Session launcher
```

## Documentation

| Document | What it covers |
|----------|---------------|
| [usage-guide.md](usage-guide.md) | Full SDLC mapped to exact commands and invocations |
| [personas.md](personas.md) | 4 personas, 7 knobs, when to use each |
| [acts-methodology.md](acts-methodology.md) | Acts delivery framework with worked examples |
| [methodology/human-in-the-loop.md](methodology/human-in-the-loop.md) | Cycle budgets, intervention types, learning loops |
| [collaboration/sharing-and-standards.md](collaboration/sharing-and-standards.md) | Danger zones, team standards, sharing levels |
| [landscape.md](landscape.md) | Open source tools and references for each agent |
| [agents.md](agents.md) | Full specifications for all 10 agents |
| [anti-slop.md](anti-slop.md) | 6 categories of AI slop with detection rules |
| [tool-comparison.md](tool-comparison.md) | Claude Code vs Cursor vs Codex comparison |

## License

MIT
