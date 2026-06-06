"""Watchtower service entrypoint. Wires the routers built independently in app/routers/."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import db
from app.routers import control, ingest, query, stream

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_db()
    try:
        yield
    finally:
        await db.close()


app = FastAPI(title="Watchtower", version="1.0.0", lifespan=lifespan)

app.include_router(ingest.router)
app.include_router(query.router)
app.include_router(stream.router)
app.include_router(control.router)


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def dashboard() -> FileResponse:
    return FileResponse(os.path.join(STATIC_DIR, "dashboard.html"))


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
