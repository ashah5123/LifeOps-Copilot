"""Router agent — classifies user input into a domain.

Domains: inbox, career, calendar, budget, mixed.

When Vertex AI is available, the agent uses the LLM with a system prompt.
Otherwise it falls back to keyword matching.
"""

from __future__ import annotations

from pathlib import Path

from app.services.vertex_service import VertexService

_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "router_prompt.md"


def _load_prompt() -> str:
    try:
        return _PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        return "Classify the input into: inbox, career, calendar, budget, or mixed."


class RouterAgent:
    """Classify user content into a domain."""

    DOMAINS = {"inbox", "career", "calendar", "budget", "mixed"}

    def __init__(self, vertex: VertexService | None = None) -> None:
        self._vertex = vertex or VertexService()
        self._system_prompt = _load_prompt()

    def run(self, content: str) -> dict[str, str]:
        """Return ``{"domain": "<domain>"}``."""
        if self._vertex.is_live:
            return self._llm_route(content)
        return self._keyword_route(content)

    # ------------------------------------------------------------------
    # LLM-based routing
    # ------------------------------------------------------------------

    def _llm_route(self, content: str) -> dict[str, str]:
        prompt = (
            f"{self._system_prompt}\n\n"
            f"User input:\n{content}\n\n"
            "Respond with ONLY the domain name (one word)."
        )
        raw = self._vertex.generate(prompt).strip().lower()
        domain = raw if raw in self.DOMAINS else "mixed"
        return {"domain": domain}

    # ------------------------------------------------------------------
    # Keyword fallback
    # ------------------------------------------------------------------

    @staticmethod
    def _keyword_route(content: str) -> dict[str, str]:
        lowered = content.lower()
        # Check inbox first — email-related keywords take priority
        if any(kw in lowered for kw in ("email", "professor", "reply", "inbox", "message", "gmail", "send", "forward")):
            domain = "inbox"
        elif any(kw in lowered for kw in ("resume", "job", "internship", "career", "apply", "company", "hiring")):
            domain = "career"
        elif any(kw in lowered for kw in ("class", "schedule", "exam", "assignment", "deadline", "syllabus", "lecture")):
            domain = "calendar"
        elif any(kw in lowered for kw in ("expense", "spent", "budget", "income", "rent", "cost", "paid", "$")):
            domain = "budget"
        else:
            domain = "mixed"
        return {"domain": domain}
