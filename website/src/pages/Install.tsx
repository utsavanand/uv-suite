import { motion } from "framer-motion";
import { useState } from "react";

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

type Persona = "spike" | "sport" | "professional" | "auto";

const personas: Record<
  Persona,
  {
    label: string;
    desc: string;
    effort: string;
    guardrails: string;
    model: string;
    cmd: string;
  }
> = {
  spike: {
    label: "Spike",
    desc: "Research and documentation",
    effort: "max",
    guardrails: "Doc slop",
    model: "Opus",
    cmd: "spike",
  },
  sport: {
    label: "Sport",
    desc: "New projects, prototyping",
    effort: "high",
    guardrails: "None",
    model: "Sonnet",
    cmd: "sport",
  },
  professional: {
    label: "Professional",
    desc: "Production code",
    effort: "high",
    guardrails: "All 6",
    model: "Inherit",
    cmd: "pro",
  },
  auto: {
    label: "Auto",
    desc: "Fully autonomous",
    effort: "max",
    guardrails: "All 6",
    model: "Inherit",
    cmd: "auto",
  },
};

export function Install() {
  const [persona, setPersona] = useState<Persona>("professional");

  return (
    <div className="space-y-16">
      <motion.section {...fade}>
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight">
          Install
        </h1>
        <p className="mt-4 max-w-xl text-base text-text-secondary leading-relaxed">
          One command. 8 agents, 12 skills, 28 hooks, 6 guardrails, 4 personas.
          Auto-installs into the current project on first launch.
        </p>
      </motion.section>

      {/* Quick install */}
      <section>
        <h2 className="text-xl font-semibold">Quick install</h2>
        <div className="mt-4 rounded-lg bg-surface-code border border-border-light p-5">
          <pre className="text-sm leading-relaxed text-text-secondary">
            {`$ npm install -g uv-suite
$ uvs claude ${personas[persona].cmd}     # auto-installs on first launch`}
          </pre>
        </div>
        <p className="mt-3 text-xs text-text-tertiary">
          The CLI is{" "}
          <code className="bg-surface-dim px-1 py-0.5 rounded">uvs</code>, not{" "}
          <code className="bg-surface-dim px-1 py-0.5 rounded">uv</code> — that
          name belongs to Astral's Python package manager. Or{" "}
          <code className="bg-surface-dim px-1 py-0.5 rounded">
            npx uv-suite install
          </code>{" "}
          for an explicit install.
        </p>
      </section>

      {/* Persona selector */}
      <section>
        <h2 className="text-xl font-semibold">Choose a persona</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Different contexts need different rigor. The persona sets model,
          effort, guardrails, and permissions.
        </p>

        <div className="mt-4 flex gap-px overflow-hidden rounded-t-lg bg-border-light">
          {(Object.keys(personas) as Persona[]).map((p) => (
            <button
              key={p}
              onClick={() => setPersona(p)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                persona === p
                  ? "bg-surface text-text-primary"
                  : "bg-surface-dim text-text-tertiary hover:text-text-secondary"
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
              <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                For
              </div>
              <div className="mt-1 text-sm">{personas[persona].desc}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                Model
              </div>
              <div className="mt-1 text-sm">{personas[persona].model}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                Effort
              </div>
              <div className="mt-1 text-sm">{personas[persona].effort}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                Guardrails
              </div>
              <div className="mt-1 text-sm">{personas[persona].guardrails}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border-light">
            <code className="text-xs text-text-tertiary">
              $ uvs claude {personas[persona].cmd}
            </code>
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
                { cat: "Agents", n: "8", loc: ".claude/agents/*.md" },
                { cat: "Skills", n: "12", loc: ".claude/skills/*/SKILL.md" },
                { cat: "Hooks", n: "~28", loc: ".claude/hooks/*.sh" },
                { cat: "Guardrails", n: "6", loc: ".claude/rules/*.md" },
                { cat: "Personas", n: "4", loc: ".claude/personas/*.json" },
                { cat: "Settings", n: "1", loc: ".claude/settings.json" },
              ].map((r) => (
                <tr
                  key={r.cat}
                  className="border-b border-border-light last:border-0"
                >
                  <td className="px-4 py-2.5 font-medium">{r.cat}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.n}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-text-tertiary">
                    {r.loc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Common commands */}
      <section>
        <h2 className="text-xl font-semibold">Common commands</h2>
        <div className="mt-4 rounded-lg bg-surface-code border border-border-light p-5">
          <pre className="text-xs leading-relaxed text-text-secondary">
            {`$ uvs claude pro       # Claude Code, Professional persona
$ uvs codex auto       # Codex, Auto persona
$ uvs pro              # Shorthand for uvs claude pro
$ uvs watch            # Open the Watchtower dashboard
$ uvs install          # Explicit install
$ uvs info             # Show what's installed`}
          </pre>
        </div>
      </section>

      {/* Project structure */}
      <section>
        <h2 className="text-xl font-semibold">
          Project structure after install
        </h2>
        <pre className="mt-4 rounded-lg bg-surface-code border border-border-light p-5 text-xs leading-loose text-text-secondary overflow-x-auto">
          {`.claude/
  settings.json          Permissions and hooks (seeded from your persona)
  agents/                8 agent definitions (canonical .md)
  skills/                12 slash commands
  hooks/                 ~28 hook scripts
  rules/                 6 anti-slop guardrails (Pro / Auto only)
  personas/              4 persona configs
.codex/agents/           8 Codex agent definitions (generated)
.cursor/rules/           8 Cursor rule definitions (generated)
AGENTS.md                Codex instruction file
DANGER-ZONES.md          Risky areas (commit this)
.uv-suite-state/         Session metadata + counters (gitignored)
uv-out/                  Agent output artifacts (gitignored)
  sessions/<sid>/checkpoints/   Per-session checkpoints`}
        </pre>
      </section>
    </div>
  );
}
