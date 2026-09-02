# Task 3a Report: Persistent MSW Demo Core

## Implementation summary

Added a browser-only MSW demo API that starts before React renders when `VITE_DEMO_MODE === 'true'`. Demo state is seeded for store `1`, is namespaced under `almaengi:portfolio-demo:v1`, and persists mutations through browser localStorage. The previous development-only `VITE_ENABLE_MSW` path remains unchanged for non-demo environments.

## Handled domains

- Store: stores, employee-store list, store detail, employee list/status, employee approval.
- Schedule: employee, day, and current-user lookups; create, update, and delete.
- Attendance: record, current-user today/log, dashboard summary/detail, monthly report.
- Payroll static fixtures: dashboard summary, pay day, owner and employee payroll summaries.
- Auction: list/detail/insights, create, bid, update, cancel, and close; all mutations persist.
- Chat: room list/detail/create, messages list/send, and read; sent messages persist.
- Notifications: token registration, list, single/multiple read; reads persist.
- Every remaining `/api/v1/*` route returns HTTP 501 with `DEMO_API_NOT_IMPLEMENTED`; it cannot reach a backend.

## TDD record

1. RED storage: `npm.cmd test -- --run src/demo/__tests__/handlers.test.ts`
   - Failed as expected: `Failed to resolve import "../storage"`.
2. GREEN storage: same command
   - Passed: 1 test.
3. RED fallback: `npm.cmd test -- --run src/demo/__tests__/handler-fallback.test.ts`
   - Failed as expected: `Failed to resolve import "../handlers"`.
4. GREEN fallback and storage: `npm.cmd test -- --run src/demo/__tests__/handler-fallback.test.ts src/demo/__tests__/handlers.test.ts`
   - Passed: 2 test files, 2 tests.
5. Mutation proof: `npm.cmd test -- --run src/demo/__tests__/handler-mutation.test.ts`
   - Passed: a chat POST is visible through the next messages GET.

## Verification summary

- Focused demo tests: 3 files, 3 tests passed.
- Full frontend suite: `npm.cmd test -- --run` — 6 files, 9 tests passed.
- Production build: `npm.cmd run build` — `tsc -b && vite build` completed successfully.

## Changed files

- `fe/src/demo/data.ts`
- `fe/src/demo/storage.ts`
- `fe/src/demo/handlers.ts`
- `fe/src/demo/browser.ts`
- `fe/src/demo/__tests__/handlers.test.ts`
- `fe/src/demo/__tests__/handler-fallback.test.ts`
- `fe/src/demo/__tests__/handler-mutation.test.ts`
- `fe/src/main.tsx`

## Self-review

- Demo mode worker starts before `createRoot`.
- Static assets are left unhandled, while API routes are explicitly intercepted.
- The state reader clones parsed data and falls back to fresh seed data for malformed/unavailable storage.
- Reset removes only the demo key.
- Existing mutable auction MSW handlers remain isolated to the existing non-demo, opt-in worker.

## Concerns

- The environment’s `pnpm test` invokes an install lifecycle that is blocked by ignored build-script policy. Verification therefore used the project-local test runner through `npm.cmd test`, which runs the same Vitest command successfully.
- The required test file contains the storage test; fallback and mutation coverage are split into two focused companion test files for independent node-MSW server lifecycles.

## Commit

Commit SHA: 07ce9ea (amended below with this report update)
