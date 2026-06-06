"""Ingest router: hooks and `uvs` POST here. Writes events/sessions/approvals
and broadcasts to connected dashboards (in-process, no polling)."""
import json

from fastapi import APIRouter, Request

from app import db
from app.models import ApprovalIn, SessionRegister, StateUpdate, TokensIn

router = APIRouter()


@router.post("/events")
async def ingest_event(req: Request) -> dict:
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

    await db.execute(
        """INSERT INTO events (session_id, event_type, tool_name, command, payload)
           VALUES (?, ?, ?, ?, ?)""",
        sid, event_type, tool_name, command, json.dumps(body, default=str),
    )

    if sid:
        await db.execute(
            """INSERT INTO sessions (id, name, kind, purpose, priority, persona, cwd)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT (id) DO UPDATE SET
                 name     = COALESCE(excluded.name, sessions.name),
                 kind     = COALESCE(excluded.kind, sessions.kind),
                 purpose  = COALESCE(excluded.purpose, sessions.purpose),
                 priority = COALESCE(excluded.priority, sessions.priority),
                 persona  = COALESCE(excluded.persona, sessions.persona),
                 cwd      = COALESCE(excluded.cwd, sessions.cwd)""",
            sid, name, kind, purpose, priority, persona, cwd,
        )

    db.notify({"type": "event", "session_id": sid, "event_type": event_type})
    return {"ok": True}


@router.post("/sessions/register")
async def register_session(s: SessionRegister) -> dict:
    await db.execute(
        """INSERT INTO sessions (id, name, persona, cwd, worktree, branch, pid, tmux_target, state)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
           ON CONFLICT (id) DO UPDATE SET
             name        = COALESCE(excluded.name, sessions.name),
             persona     = COALESCE(excluded.persona, sessions.persona),
             cwd         = COALESCE(excluded.cwd, sessions.cwd),
             worktree    = COALESCE(excluded.worktree, sessions.worktree),
             branch      = COALESCE(excluded.branch, sessions.branch),
             pid         = COALESCE(excluded.pid, sessions.pid),
             tmux_target = COALESCE(excluded.tmux_target, sessions.tmux_target),
             state       = 'active'""",
        s.id, s.name, s.persona, s.cwd, s.worktree, s.branch, s.pid, s.tmux_target,
    )
    db.notify({"type": "session", "session_id": s.id})
    return {"ok": True}


@router.post("/approvals")
async def create_approval(a: ApprovalIn) -> dict:
    approval_id = await db.insert(
        """INSERT INTO approvals (session_id, tool_name, command, request, status)
           VALUES (?, ?, ?, ?, 'pending')""",
        a.session_id, a.tool_name, a.command, json.dumps(a.request, default=str),
    )
    await db.execute(
        "UPDATE sessions SET state = 'awaiting_human' WHERE id = ?", a.session_id
    )
    db.notify({
        "type": "approval",
        "id": approval_id,
        "session_id": a.session_id,
        "tool_name": a.tool_name,
        "command": a.command,
    })
    return {"ok": True, "id": approval_id}


@router.post("/sessions/{id}/tokens")
async def update_tokens(id: str, t: TokensIn) -> dict:
    await db.execute(
        "UPDATE sessions SET input_tokens = ?, output_tokens = ? WHERE id = ?",
        t.input_tokens, t.output_tokens, id,
    )
    db.notify({
        "type": "session", "session_id": id,
        "input_tokens": t.input_tokens, "output_tokens": t.output_tokens,
    })
    return {"ok": True}


@router.post("/sessions/{id}/state")
async def update_state(id: str, s: StateUpdate) -> dict:
    if s.state == "terminated":
        await db.execute(
            "UPDATE sessions SET state = ?, ended_at = CURRENT_TIMESTAMP WHERE id = ?",
            s.state, id,
        )
    else:
        await db.execute("UPDATE sessions SET state = ? WHERE id = ?", s.state, id)
    db.notify({"type": "session", "session_id": id, "state": s.state})
    return {"ok": True}
