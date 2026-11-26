# review-state frontmatter

The exact schema `<session-output-dir>/review/state.md` starts with; `uv-out/review-state.md` is a copy of the latest run.

```yaml
---
schema: uv-suite/review-state/v1
session_id: <UVS_SESSION_ID env var, or "unknown">
ran_at: <ISO 8601 timestamp>
target: <branch | HEAD | $ARGUMENTS>
diff_stats:
  files_changed: <n>
  additions: <n>
  deletions: <n>
specialists_run: [security, performance, testing, maintainability, api-contract, data-migration]
specialists_skipped: []   # with reason in body
summary:
  critical: <count of confidence 9-10>
  high: <count of confidence 7-8>
  medium: <count of confidence 5-6>
  low: <count of confidence 3-4>
  suppressed: <count of confidence 1-2>
  auto_fix: <count>
  ask: <count>
  info: <count>
status: complete   # or: partial, failed
---
```
