from fastapi import APIRouter

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary() -> dict[str, object]:
    return {
        "todayTasks": 3,
        "upcomingDeadlines": 2,
        "pendingApprovals": 1,
        "recentActivity": ["Uploaded syllabus", "Drafted email reply"]
    }


@router.get("/feed/today")
def get_today_feed() -> list[dict[str, str]]:
    return [
        {
            "id": "feed-1",
            "type": "task",
            "title": "Review calculus homework",
            "time": "2 hours ago"
        },
        {
            "id": "feed-2",
            "type": "reminder",
            "title": "Office hours at 3pm",
            "time": "30 minutes"
        }
    ]
