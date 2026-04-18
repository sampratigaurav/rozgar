# test_whatsapp.py — quick WhatsApp sandbox test
from twilio.rest import Client
from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

message = client.messages.create(
    from_=TWILIO_WHATSAPP_NUMBER,
    to="whatsapp:+917488288878",  # your number with country code
    body="Rozgar Test: New job near you! Electrician needed at 560001. Scope: Fix distribution board. Price: ₹500-700. Reply ACCEPT to take this job."
)

print(f"Message SID: {message.sid}")
print(f"Status: {message.status}")