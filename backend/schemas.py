from pydantic import BaseModel, Field
from typing import Optional

class AcceptJobRequest(BaseModel):
    job_id: str = Field(..., min_length=1)
    worker_id: str = Field(..., min_length=1)

class PartnerAcceptJobRequest(BaseModel):
    job_id: str = Field(..., min_length=1)
    worker_id: str = Field(..., min_length=1)
    partner_id: str = Field(..., min_length=1)
