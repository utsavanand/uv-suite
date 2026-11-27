---
name: uvs-qa
description: >
  Browser-based QA: exercises the running app via Playwright MCP, captures console
  errors and visual evidence, optionally fixes source bugs with atomic commits and
  generates regression tests. Three tiers (quick / standard / exhaustive). Writes
  uv-out/qa-state.md so /uvs-ship and /uvs-ship can detect completion and read the health
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

When run as a flow step, the Inputs JSON carries `url` (the running app) and may carry `diff` (the change under test); use them as the arguments below.

Parse `$ARGUMENTS`:
- First positional token without `--` prefix → app URL (defaults to `http://localhost:3000` if not given).
- `--tier quick|standard|exhaustive` → tier (defaults to `standard`).
- `--baseline <path>` → path to a prior `qa-state.md` for health-score delta (defaults to `uv-out/qa-state.md`, the flat pointer to the latest run, if present).

## Session output directory

Write QA artifacts under this directory (scoped to the current session). The
`<session-output-dir>/qa/<ts>/` paths below all resolve under it:

This session's output folder is `uv-out/sessions/<id>/`, where `<id>` is the `UVS_SESSION_ID` environment variable, or `uv-out/current/` when it is unset. Create it if it does not exist. Below, `<session-output-dir>` means this folder.

Stable flat pointer maintained for `/uvs-ship`:

After writing, copy this run's `<session-output-dir>/qa/state.md` to `uv-out/qa-state.md`, so `/uvs-ship` and other skills find the latest run at a fixed path.

## Project context

Read `CLAUDE.md` or `AGENTS.md` at the project root, if present.

## Detected test framework

Detect the test framework: `playwright.config.*` → playwright; `vitest.config.*` → vitest; `jest.config.js` or a jest entry in `package.json` → jest; otherwise none.

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
- Create output directory: `mkdir -p <session-output-dir>/qa/<ISO-timestamp>/screenshots` (the `<session-output-dir>` named above).
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

Assign confidence 1-10 to each, as `/uvs-review` does: 9-10 reproduced here with a screenshot, 7-8 a known bug class with a screenshot, 5-6 seen but not reliably reproduced, 3-4 suspicious, 1-2 suppress.

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

Skip if the framework is `none-detected` or the tier is `quick`. Otherwise one regression test per `verified-fixed` finding, in the project's own framework, run once before declaring done; the rules are in `reference/regression-tests.md` beside this SKILL.md.

### Step 7 — Final QA pass

After all fixes are committed and tests pass:

- Re-navigate the full page map (per tier) one more time.
- Take fresh screenshots into `<session-output-dir>/qa/<ts>/screenshots/final-*`.
- Capture final console state.
- Compute health score (see scoring below).

### Step 8 — Compute health score

The formula and the baseline delta are in `reference/health-score.md` beside this SKILL.md.

### Step 9 — Write state

Write the canonical state to `<session-output-dir>/qa/state.md` (overwritten each run), and
keep this run's detailed copy at `<session-output-dir>/qa/<ts>/qa-state.md`. The flat pointer
`uv-out/qa-state.md` already points at `qa/state.md`, so `/uvs-ship` reads the latest
run unchanged.

Start the file with the frontmatter in `reference/qa-state.md` beside this SKILL.md, exactly, then the report sections it lists.

### Step 10 — Report to user

Write in the voice of `reference/voice.md` beside this SKILL.md: what you observed, with the screenshot, before what you assume.

Output to the user in this order:
1. Tier + viewports + pages visited (one line)
2. Health score + delta vs baseline (with warning if negative)
3. Critical findings (with file:line, fix outcome, screenshot path)
4. High findings (same)
5. Medium/low counts (pointer to state file for details)
6. Commits made + regression tests added
7. Pointer to `uv-out/qa-state.md` and screenshots directory

If no fixes were applied (tier=`quick` or no critical bugs), say so explicitly — don't pretend there was nothing to fix.

## Verdict (when run as a flow step)

When DuckTerm's runner drives this skill, end with exactly one of these choices
and a one-line reason, and write the report to the file path the runner names:

- `pass` — the change does what the spec says and the checks are green
- `fail` — a check failed or a requirement is unmet; the report says which
