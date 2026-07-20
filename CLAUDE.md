# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bústaðurinn.is is a free platform for managing shared Icelandic summer houses (sumarhús). All user-facing text is in Icelandic. Private, proprietary product owned by Neðri Hóll Hugmyndahús ehf.

**The platform is fully free** — there are no subscriptions, trials, or payment gates. All houses have `subscription_status: 'free'`. Do not introduce subscription/payment logic. The Áskell integration (payment processor) is decommissioned; any remaining references are legacy code to be removed.

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
npx tsc -p tsconfig.app.json --noEmit  # Type check (plain `npx tsc --noEmit` is a silent NO-OP — root tsconfig has files:[] with project references)
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
- **Services** (`src/services/`): Thin async functions wrapping direct Firestore SDK calls. No classes, no ORM. All services convert Firestore `Timestamp` → JS `Date` on reads.
- **Store** (`src/store/appStore.ts`): Single Zustand store for global state (currentUser, currentHouse, auth state). No selectors or computed values — derivation happens in hooks. `logout()` resets store state but does NOT call Firebase `signOut()` — the calling component must do that. Does not persist to localStorage.
- **Hooks** (`src/hooks/`): `useEffectiveUser` is the canonical hook for current user (handles impersonation). `useUserRole` and `usePermissions` for RBAC. Subdirs: `admin/`, `settings/`.
- **API routes** (`api/`): Vercel serverless functions for operations requiring secrets (email via Resend, Firebase Admin SDK, rate limiting via Upstash Redis). Shared helpers in `api/utils/` (firebaseAdmin, ratelimit, apiAuth).
- **Types** (`src/types/models.ts`): All Firestore data model interfaces. RBAC types in `src/types/rbac.ts`.

### Dev Server

Vite uses SWC (not Babel) via `@vitejs/plugin-react-swc`. In dev mode, `/api` requests are proxied to `https://bustadurinn.is` — no local API server needed.

### Build Notes

- `build.target: 'es2020'` — no legacy browser polyfills
- **All `console.*` calls are stripped in production builds** (`esbuild.drop: ['console', 'debugger']`). Use `logger` from `src/utils/logger.ts` instead — `logger.debug` is dev-only; `logger.warn`/`error` fire everywhere.
- Sourcemaps are generated with `sourcemapExcludeSources: true` — maps exist but source content is not embedded.
- Manual chunks: `react-vendor` (react, react-dom, react-router-dom), `firebase` (firebase/\*), `ui-vendor` (lucide-react, date-fns).

### Routing

React Router DOM v7 with `BrowserRouter` in `src/App.tsx`. Public pages use Icelandic URL slugs (`/eiginleikar`, `/spurt-og-svarad`, `/torgid`). Route guards: `ProtectedRoute` (auth check) and `AdminRoute` (RBAC super_admin check). Catch-all `*` redirects to `/` (no 404 page). Notable routes: `/prufa` → `SandboxPage` (demo mode), `/admin/migrate` → `MigrationPage`.

**Provider order in App.tsx (outermost first):** `ErrorBoundary` → `ImpersonationProvider` → `HelmetProvider` → `Router` → `ImpersonationBanner` → `Suspense` → `Routes`. `FeedbackWidget` is mounted outside `<Routes>` and is visible on every page.

`AuthHandler` is a renderless component (returns `null`) placed outside `<Router>`. It handles the Firebase `onAuthStateChanged` subscription, populates the Zustand store, and auto-repairs "orphan" users (Firebase Auth account exists but no Firestore profile). It waits 15 seconds post-signup before self-repairing to avoid racing with `SignupPage`.

### Authentication & RBAC

Firebase Auth (email/password, Google OAuth, Facebook OAuth). Auth listener in renderless `AuthHandler` component. System roles: `super_admin | support_admin | regular_user`. House roles: `owner | admin | member | viewer` (hierarchical). Roles stored in Firestore `user_roles/{userId}`.

**`useUserRole`** makes a one-shot `getDoc` (not `onSnapshot`) — roles do not update live while the page is open. Resets to `'regular_user'` on any error.

**`usePermissions`** takes `(userId, houseId?, hideFinances?)`. `hideFinances` maps to `House.privacy_hide_finances` — members lose `canViewFinances` when set. Result is `useMemo`-cached.

### Impersonation (God Mode)

Super admin can impersonate users. State managed via `ImpersonationContext` (`src/contexts/ImpersonationContext.tsx`), persisted to `localStorage`. Always use `useEffectiveUser()` to get the current user — it transparently returns the impersonated user when active. `isAdmin` is always `false` while impersonating (by design).

### Sandbox / Demo Mode

`SandboxContext` (`src/contexts/SandboxContext.tsx`) provides a demo mode with mock data from `src/utils/sandboxMockData.ts` and `sandboxStorage.ts`. `SandboxProvider` is scoped to `SandboxPage` only — it is not in `App.tsx`.

### Organizations

B2B feature for companies/unions, with its own Firestore subcollection hierarchy under `organizations/{orgId}/` (members, access_requests, booking_requests, admin_actions). Dedicated service: `organizationService.ts`.

### External Integrations

- **Askell** — Icelandic subscription billing. Webhook at `/api/askell-webhook.ts` verifies HMAC signatures and updates house subscription status. Env: `ASKELL_WEBHOOK_SECRET`.
- **Payday.is** — Icelandic invoicing service. `/api/payday-create-invoice.ts` is admin-only and uses OAuth2 client credentials. Env: `VITE_PAYDAY_CLIENT_ID`, `PAYDAY_SECRET_KEY`, `PAYDAY_TOKEN_URL`.
- **FCM Push Notifications** — Firebase Cloud Messaging via `/api/push-notification.ts`. Client-side token registration in `src/utils/pushNotifications.ts`.
- **Open-Meteo** — Weather data, no auth required. Service: `src/services/weatherService.ts`.
- **Road conditions** — Via Vegagerðin API, no auth. Proxied through `/api/road-conditions.ts` (10-min cache).

### Error Tracking

Sentry is configured for error tracking and performance monitoring (`@sentry/react`). DSN via `VITE_SENTRY_DSN` env var. UTM parameters are captured once on app mount and sent to Sentry.

## API Routes

Routes are grouped by auth requirement:

- **No auth:** `contact.ts` (rate-limited 5/hr via Upstash), `road-conditions.ts`, `booking-notification.ts`, `askell-webhook.ts`
- **Any authenticated user:** `send-email.ts`, `invite-member.ts`, `join-house.ts`, `push-notification.ts`
- **Admin only:** `payday-create-invoice.ts`, `admin-audit-users.ts`, `admin-delete-user.ts`, `admin-repair-user.ts`, `analytics.ts` (GA4), `search-console.ts`
- **Cron (Bearer token):** `cron/trial-reminders.ts`, `cron/recover-orphans.ts`

### Two Admin Auth Middleware Systems

There are two auth helpers in `api/utils/` with **different contracts** — do not mix them:

1. **`apiAuth.ts`** — `requireAuth(req)` (any user) and `requireAdmin(req)` (RBAC super_admin check via Firestore). Throws on failure. **Use this for new routes.**

2. **`admin-auth.ts`** — `verifyAdminToken(req, res)`. Has hardcoded fallback admin emails/UID before doing an RBAC check. Returns `null` and writes the HTTP response itself on failure (different API contract). Only used by the older admin routes.

### Firebase Admin in API Routes

`api/utils/firebaseAdmin.ts` exports factory functions `getDb()` and `getAuth()` — **not** `db` or `admin` as named exports. Some older routes incorrectly `import { admin, db }` (these resolve to `undefined`). When writing or editing API routes, always use:

```ts
import { initializeFirebaseAdmin, getDb, getAuth } from '../utils/firebaseAdmin';
const db = getDb();
const auth = getAuth();
```

### Email System

Two parallel delivery paths exist:

1. **Template-based** (`api/send-email.ts`): Fetches HTML from `email_templates/{templateId}` Firestore collection. Falls back to 4 hardcoded system templates (`general_notification`, `welcome`, `onboarding_complete`, `finish_setup`) if not found. Variables use `{key}` syntax; values are HTML-stripped before insertion.

2. **Inline HTML** (`invite-member.ts`, `booking-notification.ts`, cron jobs): Generates email HTML directly in the function — bypasses the template system entirely. Cron jobs call Resend directly, not through `/api/send-email`.

From address is always `Bústaðurinn <hallo@bustadurinn.is>`. Run `npm run seed-email-templates` to populate Firestore with `welcome`, `invite`, and `trial_ending` templates from `scripts/email-templates/`.

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
- **`userService.ts` fan-outs**: Name updates sync across 7+ collections using `writeBatch`. `in` queries are chunked into groups of 10 (Firestore limit).

## Styling

Tailwind CSS 3.4 with a custom "Scandi-Minimalist" design system defined in `src/index.css`. Key design tokens:

- Colors: `bone` (#fdfcf8), `charcoal` (#1a1a1a), `amber` (#e8b058), warm greys
- Fonts: `font-serif` = Fraunces (headings), `font-sans` = Inter (body)
- Sharp corners (max 6px radius), high whitespace, 200ms transitions
- Pre-built classes: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.card`, `.input`, `.badge`, `.toast`

## Testing

Vitest + @testing-library/react with jsdom. Globals enabled (`describe`, `it`, `expect` don't need imports). Firebase is globally mocked in `src/test/setup.ts`. Test files are collocated next to source (e.g., `utils/rbac.test.ts`). Config is in `vite.config.ts` (no separate vitest config).

E2E tests use Playwright (Chromium only). Tests live in `tests/e2e/`. The dev server must be running on `http://127.0.0.1:5173` before running E2E tests.

## Deployment

Vercel Pro, auto-deploys from `main` branch. SPA fallback configured — all non-`/api` routes rewrite to `index.html`. Security headers (HSTS, CSP, X-Frame-Options) set in `vercel.json`.

Cron jobs (configured in `vercel.json`):
- `/api/cron/trial-reminders` — daily at 10:00
- `/api/cron/recover-orphans` — daily at 12:00 (repairs houses with missing owner records)

## Environment Variables

Client-side vars (prefixed `VITE_`) are documented in `.env.example`. Server-side vars used by API routes (set in Vercel dashboard):

| Var | Used by |
|-----|---------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK — full JSON string (preferred over the three vars below) |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK (alternative) |
| `RESEND_API_KEY` | All email routes |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting; if absent, rate-limited routes return 503 |
| `ASKELL_WEBHOOK_SECRET` | Subscription webhook HMAC verification |
| `PAYDAY_SECRET_KEY`, `PAYDAY_TOKEN_URL` | Payday.is invoicing OAuth2 |
| `CRON_SECRET` | Cron job Bearer token auth |
| `FACEBOOK_APP_SECRET` | Facebook OAuth data-deletion callback |

## Firestore Collections

**Core:** `users/{uid}`, `user_roles/{uid}`, `houses/{houseId}`, `houses/{houseId}/bookings`, `invitations` (pending member invites with `token` + `status: 'pending'`), `notifications`, `fcm_tokens`

**House features:** `tasks`, `shopping_list`, `finance_entries`, `budget_plans`, `guestbook_entries`

**B2B:** `organizations/{orgId}/` with subcollections: `members`, `access_requests`, `booking_requests`, `admin_actions`

**Platform:** `contact_submissions`, `email_templates`, `coupons`, `feedback`, `internal_logs`

Security rules in `firestore.rules`, storage rules in `storage.rules`. `admin_actions` is immutable — updates and deletes are blocked at the rules level. Composite indexes defined in `firestore.indexes.json`.

Firebase emulators available: Auth (:9099), Firestore (:8080), Storage (:9199), UI (:4000).
