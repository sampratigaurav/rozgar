"""Centralised configuration — loads .env and exposes typed constants."""
import os
from dotenv import load_dotenv

load_dotenv()


def _require(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise KeyError(
            f"Required environment variable '{key}' is not set. "
            f"Add it to your .env file or Render environment."
        )
    return value


SUPABASE_URL: str      = _require("SUPABASE_URL")
SUPABASE_ANON_KEY: str = _require("SUPABASE_ANON_KEY")
GEMINI_API_KEY: str    = _require("GEMINI_API_KEY")
TWILIO_ACCOUNT_SID: str = _require("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN: str = _require("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER: str = _require("TWILIO_WHATSAPP_NUMBER")
TWILIO_SMS_NUMBER: str = _require("TWILIO_SMS_NUMBER")
TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", TWILIO_WHATSAPP_NUMBER) # Fallback for IVR

PORT: int              = int(os.getenv("PORT", "8001"))
FRONTEND_URL: str      = os.getenv("FRONTEND_URL", "http://localhost:3000")