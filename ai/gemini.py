# gemini.py — Gemini Vision + Translation using Google Gen AI SDK
import re
import json
import time
from google import genai
from google.genai import types
from config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)

# Use gemini-1.5-flash — widely available, fast, cheap
_MODEL = "gemini-1.5-flash"

_FALLBACK = {
    "scope": "Repair work needed — technician will assess on site",
    "price_min": 300,
    "price_max": 800,
    "complexity": "medium",
}


def analyse_job_photo(image_bytes: bytes, category: str, _retries: int = 2) -> dict:
    """
    Analyse a job photo and return scope/pricing/complexity.
    Retries up to _retries times on transient failures.
    Returns a safe fallback on total failure.
    """
    prompt = (
        f"You are an expert Indian home repair estimator. "
        f"The user needs a {category} repair. Analyse this photo carefully.\n\n"
        "Return ONLY a valid JSON object with NO markdown fences or extra text:\n"
        '{"scope": "one sentence max 12 words", "price_min": 400, "price_max": 700, "complexity": "low"}\n\n'
        "Rules:\n"
        "- scope: English, one sentence, ≤12 words\n"
        "- price_min / price_max: integers in Indian Rupees\n"
        "- complexity: exactly one of: low, medium, high"
    )

    last_error = None
    for attempt in range(_retries + 1):
        try:
            resp = client.models.generate_content(
                model=_MODEL,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    prompt,
                ],
            )
            text = resp.text.strip()
            # Strip markdown fences if Gemini adds them
            text = re.sub(r"```json\s*|\s*```", "", text).strip()
            # Extract JSON object if surrounded by other text
            m = re.search(r"\{.*\}", text, re.DOTALL)
            if m:
                text = m.group(0)

            data = json.loads(text)

            # Normalise
            data["complexity"] = str(data.get("complexity", "medium")).lower()
            if data["complexity"] not in ("low", "medium", "high"):
                data["complexity"] = "medium"
            data["price_min"] = int(data.get("price_min", 300))
            data["price_max"] = int(data.get("price_max", 800))
            if not data.get("scope"):
                data["scope"] = _FALLBACK["scope"]

            return data

        except Exception as e:
            last_error = e
            if attempt < _retries:
                time.sleep(1.5 * (attempt + 1))

    print(f"[WARN] analyse_job_photo failed after {_retries + 1} attempts: {last_error}")
    return {**_FALLBACK, "scope": f"{category} repair needed — will assess on site"}


def translate_job_description(text: str, target_language: str, _retries: int = 1) -> str:
    """
    Translate text to target_language.
    Falls back to original text on failure.
    Skips API call for English.
    """
    if not text or not text.strip():
        return text
    if target_language.lower() in ("english", "en"):
        return text

    last_error = None
    for attempt in range(_retries + 1):
        try:
            resp = client.models.generate_content(
                model=_MODEL,
                contents=(
                    f"Translate the following text to {target_language}. "
                    "Return ONLY the translation with no explanation:\n\n"
                    + text
                ),
            )
            result = resp.text.strip()
            if result:
                return result
        except Exception as e:
            last_error = e
            if attempt < _retries:
                time.sleep(1.0)

    print(f"[WARN] translate failed: {last_error}. Returning original text.")
    return text