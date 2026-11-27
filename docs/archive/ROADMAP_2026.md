# Bústaðurinn.is — Feature Roadmap (July 2026)

**STATUS: All phases (0–6) shipped 2026-07-20.** Kept for reference — the
audit corrections below remain useful context, and "Known gaps / future
work" at the bottom lists what was deliberately deferred.

Grounded in a code audit of the current main branch. Ordered by phase; each
phase is independently shippable. File references point at the code as of
commit `609f771`.

**Corrections to earlier assumptions, found during the audit:**

- Booking overlap checking ALREADY EXISTS (`CalendarPage.tsx` `checkConflicts`,
  ~line 396) — it hard-blocks conflicting bookings client-side. The roadmap
  item is now about *hardening* it, not building it.
- A basic holiday fairness rule ALREADY EXISTS (`checkFairness`,
  `CalendarPage.tsx` ~line 404): if `holiday_mode === 'fairness'` and the
  booking covers a major holiday the user also had *last year*, it blocks.
  Full Icelandic holiday computation exists in `src/utils/icelandicHolidays.ts`
  (Easter computus, Verslunarmannahelgi, importance tiers).
- The entire weather feature is built but DEAD: `BookingWeatherCard` is never
  rendered, `weatherNotifications.ts` and `weatherWarnings.ts` are never
  called. `weatherService.ts` (met.no, 5-day forecast) works and is only
  consumed by the unrendered card.
- Check-in/checkout has a REAL BUG: the dashboard writes logs to top-level
  `internal_logs` but derives check-in state from the `houses/{id}/internal_logs`
  subcollection — so the "checked in" state is lost on reload.

---

## Phase 0 — Bug fixes & free wins (small)

### 0.1 Fix check-in/checkout collection mismatch
`DashboardPage.tsx` writes check-in/out logs to `collection(db, 'internal_logs')`
(lines ~342, ~538) but reads state from `houses/{id}/internal_logs` (line ~165).
Standardize on the **subcollection** (matches OnboardingPage and firestore.rules).
Replace the fragile string-match state derivation (`.includes('skráði komu')`)
with a structured log field: `{ kind: 'check_in' | 'check_out', ... }`.
This must land before Phase 3 builds on check-in state.

### 0.2 Wire the weather card
Render `BookingWeatherCard` on the dashboard next to the next booking when it
starts within 7 days (`shouldShowWeather` already gates this). Zero new
backend. Instant user-visible feature from existing dead code.

### 0.3 Push notification hygiene
- Add the missing `public/icon-192x192.png` (the FCM service worker references
  it as badge; file doesn't exist).
- Call `onForegroundMessage()` from app startup (defined in
  `src/utils/pushNotifications.ts`, never invoked) so foreground pushes
  surface as toasts instead of being dropped.

### 0.4 Type honesty for notifications
`OnboardingPage.tsx` (~line 244) writes a `type: 'join_request'` notification
that is outside the `AppNotification` union. Add `'join_request'` to the union
and render it properly in the bell dropdown (`DashboardLayout.tsx`).

## Phase 1 — Booking robustness (small/medium)

### 1.1 Harden overlap checking
Current `checkConflicts` only checks the ≤500 bookings loaded in state, purely
client-side. Wrap booking creation in a Firestore transaction that re-queries
overlapping bookings by date range before writing. Keep the client check for
fast UX; the transaction is the guarantee.

### 1.2 Overlap UX: block → warn with override
Shared family houses sometimes *want* joint stays. Change hard block to a
warning dialog naming the conflicting booking's owner ("Anna's family is booked
Fri–Sun") with an explicit "Bóka samt" (book anyway) option. Same-day
checkout/check-in (end == start) must not count as overlap.

### 1.3 Extract `bookingService.ts`
Booking creation + its triple notification fan-out (in-app, FCM, email) is
~130 lines inline in `CalendarPage.handleCreateBooking`. Extract to
`src/services/bookingService.ts` so Phase 2 (fairness) and any future flows
(e.g. dashboard quick-book) share one path. Follow existing service
conventions (thin async functions, Timestamp→Date conversion).

## Phase 2 — Holiday fairness rotation (flagship, medium/large)

The current rule is a 1-year lookback that only covers Christmas Day, Boxing
Day, Easter Sunday, and New Year's Day — `includesMajorHoliday` in
`icelandicHolidays.ts` (~line 215) excludes Verslunarmannahelgi entirely,
which is *the* contested weekend in Iceland.

### 2.1 Expand the contested-holiday set
Make the fairness-relevant set: Easter week (Skírdagur–Annar í páskum),
Verslunarmannahelgi (Fri–Mon around first Monday of August), Christmas
(Þorláksmessa–Annar í jólum), New Year (Gamlársdagur–Nýársdagur), Jónsmessa
optional per house. Store per-house overrides:
`House.contested_holidays?: string[]` (defaults to the above).

### 2.2 Rotation ledger computed from bookings
No new writes needed for history — derive it: for each contested holiday and
each of the past N years, query the bookings subcollection for that date
window and record which member family held it. Cache the computed rotation in
`houses/{id}/fairness/{holidayKey}` on first computation (bookings are never
edited retroactively today, so cache invalidation is simple).

### 2.3 Priority instead of blanket blocking
Replace "you had it last year → blocked" with rotation priority:
- Members ranked by how long since they last held that holiday (never-held
  ranks first).
- Until a configurable cutoff (e.g. 3 months before the holiday), only the
  top-priority family can book it; after the cutoff it opens to everyone.
- `checkFairness` becomes `getHolidayPriority(houseId, holiday, year)` in the
  new `bookingService`/`fairnessService`.

### 2.4 Fairness UI
A "Stórhelgar" panel on the calendar page listing the next 12 months of
contested holidays: who has priority, who held it the past 3 years, and a
one-tap claim button. This panel is the marketing feature — the landing page
already advertises a `HolidayPriorityVisualizer` that has no backing logic.

## Phase 3 — Checkout checklist (small/medium)

Requires 0.1. `CheckoutModal` currently shows one hardcoded reminder line.

- `House.checkout_checklist?: string[]` — editable list in HouseSettings
  (default Icelandic starter list: læsa hurðum, loka gluggum, taka ruslið,
  slökkva á rafmagni, skrúfa fyrir vatn...).
- CheckoutModal renders them as required checkboxes; the structured checkout
  log stores `checklist: { [item]: boolean }`.
- Dashboard shows the last checkout's checklist state to the next arriver
  ("Síðasta brottför: allt staðfest ✓" / flag unchecked items).

## Phase 4 — Finance polish (medium)

Owner decision (July 2026): all shared costs — including electricity — split
by ownership share, NOT by usage/nights. The existing ledger + `split_between`
handling is considered fairly good already, so this phase is polish, not a
rebuild. Nights-based splitting was considered and rejected.

### 4.1 Ownership shares
`House.finance_settings?: { member_shares?: { [uid]: number } }` — defaults to
equal shares when unset. Used wherever a cost is split; no per-category rules
needed.

### 4.2 Recurring cost reminders
`House.recurring_costs?: RecurringCost[]` — `{ name, category,
estimated_amount, due_month, frequency }`. Dashboard/finance page surfaces
"Rafmagnsreikningur væntanlegur í janúar — skrá upphæð" when due and unlogged;
one tap pre-fills the ledger form. (Client-side nudge first; a cron
notification can come later.) Wire these to budget_plans so a template
auto-creates the corresponding BudgetItem.

### 4.3 Year-end summary
Per-family annual statement: total house cost, family share by ownership,
contribution history. Printable/export view. (Optional add-on: a simple
per-member paid-vs-share balance view, derived from entries — only if wanted.)

## Phase 5 — Notifications that reach people (medium)

### 5.1 Push opt-in prompt
`requestPushPermission` is currently only reachable via Settings. Add a
dismissible dashboard prompt after the user's 2nd session (dismissal stored on
the user doc, not localStorage, so it doesn't reappear per device).

### 5.2 Weather alerts for upcoming bookings
New cron `api/cron/weather-alerts.ts` (daily, reuse `CRON_SECRET` pattern):
for each booking starting within 3 days, fetch forecast (met.no server-side),
run the existing `generateWeatherNotification` thresholds (storm/snow/frost),
send FCM + in-app notification. `getNotificationSchedule` in
`weatherNotifications.ts` already defines the 3d/1d/morning-of cadence —
it was built for exactly this and never wired.

### 5.3 Close the in-app notification gaps
`NotificationSettings.in_app` already has `task_assignments` and
`shopping_list_updates` toggles that nothing reads. Emit notifications on task
assignment and shopping additions, respecting the toggles.

## Phase 6 — Offline / PWA (medium)

Cabins have bad internet; the app is currently online-only (manifest exists,
but the only SW is the FCM one — no caching).

1. Enable Firestore offline persistence (`persistentLocalCache` in
   `src/lib/firebase.ts`) — calendar/tasks/shopping readable offline with
   queued writes, nearly free.
2. `vite-plugin-pwa` in `injectManifest` mode, merging the FCM handlers into
   the generated SW (two SWs on one scope won't work) — precache the app
   shell.
3. Verify manifest icons: currently SVG-only; add PNG sizes (shares the 0.3
   icon work).

## Deliberately out of scope

- Donation banner timing changes (owner decision: keep as-is).
- Organization (B2B) subscription model — separate concern, untouched.
- The ~100 stale status/summary `.md` files in the repo root — worth a
  cleanup sweep some day, but no user impact.

## Suggested order

Phase 0 now (hours, mostly deletion-of-doubt), then 1 → 2 (2 depends on 1.3).
Phase 3 after 0.1. Phases 4–6 are independent of each other and can be
scheduled by appetite; 4 is the biggest single feature, 2 is the most
differentiating.

## Known gaps / future work (post-ship notes, 2026-07-20)

- **api/ is not type-checked**: neither tsconfig project includes `api/**`,
  and several pre-existing api files have type errors. Worth adding a
  tsconfig.api.json and fixing the fallout.
- **Booking conflict check is race-window-narrowing, not atomic** (documented
  in bookingService.ts) — true atomicity needs an Admin SDK route or a
  bookings-index doc.
- **Fairness rotation computes live from bookings** — the caching subcollection
  from the original 2.2 design was descoped; add if the Stórhelgar panel
  ever feels slow on booking-heavy houses.
- **Old bookings' fairness history starts from existing data** — history
  before the app was adopted is invisible; houses may want a way to seed
  who-had-which-holiday manually.
- **Weather cron re-fetches forecasts daily for opted-out users' bookings**
  (correct but slightly wasteful); fine at current scale.
- ~100 stale status/summary .md files in the repo root still awaiting a
  cleanup sweep.
