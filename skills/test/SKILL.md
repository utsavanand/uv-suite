---
name: test
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

```!
case "$ARGUMENTS" in
  *--eval*)        echo "MODE=eval        → dispatch the eval-writer agent";;
  *--integration*) echo "MODE=integration → dispatch the test-writer agent (cross-component focus)";;
  *)               echo "MODE=unit        → dispatch the test-writer agent (isolated units)";;
esac
```

## Context for code tests (unit / integration)

### Existing test patterns (match these)

!`find . \( -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" \) -not -path "*/node_modules/*" 2>/dev/null | head -5`

!`cat $(find . \( -name "*.test.*" -o -name "*.spec.*" \) -not -path "*/node_modules/*" 2>/dev/null | head -1) 2>/dev/null | head -40 || echo "No existing tests found"`

### Project test command

!`cat package.json 2>/dev/null | grep -A2 '"test"' || echo "No package.json test script"`

## Context for evals (--eval)

### Existing eval framework

!`find . \( -name "*eval*" -o -name "*evals*" \) -not -path "*/node_modules/*" 2>/dev/null | head -10 || echo "No eval files found"`

### Session output directory

Write eval artifacts under this directory (scoped to the current session):

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-session.sh`

## Shared prior analysis

### Spec (what to test / evaluate against)

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-best.sh 'specs/*.md' 60 || echo "No spec found — work from code/prompt behavior"`

### Acts plan (current task context)

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-best.sh 'architecture/acts-plan.md' 40 || echo "No acts plan found"`

### Session checkpoint

!`cat uv-out/current/checkpoints/latest.md 2>/dev/null | head -40 || echo "No checkpoint"`

## Dispatch

Read the `MODE` line above, then dispatch the matching specialist via the Agent tool,
passing the target, the gathered context, and the mode focus. Do not write the tests
or evals yourself — the specialist does.

- **unit / integration** → `Agent(test-writer)`. Task: write tests that verify behavior
  with specific assertions (specific values, side effects, error conditions), matching
  the existing test patterns and project test command shown above. For `--integration`,
  focus on interactions across components and real dependencies rather than isolated units.
- **eval** → `Agent(eval-writer)`. Task: write graded eval cases for the target prompt/
  feature using the existing eval framework — criteria/rubric, representative + adversarial
  cases, and pass/fail conditions. Write artifacts under the session output directory above.

Relay the specialist's result. If `$ARGUMENTS` names no target, ask what to test.
