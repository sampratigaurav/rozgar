# Sends WhatsApp messages to workers with translated job details via Twilio.
from twilio.rest import Client
from gemini import translate_job_description
from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER


def send_whatsapp(
    to_number: str,
    job_photo_url: str,
    scope: str,
    price_min: int,
    price_max: int,
    language: str,
) -> str:
    """Translate job scope into the worker's language and send a formatted WhatsApp alert."""
    try:
        translated_scope = translate_job_description(scope, language)

        message_body = (
            f"Rozgar: Naya kaam!\n"
            f"Kaam: {translated_scope}\n"
            f"Daam: ₹{price_min}–{price_max}\n"
            f"Photo dekhne ke liye reply karein. ACCEPT likhein agar kaam lena hai."
        )

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        to = f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number

        message = client.messages.create(
            from_=TWILIO_WHATSAPP_NUMBER,
            to=to,
            body=message_body,
            media_url=[job_photo_url],
        )
        return message.sid
    except Exception as exc:
        raise RuntimeError(f"send_whatsapp failed: {exc}") from exc
