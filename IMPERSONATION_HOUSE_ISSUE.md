# Known Issue: Impersonation House Loading

## Problem
When impersonating a user, bookings fail with:
```
Error creating booking: FirebaseError: Function addDoc() called with invalid data. 
Unsupported field value: undefined (found in field house_id)
```

## Root Cause
The app has two separate state systems:
1. `currentUser` in appStore (logged-in admin)
2. `impersonatedUser` in ImpersonationContext

But only ONE `currentHouse` in appStore.

When impersonating:
- `useEffectiveUser()` correctly returns the impersonated user
- BUT `currentHouse` in appStore is still the admin's house (or null)
- Booking creation code likely uses `currentHouse.id` which is undefined

## Solution Required

### Option 1: Update house loading on impersonation start
When `handleImpersonate()` is called in SuperAdminPage:
1. Fetch the impersonated user's first house
2. Set it in app Store with `setCurrentHouse()`
3. Then navigate to dashboard

### Option 2: Make useEffectiveUser also handle effective house
Create `useEffectiveHouse()` that:
- Returns `currentHouse` if not impersonating
- Returns impersonated user's first house if impersonating
- Use this everywhere instead of direct `appStore.currentHouse`

### Option 3: Unify state management
Move `currentUser` into ImpersonationContext and always use effective user throughout app.

## Temporary Workaround
For now, impersonation WORKS for:
- ✅ Viewing dashboard as user
- ✅ Seeing their data
- ✅ Visual banner showing impersonation

But FAILS for:
- ❌ Creating bookings
- ❌ Creating tasks  
- ❌ Any operation that requires `house_id`

## Files to Modify
1. `/src/pages/SuperAdminPage.tsx` - `handleImpersonate()`
2. `/src/hooks/useEffectiveUser.ts` - Add house handling
3. Anywhere that uses `useAppStore(state => state.currentHouse)`

## Priority
Medium - Impersonation is functional for viewing, just not for actions.

---
**Status**: Documented for next session
**Created**: 2025-12-29
