# ✅ QUICK CHECKLIST - Continue Building

## 🚀 START HERE NEXT TIME

### Prerequisites
- [ ] Run `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Have Firebase Console open
- [ ] Have `NEXT_ACTIONS.md` open

---

## 📋 BUILD SEQUENCE (Recommended Order)

### **PHASE 1: Settings Page** (~2-3 hours) ✅ COMPLETE
- [x] Create `src/pages/SettingsPage.tsx`
- [x] Add route `/settings` to `App.tsx`
- [x] Build House Details section
- [x] **Add Booking Mode Toggle** (Fairness vs First-Come)
  - [x] Radio buttons UI
  - [x] Save `holiday_mode` to Firestore
- [x] Add Member Management section
  - [x] List members with badges
  - [x] Build "Transfer Manager" feature
- [x] Add Delete House button (danger zone)
- [x] Update Dashboard "Stillingar" card link
- [x] Test: Manager can access, Member cannot delete house

### **PHASE 2: Implement Holiday Fairness** (~3-4 hours) ✅ COMPLETE
- [x] Create `src/utils/holidayChecker.ts`
  - [x] Define Icelandic holidays (Jól, Páskir, Nýár, etc.)
  - [x] Function to detect if date range is a holiday
- [x] Create `src/utils/fairnessLogic.ts`
  - [x] Query last year's bookings
  - [x] Check if user had same holiday
  - [x] Return conflict with reason
- [x] Update `CalendarPage.tsx`
  - [x] Add `checkHolidayFairness()` to `handleCreateBooking()`
  - [x] Show fairness error in modal
  - [x] Only apply if `holiday_mode === 'fairness'`
- [x] Test: Block user who had Jól last year

### **PHASE 3: Finance Module** (~6-8 hours) ✅ COMPLETE
- [x] Create `src/pages/FinancePage.tsx` with tabs
- [x] **Tab 1: Budget (Rekstraráætlun)**
  - [x] Create `src/components/finance/BudgetForm.tsx`
  - [x] Add Category, Amount, Frequency inputs
  - [x] Save to `budget_plans` collection
  - [x] Create `src/components/finance/BudgetList.tsx`
  - [x] Display budget items with edit/delete
  - [x] Create `src/components/finance/ProjectionCard.tsx`
  - [x] Calculate annual budget, monthly contribution
- [x] **Tab 2: Ledger (Bókhald)**
  - [x] Create `src/components/finance/LedgerForm.tsx`
  - [x] Add Amount, Type, Category, Date inputs
  - [x] Save to `finance_entries` collection
  - [x] Create `src/components/finance/TransactionList.tsx`
  - [x] Display entries with filters
  - [x] Show running balance
- [x] **Top Widget: Variance**
  - [x] Create `src/components/finance/VarianceWidget.tsx`
  - [x] Calculate Budget vs Actual per category
  - [x] Show Green (on track) or Red (over budget)
- [x] Update Dashboard "Hússjóður" card link
- [x] Test: Manager can edit, Member can only view

### **PHASE 4: Tasks Module** (~2-3 hours) ✅ COMPLETE
- [x] Create `src/pages/TasksPage.tsx`
- [x] Create `src/components/tasks/TaskForm.tsx`
  - [x] Title, Description, Assignee, Due Date
- [x] Create `src/components/tasks/TaskList.tsx`
  - [x] Filter: All | Pending | Complete
  - [x] Checkbox to mark complete
- [x] Create `src/components/tasks/TaskItem.tsx`
  - [x] Display task with edit/delete
  - [x] Show assignee avatar
- [x] Save to `tasks` collection
- [x] Update Dashboard "Verkefni" card link
- [x] Test: All members can create/update, only Manager deletes

### **PHASE 5: Guest Magic Links** (~4-5 hours) ✅ COMPLETE
- [x] Create Settings tab "Gestir"
- [x] Create `src/components/guest/MagicLinkGenerator.tsx`
  - [x] Select booking from list
  - [x] Generate token (UUID)
  - [x] Save to `guest_access` with expiry
  - [x] Display copyable link
- [x] Create `src/pages/GuestViewPage.tsx`
  - [x] Route: `/guest/:token`
  - [x] Validate token & expiry
  - [x] Show: Manual, Wi-Fi, Rules
  - [x] Guestbook (read + write only during stay)
- [x] Update Firestore rules for guest read access
- [x] Test: Link works before/during/after booking dates

---

## 🎯 QUICK WINS (Do These First!)

### **1. Dashboard Statistics** (~1 hour)
- [ ] Query next 3 bookings
- [ ] Display on Dashboard hero
- [ ] Count pending tasks
- [ ] Show house fund balance

### **2. House Image Upload** (~1 hour)
- [ ] Create `src/components/settings/ImageUpload.tsx`
- [ ] Upload to Firebase Storage
- [ ] Save URL to `houses/{id}/image_url`
- [ ] Display on Dashboard

### **3. Weather Widget** (~30 min)
- [ ] Sign up for OpenWeatherMap API (free)
- [ ] Create `src/components/dashboard/WeatherWidget.tsx`
- [ ] Fetch using `location.lat`, `location.lng`
- [ ] Display icon, temp, condition

---

## 🧪 TESTING CHECKLIST

Before each Git commit:
- [ ] Run dev server without errors
- [ ] Test signup → onboarding → calendar flow
- [ ] Create booking and verify in Firestore
- [ ] Check conflict detection works
- [ ] Verify permissions (Manager vs Member)
- [ ] Check mobile responsive (resize browser)
- [ ] Validate Icelandic text is correct

---

## 📦 DEPLOYMENT CHECKLIST

When ready to deploy:
- [ ] Run `npm run build` (no errors)
- [ ] Test production build locally: `npm run preview`
- [ ] Push to GitHub
- [ ] Connect Vercel to repo
- [ ] Add all env vars from `.env.local` to Vercel
- [ ] Deploy
- [ ] Test on live URL
- [ ] Check Firestore rules in production mode
- [ ] Update DNS for custom domain

---

## 🔧 TROUBLESHOOTING

**If bookings don't appear:**
- Check Firestore rules deployed
- Verify `house_id` matches
- Check browser console for errors

**If Google Maps doesn't work:**
- Verify API key in `.env.local`
- Check APIs enabled in Google Cloud Console
- Restart dev server

**If permissions fail:**
- Re-deploy Firestore rules
- Check user is authenticated
- Verify `manager_uid` set correctly

---

## 📚 KEY FILES REFERENCE

**Pages:**
- `src/pages/CalendarPage.tsx` - Booking calendar
- `src/pages/DashboardPage.tsx` - Main hub
- `src/pages/OnboardingPage.tsx` - House setup
- `src/pages/SettingsPage.tsx` - ⏳ To build
- `src/pages/FinancePage.tsx` - ⏳ To build
- `src/pages/TasksPage.tsx` - ⏳ To build

**Config:**
- `src/config/firebase.ts` - Firebase config
- `firestore.rules` - Security rules
- `.env.local` - API keys (gitignored)

**Data Models:**
- `src/types/models.ts` - All TypeScript interfaces

**Documentation:**
- `NEXT_ACTIONS.md` - Detailed roadmap (READ THIS!)
- `SESSION_SUMMARY.md` - What was accomplished today
- `IMPLEMENTATION_STATUS.md` - Current progress

---

## 🎯 TODAY'S GOAL OPTIONS

**Option A: Quick Progress (2-3 hours)**
- Build Settings page skeleton
- Add booking mode toggle
- Test Settings → Calendar integration

**Option B: Big Feature (6-8 hours)**
- Complete Finance Module
- Budget + Ledger + Variance
- Full CRUD operations

**Option C: Polish & Deploy (2-3 hours)**
- Add dashboard statistics
- Upload house images
- Deploy to Vercel

---

**Remember:** Read `NEXT_ACTIONS.md` for detailed implementation guides with code examples!

✅ **Booking Calendar is DONE** - Everything else is just UI building. You got this! 🚀
