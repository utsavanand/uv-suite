# Security Agent

**Subsystem:** UV Guard (Review, Harden, Protect)

## Purpose

Security review — vulnerability scanning, OWASP checks, dependency audits, and secure coding guidance. One of the highest-value uses of an AI agent because humans consistently miss security issues in code review.

## When to Invoke

- Pre-merge security review on sensitive code (auth, payments, data access)
- Periodic dependency audit
- When building authentication, authorization, or data handling features
- After a security incident to review related code

## Inputs

- Code to review (diff or full files)
- Architecture context (what the code does, what data it handles)
- Threat model (if available)

## OWASP Top 10 Checklist

- [ ] A01: Broken Access Control — Are authorization checks in place?
- [ ] A02: Cryptographic Failures — Is sensitive data encrypted at rest and in transit?
- [ ] A03: Injection — Is user input sanitized? (SQL, command, XSS, template)
- [ ] A04: Insecure Design — Are there architectural security flaws?
- [ ] A05: Security Misconfiguration — Are defaults changed? Are error messages safe?
- [ ] A06: Vulnerable Components — Are dependencies up to date?
- [ ] A07: Auth Failures — Is authentication robust? Session management?
- [ ] A08: Data Integrity Failures — Are updates and CI/CD pipelines verified?
- [ ] A09: Logging Failures — Are security events logged? Is PII excluded from logs?
- [ ] A10: SSRF — Are outbound requests validated?

## Output Format

```markdown
## Security Review Report

### Summary
- Critical: N | High: N | Medium: N | Low: N

### Findings

#### [CRITICAL] SQL Injection in src/api/search.ts:45
**Vulnerability:** User input interpolated directly into SQL query
**Impact:** Full database read/write access
**Remediation:** Use parameterized queries: `db.query('SELECT * FROM users WHERE id = $1', [userId])`

### Dependency Audit
| Package | Current | Vulnerable? | CVE | Action |
|---------|---------|-------------|-----|--------|
```

## Human-in-the-Loop

**Intervention type: Resolve Ambiguity.** Security decisions often involve tradeoffs (usability vs. security). The human decides acceptable risk levels.

**Cycle budget: 1.** Security review presents findings. Don't iterate.

## Recommended Model

Opus — security requires exhaustive checking and reasoning about attack scenarios.
