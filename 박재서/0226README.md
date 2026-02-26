#  React 기본 구조 정리 (Vue 경험자용)

---

##  1. React란 무엇인가

React는 **컴포넌트 기반 UI 라이브러리**이다.

Vue와 가장 큰 차이:

> **React = JavaScript 중심**
>
> **Vue = Template(HTML) 중심**

React에서는 HTML을 작성하는 것이 아니라  
**JavaScript 실행 결과가 UI가 된다.**

---

##  2. 프로젝트 기본 구조

### Vue vs React 구조 비교

| Vue | React |
|---|---|
| main.js | main.tsx |
| App.vue | App.tsx |
| template | JSX |
| script | JS 안에 포함 |

---


### Vue vs React 구조 비교

| Vue | React |
|---|---|
| main.js | main.tsx |
| App.vue | App.tsx |
| template | JSX |
| script | JS 안에 포함 |

---

## 3. State (상태 관리)

Vue의 ref와 유사.

import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}