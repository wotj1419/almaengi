# React 기초

## React란?
- Facebook에서 개발한 UI 라이브러리
- 컴포넌트 기반 아키텍처로 재사용 가능한 UI 조각을 만들 수 있다
- Virtual DOM을 사용하여 효율적으로 화면을 업데이트한다
- SPA(Single Page Application) 개발에 주로 사용된다

## 프로젝트 생성

### Vite를 이용한 프로젝트 생성 
```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
npm run dev
```

### CRA를 이용한 생성
```bash
npx create-react-app my-app
cd my-app
npm start
```

## 프로젝트 기본 구조
```
my-app/
├── public/          # 정적 파일 (index.html 등)
├── src/
│   ├── App.jsx      # 루트 컴포넌트
│   ├── main.jsx     # 엔트리 포인트 (ReactDOM.render)
│   ├── App.css      # 스타일
│   └── assets/      # 이미지, 폰트 등
├── package.json     # 의존성 관리
└── vite.config.js   # Vite 설정 파일
```

## JSX 문법
- JSX는 JavaScript 안에서 HTML과 유사한 문법을 사용할 수 있게 해준다
- 브라우저가 직접 해석할 수 없으며, Babel이 JavaScript로 변환해준다

### JSX 기본 규칙
```jsx
function App() {
  const name = "React";
  const isLoggedIn = true;

  return (
    // 1. 반드시 하나의 최상위 태그로 감싸야 한다
    <div>
      {/* 2. JavaScript 표현식은 중괄호 {} 안에 작성 */}
      <h1>안녕하세요, {name}입니다</h1>

      {/* 3. class 대신 className 사용 */}
      <p className="description">JSX 문법 학습</p>

      {/* 4. 인라인 스타일은 객체 형태로 작성 */}
      <p style={{ color: "blue", fontSize: "16px" }}>스타일 적용</p>

      {/* 5. 삼항 연산자로 조건부 렌더링 */}
      {isLoggedIn ? <p>환영합니다</p> : <p>로그인 해주세요</p>}
    </div>
  );
}
```

### Fragment 사용
```jsx
// 불필요한 div 대신 Fragment로 감쌀 수 있다
function App() {
  return (
    <>
      <h1>제목</h1>
      <p>내용</p>
    </>
  );
}
```
