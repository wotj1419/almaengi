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


class AskRequest(BaseModel):
    """BE → AI 요청 스키마"""
    question: str
    role: Literal["OWNER", "EMPLOYEE"]
    storeId: int
    history: list[str] = []


class AskResponse(BaseModel):
    """AI → BE 응답 스키마"""
    answer: str
    sources: list[str] = []
    intent: str | None = None
