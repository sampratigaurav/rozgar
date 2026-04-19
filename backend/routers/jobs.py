"""Job lifecycle endpoints — create, broadcast, fetch, complete."""
import uuid as _uuid
import httpx
from fastapi import APIRouter, Form, UploadFile, File, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from database import supabase
from config import SUPABASE_URL, SUPABASE_ANON_KEY
from dependencies import get_current_user
from gemini import analyse_job_photo
from twilio_whatsapp import send_whatsapp
from twilio_sms import send_sms

router = APIRouter()
_AI_TIMEOUT = 40.0


async def _upload_photo(image_bytes: bytes, filename: str, content_type: str) -> str | None:
    """Upload photo bytes to Supabase Storage. Returns public URL or None on failure."""
    ext = (filename or "photo.jpg").rsplit(".", 1)[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "webp", "gif"}:
        ext = "jpg"
    storage_key = f"{_uuid.uuid4()}.{ext}"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/job-photos/{storage_key}"

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            upload_url,
            headers={
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                "Content-Type": content_type or "image/jpeg",
                "x-upsert": "true",
            },
            content=image_bytes,
        )

    if resp.status_code in (200, 201):
        return f"{SUPABASE_URL}/storage/v1/object/public/job-photos/{storage_key}"

    # Non-fatal — log and continue without photo URL
    print(f"[WARN] Storage upload failed {resp.status_code}: {resp.text[:200]}")
    return None


@router.post("/create")
async def create_job(
    category: str = Form(...),
    pin_code: str = Form(...),
    photo: UploadFile = File(...),
    user=Depends(get_current_user),
):
    """
    1. Read image bytes
    2. Call AI service for analysis (parses nested result correctly)
    3. Upload photo to Supabase Storage
    4. Insert job row with real photo_url
    """
    if not category.strip():
        raise HTTPException(422, {"success": False, "error": "category is required"})
    pin = pin_code.strip()
    if len(pin) != 6 or not pin.isdigit():
        raise HTTPException(422, {"success": False, "error": "pin_code must be 6 digits"})

    try:
        image_bytes = await photo.read()
        if not image_bytes:
            raise HTTPException(422, {"success": False, "error": "photo is empty"})

        # ── AI analysis ──────────────────────────────────────
        # Run Gemini locally in a thread pool to avoid blocking Event Loop
        result = await run_in_threadpool(analyse_job_photo, image_bytes, category)
        
        scope      = result.get("scope")
        price_min  = result.get("price_min")
        price_max  = result.get("price_max")
        complexity = result.get("complexity")

        # ── Upload photo to Storage ──────────────────────────
        photo_url = await _upload_photo(
            image_bytes,
            photo.filename or "photo.jpg",
            photo.content_type or "image/jpeg",
        )

        # ── Persist job ──────────────────────────────────────
        payload = {
            "category":  category.strip(),
            "pin_code":  pin,
            "photo_url": photo_url,
            "scope":     scope,
            "price_min": price_min,
            "price_max": price_max,
            "complexity": complexity,
            "status":    "pending",
        }
        db = supabase.table("jobs").insert(payload).execute()
        job = db.data[0] if db.data else payload
        return {"success": True, "data": job}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, {"success": False, "error": str(exc)})


@router.post("/broadcast/{job_id}")
async def broadcast_job(job_id: str, user=Depends(get_current_user)):
    """Notify all available workers in job's pin_code via WhatsApp or SMS."""
    try:
        jr = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
        job = jr.data
        if not job:
            raise HTTPException(404, {"success": False, "error": "Job not found"})
        if job["status"] not in ("pending", "broadcast"):
            raise HTTPException(422, {"success": False, "error": f"Job status is '{job['status']}', cannot broadcast"})

        wr = (
            supabase.table("workers")
            .select("*")
            .eq("pin_code", job["pin_code"])
            .eq("is_available", True)
            .execute()
        )
        workers = wr.data or []
        notified, rows = 0, []

        for w in workers:
            channel, status = "unknown", "failed"
            try:
                if w.get("type") == "smartphone":
                    await run_in_threadpool(
                        send_whatsapp,
                        to_number=w["phone"],
                        job_photo_url=job.get("photo_url") or "",
                        scope=job.get("scope") or "",
                        price_min=int(job.get("price_min") or 0),
                        price_max=int(job.get("price_max") or 0),
                        language=w.get("language", "hindi")
                    )
                    channel = "whatsapp"
                    status  = "sent"
                else:
                    body = (
                        f"Rozgar: Naya kaam! {job.get('scope','Kaam available')}. "
                        f"Daam: Rs.{job.get('price_min',0)}-{job.get('price_max',0)}. "
                        "ACCEPT likhein."
                    )
                    await run_in_threadpool(send_sms, to_number=w["phone"], message=body)
                    channel = "sms"
                    status  = "sent"
            except Exception as e:
                print(f"[WARN] notify failed for worker {w.get('id')}: {e}")

            rows.append({"job_id": job_id, "worker_id": w["id"], "channel": channel, "status": status})
            notified += 1

        if rows:
            supabase.table("notifications").insert(rows).execute()

        supabase.table("jobs").update({"status": "broadcast"}).eq("id", job_id).execute()
        return {"success": True, "data": {"job_id": job_id, "notified_count": notified}}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, {"success": False, "error": str(exc)})


@router.get("/list")
async def list_jobs(status: str | None = None, pin_code: str | None = None, limit: int = 50, user=Depends(get_current_user)):
    """List jobs with optional filters."""
    try:
        q = supabase.table("jobs").select("*").order("created_at", desc=True).limit(limit)
        if status:   q = q.eq("status", status)
        if pin_code: q = q.eq("pin_code", pin_code)
        r = q.execute()
        return {"success": True, "data": r.data or []}
    except Exception as exc:
        raise HTTPException(422, {"success": False, "error": str(exc)})


@router.get("/{job_id}")
async def get_job(job_id: str, user=Depends(get_current_user)):
    """Fetch a single job; includes matched_worker if matched."""
    try:
        jr = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
        job = jr.data
        if not job:
            raise HTTPException(404, {"success": False, "error": "Job not found"})

        if job.get("matched_worker_id"):
            wr = (
                supabase.table("workers")
                .select("id,name,phone,language,type,pin_code")
                .eq("id", job["matched_worker_id"])
                .single()
                .execute()
            )
            job["matched_worker"] = wr.data

        return {"success": True, "data": job}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, {"success": False, "error": str(exc)})


@router.patch("/{job_id}/complete")
async def complete_job(job_id: str):
    """Customer marks job as completed."""
    try:
        jr = supabase.table("jobs").select("id,status,matched_worker_id").eq("id", job_id).single().execute()
        if not jr.data:
            raise HTTPException(404, {"success": False, "error": "Job not found"})
        if jr.data["status"] != "matched":
            raise HTTPException(422, {"success": False, "error": "Only matched jobs can be completed"})

        supabase.table("jobs").update({"status": "completed"}).eq("id", job_id).execute()

        # Re-enable worker
        if jr.data.get("matched_worker_id"):
            supabase.table("workers").update({"is_available": True}).eq("id", jr.data["matched_worker_id"]).execute()

        return {"success": True, "data": {"message": "Job completed", "job_id": job_id}}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, {"success": False, "error": str(exc)})