"""Action agent — prepares the final actionable result for the UI.

Does NOT execute external side-effects (no email send, no calendar
write).  It packages a result object that the frontend can display and
the user can approve/reject.
"""

from __future__ import annotations


class ActionAgent:
    """Produce a UI-ready action payload from a reviewed plan."""

    def run(self, domain: str, plan: dict[str, object]) -> dict[str, object]:
        """Return a structured action result."""
        handler = _HANDLERS.get(domain, _default_action)
        return handler(domain, plan)


# ------------------------------------------------------------------
# Domain-specific action builders
# ------------------------------------------------------------------

def _inbox_action(domain: str, plan: dict[str, object]) -> dict[str, object]:
    extracted = plan.get("extracted", {})
    fields = extracted.get("fields", {}) if isinstance(extracted, dict) else {}
    return {
        "domain": domain,
        "title": "Inbox action prepared",
        "detail": "A draft reply has been generated. Review and approve before sending.",
        "draftReply": f"Hi, thank you for your message regarding: {fields.get('summary', 'your email')[:100]}",
        "requiresApproval": True,
        "plan": plan,
    }


def _career_action(domain: str, plan: dict[str, object]) -> dict[str, object]:
    extracted = plan.get("extracted", {})
    fields = extracted.get("fields", {}) if isinstance(extracted, dict) else {}
    return {
        "domain": domain,
        "title": "Career analysis ready",
        "detail": "Job match analysis and resume suggestions are available.",
        "company": fields.get("company", "Unknown"),
        "role": fields.get("role", "General"),
        "skills": fields.get("skills", []),
        "plan": plan,
    }


def _calendar_action(domain: str, plan: dict[str, object]) -> dict[str, object]:
    extracted = plan.get("extracted", {})
    fields = extracted.get("fields", {}) if isinstance(extracted, dict) else {}
    return {
        "domain": domain,
        "title": "Calendar events extracted",
        "detail": "Schedule entries and reminders are ready for review.",
        "dates": fields.get("dates", []),
        "requiresApproval": True,
        "plan": plan,
    }


def _budget_action(domain: str, plan: dict[str, object]) -> dict[str, object]:
    extracted = plan.get("extracted", {})
    fields = extracted.get("fields", {}) if isinstance(extracted, dict) else {}
    return {
        "domain": domain,
        "title": "Budget entry prepared",
        "detail": "Budget data has been extracted and is ready to log.",
        "amount": fields.get("amount"),
        "category": fields.get("category", "general"),
        "plan": plan,
    }


def _default_action(domain: str, plan: dict[str, object]) -> dict[str, object]:
    return {
        "domain": domain,
        "title": f"{domain.title()} action prepared",
        "detail": "Result generated and ready for UI consumption.",
        "plan": plan,
    }


_HANDLERS = {
    "inbox": _inbox_action,
    "career": _career_action,
    "calendar": _calendar_action,
    "budget": _budget_action,
}
