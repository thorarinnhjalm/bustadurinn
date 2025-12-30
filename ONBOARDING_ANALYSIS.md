# Onboarding Flow Analysis & Improvements

## Current Onboarding Flows

### 1️⃣ New User Creating First House (`/onboarding`)
**Current Flow:**
1. Welcome screen
2. House info (name + address search)
3. Invite co-owners (optional)
4. Finish → Dashboard

**Issues:**
- ❌ Trial period is 14 days (should be 30)
- ⚠️ No explanation of what happens after trial
- ⚠️ No guidance on difference between "Manager" and "Member" roles
- ⚠️ Invite step doesn't explain what co-owners can do

**Recommendations:**
- ✅ Fix trial to 30 days
- ✅ Add a "Role Explanation" step or tooltip
- ✅ Show what co-owners will see/do after joining
- ✅ Add optional "Guest Link" generation at the end

---

### 2️⃣ Co-owner Joining Existing House (`/join?houseId=X&code=Y`)
**Current Flow:**
1. Verify invite link
2. Login/Signup prompt (if not authenticated)
3. House preview with "Accept Invite" button
4. Success → Dashboard

**Issues:**
- ⚠️ No explanation of permissions (can they book? delete? manage finances?)
- ⚠️ No tour of features after joining
- ⚠️ Immediately drops into Dashboard without context

**Recommendations:**
- ✅ Add "What You'll Have Access To" card before joining
- ✅ Show a mini-tour after successful join (highlight key features)
- ✅ Display who invited them (adds trust/context)

---

### 3️⃣ Guest/Visitor Access (`/guest/:token`)
**Current Flow:**
1. Access via magic link
2. View house info (WiFi, codes, weather, emergency contact)
3. Can write in guestbook

**Issues:**
- ❌ **No UI to CREATE guest links** (I don't see this in Settings or Dashboard)
- ⚠️ No expiration shown to guest
- ⚠️ No way for guests to report issues or contact owner

**Recommendations:**
- ✅ **CRITICAL**: Add "Generate Guest Link" in Settings page
- ✅ Show expiration date to guests ("Valid until Dec 31")
- ✅ Add a "Contact Owner" button for guests

---

## Priority Fixes

### **HIGH PRIORITY** (Production Blockers)
1. **Fix Trial Period**: Change from 14 days → 30 days in `OnboardingPage.tsx`
2. **Add Guest Link Generator**: Create UI in Settings to generate guest tokens

### **MEDIUM PRIORITY** (User Experience)
3. **Role Clarity**: Add tooltips or a modal explaining Manager vs Member
4. **Post-Join Tour**: Show new co-owners what they can do (mini guided tour)
5. **Invite Context**: Show "Invited by [Name]" in `/join` page

### **LOW PRIORITY** (Nice-to-Have)
6. **Guest Expiration UI**: Show validity period to guests
7. **Guest Contact Button**: Let guests message the owner
8. **Onboarding Completion Email**: Send a "Here's how to get started" email after onboarding

---

## Implementation Plan

### Phase 1: Critical Fixes (30 min)
- [ ] Fix trial period to 30 days
- [ ] Add "Generate Guest Link" button in Settings
- [ ] Create Cloud Function or API endpoint to create `guest_views` documents

### Phase 2: UX Enhancements (1-2 hours)
- [ ] Add role explanation tooltip in Onboarding (Invite step)
- [ ] Show "What you'll have access to" in `/join` before accepting
- [ ] Add mini-tour after joining (use a lightweight library or custom modal)

### Phase 3: Polish (1 hour)
- [ ] Show guest link expiration
- [ ] Add "Contact Owner" for guests
- [ ] Send post-onboarding email with tips

---

## Technical Details

### Missing Functionality: Guest Link Generation

**Current State:**
- `GuestPage.tsx` reads from `guest_views/{token}` collection
- No UI exists to create these documents

**Proposed Solution:**
Add a "Guest Links" section in Settings with:
- Button: "Generate New Guest Link"
- Form: Guest Name, Valid From, Valid Until
- List: Active guest links with "Copy Link" and "Revoke" options

**Firestore Schema for `guest_views`:**
```typescript
{
  id: string; // token used in URL
  house_id: string;
  house_name: string;
  image_url?: string;
  location: { lat: number, lng: number };
  wifi_ssid?: string;
  wifi_password?: string;
  access_code?: string; // door code
  emergency_contact?: string;
  valid_from: Date;
  valid_until: Date;
  created_by: string; // user ID who created link
  created_at: Date;
}
```

---

## User Journey Map

### Journey 1: "Maria creates her first summer house"
1. Signs up → Email verification
2. Onboarding: Enters "Sumarhúsið mitt", searches address
3. Invites sister and brother (emails entered)
4. Sees success screen → Goes to Dashboard
5. **GAP**: Sister/brother get email but don't know what to expect ❌

**Fix**: Add preview in invite email showing what they'll see.

---

### Journey 2: "Jón joins his family's summer house"
1. Receives email: "You've been invited to [House Name]"
2. Clicks link → `/join?houseId=abc&code=123`
3. Sees house name/address, clicks "Accept"
4. **GAP**: Immediately on Dashboard with no guidance ❌
5. Confused: "Can I delete bookings? What's my role?"

**Fix**: Add "Welcome to [House]!" modal with:
- Your role: Member (not Manager)
- You can: Book stays, add tasks, view finances
- You cannot: Delete house, change settings, remove owners

---

### Journey 3: "Airbnb guest arrives at the house"
1. Receives booking confirmation with guest link
2. Opens link on phone
3. **GAP**: No way for owner to have generated this link ❌
4. Sees WiFi password, door code, weather
5. Has issue with hot tub → **GAP**: No way to contact owner ❌

**Fix**: 
- Add Guest Link generation in Settings
- Add "Report Issue" or "Contact Owner" button

---

## Next Steps

Would you like me to:
1. **Fix the trial period to 30 days** (quick 1-minute fix)
2. **Build the Guest Link Generator UI** in Settings (30 min implementation)
3. **Add role clarity tooltips** to onboarding (15 min)
4. **Create a post-join welcome modal** for new co-owners (30 min)

Let me know which improvements you'd like to prioritize!
