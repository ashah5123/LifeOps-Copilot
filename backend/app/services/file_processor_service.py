"""File processor service — extract text from uploaded files.

Supports: PDF (PyPDF2), images (Tesseract OCR), text, CSV, email (.eml).
Falls back gracefully when optional dependencies are missing.
"""

import logging

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    try:
        import PyPDF2

        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            pages = [reader.pages[i].extract_text() or "" for i in range(len(reader.pages))]
        return "\n".join(pages).strip()
    except Exception as exc:
        logger.warning("PDF text extraction failed for %s: %s", file_path, exc)
        return ""


def extract_text_from_image(file_path: str) -> str:
    try:
        from PIL import Image
        import pytesseract

        image = Image.open(file_path)
        return pytesseract.image_to_string(image).strip()
    except Exception as exc:
        logger.warning("Image OCR extraction failed for %s: %s", file_path, exc)
        return ""


def extract_text_from_text_file(file_path: str) -> str:
    """Read plain text, CSV, or email (.eml) files."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read().strip()
    except Exception as exc:
        logger.warning("Text file read failed for %s: %s", file_path, exc)
        return ""


def process_file(file_path: str, file_type: str) -> str:
    """Extract text from a file based on its MIME type."""
    if file_type == "application/pdf":
        return extract_text_from_pdf(file_path)
    if file_type.startswith("image/"):
        return extract_text_from_image(file_path)
    if file_type in ("text/plain", "text/csv", "message/rfc822", "text/html"):
        return extract_text_from_text_file(file_path)
    if file_path.endswith((".txt", ".csv", ".eml", ".md")):
        return extract_text_from_text_file(file_path)
    return ""
