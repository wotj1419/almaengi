# Portfolio Preview Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Vercel Preview deployments usable as a backend-free portfolio demo at `/demo/owner` and `/demo/employee`, without changing Production authentication behavior.

**Architecture:** `VITE_DEMO_MODE=true` is the only activation switch. In that mode, a browser MSW worker intercepts every `/api/*` request and returns typed fixtures backed by namespaced localStorage. Dedicated demo entry routes establish the existing persisted Zustand session; FCM and STOMP connections are disabled before they can reach external services.

**Tech Stack:** React 19, TypeScript, React Router, Zustand, Axios, MSW 2, Vitest, Vite, Vercel Preview.

**Spec:** `docs/superpowers/specs/2026-09-02-portfolio-preview-demo-design.md`

## Global Constraints

- `VITE_DEMO_MODE` must be set to `true` only for Vercel Preview; Production must not contain the variable.
- Demo mode must never issue a request to a backend, Firebase, or a STOMP broker.
- Production behavior must be unchanged when `VITE_DEMO_MODE` is absent or not exactly `true`.
- Mock response bodies must use the existing `ApiResponse<T>` envelope and existing frontend DTO types.
- Mutable demo data must use a namespaced localStorage key and include a reset operation.
- The existing catch-all Vercel SPA rewrite remains in place.

---

### Task 1: Add a testable demo-mode core and test runner

**Files:**
- Create: `fe/src/demo/config.ts`
- Create: `fe/src/demo/session.ts`
- Create: `fe/src/demo/__tests__/config.test.ts`
- Create: `fe/src/demo/__tests__/session.test.ts`
- Modify: `fe/package.json`
- Modify: `fe/vite.config.ts`

**Interfaces:**
- Produces `isDemoMode(env?: Record<string, string | undefined>): boolean`.
- Produces `DEMO_AUTH_TOKEN`, `DemoRole`, `createDemoSession(role)`, `clearDemoSession()`, and `isDemoAccessToken(token)`.
- Produces `npm run test` using Vitest with a `jsdom` test environment.

- [ ] **Step 1: Write the failing demo flag tests**

```ts
import { describe, expect, it } from 'vitest';
import { isDemoMode } from '../config';

describe('isDemoMode', () => {
  it('enables demo mode only for the exact true flag', () => {
    expect(isDemoMode({ VITE_DEMO_MODE: 'true' })).toBe(true);
    expect(isDemoMode({ VITE_DEMO_MODE: 'TRUE' })).toBe(false);
    expect(isDemoMode({})).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails because the module does not exist**

Run: `pnpm test -- config.test.ts`

Expected: FAIL with module resolution error for `../config`.

- [ ] **Step 3: Implement the smallest demo flag module**

```ts
type DemoEnvironment = Record<string, string | undefined>;

export function isDemoMode(env: DemoEnvironment = import.meta.env) {
  return env.VITE_DEMO_MODE === 'true';
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm test -- config.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing session tests**

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoSession, DEMO_AUTH_TOKEN } from '../session';

describe('createDemoSession', () => {
  beforeEach(() => localStorage.clear());

  it('creates an owner session used by the existing auth store', () => {
    const session = createDemoSession('owner');

    expect(session.user.role).toBe('OWNER');
    expect(session.activeStoreId).toBe(1);
    expect(localStorage.getItem('accessToken')).toBe(DEMO_AUTH_TOKEN);
  });
});
```

- [ ] **Step 6: Run the session test and verify it fails because the module exports are absent**

Run: `pnpm test -- session.test.ts`

Expected: FAIL with missing exports from `../session`.

- [ ] **Step 7: Implement role fixtures and storage-safe session helpers**

```ts
export type DemoRole = 'owner' | 'employee';

export const DEMO_AUTH_TOKEN = 'portfolio-demo-token';

export function createDemoSession(role: DemoRole) {
  const user = role === 'owner'
    ? { id: 1, name: '데모 점주', role: 'OWNER' as const }
    : { id: 10, name: '데모 직원', role: 'EMPLOYEE' as const };

  localStorage.setItem('accessToken', DEMO_AUTH_TOKEN);
  return { user, activeStoreId: 1, isLoggedIn: true };
}
```

- [ ] **Step 8: Add Vitest and jsdom configuration**

Add `vitest` and `jsdom` as development dependencies, add a `test` script that runs Vitest once, and add `test: { environment: 'jsdom' }` to the Vite config.

- [ ] **Step 9: Run all new core tests**

Run: `pnpm test -- src/demo/__tests__/config.test.ts src/demo/__tests__/session.test.ts`

Expected: PASS with four or more assertions covering enabled, disabled, owner, and employee state.

- [ ] **Step 10: Commit**

```bash
git add fe/package.json fe/pnpm-lock.yaml fe/vite.config.ts fe/src/demo
git commit -m "feat: add preview demo mode core"
```

### Task 2: Add URL-based demo entry and block external session services

**Files:**
- Create: `fe/src/demo/pages/DemoEntryPage.tsx`
- Create: `fe/src/demo/__tests__/route-guard.test.ts`
- Modify: `fe/src/router/index.tsx`
- Modify: `fe/src/App.tsx`
- Modify: `fe/src/api/instance.ts`
- Modify: `fe/src/api/session.ts`
- Modify: `fe/src/stores/useChatSocket.ts`
- Modify: `fe/src/features/auction/hooks/useAuctionSocket.ts`

**Interfaces:**
- Consumes `isDemoMode()` and `createDemoSession(role)` from Task 1.
- Produces `/demo/owner` and `/demo/employee` routes that redirect to `/home` after session initialization.
- Production `/login` and reissue behavior remain unchanged.

- [ ] **Step 1: Write the failing role route parser test**

```ts
import { describe, expect, it } from 'vitest';
import { parseDemoRole } from '../session';

describe('parseDemoRole', () => {
  it('accepts only the two public demo URLs', () => {
    expect(parseDemoRole('owner')).toBe('owner');
    expect(parseDemoRole('employee')).toBe('employee');
    expect(parseDemoRole('admin')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails for the missing parser**

Run: `pnpm test -- route-guard.test.ts`

Expected: FAIL because `parseDemoRole` is not exported.

- [ ] **Step 3: Add the parser and implement `DemoEntryPage`**

The page must:

```tsx
const role = parseDemoRole(roleParam);
if (!isDemoMode()) return <Navigate replace to={ROUTES.LOGIN} />;
if (!role) return <Navigate replace to="/demo/owner" />;
useAuthStore.getState().login(session.user, DEMO_AUTH_TOKEN, session.activeStoreId);
return <Navigate replace to={ROUTES.HOME} />;
```

Use an effect for the store mutation and render a minimal loading surface while redirecting.

- [ ] **Step 4: Register `/demo/:role` before the catch-all router route**

Add `<Route path="/demo/:role" element={<DemoEntryPage />} />` and preserve all existing application routes unchanged.

- [ ] **Step 5: Add a failing no-network session test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { validateSessionByReissue } from '@/api/session';

it('does not call fetch while demo mode is active', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  await validateSessionByReissue();
  expect(fetchSpy).not.toHaveBeenCalled();
});
```

Set `VITE_DEMO_MODE=true` through a testable config override rather than mutating `import.meta.env` directly.

- [ ] **Step 6: Run the test and verify it fails because reissue currently calls fetch**

Run: `pnpm test -- route-guard.test.ts`

Expected: FAIL with the fetch spy called once.

- [ ] **Step 7: Add minimal guards before external calls**

Implement these exact boundaries:

```ts
if (isDemoMode()) return 'unauthenticated'; // validateSessionByReissue
if (isDemoMode()) return Promise.reject(new Error('Demo API request was not intercepted'));
if (isDemoMode()) return; // useFcmBootstrap caller in App
if (isDemoMode()) return; // STOMP connection hooks before Client creation
```

The Axios response interceptor must not start `/auth/reissue` in demo mode. Existing non-demo branches must remain byte-for-byte equivalent where practical.

- [ ] **Step 8: Run the route and no-network tests**

Run: `pnpm test -- route-guard.test.ts`

Expected: PASS; demo session initializes only for valid roles and no raw reissue fetch occurs.

- [ ] **Step 9: Commit**

```bash
git add fe/src/demo fe/src/router/index.tsx fe/src/App.tsx fe/src/api/instance.ts fe/src/api/session.ts fe/src/stores/useChatSocket.ts fe/src/features/auction/hooks/useAuctionSocket.ts
git commit -m "feat: add role-based preview demo entry"
```

### Task 3: Implement persistent demo API fixtures with a network-blocking fallback

**Files:**
- Create: `fe/src/demo/data.ts`
- Create: `fe/src/demo/storage.ts`
- Create: `fe/src/demo/handlers.ts`
- Create: `fe/src/demo/browser.ts`
- Create: `fe/src/demo/__tests__/handlers.test.ts`
- Modify: `fe/src/main.tsx`
- Modify: `fe/src/mocks/browser.ts`
- Modify: `fe/src/mocks/handlers.ts`

**Interfaces:**
- Produces `startDemoWorker(): Promise<void>`.
- Produces `resetDemoData(): void`, `readDemoData()`, and `writeDemoData(data)` under the `almaengi:portfolio-demo:v1` localStorage key.
- Supports all requests needed by `/home`, `/schedule`, `/attendance`, `/payroll`, `/auction`, `/store/community`, `/notification`, `/store/documents`, and `/report`.

- [ ] **Step 1: Write a failing persistence test**

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { readDemoData, writeDemoData } from '../storage';

describe('demo data storage', () => {
  beforeEach(() => localStorage.clear());

  it('persists an auction mutation across a reread', () => {
    const data = readDemoData();
    data.auctions[0].status = 'CLOSED';
    writeDemoData(data);

    expect(readDemoData().auctions[0].status).toBe('CLOSED');
  });
});
```

- [ ] **Step 2: Run the test and verify it fails for missing storage exports**

Run: `pnpm test -- handlers.test.ts`

Expected: FAIL with unresolved `../storage`.

- [ ] **Step 3: Create typed seed data and localStorage cloning**

Seed store, employees, weekly schedules, attendance summaries, payroll data, notifications, rooms/messages, auction bidders, contract summaries/details, and report data. `readDemoData()` must return `structuredClone(seed)` on first read and a parsed localStorage record thereafter. `resetDemoData()` must remove only `almaengi:portfolio-demo:v1`.

- [ ] **Step 4: Implement API handlers by domain**

Use existing DTOs and `success(data)` envelope helper. Add handlers for:

```txt
GET/POST/PUT /api/v1/stores
GET/PATCH /api/v1/stores/:storeId/employees/*
GET/POST/PATCH/DELETE /api/v1/stores/:storeId/employees/*/schedules/*
GET/POST /api/v1/attendances/*
GET/PATCH/POST /api/v1/stores/:storeId/payrolls/*
GET/PATCH /api/v1/notifications/*
GET/POST /api/v1/chat/*
GET/POST/PUT/DELETE /api/v1/auctions/*
GET/POST/PATCH /api/v1/stores/:storeId/contracts/*
```

Implement update handlers for schedule, attendance, auction bid/close/create, chat send/read, notification read, and contract signature. Return a local `Blob` for the two PDF endpoints. The existing auction mock fixture is migrated or reused; do not leave two conflicting mutable auction stores.

- [ ] **Step 5: Add the explicit final handler that prevents backend access**

```ts
http.all('/api/{*path}', ({ request }) =>
  HttpResponse.json(
    { status: 'DEMO_API_NOT_IMPLEMENTED', message: `Demo fixture missing: ${request.method} ${new URL(request.url).pathname}`, data: null },
    { status: 501 }
  )
)
```

The handler must be last so a supported route is never shadowed.

- [ ] **Step 6: Add a failing handler behavior test**

```ts
it('returns a mock-safe 501 response for an unsupported API route', async () => {
  const response = await fetch('/api/v1/unknown-demo-route');
  expect(response.status).toBe(501);
  expect((await response.json()).status).toBe('DEMO_API_NOT_IMPLEMENTED');
});
```

- [ ] **Step 7: Run it and verify it fails before the fallback exists**

Run: `pnpm test -- handlers.test.ts`

Expected: FAIL because the request is unhandled or reaches the test network layer.

- [ ] **Step 8: Start the demo worker only when the flag is enabled**

Replace the existing startup sequence with one async bootstrap function:

```ts
async function bootstrapApp() {
  if (isDemoMode()) await startDemoWorker();
  else await enableMocking();
  createRoot(...).render(...);
}
```

Keep `VITE_ENABLE_MSW` development-only behavior unchanged. In demo worker startup, set `onUnhandledRequest: 'bypass'` only because the explicit `/api/*` fallback is responsible for API blocking; static assets must remain loadable.

- [ ] **Step 9: Run persistence and handler tests**

Run: `pnpm test -- handlers.test.ts`

Expected: PASS for persisted fixture mutation and 501 fallback; no network error is logged.

- [ ] **Step 10: Commit**

```bash
git add fe/src/demo fe/src/main.tsx fe/src/mocks
git commit -m "feat: add persistent preview demo API"
```

### Task 4: Make the demo discoverable and document Vercel Preview deployment

**Files:**
- Modify: `fe/src/features/login/pages/LoginPage.tsx`
- Modify: `README.md`
- Modify: `fe/vercel.json` only if its existing rewrite is not retained byte-for-byte

**Interfaces:**
- Demo links are rendered only when `isDemoMode()` is true.
- README documents both demo URLs and the single Preview-only variable.

- [ ] **Step 1: Write a failing visibility predicate test**

```ts
import { expect, it } from 'vitest';
import { shouldShowDemoLinks } from '@/demo/config';

it('does not expose demo links in production mode', () => {
  expect(shouldShowDemoLinks({ VITE_DEMO_MODE: undefined })).toBe(false);
});
```

- [ ] **Step 2: Run the test and verify it fails because the predicate is absent**

Run: `pnpm test -- config.test.ts`

Expected: FAIL with missing `shouldShowDemoLinks` export.

- [ ] **Step 3: Implement the predicate and minimal conditional login links**

Show links labelled `점주 데모 보기` and `직원 데모 보기` only when the demo flag is true. Keep the existing email/password form and standard navigation unchanged.

- [ ] **Step 4: Document exact Vercel configuration**

Add a README section containing:

```txt
Project Settings → Environment Variables
Name: VITE_DEMO_MODE
Value: true
Targets: Preview only
Do not select: Production, Development
```

Document verification URLs as `<Preview URL>/demo/owner` and `<Preview URL>/demo/employee`, plus direct refresh verification for `/home` and `/auction/1`. State that `fe/vercel.json` already rewrites all paths to `/index.html`.

- [ ] **Step 5: Run the focused predicate test**

Run: `pnpm test -- config.test.ts`

Expected: PASS for demo and non-demo environments.

- [ ] **Step 6: Commit**

```bash
git add README.md fe/src/features/login/pages/LoginPage.tsx fe/src/demo/config.ts fe/vercel.json
git commit -m "docs: explain preview demo deployment"
```

### Task 5: Verify production and demo builds, push, and create the Vercel Preview

**Files:**
- Verify only: all files above.

**Interfaces:**
- Production build runs with no demo flag.
- Preview demo build runs with `VITE_DEMO_MODE=true`.

- [ ] **Step 1: Run all unit tests**

Run: `pnpm test`

Expected: PASS with zero failures.

- [ ] **Step 2: Run the production build**

Run: `pnpm build`

Expected: successful Vite/PWA build; no demo links or demo worker in the runtime path.

- [ ] **Step 3: Run the Preview demo build**

Run: `$env:VITE_DEMO_MODE='true'; pnpm build`

Expected: successful Vite/PWA build with the demo startup path compiled.

- [ ] **Step 4: Serve the demo build and verify direct routes**

Run: `$env:VITE_DEMO_MODE='true'; pnpm dev --host 127.0.0.1`

Verify manually:

```txt
/demo/owner redirects to /home as OWNER
/demo/employee redirects to /home as EMPLOYEE
/auction/1 refreshes without a backend request
/store/community/chat/<roomId> loads mock messages
/notification reads mock notifications
```

- [ ] **Step 5: Review the final branch diff and commit uncommitted changes**

Run: `git status --short && git diff --check && git log --oneline <base>..HEAD`

Expected: only demo implementation, tests, and documentation changes.

- [ ] **Step 6: Push the feature branch**

Run: `git push -u origin codex/portfolio-demo-preview`

Expected: GitHub accepts the branch and Vercel creates a Preview deployment from the connected repository.

- [ ] **Step 7: Configure the Preview-only variable and redeploy**

In the Vercel project dashboard, add `VITE_DEMO_MODE=true` with only the Preview target selected. Redeploy the Preview build for `codex/portfolio-demo-preview` after saving the variable.

- [ ] **Step 8: Report the exact Preview URL and verification steps**

Copy the URL supplied by Vercel. Verify `/demo/owner`, `/demo/employee`, `/home`, and `/auction/1` on that URL. Report the URL only after opening it successfully.
