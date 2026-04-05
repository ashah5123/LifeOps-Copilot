"""Agent routes — unified routing and processing endpoints.

These endpoints expose the full multi-agent pipeline (router -> extractor ->
planner -> review -> action -> memory) so the frontend can send any content
and receive structured, domain-classified results.
"""

from pydantic import BaseModel

from fastapi import APIRouter

from app.core.dependencies import agent_runner

router = APIRouter(prefix="/agents", tags=["agents"])


# ------------------------------------------------------------------
# Request / Response models
# ------------------------------------------------------------------

class RouteRequest(BaseModel):
    content: str


class ProcessRequest(BaseModel):
    content: str
    domain: str | None = None  # optional forced domain


class ProcessResponse(BaseModel):
    """Structured response from the full agent pipeline."""
    domain: str
    confidence: float
    title: str
    detail: str
    priority: str
    requiresApproval: bool
    recommendedActions: list[str]
    extractedFields: dict
    reviewNote: str
    memoryId: str


# ------------------------------------------------------------------
# POST /api/agents/route  — classify content into a domain
# ------------------------------------------------------------------

@router.post("/route")
def route_content(payload: RouteRequest) -> dict[str, str]:
    """Classify content into a domain (inbox/career/calendar/budget/mixed).

    This calls only the Router Agent for fast classification.
    """
    result = agent_runner.router.run(payload.content)
    return {"domain": result["domain"]}


# ------------------------------------------------------------------
# POST /api/agents/process  — full pipeline
# ------------------------------------------------------------------

@router.post("/process")
def process_content(payload: ProcessRequest) -> ProcessResponse:
    """Run content through the full 6-agent pipeline.

    Optionally specify a domain to skip the router agent.
    Returns a structured response with extracted fields, plan,
    and action items.
    """
    if payload.domain:
        result = agent_runner.process_for_domain(payload.content, payload.domain)
    else:
        result = agent_runner.process(payload.content)

    # Flatten the nested pipeline output into a clean response
    route = result.get("route", {})
    extracted = result.get("extracted", {})
    plan = result.get("plan", {})
    review = result.get("review", {})
    action = result.get("result", {})
    memory = result.get("memory", {})

    return ProcessResponse(
        domain=route.get("domain", "unknown"),
        confidence=extracted.get("confidence", review.get("confidence", 0.0)),
        title=action.get("title", "Processed"),
        detail=action.get("detail", ""),
        priority=plan.get("priority", "medium"),
        requiresApproval=review.get("requiresApproval", False),
        recommendedActions=plan.get("recommendedActions", []),
        extractedFields=extracted.get("fields", {}),
        reviewNote=review.get("reviewNote", ""),
        memoryId=memory.get("memoryId", ""),
    )


# ------------------------------------------------------------------
# GET /api/agents/memory  — list recent agent memory entries
# ------------------------------------------------------------------

@router.get("/memory")
def list_memory(limit: int = 20) -> list[dict]:
    """List recent agent memory entries."""
    return agent_runner.memory.list_memories(limit=limit)
