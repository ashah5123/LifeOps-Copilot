FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Tesseract OCR (fallback for Document AI)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Cloud Run sets PORT env var; default to 8080
ENV PORT=8080

# Run the app with uvicorn
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
