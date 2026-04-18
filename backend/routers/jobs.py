"""Job lifecycle endpoints — create, broadcast, and fetch jobs."""

import httpx
from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from database import supabase
from config import AI_SERVICE_URL

router = APIRouter()

_AI_TIMEOUT = 30.0


@router.post("/create")
async def create_job(
    category: str = Form(...),
    pin_code: str = Form(...),
    photo: UploadFile = File(...),
):
    """
    Create a new job by uploading a photo and category.

    Calls the AI service to analyse the image and extract scope, price range,
    and complexity, then persists the job in Supabase with status 'pending'.
    """
    try:
        image_bytes = await photo.read()

        async with httpx.AsyncClient(timeout=_AI_TIMEOUT) as client:
            ai_response = await client.post(
                f"{AI_SERVICE_URL}/ai/analyse",
                files={"image": (photo.filename, image_bytes, photo.content_type)},
                data={"category": category},
            )
            ai_response.raise_for_status()
            ai_data = ai_response.json()

        job_payload = {
            "category": category,
            "pin_code": pin_code,
            "photo_url": photo.filename,
            "scope": ai_data.get("scope"),
            "price_min": ai_data.get("price_min"),
            "price_max": ai_data.get("price_max"),
            "complexity": ai_data.get("complexity"),
            "status": "pending",
            "matched_worker_id": None,
        }

        result = supabase.table("jobs").insert(job_payload).execute()
        job = result.data[0] if result.data else job_payload

        return {"success": True, "data": job}

    except Exception as exc:
        raise HTTPException(status_code=422, detail={"success": False, "error": str(exc)})


@router.post("/broadcast/{job_id}")
async def broadcast_job(job_id: str):
    """
    Broadcast a job to all available workers in the same pin_code.

    Smartphone workers are notified via WhatsApp; keypad workers via SMS.
    A notification row is inserted for every worker reached.
    Job status is updated to 'broadcast'.
    """
    try:
        job_result = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
        job = job_result.data
        if not job:
            raise HTTPException(status_code=422, detail={"success": False, "error": "Job not found"})

        workers_result = (
            supabase.table("workers")
            .select("*")
            .eq("pin_code", job["pin_code"])
            .eq("is_available", True)
            .execute()
        )
        workers = workers_result.data or []

        notified_count = 0
        notification_rows = []

        async with httpx.AsyncClient(timeout=_AI_TIMEOUT) as client:
            for worker in workers:
                try:
                    if worker.get("type") == "smartphone":
                        resp = await client.post(
                            f"{AI_SERVICE_URL}/notify/whatsapp",
                            data={
                                "to_number": worker["phone"],
                                "job_photo_url": job.get("photo_url", ""),
                                "scope": job.get("scope", ""),
                                "price_min": str(job.get("price_min", "")),
                                "price_max": str(job.get("price_max", "")),
                                "language": worker.get("language", "hindi"),
                            },
                        )
                        channel = "whatsapp"
                    else:
                        hindi_message = (
                            f"Rozgar: Naya kaam mila! Kaam: {job.get('scope', 'details unavailable')}. "
                            f"Daam: {job.get('price_min')}–{job.get('price_max')} rupaye. "
                            "Accept karne ke liye reply karein."
                        )
                        resp = await client.post(
                            f"{AI_SERVICE_URL}/notify/sms",
                            data={"to_number": worker["phone"], "message": hindi_message},
                        )
                        channel = "sms"

                    notify_status = "sent" if resp.is_success else "failed"
                except Exception:
                    notify_status = "failed"
                    channel = "unknown"

                notification_rows.append(
                    {
                        "job_id": job_id,
                        "worker_id": worker["id"],
                        "channel": channel,
                        "status": notify_status,
                    }
                )
                notified_count += 1

        if notification_rows:
            supabase.table("notifications").insert(notification_rows).execute()

        supabase.table("jobs").update({"status": "broadcast"}).eq("id", job_id).execute()

        return {"success": True, "data": {"job_id": job_id, "notified_count": notified_count}}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail={"success": False, "error": str(exc)})


@router.get("/{job_id}")
async def get_job(job_id: str):
    """
    Fetch a single job by ID.

    If the job is matched, the matched worker's details are included in the response.
    """
    try:
        job_result = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
        job = job_result.data
        if not job:
            raise HTTPException(status_code=422, detail={"success": False, "error": "Job not found"})

        if job.get("matched_worker_id"):
            worker_result = (
                supabase.table("workers")
                .select("*")
                .eq("id", job["matched_worker_id"])
                .single()
                .execute()
            )
            job["matched_worker"] = worker_result.data

        return {"success": True, "data": job}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail={"success": False, "error": str(exc)})
