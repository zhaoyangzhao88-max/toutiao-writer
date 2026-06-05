"""Workflow state persistence router — saves/loads workflow state to a JSON file.

This ensures user data survives backend restarts, unlike browser localStorage
which can be cleared or lost.
"""
import json
import os
from fastapi import APIRouter

router = APIRouter()

# Store state file alongside the backend directory
STATE_FILE = os.path.join(os.path.dirname(__file__), "..", "workflow_state.json")


@router.get("/state")
async def load_state():
    """Load the full workflow state from the server JSON file."""
    if not os.path.exists(STATE_FILE):
        return {}
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


@router.post("/state")
async def save_state(state: dict):
    """Save the full workflow state to the server JSON file."""
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
        return {"success": True}
    except OSError as e:
        return {"success": False, "error": str(e)}
