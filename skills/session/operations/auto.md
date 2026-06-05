# auto — toggle automatic checkpoints

Show the line of output above; it confirms the new mode/interval. No commentary.
The change applies to the very next interval — no restart needed.
Usage: `/session auto on|off|<minutes>|status` (default interval 10 min, range
1-1440). `status` or no argument prints the current mode and interval.

How it works:
- **Tier A (mechanical):** the `auto-checkpoint.sh` hook runs after each tool
  call. When the interval has passed and there's been activity since the last
  checkpoint, it writes a deterministic snapshot — git state, recent tool calls,
  files touched — to `uv-out/sessions/<sid>/checkpoints/auto-<ts>-mechanical.md`.
- **Tier B (semantic):** the Watchtower (`uvs watch`) keeps a timer. Every N
  minutes, for each active session, it shells out to `claude -p --bare --model
  haiku` with a prompt from recent dashboard events and git state, saving
  `auto-<ts>-semantic.md` next to the mechanical one. Cap: `--max-budget-usd
  0.05` per call.
- Both tiers fire `AutoCheckpoint` events to the Watchtower. Sessions with zero
  activity in the interval are skipped — no empty checkpoints.

State lives in `.uv-suite-state/auto-checkpoint.json` (mode + interval) and
`.uv-suite-state/sessions/<sid>.last-{mechanical,semantic}-checkpoint.txt`.
