# Specialist: Unit tests

Dispatch the `test-writer` agent to write isolated unit tests for the target.

## Agent

`Agent(test-writer)`.

## What to produce

Unit tests that exercise one unit (function, method, class) in isolation. Dependencies that
cross a process or network boundary are stubbed; everything internal runs for real.

For each unit under test, cover:
- The happy path with a specific input and a specific expected output.
- Each conditional branch reachable from the public surface (every `if`/`case`/early return).
- Boundary values where the code uses `<`, `<=`, `>`, `>=`, or array/string indices —
  test the off-by-one points, not just the middle of the range.
- Error and failure paths — what the unit throws, returns, or rejects with on bad input.
- Empty / null / zero-length inputs where the unit accepts a collection or optional.

## Quality bar

- Assert specific values, specific side effects, or specific error conditions. Never
  `expect(x).toBeTruthy()` / `toBeDefined()` / `not.toBeNull()` as the only assertion.
- Do not test the mock. If a stub's return value is the only thing an assertion checks,
  the test verifies setup, not code — delete or rewrite it.
- Each test name must describe the behavior it verifies and match what the body asserts.
- No sleeps, no real network, no timing-dependent assertions. Tests must be hermetic.
- One behavior per test. Use the project's parameterized-test mechanism instead of
  copy-pasting a test with minor variations.
- Every test must be able to fail for a real bug. If it can't, it's slop — see
  `rules/test-slop.md`.

## Conventions

Match the existing test patterns shown in the gathered context (file naming, framework,
assertion library, fixture style, directory location). Use the project test command from
that context to confirm the tests run and pass before reporting.
