# LLM 공부 정리 노트

✅ NLP (Natural Language Processing)

컴퓨터가 사람 언어를 이해하고 처리하는 기술

텍스트를 그대로 이해하는 것이 아니라 숫자로 변환 후 처리

흐름:

Text → Tokenizer → Token(숫자) → Model → 결과

✅ RNN → Attention → Transformer

🔹 RNN

단어 순서대로 처리

이전 정보를 기억하면서 진행

긴 문장 기억 어려움 ❌

속도 느림 ❌

🔹 Attention

👉 중요한 단어에 집중하는 방식

모든 단어 관계를 동시에 확인

문맥 이해 성능 개선

예:

The animal didn't cross the street because it was tired.
→ it = animal

🔹 Transformer

Attention만 사용한 구조

병렬 처리 가능

현재 LLM의 기본 구조

👉 GPT, LLaMA, Solar 모두 Transformer 기반

✅ Language Model 종류

1️⃣ Autoencoding Model (Encoder)

문장 일부 가리고 맞추기

I love [MASK]

문장 이해에 강함

예: BERT

2️⃣ Autoregressive Model (Decoder Only)

다음 단어 예측

I love → AI

텍스트 생성 강함

ChatGPT 방식

✅ LLM (Large Language Model)

대량의 텍스트로 학습된 언어 모델

다음 단어 확률을 계속 예측하며 문장 생성

학습 단계:

Pretraining — 인터넷 데이터 학습

Instruction tuning — 명령 이해

RLHF — 인간 피드백 반영

✅ Tokenizer

문장을 토큰 단위로 나눔

LLM 입력의 시작 단계

예:

unbelievable
→ un / believ / able

🔹 BPE (Byte Pair Encoding)

자주 등장하는 문자 조합을 합쳐 토큰 생성

모르는 단어도 byte 단위로 분해 가능

👉 새로운 단어 처리 가능

✅ LLM 동작 원리

문장 입력
→ Token 변환
→ Embedding
→ Attention 계산
→ 다음 단어 확률 예측
→ 문장 생성

핵심:

LLM은 의미를 이해하는 것이 아니라
다음 단어 확률을 계산한다

✅ Hallucination (환각)

사실이 아닌 내용을 그럴듯하게 생성하는 현상

이유: 정답이 아니라 자연스러운 문장 생성이 목표
