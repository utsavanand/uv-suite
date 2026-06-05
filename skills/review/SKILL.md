---
name: review
description: >
  Multi-specialist code review. Dispatches concern-specific subagents in parallel
  (security, performance, testing, maintainability, api-contract, data-migration),
  scores each finding 1-10 for confidence, gates output by tier, and persists state
  to uv-out/review-state.md so /commit and /ship can detect completion.
argument-hint: "[file-or-branch]"
user-invocable: true
context: fork
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Grep(*)
  - Glob(*)
  - Write(uv-out/**)
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(git show *)
  - Bash(git rev-parse *)
  - Bash(git merge-base *)
  - Agent(*)
---

## Changes to review

!`git diff --cached --stat 2>/dev/null || git diff --stat 2>/dev/null || echo "No staged or unstaged changes found"`

### Full diff

!`git diff --cached 2>/dev/null || git diff 2>/dev/null || echo "No diff available"`

## Additional target

$ARGUMENTS

## Project context

!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

## Danger zones

!`cat DANGER-ZONES.md 2>/dev/null || echo "No DANGER-ZONES.md found"`

## Prior analysis (from other UV Suite agents)

### Architecture map

!`cat uv-out/map-codebase.md 2>/dev/null | head -100 || echo "No codebase map — run /map-codebase first for better review context"`

### Architecture decisions

!`cat uv-out/architecture/decisions.md 2>/dev/null | head -60 || echo "No architecture decisions found"`

### Acts plan

!`cat uv-out/architecture/acts-plan.md 2>/dev/null | head -60 || echo "No acts plan found"`

### Session checkpoint (what's in progress)

!`cat uv-out/checkpoints/latest.md 2>/dev/null | head -40 || echo "No checkpoint"`

## Orchestration procedure

Execute these steps in order. Do not skip steps.

### Step 1 — Validate diff exists

If the diff loaded above is empty or "No diff available", stop and tell the user there's nothing to review. Suggest `$ARGUMENTS` should be a branch name (e.g., `/review feature/foo`) if they want to review a different target.

### Step 2 — Classify scope, pick specialists

Read the diff and `git diff --stat` output. Decide which specialists to dispatch based on what the diff touches. Default specialist set (always run unless explicitly skipped):

| Specialist | Run when diff touches |
|---|---|
| security | Anything in auth, sessions, tokens, user input handling, file I/O paths, SQL, shell commands, network calls, secrets |
| performance | Loops over collections, DB queries, blocking I/O on request paths, caching layers, batch jobs |
| testing | Files under `test/`, `tests/`, `spec/`, `__tests__/`, or any source file with no corresponding test |
| maintainability | Always — covers comment slop, over-engineering, error-handling slop |
| api-contract | Public interfaces, exported types, REST/GraphQL endpoints, library entry points, breaking signature changes |
| data-migration | SQL DDL, migration files, schema changes, backfill scripts, `ALTER TABLE`, index changes |

Skip a specialist if the diff has zero relevance to its scope. Document which you skipped and why in the final report.

### Step 3 — Dispatch specialists in parallel

For each selected specialist, you (the orchestrator) read the corresponding specialist prompt at `.claude/skills/review/specialists/<name>.md`, then launch a subagent in a single message (parallel tool-call block) passing the specialist's prompt content + the diff loaded above as the subagent's task.

Use `Agent(general-purpose)` for each dispatch. Pass the diff, the specialist prompt content, and the relevant project context. Expected return shape per specialist:

```yaml
specialist: <name>
findings:
  - file: <path>
    line: <number or range>
    severity: critical|high|medium|low
    confidence: <1-10>
    title: <one-line summary>
    detail: <what's wrong, why it matters>
    fix_class: auto_fix|ask|info
    suggested_fix: <code or instruction, optional>
status: complete
```

### Step 4 — Aggregate, score, tier

Collect all specialist findings. Sort by confidence then severity. Apply tier gating to the user-facing output:

| Confidence | Tier | Treatment |
|---|---|---|
| 9-10 | Critical | Surface at top, no caveats |
| 7-8 | High | Surface normally |
| 5-6 | Medium | Surface with `(medium confidence)` caveat |
| 3-4 | Low | Move to "Appendix: low-confidence findings" section |
| 1-2 | Noise | Suppress from output, log to state file only |

Confidence scoring rubric (specialists apply this; orchestrator validates):
- 10: Direct evidence — bug visible in the diff, exploit demonstrable
- 8-9: Pattern-match with high prior — matches a known anti-pattern with no obvious mitigating context
- 6-7: Likely issue but depends on context not visible in the diff (call out the assumption)
- 4-5: Possible issue, would need code outside the diff to confirm
- 1-3: Speculation, style preference, or "could be cleaner"

### Step 5 — Classify Fix-First

For each surfaced finding (tier Critical/High/Medium), assign `fix_class`:

- `auto_fix`: trivial, mechanical fix where wrong-ness is unambiguous. Apply directly if the user runs `/commit` or asks. Examples: missing `await`, comment slop, dead variable.
- `ask`: judgment call or risky change. Surface to user, wait for direction. Examples: refactor proposal, security finding requiring threat assessment, API contract break.
- `info`: not actionable, just worth knowing. Example: "test coverage dropped from 87% to 82% on touched files."

### Step 6 — Write state

Write `uv-out/review-state.md` with this exact frontmatter schema so `/commit` and `/ship` can parse it:

```yaml
---
schema: uv-suite/review-state/v1
session_id: <UVS_SESSION_ID env var, or "unknown">
ran_at: <ISO 8601 timestamp>
target: <branch | HEAD | $ARGUMENTS>
diff_stats:
  files_changed: <n>
  additions: <n>
  deletions: <n>
specialists_run: [security, performance, testing, maintainability, api-contract, data-migration]
specialists_skipped: []   # with reason in body
summary:
  critical: <count of confidence 9-10>
  high: <count of confidence 7-8>
  medium: <count of confidence 5-6>
  low: <count of confidence 3-4>
  suppressed: <count of confidence 1-2>
  auto_fix: <count>
  ask: <count>
  info: <count>
status: complete   # or: partial, failed
---
```

Below the frontmatter, write the human-readable findings report (markdown) with one section per tier, then an appendix for low-confidence findings, then a "Specialists skipped" section explaining why each was skipped.

### Step 7 — Report to user

Output to the user in this order:
1. One-line summary: counts by tier + total fix_class counts
2. Critical findings (each with file:line, title, detail, suggested fix if auto_fix)
3. High-confidence findings
4. Medium-confidence findings (with caveat)
5. Pointer to `uv-out/review-state.md` for the full report including low-confidence findings

Do not paste the appendix into the chat unless asked. Keep terminal output focused on what needs attention.

## Notes for downstream skills

`/commit` reads `uv-out/review-state.md` and:
- Refuses to commit if `summary.critical > 0` unless user explicitly overrides
- Auto-applies `fix_class: auto_fix` findings before commit when `summary.ask == 0`
- Includes review summary in commit message footer

`/ship` reads `uv-out/review-state.md` and:
- Blocks PR creation if `status != complete` or `summary.critical > 0`
- Adds review summary to PR body

## Dogfood note (2026-06-05)

This skill was rewritten with gstack-derived structural patterns (parallel specialist dispatch, confidence-scored output gating, persisted state coupling). No formal eval gate was used; correctness is validated by running against real PRs in this workspace and tuning specialist prompts as gaps surface. If you spot a finding category that's getting missed or a noise pattern that's leaking through tier gating, edit the relevant specialist file or this orchestrator directly.
