from datetime import datetime, timezone
from uuid import uuid4

from app.services.firestore_service import FirestoreService

COLLECTION = "reminders"


class ReminderService:
    def __init__(self, firestore: FirestoreService | None = None):
        self._db: FirestoreService | None = firestore

    # Injected lazily so the singleton in dependencies.py can pass it after construction
    def set_firestore(self, firestore: FirestoreService) -> None:
        self._db = firestore

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def create_reminder(
        self,
        title: str,
        date_time: str,
        source_module: str,
        deadline_id: str | None = None,
    ) -> dict:
        reminder = {
            "id": str(uuid4()),
            "title": title,
            "dateTime": date_time,
            "sourceModule": source_module,
            "deadlineId": deadline_id,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
        if self._db is not None:
            self._db.create(COLLECTION, reminder)
        return reminder

    def list_reminders(self) -> list[dict]:
        if self._db is not None:
            return self._db.list_collection(COLLECTION)
        return []

    def get_reminder(self, reminder_id: str) -> dict | None:
        if self._db is not None:
            return self._db.get(COLLECTION, reminder_id)
        return None

    def update_reminder(self, reminder_id: str, data: dict) -> dict | None:
        if self._db is not None:
            return self._db.update(COLLECTION, reminder_id, data)
        return None

    def delete_reminder(self, reminder_id: str) -> bool:
        if self._db is not None:
            return self._db.delete(COLLECTION, reminder_id)
        return False
