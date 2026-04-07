![대문](https://velog.velcdn.com/images/subakpup/post/406b03b8-2425-48d2-bd9d-078c71e702e1/image.png)

## 📅 프로젝트 개요
> 카페·식당 등 소규모 자영업자의 복잡한 직원 근태 기록부터 주휴수당 계산, 급여 명세서 발송, 세무 신고 준비까지 모바일 하나로 끝내는 올인원 플랫폼입니다.

- **진행 기간**: 2026.02.19 ~ 2026.03.30
- **개발 인원**: 6명

## 👨‍💻 팀원 소개

| [**👑 정혜원**](https://github.com/Clarus23) | [**🎨 박재서**](https://github.com/wotj1419) | [**🚨 박주형**](https://github.com/Juaa6o6) | **📖 차민성** | **🍃 최진서** | [**🐶 함지수**](https://github.com/subakpup) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| <img src="https://velog.velcdn.com/images/subakpup/post/eda213d8-8e58-43a3-9f9f-db8c49a07175/image.png" alt="정혜원" width="120" height="120"/> | <img src="https://velog.velcdn.com/images/subakpup/post/8538d844-5901-4e0c-abdd-ea639f576387/image.png" alt="박재서" width="120" height="120"/> | <img src="https://velog.velcdn.com/images/subakpup/post/d6b9eafe-5bd8-4e67-855a-44c8da7e2d86/image.png" alt="박주형" width="120" height="120"/> | <img src="https://velog.velcdn.com/images/subakpup/post/68dff6c0-8bc5-4dc2-8284-db4cc7fbf8ee/image.png" alt="차민성" width="120" height="120"/> | <img src="https://velog.velcdn.com/images/subakpup/post/0270fe0d-b4e5-47fb-99c6-4d3a24ef9aaa/image.png" alt="최진서" width="120" height="120"/> | <img src="https://velog.velcdn.com/images/subakpup/post/6d0578a9-b1ba-40af-bfd4-1a386f569435/image.png" alt="함지수" width="120" height="120"/> |
| **BE** | **FE** | **AI/FE** | **FE** | **BE** | **BE/Infra** |

## ✨ 주요 기능

### 1. 📝 전자 근로계약 체결 및 관리
[gif]
- **손쉬운 계약서 작성**: 앱 내에서 제공되는 양식을 통한 간편한 근로계약서 작성
- **전자 서명**: 화면 캔버스를 이용한 서명 후 PDF 형태로 자동 변환(결합) 및 양측 교부

### 2. ⏰ 스마트 출퇴근 및 스케줄 관리
[gif]
- **QR / 위치 기반 출퇴근 인증**: 직원의 스마트폰으로 매장 내 QR 코드를 스캔하여 매장과 직원의 위치 비교 및 검증
- **유연한 근무 스케줄링**: 점주가 주간/월간 근무 스케줄을 배포하고 직원이 즉각적으로 확인

### 3. 💸 자동 급여 정산 및 명세서 발급
[gif]
- **실 근로시간 기반 자동 정산**: 지각, 결근, 연장 근로 등을 반영하여 주휴수당과 세금을 포함한 최종 급여 자동 계산
- **급여 이체 연동 (Fintech)**: SSAFY 금융망 API와 연동하여 급여일에 간편하게 이체
- **자동 급여 명세서 발급**: 노동법상 의무인 임금 명세서를 PDF 형태로 자동 생성 및 발급

### 4. 🤖 노동법 특화 AI 챗봇
[gif]
- **법률 자문 AI (알맹이 봇)**: 노무 관련 질의에 대해 최신 근로기준법 판례 및 법령을 바탕으로 정확한 답변 제공
- **RAG 시스템**: 환각 현상 최소화를 위해 특화된 벡터 DB에 저장된 노동법 데이터 기반 응답

### 5. 📬 실시간 알림 및 채팅
[gif]
- **매장 맞춤형 메신저**: 점주와 직원 간 스케줄 변경 요청, 공지사항 전달을 위한 실시간 사내 메신저
- **Push 알림**: 급여 지급, 서명 요청, 스케줄 변동 등 중요 알림 지원

## 🛠️ 기술 스택

### **Frontend**
| Tech | Detail |
| :-- | :-- |
| **Framework / Lang** | React 19, TypeScript |
| **Build Tool** | Vite |
| **State Mngt** | Zustand, @tanstack/react-query |
| **Styling** | TailwindCSS v4 |
| **Utilities** | React Hook Form(Zod), Recharts, HTML5-Qrcode |

### **Backend**
| Tech | Detail |
| :-- | :-- |
| **Language** | Java 17 |
| **Framework** | Spring Boot 3.5.11 |
| **Database** | PostgreSQL, Redis |
| **ORM / API** | Spring Data JPA, Springdoc OpenAPI |
| **Security** | Spring Security, JWT (jjwt) |
| **PDF / Notice** | Flying Saucer(Thymeleaf), Firebase Admin |

### **AI Service**
| Tech | Detail |
| :-- | :-- |
| **Language** | Python 3.11 |
| **Framework** | FastAPI |
| **AI / NLP** | LangChain, OpenAI |
| **Data Persistence**| Qdrant (Vector DB), Redis |
| **Evaluation** | Ragas, FlashRank |

### **Infrastructure & Collaboration**
- **Container / Server**: Docker, Docker Compose, Nginx
- **CI / CD**: Jenkins
- **Collaboration**: Notion, Jira, GitLab

## 📐 시스템 아키텍처 & ERD

### System Architecture
![](https://velog.velcdn.com/images/subakpup/post/fe0e8e32-09cb-492a-a453-48e43dbf32f0/image.png)

### ERD
![](https://velog.velcdn.com/images/subakpup/post/d8cd7f41-ed66-4d4e-8fcc-d158017d78d9/image.png)

## 📁 프로젝트 모듈 구조

```text
S14P21C105/
├── be/                    # Spring Boot 핵심 비즈니스 로직 API 서버
│   ├── auth/              # 인증, JWT 처리
│   ├── attendance/        # 출결 및 스케줄 도메인
│   ├── payroll/           # 급여 정산 로직
│   ├── document/          # 전자 계약서 및 명세서(PDF) 도메인
│   ├── store/             # 사업장 및 직원 관리
│   └── chat/              # WebSocket 및 AI 연동
├── fe/                    # React(Vite) 기반 클라이언트 (PWA 지원)
├── ai/                    # FastAPI 기반 RAG 노동법 AI 서버
├── db/                    # 전역 Database 스키마 및 더미 데이터 (PostgreSQL)
├── nginx/                 # Nginx 리버스 프록시 및 SSL 인증
└── docker-compose.yml     # 멀티 컨테이너 로컬/운영 배포 환경 구성
```

## 💻 실행 방법

### 사전 준비물 (Prerequisites)
  - Docker & Docker Compose
  - Node.js (v22+)
  - JDK 17
  - Python 3.11+ (AI 로컬 개발 시)

### 로컬 환경 실행 (Using Docker Compose)

모든 개발 환경은 `docker-compose.yml`을 통해 원클릭으로 구동할 수 있습니다.

```bash
# 최상위 디렉토리에서 실행
$ docker-compose up -d

# 개별 서비스 빌드 및 재시작 (예: 백엔드 변경시)
$ docker-compose up -d --build be
```

  * **로컬 접속 주소**:
      * Frontend: `http://localhost/(nginx)` or `http://localhost:5173`
      * Backend API Docs: `http://localhost:8090/swagger-ui.html`
      * AI Service Docs: `http://localhost:8000/docs`
