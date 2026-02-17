# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bústaðurinn.is is a SaaS platform for managing shared Icelandic summer houses (sumarhús). All user-facing text is in Icelandic. Private, proprietary product owned by Neðri Hóll Hugmyndahús ehf.

## Commands

```bash
npm run dev          # Vite dev server on port 5173
npm run build        # TypeScript check + Vite production build → dist/
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest in watch mode
npm run test:coverage # Vitest with V8 coverage
```

## Architecture

**React 19 SPA** with TypeScript 5.9, Vite 7, deployed on Vercel Pro. Backend is Firebase (Firestore, Auth, Storage). Serverless API routes live in `/api/` (Vercel Functions).

### Key Layers

- **Pages** (`src/pages/`): Route-level components. Critical pages eagerly loaded; others lazy-loaded via `React.lazy`.
- **Components** (`src/components/`): Reusable UI, organized by feature subdirectories (`finance/`, `tasks/`, `calendar/`, etc.).
- **Services** (`src/services/`): Thin async functions wrapping direct Firestore SDK calls. No classes, no ORM.
- **Store** (`src/store/appStore.ts`): Single Zustand store for global state (currentUser, currentHouse, auth state).
- **Hooks** (`src/hooks/`): `useEffectiveUser` is the canonical hook for current user (handles impersonation). `useUserRole` and `usePermissions` for RBAC.
- **API routes** (`api/`): Vercel serverless functions for operations requiring secrets (email via Resend, Firebase Admin SDK, rate limiting via Upstash Redis).
- **Types** (`src/types/models.ts`): All Firestore data model interfaces. RBAC types in `src/types/rbac.ts`.

### Routing

React Router DOM v7 with `BrowserRouter` in `src/App.tsx`. Public pages use Icelandic URL slugs (`/eiginleikar`, `/spurt-og-svarad`, `/torgid`). Route guards: `ProtectedRoute` (auth check) and `AdminRoute` (RBAC super_admin check).

### Authentication & RBAC

Firebase Auth (email/password, Google OAuth, Facebook OAuth). Auth listener in renderless `AuthHandler` component. System roles: `super_admin | support_admin | regular_user`. House roles: `owner | admin | member | viewer` (hierarchical). Roles stored in Firestore `user_roles/{userId}`.

### Impersonation (God Mode)

Super admin can impersonate users. State managed via `ImpersonationContext` (React Context), persisted to `localStorage`. Always use `useEffectiveUser()` to get current user — it transparently returns the impersonated user when active.

### Organizations

B2B feature for companies/unions, with its own Firestore subcollection hierarchy under `organizations/{orgId}/` (members, access_requests, booking_requests, admin_actions).

## Code Conventions

- **Import alias**: `@/*` maps to `src/*` — always use this, never relative `../../` paths
- **Type imports**: Must use `import type { ... }` syntax (`verbatimModuleSyntax: true`)
- **No enums/namespaces**: `erasableSyntaxOnly: true` — use union types instead
- **Strict TypeScript**: `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **File naming**: PascalCase for components/pages, camelCase for hooks/utils/services
- **Unused args**: Prefix with `_` to satisfy linter
- **Firestore timestamps**: Use `serverTimestamp()` for writes, convert Firestore Timestamps to JS `Date` on reads
- **Language**: All user-facing strings in Icelandic, Icelandic date locale (`is-IS`), ISK currency

## Styling

Tailwind CSS 3.4 with a custom "Scandi-Minimalist" design system defined in `src/index.css`. Key design tokens:

- Colors: `bone` (#fdfcf8), `charcoal` (#1a1a1a), `amber` (#e8b058), warm greys
- Fonts: `font-serif` = Fraunces (headings), `font-sans` = Inter (body)
- Sharp corners (max 6px radius), high whitespace, 200ms transitions
- Pre-built classes: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.card`, `.input`, `.badge`, `.toast`

## Testing

Vitest + @testing-library/react with jsdom. Firebase is globally mocked in `src/test/setup.ts`. Test files are collocated next to source (e.g., `utils/rbac.test.ts`).

## Deployment

Vercel Pro, auto-deploys from `main` branch. SPA fallback configured — all non-`/api` routes rewrite to `index.html`. Security headers (HSTS, CSP, X-Frame-Options) set in `vercel.json`. Production build drops `console` and `debugger` statements.

## Firestore Collections

Core: `users/{uid}`, `user_roles/{uid}`, `houses/{houseId}`, `houses/{houseId}/bookings`, `organizations/{orgId}` (with subcollections: members, access_requests, booking_requests, admin_actions). Also: `contact_submissions`, `email_templates`, `coupons`, `feedback`.

Security rules in `firestore.rules`. Admin audit log (`admin_actions`) is immutable — updates and deletes are blocked.
