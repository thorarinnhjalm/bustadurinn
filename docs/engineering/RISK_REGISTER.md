# Risk Register

**Evidence commit:** `6a5fe4d`
**Last verified:** 2026-09-29

| Risk | Trigger/path | Impact | Existing controls | Evidence | Status |
|---|---|---|---|---|---|
| Tracking breaks signup/onboarding | Exception inside `trackFunnel` | New users blocked | All paths try/catch; callsites are fire-and-forget | `funnel.test.ts` (write failure, storage failure) | Verified |
| PII in `funnel_events` | Error messages, user agent | Privacy | No emails or names written by design; strings capped at 500 chars; super-admin read only | Code review of callsites | Inferred |
| Write volume/cost | Every login and funnel step writes one doc | Firestore cost | Few hundred users; buffer capped at 30 | — | Inferred |
| Email/push | Onboarding sends welcome emails via `/api/send-email` | Unchanged by instrumentation | — | Diff adds no send callsites | Verified |
