from uuid import uuid4

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel

from app.core.dependencies import storage_service

router = APIRouter(prefix="/uploads", tags=["uploads"])


class UploadResponse(BaseModel):
    uploadId: str
    fileName: str
    fileUrl: str
    status: str


@router.post("")
async def upload_file(file: UploadFile) -> UploadResponse:
    file_content = await file.read()
    file_url = storage_service.upload_file(file.filename or "unknown", file_content)
    upload_id = str(uuid4())
    return UploadResponse(
        uploadId=upload_id,
        fileName=file.filename or "unknown",
        fileUrl=file_url,
        status="uploaded"
    )


@router.get("/{upload_id}")
def get_upload(upload_id: str) -> dict[str, str]:
    return {
        "uploadId": upload_id,
        "fileName": "sample.pdf",
        "status": "processed"
    }
