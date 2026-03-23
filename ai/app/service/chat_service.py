from app.common.logger import get_logger
from app.service.rag_service import RagService
from app.service.router_service import RouterService

logger = get_logger(__name__)


class ChatService:
    """채팅 오케스트레이션 서비스.

    Semantic Router로 의도 분류 후 분기 처리.
    """

    def __init__(self, rag_service: RagService, router_service: RouterService) -> None:
        self.rag_service = rag_service
        self.router_service = router_service

    async def chat(self, message: str, role: str, store_id: int) -> dict:
        # 1. 의도 분류
        intent = self.router_service.classify(message)

        # 2. GENERAL → 검색 없이 바로 응답
        if intent == "GENERAL":
            return {
                "answer": "안녕하세요! 노동법에 관해 궁금한 점이 있으시면 편하게 물어보세요 :)",
                "sources": [],
                "intent": intent,
            }

        # 3. 나머지 의도 → RAG 파이프라인
        result = await self.rag_service.chat(
            query=message,
            role=role,
            store_id=store_id,
            intent=intent,
        )
        result["intent"] = intent
        return result
