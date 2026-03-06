# 이벤트 처리, 조건부 렌더링, 리스트 렌더링

## 이벤트 처리
- React 이벤트는 camelCase로 작성한다 (onclick -> onClick)
- 문자열이 아닌 함수를 이벤트 핸들러로 전달한다

```jsx
function EventExample() {
  const handleClick = (e) => {
    e.preventDefault(); // 기본 동작 방지
    console.log("버튼 클릭됨");
  };

  const handleChange = (e) => {
    console.log("입력값:", e.target.value);
  };

  return (
    <div>
      <button onClick={handleClick}>클릭</button>
      <input onChange={handleChange} placeholder="입력하세요" />
      <input onFocus={() => console.log("포커스")} />
      <form onSubmit={handleClick}>
        <button type="submit">제출</button>
      </form>
    </div>
  );
}
```

## 조건부 렌더링
- 조건에 따라 다른 UI를 보여줄 수 있다

```jsx
function Dashboard({ isLoggedIn, notifications }) {
  // 1. if문 사용
  if (!isLoggedIn) {
    return <p>로그인이 필요합니다</p>;
  }

  return (
    <div>
      {/* 2. 삼항 연산자 */}
      {notifications.length > 0 ? (
        <p>새 알림 {notifications.length}개</p>
      ) : (
        <p>알림이 없습니다</p>
      )}

      {/* 3. && 연산자 - 조건이 true일 때만 렌더링 */}
      {notifications.length > 5 && <p>알림이 많습니다!</p>}
    </div>
  );
}
```

## 리스트 렌더링
- 배열 데이터를 map()으로 변환하여 렌더링한다
- 각 항목에 고유한 key를 반드시 지정해야 한다

```jsx
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: "React 공부", done: false },
    { id: 2, text: "프로젝트 설계", done: true },
  ]);

  const handleDelete = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id} style={{ textDecoration: todo.done ? "line-through" : "none" }}>
          {todo.text}
          <button onClick={() => handleDelete(todo.id)}>삭제</button>
        </li>
      ))}
    </ul>
  );
}
```

## 폼(Form) 처리 - 제어 컴포넌트
- input의 value를 state로 관리하면 제어 컴포넌트가 된다

```jsx
function SignupForm() {
  const [form, setForm] = useState({ username: "", email: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("제출된 데이터:", form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" value={form.username} onChange={handleChange} />
      <input name="email" value={form.email} onChange={handleChange} />
      <button type="submit">가입</button>
    </form>
  );
}
```
