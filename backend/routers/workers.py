"""Worker endpoints — accept jobs, list available workers."""
from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from dependencies import get_current_user
from schemas import AcceptJobRequest

router = APIRouter()


@router.post("/accept")
async def accept_job(
    request: AcceptJobRequest,
    user=Depends(get_current_user),
):
    """
    Worker accepts a job.
    - Validates job exists and is in broadcast state
    - Validates worker exists and is available
    - Atomically updates both rows
    """
    job_id = request.job_id
    worker_id = request.worker_id
    try:
        jr = supabase.table("jobs").select("id,status,matched_worker_id").eq("id", job_id).single().execute()
        if not jr.data:
            raise HTTPException(404, {"success": False, "error": "Job not found"})
        job = jr.data
        if job["status"] == "matched":
            raise HTTPException(409, {"success": False, "error": "Job already taken by another worker"})
        if job["status"] not in ("pending", "broadcast"):
            raise HTTPException(422, {"success": False, "error": f"Job is '{job['status']}', cannot accept"})

        wr = supabase.table("workers").select("id,is_available").eq("id", worker_id).single().execute()
        if not wr.data:
            raise HTTPException(404, {"success": False, "error": "Worker not found"})
        if not wr.data["is_available"]:
            raise HTTPException(409, {"success": False, "error": "Worker is currently unavailable"})

        supabase.table("jobs").update({"status": "matched", "matched_worker_id": worker_id}).eq("id", job_id).execute()
        supabase.table("workers").update({"is_available": False}).eq("id", worker_id).execute()

        return {"success": True, "data": {"message": "Job accepted", "job_id": job_id}}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, {"success": False, "error": str(exc)})


@router.get("/available/{pin_code}")
async def available_workers(pin_code: str, user=Depends(get_current_user)):
    """List workers available in a pin_code."""
    try:
        r = (
            supabase.table("workers")
            .select("id,name,phone,type,language,pin_code,is_available")
            .eq("pin_code", pin_code.strip())
            .eq("is_available", True)
            .execute()
        )
        return {"success": True, "data": r.data or []}
    except Exception as exc:
        raise HTTPException(422, {"success": False, "error": str(exc)})


@router.get("/{worker_id}")
async def get_worker(worker_id: str, user=Depends(get_current_user)):
    """Get a single worker by ID."""
    try:
        r = supabase.table("workers").select("*").eq("id", worker_id).single().execute()
        if not r.data:
            raise HTTPException(404, {"success": False, "error": "Worker not found"})
        return {"success": True, "data": r.data}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, {"success": False, "error": str(exc)})