"""Worker endpoints — accept jobs and list available workers."""

from fastapi import APIRouter, Form, HTTPException
from database import supabase

router = APIRouter()


@router.post("/accept")
async def accept_job(
    job_id: str = Form(...),
    worker_id: str = Form(...),
):
    """
    Worker accepts a job.

    Updates the job status to 'matched' and marks the worker as unavailable.
    """
    try:
        supabase.table("jobs").update(
            {"status": "matched", "matched_worker_id": worker_id}
        ).eq("id", job_id).execute()

        supabase.table("workers").update({"is_available": False}).eq("id", worker_id).execute()

        return {"success": True, "data": {"message": "Job accepted", "job_id": job_id}}

    except Exception as exc:
        raise HTTPException(status_code=422, detail={"success": False, "error": str(exc)})


@router.get("/available/{pin_code}")
async def available_workers(pin_code: str):
    """
    List all workers who are available in the given pin_code area.
    """
    try:
        result = (
            supabase.table("workers")
            .select("*")
            .eq("pin_code", pin_code)
            .eq("is_available", True)
            .execute()
        )
        return {"success": True, "data": result.data or []}

    except Exception as exc:
        raise HTTPException(status_code=422, detail={"success": False, "error": str(exc)})
