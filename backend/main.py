"""Rozgar Backend — FastAPI entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import jobs, workers, partners, admin

app = FastAPI(title="Rozgar Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/jobs")
app.include_router(workers.router, prefix="/workers")
app.include_router(partners.router, prefix="/partners")
app.include_router(admin.router, prefix="/admin")


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "rozgar-backend"}


if __name__ == "__main__":
    import uvicorn
    from config import PORT

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
