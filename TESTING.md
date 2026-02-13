# Testing Guide

## 📧 Email Aliases for Testing

All these go to `thorarinnhj@icloud.com` but system treats them as different users:

### Test Accounts
```
thorarinnhj+manager@icloud.com   - Main manager account
thorarinnhj+coowner@icloud.com   - Co-owner #1
thorarinnhj+member@icloud.com    - Co-owner #2
thorarinnhj+test@icloud.com      - General testing
```

---

## 🐛 Known Issues

### Critical Issues

#### 1. **Mobile Calendar Not Usable**
**Status:** 🔴 CRITICAL  
**Description:** Booking calendar is not usable on mobile devices  
**Impact:** Users cannot create bookings on mobile  
**Priority:** HIGH  
**Found:** 2025-12-30  

**Details:**
- Calendar component doesn't render correctly on small screens
- Possible issues:
  - Date picker too small to tap
  - Calendar overflows viewport
  - Controls not accessible
  - Gestures not working

**To Reproduce:**
1. Open dashboard on mobile
2. Navigate to booking/calendar
3. Try to create a booking

**Affected Components:**
- Calendar page
- Booking flow
- react-big-calendar (likely culprit)

**Needs Investigation:**
- [ ] Which calendar component is used?
- [ ] Mobile-specific CSS issues?
- [ ] Touch event handling?
- [ ] Need mobile-optimized calendar alternative?

---

### Minor Issues
None yet

---

## ✅ Tested & Working
- [ ] Welcome email sends
- [ ] Invite email sends
- [ ] Guest link works
- [ ] Guestbook entries
- [ ] Mobile horizontal scroll FIXED
- [ ] Onboarding flow

---

## 🧪 Testing TODO

See full checklist in `E2E_TESTING_CHECKLIST.md`

### High Priority
- [ ] Fix mobile calendar
- [ ] Test full onboarding
- [ ] Test invite flow
- [ ] Test guest page
- [ ] Test on iPhone/Android

### Lower Priority
- [ ] Task management
- [ ] Finance entries
- [ ] Shopping list
- [ ] Settings changes

---

## 📱 Mobile Testing Devices

Test on:
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] iPad

---

**Last Updated:** 2025-12-30
