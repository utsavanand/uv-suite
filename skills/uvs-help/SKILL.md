---
name: uvs-help
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
| `/uvs-understand [target]` | Map a codebase or stack (auto-detects scope) | `/uvs-understand focus on the auth flow and session management` |

### Plan

| Skill | What it does | Example |
|-------|-------------|---------|
| `/uvs-spec [requirements]` | Write a technical specification | `/uvs-spec webhook retry with exponential backoff, max 3 retries` |
| `/uvs-architect [spec]` | Design architecture, decompose into Acts | `/uvs-architect design for horizontal scaling, expect 10x traffic` |

### Build

| Skill | What it does | Example |
|-------|-------------|---------|
| `/uvs-test [target]` | Generate tests matching project conventions | `/uvs-test src/auth/login.ts focus on error paths` |
| `/uvs-test --unit [target]` | Write unit tests | `/uvs-test --unit src/auth/login.ts focus on error paths` |
| `/uvs-test --integration [target]` | Write integration tests | `/uvs-test --integration the checkout flow end to end` |
| `/uvs-test --eval [prompt]` | Write AI/LLM evaluation cases | `/uvs-test --eval test the search ranking prompt for adversarial inputs` |
| `/uvs-prototype [concept]` | Build a static React prototype | `/uvs-prototype event booking app with calendar and payment flow` |

### Review

| Skill | What it does | Example |
|-------|-------------|---------|
| `/uvs-review [focus]` | Code review: correctness, security, perf, slop | `/uvs-review pay attention to the new database migration` |
| `/uvs-review --slop [target]` | Detect 6 categories of AI-generated slop | `/uvs-review --slop src/components/ check for over-engineering` |
| `/uvs-review --security [target]` | OWASP audit, dependency scan, secret detection | `/uvs-review --security src/payments/ focus on webhook signature validation` |

### Ship

| Skill | What it does | Example |
|-------|-------------|---------|
| `/uvs-commit [message]` | Test, lint, review, commit (optionally open PR) | `/uvs-commit "Add webhook retry logic" pr` |
| `/uvs-investigate [bug]` | Root-cause debugging (3 attempts then escalate) | `/uvs-investigate search returns stale results after reindex` |

### Session

| Skill | What it does | Example |
|-------|-------------|---------|
| `/uvs-session init` | Start a new session and set up artifacts | `/uvs-session init` |
| `/uvs-session checkpoint [label]` | Save session state for next time | `/uvs-session checkpoint auth-refactor` |
| `/uvs-session restore` | Load latest checkpoint at session start | `/uvs-session restore` |
| `/uvs-session end` | Wrap up and persist final session state | `/uvs-session end` |
| `/uvs-session auto` | Auto-checkpoint on a cadence during work | `/uvs-session auto` |

### QA

| Skill | What it does | Example |
|-------|-------------|---------|
| `/uvs-qa [target]` | Manual/exploratory QA of a change or flow | `/uvs-qa walk through the new checkout flow` |

### Util

| Skill | What it does | Example |
|-------|-------------|---------|
| `/uvs-help [topic]` | Show all UV Suite skills, agents, and hooks | `/uvs-help review` |

## Agents (spawned by skills)

| Agent | Model | Used by |
|-------|-------|---------|
| Cartographer | Opus | /uvs-understand |
| Spec Writer | Opus | /uvs-spec |
| Architect | Opus | /uvs-architect |
| Reviewer | Opus | /uvs-review, /uvs-investigate |
| Test Writer | Sonnet | /uvs-test |
| Eval Writer | Opus | /uvs-test --eval |
| Anti-Slop Guard | Opus | /uvs-review --slop |
| Prototype Builder | Sonnet | /uvs-prototype |

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

- **Direct the agent:** Every skill accepts arguments. "/uvs-review" does a generic review. "/uvs-review focus on the error handling in the retry logic" gives targeted results.
- **Run in parallel:** "Run /uvs-review, /uvs-review --slop, and /uvs-review --security in parallel" — Claude spawns all three simultaneously. `--slop` and `--security` are modes of `/uvs-review`, not separate skills. Ambient slop detection also runs automatically as a PostToolUse hook on every write.
- **Checkpoint before stopping:** "/uvs-session checkpoint" saves your session state. "/uvs-session restore" loads it next time.
- **Use the right persona:** `uvs spike` for research, `uvs pro` for production code, `uvs auto` to let it run.
