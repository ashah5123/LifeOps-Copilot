"""Database service — SQLite-backed persistence for all collections.

Replaces the in-memory dict with a real disk-persisted database.
Schema auto-creates on first use.  Data survives server restarts.
"""

import json
import logging
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).resolve().parent.parent.parent / "lifeops.db"


class DatabaseService:
    """Thread-safe SQLite database for all LifeOps collections."""

    def __init__(self, db_path: str | Path = DB_PATH) -> None:
        self._db_path = str(db_path)
        self._local = threading.local()
        self._init_schema()
        logger.info("Database initialised at %s", self._db_path)

    @property
    def _conn(self) -> sqlite3.Connection:
        """One connection per thread (SQLite requirement)."""
        if not hasattr(self._local, "conn") or self._local.conn is None:
            self._local.conn = sqlite3.connect(self._db_path)
            self._local.conn.row_factory = sqlite3.Row
            self._local.conn.execute("PRAGMA journal_mode=WAL")
            self._local.conn.execute("PRAGMA foreign_keys=ON")
        return self._local.conn

    def _init_schema(self) -> None:
        conn = sqlite3.connect(self._db_path)
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS oauth_tokens (
                user_key TEXT PRIMARY KEY,
                access_token TEXT NOT NULL,
                refresh_token TEXT,
                token_type TEXT,
                expires_at TEXT,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS applications (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                company TEXT NOT NULL,
                role TEXT NOT NULL,
                status TEXT DEFAULT 'draft',
                applied_date TEXT,
                next_follow_up TEXT,
                notes TEXT,
                url TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS budget_entries (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT DEFAULT 'general',
                entry_type TEXT DEFAULT 'expense',
                date TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS calendar_events (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                start_time TEXT,
                end_time TEXT,
                event_type TEXT DEFAULT 'event',
                description TEXT,
                color TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS reminders (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                title TEXT NOT NULL,
                date_time TEXT NOT NULL,
                source_module TEXT,
                priority TEXT DEFAULT 'medium',
                status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS approvals (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                title TEXT NOT NULL,
                description TEXT,
                approval_type TEXT NOT NULL,
                action_preview TEXT,
                status TEXT DEFAULT 'pending',
                metadata TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS agent_memory (
                id TEXT PRIMARY KEY,
                domain TEXT NOT NULL,
                title TEXT NOT NULL,
                snapshot TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS uploads (
                id TEXT PRIMARY KEY,
                file_name TEXT NOT NULL,
                file_url TEXT,
                status TEXT DEFAULT 'uploaded',
                extracted_text TEXT,
                agent_result TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS generic_docs (
                id TEXT PRIMARY KEY,
                collection TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)
        conn.commit()
        conn.close()

    # ------------------------------------------------------------------
    # Generic CRUD (replaces old firestore_service interface)
    # ------------------------------------------------------------------

    def create(self, collection: str, data: dict) -> dict:
        """Insert a document into a collection."""
        doc_id = data.get("id", str(uuid4()))
        data["id"] = doc_id
        now = datetime.now(timezone.utc).isoformat()

        # Route to typed tables when possible
        if collection == "applications":
            self._insert_application(data, now)
        elif collection == "budget_entries":
            self._insert_budget_entry(data, now)
        elif collection == "calendar_events":
            self._insert_calendar_event(data, now)
        elif collection == "approvals":
            self._insert_approval(data, now)
        elif collection == "agent_memory":
            self._insert_agent_memory(data, now)
        elif collection == "uploads":
            self._insert_upload(data, now)
        elif collection == "reminders":
            self._insert_reminder(data, now)
        else:
            # Fallback: store as JSON in generic table
            self._conn.execute(
                "INSERT OR REPLACE INTO generic_docs (id, collection, data, created_at) VALUES (?, ?, ?, ?)",
                (doc_id, collection, json.dumps(data), now),
            )
            self._conn.commit()

        return data

    def get(self, collection: str, doc_id: str) -> dict | None:
        """Get a document by ID."""
        table = self._table_for(collection)
        if table == "generic_docs":
            row = self._conn.execute(
                "SELECT data FROM generic_docs WHERE id = ? AND collection = ?",
                (doc_id, collection),
            ).fetchone()
            return json.loads(row["data"]) if row else None

        row = self._conn.execute(f"SELECT * FROM {table} WHERE id = ?", (doc_id,)).fetchone()
        return self._row_to_dict(row) if row else None

    def list_collection(self, collection: str, limit: int = 100) -> list[dict]:
        """List all documents in a collection."""
        table = self._table_for(collection)
        if table == "generic_docs":
            rows = self._conn.execute(
                "SELECT data FROM generic_docs WHERE collection = ? ORDER BY created_at DESC LIMIT ?",
                (collection, limit),
            ).fetchall()
            return [json.loads(r["data"]) for r in rows]

        rows = self._conn.execute(
            f"SELECT * FROM {table} ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [self._row_to_dict(r) for r in rows]

    def update(self, collection: str, doc_id: str, data: dict) -> dict | None:
        """Update a document by ID."""
        existing = self.get(collection, doc_id)
        if not existing:
            return None
        merged = {**existing, **data, "id": doc_id}
        table = self._table_for(collection)

        if table == "generic_docs":
            self._conn.execute(
                "UPDATE generic_docs SET data = ? WHERE id = ? AND collection = ?",
                (json.dumps(merged), doc_id, collection),
            )
        elif table == "applications":
            self._conn.execute(
                "UPDATE applications SET company=?, role=?, status=?, notes=?, url=? WHERE id=?",
                (merged.get("company", ""), merged.get("role", ""), merged.get("status", "draft"),
                 merged.get("notes", ""), merged.get("url", ""), doc_id),
            )
        elif table == "approvals":
            self._conn.execute(
                "UPDATE approvals SET status=? WHERE id=?",
                ("approved" if data.get("approved") else "rejected", doc_id),
            )
        else:
            # Generic update via delete + re-insert
            self._conn.execute(f"DELETE FROM {table} WHERE id = ?", (doc_id,))
            self.create(collection, merged)
            return merged

        self._conn.commit()
        return merged

    def delete(self, collection: str, doc_id: str) -> bool:
        """Delete a document by ID."""
        table = self._table_for(collection)
        if table == "generic_docs":
            cur = self._conn.execute(
                "DELETE FROM generic_docs WHERE id = ? AND collection = ?", (doc_id, collection)
            )
        else:
            cur = self._conn.execute(f"DELETE FROM {table} WHERE id = ?", (doc_id,))
        self._conn.commit()
        return cur.rowcount > 0

    def count(self, collection: str) -> int:
        """Count documents in a collection."""
        table = self._table_for(collection)
        if table == "generic_docs":
            row = self._conn.execute(
                "SELECT COUNT(*) as c FROM generic_docs WHERE collection = ?", (collection,)
            ).fetchone()
        else:
            row = self._conn.execute(f"SELECT COUNT(*) as c FROM {table}").fetchone()
        return row["c"] if row else 0

    # ------------------------------------------------------------------
    # User auth helpers
    # ------------------------------------------------------------------

    def create_user(self, email: str, name: str, password_hash: str) -> dict:
        user_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        self._conn.execute(
            "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, email, name, password_hash, now),
        )
        self._conn.commit()
        return {"id": user_id, "email": email, "name": name, "created_at": now}

    def get_user_by_email(self, email: str) -> dict | None:
        row = self._conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return self._row_to_dict(row) if row else None

    def get_user_by_id(self, user_id: str) -> dict | None:
        row = self._conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return self._row_to_dict(row) if row else None

    # ------------------------------------------------------------------
    # OAuth token persistence
    # ------------------------------------------------------------------

    def save_oauth_token(self, user_key: str, access_token: str, refresh_token: str = "") -> None:
        now = datetime.now(timezone.utc).isoformat()
        self._conn.execute(
            "INSERT OR REPLACE INTO oauth_tokens (user_key, access_token, refresh_token, updated_at) VALUES (?, ?, ?, ?)",
            (user_key, access_token, refresh_token, now),
        )
        self._conn.commit()

    def get_oauth_token(self, user_key: str) -> dict | None:
        row = self._conn.execute("SELECT * FROM oauth_tokens WHERE user_key = ?", (user_key,)).fetchone()
        return self._row_to_dict(row) if row else None

    # ------------------------------------------------------------------
    # Typed insert helpers
    # ------------------------------------------------------------------

    def _insert_application(self, d: dict, now: str) -> None:
        self._conn.execute(
            "INSERT OR REPLACE INTO applications (id, user_id, company, role, status, applied_date, notes, url, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
            (d["id"], d.get("user_id", ""), d.get("company", ""), d.get("role", ""),
             d.get("status", "draft"), d.get("appliedDate", now[:10]), d.get("notes", ""),
             d.get("url", ""), now),
        )
        self._conn.commit()

    def _insert_budget_entry(self, d: dict, now: str) -> None:
        self._conn.execute(
            "INSERT OR REPLACE INTO budget_entries (id, user_id, description, amount, category, entry_type, date, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (d["id"], d.get("user_id", ""), d.get("description", d.get("title", "")),
             d.get("amount", 0), d.get("category", "general"),
             d.get("entryType", d.get("entry_type", d.get("type", "expense"))),
             d.get("date", now[:10]), now),
        )
        self._conn.commit()

    def _insert_calendar_event(self, d: dict, now: str) -> None:
        self._conn.execute(
            "INSERT OR REPLACE INTO calendar_events (id, user_id, title, date, start_time, end_time, event_type, description, color, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (d["id"], d.get("user_id", ""), d.get("title", ""), d.get("date", now[:10]),
             d.get("startTime", d.get("start_time", "")), d.get("endTime", d.get("end_time", "")),
             d.get("type", d.get("event_type", "event")), d.get("description", ""),
             d.get("color", ""), now),
        )
        self._conn.commit()

    def _insert_approval(self, d: dict, now: str) -> None:
        meta = d.get("metadata", {})
        self._conn.execute(
            "INSERT OR REPLACE INTO approvals (id, user_id, title, description, approval_type, action_preview, status, metadata, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
            (d["id"], d.get("user_id", ""), d.get("title", ""), d.get("description", ""),
             d.get("type", d.get("approval_type", "general")), d.get("actionPreview", d.get("action_preview", "")),
             d.get("status", "pending"), json.dumps(meta) if isinstance(meta, dict) else str(meta), now),
        )
        self._conn.commit()

    def _insert_agent_memory(self, d: dict, now: str) -> None:
        snapshot = d.get("snapshot", {})
        self._conn.execute(
            "INSERT OR REPLACE INTO agent_memory (id, domain, title, snapshot, created_at) VALUES (?,?,?,?,?)",
            (d["id"], d.get("domain", "unknown"), d.get("title", ""),
             json.dumps(snapshot) if isinstance(snapshot, dict) else str(snapshot),
             d.get("timestamp", now)),
        )
        self._conn.commit()

    def _insert_upload(self, d: dict, now: str) -> None:
        agent_result = d.get("agentResult", d.get("agent_result"))
        self._conn.execute(
            "INSERT OR REPLACE INTO uploads (id, file_name, file_url, status, extracted_text, agent_result, created_at) VALUES (?,?,?,?,?,?,?)",
            (d.get("id", d.get("uploadId", str(uuid4()))), d.get("fileName", d.get("file_name", "")),
             d.get("fileUrl", d.get("file_url", "")), d.get("status", "uploaded"),
             d.get("extractedText", d.get("extracted_text", "")),
             json.dumps(agent_result) if agent_result else None, now),
        )
        self._conn.commit()

    def _insert_reminder(self, d: dict, now: str) -> None:
        self._conn.execute(
            "INSERT OR REPLACE INTO reminders (id, user_id, title, date_time, source_module, priority, status, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (d["id"], d.get("user_id", ""), d.get("title", ""), d.get("dateTime", d.get("date_time", now)),
             d.get("sourceModule", d.get("source_module", "")), d.get("priority", "medium"),
             d.get("status", "pending"), now),
        )
        self._conn.commit()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _table_for(collection: str) -> str:
        mapping = {
            "applications": "applications",
            "budget_entries": "budget_entries",
            "calendar_events": "calendar_events",
            "reminders": "reminders",
            "approvals": "approvals",
            "agent_memory": "agent_memory",
            "uploads": "uploads",
        }
        return mapping.get(collection, "generic_docs")

    @staticmethod
    def _row_to_dict(row: sqlite3.Row | None) -> dict | None:
        if row is None:
            return None
        d = dict(row)
        # Parse JSON fields
        for key in ("snapshot", "metadata", "agent_result"):
            if key in d and isinstance(d[key], str):
                try:
                    d[key] = json.loads(d[key])
                except (json.JSONDecodeError, TypeError):
                    pass
        return d
