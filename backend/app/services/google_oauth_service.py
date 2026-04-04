class GoogleOAuthService:
    def get_authorization_url(self) -> str:
        return "https://accounts.google.com/o/oauth2/v2/auth?client_id=demo&redirect_uri=http://localhost:8000/api/auth/google/callback"

    def exchange_code_for_tokens(self, code: str) -> dict[str, str]:
        return {
            "access_token": f"demo_access_token_{code[:10]}",
            "refresh_token": "demo_refresh_token"
        }
