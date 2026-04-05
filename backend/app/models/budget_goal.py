from pydantic import BaseModel


class BudgetGoal(BaseModel):
    id: str
    goal_type: str
    category: str
    target_amount: float
    current_amount: float
    deadline: str
    status: str
