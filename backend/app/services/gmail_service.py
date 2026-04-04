class GmailService:
    def list_messages(self) -> list[dict[str, str]]:
        return [
            {
                "id": "msg-1",
                "subject": "Welcome to SparkUp",
                "from": "team@sparkup.dev",
                "snippet": "Getting started with your AI copilot"
            }
        ]

    def send_message(self, to_email: str, subject: str, body: str) -> dict[str, str]:
        return {
            "status": "sent",
            "messageId": "sent-msg-123",
            "to": to_email
        }
