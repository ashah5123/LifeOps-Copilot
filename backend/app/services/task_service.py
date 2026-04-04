class TaskService:
    def __init__(self):
        self.tasks = []

    def create_task(self, title: str, due_date: str) -> dict[str, str]:
        task = {"title": title, "dueDate": due_date, "status": "pending"}
        self.tasks.append(task)
        return task
