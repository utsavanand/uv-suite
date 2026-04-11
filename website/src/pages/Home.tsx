import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SubsystemDiagram } from '../components/SubsystemDiagram'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } }

export function Home() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <motion.section className="pt-8" {...fade}>
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight md:text-[56px]">
          AI-assisted development,<br />structured.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-secondary">
          UV Suite is a portable framework for building software with AI agents.
          It works with any codebase, any team, any tool.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/install" className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
            Get started
          </Link>
          <Link to="/uv-acts" className="rounded-full bg-surface-dim px-5 py-2 text-sm font-medium text-text-primary hover:bg-border-light transition-colors">
            How it works
          </Link>
        </div>
      </motion.section>

      {/* Three subsystems */}
      <section>
        <SubsystemDiagram />
      </section>

      {/* What each subsystem does — dense grid */}
      <section className="grid gap-12 md:grid-cols-3">
        {[
          {
            title: 'UV Index',
            subtitle: 'Understand, learn, remember',
            desc: 'Map codebases with the Cartographer agent. Capture context. Build persistent memory across sessions.',
            link: '/uv-index',
            color: 'text-uv-index',
          },
          {
            title: 'UV Acts',
            subtitle: 'Build, deliver, present',
            desc: 'Deliver software in Acts with parallel tasks, cycle budgets, and human checkpoints. Spec to ship.',
            link: '/uv-acts',
            color: 'text-uv-acts',
          },
          {
            title: 'UV Guard',
            subtitle: 'Review, harden, protect',
            desc: 'Catch AI slop in real time. Code review, security audit, danger zone enforcement. Quality immune system.',
            link: '/uv-guard',
            color: 'text-uv-guard',
          },
        ].map(s => (
          <Link key={s.title} to={s.link} className="group">
            <h3 className={`text-lg font-semibold ${s.color}`}>{s.title}</h3>
            <p className="mt-0.5 text-xs text-text-tertiary">{s.subtitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.desc}</p>
            <span className="mt-3 inline-block text-xs font-medium text-accent group-hover:underline">
              Learn more
            </span>
          </Link>
        ))}
      </section>

      {/* Numbers — compact row */}
      <section className="grid grid-cols-4 gap-px overflow-hidden rounded-lg bg-border-light">
        {[
          { n: '10', l: 'Agents' },
          { n: '9', l: 'Skills' },
          { n: '5', l: 'Hooks' },
          { n: '4', l: 'Personas' },
        ].map(s => (
          <div key={s.l} className="bg-surface py-5 text-center">
            <div className="text-2xl font-semibold tracking-tight">{s.n}</div>
            <div className="mt-0.5 text-xs text-text-tertiary">{s.l}</div>
          </div>
        ))}
      </section>

      {/* Human-in-the-loop — compact */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Human-in-the-loop by design</h2>
        <p className="mt-2 max-w-xl text-sm text-text-secondary leading-relaxed">
          Agents get cycle budgets. When stuck, they escalate instead of looping.
          Every intervention teaches the agent something permanent.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border-light md:grid-cols-4">
          {[
            { type: 'Teach', desc: 'Domain knowledge the agent lacks' },
            { type: 'Debug', desc: 'When the agent is stuck after retries' },
            { type: 'Taste', desc: 'Subjective and aesthetic decisions' },
            { type: 'Clarify', desc: 'Ambiguous or conflicting requirements' },
          ].map(item => (
            <div key={item.type} className="bg-surface p-4">
              <div className="text-sm font-semibold">{item.type}</div>
              <div className="mt-1 text-xs text-text-tertiary leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Personas — dense table */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Four personas</h2>
        <p className="mt-2 max-w-xl text-sm text-text-secondary leading-relaxed">
          Different contexts need different rigor. Pick a persona when you start a session.
        </p>
        <div className="mt-6 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Persona</th>
                <th className="px-4 py-2.5 font-medium">For</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Effort</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Hooks</th>
                <th className="px-4 py-2.5 font-medium">Launch</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Spike', f: 'Research, docs', effort: 'max', hooks: '1', cmd: './uv.sh spike' },
                { name: 'Sport', f: 'New projects', effort: 'high', hooks: '1', cmd: './uv.sh sport' },
                { name: 'Professional', f: 'Production code', effort: 'high', hooks: '5', cmd: './uv.sh pro' },
                { name: 'Auto', f: 'Autonomous execution', effort: 'max', hooks: '2', cmd: './uv.sh auto' },
              ].map(p => (
                <tr key={p.name} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{p.f}</td>
                  <td className="px-4 py-2.5 text-text-secondary hidden md:table-cell">{p.effort}</td>
                  <td className="px-4 py-2.5 text-text-secondary hidden md:table-cell">{p.hooks}</td>
                  <td className="px-4 py-2.5"><code className="text-xs bg-surface-dim px-1.5 py-0.5 rounded">{p.cmd}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Portability — three columns, tight */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Works everywhere</h2>
        <p className="mt-2 text-sm text-text-secondary">Pure Markdown methodology. Tool-specific wrappers are thin.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            { tool: 'Claude Code', path: '.claude/agents/*.md' },
            { tool: 'Cursor', path: '.cursor/rules/*.mdc' },
            { tool: 'OpenAI Codex', path: '.codex/agents/*.toml' },
          ].map(t => (
            <div key={t.tool}>
              <div className="text-sm font-medium">{t.tool}</div>
              <code className="mt-1 block text-xs text-text-tertiary">{t.path}</code>
            </div>
          ))}
        </div>
      </section>

      {/* Install CTA */}
      <section className="rounded-lg bg-surface-dim p-8 text-center">
        <h2 className="text-xl font-semibold">One command to install</h2>
        <code className="mt-3 inline-block rounded bg-surface px-4 py-2 text-sm text-text-secondary border border-border-light">
          ./install.sh --persona pro
        </code>
        <p className="mt-3 text-xs text-text-tertiary">
          10 agents, 9 skills, 5 hooks, 6 guardrails, 4 personas. Ready to use.
        </p>
        <Link to="/install" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          Installation guide
        </Link>
      </section>
    </div>
  )
}
