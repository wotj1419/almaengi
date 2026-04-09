import time
from pathlib import Path

from FlagEmbedding import BGEM3FlagModel
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import SecretStr
from qdrant_client import QdrantClient
from qdrant_client.models import (
    FieldCondition,
    Filter,
    Fusion,
    FusionQuery,
    MatchValue,
    Prefetch,
    SparseVector,
)

from app.common.exceptions import EmbeddingError, LLMError, VectorSearchError
from app.common.logger import get_logger
from app.config import get_settings

# 일상 용어 → 법령 용어 동의어 사전 (Sparse 검색 정확도 향상용)
LEGAL_SYNONYMS: dict[str, list[str]] = {
    "주휴수당": ["유급휴일", "주휴일", "유급휴일수당"],
    "연차수당": ["연차유급휴가", "연차휴가수당", "미사용연차"],
    "연차": ["연차유급휴가"],
    "퇴직금": ["퇴직급여"],
    "4대보험": ["고용보험", "국민연금", "산업재해보상보험", "건강보험"],
    "근로계약서": ["근로계약", "근로조건"],
    "야근": ["연장근로", "시간외근로"],
    "알바": ["단시간근로자", "단시간근로"],
    "아르바이트": ["단시간근로자", "단시간근로"],
    "월급": ["임금", "통상임금"],
    "시급": ["시간급", "통상시급"],
    "해고수당": ["해고예고수당"],
    "부당해고": ["부당해고", "정당한 이유"],
    "출산휴가": ["출산전후휴가", "산전후휴가"],
    "육아휴직": ["육아휴직"],
    "야간수당": ["야간근로", "야간근로수당"],
    "휴일수당": ["휴일근로", "휴일근로수당"],
}

# 실무 FAQ — 법령에 명시되지 않은 행정해석/실무 기준 (context 주입용)
PRACTICAL_FAQ: list[dict] = [
    {
        "content": "[실무 해석] 주휴수당이란 1주 소정근로시간이 15시간 이상이고 소정근로일을 개근한 근로자에게 지급하는 유급휴일 수당입니다. 계산법: (1주 소정근로시간 ÷ 5) × 시급. 지각·조퇴는 개근으로 인정되며, 무단결근이 있으면 주휴수당을 지급하지 않아도 됩니다.",
        "law_name": "근로기준법",
        "article": "55·18",
        "keywords": ["주휴수당", "주휴", "유급휴일", "개근"],
    },
    {
        "content": "[실무 해석] 연차수당 계산: 미사용 연차일수 × 1일 통상임금. 반차(반일) 사용에 대한 법령상 명시적 규정은 없으며, 취업규칙이나 단체협약에 반차 제도가 있는 경우 사용 가능합니다.",
        "law_name": "근로기준법",
        "article": "60",
        "keywords": ["연차수당", "반차", "반일", "미사용연차"],
    },
    {
        "content": "[실무 해석] 퇴직금 계산: (1일 평균임금 × 30일) × (재직일수 ÷ 365). 퇴직금은 퇴직 사유 발생일로부터 14일 이내에 지급해야 합니다.",
        "law_name": "근로자퇴직급여보장법",
        "article": "8·9",
        "keywords": ["퇴직금", "퇴직급여", "평균임금"],
    },
    {
        "content": "[실무 해석] 임금 미지급 시 3년 이하의 징역 또는 3천만원 이하의 벌금에 처해집니다. 해고예고수당은 30일분 이상의 통상임금입니다.",
        "law_name": "근로기준법",
        "article": "109·26",
        "keywords": ["임금 미지급", "임금체불", "임금 안주면", "해고예고수당", "임금 벌칙"],
    },
    {
        "content": "[실무 해석] 주휴수당 미지급은 근로기준법 제55조 위반으로, 1주 15시간 이상 근무 및 개근 요건을 충족했다면 임금체불에 해당합니다. 사업주가 이를 지급하지 않을 경우 2년 이하의 징역 또는 2천만원 이하의 벌금형에 처해질 수 있으며, 노동청 신고를 통해 법적 대응이 가능합니다. 5인 미만 사업장도 적용되며, 근로계약서에 '주휴수당 없음'이라고 기재해도 법적으로 무효입니다.",
        "law_name": "근로기준법",
        "article": "55·109",
        "keywords": ["주휴수당 미지급", "주휴수당 처벌", "주휴수당 벌금", "주휴수당 안주면", "임금체불"],
    },
    {
        "content": "[실무 해석] 4대보험 사용자 부담금 비율: 국민연금 4.5%, 건강보험 3.545%, 고용보험 1.15%(150인 미만 기준), 산재보험은 업종별 상이(사용자 전액 부담). 근로자 부담: 국민연금 4.5%, 건강보험 3.545%, 고용보험 0.9%. 주 15시간 미만 단시간근로자는 국민연금·건강보험·고용보험 가입 의무 없음(산재보험은 전 근로자 적용). 미가입 시 미납 보험료에 연체금 부과, 산재보험 미가입 시 보험급여액의 50% 징수 가능.",
        "law_name": "4대보험관련법",
        "article": "국민연금법·건강보험법·고용보험법·산재보험법",
        "keywords": ["4대보험", "국민연금", "건강보험", "고용보험", "산재보험", "보험료", "부담금"],
    },
    {
        "content": "[실무 해석] 2026년 최저임금은 시간당 10,320원. 수습 감액: 1년 이상 근로계약 체결 후 수습 3개월 이내인 근로자는 최저임금의 10% 감액 가능(단순노무직 제외). 최저임금에 산입되는 임금: 매월 1회 이상 정기적으로 지급하는 임금. 식대 등 복리후생 임금은 최저임금 월 환산액의 일정 비율 초과분만 산입.",
        "law_name": "최저임금법",
        "article": "5·6",
        "keywords": ["최저임금", "최저시급", "수습 감액", "수습 급여", "최저임금 식대"],
    },
    {
        "content": "[실무 해석] 구두 근로계약도 법적 효력이 있음. 다만 사용자는 근로기준법 제17조에 따라 임금, 소정근로시간, 휴일, 연차유급휴가 등 근로조건을 서면으로 명시하고 교부할 의무가 있으며, 위반 시 500만원 이하의 벌금. 근로조건이 사실과 다를 경우 근로자는 손해배상 청구 또는 즉시 계약 해제 가능.",
        "law_name": "근로기준법",
        "article": "17·19·114",
        "keywords": ["근로계약서", "근로계약", "구두 계약", "서면 교부", "근로조건 명시"],
    },
    {
        "content": "[실무 해석] 즉시 해고 가능한 경우: ① 천재지변 등 부득이한 사유로 사업 계속이 불가능한 경우, ② 근로자가 고의로 사업에 막대한 지장을 초래하거나 재산상 손해를 끼친 경우(근로기준법 제26조 단서). 해고는 반드시 해고사유와 해고시기를 서면으로 통지해야 효력 발생(제27조). 서면 통지 없는 해고는 무효.",
        "law_name": "근로기준법",
        "article": "26·27",
        "keywords": ["즉시해고", "즉시 해고", "해고 예고", "해고 서면", "해고통지", "해고사유"],
    },
    {
        "content": "[실무 해석] 고용보험 실업급여(구직급여) 수급 요건: ① 이직일 이전 18개월간 피보험 단위기간이 합산 180일 이상, ② 비자발적 이직(해고, 계약만료 등)일 것, ③ 근로의 의사와 능력이 있으나 취업하지 못한 상태, ④ 적극적 재취업 노력. 자발적 퇴직이나 중대한 귀책사유로 인한 해고는 수급이 제한됩니다.",
        "law_name": "고용보험법",
        "article": "40·58",
        "keywords": ["실업급여", "구직급여", "실업급여 조건", "실업급여 수급", "실업급여 요건"],
    },
]

logger = get_logger(__name__)
settings = get_settings()

PROMPT_DIR = Path(__file__).parent.parent / "prompt"


class RagService:
    """RAG 파이프라인 서비스"""

    def __init__(self) -> None:
        self.client = QdrantClient(url=settings.qdrant_url)
        self.embed_model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)

    @staticmethod
    def _load_prompt(filename: str) -> str:
        """프롬프트 파일 로드"""
        prompt_path = PROMPT_DIR / filename
        return prompt_path.read_text(encoding="utf-8")

    def _get_system_prompt(self, role: str) -> str:
        """역할에 따른 시스템 프롬프트 반환"""
        if role == "OWNER":
            return self._load_prompt("system_owner.txt")
        elif role == "EMPLOYEE":
            return self._load_prompt("system_employee.txt")
        return self._load_prompt("system_base.txt")

    def _get_llm(self, intent: str) -> ChatOpenAI:
        """의도에 따라 LLM 모델 선택"""
        if intent in ("COMPLEX_QUERY", "CALCULATION"):
            model = settings.openai_model_complex
        else:
            model = settings.openai_model_default
        return ChatOpenAI(
            api_key=SecretStr(settings.openai_api_key),
            base_url=settings.openai_api_base or None,
            model=model,
            temperature=0.1,
            max_completion_tokens=1024,
        )

    @staticmethod
    def _expand_query(query: str) -> str:
        """일상 용어를 법령 용어로 확장하여 Sparse 검색 정확도 향상"""
        synonyms_to_add: list[str] = []
        for term, legal_terms in LEGAL_SYNONYMS.items():
            if term in query:
                synonyms_to_add.extend(legal_terms)
        if synonyms_to_add:
            return f"{query} {' '.join(synonyms_to_add)}"
        return query

    def _embed_query(self, query: str) -> dict:
        """질문을 BGE-m3로 임베딩 (Dense + Sparse 동시 생성)"""
        try:
            result = self.embed_model.encode(
                [query],
                max_length=512,
                return_dense=True,
                return_sparse=True,
            )
            sparse_dict: dict = result["lexical_weights"][0]  # type: ignore[index]
            return {
                "dense": result["dense_vecs"][0].tolist(),  # type: ignore[union-attr]
                "sparse": SparseVector(
                    indices=[int(k) for k in sparse_dict.keys()],
                    values=list(sparse_dict.values()),
                ),
            }
        except Exception as e:
            raise EmbeddingError(f"임베딩 생성 실패: {e}") from e

    async def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Hybrid Search: Dense + Sparse를 각각 검색 후 RRF로 결합 (Child Chunk만)"""
        expanded_query = self._expand_query(query)
        query_embedding = self._embed_query(expanded_query)

        child_filter = Filter(
            must=[
                FieldCondition(
                    key="chunk_type",
                    match=MatchValue(value="child"),
                ),
            ],
            should=[
                FieldCondition(
                    key="doc_type",
                    match=MatchValue(value="law"),
                ),
            ],
        )

        try:
            results = self.client.query_points(
                collection_name=settings.qdrant_collection,
                prefetch=[
                    Prefetch(
                        query=query_embedding["dense"],
                        using="dense",
                        limit=settings.search_top_k,
                        filter=child_filter,
                    ),
                    Prefetch(
                        query=query_embedding["sparse"],
                        using="sparse",
                        limit=settings.search_top_k // 2,
                        filter=child_filter,
                    ),
                ],
                query=FusionQuery(fusion=Fusion.RRF),
                limit=top_k,
            )
        except Exception as e:
            raise VectorSearchError(f"벡터 검색 실패: {e}") from e

        return [
            {
                "score": point.score,
                "chunk_id": payload["chunk_id"],
                "content": payload["content"],
                "law_name": payload["law_name"],
                "article": payload["article"],
                "parent_id": payload.get("parent_id", ""),
            }
            for point in results.points
            if (payload := point.payload) is not None
        ]

    @staticmethod
    def _inject_faq(query: str, context_docs: list[dict]) -> list[dict]:
        """질문과 관련된 실무 FAQ를 context에 주입"""
        for faq in PRACTICAL_FAQ:
            if any(kw in query for kw in faq["keywords"]):
                context_docs.append({
                    "content": faq["content"],
                    "law_name": faq["law_name"],
                    "article": faq["article"],
                })
        return context_docs

    async def expand_parent_chunks(self, child_chunks: list[dict]) -> list[dict]:
        """Child Chunk의 Parent를 로드하여 문맥 확장"""
        parent_ids = list({chunk["parent_id"] for chunk in child_chunks if chunk.get("parent_id")})

        parent_chunks = []
        for pid in parent_ids:
            try:
                results, _ = self.client.scroll(
                    collection_name=settings.qdrant_collection,
                    scroll_filter=Filter(must=[FieldCondition(key="chunk_id", match=MatchValue(value=pid))]),
                    limit=1,
                )
                if results and (payload := results[0].payload) is not None:
                    parent_chunks.append(
                        {
                            "chunk_id": payload["chunk_id"],
                            "content": payload["content"],
                            "law_name": payload["law_name"],
                            "article": payload["article"],
                        }
                    )
            except Exception as e:
                logger.warning("parent_chunk_load_failed", parent_id=pid, error=str(e))

        return parent_chunks

    async def generate_answer(
        self, query: str, context_docs: list[dict], child_chunks: list[dict], role: str = "OWNER", intent: str = "LEGAL_QUERY"
    ) -> dict:
        """검색된 문서 기반으로 LLM 답변 생성"""
        def _format_article_label(doc: dict) -> str:
            """'55·109' → '제55조, 제109조' 형태로 변환"""
            articles = str(doc["article"]).split("·")
            parts = [f"제{a.strip()}조" for a in articles if a.strip()]
            return ", ".join(parts)

        context_text = "\n\n---\n\n".join(
            f"[{doc['law_name']} {_format_article_label(doc)}]\n{doc['content']}" for doc in context_docs
        )

        system_template = self._get_system_prompt(role)
        llm = self._get_llm(intent)

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_template),
            ]
        )

        chain = prompt | llm | StrOutputParser()

        try:
            answer = await chain.ainvoke(
                {
                    "context": context_text,
                    "question": query,
                }
            )
        except Exception as e:
            raise LLMError(f"LLM 답변 생성 실패: {e}") from e

        # 출처 추출 (Child Chunk metadata 기반, 중복 제거)
        sources = []
        seen = set()
        for chunk in child_chunks:
            key = (chunk["law_name"], chunk["article"])
            if key not in seen:
                seen.add(key)
                sources.append(
                    {
                        "law_name": chunk["law_name"],
                        "article": chunk["article"],
                        "content": chunk["content"],
                        "score": chunk["score"],
                    }
                )

        return {"answer": answer, "sources": sources}

    async def chat(self, query: str, role: str, store_id: int, intent: str = "LEGAL_QUERY") -> dict:
        """전체 RAG 파이프라인 실행 (검색 → 확장 → 답변)"""
        logger.info("rag_pipeline_start", query=query, role=role, store_id=store_id, intent=intent)
        t0 = time.perf_counter()

        # 1. Hybrid Search (Dense + Sparse + RRF)
        child_chunks = await self.search(query)
        t1 = time.perf_counter()

        # 2. Parent Chunk 확장
        parent_chunks = await self.expand_parent_chunks(child_chunks)
        t2 = time.perf_counter()

        # 3. 실무 FAQ 주입
        context_docs = parent_chunks if parent_chunks else child_chunks
        context_docs = self._inject_faq(query, context_docs)

        # 4. LLM 답변 생성 (Parent Chunk + FAQ를 context로 사용)
        result = await self.generate_answer(query, context_docs, child_chunks, role, intent)
        t3 = time.perf_counter()

        logger.info(
            "rag_pipeline_done",
            sources_count=len(result["sources"]),
            elapsed_search_ms=round((t1 - t0) * 1000),
            elapsed_expand_ms=round((t2 - t1) * 1000),
            elapsed_llm_ms=round((t3 - t2) * 1000),
            elapsed_total_ms=round((t3 - t0) * 1000),
        )
        result["context_docs"] = context_docs
        return result
