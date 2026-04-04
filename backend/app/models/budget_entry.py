from pydantic import BaseModel


class BudgetEntry(BaseModel):
    id: str
    title: str
    amount: float
    entryType: str
    category: str
