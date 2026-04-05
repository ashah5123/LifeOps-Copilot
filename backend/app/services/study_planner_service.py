import re
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Typical study multiplier per credit hour (hours/week)
CREDIT_STUDY_MULTIPLIER = 2.0

# Difficulty weight by keyword found in course name
DIFFICULTY_KEYWORDS = {
    "high": ["algorithms", "machine learning", "operating systems", "compilers",
             "theory", "calculus", "linear algebra", "physics", "architecture"],
    "medium": ["data structures", "systems", "networks", "statistics",
               "database", "software engineering", "discrete"],
    "low": ["intro", "survey", "elective", "seminar", "writing", "communication"],
}

STUDY_BLOCK_DURATION_HOURS = 2  # preferred study block length

# Days of week
WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _course_difficulty(course_name: str) -> str:
    name_lower = course_name.lower()
    for kw in DIFFICULTY_KEYWORDS["high"]:
        if kw in name_lower:
            return "high"
    for kw in DIFFICULTY_KEYWORDS["medium"]:
        if kw in name_lower:
            return "medium"
    return "low"


def _difficulty_weight(difficulty: str) -> float:
    return {"high": 1.5, "medium": 1.0, "low": 0.7}.get(difficulty, 1.0)


def _parse_date(date_str: str) -> date | None:
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue
    return None


def _week_start(week: str) -> date | None:
    """Accept YYYY-WNN (ISO week) or YYYY-MM-DD (treated as the Monday of that week)."""
    try:
        if "-W" in week:
            year, wnum = week.split("-W")
            d = date.fromisocalendar(int(year), int(wnum), 1)
            return d
        return date.fromisoformat(week) - timedelta(days=date.fromisoformat(week).weekday())
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# StudyPlannerService
# ---------------------------------------------------------------------------

class StudyPlannerService:

    # ------------------------------------------------------------------
    # parse_syllabus
    # ------------------------------------------------------------------

    def parse_syllabus(self, syllabus_text: str) -> dict:
        text = syllabus_text

        # --- Course info ---
        course_name = ""
        course_code = ""
        instructor = ""
        credits = 3  # default

        for line in text.splitlines()[:30]:
            line = line.strip()
            if re.search(r"\b[A-Z]{2,4}\s?\d{3,4}\b", line) and not course_code:
                match = re.search(r"([A-Z]{2,4}\s?\d{3,4})", line)
                if match:
                    course_code = match.group(1)
                    course_name = line.replace(course_code, "").strip(" :—-")
            if re.search(r"instructor|professor|taught by", line, re.I):
                name_match = re.search(r"(?:instructor|professor|taught by)[:\s]+(.+)", line, re.I)
                if name_match:
                    instructor = name_match.group(1).strip()
            if re.search(r"\bcredit", line, re.I):
                num = re.search(r"(\d+)\s*credit", line, re.I)
                if num:
                    credits = int(num.group(1))

        # --- Assignments ---
        assignments = []
        assign_pattern = re.compile(
            r"(assignment|homework|hw|project|lab|quiz|problem set|ps)\s*#?\d*[\s:—-]*(.{0,60})"
            r"(?:.*?due[:\s]+([A-Za-z]+\s\d{1,2},?\s?\d{4}|\d{1,2}/\d{1,2}/\d{2,4}|\d{4}-\d{2}-\d{2}))?",
            re.I,
        )
        weight_pattern = re.compile(r"(\d+)\s*%")
        for match in assign_pattern.finditer(text):
            title = f"{match.group(1).title()} {match.group(2).strip()}".strip()
            due_raw = match.group(3) or ""
            due_date = str(_parse_date(due_raw)) if due_raw and _parse_date(due_raw) else ""
            weight_match = weight_pattern.search(match.group(0))
            assignments.append({
                "title": title[:80],
                "due_date": due_date,
                "weight": int(weight_match.group(1)) if weight_match else 0,
                "type": match.group(1).lower(),
            })

        # --- Exams ---
        exams = []
        exam_pattern = re.compile(
            r"(midterm|final|exam|test|quiz)\s*(?:#?\d+)?[\s:—-]*(.{0,60})"
            r"(?:.*?(?:on|date)[:\s]+([A-Za-z]+\s\d{1,2},?\s?\d{4}|\d{1,2}/\d{1,2}/\d{2,4}|\d{4}-\d{2}-\d{2}))?",
            re.I,
        )
        for match in exam_pattern.finditer(text):
            title = f"{match.group(1).title()} {match.group(2).strip()}".strip()
            due_raw = match.group(3) or ""
            due_date = str(_parse_date(due_raw)) if due_raw and _parse_date(due_raw) else ""
            weight_match = weight_pattern.search(match.group(0))
            exams.append({
                "title": title[:80],
                "date": due_date,
                "weight": int(weight_match.group(1)) if weight_match else 0,
                "type": match.group(1).lower(),
            })

        # --- Grading breakdown ---
        grading = {}
        grading_section = re.search(
            r"(?:grading|grade breakdown|assessment)[^\n]*\n((?:[^\n]+\n?){2,12})",
            text, re.I,
        )
        if grading_section:
            for line in grading_section.group(1).splitlines():
                pct = re.search(r"(\d+)\s*%", line)
                item = re.sub(r"\d+\s*%", "", line).strip(" :—-.")
                if pct and item:
                    grading[item[:40]] = int(pct.group(1))

        return {
            "course_name": course_name or "Unknown Course",
            "course_code": course_code,
            "instructor": instructor,
            "credits": credits,
            "assignments": assignments[:20],
            "exams": exams[:10],
            "grading_breakdown": grading,
            "raw_length": len(text),
        }

    # ------------------------------------------------------------------
    # create_study_plan
    # ------------------------------------------------------------------

    def create_study_plan(self, courses: list[dict], study_hours_per_week: int) -> dict:
        if not courses:
            return {"error": "No courses provided.", "weekly_plans": []}

        # Allocate hours proportionally by credits × difficulty weight
        allocations = []
        total_weight = 0.0
        for c in courses:
            credits = c.get("credits", 3)
            difficulty = _course_difficulty(c.get("course_name", ""))
            weight = credits * _difficulty_weight(difficulty)
            allocations.append({"course": c, "difficulty": difficulty, "weight": weight})
            total_weight += weight

        plan_by_course = []
        for alloc in allocations:
            share = alloc["weight"] / total_weight if total_weight else 0
            hours = round(share * study_hours_per_week, 1)
            blocks = max(1, round(hours / STUDY_BLOCK_DURATION_HOURS))
            course = alloc["course"]

            # Find next upcoming deadline
            all_deadlines = [
                a.get("due_date", "") for a in course.get("assignments", []) if a.get("due_date")
            ] + [
                e.get("date", "") for e in course.get("exams", []) if e.get("date")
            ]
            next_deadline = min(all_deadlines) if all_deadlines else None

            plan_by_course.append({
                "course_name": course.get("course_name", "Unknown"),
                "course_code": course.get("course_code", ""),
                "credits": course.get("credits", 3),
                "difficulty": alloc["difficulty"],
                "allocated_hours_per_week": hours,
                "study_blocks_per_week": blocks,
                "suggested_block_duration_hours": STUDY_BLOCK_DURATION_HOURS,
                "next_deadline": next_deadline,
                "focus_tip": (
                    f"High priority — next deadline: {next_deadline}. Prioritise daily review."
                    if next_deadline and _parse_date(next_deadline) and
                    (_parse_date(next_deadline) - date.today()).days <= 7
                    else "Maintain regular study cadence."
                ),
            })

        # Sort by urgency: upcoming deadline first
        plan_by_course.sort(key=lambda x: x["next_deadline"] or "9999-99-99")

        return {
            "study_hours_per_week": study_hours_per_week,
            "total_courses": len(courses),
            "plan": plan_by_course,
            "weekly_tip": (
                "Break study sessions into 2-hour Pomodoro-style blocks with 15-min breaks. "
                "Prioritise courses with the nearest deadlines each morning."
            ),
        }

    # ------------------------------------------------------------------
    # detect_scheduling_conflicts
    # ------------------------------------------------------------------

    def detect_scheduling_conflicts(self, events: list[dict]) -> list[dict]:
        """
        Detect overlapping events.
        Each event should have: {title, date, start_time (HH:MM), end_time (HH:MM)}.
        """
        conflicts = []

        def to_minutes(t: str) -> int:
            try:
                h, m = map(int, t.split(":"))
                return h * 60 + m
            except (ValueError, AttributeError):
                return -1

        # Group by date
        by_date: dict[str, list] = {}
        for ev in events:
            d = ev.get("date", "")
            by_date.setdefault(d, []).append(ev)

        for day, day_events in by_date.items():
            for i, ev1 in enumerate(day_events):
                for ev2 in day_events[i + 1:]:
                    s1 = to_minutes(ev1.get("start_time", ""))
                    e1 = to_minutes(ev1.get("end_time", ""))
                    s2 = to_minutes(ev2.get("start_time", ""))
                    e2 = to_minutes(ev2.get("end_time", ""))

                    if -1 in (s1, e1, s2, e2):
                        continue

                    if s1 < e2 and s2 < e1:
                        conflicts.append({
                            "date": day,
                            "event_1": ev1.get("title", "Event 1"),
                            "event_1_time": f"{ev1.get('start_time')}–{ev1.get('end_time')}",
                            "event_2": ev2.get("title", "Event 2"),
                            "event_2_time": f"{ev2.get('start_time')}–{ev2.get('end_time')}",
                            "overlap_minutes": min(e1, e2) - max(s1, s2),
                            "severity": "high" if min(e1, e2) - max(s1, s2) >= 30 else "low",
                        })

        return sorted(conflicts, key=lambda c: (c["date"], c["overlap_minutes"]), reverse=True)

    # ------------------------------------------------------------------
    # suggest_study_blocks
    # ------------------------------------------------------------------

    def suggest_study_blocks(self, calendar_events: list[dict]) -> list[dict]:
        """
        Find 2-hour free windows in the next 7 days not occupied by calendar events.
        Returns up to 3 suggested blocks per day, skipping 9pm–8am.
        """
        suggestions = []
        today = date.today()

        # Build busy windows by date
        busy_by_date: dict[str, list[tuple[int, int]]] = {}
        for ev in calendar_events:
            d = ev.get("date", "")
            try:
                start = int(ev.get("start_time", "00:00").replace(":", ""))
                end = int(ev.get("end_time", "00:00").replace(":", ""))
                start_m = (start // 100) * 60 + (start % 100)
                end_m = (end // 100) * 60 + (end % 100)
                busy_by_date.setdefault(d, []).append((start_m, end_m))
            except (ValueError, AttributeError):
                continue

        for offset in range(7):
            day = today + timedelta(days=offset)
            day_str = str(day)
            busy = busy_by_date.get(day_str, [])

            # Scan 8am–9pm in 30-min increments for 2-hour free windows
            day_suggestions = []
            slot_start = 8 * 60  # 8:00
            day_end = 21 * 60    # 21:00

            while slot_start + STUDY_BLOCK_DURATION_HOURS * 60 <= day_end:
                slot_end = slot_start + STUDY_BLOCK_DURATION_HOURS * 60
                is_free = all(not (slot_start < b_end and b_start < slot_end) for b_start, b_end in busy)

                if is_free:
                    start_h, start_m = divmod(slot_start, 60)
                    end_h, end_m = divmod(slot_end, 60)
                    day_suggestions.append({
                        "date": day_str,
                        "day_of_week": WEEKDAY_NAMES[day.weekday()],
                        "start_time": f"{start_h:02d}:{start_m:02d}",
                        "end_time": f"{end_h:02d}:{end_m:02d}",
                        "duration_hours": STUDY_BLOCK_DURATION_HOURS,
                        "label": f"Study block — {WEEKDAY_NAMES[day.weekday()]} {start_h:02d}:{start_m:02d}",
                    })
                    slot_start = slot_end  # advance past this block
                else:
                    slot_start += 30  # try next 30-min window

            suggestions.extend(day_suggestions[:3])  # max 3 per day

        return suggestions

    # ------------------------------------------------------------------
    # calculate_workload
    # ------------------------------------------------------------------

    def calculate_workload(self, week: str, courses: list[dict] | None = None) -> dict:
        week_start = _week_start(week)
        if not week_start:
            return {"error": f"Invalid week format '{week}'. Use YYYY-WNN or YYYY-MM-DD."}

        week_end = week_start + timedelta(days=6)
        courses = courses or []

        by_course = []
        total_assignment_hours = 0.0
        total_exam_hours = 0.0
        deadline_count = 0

        for c in courses:
            course_name = c.get("course_name", "Unknown")
            difficulty = _course_difficulty(course_name)
            base_hours = c.get("credits", 3) * CREDIT_STUDY_MULTIPLIER * _difficulty_weight(difficulty)

            # Assignments due this week
            week_assignments = [
                a for a in c.get("assignments", [])
                if a.get("due_date") and week_start <= (_parse_date(a["due_date"]) or date.min) <= week_end
            ]
            week_exams = [
                e for e in c.get("exams", [])
                if e.get("date") and week_start <= (_parse_date(e["date"]) or date.min) <= week_end
            ]

            assignment_hours = sum(
                max(1.0, (a.get("weight", 10) / 10)) for a in week_assignments
            )
            exam_hours = len(week_exams) * 8.0  # 8h prep per exam

            total_hours = round(base_hours + assignment_hours + exam_hours, 1)
            total_assignment_hours += assignment_hours
            total_exam_hours += exam_hours
            deadline_count += len(week_assignments) + len(week_exams)

            by_course.append({
                "course_name": course_name,
                "course_code": c.get("course_code", ""),
                "difficulty": difficulty,
                "base_study_hours": round(base_hours, 1),
                "assignment_hours": round(assignment_hours, 1),
                "exam_prep_hours": round(exam_hours, 1),
                "total_hours": total_hours,
                "deadlines_this_week": [
                    {"title": a["title"], "due": a["due_date"], "type": "assignment"}
                    for a in week_assignments
                ] + [
                    {"title": e["title"], "due": e["date"], "type": "exam"}
                    for e in week_exams
                ],
            })

        total_hours = sum(c["total_hours"] for c in by_course)
        difficulty_score = min(100, round(total_hours / 40 * 100))

        return {
            "week": week,
            "week_start": str(week_start),
            "week_end": str(week_end),
            "total_hours": round(total_hours, 1),
            "deadline_count": deadline_count,
            "difficulty_score": difficulty_score,
            "difficulty_label": (
                "Heavy" if difficulty_score >= 70
                else "Moderate" if difficulty_score >= 40
                else "Light"
            ),
            "by_course": sorted(by_course, key=lambda x: x["total_hours"], reverse=True),
        }

    # ------------------------------------------------------------------
    # prioritize_assignments
    # ------------------------------------------------------------------

    def prioritize_assignments(self, assignments: list[dict]) -> list[dict]:
        """
        Sort assignments by: days until due (ascending), weight (descending), difficulty.
        Each assignment should have: {title, due_date, weight, type, course_name}.
        """
        today = date.today()

        scored = []
        for a in assignments:
            due = _parse_date(a.get("due_date", "")) if a.get("due_date") else None
            days_until = (due - today).days if due else 999
            weight = a.get("weight", 10)
            difficulty = _course_difficulty(a.get("course_name", ""))
            diff_score = {"high": 3, "medium": 2, "low": 1}.get(difficulty, 2)

            # Priority score: lower = do first
            priority_score = (days_until * 10) - (weight * 2) - diff_score

            urgency = (
                "urgent" if days_until <= 2
                else "high" if days_until <= 7
                else "medium" if days_until <= 14
                else "low"
            )

            scored.append({
                **a,
                "days_until_due": days_until if days_until < 999 else None,
                "urgency": urgency,
                "priority_score": priority_score,
                "suggested_start_date": str(today + timedelta(days=max(0, days_until - max(2, weight // 10))))
                if due else None,
            })

        return sorted(scored, key=lambda x: x["priority_score"])
