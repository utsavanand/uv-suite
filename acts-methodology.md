# UV Suite — Acts Methodology

A delivery framework for AI-assisted software development. Acts replace sprints when one developer orchestrates multiple AI agents.

---

## Why Not Sprints?

Sprints assume:
- A team of humans with varying availability
- Two-week cadences with ceremonies (standup, retro, planning)
- Velocity measured in story points across people
- Work items that may carry over between sprints

None of these assumptions hold when you're a single developer working with AI agents. You don't need standups with yourself. Your velocity isn't measured in points. And you can often complete in hours what a team would plan for a sprint.

**Acts assume:**
- One developer orchestrating AI agents
- Variable-length phases (hours to days, not fixed two-week cycles)
- Work proceeds in a clear narrative arc
- Each phase delivers a complete, usable piece of the system
- AI agents can work in parallel within a phase

---

## What Is an Act?

An Act is a **sequential delivery phase** that produces a **complete vertical slice** of functionality. Like a theater act, it tells a self-contained story — when it's done, the audience (users, stakeholders, yourself) can see and use something new.

**Key properties:**

| Property | Description |
|----------|-------------|
| **Sequential** | Act 2 doesn't start until Act 1 is complete and verified |
| **Self-contained** | Each Act delivers usable functionality, not a half-built layer |
| **Vertical** | Cuts across the full stack (DB → API → UI), not just one layer |
| **Verifiable** | Has explicit exit criteria that can be tested |
| **Parallelizable internally** | Tasks within an Act can run in parallel |

**Acts are NOT:**
- Horizontal layers ("Act 1: Database, Act 2: API, Act 3: UI") — that's waterfall
- Time-boxed — an Act takes as long as it takes (could be 2 hours or 2 days)
- Sprint backlogs — there's no "carrying over" unfinished work to the next Act

---

## Act Structure

```
Act [number]: [Name — what this act delivers]
├── Entry Criteria (what must be true before starting)
├── Tasks (parallel where possible)
│   ├── Task 1.1: [description] — Agent: [who does it]
│   ├── Task 1.2: [description] — Agent: [who does it]  ← parallel with 1.1
│   └── Task 1.3: [description] — Depends on: 1.1       ← sequential after 1.1
├── Verification Checklist
│   ├── [ ] Functional: [user can do X]
│   ├── [ ] Technical: [API returns Y for input Z]
│   └── [ ] Quality: [anti-slop guard passed, tests pass]
└── Exit Criteria (what must be true before moving to next Act)
```

### Entry Criteria

What must be true before you start this Act. For Act 1, this is typically "spec approved, architecture designed." For later Acts, it's "previous Act verified and merged."

Examples:
- "Authentication system is deployed and working (Act 1 complete)"
- "Database schema for listings is migrated (Task 2.1 complete)"
- "API contracts for search are agreed upon (Spec approved)"

### Tasks

The work items within an Act. Each task should be:
- **Independently implementable** — one developer (you) or one agent can do it
- **Independently testable** — you can verify it works without needing other tasks
- **Clearly scoped** — a task is a few hours of work, not a few days

Tasks have dependencies that determine parallelism:

```
Task 1.1: Create user DB schema          ← no dependencies
Task 1.2: Set up auth middleware          ← no dependencies
Task 1.3: Build login API endpoint        ← depends on 1.1 + 1.2
Task 1.4: Build signup API endpoint       ← depends on 1.1 + 1.2
Task 1.5: Build login/signup UI           ← depends on 1.3 + 1.4
Task 1.6: Write integration tests         ← depends on 1.3 + 1.4

Parallelism:
  [1.1] ──┐
           ├──→ [1.3] ──┐
  [1.2] ──┘              ├──→ [1.5]
           ┌──→ [1.4] ──┘
           │              └──→ [1.6]
```

### Verification Checklist

Concrete, testable checks. Not "works correctly" — instead:
- "User can sign up with email and password"
- "User receives a 401 when token is expired"
- "Password is hashed with bcrypt, not stored in plaintext"
- "Anti-slop guard has reviewed all generated code"
- "All tests pass, coverage > 80% on new code"

### Exit Criteria

What must be true before you move to the next Act. This is your quality gate. Typically:
- All verification checks pass
- Code is reviewed (by Reviewer agent)
- Anti-slop guard has passed
- Code is merged to the working branch
- (For production-facing Acts) deployed to staging

---

## How to Decompose a Project into Acts

### Step 1: Start with the Spec

The Spec Writer has already defined the requirements. Read them.

### Step 2: Identify the core user flows

What are the 3-5 things a user actually does with this system? These are your candidate Acts.

For an Airbnb-like app:
1. Sign up and log in
2. Create a listing
3. Search and browse listings
4. Book a listing
5. Communicate with host/guest

### Step 3: Order by dependency

Which flows depend on which? That determines Act order:
- Can't book without listings → Listings before Booking
- Can't create listings without auth → Auth before Listings
- Can't message without both parties existing → Messaging after Booking

### Step 4: Add foundation and polish Acts

Act 1 is usually **foundation**: auth, data model, project setup, core infrastructure.
The final Act is usually **polish**: error handling, responsive design, performance, monitoring.

### Step 5: Break each Act into tasks

For each Act, list the specific implementation tasks. Identify what can run in parallel.

### Step 6: Assign agents

Which UV Suite agent handles each task?
- Schema and API implementation → You + AI (general purpose)
- Tests → Test Writer
- Review → Reviewer
- Security-sensitive code → Security Agent
- Infrastructure → DevOps Agent

---

## Worked Example: Airbnb-like App

### Project Spec (simplified)

A marketplace where hosts list properties and guests book stays. Features: auth, listings, search, booking, payments, messaging, reviews.

### Acts Breakdown

---

#### Act 1: Foundation

**Delivers:** User authentication, project structure, base data model, CI/CD

**Entry criteria:** Spec approved, tech stack decided (Next.js, PostgreSQL, Stripe)

**Tasks:**

| Task | Description | Depends on | Agent |
|------|-------------|------------|-------|
| 1.1 | Project scaffolding (Next.js + Tailwind + Prisma) | None | You |
| 1.2 | Database schema: users, sessions | None | You |
| 1.3 | Auth: signup, login, logout, session management | 1.1, 1.2 | You |
| 1.4 | CI/CD pipeline (GitHub Actions: lint, test, build) | 1.1 | DevOps |
| 1.5 | Auth integration tests | 1.3 | Test Writer |
| 1.6 | Auth security review | 1.3 | Security |
| 1.7 | Review all generated code | 1.3, 1.4 | Reviewer + Anti-Slop |

**Parallelism:** 1.1 and 1.2 run in parallel. 1.4 runs in parallel with 1.3. 1.5 and 1.6 run in parallel after 1.3.

**Verification:**
- [ ] User can sign up with email/password
- [ ] User can log in and receives a session token
- [ ] Invalid credentials return appropriate errors
- [ ] Passwords are hashed (bcrypt)
- [ ] Session tokens expire after configured duration
- [ ] CI pipeline runs and passes on push

**Exit criteria:** Auth flow works end-to-end, CI passes, code reviewed.

---

#### Act 2: Listings

**Delivers:** Hosts can create, edit, and view property listings

**Entry criteria:** Act 1 complete (auth works, CI passes)

**Tasks:**

| Task | Description | Depends on | Agent |
|------|-------------|------------|-------|
| 2.1 | Database schema: listings, images, amenities | None | You |
| 2.2 | Listing API: CRUD endpoints | 2.1 | You |
| 2.3 | Image upload to S3 | 2.1 | You |
| 2.4 | Create listing UI (multi-step form) | 2.2, 2.3 | You |
| 2.5 | Listing detail page | 2.2 | You |
| 2.6 | Listing tests (unit + integration) | 2.2 | Test Writer |
| 2.7 | Review and anti-slop check | 2.4, 2.5 | Reviewer + Anti-Slop |

**Parallelism:** 2.2 and 2.3 run in parallel after 2.1. 2.4 and 2.5 run in parallel after 2.2. 2.6 starts when 2.2 is done.

**Verification:**
- [ ] Host can create a listing with title, description, price, photos
- [ ] Listing appears on detail page with all fields
- [ ] Images upload to S3 and display correctly
- [ ] Only the listing owner can edit/delete
- [ ] All tests pass

**Exit criteria:** Listing CRUD works end-to-end, images work, code reviewed.

---

#### Act 3: Search and Discovery

**Delivers:** Guests can search, filter, and browse listings

| Task | Description | Depends on | Agent |
|------|-------------|------------|-------|
| 3.1 | Search API: location, dates, price, amenities | None | You |
| 3.2 | Search results page with filters | 3.1 | You |
| 3.3 | Map integration (Mapbox/Google Maps) | 3.1 | You |
| 3.4 | Search tests | 3.1 | Test Writer |
| 3.5 | Performance review (search query optimization) | 3.1 | Reviewer |

---

#### Act 4: Booking and Payments

**Delivers:** Guests can book listings and pay

| Task | Description | Depends on | Agent |
|------|-------------|------------|-------|
| 4.1 | Database schema: bookings, payments, availability | None | You |
| 4.2 | Availability calendar (listing-level) | 4.1 | You |
| 4.3 | Booking API: create, confirm, cancel | 4.1 | You |
| 4.4 | Stripe integration: payment intent, webhook handling | 4.3 | You |
| 4.5 | Booking UI: date selection, payment, confirmation | 4.3, 4.4 | You |
| 4.6 | Payment security review | 4.4 | Security |
| 4.7 | Booking tests | 4.3, 4.4 | Test Writer |
| 4.8 | Review and anti-slop check | 4.5 | Reviewer + Anti-Slop |

---

#### Act 5: Communication

**Delivers:** Host-guest messaging

| Task | Description | Depends on | Agent |
|------|-------------|------------|-------|
| 5.1 | Database schema: conversations, messages | None | You |
| 5.2 | Messaging API: send, receive, list conversations | 5.1 | You |
| 5.3 | Real-time updates (WebSocket or polling) | 5.2 | You |
| 5.4 | Messaging UI: conversation list, message thread | 5.2, 5.3 | You |
| 5.5 | Email notifications for new messages | 5.2 | You |
| 5.6 | Tests and review | 5.4 | Test Writer + Reviewer |

---

#### Act 6: Polish and Production

**Delivers:** Production-ready application

| Task | Description | Depends on | Agent |
|------|-------------|------------|-------|
| 6.1 | Error handling: global error boundaries, API error responses | None | You |
| 6.2 | Loading states and skeleton screens | None | You |
| 6.3 | Mobile responsive design | None | You |
| 6.4 | Performance: lazy loading, image optimization, caching | None | You |
| 6.5 | Monitoring: health checks, error tracking (Sentry) | None | DevOps |
| 6.6 | Full security audit | All | Security |
| 6.7 | Full anti-slop review of all generated code | All | Anti-Slop |
| 6.8 | Documentation: API docs, deployment guide | All | You |

**Verification:**
- [ ] All pages work on mobile
- [ ] Error states show helpful messages, not stack traces
- [ ] Performance: First Contentful Paint < 2s
- [ ] No critical security findings
- [ ] Anti-slop guard passes on entire codebase

---

## Task Sizing Guidelines

| Size | Description | Typical Duration | Example |
|------|-------------|-----------------|---------|
| **Small** | Single file change, straightforward logic | 15-60 minutes | Add a database index, fix a validation bug |
| **Medium** | Multi-file change, new endpoint or component | 1-4 hours | Build the login form and API endpoint |
| **Large** | New feature area, multiple components | 4-8 hours | Implement the search system with filters and map |

**If a task is larger than "Large"**, break it into sub-tasks or make it its own Act.

---

## Parallelism Rules

### What CAN run in parallel:
- Independent feature implementations (different files/modules)
- Test writing (after the code it tests is done)
- Review + Security review + Anti-slop (all reading, not writing)
- Documentation
- CI/CD setup (independent of feature code)

### What CANNOT run in parallel:
- Code that depends on other code not yet written
- Tasks that modify the same files
- Tasks where the output of one is the input of another
- Database migrations that depend on each other

### Practical parallelism in Claude Code:

```bash
# Option 1: Agent teams (experimental)
# Multiple Claude Code sessions with worktree isolation

# Option 2: Multiple terminal sessions
# Session 1: Working on Task 2.2 (Listing API)
# Session 2: Working on Task 2.3 (Image upload)

# Option 3: Sequential with parallel review
# You build sequentially, then run all reviews in parallel at the end
```

---

## Act Planning Template

Copy this template for each new project:

```markdown
# [Project Name] — Acts Plan

## Overview
[1-2 sentences: what we're building and for whom]

## Acts Summary
| Act | Delivers | Est. Size | Depends on |
|-----|----------|-----------|------------|
| 1   | [what]   | [S/M/L]   | —          |
| 2   | [what]   | [S/M/L]   | Act 1      |
| N   | [what]   | [S/M/L]   | Act N-1    |

---

## Act [N]: [Name]

**Delivers:** [What the user/system can do after this Act]
**Entry criteria:** [What must be true before starting]

### Tasks

| # | Task | Depends on | Agent | Size |
|---|------|------------|-------|------|
| N.1 | [description] | None | [who] | [S/M/L] |
| N.2 | [description] | N.1 | [who] | [S/M/L] |

### Verification
- [ ] [Concrete, testable check]
- [ ] [Another check]

### Exit Criteria
[What must be true before moving on]
```

---

## Common Anti-Patterns

| Anti-Pattern | What it looks like | Instead |
|-------------|-------------------|---------|
| **Horizontal Acts** | Act 1: All DB. Act 2: All API. Act 3: All UI. | Each Act delivers a full vertical slice |
| **Mega-Act** | One Act with 20 tasks | Break into 2-3 Acts of 3-7 tasks each |
| **Micro-Act** | An Act with 1 task | Merge with the previous or next Act |
| **No exit criteria** | "Act 1 done" with no verification | Explicit, testable checks |
| **All sequential** | No parallelism within Acts | Find independent tasks and run them together |
| **Skipping review** | "I'll review at the end" | Review after each Act, not at the end |
| **No foundation Act** | Jump straight to features | Act 1 should set up auth, CI/CD, project structure |
| **No polish Act** | "It works" = "It's done" | Final Act for error handling, mobile, performance |
