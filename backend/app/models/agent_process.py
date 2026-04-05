from __future__ import annotations

from pydantic import BaseModel


class AgentProcessPayload(BaseModel):
    content: str
    file_id: str | None = None
    source_module: str | None = None
    metadata: dict = {}


class AgentProcessResult(BaseModel):
    process_id: str
    domain: str
    extracted_data: dict
    suggested_actions: list[str]
    approval_required: bool
    results: dict
