# 컴포넌트와 Props, State

## 함수형 컴포넌트
- React에서 UI를 구성하는 기본 단위
- 함수가 JSX를 반환하는 형태로 작성한다
- 컴포넌트 이름은 반드시 대문자로 시작해야 한다

```jsx
// 기본 함수형 컴포넌트
function Welcome() {
  return <h1>안녕하세요!</h1>;
}

// 화살표 함수로도 작성 가능
const Welcome = () => {
  return <h1>안녕하세요!</h1>;
};
```

## Props (Properties)
- 부모 컴포넌트에서 자식 컴포넌트로 데이터를 전달하는 방법
- 읽기 전용이며, 자식 컴포넌트에서 수정할 수 없다

```jsx
// 부모 컴포넌트
function App() {
  return (
    <div>
      <UserCard name="김철수" age={25} />
      <UserCard name="이영희" age={30} />
    </div>
  );
}

// 자식 컴포넌트 - 구조분해 할당으로 props 받기
function UserCard({ name, age }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>나이: {age}살</p>
    </div>
  );
}

// defaultProps로 기본값 설정
function Button({ text = "클릭", color = "blue" }) {
  return <button style={{ backgroundColor: color }}>{text}</button>;
}

// children props - 태그 사이의 내용 전달
function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
// 사용: <Card title="제목"><p>카드 내용</p></Card>
```

## State (상태)
- 컴포넌트 내부에서 관리하는 변경 가능한 데이터
- state가 변경되면 컴포넌트가 자동으로 리렌더링된다
- useState Hook을 사용하여 상태를 선언한다

```jsx
import { useState } from "react";

function Counter() {
  // [상태값, 상태변경함수] = useState(초기값)
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>현재 카운트: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)}>-1</button>
      <button onClick={() => setCount(0)}>초기화</button>
    </div>
  );
}
```

### 주의: State 업데이트는 비동기적이다
```jsx
// 이전 state를 기반으로 업데이트할 때는 함수형 업데이트 사용
const handleClick = () => {
  setCount((prev) => prev + 1); // 이전 값 기반으로 안전하게 업데이트
};
```
