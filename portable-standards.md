# UV Suite — Portable Standards

Universal standards and templates that work across any AI coding tool and any project. This is the tool-agnostic core of UV Suite.

---

## Philosophy

Every project you join should benefit from your accumulated engineering standards. But those standards shouldn't be locked into one AI tool's configuration format.

**The portable layer:**
- Pure Markdown files with no tool-specific syntax
- Drop into any project root
- Work with Claude Code, Cursor, Codex, or no AI tool at all
- Serve as the source of truth for tool-specific wrappers

**The wrapper layer:**
- Generated from the portable core
- Adds tool-specific frontmatter, activation rules, or configuration
- Lives in `.claude/`, `.cursor/rules/`, or `.codex/` as appropriate

---

## Portable Files

### 1. CODING-STANDARDS.md

Drop this into any project and adapt section by section to the project's conventions.

```markdown
# Coding Standards

## General Principles

1. **Clarity over cleverness.** Code is read 10x more than it's written. Optimize for the reader.
2. **Earn every abstraction.** Don't add a layer of indirection until you have two concrete uses for it.
3. **Trust internal boundaries.** Validate at system edges (user input, API responses, file reads). Trust internal function calls.
4. **Delete rather than comment out.** Version control remembers. Dead code commented out is just noise.
5. **Names are documentation.** If you need a comment to explain what a variable or function does, rename it.

## Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case or match framework convention | `user-service.ts`, `UserService.java` |
| Functions/methods | Verb-first, describe the action | `createUser()`, `validateToken()`, `fetchListings()` |
| Variables | Noun, describe the content | `activeUsers`, `paymentResult`, `isValid` |
| Booleans | `is`, `has`, `can`, `should` prefix | `isActive`, `hasPermission`, `canEdit` |
| Constants | UPPER_SNAKE_CASE or framework convention | `MAX_RETRIES`, `API_BASE_URL` |
| Types/Interfaces | PascalCase, noun | `User`, `PaymentResult`, `ListingFilter` |

## Code Organization

### File structure
- One primary export per file (class, component, or module)
- Keep files under 300 lines — split when they grow
- Co-locate tests with source: `user-service.ts` + `user-service.test.ts`
- Group by feature/domain, not by type (not `controllers/`, `models/`, `services/`)

### Function design
- Functions should do one thing
- Max 3-4 parameters — use an options object beyond that
- Return early for guard clauses — avoid deep nesting
- Prefer pure functions (same input → same output, no side effects)

### Error handling
- Validate at system boundaries only
- Let errors propagate naturally through internal code
- When you catch, add value: convert the error, add context, or handle it
- Never catch-log-rethrow — it adds noise without value

## Comments

**Write comments that explain WHY, not WHAT.**

```
// BAD: What
// Loop through users and filter active ones
const active = users.filter(u => u.isActive);

// GOOD: Why
// Only active users should receive the digest email — 
// deactivated accounts complained about getting emails post-deletion
const active = users.filter(u => u.isActive);

// BEST: No comment needed — the code is clear
const activeUsers = users.filter(u => u.isActive);
```

**Delete any comment where removing it loses zero information.**

## Testing

### Test names read as sentences
```
"should return 404 when listing does not exist"
"should hash password before storing"
"should apply discount when coupon is valid and not expired"
```

### Test structure: Arrange-Act-Assert
```
1. Arrange: set up test data and state
2. Act: perform the action being tested
3. Assert: verify the result
```

### What to test
- Happy path (the thing works)
- Edge cases (empty input, boundary values, null)
- Error paths (invalid input, network failure, timeout)
- Security-relevant behavior (auth checks, input validation)

### What NOT to test
- Framework behavior (does React render? does Express route?)
- Getters/setters and trivial code
- Third-party library internals
- Implementation details (test behavior, not structure)

## Git

### Commit messages
```
[type]: [concise description of what changed]

[Optional body: why this change was needed]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

### Branch naming
```
[type]/[short-description]
feat/user-authentication
fix/payment-webhook-timeout
refactor/search-query-optimization
```

### PR guidelines
- Keep PRs focused — one feature or fix per PR
- Include a description of what changed and why
- Add test evidence (test output, screenshots for UI changes)
- Self-review before requesting human review
```

### 2. REVIEW-CHECKLIST.md

```markdown
# Code Review Checklist

Use this checklist for every code review — self-review or peer review.

## Correctness
- [ ] Does the code do what the spec/ticket says?
- [ ] Are edge cases handled? (null, empty, boundary values)
- [ ] Are error paths correct? (not just happy path)
- [ ] Is the logic actually correct? (trace through mentally)

## Security
- [ ] No injection vulnerabilities (SQL, command, XSS)
- [ ] Input validated at system boundaries
- [ ] Auth/authz checks in place for protected operations
- [ ] No secrets in code or config files
- [ ] Dependencies checked for known CVEs

## Performance
- [ ] No N+1 queries
- [ ] No unbounded collections loaded into memory
- [ ] Appropriate indexing for new queries
- [ ] Pagination for list endpoints
- [ ] No blocking calls in async paths

## Quality
- [ ] Names are clear and consistent
- [ ] No dead code introduced
- [ ] No premature abstractions
- [ ] Changes are proportional to the task
- [ ] Tests verify behavior, not just existence

## AI Slop
- [ ] No comments that restate the code
- [ ] No unnecessary try/catch
- [ ] No abstractions with only one implementation
- [ ] Tests have meaningful assertions
- [ ] Documentation uses specific facts, not adjectives
```

### 3. SPEC-TEMPLATE.md

```markdown
# Spec: [Feature Name]

**Status:** Draft | In Review | Approved
**Author:** [name]
**Date:** [date]

## Problem Statement
What problem does this solve? Who has this problem?

## Requirements

### Functional
- FR-1: [The system must...]
- FR-2: [When the user..., the system should...]

### Non-Functional
- NFR-1: [Latency, throughput, availability targets]
- NFR-2: [Scale requirements]

### Out of Scope
- [What this deliberately does NOT cover]

## Proposed Solution
[High-level approach in 2-3 paragraphs]

## API Contract
[Endpoints, request/response shapes, events]

## Data Model
[New/modified tables, schemas, migrations]

## Dependencies
[External services, libraries, teams]

## Risks and Open Questions
| Risk/Question | Impact | Mitigation |
|--------------|--------|------------|
| | | |

## Success Criteria
[How do we know this is done? What metrics move?]

## Test Strategy
[What tests are needed? Unit, integration, e2e, load?]
```

### 4. ACTS-TEMPLATE.md

```markdown
# [Project Name] — Acts Plan

**Author:** [name]
**Date:** [date]
**Spec:** [link to spec]

## Overview
[1-2 sentences: what we're building]

## Acts Summary

| Act | Delivers | Size | Depends on |
|-----|----------|------|------------|
| 1 | [what] | S/M/L | — |
| 2 | [what] | S/M/L | Act 1 |

---

## Act [N]: [Name]

**Delivers:** [What users/system can do after this Act]
**Entry criteria:** [What must be true before starting]
**Exit criteria:** [What must be true before next Act]

### Tasks

| # | Task | Depends on | Size |
|---|------|------------|------|
| N.1 | [description] | None | S/M/L |
| N.2 | [description] | N.1 | S/M/L |

### Verification
- [ ] [Concrete, testable check]
- [ ] [Tests pass]
- [ ] [Anti-slop guard passed]
```

---

## Generating Tool-Specific Wrappers

### From CODING-STANDARDS.md → CLAUDE.md

```markdown
# [Project Name]

## What this is
[From the spec or project README]

## Tech stack
[Language, framework, database]

## Project structure
[Key directories]

## Conventions
[Paste or reference CODING-STANDARDS.md sections relevant to this project]

## Commands
- `[how to run dev server]`
- `[how to run tests]`
- `[how to lint]`
- `[how to build]`

## UV Suite Agents
This project uses UV Suite agents. Available commands:
- `/review` — Code review (correctness, security, performance, slop)
- `/spec` — Write a technical specification
- `/map-codebase` — Map architecture and dependencies
- `/slop-check` — Detect AI-generated slop
- `/write-tests` — Generate tests for specified code
- `/security-review` — Security audit
```

### From CODING-STANDARDS.md → .cursor/rules/standards.mdc

```yaml
---
description: "Project coding standards: naming, organization, testing, review checklist"
alwaysApply: true
---

[Paste CODING-STANDARDS.md content here, trimmed to < 2000 tokens]

[Keep the most important sections: naming, error handling, testing, comments]
[Link to full file for details: "See CODING-STANDARDS.md for complete standards"]
```

### From CODING-STANDARDS.md → AGENTS.md

```markdown
# [Project Name]

## Standards
See CODING-STANDARDS.md for full coding standards. Key points:

[Paste the most critical 500 words from CODING-STANDARDS.md]

## Commands
- `[how to run]`
- `[how to test]`

## Architecture
[Brief overview]
```

Note: AGENTS.md has a 32 KiB combined limit across all files in the chain. Keep it concise and reference external docs.

---

## Keeping Standards in Sync

When you update `CODING-STANDARDS.md`, propagate changes to tool-specific wrappers:

### Manual approach
1. Edit `CODING-STANDARDS.md`
2. Update `CLAUDE.md` with relevant changes
3. Update `.cursor/rules/standards.mdc` with relevant changes
4. Update `AGENTS.md` with relevant changes

### Semi-automated approach (Claude Code skill)

```yaml
# .claude/skills/sync-standards/SKILL.md
---
name: sync-standards
description: >
  Sync CODING-STANDARDS.md to tool-specific config files (CLAUDE.md, 
  .cursor/rules/, AGENTS.md). Use after updating coding standards.
user-invocable: true
---

Read CODING-STANDARDS.md and update the tool-specific wrappers:

1. Update the "Conventions" section of CLAUDE.md
2. Update .cursor/rules/standards.mdc (keep under 2000 tokens)
3. Update the "Standards" section of AGENTS.md (keep under 500 words)

Preserve tool-specific content (commands, architecture, agent references) — 
only update the standards-derived sections.
```

---

## What Goes Where

| Content | Portable file | CLAUDE.md | .cursor/rules/ | AGENTS.md |
|---------|--------------|-----------|----------------|-----------|
| Coding standards | CODING-STANDARDS.md | Reference or inline | standards.mdc | Reference or inline |
| Review checklist | REVIEW-CHECKLIST.md | Link | review.mdc | Link |
| Spec template | SPEC-TEMPLATE.md | Link | N/A | Link |
| Acts template | ACTS-TEMPLATE.md | Link | N/A | Link |
| Project architecture | In the project itself | Brief overview | architecture.mdc | Brief overview |
| Commands | In the project itself | List commands | commands.mdc | List commands |
| Agent definitions | agents.md | Link to skills | As rules | As TOML agents |
| Hooks | N/A (tool-specific) | settings.json | N/A | N/A |
| MCP servers | N/A (tool-specific) | mcp.json | mcp.json | Agent TOML |

---

## Bootstrapping a New Project

When you start a new project:

```bash
# 1. Copy portable standards
cp CODING-STANDARDS.md /path/to/new-project/
cp REVIEW-CHECKLIST.md /path/to/new-project/
cp SPEC-TEMPLATE.md /path/to/new-project/docs/
cp ACTS-TEMPLATE.md /path/to/new-project/docs/

# 2. Adapt CODING-STANDARDS.md to the project
# (update naming conventions, test patterns, etc.)

# 3. Generate CLAUDE.md for the project
# (use the template above, fill in project specifics)

# 4. Copy UV Suite agents (if using Claude Code)
cp -r uv-suite-agents/ /path/to/new-project/.claude/agents/
cp -r uv-suite-skills/ /path/to/new-project/.claude/skills/

# 5. Run the Cartographer if there's existing code
# /map-codebase

# 6. Start building with Acts
# /spec "what we're building"
# /architect "plan the acts"
```

This takes 5-10 minutes and sets you up with your full methodology from day one.
