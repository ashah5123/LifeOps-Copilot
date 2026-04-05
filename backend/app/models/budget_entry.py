from pydantic import BaseModel


class BudgetEntry(BaseModel):
    id: str
    title: str
    amount: float
    entry_type: str
    category: str
    date: str
    is_recurring: bool
    recurring_frequency: str | None
    notes: str | None
    created_at: str
