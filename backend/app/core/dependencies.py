from app.services.agent_runner import AgentRunner
from app.services.auth_service import AuthService
from app.services.firestore_service import FirestoreService
from app.services.storage_service import StorageService


def get_firestore_service() -> FirestoreService:
    return FirestoreService()


def get_storage_service() -> StorageService:
    return StorageService()


def get_auth_service() -> AuthService:
    return AuthService()


firestore_service = get_firestore_service()
storage_service = get_storage_service()
auth_service = get_auth_service()
agent_runner = AgentRunner()
