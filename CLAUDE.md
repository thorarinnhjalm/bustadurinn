# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bústaðurinn.is is a SaaS platform for managing shared Icelandic summer houses (sumarhús). All user-facing text is in Icelandic. Private, proprietary product owned by Neðri Hóll Hugmyndahús ehf.

## Commands

```bash
npm run dev          # Vite dev server on port 5173
npm run build        # Production build via SWC → dist/ (drops console.* and debugger)
npm run preview      # Preview production build locally
npm run lint         # ESLint (flat config format)
npm run test         # Vitest (single run)
npm run test:ui      # Vitest with browser UI
npm run test:watch   # Vitest in watch mode
npm run test:coverage # Vitest with V8 coverage
npx vitest run src/utils/rbac.test.ts  # Run a single test file
npm run test:e2e     # Playwright E2E tests (requires dev server running)
npm run test:e2e:ui  # Playwright with interactive UI
```

Utility scripts in `scripts/`:
```bash
npm run seed-email-templates  # Seed email templates to Firestore
npm run generate-sitemap      # Generate sitemap.xml
npm run migrate-admin-rbac    # Migrate admin to RBAC system
```

## Architecture

**React 19 SPA** with TypeScript 5.9, Vite 7, deployed on Vercel Pro. Backend is Firebase (Firestore, Auth, Storage). Serverless API routes live in `/api/` (Vercel Functions). Node.js 20.x required.

### Key Layers

- **Pages** (`src/pages/`): Route-level components. Critical pages (Landing, Login, Signup, Onboarding, Dashboard) eagerly loaded; all others lazy-loaded via `React.lazy`.
- **Components** (`src/components/`): Reusable UI, organized by feature subdirectories (`finance/`, `tasks/`, `calendar/`, etc.).
- **Services** (`src/services/`): Thin async functions wrapping direct Firestore SDK calls. No classes, no ORM.
- **Store** (`src/store/appStore.ts`): Single Zustand store for global state (currentUser, currentHouse, auth state).
- **Hooks** (`src/hooks/`): `useEffectiveUser` is the canonical hook for current user (handles impersonation). `useUserRole` and `usePermissions` for RBAC. Subdirs: `admin/`, `settings/`.
- **API routes** (`api/`): Vercel serverless functions for operations requiring secrets (email via Resend, Firebase Admin SDK, rate limiting via Upstash Redis). Shared helpers in `api/utils/` (firebaseAdmin, ratelimit, apiAuth).
- **Types** (`src/types/models.ts`): All Firestore data model interfaces. RBAC types in `src/types/rbac.ts`.

### Dev Server

Vite uses SWC (not Babel) via `@vitejs/plugin-react-swc`. In dev mode, `/api` requests are proxied to `https://bustadurinn.is` — no local API server needed.

### Routing

React Router DOM v7 with `BrowserRouter` in `src/App.tsx`. Public pages use Icelandic URL slugs (`/eiginleikar`, `/spurt-og-svarad`, `/torgid`). Route guards: `ProtectedRoute` (auth check) and `AdminRoute` (RBAC super_admin check).

### Authentication & RBAC

Firebase Auth (email/password, Google OAuth, Facebook OAuth). Auth listener in renderless `AuthHandler` component. System roles: `super_admin | support_admin | regular_user`. House roles: `owner | admin | member | viewer` (hierarchical). Roles stored in Firestore `user_roles/{userId}`.

### Impersonation (God Mode)

Super admin can impersonate users. State managed via `ImpersonationContext` (`src/contexts/ImpersonationContext.tsx`), persisted to `localStorage`. Always use `useEffectiveUser()` to get current user — it transparently returns the impersonated user when active.

### Sandbox / Demo Mode

`SandboxContext` (`src/contexts/SandboxContext.tsx`) provides a demo mode with mock data from `src/utils/sandboxMockData.ts` and `sandboxStorage.ts`.

### Organizations

B2B feature for companies/unions, with its own Firestore subcollection hierarchy under `organizations/{orgId}/` (members, access_requests, booking_requests, admin_actions). Dedicated service: `organizationService.ts`.

### External Integrations

- **Askell** — Icelandic subscription billing. Webhook at `/api/askell-webhook.ts` verifies HMAC signatures and updates house subscription status. Env: `ASKELL_WEBHOOK_SECRET`.
- **Payday.is** — Icelandic invoicing service. `/api/payday-create-invoice.ts` is admin-only and uses OAuth2 client credentials. Env: `VITE_PAYDAY_CLIENT_ID`, `PAYDAY_SECRET_KEY`, `PAYDAY_TOKEN_URL`.
- **FCM Push Notifications** — Firebase Cloud Messaging via `/api/push-notification.ts`. Client-side token registration in `src/utils/pushNotifications.ts`.
- **Open-Meteo** — Weather data, no auth required. Service: `src/services/weatherService.ts`.
- **Road conditions** — Via apis.is, no auth. Service: `src/services/roadService.ts`.

### Error Tracking

Sentry is configured for error tracking and performance monitoring (`@sentry/react`). DSN via `VITE_SENTRY_DSN` env var.

## Code Conventions

- **Import alias**: `@/*` maps to `src/*` — always use this, never relative `../../` paths
- **Type imports**: Must use `import type { ... }` syntax (`verbatimModuleSyntax: true`)
- **No enums/namespaces**: `erasableSyntaxOnly: true` — use union types instead
- **Strict TypeScript**: `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **`any` is allowed**: `@typescript-eslint/no-explicit-any` is disabled
- **File naming**: PascalCase for components/pages, camelCase for hooks/utils/services
- **Unused args**: Prefix with `_` to satisfy linter
- **Firestore timestamps**: Use `serverTimestamp()` for writes, convert Firestore Timestamps to JS `Date` on reads
- **Language**: All user-facing strings in Icelandic, Icelandic date locale (`is-IS`), ISK currency
- **Firebase client**: `experimentalForceLongPolling: true` and `ignoreUndefinedProperties: true` are set in `src/lib/firebase.ts` (Safari compatibility)
- **Logging**: Use `logger` from `src/utils/logger.ts` — never `console.log` directly. `logger.debug` is dev-only; `logger.warn`/`error` fire everywhere. The production build drops all `console.*` calls anyway.

## Styling

Tailwind CSS 3.4 with a custom "Scandi-Minimalist" design system defined in `src/index.css`. Key design tokens:

- Colors: `bone` (#fdfcf8), `charcoal` (#1a1a1a), `amber` (#e8b058), warm greys
- Fonts: `font-serif` = Fraunces (headings), `font-sans` = Inter (body)
- Sharp corners (max 6px radius), high whitespace, 200ms transitions
- Pre-built classes: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.card`, `.input`, `.badge`, `.toast`

## Testing

Vitest + @testing-library/react with jsdom. Globals enabled (`describe`, `it`, `expect` don't need imports). Firebase is globally mocked in `src/test/setup.ts`. Test files are collocated next to source (e.g., `utils/rbac.test.ts`).

E2E tests use Playwright (Chromium only). Tests live in `tests/e2e/`. The dev server must be running on `http://127.0.0.1:5173` before running E2E tests.

## Deployment

Vercel Pro, auto-deploys from `main` branch. SPA fallback configured — all non-`/api` routes rewrite to `index.html`. Security headers (HSTS, CSP, X-Frame-Options) set in `vercel.json`. Production build drops `console` and `debugger` statements. Manual code splitting: React vendor, Firebase, and UI vendor chunks.

Cron jobs (configured in `vercel.json`):
- `/api/cron/recover-orphans` — daily at 12:00 (repairs houses with missing owner records)

## Environment Variables

Client-side vars (prefixed `VITE_`) are documented in `.env.example`. Server-side vars used by API routes (set in Vercel dashboard, not in `.env.example`):

| Var | Used by |
|-----|---------|
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK (most API routes) |
| `RESEND_API_KEY` | `/api/send-email.ts`, `/api/invite-member.ts` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (`api/utils/ratelimit.ts`) |
| `ASKELL_WEBHOOK_SECRET` | Subscription webhook HMAC verification |
| `PAYDAY_SECRET_KEY`, `VITE_PAYDAY_CLIENT_ID` | Payday.is invoicing OAuth2 |
| `CRON_SECRET` | Cron job authentication |
| `FACEBOOK_APP_SECRET` | Facebook OAuth data-deletion callback |

## Firestore Collections

Core: `users/{uid}`, `user_roles/{uid}`, `houses/{houseId}`, `houses/{houseId}/bookings`, `organizations/{orgId}` (with subcollections: members, access_requests, booking_requests, admin_actions). Also: `contact_submissions`, `email_templates`, `coupons`, `feedback`.

Security rules in `firestore.rules`, storage rules in `storage.rules`. Admin audit log (`admin_actions`) is immutable — updates and deletes are blocked. Composite indexes defined in `firestore.indexes.json`.

Firebase emulators available: Auth (:9099), Firestore (:8080), Storage (:9199), UI (:4000).
