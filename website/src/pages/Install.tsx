import { motion } from 'framer-motion'
import { useState } from 'react'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }

type Persona = 'spike' | 'sport' | 'professional' | 'auto'

const personas: Record<Persona, { label: string; desc: string; effort: string; hooks: string; model: string }> = {
  spike: { label: 'Spike', desc: 'Research and documentation', effort: 'max', hooks: '1 (doc slop)', model: 'Opus' },
  sport: { label: 'Sport', desc: 'New projects, prototyping', effort: 'high', hooks: '1 (lint)', model: 'Sonnet' },
  professional: { label: 'Professional', desc: 'Production code', effort: 'high', hooks: '5 (all)', model: 'Inherit' },
  auto: { label: 'Auto', desc: 'Fully autonomous', effort: 'max', hooks: '2 (lint + block)', model: 'Inherit' },
}

export function Install() {
  const [persona, setPersona] = useState<Persona>('professional')

  return (
    <div className="space-y-16">
      <motion.section {...fade}>
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight">Install</h1>
        <p className="mt-4 max-w-xl text-base text-text-secondary leading-relaxed">
          One command. 10 agents, 9 skills, 5 hooks, 6 guardrails, 4 personas. Pick a persona and go.
        </p>
      </motion.section>

      {/* Quick install */}
      <section>
        <h2 className="text-xl font-semibold">Quick install</h2>
        <div className="mt-4 rounded-lg bg-surface-code border border-border-light p-5">
          <code className="text-sm text-text-secondary">$ ./install.sh --persona {persona}</code>
        </div>
      </section>

      {/* Persona selector */}
      <section>
        <h2 className="text-xl font-semibold">Choose a persona</h2>
        <p className="mt-1 text-sm text-text-secondary">Different contexts need different rigor. The persona sets model, effort, hooks, and permissions.</p>

        <div className="mt-4 flex gap-px overflow-hidden rounded-t-lg bg-border-light">
          {(Object.keys(personas) as Persona[]).map(p => (
            <button
              key={p}
              onClick={() => setPersona(p)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                persona === p ? 'bg-surface text-text-primary' : 'bg-surface-dim text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {personas[p].label}
            </button>
          ))}
        </div>

        <motion.div
          key={persona}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="rounded-b-lg border border-border-light border-t-0 p-5"
        >
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary">For</div>
              <div className="mt-1 text-sm">{personas[persona].desc}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Model</div>
              <div className="mt-1 text-sm">{personas[persona].model}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Effort</div>
              <div className="mt-1 text-sm">{personas[persona].effort}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Hooks</div>
              <div className="mt-1 text-sm">{personas[persona].hooks}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border-light">
            <code className="text-xs text-text-tertiary">$ ./uv.sh {persona === 'professional' ? 'pro' : persona}</code>
          </div>
        </motion.div>
      </section>

      {/* What gets installed */}
      <section>
        <h2 className="text-xl font-semibold">What gets installed</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium w-12">Count</th>
                <th className="px-4 py-2.5 font-medium">Location</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: 'Agents', n: '10', loc: '.claude/agents/*.md' },
                { cat: 'Skills', n: '9', loc: '.claude/skills/*/SKILL.md' },
                { cat: 'Hooks', n: '4', loc: '.claude/hooks/*.sh' },
                { cat: 'Guardrails', n: '6', loc: '.claude/rules/*.md' },
                { cat: 'Personas', n: '4', loc: '.claude/personas/*.json' },
                { cat: 'Settings', n: '1', loc: '.claude/settings.json' },
                { cat: 'Launcher', n: '1', loc: './uv.sh' },
              ].map(r => (
                <tr key={r.cat} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-2.5 font-medium">{r.cat}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.n}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-text-tertiary">{r.loc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* All 9 skills */}
      <section>
        <h2 className="text-xl font-semibold">Skills</h2>
        <p className="mt-1 text-sm text-text-secondary">Slash commands that spawn the right agent with the right context.</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Command</th>
                <th className="px-4 py-2.5 font-medium">Agent</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">What it does</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cmd: '/map-codebase', agent: 'Cartographer', does: 'Architecture map, dependency graph, entry points' },
                { cmd: '/spec', agent: 'Spec Writer', does: 'Requirements to structured specification' },
                { cmd: '/architect', agent: 'Architect', does: 'System design, Acts breakdown with cycle budgets' },
                { cmd: '/review', agent: 'Reviewer', does: 'Correctness, security, performance, slop check' },
                { cmd: '/write-tests', agent: 'Test Writer', does: 'Meaningful tests matching project conventions' },
                { cmd: '/write-evals', agent: 'Eval Writer', does: 'AI/LLM feature evaluation cases' },
                { cmd: '/slop-check', agent: 'Anti-Slop Guard', does: '6 categories of AI slop detection' },
                { cmd: '/prototype', agent: 'Prototype Builder', does: 'Static React site, demo, or presentation' },
                { cmd: '/security-review', agent: 'Security', does: 'OWASP audit, dependency scan, secret detection' },
              ].map(r => (
                <tr key={r.cmd} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">{r.cmd}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.agent}</td>
                  <td className="px-4 py-2.5 text-text-tertiary hidden md:table-cell">{r.does}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hooks */}
      <section>
        <h2 className="text-xl font-semibold">Hooks</h2>
        <p className="mt-1 text-sm text-text-secondary">Fire automatically. You never invoke these.</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Hook</th>
                <th className="px-4 py-2.5 font-medium">Fires on</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">What it does</th>
              </tr>
            </thead>
            <tbody>
              {[
                { hook: 'auto-lint.sh', fires: 'Every file write', does: 'Runs prettier, ruff, or gofmt' },
                { hook: 'Real-time slop check', fires: 'Every file write', does: 'Haiku scans for obvious slop patterns' },
                { hook: 'danger-zone-check.sh', fires: 'Every file edit', does: 'Warns if file is in DANGER-ZONES.md' },
                { hook: 'block-destructive.sh', fires: 'Every bash command', does: 'Blocks rm -rf, force push, DROP TABLE' },
                { hook: 'session-review-reminder.sh', fires: 'Session ending', does: 'Reminds to review uncommitted changes' },
              ].map(r => (
                <tr key={r.hook} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">{r.hook}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.fires}</td>
                  <td className="px-4 py-2.5 text-text-tertiary hidden md:table-cell">{r.does}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Extending */}
      <section>
        <h2 className="text-xl font-semibold">Extending</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Add a custom agent</h3>
            <pre className="mt-3 rounded-lg bg-surface-code border border-border-light p-4 text-xs leading-loose text-text-secondary">
{`# .claude/agents/my-agent.md
---
name: my-agent
description: What it does
model: sonnet
---
You are [role]. Your job is to...`}
            </pre>
          </div>
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Add a custom guardrail</h3>
            <pre className="mt-3 rounded-lg bg-surface-code border border-border-light p-4 text-xs leading-loose text-text-secondary">
{`# .claude/rules/api-envelope.md
All API endpoints MUST return:
{ data, error, meta }

Do not return raw data
without the envelope.`}
            </pre>
          </div>
        </div>
      </section>

      {/* Project structure */}
      <section>
        <h2 className="text-xl font-semibold">Project structure after install</h2>
        <pre className="mt-4 rounded-lg bg-surface-code border border-border-light p-5 text-xs leading-loose text-text-secondary">
{`.claude/
  settings.json          Permissions, hooks (from persona)
  settings.local.json    Personal overrides (gitignored)
  agents/                10 agent definitions
  skills/                9 slash commands
  hooks/                 4 hook scripts
  rules/                 6 anti-slop guardrails
  personas/              4 persona configs
DANGER-ZONES.md          Risky areas (commit this)
uv.sh                   Session launcher`}
        </pre>
      </section>
    </div>
  )
}
