# Bustadurinn.is - Skipulagsviðbót fyrir Stéttarfélög og Samtök

**Dagsetning:** 16. febrúar 2026
**Markmið:** Gera bustadurinn.is að flottu SaaS kerfis fyrir stéttarfélög, sveitarfélög og önnur samtök sem leigja út sumarhús

---

## 📋 Executive Summary

Bustadurinn.is er núna smíðað fyrir **einstök sumarhús** með eigendum og meðeigendum. Við viljum víkka út og bjóða **skipulagsviðbót** fyrir:
- Stéttarfélög (Efling, VR, Strax, o.fl.)
- Sveitarfélög með orlofshús
- Fyrirtæki með sumarhús fyrir starfsmenn
- Íþróttafélög og aðrar samtök

**Kjarnavandamálið:** Núverandi kerfi styður ekki:
- Skipulag með mörgum húsum (10-100+ eignir)
- Organization-level billing og subscription
- Bulk management fyrir marga staði
- Member auto-enrollment
- Organization-specific branding

---

## 🔍 Competitive Analysis: Frimann.is

### Hvað er Frimann?
**Frimann.is** er stærsta sumarhúsa- og samtakakerfið á Íslandi. Þeir þjónusta íslensk samtök og stéttarfélög með heildaruppsetningu fyrir:
- Sumarhúsabókun og eignaumsýslu
- Félagasamskipti og punktakerfi
- Ferðagjafabréf og smásala
- Styrkjaumsóknir
- Afsláttarklúbb

**Business model:** Subscription-based platform fyrir samtök

### Hvað gerir Frimann vel?

✅ **Heildaruppsetning:** Ekki bara sumarhús, heldur allt fyrir samtök
- Member management með punktakerfi
- Integration við bókhaldskerfi (dk)
- Grants & applications
- Discount club með samstarfsaðilum

✅ **Markaðsþekking:** Þeir skilja íslensk stéttarfélög vel
- GDPR compliance
- Tvímæli support (Icelandic/English)
- Role-based access

✅ **Established:** Fyrirliggjandi customer base
- "Stærsta kerfið á Íslandi"
- Partnerships með hótelum og vendors
- Proven track record

### Gallar hjá Frimann (Opportunities fyrir okkur)

❌ **Gamaldags UX:**
- Legacy system feel (likely older tech stack)
- Desktop-first design
- Líklega ekki módern React/Firebase stack

❌ **Locked ecosystem:**
- Virðist vera all-or-nothing solution
- Ekki flexible fyrir organizations sem vilja bara sumarhúsakerfi

❌ **Costly:**
- Líklega dýrt fyrir smá samtök (enterprise-level pricing)
- Setup fees + consulting fees

❌ **Lack of modern features:**
- Engar módern features eins og:
  - Real-time calendar updates
  - Mobile-first experience
  - Modern payment integrations (Stripe, etc.)
  - API-first architecture
  - Tenant self-service (white-label)

---

## 🎯 Differentiation Strategy: Hvernig vinnum við Frimann?

### 1. **Modern Tech Stack = Better UX**
**Frimann:** Legacy system (líklega PHP/jQuery)
**Bustadurinn.is:** React + Firebase + Modern PWA
- ⚡ Raun-tíma updates (ekki page refresh)
- 📱 Mobile-first (works perfectly á síma)
- 🎨 Scandinavian minimalist design
- 🚀 Snappier performance

### 2. **Modular Approach vs All-or-Nothing**
**Frimann:** Þarf að taka alla pakkann
**Bustadurinn.is:** Veldu hvað þú þarft
- 📦 Bara sumarhúsakerfi? → Basic tier
- 🎁 Viltu bæta við travel vouchers? → Add-on
- 💰 Integration við þitt kerfi? → API access

**Value prop:** "Byrjaðu með sumarhúsin, bættu við restinni seinna"

### 3. **Self-Service & White-Label**
**Frimann:** Setup fees + consulting required
**Bustadurinn.is:** Sign up og fara af stað sama dag
- 🎨 White-label ready (custom domain, branding)
- 🔧 Self-service setup (no consulting needed)
- 📊 Self-service analytics dashboard

### 4. **Transparent, Flexible Pricing**
**Frimann:** Enterprise-only pricing (kontakta sölumann)
**Bustadurinn.is:** Clear tier pricing
- 💰 Basic: 99.900 kr/ár (fyrir smá félag)
- 📈 Pro: 299.900 kr/ár (fyrir meðalstór)
- 🏢 Enterprise: Custom (bara fyrir stóru)

**Value prop:** "Affordable fyrir öll stéttarfélög, ekki bara stóru"

### 5. **Open API & Integrations**
**Frimann:** Closed system með custom integrations
**Bustadurinn.is:** API-first architecture
- 🔌 REST API frá byrjun
- 🪝 Webhooks fyrir real-time events
- 📊 Data export (CSV, JSON)
- 🔗 Integration marketplace

**Value prop:** "Tengist við þitt núverandi kerfi"

### 6. **Focus = Better Product**
**Frimann:** Does everything (sumarhús, travel, grants, discounts)
**Bustadurinn.is:** Best-in-class sumarhúskerfi
- 🎯 100% focus á að gera bókunarupplifun perfect
- 🏆 Better calendar UX
- 📈 Better analytics fyrir eignir
- 🤖 Smart features (fairness algorithm, waiting lists)

**Value prop:** "Besta sumarhúsakerfið, integraðu við aðra fyrir restina"

---

## 🎯 Market Positioning

### TAM (Total Addressable Market) á Íslandi
- **Stéttarfélög:** ~100 samtök (ASÍ members + others)
- **Sveitarfélög:** 64 municipalities
- **Fyrirtæki með sumarhús:** ~200+ (bankar, stórfyrirtæki)
- **Íþrótta/áhugafélög:** ~1000+ (en flest smá)

**Realist TAM:** ~300-400 potential customers

### SAM (Serviceable Available Market)
Organizations með 3+ properties:
- Stór stéttarfélög: ~20 (already served by Frimann?)
- Meðalstór stéttarfélög: ~50 (opportunity)
- Sveitarfélög: ~30 (með sumarhús)
- Fyrirtæki: ~100

**Realistic SAM:** ~200 organizations

### SOM (Serviceable Obtainable Market) - Year 1-3
**Year 1:** 10-15 organizations
- Target: Organizations NOT currently using Frimann
- Target: Smaller orgs (5-30 properties) priced out by Frimann
- Wedge: Better UX, lower price

**Year 2-3:** 30-50 organizations
- Start winning customers FROM Frimann
- Value prop: Modern platform, better mobile, API access

**Revenue potential:**
- Year 1: 10 orgs × 150k avg = 1.5M kr ARR
- Year 2: 30 orgs × 200k avg = 6M kr ARR
- Year 3: 50 orgs × 250k avg = 12.5M kr ARR

---

## 🥊 Head-to-Head Comparison

| Feature | Frimann.is | Bustadurinn.is |
|---------|-----------|----------------|
| **Sumarhúsabókun** | ✅ | ✅ |
| **Real-time calendar** | ❓ (likely ❌) | ✅ |
| **Mobile app** | ❓ | ✅ (PWA) |
| **Modern UX** | ❌ | ✅ |
| **Member management** | ✅ (full) | ✅ (focused) |
| **Travel vouchers** | ✅ | ❌ (not yet) |
| **Grants system** | ✅ | ❌ (not needed) |
| **Discount club** | ✅ | ❌ (not needed) |
| **API access** | ❓ (custom only?) | ✅ (built-in) |
| **White-label** | ❓ | ✅ |
| **Self-service setup** | ❌ | ✅ |
| **Transparent pricing** | ❌ | ✅ |
| **Setup time** | Weeks (consulting) | Hours (self-service) |
| **Price (est.)** | High (enterprise) | 99k-299k/year |

### Our Advantages
1. ⚡ **Speed to market:** Sign up today, live tomorrow
2. 💰 **Price:** 50-70% cheaper for small/medium orgs
3. 🎨 **UX:** Modern, mobile-first, intuitive
4. 🔌 **Openness:** API-first, integrations
5. 🎯 **Focus:** Best sumarhús system, not everything

### Their Advantages
1. 📊 **Market share:** Already established
2. 🏢 **Complete solution:** All-in-one for large orgs
3. 🤝 **Partnerships:** Vendor relationships (hotels, etc.)
4. 📜 **Track record:** Proven with big unions

### Our Strategy: Focus → Dominate

**Phase 1 (Year 1):** Wedge into underserved segment
- Target: Small/medium orgs (5-50 properties)
- Priced out by Frimann or using Excel
- Value: Better UX + Lower price
- **Focus:** Only summer house booking (ekki allt á einu)

**Phase 2 (Year 2):** Move upmarket
- Win medium orgs FROM Frimann
- Value: Modern platform + API access
- Differentiation: 10x better að það sem við gerum

**Phase 3 (Year 3+):** Platform strategy
- Open API fyrir integrations
- Partner ecosystem (others build vouchers, grants, etc.)
- We stay focused on core: Best booking system

---

## 🚫 What We're NOT Building (Scope Discipline)

### ❌ Features We're Explicitly SKIPPING

**1. Travel Vouchers / Gift Certificates**
- **Why Frimann has it:** Legacy feature, partnership revenue
- **Why we skip it:** Not core to booking, complex partnerships
- **Alternative:** Organizations can use existing systems (Icelandair vouchers, etc.)
- **If requested:** Build API, let partners integrate

**2. Grants & Applications System**
- **Why Frimann has it:** All-in-one member services
- **Why we skip it:** Unrelated to property management
- **Alternative:** Orgs use Google Forms, custom systems
- **If requested:** Could be add-on in Year 2+, but not core

**3. Discount Club**
- **Why Frimann has it:** Member perks, partnership deals
- **Why we skip it:** Not our expertise, low margin
- **Alternative:** Integrate with existing discount platforms
- **If requested:** API for third-party discount platforms

**4. Retail / Merchandise Store**
- **Why Frimann has it:** Additional revenue stream
- **Why we skip it:** Not scalable, inventory management hell
- **Alternative:** Link to external shop (Shopify, etc.)

**5. Event Management**
- **Why orgs might want:** Manage member events, conferences
- **Why we skip:** Different product, different UX
- **Alternative:** Use existing event platforms
- **If requested:** Very low priority

**6. Forum / Social Features**
- **Why orgs might want:** Member communication
- **Why we skip:** Social platforms already exist (Facebook Groups, Slack)
- **Alternative:** Integrate with existing platforms
- **If requested:** Simple announcements only (not full forum)

**7. Payroll / Membership Fee Management**
- **Why unions need it:** Core member management
- **Why we skip:** They already have this (dk, others)
- **Alternative:** API integration with their system
- **If requested:** Read-only integration, not full system

---

### ✅ What We ARE Building (Core Focus)

**Phase 1 (MVP):**
1. Property management (CRUD, photos, details)
2. Member management (invites, roles, quotas)
3. Booking calendar (real-time, mobile-friendly)
4. Booking rules engine (quotas, fairness, priorities)
5. Admin dashboard (analytics, bulk operations)
6. Organization branding (logo, colors)
7. Email notifications
8. Mobile PWA

**Phase 2 (Scale):**
9. Advanced booking rules (waiting lists, seniority)
10. Approval workflows
11. API access (for integrations)
12. Custom domains (white-label)
13. Bulk import/export
14. Advanced analytics

**Phase 3 (Enterprise):**
15. SSO integration
16. Dedicated instances
17. Custom feature development
18. SLA guarantees
19. White-glove support

---

### 🔌 Integration Strategy (Not Building, but Enabling)

Instead of building everything, we **integrate** med existing systems:

**Member Systems Integration:**
- API to sync members from dk, Wage, or custom payroll
- Read member status, seniority, active/inactive
- Example: "Only active members can book"

**Accounting Integration:**
- Export bookings to accounting systems
- If org charges members, integrate with payment gateway
- We don't build accounting, we export data

**Discount Platforms:**
- If org wants discount club, integrate with:
  - Icelandic discount platforms
  - Corporate benefits platforms
  - Via API webhooks

**Communication Platforms:**
- Announcements via email (built-in)
- Slack/Teams webhooks for admin notifications
- SMS via third-party (Twilio) if needed

**Value proposition:**
"We're the best at summer house booking. For everything else, we integrate with your existing tools or the best-in-class platforms."

---

### 🎯 The "Steve Jobs" Product Strategy

**Our philosophy:**

> "Focus means saying NO to a hundred other good ideas."
> — Steve Jobs

**We say NO to:**
- ❌ Travel vouchers
- ❌ Grants system
- ❌ Discount club
- ❌ Merchandise
- ❌ Events
- ❌ Forums
- ❌ Payroll

**We say YES to:**
- ✅ Best booking calendar in Iceland
- ✅ Best mobile experience
- ✅ Best admin tools
- ✅ Best analytics
- ✅ Best API for integrations

**Result:**
- Frimann: Jack of all trades, master of none
- Bustadurinn.is: Master of ONE thing → Summer house booking

**Market positioning:**
"We're not trying to replace Frimann entirely. We're replacing the worst part of Frimann (booking system) with the best booking system in Iceland. Keep using what works, upgrade what doesn't."

---

## 🎯 Arkitektúr Valkostir

### Valkostur 1: Sérstakt Instance (Subdomain Model)
```
stettarfelag.bustadurinn.is
│
├── Separate Firebase project
├── Separate database
├── Custom branding per organization
└── Completely isolated data
```

**Kostir:**
- ✅ Fullkominn aðskilnaður á gögnum
- ✅ Auðvelt að custom-a fyrir stéttarfélag use case
- ✅ Betri performance (minni queries)
- ✅ Einfaldara billing (eitt subscription per instance)
- ✅ White-label ready (custom domain)

**Gallar:**
- ❌ Þarf að deploy-a sérstakt fyrir hvert skipulag
- ❌ Kostnaðarsamara (separate Firebase project per org)
- ❌ Erfitt að scale fyrir mörg skipulög (100+ organizations)
- ❌ Code duplication / maintenance overhead
- ❌ Shared features þarf að sync-a á milli instances

**Hvenær hentar:**
- Fá stór skipulög (5-10 organizations)
- Hvert skipulag vill fullkomna white-label lausn
- Enterprise contracts með SLA kröfum

---

### Valkostur 2: Multi-Tenant Architecture (Samþætt Kerfi)
```
bustadurinn.is
│
├── Individual Users (núverandi)
│   └── houses/{houseId}
│
└── Organizations (nýtt)
    ├── organizations/{orgId}
    │   ├── profile (name, logo, settings)
    │   ├── subscription
    │   └── properties[]
    │       └── houses/{houseId}
    └── members[]
        └── users with org_id
```

**Kostir:**
- ✅ Einn codebase, auðvelt að viðhalda
- ✅ Shared features fyrir alla
- ✅ Scale-ar vel (1000+ organizations)
- ✅ Centralized analytics og monitoring
- ✅ Kostnaðarhagkvæmt (eitt Firebase project)
- ✅ Cross-organization features possible (t.d. share properties)

**Gallar:**
- ❌ Flóknari data model
- ❌ White-labeling takmarkað (subdomain only, ekki custom domain)
- ❌ Performance consideration með mörgum tenants
- ❌ Security complexity (ensure data isolation)
- ❌ Billing complexity (per-org tracking)

**Hvenær hentar:**
- Mörg skipulög (10-1000+)
- SaaS model með monthly subscriptions
- Shared infrastructure æskilegt
- Viljum halda bustadurinn.is branding

---

### Valkostur 3: Hybrid Model (Blanda) ⭐ **RÁÐLAGT**
```
bustadurinn.is (main platform)
├── Individual mode (current)
│   └── Single houses
│
├── Organization mode (new)
│   ├── Small orgs: multi-tenant
│   └── Enterprise orgs: dedicated instance
│
└── White-label options
    ├── Basic: org.bustadurinn.is (subdomain)
    ├── Pro: custom.bustadurinn.is (CNAME)
    └── Enterprise: custom-domain.is (separate instance)
```

**Implementation:**
1. **Phase 1:** Bygg multi-tenant organization mode inn í núverandi kerfi
2. **Phase 2:** Bætt við "instance deployment" fyrir Enterprise customers
3. **Phase 3:** Automation fyrir að spin up nýjar instances

**Kostir:**
- ✅ Flexibility - customer velur hvað hentar
- ✅ Scale efficiently fyrir flesta
- ✅ Premium option fyrir enterprise
- ✅ Einn codebase með deployment options

---

## 🏗️ Database Schema Changes (Multi-Tenant Model)

### Nýjar Collections

#### 1. `organizations/{orgId}`
```typescript
interface Organization {
  id: string;
  name: string;                    // "Efling - stéttarfélag"
  slug: string;                    // "efling" → efling.bustadurinn.is
  type: 'union' | 'municipality' | 'company' | 'club';

  // Branding
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  custom_domain?: string;          // "sumarhus.efling.is"

  // Subscription
  subscription_tier: 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'expired';
  subscription_start: Date;
  subscription_end: Date;
  billing_email: string;

  // Settings
  max_properties: number;          // Property limit based on tier
  max_members: number;             // Member limit
  booking_rules: {
    max_days_per_year?: number;    // Per member limit
    advance_booking_days?: number; // How far ahead can book
    cooldown_days?: number;        // Days between bookings
    priority_system?: 'seniority' | 'lottery' | 'first_come';
  };

  // Admin
  admin_user_ids: string[];        // Organization admins
  created_at: Date;
  created_by: string;
}
```

#### 2. `organizations/{orgId}/members` (subcollection)
```typescript
interface OrganizationMember {
  id: string;                      // User ID
  user_id: string;
  email: string;
  name: string;

  // Membership
  member_number?: string;          // Stéttarfélags númer
  join_date: Date;
  status: 'active' | 'inactive' | 'suspended';

  // Access control
  role: 'org_admin' | 'property_manager' | 'member';
  accessible_property_ids?: string[]; // Restrict to specific properties

  // Usage tracking
  bookings_this_year: number;
  days_booked_this_year: number;

  // Priority
  priority_score?: number;         // For lottery/seniority systems
  seniority_date?: Date;
}
```

#### 3. `organization_invitations/{inviteId}`
```typescript
interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'org_admin' | 'property_manager' | 'member';
  invited_by: string;
  invited_at: Date;
  expires_at: Date;
  status: 'pending' | 'accepted' | 'expired';
  token: string;                   // Secure invite token
}
```

### Breytingar á Existing Collections

#### `houses/{houseId}` - Add organization fields
```typescript
interface House {
  // ... existing fields ...

  // NEW: Organization linking
  organization_id?: string;        // null = individual house
  organization_name?: string;      // Denormalized for display

  // NEW: Organization rules override
  org_managed: boolean;            // If true, org admins can manage
  booking_rules_override?: {       // Override org-level rules
    max_days_per_booking?: number;
    min_days_per_booking?: number;
    blackout_dates?: Date[];
  };

  // NEW: Property metadata for orgs
  property_code?: string;          // "SH-001" internal code
  category?: string;               // "A-category", "Family", "Couples"
  capacity: number;
  seasonal_availability?: {
    winter_closed?: boolean;
    summer_only?: boolean;
  };
}
```

#### `bookings/{bookingId}` - Add organization context
```typescript
interface Booking {
  // ... existing fields ...

  // NEW: Organization context
  organization_id?: string;
  member_number?: string;          // If org booking
  booking_source: 'individual' | 'organization';

  // NEW: Approval workflow (for orgs with approval)
  requires_approval?: boolean;
  approval_status?: 'pending' | 'approved' | 'denied';
  approved_by?: string;
  approved_at?: Date;
}
```

#### `users/{userId}` - Add organization membership
```typescript
interface User {
  // ... existing fields ...

  // NEW: Organization membership
  organization_ids?: string[];     // Can be member of multiple orgs
  primary_organization_id?: string;

  // NEW: Member profile
  member_profiles?: {
    [orgId: string]: {
      member_number: string;
      join_date: Date;
      role: string;
    }
  };
}
```

---

## 🎨 White-Label Strategy

### Tier 1: Basic (Subdomain)
- **URL:** `efling.bustadurinn.is`
- **Branding:** Logo og litir
- **Cost:** Innifalið í Basic subscription
- **Implementation:**
  - Slug-based routing
  - CSS variables fyrir branding
  - Logo upload til Storage

### Tier 2: Pro (CNAME)
- **URL:** `sumarhus.efling.is` → CNAME to bustadurinn.is
- **Branding:** Full branding + custom domain
- **Cost:** +X kr/mán
- **Implementation:**
  - Firebase Hosting custom domain
  - SSL cert automation
  - Organization detection via domain

### Tier 3: Enterprise (Dedicated Instance)
- **URL:** `sumarhus.efling.is` (separate Firebase)
- **Branding:** 100% white-label, custom features
- **Cost:** Enterprise pricing
- **Implementation:**
  - Separate Firebase project
  - Custom deployment
  - Dedicated support

---

## 📦 Feature Breakdown by Tier

### Basic Tier (MVP)
**Target:** Smá skipulög (5-20 hús, 50-200 félagsmenn)

**Features:**
- ✅ Organization profile með logo
- ✅ Allt að 20 properties
- ✅ Allt að 200 members
- ✅ Organization admin dashboard
- ✅ Member auto-enrollment (invite link)
- ✅ Sameiginlegt calendar view (öll hús)
- ✅ Basic booking rules:
  - Max days per year per member
  - Advance booking window
- ✅ Organization-level subscription
- ✅ Email notifications (Icelandic/English)
- ✅ Mobile app access
- ✅ Basic analytics (occupancy, top properties)

**Pricing:** 99.900 kr/ár (8.325 kr/mán)

---

### Pro Tier
**Target:** Meðalstór skipulög (20-100 hús, 200-2000 félagsmenn)

**Allt frá Basic +:**
- ✅ Allt að 100 properties
- ✅ Allt að 2000 members
- ✅ Custom domain (CNAME)
- ✅ Advanced booking rules:
  - Priority system (seniority/lottery)
  - Waiting list management
  - Cooldown periods
  - Property categories (access tiers)
- ✅ Approval workflow fyrir bookings
- ✅ Bulk operations:
  - Mass update rules
  - Bulk import properties
  - CSV member import
- ✅ Advanced analytics:
  - Revenue reporting
  - Member usage stats
  - Fair distribution metrics
- ✅ Integrations:
  - API access
  - Webhook notifications
  - Calendar sync (iCal)
- ✅ Custom email templates
- ✅ Priority support

**Pricing:** 299.900 kr/ár (24.992 kr/mán)

---

### Enterprise Tier
**Target:** Stór skipulög (100+ hús, 2000+ félagsmenn)

**Allt frá Pro +:**
- ✅ Unlimited properties & members
- ✅ Dedicated instance option
- ✅ 100% white-label
- ✅ Custom feature development
- ✅ Advanced integrations:
  - SSO (SAML/OAuth)
  - Member system integration
  - Payment gateway integration
- ✅ Multi-language support
- ✅ Dedicated account manager
- ✅ SLA guarantees (99.9% uptime)
- ✅ Custom contracts & invoicing
- ✅ Data export & backup
- ✅ Admin training

**Pricing:** Custom (byrjar á ~900.000 kr/ár)

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (3-4 vikur) - **MVP**
**Markmið:** Basic multi-tenant fyrir eitt pilot skipulag (t.d. Efling)

#### Week 1: Database & Auth
- [ ] Búa til `organizations` collection í Firestore
- [ ] Búa til `organization_members` subcollection
- [ ] Breyta `houses` til að styðja `organization_id`
- [ ] Breyta `bookings` til að tracka organization context
- [ ] Uppfæra Firestore security rules fyrir organization data isolation
- [ ] Búa til organization role system (org_admin, member)
- [ ] Unit tests fyrir nýja data model

#### Week 2: Organization Admin Dashboard
- [ ] Nýja route: `/org/:orgSlug/admin`
- [ ] Organization overview page:
  - Stats: Fjöldi húsa, félagsmenn, bookings
  - Quick actions: Add property, Invite member
- [ ] Properties management:
  - List view með öllum húsum
  - Add/edit/archive properties
  - Bulk operations (beta)
- [ ] Members management:
  - List view með öllum félagsmönnum
  - Invite system með email
  - Role assignment
  - Usage tracking (bookings this year)
- [ ] Settings page:
  - Organization profile
  - Branding (logo, colors)
  - Booking rules
  - Subscription info

#### Week 3: Member Experience
- [ ] Organization signup flow:
  - Member invitation email
  - Signup með org context
  - Auto-join organization
- [ ] Organization property browser:
  - `/org/:orgSlug/properties`
  - Filter by category, capacity, location
  - Availability calendar
- [ ] Organization booking flow:
  - Modified booking form með member context
  - Quota validation (max days check)
  - Confirmation email með org branding
- [ ] Member dashboard:
  - My organization bookings
  - Remaining quota display
  - Organization house favorites

#### Week 4: Billing & Polish
- [ ] Organization subscription management:
  - Subscription status tracking
  - Trial period (30 days)
  - Expiration handling
- [ ] Invoice creation integration (Payday API)
- [ ] Email templates fyrir organizations:
  - Welcome email
  - Invitation email
  - Booking confirmation
  - Payment reminders
- [ ] Analytics dashboard:
  - Occupancy rate per property
  - Top booked properties
  - Member activity
- [ ] Testing með pilot customer
- [ ] Documentation fyrir org admins

**Deliverable:** Virkt MVP fyrir eitt pilot skipulag

---

### Phase 2: Scale & Advanced Features (4-5 vikur)
**Markmið:** Multi-organization support + Pro tier features

#### Week 5-6: Multi-Organization Infrastructure
- [ ] Slug-based routing: `efling.bustadurinn.is`
- [ ] Organization detection middleware
- [ ] Organization switcher fyrir users með multiple orgs
- [ ] Performance optimization:
  - Firestore composite indexes
  - Query caching með React Query
  - Pagination fyrir large datasets
- [ ] Super Admin tools:
  - Organization management
  - Impersonate org admin
  - Usage analytics across all orgs

#### Week 7-8: Pro Features
- [ ] Advanced booking rules:
  - Priority system implementation (seniority calculation)
  - Waiting list system
  - Cooldown period enforcement
  - Property category access tiers
- [ ] Approval workflow:
  - Pending bookings queue
  - Admin approval interface
  - Email notifications
- [ ] Bulk operations:
  - CSV import fyrir properties
  - CSV import fyrir members
  - Mass update property rules
- [ ] API layer:
  - REST API fyrir organizations
  - API keys management
  - Rate limiting per org
  - Webhook notifications

#### Week 9: White-Label Basic
- [ ] CSS variables til að styðja custom branding
- [ ] Logo upload og display
- [ ] Color customization UI
- [ ] Organization-branded emails
- [ ] Mobile app branding support

**Deliverable:** Pro tier tilbúið, 5-10 organizations live

---

### Phase 3: Enterprise & White-Label Full (4-6 vikur)
**Markmið:** Custom domains + dedicated instances

#### Week 10-11: Custom Domain Support
- [ ] Firebase Hosting custom domain setup
- [ ] SSL cert automation
- [ ] Domain verification flow
- [ ] DNS configuration guide
- [ ] Multi-domain routing

#### Week 12-13: Dedicated Instance Automation
- [ ] Infrastructure as Code (Terraform/Firebase CLI)
- [ ] Automated Firebase project creation
- [ ] Automated deployment pipeline
- [ ] Data migration scripts
- [ ] Instance monitoring setup

#### Week 14-15: Enterprise Features
- [ ] SSO integration (SAML/OAuth)
- [ ] Advanced integrations framework
- [ ] Custom analytics builder
- [ ] Multi-language support expansion
- [ ] White-glove onboarding process
- [ ] Enterprise contracts & SLA tooling

**Deliverable:** Enterprise-ready með dedicated instance option

---

### Phase 4: Optimization & Growth (Ongoing)
- [ ] Performance monitoring og optimization
- [ ] A/B testing framework
- [ ] Customer feedback loop
- [ ] Feature requests prioritization
- [ ] Marketing site fyrir organizations
- [ ] Case studies og testimonials
- [ ] Partner program (payroll systems, membership platforms)
- [ ] API marketplace fyrir integrations

---

## 🎪 Go-to-Market Strategy

### Target Customers (Priority Order)

#### 1. **Stéttarfélög** (Highest Priority)
**Potential customers:**
- Efling (30,000+ members, ~5-10 sumarhús?)
- VR (28,000+ members)
- Strax
- Eflir
- LÍN
- Sjúkraliðar

**Value prop:**
- "Láttu félagsmenn njóta sumarhúsa án þess að ráðnast í Excel skjöl"
- Fair distribution með priority systems
- Zero admin overhead

**Pilot approach:**
- Bjóða einu stéttarfélagi free pilot í 3 mánuði
- Build case study
- Use as reference fyrir aðra

#### 2. **Sveitarfélög**
**Potential customers:**
- Reykjavíkurborg (starfsmannasumarhús)
- Akureyrarbær
- Hafnarfjörður

**Value prop:**
- "Save HR time on summer house management"
- Transparent booking fyrir alla starfsmenn
- Analytics fyrir nýtingu

#### 3. **Fyrirtæki**
**Potential customers:**
- Arion banki
- Landsbankinn
- Síminn
- Icelandair

**Value prop:**
- "Betri starfsmannakjör án administration"
- Fyrirtækisbókun fyrir clients/partners
- Usage tracking fyrir tax purposes

#### 4. **Íþrótta- og Áhugamálafélög**
**Potential customers:**
- KR, FH, Valur (íþróttafélög með sumarhús)
- Skákfélag Reykjavíkur
- Göngufólk

**Value prop:**
- "Affordable SaaS fyrir félag fremur en custom development"
- Member perks með minimal effort

---

### Pricing Strategy

| Tier | Properties | Members | Price/Year | Price/Month |
|------|-----------|---------|------------|-------------|
| **Basic** | 5-20 | 50-200 | 99.900 kr | 8.325 kr |
| **Pro** | 20-100 | 200-2000 | 299.900 kr | 24.992 kr |
| **Enterprise** | Unlimited | Unlimited | Custom | Custom (frá 75.000 kr/mán) |

**Discounts:**
- 20% afsláttur fyrir árlega greiðslu (vs monthly)
- Volume discount: 30+ properties = -15%
- Pilot customers: 50% off first year

**Add-ons:**
- Custom domain (CNAME): +10.000 kr/mán
- Dedicated instance: +50.000 kr/mán
- Premium support: +15.000 kr/mán
- Custom feature development: Project-based

---

### Sales Approach

#### Month 1-2: Pilot & Validation
1. **Identify pilot customer** (ideally medium-sized union, 10-30 properties)
2. **Free 3-month pilot** með hands-on support
3. **Gather feedback** og iterate
4. **Build case study** með metrics (time saved, member satisfaction)

#### Month 3-4: Early Adopters
1. **Approach 5-10 target organizations** með case study
2. **Founder-led sales** (þú eða ég)
3. **Offer early adopter pricing** (50% off year 1)
4. **Goal:** 3-5 paying customers

#### Month 5-12: Scale
1. **Marketing site** fyrir organizations (bustadurinn.is/organizations)
2. **Content marketing**: Blog posts, guides fyrir HR/admin
3. **Partnerships**: Integrate með payroll systems (Wage, etc.)
4. **Referral program**: 20% commission fyrir referrals
5. **Goal:** 20-30 organizations

---

## 🛠️ Technical Decisions

### Infrastructure

**Firebase Project Structure:**
- **Option A (Multi-tenant):** One project, organization-based data isolation
  - Pro: Cost-effective, easier to manage
  - Con: More complex security rules
- **Option B (Per-org projects):** Separate project per enterprise customer
  - Pro: Complete isolation, custom configs
  - Con: Expensive, harder to maintain

**Recommendation:** Start with **Option A**, offer **Option B** for Enterprise tier

**Firestore Quotas:**
- Write: 20,000/minute (shared across orgs)
- Read: 1,000,000/minute
- Storage: 1GB free, then $0.18/GB

**Scaling consideration:**
- If 50 organizations × 50 properties × 100 members = 250,000 users
- Estimate: 500 concurrent users → ~5,000 reads/min (well within limits)

---

### Authentication & Authorization

**Organization Access Control:**
```typescript
// Firestore rule example
match /organizations/{orgId} {
  allow read: if isOrgMember(orgId);
  allow write: if isOrgAdmin(orgId);

  match /members/{memberId} {
    allow read: if isOrgMember(orgId);
    allow write: if isOrgAdmin(orgId);
  }
}

match /houses/{houseId} {
  allow read: if resource.data.organization_id == null
              || isOrgMember(resource.data.organization_id);
  allow write: if isHouseOwner(houseId)
               || isOrgAdmin(resource.data.organization_id);
}
```

**Role hierarchy:**
```
super_admin (bustadurinn.is team)
  └── org_admin (organization admin)
      ├── property_manager (manages specific properties)
      └── member (can book)
```

---

### Routing Strategy

**URL Structure:**

**Multi-tenant (subdomain):**
```
efling.bustadurinn.is/              → Organization home
efling.bustadurinn.is/properties    → Browse properties
efling.bustadurinn.is/calendar      → Unified calendar
efling.bustadurinn.is/admin         → Admin dashboard
efling.bustadurinn.is/profile       → Member profile
```

**Implementation:**
- Detect org via subdomain in middleware
- Store org context in Zustand
- Filter all queries by `organization_id`

**Custom domain (Pro/Enterprise):**
```
sumarhus.efling.is → CNAME bustadurinn.is
```
- Firebase Hosting custom domain
- Organization detection via domain mapping table

---

### Performance Optimization

**Strategies:**
1. **Pagination:** Max 50 items per page for properties/members
2. **Caching:** React Query fyrir org data (5min cache)
3. **Indexes:** Composite indexes á all organization queries
4. **Denormalization:** Store org name på houses för display
5. **Lazy loading:** Code splitting per route
6. **Image optimization:** WebP format, responsive sizes

**Monitoring:**
- Firebase Performance Monitoring
- Sentry fyrir errors
- Custom analytics for org usage
- Query performance tracking

---

## 📊 Success Metrics

### Technical KPIs
- [ ] Page load time < 2s (org dashboard)
- [ ] Booking creation < 1s
- [ ] 99.5% uptime
- [ ] Zero data leakage incidents
- [ ] API response time p95 < 500ms

### Business KPIs

**Year 1 Goals:**
- [ ] 10 paying organizations
- [ ] 1,000+ organization members using system
- [ ] 50+ properties managed
- [ ] 5,000+ organization bookings processed
- [ ] ARR: 2M kr (10 orgs × 200k avg)
- [ ] Customer satisfaction: 4.5/5
- [ ] Churn: < 10%

**Year 2 Goals:**
- [ ] 50 paying organizations
- [ ] 10,000+ members
- [ ] 500+ properties
- [ ] ARR: 12M kr
- [ ] Launch Enterprise tier
- [ ] First dedicated instance customer

---

## ⚠️ Risks & Mitigations

### Technical Risks

**Risk:** Data isolation bugs (member A sees member B's bookings)
**Mitigation:**
- Extensive Firestore rules testing
- E2E tests með multiple orgs
- Security audit before launch
- Penetration testing

**Risk:** Performance degradation með multiple orgs
**Mitigation:**
- Load testing með simulated load (100 concurrent orgs)
- Query optimization
- Caching strategy
- Monitoring og alerts

**Risk:** Complex billing med multiple tiers
**Mitigation:**
- Start simple (flat fee per tier)
- Use Stripe Billing for automation
- Clear upgrade/downgrade flows

---

### Business Risks

**Risk:** Stéttarfélög hafa núþegar own system
**Mitigation:**
- Emphasize migration support
- Offer free trial til að prove value
- Integration með existing membership systems

**Risk:** Low willingness to pay
**Mitigation:**
- ROI calculator (time saved × hourly wage)
- Free tier fyrir smá félag
- Flexible payment terms

**Risk:** Slow sales cycle (B2B)
**Mitigation:**
- Founder-led sales fyrir first 10 customers
- Quick pilot implementation (2 weeks)
- Strong case studies

---

## 💰 Cost Estimate

### Development Costs
- **Phase 1 (MVP):** 150-200 klst × 15.000 kr/klst = **~2.5M kr**
- **Phase 2 (Scale):** 200-250 klst × 15.000 kr/klst = **~3.5M kr**
- **Phase 3 (Enterprise):** 200-250 klst × 15.000 kr/klst = **~3.5M kr**

**Total development:** ~9.5M kr (can phase over 6-12 months)

### Infrastructure Costs (Monthly)

**Firebase (per organization on multi-tenant):**
- Firestore: ~$50/mán (for 10 orgs)
- Storage: ~$20/mán
- Hosting: ~$10/mán
- Authentication: Free (< 50k MAU)

**Other:**
- Domain: 500 kr/mán
- Email (SendGrid): $15/mán
- Monitoring (Sentry): $26/mán
- Analytics: Free (Plausible self-hosted)

**Total:** ~$115/mán (≈16.000 kr/mán) fyrir 10 organizations

**Margin:**
- Revenue (10 orgs × Basic tier): 83.250 kr/mán
- Infrastructure cost: 16.000 kr/mán
- **Gross margin: ~80%** (excellent SaaS margin)

---

## 🎬 Next Steps

### Immediate Actions (This Week)
1. **Validate demand:**
   - [ ] Reach out til 3-5 stéttarfélaga (informal chat)
   - [ ] Gauge interest og feature priority
   - [ ] Identify pilot candidate

2. **Technical validation:**
   - [ ] Prototype organization data model í Firestore
   - [ ] Test security rules for isolation
   - [ ] Estimate Firebase costs með realistic load

3. **Business planning:**
   - [ ] Finalize pricing strategy
   - [ ] Create sales deck
   - [ ] Draft pilot agreement

### Week 2-3: Build Decision
- [ ] Review pilot feedback
- [ ] Decide: Multi-tenant vs Dedicated instance first
- [ ] Commit to Phase 1 timeline
- [ ] Allocate development resources

### Week 4+: Execute Phase 1
- [ ] Start development (Week 1-4 plan above)
- [ ] Weekly checkins með pilot customer
- [ ] Iterate based on feedback

---

## 📝 Open Questions

### Product Questions
- [ ] **Booking approval:** Should all org bookings require admin approval, or only for certain members?
- [ ] **Payment model:** Should members pay per booking, or is it included in org subscription?
- [ ] **Cancellation policy:** Who can cancel bookings? What's the notice period?
- [ ] **Maintenance bookings:** How do org admins block dates for maintenance?
- [ ] **Guest access:** Can org members invite non-members as guests?

### Technical Questions
- [ ] **Member sync:** Do we integrate með existing membership systems, or manual import only?
- [ ] **SSO:** Is SSO required for MVP, or can defer til Enterprise?
- [ ] **Mobile app:** Do we need native app changes, or is web app enough?
- [ ] **Offline mode:** Should booking work offline (PWA)?

### Business Questions
- [ ] **Pilot terms:** What do we offer pilot customer (free? discounted? duration?)
- [ ] **Support model:** Email only? Phone? Dedicated slack channel?
- [ ] **Onboarding:** Do we do hands-on onboarding, or self-service?
- [ ] **Contracts:** Annual only, or allow monthly?

---

## 🙋 Decision Required: Which Path?

### Option A: Multi-Tenant First ⭐ **RECOMMENDED**
**Rationale:**
- Faster to market (3-4 weeks vs 6-8 weeks)
- Lower infrastructure cost
- Easier to iterate
- Can add dedicated instances later for Enterprise

**Timeline:** Phase 1 MVP in 4 weeks → Pilot live

---

### Option B: Dedicated Instance First
**Rationale:**
- Better for large orgs concerned about data isolation
- Easier to customize per org
- Premium positioning

**Timeline:** 6-8 weeks til MVP (more complex setup)

---

### Option C: Build Both in Parallel
**Rationale:**
- Maximum flexibility
- Target both SMB and Enterprise

**Timeline:** 8-10 weeks (2x development effort)
**Cost:** 2x development cost

---

## ✅ Recommendation

**Path:** Multi-Tenant First (Option A)

**Why:**
1. Validate product-market fit quickly
2. Lower upfront investment
3. Can scale to 50+ orgs easily
4. Add Enterprise tier later when we have traction

**Pilot customer profile:**
- 10-30 properties
- 200-1000 members
- Tech-savvy admin team
- Willing to give feedback

**Pilot deal:**
- 3 months free
- Weekly feedback sessions
- Feature requests considered
- Testimonial/case study in exchange

**Phase 1 deliverable:**
Fully working org mode fyrir 1 pilot customer, validating core features before scaling.

---

---

## 📐 Detailed Technical Implementation

### 1. Organization Service Layer

**File:** `/src/services/organizationService.ts`

```typescript
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import type { Organization, OrganizationMember } from '@/types/organization';

export class OrganizationService {
  /**
   * Get organization by slug (for subdomain routing)
   */
  static async getBySlug(slug: string): Promise<Organization | null> {
    const q = query(
      collection(db, 'organizations'),
      where('slug', '==', slug),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as Organization;
  }

  /**
   * Get organization by ID
   */
  static async getById(orgId: string): Promise<Organization | null> {
    const docRef = doc(db, 'organizations', orgId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Organization;
  }

  /**
   * Create new organization
   */
  static async create(
    data: Omit<Organization, 'id' | 'created_at'>,
    createdBy: string
  ): Promise<Organization> {
    const orgRef = doc(collection(db, 'organizations'));

    const org: Organization = {
      ...data,
      id: orgRef.id,
      created_at: Timestamp.now(),
      created_by: createdBy,
      subscription_status: 'trial',
      subscription_start: Timestamp.now(),
      subscription_end: Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      ),
    };

    await setDoc(orgRef, org);

    // Auto-add creator as org admin
    await this.addMember(org.id, {
      user_id: createdBy,
      role: 'org_admin',
      status: 'active',
      join_date: Timestamp.now(),
    });

    return org;
  }

  /**
   * Update organization
   */
  static async update(
    orgId: string,
    updates: Partial<Organization>
  ): Promise<void> {
    const orgRef = doc(db, 'organizations', orgId);
    await updateDoc(orgRef, updates);
  }

  /**
   * Get all properties for organization
   */
  static async getProperties(orgId: string) {
    const q = query(
      collection(db, 'houses'),
      where('organization_id', '==', orgId),
      orderBy('name')
    );

    return getDocs(q);
  }

  /**
   * Get all members for organization
   */
  static async getMembers(orgId: string): Promise<OrganizationMember[]> {
    const membersRef = collection(db, 'organizations', orgId, 'members');
    const snapshot = await getDocs(membersRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as OrganizationMember[];
  }

  /**
   * Add member to organization
   */
  static async addMember(
    orgId: string,
    member: Partial<OrganizationMember>
  ): Promise<void> {
    const memberRef = doc(db, 'organizations', orgId, 'members', member.user_id!);

    await setDoc(memberRef, {
      ...member,
      join_date: member.join_date || Timestamp.now(),
      status: member.status || 'active',
      bookings_this_year: 0,
      days_booked_this_year: 0,
    });
  }

  /**
   * Check if user is org admin
   */
  static async isOrgAdmin(orgId: string, userId: string): Promise<boolean> {
    const memberRef = doc(db, 'organizations', orgId, 'members', userId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) return false;

    const member = memberSnap.data() as OrganizationMember;
    return member.role === 'org_admin';
  }

  /**
   * Check if user is org member (any role)
   */
  static async isOrgMember(orgId: string, userId: string): Promise<boolean> {
    const memberRef = doc(db, 'organizations', orgId, 'members', userId);
    const memberSnap = await getDoc(memberRef);

    return memberSnap.exists();
  }

  /**
   * Get member's remaining quota for year
   */
  static async getMemberQuota(
    orgId: string,
    userId: string
  ): Promise<{ used: number; remaining: number; total: number }> {
    const org = await this.getById(orgId);
    if (!org) throw new Error('Organization not found');

    const memberRef = doc(db, 'organizations', orgId, 'members', userId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) throw new Error('Member not found');

    const member = memberSnap.data() as OrganizationMember;
    const maxDays = org.booking_rules.max_days_per_year || Infinity;

    return {
      used: member.days_booked_this_year || 0,
      remaining: maxDays - (member.days_booked_this_year || 0),
      total: maxDays,
    };
  }

  /**
   * Increment member's booking count
   */
  static async incrementMemberBookings(
    orgId: string,
    userId: string,
    days: number
  ): Promise<void> {
    const memberRef = doc(db, 'organizations', orgId, 'members', userId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) return;

    const member = memberSnap.data() as OrganizationMember;

    await updateDoc(memberRef, {
      bookings_this_year: (member.bookings_this_year || 0) + 1,
      days_booked_this_year: (member.days_booked_this_year || 0) + days,
    });
  }
}
```

---

### 2. Organization Context (Zustand Store)

**File:** `/src/stores/organizationStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Organization } from '@/types/organization';
import { OrganizationService } from '@/services/organizationService';

interface OrganizationStore {
  // State
  currentOrg: Organization | null;
  isOrgMode: boolean;
  isOrgAdmin: boolean;
  userQuota: { used: number; remaining: number; total: number } | null;

  // Actions
  setCurrentOrg: (org: Organization | null) => void;
  loadOrgFromSlug: (slug: string) => Promise<void>;
  loadOrgFromDomain: (domain: string) => Promise<void>;
  checkUserRole: (userId: string) => Promise<void>;
  refreshQuota: (userId: string) => Promise<void>;
  clearOrg: () => void;
}

export const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set, get) => ({
      currentOrg: null,
      isOrgMode: false,
      isOrgAdmin: false,
      userQuota: null,

      setCurrentOrg: (org) => {
        set({
          currentOrg: org,
          isOrgMode: !!org,
        });
      },

      loadOrgFromSlug: async (slug: string) => {
        try {
          const org = await OrganizationService.getBySlug(slug);
          if (org) {
            set({
              currentOrg: org,
              isOrgMode: true,
            });
          }
        } catch (error) {
          console.error('Failed to load organization:', error);
          set({ currentOrg: null, isOrgMode: false });
        }
      },

      loadOrgFromDomain: async (domain: string) => {
        // Map custom domains to organizations
        // TODO: Implement domain mapping table in Firestore
        const slug = domain.split('.')[0]; // Simple implementation
        await get().loadOrgFromSlug(slug);
      },

      checkUserRole: async (userId: string) => {
        const { currentOrg } = get();
        if (!currentOrg) return;

        const isAdmin = await OrganizationService.isOrgAdmin(
          currentOrg.id,
          userId
        );

        set({ isOrgAdmin: isAdmin });
      },

      refreshQuota: async (userId: string) => {
        const { currentOrg } = get();
        if (!currentOrg) return;

        try {
          const quota = await OrganizationService.getMemberQuota(
            currentOrg.id,
            userId
          );
          set({ userQuota: quota });
        } catch (error) {
          console.error('Failed to load quota:', error);
        }
      },

      clearOrg: () => {
        set({
          currentOrg: null,
          isOrgMode: false,
          isOrgAdmin: false,
          userQuota: null,
        });
      },
    }),
    {
      name: 'organization-storage',
      partiallyPersist: (state) => ({
        currentOrg: state.currentOrg,
        isOrgMode: state.isOrgMode,
      }),
    }
  )
);
```

---

### 3. Organization Middleware (Route Detection)

**File:** `/src/middleware/organizationMiddleware.ts`

```typescript
import { useEffect } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * Organization middleware hook
 * Detects organization from:
 * 1. Subdomain (efling.bustadurinn.is)
 * 2. Custom domain (sumarhus.efling.is)
 * 3. URL path (/org/:slug)
 */
export function useOrganizationMiddleware() {
  const { loadOrgFromSlug, loadOrgFromDomain, checkUserRole, clearOrg } =
    useOrganizationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    detectAndLoadOrganization();
  }, [user]);

  async function detectAndLoadOrganization() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // Check if subdomain (e.g., efling.bustadurinn.is)
    if (hostname.includes('.bustadurinn.is') && !hostname.startsWith('www')) {
      const slug = hostname.split('.')[0];
      await loadOrgFromSlug(slug);

      if (user) {
        await checkUserRole(user.uid);
      }
      return;
    }

    // Check if custom domain (e.g., sumarhus.efling.is)
    if (!hostname.includes('bustadurinn.is') && hostname !== 'localhost') {
      await loadOrgFromDomain(hostname);

      if (user) {
        await checkUserRole(user.uid);
      }
      return;
    }

    // Check if path-based (e.g., /org/efling)
    const orgMatch = pathname.match(/^\/org\/([^/]+)/);
    if (orgMatch) {
      const slug = orgMatch[1];
      await loadOrgFromSlug(slug);

      if (user) {
        await checkUserRole(user.uid);
      }
      return;
    }

    // Not in org mode
    clearOrg();
  }
}
```

---

### 4. Organization Admin Dashboard Component

**File:** `/src/pages/org/[slug]/admin/index.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOrganizationStore } from '@/stores/organizationStore';
import { OrganizationService } from '@/services/organizationService';
import { Building2, Users, Calendar, Settings } from 'lucide-react';

export default function OrgAdminDashboard() {
  const { slug } = useParams();
  const { currentOrg, isOrgAdmin } = useOrganizationStore();
  const [stats, setStats] = useState({
    propertiesCount: 0,
    membersCount: 0,
    bookingsThisMonth: 0,
    occupancyRate: 0,
  });

  useEffect(() => {
    if (currentOrg) {
      loadStats();
    }
  }, [currentOrg]);

  async function loadStats() {
    if (!currentOrg) return;

    // Load properties
    const properties = await OrganizationService.getProperties(currentOrg.id);

    // Load members
    const members = await OrganizationService.getMembers(currentOrg.id);

    // TODO: Load bookings for current month
    // TODO: Calculate occupancy rate

    setStats({
      propertiesCount: properties.size,
      membersCount: members.length,
      bookingsThisMonth: 0,
      occupancyRate: 0,
    });
  }

  if (!isOrgAdmin) {
    return (
      <div className="p-8 text-center">
        <p>You do not have admin access to this organization.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {currentOrg?.name} - Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your organization's properties and members
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Building2 className="w-6 h-6" />}
          label="Properties"
          value={stats.propertiesCount}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Members"
          value={stats.membersCount}
          color="green"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="Bookings This Month"
          value={stats.bookingsThisMonth}
          color="purple"
        />
        <StatCard
          icon={<Settings className="w-6 h-6" />}
          label="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard
          title="Manage Properties"
          description="Add, edit, or remove properties"
          href={`/org/${slug}/admin/properties`}
          icon={<Building2 />}
        />
        <QuickActionCard
          title="Manage Members"
          description="Invite members and manage access"
          href={`/org/${slug}/admin/members`}
          icon={<Users />}
        />
        <QuickActionCard
          title="Organization Settings"
          description="Update booking rules and branding"
          href={`/org/${slug}/admin/settings`}
          icon={<Settings />}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]} mb-4`}>
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function QuickActionCard({ title, description, href, icon }) {
  return (
    <a
      href={href}
      className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="text-blue-600">{icon}</div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </a>
  );
}
```

---

### 5. Firestore Security Rules (Organizations)

**File:** `firestore.rules` (additions)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOrgMember(orgId) {
      return exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
    }

    function isOrgAdmin(orgId) {
      let member = get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
      return member.data.role == 'org_admin';
    }

    function isSuperAdmin() {
      let userRole = get(/databases/$(database)/documents/user_roles/$(request.auth.uid));
      return userRole.data.system_role == 'super_admin';
    }

    // Organizations collection
    match /organizations/{orgId} {
      // Anyone can read org info (for public pages)
      allow read: if true;

      // Only super admins can create orgs
      allow create: if isSuperAdmin();

      // Org admins can update their org
      allow update: if isOrgAdmin(orgId) || isSuperAdmin();

      // Only super admins can delete orgs
      allow delete: if isSuperAdmin();

      // Organization members subcollection
      match /members/{memberId} {
        // Org members can read member list
        allow read: if isOrgMember(orgId);

        // Org admins can manage members
        allow create, update, delete: if isOrgAdmin(orgId) || isSuperAdmin();
      }
    }

    // Houses collection (updated)
    match /houses/{houseId} {
      // Read access:
      // - Individual houses: owner/member
      // - Org houses: org members
      allow read: if resource.data.organization_id == null
        ? (request.auth.uid in resource.data.owner_ids ||
           request.auth.uid == resource.data.manager_id)
        : isOrgMember(resource.data.organization_id);

      // Write access:
      // - Individual houses: owner/manager
      // - Org houses: org admins
      allow write: if resource.data.organization_id == null
        ? (request.auth.uid in resource.data.owner_ids ||
           request.auth.uid == resource.data.manager_id ||
           isSuperAdmin())
        : (isOrgAdmin(resource.data.organization_id) || isSuperAdmin());

      // Bookings subcollection (updated)
      match /bookings/{bookingId} {
        // Read: house access + org member access
        allow read: if get(/databases/$(database)/documents/houses/$(houseId)).data.organization_id == null
          ? true // Individual house logic (existing)
          : isOrgMember(get(/databases/$(database)/documents/houses/$(houseId)).data.organization_id);

        // Create: must be org member for org houses
        allow create: if get(/databases/$(database)/documents/houses/$(houseId)).data.organization_id == null
          ? true // Individual house logic (existing)
          : isOrgMember(request.resource.data.organization_id);

        // Update/Delete: booking owner or org admin
        allow update, delete: if request.auth.uid == resource.data.user_id
          || isOrgAdmin(resource.data.organization_id)
          || isSuperAdmin();
      }
    }

    // Organization invitations
    match /organization_invitations/{inviteId} {
      // Anyone can read their own invitations by email
      allow read: if request.auth.token.email == resource.data.email;

      // Org admins can create invitations
      allow create: if isOrgAdmin(request.resource.data.organization_id);

      // Invited user can update to accept
      allow update: if request.auth.token.email == resource.data.email;

      // Org admins can delete
      allow delete: if isOrgAdmin(resource.data.organization_id);
    }
  }
}
```

---

### 6. Booking Validation with Organization Rules

**File:** `/src/services/bookingValidation.ts`

```typescript
import { OrganizationService } from './organizationService';
import { differenceInDays } from 'date-fns';
import type { Booking } from '@/types/models';

export class BookingValidationService {
  /**
   * Validate booking against organization rules
   */
  static async validateOrgBooking(
    organizationId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ valid: boolean; error?: string }> {
    const org = await OrganizationService.getById(organizationId);
    if (!org) {
      return { valid: false, error: 'Organization not found' };
    }

    // Check if user is member
    const isMember = await OrganizationService.isOrgMember(organizationId, userId);
    if (!isMember) {
      return { valid: false, error: 'You are not a member of this organization' };
    }

    const days = differenceInDays(endDate, startDate);

    // Check max days per booking
    if (org.booking_rules.max_days_per_booking) {
      if (days > org.booking_rules.max_days_per_booking) {
        return {
          valid: false,
          error: `Maximum ${org.booking_rules.max_days_per_booking} days per booking`,
        };
      }
    }

    // Check min days per booking
    if (org.booking_rules.min_days_per_booking) {
      if (days < org.booking_rules.min_days_per_booking) {
        return {
          valid: false,
          error: `Minimum ${org.booking_rules.min_days_per_booking} days per booking`,
        };
      }
    }

    // Check advance booking window
    if (org.booking_rules.advance_booking_days) {
      const daysUntilStart = differenceInDays(startDate, new Date());
      if (daysUntilStart > org.booking_rules.advance_booking_days) {
        return {
          valid: false,
          error: `Cannot book more than ${org.booking_rules.advance_booking_days} days in advance`,
        };
      }
    }

    // Check yearly quota
    if (org.booking_rules.max_days_per_year) {
      const quota = await OrganizationService.getMemberQuota(organizationId, userId);

      if (quota.remaining < days) {
        return {
          valid: false,
          error: `Insufficient quota. You have ${quota.remaining} days remaining this year.`,
        };
      }
    }

    // Check cooldown period
    if (org.booking_rules.cooldown_days) {
      // TODO: Check last booking end date
      // If (today - lastBookingEnd) < cooldown_days, reject
    }

    return { valid: true };
  }

  /**
   * Validate booking conflicts
   */
  static async checkConflicts(
    houseId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<Booking[]> {
    // TODO: Query Firestore for overlapping bookings
    // Return array of conflicting bookings
    return [];
  }
}
```

---

## 🎨 Detailed UI/UX Flows

### Flow 1: Organization Signup (Admin Creates Org)

#### Step 1: Landing Page
**URL:** `bustadurinn.is/organizations`

```
┌─────────────────────────────────────────────┐
│                                             │
│      Manage Your Organization's            │
│         Summer Houses Effortlessly          │
│                                             │
│  [Try Free for 30 Days]  [Book Demo]       │
│                                             │
│  ✓ Real-time booking calendar               │
│  ✓ Member management                        │
│  ✓ Fair distribution rules                  │
│                                             │
│  Trusted by [X] organizations in Iceland    │
│                                             │
│  [Compare with Frimann.is →]                │
│                                             │
└─────────────────────────────────────────────┘
```

#### Step 2: Sign Up Form
**URL:** `bustadurinn.is/organizations/signup`

```
┌─────────────────────────────────────────────┐
│  Create Your Organization                   │
│                                             │
│  Organization Name *                        │
│  [Efling - stéttarfélag               ]    │
│                                             │
│  URL Slug *                                 │
│  [efling] .bustadurinn.is                  │
│  ✓ Available                                │
│                                             │
│  Organization Type *                        │
│  ( ) Labor Union                            │
│  ( ) Municipality                           │
│  ( ) Company                                │
│  ( ) Club/Association                       │
│                                             │
│  Number of Properties                       │
│  [15]                                       │
│                                             │
│  Number of Members (approx)                 │
│  [1200]                                     │
│                                             │
│  Billing Email *                            │
│  [admin@efling.is                     ]    │
│                                             │
│  Recommended Plan: Pro (299.900 kr/year)    │
│                                             │
│  [Start 30-Day Free Trial →]                │
│                                             │
│  No credit card required                    │
│                                             │
└─────────────────────────────────────────────┘
```

#### Step 3: Onboarding Wizard

**Screen 1: Welcome**
```
Welcome to Bustadurinn.is!

Let's get your organization set up in 4 easy steps:
1. ✓ Basic info
2. → Add properties
3. Invite members
4. Configure booking rules

[Continue →]
```

**Screen 2: Add Properties**
```
Add Your First Property

You can add properties one by one, or import a CSV later.

Property Name: [Sumarhús við Þingvallavatn]
Address: [Þingvallavegur 123]
Capacity: [6] people
Category: [Family Home ▼]

[+ Add Another Property]  [Skip for Now]  [Continue →]
```

**Screen 3: Invite Members**
```
Invite Your Members

Send email invitations to your members:

Email addresses (one per line):
[member1@email.is
member2@email.is
member3@email.is]

Or [Upload CSV →]

Role: [Member ▼]

[Send Invitations]  [Skip for Now]  [Continue →]
```

**Screen 4: Booking Rules**
```
Configure Booking Rules

Max days per year per member: [14] days
Advance booking window: [90] days
Cooldown between bookings: [7] days

Priority system:
( ) First-come, first-served
(•) Seniority (join date)
( ) Lottery (random)

[Save & Go to Dashboard →]
```

---

### Flow 2: Member Books a Property

#### Step 1: Browse Properties
**URL:** `efling.bustadurinn.is/properties`

```
┌─────────────────────────────────────────────┐
│  Efling - Sumarhús                          │
│                                             │
│  [Search...] [Filter ▼] [Map View]         │
│                                             │
│  Your Quota: 8 days remaining (6/14 used)   │
│                                             │
│  ┌────────────────┐  ┌────────────────┐    │
│  │ [Image]        │  │ [Image]        │    │
│  │                │  │                │    │
│  │ Þingvallavatn  │  │ Mývatn House   │    │
│  │ 6 people       │  │ 4 people       │    │
│  │ ★★★★☆ (12)     │  │ ★★★★★ (24)     │    │
│  │                │  │                │    │
│  │ [View Details] │  │ [View Details] │    │
│  └────────────────┘  └────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

#### Step 2: Property Details
```
┌─────────────────────────────────────────────┐
│  Sumarhús við Þingvallavatn                 │
│                                             │
│  [Gallery: 5 photos →]                      │
│                                             │
│  📍 Þingvallavegur 123, South Iceland       │
│  👥 Capacity: 6 people                      │
│  🏷️ Category: Family Home                   │
│                                             │
│  Amenities:                                 │
│  ✓ WiFi  ✓ Hot tub  ✓ BBQ  ✓ Lake view     │
│                                             │
│  Availability Calendar:                     │
│  [Interactive calendar showing:             │
│   - Green: Available                        │
│   - Red: Booked                             │
│   - Your bookings: Highlighted blue]        │
│                                             │
│  Selected: June 15 - June 22 (7 days)       │
│                                             │
│  ⚠️ This will use 7 of your 8 remaining days│
│                                             │
│  [Book Now →]                               │
│                                             │
└─────────────────────────────────────────────┘
```

#### Step 3: Booking Confirmation
```
┌─────────────────────────────────────────────┐
│  Confirm Your Booking                       │
│                                             │
│  Property: Sumarhús við Þingvallavatn       │
│  Dates: June 15 - 22, 2026 (7 days)        │
│                                             │
│  Number of guests: [4] ▼                    │
│                                             │
│  Special requests or notes:                 │
│  [We'll arrive around 3pm...]              │
│                                             │
│  ──────────────────────────────────         │
│                                             │
│  Quota Impact:                              │
│  Before: 8 days remaining                   │
│  After:  1 day remaining                    │
│                                             │
│  ✓ I agree to the house rules               │
│                                             │
│  [Confirm Booking]  [Cancel]                │
│                                             │
└─────────────────────────────────────────────┘
```

#### Step 4: Success
```
┌─────────────────────────────────────────────┐
│  ✓ Booking Confirmed!                       │
│                                             │
│  We've sent a confirmation email to:        │
│  member@email.is                            │
│                                             │
│  Sumarhús við Þingvallavatn                 │
│  June 15 - 22, 2026                         │
│                                             │
│  What's next:                               │
│  • Add to your calendar [iCal ▼]            │
│  • View house details & WiFi password       │
│  • Read guest instructions                  │
│                                             │
│  [View My Bookings]  [Book Another →]       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Unit Tests

**Test file:** `/src/services/__tests__/organizationService.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { OrganizationService } from '../organizationService';
import { setupTestFirestore, cleanupTestFirestore } from '@/test/utils';

describe('OrganizationService', () => {
  beforeEach(async () => {
    await setupTestFirestore();
  });

  afterEach(async () => {
    await cleanupTestFirestore();
  });

  describe('create', () => {
    it('should create organization with trial status', async () => {
      const org = await OrganizationService.create(
        {
          name: 'Test Union',
          slug: 'test-union',
          type: 'union',
          billing_email: 'test@test.is',
        },
        'user123'
      );

      expect(org.subscription_status).toBe('trial');
      expect(org.created_by).toBe('user123');
    });

    it('should auto-add creator as org admin', async () => {
      const org = await OrganizationService.create(
        {
          name: 'Test Union',
          slug: 'test-union',
          type: 'union',
          billing_email: 'test@test.is',
        },
        'user123'
      );

      const isAdmin = await OrganizationService.isOrgAdmin(org.id, 'user123');
      expect(isAdmin).toBe(true);
    });
  });

  describe('getMemberQuota', () => {
    it('should calculate remaining quota correctly', async () => {
      // Setup
      const org = await OrganizationService.create({
        name: 'Test Union',
        slug: 'test',
        type: 'union',
        billing_email: 'test@test.is',
        booking_rules: {
          max_days_per_year: 14,
        },
      }, 'admin');

      await OrganizationService.addMember(org.id, {
        user_id: 'member1',
        role: 'member',
        days_booked_this_year: 6,
      });

      // Test
      const quota = await OrganizationService.getMemberQuota(org.id, 'member1');

      expect(quota.used).toBe(6);
      expect(quota.remaining).toBe(8);
      expect(quota.total).toBe(14);
    });
  });
});
```

### Integration Tests

**Test file:** `/src/features/organization/__tests__/booking-flow.e2e.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Organization Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as org member
    await page.goto('http://efling.localhost:5173');
    await page.click('[data-testid="login-button"]');
    await page.fill('[name="email"]', 'member@efling.is');
    await page.fill('[name="password"]', 'testpass123');
    await page.click('[type="submit"]');
  });

  test('member can book property within quota', async ({ page }) => {
    // Navigate to properties
    await page.goto('http://efling.localhost:5173/properties');

    // Click first property
    await page.click('[data-testid="property-card"]:first-child');

    // Select dates
    await page.click('[data-testid="calendar"]');
    // ... select June 15-22 (7 days)

    // Verify quota warning
    await expect(page.locator('[data-testid="quota-warning"]'))
      .toContainText('7 of your 8 remaining days');

    // Confirm booking
    await page.click('[data-testid="book-now"]');
    await page.click('[data-testid="confirm-booking"]');

    // Verify success
    await expect(page.locator('[data-testid="booking-success"]'))
      .toBeVisible();
  });

  test('member cannot book beyond quota', async ({ page }) => {
    // ... navigate to property

    // Try to select 10 days (assume quota is 8)
    // ... select dates

    // Verify error message
    await expect(page.locator('[data-testid="quota-error"]'))
      .toContainText('Insufficient quota');

    // Verify book button is disabled
    await expect(page.locator('[data-testid="book-now"]'))
      .toBeDisabled();
  });
});
```

### Security Tests

```typescript
test.describe('Organization Security', () => {
  test('non-member cannot access org properties', async ({ page }) => {
    // Login as user NOT in organization
    await loginAs(page, 'outsider@email.is');

    // Try to access org subdomain
    await page.goto('http://efling.localhost:5173/properties');

    // Should be redirected or shown error
    await expect(page).toHaveURL(/.*\/unauthorized/);
  });

  test('member cannot access admin dashboard', async ({ page }) => {
    // Login as regular member
    await loginAs(page, 'member@efling.is');

    // Try to access admin
    await page.goto('http://efling.localhost:5173/admin');

    // Should be denied
    await expect(page.locator('[data-testid="access-denied"]'))
      .toBeVisible();
  });

  test('org admin cannot see other org data', async ({ page }) => {
    // Login as Efling admin
    await loginAs(page, 'admin@efling.is');

    // Try to access VR's data by manipulating URL
    await page.goto('http://vr.localhost:5173/admin');

    // Should not work
    await expect(page).not.toHaveURL(/.*vr.*/);
  });
});
```

---

## 📈 Analytics & Reporting

### Organization Analytics Dashboard

**Metrics to track:**

1. **Occupancy Metrics**
   - Overall occupancy rate (% of available nights booked)
   - Per-property occupancy
   - Seasonal trends
   - Peak vs off-peak utilization

2. **Member Engagement**
   - Active members (% who booked in last 12 months)
   - Average bookings per member
   - Quota utilization (% of members using full quota)
   - New member onboarding rate

3. **Fairness Metrics**
   - Distribution histogram (how many members booked 0, 1-5, 6-10, 10+ days)
   - Gini coefficient (measure of inequality)
   - Most/least popular properties
   - Wait list conversion rate

4. **Financial Metrics**
   - Revenue per property (if applicable)
   - Cost per booking
   - ROI for org (time saved × hourly wage)

5. **Operational Metrics**
   - Average booking lead time
   - Cancellation rate
   - Support tickets per 100 bookings
   - System uptime

**Implementation:**

```typescript
// analytics/organizationMetrics.ts
export class OrganizationMetrics {
  static async getOccupancyRate(
    orgId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Get all properties
    const properties = await OrganizationService.getProperties(orgId);

    // Get all bookings in date range
    // Calculate total available nights
    // Calculate total booked nights
    // Return percentage

    return 0.75; // 75% occupancy
  }

  static async getMemberEngagement(orgId: string): Promise<{
    active_members: number;
    avg_bookings_per_member: number;
    quota_utilization: number;
  }> {
    // Query members
    // Calculate metrics

    return {
      active_members: 450,
      avg_bookings_per_member: 2.3,
      quota_utilization: 0.82,
    };
  }
}
```

---

**Prepared by:** Claude (AI Assistant)
**Date:** 16. febrúar 2026
**Status:** Draft - Awaiting Review & Decision

**Document Version:** 2.0 (Expanded with Competitive Analysis & Technical Details)

---

## 🔄 Migration Strategy: From Frimann to Bustadurinn.is

### Why Organizations Migrate

**Pain points með Frimann:**
1. **Outdated UX:** Desktop-first, ekki mobile-friendly
2. **High cost:** Enterprise pricing fyrir alla
3. **Locked in:** All-or-nothing, ekki modular
4. **Slow updates:** Feature requests taka mánuði/ár
5. **Poor mobile:** App ekki native, slow
6. **Limited API:** Integration difficult

### Migration Process (4-6 weeks)

#### Week 1-2: Data Export & Preparation

**From Frimann:**
```csv
# properties.csv
property_id,name,address,capacity,description,amenities
FRI001,Sumarhús Þingvöllum,Þingvallavegur 123,6,"Lovely...",wifi|hottub|bbq
FRI002,Mývatn Cottage,Mývatnsvegur 45,4,"Cozy...",wifi|sauna

# members.csv
member_id,email,name,member_number,join_date,role
M001,jon@email.is,Jón Jónsson,12345,2020-01-15,member
M002,anna@email.is,Anna Sigurðardóttir,12346,2019-05-20,member

# bookings.csv (historical)
booking_id,property_id,member_id,start_date,end_date,status
B001,FRI001,M001,2025-06-15,2025-06-22,completed
B002,FRI002,M002,2025-07-01,2025-07-05,completed
```

**Data Transformation Script:**

```typescript
// scripts/import-from-frimann.ts
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import { OrganizationService } from '@/services/organizationService';
import { HouseService } from '@/services/houseService';

interface FrimannProperty {
  property_id: string;
  name: string;
  address: string;
  capacity: number;
  description: string;
  amenities: string; // pipe-separated
}

interface FrimannMember {
  member_id: string;
  email: string;
  name: string;
  member_number: string;
  join_date: string;
  role: string;
}

interface FrimannBooking {
  booking_id: string;
  property_id: string;
  member_id: string;
  start_date: string;
  end_date: string;
  status: string;
}

export async function importFromFrimann(
  organizationId: string,
  propertiesFile: string,
  membersFile: string,
  bookingsFile: string
) {
  console.log('Starting Frimann import...');

  // 1. Import properties
  const properties = parse(fs.readFileSync(propertiesFile), {
    columns: true,
    skip_empty_lines: true,
  }) as FrimannProperty[];

  const propertyMap = new Map<string, string>(); // old ID -> new ID

  for (const prop of properties) {
    const houseId = await HouseService.create({
      name: prop.name,
      address: prop.address,
      organization_id: organizationId,
      capacity: prop.capacity,
      description: prop.description,
      amenities: prop.amenities.split('|'),
    });

    propertyMap.set(prop.property_id, houseId);
    console.log(`Imported property: ${prop.name}`);
  }

  // 2. Import members
  const members = parse(fs.readFileSync(membersFile), {
    columns: true,
    skip_empty_lines: true,
  }) as FrimannMember[];

  const memberMap = new Map<string, string>(); // old member ID -> user ID

  for (const member of members) {
    // Create user account (send invite email)
    const invitation = await OrganizationService.inviteMember(
      organizationId,
      {
        email: member.email,
        role: member.role === 'admin' ? 'org_admin' : 'member',
        member_number: member.member_number,
        seniority_date: new Date(member.join_date),
      }
    );

    memberMap.set(member.member_id, member.email);
    console.log(`Invited member: ${member.email}`);
  }

  // 3. Import historical bookings (for analytics)
  const bookings = parse(fs.readFileSync(bookingsFile), {
    columns: true,
    skip_empty_lines: true,
  }) as FrimannBooking[];

  for (const booking of bookings) {
    const newHouseId = propertyMap.get(booking.property_id);
    if (!newHouseId) {
      console.warn(`Property not found: ${booking.property_id}`);
      continue;
    }

    // Import as historical booking
    // Note: Only import completed bookings, not future ones
    if (booking.status === 'completed') {
      // TODO: Create booking record
      console.log(`Imported booking: ${booking.booking_id}`);
    }
  }

  console.log('✅ Import complete!');
  console.log(`- ${properties.length} properties`);
  console.log(`- ${members.length} members`);
  console.log(`- ${bookings.length} bookings`);
}

// Usage:
// npm run import-frimann -- <orgId> properties.csv members.csv bookings.csv
```

#### Week 3-4: Parallel Testing

**Dual-run strategy:**
- Keep Frimann active
- Run Bustadurinn.is in parallel
- Compare results
- Train admins

**Checklist:**
- [ ] Import all properties ✓
- [ ] Import all members ✓
- [ ] Verify member login works
- [ ] Test booking flow
- [ ] Verify quota calculations match
- [ ] Test admin dashboard
- [ ] Mobile app testing
- [ ] Email notifications working
- [ ] Calendar sync working

#### Week 5: Cutover

**Friday evening:**
1. Freeze bookings in Frimann
2. Export final dataset
3. Import to Bustadurinn.is
4. Verify data integrity
5. Send announcement email to all members

**Monday morning:**
6. Go live with Bustadurinn.is
7. Redirect frimann.org/sumarhus → efling.bustadurinn.is
8. Support on standby

#### Week 6: Post-Migration Support

- Daily check-ins with org admin
- Monitor for issues
- Quick bug fixes
- Gather feedback
- Iterate

---

## 📦 Data Import/Export Specifications

### CSV Import Templates

#### Properties Import Template
```csv
name,address,latitude,longitude,capacity,category,amenities,description,check_in_time,check_out_time,wifi_ssid,wifi_password,house_rules,winter_closed
"Sumarhús Þingvöllum","Þingvallavegur 123",64.2551,-21.1271,6,"Family","wifi,hottub,bbq,dishwasher","Lovely lakeside cottage","15:00","11:00","SumarhusWiFi","password123","No smoking. No pets.","true"
```

**Validation rules:**
- `name`: Required, max 100 chars
- `address`: Required
- `latitude/longitude`: Optional, auto-geocode if missing
- `capacity`: Required, 1-20
- `category`: Optional enum: Family, Couples, Groups, Luxury
- `amenities`: Comma-separated, validate against allowed list
- `check_in_time/check_out_time`: HH:MM format
- `winter_closed`: Boolean (true/false)

**Import API:**
```typescript
POST /api/org/{orgId}/properties/import
Content-Type: multipart/form-data

{
  "file": <CSV file>,
  "overwrite": false, // Skip duplicates vs overwrite
  "send_notifications": true // Notify admins on completion
}

Response:
{
  "success": true,
  "imported": 15,
  "skipped": 2,
  "errors": [
    {
      "row": 8,
      "error": "Invalid capacity value"
    }
  ]
}
```

#### Members Import Template
```csv
email,name,member_number,role,join_date,accessible_properties
"jon@email.is","Jón Jónsson","12345","member","2020-01-15","all"
"anna@email.is","Anna Sigurðardóttir","12346","member","2019-05-20","FRI001,FRI002"
"admin@email.is","Admin User","00001","org_admin","2018-01-01","all"
```

**Validation rules:**
- `email`: Required, valid email, unique
- `name`: Required
- `member_number`: Optional, unique within org
- `role`: Enum: member, org_admin, property_manager
- `join_date`: YYYY-MM-DD, used for seniority
- `accessible_properties`: "all" or comma-separated property IDs

**Import behavior:**
- Send email invitation to each member
- If user already exists with email, add to org
- If member_number exists, skip with warning

---

### Data Export (GDPR Compliance)

**Organization Admin can export:**

```typescript
GET /api/org/{orgId}/export?format=csv&data=all

Query params:
- format: csv | json | xlsx
- data: all | properties | members | bookings | analytics
- date_range: YYYY-MM-DD:YYYY-MM-DD (for bookings)

Response:
{
  "export_id": "exp_abc123",
  "status": "processing",
  "download_url": null,
  "expires_at": "2026-02-23T12:00:00Z"
}

// Poll for completion:
GET /api/org/{orgId}/export/exp_abc123

Response:
{
  "export_id": "exp_abc123",
  "status": "completed",
  "download_url": "https://storage.../export.zip",
  "expires_at": "2026-02-23T12:00:00Z",
  "size_bytes": 1248576
}
```

**Export contents (ZIP file):**
```
export_efling_2026-02-16.zip
├── properties.csv
├── members.csv
├── bookings_2025.csv
├── bookings_2026.csv
├── analytics_summary.pdf
└── README.txt
```

---

## 💰 Pricing Calculator & ROI Model

### Current Cost (Frimann or Manual)

**Frimann pricing (estimated):**
- Setup fee: 500.000 kr (one-time)
- Annual license: 800.000 kr/year
- Support: 150.000 kr/year
- **Total Year 1:** 1.450.000 kr
- **Total Year 2+:** 950.000 kr/year

**Manual (Excel) cost:**
- Admin time: 10 hours/month × 12 months × 10.000 kr/hour = 1.200.000 kr/year
- Member frustration: Priceless 😅
- Errors/conflicts: ~5 per year × 50.000 kr admin time = 250.000 kr/year
- **Total:** ~1.450.000 kr/year

### Bustadurinn.is Cost

**Basic Tier (5-20 properties):**
- Annual: 99.900 kr/year
- Monthly: 8.325 kr/month × 12 = 99.900 kr/year
- Setup: 0 kr (self-service)
- **Total Year 1:** 99.900 kr
- **Savings vs Frimann:** 1.350.100 kr (93% cheaper!)

**Pro Tier (20-100 properties):**
- Annual: 299.900 kr/year
- Setup: 0 kr
- **Total Year 1:** 299.900 kr
- **Savings vs Frimann:** 1.150.100 kr (79% cheaper!)

### ROI Calculator (Interactive)

**Input variables:**
- Number of properties: [15]
- Number of members: [1200]
- Admin hours per month (current): [10]
- Hourly wage: [10.000 kr]
- Current solution: [Excel / Frimann / Other]

**Output:**
```
Current Annual Cost: 1.200.000 kr
Bustadurinn.is Cost:   299.900 kr
                     ──────────────
Annual Savings:        900.100 kr
ROI:                   300%

Time Savings:
- Admin time saved: 8 hours/month
- Member time saved: 2 hours/month per active member
- Total time saved: 3,504 hours/year

CO2 Savings:
- Reduced phone/email support: ~50 kg CO2/year
- Paperless: ~20 kg CO2/year
```

---

## 📧 Email Templates (Detailed)

### 1. Organization Welcome Email

**Trigger:** Organization signup completed
**From:** Bustadurinn.is <noreply@bustadurinn.is>
**Subject:** 🎉 Welcome to Bustadurinn.is, {{organization_name}}!

```html
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #1e40af; color: white; padding: 24px; text-align: center;">
    <h1>Welcome to Bustadurinn.is!</h1>
  </div>

  <div style="padding: 24px;">
    <p>Hæ {{admin_name}},</p>

    <p>Congratulations! Your organization <strong>{{organization_name}}</strong> is now set up on Bustadurinn.is.</p>

    <p>Your 30-day free trial has started. Here's what you can do next:</p>

    <ol>
      <li><strong>Add your properties:</strong> Import from CSV or add manually</li>
      <li><strong>Invite members:</strong> Send email invitations to your members</li>
      <li><strong>Configure booking rules:</strong> Set quotas and priority systems</li>
      <li><strong>Customize branding:</strong> Upload logo and set colors</li>
    </ol>

    <p style="text-align: center; margin: 32px 0;">
      <a href="https://{{slug}}.bustadurinn.is/admin"
         style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Go to Admin Dashboard →
      </a>
    </p>

    <p>Need help getting started? Check out our <a href="https://bustadurinn.is/docs/org-setup">setup guide</a> or reply to this email.</p>

    <p>Best regards,<br>
    The Bustadurinn.is Team</p>
  </div>

  <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Your trial ends on {{trial_end_date}}. No credit card required.</p>
  </div>
</body>
</html>
```

### 2. Member Invitation Email

**Trigger:** Org admin invites member
**Subject:** You're invited to {{organization_name}} on Bustadurinn.is

```html
<body>
  <div style="background: #1e40af; color: white; padding: 24px;">
    <h1>You're Invited!</h1>
  </div>

  <div style="padding: 24px;">
    <p>Hæ,</p>

    <p><strong>{{admin_name}}</strong> has invited you to join <strong>{{organization_name}}</strong> on Bustadurinn.is.</p>

    <p>With Bustadurinn.is, you can:</p>
    <ul>
      <li>Browse {{properties_count}} available properties</li>
      <li>Book summer houses online 24/7</li>
      <li>View your booking quota and history</li>
      <li>Get instant confirmations</li>
    </ul>

    <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0;">
      <strong>Your quota:</strong> {{max_days_per_year}} days per year
    </p>

    <p style="text-align: center; margin: 32px 0;">
      <a href="https://{{slug}}.bustadurinn.is/invite/{{invite_token}}"
         style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        Accept Invitation & Sign Up →
      </a>
    </p>

    <p style="font-size: 14px; color: #6b7280;">
      This invitation expires in 7 days.
    </p>
  </div>
</body>
```

### 3. Booking Confirmation Email

**Trigger:** Member creates booking
**Subject:** ✅ Booking Confirmed: {{property_name}} ({{start_date}} - {{end_date}})

```html
<body>
  <div style="background: #10b981; color: white; padding: 24px;">
    <h1>✅ Booking Confirmed!</h1>
  </div>

  <div style="padding: 24px;">
    <p>Hæ {{member_name}},</p>

    <p>Your booking has been confirmed:</p>

    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <h3 style="margin-top: 0;">{{property_name}}</h3>
      <p><strong>📅 Dates:</strong> {{start_date}} - {{end_date}} ({{num_days}} days)</p>
      <p><strong>📍 Address:</strong> {{address}}</p>
      <p><strong>👥 Capacity:</strong> {{capacity}} people</p>
      <p><strong>🏷️ Booking ID:</strong> {{booking_id}}</p>
    </div>

    <h3>Important Information</h3>
    <ul>
      <li><strong>Check-in:</strong> {{check_in_time}}</li>
      <li><strong>Check-out:</strong> {{check_out_time}}</li>
      <li><strong>WiFi:</strong> {{wifi_ssid}} / {{wifi_password}}</li>
    </ul>

    <div style="background: #dbeafe; padding: 12px; border-radius: 6px; margin: 16px 0;">
      <strong>Quota Update:</strong><br>
      Days used: {{days_used}} / {{max_days}}<br>
      Remaining: {{days_remaining}} days
    </div>

    <p style="text-align: center; margin: 24px 0;">
      <a href="https://{{slug}}.bustadurinn.is/bookings/{{booking_id}}"
         style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
        View Booking Details
      </a>

      <a href="{{ical_link}}"
         style="background: white; color: #1e40af; border: 2px solid #1e40af; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin-left: 8px;">
        Add to Calendar
      </a>
    </p>

    <h3>House Rules</h3>
    <p style="font-size: 14px; white-space: pre-line;">{{house_rules}}</p>

    <p>Have a great stay! 🏡</p>
  </div>
</body>
```

### 4. Quota Warning Email

**Trigger:** Member reaches 80% of quota
**Subject:** ⚠️ Quota Alert: You've used {{days_used}} of {{max_days}} days

```html
<body>
  <div style="background: #f59e0b; color: white; padding: 24px;">
    <h1>⚠️ Quota Alert</h1>
  </div>

  <div style="padding: 24px;">
    <p>Hæ {{member_name}},</p>

    <p>This is a friendly reminder about your booking quota:</p>

    <div style="text-align: center; padding: 24px;">
      <div style="display: inline-block; text-align: left;">
        <div style="background: #fee2e2; height: 40px; width: 300px; border-radius: 20px; overflow: hidden; position: relative;">
          <div style="background: #ef4444; height: 100%; width: {{quota_percentage}}%; border-radius: 20px;"></div>
        </div>
        <p style="margin-top: 8px;">
          <strong>{{days_used}} of {{max_days}} days used ({{quota_percentage}}%)</strong><br>
          <span style="color: #059669;">{{days_remaining}} days remaining</span>
        </p>
      </div>
    </div>

    <p>Your booking quota resets on <strong>{{reset_date}}</strong> (January 1st).</p>

    <p style="text-align: center; margin: 24px 0;">
      <a href="https://{{slug}}.bustadurinn.is/profile/quota"
         style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        View My Quota →
      </a>
    </p>
  </div>
</body>
```

---

## 🎓 Customer Success Playbook

### Onboarding Checklist (Week 1)

**Day 1: Signup**
- [ ] Org created
- [ ] Admin receives welcome email
- [ ] Admin completes profile
- [ ] Calendly link sent for onboarding call

**Day 2-3: Setup Call (30 min)**
Agenda:
1. Product walkthrough (10 min)
2. Import strategy discussion (10 min)
3. Timeline agreement (5 min)
4. Q&A (5 min)

Action items:
- [ ] Receive property list (CSV or manual entry plan)
- [ ] Receive member list
- [ ] Schedule data import

**Day 4-7: Data Import**
- [ ] Properties imported
- [ ] Member invitations sent
- [ ] Admin reviews for accuracy
- [ ] Booking rules configured

**End of Week 1:**
- [ ] 5+ properties live
- [ ] 10+ members invited
- [ ] First booking made (test)
- [ ] Admin trained on dashboard

### First 30 Days Goals

**Week 2: Member Adoption**
- Goal: 50% of members sign up
- Actions:
  - [ ] Reminder email to non-signups
  - [ ] Admin posts announcement in member portal
  - [ ] Phone call to 5-10 active members for feedback

**Week 3: First Real Bookings**
- Goal: 10+ real bookings
- Actions:
  - [ ] Monitor for issues
  - [ ] Quick bug fixes
  - [ ] Collect feedback

**Week 4: Review & Optimize**
- [ ] Review call with admin
- [ ] Analytics review
- [ ] Feature requests captured
- [ ] Plan for month 2

### Success Metrics (First 90 Days)

**Must-have (Required for success):**
- [ ] 80%+ member signup rate
- [ ] 50+ bookings completed
- [ ] Zero data loss incidents
- [ ] Admin satisfaction: 8/10 or higher

**Nice-to-have (Indicators of delight):**
- [ ] Member NPS: 40+
- [ ] Mobile usage: 60%+
- [ ] Average booking creation time: <3 min
- [ ] Support tickets: <5 per 100 bookings

**Red flags (Require intervention):**
- ⚠️ <50% member signup after 30 days
- ⚠️ Admin satisfaction <6/10
- ⚠️ >10 support tickets per 100 bookings
- ⚠️ Multiple booking conflicts/errors

---

## 🔧 Technical Debt & Future Considerations

### Known Limitations (MVP)

**1. No Real-time Collaboration**
- Issue: Two admins editing same property could conflict
- Workaround: Firestore last-write-wins
- Future: Optimistic locking or operational transformation

**2. Limited Reporting**
- Issue: Basic analytics only
- Future: Advanced BI dashboard, custom report builder

**3. No Mobile Native App**
- Issue: PWA only, not in App Store
- Future: React Native app for iOS/Android

**4. Manual Quota Reset**
- Issue: Quota resets happen via scheduled function
- Risk: Function failure = quotas don't reset
- Mitigation: Monitoring + manual reset capability

**5. Single-language Emails**
- Issue: Emails only in Icelandic/English
- Future: Multi-language support per user preference

### Scalability Concerns

**Firestore Limits:**
- 1 million concurrent connections (far exceeds our needs)
- 20,000 writes/second (we'll hit ~100/second max)
- Document size: 1MB (org document could grow large)

**Mitigation:**
- Paginate member lists
- Use subcollections for large datasets
- Archive old bookings (>2 years) to separate collection

**Cloud Functions Cold Starts:**
- Issue: First request slow (~1-2s)
- Mitigation: Use min instances (costs more) or accept latency

### Security Hardening (Pre-Launch)

**Pre-launch audit:**
- [ ] Firestore rules security review
- [ ] SQL injection testing (N/A for Firestore, but API validation)
- [ ] XSS testing
- [ ] CSRF protection
- [ ] Rate limiting on all endpoints
- [ ] DDoS protection (via Vercel)

**GDPR Compliance:**
- [ ] Data export functionality ✅
- [ ] Data deletion (right to be forgotten)
- [ ] Privacy policy updated
- [ ] Cookie consent banner
- [ ] Data processing agreement for orgs

**Penetration Testing:**
- [ ] Hire security firm (budget: 500k kr)
- [ ] Fix critical/high vulnerabilities
- [ ] Document accepted risks

---

## 📱 Mobile Strategy

### Phase 1: PWA (Current)
- Progressive Web App
- Add to Home Screen
- Offline support (basic)
- Push notifications (via FCM)

**Pros:**
- ✅ Works on all platforms
- ✅ No app store approval needed
- ✅ Same codebase as web

**Cons:**
- ❌ Not in App Store (discovery issue)
- ❌ Limited native features
- ❌ iOS Safari limitations

### Phase 2: Native App (12-18 months out)

**When to build:**
- 50+ organizations using platform
- Clear demand from users
- Budget available (2-3M kr)

**Tech stack:**
- React Native (share code with web)
- Expo for faster development
- Firebase SDK for native

**Features to add:**
- Native calendar integration
- Face ID/Touch ID login
- True offline mode
- Native push notifications
- App Store optimization

---

**Document Version:** 2.0 (Expanded with Competitive Analysis & Technical Details)
