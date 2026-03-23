"""A/B 테스트: 같은 질문을 OWNER/EMPLOYEE 역할로 각각 실행해서 답변 톤 비교."""

import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.service.rag_service import RagService  # noqa: E402
from app.service.router_service import RouterService  # noqa: E402


# 다양한 주제에서 10건 선택
SELECTED_IDS = [
    "legal_001",  # 주휴수당
    "legal_005",  # 퇴직금
    "legal_010",  # 최저임금
    "legal_015",  # 4대보험
    "legal_020",  # 근로계약서
    "legal_025",  # 연차
    "legal_030",  # 해고
    "legal_035",  # 야간근로
    "legal_040",  # 휴게시간
    "legal_045",  # 임금체불
]


async def main() -> None:
    dataset_path = PROJECT_ROOT / "tests" / "eval" / "eval_dataset.json"
    with open(dataset_path, encoding="utf-8") as f:
        eval_data = json.load(f)

    # ID로 질문 선택, 없으면 앞에서 10건
    all_questions = eval_data["questions"]
    id_set = set(SELECTED_IDS)
    selected = [q for q in all_questions if q["id"] in id_set]

    if len(selected) < 10:
        print(f"선택된 ID 중 {len(selected)}건만 존재. 부족분은 앞에서 채웁니다.")
        existing_ids = {q["id"] for q in selected}
        for q in all_questions:
            if q["id"] not in existing_ids:
                selected.append(q)
            if len(selected) >= 10:
                break

    print(f"A/B 테스트 질문: {len(selected)}건")
    print("초기화 중...")

    rag_service = RagService()
    router_service = RouterService()

    results = []

    for i, q in enumerate(selected, 1):
        question = q["question"]
        intent = router_service.classify(question)
        print(f"  [{i}/{len(selected)}] {question[:40]}...")

        # OWNER 역할로 답변
        owner_result = await rag_service.chat(
            query=question, role="OWNER", store_id=1, intent=intent,
        )

        # EMPLOYEE 역할로 답변
        employee_result = await rag_service.chat(
            query=question, role="EMPLOYEE", store_id=1, intent=intent,
        )

        results.append({
            "id": q["id"],
            "question": question,
            "topic": q.get("topic", ""),
            "intent": intent,
            "owner_answer": owner_result["answer"],
            "employee_answer": employee_result["answer"],
        })

    # 마크다운 생성
    md_lines = [
        f"# A/B 테스트: 역할별 답변 비교",
        f"",
        f"- 테스트 일시: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"- 질문 수: {len(results)}건",
        f"- 비교 대상: OWNER(사장님) vs EMPLOYEE(알바생) 프롬프트",
        f"",
    ]

    for i, r in enumerate(results, 1):
        md_lines.extend([
            f"---",
            f"",
            f"## {i}. {r['question']}",
            f"",
            f"- **주제**: {r['topic']}",
            f"- **의도 분류**: {r['intent']}",
            f"",
            f"### OWNER (사장님) 답변",
            f"",
            f"{r['owner_answer']}",
            f"",
            f"### EMPLOYEE (알바생) 답변",
            f"",
            f"{r['employee_answer']}",
            f"",
        ])

    # 저장
    result_dir = PROJECT_ROOT / "tests" / "eval" / "results"
    result_dir.mkdir(parents=True, exist_ok=True)

    md_path = result_dir / "ab_role_comparison.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    json_path = result_dir / "ab_role_comparison.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n결과 저장:")
    print(f"  마크다운: {md_path}")
    print(f"  JSON: {json_path}")


if __name__ == "__main__":
    asyncio.run(main())
