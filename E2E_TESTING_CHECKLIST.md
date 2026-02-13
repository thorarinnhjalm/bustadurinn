# End-to-End Testing Checklist

## 🎯 Testing Mission
Ensure the app works flawlessly before real users arrive.

---

## 📋 Pre-Testing Setup

### Environment
- [ ] App running locally: `npm run dev`
- [ ] Or testing on production: https://bustadurinn.is
- [ ] Phone/tablet ready for mobile testing
- [ ] Email client open (to check emails)
- [ ] Browser console open (to catch errors)

### Test Accounts
Create these test emails (use + trick):
- [ ] Manager account: `your.email+manager@gmail.com`
- [ ] Co-owner account: `your.email+coowner@gmail.com`
- [ ] Guest test: Use real email to test guest page

---

## 🧪 Test 1: New User Onboarding

### Step 1.1: Signup
- [ ] Go to `/signup`
- [ ] Click "Búa til aðgang"
- [ ] Enter name and email
- [ ] Enter password (min 6 chars)
- [ ] Click "Skrá mig"
- [ ] **Expected:** Redirect to onboarding
- [ ] **Check console:** No errors

### Step 1.2: House Setup
- [ ] Step 1: Enter house name (e.g., "Sumarbústaðurinn")
- [ ] Step 1: Search for address using HMS search
- [ ] Step 1: Select address from dropdown
- [ ] Step 1: Click "Áfram"
- [ ] **Expected:** Move to Step 2
- [ ] **Check:** Address displays correctly

### Step 1.3: Features Selection
- [ ] Step 2: Review optional features
- [ ] Step 2: Uncheck/check a feature
- [ ] Step 2: Click "Áfram"
- [ ] **Expected:** Move to Step 3

### Step 1.4: Role Review
- [ ] Step 3: Read role explanations
- [ ] Step 3: See "Bústaðastjóri" vs "Meðeigendur" difference
- [ ] Step 3: Click "Áfram"
- [ ] **Expected:** Move to Step 4

### Step 1.5: Complete Onboarding
- [ ] Step 4: Click "Klára uppsetningu"
- [ ] **Expected:** Loading state appears
- [ ] **Expected:** Redirect to `/dashboard`
- [ ] **Expected:** House appears in dashboard
- [ ] **Check email:** Welcome email received?
- [ ] **Check email:** Subject is "Velkomin í Bústaðurinn.is! 🏡"
- [ ] **Check email:** Name is personalized
- [ ] **Check email:** Email looks good (no broken images/styles)
- [ ] **Check console:** No errors during creation

**✅ PASS / ❌ FAIL:** _________

**Issues found:**
```
[List any issues here]
```

---

## 🧪 Test 2: Co-owner Invitation

### Step 2.1: Generate Invite
- [ ] Go to Settings → "Meðeigendur"
- [ ] Copy invite link
- [ ] **Expected:** Link copied to clipboard
- [ ] **Expected:** Success message appears

### Step 2.2: Send Email Invite
- [ ] In Settings → "Meðeigendur"
- [ ] Enter email: `your.email+coowner@gmail.com`
- [ ] Click "Senda boð"
- [ ] **Expected:** Success message
- [ ] **Check email (coowner):** Invite email received?
- [ ] **Check email:** Subject mentions house name
- [ ] **Check email:** Sender name is correct
- [ ] **Check email:** "Samþykkja boð" button works

### Step 2.3: Accept Invitation
- [ ] Open invite link in incognito/private window
- [ ] **Expected:** Shows join page with house name
- [ ] **Expected:** Shows permissions preview (what you CAN do)
- [ ] **Expected:** Shows what you CANNOT do (grayed out with X)
- [ ] Click "Ganga í hús"
- [ ] If not logged in: Sign up/login
- [ ] **Expected:** Successfully joined
- [ ] **Expected:** Redirect to dashboard
- [ ] **Expected:** Can see house, bookings, tasks
- [ ] Go to Settings as co-owner
- [ ] **Expected:** Cannot delete house (not manager)
- [ ] **Expected:** Cannot change some settings

**✅ PASS / ❌ FAIL:** _________

**Issues found:**
```
[List any issues here]
```

---

## 🧪 Test 3: Guest Link & Guestbook

### Step 3.1: Generate Guest Link
- [ ] As manager, go to Settings → "Gestaupplýsingar"
- [ ] Enter WiFi name
- [ ] Enter WiFi password
- [ ] Enter access code (e.g., "1234")
- [ ] Click "Búa til gestahlekk"
- [ ] **Expected:** Link generated
- [ ] **Expected:** Shows "Virkt" badge
- [ ] Copy guest link

### Step 3.2: Visit Guest Page
- [ ] Open guest link in incognito window
- [ ] **Expected:** Shows house name
- [ ] **Expected:** Shows WiFi info
- [ ] **Expected:** Shows access code prominently
- [ ] **Expected:** No login required

### Step 3.3: Write Guestbook Entry
- [ ] Scroll to guestbook form
- [ ] Enter name: "Test Gestur"
- [ ] Enter message: "Frábær staður! Þakka ykkur fyrir."
- [ ] Click submit button
- [ ] **Expected:** Success message
- [ ] **Expected:** Form clears

### Step 3.4: View Guestbook Entries (Manager)
- [ ] As manager, go to Settings → "Gestabók (Journal)"
- [ ] **Expected:** See the test entry
- [ ] **Expected:** Shows author name, message, date
- [ ] **Expected:** Entries in chronological order

**✅ PASS / ❌ FAIL:** _________

**Issues found:**
```
[List any issues here]
```

---

## 🧪 Test 4: Mobile Experience

### Devices to Test
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] iPad

### Step 4.1: Homepage
- [ ] Visit bustadurinn.is on phone
- [ ] **Expected:** No horizontal scroll
- [ ] **Expected:** Text is readable (not too small)
- [ ] **Expected:** Buttons are tappable
- [ ] Try swiping left/right
- [ ] **Expected:** Page doesn't shift

### Step 4.2: Onboarding on Mobile
- [ ] Complete full onboarding on phone
- [ ] **Expected:** Address search works
- [ ] **Expected:** Form inputs don't cause zoom
- [ ] **Expected:** All steps fit on screen
- [ ] **Expected:** No layout breaks

### Step 4.3: Dashboard on Mobile
- [ ] View dashboard on phone
- [ ] **Expected:** Calendar is usable
- [ ] **Expected:** Navigation works
- [ ] **Expected:** Can access all features

### Step 4.4: Guest Page on Mobile
- [ ] Open guest link on phone
- [ ] **Expected:** WiFi info easy to read
- [ ] **Expected:** Access code clearly visible
- [ ] **Expected:** Guestbook form works

**✅ PASS / ❌ FAIL:** _________

**Issues found:**
```
[List any issues here]
```

---

## 🧪 Test 5: Core Features

### Calendar & Bookings
- [ ] Go to "Heimili" or calendar page
- [ ] Create a booking (select dates)
- [ ] **Expected:** Booking appears
- [ ] Edit booking
- [ ] **Expected:** Changes saved
- [ ] Delete booking
- [ ] **Expected:** Booking removed

### Tasks
- [ ] Go to tasks page
- [ ] Create new task
- [ ] **Expected:** Task appears
- [ ] Mark task complete
- [ ] **Expected:** Moves to completed
- [ ] Delete task

### Finance
- [ ] Go to finance page
- [ ] Add expense entry
- [ ] **Expected:** Entry appears
- [ ] View finance overview
- [ ] **Expected:** Numbers add up correctly

### Shopping List
- [ ] Add items to shopping list
- [ ] Check off items
- [ ] **Expected:** Items update
- [ ] Delete items

**✅ PASS / ❌ FAIL:** _________

**Issues found:**
```
[List any issues here]
```

---

## 🧪 Test 6: Error Handling

### Invalid Inputs
- [ ] Try signup with weak password
- [ ] **Expected:** Error message shown
- [ ] Try signup with invalid email
- [ ] **Expected:** Error message shown
- [ ] Try joining house with wrong code
- [ ] **Expected:** Clear error message

### Network Issues
- [ ] Turn off wifi briefly during action
- [ ] **Expected:** Graceful error (not crash)
- [ ] Retry action when network back
- [ ] **Expected:** Works

**✅ PASS / ❌ FAIL:** _________

---

## 🧪 Test 7: Icelandic Language

### Grammar Check
- [ ] Review all visible text
- [ ] Check for typos
- [ ] Verify verb forms (infinitive, not past participle)
- [ ] Check button labels make sense
- [ ] Check error messages are clear

**Issues found:**
```
[List any Icelandic issues here]
```

---

## 📊 Final Summary

### Critical Issues (Must Fix)
```
1. 
2.
3.
```

### Minor Issues (Nice to Fix)
```
1.
2.
3.
```

### Works Great ✅
```
1.
2.
3.
```

---

## 🎯 Next Steps After Testing

1. Fix all critical issues
2. Re-test critical flows
3. Deploy fixes to production
4. Mark features as "tested" in docs
5. Ready for real users! 🚀

---

**Testing Date:** _________  
**Tested By:** _________  
**Environment:** [ ] Local [ ] Production  
**Overall Status:** [ ] PASS [ ] FAIL [ ] NEEDS WORK
