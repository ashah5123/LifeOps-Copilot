"""Shared service singletons.

Constructed once at import time and reused across the app.  Each service
is safe to use in mock/demo mode when GCP is not configured.
"""

from app.services.auth_service import AuthService
from app.services.document_ai_service import DocumentAIService
from app.services.firestore_service import FirestoreService
from app.services.gmail_service import GmailService
from app.services.google_oauth_service import GoogleOAuthService
from app.services.agent_runner import AgentRunner
from app.services.reminder_service import ReminderService
from app.services.storage_service import StorageService
from app.services.vertex_service import VertexService

# Core singletons
firestore_service = FirestoreService()
storage_service = StorageService()
auth_service = AuthService()
vertex_service = VertexService()
document_ai_service = DocumentAIService()
reminder_service = ReminderService()

# Google integrations
oauth_service = GoogleOAuthService()
gmail_service = GmailService(oauth_service=oauth_service)

# Agent orchestration
agent_runner = AgentRunner(vertex=vertex_service, firestore=firestore_service)
