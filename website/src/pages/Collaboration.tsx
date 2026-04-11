import { motion } from 'framer-motion'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }

export function Collaboration() {
  return (
    <div className="space-y-16">
      <motion.section {...fade}>
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight">Collaboration</h1>
        <p className="mt-4 max-w-xl text-base text-text-secondary leading-relaxed">
          How teams share best practices, mark danger zones, and evolve
          their AI-assisted development standards together.
        </p>
      </motion.section>

      {/* Sharing levels */}
      <section>
        <h2 className="text-xl font-semibold">Sharing levels</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Level</th>
                <th className="px-4 py-2.5 font-medium">What you share</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Mechanism</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Audience</th>
              </tr>
            </thead>
            <tbody>
              {[
                { level: 'Personal', what: 'Your agents, memory, preferences', how: '~/.claude/agents/', who: 'Just you' },
                { level: 'Project', what: 'Agents, danger zones, standards', how: '.claude/ committed to repo', who: 'Everyone on the project' },
                { level: 'Team', what: 'Cross-project standards', how: 'Shared repo or package', who: 'Everyone on the team' },
                { level: 'Community', what: 'UV Suite methodology', how: 'Open-source publication', who: 'Anyone' },
              ].map(r => (
                <tr key={r.level} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-2.5 font-medium">{r.level}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.what}</td>
                  <td className="px-4 py-2.5 text-text-tertiary hidden md:table-cell">{r.how}</td>
                  <td className="px-4 py-2.5 text-text-tertiary hidden md:table-cell">{r.who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Danger zones */}
      <section>
        <h2 className="text-xl font-semibold">Danger zones</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Areas of the codebase where agents are likely to break things. Hidden invariants, undocumented constraints.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-tertiary">DANGER-ZONES.md</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              A file at the project root. Documents the risk, how it was discovered, and the rule for safe modification.
              The danger-zone-check hook reads this file automatically.
            </p>
            <pre className="mt-3 rounded-lg bg-surface-code border border-border-light p-4 text-xs leading-loose text-text-secondary">
{`## payments/webhook-handler.ts
Risk: Payload size limit (1MB)
Discovered: 2026-03-15, PLAT-4521
Rule: Payload changes need size test`}
            </pre>
          </div>
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Inline annotations</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Code-level markers that agents detect and act on. Lightweight human-in-the-loop directly in the code.
            </p>
            <pre className="mt-3 rounded-lg bg-surface-code border border-border-light p-4 text-xs leading-loose text-text-secondary">
{`// @danger: Called by cron AND API.
// Changes must handle both contexts.
export function processPayment() {}

// @agent-skip: Manually optimized.
// @agent-ask: Ask before modifying.
// @agent-test: Run full suite.`}
            </pre>
          </div>
        </div>
      </section>

      {/* Maturity model */}
      <section>
        <h2 className="text-xl font-semibold">Danger zone maturity</h2>
        <p className="mt-1 text-sm text-text-secondary">Most teams should aim for Stage 3.</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium w-12">Stage</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                { n: 1, name: 'Reactive', desc: 'Dangers discovered through incidents. Captured ad-hoc.' },
                { n: 2, name: 'Documented', desc: 'DANGER-ZONES.md exists. Added during retros.' },
                { n: 3, name: 'Enforced', desc: 'Inline @danger annotations. Hook warns on modification. Part of exit criteria.', target: true },
                { n: 4, name: 'Predictive', desc: 'New code reviewed for potential danger zones before incidents.' },
              ].map(r => (
                <tr key={r.n} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-2.5 text-text-tertiary">{r.n}</td>
                  <td className="px-4 py-2.5 font-medium">
                    {r.name}
                    {r.target && <span className="ml-2 text-[10px] text-accent border border-accent/30 rounded px-1">target</span>}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lifecycle */}
      <section>
        <h2 className="text-xl font-semibold">Sharing lifecycle</h2>
        <div className="mt-4 grid grid-cols-4 gap-px overflow-hidden rounded-lg bg-border-light">
          {[
            { step: 'Discover', desc: 'Learn something the hard way. Incident, review, agent misbehavior.' },
            { step: 'Capture', desc: 'Record it. Danger zone, best practice, agent update, or standard.' },
            { step: 'Distribute', desc: 'Commit to repo. Agents pick it up automatically.' },
            { step: 'Evolve', desc: 'Review periodically. Remove what\'s resolved. Update what\'s changed.' },
          ].map(item => (
            <div key={item.step} className="bg-surface p-4">
              <div className="text-sm font-medium">{item.step}</div>
              <div className="mt-1 text-xs text-text-tertiary leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What to commit */}
      <section>
        <h2 className="text-xl font-semibold">What to commit</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">File</th>
                <th className="px-4 py-2.5 font-medium w-20">Commit?</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Why</th>
              </tr>
            </thead>
            <tbody>
              {[
                { file: '.claude/settings.json', commit: 'Yes', why: 'Shared project settings' },
                { file: '.claude/settings.local.json', commit: 'No', why: 'Personal preferences (persona choice)' },
                { file: '.claude/agents/*.md', commit: 'Yes', why: 'Team shares agent definitions' },
                { file: '.claude/skills/', commit: 'Yes', why: 'Team shares workflows' },
                { file: '.claude/hooks/*.sh', commit: 'Yes', why: 'Team shares automation' },
                { file: 'DANGER-ZONES.md', commit: 'Yes', why: 'Everyone needs to know the risks' },
              ].map(r => (
                <tr key={r.file} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">{r.file}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.commit}</td>
                  <td className="px-4 py-2.5 text-text-tertiary hidden md:table-cell">{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
