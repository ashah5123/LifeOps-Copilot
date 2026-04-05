"""MongoDB-backed document store — same surface as FirestoreService (in-memory mock)."""

from __future__ import annotations

import logging
from typing import Any
from uuid import uuid4

from pymongo import MongoClient
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)


def _strip_mongo_id(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if doc is None:
        return None
    out = dict(doc)
    out.pop("_id", None)
    return out


class MongoDocumentStore:
    """Persist collections as MongoDB collections; documents use string field ``id``."""

    def __init__(self, uri: str, database: str = "sparkup") -> None:
        self._client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        self._db = self._client[database]
        try:
            self._client.admin.command("ping")
            logger.info("MongoDB connected: database=%s", database)
        except PyMongoError as exc:
            logger.warning("MongoDB ping failed (operations may error): %s", exc)

    def create(self, collection: str, data: dict[str, Any]) -> dict[str, Any]:
        doc = dict(data)
        if "id" not in doc or not doc["id"]:
            doc["id"] = str(uuid4())
        self._db[collection].insert_one(dict(doc))
        return doc

    def list_collection(self, collection: str) -> list[dict[str, Any]]:
        return [_strip_mongo_id(d) or {} for d in self._db[collection].find()]

    def update(self, collection: str, doc_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        existing = self.get(collection, doc_id)
        if existing is None:
            return None
        merged = {**existing, **data, "id": doc_id}
        self._db[collection].replace_one({"id": doc_id}, merged, upsert=False)
        return merged

    def get(self, collection: str, doc_id: str) -> dict[str, Any] | None:
        return _strip_mongo_id(self._db[collection].find_one({"id": doc_id}))

    def delete(self, collection: str, doc_id: str) -> bool:
        return self._db[collection].delete_one({"id": doc_id}).deleted_count > 0

    def upsert(self, collection: str, doc_id: str, data: dict[str, Any]) -> dict[str, Any]:
        merged = {**data, "id": doc_id}
        self._db[collection].replace_one({"id": doc_id}, merged, upsert=True)
        return merged
