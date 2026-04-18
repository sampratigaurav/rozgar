# Sends plain SMS notifications to keypad-phone workers via Twilio.
from twilio.rest import Client
from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_NUMBER


def send_sms(to_number: str, message: str) -> str:
    """Send a plain SMS to a worker's phone number."""
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            from_=TWILIO_SMS_NUMBER,
            to=to_number,
            body=message,
        )
        return msg.sid
    except Exception as exc:
        raise RuntimeError(f"send_sms failed: {exc}") from exc
