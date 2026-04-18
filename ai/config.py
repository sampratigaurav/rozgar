# Loads all environment variables from .env and exposes them as typed constants.
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY: str = os.environ["GEMINI_API_KEY"]
TWILIO_ACCOUNT_SID: str = os.environ["TWILIO_ACCOUNT_SID"]
TWILIO_AUTH_TOKEN: str = os.environ["TWILIO_AUTH_TOKEN"]
TWILIO_WHATSAPP_NUMBER: str = os.environ["TWILIO_WHATSAPP_NUMBER"]
TWILIO_SMS_NUMBER: str = os.environ["TWILIO_SMS_NUMBER"]
SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY: str = os.environ["SUPABASE_ANON_KEY"]
