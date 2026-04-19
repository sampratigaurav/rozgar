# FastAPI entry point — exposes AI analysis and multi-channel notification endpoints.
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool

from gemini import analyse_job_photo
from twilio_whatsapp import send_whatsapp
from twilio_sms import send_sms
from twilio_ivr import make_ivr_call

app = FastAPI(title="Rozgar AI & Integrations", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Health check — confirms the service is running."""
    return {"status": "ok", "service": "rozgar-ai"}


@app.post("/ai/analyse")
async def analyse(
    image: UploadFile = File(...),
    category: str = Form(...),
):
    """Accept a job photo and category; return Gemini Vision scope/pricing/complexity."""
    try:
        image_bytes = await image.read()
        # Run the synchronous Gemini call in a separate thread so it doesn't block the async event loop
        result = await run_in_threadpool(analyse_job_photo, image_bytes, category)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/notify/whatsapp")
def notify_whatsapp(
    to_number: str = Form(...),
    job_photo_url: str = Form(...),
    scope: str = Form(...),
    price_min: int = Form(...),
    price_max: int = Form(...),
    language: str = Form(...),
):
    """Send a translated WhatsApp job alert to a worker."""
    try:
        sid = send_whatsapp(
            to_number=to_number,
            job_photo_url=job_photo_url,
            scope=scope,
            price_min=price_min,
            price_max=price_max,
            language=language,
        )
        return {"success": True, "result": sid}
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/notify/sms")
def notify_sms(
    to_number: str = Form(...),
    message: str = Form(...),
):
    """Send a plain SMS to a worker."""
    try:
        sid = send_sms(to_number=to_number, message=message)
        return {"success": True, "result": sid}
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/notify/ivr")
def notify_ivr(
    to_number: str = Form(...),
    job_description: str = Form(...),
    language: str = Form(...),
):
    """Trigger a voice IVR call to a worker in their regional language."""
    try:
        sid = make_ivr_call(
            to_number=to_number,
            job_description=job_description,
            language=language,
        )
        return {"success": True, "result": sid}
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
