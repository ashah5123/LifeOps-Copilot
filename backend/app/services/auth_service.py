class AuthService:
    def validate_token(self, token: str) -> dict[str, str] | None:
        if token == "demo-token":
            return {"userId": "demo-user", "email": "demo@sparkup.dev"}
        return None
