"""Extractor agent — pulls structured fields from raw user content.

Fields vary by domain (e.g. sender/subject for inbox, company/role for
career).  Uses Vertex AI when available; otherwise returns a simple
keyword-based extraction.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from app.services.vertex_service import VertexService

_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "extractor_prompt.md"


def _load_prompt() -> str:
    try:
        return _PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        return "Extract structured fields from user content."


class ExtractorAgent:
    """Extract structured data from raw content given a domain."""

    def __init__(self, vertex: VertexService | None = None) -> None:
        self._vertex = vertex or VertexService()
        self._system_prompt = _load_prompt()

    def run(self, content: str, domain: str) -> dict[str, object]:
        """Return ``{"domain": ..., "fields": {...}}``."""
        if self._vertex.is_live:
            return self._llm_extract(content, domain)
        return self._keyword_extract(content, domain)

    # ------------------------------------------------------------------
    # LLM extraction
    # ------------------------------------------------------------------

    def _llm_extract(self, content: str, domain: str) -> dict[str, object]:
        prompt = (
            f"{self._system_prompt}\n\n"
            f"Domain: {domain}\n"
            f"User input:\n{content}\n\n"
            "Respond with a JSON object containing the extracted fields."
        )
        data = self._vertex.generate_json(prompt, self._system_prompt)
        return {"domain": domain, "fields": data}

    # ------------------------------------------------------------------
    # Keyword fallback
    # ------------------------------------------------------------------

    @staticmethod
    def _keyword_extract(content: str, domain: str) -> dict[str, object]:
        fields: dict[str, object] = {"summary": content[:200]}

        if domain == "inbox":
            fields["sender"] = _guess_email(content)
            fields["intent"] = "reply" if "reply" in content.lower() else "read"
        elif domain == "career":
            fields["company"] = _first_capitalized(content)
            fields["role"] = _guess_role(content)
            fields["skills"] = _guess_skills(content)
        elif domain == "calendar":
            fields["dates"] = _guess_dates(content)
            fields["title"] = content.split("\n")[0][:80]
        elif domain == "budget":
            fields["amount"] = _guess_amount(content)
            fields["category"] = "general"

        fields["confidence"] = 0.75
        return {"domain": domain, "fields": fields}


# ------------------------------------------------------------------
# Tiny helper extractors (keyword mode)
# ------------------------------------------------------------------

def _guess_email(text: str) -> str:
    match = re.search(r"[\w.-]+@[\w.-]+", text)
    return match.group(0) if match else "unknown"


def _first_capitalized(text: str) -> str:
    for word in text.split():
        if word[0:1].isupper() and len(word) > 2:
            return word
    return "Unknown"


def _guess_role(text: str) -> str:
    roles = ["intern", "engineer", "analyst", "developer", "designer", "manager"]
    lowered = text.lower()
    for r in roles:
        if r in lowered:
            return r.title()
    return "General"


def _guess_skills(text: str) -> list[str]:
    known = ["python", "java", "react", "sql", "aws", "gcp", "docker", "kubernetes",
             "javascript", "typescript", "node", "go", "rust", "c++", "machine learning"]
    lowered = text.lower()
    return [s for s in known if s in lowered] or ["general"]


def _guess_dates(text: str) -> list[str]:
    return re.findall(r"\d{4}-\d{2}-\d{2}", text) or re.findall(r"\d{1,2}/\d{1,2}/\d{2,4}", text) or []


def _guess_amount(text: str) -> float | None:
    match = re.search(r"\$?([\d,]+\.?\d*)", text)
    if match:
        try:
            return float(match.group(1).replace(",", ""))
        except ValueError:
            pass
    return None
