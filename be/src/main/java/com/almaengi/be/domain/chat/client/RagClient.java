package com.almaengi.be.domain.chat.client;

import java.util.List;

public interface RagClient {
    RagResult ask(RagRequest request);
    // AI 요청 모델
    // question: 질문
    // role: OWNER / EMPLOYEE
    // storeId: 매장 식별자 (optional)
    // history: 최근 대화 내역
    record RagRequest(String question, String role, Long storeId, List<String> history) {}
    // AI 응답 모델
    // answer: 답변 본문
    // sources: 근거 텍스트 목록
    // intent: AI 의도 분류 결과
    record RagResult(String answer, List<String> sources, String intent) {}
}