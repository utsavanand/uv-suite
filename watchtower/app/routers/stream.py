"""Stream router: a single WebSocket the dashboard connects to for live updates.
Updates land on the in-process broadcaster (see app/db.py) and fan out here."""
import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app import db

router = APIRouter()


@router.websocket("/live")
async def live(ws: WebSocket) -> None:
    await ws.accept()

    sessions = await db.fetch("SELECT * FROM sessions ORDER BY started_at DESC")
    await ws.send_text(json.dumps({"type": "snapshot", "sessions": sessions}, default=str))

    q = db.broadcaster.subscribe()
    try:
        while True:
            payload = await q.get()
            await ws.send_text(payload)
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    finally:
        db.broadcaster.unsubscribe(q)
