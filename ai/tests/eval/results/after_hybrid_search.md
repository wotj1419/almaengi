# RAGAS 평가 리포트: after_hybrid_search

- 측정일: 2026-03-24T06:13:30.180852
- 평가 질문 수: 50건

## 종합 점수

| 지표 | 점수 | 의미 |
|------|------|------|
| context_precision | 0.7300 | 검색된 문서 중 관련 문서 비율 |
| context_recall | 0.5767 | 필요한 문서를 얼마나 찾았는지 |
| faithfulness | 0.5129 | 답변이 검색 문서에 근거하는지 |
| answer_relevancy | 0.6954 | 답변이 질문에 적절한지 |

## 다음 단계

- Hybrid Search(BM25 + Dense) 적용 후 재측정
- Reranking(FlashRank) 적용 후 재측정
- Self-RAG 적용 후 재측정
