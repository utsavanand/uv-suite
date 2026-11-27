# UV Suite — Danger zones

Code that looks simple but carries a hidden invariant, an undocumented constraint, or history that is not visible from reading it. Each repository lists its own in `DANGER-ZONES.md` at the project root (or one per service). The implement, review and ship skills read this file before touching or judging a listed file.

## The file

```markdown
# Danger Zones

## payments/webhook-handler.ts
**Risk:** Payload size limit (1MB) is enforced by the gateway, not this service.
If you add fields to the webhook response, you may silently exceed the limit.
**Discovered:** 2026-03-15, production incident PLAT-4521
**Rule:** Any change to webhook payloads must include a size check test.

## auth/session-store.ts
**Risk:** Sessions are stored in Redis with a 24h TTL, but the JWT expiry is 72h.
**Discovered:** 2026-01-20, user reports of random logouts
**Rule:** JWT expiry and Redis TTL must always be changed together.
```

One heading per file or module, then Risk, Discovered and Rule. Keep the Rule testable.

## What the agent does

- Before modifying any file, check `DANGER-ZONES.md` for an entry covering it.
- When the file is listed, flag it to the human before proceeding and quote the Rule.
- Include the danger context in the PR description.
- After an incident or a review that caught a non-obvious risk, add the file. Prune entries whose risk was designed away.

## Inline markers

Code-level annotations the agent must honour:

```typescript
// @danger: Called by the cron job AND the API handler; changes must handle both.
// See: DANGER-ZONES.md#dual-invocation-handlers
// @agent-skip: Manually optimized. Do not refactor.
// @agent-ask: Edge cases here; ask before modifying.
// @agent-test: Any change here requires the full integration suite.
```

- `@danger` and `@agent-ask`: read the linked section, then ask before changing the block.
- `@agent-skip`: leave the block as it is, even when a refactor seems obvious.
- `@agent-test`: run the named suite before calling the change done.
