import { motion } from 'framer-motion'
import { useState } from 'react'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }

const acts = [
  {
    act: 1, name: 'Foundation', delivers: 'Auth, user model, CI/CD',
    tasks: [
      { id: '1.1', task: 'Project scaffolding', deps: '--', agent: 'You', size: 'S' },
      { id: '1.2', task: 'User DB schema', deps: '--', agent: 'You', size: 'S' },
      { id: '1.3', task: 'Auth: signup, login, logout', deps: '1.1, 1.2', agent: 'You', size: 'M' },
      { id: '1.4', task: 'CI/CD pipeline', deps: '1.1', agent: 'DevOps', size: 'M' },
      { id: '1.5', task: 'Auth integration tests', deps: '1.3', agent: 'Test Writer', size: 'S' },
      { id: '1.6', task: 'Security review', deps: '1.3', agent: 'Security', size: 'S' },
    ],
  },
  {
    act: 2, name: 'Listings', delivers: 'Create, edit, view property listings',
    tasks: [
      { id: '2.1', task: 'Listing DB schema', deps: '--', agent: 'You', size: 'S' },
      { id: '2.2', task: 'Listing CRUD API', deps: '2.1', agent: 'You', size: 'M' },
      { id: '2.3', task: 'Image upload', deps: '2.1', agent: 'You', size: 'M' },
      { id: '2.4', task: 'Create listing UI', deps: '2.2, 2.3', agent: 'You', size: 'L' },
      { id: '2.5', task: 'Listing detail page', deps: '2.2', agent: 'You', size: 'M' },
    ],
  },
  {
    act: 3, name: 'Search', delivers: 'Search, filter, browse listings',
    tasks: [
      { id: '3.1', task: 'Search API', deps: '--', agent: 'You', size: 'L' },
      { id: '3.2', task: 'Results page', deps: '3.1', agent: 'You', size: 'M' },
      { id: '3.3', task: 'Map integration', deps: '3.1', agent: 'You', size: 'M' },
    ],
  },
  {
    act: 4, name: 'Booking', delivers: 'Book and pay for listings',
    tasks: [
      { id: '4.1', task: 'Booking schema', deps: '--', agent: 'You', size: 'S' },
      { id: '4.2', task: 'Booking API', deps: '4.1', agent: 'You', size: 'M' },
      { id: '4.3', task: 'Stripe integration', deps: '4.2', agent: 'You', size: 'L' },
      { id: '4.4', task: 'Booking UI', deps: '4.2, 4.3', agent: 'You', size: 'L' },
      { id: '4.5', task: 'Payment security review', deps: '4.3', agent: 'Security', size: 'M' },
    ],
  },
]

const budgets = [
  { task: 'Code generation', b: 3, why: 'If 3 attempts fail, the problem is understanding, not syntax' },
  { task: 'Bug fix', b: 2, why: 'Agent has the error. 2 tries, then it needs human context' },
  { task: 'Refactoring', b: 2, why: 'Rework means the target design wasn\'t clear' },
  { task: 'Test writing', b: 3, why: 'Iteration expected, but >3 means the code is hard to test' },
  { task: 'Review', b: 1, why: 'Present findings once. Don\'t iterate on judgment.' },
  { task: 'Architecture', b: 1, why: 'Collaborative. Present options, human decides.' },
]

export function UVActs() {
  const [sel, setSel] = useState(0)

  return (
    <div className="space-y-16">
      <motion.section {...fade}>
        <p className="text-xs font-medium tracking-wide uppercase text-text-tertiary">UV Acts</p>
        <h1 className="mt-2 text-[40px] font-semibold leading-[1.1] tracking-tight">
          Build, deliver, present.
        </h1>
        <p className="mt-4 max-w-xl text-base text-text-secondary leading-relaxed">
          Acts replace sprints when one developer orchestrates AI agents. Sequential phases,
          parallel tasks within, human checkpoints at boundaries.
        </p>
      </motion.section>

      {/* Acts example */}
      <section>
        <h2 className="text-xl font-semibold">Example: Airbnb-like app</h2>
        <p className="mt-1 text-sm text-text-secondary">Each Act delivers a complete vertical slice. Select an Act.</p>

        <div className="mt-4 flex gap-px overflow-hidden rounded-t-lg bg-border-light">
          {acts.map((a, i) => (
            <button
              key={a.act}
              onClick={() => setSel(i)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                sel === i ? 'bg-surface text-text-primary' : 'bg-surface-dim text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Act {a.act}: {a.name}
            </button>
          ))}
        </div>

        <motion.div
          key={sel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="rounded-b-lg border border-border-light border-t-0"
        >
          <div className="px-5 py-3 border-b border-border-light">
            <span className="text-sm font-medium">Act {acts[sel].act}: {acts[sel].name}</span>
            <span className="ml-3 text-xs text-text-tertiary">{acts[sel].delivers}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-tertiary border-b border-border-light">
                <th className="px-5 py-2 font-medium w-12">#</th>
                <th className="px-5 py-2 font-medium">Task</th>
                <th className="px-5 py-2 font-medium hidden md:table-cell">Depends on</th>
                <th className="px-5 py-2 font-medium">Agent</th>
                <th className="px-5 py-2 font-medium w-12">Size</th>
              </tr>
            </thead>
            <tbody>
              {acts[sel].tasks.map(t => (
                <tr key={t.id} className="border-b border-border-light last:border-0">
                  <td className="px-5 py-2 font-mono text-xs text-text-tertiary">{t.id}</td>
                  <td className="px-5 py-2">{t.task}</td>
                  <td className="px-5 py-2 text-text-tertiary hidden md:table-cell">{t.deps}</td>
                  <td className="px-5 py-2 text-text-secondary">{t.agent}</td>
                  <td className="px-5 py-2 font-mono text-xs text-text-tertiary">{t.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </section>

      {/* Properties */}
      <section>
        <h2 className="text-xl font-semibold">What makes an Act</h2>
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border-light md:grid-cols-3">
          {[
            { p: 'Sequential', d: 'Act 2 starts after Act 1 is verified' },
            { p: 'Self-contained', d: 'Each delivers usable functionality' },
            { p: 'Vertical', d: 'Full stack: DB through API to UI' },
            { p: 'Verifiable', d: 'Explicit, testable exit criteria' },
            { p: 'Parallelizable', d: 'Tasks within an Act run simultaneously' },
            { p: 'Human-gated', d: 'Every boundary is a human checkpoint' },
          ].map(item => (
            <div key={item.p} className="bg-surface p-4">
              <div className="text-sm font-medium">{item.p}</div>
              <div className="mt-0.5 text-xs text-text-tertiary">{item.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Human-in-the-loop */}
      <section>
        <h2 className="text-xl font-semibold">Human-in-the-loop</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Agents escalate instead of looping. Four intervention types.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border-light md:grid-cols-4">
          {[
            { type: 'Teach', desc: 'Domain knowledge, conventions, history' },
            { type: 'Debug', desc: 'Environmental issues, missing config' },
            { type: 'Taste', desc: 'Naming, UX, architecture tradeoffs' },
            { type: 'Clarify', desc: 'Ambiguous or conflicting requirements' },
          ].map(item => (
            <div key={item.type} className="bg-surface p-4">
              <div className="text-sm font-medium">{item.type}</div>
              <div className="mt-0.5 text-xs text-text-tertiary leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cycle budgets */}
      <section>
        <h2 className="text-xl font-semibold">Cycle budgets</h2>
        <p className="mt-1 text-sm text-text-secondary">Maximum agent attempts before mandatory escalation.</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Task type</th>
                <th className="px-4 py-2.5 font-medium w-20">Budget</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map(row => (
                <tr key={row.task} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-2.5 font-medium">{row.task}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1.5 w-4 rounded-full ${i <= row.b ? 'bg-text-primary' : 'bg-border-light'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-text-tertiary hidden md:table-cell">{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
