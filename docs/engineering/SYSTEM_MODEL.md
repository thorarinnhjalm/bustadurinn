# System Model

**Evidence commit:** `6a5fe4d` (branch `feat/funnel-instrumentation`, base `03a9f07`)
**Last verified:** 2026-09-29
**Status:** Draft — covers only the new-user funnel slice so far. Other slices are not modelled yet.

## New-user funnel (signup → onboarding → first dashboard)

### Flow matrix

| Flow | Identity source | Write path | Funnel events | Evidence | Status |
|---|---|---|---|---|---|
| Email signup | `createUserWithEmailAndPassword` | `SignupPage` → `users/{uid}` setDoc (3 retries) → `/onboarding` | `signup_viewed/submitted/auth_created/completed/error` (with `stage`) | `src/pages/SignupPage.tsx` | Verified |
| Email signup, existing email | `signInWithEmailAndPassword` ("ghost recovery") | Profile created if missing, else → `/dashboard` | `signup_error` (email-in-use), then `signup_completed{recovered_ghost}` or `signup_existing_user` | same | Verified |
| Google/Facebook signup | `signInWithPopup` | `SignupPage` or `LoginPage` create a profile if missing | `signup_*` (`via: 'login'` when from LoginPage), `login_*` | `SignupPage.tsx`, `LoginPage.tsx` | Verified |
| Profile missing after auth | `AuthHandler` `onSnapshot(users/{uid})` | Self-repair setDoc if the account is older than 15s | `profile_self_repair[_error]`, `profile_listen_error`, `houses_fetch_error` | `src/components/AuthHandler.tsx` | Verified |
| Onboarding | Zustand `currentUser` | `runTransaction`: create `houses/{id}` and add it to `users.house_ids`, then tasks/internal_logs, then emails through `/api/send-email` | `onboarding_mounted/unmounted/page_hidden`, `onboarding_started`, `step_*`, `onboarding_back`, `house_create_submitted/error`, `house_created`, `house_init_error`, `invites_*`, `onboarding_email_error`, `onboarding_completed`, `join_request_*`, `maps_*`, `address_*` | `src/pages/OnboardingPage.tsx` | Verified |
| Dashboard with no house | `useEffectiveUser` | `navigate('/onboarding')` | `dashboard_redirect_onboarding`, `dashboard_no_house_screen`, `dashboard_reached` (first view after onboarding in this tab) | `src/pages/DashboardPage.tsx` | Verified |
| App crash | `ErrorBoundary` | Fallback UI; "Reyna aftur" remounts the children | `app_error_boundary`, `app_error_retry` | `src/components/ErrorBoundary.tsx` | Verified |
| Uncaught JS errors on `/signup`, `/login`, `/onboarding`, `/join` | window `error` / `unhandledrejection` | — | `js_error`, `js_unhandled_rejection` | `src/utils/funnel.ts` | Verified |

### `funnel_events` document

`uid, event_name, timestamp (server), client_ts, session_id (per tab, sessionStorage), load_id (per JS page load), path, env (MODE), ua, buffered, house_id|null, data{}`.

Telling cases apart: a new `load_id` in the same `session_id` means the page was **reloaded**. A new `onboarding_mounted.mount_id` with the same `load_id` means React **remounted** the page, e.g. through the error boundary. `onboarding_back` means the user pressed **"Til baka"**.

### Invariants

- Tracking never throws and never blocks the flow. Callsites use `void trackFunnel(...)`. Verified by `src/utils/funnel.test.ts`.
- Rules allow only authenticated creates on `funnel_events` (`firestore.rules`, Verified). So events recorded before sign-in are buffered in sessionStorage (max 30) and flushed with the uid on sign-in. Failed signups that never reach sign-in are **not** recorded.
- Reads are super-admin only.
- `npm run dev` uses the production Firebase project, so dev sessions write real `funnel_events`. They are tagged `env: 'development'`, and React StrictMode doubles mount events there.

### Open uncertainties

| Unknown | Why it matters | Next evidence step |
|---|---|---|
| Why 6/11 recent signups returned from the house step to "Velkomin" and stopped (2026-06 → 2026-09) | This is the problem the instrumentation is for | Read `funnel_events` for the next stuck signup after deploy |
| Anonymous signup failures | Not recorded (rules) | Owner decision: allow schema-validated anonymous creates? |
