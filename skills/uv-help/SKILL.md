---
name: uv-help
description: >
  Show all UV Suite skills, agents, hooks, guardrails, and personas.
  Use when you want to know what's available or how to use a specific feature.
argument-hint: "[skill-name or topic]"
user-invocable: true
allowed-tools:
  - Read(*)
  - Glob(*)
---

## UV Suite Help

$ARGUMENTS

If the user asked about a specific skill or topic, focus on that. Otherwise, show the full overview below.

## Active persona

!`grep "Active persona" CLAUDE.md 2>/dev/null || echo "Unknown — check .claude/settings.json"`

## All available skills

Every skill accepts free-form arguments to direct the agent. Examples shown below.

### Understand

| Skill | What it does | Example |
|-------|-------------|---------|
| `/understand [target]` | Map a codebase or stack (auto-detects scope) | `/understand focus on the auth flow and session management` |

### Plan

| Skill | What it does | Example |
|-------|-------------|---------|
| `/spec [requirements]` | Write a technical specification | `/spec webhook retry with exponential backoff, max 3 retries` |
| `/architect [spec]` | Design architecture, decompose into Acts | `/architect design for horizontal scaling, expect 10x traffic` |

### Build

| Skill | What it does | Example |
|-------|-------------|---------|
| `/test [target]` | Generate tests matching project conventions | `/test src/auth/login.ts focus on error paths` |
| `/test --unit [target]` | Write unit tests | `/test --unit src/auth/login.ts focus on error paths` |
| `/test --integration [target]` | Write integration tests | `/test --integration the checkout flow end to end` |
| `/test --eval [prompt]` | Write AI/LLM evaluation cases | `/test --eval test the search ranking prompt for adversarial inputs` |
| `/prototype [concept]` | Build a static React prototype | `/prototype event booking app with calendar and payment flow` |

### Review

| Skill | What it does | Example |
|-------|-------------|---------|
| `/review [focus]` | Code review: correctness, security, perf, slop | `/review pay attention to the new database migration` |
| `/review --slop [target]` | Detect 6 categories of AI-generated slop | `/review --slop src/components/ check for over-engineering` |
| `/review --security [target]` | OWASP audit, dependency scan, secret detection | `/review --security src/payments/ focus on webhook signature validation` |

### Ship

| Skill | What it does | Example |
|-------|-------------|---------|
| `/commit [message]` | Test, lint, review, commit (optionally open PR) | `/commit "Add webhook retry logic" pr` |
| `/investigate [bug]` | Root-cause debugging (3 attempts then escalate) | `/investigate search returns stale results after reindex` |

### Session

| Skill | What it does | Example |
|-------|-------------|---------|
| `/session init` | Start a new session and set up artifacts | `/session init` |
| `/session checkpoint [label]` | Save session state for next time | `/session checkpoint auth-refactor` |
| `/session restore` | Load latest checkpoint at session start | `/session restore` |
| `/session end` | Wrap up and persist final session state | `/session end` |
| `/session auto` | Auto-checkpoint on a cadence during work | `/session auto` |

### QA

| Skill | What it does | Example |
|-------|-------------|---------|
| `/qa [target]` | Manual/exploratory QA of a change or flow | `/qa walk through the new checkout flow` |

### Util

| Skill | What it does | Example |
|-------|-------------|---------|
| `/confirm [question]` | Ask for explicit confirmation before acting | `/confirm before deleting the staging database` |
| `/uv-help [topic]` | Show all UV Suite skills, agents, and hooks | `/uv-help review` |

## Agents (spawned by skills)

| Agent | Model | Used by |
|-------|-------|---------|
| Cartographer | Opus | /understand |
| Spec Writer | Opus | /spec |
| Architect | Opus | /architect |
| Reviewer | Opus | /review, /investigate |
| Test Writer | Sonnet | /test |
| Eval Writer | Opus | /test --eval |
| Anti-Slop Guard | Opus | /review --slop |
| Prototype Builder | Sonnet | /prototype |

## Hooks (automatic, you don't invoke these)

!`ls .claude/hooks/ 2>/dev/null | grep '\.sh$' | sed 's/^/- /' || echo "No hooks installed"`

## Guardrails (anti-slop rules, active as context)

!`ls .claude/rules/ 2>/dev/null | sed -n 's/\.md$//p' | sed 's/^/- /' || echo "No guardrails installed"`

## Personas

| Persona | Launch | For |
|---------|--------|-----|
| Spike | `uvs spike` | Research, docs, architecture analysis |
| Sport | `uvs sport` | New projects, fast prototyping |
| Professional | `uvs pro` | Production code, full review rigor |
| Auto | `uvs auto` | Autonomous execution, clear specs |

## Artifacts

All agent output goes to `uv-out/sessions/<session-id>/`, so every artifact is attributable
to the session that produced it; `uv-out/current` points at the active session. Skills read
each other's prior output automatically (current session first, then prior sessions).

### This session's artifacts

!`ls -R uv-out/current 2>/dev/null | head -20 || echo "No artifacts yet — run a skill to generate some"`

### All sessions

!`ls -1 uv-out/sessions 2>/dev/null | head -15 || echo "No sessions yet"`

## Tips

- **Direct the agent:** Every skill accepts arguments. "/review" does a generic review. "/review focus on the error handling in the retry logic" gives targeted results.
- **Run in parallel:** "Run /review, /review --slop, and /review --security in parallel" — Claude spawns all three simultaneously. `--slop` and `--security` are modes of `/review`, not separate skills. Ambient slop detection also runs automatically as a PostToolUse hook on every write.
- **Checkpoint before stopping:** "/session checkpoint" saves your session state. "/session restore" loads it next time.
- **Use the right persona:** `uvs spike` for research, `uvs pro` for production code, `uvs auto` to let it run.
