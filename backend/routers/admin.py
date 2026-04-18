"""Admin endpoints — seed demo data, reset state, and view counts."""

from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter()

_SEED_WORKERS = [
    {
        "name": "Raju Electrician",
        "phone": "+919876543210",
        "type": "smartphone",
        "pin_code": "560001",
        "language": "kannada",
        "is_available": True,
        "partner_id": None,
    },
    {
        "name": "Suresh Plumber",
        "phone": "+919876543211",
        "type": "keypad",
        "pin_code": "560001",
        "language": "hindi",
        "is_available": True,
        "partner_id": None,
    },
    {
        "name": "Mohan Carpenter",
        "phone": "+919876543212",
        "type": "smartphone",
        "pin_code": "560001",
        "language": "tamil",
        "is_available": True,
        "partner_id": None,
    },
]


@router.post("/seed")
async def seed_workers():
    """
    Insert 3 demo workers for pin_code 560001 into the workers table.

    Idempotent in terms of intent — re-running will add duplicate rows if the
    workers already exist, so use only for fresh demo environments.
    """
    try:
        supabase.table("workers").insert(_SEED_WORKERS).execute()
        return {"success": True, "data": "3 workers seeded for pin_code 560001"}

    except Exception as exc:
        raise HTTPException(status_code=422, detail={"success": False, "error": str(exc)})


@router.post("/reset")
async def reset_demo():
    """
    Reset the demo environment.

    Marks all workers as available again and removes all pending/broadcast jobs.
    """
    try:
        supabase.table("workers").update({"is_available": True}).neq("id", "").execute()

        supabase.table("jobs").delete().eq("status", "pending").execute()
        supabase.table("jobs").delete().eq("status", "broadcast").execute()

        return {"success": True, "data": "Demo state reset"}

    except Exception as exc:
        raise HTTPException(status_code=422, detail={"success": False, "error": str(exc)})


@router.get("/status")
async def admin_status():
    """
    Return aggregate counts for workers, jobs, and partners.

    Useful for a demo dashboard or quick health snapshot.
    """
    try:
        total_workers = supabase.table("workers").select("id", count="exact").execute().count or 0
        available_workers = (
            supabase.table("workers").select("id", count="exact").eq("is_available", True).execute().count or 0
        )
        total_jobs = supabase.table("jobs").select("id", count="exact").execute().count or 0
        pending_jobs = (
            supabase.table("jobs").select("id", count="exact").eq("status", "pending").execute().count or 0
        )
        total_partners = supabase.table("partners").select("id", count="exact").execute().count or 0

        return {
            "success": True,
            "data": {
                "total_workers": total_workers,
                "available_workers": available_workers,
                "total_jobs": total_jobs,
                "pending_jobs": pending_jobs,
                "partners": total_partners,
            },
        }

    except Exception as exc:
        raise HTTPException(status_code=422, detail={"success": False, "error": str(exc)})
