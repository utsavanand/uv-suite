# What each specialist returns

```yaml
specialist: <name>
findings:
  - file: <path>
    line: <number or range>
    severity: critical|high|medium|low
    confidence: <1-10>
    title: <one-line summary>
    detail: <what's wrong, why it matters>
    fix_class: auto_fix|ask|info
    suggested_fix: <code or instruction, optional>
status: complete
```
