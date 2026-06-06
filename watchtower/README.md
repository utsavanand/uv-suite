# Watchtower (Python control plane)

Observability **and control** for UV Suite sessions. Hooks push events; the dashboard
observes *and* acts — checkpoint a session, close it, or approve one that's blocked waiting
for a human — from the browser.

FastAPI + Postgres. A hook insert fires `pg_notify`; a listener forwards it to connected
dashboards over WebSocket (no polling).

## Run

```bash
cd watchtower
docker compose up --build      # Postgres + the service on :4200
# open http://localhost:4200
```

Local (without Docker), against your own Postgres:
```bash
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
  db.py              asyncpg pool + NOTIFY → WebSocket broadcaster
  models.py          request models
  routers/           ingest.py · query.py · stream.py · control.py
  services/          checkpoint.py (out-of-band) · tmux.py (send-keys/kill/capture)
static/dashboard.html
schema.sql · Dockerfile · docker-compose.yml · requirements.txt
```

## Status / follow-ups
- The `Notification` hook (`hooks/watchtower-notify.sh`) still needs wiring into
  `personas/*.json` (a `Notification` event entry) for approve to fire.
- The approve keystroke map (`y`/`n`) is a placeholder — Claude Code's permission UI may
  use arrow-select + Enter. Validate against the installed version (`capture_pane` shows it).
- The semantic (haiku) checkpoint summary is a TODO; v1 checkpoints are mechanical.
- Supersedes the old Node `server.js`/`dashboard.html`/`*-runner.js` (kept for now).

## Legacy fallback (Node)

The original Node Watchtower lives under `watchtower/legacy/` as a fallback that needs
**no Docker/Postgres**:

```bash
uvs watch --legacy        # runs legacy/server.js on :4200 (flat events.json, SSE)
```

`uvs watch` (no flag) runs the Python service. The legacy one is observe-only (no control
plane) and is kept while the Python service is validated in real use.
