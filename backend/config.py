"""Centralised configuration — loads .env and exposes typed constants."""

import os
from dotenv import load_dotenv

load_dotenv()


def _require(key: str) -> str:
    """Return env var or raise KeyError with a helpful message."""
    value = os.getenv(key)
    if not value:
        raise KeyError(f"Required environment variable '{key}' is not set. Check your .env file.")
    return value


SUPABASE_URL: str = _require("SUPABASE_URL")
SUPABASE_ANON_KEY: str = _require("SUPABASE_ANON_KEY")
AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", "http://localhost:8000")
PORT: int = int(os.getenv("PORT", "8001"))
