# test_sms.py — quick SMS test
from twilio.rest import Client
from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_NUMBER

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

message = client.messages.create(
    from_=TWILIO_SMS_NUMBER,
    to="+917488288878",  # your actual number
    body="Rozgar: Naya kaam aaya! Electrician chahiye 560001 mein. Kaam: Distribution board theek karo. Daam: Rs.500-700. Nearest shop pe jaake ACCEPT karo."
)

print(f"Message SID: {message.sid}")
print(f"Status: {message.status}")