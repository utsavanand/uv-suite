# UV Suite — Best Practices and Implementation Guide

How to get the most out of AI-assisted development. Covers subagent patterns, remote sessions, sharing with engineers, and cost optimization.

---

## Claude Code Best Practices

### 1. Structure Your `.claude/` Directory

```
.claude/
├── settings.json              # Shared project settings (commit to repo)
├── settings.local.json        # Personal overrides (gitignored)
├── agents/                    # UV Suite agents
│   ├── cartographer.md
│   ├── spec-writer.md
│   ├── architect.md
│   ├── reviewer.md
│   ├── test-writer.md
│   ├── eval-writer.md
│   ├── anti-slop-guard.md
│   ├── prototype-builder.md
│   ├── devops.md
│   └── security.md
├── skills/                    # Slash commands for each agent
│   ├── map-codebase/
│   │   └── SKILL.md
│   ├── spec/
│   │   └── SKILL.md
│   ├── review/
│   │   └── SKILL.md
│   └── slop-check/
│       └── SKILL.md
├── hooks/                     # Hook scripts
│   ├── auto-lint.sh
│   └── slop-detector.sh
├── mcp.json                   # MCP server configurations
└── rules/                     # Additional context rules
    └── coding-standards.md    # Generated from portable CODING-STANDARDS.md
```

### 2. Use CLAUDE.md Effectively

**Do:**
- Keep it under 2000 tokens for the always-loaded portion
- Put architecture overview, conventions, and key commands at the top
- Link to deeper docs rather than inlining them
- Update it when conventions change

**Don't:**
- Dump entire API documentation into CLAUDE.md
- Include ephemeral information (current sprint, today's tasks)
- Duplicate what's already in the code (framework docs, library docs)

**Template for new projects:**

```markdown
# [Project Name]

## What this is
[1-2 sentences]

## Tech stack
[Language, framework, database, deployment target]

## Project structure
[Key directories and what they contain]

## Conventions
[Naming, patterns, file organization]

## Commands
- `[how to run]`
- `[how to test]`
- `[how to lint]`
- `[how to build]`

## Architecture
[Brief overview, link to detailed docs if they exist]
```

### 3. Choose the Right Model per Agent

| Agent | Recommended Model | Why |
|-------|-------------------|-----|
| Cartographer | Opus | Needs deep understanding of large codebases |
| Spec Writer | Opus | Requirements analysis needs strong reasoning |
| Architect | Opus | System design decisions are high-stakes |
| Reviewer | Opus | Bug detection needs thorough analysis |
| Test Writer | Sonnet | Pattern-matching on test conventions |
| Eval Writer | Opus | Needs to think adversarially |
| Anti-Slop Guard | Opus | Subjective quality judgment |
| Prototype Builder | Sonnet | Code generation speed matters more |
| DevOps | Sonnet | Infrastructure patterns are well-established |
| Security | Opus | Security requires exhaustive checking |

**Cost optimization:** Use Sonnet for "production" tasks (code generation, tests, infra) and Opus for "judgment" tasks (review, architecture, security). The Explore subagent uses Haiku for fast codebase searches — keep using that for navigation.

### 4. Use Hooks for Guardrails

**Essential hooks for UV Suite:**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/block-dangerous-commands.sh",
            "statusMessage": "Checking command safety..."
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/auto-lint.sh",
            "statusMessage": "Linting..."
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/session-summary.sh",
            "statusMessage": "Generating session summary..."
          }
        ]
      }
    ]
  }
}
```

### 5. Leverage Skills for Common Workflows

Create a skill for each UV Suite agent invocation:

```yaml
# .claude/skills/review/SKILL.md
---
name: review
description: >
  Run UV Suite code review. Checks correctness, security, performance, 
  and AI slop. Use when reviewing changes before merge.
user-invocable: true
context: fork
agent: reviewer
effort: high
---

Review the following changes for:
1. Correctness — does it do what it should?
2. Security — OWASP top 10 checks
3. Performance — N+1 queries, unbounded collections, blocking calls
4. AI Slop — boilerplate comments, over-engineering, vague tests

Changes to review:
!`git diff --cached || git diff`

Project context:
!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`
```

This skill:
- Invoked with `/review`
- Runs in a forked subagent (reviewer)
- Automatically captures the current diff
- Includes project context

---

## Subagent Patterns

### Should You Create Subagents?

**Yes, when:**
- The task is well-defined and repeatable (code review, test writing)
- You want consistent behavior across invocations
- The task produces verbose output you don't want in your main context
- You want tool restrictions (read-only reviewer)

**No, when:**
- The task is a one-off ("help me debug this specific issue")
- You need interactive back-and-forth during the task
- The task is simple enough that context isolation adds overhead

### Naming Conventions

| Convention | Example | Use |
|------------|---------|-----|
| Role name (lowercase) | `reviewer`, `architect` | Agent definitions in `.claude/agents/` |
| Slash command (lowercase) | `/review`, `/architect` | Skills in `.claude/skills/` |
| Descriptive (for invocation) | "Use the reviewer agent" | Explicit delegation in chat |

**Keep names:**
- Short (1-2 words)
- Action-oriented (`reviewer` not `code-review-system`)
- Consistent across tools (same name in Claude Code, Cursor, Codex)

### Invocation Patterns

**Pattern 1: Skill-based (recommended for UV Suite)**

```
/review                          # Invokes reviewer via skill
/spec "user authentication"      # Invokes spec-writer with argument
/map-codebase src/api/           # Invokes cartographer on specific directory
```

**Pattern 2: Explicit delegation**

```
Use the cartographer agent to map the src/payments/ directory.
Focus on upstream dependencies and the checkout flow.
```

**Pattern 3: Automatic delegation**

Write good `description` fields in your agent definitions. Claude will automatically delegate when the description matches:

```yaml
description: >
  Code review for correctness, security, and performance. 
  Use when reviewing changes before merge or when asked to 
  check code quality.
```

**Pattern 4: Parallel delegation**

```
Run three reviews in parallel:
1. Use the reviewer to check correctness
2. Use the security agent to check for vulnerabilities  
3. Use the anti-slop guard to check for AI-generated boilerplate
```

Claude Code will spawn three subagents simultaneously.

---

## Remote Sessions

### Running Code Generation Remotely

**Scenario:** You want to kick off a task and let it run while you do something else.

**Option 1: Remote Control (Claude Code)**

```bash
# Start a remote-accessible session
claude remote-control --name "Feature: user auth"

# Access from any browser at claude.ai/code
# Or from your phone via the Claude app
```

Benefits:
- Full local context (filesystem, MCP, settings)
- Can monitor and steer from anywhere
- Machine must stay on

**Option 2: Remote Control server mode with worktrees**

```bash
# Start server with worktree isolation for parallel work
claude remote-control --spawn worktree --capacity 5

# Each connection gets its own isolated worktree
# Multiple people (or multiple browser tabs) can work in parallel
```

Benefits:
- Parallel isolated sessions
- No file conflicts
- Each session can work on a different Act/task

**Option 3: Scheduled tasks**

```
/loop 10m check CI status and fix any failing tests
```

Or for one-shot:
```
/schedule nightly-review 0 9 * * * "Review all changes from yesterday and report issues"
```

**Option 4: Agent SDK for scripting**

```python
# run_review.py
from claude_code import claude

result = claude(
    prompt="Review all changes since last release tag",
    cwd="/path/to/project",
    model="claude-opus-4-6",
    max_turns=20
)

# Send result to Slack, email, or save to file
with open("review-report.md", "w") as f:
    f.write(result.text)
```

Run this from a cron job, CI pipeline, or manually.

---

## Sharing With Engineers

### Level 1: Share the portable standards

The lowest-friction way to share UV Suite:

```bash
# In any project
cp -r uv-suite/portable-standards/ my-project/
```

Engineers get:
- `CODING-STANDARDS.md` — Universal coding standards
- `REVIEW-CHECKLIST.md` — Code review checklist
- `SPEC-TEMPLATE.md` — Technical specification template
- `ACTS-TEMPLATE.md` — Act planning template

These work with any AI tool or without AI at all.

### Level 2: Share agent definitions

For Claude Code users, share the `.claude/agents/` directory:

```bash
# Commit to the project repo
cp -r uv-suite/agents/claude-code/ my-project/.claude/agents/
git add .claude/agents/
git commit -m "Add UV Suite agent definitions"
```

Now every developer on the project has access to `/review`, `/spec`, `/map-codebase`, etc.

### Level 3: Share as a personal toolkit

For your own use across projects:

```bash
# Install UV Suite agents globally
cp -r uv-suite/agents/claude-code/*.md ~/.claude/agents/

# Install skills globally
cp -r uv-suite/skills/claude-code/ ~/.claude/skills/
```

Now every project you work on has UV Suite available.

### Level 4: Share as a plugin

For distribution to a team or community:

```
uv-suite-plugin/
├── .claude-plugin.json        # Plugin manifest
├── agents/                    # Agent definitions
├── skills/                    # Skill definitions
├── hooks/                     # Hook scripts
└── README.md                  # Installation instructions
```

Engineers install with:
```
claude plugin install uv-suite
```

---

## Cost Optimization

### Token cost by model

| Model | Relative cost | Use for |
|-------|---------------|---------|
| Haiku | 1x (cheapest) | Fast exploration, file search, navigation |
| Sonnet | ~5x Haiku | Code generation, tests, infrastructure |
| Opus | ~15x Haiku | Review, architecture, security, deep analysis |

### Strategies to reduce cost

1. **Use the Explore subagent (Haiku) for investigation.** Don't use Opus to search for files.

2. **Use Sonnet for generation, Opus for judgment.** Writing code is cheaper than reviewing it (and should be).

3. **Keep CLAUDE.md concise.** Every token in CLAUDE.md is sent with every message. 2000 tokens at 1000 messages = 2M extra tokens.

4. **Use skills with `context: fork`.** Forked subagents get a fresh context window, so they don't carry the full conversation history.

5. **Be specific in prompts.** "Review src/auth/login.ts for SQL injection" costs less than "Review everything for security issues" because it focuses the agent.

6. **Use hooks for deterministic checks.** A shell script running ESLint is free. An AI agent running ESLint-equivalent checks costs tokens.

7. **Batch reviews.** Review all changes in an Act at once rather than reviewing each file individually.

---

## Development Workflow (Putting It All Together)

### Daily workflow with UV Suite

```
Morning:
1. /map-codebase [area I'm working on today]  — Quick refresher via Cartographer
2. Review Acts plan for current project
3. Pick next task from current Act

Building:
4. Write code (general purpose Claude + your expertise)
5. /review  — Self-review before moving on
6. Fix any issues found
7. /write-tests [file]  — Generate tests for new code
8. Run tests, fix failures

End of Act:
9. /slop-check  — Full anti-slop review
10. /security-review  — If touching auth, payments, data
11. Mark Act complete, review exit criteria
12. Move to next Act

End of project:
13. /map-codebase [full project]  — Final architecture verification
14. Full /security-review
15. Full /slop-check
16. Update documentation
```

### Starting a new project with UV Suite

```
1. /spec "description of what we're building"  — Spec Writer
2. Review and refine the spec
3. /architect "link to spec"  — Architect Agent
4. Review Acts breakdown
5. Set up project scaffolding (Act 1 usually)
6. Begin Act 1 tasks
7. [Build → Review → Test → Ship] per Act
8. Polish Act (final)
```
