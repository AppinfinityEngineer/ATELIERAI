"""Atelier AI — ThoughtSnap Labs.

FastAPI shell that serves the client-side painting workspace.
All image analysis runs in the browser (Canvas API) so the Render
instance stays cheap: this process only serves static assets.
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Atelier AI", version="1.0.0", docs_url=None, redoc_url=None)


@app.get("/health")
def health() -> JSONResponse:
    return JSONResponse({"status": "ok", "app": "atelier-ai"})


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
