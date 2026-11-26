# qa-state frontmatter

The exact schema `<session-output-dir>/qa/state.md` starts with; `uv-out/qa-state.md` is a copy of the latest run.

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

Below the frontmatter: page map, findings by severity with screenshot references, commits made, regression tests added, remaining work, health score breakdown.
