"""Agents API — unified agent pipeline (text and file)."""

from __future__ import annotations

import os
import tempfile
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.agents.router_agent import RouterAgent
from app.core.dependencies import agent_runner, firestore_service, storage_service
from app.models.agent_process import AgentProcessPayload, AgentProcessResult
from app.services.file_processor_service import process_file

router = APIRouter(prefix="/agents", tags=["agents"])

_TEXT_SUFFIXES = {".txt", ".md", ".csv", ".json", ".html", ".htm"}


def _extract_text_from_bytes(file_name: str, content_type: str, file_content: bytes) -> str:
    """Best-effort text extraction for PDF, images (OCR), and plain-text-like uploads."""
    name = file_name or "upload"
    ctype = content_type or ""
    suffix = os.path.splitext(name)[1].lower()

    if ctype == "application/pdf" or suffix == ".pdf":
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_content)
            path = tmp.name
        try:
            return process_file(path, "application/pdf")
        finally:
            os.unlink(path)

    if ctype.startswith("image/"):
        ext = suffix if suffix else ".img"
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(file_content)
            path = tmp.name
        try:
            return process_file(path, ctype)
        finally:
            os.unlink(path)

    if ctype.startswith("text/") or suffix in _TEXT_SUFFIXES:
        return file_content.decode("utf-8", errors="replace").strip()

    if len(file_content) <= 2 * 1024 * 1024:
        decoded = file_content.decode("utf-8", errors="replace").strip()
        if decoded and "\x00" not in decoded[:2000]:
            return decoded

    return ""


def _validate_domain(domain: str | None) -> str | None:
    if domain is None or not str(domain).strip():
        return None
    key = str(domain).strip().lower()
    if key not in RouterAgent.DOMAINS:
        allowed = ", ".join(sorted(RouterAgent.DOMAINS))
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain '{domain}'. Use one of: {allowed}",
        )
    return key


@router.post("/process", response_model=AgentProcessResult)
def process_text_through_pipeline(payload: AgentProcessPayload) -> dict[str, object]:
    """Run the full agent pipeline on text content.

    Pipeline: router → extractor → planner → action → review → persist.
    Optionally fetches additional context from a previously uploaded file.
    Stores results in Firestore (domain collections, feed_items, approvals).
    """
    if not payload.content and not payload.file_id:
        raise HTTPException(status_code=400, detail="Provide 'content', 'file_id', or both.")

    return agent_runner.orchestrate_pipeline(
        content=payload.content,
        file_id=payload.file_id,
        source_module=payload.source_module,
        metadata=payload.metadata,
    )


@router.post("/process-file")
async def process_upload_through_pipeline(
    file: UploadFile = File(..., description="Document, image, or text file to run through the agent pipeline"),
    domain: str | None = Query(
        default=None,
        description="Optional domain to force (skips router). One of: inbox, career, calendar, budget, mixed",
    ),
    persist: bool = Query(
        default=True,
        description="If true, store upload metadata (and file) like POST /api/uploads",
    ),
) -> dict[str, object]:
    """Upload a file, extract text, run router → extractor → planner → review → action → memory."""
    file_content = await file.read()
    if not file_content:
        raise HTTPException(status_code=400, detail="Empty file")

    file_name = file.filename or "upload"
    content_type = file.content_type or ""

    extracted_text = _extract_text_from_bytes(file_name, content_type, file_content)
    if not extracted_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from this file type. Use PDF, image, or plain text.",
        )

    forced = _validate_domain(domain)
    if forced:
        pipeline = agent_runner.process_for_domain(extracted_text, forced)
    else:
        pipeline = agent_runner.process(extracted_text)

    upload_meta: dict[str, object] | None = None
    if persist:
        file_url = storage_service.upload_file(file_name, file_content)
        upload_id = str(uuid4())
        upload_meta = {
            "uploadId": upload_id,
            "fileName": file_name,
            "fileUrl": file_url,
            "status": "processed",
            "extractedText": extracted_text,
        }
        firestore_service.create("uploads", upload_meta)

    return {
        "upload": upload_meta,
        "contentLength": len(extracted_text),
        "domain": forced or (pipeline.get("route") or {}).get("domain"),
        "pipeline": pipeline,
    }
