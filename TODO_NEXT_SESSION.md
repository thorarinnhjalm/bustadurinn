# 📋 TODO: NEXT SESSION (2025-12-29)

**Priority**: Focus on finishing what exists, not starting new features  
**Time Available**: 2-4 hours (realistic working session)

---

## 🎯 SESSION GOAL

**Get 1-2 things COMPLETELY done** rather than 10 things half-done.

---

## ⚡ PRIORITY 1: SUPER-ADMIN - FIX WHAT EXISTS (2-3 hours) ✅ COMPLETE

### Task 1.1: Make Data Actually Load (30 min) ✅
- [x] Open super-admin page
- [x] Check if houses/users load
- [x] Add loading spinners
- [x] Add error messages
- [x] Add empty state: "No houses yet. Seed demo data?"
- [x] **Test with real data**

### Task 1.2: Test & Fix Impersonation (45 min) ✅
- [x] Click "Impersonate" on a user
- [x] Verify red banner appears
- [x] Check if dashboard shows THEIR data
- [x] Check if calendar shows THEIR bookings
- [x] Click "Exit God Mode"
- [x] Verify banner disappears
- [x] **Document any bugs**

### Task 1.3: Fix Demo Seeder (30 min) ✅
- [x] Run seeder once - should work
- [x] Run seeder again - should NOT crash
- [x] Update to query Firestore for existing users
- [x] Better error messages
- [x] Test credentials work

### Task 1.4: Add KPI Cards (45 min) ✅
- [x] Total Houses card
- [x] Active/Trial houses split
- [x] Trial Expiring Soon (< 3 days)
- [x] Basic MRR calculation (exclude demo)
- [x] System health indicator

### Task 1.5: Make Actions Work (30 min) ✅
- [x] "Extend Trial" → adds 14 days
- [x] "Edit" → opens modal (basic)
- [x] "Impersonate" → working from 1.2
- [x] Show success toast
- [x] Handle errors

**Success Criteria**: ✅ Tab 1 (Overview) is FULLY functional and tested

---

## 🎨 PRIORITY 2: EIGINLEIKAR PAGE - SEO CONTENT (2-3 hours) ✅ COMPLETE

### Task 2.1: Add Screenshot Mockups (1 hour) ✅
- [x] Generate calendar screenshot (use /prufa mockup)
- [x] Generate finance screenshot
- [x] Generate tasks screenshot
- [x] Generate settings screenshot
- [x] Optimize as WebP
- [x] Add to `/public/assets/` folder

### Task 2.2: Expand Content (1 hour) ✅
- [x] Create detailed feature sections
- [x] Add 200-300 word descriptions each
- [x] Add bullet points for benefits
- [x] Add use cases
- [x] Add FAQ section (5-7 questions)

### Task 2.3: SEO Optimization (30 min) ✅
- [x] Add meta tags
- [x] Add structured data (JSON-LD)
- [x] Add alt text for all images
- [x] Internal links to /pricing, /prufa
- [x] Test mobile responsive

**Success Criteria**: ✅ `/eiginleikar` is comprehensive and SEO-optimized

---

## 🏠 PRIORITY 3: SIMPLIFY HOMEPAGE (1 hour) ✅ COMPLETE

### Task 3.1: Clean Up Hero (20 min) ✅
- [x] Keep full-bleed image background
- [x] Keep headline + tagline + 2 CTAs max
- [x] Remove 3rd "Sjá eiginleika" button from hero
- [x] Add direct price mention (4.900 kr/mán) in social proof
- [x] Update trial period to 30 days (was 14)

### Task 3.2: Condense Pricing (20 min) ✅
- [x] Remove dual-plan comparison
- [x] Show single recommended plan: 4.900 kr/mán
- [x] Keep 4 key benefits in list
- [x] Simplify messaging

### Task 3.3: Remove Bloat (20 min) ✅
- [x] Remove "Problem/Solution" section entirely
- [x] Simplify feature descriptions (remove subtitles)
- [x] Add prominent link to /eiginleikar with icon
- [x] Reduce from 6+ screens to 2-3 screens

**Success Criteria**: ✅ Homepage is focused, < 3 screens, clear path to /eiginleikar

---

## 📝 NICE-TO-HAVE (If time)

### Bonus Task 1: Contact Form (30 min)
- [ ] Add contact form to /um-okkur or footer
- [ ] Save to `contact_submissions` collection
- [ ] Send notification email via Resend
- [ ] Add to super-admin Tab 5

### Bonus Task 2: Analytics Check (15 min)
- [ ] Verify Facebook Pixel is firing
- [ ] Check Google Analytics setup
- [ ] Test conversion tracking

---

## 🚫 DO NOT DO TOMORROW

- ❌ Don't start new tabs in super-admin
- ❌ Don't build email campaigns
- ❌ Don't add new features
- ❌ Don't refactor working code
- ❌ Don't touch Payday integration

**Focus**: Finish existing work to production quality

---

## 📊 SESSION METRICS

Track progress:
- [ ] Super-admin Tab 1: 0% → 100%
- [ ] Eiginleikar page: 20% → 100%
- [ ] Homepage: 80% → 100%
- [ ] Bugs fixed: TBD
- [ ] Tests passed: All manual tests

---

## 🎯 REALISTIC EXPECTATIONS

### Minimum Success (2 hours):
- Super-admin Tab 1 working
- Demo seeder fixed
- Impersonation tested

### Good Session (3 hours):
- All Priority 1 done
- Eiginleikar page expanded

### Excellent Session (4 hours):
- All Priority 1 & 2 done
- Homepage simplified
- Everything deployed

---

## 🛠️ TOOLS NEEDED

- Browser: Test in Chrome + Safari
- Firestore Console: Check data
- Dev Tools: Check console errors
- Postman/Thunder: Test API calls (if needed)

---

## 📝 BEFORE YOU START

1. **Pull latest code**: `git pull`
2. **Start dev server**: `npm run dev`
3. **Open super-admin**: http://localhost:5173/super-admin
4. **Have Firestore console open**
5. **Have this TODO visible**

---

## ✅ DONE TODAY (2025-12-28)

- ✅ Sidebar navigation wired (finally)
- ✅ Impersonation context created
- ✅ useEffectiveUser hook
- ✅ Visual sandbox (/prufa)
- ✅ Icelandic number formatting
- ✅ Grammar fixes
- ✅ Hero tagline updated
- ✅ Documentation (STATUS, ROADMAP, TODO, PLAN)

---

## 📌 PARKING LOT (Future)

Ideas to revisit later:
- Analytics integration (GA4, Facebook)
- Funnel tracking
- Contact form inbox
- System settings tab
- Maintenance mode
- Feature flags

---

**Created**: 2025-12-29 00:56  
**For Session**: Tomorrow  
**Estimated Time**: 2-4 hours  
**Success**: Get Tab 1 & Eiginleikar page DONE
