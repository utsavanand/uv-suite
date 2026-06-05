---
name: security-review
description: >
  OWASP-informed security review. Uses Semgrep, Gitleaks, and Trivy when available.
  Falls back to AI-only analysis. Use on code touching auth, payments, data access,
  or external inputs.
argument-hint: "[file-or-directory]"
user-invocable: true
context: fork
agent: security
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Write(uv-out/**)
  - Grep(*)
  - Glob(*)
  - Bash(git diff *)
  - Bash(semgrep *)
  - Bash(gitleaks *)
  - Bash(trivy *)
  - Bash(npm audit *)
  - Bash(pip audit *)
  - Bash(go vuln *)
  - Bash(cargo audit *)
---

## Target

$ARGUMENTS

## Session output directory

Write the security report under this directory (scoped to the current session):

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-session.sh`

## Changes to review

!`git diff --cached --stat 2>/dev/null || git diff --stat 2>/dev/null || echo "Reviewing full project"`

### Full diff

!`git diff --cached 2>/dev/null || git diff 2>/dev/null || echo ""`

## Danger zones

!`cat DANGER-ZONES.md 2>/dev/null || echo "No DANGER-ZONES.md found"`

## Prior analysis

### Codebase map

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-best.sh map-codebase.md 80 || echo "No codebase map found"`

### Recent code review findings

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-best.sh 'review/state.md' 60 || echo "No prior review found"`

### Recent slop check

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-best.sh 'slop-check/report.md' 40 || echo "No prior slop check found"`

## Available security tools

```!
echo "=== Semgrep ===" && semgrep --version 2>/dev/null || echo "not installed (pip install semgrep)"
echo "=== Gitleaks ===" && gitleaks version 2>/dev/null || echo "not installed (brew install gitleaks)"
echo "=== Trivy ===" && trivy --version 2>/dev/null || echo "not installed (brew install trivy)"
```

## SAST scan (Semgrep, if available)

```!
semgrep --config auto --json --quiet . 2>/dev/null | head -100 || echo "Semgrep not available — will use AI-only analysis"
```

## Secret detection (Gitleaks, if available)

```!
gitleaks detect --source . --no-git --report-format json 2>/dev/null | head -50 || echo "Gitleaks not available — falling back to grep"
```

## Grep-based secret scan (fallback)

```!
grep -rn "password\s*=\|api_key\s*=\|secret\s*=\|token\s*=" --include="*.ts" --include="*.js" --include="*.py" --include="*.java" --include="*.go" . 2>/dev/null | head -20 || echo "No obvious secrets found"
```

## Dependency audit

```!
trivy fs --scanners vuln --format json . 2>/dev/null | head -80 || npm audit --json 2>/dev/null | head -50 || pip audit 2>/dev/null | head -50 || echo "No dependency scanner found"
```
