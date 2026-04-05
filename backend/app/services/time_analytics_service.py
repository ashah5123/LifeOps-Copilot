"""Demo time-use analytics: distribution, procrastination signals, focus windows."""

from __future__ import annotations

from datetime import date, timedelta

from app.services.study_planner_service import _week_start


def _current_iso_week_string() -> str:
    d = date.today()
    y, w, _ = d.isocalendar()
    return f"{y}-W{w:02d}"


def _week_bounds(week: str) -> tuple[date, date]:
    start = _week_start(week.strip())
    if start is None:
        raise ValueError("week must be YYYY-WNN (ISO week) or YYYY-MM-DD (week containing that day)")
    end = start + timedelta(days=6)
    return start, end


class TimeAnalyticsService:
    """Heuristic analytics over demo baselines; replace with real logs when available."""

    _demo_course_stats: dict[str, dict[str, float]] = {
        "cs 101": {"hours_logged": 42.0, "grade_percent": 88.0},
        "eng 200": {"hours_logged": 28.0, "grade_percent": 91.0},
        "phy 120": {"hours_logged": 55.0, "grade_percent": 79.0},
        "cs 499": {"hours_logged": 96.0, "grade_percent": 93.0},
    }

    def get_time_distribution(self, week: str) -> dict[str, object]:
        start, end = _week_bounds(week)
        seed = start.isocalendar()[1] % 5
        classes = 16.0 + seed
        study = 20.0 + (seed % 3) * 2
        work = 10.0 + (seed % 2)
        sleep_and_essentials = 56.0
        other_fixed = 18.0
        allocated = classes + study + work + sleep_and_essentials + other_fixed
        free_time = max(0.0, 168.0 - allocated)
        buckets = {
            "classes": round(classes, 1),
            "study": round(study, 1),
            "work": round(work, 1),
            "free_time": round(free_time, 1),
            "sleep_and_essentials": sleep_and_essentials,
            "other_fixed": other_fixed,
        }
        tracked = classes + study + work + free_time
        pct_base = tracked if tracked > 0 else 1.0
        percent = {
            "classes": round(100.0 * classes / pct_base, 1),
            "study": round(100.0 * study / pct_base, 1),
            "work": round(100.0 * work / pct_base, 1),
            "free_time": round(100.0 * free_time / pct_base, 1),
        }
        return {
            "week": week.strip(),
            "range": {"start": start.isoformat(), "end": end.isoformat()},
            "hours": {
                "classes": buckets["classes"],
                "study": buckets["study"],
                "work": buckets["work"],
                "free_time": buckets["free_time"],
            },
            "percent": percent,
            "hours_detail": buckets,
            "total_week_hours": 168.0,
            "source": "demo_model",
        }

    def detect_procrastination_patterns(self) -> list[dict[str, object]]:
        return [
            {
                "pattern": "late_night_study",
                "label": "Study sessions clustered after 11pm",
                "severity": "medium",
                "occurrences_last_30d": 9,
                "typical_window_local": "23:00–01:30",
            },
            {
                "pattern": "last_minute_work",
                "label": "Assignments started within 24h of deadline",
                "severity": "high",
                "occurrences_last_30d": 5,
                "share_of_assignments_percent": 35.0,
            },
            {
                "pattern": "context_switching",
                "label": "Frequent short bursts (<20 min) without completion",
                "severity": "low",
                "occurrences_last_30d": 14,
            },
        ]

    def suggest_productivity_improvements(self) -> list[dict[str, object]]:
        patterns = {p["pattern"]: p for p in self.detect_procrastination_patterns()}
        tips: list[dict[str, object]] = [
            {
                "id": "block_mornings",
                "title": "Protect two morning deep-work blocks",
                "detail": "Schedule 90-minute focus blocks before noon on Tue/Thu to front-load hard tasks.",
                "targets_patterns": ["last_minute_work"],
                "priority": "high",
            },
            {
                "id": "wind_down",
                "title": "Cap late-night study",
                "detail": "Move the last session to end by 10:30pm; use next morning for review instead.",
                "targets_patterns": ["late_night_study"],
                "priority": "medium",
            },
            {
                "id": "pomodoro_finish",
                "title": "Finish-in-one-sprint rule",
                "detail": "If you open a task, complete one deliverable (or one pomodoro) before switching apps.",
                "targets_patterns": ["context_switching"],
                "priority": "medium",
            },
        ]
        rank = {"low": 0, "medium": 1, "high": 2}
        sev = {k: str(v.get("severity", "low")) for k, v in patterns.items()}
        for tip in tips:
            levels = [sev.get(p, "low") for p in tip["targets_patterns"]]
            tip["related_severity"] = (
                max(levels, key=lambda s: rank.get(s, 0)) if levels else "low"
            )
        return tips

    def calculate_study_efficiency(self, course: str) -> dict[str, object]:
        key = course.strip().lower()
        stats = self._demo_course_stats.get(key)
        if stats is None:
            hours = 36.0
            grade = 84.0
        else:
            hours = stats["hours_logged"]
            grade = stats["grade_percent"]
        efficiency_score = round(grade / max(hours, 1e-6), 3)
        interpretation = (
            "strong_return_on_time" if efficiency_score >= 2.0 else
            "moderate" if efficiency_score >= 1.5 else
            "room_to_improve_study_quality"
        )
        return {
            "course": course.strip(),
            "hours_logged_semester": hours,
            "grade_percent": grade,
            "efficiency_score": efficiency_score,
            "interpretation": interpretation,
            "source": "demo_aggregates" if stats else "default_baseline",
        }

    def get_focus_time_recommendations(self) -> dict[str, object]:
        return {
            "best_windows": [
                {"weekday": "Tuesday", "start": "09:00", "end": "11:30", "score": 0.92, "reason": "Highest historical focus streaks"},
                {"weekday": "Thursday", "start": "08:30", "end": "10:00", "score": 0.88, "reason": "Low interruption rate"},
                {"weekday": "Saturday", "start": "10:00", "end": "12:00", "score": 0.81, "reason": "Catch-up blocks with fewer meetings"},
            ],
            "secondary_windows": [
                {"weekday": "Wednesday", "start": "14:00", "end": "15:30", "score": 0.72},
            ],
            "avoid": [
                {"weekday": "Friday", "start": "16:00", "end": "19:00", "reason": "Elevated context switching and shallow work"},
            ],
            "historical_basis": "rolling_8_week_demo_profile",
            "timezone_note": "Times are local wall-clock; connect calendar for personalization.",
        }


def resolve_week_argument(week: str | None) -> str:
    if week is None or not week.strip():
        return _current_iso_week_string()
    return week.strip()
