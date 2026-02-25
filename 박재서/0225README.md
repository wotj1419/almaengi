1. React & TypeScript: 버전별 주요 변화
가장 크게 체감되는 변화는 **성능 최적화의 자동화**와 **표준화**입니다.

React (18 → 19)
React 18 (Concurrent Era): `createRoot` 도입으로 동시성(Concurrency)이 핵심이 되었습니다. `useTransition`, `useDeferredValue`를 통해 무거운 렌더링 중에도 UI가 멈추지 않게 조절할 수 있습니다.
React 19 (The New Standard): Actions로 데이터 변경과 상태 업데이트를 더 직관적으로 처리합니다. `use` Hook으로 조건부 리소스 읽기와 비동기 데이터를 쉽게 다루고, `ref`를 일반 props처럼 전달할 수 있어 코드가 더 깔끔해졌습니다.

TypeScript (4.x → 5.x)
속도와 가벼움: 5.x로 넘어오면서 컴파일 속도가 눈에 띄게 빨라졌습니다.
`satisfies` 연산자(5.0+): 타입을 엄격하게 체크하면서도 변수의 구체적인 추론값을 유지하고 싶을 때 유용합니다.
Decorators: ECMAScript 표준에 맞춘 새로운 데코레이터 문법으로 클래스 기반 라이브러리 사용이 더 안정적이고 예측 가능해졌습니다.

2. pnpm: 효율적인 패키지 관리
기존 npm이나 yarn의 고질적인 문제(중복 설치, 느린 속도)를 개선한 대안입니다.
Content-addressable Storage: 같은 버전 패키지는 Store에 한 번만 저장하고, 프로젝트마다 **심볼릭 링크(Symbolic Link)**로 연결합니다.
용량 절약: 여러 프로젝트를 돌려도 디스크 사용량이 크게 늘지 않습니다.
유령 의존성(Phantom Dependencies) 방지: 설치하지 않은 패키지를 몰래 참조하는 실수를 차단해 프로젝트 안정성을 높입니다.

3. PWA (Progressive Web Apps): 웹과 앱의 경계 허물기
"웹사이트인데 앱처럼 작동하게 만들자"는 철학입니다.
Service Worker: 브라우저 백그라운드에서 실행되며 오프라인 지원, 푸시 알림, 캐싱을 담당합니다.
Manifest.json: 앱 이름, 아이콘, 테마 색상을 정의해 홈 화면 설치를 가능하게 합니다.
장점: 앱스토어 심사 없이 즉시 업데이트할 수 있고, 네트워크 상태가 좋지 않아도 사용자 경험이 부드럽습니다.
