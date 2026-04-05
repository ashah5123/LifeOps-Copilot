"""Deadline helpers: upcoming/overdue lists, urgency, reminders, milestones."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_deadline(deadline: str) -> datetime:
    s = deadline.strip()
    if not s:
        raise ValueError("deadline must be a non-empty ISO date or datetime string")
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    if "T" in s:
        dt = datetime.fromisoformat(s)
    else:
        dt = datetime.fromisoformat(s)
        dt = dt.replace(tzinfo=timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _urgency_from_delta(total_seconds: float) -> str:
    if total_seconds < 0:
        return "overdue"
    if total_seconds < 86400:
        return "critical"
    if total_seconds < 3 * 86400:
        return "high"
    if total_seconds < 7 * 86400:
        return "medium"
    return "low"


def _signed_days_hours(total_seconds: float) -> tuple[int, int]:
    if total_seconds >= 0:
        secs = int(total_seconds)
        d, r = divmod(secs, 86400)
        return d, r // 3600
    secs = int(-total_seconds)
    d, r = divmod(secs, 86400)
    return -d, -(r // 3600)


class DeadlineService:
    """In-memory deadlines (demo); swap for Firestore when wired."""

    def __init__(self) -> None:
        today = _utc_now().date()
        self._items: list[dict[str, object]] = [
            {
                "id": "dl-demo-1",
                "title": "Problem Set 3",
                "type": "assignment",
                "dueDate": f"{today + timedelta(days=2)}T23:59:00+00:00",
                "status": "pending",
                "course": "CS 101",
            },
            {
                "id": "dl-demo-2",
                "title": "Midterm paper draft",
                "type": "assignment",
                "dueDate": f"{today + timedelta(days=5)}T17:00:00+00:00",
                "status": "pending",
                "course": "ENG 200",
            },
            {
                "id": "dl-demo-3",
                "title": "Capstone milestone",
                "type": "project",
                "dueDate": f"{today - timedelta(days=1)}T09:00:00+00:00",
                "status": "late",
                "course": "CS 499",
            },
            {
                "id": "dl-demo-4",
                "title": "Lab report",
                "type": "assignment",
                "dueDate": f"{today - timedelta(days=3)}T23:59:00+00:00",
                "status": "missed",
                "course": "PHY 120",
            },
        ]

    def list_all(self) -> list[dict[str, object]]:
        return list(self._items)

    def get_by_id(self, item_id: str) -> dict[str, object] | None:
        for it in self._items:
            if it.get("id") == item_id:
                return it
        return None

    def upsert_item(self, item: dict[str, object]) -> dict[str, object]:
        iid = str(item.get("id") or uuid4())
        item = {**item, "id": iid}
        for idx, existing in enumerate(self._items):
            if existing.get("id") == iid:
                self._items[idx] = item
                return item
        self._items.append(item)
        return item

    def get_upcoming_deadlines(self, days: int = 7) -> list[dict[str, object]]:
        now = _utc_now()
        end = now + timedelta(days=max(days, 0))
        upcoming: list[dict[str, object]] = []
        for it in self._items:
            due_raw = it.get("dueDate") or it.get("due_date")
            if not due_raw or not isinstance(due_raw, str):
                continue
            try:
                due = _parse_deadline(due_raw)
            except ValueError:
                continue
            if due < now or due > end:
                continue
            if str(it.get("status", "")).lower() in ("done", "completed", "submitted"):
                continue
            delta = (due - now).total_seconds()
            row = {
                **it,
                "urgency_level": _urgency_from_delta(delta),
                "seconds_until_due": int(delta),
            }
            upcoming.append(row)
        upcoming.sort(key=lambda r: int(r.get("seconds_until_due", 0)))
        for r in upcoming:
            r.pop("seconds_until_due", None)
        return upcoming

    def get_overdue_items(self) -> list[dict[str, object]]:
        now = _utc_now()
        overdue: list[dict[str, object]] = []
        for it in self._items:
            due_raw = it.get("dueDate") or it.get("due_date")
            if not due_raw or not isinstance(due_raw, str):
                continue
            try:
                due = _parse_deadline(due_raw)
            except ValueError:
                continue
            if due >= now:
                continue
            if str(it.get("status", "")).lower() in ("done", "completed", "submitted"):
                continue
            secs_late = int((now - due).total_seconds())
            overdue.append({**it, "urgency_level": "overdue", "seconds_overdue": secs_late})
        overdue.sort(key=lambda r: int(r.get("seconds_overdue", 0)), reverse=True)
        for r in overdue:
            r.pop("seconds_overdue", None)
        return overdue

    def calculate_time_until_deadline(self, deadline: str) -> dict[str, object]:
        end = _parse_deadline(deadline)
        now = _utc_now()
        total_seconds = (end - now).total_seconds()
        days, hours = _signed_days_hours(total_seconds)
        return {
            "days": days,
            "hours": hours,
            "urgency_level": _urgency_from_delta(total_seconds),
        }

    def suggest_deadline_reminders(self, deadline: str, task_size: str) -> list[dict[str, object]]:
        end = _parse_deadline(deadline)
        size = (task_size or "medium").strip().lower()
        if size == "small":
            offsets_days = (3, 1)
        elif size == "large":
            offsets_days = (14, 7, 3, 1)
        else:
            offsets_days = (7, 3, 1)

        now = _utc_now()
        suggestions: list[dict[str, object]] = []
        for d in offsets_days:
            send_at = end - timedelta(days=d)
            if send_at < now:
                continue
            suggestions.append(
                {
                    "offset_days_before_due": d,
                    "sendAt": send_at.isoformat(),
                    "label": f"{d} day(s) before due",
                }
            )
        return suggestions

    def create_milestone_breakdown(self, big_project: dict) -> list[dict[str, object]]:
        title = str(big_project.get("title") or "Project")
        due_raw = big_project.get("dueDate") or big_project.get("due_date")
        start_raw = big_project.get("startDate") or big_project.get("start_date")
        if not due_raw:
            raise ValueError("big_project must include dueDate or due_date")
        due = _parse_deadline(str(due_raw))
        if start_raw:
            start = _parse_deadline(str(start_raw))
        else:
            start = _utc_now()

        count = big_project.get("milestoneCount") or big_project.get("milestone_count") or 4
        try:
            n = int(count)
        except (TypeError, ValueError):
            n = 4
        n = max(2, min(n, 12))

        if due <= start:
            raise ValueError("due date must be after start date")

        total_seconds = (due - start).total_seconds()
        milestones: list[dict[str, object]] = []
        for i in range(1, n):
            frac = i / n
            ms_time = start + timedelta(seconds=total_seconds * frac)
            milestones.append(
                {
                    "order": i,
                    "title": f"{title} — milestone {i}",
                    "dueDate": ms_time.isoformat(),
                    "percent_complete_target": round(100 * frac),
                }
            )
        milestones.append(
            {
                "order": n,
                "title": f"{title} — final delivery",
                "dueDate": due.isoformat(),
                "percent_complete_target": 100,
            }
        )
        return milestones
