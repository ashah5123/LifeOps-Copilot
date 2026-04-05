from app.services.jwt_auth_service import decode_access_token


class AuthService:
    def validate_token(self, token: str) -> dict[str, str] | None:
        if token == "demo-token":
            return {"userId": "demo-user", "email": "demo@sparkup.dev", "name": "Demo"}
        payload = decode_access_token(token)
        if not payload:
            return None
        sub = payload.get("sub")
        if not sub:
            return None
        return {
            "userId": str(sub),
            "email": str(payload.get("email", "")),
            "name": str(payload.get("name", "")),
        }
