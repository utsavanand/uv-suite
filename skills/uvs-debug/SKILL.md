---
name: uvs-debug
description: >
  Systematic root-cause debugging. Traces data flow, tests hypotheses,
  narrows scope. Stops after 3 failed attempts and escalates.
  Use when something is broken and you don't know why.
argument-hint: "[bug-description or error-message]"
user-invocable: true
context: fork
model: claude-opus-4-6
effort: max
allowed-tools:
  - Read(*)
  - Write(uv-out/**)
  - Grep(*)
  - Glob(*)
  - Bash(git log *)
  - Bash(git diff *)
  - Bash(git blame *)
  - Bash(git show *)
  - Bash(npm test *)
  - Bash(npm run *)
  - Bash(npx *)
  - Bash(pytest *)
  - Bash(go test *)
  - Bash(cargo test *)
  - Bash(curl *)
  - Bash(node *)
  - Bash(python *)
---

## The bug

$ARGUMENTS

## Project context

Read `CLAUDE.md` or `AGENTS.md` at the project root, if present.

## Session output directory

Write investigation findings under this directory (scoped to the current session):

This session's output folder is `uv-out/sessions/<id>/`, where `<id>` is the `UVS_SESSION_ID` environment variable, or `uv-out/current/` when it is unset. Create it if it does not exist. Below, `<session-output-dir>` means this folder.

## Codebase map

Read the newest `uv-out/**/map-codebase.md` if there is one; its first 60 lines are enough to orient. If none: No codebase map.

## Recent changes (potential cause)

Run `git log --oneline -15`: recent changes are the first suspects.

## Latest checkpoint

If the harness shows a checkpoint or session summary, use it for what is in progress; otherwise continue.

## Investigation methodology

Follow this process strictly:

### Phase 1: Reproduce

Before investigating, reproduce the bug. Run the failing test, hit the failing endpoint, trigger the error. If you can't reproduce it, say so and ask for reproduction steps.

### Phase 2: Narrow scope

Form a hypothesis about WHERE the bug is:
1. Read the error message/stack trace carefully
2. Identify the failing component (which file, which function, which layer)
3. Check recent changes to that component (`git log --oneline [file]`)
4. Check if the component was modified in the last 5 commits (`git diff HEAD~5 [file]`)

State your hypothesis explicitly: "I think the bug is in [X] because [Y]."

### Phase 3: Test the hypothesis

Verify your hypothesis with the smallest possible test:
- Add a log/print statement
- Write a focused test case
- Run a specific command that isolates the behavior

If the hypothesis is wrong, form a new one. Track what you've ruled out.

### Phase 4: Fix or escalate

If you found the root cause within 3 attempts: fix it, run the tests, verify.

If you haven't found it after 3 attempts:

```
## Stuck: [bug description]

Ruled out:
1. [Hypothesis 1] — wrong because [evidence]
2. [Hypothesis 2] — wrong because [evidence]  
3. [Hypothesis 3] — wrong because [evidence]

Remaining possibilities:
- [What I haven't checked yet]

What I need:
- [Specific question or access needed from the human]
```

## Rules

- NO FIXES WITHOUT INVESTIGATION. Don't guess and patch. Find the root cause first.
- State hypotheses explicitly before testing them.
- Track what you've ruled out so you don't revisit.
- 3 attempts max. Then escalate with structured findings.
- If the bug is in code you don't understand, run /uvs-map-codebase on that area first.

## Artifact output

Write investigation findings to `<session-output-dir>/investigate/report.md` (the
`<session-output-dir>` named above, e.g. `uv-out/sessions/<sid>/`), stamped with
provenance frontmatter (`session`, `skill: investigate`, `created`). Include: bug
description, hypotheses tested, root cause found (or not), fix applied (or escalation).
