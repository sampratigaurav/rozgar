"""AI Endpoints — photo analysis."""
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from dependencies import get_current_user
from gemini import analyse_job_photo

router = APIRouter()

@router.post("/analyse")
async def analyse(
    image: UploadFile = File(...),
    category: str = Form(...),
    user=Depends(get_current_user),
):
    """Accept a job photo and category; return Gemini Vision scope/pricing/complexity."""
    try:
        image_bytes = await image.read()
        # Run the synchronous Gemini call in a separate thread
        result = await run_in_threadpool(analyse_job_photo, image_bytes, category)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
