from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from app.agent.agent import run_agent
from app.common.logger import get_logger
from app.config import get_settings
from app.service.rag_service import RagService
from app.service.router_service import RouterService

logger = get_logger(__name__)
settings = get_settings()

# Agent를 실행할 의도 목록
AGENT_INTENTS = {"DATA_QUERY", "COMPLEX_QUERY", "CALCULATION"}

GENERAL_SYSTEM_PROMPT = """당신은 한국 노동법 전문 AI 어시스턴트 "알맹이"입니다.
사용자가 인사, 잡담, 일상적인 대화를 건네고 있습니다.
친근하고 자연스럽게 응답하되, 2~3문장 이내로 짧게 답하세요.

## 반드시 지켜야 할 규칙
- 주휴수당, 최저임금, 연차, 퇴직금, 4대보험, 근로계약, 해고, 급여, 근무시간, 스케줄 등
  노동법 또는 매장 운영과 관련된 내용이 조금이라도 포함되어 있으면
  절대로 직접 답변하지 마세요.
- 대신 이렇게 안내하세요:
  "노동법 관련 질문은 좀 더 구체적으로 말씀해 주시면 정확하게 답변드릴 수 있어요! 😊"
"""


class ChatService:
    """
    채팅 오케스트레이션 서비스.
    Semantic Router로 의도 분류 후 분기 처리.
    - GENERAL         → 즉시 응답
    - LEGAL_QUERY     → 기존 RAG 파이프라인 (Qdrant 법령 검색)
    - DATA_QUERY      → Agent (매장 실데이터 조회)
    - COMPLEX_QUERY   → Agent (실데이터 + 법령 결합)
    - CALCULATION     → Agent (실데이터 기반 계산)
    """

    def __init__(self, rag_service: RagService, router_service: RouterService) -> None:
        self.rag_service = rag_service
        self.router_service = router_service

    async def chat(self, message: str, role: str, store_id: int) -> dict:
        # 1. 의도 분류
        intent = self.router_service.classify(message)

        # 2. GENERAL → LLM이 자연스럽게 응답
        if intent == "GENERAL":
            llm = ChatOpenAI(
                api_key=SecretStr(settings.openai_api_key),
                base_url=settings.openai_api_base or None,
                model=settings.openai_model_default,
                temperature=0.7,
                max_completion_tokens=256,
            )
            prompt = ChatPromptTemplate.from_messages([
                ("system", GENERAL_SYSTEM_PROMPT),
                ("human", "{message}"),
            ])
            chain = prompt | llm | StrOutputParser()
            answer = await chain.ainvoke({"message": message})
            return {"answer": answer, "sources": [], "intent": intent}

        # 3. DATA_QUERY / COMPLEX_QUERY / CALCULATION → Agent
        if intent in AGENT_INTENTS:
            result = await run_agent(query=message, role=role, store_id=store_id, rag_service=self.rag_service)
            result["intent"] = intent
            return result

        # 4. LEGAL_QUERY → 기존 RAG 파이프라인
        result = await self.rag_service.chat(
            query=message,
            role=role,
            store_id=store_id,
            intent=intent,
        )
        result["intent"] = intent
        return result
