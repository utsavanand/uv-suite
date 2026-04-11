# UV Suite — Usage Guide

The complete operational reference. Every phase of software development mapped to exact commands, agents, permissions, and automation.

---

## What You Get After Installation

```
./install.sh
```

| Category | Count | What |
|----------|-------|------|
| **Agents** | 10 | Subagent definitions in `.claude/agents/` |
| **Skills** | 9 | Slash commands in `.claude/skills/` |
| **Hooks** | 5 | 4 shell scripts + 1 prompt hook in `.claude/hooks/` and `settings.json` |
| **Guardrails** | 6 | Anti-slop rules in `.claude/rules/` |
| **Settings** | 1 | Permissions + hook wiring in `.claude/settings.json` |

---

## Complete Inventory

### Skills (Slash Commands)

These are what you type. Each skill spawns the right agent with the right context.

| Command | Agent | Model | Does what |
|---------|-------|-------|-----------|
| `/map-codebase [dir]` | Cartographer | Opus | Produces architecture map, dependency graph, entry points |
| `/spec [requirements]` | Spec Writer | Opus | Converts requirements into structured technical spec |
| `/architect [spec]` | Architect | Opus | Designs system, decomposes into Acts with cycle budgets |
| `/review [file]` | Reviewer | Opus | Code review: correctness, security, performance, slop |
| `/write-tests [file]` | Test Writer | Sonnet | Generates tests matching project conventions |
| `/write-evals [prompt]` | Eval Writer | Opus | Writes evaluation cases for AI/LLM features |
| `/slop-check [file]` | Anti-Slop Guard | Opus | Detects 6 categories of AI-generated slop |
| `/prototype [concept]` | Prototype Builder | Sonnet | Builds static React prototype |
| `/security-review [file]` | Security Agent | Opus | OWASP audit, dependency scan, secret detection |

**You always invoke via the skill.** You don't need to remember agent names or how to delegate.

### Agents (What the Skills Spawn)

Each agent is a Claude subagent with isolated context, specific permissions, and a defined role.

| Agent | Subsystem | Read-only? | Cycle Budget | Autonomy |
|-------|-----------|------------|-------------|----------|
| Cartographer | UV Index | Yes | 1 | Low — presents findings, human explores |
| Spec Writer | UV Acts | No (writes specs) | 1 | Low — presents spec, human approves |
| Architect | UV Acts | No (writes architecture) | 1 | Low — presents design, human approves |
| Reviewer | UV Guard | Yes | 1 | Low — presents findings, human decides |
| Test Writer | UV Acts | No (writes tests) | 3 | **High** — writes and runs tests, iterates |
| Eval Writer | UV Acts | No (writes evals) | 2 | Medium — writes evals, human reviews coverage |
| Anti-Slop Guard | UV Guard | Yes | 1 | Low — presents findings |
| Prototype Builder | UV Acts | No (full access) | 3 | **High** — scaffolds and builds end-to-end |
| DevOps | UV Acts | No (writes infra) | 2 | Medium — writes configs, human reviews |
| Security Agent | UV Guard | Yes | 1 | Low — presents findings |

**Read-only agents** (Cartographer, Reviewer, Anti-Slop Guard, Security) cannot modify your code. They can only read and report. This is enforced by `disallowedTools: [Write, Edit]` in their agent definitions.

**High-autonomy agents** (Test Writer, Prototype Builder) can write files, run commands, and iterate up to their cycle budget without asking. They're designed to "just do it."

**Low-autonomy agents** have a cycle budget of 1 — they present findings/proposals once, then the human decides.

### Hooks (Automatic — You Don't Invoke These)

| Hook | Event | Trigger | What it does |
|------|-------|---------|-------------|
| `block-destructive.sh` | PreToolUse (Bash) | Any bash command | Blocks `rm -rf /`, `DROP TABLE`, `force push main` |
| `danger-zone-check.sh` | PreToolUse (Edit\|Write) | Any file modification | Warns Claude if file is in DANGER-ZONES.md |
| `auto-lint.sh` | PostToolUse (Edit\|Write) | After any file write | Runs prettier/ruff/gofmt on the file |
| **Real-time slop check** | PostToolUse (Edit\|Write) | After any file write | Haiku scans for obvious slop (restating comments, unnecessary try/catch, single-impl interfaces, toBeTruthy). Flags immediately if found. |
| `session-review-reminder.sh` | Stop | Session ending | Checks for uncommitted changes, reminds to run `/review` and `/slop-check` |

Hooks fire automatically. You never invoke them. They're the invisible guardrails.

**How the real-time slop check works:** After every file write, a fast Haiku model scans just the written code for the 4 most egregious slop patterns. If it finds one, it tells Claude to fix it immediately — before moving on. This catches slop at the source instead of after the fact. It's cheap (Haiku) and fast (15s timeout).

**How the session review reminder works:** When you end a Claude Code session, the hook checks `git status`. If there are uncommitted changes, it reminds you to run `/review` and `/slop-check` before committing. No changes = no reminder.

### Guardrails (Context Rules)

Installed in `.claude/rules/`, these are loaded into Claude's context and inform how it writes code:

| Rule | What it prevents |
|------|------------------|
| `comment-slop.md` | Comments that restate code (`// Initialize the database`) |
| `overengineering-slop.md` | Single-implementation interfaces, unnecessary factories |
| `error-handling-slop.md` | Try/catch around code that can't throw |
| `test-slop.md` | `toBeTruthy()`, mock-only tests, snapshot noise |
| `doc-slop.md` | "Robust, scalable, comprehensive" vague adjectives |
| `architecture-slop.md` | Microservices for a CRUD app, buzzword-driven design |

These aren't agents or skills — they're rules that Claude reads and follows while writing code, even when no agent is active.

---

## The Full SDLC — Phase by Phase

### Phase 1: Understand a New Codebase

```
/map-codebase
```

**What happens:**
1. Skill spawns the Cartographer agent (Opus, read-only)
2. Cartographer reads configs, traces dependencies, generates Mermaid diagrams
3. Returns: architecture overview, dependency graph, business domain map, entry points
4. You read the output and decide where to dig deeper

**Human role:** Read the map. Ask follow-up questions. Teach the agent anything it missed (conventions, tribal knowledge).

**Follow-up:** If the Cartographer missed something, tell Claude directly. If it's a reusable convention, add it to CLAUDE.md so it persists.

---

### Phase 2: Write a Spec

```
/spec "user authentication with OAuth2 and email/password"
```

**What happens:**
1. Skill spawns the Spec Writer agent (Opus)
2. Spec Writer reads CLAUDE.md for project context
3. Produces a structured spec (problem, requirements, API contract, risks, success criteria)
4. Writes spec to `docs/specs/` or prints it

**Human role:** Review the spec. Fill in open questions. Approve or refine. This is a **mandatory human checkpoint** — no coding starts until the spec is approved.

---

### Phase 3: Design Architecture + Acts

```
/architect docs/specs/auth-spec.md
```

**What happens:**
1. Skill spawns the Architect agent (Opus)
2. Reads the spec + existing architecture
3. Produces: architecture decisions (with rationale), system design, Acts breakdown with tasks, dependency graph
4. Each task has a cycle budget and assigned agent

**Human role:** Review the architecture. Challenge decisions. Approve the Acts breakdown. This is a **mandatory human checkpoint**.

---

### Phase 4: Build (Act by Act)

This is where you code. No special skill needed — you work with Claude directly, guided by the Acts plan.

```
You: "Let's start Act 1. Task 1.1: Create the user database schema."
```

**What happens automatically (hooks):**
- Every file you write gets auto-linted (prettier/ruff/gofmt)
- Every file modification checks DANGER-ZONES.md and warns you
- Destructive bash commands are blocked

**What happens via guardrails (rules):**
- Claude follows the 6 anti-slop rules while writing code
- No unnecessary comments, no over-engineering, no weak tests

**When to invoke skills during building:**

| Situation | Command |
|-----------|---------|
| Wrote a feature, need tests | `/write-tests src/auth/login.ts` |
| Want to self-review before moving on | `/review` |
| Suspect AI slop in what was just generated | `/slop-check src/auth/` |
| Building an AI feature, need evals | `/write-evals src/prompts/system.md` |
| Need a demo for stakeholders | `/prototype "OAuth login flow demo"` |
| Setting up CI/CD | Use the devops agent directly: "Use the devops agent to set up GitHub Actions" |

---

### Phase 5: Review (End of Each Act)

```
/review
```

**What happens:**
1. Skill spawns the Reviewer agent (Opus, read-only)
2. Reviewer reads the git diff (staged or unstaged)
3. Checks: correctness, security, performance, maintainability, AI slop, danger zones
4. Returns findings with severity levels and specific line references

**Run in parallel for maximum coverage:**

```
You: "Run /review, /slop-check, and /security-review on my changes in parallel"
```

Claude spawns 3 subagents simultaneously:
- Reviewer → correctness, performance, maintainability
- Anti-Slop Guard → AI quality issues
- Security Agent → OWASP vulnerabilities

All 3 return findings. You address them, then move to the next Act.

---

### Phase 6: Security Review (Sensitive Code)

```
/security-review src/auth/
```

**What happens:**
1. Skill spawns the Security Agent (Opus, read-only)
2. Runs OWASP Top 10 checklist against the code
3. Runs `npm audit` / `pip audit` for dependency vulnerabilities
4. Greps for hardcoded secrets
5. Checks DANGER-ZONES.md for known security-sensitive areas
6. Returns findings with severity, impact, and remediation

**When to use:** Before merging any code that touches auth, payments, data access, PII, or external inputs.

---

### Phase 7: Ship

No UV Suite skill for this — you merge and deploy using your existing process. But before you do:

**Pre-ship checklist:**
1. `/review` — final code review (all Acts)
2. `/slop-check` — full anti-slop sweep
3. `/security-review` — full security audit
4. `/map-codebase` — verify the architecture matches what was built
5. Update DANGER-ZONES.md with any new risky areas discovered during development

---

## How Agents Escalate (Human-in-the-Loop in Practice)

When an agent hits its cycle budget, it stops and produces a structured escalation:

```markdown
## Stuck: [brief description]

**What I tried:**
1. [Approach 1] — failed because [reason]
2. [Approach 2] — failed because [reason]

**My hypothesis:** [What I think is wrong]
**What I need:** [Specific question or action from the human]
```

**Your response options:**

| What you do | When |
|-------------|------|
| Answer the question | Agent needs domain knowledge (Teach & Train) |
| Fix the environment | Issue is config/permissions, not logic (Debug & Unblock) |
| Make the subjective call | Agent presents options, you choose (Taste & Value) |
| Clarify the requirement | Spec was ambiguous (Resolve Ambiguity) |

After your input, the agent's cycle budget resets and it continues.

---

## Permissions Explained

The `settings.json` pre-approves safe operations so you don't get permission prompts for routine work:

**Always allowed (no prompt):**
- Reading any file
- Glob and Grep searches
- All agent spawning
- Git read commands (status, diff, log)
- Test commands (npm test, pytest, go test)
- Lint/format commands

**Always blocked (hard deny):**
- `rm -rf /`, `rm -rf ~`, `rm -rf .`
- `sudo rm` anything
- Force push to main/master
- Hard reset to origin

**Everything else:** Claude asks for permission (the default behavior).

You can customize by editing `.claude/settings.json`. Add commands to `allow` for auto-approval, or `deny` for hard blocks.

---

## Quick Reference Card

```
UNDERSTAND          /map-codebase [dir]          → Architecture map
SPECIFY             /spec [requirements]         → Technical spec
DESIGN              /architect [spec-file]       → Architecture + Acts
BUILD               (work with Claude directly)  → Code, guided by Acts plan
TEST                /write-tests [file]          → Tests matching project style
REVIEW              /review [file]               → Correctness + security + slop
GUARD               /slop-check [file]           → AI quality check
SECURE              /security-review [file]      → OWASP + dependency audit
EVALUATE            /write-evals [prompt]        → AI feature evaluations
PROTOTYPE           /prototype [concept]         → Static React demo

AUTOMATIC (hooks — you never invoke these):
  Every file write   → auto-lint (prettier/ruff/gofmt)
  Every file write   → real-time slop check (Haiku scans for obvious slop)
  Every file edit    → danger zone check (warns if in DANGER-ZONES.md)
  Every bash command → destructive command block (rm -rf, force push)
  Session ending     → review reminder (if uncommitted changes exist)
  All code writing   → anti-slop rules active (guardrails in .claude/rules/)
```

---

## Customizing UV Suite

### Add a danger zone

Edit `DANGER-ZONES.md` in your project root:

```markdown
## src/payments/webhook.ts
**Risk:** Payload size limit (1MB) enforced by gateway
**Rule:** Any payload change needs a size check test
```

The `danger-zone-check.sh` hook automatically reads this file.

### Add a custom agent

Create `.claude/agents/my-agent.md`:

```yaml
---
name: my-agent
description: >
  What it does and when to use it
model: sonnet
tools: [Read, Grep, Glob, Write, Edit, Bash]
---

You are [role]. Your job is to...
```

Then create `.claude/skills/my-command/SKILL.md`:

```yaml
---
name: my-command
description: One-line description
context: fork
agent: my-agent
---

Instructions for the agent...
```

Now `/my-command` works.

### Add a custom guardrail

Create `.claude/rules/my-rule.md`:

```markdown
# Guardrail: API Response Envelope

All API endpoints MUST return `{ data, error, meta }`.
Do not return raw data without the envelope.
```

Claude reads this automatically and follows it while writing code.

### Modify permissions

Edit `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["Bash(docker *)"],
    "deny": ["Bash(docker rm *)"]
  }
}
```
