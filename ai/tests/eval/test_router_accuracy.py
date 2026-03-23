"""Semantic Router 의도 분류 정확도 테스트.

평가 데이터셋의 기존 질문(LEGAL_QUERY, DATA_QUERY, COMPLEX_QUERY) +
CALCULATION, GENERAL 추가 질문으로 100건 이상 테스트.
목표: 90% 이상 정확도.
"""

import json
import sys
import time
from collections import defaultdict
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.service.router_service import RouterService  # noqa: E402

# 평가 데이터셋에서 기존 질문 로드
DATASET_PATH = PROJECT_ROOT / "tests" / "eval" / "eval_dataset.json"

# CALCULATION, GENERAL은 평가 데이터셋에 없으므로 수동 추가
EXTRA_TEST_CASES: list[dict] = [
    # CALCULATION (15건)
    {"query": "시급 10,030원에 주 20시간이면 월급 얼마야?", "expected": "CALCULATION"},
    {"query": "주휴수당 계산해줘", "expected": "CALCULATION"},
    {"query": "퇴직금 얼마 돼?", "expected": "CALCULATION"},
    {"query": "4대보험료 얼마 내야 해?", "expected": "CALCULATION"},
    {"query": "연장근로수당 계산해줘", "expected": "CALCULATION"},
    {"query": "월급 200만원이면 4대보험료가 얼마야?", "expected": "CALCULATION"},
    {"query": "시급 9,860원이면 주휴수당 포함 월급은?", "expected": "CALCULATION"},
    {"query": "3년 근무하면 퇴직금이 얼마야?", "expected": "CALCULATION"},
    {"query": "실수령액이 얼마야?", "expected": "CALCULATION"},
    {"query": "야간에 3시간 일하면 추가 수당이 얼마야?", "expected": "CALCULATION"},
    {"query": "주말에 8시간 근무하면 수당이 얼마야?", "expected": "CALCULATION"},
    {"query": "알바비 계산해줘", "expected": "CALCULATION"},
    {"query": "국민연금 얼마 내야 해?", "expected": "CALCULATION"},
    {"query": "급여에서 공제되는 총 금액이 얼마야?", "expected": "CALCULATION"},
    {"query": "시급 10,000원 주 30시간이면 실수령액이?", "expected": "CALCULATION"},
    # DATA_QUERY 추가 (오분류 케이스 + 유사 패턴)
    {"query": "정수진은 몇 시부터 몇 시까지 일해?", "expected": "DATA_QUERY"},
    {"query": "우리 매장 상시 근로자 수가 5인 이상이야?", "expected": "DATA_QUERY"},
    {"query": "직원 중 고용보험에 가입 안 된 사람은?", "expected": "DATA_QUERY"},
    {"query": "김철수는 오늘 몇 시에 출근해?", "expected": "DATA_QUERY"},
    {"query": "박민수 근무 시간이 어떻게 돼?", "expected": "DATA_QUERY"},
    # COMPLEX_QUERY 추가 (오분류 케이스 + 유사 패턴)
    {"query": "직원 중 퇴직금 지급 대상이 되는 직원은 누구야?", "expected": "COMPLEX_QUERY"},
    {"query": "직원들의 이번 달 예상 인건비 총액이 얼마야?", "expected": "COMPLEX_QUERY"},
    {"query": "퇴직금을 줘야 하는 직원이 몇 명이야?", "expected": "COMPLEX_QUERY"},
    {"query": "이번 달 최저임금 위반 가능성 있는 직원이 있어?", "expected": "COMPLEX_QUERY"},
    # GENERAL (15건)
    {"query": "안녕하세요", "expected": "GENERAL"},
    {"query": "고마워", "expected": "GENERAL"},
    {"query": "알맹이 뭐야?", "expected": "GENERAL"},
    {"query": "넌 뭐 할 수 있어?", "expected": "GENERAL"},
    {"query": "도움말", "expected": "GENERAL"},
    {"query": "오늘 날씨 어때?", "expected": "GENERAL"},
    {"query": "반가워요", "expected": "GENERAL"},
    {"query": "바이바이", "expected": "GENERAL"},
    {"query": "넌 AI야?", "expected": "GENERAL"},
    {"query": "감사합니다", "expected": "GENERAL"},
    {"query": "잘 가", "expected": "GENERAL"},
    {"query": "뭘 물어볼 수 있어?", "expected": "GENERAL"},
    {"query": "이름이 뭐야?", "expected": "GENERAL"},
    {"query": "심심해", "expected": "GENERAL"},
    {"query": "다음에 또 올게", "expected": "GENERAL"},
]


def load_test_cases() -> list[dict]:
    """평가 데이터셋 + 추가 테스트 케이스 합산."""
    test_cases: list[dict] = []

    # 평가 데이터셋에서 로드
    if DATASET_PATH.exists():
        with open(DATASET_PATH, encoding="utf-8") as f:
            eval_data = json.load(f)
        for q in eval_data["questions"]:
            test_cases.append({"query": q["question"], "expected": q["type"]})

    # 추가 테스트 케이스
    test_cases.extend(EXTRA_TEST_CASES)

    return test_cases


def main() -> None:
    print("Semantic Router 정확도 테스트")
    print("=" * 60)

    print("\n라우터 초기화 중...")
    t0 = time.perf_counter()
    router_service = RouterService()
    print(f"초기화 완료: {(time.perf_counter() - t0) * 1000:.0f}ms")

    test_cases = load_test_cases()
    print(f"\n테스트 케이스: {len(test_cases)}건")

    correct = 0
    errors: list[dict] = []
    type_stats: dict[str, dict[str, int]] = defaultdict(lambda: {"total": 0, "correct": 0})

    t_start = time.perf_counter()
    for case in test_cases:
        result = router_service.classify(case["query"])
        expected = case["expected"]
        type_stats[expected]["total"] += 1

        if result == expected:
            correct += 1
            type_stats[expected]["correct"] += 1
        else:
            errors.append({
                "query": case["query"],
                "expected": expected,
                "actual": result,
            })
    t_end = time.perf_counter()

    total = len(test_cases)
    accuracy = correct / total

    print(f"\n{'=' * 60}")
    print(f"  총 정확도: {accuracy:.1%} ({correct}/{total})")
    print(f"  소요 시간: {(t_end - t_start) * 1000:.0f}ms (건당 {(t_end - t_start) / total * 1000:.1f}ms)")
    print(f"{'=' * 60}")

    print("\n유형별 정확도:")
    for intent_type, stats in sorted(type_stats.items()):
        type_acc = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
        print(f"  {intent_type:<16} {type_acc:.1%} ({stats['correct']}/{stats['total']})")

    if errors:
        print(f"\n오분류 {len(errors)}건:")
        for e in errors:
            print(f"  '{e['query'][:40]}...' → 예상: {e['expected']}, 실제: {e['actual']}")

    # 결과 저장
    result_dir = PROJECT_ROOT / "tests" / "eval" / "results"
    result_dir.mkdir(parents=True, exist_ok=True)
    result_path = result_dir / "router_accuracy.json"
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "total": total,
                "correct": correct,
                "accuracy": round(accuracy, 4),
                "avg_latency_ms": round((t_end - t_start) / total * 1000, 1),
                "type_stats": {k: dict(v) for k, v in type_stats.items()},
                "errors": errors,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )
    print(f"\n결과 저장: {result_path}")

    if accuracy >= 0.9:
        print("\n[PASS] 목표 달성! (90% 이상)")
    else:
        print("\n[FAIL] 목표 미달. utterance 보강 필요.")


if __name__ == "__main__":
    main()
