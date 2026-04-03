"""LangChain ReAct Agent.

DATA_QUERY / COMPLEX_QUERY / CALCULATION 의도일 때 실행된다.
Function Calling 대신 ReAct(Reasoning+Acting) 방식으로 Tool을 호출한다.
SSAFY OpenAI 프록시의 Function Calling 미지원 문제를 우회한다.
"""

from datetime import datetime

from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from app.common.logger import get_logger
from app.config import get_settings
from app.agent.tools import create_tools
from app.service.internal_api_client import InternalAPIClient
from app.service.rag_service import RagService

logger = get_logger(__name__)
settings = get_settings()

REACT_PROMPT_TEMPLATE = """당신은 한국 노동법 전문 AI 어시스턴트 "알맹이"입니다.
현재 날짜: {today}
매장 ID: {store_id}
사용자 역할: {role}
역할 설명: {role_description}

## 핵심 원칙
- 매장 실데이터가 필요한 질문은 반드시 Tool을 사용하여 실제 데이터를 조회하세요.
- 법적 판단이 필요한 경우 search_labor_law Tool로 관련 법령을 검색하세요.
- 조회한 실데이터와 법령을 결합하여 구체적인 답변을 생성하세요.
- 데이터가 없는 경우 명확히 알려주세요.
- 답변 끝에 법적 근거가 있으면 "📌 근거: 법령명 제N조"를 명시하세요.
- 답변 마지막에 반드시 포함: "⚠️ 본 답변은 AI가 작성한 참고 정보이며, 법적 효력이 없습니다. 정확한 판단은 노무사 또는 고용노동부(☎1350)에 문의하세요."

## 답변 포맷 (마크다운 — 반드시 준수)
Final Answer는 반드시 아래 규칙을 따르세요:
1. 핵심 수치(금액, 시간, 이름)는 **볼드**로 강조하세요.
2. 여러 항목을 나열할 때는 글머리 기호(-)를 사용하세요.
3. 금액은 쉼표 포함 (예: **10,030원**)
4. 📌 근거와 ⚠️ 면책 문구는 반드시 본문과 빈 줄로 분리하세요. 절대로 본문에 이어 붙이지 마세요.
5. 답변이 짧더라도 본문 / 근거 / 면책 문구 사이에 반드시 빈 줄(단락 구분)을 넣으세요.

사용 가능한 Tools:
{tools}

Tool 이름 목록: {tool_names}

## 응답 형식 (반드시 준수)
Question: 답해야 할 질문
Thought: 어떤 Tool이 필요한지 생각
Action: 사용할 Tool 이름 (tool_names 중 하나)
Action Input: Tool에 전달할 입력값
Observation: Tool 실행 결과
... (Thought/Action/Action Input/Observation 반복 가능)
Thought: 이제 최종 답변을 생성할 수 있다
Final Answer: 최종 답변

시작!

Question: {input}
Thought: {agent_scratchpad}"""

ROLE_DESCRIPTIONS = {
    "OWNER": "사업주(사장님)에게 답변합니다. 법적 의무와 리스크 관점에서 설명하세요.",
    "EMPLOYEE": "근로자(직원/알바생)에게 답변합니다. 권리와 혜택 관점에서 설명하세요.",
}

# 모듈 레벨 싱글톤 - 앱 시작 시 1번만 초기화
_api_client = InternalAPIClient()


async def run_agent(query: str, role: str, store_id: int, rag_service: RagService) -> dict:
    """ReAct Agent 실행. Tool을 자동 선택하여 개인화 답변 생성."""
    tools = create_tools(store_id, _api_client, rag_service)

    llm = ChatOpenAI(
        api_key=SecretStr(settings.openai_api_key),
        base_url=settings.openai_api_base or None,
        model=settings.openai_model_complex,
        temperature=0.1,
        max_completion_tokens=1024,
    )

    prompt = PromptTemplate.from_template(REACT_PROMPT_TEMPLATE)
    agent = create_react_agent(llm, tools, prompt)
    executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=False,
        max_iterations=5,
        handle_parsing_errors=True,
    )

    today = datetime.now().strftime("%Y-%m-%d")
    role_description = ROLE_DESCRIPTIONS.get(role, ROLE_DESCRIPTIONS["OWNER"])

    logger.info("agent_run_start", query=query, role=role, store_id=store_id)

    result = await executor.ainvoke({
        "input": query,
        "today": today,
        "store_id": store_id,
        "role": role,
        "role_description": role_description,
    })

    answer = result["output"]
    logger.info("agent_run_done", store_id=store_id)

    return {"answer": answer, "sources": []}
