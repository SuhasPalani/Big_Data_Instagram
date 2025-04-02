from pydantic import BaseModel
from typing import List, Optional, Dict


class InfluencerRequest(BaseModel):
    usernames: List[str]
    request_id: Optional[str] = None
    benchmark: Optional[bool] = False
    databases: Optional[Dict[str, bool]] = None


class PerformanceMetric(BaseModel):
    db_type: str
    operation: str
    execution_time: float
    timestamp: float
