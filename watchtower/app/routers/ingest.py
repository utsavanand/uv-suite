"""Ingest router: hooks and `uvs` POST here. Writes events/sessions/approvals
and emits a NOTIFY so connected dashboards update without polling."""
import asyncpg
from fastapi import APIRouter, Depends, Request

from app import db
from app.models import ApprovalIn, SessionRegister, StateUpdate

router = APIRouter()


@router.post("/events")
async def ingest_event(req: Request, con: asyncpg.Connection = Depends(db.db)) -> dict:
    body = await req.json()

    sid = body.get("uvs_session_id") or body.get("session_id")
    event_type = body.get("event_type", "Unknown")
    tool_name = body.get("tool_name")
    command = body.get("command")
    cwd = body.get("cwd")

    name = body.get("session_name") or body.get("name")
    kind = body.get("session_kind") or body.get("kind")
    purpose = body.get("session_purpose") or body.get("purpose")
    priority = body.get("session_priority") or body.get("priority")
    persona = body.get("persona")

    await con.execute(
        """INSERT INTO events (session_id, event_type, tool_name, command, payload)
           VALUES ($1, $2, $3, $4, $5)""",
        sid, event_type, tool_name, command, body,
    )

    if sid:
        await con.execute(
            """INSERT INTO sessions (id, name, kind, purpose, priority, persona, cwd)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (id) DO UPDATE SET
                 name     = COALESCE($2, sessions.name),
                 kind     = COALESCE($3, sessions.kind),
                 purpose  = COALESCE($4, sessions.purpose),
                 priority = COALESCE($5, sessions.priority),
                 persona  = COALESCE($6, sessions.persona),
                 cwd      = COALESCE($7, sessions.cwd)""",
            sid, name, kind, purpose, priority, persona, cwd,
        )

    await db.notify(con, {"type": "event", "session_id": sid, "event_type": event_type})
    return {"ok": True}


@router.post("/sessions/register")
async def register_session(s: SessionRegister, con: asyncpg.Connection = Depends(db.db)) -> dict:
    await con.execute(
        """INSERT INTO sessions (id, name, persona, cwd, worktree, branch, pid, tmux_target, state)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
           ON CONFLICT (id) DO UPDATE SET
             name        = COALESCE($2, sessions.name),
             persona     = COALESCE($3, sessions.persona),
             cwd         = COALESCE($4, sessions.cwd),
             worktree    = COALESCE($5, sessions.worktree),
             branch      = COALESCE($6, sessions.branch),
             pid         = COALESCE($7, sessions.pid),
             tmux_target = COALESCE($8, sessions.tmux_target),
             state       = 'active'""",
        s.id, s.name, s.persona, s.cwd, s.worktree, s.branch, s.pid, s.tmux_target,
    )
    await db.notify(con, {"type": "session", "session_id": s.id})
    return {"ok": True}


@router.post("/approvals")
async def create_approval(a: ApprovalIn, con: asyncpg.Connection = Depends(db.db)) -> dict:
    row = await con.fetchrow(
        """INSERT INTO approvals (session_id, tool_name, command, request, status)
           VALUES ($1, $2, $3, $4, 'pending')
           RETURNING id""",
        a.session_id, a.tool_name, a.command, a.request,
    )
    await con.execute(
        "UPDATE sessions SET state = 'awaiting_human' WHERE id = $1", a.session_id
    )
    await db.notify(con, {
        "type": "approval",
        "id": row["id"],
        "session_id": a.session_id,
        "tool_name": a.tool_name,
        "command": a.command,
    })
    return {"ok": True, "id": row["id"]}


@router.post("/sessions/{id}/state")
async def update_state(id: str, s: StateUpdate, con: asyncpg.Connection = Depends(db.db)) -> dict:
    if s.state == "terminated":
        await con.execute(
            "UPDATE sessions SET state = $2, ended_at = now() WHERE id = $1", id, s.state
        )
    else:
        await con.execute("UPDATE sessions SET state = $2 WHERE id = $1", id, s.state)
    await db.notify(con, {"type": "session", "session_id": id, "state": s.state})
    return {"ok": True}
