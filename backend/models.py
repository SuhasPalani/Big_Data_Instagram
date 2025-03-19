from pydantic import BaseModel
from typing import List, Optional

class InfluencerRequest(BaseModel):
    usernames: List[str]
    request_id: Optional[str] = None

class InfluencerAnalytics(BaseModel):
    username: str
    followersCount: int
    followsCount: int
    postsCount: int
    engagementRate: float
    averageLikesPerPost: float
    averageCommentsPerPost: float
