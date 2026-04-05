"""Document AI service — text extraction and structured data parsing.

Priority order for each file type:
  1. Google Cloud Document AI (when GCP credentials + processor are configured)
  2. Local fallback: PyPDF2 for PDFs, pytesseract/Pillow for images
  3. UTF-8 decode for plain-text-like content

Structured data parsing runs on every extracted text regardless of
which extraction path was used.  The result dict is consumed directly
by the agent runner.
"""

from __future__ import annotations

import io
import logging
import re
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Document type keyword signatures (order matters — first match wins)
# ---------------------------------------------------------------------------

_DOC_SIGNATURES: list[tuple[str, list[str]]] = [
    ("invoice",  ["invoice", "bill to", "amount due", "total due", "invoice #", "invoice no"]),
    ("receipt",  ["receipt", "subtotal", "your total", "qty", "item price", "transaction id"]),
    ("resume",   ["resume", "curriculum vitae", " cv ", "work experience", "professional experience",
                  "education", "objective", "summary of qualifications"]),
    ("syllabus", ["syllabus", "course description", "learning objectives", "grading breakdown",
                  "office hours", "lecture", "midterm", "final exam", "assignment"]),
    ("email",    ["from:", "to:", "subject:", "dear ", "regards,", "sincerely,", "best regards"]),
    ("contract", ["agreement", "terms and conditions", "whereas", "obligations", "clause",
                  "hereinafter", "parties agree", "shall not"]),
    ("report",   ["executive summary", "introduction", "methodology", "conclusion", "findings",
                  "recommendations", "appendix"]),
]

# ---------------------------------------------------------------------------
# Regex helpers
# ---------------------------------------------------------------------------

_RE_DATE = re.compile(
    r"\b(?:"
    r"\d{4}[-/]\d{1,2}[-/]\d{1,2}"           # 2026-04-01
    r"|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}"        # 04/01/2026
    r"|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}"
    r"|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?,?\s+\d{4}"
    r")\b",
    re.IGNORECASE,
)

_RE_AMOUNT = re.compile(
    r"\$\s*[\d,]+(?:\.\d{2})?"               # $1,234.56
    r"|[\d,]+(?:\.\d{2})?\s*(?:USD|EUR|GBP)" # 1234.56 USD
    r"|\b(?:total|amount|price|cost|fee|salary|budget|balance)[\s:]+\$?[\d,]+(?:\.\d{2})?",
    re.IGNORECASE,
)

_RE_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}")

_RE_PHONE = re.compile(
    r"\b(?:\+?1[-.\s]?)?"
    r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
)

_RE_URL = re.compile(r"https?://[^\s\"'<>]+")

# Patterns that usually precede a person name on a single line
_RE_NAME_LABEL = re.compile(
    r"(?:name|from|to|dear|professor|prof\.|instructor|by|author|prepared by)"
    r"[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})",
    re.IGNORECASE,
)

# Action / task lines
_RE_TASK = re.compile(
    r"(?:^|\n)\s*(?:[-•*]\s*|todo[:\s]+|action[:\s]+|task[:\s]+)"
    r"(.{10,120})",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Main service
# ---------------------------------------------------------------------------

class DocumentAIService:
    """Extract text and structured data from uploaded documents."""

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
                logger.info("Document AI ready — processor %s", settings.document_ai_processor_id)
            except Exception as exc:
                logger.warning("Document AI init failed, using local fallback: %s", exc)

    @property
    def is_live(self) -> bool:
        return self._client is not None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def parse_document(
        self,
        content: bytes | str,
        mime_type: str = "application/pdf",
    ) -> dict[str, Any]:
        """Extract text and structured data from a document.

        Args:
            content: Raw file bytes or a plain-text string.
            mime_type: MIME type used to choose the extraction path.

        Returns:
            Dict with keys: documentType, extractedText, structuredData, metadata.
            This dict is safe to pass directly into the agent pipeline.
        """
        if isinstance(content, str):
            text = content
            page_count: int | None = None
        elif mime_type == "application/pdf" or mime_type == "application/x-pdf":
            text, page_count = self._extract_pdf(content)
        elif mime_type.startswith("image/"):
            text, page_count = self._extract_image(content, mime_type), None
        else:
            # Try GCP first for other types, else UTF-8 decode
            if self.is_live:
                text, page_count = self._gcp_extract(content, mime_type)
            else:
                text = content.decode("utf-8", errors="replace").strip()
                page_count = None

        structured = self.parse_structured_data(text)
        doc_type = self._detect_doc_type(text)

        meta: dict[str, Any] = {
            "mimeType": mime_type,
            "charCount": len(text),
            "confidence": 0.95 if self.is_live else 0.80,
        }
        if page_count is not None:
            meta["pageCount"] = page_count

        return {
            "documentType": doc_type,
            "extractedText": text,
            "structuredData": structured,
            "metadata": meta,
        }

    def extract_text(self, content: bytes, mime_type: str = "application/pdf") -> str:
        """Return only the extracted text string."""
        return self.parse_document(content, mime_type)["extractedText"]

    def parse_structured_data(self, text: str) -> dict[str, Any]:
        """Extract structured fields from arbitrary text.

        Runs purely on the text string — no file I/O.  Called automatically
        by parse_document(), but can also be called independently when text
        is already available (e.g. from a user's typed message).

        Returns:
            Dict with: dates, amounts, emails, phones, urls, names, tasks, keywords.
        """
        dates   = list(dict.fromkeys(_RE_DATE.findall(text)))
        amounts = list(dict.fromkeys(_RE_AMOUNT.findall(text)))
        emails  = list(dict.fromkeys(_RE_EMAIL.findall(text)))
        phones  = list(dict.fromkeys(_RE_PHONE.findall(text)))
        urls    = list(dict.fromkeys(_RE_URL.findall(text)))
        names   = list(dict.fromkeys(m.group(1).strip() for m in _RE_NAME_LABEL.finditer(text)))
        tasks   = [m.group(1).strip() for m in _RE_TASK.finditer(text)][:20]
        keywords = self._extract_keywords(text)

        return {
            "dates":    dates[:30],
            "amounts":  amounts[:20],
            "emails":   emails[:20],
            "phones":   phones[:10],
            "urls":     urls[:10],
            "names":    names[:10],
            "tasks":    tasks,
            "keywords": keywords,
        }

    # ------------------------------------------------------------------
    # Text extraction — local fallbacks
    # ------------------------------------------------------------------

    def _extract_pdf(self, content: bytes) -> tuple[str, int]:
        """Extract text from PDF bytes using PyPDF2 or GCP Document AI."""
        # Try GCP first if available
        if self.is_live:
            text, pages = self._gcp_extract(content, "application/pdf")
            if text.strip():
                return text, pages

        # Local fallback: PyPDF2
        try:
            import PyPDF2  # type: ignore[import]

            reader = PyPDF2.PdfReader(io.BytesIO(content))
            pages_text = [reader.pages[i].extract_text() or "" for i in range(len(reader.pages))]
            text = "\n\n".join(p.strip() for p in pages_text if p.strip())
            return text, len(reader.pages)
        except Exception as exc:
            logger.warning("PyPDF2 extraction failed: %s", exc)

        # Last resort: UTF-8 decode (works for text-based PDFs occasionally)
        snippet = content.decode("utf-8", errors="replace").strip()
        return snippet, 0

    def _extract_image(self, content: bytes, mime_type: str) -> str:
        """Extract text from image bytes using pytesseract (OCR)."""
        # Try GCP first if available (Document AI handles images too)
        if self.is_live:
            text, _ = self._gcp_extract(content, mime_type)
            if text.strip():
                return text

        # Local fallback: Pillow + pytesseract
        try:
            from PIL import Image       # type: ignore[import]
            import pytesseract          # type: ignore[import]

            image = Image.open(io.BytesIO(content))

            # Convert palette or RGBA images for better OCR accuracy
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")

            # Use page segmentation mode 3 (fully automatic) for general docs
            config = "--psm 3 --oem 3"
            return pytesseract.image_to_string(image, config=config).strip()
        except Exception as exc:
            logger.warning("pytesseract OCR failed: %s", exc)
            return ""

    def _gcp_extract(self, content: bytes, mime_type: str) -> tuple[str, int]:
        """Call Google Cloud Document AI and return (text, page_count)."""
        try:
            from google.cloud import documentai  # type: ignore[import]

            raw_doc = documentai.RawDocument(content=content, mime_type=mime_type)
            request = documentai.ProcessRequest(
                name=self._processor_name, raw_document=raw_doc
            )
            result = self._client.process_document(request=request)  # type: ignore[union-attr]
            doc = result.document
            return doc.text, len(doc.pages)
        except Exception as exc:
            logger.error("GCP Document AI call failed: %s", exc)
            return "", 0

    # ------------------------------------------------------------------
    # Document type detection
    # ------------------------------------------------------------------

    @staticmethod
    def _detect_doc_type(text: str) -> str:
        lowered = text.lower()
        for doc_type, keywords in _DOC_SIGNATURES:
            if sum(1 for kw in keywords if kw in lowered) >= 2:
                return doc_type
        return "general"

    # ------------------------------------------------------------------
    # Keyword extraction
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_keywords(text: str, top_n: int = 15) -> list[str]:
        """Return the most frequent meaningful words as topic keywords."""
        _STOPWORDS = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "this", "that", "these", "those", "it",
            "its", "we", "you", "he", "she", "they", "i", "my", "your", "our",
            "their", "as", "if", "not", "no", "so", "than", "then", "also",
            "each", "which", "who", "all", "any", "both", "can", "per",
        }
        words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
        freq: dict[str, int] = {}
        for w in words:
            if w not in _STOPWORDS:
                freq[w] = freq.get(w, 0) + 1
        return [w for w, _ in sorted(freq.items(), key=lambda x: -x[1])][:top_n]
