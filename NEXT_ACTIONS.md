# 📋 BÚSTAÐURINN.IS - NEXT ACTIONS & IMPLEMENTATION ROADMAP

**Last Updated:** 2025-12-28  
**Current Progress:** ~65% Complete  
**Status:** Booking Calendar LIVE & Working ✅

---

## ✅ WHAT'S COMPLETE (VERIFIED WORKING)

### **1. Core Infrastructure**
- ✅ React 19 + Vite 7
- ✅ Tailwind CSS v3.4.1
- ✅ Firebase (Auth, Firestore)
- ✅ Zustand state management
- ✅ Google Maps Places API integration
- ✅ Firestore security rules (Manager/Member logic)

### **2. Authentication & Onboarding**
- ✅ Signup with email/password
- ✅ **Google Authentication (Login & Signup)** 🆕
- ✅ Login page
- ✅ **Onboarding wizard (4 steps):**
  - Welcome screen
  - House info with **Google Maps autocomplete** ✨
  - Email invites (placeholder)
  - Success screen
- ✅ **House creation in Firestore** with `manager_uid`

### **3. Dashboard**
- ✅ Feature grid navigation
- ✅ User info display
- ✅ Logout functionality
- ✅ Links to Calendar (working)
- ✅ Links to Settings (working)
- ✅ Links to Finance (working)

### **4. Booking Calendar** ⭐
- ✅ **Monthly/Weekly/Day views**
- ✅ **Color-coded bookings**
- ✅ **Conflict detection**
- ✅ **Firestore integration**
- ✅ **Multi-Language Support** (5 languages)
- ✅ **Icelandic Holidays** (Automatic calculation)
- ✅ **Holiday Fairness Logic:** Blocks booking if user had same holiday last year (if enabled)

### **5. Settings & Configuration** 🔧
- ✅ **Settings Page Created** (/settings)
- ✅ **House Details:** Edit name, address
- ✅ **Booking Mode Toggle:** Fairness vs First-Come
- ✅ **Language Preference:** User can save preferred language
- ✅ **Navigation:** Linked from Dashboard

### **6. SEO & Discovery**
- ✅ react-helmet-async
- ✅ JSON-LD schemas
- ✅ Sitemap generation

---

## 🚀 NEXT ACTIONS (Priority Order)

### **PHASE 1: Finance Module** (In Progress)

#### **A. Budget Playground** 💰 ✅
**Route:** `/finance` (Tab 1: "Rekstraráætlun")
- ✅ **BudgetForm:** Create new cost items
- ✅ **Firestore Integration:** Fetch/Save/Delete items
- ✅ **Totals Calculation:** Annual and monthly breakdown

#### **C. Simple Ledger** 🧾 ✅
**Route:** `/finance` (Tab 2: "Bókhald")
- ✅ LedgerForm (Income/Expense/Category)
- ✅ TransactionList
- [x] Variance Analysis (Budget vs Actual) ✅  
**Purpose:** Plan expected costs

**UI Components:**
1. **Budget Form:**
   ```tsx
   <BudgetItemForm>
     - Category input (text)
     - Amount input (number)
     - Frequency select: Monthly | Yearly | One-time
     - Add button
   </BudgetItemForm>
   ```

2. **Budget List:**
   - Display all budget items
   - Edit/Delete buttons
   - Show frequency badge

3. **Projection Calculator:**
   ```
   Annual Budget = Σ(items)
   Monthly Contribution = Annual Budget / 12
   Expected EOY Balance = (Contributions × 12) - Actual Expenses
   ```
   - Display in a card
   - Color code: Green (positive) / Red (negative)

**Data Flow:**
- Save to: `budget_plans/{planId}`
- Link to house via `house_id`
- Store `year: 2025`

**Files to Create:**
- `src/pages/FinancePage.tsx`
- `src/components/finance/BudgetForm.tsx`
- `src/components/finance/BudgetList.tsx`
- `src/components/finance/ProjectionCard.tsx`

---

#### **C. Simple Ledger** 📊
**Route:** `/finance` (Tab 2: "Bókhald")  
**Purpose:** Track actual income/expenses

**UI Components:**
1. **Entry Form:**
   ```tsx
   <FinanceEntryForm>
     - Amount (number)
     - Type: Expense | Income | Contribution
     - Category (dropdown from budget items)
     - Description (text)
     - Date (date picker)
     - Save button
   </FinanceEntryForm>
   ```

2. **Transaction List:**
   - Show all entries
   - Filter by date range
   - Filter by category
   - Show running balance

3. **Permissions:**
   - Only **Manager** can create/edit/delete entries
   - **Members** can VIEW only

**Data Flow:**
- Save to: `finance_entries/{entryId}`
- Include `user_uid` (who created it)
- Link to budget `category`

**Files to Create:**
- `src/components/finance/LedgerForm.tsx`
- `src/components/finance/TransactionList.tsx`

---

#### **D. Variance Analysis Widget** 📈
**Location:** Top of Finance page  
**Purpose:** Budget vs Actual comparison

**Display:**
```
┌─────────────────────────────────┐
│ 📊 Staða Hússjóðs              │
├─────────────────────────────────┤
│ Áætlun (Budget):    450.000 kr │
│ Raunkostnaður:      385.000 kr │
│ Munur:           +65.000 kr ✅ │
└─────────────────────────────────┘

Per Category:
- Rafmagn:     12k / 15k ✅ (80%)
- Viðhald:     25k / 20k ❌ (125%)
```

**Logic:**
```typescript
categories.forEach(cat => {
  budget = budgetItems.find(c => c.category === cat).amount;
  actual = entries.filter(e => e.category === cat).sum();
  variance = ((actual / budget) * 100);
  status = variance <= 100 ? 'green' : 'red';
});
```

**Files to Create:**
- `src/components/finance/VarianceWidget.tsx`

---

### **PHASE 3: Holiday Fairness Logic** (3-4 hours)

#### **E. Implement Booking Conflict Rules**
**Location:** `src/pages/CalendarPage.tsx`

**Current:** Basic overlap detection  
**Add:** Holiday fairness check

**Logic:**
```typescript
const checkConflicts = (start: Date, end: Date, userId: string) => {
  // Step 1: Check basic overlap (already done)
  if (hasOverlap(start, end)) {
    return { conflict: true, reason: 'overlap' };
  }

  // Step 2: Check holiday fairness (NEW)
  const houseSettings = await getHouseSettings(houseId);
  
  if (houseSettings.holiday_mode === 'fairness') {
    const isHoliday = checkIfHoliday(start, end);
    
    if (isHoliday) {
      const lastYearBooking = await getLastYearHolidayBooking(
        houseId,
        isHoliday, // e.g., 'christmas'
        userId
      );
      
      if (lastYearBooking) {
        return {
          conflict: true,
          reason: 'fairness',
          message: `Þú fékkst ${holidayName(isHoliday)} í fyrra. Aðrir eiga rétt á þessum tíma.`
        };
      }
    }
  }
  
  return { conflict: false };
};
```

**Holidays to Track:**
```typescript
const HOLIDAYS = {
  christmas: { start: '12-24', end: '12-26' },
  new_year: { start: '12-31', end: '01-01' },
  easter: 'dynamic', // Calculate based on year
  summer_solstice: { start: '06-20', end: '06-24' }
};
```

**Update Modal:**
- Show fairness error in red banner
- Display: "Sanngirnisregla: [reason]"
- Suggest alternative dates

**Files to Update:**
- `src/pages/CalendarPage.tsx`
- `src/utils/holidayChecker.ts` (NEW)
- `src/utils/fairnessLogic.ts` (NEW)

---

### **PHASE 4: Tasks Module** (2-3 hours)

#### **F. Task Management**
**Route:** `/tasks`  
**Purpose:** Maintenance & todo list

**UI Components:**
1. **Task List:**
   - Display all tasks
   - Filter: All | Pending | Complete
   - Sort by: Date | Priority

2. **Add Task Form:**
   ```tsx
   <TaskForm>
     - Title (text)
     - Description (textarea)
     - Assigned to (dropdown of members)
     - Due date (optional)
     - Priority: Low | Medium | High
     - Add button
   </TaskForm>
   ```

3. **Task Item:**
   - Checkbox to mark complete
   - Show assignee avatar
   - Edit/Delete buttons
   - Due date badge

**Permissions:**
- All members can create/update tasks
- Only Manager can delete tasks

**Data Flow:**
- Save to: `tasks/{taskId}`
- Include `house_id`, `assigned_to`, `created_by`

**Files to Create:**
- `src/pages/TasksPage.tsx`
- `src/components/tasks/TaskList.tsx`
- `src/components/tasks/TaskForm.tsx`
- `src/components/tasks/TaskItem.tsx`

---

### **PHASE 5: Guest Magic Links** (4-5 hours)

#### **G. Guest Access System**
**Route:** `/settings` (Tab: "Gestir")  
**Purpose:** Time-restricted access for renters

**Flow:**
1. **Manager creates guest access:**
   - Select booking (from bookings list)
   - Click "Búa til gestahlekk"
   - System generates:
     - Unique token
     - Valid from: `booking.start - 48h`
     - Valid until: `booking.end + 48h`
     - Link: `https://bustadurinn.is/guest/{token}`

2. **Guest clicks link:**
   - No login required
   - Token validated
   - If valid: Show Guest View
   - If expired: Show error

3. **Guest View:**
   - **CAN see:**
     - House manual (PDF/Text)
     - Wi-Fi password
     - House rules
     - Guestbook (read + write during stay)
   - **CANNOT see:**
     - Other bookings
     - Finance
     - Tasks
     - Member names

**Components:**
1. **Magic Link Generator:**
   ```tsx
   <MagicLinkGenerator>
     - Booking selector
     - Generate button
     - Display link with copy button
   </MagicLinkGenerator>
   ```

2. **Guest View Page:**
   ```tsx
   <GuestViewPage>
     - Welcome message
     - House info
     - Guestbook
     - Contact info (manager)
   </GuestViewPage>
   ```

**Data Flow:**
- Save to: `guest_access/{accessId}`
- Include: `token`, `booking_id`, `valid_from`, `valid_until`

**Security:**
- Validate token on every request
- Check expiry
- Firestore rule: `allow read: if guest_token_valid()`

**Files to Create:**
- `src/pages/GuestViewPage.tsx`
- `src/components/guest/MagicLinkGenerator.tsx`
- `src/utils/guestTokenValidator.ts`
- Cloud Function: `functions/src/generateGuestToken.ts`

---

## 📦 ADDITIONAL ENHANCEMENTS (Lower Priority)

### **H. Dashboard Statistics** (1-2 hours)
**Location:** Dashboard hero section

**Widgets to Add:**
1. **Upcoming Bookings:**
   - Query next 3 bookings
   - Display: User, Date range
   - Link to calendar

2. **Pending Tasks:**
   - Count `status: 'pending'`
   - Show number
   - Link to tasks page

3. **House Fund Balance:**
   - Fetch latest balance from finance
   - Show: Green/Red based on status
   - Link to finance page

**Files to Update:**
- `src/pages/DashboardPage.tsx`

---

### **I. Email Invitations** (2-3 hours)
**Location:** Onboarding Step 3

**Currently:** Placeholder  
**Upgrade:** Real email sending

**Flow:**
1. User enters emails (comma-separated)
2. Click "Senda boð"
3. **Cloud Function** sends emails:
   ```typescript
   // functions/src/sendInvites.ts
   export const sendInvites = functions.https.onCall(async (data) => {
     const { emails, houseId, inviterName } = data;
     
     for (const email of emails) {
       await sendEmail({
         to: email,
         subject: `${inviterName} bauð þér í Bústaðurinn.is`,
         html: inviteTemplate(houseId, inviterName)
       });
       
       // Create pending invite record
       await db.collection('invites').add({
         email,
         house_id: houseId,
         invited_by: inviterUid,
         status: 'pending',
         created_at: serverTimestamp()
       });
     }
   });
   ```

4. **Accept Flow:**
   - User clicks email link → `/accept-invite?token=xxx`
   - If no account: Redirect to signup with pre-filled info
   - If has account: Add to `houses.owner_ids`

**Required:**
- Resend API key (or SendGrid)
- Email templates
- Cloud Function deployment

**Files to Create:**
- `functions/src/sendInvites.ts`
- `functions/src/acceptInvite.ts`
- `src/pages/AcceptInvitePage.tsx`

---

### **J. House Image Upload** (1-2 hours)
**Location:** Settings page

**Currently:** No image support  
**Add:** Firebase Storage upload

**UI:**
```tsx
<ImageUploadWidget>
  - Current image preview
  - Upload button
  - Delete button
  - Crop tool (optional)
</ImageUploadWidget>
```

**Flow:**
1. User selects image
2. Upload to Firebase Storage: `houses/{houseId}/hero.jpg`
3. Get download URL
4. Save to Firestore: `houses/{houseId}/image_url`
5. Display on Dashboard

**Files to Create:**
- `src/components/settings/ImageUpload.tsx`

---

### **K. Weather Widget** (1 hour)
**Location:** Dashboard

**Purpose:** Show current weather at house location

**API:** OpenWeatherMap (free tier)

**Data:**
- Use house's `location.lat`, `location.lng`
- Fetch current weather
- Display: Icon, Temp, Condition

**Files to Create:**
- `src/components/dashboard/WeatherWidget.tsx`

---

## 🧪 TESTING CHECKLIST

Before each deployment, test:

- [ ] Signup → Onboarding → Calendar flow
- [ ] Create booking (check Firestore)
- [ ] Conflict detection works
- [ ] Manager can edit settings
- [ ] Member cannot edit settings
- [ ] Budget calculations correct
- [ ] Fairness logic blocks correctly
- [ ] Guest link expires after 48h
- [ ] Mobile responsive
- [ ] SEO meta tags present

---

## 🚀 DEPLOYMENT STEPS

### **Vercel Deployment:**
1. Push to GitHub
2. Connect Vercel to repo
3. Add environment variables:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   VITE_GOOGLE_MAPS_API_KEY=...
   ```
4. Deploy

### **Firebase Functions:**
```bash
cd functions
npm install
firebase deploy --only functions
```

### **Firestore Rules:**
- Already deployed ✅

### **Custom Domain:**
- Add `bustadurinn.is` to Vercel
- Update DNS records
- Enable SSL

---

## 📊 PROGRESS TRACKING

**Completed:**
- Infrastructure: ████████████████████ 100%
- Auth & Onboarding: ████████████████████ 100%
- Dashboard: ████████████████████ 100%
- Booking Calendar: ████████████████████ 100%
- Settings & Fairness: ████████████████████ 100%
- SEO: ████████████████████ 100%
- Design: ████████████████████ 100%

**Pending:**
- Finance: ████████████████████ 100%
- Tasks: ██░░░░░░░░░░░░░░░░░░ 10%
- Guest Access: ░░░░░░░░░░░░░░░░░░░░ 0%

**Overall: ~75% Complete** 

---

## 🎯 RECOMMENDED SEQUENCE

1. **Settings Page** (2-3h) → Enable booking mode toggle
2. **Holiday Fairness Logic** (3-4h) → Implement in calendar
3. **Finance UI** (6-8h) → Budget + Ledger + Variance
4. **Tasks Module** (2-3h) → Basic todo list
5. **Guest Magic Links** (4-5h) → Time-restricted access
6. **Polish & Deploy** (2-3h) → Testing, fixes, launch

**Total Estimated Time:** ~20-25 additional hours

---

**Your app is already functional and impressive!** The core booking system works end-to-end. Continue with Settings → Finance → Tasks to reach MVP status. 🚀
