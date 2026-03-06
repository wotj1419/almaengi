# React Router, Context API, 커스텀 훅

## React Router
- SPA에서 페이지 이동(라우팅)을 구현하는 라이브러리
- 설치: `npm install react-router-dom`

```jsx
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";

// 라우터 설정
function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">홈</Link>
        <Link to="/about">소개</Link>
        <Link to="/users">사용자</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="*" element={<p>404 - 페이지를 찾을 수 없습니다</p>} />
      </Routes>
    </BrowserRouter>
  );
}

// useParams - URL 파라미터 가져오기
function UserDetail() {
  const { id } = useParams();
  return <h1>사용자 ID: {id}</h1>;
}

// useNavigate - 프로그래밍 방식으로 페이지 이동
function LoginButton() {
  const navigate = useNavigate();
  const handleLogin = () => {
    // 로그인 처리 후 이동
    navigate("/dashboard");
  };
  return <button onClick={handleLogin}>로그인</button>;
}
```

## Context API
- props drilling(깊은 전달) 없이 컴포넌트 트리 전체에 데이터를 공유한다
- 전역 상태 관리에 사용 (테마, 로그인 정보 등)

```jsx
import { createContext, useContext, useState } from "react";

// 1. Context 생성
const ThemeContext = createContext();

// 2. Provider 컴포넌트 작성
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. useContext로 값 사용
function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <header style={{ background: theme === "dark" ? "#333" : "#fff" }}>
      <button onClick={toggleTheme}>테마 변경</button>
    </header>
  );
}

// App에서 Provider로 감싸기
// <ThemeProvider><App /></ThemeProvider>
```

## 커스텀 훅 (Custom Hook)
- 반복되는 로직을 재사용 가능한 함수로 추출한다
- 이름은 반드시 use로 시작해야 한다

```jsx
// API 데이터 fetching 커스텀 훅
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((data) => { setData(data); setLoading(false); })
      .catch((err) => { setError(err); setLoading(false); });
  }, [url]);

  return { data, loading, error };
}

// 사용 예시
function UserList() {
  const { data, loading, error } = useFetch("/api/users");
  if (loading) return <p>로딩중...</p>;
  if (error) return <p>에러 발생</p>;
  return data.map((user) => <p key={user.id}>{user.name}</p>);
}
```
