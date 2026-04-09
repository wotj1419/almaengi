class AIServiceError(Exception):
    """AI 서비스 기본 예외"""


class EmbeddingError(AIServiceError):
    """임베딩 생성 실패"""


class VectorSearchError(AIServiceError):
    """벡터 검색 실패"""


class LLMError(AIServiceError):
    """LLM 호출 실패"""


class InternalAPIError(AIServiceError):
    """내부 API 호출 실패"""
