import { motion } from "framer-motion";

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

const skills = [
  {
    cmd: "/uvs-understand",
    does: "Map a codebase or whole stack — auto-detects repo vs stack",
    agent: "Cartographer",
  },
  {
    cmd: "/uvs-spec",
    does: "Turn requirements into a structured technical specification",
    agent: "Spec Writer",
  },
  {
    cmd: "/uvs-architect",
    does: "Design architecture, decompose into Acts with cycle budgets",
    agent: "Architect",
  },
  {
    cmd: "/uvs-test",
    does: "Write tests or evals: --unit / --integration / --eval",
    agent: "Test / Eval Writer",
  },
  {
    cmd: "/uvs-review",
    does: "Multi-specialist review; --security / --slop / --architecture",
    agent: "Reviewer / Guard",
  },
  {
    cmd: "/uvs-prototype",
    does: "Build a static React prototype",
    agent: "Prototype Builder",
  },
  { cmd: "/uvs-qa", does: "Browser QA via Playwright MCP", agent: "—" },
  {
    cmd: "/uvs-investigate",
    does: "Systematic root-cause debugging",
    agent: "—",
  },
  {
    cmd: "/uvs-commit",
    does: "Review → test → commit (and optionally open a PR)",
    agent: "—",
  },
  {
    cmd: "/uvs-session",
    does: "Lifecycle: init | checkpoint | restore | end | auto",
    agent: "—",
  },
  {
    cmd: "/uvs-lite",
    does: "Toggle terse output mode — persists across turns",
    agent: "—",
  },
  {
    cmd: "/uvs-help",
    does: "List every skill, agent, hook, guardrail, and persona",
    agent: "—",
  },
];

const flows = [
  {
    title: "Existing codebase",
    steps: ["/uvs-understand", "/uvs-session checkpoint", "/uvs-review"],
  },
  {
    title: "New project",
    steps: ["/uvs-spec", "/uvs-architect", "/uvs-test + /uvs-review"],
  },
  {
    title: "Reviewing a PR",
    steps: ["/uvs-review [branch]", "/uvs-review --security"],
  },
  { title: "Shipping", steps: ["/uvs-session checkpoint", "/uvs-commit"] },
];

export function Skills() {
  return (
    <div className="space-y-16">
      <motion.section {...fade}>
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight">
          The lifecycle, as slash commands
        </h1>
        <p className="mt-4 max-w-xl text-base text-text-secondary leading-relaxed">
          12 skills map the software development lifecycle onto your agent —
          understand, spec, architect, test, review, commit. Each{" "}
          <code className="text-sm bg-surface-dim px-1.5 py-0.5 rounded">
            SKILL.md
          </code>{" "}
          is a thin orchestrator that dispatches to the right agent with the
          right context — and reads prior{" "}
          <code className="text-sm bg-surface-dim px-1.5 py-0.5 rounded">
            uv-out/
          </code>{" "}
          artifacts automatically.
        </p>
      </motion.section>

      {/* Skill table */}
      <section>
        <div className="overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Command</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">
                  Agent
                </th>
                <th className="px-4 py-2.5 font-medium">What it does</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => (
                <tr
                  key={s.cmd}
                  className="border-b border-border-light last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">
                    {s.cmd}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary hidden md:table-cell whitespace-nowrap">
                    {s.agent}
                  </td>
                  <td className="px-4 py-2.5 text-text-tertiary">{s.does}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Common flows */}
      <section>
        <h2 className="text-xl font-semibold">Start here</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Pick the path that matches what you're doing.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {flows.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-border-light p-5"
            >
              <div className="text-sm font-semibold">{f.title}</div>
              <ol className="mt-3 space-y-1.5">
                {f.steps.map((step, i) => (
                  <li
                    key={step}
                    className="flex items-center gap-2 text-xs text-text-secondary"
                  >
                    <span className="size-4 rounded-full bg-surface-dim text-center text-[10px] leading-4 text-text-tertiary">
                      {i + 1}
                    </span>
                    <code className="text-text-secondary">{step}</code>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
