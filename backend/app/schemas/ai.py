"""
AI Operations Agent — Request/Response Schemas

Response contract:
  VERIFIED           — directly supported by retrieved institutional data
  DERIVED            — calculated or logically derived from retrieved data
  RECOMMENDATION     — AI-generated suggestion based on evidence
  INSUFFICIENT_EVIDENCE — retrieved data is not sufficient to answer
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


class ClaimType(str, Enum):
    VERIFIED = "VERIFIED"
    DERIVED = "DERIVED"
    RECOMMENDATION = "RECOMMENDATION"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class AIQueryRequest(BaseModel):
    """
    Request body for the AI query endpoint.
    NOTE: role is intentionally absent — it is sourced from the JWT only.
    """
    question: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="Natural language question about institutional data"
    )


class AIClaim(BaseModel):
    """A single evidenced claim in the AI response."""
    type: ClaimType
    text: str
    source: Optional[str] = Field(
        None,
        description="The data source this claim is drawn from (e.g. 'events', 'clubs')"
    )


class AIQueryResponse(BaseModel):
    """
    Structured AI Operations Agent response.
    All claims are typed to distinguish verified facts from inferences.
    """
    answer: str = Field(description="Primary answer to the question")
    claims: List[AIClaim] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    sources: List[str] = Field(
        default_factory=list,
        description="Data collections consulted to answer this question"
    )
    processing_time_ms: Optional[int] = None
    role_context: Optional[str] = Field(
        None,
        description="Role under which this query was processed (for transparency)"
    )
