# Specialist: Integration tests

Dispatch the `test-writer` agent to write cross-component / real-dependency tests for the target.

## Agent

`Agent(test-writer)`.

## What to produce

Integration tests that exercise more than one component together and use real dependencies
where the unit suite would stub them. The point is to catch bugs that only appear at the
seams — wiring, contracts, serialization, transactions, ordering.

Cover:
- The interaction across components: data flows in at one entry point and the assertion
  checks the observable effect at the far end (a returned value, a stored row, an emitted
  event, an HTTP response).
- Contract boundaries between modules — the shape and types one component passes to another,
  including the failure shape when the downstream call errors.
- Real dependency behavior that stubs hide: actual DB constraints and transactions, real
  serialization/deserialization round-trips, real file I/O, real client/server handshakes.
- Failure propagation across the boundary — a downstream timeout, rejection, or constraint
  violation surfaces correctly to the caller.

## Quality bar

- Assert the real cross-component effect, not an intermediate value you control. If every
  collaborator is mocked, this is a unit test mislabeled — use real dependencies.
- Specific assertions only: specific persisted state, specific response, specific error.
  No existence-only checks (`toBeTruthy`/`toBeDefined`).
- Set up and tear down real state deterministically (fresh DB/schema, temp dirs, fixed
  seeds). No reliance on leftover state from a prior test or run.
- Avoid flakiness: no fixed `sleep` for async settling — poll/await a condition. Pin clocks
  and seeds where timing or randomness affects the result.
- Every test must be able to fail for a real integration bug. See `rules/test-slop.md`.

## Conventions

Match the existing test patterns shown in the gathered context (framework, fixture/factory
style, how the project marks or isolates integration vs unit tests, directory location). Use
the project test command from that context to confirm the tests run and pass before reporting.
