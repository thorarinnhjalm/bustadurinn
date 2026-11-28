# Starfsmannafélaga Viðbót - Implementation Plan
## Bæta við Organization Features í Núverandi Bustadurinn.is

**MIKILVÆGT:** Þetta er **VIÐBÓT** við núverandi kerfið, ekki nýtt verkefni!

---

## 🎯 Markmið

Bæta við virkni fyrir starfsmannafélög og fyrirtæki sem vilja bjóða starfsmönnum sínum aðgang að sumarhúsum með:
- **Tveggja-þrepa samþykkisferli** (access request → guest access → booking request → booking)
- **Admin dashboard** fyrir félagið til að stjórna aðgangi og bókunum
- **Núverandi virkni** heldur áfram að virka eins og er

---

## 📊 Núverandi Kerfi (Þetta breytist EKKI)

Þú ert með núverandi kerfi fyrir **sameignarhús**:
- ✅ Houses með manager og owner_ids
- ✅ Bookings
- ✅ Tasks, Budget, Finance Ledger
- ✅ Guest access með magic links
- ✅ Service marketplace
- ✅ Guestbook, shopping list, internal log

**Þetta helst ALLT óbreytt!**

---

## 🆕 Það sem við bætum við

### **1. Nýjar Firestore Collections (aðskildar frá núverandi)**

```
organizations/                    ← NYT
  {orgId}/
    access_requests/              ← NYT (access beiðnir)
    members/                      ← NYT (samþykktir starfsmenn)
    booking_requests/             ← NYT (bókunarbeiðnir)
    admin_actions/                ← NYT (audit log)

user_roles/                       ← NYT (org roles og permissions)

houses/                           ← NÚVERANDI, LÍTILS HÁTTAR BREYTINGAR
  {houseId}
    organization_id?: string      ← BÆTA VIÐ (optional)
    organization_name?: string    ← BÆTA VIÐ (optional)
    [rest stays same...]
```

### **2. Nýir Types (bæta við models.ts)**

```typescript
// Bæta við í src/types/models.ts

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'company' | 'union' | 'municipality';
  logo_url?: string;
  settings: OrganizationSettings;
  admin_user_ids: string[];
  stats: OrganizationStats;
  created_at: Date;
}

export interface OrganizationSettings {
  require_access_approval: boolean;
  auto_approve_company_email: boolean;
  allowed_email_domains: string[];
  require_booking_approval: boolean;
  payment_required: boolean;
  payment_method?: 'invoice' | 'online' | 'payroll' | 'free';
  price_per_night?: number;
  max_nights_per_booking?: number;
  max_bookings_per_year?: number;
}

export interface AccessRequest {
  id: string;
  email: string;
  name: string;
  employee_id?: string;
  department?: string;
  status: 'pending' | 'approved' | 'denied';
  requested_at: Date;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  status: 'active' | 'suspended';
  access_level: 'guest' | 'full';
  bookings_this_year: number;
  created_at: Date;
}

export interface BookingRequest {
  id: string;
  user_id: string;
  house_id: string;
  start_date: Date;
  end_date: Date;
  num_nights: number;
  status: 'pending' | 'approved' | 'denied';
  payment_required: boolean;
  requested_at: Date;
}
```

### **3. Nýjar Síður (bæta við src/pages/)**

```
src/pages/
  organizations/               ← NYT FOLDER
    OrganizationSignup.tsx     ← Nýskráning félaga
    OrganizationDashboard.tsx  ← Admin dashboard
    AccessRequestForm.tsx      ← Starfsmaður óskar eftir aðgangi
    MemberDashboard.tsx        ← Starfsmaður sér sínar bókanir
    BookingRequestForm.tsx     ← Starfsmaður óskar eftir bókun
```

### **4. Nýr Service (bæta við src/services/)**

```typescript
// src/services/organizationService.ts

export const organizationService = {
  // Organization CRUD
  async createOrganization(data: Partial<Organization>): Promise<string>
  async getOrganization(orgId: string): Promise<Organization | null>

  // Access Requests
  async submitAccessRequest(orgId: string, data: Partial<AccessRequest>): Promise<string>
  async approveAccessRequest(orgId: string, requestId: string): Promise<void>
  async denyAccessRequest(orgId: string, requestId: string, reason: string): Promise<void>

  // Booking Requests
  async submitBookingRequest(orgId: string, data: Partial<BookingRequest>): Promise<string>
  async approveBookingRequest(orgId: string, requestId: string): Promise<void>
  async denyBookingRequest(orgId: string, requestId: string, reason: string): Promise<void>

  // Members
  async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]>
  async updateMemberStatus(orgId: string, memberId: string, status: string): Promise<void>
}
```

---

## 🔧 Breyting á Núverandi Kóða

### **Lítils háttar breyting á House model:**

```typescript
// src/types/models.ts
export interface House {
  id: string;
  name: string;
  // ... núverandi fields ...

  // BÆTA VIÐ (optional fyrir organization houses):
  organization_id?: string;        // Ef hús tilheyrir félagi
  organization_name?: string;       // Fyrir display

  manager_id: string;               // Heldur áfram óbreytt
  owner_ids: string[];              // Heldur áfram óbreytt
  // ... rest stays same ...
}
```

### **Routing breyting:**

```typescript
// src/App.tsx eða þar sem routes eru

// NÚVERANDI ROUTES (óbreytt):
<Route path="/" element={<LandingPage />} />
<Route path="/login" element={<Login />} />
<Route path="/admin" element={<Dashboard />} />  // Núverandi house dashboard
// ...

// NÝJAR ROUTES (bæta við):
<Route path="/organizations/signup" element={<OrganizationSignup />} />
<Route path="/organizations/:orgId/admin" element={<OrganizationDashboard />} />
<Route path="/organizations/:orgId/request-access" element={<AccessRequestForm />} />
<Route path="/organizations/:orgId/dashboard" element={<MemberDashboard />} />
```

---

## 📋 Implementation Tasks (Rétt röð)

### **Phase 1: Database & Types (1-2 klst)**
- [ ] ~~Deploy firestore.rules~~ (í gangi)
- [ ] ~~Deploy firestore.indexes~~ (í gangi)
- [ ] Bæta við Organization types í `src/types/models.ts`
- [ ] Búa til `src/services/organizationService.ts`

### **Phase 2: Organization Signup (2-3 klst)**
- [ ] Búa til `src/pages/organizations/OrganizationSignup.tsx`
- [ ] Form validation með basic info
- [ ] Create organization í Firestore
- [ ] Redirect til admin dashboard

### **Phase 3: Access Request Flow (3-4 klst)**
- [ ] Búa til `src/pages/organizations/AccessRequestForm.tsx`
- [ ] Submit access request
- [ ] Email notification til admin (optional)
- [ ] Admin dashboard view fyrir pending requests
- [ ] Approve/deny functionality

### **Phase 4: Organization Admin Dashboard (4-5 klst)**
- [ ] Búa til `src/pages/organizations/OrganizationDashboard.tsx`
- [ ] List access requests
- [ ] List members
- [ ] List booking requests
- [ ] List organization houses
- [ ] Stats overview

### **Phase 5: Member Dashboard (2-3 klst)**
- [ ] Búa til `src/pages/organizations/MemberDashboard.tsx`
- [ ] Browse available houses
- [ ] View own bookings
- [ ] Submit booking request

### **Phase 6: Booking Request Flow (3-4 klst)**
- [ ] Búa til `src/pages/organizations/BookingRequestForm.tsx`
- [ ] Submit booking request
- [ ] Conflict checking
- [ ] Quota checking
- [ ] Admin approve/deny
- [ ] Create actual booking on approval

### **Phase 7: Integration & Testing (2-3 klst)**
- [ ] Test all flows end-to-end
- [ ] Test að núverandi house functionality virki óbreytt
- [ ] Fix bugs
- [ ] Deploy

---

## 🎨 UI Integration

### **Landing Page Update:**

```tsx
// Bæta við á landing page:

<section>
  <h2>Fyrir Starfsmannafélög</h2>
  <p>Bjóddu starfsmönnum þínum upp á sumarhús með auðveldri stjórnun</p>
  <Link to="/organizations/signup">Byrja Núna</Link>
</section>
```

### **Navigation Update:**

```tsx
// Ef user er org admin, sýna link:
{user.isOrgAdmin && (
  <Link to={`/organizations/${user.orgId}/admin`}>
    Félagsstjórnun
  </Link>
)}

// Ef user er org member, sýna link:
{user.isOrgMember && (
  <Link to={`/organizations/${user.orgId}/dashboard`}>
    Mitt Félag
  </Link>
)}
```

---

## ✅ Acceptance Criteria

**Þegar við erum búin, þá:**

1. ✅ **Núverandi virkni virkar óbreytt**
   - Sameignarhús funkkar nákvæmlega eins
   - Bookings, tasks, budgets, etc. óbreytt

2. ✅ **Ný organization virkni virkar:**
   - Félag getur skráð sig
   - Starfsmenn geta óskað eftir aðgangi
   - Admin samþykkir aðgang → starfsmaður fær guest access
   - Starfsmaður getur óskað eftir bókun
   - Admin samþykkir bókun → booking er búin til

3. ✅ **Tvö kerfi lifa saman:**
   - Hægt að hafa bæði organization houses OG sameignarhús
   - Sama user getur verið í bæði
   - Engin conflicts

---

## 🚀 Næstu Skref

1. **Bíddum eftir Firebase deployment** (í gangi)
2. **Athugum núverandi routing setup** (React Router)
3. **Byrjum á Phase 1** - bæta við types og service
4. **Smíðum eina síðu í einu**

---

**Spurningar?** Láttu mig vita og við förum í þetta rétt! 💪
