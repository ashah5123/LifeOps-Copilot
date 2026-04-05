"""Authentication service — JWT-based auth with password hashing.

Provides register, login, and token verification for the LifeOps API.
"""

import logging
from datetime import datetime, timedelta, timezone

import jwt
from passlib.hash import bcrypt

from app.services.database_service import DatabaseService

logger = logging.getLogger(__name__)

SECRET_KEY = "lifeops-dev-secret-key-2026"  # In production, use env var
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 72


class AuthServiceV2:
    """Handle user registration, login, and JWT token management."""

    def __init__(self, db: DatabaseService) -> None:
        self._db = db

    def register(self, email: str, password: str, name: str = "") -> dict:
        """Register a new user. Returns user dict or raises ValueError."""
        existing = self._db.get_user_by_email(email)
        if existing:
            raise ValueError("Email already registered")

        if not name:
            name = email.split("@")[0].replace(".", " ").title()

        password_hash = bcrypt.hash(password)
        user = self._db.create_user(email=email, name=name, password_hash=password_hash)
        token = self._create_token(user["id"], user["email"])

        return {
            "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
            "token": token,
        }

    def login(self, email: str, password: str) -> dict:
        """Authenticate user. Returns user dict + token or raises ValueError."""
        user = self._db.get_user_by_email(email)
        if not user:
            raise ValueError("Invalid email or password")

        if not bcrypt.verify(password, user["password_hash"]):
            raise ValueError("Invalid email or password")

        token = self._create_token(user["id"], user["email"])
        return {
            "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
            "token": token,
        }

    def verify_token(self, token: str) -> dict | None:
        """Verify a JWT token. Returns payload or None."""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return None

    def get_user_from_token(self, token: str) -> dict | None:
        """Get full user object from a JWT token."""
        payload = self.verify_token(token)
        if not payload:
            return None
        return self._db.get_user_by_id(payload.get("user_id", ""))

    @staticmethod
    def _create_token(user_id: str, email: str) -> str:
        """Create a JWT token for a user."""
        expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
        payload = {
            "user_id": user_id,
            "email": email,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
