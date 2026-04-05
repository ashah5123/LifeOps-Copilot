"""Memory agent — persists a snapshot of each processed action.

Uses Firestore when available; otherwise stores in an in-memory list
(sufficient for hackathon demos).
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import uuid4

from app.services.firestore_service import FirestoreService

logger = logging.getLogger(__name__)

COLLECTION = "agent_memory"


class MemoryAgent:
    """Store and retrieve action history."""

    def __init__(self, firestore: FirestoreService | None = None) -> None:
        self._fs = firestore or FirestoreService()

    def run(self, action_result: dict[str, object]) -> dict[str, object]:
        """Persist the action result and return a confirmation snapshot."""
        record = {
            "id": str(uuid4()),
            "domain": action_result.get("domain", "unknown"),
            "title": action_result.get("title", "untitled"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "snapshot": action_result,
        }
        self._fs.create(COLLECTION, record)
        return {
            "stored": True,
            "memoryId": record["id"],
            "domain": record["domain"],
            "title": record["title"],
            "timestamp": record["timestamp"],
        }

    def list_memories(self, limit: int = 20) -> list[dict[str, object]]:
        """Return recent memory entries."""
        all_records = self._fs.list_collection(COLLECTION)
        return all_records[-limit:]
