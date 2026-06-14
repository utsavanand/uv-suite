import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const lifecycle = [
  { step: "Understand", cmd: "/uvs-understand", out: "map-codebase.md" },
  { step: "Spec", cmd: "/uvs-spec", out: "specs/*.md" },
  { step: "Architect", cmd: "/uvs-architect", out: "architecture/*.md" },
  { step: "Test", cmd: "/uvs-test", out: "test files" },
  { step: "Review", cmd: "/uvs-review", out: "review-*.md" },
  { step: "Commit", cmd: "/uvs-commit", out: "checkpoint" },
];

const artifacts = [
  { w: "map-codebase.md", r: "/uvs-architect, /uvs-review" },
  { w: "specs/*.md", r: "/uvs-architect, /uvs-test" },
  { w: "architecture/*.md", r: "/uvs-review, /uvs-test" },
  { w: "review-*.md", r: "/uvs-review --slop" },
  { w: "checkpoints/*.md", r: "/uvs-session restore" },
];

const practices = [
  {
    t: "Understand before you change",
    d: "The first step on an unfamiliar codebase builds a map. Later stages read it instead of re-guessing the architecture.",
  },
  {
    t: "Anti-slop guardrails as you type",
    d: "Six rules catch comment, doc, test, error-handling, over-engineering, and architecture slop on every file write — not at review time.",
  },
  {
    t: "Human gates at the right boundaries",
    d: "Agents get cycle budgets and escalate when stuck. The Professional persona stops at every Act boundary instead of charging ahead.",
  },
  {
    t: "Context survives the session",
    d: "Per-session checkpoints capture state, decisions, and next steps — so restarting, compacting, or handing off never loses the thread.",
  },
];

export function Home() {
  return (
    <div className="space-y-8">
      {/* Hero — full-width, centered */}
      <motion.section className="pt-10 pb-4 text-center" {...fade}>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-tertiary">
          A wrapper over the agent you already use
        </p>
        <h1 className="mx-auto mt-4 max-w-4xl text-[44px] font-semibold leading-[1.05] tracking-tight md:text-[68px]">
          Best SDLC practices,
          <br />
          woven into the agent.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-text-secondary">
          UV Suite is a thin layer over Claude Code, Cursor, or Codex. It
          doesn't replace your agent — it makes the software development
          lifecycle the default path, and builds in the good practices you might
          not even know to ask for.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link
            to="/install"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
          <Link
            to="/skills"
            className="rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-dim transition-colors"
          >
            See the lifecycle
          </Link>
        </div>
        <p className="mt-6 text-xs text-text-tertiary">
          Wraps{" "}
          <span className="text-text-secondary">
            Claude Code · Cursor · Codex
          </span>{" "}
          — same agent, better defaults.
        </p>
      </motion.section>

      {/* Bento grid */}
      <section className="grid auto-rows-[minmax(0,auto)] grid-cols-1 gap-4 md:grid-cols-6">
        {/* Lifecycle — dominant wide card */}
        <BentoCard className="md:col-span-4">
          <CardLabel>The lifecycle is the product</CardLabel>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">
            Each stage is a slash command that spawns the right agent — and each
            reads what the previous stage wrote. You follow the process because
            it's the path of least resistance.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {lifecycle.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="rounded-lg border border-border-light bg-surface p-3"
              >
                <div className="font-mono text-[10px] text-text-tertiary">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-1 text-sm font-semibold">{s.step}</div>
                <code className="mt-1 block text-[10px] text-accent">
                  {s.cmd}
                </code>
                <div className="mt-1.5 text-[10px] text-text-tertiary">
                  → {s.out}
                </div>
              </motion.div>
            ))}
          </div>
        </BentoCard>

        {/* Numbers — tall narrow card */}
        <BentoCard className="md:col-span-2">
          <CardLabel>In the box</CardLabel>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {[
              { n: "12", l: "Skills" },
              { n: "8", l: "Agents" },
              { n: "6", l: "Guardrails" },
              { n: "4", l: "Personas" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-3xl font-semibold tracking-tight">
                  {s.n}
                </div>
                <div className="mt-0.5 text-xs text-text-tertiary">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-border-light pt-4 text-xs leading-relaxed text-text-tertiary">
            Pure-Markdown. Cursor & Codex variants generated from the canonical
            Claude Code defs.
          </div>
        </BentoCard>

        {/* Artifacts — wide card with mock + table */}
        <BentoCard className="md:col-span-3">
          <CardLabel>Every artifact lands in one place</CardLabel>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            A best practice you usually enforce by hand: maps, specs, decisions,
            reviews, and checkpoints all land in{" "}
            <code className="text-xs bg-surface-dim px-1 py-0.5 rounded">
              uv-out/
            </code>{" "}
            — captured next to the code, read by the next stage automatically.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <pre className="rounded-lg bg-surface-code border border-border-light p-4 text-[11px] leading-relaxed text-text-secondary">
              {`uv-out/
  map-codebase.md
  specs/*.md
  architecture/*.md
  review-*.md
  sessions/<sid>/
    checkpoints/*.md`}
            </pre>
            <div className="overflow-hidden rounded-lg border border-border-light">
              <table className="w-full text-[11px]">
                <tbody>
                  {artifacts.map((r) => (
                    <tr
                      key={r.w}
                      className="border-b border-border-light last:border-0"
                    >
                      <td className="px-2.5 py-1.5 font-mono text-text-secondary">
                        {r.w}
                      </td>
                      <td className="px-2.5 py-1.5 text-right text-text-tertiary">
                        {r.r.split(",")[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </BentoCard>

        {/* Enforced practices — wide card */}
        <BentoCard className="md:col-span-3">
          <CardLabel>Enforced, not suggested</CardLabel>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            The practices a seasoned team would insist on — on by default,
            whether or not you knew to ask.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {practices.map((p) => (
              <div
                key={p.t}
                className="rounded-lg border border-border-light bg-surface p-3.5"
              >
                <div className="text-xs font-semibold">{p.t}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-text-tertiary">
                  {p.d}
                </p>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Three supporting feature cards */}
        {[
          {
            title: "Personas",
            sub: "Match the rigor",
            desc: "Spike, Sport, Professional, Auto — each sets model, effort, guardrails, and human gates.",
            link: "/personas",
          },
          {
            title: "Watchtower",
            sub: "See & steer sessions",
            desc: "A local dashboard at :4200 — stream activity, approve prompts, checkpoint, or fork from the browser.",
            link: "/watchtower",
          },
          {
            title: "Portable",
            sub: "One methodology, three tools",
            desc: "Pure-Markdown agents and rules. Cursor and Codex variants generated from the Claude Code defs.",
            link: "/agents",
          },
        ].map((c) => (
          <Link key={c.title} to={c.link} className="md:col-span-2">
            <BentoCard className="group h-full transition-colors hover:bg-surface-dim/60">
              <h3 className="text-base font-semibold">{c.title}</h3>
              <p className="mt-0.5 text-xs text-text-tertiary">{c.sub}</p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {c.desc}
              </p>
              <span className="mt-3 inline-block text-xs font-medium text-accent group-hover:underline">
                Learn more →
              </span>
            </BentoCard>
          </Link>
        ))}
      </section>

      {/* Install CTA — full-bleed band */}
      <section className="rounded-2xl bg-surface-dim p-10 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          One command to install
        </h2>
        <code className="mt-4 inline-block rounded-lg bg-surface px-5 py-2.5 text-sm text-text-secondary border border-border-light">
          npm install -g uv-suite
        </code>
        <p className="mt-4 text-xs text-text-tertiary">
          Auto-installs into the current project on first launch. Your agent,
          your keys, your machine.
        </p>
        <Link
          to="/install"
          className="mt-5 inline-block text-sm font-medium text-accent hover:underline"
        >
          Installation guide →
        </Link>
      </section>
    </div>
  );
}

function BentoCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border-light bg-surface p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold tracking-tight">{children}</h2>;
}
