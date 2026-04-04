from uuid import uuid4


class ReminderService:
    def __init__(self):
        self.reminders = []

    def create_reminder(self, title: str, date_time: str, source_module: str) -> dict[str, str]:
        reminder = {
            "id": str(uuid4()),
            "title": title,
            "dateTime": date_time,
            "sourceModule": source_module
        }
        self.reminders.append(reminder)
        return reminder

    def list_reminders(self) -> list[dict[str, str]]:
        return self.reminders
