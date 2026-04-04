class StorageService:
    def __init__(self):
        self.uploaded_files = []

    def upload_file(self, file_name: str, file_data: bytes) -> str:
        file_url = f"https://storage.googleapis.com/sparkup-uploads/{file_name}"
        self.uploaded_files.append({"name": file_name, "url": file_url})
        return file_url
