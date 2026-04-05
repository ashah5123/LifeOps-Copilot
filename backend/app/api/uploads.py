import os
import tempfile
from uuid import uuid4

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel

from app.core.dependencies import firestore_service, storage_service
from app.services.file_processor_service import process_file

router = APIRouter(prefix="/uploads", tags=["uploads"])


class UploadResponse(BaseModel):
    uploadId: str
    fileName: str
    fileUrl: str
    status: str
    extractedText: str


@router.post("")
async def upload_file(file: UploadFile) -> UploadResponse:
    file_content = await file.read()
    file_name = file.filename or "unknown"
    content_type = file.content_type or ""

    file_url = storage_service.upload_file(file_name, file_content)

    # Write to a temp file so file_processor_service can open it by path
    suffix = os.path.splitext(file_name)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name

    try:
        extracted_text = process_file(tmp_path, content_type)
    finally:
        os.unlink(tmp_path)

    upload_id = str(uuid4())
    record = {
        "uploadId": upload_id,
        "fileName": file_name,
        "fileUrl": file_url,
        "status": "processed" if extracted_text else "uploaded",
        "extractedText": extracted_text,
    }
    firestore_service.create("uploads", record)

    return UploadResponse(**record)


@router.get("/{upload_id}")
def get_upload(upload_id: str) -> dict[str, str]:
    record = firestore_service.get("uploads", upload_id)
    if record:
        return record
    return {
        "uploadId": upload_id,
        "fileName": "unknown",
        "status": "not-found",
        "extractedText": "",
    }
