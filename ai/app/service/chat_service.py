from app.service.rag_service import RagService


class ChatService:
    """채팅 오케스트레이션 서비스.

    현재는 RagService를 바로 호출하지만,
    추후 Semantic Router, Redis 캐시, 대화 이력 관리 등이 추가될 자리.
    """

    def __init__(self, rag_service: RagService) -> None:
        self.rag_service = rag_service

    async def chat(self, message: str, role: str, store_id: int) -> dict:
        return await self.rag_service.chat(
            query=message,
            role=role,
            store_id=store_id,
        )
