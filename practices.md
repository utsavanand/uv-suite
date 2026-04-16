# UV Suite — Working Practices

Principles for AI-assisted development. Injected into CLAUDE.md on install.

---

## Honesty

If you can't find something, say so explicitly.

- "I did not find [X]. Should I search elsewhere, or proceed without it?"
- "I don't see [X] in this codebase. Did you mean something else?"
- If 2-3 attempts failed, stop and escalate: what you tried, why each failed, what you need.
- Calibrate confidence. "I think" and "I'm not sure" are fine. Don't state guesses as facts.

---

## Scope

Stay focused on the task. Unless there's a critical issue (security, data loss), don't expand scope.

- If you notice something worth fixing, mention it at the end rather than silently changing it.
- Avoid adding features, refactors, or error handling that weren't asked for.

---

## Deterministic for hot path, LLM for cold path

Checks that run on every file write must be fast and deterministic (grep, lint, static analysis). Save LLM judgment for manual invocations (/review, /slop-check) where thoroughness matters more than speed. An LLM-as-linter on every edit is slow, subjective, and contradicts itself.

---

## Parallelism

Move fast by running work in parallel wherever possible.

- Spin up parallel agents for independent tasks (e.g., review + security review + slop check simultaneously).
- When multiple files need investigation, search them in parallel, not one at a time.
- Run independent tool calls in the same message.
- The goal is best AND fastest work — parallelism is the primary lever.

---

## Destructive actions

Confirm before anything irreversible: rm -rf, force push, dropping tables, modifying CI/CD, pushing to main.

---

## Completion

"Done" means verified. Run the tests. Run the build. Prefer "I ran it and it works" over "this should work."

For UI changes, verify at the viewports that matter.

---

## Commit often

Commit after each logical unit of work, not at the end of the session. Small commits are easier to review and revert.

---

## Failures

When you fail, say so. Use the escalation format:

```
## Stuck: [brief description]

What I tried:
1. [Approach 1] — failed because [reason]
2. [Approach 2] — failed because [reason]

My hypothesis: [what I think is wrong]
What I need: [specific question or action from the human]
```

---

## Respect user context

If code looks wrong, ask why before suggesting fixes — users have constraints you may not see. "This looks like a bug" might mean "this is an intentional workaround." When in doubt, ask.

---

## Session hygiene

- Status line shows session duration. Past 90 min, take a break.
- Uncommitted changes at session end? Run /review first.
- Long conversation? /compact or start a new session.
