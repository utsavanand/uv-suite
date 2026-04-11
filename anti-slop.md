# UV Suite — Anti-Slop Guardrails

How to detect and prevent AI-generated low-quality output in code, documentation, and architecture decisions.

---

## What Is AI Slop?

AI slop is output that looks correct and professional but adds no value — or actively degrades the codebase. It's the AI equivalent of writing to fill space rather than to communicate.

Slop is insidious because it passes casual review. It compiles. It doesn't throw errors. It looks like "good code." But it:
- Obscures actual logic behind unnecessary abstractions
- Inflates codebases with boilerplate that must be maintained
- Creates a false sense of quality ("there are comments, so it must be documented")
- Makes future changes harder by adding indirection
- Trains humans to skim AI output rather than verify it

**The core problem:** AI models optimize for "looks like good code" rather than "is good code." These are different things.

---

## Slop Categories and Detection

### Category 1: Comment Slop

**Pattern:** Comments that restate the code without adding information.

```typescript
// BAD — the comment adds nothing
// Initialize the database connection
const db = initDatabase();

// Set the user's name
user.name = newName;

// Loop through the items
for (const item of items) {

// Return the result
return result;
```

```typescript
// GOOD — the comment explains why, not what
// Retry with exponential backoff because the API rate-limits 
// at 100 req/min and our batch size exceeds that
const db = initDatabase({ retries: 3, backoff: 'exponential' });

// Normalize Unicode before comparison — we've seen cases where 
// visually identical names fail equality checks (NFD vs NFC)
user.name = newName.normalize('NFC');
```

**Detection rule:** If deleting the comment and reading the code tells you the same thing, the comment is slop. Comments should explain *why*, not *what*.

**Anti-slop action:** Delete the comment. If the code needs explaining, rename the variable or function instead.

### Category 2: Over-Engineering Slop

**Pattern:** Abstractions, patterns, and indirection that serve no current purpose.

```typescript
// BAD — AbstractFactory for a single implementation
interface PaymentProcessor {
  process(payment: Payment): Promise<Result>;
}

class PaymentProcessorFactory {
  static create(type: string): PaymentProcessor {
    switch (type) {
      case 'stripe':
        return new StripePaymentProcessor();
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }
}

class StripePaymentProcessor implements PaymentProcessor {
  async process(payment: Payment): Promise<Result> {
    return stripe.charges.create({ amount: payment.amount });
  }
}

// Usage
const processor = PaymentProcessorFactory.create('stripe');
await processor.process(payment);
```

```typescript
// GOOD — direct call, add abstraction when you need a second implementation
await stripe.charges.create({ amount: payment.amount });
```

**Detection rules:**
- Interface with only one implementation
- Factory that creates only one type
- Abstract class with only one subclass
- Wrapper that adds no behavior
- Configuration for values that never change
- Generic type parameter that's always the same concrete type

**Anti-slop action:** Delete the abstraction. Call the thing directly. Add abstraction when (not before) you need it.

### Category 3: Error Handling Slop

**Pattern:** Try/catch blocks around code that can't throw, or that catch and re-throw without adding value.

```typescript
// BAD — JSON.stringify doesn't throw on a plain object
try {
  const json = JSON.stringify(user);
  return json;
} catch (error) {
  console.error('Failed to stringify user:', error);
  throw error;
}

// BAD — catch, log, re-throw (the caller will handle it)
try {
  const result = await fetchUser(id);
  return result;
} catch (error) {
  console.error('Error fetching user:', error);
  throw error;
}
```

```typescript
// GOOD — no try/catch needed, let errors propagate naturally
const json = JSON.stringify(user);
return json;

// GOOD — handle the error meaningfully, or don't catch it
const result = await fetchUser(id);
return result;
```

**Detection rules:**
- Try/catch where the try block can't throw
- Catch that only logs and re-throws
- Error handling for impossible states (e.g., validating that a non-null TypeScript param isn't null)
- Defensive checks deep inside internal functions (trust the caller at internal boundaries)

**Anti-slop action:** Remove the try/catch. Only add error handling at system boundaries (user input, network calls, file I/O) or when you're converting the error to a different type.

### Category 4: Test Slop

**Pattern:** Tests that pass but don't actually verify behavior.

```typescript
// BAD — tests existence, not behavior
test('should create a user', () => {
  const user = createUser({ name: 'Alice' });
  expect(user).toBeTruthy();
});

// BAD — tests that the mock returns what you told it to return
test('should fetch user', async () => {
  mockFetch.mockResolvedValue({ name: 'Alice' });
  const user = await fetchUser(1);
  expect(user.name).toBe('Alice');  // You're testing your mock, not your code
});

// BAD — snapshot test on a trivial component
test('should render', () => {
  const tree = renderer.create(<Button>Click</Button>);
  expect(tree.toJSON()).toMatchSnapshot();
});
```

```typescript
// GOOD — tests specific behavior and edge cases
test('createUser hashes password before storing', async () => {
  const user = await createUser({ name: 'Alice', password: 'secret123' });
  expect(user.passwordHash).not.toBe('secret123');
  expect(await bcrypt.compare('secret123', user.passwordHash)).toBe(true);
});

// GOOD — tests the actual integration
test('fetchUser returns null for non-existent user', async () => {
  const user = await fetchUser(999);
  expect(user).toBeNull();
});

// GOOD — tests meaningful behavior
test('Button calls onClick when clicked', () => {
  const onClick = jest.fn();
  render(<Button onClick={onClick}>Click</Button>);
  fireEvent.click(screen.getByText('Click'));
  expect(onClick).toHaveBeenCalledTimes(1);
});
```

**Detection rules:**
- `expect(x).toBeTruthy()` or `expect(x).toBeDefined()` — almost always slop
- Tests where the mock is the only thing being tested
- Snapshot tests on simple components
- Tests with no assertions
- Tests that test framework behavior ("does React render a component?")
- Tests where the test name doesn't match what's being tested

**Anti-slop action:** Delete the test if it can't be made meaningful. Rewrite to test actual behavior.

### Category 5: Documentation Slop

**Pattern:** Documentation that uses words without saying anything specific.

```markdown
# BAD
## Overview
This module provides a robust, scalable, and maintainable solution for 
handling user authentication. It leverages industry-standard best practices 
to ensure secure and efficient credential management.

## Features
- Comprehensive authentication flow
- Secure credential storage
- Flexible configuration options
- Extensive error handling
```

```markdown
# GOOD
## What This Does
Handles login, signup, and session management using bcrypt for password 
hashing and JWT for session tokens. Sessions expire after 24 hours.

## Endpoints
- POST /auth/signup — Create account (email + password)
- POST /auth/login — Get JWT token
- POST /auth/logout — Invalidate session
- GET /auth/me — Get current user (requires valid JWT)
```

**Detection rules:**
- "Robust", "scalable", "maintainable", "comprehensive", "extensive" — adjectives that describe nothing
- "Leverages", "utilizes", "facilitates" — verbs that avoid specificity
- "Best practices", "industry-standard" — appeals to authority without naming the practice
- Feature lists that could describe any system
- Overview sections that don't tell you what the system actually does

**Anti-slop action:** Replace every vague adjective with a specific fact. "Robust error handling" → "Retries 3 times with exponential backoff on 5xx errors." If you can't make it specific, delete it.

### Category 6: Architecture Slop

**Pattern:** Architecture decisions that sound sophisticated but don't match the actual requirements.

```
BAD: "We should use an event-driven microservices architecture with CQRS 
and event sourcing" (for a CRUD app with 3 endpoints and 100 users)

BAD: "Let's implement a service mesh with circuit breakers and distributed 
tracing" (for a monolith that runs on a single server)

BAD: "We need a Kafka cluster for message passing" (for 10 events per minute)
```

```
GOOD: "A monolith with 3 REST endpoints is sufficient. We'll extract 
services if/when we need independent scaling or deployment."

GOOD: "PostgreSQL handles our query patterns well. We'll add read replicas 
if/when we exceed 10k queries per second."

GOOD: "A simple task queue (Redis + BullMQ) handles our async processing. 
We'll move to Kafka if/when we need multi-consumer event streaming."
```

**Detection rules:**
- Does the proposed architecture match the actual scale? (10 users don't need microservices)
- Is the complexity justified by a specific requirement, or just "best practice"?
- Could a simpler approach work? If yes, why isn't it the recommendation?
- Are buzzwords being used as reasoning? ("event-driven" is not a reason, it's a pattern)

**Anti-slop action:** Challenge every component: "What breaks if we don't have this?" If the answer is "nothing for the next 6 months," remove it.

---

## The Anti-Slop Agent

### Role

The Anti-Slop Guard runs as a **post-review layer** on any AI-generated output. It's separate from the Reviewer because it catches a different class of problems — not bugs, but quality inflation.

### What It Does

1. **Scans code** for comment slop, over-engineering, unnecessary error handling
2. **Scans tests** for meaningless assertions, mock-only tests, snapshot noise
3. **Scans documentation** for vague adjectives, appeals to authority, non-specific claims
4. **Scans architecture** for unjustified complexity, buzzword-driven design
5. **Reports** findings with specific locations and recommended fixes

### Output Format

```markdown
## Anti-Slop Report

### Summary
- **Code slop:** 3 findings (1 high, 2 medium)
- **Test slop:** 2 findings (2 high)
- **Doc slop:** 1 finding (1 medium)
- **Architecture slop:** 0 findings

### Findings

#### [HIGH] Comment slop in src/auth/login.ts:15
```typescript
// Initialize the authentication service
const authService = new AuthService();
```
**Fix:** Delete the comment. The code is self-explanatory.

#### [HIGH] Test slop in src/auth/__tests__/login.test.ts:23
```typescript
test('should login', () => {
  const result = login('user@example.com', 'password');
  expect(result).toBeTruthy();
});
```
**Fix:** Test specific behavior: does it return a JWT? Does it fail for wrong password?

#### [MEDIUM] Over-engineering in src/utils/logger.ts
Logger wraps console.log with no additional behavior. 4 files, 80 lines.
**Fix:** Use console.log directly. Add a wrapper when you actually need log levels or transport.
```

### Severity Levels

| Severity | Meaning | Action |
|----------|---------|--------|
| **High** | Actively harmful — obscures logic, creates false quality signals, or inflates maintenance burden | Must fix before merge |
| **Medium** | Wasteful — adds no value but doesn't actively harm | Fix when touching the file |
| **Low** | Stylistic — slight preference for less AI-sounding output | Author's discretion |

---

## Integrating Anti-Slop Into Your Workflow

### As a Claude Code hook

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if the code just written contains AI slop: unnecessary comments that restate the code, over-engineered abstractions for simple operations, try/catch blocks around code that can't throw, or vague documentation. If you find slop, list the specific lines and what to fix. If clean, say 'No slop detected.'"
          }
        ]
      }
    ]
  }
}
```

### As a pre-merge check

```bash
# In your CI pipeline or as a Git hook
claude -p "Run the anti-slop guard on $(git diff --name-only main..HEAD). 
Report any findings in the UV Suite anti-slop format." \
  --model claude-opus-4-6 \
  --max-turns 5
```

### As a skill

```yaml
# .claude/skills/slop-check/SKILL.md
---
name: slop-check
description: >
  Run UV Suite anti-slop guard on recent changes. Detects comment slop, 
  over-engineering, test slop, documentation slop, and architecture slop.
user-invocable: true
context: fork
agent: anti-slop-guard
effort: high
---

Review the following changes for AI slop patterns:

!`git diff --cached || git diff`

Check for:
1. **Comment slop** — comments that restate the code
2. **Over-engineering** — abstractions with only one implementation
3. **Error handling slop** — try/catch around code that can't throw
4. **Test slop** — tests with toBeTruthy(), mock-only tests, snapshot noise
5. **Documentation slop** — vague adjectives, non-specific claims
6. **Architecture slop** — unjustified complexity, buzzword-driven design

For each finding, report: severity, location, the problematic code, and the fix.
```

### As a review checklist addition

Add to every code review:

```markdown
## Anti-Slop Checklist
- [ ] No comments that restate the code
- [ ] No abstractions with only one implementation
- [ ] No try/catch around code that can't throw
- [ ] Tests verify behavior, not existence
- [ ] Documentation uses specific facts, not vague adjectives
- [ ] Architecture complexity matches actual requirements
```

---

## Training Your Own Judgment

The Anti-Slop Guard is a tool, but the real guard is **your judgment**. Over time, you should develop intuition for slop without needing the agent.

**Practice exercise:** After each AI coding session, review the output and ask:
1. Can I delete any comments and lose no information?
2. Can I inline any abstractions and simplify the code?
3. Can I delete any error handling for impossible cases?
4. Do my tests fail when I introduce a bug? (Try it.)
5. Does my documentation tell someone something they couldn't learn by reading the code?

If the answer is "yes" to any of 1-4, you found slop. Fix it, and notice the pattern for next time.

---

## The Slop Spectrum

Not all AI output is slop, and not all human output is slop-free. The goal isn't "zero AI patterns" — it's "every line of code earns its place."

```
Pure slop ←──────────────────────────────────→ Earned code

"// Initialize    "Retry 3x with     Direct API call     Well-named function
  the database"    backoff because    with clear error     with clear contract
                   API rate-limits    message for the     and meaningful tests
                   at 100 req/min"    user"
```

The Anti-Slop Guard catches the left side. Your engineering judgment builds the right side.
