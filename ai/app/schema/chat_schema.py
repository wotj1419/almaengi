from typing import Literal

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    store_id: int
    role: Literal["OWNER", "EMPLOYEE"]
    employee_id: int | None = None


class SourceDocument(BaseModel):
    law_name: str
    article: int
    content: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceDocument]
    intent: str | None = None
