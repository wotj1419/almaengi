import time
from pathlib import Path

from FlagEmbedding import BGEM3FlagModel
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import SecretStr
from qdrant_client import QdrantClient
from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.common.exceptions import EmbeddingError, LLMError, VectorSearchError
from app.common.logger import get_logger
from app.config import get_settings

logger = get_logger(__name__)
settings = get_settings()

PROMPT_DIR = Path(__file__).parent.parent / "prompt"


class RagService:
    """RAG 파이프라인 서비스"""

    def __init__(self) -> None:
        self.client = QdrantClient(url=settings.qdrant_url)
        self.embed_model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)
        self.llm = ChatOpenAI(
            api_key=SecretStr(settings.openai_api_key),
            base_url=settings.openai_api_base or None,
            model=settings.openai_model_default,
            temperature=0.1,
            max_completion_tokens=1024,
        )
        self.system_prompt = self._load_prompt("system_base.txt")

    def _load_prompt(self, filename: str) -> str:
        """프롬프트 파일 로드"""
        prompt_path = PROMPT_DIR / filename
        return prompt_path.read_text(encoding="utf-8")

    def _embed_query(self, query: str) -> list[float]:
        """질문을 BGE-m3로 임베딩"""
        try:
            result = self.embed_model.encode([query], max_length=512)
            return result["dense_vecs"][0].tolist()  # type: ignore[union-attr]
        except Exception as e:
            raise EmbeddingError(f"임베딩 생성 실패: {e}") from e

    async def search(self, query: str, top_k: int = 5) -> list[dict]:
        """질문으로 관련 법령 문서 검색 (Child Chunk만)"""
        query_vector = self._embed_query(query)

        child_filter = Filter(
            must=[
                FieldCondition(
                    key="chunk_type",
                    match=MatchValue(value="child"),
                )
            ]
        )

        try:
            results = self.client.query_points(
                collection_name=settings.qdrant_collection,
                query=query_vector,
                query_filter=child_filter,
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

    async def generate_answer(self, query: str, context_docs: list[dict], child_chunks: list[dict]) -> dict:
        """검색된 문서 기반으로 LLM 답변 생성"""
        context_text = "\n\n---\n\n".join(
            f"[{doc['law_name']} 제{doc['article']}조]\n{doc['content']}" for doc in context_docs
        )

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", self.system_prompt),
            ]
        )

        chain = prompt | self.llm | StrOutputParser()

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

    async def chat(self, query: str, role: str, store_id: int) -> dict:
        """전체 RAG 파이프라인 실행 (검색 → 확장 → 답변)"""
        logger.info("rag_pipeline_start", query=query, role=role, store_id=store_id)
        t0 = time.perf_counter()

        # 1. Dense Search
        child_chunks = await self.search(query)
        t1 = time.perf_counter()

        # 2. Parent Chunk 확장
        parent_chunks = await self.expand_parent_chunks(child_chunks)
        t2 = time.perf_counter()

        # 3. LLM 답변 생성 (Parent Chunk를 context로 사용)
        context_docs = parent_chunks if parent_chunks else child_chunks
        result = await self.generate_answer(query, context_docs, child_chunks)
        t3 = time.perf_counter()

        logger.info(
            "rag_pipeline_done",
            sources_count=len(result["sources"]),
            elapsed_search_ms=round((t1 - t0) * 1000),
            elapsed_expand_ms=round((t2 - t1) * 1000),
            elapsed_llm_ms=round((t3 - t2) * 1000),
            elapsed_total_ms=round((t3 - t0) * 1000),
        )
        return result
