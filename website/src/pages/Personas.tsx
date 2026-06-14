import { motion } from "framer-motion";

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

const personas = [
  {
    name: "Spike",
    purpose: "Research & document",
    model: "Opus",
    effort: "max",
    edits: "Blocked",
    guardrails: "Doc slop",
    gates: "After each map",
    cmd: "uvs claude spike",
  },
  {
    name: "Sport",
    purpose: "Build new things",
    model: "Sonnet",
    effort: "high",
    edits: "Allowed",
    guardrails: "None",
    gates: "End only",
    cmd: "uvs claude sport",
  },
  {
    name: "Professional",
    purpose: "Ship to prod",
    model: "Inherit",
    effort: "high",
    edits: "Allowed",
    guardrails: "All 6",
    gates: "Every Act",
    cmd: "uvs claude pro",
  },
  {
    name: "Auto",
    purpose: "Let it run",
    model: "Inherit",
    effort: "max",
    edits: "Allowed",
    guardrails: "All 6",
    gates: "Final output",
    cmd: "uvs claude auto",
  },
];

const when = [
  {
    sit: "Joining a new codebase",
    mode: "Spike",
    why: "Understand before changing. Writes docs, not code.",
  },
  {
    sit: "Architecture review",
    mode: "Spike",
    why: "Map the system, write ADRs, document findings.",
  },
  {
    sit: "Prototyping a demo",
    mode: "Sport",
    why: "Move fast, iterate freely, quality comes later.",
  },
  {
    sit: "Hackathon or new project",
    mode: "Sport",
    why: "Get the foundation down without review gates.",
  },
  {
    sit: "Fixing a production bug",
    mode: "Professional",
    why: "Every change matters. Full review rigor.",
  },
  {
    sit: "Feature on an existing service",
    mode: "Professional",
    why: "Team depends on this code. Slop-checked.",
  },
  {
    sit: "Well-scoped task with a spec",
    mode: "Auto",
    why: "Let the agent build, test, review end-to-end.",
  },
  {
    sit: "Batch of small tasks",
    mode: "Auto",
    why: "Agent handles repetitive work autonomously.",
  },
];

export function Personas() {
  return (
    <div className="space-y-16">
      <motion.section {...fade}>
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight">
          Personas
        </h1>
        <p className="mt-4 max-w-xl text-base text-text-secondary leading-relaxed">
          Four modes for different contexts. A persona sets the model, effort,
          what the agent may write, which guardrails run, and where the human
          gates are. Pick one when you start a session.
        </p>
      </motion.section>

      {/* Matrix */}
      <section>
        <div className="overflow-x-auto rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Persona</th>
                <th className="px-4 py-2.5 font-medium">Purpose</th>
                <th className="px-4 py-2.5 font-medium">Model</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">
                  Effort
                </th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">
                  Edits
                </th>
                <th className="px-4 py-2.5 font-medium">Guardrails</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">
                  Human gates
                </th>
              </tr>
            </thead>
            <tbody>
              {personas.map((p) => (
                <tr
                  key={p.name}
                  className="border-b border-border-light last:border-0"
                >
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                    {p.name}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {p.purpose}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{p.model}</td>
                  <td className="px-4 py-2.5 text-text-secondary hidden md:table-cell">
                    {p.effort}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary hidden md:table-cell">
                    {p.edits}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {p.guardrails}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary hidden md:table-cell">
                    {p.gates}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {personas.map((p) => (
            <code
              key={p.name}
              className="block rounded-lg bg-surface-code border border-border-light px-3 py-2 text-xs text-text-secondary"
            >
              $ {p.cmd}
            </code>
          ))}
        </div>
      </section>

      {/* When to use what */}
      <section>
        <h2 className="text-xl font-semibold">When to use what</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Situation</th>
                <th className="px-4 py-2.5 font-medium">Mode</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">
                  Why
                </th>
              </tr>
            </thead>
            <tbody>
              {when.map((r) => (
                <tr
                  key={r.sit}
                  className="border-b border-border-light last:border-0"
                >
                  <td className="px-4 py-2.5 text-text-secondary">{r.sit}</td>
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                    {r.mode}
                  </td>
                  <td className="px-4 py-2.5 text-text-tertiary hidden md:table-cell">
                    {r.why}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Progressions */}
      <section>
        <h2 className="text-xl font-semibold">Common progressions</h2>
        <div className="mt-4 space-y-2 text-sm text-text-secondary">
          <p>
            <span className="font-medium text-text-primary">
              Spike → Sport → Professional
            </span>{" "}
            — understand, explore, harden
          </p>
          <p>
            <span className="font-medium text-text-primary">Spike → Auto</span>{" "}
            — research thoroughly, then let the agent execute
          </p>
          <p>
            <span className="font-medium text-text-primary">
              Sport → Professional
            </span>{" "}
            — prototype fast, switch to rigor when it matters
          </p>
        </div>
      </section>
    </div>
  );
}
