# UV Suite — Code slop rules

Five rules the reviewer and the anti-slop guard check on every diff. Each names the pattern, how to spot it, and the fix. Documentation has its own rule in doc-slop-rules.md.

## 1. Over-engineering

Abstractions and indirection that serve no current purpose: an interface with one implementation, a factory that creates one type, a wrapper that adds no behaviour, configuration for values that never change, a builder for a two-field object.

```typescript
// Slop: a factory and an interface for the one processor that exists
interface PaymentProcessor { process(p: Payment): Promise<Result> }
class PaymentProcessorFactory { static create(type: string): PaymentProcessor { … } }

// Not slop: call the thing directly; add the interface when a second processor exists
await stripe.charges.create({ amount: payment.amount });
```

Fix: delete the abstraction and call the thing directly. Add it when, not before, a second implementation needs it.

## 2. Architecture

Complexity assumed rather than earned: microservices for ten users, a message queue for ten events a minute, GraphQL for five fixed queries, "event-driven" offered as a reason instead of a pattern.

For every component ask: what breaks if we don't have this? Nothing for six months: remove it. Needed when X happens: write down the trigger, don't build it. Users can't complete the core flow: keep it.

Fix: the simplest architecture that meets today's requirement, with the concrete trigger that would justify more written down ("add caching when p99 exceeds 500 ms").

## 3. Error handling

Try/catch around code that cannot throw; a catch that only logs and rethrows; checks for states the type system already rules out; catching a generic error when only one specific error is possible.

```typescript
// Slop: JSON.stringify of a plain object cannot throw, and the catch adds nothing
try { return JSON.stringify(user); } catch (e) { console.error(e); throw e; }

// Not slop: handle the error where it means something, at the boundary
try { return await fetchUser(id); } catch { return { error: "User not found", status: 404 }; }
```

Fix: remove the handler. Handle errors at system boundaries (user input, network, file I/O) or when converting them to another type; let internal errors propagate.

## 4. Comments

A comment that restates the code: "initialize the database", "loop through the items", "return the result". If deleting it loses nothing, it is slop.

```typescript
// Slop
// Set the user's name
user.name = newName;

// Not slop: the why the code cannot say
// Normalize before comparing: visually identical names failed equality (NFD vs NFC)
user.name = newName.normalize("NFC");
```

Fix: delete it, or rename the thing so the code reads without it. Keep only comments that carry what the code cannot: a business decision, a workaround, a non-obvious constraint.

## 5. Tests

Tests that pass without verifying behaviour: `toBeTruthy()` or `toBeDefined()` as the only assertion; a test whose mock is the only thing tested; a snapshot of a trivial component; no assertion at all; copy-pasted variants that should be one parameterised test.

```typescript
// Slop: tests existence, not behaviour
expect(createUser({ name: "Alice" })).toBeTruthy();

// Not slop: a specific value and a specific side effect
const user = await createUser({ name: "Alice", password: "secret123" });
expect(user.passwordHash).not.toBe("secret123");
expect(await bcrypt.compare("secret123", user.passwordHash)).toBe(true);
```

Fix: delete tests that cannot fail meaningfully; rewrite the rest to assert specific values, side effects and error conditions. Ask of each: would this catch a real bug?
