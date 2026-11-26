# Regression tests for verified fixes

Skip if framework is `none-detected` or tier is `quick`.

For each `verified-fixed` finding, write a regression test in the project's convention:
- Playwright: `*.spec.ts` in the existing test dir, using `test(...)` and `page.*` API.
- Jest/Vitest: `*.test.ts` covering the unit if the fix was unit-level; integration spec if not.

Each test must:
- Have a name that describes the bug (`'navigates to /users when nav button clicked (regression for QA-003)'`)
- Have at least one assertion that would have failed pre-fix
- Run as part of the project's existing test command (verify by running it)

Run the new tests once before declaring done. If they fail, the fix didn't actually work — go back to Step 5 with `regressed`.

