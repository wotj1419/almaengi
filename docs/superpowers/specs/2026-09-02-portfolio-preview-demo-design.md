# Portfolio Preview Demo Design

## Goal

Deploy the existing frontend to Vercel Preview with a portfolio-only demo mode that never calls the backend, while retaining the production login and authentication flow unchanged.

## Scope

- Demo entry routes: `/demo/owner` and `/demo/employee`.
- Demo mode is enabled only when Vite receives `VITE_DEMO_MODE=true` from the Vercel Preview environment.
- The selected role is placed into the existing Zustand auth store with an opaque demo access token and an active demo store.
- API requests in demo mode are handled entirely in the browser with MSW and persisted in `localStorage` where a user action changes data.
- FCM and STOMP WebSocket clients are not started in demo mode.
- Existing SPA rewrite remains unchanged so direct navigation to any route resolves to `index.html`.

## Non-goals

- No backend deployment, credentials, Firebase configuration, WebSocket server, or real authentication service.
- No change to Production or non-demo Preview behavior.
- No attempt to make every historic domain flow fully editable; the portfolio flows are dashboard, schedule, attendance, auction, chat, notification, documents, and report.

## Architecture

### Demo-mode boundary

Create a small `demo/config` module that exposes `isDemoMode`. It is true only for the explicitly injected `VITE_DEMO_MODE` build variable. Production continues to evaluate it as false even if the repository is built locally without the variable.

`main.tsx` starts the existing MSW worker when demo mode is true. Its unhandled-request policy is restrictive for `/api/` paths: an explicit final MSW handler returns a demo-safe response so no API request escapes to a real backend. Development MSW remains opt-in through `VITE_ENABLE_MSW`.

### Session and navigation

`/demo/:role` is a dedicated entry component. In demo mode it initializes owner or employee demo identity, persists the choice, then redirects to `/home`. Outside demo mode it redirects to the ordinary login route. Existing role-dependent rendering is reused rather than duplicating pages.

The demo token uses a clearly non-production format and the API interceptor must never attempt `/auth/reissue` when demo mode is active.

### Demo data

Extend the existing MSW fixture layer with a focused, role-aware set of handlers. Seed data is loaded on first use. Mutations write back to a namespaced localStorage record so changes survive refreshes in the same browser. A reset action is exposed only on demo entry routes to restore the initial fixtures.

The handler layer returns the same API envelope and DTO shapes that existing pages expect. It supports the defined portfolio routes and has a final `/api/*` handler that prevents an accidental network call for a missing fixture.

### External services

FCM bootstrapping and STOMP subscriptions are skipped in demo mode. The corresponding pages receive fixture data through the same API and store contracts, so the frontend remains navigable without network connections.

## Files expected to change

- `fe/src/demo/*`: demo configuration, seed data, session initialization, and API handlers.
- `fe/src/main.tsx`: start MSW for the explicit demo flag.
- `fe/src/App.tsx`: skip FCM bootstrap in demo mode.
- `fe/src/router/index.tsx`: add demo entry routes.
- `fe/src/api/instance.ts`: prevent token refresh network calls in demo mode.
- `fe/src/mocks/*`: reuse or move auction fixtures into the demo handler layer.
- `fe/src/features/login/pages/LoginPage.tsx`: optional links only when demo mode is enabled, if needed for discoverability.
- `fe/src/**`: only pages that need a small demo-safe guard for an external connection.
- `fe/vercel.json` and `README.md`: preserve/document SPA rewrite and Preview environment setup.

## Error handling

- A direct `/demo/*` route outside demo mode redirects to `/login`.
- Invalid demo roles redirect to `/demo/owner` in demo mode.
- Missing demo fixtures return a visible, mock-safe API error and never fall through to the network.
- Clearing demo data reseeds the default fixtures without touching regular auth data.

## Testing

- Unit test the demo-mode flag, role session creation, and URL guard.
- Unit test that the API interceptor does not issue token revalidation in demo mode.
- Test MSW data persistence and the final catch-all API handler.
- Build with `VITE_DEMO_MODE=true` and without it.
- Manually verify direct Preview-style navigation to `/demo/owner`, `/demo/employee`, `/home`, and a nested route.

## Deployment configuration

Vercel project settings must set `VITE_DEMO_MODE=true` with the **Preview** target only. It must not be set for Production or Development. The repository contains no Vercel credential or integration, so configuring that account-level setting and retrieving the resulting Preview URL requires either an authenticated Vercel CLI session or user access in the Vercel dashboard.
