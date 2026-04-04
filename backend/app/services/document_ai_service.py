class DocumentAIService:
    def parse_document(self, file_path: str) -> dict[str, object]:
        return {
            "documentType": "syllabus",
            "extractedText": "Sample extracted text from document",
            "metadata": {"pageCount": 1}
        }
