import { motion } from 'framer-motion'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }

export function UVIndex() {
  return (
    <div className="space-y-16">
      <motion.section {...fade}>
        <p className="text-xs font-medium tracking-wide uppercase text-uv-index">UV Index</p>
        <h1 className="mt-2 text-[40px] font-semibold leading-[1.1] tracking-tight">
          Understand, learn, remember.
        </h1>
        <p className="mt-4 max-w-xl text-base text-text-secondary leading-relaxed">
          Before you build, you need context. UV Index maps codebases, captures knowledge,
          and persists it so agents don't rediscover what you already know.
        </p>
      </motion.section>

      {/* Cartographer */}
      <section>
        <h2 className="text-xl font-semibold">Cartographer agent</h2>
        <p className="mt-1 text-sm text-text-secondary">
          The first agent you use in any new codebase. Give it a directory, get a structured overview.
        </p>
        <div className="mt-6 grid gap-px overflow-hidden rounded-lg bg-border-light md:grid-cols-2">
          <div className="bg-surface p-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-tertiary">When to use</h3>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li>First day on a new codebase</li>
              <li>Entering an unfamiliar area</li>
              <li>Before making changes you don't understand</li>
              <li>Onboarding a team member</li>
            </ul>
          </div>
          <div className="bg-surface p-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-tertiary">What it produces</h3>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li>Architecture overview with Mermaid diagrams</li>
              <li>Service dependency graph</li>
              <li>Business domain map</li>
              <li>Key sequence diagrams</li>
              <li>Entry points guide</li>
            </ul>
          </div>
        </div>
        <div className="mt-4">
          <code className="text-xs text-text-tertiary bg-surface-dim px-2 py-1 rounded">/map-codebase src/payments/</code>
        </div>
      </section>

      {/* Capabilities */}
      <section>
        <h2 className="text-xl font-semibold">Capabilities</h2>
        <div className="mt-6 divide-y divide-border-light">
          {[
            {
              title: 'Codebase mapping',
              desc: 'Architecture diagrams, dependency graphs, business domain maps, and sequence diagrams. Generated from code analysis, not templates.',
            },
            {
              title: 'Context capture',
              desc: 'Databases, APIs, service topologies, undocumented conventions. The knowledge that exists in people\'s heads but not in the code.',
            },
            {
              title: 'Memory',
              desc: 'Project-level (CLAUDE.md), personal (agent memory), and team-level (shared standards, danger zones). Agents build on what was learned before.',
            },
            {
              title: 'Documentation generation',
              desc: 'Structured docs from code analysis. What the system actually does, not what it aspires to do. Slop-checked in Spike persona.',
            },
          ].map(cap => (
            <div key={cap.title} className="py-5">
              <h3 className="text-sm font-semibold">{cap.title}</h3>
              <p className="mt-1 text-sm text-text-secondary leading-relaxed">{cap.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Memory levels */}
      <section>
        <h2 className="text-xl font-semibold">Memory levels</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Level</th>
                <th className="px-4 py-2.5 font-medium">Mechanism</th>
                <th className="px-4 py-2.5 font-medium">Scope</th>
              </tr>
            </thead>
            <tbody>
              {[
                { level: 'Project', mech: 'CLAUDE.md, portable standards', scope: 'Everyone on the project' },
                { level: 'Personal', mech: 'Agent memory system', scope: 'You, across all projects' },
                { level: 'Team', mech: 'Shared standards, danger zones', scope: 'Everyone on the team' },
              ].map(r => (
                <tr key={r.level} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-2.5 font-medium">{r.level}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.mech}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
