# 🐛 SUPER-ADMIN DEBUG & FIX PLAN

**Date**: 2025-12-29  
**Status**: In Progress

---

## 🔍 Issues Identified

### 1. **Impersonation Not Wired Up** ❌
**Problem**: ImpersonationContext exists but app doesn't use it  
**Impact**: Clicking "Impersonate" does nothing useful  
**Fix Needed**: 
- Create `useEffectiveUser()` hook ✅ DONE
- Update DashboardPage to use effective user
- Update CalendarPage to use effective user  
- Update all data fetching hooks

### 2. **Demo Seeder Doesn't Handle Existing Users** ❌
**Problem**: If users exist, their IDs aren't retrieved  
**Impact**: Can't seed data if ran twice  
**Fix Needed**:
- Query Firestore for existing users by email
- Use their UIDs even if they already exist
- Better error messaging

### 3. **Super-Admin Data Tables Empty** ❌
**Problem**: Tables show but no data appears  
**Impact**: Can't see houses/users even with correct permissions  
**Fix Needed**:
- Add loading states
- Add error boundaries
- Better empty states with actionable messages

### 4. **Impersonation Redirect Logic** ❌
**Problem**: Clicks impersonate → redirects to `/dashboard` but shows admin's data  
**Impact**: Confusing - looks like it didn't work  
**Fix Needed**:
- Don't redirect immediately
- Show toast: "Viewing as [User]"
- Keep them in super-admin but update preview
- OR: Add "View Their Dashboard" button

---

## 🎯 Priority Fixes (Do Tonight)

### **Priority 1: Get Super-Admin Working**
1. ✅ Fix Firestore rules deployment (DONE - user deployed manually)
2. ✅ Fix demo seeder `manager_uid` field (DONE)
3. ⏳ Make demo seeder handle existing users
4. ⏳ Add better error messages to super-admin

### **Priority 2: Make Impersonation Actually Work**
1. ✅ Create `useEffectiveUser()` hook (DONE)
2. ⏳ Update DashboardPage to use it
3. ⏳ Update CalendarPage to use it
4. ⏳ Update SettingsPage to use it
5. ⏳ Test full impersonation flow

### **Priority 3: Polish**
1. ⏳ Add toast notifications
2. ⏳ Better empty states
3. ⏳ Loading skeletons in tables

---

## 📝 Detailed Fix Steps

### Fix 1: Demo Seeder Handle Existing Users

```typescript
// In seedDemoData.ts around line 200
if (error.code === 'auth/email-already-in-use') {
  console.log(`⚠️ User ${demoUser.email} already exists`);
  // FETCH existing user from Firestore
  const usersSnap = await getDocs(
    query(collection(db, 'users'), where('email', '==', demoUser.email))
  );
  if (!usersSnap.empty) {
    userIds.push(usersSnap.docs[0].id);
  }
}
```

### Fix 2: Wire Impersonation to Dashboard

```typescript
// In DashboardPage.tsx
import { useEffectiveUser } from '@/hooks/useEffectiveUser';

function DashboardPage() {
  const { user, isImpersonating } = useEffectiveUser();
  
  // Use 'user' instead of currentUser from store
  const houses = user?.house_ids || [];
  // ...
}
```

### Fix 3: Better Super-Admin Error States

```typescript
// In SuperAdminPage.tsx
{loading ? (
  <div>Loading...</div>
) : error ? (
  <div className="alert alert-error">
    <p>Failed to load data: {error.message}</p>
    <button onClick={retry}>Retry</button>
  </div>
) : stats.allUsers.length === 0 ? (
  <div className="empty-state">
    <p>No users yet</p>
    <button onClick={handleSeedDemo}>Seed Demo Data</button>
  </div>
) : (
  // Show table
)}
```

---

## 🧪 Testing Checklist

### Super-Admin Basic Functionality
- [ ] Login as admin → Auto-redirect to /super-admin
- [ ] See overview with metrics
- [ ] Houses tab shows data table
- [ ] Users tab shows data table
- [ ] Search works in tables
- [ ] Sort works in tables

### Demo Seeding
- [ ] Click "Seed Demo Data" button
- [ ] See success message with credentials
- [ ] Data appears in tables
- [ ] Can run twice without errors
- [ ] Shows existing users correctly

### Impersonation Flow
- [ ] Click "Impersonate" on a user
- [ ] Red banner appears at top
- [ ] Dashboard shows THEIR data, not admin's
- [ ] Calendar shows THEIR bookings
- [ ] Settings shows THEIR houses
- [ ] Click "Exit God Mode"
- [ ] Back to admin view
- [ ] Banner disappears

---

## ⚡ Quick Wins (5 min each)

1. **Add Loading Spinner** - Show while fetching stats
2. **Add Empty States** - "No data yet" with seed button
3. **Add Error Toasts** - Show what went wrong
4. **Fix Table Widths** - Some columns too narrow
5. **Add Row Hover** - Visual feedback on tables

---

## 🚨 Critical Bugs to Fix ASAP

1. **Impersonation does nothing** - Highest priority
2. **Demo seeder fails on re-run** - Blocks testing
3. **Tables appear empty** - Even with data

---

## 📋 Completion Criteria

Super-Admin is "done" when:
- ✅ Login→ auto-redirect works
- ✅ All 3 tabs load data correctly
- ✅ Search & sort work
- ✅ Demo seeding works (even if run multiple times)
- ✅ Impersonate actually switches view
- ✅ Red banner shows during impersonation
- ✅ Exit God Mode returns to admin
- ✅ No console errors

---

**Next Action**: Fix demo seeder to handle existing users, then wire up impersonation properly.
