---
name: uvs-implement
description: >
  Implement one Act (or one task of it) from the Acts plan: test first, within the
  task's cycle budget, touching only what the task names. Use after /uvs-plan, for
  each Act in order; the build flow runs it as its implement step.
argument-hint: "[act-number or task-id, e.g. 2 or 2.3]"
user-invocable: true
allowed-tools:
  - Read(*)
  - Grep(*)
  - Glob(*)
  - Write(*)
  - Edit(*)
  - Bash(git status *)
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(npm test *)
  - Bash(npm run *)
  - Bash(npx *)
  - Bash(pytest *)
  - Bash(go test *)
  - Bash(cargo test *)
---

## Target

$ARGUMENTS

An Act number implements every task of that Act in dependency order; a task id (`2.3`) implements that task alone. With no argument, take the first Act whose exit criteria are not yet met.

## Context to load

- The Acts plan: the newest `uv-out/**/architecture/acts-plan.md`. If there is none, stop and say that `/uvs-plan` has to run first; do not invent a plan.
- The spec it was planned from: the newest `uv-out/**/specs/*.md`.
- `CLAUDE.md` or `AGENTS.md` at the project root, if present.
- `DANGER-ZONES.md` at the project root, if present; knowledge/danger-zones.md explains the format.
- knowledge/acts-build-planning.md, section "When to stop and ask", for the cycle budgets.

## Procedure

1. **Restate the task.** Quote the task row (description, depends on, size, cycle budget) and the Act's verification checks it contributes to. If a dependency is not done, stop and say which.
2. **Write the check first.** For each verification check the task serves, write the failing test (unit or integration, matching the project's conventions) before the code. A task with no testable check gets one added to the plan, not skipped.
3. **Implement the smallest change that passes.** Surgical: touch only the files the task needs; match existing style; no refactors of adjacent code.
4. **Run the tests and the lint.** The whole suite, not just the new test. Fix what your change broke.
5. **Danger zones.** If a touched file is listed in `DANGER-ZONES.md` or carries an `@danger` or `@agent-ask` marker, stop and show the Rule before continuing.
6. **Count the cycle.** One write-run-adjust-rerun is one cycle. When the task's budget is spent, or earlier when you can see you are stuck, stop and escalate in the Stuck format from knowledge/agent-working-rules.md. Never "one more try".
7. **Report.** For each task: what changed (files), which checks now pass, what remains for the Act's exit criteria. Do not commit; `/uvs-ship` does that after review.

## Output

Write the report to `<session-output-dir>/implement/act-<n>.md`, where `<session-output-dir>` is `uv-out/sessions/<id>/` with `<id>` from the `UVS_SESSION_ID` environment variable, or `uv-out/current/` when it is unset.
