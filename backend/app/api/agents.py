"""Agents API — unified agent pipeline (text and file)."""

from __future__ import annotations

import os
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.agents.router_agent import RouterAgent
from app.core.dependencies import agent_runner, document_ai_service, firestore_service, storage_service
from app.models.agent_process import AgentProcessPayload, AgentProcessResult

router = APIRouter(prefix="/agents", tags=["agents"])

_TEXT_SUFFIXES = {".txt", ".md", ".csv", ".json", ".html", ".htm"}
_BINARY_MIME = {"application/pdf", "application/x-pdf"}


def _resolve_mime(file_name: str, content_type: str) -> str:
    """Return the best MIME type given the file name and declared content type."""
    suffix = os.path.splitext(file_name or "")[1].lower()
    if content_type and content_type != "application/octet-stream":
        return content_type
    return {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".tiff": "image/tiff",
        ".tif": "image/tiff",
    }.get(suffix, content_type or "application/octet-stream")


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
    """Upload a file, extract text and structure, run the full agent pipeline.

    Uses DocumentAIService for extraction (GCP Document AI → local PyPDF2/OCR fallback).
    """
    file_content = await file.read()
    if not file_content:
        raise HTTPException(status_code=400, detail="Empty file")

    file_name = file.filename or "upload"
    mime_type = _resolve_mime(file_name, file.content_type or "")

    # Plain text files: decode directly, skip binary extraction
    suffix = os.path.splitext(file_name)[1].lower()
    if mime_type.startswith("text/") or suffix in _TEXT_SUFFIXES:
        parse_result = document_ai_service.parse_document(
            file_content.decode("utf-8", errors="replace").strip(),
            mime_type,
        )
    else:
        parse_result = document_ai_service.parse_document(file_content, mime_type)

    extracted_text: str = parse_result["extractedText"]
    if not extracted_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from this file. Use PDF, image, or plain text.",
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
            "mimeType": mime_type,
            "status": "processed",
            "extractedText": extracted_text,
            "documentType": parse_result.get("documentType"),
            "structuredData": parse_result.get("structuredData"),
        }
        firestore_service.create("uploads", upload_meta)

    return {
        "upload": upload_meta,
        "documentType": parse_result.get("documentType"),
        "structuredData": parse_result.get("structuredData"),
        "contentLength": len(extracted_text),
        "domain": forced or (pipeline.get("route") or {}).get("domain"),
        "pipeline": pipeline,
    }
