"""Request/response models. Kept permissive — hook payloads carry arbitrary extra keys."""
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


class EventIn(BaseModel):
    """A hook event. Most fields arrive inside the raw hook JSON; we pull out the
    common columns and keep the whole thing in `payload`."""
    model_config = ConfigDict(extra="allow")

    event_type: str = "Unknown"
    uvs_session_id: str | None = None
    tool_name: str | None = None
    command: str | None = None


class SessionRegister(BaseModel):
    id: str
    name: str | None = None
    persona: str | None = None
    cwd: str | None = None
    worktree: str | None = None
    branch: str | None = None
    pid: int | None = None
    tmux_target: str | None = None


class StateUpdate(BaseModel):
    state: Literal["active", "idle", "awaiting_human", "terminated"]


class ApprovalIn(BaseModel):
    session_id: str
    tool_name: str | None = None
    command: str | None = None
    request: dict[str, Any] | None = None


class ApprovalDecision(BaseModel):
    decision: Literal["approve", "deny"]
    decided_by: str | None = None


class SpawnRequest(BaseModel):
    tool: Literal["claude", "codex"] = "claude"
    persona: str = "professional"
    cwd: str | None = None
    task: str | None = None
