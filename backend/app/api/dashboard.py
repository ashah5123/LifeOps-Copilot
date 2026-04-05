"""Dashboard aggregates — real counts from in-memory store (feed_items, drafts, etc.)."""

from datetime import date

from fastapi import APIRouter

from app.core.dependencies import firestore_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _today_str() -> str:
    return str(date.today())


@router.get("/summary")
def get_dashboard_summary() -> dict[str, object]:
    fs = firestore_service
    drafts = fs.list_collection("drafts")
    apps = fs.list_collection("applications")
    events = fs.list_collection("calendar_events")
    budget = fs.list_collection("budget_entries")
    approvals = fs.list_collection("approvals")
    today = _today_str()

    pending_drafts = len(
        [d for d in drafts if str(d.get("status", "")).lower() in ("", "pending", "pending_approval")],
    )
    pending_approvals = len([a for a in approvals if str(a.get("status", "")).lower() == "pending"])
    deadline_like = len(
        [
            e
            for e in events
            if str(e.get("event_type", "")).lower() in ("deadline", "exam", "assignment")
        ],
    )
    total_income = sum(float(e.get("amount", 0) or 0) for e in budget if e.get("entry_type") == "income")
    total_expense = sum(float(e.get("amount", 0) or 0) for e in budget if e.get("entry_type") == "expense")
    net = total_income - total_expense
    budget_alerts = 0
    if total_expense > 0 and total_income > 0 and net < 0:
        budget_alerts = 1
    elif total_expense > total_income * 1.1 and total_income > 0:
        budget_alerts = 1

    feed_today = len([f for f in fs.list_collection("feed_items") if str(f.get("date", "")) == today])
    active_apps = len([a for a in apps if str(a.get("status", "")).lower() not in ("rejected", "offer")])

    emails_needing = pending_drafts + pending_approvals

    return {
        "careerTracked": len(apps),
        "emailsNeedingReply": emails_needing,
        "deadlines": deadline_like
        if deadline_like
        else len([e for e in events if str(e.get("date", "")) >= today]),
        "tasksToday": feed_today + min(active_apps, 5),
        "budgetAlerts": budget_alerts,
        "inboxInsight": (
            f"{pending_drafts} draft(s) and {pending_approvals} approval(s) need attention."
            if (pending_drafts or pending_approvals)
            else "No pending inbox actions in the pipeline."
        ),
        "careerInsight": (
            f"{len(apps)} application(s) on file."
            if apps
            else "Track roles and interviews from the Career tab."
        ),
        "calendarInsight": (
            f"{len(events)} event(s) scheduled."
            if events
            else "Add classes and deadlines on the Calendar tab."
        ),
        "budgetInsight": (
            f"Net this period: ${net:,.0f}. Review spending on the Budget tab."
            if budget
            else "Log income and expenses to see insights."
        ),
    }


@router.get("/feed/today")
def get_today_feed() -> list[dict[str, str]]:
    fs = firestore_service
    items = fs.list_collection("feed_items")
    today = _today_str()
    domain_urls = {
        "inbox": "/inbox",
        "career": "/career",
        "calendar": "/calendar",
        "budget": "/budget",
    }

    def row_to_feed_item(it: dict) -> dict[str, str] | None:
        dom = str(it.get("domain", "inbox")).lower()
        if dom not in domain_urls:
            dom = "inbox"
        title = str(it.get("title", "") or "").strip()
        detail = str(it.get("detail", "") or "").strip()
        text = title if title else detail
        if not text:
            return None
        return {
            "id": str(it.get("id", "")),
            "text": text[:200],
            "category": dom,
            "actionLabel": "Open",
            "actionUrl": domain_urls[dom],
            "timestamp": str(it.get("timestamp", ""))[:19],
        }

    out: list[dict[str, str]] = []
    for it in reversed(items[-30:]):
        item_date = str(it.get("date", ""))
        if item_date and item_date != today:
            continue
        row = row_to_feed_item(it)
        if row:
            out.append(row)

    if not out:
        for it in reversed(items[-15:]):
            row = row_to_feed_item(it)
            if row:
                out.append(row)

    if not out:
        return [
            {
                "id": "default-1",
                "text": "Upload a document on the dashboard to run the AI pipeline.",
                "category": "inbox",
                "actionLabel": "Go",
                "actionUrl": "/dashboard",
                "timestamp": today,
            },
        ]
    return out[:15]
