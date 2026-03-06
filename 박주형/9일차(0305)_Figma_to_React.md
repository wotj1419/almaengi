# TIL 03. Figma → 코드 변환 방법 총정리

>
> **작성일**: 2026-03-06
>
> **목표**: Figma 디자인을 실제 코드로 변환하는 다양한 방법을 익히고, PWA 적용까지 연결하기
>
> **키워드**: `Figma Dev Mode` `Figma Make` `Figma MCP` `Locofy` `Anima` `Tailwind` `PWA` `vite-plugin-pwa`

---

## 1. Figma → 코드 변환, 왜 중요한가?

디자이너가 Figma에서 만든 디자인을 개발자가 코드로 옮기는 과정은 전통적으로 가장 많은 시간과 커뮤니케이션 비용이 드는 단계다. 이 과정을 효율화하는 방법은 크게 세 가지로 나뉜다:

| 방식 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **수동 구현** | Dev Mode에서 값 확인 → 직접 코딩 | 코드 품질 최고, 완전한 제어 | 시간 오래 걸림 |
| **AI 자동 변환** | Figma Make, Locofy 등 도구 활용 | 빠른 프로토타이핑 | 코드 정리 필요 |
| **하이브리드** | 자동 변환 후 수동 정리 | 속도 + 품질 균형 | 도구 학습 필요 |

실무에서는 **하이브리드 방식**이 가장 현실적이다. 자동 변환으로 초안을 빠르게 뽑고, 직접 코드를 정리하는 워크플로우를 추천한다.

---

## 2. Figma Dev Mode 활용법 (수동 구현의 기본)

Dev Mode는 Figma에 내장된 개발자용 보기 모드다. 디자인 요소를 클릭하면 CSS 값, 간격, 색상 등을 바로 확인할 수 있다.

### 켜는 방법

Figma 에디터 상단의 `</>` 아이콘을 클릭하면 Dev Mode로 전환된다. 유료 플랜(Professional 이상)에서 사용 가능하다.

### 확인할 수 있는 정보

| 항목 | Dev Mode에서 보이는 것 | 코드로 변환할 때 |
|------|----------------------|----------------|
| 크기 | `width: 320px`, `height: 48px` | 그대로 사용 또는 반응형 단위로 변환 |
| 간격 | padding, margin, gap 값 | Tailwind: `p-4`, `gap-3` 등 |
| 색상 | HEX, RGB 값 | Tailwind config에 커스텀 색상 등록 |
| 폰트 | font-family, size, weight, line-height | Tailwind: `text-lg`, `font-bold` 등 |
| 테두리 | border-radius, border 값 | Tailwind: `rounded-lg`, `border` 등 |
| 그림자 | box-shadow 값 | Tailwind: `shadow-md` 등 |

### Auto Layout → Flexbox 매핑

Figma의 Auto Layout은 CSS Flexbox와 거의 1:1로 대응된다. 이 관계를 알면 디자인을 보는 것만으로 레이아웃 코드를 바로 작성할 수 있다.

| Figma Auto Layout | CSS Flexbox | Tailwind |
|-------------------|-------------|----------|
| 방향: 가로 | `flex-direction: row` | `flex flex-row` |
| 방향: 세로 | `flex-direction: column` | `flex flex-col` |
| 항목 간격: 12 | `gap: 12px` | `gap-3` |
| 패딩: 16 | `padding: 16px` | `p-4` |
| 정렬: 중앙 | `align-items: center` | `items-center` |
| 정렬: 양쪽 분산 | `justify-content: space-between` | `justify-between` |
| 채우기 (Fill) | `flex: 1` | `flex-1` |
| 고정 (Fixed) | `width: 고정값` | `w-[200px]` |

### 실전 예시: 카드 컴포넌트

Figma에서 아래와 같은 카드 컴포넌트를 디자인했다고 가정하자:

```
[카드 - Auto Layout 세로, 패딩 16, 간격 12, radius 12]
  ├─ [이미지 - 320x180, radius 8]
  ├─ [제목 - 18px Bold, #1A1A1A]
  ├─ [설명 - 14px Regular, #666666]
  └─ [버튼 영역 - Auto Layout 가로, 간격 8]
       ├─ [버튼1 - Fill]
       └─ [버튼2 - Fill]
```

Dev Mode에서 값을 확인하고 Tailwind로 변환하면:

```jsx
function Card({ image, title, description }) {
  return (
    <div className="flex flex-col p-4 gap-3 rounded-xl bg-white shadow-md">
      <img src={image} alt={title} className="w-full h-[180px] object-cover rounded-lg" />
      <h3 className="text-lg font-bold text-[#1A1A1A]">{title}</h3>
      <p className="text-sm text-[#666666]">{description}</p>
      <div className="flex flex-row gap-2">
        <button className="flex-1 py-2 bg-blue-500 text-white rounded-lg">버튼1</button>
        <button className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg">버튼2</button>
      </div>
    </div>
  )
}
```

### 디자인 토큰 → Tailwind Config

Figma에서 정의한 색상, 폰트, 간격 등의 디자인 토큰을 Tailwind 설정 파일에 등록하면 디자인 시스템의 일관성을 유지할 수 있다.

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // Figma에서 정의한 색상 그대로 등록
        primary: '#3B82F6',
        secondary: '#6366F1',
        'text-main': '#1A1A1A',
        'text-sub': '#666666',
        'bg-card': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
      spacing: {
        // Figma 간격 체계에 맞춰 추가
        '18': '4.5rem',  // 72px
      }
    },
  },
}
```

이렇게 설정하면 코드에서 `bg-primary`, `text-text-sub`, `rounded-card`처럼 Figma 디자인 토큰 이름 그대로 사용할 수 있다.

---

## 3. Figma Make — AI 프롬프트 기반 코드 생성

Figma Make는 Figma 팀이 직접 만든 AI 코드 생성 도구다. 자연어 프롬프트와 Figma 디자인을 입력으로 받아 HTML/CSS/JS 코드를 자동 생성한다.

### 사용 방법

1. Figma에서 프레임을 선택한다
2. "Create code from design" 클릭 또는 Figma Make 열기
3. 프롬프트로 원하는 동작을 설명한다
4. 생성된 코드를 실시간 미리보기로 확인한다
5. 프롬프트를 수정하거나 코드를 직접 편집하여 반복한다

### 입력 방식

| 입력 유형 | 설명 |
|----------|------|
| 텍스트 프롬프트 | "로그인 폼을 만들어줘" 같은 자연어 |
| Figma 프레임 | 선택한 프레임을 시각적 참조로 전달 |
| 이미지 파일 | PNG, JPG, SVG를 드래그하여 참조 |

### 프롬프트 작성 팁

```
❌ 나쁜 프롬프트:
"예쁜 카드 만들어줘"

✅ 좋은 프롬프트:
"이 Figma 프레임을 기반으로 React 컴포넌트를 만들어줘.
- Tailwind CSS 사용
- 반응형으로 모바일에서는 1열, 데스크톱에서는 3열 그리드
- 카드 클릭 시 상세 페이지로 이동하는 onClick 핸들러 포함
- 이미지 로딩 실패 시 기본 이미지 표시"
```

### Make Kits

Figma 라이브러리에서 React 코드 컴포넌트와 CSS를 직접 생성하는 기능이다. 자신의 디자인 시스템을 Make에 연결하면 생성 결과물의 퀄리티가 크게 올라간다.

### npm 패키지 import

이미 코드베이스에 디자인 시스템이 있다면, public/private npm 패키지를 Figma Make에 직접 가져올 수 있다. shadcn/ui 같은 오픈소스 컴포넌트 라이브러리도 연결 가능하다.

### 장점과 한계

| 장점 | 한계 |
|------|------|
| Figma 안에서 바로 사용 가능 | 생성 코드가 주로 HTML/CSS/JS (React 구조 약함) |
| 프롬프트 반복으로 빠른 이터레이션 | 복잡한 상태관리 로직은 직접 작성 필요 |
| 실시간 미리보기 지원 | 라우팅, API 연동 등은 수동 구현 |
| 디자인 컨텍스트를 그대로 활용 | 코드 정리/리팩토링 필요 |

---

## 4. Figma MCP 서버 — 에이전틱 코딩과의 연결

MCP(Model Context Protocol)는 AI 도구에 Figma 디자인 컨텍스트를 전달하는 표준 프로토콜이다. Claude Code 같은 에이전틱 코딩 도구에서 Figma 디자인을 참조하면서 코드를 작성할 수 있게 해준다.

### 어떻게 동작하는가?

```
[Figma 디자인] → [Figma MCP 서버] → [AI 코딩 도구 (Claude Code 등)]
                                      ↓
                                  디자인에 맞는 코드 생성
```

기존에는 AI 코딩 도구에 디자인 의도를 텍스트로 설명해야 했지만, MCP를 통해 Figma 파일의 구조, 컴포넌트, 스타일, 변수 등을 직접 전달할 수 있다.

### 활용 시나리오

1. Figma 링크를 Claude Code에 전달
2. MCP 서버가 해당 프레임의 디자인 정보를 추출
3. AI가 디자인에 맞는 React + Tailwind 코드를 생성
4. 생성된 코드를 프로젝트에 바로 적용

### 가이드라인 설정

디자인 시스템의 규칙을 MCP 서버에 가이드라인으로 등록할 수 있다. 예를 들어 "버튼은 항상 rounded-lg를 사용하고, primary 색상은 #3B82F6이다" 같은 규칙을 설정하면, AI가 이를 준수하는 코드를 생성한다.

### FigJam 다이어그램 지원

FigJam에서 만든 플로우차트나 와이어프레임도 MCP를 통해 AI 도구에 전달할 수 있다. 다단계 워크플로우나 인터랙션을 설계할 때 유용하다.

---

## 5. 기타 Figma → 코드 변환 플러그인 비교

Figma Make 외에도 다양한 서드파티 플러그인이 있다.

### 주요 도구 비교

| 도구 | 지원 프레임워크 | 특징 | 가격 |
|------|---------------|------|------|
| **Locofy** | React, Next.js, Vue, HTML | 가장 완성도 높은 자동 변환, 반응형 지원 우수 | 무료 체험 / 유료 |
| **Anima** | React, Vue, HTML | 인터랙션/애니메이션 변환 강점 | 무료 체험 / 유료 |
| **Builder.io** | React, Vue, Svelte, Angular | 프레임워크 지원 폭 가장 넓음, 별도 준비 불필요 | 무료 체험 / 유료 |
| **Codia AI** | React, HTML, CSS | 속도 매우 빠름 (5초 이내), 복잡한 레이아웃 분석 강점 | 무료 체험 / 유료 |

### 각 도구의 최적 사용 상황

**Locofy** — 가장 추천하는 도구. React + Tailwind 조합을 잘 지원하고, 컴포넌트 구조까지 어느 정도 잡아준다. PWA 프로젝트라면 Locofy로 시작하는 걸 추천한다.

**Anima** — 애니메이션이나 인터랙션이 많은 디자인을 변환할 때 강점이 있다. 호버 효과, 트랜지션 등이 복잡한 경우 유용하다.

**Builder.io** — Figma 파일에 특별한 준비 없이 바로 변환할 수 있다는 게 장점이다. 빠르게 테스트해보고 싶을 때 좋다.

### 플러그인 사용 시 Figma 파일 준비 팁

자동 변환 도구의 결과물 품질은 Figma 파일의 정리 상태에 크게 의존한다.

**반드시 해야 할 것:**
- 레이어 이름을 의미 있게 지정 (`Frame 37` ❌ → `header-nav` ✅)
- Auto Layout을 적극 활용 (절대 위치 배치 최소화)
- 컴포넌트화 (반복되는 요소는 Figma 컴포넌트로 만들기)
- 일관된 간격과 색상 사용 (디자인 토큰/Variables 활용)

**하면 좋은 것:**
- 반응형 브레이크포인트별 프레임 준비 (768px, 1024px, 1440px)
- 상태별 디자인 준비 (default, hover, active, disabled)
- 아이콘은 SVG 컴포넌트로 정리

---

## 6. 직접 구현 워크플로우 — Figma에서 React 컴포넌트까지

자동 변환 도구 없이, 또는 자동 변환 결과를 정리할 때 사용하는 체계적인 워크플로우다.

### Step 1: 컴포넌트 구조 분석

Figma 디자인을 보고 React 컴포넌트 트리를 먼저 설계한다.

```
[페이지 전체]
├─ <Header />
│   ├─ <Logo />
│   └─ <NavMenu />
├─ <HeroSection />
├─ <CardList />
│   └─ <Card /> (반복)
│       ├─ <CardImage />
│       └─ <CardContent />
└─ <Footer />
```

**규칙:** Figma에서 컴포넌트(보라색 다이아몬드 아이콘)로 만들어진 요소는 React 컴포넌트로 1:1 매핑한다.

### Step 2: 디자인 토큰 추출

Figma의 Variables 또는 스타일에서 색상, 폰트, 간격 값을 추출하여 `tailwind.config.js`에 등록한다. (2장의 디자인 토큰 → Tailwind Config 참고)

### Step 3: 컴포넌트 단위로 구현

가장 작은 단위(버튼, 인풋 등)부터 시작해서 점점 큰 단위로 조합한다.

```
Button → Card → CardList → Page
```

이 순서를 **Bottom-Up 방식**이라고 하며, 재사용 가능한 컴포넌트를 먼저 만들기 때문에 후반부로 갈수록 개발 속도가 빨라진다.

### Step 4: 반응형 처리

Figma에서 여러 브레이크포인트의 디자인이 있다면, Tailwind의 반응형 유틸리티로 대응한다.

```jsx
{/* 모바일 1열 → 태블릿 2열 → 데스크톱 3열 */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {cards.map(card => <Card key={card.id} {...card} />)}
</div>
```

| Figma 브레이크포인트 | Tailwind 접두사 | 적용 시점 |
|---------------------|----------------|----------|
| 모바일 (< 768px) | 기본 (접두사 없음) | 항상 |
| 태블릿 (≥ 768px) | `md:` | 768px 이상 |
| 데스크톱 (≥ 1024px) | `lg:` | 1024px 이상 |
| 와이드 (≥ 1440px) | `xl:` / `2xl:` | 1280px / 1536px 이상 |

---

## 7. PWA 적용 가이드

React 프로젝트에 PWA 기능을 추가하면 네이티브 앱처럼 설치 가능하고, 오프라인에서도 동작하는 웹앱을 만들 수 있다.

### PWA의 핵심 3요소

| 요소 | 역할 | 파일 |
|------|------|------|
| **Web App Manifest** | 앱 이름, 아이콘, 테마 색상 등 앱 정보 정의 | `manifest.json` |
| **Service Worker** | 캐싱, 오프라인 지원, 백그라운드 동기화 | `sw.js` (자동 생성) |
| **HTTPS** | 보안 연결 필수 | 배포 환경에서 설정 |

### Step 1: vite-plugin-pwa 설치

```bash
npm install vite-plugin-pwa -D
```

### Step 2: Vite 설정

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: '나의 PWA 앱',
        short_name: 'MyPWA',
        description: 'Figma에서 디자인한 나의 첫 PWA',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
```

### Step 3: 아이콘 준비

Figma에서 앱 아이콘을 디자인하고 아래 사이즈로 내보내기(Export)한다:

| 파일명 | 사이즈 | 용도 |
|--------|--------|------|
| `favicon.ico` | 32x32 | 브라우저 탭 |
| `apple-touch-icon.png` | 180x180 | iOS 홈 화면 |
| `pwa-192x192.png` | 192x192 | Android 스플래시 |
| `pwa-512x512.png` | 512x512 | 설치 아이콘 |

내보낸 파일은 프로젝트의 `public/` 폴더에 넣는다.

### Step 4: 배포

PWA는 HTTPS 환경에서만 동작한다. 가장 쉬운 배포 방법:

**Vercel (추천):**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm run build
# dist 폴더를 Netlify에 드래그 앤 드롭
```

둘 다 무료 플랜에서 HTTPS를 자동으로 제공한다.

### Step 5: PWA 동작 확인

배포 후 Chrome DevTools → Application 탭에서 확인:

| 확인 항목 | 위치 |
|----------|------|
| Manifest 로드 여부 | Application → Manifest |
| Service Worker 등록 | Application → Service Workers |
| 설치 가능 여부 | 주소창 오른쪽 설치 아이콘 |
| 오프라인 동작 | Network 탭에서 Offline 체크 후 새로고침 |

---

## 8. 추천 워크플로우 종합

3주 프로젝트에서 실제로 적용할 수 있는 전체 워크플로우를 정리한다.

### 전체 흐름

```
[1단계: Figma 디자인]
  Figma에서 디자인 완성
  → 컴포넌트 정리 + Auto Layout + Variables 설정
  → 레이어 이름 정리
     ↓
[2단계: 코드 초안 생성]
  Figma Make로 빠르게 프로토타입 생성
  또는 Locofy로 React 코드 자동 변환
  또는 Figma MCP + Claude Code로 디자인 기반 코드 생성
     ↓
[3단계: React 프로젝트 구성]
  Vite + React + Tailwind 프로젝트 세팅
  → 디자인 토큰을 tailwind.config.js에 등록
  → 자동 생성된 코드를 컴포넌트로 재구성
     ↓
[4단계: 기능 구현]
  React Router로 페이지 라우팅
  → useState / useEffect로 상태 관리 + API 연동
  → 커스텀 Hook으로 로직 분리
     ↓
[5단계: PWA 적용 + 배포]
  vite-plugin-pwa 설정
  → 아이콘 준비
  → Vercel/Netlify에 배포
  → PWA 동작 확인
```

### 도구 선택 가이드

| 상황 | 추천 도구 |
|------|----------|
| 빠르게 프로토타입 확인하고 싶다 | Figma Make |
| 디자인을 React 코드로 자동 변환하고 싶다 | Locofy 또는 Builder.io |
| AI 코딩 도구에 디자인 컨텍스트를 전달하고 싶다 | Figma MCP 서버 |
| 최고 품질의 코드가 필요하다 | Dev Mode + 직접 구현 |
| 시간도 없고 품질도 필요하다 | Locofy로 초안 → 수동 정리 |

---

## 전체 요약 정리

| 주제 | 핵심 내용 |
|------|----------|
| Dev Mode | Figma에서 CSS 값, 간격, 색상을 바로 확인. Auto Layout = Flexbox로 1:1 대응 |
| Figma Make | 프롬프트 + 디자인 → 코드 자동 생성. 프로토타이핑에 강하지만 프로덕션 코드는 정리 필요 |
| Figma MCP | AI 코딩 도구에 디자인 컨텍스트를 전달하는 프로토콜. Claude Code 등과 연결 가능 |
| Locofy / Anima | 서드파티 자동 변환 플러그인. Locofy가 React + Tailwind 조합에 가장 적합 |
| 직접 구현 | 컴포넌트 구조 분석 → 디자인 토큰 추출 → Bottom-Up 방식으로 구현 |
| Tailwind 연동 | Figma Variables를 tailwind.config.js에 등록하면 디자인 시스템 일관성 유지 |
| PWA | vite-plugin-pwa로 간단 세팅. manifest + Service Worker + HTTPS 3가지가 핵심 |
| 배포 | Vercel 또는 Netlify에 올리면 HTTPS 자동 지원, 무료 |

**한 줄 요약:** Figma 디자인을 코드로 변환하는 최적의 워크플로우는 "Figma Make/Locofy로 빠르게 초안 생성 → Dev Mode로 세부 값 확인하며 직접 정리 → PWA 설정 후 Vercel 배포"이며, Figma 파일의 정리 상태(Auto Layout, 컴포넌트화, 레이어 이름)가 결과물의 품질을 결정한다.