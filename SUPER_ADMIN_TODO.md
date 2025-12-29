# 📋 SUPER-ADMIN TODO LIST

**Last Updated**: 2025-12-29  
**Status**: In Progress

---

## ✅ COMPLETED TONIGHT

- [x] Dark sidebar layout with working navigation
- [x] Tab switching (Overview, Houses, Users)
- [x] ImpersonationContext created
- [x] ImpersonationBanner created
- [x] useEffectiveUser hook created
- [x] AdminLayout with callbacks
- [x] Back to Dashboard button
- [x] Data tables (sortable, searchable)
- [x] Stunning hero section on homepage
- [x] Firestore rules with super-admin access
- [x] Demo data seeder (basic)
- [x] DashboardPage uses useEffectiveUser

---

## 🔥 TONIGHT'S REMAINING WORK (Option A)

### 1. Complete Impersonation Integration ⏳
- [ ] Update CalendarPage to use `useEffectiveUser`
- [ ] Update SettingsPage to use `useEffectiveUser`
- [ ] Update FinancePage to use `useEffectiveUser`
- [ ] Update TasksPage to use `useEffectiveUser`
- [ ] Test: Click impersonate → see red banner
- [ ] Test: Dashboard shows THEIR data
- [ ] Test: Calendar shows THEIR bookings
- [ ] Test: Exit God Mode → back to admin

### 2. Fix Demo Seeder ⏳
- [ ] Handle existing users (fetch by email if already exists)
- [ ] Don't crash on re-run
- [ ] Better success/error messages
- [ ] Test: Seed twice without errors

### 3. Add Loading & Empty States ⏳
- [ ] Loading spinner in super-admin while fetching
- [ ] Empty state: "No houses yet. Seed demo data?"
- [ ] Empty state: "No users yet"
- [ ] Error boundary for failed data fetch

### 4. Polish & Test ⏳
- [ ] Remove unused imports/variables
- [ ] Fix TypeScript warnings
- [ ] Test full impersonation flow end-to-end
- [ ] Verify sidebar navigation works
- [ ] Check mobile responsive (should redirect or warn)

---

## 📦 PHASE 2: Core Business Logic (Next Session)

### Tab 1 Enhancements
- [ ] KPI Cards (Top Row)
  - [ ] Total Houses (Active vs Trial)
  - [ ] Trial Expiring Soon (< 3 days)
  - [ ] MRR Calculation (exclude comped/demo)
  - [ ] System Health indicator

- [ ] House Registry Improvements
  - [ ] Add "Plan Type" column (Paid/Free)
  - [ ] Add "Days Left" column
  - [ ] Add "Status" column with pills
  - [ ] Yellow row when trial < 3 days
  - [ ] Add action: Extend Trial (+14 days)
  - [ ] Add action: Set as Comped (lifetime free)
  - [ ] Add action: Edit house details

- [ ] Quick Actions
  - [ ] Manual Payday Sync button
  - [ ] Export Data (JSON download)

### Database Changes
- [ ] Add `is_comped` field to houses collection
- [ ] Add `trial_expires_at` field to houses
- [ ] Add `subscription_status` field (trial/active/cancelled)
- [ ] Create `house_subscriptions` collection for Payday sync

---

## 📊 PHASE 3: Analytics (Tab 2)

### Google Analytics 4 Integration
- [ ] Create Firebase Function: `getGoogleAnalytics`
- [ ] Integrate GA4 Data API
- [ ] Widget: Live Users Pulse
- [ ] Widget: Traffic Sources (Facebook/Organic/Direct)
- [ ] Widget: Top Pages

### Facebook Ads Integration
- [ ] Create Firebase Function: `getFacebookAds`
- [ ] Integrate Meta Business SDK
- [ ] Widget: Ad Metrics (Spend, Impressions, Clicks)
- [ ] Calculate CPR (Cost Per Result)
- [ ] Calculate CAC (Customer Acquisition Cost)

### Components
- [ ] `GA4Widget.tsx`
- [ ] `FacebookAdsWidget.tsx`
- [ ] `SparklineChart.tsx`
- [ ] Real-time data refresh

---

## 📈 PHASE 4: Funnel Tracking (Tab 3)

### Onboarding Funnel
- [ ] Track: Step 1 - Welcome (visitor count)
- [ ] Track: Step 2 - House Info (completed address)
- [ ] Track: Step 3 - Invite (invited co-owners)
- [ ] Track: Step 4 - Finish (account created)
- [ ] Create collection: `funnel_events`
- [ ] Visualization: Funnel chart with percentages
- [ ] Identify drop-off points

---

## 🎨 PHASE 5: Marketing Tools (Tab 4)

### Magic Ad Studio
- [ ] Platform selector (Meta/LinkedIn/Google)
- [ ] Aspect ratio picker (1:1, 9:16, 16:9)
- [ ] AI image generation with branding
- [ ] Text overlay editor
- [ ] Download for ads (PNG/JPG)

### Asset Library
- [ ] Upload/manage logos
- [ ] Upload/manage hero images
- [ ] Version control for assets

---

## 📧 PHASE 6: Email Campaigns (Tab 5)

### Email Composer
- [ ] Rich text editor (TipTap or Quill)
- [ ] Template variables: `{{manager_name}}`, `{{house_name}}`
- [ ] Preview mode
- [ ] Test send

### Audience Segmentation
- [ ] Segment: All Users
- [ ] Segment: Managers Only
- [ ] Segment: Trial Users
- [ ] Segment: Inactive Users (>30 days)

### Campaign Management
- [ ] Send history table
- [ ] Open rates (if available via Resend)
- [ ] Click rates
- [ ] Schedule send

### Backend
- [ ] Firebase Function: `sendEmailCampaign`
- [ ] Collection: `email_campaigns`

---

## 💬 PHASE 7: Support Inbox (Tab 6)

### Feedback System
- [ ] Collection: `support_tickets`
- [ ] Inbox UI (table view)
- [ ] Filter: Open / Resolved
- [ ] Reply directly via Resend
- [ ] Status tracking
- [ ] Contact form integration

---

## ⚙️ PHASE 8: System Settings (Tab 7)

### Maintenance Mode
- [ ] Global flag in Firestore: `system_settings/maintenance_mode`
- [ ] Toggle in admin
- [ ] Frontend check: Show "Viðhald" page when active

### Sandbox Control
- [ ] Show last reset timestamp
- [ ] Button: Force Sandbox Reset
- [ ] Firebase Function: `seedSandbox`
- [ ] Scheduled Function: `scheduledSandboxReset` (daily cron)

### Feature Flags
- [ ] Collection: `feature_flags`
- [ ] Toggle: Finance Module
- [ ] Toggle: Holiday Logic
- [ ] Toggle: Guest Access

### Error Logging
- [ ] Stream last 50 Firebase errors
- [ ] Filter by severity
- [ ] Auto-refresh

### Admin Management
- [ ] Collection: `super_admins`
- [ ] Add admin (email whitelist)
- [ ] Remove admin
- [ ] Audit log of admin actions

---

## 🏖️ PHASE 9: Public Sandbox

### Demo House
- [ ] Create fixed house ID: `demo-house-001`
- [ ] Exclude from all MRR/metrics
- [ ] Public route: `/demo`

### Data Seeding
- [ ] Firebase Function: `seedSandbox`
- [ ] Realistic Icelandic names/data
- [ ] Scheduled reset (every 24 hours)
- [ ] Manual trigger from Tab 7

---

## 🔐 PHASE 10: Security & Audit

### Audit Logging
- [ ] Collection: `admin_audit_logs`
- [ ] Log every admin action
- [ ] Include: timestamp, admin email, action, target
- [ ] Viewer in Tab 7

### Access Control
- [ ] Verify Firestore rules for super-admin
- [ ] Test unauthorized access blocked
- [ ] Rate limiting on sensitive actions

---

## 🧪 TESTING CHECKLIST

### Impersonation (God Mode)
- [ ] Click "Impersonate" on user
- [ ] Red banner appears
- [ ] Dashboard shows their data
- [ ] Calendar shows their bookings
- [ ] Settings shows their houses
- [ ] Can't delete while impersonating
- [ ] Exit God Mode works
- [ ] Banner disappears

### Demo Seeding
- [ ] First run succeeds
- [ ] Second run doesn't crash
- [ ] Creates demo house
- [ ] Creates 3 demo users
- [ ] Creates bookings
- [ ] Creates tasks
- [ ] Creates finance entries
- [ ] Shows credentials in alert

### Super-Admin Navigation
- [ ] Sidebar tabs work
- [ ] Overview tab shows data
- [ ] Houses tab shows table
- [ ] Users tab shows table
- [ ] Search works in tables
- [ ] Sort works in tables
- [ ] Back to Dashboard works

---

## 📝 NOTES

- Impersonation should NOT require password
- MRR must exclude `is_comped` and `demo-house-001`
- Trial period is 14 days from `created_at`
- All admin actions must be logged to `admin_audit_logs`
- Sandbox resets daily at 03:00 UTC
- Analytics widgets refresh every 5 minutes

---

**Ready to build Phase 2+ in next sessions!** 🚀
