"""JWT creation/verification and password hashing for email/password auth."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)

USERS_COLLECTION = "users"


def hash_password(plain: str) -> str:
    # bcrypt silently truncates at 72 bytes; truncate explicitly to avoid errors
    return pwd_context.hash(plain[:72])


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain[:72], hashed)


def create_access_token(*, user_id: str, email: str, name: str) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": now,
        "exp": exp,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None


def register_user(store, email: str, password: str, name: str) -> dict:
    email_l = email.strip().lower()
    for u in store.list_collection(USERS_COLLECTION):
        if str(u.get("email", "")).lower() == email_l:
            raise ValueError("email already registered")
    uid = str(uuid4())
    record = {
        "id": uid,
        "email": email_l,
        "password_hash": hash_password(password),
        "name": name.strip() or email_l.split("@")[0],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    store.create(USERS_COLLECTION, record)
    return {"id": uid, "email": email_l, "name": record["name"]}


def authenticate_user(store, email: str, password: str) -> dict | None:
    email_l = email.strip().lower()
    for u in store.list_collection(USERS_COLLECTION):
        if str(u.get("email", "")).lower() == email_l:
            if verify_password(password, str(u.get("password_hash", ""))):
                return {
                    "id": str(u["id"]),
                    "email": u["email"],
                    "name": str(u.get("name", "")),
                }
    return None
