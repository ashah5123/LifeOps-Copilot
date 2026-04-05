"""Upload routes — file upload with automatic agent processing.

Uploaded files are:
1. Saved to Cloud Storage (or mock)
2. Text-extracted via file_processor_service (PDF, images) or Document AI
3. Auto-routed through the full agent pipeline (router→extractor→planner→review→action→memory)
"""

import os
import tempfile
from uuid import uuid4

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel

from app.core.dependencies import agent_runner, document_ai_service, firestore_service, storage_service
from app.services.file_processor_service import process_file

router = APIRouter(prefix="/uploads", tags=["uploads"])


class UploadResponse(BaseModel):
    uploadId: str
    fileName: str
    fileUrl: str
    status: str
    extractedText: str
    agentResult: dict | None = None


@router.post("")
async def upload_file(file: UploadFile) -> UploadResponse:
    file_content = await file.read()
    file_name = file.filename or "unknown"
    content_type = file.content_type or ""

    file_url = storage_service.upload_file(file_name, file_content)

    extracted_text = ""

    if content_type == "application/pdf" and document_ai_service.is_live:
        doc_result = document_ai_service.parse_document(file_content, content_type)
        extracted_text = doc_result.get("extractedText", "")

    if not extracted_text:
        suffix = os.path.splitext(file_name)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name
        try:
            extracted_text = process_file(tmp_path, content_type)
        finally:
            os.unlink(tmp_path)

    if not extracted_text and content_type.startswith("text/"):
        extracted_text = file_content.decode("utf-8", errors="replace")

    agent_result = None
    if extracted_text and len(extracted_text.strip()) > 10:
        try:
            pipeline_output = agent_runner.process(extracted_text)
            route = pipeline_output.get("route", {})
            extracted = pipeline_output.get("extracted", {})
            plan = pipeline_output.get("plan", {})
            review = pipeline_output.get("review", {})
            action = pipeline_output.get("result", {})
            memory = pipeline_output.get("memory", {})

            agent_result = {
                "domain": route.get("domain", "unknown"),
                "confidence": extracted.get("confidence", review.get("confidence", 0.0)),
                "title": action.get("title", "Processed"),
                "detail": action.get("detail", ""),
                "priority": plan.get("priority", "medium"),
                "requiresApproval": review.get("requiresApproval", False),
                "recommendedActions": plan.get("recommendedActions", []),
                "extractedFields": extracted.get("fields", {}),
                "reviewNote": review.get("reviewNote", ""),
                "memoryId": memory.get("memoryId", ""),
            }
        except Exception:
            pass

    upload_id = str(uuid4())
    status = "processed" if agent_result else ("extracted" if extracted_text else "uploaded")
    record = {
        "uploadId": upload_id,
        "fileName": file_name,
        "fileUrl": file_url,
        "status": status,
        "extractedText": extracted_text,
        "agentResult": agent_result,
    }
    firestore_service.create("uploads", record)

    return UploadResponse(**record)


@router.get("/{upload_id}")
def get_upload(upload_id: str) -> dict:
    record = firestore_service.get("uploads", upload_id)
    if record:
        return record
    return {
        "uploadId": upload_id,
        "fileName": "unknown",
        "status": "not-found",
        "extractedText": "",
        "agentResult": None,
    }
