# 🏗️ SUPER-ADMIN COMPLETE SPECIFICATION & ROADMAP

**Based on**: Vaktaplan.is Super Admin  
**Goal**: Full-featured Mission Control for Bústaðurinn.is  
**Complexity**: 40-60 hours of development  
**Priority**: Staged rollout over multiple sessions

---

## 📊 7-TAB ARCHITECTURE

### ✅ TAB 1: YFIRLIT (Overview) - **PRIORITY 1**
**Status**: Partially implemented  
**Estimated Time**: 4-6 hours

**Current State**:
- ✅ Basic metrics (houses, users, bookings, tasks)
- ✅ House data table
- ✅ User data table
- ❌ No MRR calculation
- ❌ No trial expiration logic
- ❌ No status pills
- ❌ No "Comped" flag
- ❌ No "Extend Trial" action
- ❌ Impersonation UI exists but not wired

**To Build**:
1. **KPI Cards** (Top Row)
   - Total Houses (Active vs Trial) - Exclude demo houses
   - Trial Expiring Soon (< 3 days warning)
   - MRR calculation (Exclude comped/demo)
   - System Health indicator

2. **House Registry Table**
   - Columns: Name, Manager, Created, Plan Type, Days Left, Status
   - Color coding: Yellow when trial < 3 days
   - Actions: Edit, Extend Trial, Impersonate, Set as Comped

3. **Quick Actions**
   - Manual Payday Sync
   - Export Data (JSON)

---

### 🔮 TAB 2: GREINING (Analytics) - **PRIORITY 2**
**Status**: Not started  
**Estimated Time**: 8-10 hours

**Integrations Needed**:
1. **Google Analytics 4**
   - Firebase Functions → GA4 Data API
   - Metrics: Live users, traffic sources, top pages
   
2. **Facebook Ads API**
   - Meta Business SDK
   - Metrics: Spend, impressions, clicks, CPR
   - Calculate CAC

**Components**:
- `GA4Widget.tsx`
- `FacebookAdsWidget.tsx`
- Backend: `functions/getAnalytics.ts`

---

### 📈 TAB 3: TREKT (Funnel) - **PRIORITY 3**
**Status**: Not started  
**Estimated Time**: 4-6 hours

**Requirements**:
- Track onboarding steps in Firestore
- Funnel visualization (Recharts)
- Step conversion percentages
- Identify drop-off points

**Data Collection**:
```typescript
// In onboarding flow
await logFunnelStep('welcome', userId);
await logFunnelStep('house_info', userId);
await logFunnelStep('invite', userId);
await logFunnelStep('complete', userId);
```

---

### 🎨 TAB 4: MARKAÐSEFNI (Brand Assets) - **PRIORITY 4**
**Status**: Partially implemented  
**Estimated Time**: 6-8 hours

**Current State**:
- ✅ Basic asset library exists
- ❌ No Magic Ad Studio

**Magic Ad Studio**:
- Platform selector (Meta/LinkedIn/Google)
- Aspect ratio picker (1:1, 9:16, 16:9)
- AI image generation with branding
- Download for ads

---

### 📧 TAB 5: TÖLVUPÓSTUR (Email) - **PRIORITY 5**
**Status**: Basic sending exists  
**Estimated Time**: 6-8 hours

**Current State**:
- ✅ Resend integration working
- ❌ No composer UI
- ❌ No segmentation
- ❌ No campaign history

**To Build**:
- Rich text editor (TipTap or Quill)
- Template variables: `{{manager_name}}`, `{{house_name}}`
- Audience segments:
  - All Users
  - Managers Only
  - Trial Users
  - Inactive Users (>30 days)
- Send history + open rates

---

### 💬 TAB 6: FEEDBACK - **PRIORITY 6**
**Status**: Not started  
**Estimated Time**: 3-4 hours

**Components**:
- Contact form submissions inbox
- In-app feedback stream
- Reply directly via Resend
- Status tracking (Open/Resolved)

**Collection**: `support_tickets`

---

### ⚙️ TAB 7: KERFISSTILLINGAR (System) - **PRIORITY 7**
**Status**: Not started  
**Estimated Time**: 4-5 hours

**Features**:
1. **Maintenance Mode** - Global app lock
2. **Sandbox Control** - Reset demo data
3. **Feature Flags** - Enable/disable modules
4. **Error Logs** - Last 50 Firebase errors
5. **Admin Whitelist** - Add/remove admins

---

## 🎭 IMPERSONATION (God Mode) - **CRITICAL**

**Current State**:
- ✅ ImpersonationContext created
- ✅ ImpersonationBanner created
- ✅ useEffectiveUser hook created
- ❌ NOT integrated into data fetching
- ❌ Red banner not showing

**To Fix** (2-3 hours):
1. Update all page components to use `useEffectiveUser()`
2. Ensure red banner renders when `isImpersonating = true`
3. Test full flow:
   - Click "Impersonate"
   - See red banner
   - Dashboard shows THEIR data
   - Calendar shows THEIR bookings
   - Exit God Mode → back to admin

---

## 🏖️ PUBLIC SANDBOX (/demo)

**Requirements**:
- Fixed house ID: `demo-house-001`
- Cloud Function: `seedSandbox()`
- Runs: Every 24 hours (Cron) + Manual trigger
- Data: Realistic Icelandic names/bookings
- Exclusions: Filter from all MRR/metrics

**Files to Create**:
- `functions/seedSandbox.ts`
- `functions/scheduledSandboxReset.ts` (Cron)
- Update metrics to exclude `demo-house-001`

---

## 📋 PHASED IMPLEMENTATION PLAN

### **PHASE 1: Make Current Admin Actually Work** (Tonight)
**Estimated: 3-4 hours**

1. Fix impersonation integration (HIGH PRIORITY)
   - Wire `useEffectiveUser` into DashboardPage
   - Wire into CalendarPage
   - Test red banner
   - Test God Mode flow

2. Improve Tab 1 (Overview)
   - Add loading states
   - Add empty states
   - Fix demo seeder for existing users
   - Add better error messages

3. Make sidebar tabs actually functional
   - ✅ DONE - Navigation works
   - Add Analytics tab (placeholder)
   - Add System tab (placeholder)

### **PHASE 2: Core Business Logic** (Next Session)
**Estimated: 6-8 hours**

1. MRR Calculation
2. Trial Expiration Logic
3. "Comped" Flag System
4. Extend Trial Action
5. Export Data Function

### **PHASE 3: Analytics Integration** (Future)
**Estimated: 8-10 hours**

1. GA4 API Integration
2. Facebook Ads API
3. Funnel Tracking
4. Visualization Components

### **PHASE 4: Marketing & CRM** (Future)
**Estimated: 10-12 hours**

1. Magic Ad Studio
2. Email Composer
3. Campaign Segmentation
4. Support Inbox

### **PHASE 5: System Management** (Future)
**Estimated: 4-6 hours**

1. Maintenance Mode
2. Feature Flags
3. Sandbox Control
4. Error Logging
5. Admin Management

---

## 🎯 TONIGHT'S PRIORITIES (REALISTIC)

Given the time (00:27 AM Iceland time), here's what we can accomplish:

### **Option A: Fix What Exists (2-3 hours)**
1. ✅ Fix sidebar navigation (DONE)
2. ⏳ Wire up impersonation properly (1 hour)
3. ⏳ Fix demo seeder for re-runs (30 min)
4. ⏳ Add loading/empty states (30 min)
5. ⏳ Test full God Mode flow (30 min)

### **Option B: Build Tab 1 Properly (3-4 hours)**
1. ✅ Sidebar navigation (DONE)
2. ⏳ KPI cards with real metrics
3. ⏳ House registry with actions
4. ⏳ Trial expiration warnings
5. ⏳ Status pills
6. ⏳ Basic impersonation working

### **Option C: Document & Plan (30 min)**
- ✅ This roadmap (DONE)
- Create ticket system for tracking
- Prioritize features for next sessions

---

## 🔧 TECHNICAL STACK ADDITIONS NEEDED

### Backend (Firebase Functions)
- `getGoogleAnalytics.ts` - GA4 integration
- `getFacebookAds.ts` - Meta Ads API
- `sendEmailCampaign.ts` - Bulk email via Resend
- `seedSandbox.ts` - Demo data reset
- `scheduledSandboxReset.ts` - Cron job
- `logAuditAction.ts` - Admin activity log

### Frontend Components
- `KPICard.tsx` - Metric display
- `SparklineChart.tsx` - Mini graphs
- `GA4Widget.tsx` - Analytics display
- `FacebookAdsWidget.tsx` - Ad metrics
- `FunnelChart.tsx` - Conversion visualization
- `EmailComposer.tsx` - Rich text editor
- `SupportInbox.tsx` - Ticket list
- `FeatureFlagToggle.tsx` - System switches

### New Collections
- `house_subscriptions` - Payday sync data
- `admin_audit_logs` - All admin actions
- `email_campaigns` - Campaign history
- `support_tickets` - Feedback messages
- `funnel_events` - Onboarding tracking
- `feature_flags` - Global switches

---

## 💰 BUSINESS LOGIC REQUIREMENTS

### MRR Calculation
```typescript
// Exclude from MRR:
// 1. Houses with is_comped = true
// 2. Houses with id = 'demo-house-001'
// 3. Houses in trial period (no active subscription)

const getMRR = () => {
  const paidHouses = houses.filter(h => 
    !h.is_comped && 
    h.id !== 'demo-house-001' && 
    h.subscription_status === 'active'
  );
  return paidHouses.length * 2490; // Monthly price
};
```

### Trial Expiration
```typescript
const getTrialDaysLeft = (createdAt: Date) => {
  const trialPeriod = 14; // days
  const elapsed = daysBetween(createdAt, now);
  return Math.max(0, trialPeriod - elapsed);
};

const isTrialExpiringSoon = (daysLeft: number) => daysLeft <= 3;
```

---

## 🚨 CRITICAL DECISIONS NEEDED

1. **Payday Integration**: Do we build Payday sync tonight, or focus on making existing admin work?
2. **Scope**: Full rebuild (40+ hours) or quick fixes tonight (3-4 hours)?
3. **Analytics**: GA4/Facebook integration now, or placeholder "Coming soon"?

---

## 📝 RECOMMENDATION

**For tonight (remaining ~2-3 hours):**

1. **Fix Impersonation** (Highest Value)
   - Wire useEffectiveUser into pages
   - Test God Mode flow
   - Make red banner work

2. **Polish Tab 1**
   - Add KPI cards with current data
   - Add loading states
   - Fix demo seeder

3. **Create Tickets**
   - Document remaining work
   - Create GitHub issues for Phase 2+

**For next sessions:**
- Phase 2: Business logic (MRR, trials, etc.)
- Phase 3: Analytics integrations
- Phase 4: Marketing tools

---

**What would you like to prioritize tonight?**
