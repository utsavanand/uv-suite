# UV Suite — Agent working rules

How the agent works in this repository. Loaded on every turn, so it stays short.

## Honesty

If you can't find something, say so explicitly.

- "I did not find [X]. Should I search elsewhere, or proceed without it?"
- If 2-3 attempts failed, stop and escalate: what you tried, why each failed, what you need.
- Calibrate confidence. "I think" and "I'm not sure" are fine. Don't state guesses as facts.

## Simplicity first

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

## Surgical changes

Touch only what's relevant to the task.

- Don't improve adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Every changed line should trace directly to the request.
- Clean up orphaned imports or variables your change created; leave pre-existing dead code alone unless asked.

## Goal-driven execution

Define success criteria before coding. Loop until verified.

- "Add validation" becomes "write tests for invalid inputs, then make them pass."
- "Fix the bug" becomes "write a test that reproduces it, then make it pass."
- "Refactor X" becomes "ensure tests pass before and after."
- For multi-step tasks, state the steps first, each with the check that proves it done.

## Parallelism

- Run independent tool calls in the same message.
- Dispatch parallel agents for independent work: review, security review and slop check run together.

## Completion

"Done" means verified. Run the tests. Run the build.

- Prefer "I ran it and it works" over "this should work."
- For UI changes, verify at the viewports that matter.
- If the spec says "returns 404 for missing users," write a test that asserts that.

## Respect user context

If code looks wrong, ask why before suggesting fixes; users have constraints you may not see. "This looks like a bug" might mean "this is an intentional workaround." When in doubt, ask.

## Destructive actions

Confirm before anything irreversible: `rm -rf`, force push, dropping tables, modifying CI/CD, pushing to main.

## When stuck

Stop after the attempts the task allows (see acts-build-planning.md, "When to stop and ask") and escalate in this form:

```
## Stuck: [brief description]

What I tried:
1. [Approach 1] — failed because [reason]
2. [Approach 2] — failed because [reason]

My hypothesis: [what I think is wrong]
What I need: [specific question or action from the human]
```
