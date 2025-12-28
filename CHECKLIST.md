# ✅ QUICK CHECKLIST - Continue Building

## 🚀 START HERE NEXT TIME

### Prerequisites
- [ ] Run `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Have Firebase Console open
- [ ] Have `NEXT_ACTIONS.md` open

---

## 📋 BUILD SEQUENCE (Recommended Order)

### **PHASE 1: Settings Page** (~2-3 hours)
- [ ] Create `src/pages/SettingsPage.tsx`
- [ ] Add route `/settings` to `App.tsx`
- [ ] Build House Details section
- [ ] **Add Booking Mode Toggle** (Fairness vs First-Come)
  - [ ] Radio buttons UI
  - [ ] Save `holiday_mode` to Firestore
- [ ] Add Member Management section
  - [ ] List members with badges
  - [ ] Build "Transfer Manager" feature
- [ ] Add Delete House button (danger zone)
- [ ] Update Dashboard "Stillingar" card link
- [ ] Test: Manager can access, Member cannot delete house

### **PHASE 2: Implement Holiday Fairness** (~3-4 hours)
- [ ] Create `src/utils/holidayChecker.ts`
  - [ ] Define Icelandic holidays (Jól, Páskir, Nýár, etc.)
  - [ ] Function to detect if date range is a holiday
- [ ] Create `src/utils/fairnessLogic.ts`
  - [ ] Query last year's bookings
  - [ ] Check if user had same holiday
  - [ ] Return conflict with reason
- [ ] Update `CalendarPage.tsx`
  - [ ] Add `checkHolidayFairness()` to `handleCreateBooking()`
  - [ ] Show fairness error in modal
  - [ ] Only apply if `holiday_mode === 'fairness'`
- [ ] Test: Block user who had Jól last year

### **PHASE 3: Finance Module** (~6-8 hours)
- [ ] Create `src/pages/FinancePage.tsx` with tabs
- [ ] **Tab 1: Budget (Rekstraráætlun)**
  - [ ] Create `src/components/finance/BudgetForm.tsx`
  - [ ] Add Category, Amount, Frequency inputs
  - [ ] Save to `budget_plans` collection
  - [ ] Create `src/components/finance/BudgetList.tsx`
  - [ ] Display budget items with edit/delete
  - [ ] Create `src/components/finance/ProjectionCard.tsx`
  - [ ] Calculate annual budget, monthly contribution
- [ ] **Tab 2: Ledger (Bókhald)**
  - [ ] Create `src/components/finance/LedgerForm.tsx`
  - [ ] Add Amount, Type, Category, Date inputs
  - [ ] Save to `finance_entries` collection
  - [ ] Create `src/components/finance/TransactionList.tsx`
  - [ ] Display entries with filters
  - [ ] Show running balance
- [ ] **Top Widget: Variance**
  - [ ] Create `src/components/finance/VarianceWidget.tsx`
  - [ ] Calculate Budget vs Actual per category
  - [ ] Show Green (on track) or Red (over budget)
- [ ] Update Dashboard "Hússjóður" card link
- [ ] Test: Manager can edit, Member can only view

### **PHASE 4: Tasks Module** (~2-3 hours)
- [ ] Create `src/pages/TasksPage.tsx`
- [ ] Create `src/components/tasks/TaskForm.tsx`
  - [ ] Title, Description, Assignee, Due Date
- [ ] Create `src/components/tasks/TaskList.tsx`
  - [ ] Filter: All | Pending | Complete
  - [ ] Checkbox to mark complete
- [ ] Create `src/components/tasks/TaskItem.tsx`
  - [ ] Display task with edit/delete
  - [ ] Show assignee avatar
- [ ] Save to `tasks` collection
- [ ] Update Dashboard "Verkefni" card link
- [ ] Test: All members can create/update, only Manager deletes

### **PHASE 5: Guest Magic Links** (~4-5 hours)
- [ ] Create Settings tab "Gestir"
- [ ] Create `src/components/guest/MagicLinkGenerator.tsx`
  - [ ] Select booking from list
  - [ ] Generate token (UUID)
  - [ ] Save to `guest_access` with expiry
  - [ ] Display copyable link
- [ ] Create `src/pages/GuestViewPage.tsx`
  - [ ] Route: `/guest/:token`
  - [ ] Validate token & expiry
  - [ ] Show: Manual, Wi-Fi, Rules
  - [ ] Guestbook (read + write only during stay)
- [ ] Update Firestore rules for guest read access
- [ ] Test: Link works before/during/after booking dates

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
