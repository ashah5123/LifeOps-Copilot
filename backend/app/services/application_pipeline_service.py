from datetime import date, timedelta


PIPELINE_STATUSES = ["saved", "applied", "screening", "interview", "offer", "rejected", "accepted"]

# Days without a status change before a follow-up is suggested
FOLLOWUP_THRESHOLD_DAYS = 7


class ApplicationPipelineService:
    def __init__(self, firestore_service):
        self.db = firestore_service

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _all_applications(self) -> list[dict]:
        return self.db.list_collection("applications")

    def _days_since(self, date_str: str) -> int | None:
        try:
            applied = date.fromisoformat(date_str)
            return (date.today() - applied).days
        except (ValueError, TypeError):
            return None

    # ------------------------------------------------------------------
    # get_pipeline_overview
    # ------------------------------------------------------------------

    def get_pipeline_overview(self) -> dict:
        applications = self._all_applications()
        counts: dict[str, int] = {s: 0 for s in PIPELINE_STATUSES}

        for app in applications:
            status = app.get("status", "saved")
            if status in counts:
                counts[status] += 1
            else:
                counts["saved"] += 1

        total = len(applications)
        active = total - counts.get("rejected", 0) - counts.get("accepted", 0)

        return {
            "total": total,
            "active": active,
            "by_status": counts,
            "pipeline": [
                {"stage": s, "count": counts[s]}
                for s in PIPELINE_STATUSES
            ],
        }

    # ------------------------------------------------------------------
    # get_upcoming_interviews
    # ------------------------------------------------------------------

    def get_upcoming_interviews(self) -> list[dict]:
        today = date.today()
        window_end = today + timedelta(days=7)
        upcoming = []

        for app in self._all_applications():
            for interview in app.get("interview_dates", []):
                interview_date_str = interview.get("date", "")
                try:
                    interview_date = date.fromisoformat(interview_date_str)
                except (ValueError, TypeError):
                    continue

                if today <= interview_date <= window_end:
                    upcoming.append({
                        "application_id": app.get("id"),
                        "company": app.get("company"),
                        "role": app.get("role"),
                        "interview_date": interview_date_str,
                        "interview_type": interview.get("type", "unspecified"),
                        "location": interview.get("location", app.get("location", "")),
                        "days_until": (interview_date - today).days,
                    })

        return sorted(upcoming, key=lambda x: x["interview_date"])

    # ------------------------------------------------------------------
    # get_applications_needing_followup
    # ------------------------------------------------------------------

    def get_applications_needing_followup(self) -> list[dict]:
        today = date.today()
        needs_followup = []

        for app in self._all_applications():
            status = app.get("status", "saved")
            if status in ("rejected", "accepted", "offer"):
                continue

            # Use explicit follow_up_date if set
            follow_up_str = app.get("follow_up_date")
            if follow_up_str:
                try:
                    follow_up = date.fromisoformat(follow_up_str)
                    if follow_up <= today:
                        needs_followup.append({
                            "application_id": app.get("id"),
                            "company": app.get("company"),
                            "role": app.get("role"),
                            "status": status,
                            "follow_up_date": follow_up_str,
                            "days_overdue": (today - follow_up).days,
                            "reason": "Follow-up date has passed.",
                        })
                    continue
                except (ValueError, TypeError):
                    pass

            # Fall back to days since applied
            days = self._days_since(app.get("applied_date", ""))
            if days is not None and days > FOLLOWUP_THRESHOLD_DAYS and status == "applied":
                needs_followup.append({
                    "application_id": app.get("id"),
                    "company": app.get("company"),
                    "role": app.get("role"),
                    "status": status,
                    "applied_date": app.get("applied_date"),
                    "days_since_applied": days,
                    "reason": f"No response after {days} days. Consider sending a follow-up.",
                })

        return sorted(needs_followup, key=lambda x: x.get("days_since_applied", x.get("days_overdue", 0)), reverse=True)

    # ------------------------------------------------------------------
    # track_application_metrics
    # ------------------------------------------------------------------

    def track_application_metrics(self) -> dict:
        applications = self._all_applications()
        total = len(applications)

        if total == 0:
            return {
                "total_saved": 0,
                "total_applied": 0,
                "response_rate": 0.0,
                "interview_rate": 0.0,
                "offer_rate": 0.0,
                "acceptance_rate": 0.0,
                "avg_days_to_response": None,
            }

        status_counts: dict[str, int] = {s: 0 for s in PIPELINE_STATUSES}
        for app in applications:
            s = app.get("status", "saved")
            if s in status_counts:
                status_counts[s] += 1

        total_applied = sum(
            status_counts[s]
            for s in ("applied", "screening", "interview", "offer", "rejected", "accepted")
        )
        got_response = sum(
            status_counts[s]
            for s in ("screening", "interview", "offer", "rejected", "accepted")
        )
        got_interview = sum(status_counts[s] for s in ("interview", "offer", "accepted"))
        got_offer = sum(status_counts[s] for s in ("offer", "accepted"))
        accepted = status_counts["accepted"]

        def rate(numerator, denominator):
            return round(numerator / denominator * 100, 1) if denominator else 0.0

        # Average days from applied_date to screening/interview (proxy for time-to-response)
        response_days = []
        for app in applications:
            if app.get("status") in ("screening", "interview", "offer", "accepted"):
                days = self._days_since(app.get("applied_date", ""))
                if days is not None:
                    response_days.append(days)

        avg_days = round(sum(response_days) / len(response_days), 1) if response_days else None

        return {
            "total_saved": total,
            "total_applied": total_applied,
            "response_rate": rate(got_response, total_applied),
            "interview_rate": rate(got_interview, total_applied),
            "offer_rate": rate(got_offer, total_applied),
            "acceptance_rate": rate(accepted, got_offer),
            "avg_days_to_response": avg_days,
            "status_breakdown": status_counts,
        }

    # ------------------------------------------------------------------
    # suggest_next_action
    # ------------------------------------------------------------------

    def suggest_next_action(self, application_id: str) -> dict:
        app = self.db.get("applications", application_id)
        if not app:
            return {"error": "Application not found."}

        status = app.get("status", "saved")
        company = app.get("company", "the company")
        role = app.get("role", "this role")
        days_since = self._days_since(app.get("applied_date", ""))
        upcoming_interviews = [
            i for i in app.get("interview_dates", [])
            if i.get("date", "") >= str(date.today())
        ]

        actions = {
            "saved": {
                "action": "apply",
                "priority": "high",
                "message": f"You saved {role} at {company} but haven't applied yet. Tailor your resume and submit your application.",
                "tips": ["Use /career/tailor-resume to customise your resume.", "Use /career/generate-cover-letter for a personalised cover letter."],
            },
            "applied": {
                "action": "follow_up" if (days_since or 0) > FOLLOWUP_THRESHOLD_DAYS else "wait",
                "priority": "medium" if (days_since or 0) > FOLLOWUP_THRESHOLD_DAYS else "low",
                "message": (
                    f"It's been {days_since} days since you applied to {company}. Send a polite follow-up email."
                    if (days_since or 0) > FOLLOWUP_THRESHOLD_DAYS
                    else f"Application submitted to {company}. Allow 1–2 weeks for a response before following up."
                ),
                "tips": ["Keep your application tracker updated.", "Research the company while you wait."],
            },
            "screening": {
                "action": "prepare_screening",
                "priority": "high",
                "message": f"You have a screening scheduled with {company}. Prepare your elevator pitch and review the job description.",
                "tips": ["Research the company's mission and recent news.", "Prepare answers to common screening questions.", "Have questions ready for the recruiter."],
            },
            "interview": {
                "action": "prepare_interview" if upcoming_interviews else "send_thank_you",
                "priority": "high",
                "message": (
                    f"Interview coming up at {company}! Deep-dive into technical prep and behavioural questions."
                    if upcoming_interviews
                    else f"Send a thank-you email to {company} within 24 hours of your interview."
                ),
                "tips": (
                    ["Practice system design and coding problems.", "Prepare STAR-format stories.", "Review the job description one more time."]
                    if upcoming_interviews
                    else ["Reference a specific topic from the interview.", "Reiterate your enthusiasm for the role.", "Ask about next steps if you haven't already."]
                ),
            },
            "offer": {
                "action": "evaluate_offer",
                "priority": "high",
                "message": f"You have an offer from {company}! Review the compensation, benefits, and growth potential before deciding.",
                "tips": ["Compare salary against market data.", "Negotiate if the offer is below expectations.", "Ask about the team, culture, and career path."],
            },
            "rejected": {
                "action": "request_feedback",
                "priority": "low",
                "message": f"You were not selected for {role} at {company}. Consider requesting feedback and keep applying.",
                "tips": ["Ask for constructive feedback from the recruiter.", "Reflect on areas to improve.", "Don't be discouraged — rejections are part of the process."],
            },
            "accepted": {
                "action": "onboard",
                "priority": "low",
                "message": f"Congratulations on accepting the offer at {company}! Prepare for your first day.",
                "tips": ["Send a confirmation email with your start date.", "Research your team and manager.", "Set 30/60/90-day goals."],
            },
        }

        result = actions.get(status, {
            "action": "review",
            "priority": "medium",
            "message": f"Review your application for {role} at {company} and update the status.",
            "tips": [],
        })

        return {
            "application_id": application_id,
            "company": company,
            "role": role,
            "current_status": status,
            **result,
        }
