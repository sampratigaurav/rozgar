"""Partner endpoints — partners accepting jobs on behalf of workers."""

from fastapi import APIRouter, Form, HTTPException
from database import supabase

router = APIRouter()

_PARTNER_COMMISSION = 15


@router.post("/accept")
async def partner_accept(
    job_id: str = Form(...),
    worker_id: str = Form(...),
    partner_id: str = Form(...),
):
    """
    Partner accepts a job on behalf of a worker.

    Behaves identically to a direct worker accept, but also credits the partner's
    wallet with a fixed commission of ₹15.
    """
    try:
        supabase.table("jobs").update(
            {"status": "matched", "matched_worker_id": worker_id}
        ).eq("id", job_id).execute()

        supabase.table("workers").update({"is_available": False}).eq("id", worker_id).execute()

        partner_result = (
            supabase.table("partners").select("wallet_balance").eq("id", partner_id).single().execute()
        )
        if not partner_result.data:
            raise HTTPException(status_code=422, detail={"success": False, "error": "Partner not found"})

        current_balance = partner_result.data.get("wallet_balance", 0) or 0
        supabase.table("partners").update(
            {"wallet_balance": current_balance + _PARTNER_COMMISSION}
        ).eq("id", partner_id).execute()

        return {
            "success": True,
            "data": {"message": "Accepted on behalf of worker", "commission": _PARTNER_COMMISSION},
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail={"success": False, "error": str(exc)})
