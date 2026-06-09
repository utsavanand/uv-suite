---
name: uvs-qa
description: >
  Browser-based QA: exercises the running app via Playwright MCP, captures console
  errors and visual evidence, optionally fixes source bugs with atomic commits and
  generates regression tests. Three tiers (quick / standard / exhaustive). Writes
  uv-out/qa-state.md so /uvs-commit and /ship can detect completion and read the health
  score.
argument-hint: "[url] [--tier quick|standard|exhaustive]"
user-invocable: true
context: fork
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Grep(*)
  - Glob(*)
  - Write(uv-out/**)
  - Write(test/**)
  - Write(tests/**)
  - Write(__tests__/**)
  - Edit(*)
  - Bash(git status *)
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(git rev-parse *)
  - Bash(mkdir *)
  - Bash(ls *)
  - Bash(cat *)
  - Bash(date *)
  - Bash(curl -sf *)
  - mcp__playwright__*
---

## Target

$ARGUMENTS

Parse `$ARGUMENTS`:
- First positional token without `--` prefix → app URL (defaults to `http://localhost:3000` if not given).
- `--tier quick|standard|exhaustive` → tier (defaults to `standard`).
- `--baseline <path>` → path to a prior `qa-state.md` for health-score delta (defaults to `uv-out/qa-state.md`, the flat pointer to the latest run, if present).

## Session output directory

Write QA artifacts under this directory (scoped to the current session). The
`<session-output-dir>/qa/<ts>/` paths below all resolve under it:

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-session.sh`

Stable flat pointer maintained for `/uvs-commit` and `/ship`:

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-pointer.sh qa-state.md qa/state.md`

## Project context

!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

## Detected test framework

!`(test -f playwright.config.ts && echo "playwright") || (test -f playwright.config.js && echo "playwright") || (test -f vitest.config.ts && echo "vitest") || (test -f jest.config.js && echo "jest") || (grep -l '"jest"' package.json 2>/dev/null && echo "jest") || echo "none-detected"`

## Tier definitions

| Tier | Viewports | Pages | Console capture | Fix bugs | Generate regression tests |
|---|---|---|---|---|---|
| `quick` | 1 (desktop 1440×900) | Top-level entry + 1 deep link | Yes | No (report only) | No |
| `standard` | 2 (desktop 1440×900, mobile 390×844) | Entry + every link in nav + 2 deep flows | Yes | Only `critical` severity | When framework detected |
| `exhaustive` | 3 (desktop, tablet 1024×768, mobile) | Every reachable page from nav + 3 deep flows + edge-case inputs | Yes | All `critical` + `high` | Yes when framework detected |

If `$ARGUMENTS` doesn't specify a tier, default to `standard`.

## Orchestration procedure

Execute these steps in order.

### Step 1 — Setup

- Confirm Playwright MCP is reachable (`mcp__playwright__browser_*` tools available). If not, stop and tell user to enable the Playwright MCP server.
- Verify the target URL is reachable: `curl -sf <url> > /dev/null`. If not, stop and ask user to start the dev server.
- Create output directory: `mkdir -p <session-output-dir>/qa/<ISO-timestamp>/screenshots` (the `<session-output-dir>` printed above).
- If framework detected, note its config path; you'll write regression tests against it later.

### Step 2 — Orient

- Navigate to the target URL. Take a full-page screenshot saved as `<session-output-dir>/qa/<ts>/screenshots/00-entry-desktop.png`.
- Take a DOM accessibility snapshot (`browser_snapshot`) and use it to enumerate navigable elements: nav links, buttons with handlers, forms.
- Read browser console messages (`browser_console_messages`). Record any errors or warnings at this point as Tier-0 findings (page didn't even load cleanly).
- Build a page map: list of URLs reachable from the entry page within one click, with rough page type (list, detail, form, dashboard, etc.).

Output the page map to the user as a short table before moving on. Pause if the map is empty or suspicious (single-page app with no nav surfaced? — note it).

### Step 3 — Explore

Based on tier, visit pages and interact:

- **Quick:** Entry + 1 deep link. Click into a representative detail page. Capture screenshot per page per viewport.
- **Standard:** Entry + every nav link + 2 deep flows. A "deep flow" = a multi-step user action (e.g., signup form, search-then-click-result, add-to-cart).
- **Exhaustive:** Every reachable page + 3 deep flows + edge cases (empty input, overlength input, special characters, rapid clicks).

For each interaction:
1. Take a `before` screenshot.
2. Perform the action via `browser_click` / `browser_type` / etc.
3. Take an `after` screenshot.
4. Check console for new errors via `browser_console_messages`.
5. Verify the URL changed or DOM updated as expected.

Switch viewports per tier (call `browser_resize` between passes). Re-run the entry + key flows in each viewport.

Document every finding as you go — don't trust memory across the run.

### Step 4 — Triage

Sort findings into severity buckets:

| Severity | Definition |
|---|---|
| `critical` | Page crashes, blank renders, console errors blocking user actions, broken auth, security warning visible to user |
| `high` | Dead button (click does nothing), form submit fails silently, broken nav link, content overflow that hides critical info |
| `medium` | Visual regression visible to user (layout shift, missing image, alignment), console warning, slow interaction (>2s with no spinner) |
| `low` | Minor visual nit, accessibility warning that doesn't block use, console info-level message |

Assign confidence 1-10 to each (same rubric as `/uvs-review`):
- 9-10: Reproduced in this run with screenshot evidence
- 7-8: Pattern-matched against a known bug class (e.g., 404 on resource fetch in console) with screenshot
- 5-6: Likely issue but couldn't reproduce reliably (e.g., race condition observed once)
- 3-4: Suspicious but not confirmed
- 1-2: Speculation, suppress from output

### Step 5 — Fix loop (skip for tier `quick`)

For each finding the tier allows fixing (`critical` always; `high` only on `exhaustive`), in confidence order high to low:

1. **Locate source.** Use Grep/Glob to find the component, handler, or route responsible. Read it.
2. **Fix.** Apply the smallest change that addresses the bug. No refactor surrounding code.
3. **Re-test.** Reload the affected page, replay the action, capture new `after` screenshot.
4. **Classify outcome:**
   - `verified-fixed`: bug no longer reproduces; new screenshot shows expected state
   - `regressed`: bug fixed but a new issue appeared in re-test
   - `unchanged`: fix didn't take effect; revert and mark `ask` for human review
5. **Commit** only verified-fixed. One commit per fix:
   ```
   git commit -m "fix(qa): <severity> <one-line> — confidence <n>"
   ```
   Include the fix file path + before/after screenshot paths in the commit body.

Never bundle multiple fixes in one commit — atomic per fix so revert is precise.

### Step 6 — Generate regression tests

Skip if framework is `none-detected` or tier is `quick`.

For each `verified-fixed` finding, write a regression test in the project's convention:
- Playwright: `*.spec.ts` in the existing test dir, using `test(...)` and `page.*` API.
- Jest/Vitest: `*.test.ts` covering the unit if the fix was unit-level; integration spec if not.

Each test must:
- Have a name that describes the bug (`'navigates to /users when nav button clicked (regression for QA-003)'`)
- Have at least one assertion that would have failed pre-fix
- Run as part of the project's existing test command (verify by running it)

Run the new tests once before declaring done. If they fail, the fix didn't actually work — go back to Step 5 with `regressed`.

### Step 7 — Final QA pass

After all fixes are committed and tests pass:

- Re-navigate the full page map (per tier) one more time.
- Take fresh screenshots into `<session-output-dir>/qa/<ts>/screenshots/final-*`.
- Capture final console state.
- Compute health score (see scoring below).

### Step 8 — Compute health score

```
score = 100
  - 25 × critical_remaining
  - 10 × high_remaining
  - 3 × medium_remaining
  - 1 × low_remaining
  - 5 × console_errors_remaining
  - 2 × console_warnings_remaining
(clamped to [0, 100])
```

If a baseline was provided or auto-detected, compute `delta = current - baseline`. **If delta is negative, warn prominently** — something regressed during this run that wasn't caused by an in-run fix.

### Step 9 — Write state

Write the canonical state to `<session-output-dir>/qa/state.md` (overwritten each run), and
keep this run's detailed copy at `<session-output-dir>/qa/<ts>/qa-state.md`. The flat pointer
`uv-out/qa-state.md` already points at `qa/state.md`, so `/uvs-commit` and `/ship` read the latest
run unchanged.

State frontmatter schema:

```yaml
---
schema: uv-suite/qa-state/v1
session_id: <UVS_SESSION_ID env, or "unknown">
ran_at: <ISO 8601>
target: <url>
tier: quick|standard|exhaustive
viewports: [<list>]
test_framework: <playwright|jest|vitest|none-detected>
pages_visited: <n>
deep_flows_run: <n>
issues_found:
  critical: <n>
  high: <n>
  medium: <n>
  low: <n>
issues_remaining:
  critical: <n>
  high: <n>
  medium: <n>
  low: <n>
console_errors: <n>
console_warnings: <n>
fixes_committed: <n>
fixes_regressed: <n>
fixes_unchanged: <n>
regression_tests_added: <n>
health_score: <0-100>
baseline_score: <0-100 | null>
health_delta: <integer | null>
artifacts:
  screenshots_dir: <session-output-dir>/qa/<ts>/screenshots/
  commits: [<sha>, ...]
status: complete   # or: partial, failed
---
```

Below the frontmatter, write a human-readable report with sections for: page map, findings by severity (with screenshot references), commits made, regression tests added, remaining work, health score breakdown.

### Step 10 — Report to user

Output to the user in this order:
1. Tier + viewports + pages visited (one line)
2. Health score + delta vs baseline (with warning if negative)
3. Critical findings (with file:line, fix outcome, screenshot path)
4. High findings (same)
5. Medium/low counts (pointer to state file for details)
6. Commits made + regression tests added
7. Pointer to `uv-out/qa-state.md` and screenshots directory

If no fixes were applied (tier=`quick` or no critical bugs), say so explicitly — don't pretend there was nothing to fix.

## Notes for downstream skills

`/uvs-commit` reads `uv-out/qa-state.md` and:
- Surfaces `issues_remaining.critical > 0` as a blocker (user must override)
- Includes `health_score` + `delta` in commit message footer when run after QA

`/ship` reads `uv-out/qa-state.md` and:
- Blocks PR if `status != complete` or `issues_remaining.critical > 0`
- Posts the health-score summary as a PR comment

## Voice rules

- Lead with what you observed, not what you assumed. "Clicked button at /users/new, no network request fired" beats "submit handler appears broken."
- Cite the screenshot for every finding (file path). Evidence first.
- When a bug isn't reproducible, say so and lower confidence — don't fabricate steps.
- "Health score dropped 8 points; root cause: 2 new console errors after the search input change" beats "QA found regressions."

## Dogfood note (2026-06-05)

This skill is new. No formal eval suite gates it; correctness is validated by running it against real apps in this workspace. Expected failure modes to watch for in early runs:
- Playwright MCP tool names may drift; update `allowed-tools` if `mcp__playwright__*` wildcard stops matching.
- Health-score weights are a starting point — adjust the formula in Step 8 if real runs produce uninformative scores.
- Atomic-commit-per-fix can be noisy; consider squashing pre-PR or extending `/uvs-commit` to bundle when fixes are related.
- Auto-detection of framework via config file presence misses monorepos; add support if needed.
