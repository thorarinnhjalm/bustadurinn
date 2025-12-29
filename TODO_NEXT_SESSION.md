# 📋 TODO: NEXT SESSION (2025-12-29)

**Priority**: Focus on finishing what exists, not starting new features  
**Time Available**: 2-4 hours (realistic working session)

---

## 🎯 SESSION GOAL

**Get 1-2 things COMPLETELY done** rather than 10 things half-done.

---

## ⚡ PRIORITY 1: SUPER-ADMIN - FIX WHAT EXISTS (2-3 hours)

### Task 1.1: Make Data Actually Load (30 min)
- [ ] Open super-admin page
- [ ] Check if houses/users load
- [ ] Add loading spinners
- [ ] Add error messages
- [ ] Add empty state: "No houses yet. Seed demo data?"
- [ ] **Test with real data**

### Task 1.2: Test & Fix Impersonation (45 min)
- [ ] Click "Impersonate" on a user
- [ ] Verify red banner appears
- [ ] Check if dashboard shows THEIR data
- [ ] Check if calendar shows THEIR bookings
- [ ] Click "Exit God Mode"
- [ ] Verify banner disappears
- [ ] **Document any bugs**

### Task 1.3: Fix Demo Seeder (30 min)
- [ ] Run seeder once - should work
- [ ] Run seeder again - should NOT crash
- [ ] Update to query Firestore for existing users
- [ ] Better error messages
- [ ] Test credentials work

### Task 1.4: Add KPI Cards (45 min)
- [ ] Total Houses card
- [ ] Active/Trial houses split
- [ ] Trial Expiring Soon (< 3 days)
- [ ] Basic MRR calculation (exclude demo)
- [ ] System health indicator

### Task 1.5: Make Actions Work (30 min)
- [ ] "Extend Trial" → adds 14 days
- [ ] "Edit" → opens modal (basic)
- [ ] "Impersonate" → working from 1.2
- [ ] Show success toast
- [ ] Handle errors

**Success Criteria**: Tab 1 (Overview) is FULLY functional and tested

---

## 🎨 PRIORITY 2: EIGINLEIKAR PAGE - SEO CONTENT (2-3 hours)

### Task 2.1: Add Screenshot Mockups (1 hour)
- [ ] Generate calendar screenshot (use /prufa mockup)
- [ ] Generate finance screenshot
- [ ] Generate tasks screenshot
- [ ] Generate settings screenshot
- [ ] Optimize as WebP
- [ ] Add to `/public/assets/` folder

### Task 2.2: Expand Content (1 hour)
- [ ] Create detailed feature sections
- [ ] Add 200-300 word descriptions each
- [ ] Add bullet points for benefits
- [ ] Add use cases
- [ ] Add FAQ section (5-7 questions)

### Task 2.3: SEO Optimization (30 min)
- [ ] Add meta tags
- [ ] Add structured data (JSON-LD)
- [ ] Add alt text for all images
- [ ] Internal links to /pricing, /prufa
- [ ] Test mobile responsive

**Success Criteria**: `/eiginleikar` is comprehensive and SEO-optimized

---

## 🏠 PRIORITY 3: SIMPLIFY HOMEPAGE (1 hour)

### Task 3.1: Remove Excess Content (30 min)
- [ ] Keep: Hero, 3 key benefits, CTA
- [ ] Remove: Long feature descriptions
- [ ] Remove: Multiple screenshots
- [ ] Add: "Sjá alla eiginleika →" link to /eiginleikar
- [ ] Test scroll length (should be 2-3 screens max)

### Task 3.2: Polish (30 min)
- [ ] Verify tagline is prominent
- [ ] Test all CTAs work
- [ ] Check mobile responsive
- [ ] Optimize images
- [ ] Test page speed

**Success Criteria**: Homepage is concise and converts better

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
