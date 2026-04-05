"""Agent routes — routing, full pipeline processing, optional file upload."""

from __future__ import annotations

import os
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field

from app.agents.router_agent import RouterAgent
from app.core.dependencies import agent_runner, document_ai_service, firestore_service, storage_service

router = APIRouter(prefix="/agents", tags=["agents"])

_TEXT_SUFFIXES = {".txt", ".md", ".csv", ".json", ".html", ".htm"}


class RouteRequest(BaseModel):
    content: str


class ProcessRequest(BaseModel):
    """Compatible with frontend `{ content, domain }` and orchestration extras."""

    content: str = ""
    domain: str | None = None
    file_id: str | None = None
    source_module: str | None = None
    metadata: dict = Field(default_factory=dict)


def _resolve_mime(file_name: str, content_type: str) -> str:
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


def _pipeline_to_flat(pipeline: dict[str, object]) -> dict[str, object]:
    route = pipeline.get("route", {}) or {}
    extracted = pipeline.get("extracted", {}) or {}
    plan = pipeline.get("plan", {}) or {}
    review = pipeline.get("review", {}) or {}
    action = pipeline.get("result", {}) or {}
    memory = pipeline.get("memory", {}) or {}
    return {
        "domain": route.get("domain", "unknown"),
        "confidence": float(extracted.get("confidence", review.get("confidence", 0.0)) or 0.0),
        "title": action.get("title", "Processed"),
        "detail": action.get("detail", ""),
        "priority": plan.get("priority", "medium"),
        "requiresApproval": bool(review.get("requiresApproval", False)),
        "recommendedActions": plan.get("recommendedActions", []),
        "extractedFields": extracted.get("fields", {}),
        "reviewNote": review.get("reviewNote", ""),
        "memoryId": memory.get("memoryId", ""),
    }


def _orchestrate_to_flat(result: dict[str, object]) -> dict[str, object]:
    inner = result.get("results", {}) or {}
    route = inner.get("route", {}) or {}
    extracted = inner.get("extracted", {}) or {}
    plan = inner.get("plan", {}) or {}
    review = inner.get("review", {}) or {}
    action = inner.get("action", {}) or {}
    flat = {
        "domain": result.get("domain", route.get("domain", "unknown")),
        "confidence": float(extracted.get("confidence", review.get("confidence", 0.0)) or 0.0),
        "title": action.get("title", "Processed"),
        "detail": action.get("detail", ""),
        "priority": plan.get("priority", "medium"),
        "requiresApproval": bool(review.get("requiresApproval", False)),
        "recommendedActions": result.get("suggested_actions", plan.get("recommendedActions", [])),
        "extractedFields": (extracted.get("fields", {}) if isinstance(extracted, dict) else {}),
        "reviewNote": review.get("reviewNote", ""),
        "memoryId": "",
        "process_id": result.get("process_id", ""),
    }
    return flat


@router.post("/route")
def route_content(payload: RouteRequest) -> dict[str, str]:
    result = agent_runner.router.run(payload.content)
    return {"domain": str(result["domain"])}


@router.post("/process")
def process_content(payload: ProcessRequest) -> dict[str, object]:
    meta = payload.metadata or {}
    use_orchestrate = bool(payload.file_id) or bool(meta)

    if not payload.content.strip() and not payload.file_id:
        raise HTTPException(status_code=400, detail="Provide 'content', 'file_id', or both.")

    if use_orchestrate:
        out = agent_runner.orchestrate_pipeline(
            content=payload.content,
            file_id=payload.file_id,
            source_module=payload.domain or payload.source_module,
            metadata=meta,
        )
        return _orchestrate_to_flat(out)

    if payload.domain:
        pipeline = agent_runner.process_for_domain(payload.content, payload.domain)
    else:
        pipeline = agent_runner.process(payload.content)
    return _pipeline_to_flat(pipeline)


@router.get("/memory")
def list_memory(limit: int = 20) -> list[dict]:
    return agent_runner.memory.list_memories(limit=limit)


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
    file_content = await file.read()
    if not file_content:
        raise HTTPException(status_code=400, detail="Empty file")

    file_name = file.filename or "upload"
    mime_type = _resolve_mime(file_name, file.content_type or "")

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
