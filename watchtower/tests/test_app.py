"""Tests for the Watchtower FastAPI app (run: uvx --with pytest --with httpx pytest).

Covers the logic with irreversible side effects: approval dedup/auto-clear, decide,
the session upsert, delete/cleanup, the persona-injection guard, the CSRF middleware,
and the checkpoint filesystem guard. The tmux/process boundary is exercised only via
unowned sessions (no tmux_target), so no real process is spawned or killed.
"""
import os
import tempfile

os.environ["WATCHTOWER_DB"] = tempfile.mktemp(suffix=".db")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def _client() -> TestClient:
    return TestClient(app)


def test_health():
    with _client() as c:
        assert c.get("/health").json()["status"] == "ok"


def test_spawn_rejects_injected_persona():
    # persona is a Literal — a shell-injection payload is rejected at validation (422),
    # before the handler ever builds a command. This is the RCE guard.
    with _client() as c:
        r = c.post("/sessions/spawn", json={"tool": "claude", "persona": "x; touch /tmp/pwn #"})
        assert r.status_code == 422


def test_csrf_blocks_cross_origin_mutation():
    with _client() as c:
        assert c.post("/sessions/cleanup", headers={"Origin": "https://evil.example"}).status_code == 403
        # reads are not blocked, and same-origin / no-origin (hooks) pass
        assert c.get("/sessions", headers={"Origin": "https://evil.example"}).status_code == 200
        assert c.post("/sessions/register", json={"id": "csrf", "name": "csrf"}).status_code == 200


def test_approval_dedup_and_autoclear():
    with _client() as c:
        c.post("/sessions/register", json={"id": "s1", "name": "s1"})
        a1 = c.post("/approvals", json={"session_id": "s1", "tool_name": "Bash", "command": "ls", "request": {}}).json()
        a2 = c.post("/approvals", json={"session_id": "s1", "tool_name": "", "command": "needs you", "request": {}}).json()
        assert a1["id"] == a2["id"]  # the pair collapses to one row

        mine = [p for p in c.get("/approvals").json() if p["session_id"] == "s1"]
        assert len(mine) == 1
        assert mine[0]["tool_name"] == "Bash"  # the richer (PermissionRequest) value is kept
        assert c.get("/sessions/s1").json()["state"] == "awaiting_human"

        # the user responding clears the attention item
        c.post("/events", json={"session_id": "s1", "event_type": "UserPromptSubmit", "prompt": "go"})
        assert not [p for p in c.get("/approvals").json() if p["session_id"] == "s1"]
        assert c.get("/sessions/s1").json()["state"] == "active"


def test_decide_unowned_and_missing():
    with _client() as c:
        c.post("/sessions/register", json={"id": "s2", "name": "s2"})
        aid = c.post("/approvals", json={"session_id": "s2", "tool_name": "Bash", "command": "x", "request": {}}).json()["id"]
        r = c.post(f"/approvals/{aid}/decide", json={"decision": "deny"})
        # unowned session: recorded but not actuated, and it never 404s on the session
        assert r.status_code == 200 and r.json()["status"] == "denied" and r.json()["actuated"] is False
        assert c.post("/approvals/999999/decide", json={"decision": "approve"}).status_code == 404


def test_upsert_preserves_name():
    with _client() as c:
        c.post("/sessions/register", json={"id": "s3", "name": "Keep Me"})
        c.post("/events", json={"session_id": "s3", "event_type": "PostToolUse", "tool_name": "Bash"})  # no name
        assert c.get("/sessions/s3").json()["name"] == "Keep Me"  # COALESCE preserves it


def test_delete_and_cleanup():
    with _client() as c:
        c.post("/sessions/register", json={"id": "d1", "name": "d1"})
        c.post("/events", json={"session_id": "d1", "event_type": "PreToolUse", "tool_name": "Bash"})
        assert c.request("DELETE", "/sessions/d1").json()["deleted"] == "d1"
        assert c.get("/sessions/d1").status_code == 404
        assert c.post("/sessions/cleanup").json()["ok"] is True
        assert c.get("/sessions").json() == []


def test_checkpoint_writes_and_rejects_bad_cwd(tmp_path):
    with _client() as c:
        c.post("/sessions/register", json={"id": "ck1", "name": "ck1", "cwd": str(tmp_path)})
        r = c.post("/sessions/ck1/checkpoint")
        assert r.status_code == 200 and os.path.isfile(r.json()["path"])

        c.post("/sessions/register", json={"id": "ck2", "name": "ck2", "cwd": "/no/such/dir-xyz123"})
        assert c.post("/sessions/ck2/checkpoint").status_code == 400  # cwd guard
