# React Hooks

## useEffect
- 컴포넌트의 사이드 이펙트(데이터 fetching, 구독, DOM 조작 등)를 처리한다
- 컴포넌트가 렌더링된 이후에 실행된다

```jsx
import { useState, useEffect } from "react";

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  // 1. 마운트 시 한 번만 실행 (의존성 배열이 빈 배열)
  useEffect(() => {
    console.log("컴포넌트가 마운트됨");
  }, []);

  // 2. 특정 값이 변경될 때마다 실행
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, [userId]); // userId가 바뀔 때마다 실행

  // 3. 클린업 함수 - 컴포넌트 언마운트 시 실행
  useEffect(() => {
    const timer = setInterval(() => console.log("tick"), 1000);
    return () => clearInterval(timer); // 정리(cleanup)
  }, []);

  return <div>{user ? user.name : "로딩중..."}</div>;
}
```

## useRef
- DOM 요소에 직접 접근하거나, 리렌더링 없이 값을 유지하고 싶을 때 사용
- .current 속성으로 값에 접근한다

```jsx
import { useRef } from "react";

function TextInput() {
  const inputRef = useRef(null);

  const handleFocus = () => {
    inputRef.current.focus(); // DOM 요소에 직접 접근
  };

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={handleFocus}>입력창 포커스</button>
    </div>
  );
}

// 리렌더링 없이 값 저장 용도
function Timer() {
  const countRef = useRef(0); // 변경해도 리렌더링 안 됨
  countRef.current += 1;
}
```

## useMemo
- 계산 비용이 큰 연산의 결과를 캐싱한다
- 의존성 배열의 값이 변경될 때만 재계산한다

```jsx
import { useMemo } from "react";

function ProductList({ products, filter }) {
  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.category === filter);
  }, [products, filter]); // products나 filter가 바뀔 때만 재계산

  return filteredProducts.map((p) => <div key={p.id}>{p.name}</div>);
}
```

## useCallback
- 함수를 메모이제이션하여 불필요한 리렌더링을 방지한다
- 자식 컴포넌트에 콜백 함수를 전달할 때 주로 사용한다

```jsx
import { useCallback } from "react";

function Parent() {
  const [count, setCount] = useState(0);

  // count가 변경될 때만 새 함수 생성
  const handleClick = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  return <Child onClick={handleClick} />;
}
```
