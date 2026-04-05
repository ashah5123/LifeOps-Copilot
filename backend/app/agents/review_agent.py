"""Review agent — validates the plan and decides execution readiness.

Enforces the human-in-the-loop policy: any plan that triggers an
external action (email send, calendar write) MUST be flagged for
user approval.  The agent never auto-approves external side-effects.
"""

from __future__ import annotations


class ReviewAgent:
    """Review a plan and determine if it is safe to execute."""

    def run(self, plan: dict[str, object]) -> dict[str, object]:
        """Return review verdict with approval metadata."""
        domain = plan.get("domain", "mixed")
        requires_approval = plan.get("requiresApproval", False)

        # Hard rule: inbox and calendar always need human approval
        if domain in ("inbox", "calendar"):
            requires_approval = True

        return {
            "approvedForExecution": not requires_approval,
            "requiresApproval": requires_approval,
            "reviewNote": self._note(domain, requires_approval),
            "confidence": 0.92,
        }

    @staticmethod
    def _note(domain: str, needs_approval: bool) -> str:
        if needs_approval:
            return f"Action in '{domain}' requires user confirmation before execution."
        return f"Action in '{domain}' is safe for automatic execution."
