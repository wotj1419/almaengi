import time

from fastapi import APIRouter

from app.common.exceptions import AIServiceError
from app.common.logger import get_logger
from app.schema.chat_schema import AskRequest, AskResponse
from app.service.chat_service import ChatService

logger = get_logger(__name__)


def create_router(chat_service: ChatService) -> APIRouter:
    router = APIRouter(tags=["ask"])

    @router.post("/ask", response_model=AskResponse)
    async def ask(request: AskRequest) -> AskResponse:
        """BE의 HttpRagClient가 호출하는 엔드포인트"""
        start = time.time()
        try:
            result = await chat_service.chat(
                message=request.question,
                role=request.role,
                store_id=request.storeId,
            )
            elapsed = time.time() - start
            logger.info("ask_response", question=request.question, elapsed_sec=round(elapsed, 2))

            raw_sources = []
            for s in result["sources"]:
                if s.get("law_name") and s.get("article"):
                    law_name = s["law_name"].split("(")[0]
                    for article in str(s["article"]).split("·"):
                        article = article.strip()
                        if article:
                            raw_sources.append(f"{law_name} 제{article}조")
            sources = list(dict.fromkeys(raw_sources))

            return AskResponse(
                answer=result["answer"],
                sources=sources,
                intent=result.get("intent"),
            )
        except Exception as e:
            logger.error("ask_error", error=str(e))
            return AskResponse(
                answer="죄송합니다. 답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            )

    return router
