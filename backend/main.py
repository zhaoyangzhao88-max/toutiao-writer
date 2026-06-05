"""Toutiao Writer API - FastAPI application entry point."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import material, writing, optimize, export, workflow_state

app = FastAPI(
    title="Toutiao Writer API",
    description="头条文章写作助手后端API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(material.router, prefix="/api/material", tags=["素材"])
app.include_router(writing.router, prefix="/api/writing", tags=["写作"])
app.include_router(optimize.router, prefix="/api/optimize", tags=["优化"])
app.include_router(export.router, prefix="/api/export", tags=["导出"])
app.include_router(workflow_state.router, prefix="/api/workflow", tags=["工作流"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

# Serve built frontend static files
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve frontend SPA — return index.html for all non-API routes."""
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

