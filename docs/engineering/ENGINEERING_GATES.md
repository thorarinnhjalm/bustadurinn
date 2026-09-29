# Engineering Gates

**Evidence commit:** `6a5fe4d`
**Last verified:** 2026-09-29

## Development commands

| Purpose | Focused | Full local gate |
|---|---|---|
| Unit tests | `npx vitest run <file>` | `npx vitest run` |
| Types | — | `npx tsc -p tsconfig.app.json --noEmit` (plain `npx tsc --noEmit` is a no-op) |
| Lint | `npx eslint <files>` | `npm run lint` |

## Test environment and external-effect guards

- `npm run dev` talks to **production** Firebase, and `/api` is proxied to production. For flows that write data, use the emulators: `firebase emulators:start --only auth,firestore --project bustadurinn-599f2`, together with a throwaway local patch of `src/lib/firebase.ts` that calls `connectAuthEmulator`/`connectFirestoreEmulator`. Never commit that patch. `/api` calls from an emulator session reach production with an emulator token and get a 403, so no email is sent.
- Reading production data (users, `funnel_events`) needs explicit owner approval. Use gcloud ADC (`admin.credential.applicationDefault()`, `GOOGLE_CLOUD_QUOTA_PROJECT=bustadurinn-599f2`). The service-account key in `.env.local` is currently invalid.
- `firestore.rules` changes deploy separately (`firebase deploy --only firestore:rules`) and need owner approval.
