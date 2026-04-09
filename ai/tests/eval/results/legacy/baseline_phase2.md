# RAGAS 평가 리포트: baseline_phase2

- 측정일: 2026-03-22T22:04:02.474732
- 평가 질문 수: 50건

## 종합 점수

| 지표 | 점수 | 의미 |
|------|------|------|
| context_precision | 0.7716 | 검색된 문서 중 관련 문서 비율 |
| context_recall | 0.5467 | 필요한 문서를 얼마나 찾았는지 |
| faithfulness | 0.5141 | 답변이 검색 문서에 근거하는지 |
| answer_relevancy | 0.6512 | 답변이 질문에 적절한지 |

## 다음 단계

- Hybrid Search(BM25 + Dense) 적용 후 재측정
- Reranking(FlashRank) 적용 후 재측정
- Self-RAG 적용 후 재측정
