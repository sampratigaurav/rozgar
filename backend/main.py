"""Rozgar Backend — FastAPI entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import jobs, workers, partners, admin
from config import FRONTEND_URL

app = FastAPI(title="Rozgar Backend", version="1.0.0")

# IMPORTANT: allow_credentials=True requires explicit origins, NOT "*"
# Wildcard + credentials is blocked by all modern browsers.
ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router,    prefix="/jobs")
app.include_router(workers.router, prefix="/workers")
app.include_router(partners.router, prefix="/partners")
app.include_router(admin.router,   prefix="/admin")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "rozgar-backend", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    from config import PORT
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)