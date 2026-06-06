"""Settings router: small key-value config the dashboard reads/writes."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import db

router = APIRouter()

# Whitelisted settings and their permitted values — settings are not arbitrary writes.
ALLOWED = {
    "terminal_app": {"auto", "terminal", "iterm"},
}


class SettingIn(BaseModel):
    key: str
    value: str


@router.get("/settings")
async def get_settings() -> dict:
    rows = await db.fetch("SELECT key, value FROM settings")
    return {r["key"]: r["value"] for r in rows}


@router.post("/settings")
async def set_setting(s: SettingIn) -> dict:
    allowed = ALLOWED.get(s.key)
    if allowed is None:
        raise HTTPException(status_code=400, detail=f"unknown setting: {s.key}")
    if s.value not in allowed:
        raise HTTPException(status_code=400, detail=f"invalid value for {s.key}: {s.value}")
    await db.set_setting(s.key, s.value)
    return {"ok": True, "key": s.key, "value": s.value}
