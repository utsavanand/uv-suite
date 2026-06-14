import { motion } from "framer-motion";

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

const panes = [
  {
    name: "Heartbeat",
    pos: "left",
    desc: "A live, scrolling stream of what every agent is doing, as it happens — each tool call as it fires.",
  },
  {
    name: "Sessions",
    pos: "center",
    desc: "Each session as a flat row: state, tokens, tool calls, last activity. Filter by time, priority, or kind; search by name. Expand a row to checkpoint, view history, compact, fork, close, or delete.",
  },
  {
    name: "Needs human",
    pos: "right",
    desc: "Sessions waiting on you — a tool-permission prompt or an idle wait — with the tool and command as context. Approve or deny from the browser.",
  },
];

const actions = [
  "Checkpoint",
  "View history",
  "Compact",
  "Fork",
  "Close",
  "Delete",
];

export function Watchtower() {
  return (
    <div className="space-y-16">
      <motion.section {...fade}>
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight">
          Watchtower
        </h1>
        <p className="mt-4 max-w-xl text-base text-text-secondary leading-relaxed">
          A control plane for every agent session, not just a viewer. Run
          <code className="mx-1 text-sm bg-surface-dim px-1.5 py-0.5 rounded">
            uvs watch
          </code>
          and open <span className="text-text-primary">localhost:4200</span> —
          Python with embedded SQLite, no Docker and no database to set up.
        </p>
      </motion.section>

      {/* Three panes */}
      <section>
        <h2 className="text-xl font-semibold">Three panes</h2>
        <div className="mt-4 grid gap-px overflow-hidden rounded-lg bg-border-light md:grid-cols-3">
          {panes.map((p) => (
            <div key={p.name} className="bg-surface p-5">
              <div className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                {p.pos}
              </div>
              <div className="mt-1 text-sm font-semibold">{p.name}</div>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Act on a session */}
      <section>
        <h2 className="text-xl font-semibold">
          Act on any session from the browser
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Expand a session row to drive it without switching terminals.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((a) => (
            <span
              key={a}
              className="rounded-full border border-border-light bg-surface-dim px-3 py-1 text-xs text-text-secondary"
            >
              {a}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-xl font-semibold">How it works</h2>
        <div className="mt-4 space-y-4 text-sm text-text-secondary leading-relaxed">
          <p>
            Sessions launched via{" "}
            <code className="text-xs bg-surface-dim px-1.5 py-0.5 rounded">
              uvs
            </code>{" "}
            run inside a transparent tmux, so Watchtower can send keystrokes
            back — that's how Approve / Deny works for tmux-owned sessions.
          </p>
          <p>
            Hooks forward every Claude Code event —{" "}
            <code className="text-xs bg-surface-dim px-1 py-0.5 rounded">
              PreToolUse
            </code>
            ,
            <code className="mx-1 text-xs bg-surface-dim px-1 py-0.5 rounded">
              PostToolUse
            </code>
            ,
            <code className="mr-1 text-xs bg-surface-dim px-1 py-0.5 rounded">
              UserPromptSubmit
            </code>
            ,
            <code className="mr-1 text-xs bg-surface-dim px-1 py-0.5 rounded">
              Notification
            </code>
            ,
            <code className="mr-1 text-xs bg-surface-dim px-1 py-0.5 rounded">
              SessionStart
            </code>
            ,
            <code className="mx-1 text-xs bg-surface-dim px-1 py-0.5 rounded">
              Stop
            </code>{" "}
            — with session metadata merged in.
          </p>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-surface-dim text-left text-xs text-text-tertiary">
                <th className="px-4 py-2.5 font-medium">Hook</th>
                <th className="px-4 py-2.5 font-medium">Fires on</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">
                  What it does
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  hook: "watchtower-send",
                  fires: "All events",
                  does: "Forwards every event with session metadata to the dashboard",
                },
                {
                  hook: "watchtower-notify",
                  fires: "Notification / PermissionRequest",
                  does: 'Surfaces "needs human" approvals',
                },
                {
                  hook: "watchtower-tokens",
                  fires: "Stop",
                  does: "Reports per-session token usage from the transcript",
                },
                {
                  hook: "watchtower-end",
                  fires: "SessionEnd",
                  does: "Marks the session terminated",
                },
              ].map((r) => (
                <tr
                  key={r.hook}
                  className="border-b border-border-light last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono text-xs">{r.hook}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.fires}</td>
                  <td className="px-4 py-2.5 text-text-tertiary hidden md:table-cell">
                    {r.does}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Start it */}
      <section>
        <h2 className="text-xl font-semibold">Start it</h2>
        <div className="mt-4 rounded-lg bg-surface-code border border-border-light p-5">
          <pre className="text-sm leading-relaxed text-text-secondary">
            {`$ uvs watch            # Python dashboard at localhost:4200
$ uvs watch --legacy   # Node-only fallback, no Python`}
          </pre>
        </div>
        <p className="mt-3 text-xs text-text-tertiary">
          Watchtower provisions its own dependencies on first run.
        </p>
      </section>
    </div>
  );
}
