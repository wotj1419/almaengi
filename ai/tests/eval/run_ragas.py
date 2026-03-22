"""RAGAS 평가 스크립트 — 기본 RAG 파이프라인의 Baseline 측정용. RAGAS 0.4.3 API 기반."""

import argparse
import asyncio
import json
import math
import re
import sys
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from FlagEmbedding import BGEM3FlagModel  # noqa: E402
from langchain_openai import ChatOpenAI  # noqa: E402
from pydantic import SecretStr  # noqa: E402
from ragas import EvaluationDataset, SingleTurnSample, evaluate  # noqa: E402
from ragas.dataset_schema import EvaluationResult  # noqa: E402
from ragas.embeddings.base import BaseRagasEmbeddings  # noqa: E402
from ragas.llms import LangchainLLMWrapper  # noqa: E402
from ragas.metrics._context_precision import LLMContextPrecisionWithReference  # noqa: E402
from ragas.metrics._context_recall import LLMContextRecall  # noqa: E402
from ragas.metrics._faithfulness import Faithfulness  # noqa: E402
from ragas.metrics._answer_relevance import ResponseRelevancy  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.service.rag_service import RagService  # noqa: E402

METRIC_NAMES = [
    "context_precision",
    "context_recall",
    "faithfulness",
    "answer_relevancy",
]


class BGEM3Embeddings(BaseRagasEmbeddings):
    def __init__(self) -> None:
        super().__init__()
        self._model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        result = self._model.encode(texts, max_length=512)
        return result["dense_vecs"].tolist()  # type: ignore[union-attr]

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]

    async def aembed_query(self, text: str) -> list[float]:
        return self.embed_query(text)

    async def aembed_documents(self, texts: list[str]) -> list[list[float]]:
        return self.embed_documents(texts)


STRIP_PATTERNS = [
    re.compile(r"⚠️.*$", re.DOTALL),
    re.compile(r"📌\s*근거:.*$", re.DOTALL),
]


def strip_boilerplate(text: str) -> str:
    for pat in STRIP_PATTERNS:
        text = pat.sub("", text)
    return text.strip()


async def collect_samples(
    rag_service: RagService,
    questions: list[dict],
) -> list[SingleTurnSample]:
    samples: list[SingleTurnSample] = []

    total = len(questions)
    for i, q in enumerate(questions, 1):
        print(f"  [{i}/{total}] {q['question'][:40]}...")

        result = await rag_service.chat(
            query=q["question"],
            role=q.get("role", "OWNER"),
            store_id=1,
        )

        child_chunks = await rag_service.search(q["question"])
        context_texts = [chunk["content"] for chunk in child_chunks]

        samples.append(
            SingleTurnSample(
                user_input=q["question"],
                response=strip_boilerplate(result["answer"]),
                retrieved_contexts=context_texts,
                reference=q["ground_truth"],
            )
        )

    return samples


async def run_evaluation(dataset_path: str, output_dir: str, label: str, limit: int = 0) -> dict:
    ds_path = PROJECT_ROOT / dataset_path
    with open(ds_path, encoding="utf-8") as f:
        eval_data = json.load(f)

    legal_questions = [
        q for q in eval_data["questions"]
        if not q.get("requires_agentic", False)
    ]
    if limit > 0:
        legal_questions = legal_questions[:limit]
    print(f"평가 대상: 법령 질문 {len(legal_questions)}건")

    rag_service = RagService()
    samples = await collect_samples(rag_service, legal_questions)

    eval_dataset = EvaluationDataset(samples=samples)  # type: ignore[arg-type]

    settings = get_settings()
    evaluator_llm = LangchainLLMWrapper(
        ChatOpenAI(
            api_key=SecretStr(settings.openai_api_key),
            base_url=settings.openai_api_base or None,
            model="gpt-4o-mini",
            temperature=0.0,
        )
    )
    evaluator_embeddings = BGEM3Embeddings()

    metrics = [
        LLMContextPrecisionWithReference(llm=evaluator_llm),
        LLMContextRecall(llm=evaluator_llm),
        Faithfulness(llm=evaluator_llm),
        ResponseRelevancy(llm=evaluator_llm, embeddings=evaluator_embeddings),
    ]

    print("\nRAGAS 평가 실행 중...")
    ragas_result: EvaluationResult = evaluate(  # type: ignore[assignment]
        dataset=eval_dataset,
        metrics=metrics,
        embeddings=evaluator_embeddings,
    )

    ragas_df = ragas_result.to_pandas()

    col_map: dict[str, str] = {}
    for expected in METRIC_NAMES:
        for col in ragas_df.columns:
            if expected in col.lower().replace(" ", "_"):
                col_map[expected] = col
                break

    avg_scores: dict[str, float] = {}
    for name in METRIC_NAMES:
        col = col_map.get(name)
        if col and col in ragas_df.columns:
            val = float(ragas_df[col].mean())
            avg_scores[name] = 0.0 if math.isnan(val) else val
        else:
            avg_scores[name] = 0.0

    out_dir = PROJECT_ROOT / output_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    result_dict = {
        "label": label,
        "timestamp": datetime.now().isoformat(),
        "num_questions": len(legal_questions),
        "metrics": avg_scores,
    }

    json_path = out_dir / f"{label}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result_dict, f, ensure_ascii=False, indent=2)

    detail_path = out_dir / f"{label}_detail.json"
    detail_records = []
    for idx in range(len(ragas_df)):
        row = ragas_df.iloc[idx]
        record: dict = {
            "id": legal_questions[idx]["id"],
            "question": row.get("user_input", ""),
            "response": row.get("response", ""),
            "reference": row.get("reference", ""),
        }
        for name in METRIC_NAMES:
            col = col_map.get(name)
            val = float(row[col]) if col and col in ragas_df.columns else 0.0
            record[name] = 0.0 if math.isnan(val) else val
        detail_records.append(record)

    with open(detail_path, "w", encoding="utf-8") as f:
        json.dump(detail_records, f, ensure_ascii=False, indent=2)

    md_path = out_dir / f"{label}.md"
    descriptions = {
        "context_precision": "검색된 문서 중 관련 문서 비율",
        "context_recall": "필요한 문서를 얼마나 찾았는지",
        "faithfulness": "답변이 검색 문서에 근거하는지",
        "answer_relevancy": "답변이 질문에 적절한지",
    }
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(f"# RAGAS 평가 리포트: {label}\n\n")
        f.write(f"- 측정일: {result_dict['timestamp']}\n")
        f.write(f"- 평가 질문 수: {result_dict['num_questions']}건\n\n")
        f.write("## 종합 점수\n\n")
        f.write("| 지표 | 점수 | 의미 |\n")
        f.write("|------|------|------|\n")
        for name, score in avg_scores.items():
            desc = descriptions.get(name, "")
            f.write(f"| {name} | {score:.4f} | {desc} |\n")
        f.write("\n## 다음 단계\n\n")
        f.write("- Hybrid Search(BM25 + Dense) 적용 후 재측정\n")
        f.write("- Reranking(FlashRank) 적용 후 재측정\n")
        f.write("- Self-RAG 적용 후 재측정\n")

    print(f"\n{'='*50}")
    print(f"  RAGAS 평가 결과: {label}")
    print(f"{'='*50}")
    for name, score in avg_scores.items():
        bar = "█" * int(score * 20) + "░" * (20 - int(score * 20))
        print(f"  {name:<22} {bar} {score:.4f}")
    print(f"{'='*50}")
    print(f"  결과 저장: {json_path}")
    print(f"  상세 결과: {detail_path}")
    print(f"  리포트:    {md_path}")

    return result_dict


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RAGAS 평가 실행")
    parser.add_argument(
        "--label",
        required=True,
        help="평가 라벨 (예: baseline_phase1)",
    )
    parser.add_argument(
        "--dataset",
        default="tests/eval/eval_dataset.json",
        help="평가 데이터셋 경로 (ai/ 기준 상대경로)",
    )
    parser.add_argument(
        "--output-dir",
        default="tests/eval/results",
        help="결과 저장 디렉토리 (ai/ 기준 상대경로)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="평가할 질문 수 제한 (0이면 전체)",
    )
    args = parser.parse_args()

    asyncio.run(run_evaluation(args.dataset, args.output_dir, args.label, args.limit))
