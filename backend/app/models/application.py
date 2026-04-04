from pydantic import BaseModel


class Application(BaseModel):
    id: str
    company: str
    role: str
    status: str
    appliedDate: str
