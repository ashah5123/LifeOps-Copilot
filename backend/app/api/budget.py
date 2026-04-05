from datetime import date
from uuid import uuid4

from fastapi import APIRouter, Query
from pydantic import BaseModel

from fastapi.responses import StreamingResponse

from app.core.dependencies import firestore_service
from app.services.budget_analytics_service import BudgetAnalyticsService
from app.services.budget_insights_service import BudgetInsightsService
from app.services.budget_report_service import BudgetReportService

router = APIRouter(prefix="/budget", tags=["budget"])
analytics = BudgetAnalyticsService(firestore_service)
insights_service = BudgetInsightsService(firestore_service)
report_service = BudgetReportService(firestore_service)


# ------------------------------------------------------------------
# Request models
# ------------------------------------------------------------------

class BudgetPayload(BaseModel):
    title: str
    amount: float
    entryType: str


class BudgetEntryPayload(BaseModel):
    title: str
    amount: float
    entry_type: str
    category: str
    date: str = str(date.today())
    is_recurring: bool = False
    recurring_frequency: str | None = None
    notes: str | None = None


class BudgetGoalPayload(BaseModel):
    goal_type: str
    category: str
    target_amount: float
    current_amount: float = 0.0
    deadline: str
    status: str = "on_track"


# ------------------------------------------------------------------
# Existing endpoints (preserved)
# ------------------------------------------------------------------

@router.post("/entries")
def create_budget_entry(payload: BudgetEntryPayload) -> dict[str, object]:
    record = {
        "id": str(uuid4()),
        "title": payload.title,
        "amount": payload.amount,
        "entry_type": payload.entry_type,
        "category": payload.category,
        "date": payload.date,
        "is_recurring": payload.is_recurring,
        "recurring_frequency": payload.recurring_frequency,
        "notes": payload.notes,
        "created_at": str(date.today()),
    }
    firestore_service.create("budget_entries", record)
    return record


@router.get("/entries")
def list_budget_entries() -> list[dict[str, object]]:
    return firestore_service.list_collection("budget_entries")


@router.get("/summary")
def get_budget_summary() -> dict[str, float]:
    entries = firestore_service.list_collection("budget_entries")
    total_income = sum(e["amount"] for e in entries if e.get("entry_type") == "income")
    total_spent = sum(e["amount"] for e in entries if e.get("entry_type") == "expense")
    return {
        "totalIncome": total_income,
        "totalSpent": total_spent,
        "remainingBalance": total_income - total_spent,
    }


@router.patch("/entries/{entry_id}")
def update_budget_entry(entry_id: str, payload: BudgetEntryPayload) -> dict[str, object]:
    updated = firestore_service.update("budget_entries", entry_id, payload.model_dump())
    return updated or {"id": entry_id, "status": "not-found"}


@router.get("/summary/{month}")
def get_monthly_summary(month: str) -> dict:
    return analytics.get_monthly_summary(month)


@router.get("/breakdown/{entry_type}")
def get_category_breakdown(
    entry_type: str,
    month: str = Query(default=None),
) -> dict:
    if not month:
        month = str(date.today())[:7]
    return analytics.get_category_breakdown(entry_type, month)


@router.get("/trends")
def get_spending_trends(months: int = Query(default=6, ge=1, le=24)) -> dict:
    return analytics.get_spending_trends(months)


@router.get("/health")
def get_budget_health() -> dict:
    return analytics.get_budget_health_score()


@router.get("/anomalies")
def detect_anomalies() -> list:
    return analytics.detect_anomalies()


@router.get("/forecast")
def forecast_budget() -> dict:
    return analytics.forecast_next_month()


@router.get("/recurring")
def get_recurring_expenses() -> list:
    return analytics.get_recurring_expenses()


@router.post("/goals")
def create_budget_goal(payload: BudgetGoalPayload) -> dict:
    record = {"id": str(uuid4()), **payload.model_dump()}
    firestore_service.create("budget_goals", record)
    return record


@router.get("/goals")
def list_budget_goals() -> list:
    return firestore_service.list_collection("budget_goals")


@router.get("/goals/progress")
def get_goals_progress() -> dict:
    return analytics.compare_with_goals()


@router.get("/insights")
def get_budget_insights() -> dict:
    return {
        "insights": insights_service.generate_insights(),
        "recommendations": insights_service.get_recommendations(),
    }


@router.get("/entries/filter")
def filter_entries(
    entry_type: str = Query(default=None),
    category: str = Query(default=None),
    start_date: str = Query(default=None),
    end_date: str = Query(default=None),
    min_amount: float = Query(default=None),
    max_amount: float = Query(default=None),
) -> list:
    entries = firestore_service.list_collection("budget_entries")
    if entry_type:
        entries = [e for e in entries if e.get("entry_type") == entry_type]
    if category:
        entries = [e for e in entries if e.get("category") == category]
    if start_date:
        entries = [e for e in entries if e.get("date", "") >= start_date]
    if end_date:
        entries = [e for e in entries if e.get("date", "") <= end_date]
    if min_amount is not None:
        entries = [e for e in entries if e.get("amount", 0) >= min_amount]
    if max_amount is not None:
        entries = [e for e in entries if e.get("amount", 0) <= max_amount]
    return entries


@router.get("/reports/monthly/{month}")
def get_monthly_report(month: str) -> dict:
    return report_service.generate_monthly_report(month)


@router.get("/reports/yearly/{year}")
def get_yearly_report(year: str) -> dict:
    return report_service.generate_yearly_report(year)


@router.get("/reports/export")
def export_budget_csv(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
) -> StreamingResponse:
    csv_data = report_service.export_to_csv(start_date, end_date)
    filename = f"budget_{start_date}_{end_date}.csv"
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
