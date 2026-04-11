import { motion } from 'framer-motion'
import { useState } from 'react'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }

const slop = [
  {
    name: 'Comments',
    bad: `// Initialize the database connection\nconst db = initDatabase();\n\n// Set the user's name\nuser.name = newName;`,
    good: `// Retry with exponential backoff because\n// the API rate-limits at 100 req/min\nconst db = initDatabase({ retries: 3 });`,
    rule: 'If deleting the comment loses no information, delete it.',
  },
  {
    name: 'Over-engineering',
    bad: `interface PaymentProcessor { ... }\nclass PaymentProcessorFactory { ... }\nclass StripePaymentProcessor { ... }\n\n// 3 classes for one Stripe call`,
    good: `await stripe.charges.create({\n  amount: payment.amount\n});\n\n// Add abstraction when you have 2+`,
    rule: 'One implementation? One factory type? Delete the abstraction.',
  },
  {
    name: 'Tests',
    bad: `test('should create user', () => {\n  const user = createUser({ name: 'Alice' });\n  expect(user).toBeTruthy();\n});`,
    good: `test('hashes password before storing', async () => {\n  const user = await createUser({ password: 's' });\n  expect(user.passwordHash).not.toBe('s');\n});`,
    rule: 'Would this test catch a real bug? If not, rewrite or delete.',
  },
  {
    name: 'Docs',
    bad: `## Overview\nThis module provides a robust, scalable,\nand maintainable solution for handling\nuser authentication.`,
    good: `## What this does\nHandles login, signup, and session management.\nbcrypt for passwords, JWT for sessions.\nSessions expire after 24 hours.`,
    rule: 'Replace every vague adjective with a specific fact.',
  },
  {
    name: 'Architecture',
    bad: `"Event-driven microservices with CQRS\nand event sourcing"\n\n(for a CRUD app with 100 users)`,
    good: `"Monolith with 3 REST endpoints.\nExtract services when we need\nindependent scaling."`,
    rule: 'What breaks without this? If nothing for 6 months, remove it.',
  },
  {
    name: 'Error handling',
    bad: `try {\n  const json = JSON.stringify(user);\n  return json;\n} catch (error) {\n  console.error('Failed:', error);\n  throw error;\n}`,
    good: `const json = JSON.stringify(user);\nreturn json;\n\n// Only handle at system boundaries`,
    rule: 'Try/catch around code that can\'t throw is noise.',
  },
]

export function UVGuard() {
  const [sel, setSel] = useState(0)

  return (
    <div className="space-y-16">
      <motion.section {...fade}>
        <p className="text-xs font-medium tracking-wide uppercase text-uv-guard">UV Guard</p>
        <h1 className="mt-2 text-[40px] font-semibold leading-[1.1] tracking-tight">
          Review, harden, protect.
        </h1>
        <p className="mt-4 max-w-xl text-base text-text-secondary leading-relaxed">
          AI-generated code compiles. It passes tests. It looks professional.
          But it can subtly degrade your codebase. UV Guard catches what humans miss.
        </p>
      </motion.section>

      {/* Slop detector */}
      <section>
        <h2 className="text-xl font-semibold">Anti-slop detector</h2>
        <p className="mt-1 text-sm text-text-secondary">Six categories. Select one to see the pattern.</p>

        <div className="mt-4 flex gap-px overflow-hidden rounded-t-lg bg-border-light">
          {slop.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setSel(i)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                sel === i ? 'bg-surface text-text-primary' : 'bg-surface-dim text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <motion.div
          key={sel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="rounded-b-lg border border-border-light border-t-0 overflow-hidden"
        >
          <div className="grid md:grid-cols-2">
            <div className="p-5 md:border-r border-border-light">
              <div className="text-xs font-medium uppercase tracking-wide text-uv-guard mb-3">Slop</div>
              <pre className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap">{slop[sel].bad}</pre>
            </div>
            <div className="p-5 border-t md:border-t-0 border-border-light">
              <div className="text-xs font-medium uppercase tracking-wide text-green-600 dark:text-green-400 mb-3">Clean</div>
              <pre className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap">{slop[sel].good}</pre>
            </div>
          </div>
          <div className="border-t border-border-light bg-surface-dim px-5 py-3 text-xs text-text-secondary">
            {slop[sel].rule}
          </div>
        </motion.div>
      </section>

      {/* Guard agents */}
      <section>
        <h2 className="text-xl font-semibold">Guard agents</h2>
        <div className="mt-4 divide-y divide-border-light rounded-lg border border-border-light">
          {[
            {
              name: 'Reviewer', cmd: '/review',
              checks: ['Correctness', 'Security (OWASP)', 'Performance', 'Maintainability', 'AI slop'],
            },
            {
              name: 'Anti-Slop Guard', cmd: '/slop-check',
              checks: ['Comment slop', 'Over-engineering', 'Test slop', 'Doc slop', 'Architecture slop', 'Error handling'],
            },
            {
              name: 'Security Agent', cmd: '/security-review',
              checks: ['OWASP Top 10', 'Dependency CVEs', 'Hardcoded secrets', 'Auth checks', 'Input validation'],
            },
          ].map(agent => (
            <div key={agent.name} className="flex items-start gap-6 p-5">
              <div className="min-w-[140px]">
                <div className="text-sm font-medium">{agent.name}</div>
                <code className="mt-1 text-xs text-text-tertiary">{agent.cmd}</code>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {agent.checks.map(c => (
                  <span key={c} className="text-xs text-text-secondary">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Danger zones */}
      <section>
        <h2 className="text-xl font-semibold">Danger zones</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Teams mark risky areas in DANGER-ZONES.md. Agents check before modifying flagged code.
        </p>
        <pre className="mt-4 rounded-lg bg-surface-code border border-border-light p-5 text-xs leading-loose text-text-secondary overflow-x-auto">
{`## payments/webhook-handler.ts
Risk: Payload size limit (1MB) enforced by gateway, not this service.
Rule: Any webhook payload change must include a size check test.

## auth/session-store.ts
Risk: Redis TTL (24h) != JWT expiry (72h). Must change together.
Rule: JWT and Redis TTL must always be modified in the same PR.`}
        </pre>
      </section>
    </div>
  )
}
