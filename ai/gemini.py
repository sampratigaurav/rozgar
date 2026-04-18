# gemini.py — Gemini Vision + Translation using Google Gen AI SDK
import re
import json
from google import genai
from google.genai import types
from config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)

def analyse_job_photo(image_bytes: bytes, category: str) -> dict:
    try:
        prompt = f"""
        You are an expert Indian home repair estimator.
        The user needs a {category} repair. Analyse this photo.
        Return ONLY a valid JSON object with no extra text:
        {{"scope": "one sentence describing work needed", "price_min": 500, "price_max": 700, "complexity": "low"}}
        complexity must be: low, medium, or high
        """
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                prompt
            ]
        )
        text = response.text.strip()
        text = re.sub(r"```json|```", "", text).strip()
        return json.loads(text)
    except Exception as e:
        raise ValueError(f"analyse_job_photo failed: {e}")


def translate_job_description(text: str, target_language: str) -> str:
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Translate this to {target_language}. Return only the translation, nothing else: {text}"
        )
        return response.text.strip()
    except Exception as e:
        raise ValueError(f"translate failed: {e}")