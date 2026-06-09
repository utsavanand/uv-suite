"""Request/response models. Kept permissive — hook payloads carry arbitrary extra keys."""
from typing import Any, Literal

from pydantic import BaseModel


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


class TokensIn(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0


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
    persona: Literal["spike", "sport", "professional", "auto"] = "professional"
    cwd: str | None = None
    task: str | None = None
