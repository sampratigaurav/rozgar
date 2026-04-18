# Triggers Twilio voice (IVR) calls with a TwiML message in the worker's regional language.
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from gemini import translate_job_description
from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_NUMBER

# Mapping from language name to a BCP-47 tag supported by Twilio's <Say> verb.
_LANGUAGE_MAP: dict[str, str] = {
    "hindi": "hi-IN",
    "tamil": "ta-IN",
    "telugu": "te-IN",
    "kannada": "kn-IN",
    "bengali": "bn-IN",
    "marathi": "mr-IN",
    "english": "en-IN",
}


def make_ivr_call(to_number: str, job_description: str, language: str) -> str:
    """Trigger a Twilio voice call that reads the job description in the worker's language."""
    try:
        lang_key = language.lower()
        twiml_language = _LANGUAGE_MAP.get(lang_key, "hi-IN")

        translated = translate_job_description(job_description, language)

        response = VoiceResponse()
        response.say(translated, language=twiml_language)

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        call = client.calls.create(
            from_=TWILIO_SMS_NUMBER,
            to=to_number,
            twiml=str(response),
        )
        return call.sid
    except Exception as exc:
        raise RuntimeError(f"make_ivr_call failed: {exc}") from exc
