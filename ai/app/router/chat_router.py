from fastapi import APIRouter

from app.common.exceptions import AIServiceError
from app.common.logger import get_logger
from app.schema.chat_schema import ChatRequest, ChatResponse, SourceDocument
from app.service.chat_service import ChatService
from app.service.rag_service import RagService

logger = get_logger(__name__)

router = APIRouter(prefix="/api/ai", tags=["chat"])

rag_service = RagService()
chat_service = ChatService(rag_service)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        result = await chat_service.chat(
            message=request.message,
            role=request.role,
            store_id=request.store_id,
        )
        return ChatResponse(
            answer=result["answer"],
            sources=[SourceDocument(**s) for s in result["sources"]],
        )
    except AIServiceError as e:
        logger.error("chat_error", error=str(e))
        return ChatResponse(
            answer="죄송합니다. 답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            sources=[],
        )
