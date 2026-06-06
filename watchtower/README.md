# Watchtower (Python control plane)

Observability **and control** for UV Suite sessions. Hooks push events; the dashboard
observes *and* acts — checkpoint a session, close it, or approve one that's blocked waiting
for a human — from the browser.

FastAPI. **SQLite by default** (an embedded file — no server, no Docker); set
`DATABASE_URL=postgres://…` to use Postgres instead (teams / multi-host). The live
WebSocket stream is fed by an in-process broadcaster, so no `LISTEN/NOTIFY` is needed.

## Run

```bash
uvs watch                 # default: Python + SQLite, opens http://localhost:4200
```

That's the whole setup — no Docker, no database to install. `uvs watch` provisions the
Python deps on first run (via `uv`, or a local `.venv`) and stores data in
`watchtower/watchtower.db`.

Postgres / team mode:
```bash
uvs watch --docker        # Postgres + the service via docker compose
# or point at your own Postgres:
export DATABASE_URL=postgresql://watchtower:watchtower@localhost:5432/watchtower
uv run --with-requirements requirements.txt uvicorn app.main:app --host 127.0.0.1 --port 4200
```
> Bind control to **127.0.0.1** — the control API can checkpoint/kill/approve sessions.

## How sessions become controllable

`uvs <tool> <persona>` launches the session inside a transparent tmux (`tmux -L uvs`,
status bar off) and registers it, so Watchtower can `send-keys`/`kill-session` against it.
No tmux (or `UVS_NO_TMUX=1`) → plain launch; checkpoint still works (out-of-band), close
works via PID, approve is unavailable from the UI.

## API

| Group | Endpoints |
|---|---|
| Ingest | `POST /events`, `POST /sessions/register`, `POST /approvals`, `POST /sessions/{id}/state` |
| Query | `GET /sessions`, `/sessions/{id}`, `/sessions/{id}/events`, `/sessions/{id}/artifacts`, `/approvals?status=` |
| Stream | `WS /live` |
| Control | `POST /sessions/{id}/checkpoint \| close \| approve`, `POST /sessions/spawn` |

## The three control actions
- **Checkpoint** — out-of-band: built from recent events + git state, written to
  `uv-out/sessions/<id>/checkpoints/`. Instant, works for any session.
- **Close** — checkpoint, then `tmux kill-session` (owned) or `SIGTERM` (by PID).
- **Approve** — a `Notification` hook reports the pending permission request; the dashboard
  shows it; clicking Approve/Deny `send-keys` the answer into the session's pane.

## Layout
```
app/
  main.py            app wiring + lifespan + dashboard serving
  db.py              dual-backend shim (SQLite default / Postgres) + WS broadcaster
  models.py          request models
  routers/           ingest.py · query.py · stream.py · control.py
  services/          checkpoint.py (out-of-band) · tmux.py (send-keys/kill/capture)
static/dashboard.html
Dockerfile · docker-compose.yml · requirements.txt
```

## Status / follow-ups
- The `Notification` hook (`hooks/watchtower-notify.sh`) still needs wiring into
  `personas/*.json` (a `Notification` event entry) for approve to fire.
- Approve sends `1`+Enter (select "Yes") / Esc (cancel) — matched to Claude Code's
  numbered arrow-select permission widget. Revisit if that TUI changes.
- The semantic (haiku) checkpoint summary is a TODO; v1 checkpoints are mechanical.

## Legacy fallback (Node)

The original Node Watchtower lives under `watchtower/legacy/` as a fallback that needs
**no Docker/Postgres**:

```bash
uvs watch --legacy        # runs legacy/server.js on :4200 (flat events.json, SSE)
```

`uvs watch` (no flag) runs the Python service. The legacy one is observe-only (no control
plane) and is kept while the Python service is validated in real use.
