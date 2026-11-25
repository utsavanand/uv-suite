---
name: uvs-test
description: >
  Write tests or LLM evals. Routes to a specialist: the test-writer agent for
  code tests (unit/integration), the eval-writer agent for AI/LLM evals (--eval).
  Use after implementing a feature, when coverage is low, or when building/
  changing an LLM-powered feature.
argument-hint: "[target] [--unit|--integration|--eval]"
user-invocable: true
context: fork
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Grep(*)
  - Glob(*)
  - Agent(*)
---

## Target

$ARGUMENTS

## Mode

The orchestrator picks one specialist per run. Default is `--unit`.

Mode: `--eval` in the arguments → eval (eval-writer agent); `--integration` → integration (test-writer agent); otherwise unit (test-writer agent). Pick one per run.

## Context for code tests (unit / integration)

### Existing test patterns (match these)

Find existing tests (`*.test.*`, `*.spec.*`, `test_*`, outside `node_modules`) and read one to match its conventions.

### Project test command

Read the project's test command from `package.json` scripts, `pyproject.toml`, a `Makefile` or the CI config.

## Context for evals (--eval)

### Existing eval framework

Find existing eval files or folders (`*eval*`), if any, and match their shape.

### Session output directory

Write eval artifacts under this directory (scoped to the current session):

This session's output folder is `uv-out/sessions/<id>/`, where `<id>` is the `UVS_SESSION_ID` environment variable, or `uv-out/current/` when it is unset. Create it if it does not exist. Below, `<session-output-dir>` means this folder.

## Shared prior analysis

### Spec (what to test / evaluate against)

Read the newest `uv-out/**/specs/*.md` if there is one; its first 60 lines are enough to orient. If none: No spec found — work from code/prompt behavior.

### Acts plan (current task context)

Read the newest `uv-out/**/architecture/acts-plan.md` if there is one; its first 40 lines are enough to orient. If none: No acts plan found.

### Session checkpoint

If the harness shows a checkpoint or session summary, use it for what is in progress; otherwise continue.

## Dispatch

Read the `MODE` line above. It names the specialist prompt file and the agent to use:

| MODE | Specialist prompt | Agent |
|---|---|---|
| unit | `specialists/unit.md` beside this SKILL.md | `test-writer` |
| integration | `specialists/integration.md` beside this SKILL.md | `test-writer` |
| eval | `specialists/eval.md` beside this SKILL.md | `eval-writer` |

You (the orchestrator) read the matching specialist prompt at
`specialists/<mode>.md` beside this SKILL.md, then dispatch the named agent via the Agent
tool, passing the specialist prompt content + the target (`$ARGUMENTS`) + the gathered
context above as the agent's task. Do not write the tests or evals yourself — the agent does.

Relay the agent's result. If `$ARGUMENTS` names no target, ask what to test.
