# React Hooks 심화 (feat. Vue Composition API 복습)
>
> 작성일: 2026-03-06
>
> 목표: React의 핵심 Hooks를 Vue Composition API와 비교하며 심화 학습
>
> 키워드: `useEffect` `useMemo` `useCallback` `Custom Hook` `React Router` `상태관리` `Composition API`

---

## 1. useState 복습 + 심화

실무에서 자주 쓰는 패턴을 정리

### 객체/배열 상태 관리

**Vue (복습):**
```vue
<script setup>
import { reactive } from 'vue'

const user = reactive({
  name: '철수',
  age: 25,
  hobbies: ['코딩', '독서']
})

// 직접 변경 가능
user.name = '영희'
user.hobbies.push('운동')
</script>
```

**React:**
```jsx
import { useState } from 'react'

function App() {
  const [user, setUser] = useState({
    name: '철수',
    age: 25,
    hobbies: ['코딩', '독서']
  })

  // ❌ 직접 변경 불가
  // user.name = '영희'

  // ✅ 스프레드 연산자로 새 객체 생성
  const updateName = () => {
    setUser({ ...user, name: '영희' })
  }

  // ✅ 배열도 새로 만들어야 함
  const addHobby = () => {
    setUser({ ...user, hobbies: [...user.hobbies, '운동'] })
  }

  return (...)
}
```

### 이전 상태 기반 업데이트

```jsx
// ❌ 연속 호출 시 문제 발생
const handleClick = () => {
  setCount(count + 1)
  setCount(count + 1)  // count가 아직 이전 값이라 +1만 됨
}

// ✅ 함수형 업데이트로 해결
const handleClick = () => {
  setCount(prev => prev + 1)
  setCount(prev => prev + 1)  // 정확히 +2 됨
}
```

**Vue에서는?** `ref`나 `reactive`는 동기적으로 즉시 반영되기 때문에 이런 문제가 없다. React의 `setState`는 비동기 배치(batch) 처리되므로, 이전 상태에 의존할 때는 반드시 함수형 업데이트를 사용해야 한다.

---

## 2. useEffect — 사이드이펙트 처리

`useEffect`는 React에서 가장 중요하면서도 헷갈리기 쉬운 Hook이다. Vue의 여러 기능이 이 하나의 Hook에 대응된다.

### Vue와의 대응 관계

| Vue | React useEffect | 설명 |
|-----|-----------------|------|
| `onMounted()` | `useEffect(() => {}, [])` | 컴포넌트 마운트 시 1회 실행 |
| `watch(data, cb)` | `useEffect(() => {}, [data])` | 특정 값 변경 시 실행 |
| `watchEffect()` | `useEffect(() => {})` | 의존성 자동 감지 (매 렌더링 실행) |
| `onUnmounted()` | `useEffect` return 함수 | 컴포넌트 언마운트 시 정리 |

### 패턴별 비교

#### 마운트 시 실행 (API 호출 등)

**Vue (복습):**
```vue
<script setup>
import { ref, onMounted } from 'vue'

const data = ref(null)
const loading = ref(true)

onMounted(async () => {
  const res = await fetch('https://api.example.com/data')
  data.value = await res.json()
  loading.value = false
})
</script>
```

**React:**
```jsx
import { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://api.example.com/data')
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
  }, [])  // ← 빈 배열 = 마운트 시 1회만 실행

  return loading ? <p>로딩중...</p> : <pre>{JSON.stringify(data)}</pre>
}
```

#### 특정 값 변경 감지 (watch)

**Vue (복습):**
```vue
<script setup>
import { ref, watch } from 'vue'

const searchQuery = ref('')
const results = ref([])

watch(searchQuery, async (newVal) => {
  if (newVal.length < 2) return
  const res = await fetch(`/api/search?q=${newVal}`)
  results.value = await res.json()
})
</script>
```

**React:**
```jsx
import { useState, useEffect } from 'react'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    if (searchQuery.length < 2) return

    fetch(`/api/search?q=${searchQuery}`)
      .then(res => res.json())
      .then(setResults)
  }, [searchQuery])  // ← searchQuery가 변경될 때만 실행

  return (
    <div>
      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      <ul>
        {results.map(r => <li key={r.id}>{r.name}</li>)}
      </ul>
    </div>
  )
}
```

#### 클린업 함수 (onUnmounted)

타이머, 이벤트 리스너, 구독(subscription) 등을 정리할 때 사용한다.

**Vue (복습):**
```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const windowWidth = ref(window.innerWidth)

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>
```

**React:**
```jsx
import { useState, useEffect } from 'react'

function App() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)

    // 클린업: return 함수가 onUnmounted 역할
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <p>현재 창 너비: {windowWidth}px</p>
}
```

### useEffect 의존성 배열 정리

```jsx
// 1. 빈 배열 → 마운트 시 1회만 (= onMounted)
useEffect(() => { ... }, [])

// 2. 값 지정 → 해당 값 변경 시 (= watch)
useEffect(() => { ... }, [count, name])

// 3. 배열 생략 → 매 렌더링마다 (= watchEffect, 주의해서 사용)
useEffect(() => { ... })
```

---

## 3. useMemo — 계산된 값 캐싱

Vue의 `computed`에 해당하는 Hook이다. 비용이 큰 계산을 메모이제이션하여 불필요한 재계산을 방지한다.

### 비교

**Vue (복습):**
```vue
<script setup>
import { ref, computed } from 'vue'

const items = ref([
  { name: '사과', price: 1000 },
  { name: '바나나', price: 2000 },
  { name: '딸기', price: 3000 },
])

// items가 변경될 때만 재계산
const totalPrice = computed(() => {
  console.log('총합 계산중...')
  return items.value.reduce((sum, item) => sum + item.price, 0)
})
</script>
```

**React:**
```jsx
import { useState, useMemo } from 'react'

function App() {
  const [items] = useState([
    { name: '사과', price: 1000 },
    { name: '바나나', price: 2000 },
    { name: '딸기', price: 3000 },
  ])

  // items가 변경될 때만 재계산
  const totalPrice = useMemo(() => {
    console.log('총합 계산중...')
    return items.reduce((sum, item) => sum + item.price, 0)
  }, [items])  // ← 의존성 배열

  return <p>총합: {totalPrice}원</p>
}
```

**핵심 차이:** Vue의 `computed`는 의존성을 자동 추적하지만, React의 `useMemo`는 의존성 배열을 직접 명시해야 한다.

---

## 4. useCallback — 함수 메모이제이션

`useMemo`가 **값**을 캐싱한다면, `useCallback`은 **함수**를 캐싱한다. Vue에는 직접 대응하는 개념이 없는데, React의 렌더링 방식 때문에 필요한 최적화 도구다.

### 왜 필요한가?

```jsx
function Parent() {
  const [count, setCount] = useState(0)

  // ❌ Parent가 리렌더링될 때마다 새 함수 생성 → Child도 불필요하게 리렌더링
  const handleClick = () => console.log('클릭!')

  // ✅ count가 변경될 때만 새 함수 생성
  const handleClickMemo = useCallback(() => {
    console.log('클릭!', count)
  }, [count])

  return <Child onClick={handleClickMemo} />
}
```

**Vue에서는?** Vue는 반응형 시스템이 변경된 부분만 정확히 업데이트하기 때문에, 함수를 메모이제이션할 필요가 거의 없다. React는 부모 컴포넌트가 리렌더링되면 자식도 함께 리렌더링되는 구조이므로, `useCallback` + `React.memo`로 최적화가 필요할 때가 있다.

---

## 5. 커스텀 Hook — Vue Composable과 비교

로직을 재사용 가능한 함수로 분리하는 패턴이다. Vue의 composable 함수와 거의 동일한 개념이다.

### 예제: 데이터 Fetch 로직 재사용

**Vue Composable (복습):**
```js
// composables/useFetch.js
import { ref, watchEffect } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(true)

  watchEffect(async () => {
    loading.value = true
    try {
      const res = await fetch(url.value || url)
      data.value = await res.json()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  })

  return { data, error, loading }
}
```

사용:
```vue
<script setup>
import { useFetch } from '@/composables/useFetch'

const { data, error, loading } = useFetch('https://api.example.com/users')
</script>
```

**React Custom Hook:**
```jsx
// hooks/useFetch.js
import { useState, useEffect } from 'react'

export function useFetch(url) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [url])

  return { data, error, loading }
}
```

사용:
```jsx
import { useFetch } from './hooks/useFetch'

function UserList() {
  const { data, error, loading } = useFetch('https://api.example.com/users')

  if (loading) return <p>로딩중...</p>
  if (error) return <p>에러: {error.message}</p>

  return (
    <ul>
      {data.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}
```

### 커스텀 Hook 규칙

| 규칙 | 설명 |
|------|------|
| 이름은 `use`로 시작 | `useFetch`, `useAuth`, `useLocalStorage` 등 |
| 최상위에서만 호출 | 반복문, 조건문, 중첩 함수 안에서 호출 ❌ |
| React 함수 컴포넌트 안에서만 사용 | 일반 JS 함수에서 호출 ❌ |

Vue의 composable은 이런 제약이 없다. React에서 이 규칙이 필요한 이유는 Hook의 호출 순서로 상태를 추적하기 때문이다.

---

## 6. React Router — Vue Router와 비교

SPA에서 페이지 라우팅을 처리하는 방법이다. 구조가 Vue Router와 매우 유사하다.

### 설치 및 기본 세팅

```bash
npm install react-router-dom
```

**Vue Router (복습):**
```js
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/user/:id', component: () => import('@/views/User.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

```vue
<!-- App.vue -->
<template>
  <nav>
    <router-link to="/">홈</router-link>
    <router-link to="/about">소개</router-link>
  </nav>
  <router-view />
</template>
```

**React Router:**
```jsx
// App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import User from './pages/User'

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">홈</Link>
        <Link to="/about">소개</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/user/:id" element={<User />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### 라우트 파라미터 접근

**Vue:** `useRoute().params.id`
**React:** `useParams().id`

```jsx
import { useParams } from 'react-router-dom'

function User() {
  const { id } = useParams()
  return <h1>유저 ID: {id}</h1>
}
```

### 프로그래밍 방식 네비게이션

**Vue:** `useRouter().push('/about')`
**React:** `useNavigate()('/about')`

```jsx
import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate('/about')}>소개 페이지로 이동</button>
  )
}
```

### 라우터 비교 요약

| 기능 | Vue Router | React Router |
|------|-----------|-------------|
| 링크 컴포넌트 | `<router-link to="/">` | `<Link to="/">` |
| 라우트 표시 영역 | `<router-view />` | `<Routes>` + `<Route>` |
| 파라미터 접근 | `useRoute().params` | `useParams()` |
| 페이지 이동 | `useRouter().push()` | `useNavigate()` |
| 라우트 가드 | `beforeEach()` | loader / 직접 구현 |

---

## 7. 상태관리 맛보기

대규모 앱에서 컴포넌트 간 상태를 공유할 때 사용한다.

### Vue: Pinia (복습)

```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() { this.count++ }
  },
  getters: {
    doubleCount: (state) => state.count * 2
  }
})
```

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'
const counter = useCounterStore()
</script>

<template>
  <p>{{ counter.count }}</p>
  <p>{{ counter.doubleCount }}</p>
  <button @click="counter.increment()">+1</button>
</template>
```

### React: Zustand (가장 간결한 상태관리)

```bash
npm install zustand
```

```jsx
// stores/useCounterStore.js
import { create } from 'zustand'

const useCounterStore = create((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  doubleCount: () => get().count * 2,
}))

export default useCounterStore
```

```jsx
import useCounterStore from './stores/useCounterStore'

function Counter() {
  const { count, increment, doubleCount } = useCounterStore()

  return (
    <div>
      <p>{count}</p>
      <p>{doubleCount()}</p>
      <button onClick={increment}>+1</button>
    </div>
  )
}
```

### 상태관리 도구 비교

| 구분 | Vue (Pinia) | React (Zustand) | React (Context API) |
|------|------------|-----------------|-------------------|
| 보일러플레이트 | 적음 | 매우 적음 | 중간 |
| 학습 곡선 | 낮음 | 매우 낮음 | 낮음 |
| DevTools | Vue DevTools 내장 | 별도 미들웨어 | React DevTools |
| 적합한 규모 | 중~대규모 | 소~대규모 | 소규모 |

Context API는 React 내장이라 별도 설치가 불필요하지만, 상태가 변경될 때 모든 소비 컴포넌트가 리렌더링되는 단점이 있다. Zustand는 필요한 상태만 구독할 수 있어 성능상 유리하다.

---

## 8. 실습 예제: API 데이터 Fetch + 로딩/에러 처리

커스텀 Hook, useEffect, 조건부 렌더링을 종합적으로 활용하는 실전 예제다.

### Vue 버전

```vue
<template>
  <div>
    <h1>GitHub 사용자 검색</h1>
    <input v-model="username" placeholder="GitHub 사용자명" />
    <button @click="search" :disabled="loading">검색</button>

    <div v-if="loading">로딩중...</div>
    <div v-else-if="error">에러: {{ error }}</div>
    <div v-else-if="user">
      <img :src="user.avatar_url" width="80" />
      <h2>{{ user.name }}</h2>
      <p>{{ user.bio }}</p>
      <p>저장소: {{ user.public_repos }}개</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const username = ref('')
const user = ref(null)
const loading = ref(false)
const error = ref(null)

const search = async () => {
  if (!username.value) return
  loading.value = true
  error.value = null

  try {
    const res = await fetch(`https://api.github.com/users/${username.value}`)
    if (!res.ok) throw new Error('사용자를 찾을 수 없습니다')
    user.value = await res.json()
  } catch (e) {
    error.value = e.message
    user.value = null
  } finally {
    loading.value = false
  }
}
</script>
```

### React 버전

```jsx
import { useState } from 'react'

// 커스텀 Hook으로 API 호출 로직 분리
function useGitHubUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = async (username) => {
    if (!username) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`https://api.github.com/users/${username}`)
      if (!res.ok) throw new Error('사용자를 찾을 수 없습니다')
      setUser(await res.json())
    } catch (e) {
      setError(e.message)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  return { user, loading, error, search }
}

// 컴포넌트
function App() {
  const [username, setUsername] = useState('')
  const { user, loading, error, search } = useGitHubUser()

  return (
    <div>
      <h1>GitHub 사용자 검색</h1>
      <input
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="GitHub 사용자명"
      />
      <button onClick={() => search(username)} disabled={loading}>
        검색
      </button>

      {loading && <div>로딩중...</div>}
      {error && <div>에러: {error}</div>}
      {user && (
        <div>
          <img src={user.avatar_url} width={80} alt={user.name} />
          <h2>{user.name}</h2>
          <p>{user.bio}</p>
          <p>저장소: {user.public_repos}개</p>
        </div>
      )}
    </div>
  )
}

export default App
```

**포인트:** React 버전에서는 API 호출 로직을 `useGitHubUser`라는 커스텀 Hook으로 분리했다. 이렇게 하면 같은 로직을 다른 컴포넌트에서도 재사용할 수 있고, 컴포넌트는 UI에만 집중할 수 있다.

---

## 전체 요약 정리

| Vue (Composition API) | React Hooks | 핵심 포인트 |
|-----------------------|-------------|------------|
| `ref()` / `reactive()` | `useState()` | React는 불변 업데이트 필수, 함수형 업데이트 패턴 숙지 |
| `onMounted()` | `useEffect(() => {}, [])` | 빈 의존성 배열 = 마운트 1회 |
| `watch()` | `useEffect(() => {}, [deps])` | 의존성 배열에 감시할 값 명시 |
| `onUnmounted()` | `useEffect` return 함수 | 클린업으로 리소스 정리 |
| `computed()` | `useMemo()` | Vue는 자동 추적, React는 의존성 직접 명시 |
| 해당 없음 | `useCallback()` | React 렌더링 최적화 전용 |
| composable 함수 | Custom Hook (`use~`) | 거의 동일한 패턴, React는 호출 규칙 존재 |
| Vue Router | React Router | API 이름만 다를 뿐 구조 거의 동일 |
| Pinia | Zustand / Context API | Zustand가 Pinia와 가장 유사한 DX |

**한 줄 요약:** Vue Composition API를 알고 있다면 React Hooks는 "같은 개념, 다른 문법"이다. 가장 주의할 점은 React의 **의존성 배열 직접 관리**와 **상태 불변성** 원칙이며, 이 두 가지만 체화되면 Vue 경험을 그대로 React에 옮길 수 있다.