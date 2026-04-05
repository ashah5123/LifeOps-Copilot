"""Document AI service wrapper.

Provides document parsing via Google Cloud Document AI.  Falls back to
basic text extraction when GCP credentials or the SDK are not available.
"""

from __future__ import annotations

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class DocumentAIService:
    """Parse uploaded documents and extract structured content."""

    def __init__(self) -> None:
        self._client = None
        self._processor_name: str | None = None

        if settings.is_gcp_configured and settings.document_ai_processor_id:
            try:
                from google.cloud import documentai  # type: ignore[import]

                self._client = documentai.DocumentProcessorServiceClient()
                self._processor_name = (
                    f"projects/{settings.google_cloud_project}/"
                    f"locations/{settings.vertex_location}/"
                    f"processors/{settings.document_ai_processor_id}"
                )
                logger.info("Document AI initialised with processor %s", settings.document_ai_processor_id)
            except Exception as exc:
                logger.warning("Document AI init failed, using mock: %s", exc)

    @property
    def is_live(self) -> bool:
        return self._client is not None

    def parse_document(self, content: bytes | str, mime_type: str = "application/pdf") -> dict[str, object]:
        """Parse a document and return extracted text plus metadata.

        Args:
            content: Raw file bytes or plain text string.
            mime_type: MIME type of the document.

        Returns:
            Dict with ``documentType``, ``extractedText``, and ``metadata``.
        """
        if isinstance(content, str):
            return self._parse_text(content)

        if not self._client or not self._processor_name:
            return self._mock_parse(content)

        try:
            from google.cloud import documentai  # type: ignore[import]

            raw_document = documentai.RawDocument(content=content, mime_type=mime_type)
            request = documentai.ProcessRequest(name=self._processor_name, raw_document=raw_document)
            result = self._client.process_document(request=request)
            doc = result.document

            return {
                "documentType": "parsed",
                "extractedText": doc.text,
                "metadata": {
                    "pageCount": len(doc.pages),
                    "mimeType": mime_type,
                },
            }
        except Exception as exc:
            logger.error("Document AI parse failed, falling back to mock: %s", exc)
            return self._mock_parse(content)

    @staticmethod
    def _parse_text(text: str) -> dict[str, object]:
        """Wrap plain text into the standard response shape."""
        return {
            "documentType": "plain-text",
            "extractedText": text,
            "metadata": {"charCount": len(text)},
        }

    @staticmethod
    def _mock_parse(content: bytes) -> dict[str, object]:
        """Return a mock parse result when Document AI is not available."""
        snippet = content[:200].decode("utf-8", errors="replace")
        return {
            "documentType": "mock-parsed",
            "extractedText": f"[Mock Document AI] {snippet}",
            "metadata": {"byteSize": len(content)},
        }
