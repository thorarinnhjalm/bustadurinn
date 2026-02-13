# 🏗️ SUPER-ADMIN "MISSION CONTROL" - IMPLEMENTATION ROADMAP

**Status**: Foundation Complete, Full Build Pending  
**Priority**: Phase 2 Enhancement  
**Date**: 2025-12-28

---

## ✅ What's Been Built (Foundation)

### 1. **AdminLayout Component** ✅
- Dark sidebar (#1a1a1a) with light content area
- Desktop-first navigation
- Professional monospace branding
- Nav links: Overview, Houses, Users, Analytics, System

### 2. **Impersonation Context** ✅
- React Context for God Mode state
- `startImpersonation(user)` - Switch to user view
- `stopImpersonation()` - Exit God Mode  
- `isImpersonating` - Boolean flag

### 3. **Impersonation Banner** ✅
- Red warning banner (fixed top)
- Shows impersonated user name/email
- "Exit God Mode" button
- Pulsing alert icon

### 4. **Current Super-Admin** ✅
- Real-time analytics (houses, users, bookings, tasks)
- Demo data seeding
- Impersonation buttons (UI only)
- Recent activity feeds

---

## 📋 Full "Mission Control" Specification

### Module 1: House Registry (Data Table)
**Status**: 🟡 Pending

**Design**:
```
| House Name          | Manager       | Users | Status | MRR    | Created    | Actions |
|---------------------|---------------|-------|--------|--------|------------|---------|
| Sumarbústaður...    | jon@demo.is   | 3     | 🟢 Active | 2,490 | 2024-12-01 | [...] |
```

**Features**:
- Sortable columns
- Search by name/email/ID
- Status pills (Active/Trial/Churned)
- Quick actions: Edit, Extend Trial, Impersonate

**Code Needed**:
- `HouseDataTable.tsx` component
- Sorting/filtering logic
- Action handlers

---

### Module 2: User Registry (Data Table)
**Status**: 🟡 Pending

**Design**:
```
| Name          | Email          | Houses | Role    | Status | Last Login | Actions |
|---------------|----------------|--------|---------|--------|------------|---------|
| Jón Jónsson   | jon@demo.is    | 1      | Manager | 🟢 Active | 2h ago  | [Impersonate] |
```

**Features**:
- Monospace emails/IDs for alignment
- Role badges
- Real-time "active now" indicator
- Impersonate button → triggers context

**Code Needed**:
- `UserDataTable.tsx` component
- Real impersonation logic (integrate context)
- Last login tracking

---

### Module 3: Analytics Dashboard
**Status**: 🟡 Pending

**Metrics**:
1. **Live Pulse**: "3 users active right now"
2. **Onboarding Funnel**:
   - Step 1 (Start): 100 users
   - Step 2 (Location): 85 users (85%)
   - Step 3 (Invite): 60 users (60%)
   - Step 4 (Complete): 50 users (50%)
3. **MRR Graph**: Monthly recurring revenue trend
4. **Growth**: New signups/day

**Code Needed**:
- Funnel visualization component
- MRR calculation from subscriptions
- Charts library (recharts or Chart.js)
- Real-time active user tracking

---

### Module 4: Communication Tools
**Status**: 🟡 Pending

#### A. Newsletter Tool
- Rich text editor (TipTap or Quill)
- Segment selector:
  - All Managers
  - Trial Users
  - Churned Users
- Preview + Send
- Email via Firebase Functions + SendGrid

#### B. System Alerts
- Banner system for frontend notifications
- "System maintenance tonight 10 PM"
- Stored in Firestore `system_alerts` collection
- Auto-dismiss after date

---

### Module 5: Real Impersonation (Complete)
**Status**: 🟢 Ready (Context Built)

**How It Works**:
1. Admin clicks "Impersonate" on user row
2. `ImpersonationContext.startImpersonation(user)` called
3. Red banner appears at top
4. App uses `impersonatedUser.uid` for ALL data fetching
5. Admin clicks "Exit God Mode" to return

**Integration Needed**:
- Update `useAppStore` to check impersonation context
- Modify all Firestore queries to use impersonated UID
- Add banner to App.tsx

---

###Module 6: Audit Logging
**Status**: 🟡 Pending

**Collection**: `admin_logs`
```typescript
{
  timestamp: Timestamp,
  admin_email: 'thorarinnhjalmarsson@gmail.com',
  action: 'extended_trial',
  target_id: 'house_123',
  details: { days: 14 }
}
```

**Events to Log**:
- Impersonation start/stop
- Trial extensions
- User edits
- Demo data seeding
- Newsletter sends

**Code Needed**:
- `logAdminAction(action, target, details)` function
- Auto-logging in all admin actions
- Log viewer component

---

## 🎨 UI/UX Specifications

### Typography
```css
/* Admin-specific fonts */
.admin-mono {
  font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
}

.admin-header {
  font-family: 'Fraunces', serif; /* Brand consistency */
}
```

### Status Pills
```tsx
<StatusBadge status="active" />   // 🟢 Green
<StatusBadge status="trial" />    // 🟡 Yellow
<StatusBadge status="churned" />  // 🔴 Red
<StatusBadge status="admin" />    // 🔵 Blue
```

### Data Table Style
```css
.admin-table {
  font-size: 13px;
  line-height: 1.4;
  border-collapse: collapse;
}

.admin-table th {
  background: #f5f5f5;
  border-bottom: 2px solid #ddd;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
}

.admin-table td {
  border-bottom: 1px solid #eee;
  padding: 8px 12px;
}

.admin-table tbody tr:hover {
  background: #fafafa;
}
```

---

## 🔐 Security Implementation

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSuperAdmin() {
      return request.auth.token.email == 'thorarinnhjalmarsson@gmail.com';
    }
    
    // Admin-only collections
    match /admin_logs/{doc} {
      allow read, write: if isSuperAdmin();
    }
    
    match /system_alerts/{doc} {
      allow read: if true; // Public read for banners
      allow write: if isSuperAdmin();
    }
    
    // Existing rules...
  }
}
```

### Route Protection
Already implemented via `AdminRoute` component with email whitelist.

---

## 📊 Implementation Priority

### Phase 1 (Completed ✅)
- [x] Admin layout with dark sidebar
- [x] Impersonation context
- [x] Impersonation banner
- [x] Basic analytics (current SuperAdminPage)

### Phase 2 (Next Sprint)
1. Replace card-based UI with data tables
2. Integrate impersonation context into App.tsx
3. Add real impersonation to user table
4. Build house data table with search/filter

### Phase 3 (Future)
1. Analytics dashboard with funnel
2. MRR tracking
3. Audit logging
4. Newsletter tool
5. System alerts

---

## 💻 Code Examples

### Using Impersonation Context
```typescript
// In any component that fetches data
import { useImpersonation } from '@/contexts/ImpersonationContext';

function MyComponent() {
  const { impersonatedUser, isImpersonating } = useImpersonation();
  const currentUser = useAppStore(state => state.currentUser);
  
  // Use impersonated user if active, otherwise real user
  const effectiveUser = isImpersonating ? impersonatedUser : currentUser;
  
  // Fetch data for effective user
  const houseId = effectiveUser?.house_ids?.[0];
  // ...
}
```

### Wrapping App with Context
```typescript
// App.tsx
import { ImpersonationProvider } from '@/contexts/ImpersonationContext';
import ImpersonationBanner from '@/components/ImpersonationBanner';

function App() {
  return (
    <ImpersonationProvider>
      <ImpersonationBanner />
      {/* Rest of app */}
    </ImpersonationProvider>
  );
}
```

---

## 🎯 Current Status Summary

**What Works Now**:
- ✅ Dark sidebar navigation
- ✅ Impersonation infrastructure (context + banner)
- ✅ Live analytics display
- ✅ Demo data seeding
- ✅ Admin access control

**What Needs Work**:
- 🟡 Data tables (replace cards)
- 🟡 Real impersonation integration
- 🟡 Search/filter functionality
- 🟡 Audit logging
- 🟡 Communication tools

**Estimated Effort**: 8-12 hours for full Mission Control build

---

## 🚀 Next Steps

1. **Immediate** (Tonight if needed):
   - Wire up impersonation context to existing "Impersonate" buttons
   - Add ImpersonationBanner to App.tsx
   - Test God Mode with demo users

2. **Next Session**:
   - Build `HouseDataTable` and `UserDataTable` components
   - Replace card-based UI with tables
   - Add search/filter inputs
   - Implement sorting

3. **Future Sessions**:
   - Analytics dashboard with charts
   - Newsletter/alert tools
   - Audit log viewer

---

**The foundation is solid. The Mission Control dashboard is 30% complete and architecturally ready for rapid expansion.** 🎯

---

**Built for Neðri Hóll Hugmyndahús ehf** 🇮🇸
