from fastapi import APIRouter
from pydantic import BaseModel

from app.core.dependencies import firestore_service

router = APIRouter(prefix="/approvals", tags=["approvals"])


class ApprovalPayload(BaseModel):
    approved: bool


@router.post("")
def create_approval(payload: dict[str, str]) -> dict[str, str]:
    firestore_service.create("approvals", payload)
    return payload


@router.patch("/{approval_id}")
def update_approval(approval_id: str, payload: ApprovalPayload) -> dict[str, object]:
    updated = firestore_service.update("approvals", approval_id, {"approved": payload.approved})
    return updated or {"id": approval_id, "status": "not-found"}


@router.get("/pending")
def list_pending_approvals() -> list[dict[str, object]]:
    approvals = firestore_service.list_collection("approvals")
    return [item for item in approvals if item.get("approved") is not True]
