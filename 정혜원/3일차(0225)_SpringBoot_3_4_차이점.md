## Spring Boot 3.x vs 4.x 주요 기능 비교

| 구분 | Spring Boot 3.x | Spring Boot 4.x | 기술적 상세 및 이점 |
| --- | --- | --- | --- |
| **자바 버전 베이스라인** | Java 17 필수 | Java 17 필수 (Java 25 권장) | Java 25의 최신 가속화 기능 및 가상 스레드 활용성 극대화 |
| **Jakarta EE 표준** | Jakarta EE 9 / 10 | Jakarta EE 11 | Servlet 6.1, JPA 3.2 등 최신 엔터프라이즈 표준 전면 수용 |
| **프레임워크 아키텍처** | 단일 autoconfigure JAR 사용 | 70개 이상의 모듈로 분할 (모듈화) | 필요한 모듈만 로드하여 애플리케이션 시작 속도 및 메모리 효율 개선 |
| **가상 스레드 (Loom)** | 3.2 버전부터 선택적 지원 | 아키텍처 코어 레벨 완전 통합 | 설정 한 줄로 고성능 동시 처리를 지원하며 I/O 병목 해결 |
| **HTTP 통신 클라이언트** | RestTemplate, WebClient 등 사용 | 네이티브 선언적 HTTP 클라이언트 | `@HttpExchange` 어노테이션을 통해 Feign 없이 선언적 API 호출 가능 |
| **API 버전 관리** | 수동 구현 (URL, 헤더 제어 등) | 네이티브 API 버전 관리 지원 | `@RequestMapping` 내 `version` 파라미터로 선언적 버전 제어 제공  |
| **내장 복원력 (Resilience)** | 외부 라이브러리 (Resilience4j 등) | 프레임워크 내장 Resilience 기능 | `@Retryable`, `@ConcurrencyLimit` 등 핵심 복원력 기능 코어 내장 |
| **JSON 직렬화** | Jackson 2.x 표준 | Jackson 3.0 전환 | 패키지 경로 변경(`tools.jackson`) 및 더 엄격하고 빠른 직렬화 지원 |
| **테스트 어노테이션** | `@MockBean`, `@SpyBean` 사용 | `@MockitoBean`, `@MockitoSpyBean` | 테스트 빈 관리 로직의 일관성을 위해 프레임워크 코어 기능으로 승격 |
| **지원 서버 및 도구** | Undertow 서버 지원 | Undertow 지원 중단 | Servlet 6.1 호환 문제로 Undertow 삭제, Tomcat 11이나 Jetty 12 권장 |

### 추가 변경 사항

* **Null 안전성 강화**: JSpecify 표준을 전면 채택하여 컴파일 타임에 `NullPointerException`을 방지할 수 있도록 설계되었습니다.


* **Spring AI 2.0**: 생성형 AI 개발을 위한 공식 추상화 API를 제공하며, 에이전틱 아키텍처를 기본적으로 지원합니다.


* **빌드 도구**: Gradle 9 지원을 시작하며 최소 Gradle 8.14 이상의 버전을 요구합니다.