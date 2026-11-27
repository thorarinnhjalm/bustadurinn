# Bústaðurinn.is

Free platform for managing shared Icelandic summer houses (sumarhús): booking calendar, tasks, shopping list, finances, guest access. All user-facing text is Icelandic. Private product of Neðri Hóll Hugmyndahús ehf. There are no subscriptions, trials or payments.

## Stack

- React 19, TypeScript 5.9, Vite 7 (SWC), Tailwind CSS, Zustand, React Router 7
- Firebase: Firestore, Auth, Storage (client SDK)
- Serverless API routes in `api/` (Vercel Functions, Firebase Admin SDK, Resend, Upstash Redis)
- Node.js 24.x

## Run locally

```bash
npm ci
cp .env.example .env     # fill in the VITE_* values
npm run dev              # http://localhost:5173
```

Note: the dev server proxies `/api` to production (`https://bustadurinn.is`) and the client talks to the production Firebase project from `.env`. There is no local API server; the Firebase emulators are optional and must be wired up by hand.

## Check your changes

```bash
npm run lint
npm run typecheck        # app, node and api tsconfigs
npm test                 # Vitest
npm run build            # also runs sitemap generation and prerendering
node scripts/verify-dist.js   # after a build
npm run verify           # lint + typecheck + test
```

CI (`.github/workflows/ci.yml`) runs the same checks on pull requests and pushes to `main`.

## Deploy

- Vercel deploys from `main` automatically (build: `npm run build`, output: `dist/`).
- `firestore.rules`, `firestore.indexes.json` and `storage.rules` are NOT deployed by Vercel. Publish them by hand with the Firebase CLI (`npx firebase deploy --only firestore:rules,storage`) after review.
- Server-side secrets (Firebase service account, Resend, Upstash, cron secret) live in the Vercel dashboard.

## More

- `CLAUDE.md`: architecture, conventions, API routes, Firestore collections.
- `docs/engineering/`: system model, engineering gates, risk register.
- `docs/archive/`: old working notes, unmaintained; many are outdated.
- `scripts/`: build helpers; past one-off maintenance scripts are in `scripts/one-off/` (read before running).
