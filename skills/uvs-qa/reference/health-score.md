# Health score

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

If a baseline was provided or auto-detected, `delta = current - baseline`. A negative delta means something regressed during the run that no in-run fix caused; warn prominently.
