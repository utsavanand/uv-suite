---
name: uvs-review
description: >
  Multi-specialist code review. Dispatches concern-specific subagents in parallel
  (security, performance, testing, maintainability, api-contract, data-migration),
  scores each finding 1-10 for confidence, gates output by tier, and persists state
  to uv-out/review-state.md so /uvs-ship and /uvs-ship can detect completion. Pass --security
  for a focused tool-backed (Semgrep/Gitleaks/Trivy) OWASP review, --slop for a full
  anti-slop audit (all six slop categories), or --architecture to audit a design against
  its recorded Design Constraints (traceability). Note: ambient slop detection also runs as
  a PostToolUse hook on every write; --slop is the deep on-demand audit.
argument-hint: "[file-or-branch] [--security|--slop|--architecture]"
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
  - Bash(semgrep *)
  - Bash(gitleaks *)
  - Bash(trivy *)
  - Bash(npm audit *)
  - Bash(pip audit *)
  - Agent(*)
---

## Changes to review

When run as a flow step, the Inputs JSON names what to review: `pr` (a pull request number or URL) or `diff` (a file). For a `pr`, read it with `gh pr view <pr>` for the title and description and `gh pr diff <pr>` for the diff, and review that instead of the working tree.

Run `git diff --cached --stat`, or `git diff --stat` when nothing is staged. If `$ARGUMENTS` names a branch, diff against it instead (`git diff <branch>...HEAD --stat`).

### Full diff

Then read the full diff the same way (`git diff --cached`, else `git diff`, else the branch diff).

## Additional target

$ARGUMENTS

## Session output directory

Write the review report and state under this directory (scoped to the current session):

This session's output folder is `uv-out/sessions/<id>/`, where `<id>` is the `UVS_SESSION_ID` environment variable, or `uv-out/current/` when it is unset. Create it if it does not exist. Below, `<session-output-dir>` means this folder.

Stable flat pointer maintained for `/uvs-ship`:

After writing, copy this run's `<session-output-dir>/review/state.md`` to `uv-out/review-state.md`, so `/uvs-ship` and other skills find the latest run at a fixed path.

## Project context

Read `CLAUDE.md` or `AGENTS.md` at the project root, if present.

## Danger zones

Read `DANGER-ZONES.md` at the project root, if present; knowledge/danger-zones.md explains the format.

## Prior analysis (from other UV Suite agents)

### Architecture map

Read the newest `uv-out/**/map-codebase.md` if there is one; its first 100 lines are enough to orient. If none: No codebase map — run /uvs-map-codebase first for better review context.

### Architecture decisions

Read the newest `uv-out/**/architecture/decisions.md` if there is one; its first 60 lines are enough to orient. If none: No architecture decisions found.

### Acts plan

Read the newest `uv-out/**/architecture/acts-plan.md` if there is one; its first 60 lines are enough to orient. If none: No acts plan found.

### Session checkpoint (what's in progress)

If the harness shows a checkpoint or session summary, use it for what is in progress; otherwise continue.

## Orchestration procedure

Execute these steps in order. Do not skip steps.

### Step 0 — Check for a focused mode

`$ARGUMENTS` may request a single deep specialist instead of the full review. In a
focused mode, a diff is **not** required (the target may be a directory or the whole
project — skip Step 1's stop), run **only** that specialist, and skip all others.

- **`--security`** (the former `/uvs-review --security`): dispatch the `security` specialist in
  **deep-scan mode** — it runs the available SAST / secret / dependency tools (Semgrep,
  Gitleaks, Trivy) over the target in addition to diff reasoning.
- **`--slop`** (the former `/uvs-review --slop`): dispatch the **anti-slop-guard** agent over the
  target — the full anti-slop audit across all six slop categories (over-engineering,
  architecture, test, doc, error-handling, comment slop), not just the diff-level
  `maintainability` subset that a normal review runs.
- **`--architecture`**: audit the design against its recorded constraints (no diff needed).
  Load the session's architecture artifacts and dispatch the `architecture-trace` specialist:

  Read the newest `uv-out/**/architecture/constraints.md` if there is one; its first 120 lines are enough to orient. If none: No constraints.md — run /uvs-plan first (it records design constraints).
  Read the newest `uv-out/**/architecture/decisions.md` if there is one; its first 200 lines are enough to orient. If none: No decisions.md.
  Read the newest `uv-out/**/architecture/acts-plan.md` if there is one; its first 120 lines are enough to orient. If none: No acts-plan.md.

  Pass those three to the specialist. If `constraints.md` is absent, stop and say so — there
  is nothing to trace against.

Otherwise, proceed normally from Step 1.

### Step 1 — Validate diff exists

If the diff you read above is empty or "No diff available", stop and tell the user there's nothing to review. Suggest `$ARGUMENTS` should be a branch name (e.g., `/uvs-review feature/foo`) if they want to review a different target. (Does not apply in a focused `--security`/`--slop`/`--architecture` mode.)

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

For each selected specialist, you (the orchestrator) read the corresponding specialist prompt at `specialists/<name>.md` beside this SKILL.md, then launch a subagent in a single message (parallel tool-call block) passing the specialist's prompt content + the diff you read above as the subagent's task.

Dispatch each as the `reviewer` agent (the kit's review persona: its checklist and severity levels apply on top of the specialist prompt). Pass the diff, the specialist prompt content, and the relevant project context. Each specialist returns the shape in `reference/specialist-return.md` beside this SKILL.md.

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

- `auto_fix`: trivial, mechanical fix where wrong-ness is unambiguous. Apply directly if the user runs `/uvs-ship` or asks. Examples: missing `await`, comment slop, dead variable.
- `ask`: judgment call or risky change. Surface to user, wait for direction. Examples: refactor proposal, security finding requiring threat assessment, API contract break.
- `info`: not actionable, just worth knowing. Example: "test coverage dropped from 87% to 82% on touched files."

### Step 6 — Write state

Write the review state to `<session-output-dir>/review/state.md` (the
`<session-output-dir>` named above, e.g. `uv-out/sessions/<sid>/`). The flat pointer
`uv-out/review-state.md` already points here, so `/uvs-ship` reads it unchanged.
Start the file with the frontmatter in `reference/review-state.md` beside this SKILL.md, exactly.

Below the frontmatter, write the human-readable findings report (markdown) with one section per tier, then an appendix for low-confidence findings, then a "Specialists skipped" section explaining why each was skipped.

### Step 7 — Report to user

Output to the user in this order:
1. One-line summary: counts by tier + total fix_class counts
2. Critical findings (each with file:line, title, detail, suggested fix if auto_fix)
3. High-confidence findings
4. Medium-confidence findings (with caveat)
5. Pointer to `uv-out/review-state.md` for the full report including low-confidence findings

Do not paste the appendix into the chat unless asked. Keep terminal output focused on what needs attention.

## Verdict (when run as a flow step)

When DuckTerm's runner drives this skill, end with exactly one of these choices
and a one-line reason, and write the findings to the file path the runner
names:

- `approve` — nothing blocks a merge
- `revise` — fixable issues, listed in the findings
- `reject` — the change should not land in this form
