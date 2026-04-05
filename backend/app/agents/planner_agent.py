"""Planner agent — decides next actions based on extracted data.

Determines priority, recommended actions, and whether human approval
is required before execution.
"""

from __future__ import annotations

from pathlib import Path

from app.services.vertex_service import VertexService

_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "planner_prompt.md"


def _load_prompt() -> str:
    try:
        return _PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        return "Determine next actions, urgency, and approval requirements."


# Domains where external side-effects happen (email send, calendar write)
_APPROVAL_DOMAINS = {"inbox", "calendar"}


class PlannerAgent:
    """Create an action plan from extracted fields."""

    def __init__(self, vertex: VertexService | None = None) -> None:
        self._vertex = vertex or VertexService()
        self._system_prompt = _load_prompt()

    def run(self, domain: str, extracted: dict[str, object]) -> dict[str, object]:
        """Return a plan dict with priority, actions, and approval flag."""
        if self._vertex.is_live:
            return self._llm_plan(domain, extracted)
        return self._rule_plan(domain, extracted)

    # ------------------------------------------------------------------
    # LLM planning
    # ------------------------------------------------------------------

    def _llm_plan(self, domain: str, extracted: dict[str, object]) -> dict[str, object]:
        prompt = (
            f"{self._system_prompt}\n\n"
            f"Domain: {domain}\n"
            f"Extracted data: {extracted}\n\n"
            "Respond with a JSON object: {priority, recommendedActions, requiresApproval}"
        )
        data = self._vertex.generate_json(prompt, self._system_prompt)
        # Enforce approval for sensitive domains regardless of LLM output
        if domain in _APPROVAL_DOMAINS:
            data["requiresApproval"] = True
        return {
            "domain": domain,
            "priority": data.get("priority", "medium"),
            "recommendedActions": data.get("recommendedActions", []),
            "requiresApproval": data.get("requiresApproval", domain in _APPROVAL_DOMAINS),
            "extracted": extracted,
        }

    # ------------------------------------------------------------------
    # Rule-based fallback
    # ------------------------------------------------------------------

    @staticmethod
    def _rule_plan(domain: str, extracted: dict[str, object]) -> dict[str, object]:
        priority = "high" if domain in _APPROVAL_DOMAINS else "medium"
        actions: list[str] = ["Show result in today feed"]

        if domain == "inbox":
            actions.append("Draft reply for user review")
            actions.append("Await user approval before sending")
        elif domain == "career":
            actions.append("Show match analysis")
            actions.append("Suggest resume tailoring")
        elif domain == "calendar":
            actions.append("Create reminders")
            actions.append("Await user approval before calendar write")
        elif domain == "budget":
            actions.append("Log budget entry")
            actions.append("Update budget summary")

        return {
            "domain": domain,
            "priority": priority,
            "recommendedActions": actions,
            "requiresApproval": domain in _APPROVAL_DOMAINS,
            "extracted": extracted,
        }
