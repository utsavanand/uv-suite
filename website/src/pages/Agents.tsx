import { motion } from 'framer-motion'
import { useState } from 'react'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }

const agents = [
  { id: 1, name: 'Cartographer', sub: 'Index', model: 'Opus', budget: 1, cmd: '/map-codebase', purpose: 'Map a codebase: architecture, dependencies, domains, sequences', when: 'Entering a new codebase or unfamiliar area', readonly: true, outputs: ['Architecture overview', 'Dependency graph', 'Domain map', 'Sequence diagrams', 'Entry points'] },
  { id: 2, name: 'Spec Writer', sub: 'Acts', model: 'Opus', budget: 1, cmd: '/spec', purpose: 'Convert requirements into structured technical specifications', when: 'Starting any new feature or project', readonly: false, outputs: ['Technical specification'] },
  { id: 3, name: 'Architect', sub: 'Acts', model: 'Opus', budget: 1, cmd: '/architect', purpose: 'Design system architecture and decompose into Acts', when: 'After spec is approved, before coding', readonly: false, outputs: ['Architecture decisions', 'System design', 'Acts breakdown', 'Dependency graph'] },
  { id: 4, name: 'Reviewer', sub: 'Guard', model: 'Opus', budget: 1, cmd: '/review', purpose: 'Code review for correctness, security, performance, maintainability', when: 'Before every merge; on-demand during development', readonly: true, outputs: ['Review report'] },
  { id: 5, name: 'Test Writer', sub: 'Acts', model: 'Sonnet', budget: 3, cmd: '/write-tests', purpose: 'Generate meaningful tests that verify behavior', when: 'After implementing a feature, before review', readonly: false, outputs: ['Test files', 'Coverage report'] },
  { id: 6, name: 'Eval Writer', sub: 'Acts', model: 'Opus', budget: 2, cmd: '/write-evals', purpose: 'Write evaluations for AI system prompts', when: 'Building or modifying AI/LLM features', readonly: false, outputs: ['Eval suite', 'Rubric'] },
  { id: 7, name: 'Anti-Slop Guard', sub: 'Guard', model: 'Opus', budget: 1, cmd: '/slop-check', purpose: 'Detect AI-generated slop in code, docs, architecture', when: 'Post-review layer before merging', readonly: true, outputs: ['Anti-slop report'] },
  { id: 8, name: 'Prototype Builder', sub: 'Acts', model: 'Sonnet', budget: 3, cmd: '/prototype', purpose: 'Build static-site prototypes, demos, and presentations', when: 'Concept exploration, stakeholder demos', readonly: false, outputs: ['Static site', 'PDF export'] },
  { id: 9, name: 'DevOps', sub: 'Acts', model: 'Sonnet', budget: 2, cmd: '/devops', purpose: 'CI/CD, infrastructure-as-code, deployment automation', when: 'Setting up pipelines, debugging deploys', readonly: false, outputs: ['CI/CD config', 'Infrastructure', 'Runbook'] },
  { id: 10, name: 'Security', sub: 'Guard', model: 'Opus', budget: 1, cmd: '/security-review', purpose: 'Vulnerability scanning, OWASP checks, dependency audit', when: 'Pre-merge on auth, payments, data access', readonly: true, outputs: ['Security report', 'Dependency audit'] },
]

const subFilters = ['All', 'Index', 'Acts', 'Guard'] as const

export function Agents() {
  const [filter, setFilter] = useState<string>('All')
  const [expanded, setExpanded] = useState<number | null>(null)

  const filtered = filter === 'All' ? agents : agents.filter(a => a.sub === filter)

  return (
    <div className="space-y-16">
      <motion.section {...fade}>
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight">Agents</h1>
        <p className="mt-4 max-w-xl text-base text-text-secondary leading-relaxed">
          10 roles, each with a defined purpose, model, cycle budget, and slash command.
          Designed as portable roles. Implemented as Claude Code subagents.
        </p>
      </motion.section>

      {/* Filter */}
      <div className="flex gap-px overflow-hidden rounded-lg bg-border-light w-fit">
        {subFilters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              filter === f ? 'bg-surface text-text-primary' : 'bg-surface-dim text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {f} {f !== 'All' && <span className="text-text-tertiary ml-1">({agents.filter(a => a.sub === f).length})</span>}
          </button>
        ))}
      </div>

      {/* Agent list */}
      <div className="divide-y divide-border-light rounded-lg border border-border-light overflow-hidden">
        {filtered.map(agent => (
          <div
            key={agent.id}
            className="cursor-pointer hover:bg-surface-dim/50 transition-colors"
            onClick={() => setExpanded(expanded === agent.id ? null : agent.id)}
          >
            <div className="flex items-center gap-4 px-5 py-3.5">
              <span className="w-6 text-xs text-text-tertiary font-mono">{agent.id}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{agent.name}</span>
                  {agent.readonly && <span className="text-[10px] text-text-tertiary border border-border-light rounded px-1">read-only</span>}
                </div>
                <p className="text-xs text-text-tertiary mt-0.5 truncate">{agent.purpose}</p>
              </div>
              <code className="text-xs text-text-tertiary hidden md:block">{agent.cmd}</code>
              <span className="text-xs text-text-tertiary w-12 text-right hidden md:block">{agent.model}</span>
              <div className="flex gap-0.5 w-12 justify-end">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1.5 w-3 rounded-full ${i <= agent.budget ? 'bg-text-primary' : 'bg-border-light'}`} />
                ))}
              </div>
            </div>

            {expanded === agent.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-5 pb-4 pt-0 ml-10"
              >
                <div className="grid gap-4 md:grid-cols-3 text-xs">
                  <div>
                    <span className="font-medium uppercase tracking-wide text-text-tertiary">When to use</span>
                    <p className="mt-1 text-text-secondary leading-relaxed">{agent.when}</p>
                  </div>
                  <div>
                    <span className="font-medium uppercase tracking-wide text-text-tertiary">Subsystem</span>
                    <p className="mt-1 text-text-secondary">UV {agent.sub}</p>
                  </div>
                  <div>
                    <span className="font-medium uppercase tracking-wide text-text-tertiary">Outputs</span>
                    <p className="mt-1 text-text-secondary">{agent.outputs.join(', ')}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Adoption path */}
      <section>
        <h2 className="text-xl font-semibold">Where to start</h2>
        <p className="mt-1 text-sm text-text-secondary">Don't adopt all 10 at once.</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium w-8"></th>
                <th className="px-4 py-2.5 font-medium">Phase</th>
                <th className="px-4 py-2.5 font-medium">Agents</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Why</th>
              </tr>
            </thead>
            <tbody>
              {[
                { n: 1, phase: 'Start here', agents: 'Cartographer + Reviewer', why: 'Understand first, review always' },
                { n: 2, phase: 'Building', agents: 'Spec Writer + Architect', why: 'Structured delivery with Acts' },
                { n: 3, phase: 'Quality', agents: 'Test Writer + Anti-Slop Guard', why: 'Automated quality gates' },
                { n: 4, phase: 'AI features', agents: 'Eval Writer', why: 'Can\'t ship AI without evals' },
                { n: 5, phase: 'Production', agents: 'Security + DevOps', why: 'Harden before you ship' },
                { n: 6, phase: 'Demos', agents: 'Prototype Builder', why: 'Stakeholder communication' },
              ].map(r => (
                <tr key={r.n} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-2.5 text-xs text-text-tertiary">{r.n}</td>
                  <td className="px-4 py-2.5 font-medium">{r.phase}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.agents}</td>
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
