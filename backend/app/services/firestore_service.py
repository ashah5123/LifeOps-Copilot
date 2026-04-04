from typing import Any


class FirestoreService:
    def __init__(self):
        self.mock_db = {}

    def create(self, collection: str, data: dict[str, Any]) -> dict[str, Any]:
        if collection not in self.mock_db:
            self.mock_db[collection] = []
        self.mock_db[collection].append(data)
        return data

    def list_collection(self, collection: str) -> list[dict[str, Any]]:
        return self.mock_db.get(collection, [])

    def update(self, collection: str, doc_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        items = self.mock_db.get(collection, [])
        for item in items:
            if item.get("id") == doc_id:
                item.update(data)
                return item
        return None

    def get(self, collection: str, doc_id: str) -> dict[str, Any] | None:
        items = self.mock_db.get(collection, [])
        for item in items:
            if item.get("id") == doc_id:
                return item
        return None
