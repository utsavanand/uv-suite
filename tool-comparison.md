# UV Suite — Tool Comparison

Deep comparison of Claude Code, Cursor, and OpenAI Codex. UV Suite works across all three — this guide helps you choose and configure each.

---

## Executive Summary

| | Claude Code | Cursor | OpenAI Codex |
|---|------------|--------|--------------|
| **Interface** | Terminal CLI + VS Code extension | VS Code fork (native IDE) | Terminal CLI + Cloud web app |
| **Best for** | Maximum automation and control | IDE-native workflow | Fire-and-forget async tasks |
| **Agent model** | Subagents + Agent Teams + Hooks + Skills | Subagents + Background/Cloud Agents | Subagents + Cloud sandbox |
| **Unique strength** | Lifecycle hooks (21 events), Agent SDK | Computer Use (browser interaction, visual verification) | Two-phase sandbox (network setup → offline agent) |
| **Portability** | `.claude/` directory (commit to repo) | `.cursor/rules/` directory (commit to repo) | `.codex/` directory (commit to repo) |
| **Remote execution** | Remote Control, Agent SDK (Python/TypeScript) | Background Agents, Cloud Agents (self-hosted available) | Cloud tasks, CLI bridge |
| **Cost model** | API tokens (you control model per agent) | Subscription + usage | API tokens + cloud compute |

---

## 1. Instruction Files: The Portability Layer

The single most important configuration for UV Suite is the instruction file — the document that tells the AI tool how to behave in your project.

### Claude Code: `CLAUDE.md`

```markdown
# My Project

## Architecture
Monorepo with packages/frontend (React) and packages/api (Express).

## Conventions
- Use TypeScript strict mode
- Tests go next to source files as *.test.ts
- Use Zod for API validation

## Commands
- `npm run dev` — start dev server
- `npm test` — run tests
- `npm run lint` — lint with ESLint
```

**Location hierarchy:**
1. `~/.claude/CLAUDE.md` — User global (your personal standards)
2. `CLAUDE.md` at project root — Shared (commit to repo)
3. `CLAUDE.local.md` — Personal overrides (gitignored)
4. `CLAUDE.md` in subdirectories — Scoped to that directory

**Loaded:** Automatically at session start. Always in context.

### Cursor: `.cursor/rules/*.mdc`

```yaml
# .cursor/rules/conventions.mdc
---
description: "Project coding conventions and patterns"
alwaysApply: true
---

## Architecture
Monorepo with packages/frontend (React) and packages/api (Express).

## Conventions
- Use TypeScript strict mode
- Tests go next to source files as *.test.ts
- Use Zod for API validation
```

**Frontmatter controls activation:**

| Field | Values | Meaning |
|-------|--------|---------|
| `alwaysApply` | `true` | Loaded into every prompt |
| `alwaysApply` | `false` + `description` | Agent decides based on description |
| `globs` | `"**/*.tsx"` | Only loaded when working on matching files |

**Location hierarchy:**
1. User Rules (Cursor Settings UI) — Personal
2. `.cursor/rules/` directory — Project (commit to repo)
3. Team Rules — Organization-level (highest priority)

**Tip:** Keep combined `alwaysApply: true` rules under ~2,000 tokens.

### OpenAI Codex: `AGENTS.md`

```markdown
# My Project

## Architecture
Monorepo with packages/frontend (React) and packages/api (Express).

## Conventions
- Use TypeScript strict mode
- Tests go next to source files as *.test.ts
- Use Zod for API validation
```

**Location hierarchy:**
1. `~/.codex/AGENTS.override.md` — User global override (highest priority)
2. `~/.codex/AGENTS.md` — User global
3. `AGENTS.override.md` in any directory from git root to CWD
4. `AGENTS.md` in any directory from git root to CWD
5. Files concatenate root-down (32 KiB max combined)

**Key difference:** Codex walks the directory tree and concatenates all matching files. Closer files appear later (higher priority by position).

### Portable Strategy

Maintain a single `CODING-STANDARDS.md` as your source of truth, then generate tool-specific wrappers:

```
CODING-STANDARDS.md (portable, tool-agnostic)
    ├── → CLAUDE.md (with Claude-specific additions)
    ├── → .cursor/rules/standards.mdc (with frontmatter)
    └── → AGENTS.md (with Codex-specific additions)
```

The tool-specific additions are thin:
- **Claude Code**: Hook configurations, skill references, permission settings
- **Cursor**: `alwaysApply`/`globs` frontmatter, description for intelligent matching
- **Codex**: Override chain awareness, size constraints (32 KiB)

See: [portable-standards.md](portable-standards.md)

---

## 2. Subagent Support

### Claude Code Subagents

**Definition format:** Markdown files with YAML frontmatter in `.claude/agents/`

```yaml
# .claude/agents/reviewer.md
---
name: reviewer
description: "Code review for correctness, security, performance"
model: opus
tools:
  - Read
  - Grep
  - Glob
disallowedTools:
  - Write
  - Edit
effort: high
---

You are the Reviewer. [Instructions...]
```

**Key capabilities:**
- **Model selection per agent** — Use Haiku for fast exploration, Opus for deep review
- **Tool whitelisting/blacklisting** — Read-only agents can't modify code
- **Skill preloading** — Inject skill content at startup
- **MCP server scoping** — Give specific agents access to specific external tools
- **Permission modes** — Each agent can have its own permission level
- **Background execution** — Run agents in the background
- **Hooks per agent** — Lifecycle hooks scoped to the agent's execution

**Scopes:**
- `~/.claude/agents/` — Personal (all projects)
- `.claude/agents/` — Project (commit to repo, shared with team)

**Invocation:**
- Automatic: Claude delegates based on `description` field
- Explicit: "Use the reviewer agent to check my changes"
- Skill-based: `/review` (skill that runs in reviewer subagent context)

### Cursor Subagents

**Available since:** Cursor 2.4 (Feb 2026)

Cursor's subagents are more implicit — they're spawned by the Composer agent when it determines parallel work is beneficial:

- Independent agents with their own context and tools
- Run in parallel (up to 8 simultaneously via Git worktree isolation)
- Can run tests, write docs, and research simultaneously
- Less configurable than Claude Code's explicit definitions

**Key difference:** Cursor's subagents are primarily orchestrated by the Composer agent, not explicitly defined by the user. You influence them through rules, not through agent definition files.

### Codex Subagents

**Definition format:** TOML files in `.codex/agents/`

```toml
# .codex/agents/reviewer.toml
name = "reviewer"
description = "Code review for correctness, security, performance"
developer_instructions = """
You are the Reviewer. [Instructions...]
"""
model_reasoning_effort = "high"
```

**Key capabilities:**
- Built-in types: `default`, `worker`, `explorer`
- Max 6 concurrent threads
- CSV batch processing for parallel data tasks
- MCP server scoping per agent
- Skills configuration per agent

### Comparison Matrix

| Feature | Claude Code | Cursor | Codex |
|---------|-------------|--------|-------|
| Custom agent definitions | Yes (.md files) | Limited (rules influence behavior) | Yes (.toml files) |
| Model per agent | Yes | No (uses Composer model) | Yes |
| Tool control per agent | Yes (whitelist + blacklist) | No | Yes |
| Max parallel agents | Configurable | 8 (worktree) | 6 (threads) |
| Agent-specific MCP | Yes | No | Yes |
| Lifecycle hooks per agent | Yes | No | No |
| Background execution | Yes | Yes (Cloud Agents) | Yes (Cloud tasks) |

**UV Suite recommendation:** Claude Code has the most expressive subagent model. Define your agents there first, then create simplified equivalents for Cursor (as rules) and Codex (as TOML agents).

---

## 3. Remote and Headless Execution

### Claude Code

**Three modes:**

| Mode | Command | What it does |
|------|---------|-------------|
| Remote Control | `claude remote-control` | Run locally, control from browser/mobile |
| Agent SDK (Python) | `import claude_code` | Programmatic control, scripting, CI/CD |
| Agent SDK (TypeScript) | `import { claude } from "@anthropic-ai/claude-code"` | Same as Python, for Node.js |
| CI/CD | GitHub Actions / GitLab CI | Headless execution in pipelines |

**Remote Control details:**
- Run on your machine, access from `claude.ai/code` or mobile app
- Full local filesystem, MCP, and configuration access
- Server mode: `--spawn worktree` for parallel isolated sessions
- No inbound ports needed — outbound HTTPS only
- Your machine must stay on

**Agent SDK example (Python):**
```python
from claude_code import claude

result = claude(
    prompt="Review the changes in the last commit",
    cwd="/path/to/project",
    model="claude-opus-4-6",
    max_turns=10
)
print(result.text)
```

### Cursor

**Two modes:**

| Mode | What it does |
|------|-------------|
| Background Agents | Clone repo, work on branch, open PR when done |
| Cloud Agents | Full dev environment (desktop, browser, terminal) in cloud VM |

**Background Agents:**
- Truly async — you close the tab, it keeps working
- Creates a branch, makes changes, opens a PR
- You review the PR like any other
- Self-hosted option: keep code on your network

**Cloud Agents (unique capability):**
- Each agent gets a full desktop environment
- Can open browsers, navigate localhost, click UI elements
- Visual verification: the agent sees what a human would see
- ~30% of Cursor's own merged PRs come from these agents

### Codex

**Two modes:**

| Mode | What it does |
|------|-------------|
| CLI (`codex`) | Local execution with filesystem access |
| Cloud (`codex cloud`) | Sandboxed containers, async task completion |

**Cloud sandbox:**
- Two-phase runtime: setup (with network for `npm install`) then agent (offline by default)
- Results in PRs or local patches
- Strong security: offline agent can't exfiltrate code
- `codex cloud` CLI bridges local and cloud

### Comparison

| Feature | Claude Code | Cursor | Codex |
|---------|-------------|--------|-------|
| Headless CLI | Yes (`claude -p`) | No | Yes (`codex`) |
| Browser control | Yes (Remote Control) | Yes (native IDE) | Yes (Cloud web app) |
| Mobile control | Yes (claude.ai/code) | No | No |
| Async (fire and forget) | Partial (Remote Control) | Yes (Background Agents) | Yes (Cloud tasks) |
| Visual verification | No | Yes (Cloud Agents + Computer Use) | No |
| Self-hosted remote | Yes (any machine with CLI) | Yes (Self-hosted Cloud Agents) | Yes (local CLI) |
| SDK (programmatic) | Yes (Python + TypeScript) | No | Partial (via Agents SDK) |
| CI/CD integration | Yes (GitHub Actions, GitLab) | No native | Partial |

**UV Suite recommendation:**
- **For interactive development:** Claude Code Remote Control (access from anywhere, full local context)
- **For fire-and-forget tasks:** Cursor Background Agents or Codex Cloud (truly async)
- **For CI/CD automation:** Claude Code Agent SDK (programmatic, scriptable)
- **For visual verification:** Cursor Cloud Agents (sees the browser)

---

## 4. Hooks and Lifecycle Automation

### Claude Code: 21 Lifecycle Events

Claude Code is the only tool with a comprehensive hook system. Hooks are deterministic (not AI-driven) and fire at specific points:

**Key hooks for UV Suite:**

| Event | UV Suite use case |
|-------|-------------------|
| `PreToolUse(Bash)` | Block dangerous commands (rm -rf, force push) |
| `PreToolUse(Edit\|Write)` | Run anti-slop checks before file modifications |
| `PostToolUse(Write)` | Auto-format written files |
| `SessionStart` | Load environment, check for pending reviews |
| `Stop` | Auto-run anti-slop guard on session output |
| `UserPromptSubmit` | Capture requirements for spec tracking |

**Example: Auto-review hook**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/auto-lint.sh",
            "statusMessage": "Running linter..."
          }
        ]
      }
    ]
  }
}
```

### Cursor: No Hook System

Cursor does not have lifecycle hooks. Automation is achieved through:
- `.cursor/rules/` with `alwaysApply: true` (always-loaded instructions)
- Cursor's built-in "Automations" (beta, limited to predefined triggers)
- External tools (pre-commit hooks, CI checks)

### Codex: No Hook System

Codex does not have lifecycle hooks. Automation is through:
- Skills with embedded scripts
- External CI/CD pipelines
- Pre/post-commit Git hooks (standard Git, not Codex-specific)

**UV Suite recommendation:** Claude Code's hooks are a significant differentiator. Use them for:
- Security gates (block dangerous operations)
- Quality gates (auto-lint, auto-format)
- Anti-slop checks (flag AI-generated boilerplate)
- Environment management (load secrets, check prerequisites)

For Cursor and Codex, achieve similar results through Git hooks and CI pipelines.

---

## 5. Skills and Reusable Workflows

### Claude Code Skills

```
.claude/skills/
├── review/
│   └── SKILL.md          # /review — invoke the reviewer
├── spec/
│   └── SKILL.md          # /spec — write a technical specification
├── map-codebase/
│   └── SKILL.md          # /map-codebase — invoke the cartographer
└── acts/
    └── SKILL.md          # /acts — plan acts for a feature
```

**Skill features:**
- User-invokable (`/skill-name`) or auto-invokable (Claude decides)
- Can run in forked subagent context
- Support shell command expansion in prompts
- Support argument passing (`/spec "user authentication"`)
- Can include hooks scoped to skill execution
- Can preload other skills

### Cursor: Rules Only

Cursor doesn't have a direct equivalent to skills. The closest is:
- `.cursor/rules/` with `alwaysApply: false` and a `description` — Agent decides when to apply
- Manual invocation via `@rule-name` in chat
- No support for shell expansion or argument passing

### Codex: Skills + Plugins

```toml
# config.toml
[[skills.config]]
name = "review"
path = "~/.codex/skills/review/"
```

**Codex skills:**
- Bundle instructions + optional scripts + resources
- Installable via `$skill-installer`
- Configurable per project
- Plugin system bundles skills + MCP servers + integrations

### UV Suite Skill Mapping

| UV Suite Agent | Claude Code Skill | Cursor Rule | Codex Skill |
|---------------|-------------------|-------------|-------------|
| Cartographer | `/map-codebase` | `@cartographer` | `$cartographer` |
| Spec Writer | `/spec` | `@spec-writer` | `$spec` |
| Architect | `/architect` | `@architect` | `$architect` |
| Reviewer | `/review` | `@reviewer` | `$review` |
| Test Writer | `/write-tests` | `@test-writer` | `$write-tests` |
| Eval Writer | `/write-evals` | `@eval-writer` | `$write-evals` |
| Anti-Slop Guard | `/slop-check` | `@anti-slop` | `$slop-check` |
| Prototype Builder | `/prototype` | `@prototype` | `$prototype` |
| DevOps | `/devops` | `@devops` | `$devops` |
| Security | `/security-review` | `@security` | `$security` |

---

## 6. MCP Server Support

| Feature | Claude Code | Cursor | Codex |
|---------|-------------|--------|-------|
| MCP support | Native | Yes (since April 2026) | Native |
| Config file | `.claude/mcp.json` | `.cursor/mcp.json` | Agent TOML `mcp_servers` |
| Tool limit | Unlimited | 40 tools max | Unlimited |
| Produce MCP | Yes | No | Yes |
| Consume MCP | Yes | Yes | Yes |
| Per-agent scoping | Yes | No | Yes |
| Transport | stdio, HTTP, SSE, WebSocket | stdio, HTTP, SSE | stdio, HTTP |

**UV Suite recommendation:** MCP servers are the most portable extension mechanism. A single MCP server works across all three tools. If you're building custom tools for UV Suite, build them as MCP servers.

---

## 7. What Can Be Reused Across Tools?

### Fully Portable (no changes needed)

| Asset | Format | Used by |
|-------|--------|---------|
| Coding standards | Markdown | All three (as content in instruction files) |
| Review checklists | Markdown | All three (referenced in agent prompts) |
| Spec templates | Markdown | All three |
| Acts templates | Markdown | All three |
| MCP servers | JSON config + server process | All three |
| Git hooks | Shell scripts | All three (standard Git, not tool-specific) |
| CI/CD pipelines | YAML | All three (GitHub Actions, etc.) |

### Requires thin wrapper per tool

| Asset | Claude Code | Cursor | Codex |
|-------|-------------|--------|-------|
| Agent definitions | `.md` with YAML frontmatter | `.mdc` with activation rules | `.toml` |
| Project instructions | `CLAUDE.md` | `.cursor/rules/*.mdc` | `AGENTS.md` |
| Skills/commands | `.claude/skills/` | Rules with descriptions | Skills TOML + scripts |
| Lifecycle hooks | `settings.json` hooks | N/A (use Git hooks) | N/A (use Git hooks) |
| Settings | `settings.json` | Cursor Settings UI | `config.toml` |

### Not portable (tool-specific)

| Asset | Tool |
|-------|------|
| Agent Teams | Claude Code only |
| Remote Control | Claude Code only |
| Background Agents (cloud VMs) | Cursor only |
| Computer Use (visual verification) | Cursor only |
| Two-phase sandbox | Codex only |
| Plugin marketplace | Codex only |

---

## 8. Strategic Recommendations

### If you primarily use Claude Code (recommended for UV Suite):

1. **Define all agents as subagents** in `.claude/agents/` — this gives you the richest control
2. **Create skills** for each agent invocation — `/review`, `/spec`, `/map-codebase`, etc.
3. **Use hooks** for automated quality gates — lint on write, anti-slop on session end
4. **Use Remote Control** for working from any device
5. **Use Agent SDK** for CI/CD automation and scripting
6. **Keep portable standards separate** so you can generate Cursor/Codex wrappers when needed

### If you switch between tools:

1. **Maintain CODING-STANDARDS.md as source of truth** — tool-agnostic
2. **Generate tool-specific configs** from the portable core
3. **Build custom tools as MCP servers** — they work across all three
4. **Use Git hooks for guardrails** — they work regardless of AI tool
5. **Accept that some features are tool-specific** — don't try to replicate Claude Code hooks in Cursor

### If you're choosing a tool for a team:

| Team profile | Recommended tool |
|-------------|-----------------|
| CLI-native, values automation | Claude Code |
| IDE-native, visual workers | Cursor |
| Async/distributed, security-conscious | Codex |
| Mixed preferences | Claude Code for power users, Cursor for IDE users, shared MCP servers |
