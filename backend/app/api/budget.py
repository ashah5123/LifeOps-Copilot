from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.dependencies import firestore_service

router = APIRouter(prefix="/budget", tags=["budget"])


class BudgetPayload(BaseModel):
    title: str
    amount: float
    entryType: str


@router.post("/entries")
def create_budget_entry(payload: BudgetPayload) -> dict[str, object]:
    category = "Income" if payload.entryType == "income" else "General"
    record = {
        "id": str(uuid4()),
        "title": payload.title,
        "amount": payload.amount,
        "entryType": payload.entryType,
        "category": category
    }
    firestore_service.create("budget_entries", record)
    return record


@router.get("/entries")
def list_budget_entries() -> list[dict[str, object]]:
    return firestore_service.list_collection("budget_entries")


@router.get("/summary")
def get_budget_summary() -> dict[str, float]:
    entries = firestore_service.list_collection("budget_entries")
    total_income = sum(item["amount"] for item in entries if item.get("entryType") == "income")
    total_spent = sum(item["amount"] for item in entries if item.get("entryType") == "expense")
    return {
        "totalIncome": total_income,
        "totalSpent": total_spent,
        "remainingBalance": total_income - total_spent
    }


@router.patch("/entries/{entry_id}")
def update_budget_entry(entry_id: str, payload: BudgetPayload) -> dict[str, object]:
    updated = firestore_service.update(
        "budget_entries",
        entry_id,
        {"title": payload.title, "amount": payload.amount, "entryType": payload.entryType}
    )
    return updated or {"id": entry_id, "status": "not-found"}
