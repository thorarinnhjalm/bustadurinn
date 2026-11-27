# Bustadurinn.is - Project Breakdown
## Corporate/Employee Association Model - MVP

**Version:** 1.0
**Date:** 16. febrúar 2026
**Target:** MVP for Pilot Customer (Íslandsbanki)
**Timeline:** 4 weeks (80 hours total)

---

## 📋 Table of Contents

1. [Epic Overview](#epic-overview)
2. [Feature Specifications](#feature-specifications)
3. [Technical Architecture](#technical-architecture)
4. [Task Breakdown by Sprint](#task-breakdown-by-sprint)
5. [Database Schema Details](#database-schema-details)
6. [API Endpoints](#api-endpoints)
7. [Component Tree](#component-tree)
8. [Testing Plan](#testing-plan)
9. [Deployment Plan](#deployment-plan)

---

## 🎯 Epic Overview

### **Epic 1: Organization Setup** (Priority: P0)
Admin can create organization, configure settings, and add properties.

**User Story:**
> As a company admin, I want to set up my organization and add summer houses so that employees can start requesting access.

**Success Criteria:**
- [ ] Admin can sign up and create organization
- [ ] Admin can add/edit/delete properties
- [ ] Admin can configure approval settings
- [ ] Admin can invite other admins

**Estimated Time:** 20 hours

---

### **Epic 2: Access Request Workflow** (Priority: P0)
Employees can request access, admin can approve/deny, employees receive notifications.

**User Story:**
> As an employee, I want to request access to the summer house system so that I can browse and book properties.

**Success Criteria:**
- [ ] Employee can submit access request
- [ ] Admin sees pending requests in dashboard
- [ ] Admin can approve/deny requests
- [ ] Employee receives email notification
- [ ] Approved employee can log in

**Estimated Time:** 24 hours

---

### **Epic 3: Property Browsing (Guest Mode)** (Priority: P0)
Approved employees can browse properties, view details, see availability.

**User Story:**
> As an approved employee, I want to browse available summer houses and see their availability so I can decide where to book.

**Success Criteria:**
- [ ] Employee can view all properties
- [ ] Employee can see property details
- [ ] Employee can view availability calendar
- [ ] Employee can filter/search properties
- [ ] Mobile-responsive design

**Estimated Time:** 16 hours

---

### **Epic 4: Booking Request Workflow** (Priority: P0)
Employees can request bookings, admin can approve/deny, confirmed bookings appear on calendar.

**User Story:**
> As an employee, I want to request a booking for a summer house so that my family can use it during vacation.

**Success Criteria:**
- [ ] Employee can submit booking request
- [ ] System validates dates (no conflicts)
- [ ] Admin sees pending booking requests
- [ ] Admin can approve/deny with payment info
- [ ] Confirmed booking appears on calendar
- [ ] Employee receives confirmation email

**Estimated Time:** 28 hours

---

### **Epic 5: Admin Dashboard** (Priority: P0)
Central dashboard for managing all aspects of the organization.

**User Story:**
> As an admin, I want a central dashboard where I can manage access requests, booking requests, members, and view analytics.

**Success Criteria:**
- [ ] Dashboard shows key metrics
- [ ] Dashboard shows pending actions
- [ ] Quick access to all management pages
- [ ] Real-time updates
- [ ] Export functionality

**Estimated Time:** 12 hours

---

## 📐 Feature Specifications

### **Feature 1.1: Organization Creation**

**Priority:** P0 (Must Have)
**Complexity:** Medium
**Estimate:** 6 hours

**Description:**
Admin signs up and creates a new organization with basic settings.

**User Flow:**
1. Admin navigates to `/signup/organization`
2. Fills out form:
   - Company name
   - Email
   - Password
   - Industry (dropdown)
   - Number of properties (estimate)
3. Submits form
4. Account created + redirected to onboarding wizard

**Acceptance Criteria:**
- [ ] Form validates all required fields
- [ ] Email must be unique
- [ ] Password must be 8+ characters
- [ ] Creates Firestore organization document
- [ ] Creates Firebase Auth user
- [ ] Adds user to organization admins
- [ ] Sends welcome email
- [ ] Redirects to onboarding wizard

**Technical Details:**
```typescript
// API Endpoint
POST /api/organizations/create
Request: {
  name: string;
  email: string;
  password: string;
  industry: string;
  estimated_properties: number;
}
Response: {
  organization_id: string;
  user_id: string;
  redirect_to: string;
}
```

**Edge Cases:**
- Email already exists → Show error
- Firestore write fails → Rollback auth user
- Email sending fails → Log error, continue (admin can resend)

**Dependencies:**
- None (first feature)

---

### **Feature 1.2: Onboarding Wizard**

**Priority:** P0
**Complexity:** Medium
**Estimate:** 8 hours

**Description:**
Multi-step wizard to set up organization after signup.

**Steps:**
1. **Company Details** - Logo upload, colors
2. **Add Properties** - Add 1+ summer houses (name, address, capacity)
3. **Settings** - Configure approval rules
4. **Share Link** - Get employee signup link

**Acceptance Criteria:**
- [ ] Can navigate between steps
- [ ] Can save draft and come back later
- [ ] Logo uploads to Firebase Storage
- [ ] Properties saved to Firestore
- [ ] Settings saved to organization doc
- [ ] Generates unique signup link
- [ ] Can skip steps (wizard not required)

**UI/UX:**
```
┌─────────────────────────────────────┐
│  Setup Your Organization            │
│  ○━━━○━━━○━━━○  (Step 2 of 4)      │
├─────────────────────────────────────┤
│                                     │
│  Add Your First Property            │
│                                     │
│  Property Name *                    │
│  [Sumarhús við Þingvallavatn]       │
│                                     │
│  Address *                          │
│  [Þingvallavegur 123, 801 Selfoss]  │
│                                     │
│  Capacity *                         │
│  [6] people                         │
│                                     │
│  [+ Add Another Property]           │
│                                     │
│  [← Back]  [Skip]  [Continue →]     │
│                                     │
└─────────────────────────────────────┘
```

**Dependencies:**
- Feature 1.1 (organization must exist)

---

### **Feature 2.1: Employee Access Request Form**

**Priority:** P0
**Complexity:** Low
**Estimate:** 4 hours

**Description:**
Public-facing form where employees can request access.

**URL:** `/{orgSlug}/request-access`

**Acceptance Criteria:**
- [ ] Form accessible without login
- [ ] Validates email format
- [ ] Validates employee ID format (if required)
- [ ] Stores request in Firestore
- [ ] Shows success message
- [ ] Sends notification to admin
- [ ] Prevents duplicate requests (same email)

**Form Fields:**
- Email * (required)
- Full Name * (required)
- Employee ID (optional, based on org settings)
- Department (optional)
- Phone (optional)
- Reason (textarea, optional)

**Technical Details:**
```typescript
POST /api/organizations/{orgId}/access-requests
Request: {
  email: string;
  name: string;
  employee_id?: string;
  department?: string;
  phone?: string;
  reason?: string;
}
Response: {
  request_id: string;
  status: 'pending';
  estimated_review_time: string; // "1-2 business days"
}
```

**Edge Cases:**
- Email already has access → Show "You already have access, please log in"
- Email has pending request → Show "Request already submitted, please wait"
- Organization doesn't exist → 404 page
- Rate limiting → Max 5 requests per email per day

**Dependencies:**
- Feature 1.1 (organization must exist)

---

### **Feature 2.2: Admin Access Request Queue**

**Priority:** P0
**Complexity:** Medium
**Estimate:** 8 hours

**Description:**
Admin dashboard page showing all pending access requests.

**URL:** `/org/{orgSlug}/admin/requests/access`

**Acceptance Criteria:**
- [ ] Lists all pending requests
- [ ] Shows request details (name, email, date, etc.)
- [ ] Shows verification status (email domain match, employee ID check)
- [ ] Can approve request (one-click)
- [ ] Can deny request (with reason)
- [ ] Can request more info (sends email)
- [ ] Real-time updates (new requests appear automatically)
- [ ] Pagination (50 per page)
- [ ] Search/filter functionality

**UI Components:**
```typescript
<AccessRequestQueue>
  <RequestCard>
    - Employee info display
    - Verification badges
    - Action buttons (Approve/Deny/Ask)
  </RequestCard>
  <ApprovalModal>
    - Confirmation dialog
    - Access level selection
    - Send email checkbox
  </ApprovalModal>
</AccessRequestQueue>
```

**Technical Details:**
```typescript
GET /api/organizations/{orgId}/access-requests?status=pending
Response: {
  requests: AccessRequest[];
  total: number;
  page: number;
}

POST /api/organizations/{orgId}/access-requests/{requestId}/approve
Request: {
  access_level: 'guest' | 'full';
  send_email: boolean;
}
Response: {
  success: boolean;
  member_id: string;
}
```

**Dependencies:**
- Feature 2.1 (requests must exist)
- Feature 1.1 (organization context)

---

### **Feature 2.3: Access Approval Email**

**Priority:** P0
**Complexity:** Low
**Estimate:** 4 hours

**Description:**
Email sent to employee when access is approved, with link to create account.

**Triggers:**
- Admin approves access request

**Email Content:**
- Subject: "Access Approved! 🎉"
- Body: Personalized welcome message
- CTA: "Create Your Account" button with magic link
- Expiry: Link expires in 7 days

**Acceptance Criteria:**
- [ ] Email sent immediately after approval
- [ ] Link is unique and secure (JWT token)
- [ ] Link expires after 7 days or after use
- [ ] Link pre-fills email and name
- [ ] Email template is branded (org logo/colors)
- [ ] Email is mobile-responsive

**Technical Details:**
```typescript
// Email service
sendAccessApprovedEmail({
  to: string;
  name: string;
  organization_name: string;
  organization_logo: string;
  signup_link: string; // Contains JWT token
  expires_at: Date;
})

// JWT payload
{
  type: 'access_approval',
  org_id: string,
  email: string,
  name: string,
  exp: timestamp
}
```

**Dependencies:**
- Feature 2.2 (approval action)
- Email service (SendGrid/similar)

---

### **Feature 2.4: Employee Account Creation**

**Priority:** P0
**Complexity:** Medium
**Estimate:** 6 hours

**Description:**
Employee creates their account after receiving approval email.

**URL:** `/accept-invitation?token={jwt}`

**User Flow:**
1. Employee clicks link in email
2. Token validated
3. Form shown with pre-filled email/name
4. Employee enters password
5. Account created
6. Auto-login
7. Redirected to property browser

**Acceptance Criteria:**
- [ ] Token validation (not expired, not used)
- [ ] Email/name pre-filled and disabled
- [ ] Password validation (min 8 chars)
- [ ] Creates Firebase Auth user
- [ ] Updates member status to 'active'
- [ ] Marks invitation as accepted
- [ ] Auto-login after creation
- [ ] Shows error if token invalid/expired

**Technical Details:**
```typescript
POST /api/auth/accept-invitation
Request: {
  token: string;
  password: string;
}
Response: {
  user_id: string;
  organization_id: string;
  redirect_to: string;
}
```

**Edge Cases:**
- Token expired → Show "Link expired, please contact HR"
- Token already used → Show "Already accepted, please log in"
- Email already has account → Link accounts
- Firebase Auth creation fails → Show error, allow retry

**Dependencies:**
- Feature 2.3 (invitation email)

---

### **Feature 3.1: Property List Page**

**Priority:** P0
**Complexity:** Medium
**Estimate:** 8 hours

**Description:**
Grid view of all available properties with filtering and search.

**URL:** `/org/{orgSlug}/properties`

**Acceptance Criteria:**
- [ ] Shows all properties for organization
- [ ] Grid layout (responsive: 1/2/3 columns)
- [ ] Property card shows: image, name, capacity, rating
- [ ] Click card → property details page
- [ ] Search by name/location
- [ ] Filter by capacity, amenities
- [ ] Sort by name, rating, capacity
- [ ] Loading state
- [ ] Empty state (no properties)
- [ ] Guest mode banner (if not full member)

**UI/UX:**
```
┌─────────────────────────────────────────────────────┐
│  Properties                                         │
├─────────────────────────────────────────────────────┤
│  [Search: ______________]  [Capacity: All ▼]        │
│  [Amenities: All ▼]        [Sort: Name ▼]           │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ [Image]  │  │ [Image]  │  │ [Image]  │         │
│  │          │  │          │  │          │         │
│  │ Þingvalla│  │ Mývatn   │  │ Snæfells │         │
│  │ Sleeps 6 │  │ Sleeps 4 │  │ Sleeps 8 │         │
│  │ ★★★★☆    │  │ ★★★★★    │  │ ★★★☆☆    │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Technical Details:**
```typescript
GET /api/organizations/{orgId}/properties
Query params: {
  search?: string;
  capacity?: number;
  amenities?: string[];
  sort?: 'name' | 'rating' | 'capacity';
}
Response: {
  properties: Property[];
  total: number;
}
```

**Dependencies:**
- Feature 1.2 (properties must exist)
- Feature 2.4 (user must be logged in)

---

### **Feature 3.2: Property Details Page**

**Priority:** P0
**Complexity:** Medium
**Estimate:** 8 hours

**Description:**
Detailed view of a single property with photos, amenities, calendar, and booking CTA.

**URL:** `/org/{orgSlug}/properties/{propertyId}`

**Acceptance Criteria:**
- [ ] Shows property details (name, address, capacity, amenities)
- [ ] Image gallery (swipeable on mobile)
- [ ] Availability calendar (read-only, shows booked dates)
- [ ] House rules section
- [ ] WiFi credentials (if approved member)
- [ ] "Request Booking" button
- [ ] Breadcrumb navigation
- [ ] Share button (copy link)
- [ ] Reviews/ratings (future: not MVP)

**Sections:**
1. Header: Name, location, rating
2. Gallery: Photos (8-10 max)
3. Details: Capacity, bedrooms, amenities
4. Calendar: Availability view
5. Rules: House rules
6. Info: WiFi, check-in/out, emergency contact
7. CTA: Request Booking button

**Technical Details:**
```typescript
GET /api/organizations/{orgId}/properties/{propertyId}
Response: {
  property: Property;
  availability: {
    booked_dates: Date[];
    blocked_dates: Date[];
  };
}
```

**Dependencies:**
- Feature 3.1 (navigation from list)

---

### **Feature 4.1: Booking Request Form**

**Priority:** P0
**Complexity:** Medium
**Estimate:** 8 hours

**Description:**
Form where employee selects dates and submits booking request.

**URL:** `/org/{orgSlug}/properties/{propertyId}/request-booking`

**Acceptance Criteria:**
- [ ] Date picker (check-in/check-out)
- [ ] Validates dates (no past dates, no conflicts)
- [ ] Shows number of nights
- [ ] Number of guests input
- [ ] Purpose dropdown
- [ ] Notes textarea
- [ ] Calculates price (if applicable)
- [ ] Shows warning if requires approval
- [ ] Submits to Firestore
- [ ] Sends notification to admin
- [ ] Shows confirmation message

**Form Fields:**
- Check-in date * (date picker)
- Check-out date * (date picker)
- Number of guests * (number input, max = capacity)
- Purpose * (dropdown: Personal, Family, Work)
- Additional notes (textarea, optional)

**Validation:**
- Check-in must be future date
- Check-out must be after check-in
- Dates must not conflict with existing bookings
- Number of guests must not exceed capacity
- Employee must not exceed quota (if set)

**Technical Details:**
```typescript
POST /api/organizations/{orgId}/booking-requests
Request: {
  house_id: string;
  start_date: Date;
  end_date: Date;
  num_guests: number;
  purpose: string;
  notes?: string;
}
Response: {
  request_id: string;
  status: 'pending';
  payment_amount?: number;
  estimated_review_time: string;
}
```

**Edge Cases:**
- Dates conflict → Show error with conflicting dates
- User exceeded quota → Show error with quota info
- Property not available → Show error
- Simultaneous requests for same dates → First one wins

**Dependencies:**
- Feature 3.2 (property details)
- Feature 2.4 (user must be logged in)

---

### **Feature 4.2: Admin Booking Request Queue**

**Priority:** P0
**Complexity:** High
**Estimate:** 12 hours

**Description:**
Admin dashboard page showing all pending booking requests with approval/denial.

**URL:** `/org/{orgSlug}/admin/requests/bookings`

**Acceptance Criteria:**
- [ ] Lists all pending booking requests
- [ ] Shows request details (employee, property, dates, etc.)
- [ ] Shows conflict warnings (if overlapping)
- [ ] Shows employee booking history
- [ ] Can approve with payment settings
- [ ] Can deny with reason
- [ ] Can send message to employee
- [ ] Real-time updates
- [ ] Pagination
- [ ] Filter by property, date range, status

**Approval Flow:**
1. Admin clicks "Approve"
2. Modal opens:
   - Payment required? (Yes/No)
   - If yes: Amount, payment method
   - Send confirmation email? (Yes)
3. Admin confirms
4. Booking created in calendar
5. Employee notified via email

**Technical Details:**
```typescript
GET /api/organizations/{orgId}/booking-requests?status=pending
Response: {
  requests: BookingRequest[];
  total: number;
}

POST /api/organizations/{orgId}/booking-requests/{requestId}/approve
Request: {
  payment_required: boolean;
  payment_amount?: number;
  payment_method?: 'invoice' | 'online' | 'payroll' | 'free';
  send_email: boolean;
}
Response: {
  booking_id: string;
  invoice_id?: string;
}

POST /api/organizations/{orgId}/booking-requests/{requestId}/deny
Request: {
  reason: string;
  send_email: boolean;
}
Response: {
  success: boolean;
}
```

**Conflict Detection:**
```typescript
// Automatic conflict check
function checkConflicts(request: BookingRequest): Conflict[] {
  // Query existing bookings for same property
  // Check date overlap
  // Return array of conflicts
}
```

**Dependencies:**
- Feature 4.1 (requests must exist)

---

### **Feature 4.3: Booking Confirmation Email**

**Priority:** P0
**Complexity:** Low
**Estimate:** 4 hours

**Description:**
Email sent to employee when booking is approved.

**Triggers:**
- Admin approves booking request

**Email Content:**
- Subject: "Booking Confirmed! ✓"
- Property details
- Dates and nights
- Check-in/out times
- Payment info (if applicable)
- WiFi credentials
- House rules link
- Add to calendar button (iCal)

**Acceptance Criteria:**
- [ ] Email sent immediately after approval
- [ ] Includes all booking details
- [ ] iCal attachment for calendar
- [ ] Payment invoice attached (if required)
- [ ] Mobile-responsive
- [ ] Branded with org colors/logo

**Technical Details:**
```typescript
sendBookingConfirmationEmail({
  to: string;
  booking: Booking;
  property: Property;
  payment_info?: PaymentInfo;
  ical_attachment: Buffer;
})
```

**Dependencies:**
- Feature 4.2 (booking approval)

---

### **Feature 5.1: Admin Dashboard Overview**

**Priority:** P0
**Complexity:** Medium
**Estimate:** 8 hours

**Description:**
Central dashboard showing key metrics and pending actions.

**URL:** `/org/{orgSlug}/admin`

**Widgets:**
1. **Stats Cards:**
   - Total Properties
   - Total Members
   - Bookings This Month
   - Pending Requests
   - Revenue This Month (if payment enabled)
   - Occupancy Rate

2. **Pending Actions:**
   - Access Requests (count + link)
   - Booking Requests (count + link)

3. **Recent Activity:**
   - Last 10 admin actions
   - Last 10 bookings

4. **Quick Links:**
   - Add Property
   - Invite Member
   - View Calendar
   - Export Data

**Acceptance Criteria:**
- [ ] All stats update in real-time
- [ ] Pending actions show correct counts
- [ ] Recent activity shows latest items
- [ ] Quick links navigate correctly
- [ ] Loading states for all widgets
- [ ] Responsive design

**Technical Details:**
```typescript
GET /api/organizations/{orgId}/dashboard/stats
Response: {
  properties: number;
  members: number;
  bookings_this_month: number;
  pending_access_requests: number;
  pending_booking_requests: number;
  revenue_this_month: number;
  occupancy_rate: number;
}

GET /api/organizations/{orgId}/dashboard/activity
Response: {
  recent_actions: AdminAction[];
  recent_bookings: Booking[];
}
```

**Dependencies:**
- All previous features (displays aggregated data)

---

### **Feature 5.2: Calendar View (Admin)**

**Priority:** P1 (Should Have)
**Complexity:** High
**Estimate:** 12 hours

**Description:**
Unified calendar showing all bookings across all properties.

**URL:** `/org/{orgSlug}/admin/calendar`

**Views:**
- Month view (default)
- Week view
- Property view (filter by property)

**Acceptance Criteria:**
- [ ] Shows all confirmed bookings
- [ ] Color-coded by property
- [ ] Click booking → details modal
- [ ] Can filter by property
- [ ] Can switch between month/week views
- [ ] Can navigate months
- [ ] Shows employee name on booking
- [ ] Shows "Today" indicator
- [ ] Responsive (table view on mobile)

**Technical Details:**
```typescript
GET /api/organizations/{orgId}/calendar?start={date}&end={date}
Response: {
  bookings: CalendarBooking[];
}

interface CalendarBooking {
  id: string;
  property_id: string;
  property_name: string;
  property_color: string;
  user_name: string;
  start: Date;
  end: Date;
}
```

**Dependencies:**
- Feature 4.2 (confirmed bookings)

---

## 🏗️ Technical Architecture

### **Tech Stack**

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Zustand (state management)
- React Big Calendar (calendar UI)
- React Hook Form (forms)
- Zod (validation)

**Backend:**
- Next.js API Routes (serverless)
- Firebase Admin SDK

**Database:**
- Firestore (NoSQL)
- Firebase Storage (images)

**Authentication:**
- Firebase Authentication

**Email:**
- SendGrid (or Resend)

**Hosting:**
- Vercel

**Monitoring:**
- Sentry (errors)
- Vercel Analytics (web vitals)

---

### **Folder Structure**

```
bustadurinn.is/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── accept-invitation/
│   │   ├── org/
│   │   │   └── [slug]/
│   │   │       ├── admin/
│   │   │       │   ├── page.tsx (dashboard)
│   │   │       │   ├── requests/
│   │   │       │   │   ├── access/
│   │   │       │   │   └── bookings/
│   │   │       │   ├── calendar/
│   │   │       │   └── settings/
│   │   │       ├── properties/
│   │   │       │   ├── page.tsx (list)
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx (details)
│   │   │       │       └── request-booking/
│   │   │       └── request-access/
│   │   └── api/
│   │       ├── organizations/
│   │       ├── access-requests/
│   │       ├── booking-requests/
│   │       └── auth/
│   ├── components/
│   │   ├── admin/
│   │   ├── properties/
│   │   ├── bookings/
│   │   └── ui/
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── firebaseAdmin.ts
│   │   └── utils.ts
│   ├── services/
│   │   ├── organizationService.ts
│   │   ├── propertyService.ts
│   │   ├── bookingService.ts
│   │   └── emailService.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── organizationStore.ts
│   └── types/
│       └── models.ts
├── public/
├── tests/
└── package.json
```

---

## 📅 Task Breakdown by Sprint

### **Sprint 1: Foundation (Week 1) - 40 hours**

**Goal:** Database setup, authentication, organization creation

#### **Day 1-2: Project Setup & Database (16h)**

**TASK-001: Project Initialization** (2h)
- [ ] Create Next.js 14 project with TypeScript
- [ ] Install dependencies (Firebase, Tailwind, Zustand, etc.)
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint + Prettier
- [ ] Create folder structure
- **Acceptance:** `npm run dev` works, Tailwind working

**TASK-002: Firebase Setup** (3h)
- [ ] Create Firebase project
- [ ] Enable Firestore
- [ ] Enable Authentication (Email/Password, Google)
- [ ] Enable Storage
- [ ] Configure security rules (basic)
- [ ] Add Firebase config to `.env.local`
- [ ] Initialize Firebase Admin SDK
- **Acceptance:** Can connect to Firestore from app

**TASK-003: Database Schema Implementation** (4h)
- [ ] Create TypeScript interfaces in `/src/types/models.ts`
- [ ] Create Firestore collections (organizations, users)
- [ ] Write Firestore security rules
- [ ] Create indexes
- [ ] Test CRUD operations
- **Acceptance:** Can create/read organization in Firestore

**TASK-004: Authentication Setup** (4h)
- [ ] Create `/src/lib/firebase.ts` (client)
- [ ] Create `/src/lib/firebaseAdmin.ts` (server)
- [ ] Create auth service (`/src/services/authService.ts`)
- [ ] Create auth store (Zustand)
- [ ] Create login page
- [ ] Create signup page
- [ ] Test email/password auth
- **Acceptance:** Can sign up, log in, log out

**TASK-005: Layout & Navigation** (3h)
- [ ] Create admin layout component
- [ ] Create public layout component
- [ ] Create navigation menu (admin)
- [ ] Create mobile menu
- [ ] Add logout button
- **Acceptance:** Navigation works, layouts applied

---

#### **Day 3-4: Organization Creation (12h)**

**TASK-006: Organization Signup API** (4h)
- [ ] Create `/api/organizations/create` endpoint
- [ ] Validate input (Zod schema)
- [ ] Create Firebase Auth user
- [ ] Create Firestore organization doc
- [ ] Add user to organization admins
- [ ] Send welcome email
- [ ] Error handling
- **Acceptance:** POST creates organization + user

**TASK-007: Organization Signup UI** (4h)
- [ ] Create signup form component
- [ ] Form validation (React Hook Form + Zod)
- [ ] Loading states
- [ ] Error handling
- [ ] Success redirect
- [ ] Test form submission
- **Acceptance:** Can sign up as organization admin

**TASK-008: Onboarding Wizard - Step 1 (Company Details)** (4h)
- [ ] Create onboarding wizard layout
- [ ] Step indicator component
- [ ] Company details form (name, logo, colors)
- [ ] Logo upload to Firebase Storage
- [ ] Save to Firestore
- [ ] Navigation (next/back)
- **Acceptance:** Can complete step 1, data saved

---

#### **Day 5: Properties & Settings (12h)**

**TASK-009: Onboarding Wizard - Step 2 (Add Properties)** (6h)
- [ ] Property form component
- [ ] Add multiple properties
- [ ] Image upload
- [ ] Save to Firestore (`houses` collection)
- [ ] Link properties to organization
- [ ] Validation
- **Acceptance:** Can add properties, data saved

**TASK-010: Onboarding Wizard - Step 3 (Settings)** (4h)
- [ ] Settings form component
- [ ] Approval settings (checkboxes)
- [ ] Payment settings
- [ ] Save to organization doc
- [ ] Complete wizard → redirect to dashboard
- **Acceptance:** Settings saved, wizard complete

**TASK-011: Organization Service** (2h)
- [ ] Create `/src/services/organizationService.ts`
- [ ] CRUD methods for organization
- [ ] Get organization by slug
- [ ] Update organization settings
- [ ] Add/remove admin users
- **Acceptance:** Service methods work, tested

---

### **Sprint 2: Access Requests (Week 2) - 40 hours**

**Goal:** Employee access request workflow end-to-end

#### **Day 1-2: Access Request Form (12h)**

**TASK-012: Public Access Request Page** (6h)
- [ ] Create `/org/[slug]/request-access` page
- [ ] Fetch organization by slug
- [ ] Access request form component
- [ ] Form validation
- [ ] Submit to Firestore
- [ ] Success message
- [ ] Test with invalid org slug (404)
- **Acceptance:** Form works, creates Firestore doc

**TASK-013: Access Request API** (4h)
- [ ] Create `/api/organizations/[orgId]/access-requests` endpoint
- [ ] Validate input
- [ ] Check for duplicates (same email)
- [ ] Create Firestore doc
- [ ] Send notification to admin
- [ ] Rate limiting (5 per email per day)
- **Acceptance:** API creates request, prevents duplicates

**TASK-014: Email Service Setup** (2h)
- [ ] Set up SendGrid account
- [ ] Create email service (`/src/services/emailService.ts`)
- [ ] Create email templates (React Email)
- [ ] Test email sending
- **Acceptance:** Can send test email

---

#### **Day 3-4: Admin Approval (16h)**

**TASK-015: Access Request Queue UI** (8h)
- [ ] Create `/org/[slug]/admin/requests/access` page
- [ ] Fetch pending requests
- [ ] Request card component
- [ ] Approval modal component
- [ ] Denial modal component
- [ ] Real-time updates (Firestore listener)
- [ ] Pagination (50 per page)
- [ ] Search/filter
- **Acceptance:** Queue shows requests, real-time updates

**TASK-016: Access Request Approval API** (6h)
- [ ] Create `/api/organizations/[orgId]/access-requests/[id]/approve`
- [ ] Create `/api/organizations/[orgId]/access-requests/[id]/deny`
- [ ] Update request status
- [ ] Create member doc (on approve)
- [ ] Send approval/denial email
- [ ] Log admin action
- **Acceptance:** Approval creates member, sends email

**TASK-017: Verification Logic** (2h)
- [ ] Email domain verification
- [ ] Employee ID check (if HR integration)
- [ ] Display verification badges in UI
- **Acceptance:** Shows verified/unverified status

---

#### **Day 5: Account Creation (12h)**

**TASK-018: Invitation Email Template** (3h)
- [ ] Design email template (React Email)
- [ ] Generate JWT token for invite link
- [ ] Include org branding (logo, colors)
- [ ] Add CTA button
- [ ] Test rendering
- **Acceptance:** Email looks good, link works

**TASK-019: Accept Invitation Page** (6h)
- [ ] Create `/accept-invitation` page
- [ ] Parse and validate JWT token
- [ ] Pre-fill email/name (disabled fields)
- [ ] Password input
- [ ] Create Firebase Auth user
- [ ] Update member status to 'active'
- [ ] Auto-login
- [ ] Redirect to properties page
- **Acceptance:** Can create account from invite link

**TASK-020: Error Handling** (3h)
- [ ] Expired token → error message
- [ ] Already used token → error message
- [ ] Invalid token → error message
- [ ] Firebase Auth errors → user-friendly messages
- [ ] Retry logic
- **Acceptance:** All error cases handled gracefully

---

### **Sprint 3: Property Browsing (Week 3) - 40 hours**

**Goal:** Employees can browse properties and view details

#### **Day 1-2: Property List (16h)**

**TASK-021: Property Service** (3h)
- [ ] Create `/src/services/propertyService.ts`
- [ ] Get all properties for organization
- [ ] Search properties (name, location)
- [ ] Filter properties (capacity, amenities)
- [ ] Sort properties
- **Acceptance:** Service methods work, tested

**TASK-022: Property List Page** (8h)
- [ ] Create `/org/[slug]/properties` page
- [ ] Fetch properties from Firestore
- [ ] Property card component
- [ ] Grid layout (responsive)
- [ ] Search bar
- [ ] Filter dropdowns
- [ ] Sort dropdown
- [ ] Loading state
- [ ] Empty state
- **Acceptance:** Properties display, search/filter works

**TASK-023: Guest Mode Banner** (2h)
- [ ] Create banner component
- [ ] Check user access level
- [ ] Show banner if guest mode
- [ ] CTA to request booking
- **Acceptance:** Banner shows for guest users

**TASK-024: Property Images** (3h)
- [ ] Image upload in admin
- [ ] Image optimization (resize, WebP)
- [ ] Lazy loading
- [ ] Placeholder images
- **Acceptance:** Images load fast, look good

---

#### **Day 3-4: Property Details (16h)**

**TASK-025: Property Details Page** (10h)
- [ ] Create `/org/[slug]/properties/[id]` page
- [ ] Fetch property details
- [ ] Image gallery component
- [ ] Details sections (amenities, rules, etc.)
- [ ] Availability calendar (read-only)
- [ ] WiFi credentials (if member)
- [ ] Request Booking CTA
- [ ] Breadcrumb navigation
- [ ] Share button
- **Acceptance:** Details page shows all info, CTA works

**TASK-026: Availability Calendar Component** (6h)
- [ ] Create calendar component (react-big-calendar)
- [ ] Fetch booked dates for property
- [ ] Show booked dates in calendar
- [ ] Show blocked dates
- [ ] Month/week view toggle
- [ ] Navigate months
- [ ] Responsive (mobile-friendly)
- **Acceptance:** Calendar shows availability correctly

---

#### **Day 5: Polish & Testing (8h)**

**TASK-027: Mobile Responsiveness** (4h)
- [ ] Test all pages on mobile
- [ ] Fix layout issues
- [ ] Test touch interactions
- [ ] Test property cards on small screens
- **Acceptance:** All pages work well on mobile

**TASK-028: Loading States** (2h)
- [ ] Skeleton loaders for property cards
- [ ] Skeleton loader for details page
- [ ] Loading spinner for forms
- **Acceptance:** Loading states look good

**TASK-029: Error States** (2h)
- [ ] 404 page for missing property
- [ ] Network error handling
- [ ] Empty search results
- **Acceptance:** Error states handled

---

### **Sprint 4: Booking Requests (Week 4) - 40 hours**

**Goal:** Complete booking request workflow + admin dashboard

#### **Day 1-2: Booking Request (16h)**

**TASK-030: Booking Service** (4h)
- [ ] Create `/src/services/bookingService.ts`
- [ ] Create booking request
- [ ] Check for conflicts
- [ ] Check user quota
- [ ] Validate dates
- **Acceptance:** Service methods work, validation working

**TASK-031: Booking Request Form** (8h)
- [ ] Create `/org/[slug]/properties/[id]/request-booking` page
- [ ] Date picker component (check-in/check-out)
- [ ] Validate dates (no conflicts, future only)
- [ ] Number of guests input
- [ ] Purpose dropdown
- [ ] Notes textarea
- [ ] Price calculation (if applicable)
- [ ] Submit to Firestore
- [ ] Success message
- **Acceptance:** Form validates, submits correctly

**TASK-032: Booking Request API** (4h)
- [ ] Create `/api/organizations/[orgId]/booking-requests` endpoint
- [ ] Validate input
- [ ] Check conflicts
- [ ] Check quota
- [ ] Create Firestore doc
- [ ] Send notification to admin
- **Acceptance:** API creates request, validates correctly

---

#### **Day 3-4: Admin Booking Approval (20h)**

**TASK-033: Booking Request Queue UI** (10h)
- [ ] Create `/org/[slug]/admin/requests/bookings` page
- [ ] Fetch pending booking requests
- [ ] Booking request card component
- [ ] Show employee info, property, dates
- [ ] Show conflict warnings
- [ ] Show employee booking history
- [ ] Approval modal with payment settings
- [ ] Denial modal with reason
- [ ] Real-time updates
- [ ] Pagination
- [ ] Filter by property, date
- **Acceptance:** Queue shows requests, approval modal works

**TASK-034: Booking Approval API** (6h)
- [ ] Create `/api/organizations/[orgId]/booking-requests/[id]/approve`
- [ ] Create `/api/organizations/[orgId]/booking-requests/[id]/deny`
- [ ] Create actual booking (on approve)
- [ ] Update request status
- [ ] Send confirmation email
- [ ] Send invoice (if payment required)
- [ ] Log admin action
- **Acceptance:** Approval creates booking, sends email

**TASK-035: Conflict Detection Logic** (4h)
- [ ] Check date overlaps
- [ ] Show warnings in UI
- [ ] Prevent double-booking
- [ ] Suggest alternative dates
- **Acceptance:** Conflicts detected and displayed

---

#### **Day 5: Dashboard & Final Polish (4h)**

**TASK-036: Admin Dashboard Stats** (2h)
- [ ] Calculate stats (properties, members, bookings)
- [ ] Create stats API endpoint
- [ ] Display stats cards on dashboard
- [ ] Real-time updates
- **Acceptance:** Stats display correctly, update in real-time

**TASK-037: Recent Activity Feed** (2h)
- [ ] Fetch recent admin actions
- [ ] Fetch recent bookings
- [ ] Display in dashboard
- **Acceptance:** Activity feed shows recent items

---

## 📊 Database Schema (Detailed)

### **organizations/{orgId}**

```typescript
interface Organization {
  // Identity
  id: string;                           // Auto-generated
  name: string;                         // "Íslandsbanki"
  slug: string;                         // "islandsbanki" (unique)
  type: 'company' | 'union' | 'municipality';

  // Branding
  logo_url?: string;                    // Storage URL
  primary_color?: string;               // Hex color
  secondary_color?: string;

  // Subscription
  subscription_tier: 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'expired';
  subscription_start: Timestamp;
  subscription_end: Timestamp;
  billing_email: string;

  // Settings
  settings: {
    // Access control
    require_access_approval: boolean;   // Default: true
    auto_approve_company_email: boolean; // Default: false
    allowed_email_domains: string[];    // ['company.is']

    // Booking control
    require_booking_approval: boolean;  // Default: true

    // Payment
    payment_required: boolean;          // Default: false
    payment_method?: 'invoice' | 'online' | 'payroll' | 'free';
    price_per_night?: number;           // In ISK

    // Booking rules
    max_nights_per_booking?: number;
    max_bookings_per_year?: number;
    advance_booking_days?: number;      // How far ahead can book
  };

  // Admin users
  admin_user_ids: string[];             // Array of Firebase Auth UIDs

  // Stats (denormalized for performance)
  stats: {
    total_properties: number;
    total_members: number;
    active_members: number;
    total_bookings: number;
  };

  // Metadata
  created_at: Timestamp;
  created_by: string;                   // Firebase Auth UID
  updated_at: Timestamp;
}

// Firestore path: /organizations/{orgId}
```

**Indexes:**
- `slug` (unique)
- `subscription_status`
- `created_at`

---

### **organizations/{orgId}/access_requests/{requestId}**

```typescript
interface AccessRequest {
  id: string;

  // Requester
  email: string;                        // Must be unique (no duplicates)
  name: string;
  employee_id?: string;
  department?: string;
  phone?: string;
  reason?: string;

  // Status
  status: 'pending' | 'approved' | 'denied';

  // Verification (auto-computed)
  email_domain_verified: boolean;       // @company.is match
  employee_id_verified: boolean;        // HR system match

  // Admin action
  reviewed_by?: string;                 // Admin UID
  reviewed_at?: Timestamp;
  review_notes?: string;                // Internal admin notes
  denial_reason?: string;               // Shown to employee if denied

  // Metadata
  requested_at: Timestamp;
  ip_address?: string;                  // For security
}

// Firestore path: /organizations/{orgId}/access_requests/{requestId}
```

**Indexes:**
- `status`
- `email`
- `requested_at`

---

### **organizations/{orgId}/members/{userId}**

```typescript
interface OrganizationMember {
  id: string;                           // Firebase Auth UID
  user_id: string;                      // Same as ID (for consistency)
  email: string;
  name: string;

  // Employment
  employee_id?: string;
  department?: string;
  hire_date?: Timestamp;

  // Access
  status: 'pending' | 'approved' | 'active' | 'suspended';
  access_level: 'guest' | 'full';
  // guest: Can browse, must request bookings
  // full: Can book directly (future feature)

  // Approval
  approved_by?: string;                 // Admin UID
  approved_at?: Timestamp;
  approval_method?: 'manual' | 'auto';  // How they were approved

  // Usage
  bookings_this_year: number;           // Count
  bookings_total: number;               // All-time count
  days_booked_this_year: number;        // Total nights
  last_booking_date?: Timestamp;

  // Payment
  payment_balance: number;              // Outstanding amount (ISK)
  total_paid: number;                   // Lifetime payments

  // Metadata
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Firestore path: /organizations/{orgId}/members/{userId}
```

**Indexes:**
- `status`
- `access_level`
- `email`
- `bookings_this_year`

---

### **organizations/{orgId}/booking_requests/{requestId}**

```typescript
interface BookingRequest {
  id: string;

  // Requester
  user_id: string;                      // Firebase Auth UID
  user_name: string;                    // Denormalized
  user_email: string;                   // Denormalized

  // Booking details
  house_id: string;
  house_name: string;                   // Denormalized
  start_date: Timestamp;
  end_date: Timestamp;
  num_nights: number;                   // Calculated
  num_guests: number;

  // Purpose
  purpose: 'personal' | 'family' | 'work_retreat';
  notes?: string;

  // Status
  status: 'pending' | 'approved' | 'denied' | 'cancelled';

  // Validation
  has_conflicts: boolean;               // Auto-computed
  conflict_details?: string;            // If conflicts exist
  quota_check_passed: boolean;          // Did user have quota?

  // Admin action
  reviewed_by?: string;
  reviewed_at?: Timestamp;
  review_notes?: string;
  denial_reason?: string;

  // Payment
  payment_required: boolean;
  payment_amount?: number;              // ISK
  payment_method?: 'invoice' | 'online' | 'payroll' | 'free';
  payment_status?: 'pending' | 'paid' | 'invoiced';
  invoice_id?: string;

  // If approved
  booking_id?: string;                  // Link to actual booking

  // Metadata
  requested_at: Timestamp;
  ip_address?: string;
}

// Firestore path: /organizations/{orgId}/booking_requests/{requestId}
```

**Indexes:**
- `status`
- `user_id`
- `house_id`
- `start_date`
- `requested_at`

---

### **houses/{houseId}**

```typescript
interface House {
  id: string;

  // Basic info
  name: string;                         // "Sumarhús við Þingvallavatn"
  address: string;
  location?: {
    lat: number;
    lng: number;
  };

  // Organization
  organization_id?: string;             // If belongs to org
  organization_name?: string;           // Denormalized

  // Property details
  capacity: number;                     // Max guests
  bedrooms: number;
  bathrooms: number;
  square_meters?: number;

  // Media
  image_url?: string;                   // Main image
  gallery_urls?: string[];              // Additional photos

  // Amenities
  amenities: string[];                  // ['wifi', 'hottub', 'bbq', ...]

  // Guest info
  house_rules?: string;                 // Markdown
  check_in_time?: string;               // "15:00"
  check_out_time?: string;              // "11:00"
  wifi_ssid?: string;
  wifi_password?: string;
  emergency_contact?: string;

  // Booking rules (org can override)
  min_nights?: number;
  max_nights?: number;
  seasonal_availability?: {
    winter_closed?: boolean;
    available_months?: number[];        // [6,7,8] = Jun-Aug
  };

  // Metadata
  created_at: Timestamp;
  created_by: string;
  updated_at: Timestamp;
}

// Firestore path: /houses/{houseId}
```

**Indexes:**
- `organization_id`
- `capacity`
- `created_at`

---

### **houses/{houseId}/bookings/{bookingId}**

```typescript
interface Booking {
  id: string;

  // Property
  house_id: string;
  organization_id?: string;

  // Booker
  user_id: string;
  user_name: string;                    // Denormalized
  user_email: string;                   // Denormalized

  // Dates
  start: Timestamp;
  end: Timestamp;
  num_nights: number;
  num_guests: number;

  // Type
  type: 'personal' | 'family' | 'work_retreat';
  notes?: string;

  // Status
  status: 'confirmed' | 'cancelled' | 'completed';

  // Payment
  payment_amount: number;               // ISK
  payment_status: 'pending' | 'paid' | 'invoiced';
  payment_method?: 'invoice' | 'online' | 'payroll' | 'free';
  payment_due_date?: Timestamp;
  invoice_id?: string;
  paid_at?: Timestamp;

  // Admin
  approved_by?: string;
  approved_at?: Timestamp;
  created_from_request_id?: string;     // Link to booking request

  // Metadata
  created_at: Timestamp;
  cancelled_at?: Timestamp;
  cancelled_by?: string;
  cancellation_reason?: string;
}

// Firestore path: /houses/{houseId}/bookings/{bookingId}
```

**Indexes:**
- `house_id, start` (compound)
- `house_id, end` (compound)
- `user_id, start` (compound)
- `organization_id, start` (compound)
- `status, start` (compound)

---

### **organizations/{orgId}/admin_actions/{actionId}**

```typescript
interface AdminAction {
  id: string;

  // Admin
  admin_user_id: string;
  admin_name: string;                   // Denormalized

  // Action
  action_type:
    | 'approve_access'
    | 'deny_access'
    | 'approve_booking'
    | 'deny_booking'
    | 'cancel_booking'
    | 'suspend_member'
    | 'reactivate_member'
    | 'update_settings';

  // Target
  target_id: string;                    // Request/Booking/Member ID
  target_type: 'access_request' | 'booking_request' | 'member' | 'settings';
  target_name?: string;                 // For display

  // Details
  details?: string;                     // JSON string
  notes?: string;                       // Admin notes

  // Metadata
  timestamp: Timestamp;
  ip_address?: string;
}

// Firestore path: /organizations/{orgId}/admin_actions/{actionId}
```

**Indexes:**
- `action_type`
- `timestamp`
- `admin_user_id`

---

## 🔌 API Endpoints

### **Organizations**

```
POST /api/organizations/create
POST /api/organizations/{orgId}/update
GET  /api/organizations/{orgId}
GET  /api/organizations/slug/{slug}
```

### **Access Requests**

```
POST /api/organizations/{orgId}/access-requests
GET  /api/organizations/{orgId}/access-requests
GET  /api/organizations/{orgId}/access-requests?status=pending
POST /api/organizations/{orgId}/access-requests/{requestId}/approve
POST /api/organizations/{orgId}/access-requests/{requestId}/deny
```

### **Members**

```
GET  /api/organizations/{orgId}/members
GET  /api/organizations/{orgId}/members/{userId}
PUT  /api/organizations/{orgId}/members/{userId}
POST /api/organizations/{orgId}/members/{userId}/suspend
```

### **Properties**

```
POST /api/organizations/{orgId}/properties
GET  /api/organizations/{orgId}/properties
GET  /api/properties/{propertyId}
PUT  /api/properties/{propertyId}
DELETE /api/properties/{propertyId}
GET  /api/properties/{propertyId}/availability
```

### **Booking Requests**

```
POST /api/organizations/{orgId}/booking-requests
GET  /api/organizations/{orgId}/booking-requests
GET  /api/organizations/{orgId}/booking-requests?status=pending
POST /api/organizations/{orgId}/booking-requests/{requestId}/approve
POST /api/organizations/{orgId}/booking-requests/{requestId}/deny
```

### **Bookings**

```
GET  /api/organizations/{orgId}/bookings
GET  /api/properties/{propertyId}/bookings
GET  /api/bookings/{bookingId}
POST /api/bookings/{bookingId}/cancel
```

### **Dashboard**

```
GET  /api/organizations/{orgId}/dashboard/stats
GET  /api/organizations/{orgId}/dashboard/activity
```

### **Authentication**

```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/accept-invitation
POST /api/auth/logout
```

---

## 🧪 Testing Plan

### **Unit Tests**

**Services:**
- organizationService (CRUD operations)
- propertyService (search, filter)
- bookingService (conflict detection, validation)
- emailService (template rendering)

**Utilities:**
- Date validation
- Conflict detection algorithm
- Quota calculation

**Target:** 80% code coverage

---

### **Integration Tests**

**API Endpoints:**
- Organization creation flow
- Access request approval flow
- Booking request approval flow
- All CRUD operations

**Database:**
- Firestore security rules
- Query performance
- Index usage

---

### **E2E Tests (Playwright)**

**Critical Paths:**
1. **Organization signup to first property added**
   - Sign up → Complete wizard → Add property → Success

2. **Employee request to approved access**
   - Request access → Admin approves → Employee creates account → Can browse

3. **Booking request to confirmed booking**
   - Employee requests booking → Admin approves → Booking confirmed → Email sent

**Target:** 100% critical path coverage

---

### **Manual Testing Checklist**

- [ ] Mobile responsiveness (all pages)
- [ ] Cross-browser (Chrome, Safari, Firefox)
- [ ] Email rendering (Gmail, Outlook, Apple Mail)
- [ ] Loading states
- [ ] Error states
- [ ] Real-time updates
- [ ] Conflict detection accuracy
- [ ] Payment flow (if implemented)

---

## 🚀 Deployment Plan

### **Environment Setup**

**Development:**
- Local Firebase emulator
- Local environment variables
- Test data seeding

**Staging:**
- Vercel preview deployment
- Firebase staging project
- Test with fake data

**Production:**
- Vercel production deployment
- Firebase production project
- Real data migration

---

### **Pre-Launch Checklist**

**Code:**
- [ ] All tests passing
- [ ] No console errors
- [ ] TypeScript strict mode enabled
- [ ] ESLint warnings resolved
- [ ] Code reviewed

**Infrastructure:**
- [ ] Firebase project created
- [ ] Firestore indexes deployed
- [ ] Security rules deployed
- [ ] Storage CORS configured
- [ ] Environment variables set

**Services:**
- [ ] SendGrid account set up
- [ ] Email templates tested
- [ ] Sentry project created
- [ ] Analytics configured

**Content:**
- [ ] Error messages proofread
- [ ] Email templates proofread
- [ ] Help documentation written

**Security:**
- [ ] Security rules tested
- [ ] API rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] XSS prevention
- [ ] CSRF protection

---

### **Launch Day Tasks**

1. **Deploy to production** (Vercel)
2. **Verify Firebase connection**
3. **Send test emails**
4. **Create admin account**
5. **Add test organization**
6. **Test critical paths**
7. **Monitor error logs**
8. **Announce to pilot customer**

---

## 📊 Success Metrics (MVP)

**Technical:**
- [ ] 100% uptime during pilot
- [ ] Page load < 2 seconds
- [ ] Zero data loss incidents
- [ ] All tests passing

**Product:**
- [ ] Pilot customer can onboard in < 30 minutes
- [ ] Employees can request access in < 2 minutes
- [ ] Admin can approve request in < 1 minute
- [ ] Booking request to approval < 24 hours

**Business:**
- [ ] Pilot customer satisfaction: 8/10+
- [ ] 80%+ employee adoption (use the system)
- [ ] 50+ bookings completed during pilot
- [ ] Zero manual Excel tracking needed

---

## 🎯 Definition of Done (MVP)

**The MVP is complete when:**

1. ✅ Admin can sign up and add properties
2. ✅ Employees can request access
3. ✅ Admin can approve/deny access requests
4. ✅ Employees can browse properties
5. ✅ Employees can request bookings
6. ✅ Admin can approve/deny booking requests
7. ✅ Confirmed bookings show on calendar
8. ✅ Email notifications work for all actions
9. ✅ Mobile-responsive on all pages
10. ✅ Deployed to production (Vercel)
11. ✅ Pilot customer is live and using it
12. ✅ Documentation complete

---

## 📅 Timeline Summary

| Sprint | Week | Focus | Hours | Completion |
|--------|------|-------|-------|------------|
| 1 | Week 1 | Foundation, Org Setup | 40 | Setup complete |
| 2 | Week 2 | Access Requests | 40 | Access flow done |
| 3 | Week 3 | Property Browsing | 40 | Browsing done |
| 4 | Week 4 | Booking Requests | 40 | MVP complete |

**Total:** 160 hours (4 weeks × 40 hours)

**Target Launch:** March 16, 2026 (4 weeks from now)

---

## 🎉 Next Steps

**Immediate actions:**
1. ✅ Review this document
2. ✅ Approve scope and timeline
3. ✅ Set up Firebase project
4. ✅ Start TASK-001 (Project initialization)

**Shall we start building? 🚀**
