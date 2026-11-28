# Bustadurinn.is - System Architecture
## Corporate/Employee Association Model

**Focus:** Starfsmannafélög og Fyrirtæki
**Date:** 16. febrúar 2026

---

## 🎯 Core Concept

**Problem:** Fyrirtæki vita ekki:
- Hverjir ættu að hafa aðgang
- Hvort starfsmenn greiða fyrir afnot
- Hvernig á að úthluta réttmætum aðgangi

**Solution:** **Two-stage approval workflow**

```
Employee Request → Admin Approval → Guest Access → Booking Request → Admin Approval → Confirmed
```

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     BUSTADURINN.IS SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │             ORGANIZATION ADMIN PORTAL                   │    │
│  │                                                         │    │
│  │  • Central dashboard (all properties)                   │    │
│  │  • Member approval queue                                │    │
│  │  • Booking approval queue                               │    │
│  │  • Analytics & reports                                  │    │
│  │  • Settings & configuration                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ▲                                   │
│                              │                                   │
│                              │ Approval Actions                  │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │          EMPLOYEE SELF-SERVICE PORTAL                   │    │
│  │                                                         │    │
│  │  1. Request Access (signup)                             │    │
│  │  2. Browse Properties (guest mode after approval)       │    │
│  │  3. Request Booking                                     │    │
│  │  4. Manage Bookings (after confirmation)                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Complete User Flow Diagram

### **Flow 1: Company Onboarding (Setup)**

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: Company Admin Signs Up                             │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Sign up as Organization Admin  │
         │  • Company name                 │
         │  • Email                        │
         │  • Password                     │
         └─────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 2: Organization Setup Wizard                          │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Company Details                │
         │  • Logo upload                  │
         │  • Industry                     │
         │  • Employee count               │
         └─────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Add Properties                 │
         │  • Sumarhús 1                   │
         │  • Sumarhús 2                   │
         │  • Import CSV (optional)        │
         └─────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Access Control Settings        │
         │  • Require approval? [✓]        │
         │  • Require booking approval? [✓]│
         │  • Payment required? [✓/✗]      │
         └─────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Share Employee Signup Link     │
         │  https://company.bustadurinn.is │
         │  • Email to all employees       │
         │  • Post on intranet             │
         └─────────────────────────────────┘
                           │
                           ▼
                    [Setup Complete]
```

---

### **Flow 2: Employee Access Request**

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: Employee Discovers Portal                          │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Email from HR or Intranet Post│
         │  "Við erum með nýtt sumarhúsa-  │
         │   bókunarkerfi!"                │
         │                                 │
         │  [Skoða Sumarhús →]             │
         └─────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 2: Landing Page (company.bustadurinn.is)              │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Welcome to [Company] Sumarhús  │
         │                                 │
         │  We have 8 beautiful properties │
         │  available for employees.       │
         │                                 │
         │  [Request Access] [Login]       │
         └─────────────────────────────────┘
                           │
                   Employee clicks "Request Access"
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 3: Access Request Form                                │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Request Access                 │
         │                                 │
         │  Email: [___@company.is]        │
         │  Name: [_____________]          │
         │  Department: [_________]        │
         │  Employee ID: [______]          │
         │                                 │
         │  Why do you want access?        │
         │  [I'm an employee and would     │
         │   like to book sumarhús...]     │
         │                                 │
         │  [Submit Request]               │
         └─────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  ✓ Request Submitted            │
         │                                 │
         │  Thank you! Your request has    │
         │  been sent to HR for approval.  │
         │                                 │
         │  You'll receive an email when   │
         │  approved (usually within 1-2   │
         │  business days).                │
         └─────────────────────────────────┘
                           │
                           ▼
                 [Wait for Admin Approval]
```

---

### **Flow 3: Admin Approval Process**

```
┌──────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD: Pending Requests                          │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  🔔 5 New Access Requests       │
         │                                 │
         │  [View Requests →]              │
         └─────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Access Request Queue                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Request #1                              [Pending]   │    │
│  │ ───────────────────────────────────────────────────│    │
│  │ Name: Jón Jónsson                                  │    │
│  │ Email: jon@company.is                              │    │
│  │ Employee ID: 12345                                 │    │
│  │ Department: IT                                     │    │
│  │ Requested: Feb 16, 2026 10:30                      │    │
│  │                                                     │    │
│  │ Reason: "I'm an employee and would like to use     │    │
│  │         the summer houses with my family."         │    │
│  │                                                     │    │
│  │ ✓ Verified in employee database                    │    │
│  │                                                     │    │
│  │ [✓ Approve]  [✗ Deny]  [📧 Request Info]          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Request #2                              [Pending]   │    │
│  │ ───────────────────────────────────────────────────│    │
│  │ Name: Anna Sigurðardóttir                          │    │
│  │ Email: anna@gmail.com ⚠️ (not company email)       │    │
│  │ Employee ID: 99999                                 │    │
│  │ Department: Sales                                  │    │
│  │                                                     │    │
│  │ ⚠️ Not found in employee database                  │    │
│  │                                                     │    │
│  │ [✓ Approve]  [✗ Deny]  [📧 Request Info]          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                           │
                  Admin clicks "Approve" for #1
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Approval Confirmation          │
         │                                 │
         │  Approve access for:            │
         │  Jón Jónsson (jon@company.is)   │
         │                                 │
         │  Access level:                  │
         │  (•) Guest (browse only)        │
         │  ( ) Full (browse + book)       │
         │                                 │
         │  Send welcome email: [✓]        │
         │                                 │
         │  [Confirm Approval]  [Cancel]   │
         └─────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  ✓ Approved!                    │
         │                                 │
         │  Jón has been approved and      │
         │  will receive an email with     │
         │  login instructions.            │
         └─────────────────────────────────┘
                           │
                           ▼
              [Email Sent to Employee]
```

---

### **Flow 4: Employee Receives Approval**

```
┌──────────────────────────────────────────────────────────────┐
│  EMPLOYEE INBOX: Approval Email                             │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  From: Company Sumarhús          │
         │  Subject: Access Approved! 🎉   │
         │  ─────────────────────────────  │
         │                                 │
         │  Hi Jón,                        │
         │                                 │
         │  Good news! Your access to      │
         │  [Company] summer houses has    │
         │  been approved.                 │
         │                                 │
         │  You can now:                   │
         │  • Browse all 8 properties      │
         │  • View availability calendars  │
         │  • Request bookings             │
         │                                 │
         │  [Create Your Account →]        │
         │                                 │
         │  This link expires in 7 days.   │
         └─────────────────────────────────┘
                           │
                  Employee clicks link
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: Create Account (One-Time Setup)                    │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Create Your Account            │
         │                                 │
         │  Email: jon@company.is ✓        │
         │  (pre-filled, verified)         │
         │                                 │
         │  Name: Jón Jónsson ✓            │
         │  (pre-filled)                   │
         │                                 │
         │  Choose Password:               │
         │  [••••••••]                     │
         │                                 │
         │  Phone (optional):              │
         │  [___-____]                     │
         │                                 │
         │  [Create Account & Login]       │
         └─────────────────────────────────┘
                           │
                           ▼
              [Account Created + Auto-Login]
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  🎉 Welcome to [Company]        │
         │     Summer Houses!              │
         │                                 │
         │  You're now ready to explore    │
         │  our properties.                │
         │                                 │
         │  [Browse Properties →]          │
         └─────────────────────────────────┘
```

---

### **Flow 5: Employee Browsing (Guest Access)**

```
┌──────────────────────────────────────────────────────────────┐
│  EMPLOYEE PORTAL: Browse Properties                         │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Properties                                      ℹ️ Guest Mode│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ [Image]          │  │ [Image]          │                │
│  │                  │  │                  │                │
│  │ Þingvallavatn    │  │ Mývatn House     │                │
│  │ Sleeps: 6        │  │ Sleeps: 4        │                │
│  │ ★★★★☆            │  │ ★★★★★            │                │
│  │                  │  │                  │                │
│  │ [View Details →] │  │ [View Details →] │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ℹ️ You're browsing as a guest. To book, submit a          │
│     booking request for admin approval.                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                           │
                  Employee clicks "View Details"
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Property Details: Þingvallavatn                            │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Sumarhús við Þingvallavatn     │
         │  [Gallery: 8 photos]            │
         │                                 │
         │  📍 Þingvallavegur 123          │
         │  👥 Sleeps: 6 people            │
         │  🛏️ 3 bedrooms                  │
         │                                 │
         │  Amenities:                     │
         │  ✓ WiFi  ✓ Hot tub  ✓ BBQ      │
         │                                 │
         │  ──────────────────────────────│
         │                                 │
         │  Availability Calendar          │
         │  [Interactive calendar showing  │
         │   available/booked dates]       │
         │                                 │
         │  ──────────────────────────────│
         │                                 │
         │  [Request Booking →]            │
         │                                 │
         └─────────────────────────────────┘
                           │
                  Employee clicks "Request Booking"
                           │
                           ▼
              [Go to Booking Request Flow]
```

---

### **Flow 6: Booking Request**

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: Booking Request Form                               │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Request Booking                │
         │                                 │
         │  Property: Þingvallavatn ✓      │
         │                                 │
         │  Check-in: [Jun 15, 2026]       │
         │  Check-out: [Jun 22, 2026]      │
         │  Nights: 7                      │
         │                                 │
         │  Number of guests: [4] ▼        │
         │                                 │
         │  Purpose:                       │
         │  (•) Personal vacation          │
         │  ( ) Family gathering           │
         │  ( ) Work retreat               │
         │                                 │
         │  Additional info:               │
         │  [We're celebrating our         │
         │   anniversary...]               │
         │                                 │
         │  ⚠️ Your request will be sent   │
         │     to HR for approval.         │
         │                                 │
         │  [Submit Request]  [Cancel]     │
         └─────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  ✓ Request Submitted            │
         │                                 │
         │  Your booking request has been  │
         │  sent to HR for approval.       │
         │                                 │
         │  Property: Þingvallavatn        │
         │  Dates: Jun 15-22, 2026         │
         │                                 │
         │  You'll receive an email when   │
         │  your request is reviewed       │
         │  (usually within 24-48 hours).  │
         │                                 │
         │  [View My Requests]             │
         └─────────────────────────────────┘
                           │
                           ▼
                 [Wait for Admin Approval]
```

---

### **Flow 7: Admin Booking Approval**

```
┌──────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD: Booking Request Queue                     │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  🔔 3 Pending Booking Requests  │
         │                                 │
         │  [Review Requests →]            │
         └─────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Booking Approval Queue                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Request #1                              [Pending]   │    │
│  │ ───────────────────────────────────────────────────│    │
│  │ Employee: Jón Jónsson (IT Dept.)                   │    │
│  │ Property: Þingvallavatn                            │    │
│  │ Dates: Jun 15-22, 2026 (7 nights)                  │    │
│  │ Guests: 4 people                                   │    │
│  │ Purpose: Personal vacation                         │    │
│  │                                                     │    │
│  │ Notes: "We're celebrating our anniversary..."      │    │
│  │                                                     │    │
│  │ ✓ No conflicts on calendar                         │    │
│  │ ℹ️ Jón has 0 bookings this year                    │    │
│  │                                                     │    │
│  │ Payment required: [✓]                              │    │
│  │ Amount: 25.000 kr (3.500 kr/night)                 │    │
│  │                                                     │    │
│  │ [✓ Approve]  [✗ Deny]  [📧 Ask Question]          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Request #2                              [Pending]   │    │
│  │ ───────────────────────────────────────────────────│    │
│  │ Employee: Anna Sigurðardóttir                      │    │
│  │ Property: Þingvallavatn ⚠️                         │    │
│  │ Dates: Jun 20-25, 2026 (5 nights)                  │    │
│  │                                                     │    │
│  │ ⚠️ CONFLICT with Request #1!                       │    │
│  │ Overlaps: Jun 20-22                                │    │
│  │                                                     │    │
│  │ [View Calendar]  [Contact Anna]                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                           │
                  Admin clicks "Approve" for #1
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Approve Booking                │
         │                                 │
         │  Jón Jónsson                    │
         │  Þingvallavatn                  │
         │  Jun 15-22, 2026                │
         │                                 │
         │  Payment required: [✓]          │
         │  Amount: 25.000 kr              │
         │                                 │
         │  Payment instructions:          │
         │  ( ) Pay now (online)           │
         │  (•) Invoice (pay later)        │
         │  ( ) Deduct from paycheck       │
         │  ( ) Free (no payment)          │
         │                                 │
         │  Send confirmation email: [✓]   │
         │                                 │
         │  [Confirm Approval]  [Cancel]   │
         └─────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  ✓ Booking Approved!            │
         │                                 │
         │  • Calendar updated             │
         │  • Jón notified via email       │
         │  • Invoice sent                 │
         └─────────────────────────────────┘
```

---

### **Flow 8: Employee Receives Confirmation**

```
┌──────────────────────────────────────────────────────────────┐
│  EMPLOYEE INBOX: Booking Confirmed                          │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  From: Company Sumarhús          │
         │  Subject: Booking Confirmed! ✓  │
         │  ─────────────────────────────  │
         │                                 │
         │  Hi Jón,                        │
         │                                 │
         │  Great news! Your booking has   │
         │  been approved.                 │
         │                                 │
         │  Property: Þingvallavatn        │
         │  Dates: Jun 15-22, 2026         │
         │  Check-in: 15:00               │
         │  Check-out: 11:00              │
         │                                 │
         │  Payment: 25.000 kr            │
         │  Invoice attached (due Mar 1)   │
         │                                 │
         │  WiFi: SumarhusWiFi / pass123   │
         │                                 │
         │  [View Booking Details]         │
         │  [Add to Calendar]             │
         │                                 │
         │  Have a great stay!             │
         └─────────────────────────────────┘
                           │
                  Employee clicks "View Booking Details"
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  My Booking                     │
         │                                 │
         │  Þingvallavatn                  │
         │  Jun 15-22, 2026               │
         │  [Map] [Directions]             │
         │                                 │
         │  Status: ✓ Confirmed            │
         │  Payment: Invoice (Due Mar 1)   │
         │                                 │
         │  House Info:                    │
         │  • WiFi: SumarhusWiFi / pass123 │
         │  • Keys: Lockbox (code: 1234)   │
         │  • Emergency: +354 XXX-XXXX     │
         │                                 │
         │  [Cancel Booking]               │
         │  [Contact Support]              │
         └─────────────────────────────────┘
```

---

## 🗄️ Database Schema

### **Collections Overview**

```
firestore/
├── organizations/{orgId}
│   ├── org data
│   └── subcollections:
│       ├── members/{userId}
│       ├── access_requests/{requestId}
│       ├── booking_requests/{requestId}
│       └── admin_actions/{actionId}
│
├── houses/{houseId}
│   ├── house data
│   └── subcollections:
│       └── bookings/{bookingId}
│
└── users/{userId}
    └── user data
```

---

### **1. organizations/{orgId}**

```typescript
interface Organization {
  id: string;
  name: string;                    // "Íslandsbanki"
  slug: string;                    // "islandsbanki"
  type: 'company' | 'union' | 'municipality';

  // Branding
  logo_url?: string;
  primary_color?: string;

  // Subscription
  subscription_tier: 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'expired';
  subscription_start: Timestamp;
  subscription_end: Timestamp;

  // Access Control Settings
  settings: {
    require_access_approval: boolean;      // Default: true
    require_booking_approval: boolean;     // Default: true

    // Payment settings
    payment_required: boolean;             // Starfsmenn greiða?
    payment_method: 'invoice' | 'online' | 'payroll' | 'free';
    price_per_night?: number;              // e.g. 3500 kr

    // Access rules
    auto_approve_company_email: boolean;   // Auto-approve @company.is emails
    allowed_email_domains: string[];       // ['company.is', 'subsidiary.is']

    // Booking rules
    max_nights_per_booking?: number;
    max_bookings_per_year?: number;
    advance_booking_days?: number;
  };

  // Admin users
  admin_user_ids: string[];

  // Stats
  stats: {
    total_properties: number;
    total_members: number;
    total_bookings: number;
  };

  created_at: Timestamp;
  created_by: string;
}
```

---

### **2. organizations/{orgId}/access_requests/{requestId}**

```typescript
interface AccessRequest {
  id: string;

  // Requester info
  email: string;
  name: string;
  employee_id?: string;
  department?: string;
  phone?: string;

  // Request details
  reason?: string;                    // Why they want access
  requested_at: Timestamp;

  // Status
  status: 'pending' | 'approved' | 'denied';

  // Admin action
  reviewed_by?: string;               // Admin user ID
  reviewed_at?: Timestamp;
  review_notes?: string;              // Internal notes

  // Auto-verification
  verified_in_hr_system?: boolean;    // If integrated with HR
  email_domain_match?: boolean;       // @company.is match
}
```

---

### **3. organizations/{orgId}/members/{userId}**

```typescript
interface OrganizationMember {
  id: string;                         // Firebase Auth UID
  user_id: string;
  email: string;
  name: string;

  // Employee info
  employee_id?: string;
  department?: string;
  hire_date?: Timestamp;

  // Access
  status: 'pending' | 'approved' | 'active' | 'suspended';
  access_level: 'guest' | 'full';
  // guest: Can browse, must request bookings
  // full: Can browse and book directly (after approval)

  // Approved by
  approved_by?: string;
  approved_at?: Timestamp;

  // Usage tracking
  bookings_this_year: number;
  total_bookings: number;
  last_booking_date?: Timestamp;

  // Payment
  payment_balance: number;            // Outstanding amount

  created_at: Timestamp;
}
```

---

### **4. organizations/{orgId}/booking_requests/{requestId}**

```typescript
interface BookingRequest {
  id: string;

  // Requester
  user_id: string;
  user_name: string;
  user_email: string;

  // Booking details
  house_id: string;
  house_name: string;
  start_date: Timestamp;
  end_date: Timestamp;
  num_nights: number;
  num_guests: number;

  // Purpose
  purpose: 'personal' | 'family' | 'work_retreat';
  notes?: string;

  // Status
  status: 'pending' | 'approved' | 'denied' | 'cancelled';

  // Admin action
  reviewed_by?: string;
  reviewed_at?: Timestamp;
  review_notes?: string;
  denial_reason?: string;

  // Payment
  payment_required: boolean;
  payment_amount?: number;
  payment_status?: 'pending' | 'paid' | 'invoiced';
  invoice_id?: string;

  // Validation
  has_conflicts: boolean;
  conflict_details?: string;

  requested_at: Timestamp;

  // If approved, link to actual booking
  booking_id?: string;
}
```

---

### **5. houses/{houseId}/bookings/{bookingId}**

```typescript
interface Booking {
  id: string;

  // Property
  house_id: string;
  organization_id?: string;

  // Booker
  user_id: string;
  user_name: string;
  user_email: string;

  // Dates
  start: Timestamp;
  end: Timestamp;
  num_nights: number;
  num_guests: number;

  // Type
  type: 'personal' | 'family' | 'work_retreat';
  notes?: string;

  // Status
  status: 'confirmed' | 'cancelled';

  // Payment
  payment_amount: number;
  payment_status: 'pending' | 'paid' | 'invoiced';
  payment_due_date?: Timestamp;
  invoice_id?: string;

  // Metadata
  created_at: Timestamp;
  created_from_request_id?: string;   // Link back to request
  approved_by?: string;
  approved_at?: Timestamp;
}
```

---

### **6. organizations/{orgId}/admin_actions/{actionId}**

```typescript
interface AdminAction {
  id: string;

  // Admin
  admin_user_id: string;
  admin_name: string;

  // Action
  action_type:
    | 'approve_access'
    | 'deny_access'
    | 'approve_booking'
    | 'deny_booking'
    | 'cancel_booking'
    | 'suspend_member';

  // Target
  target_id: string;                  // Request ID or User ID
  target_type: 'access_request' | 'booking_request' | 'member';

  // Details
  details?: string;
  notes?: string;

  timestamp: Timestamp;
}
```

---

## 🎨 Screen Mockups

### **Admin Dashboard - Main View**

```
┌────────────────────────────────────────────────────────────────┐
│  Íslandsbanki Sumarhús                          [Profile ▼]    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐    │
│  │ Overview │ Requests │ Bookings │ Members  │ Settings │    │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘    │
│                                                                │
│  ──────────────────────────────────────────────────────────  │
│                                                                │
│  DASHBOARD OVERVIEW                                            │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ 🏠 Properties │  │ 👥 Members    │  │ 📅 Bookings   │        │
│  │              │  │              │  │              │        │
│  │      8       │  │     142      │  │     23       │        │
│  │  properties  │  │   members    │  │  this month  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ 🔔 Pending    │  │ 💰 Revenue    │  │ 📊 Occupancy  │        │
│  │              │  │              │  │              │        │
│  │  5 Access    │  │   385.000 kr │  │     68%      │        │
│  │  3 Bookings  │  │   this month │  │  this month  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                │
│  ──────────────────────────────────────────────────────────  │
│                                                                │
│  🔔 PENDING ACTIONS                                            │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🆕 5 Access Requests              [Review All →]     │    │
│  │ ───────────────────────────────────────────────────  │    │
│  │ • Jón Jónsson (IT) - 2 hours ago                     │    │
│  │ • Anna Sigurðardóttir (Sales) - 5 hours ago          │    │
│  │ • Gunnar Gunnarsson (Finance) - 1 day ago            │    │
│  │ ...                                                   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 📅 3 Booking Requests             [Review All →]     │    │
│  │ ───────────────────────────────────────────────────  │    │
│  │ • Sigurður wants Þingvallavatn (Jun 15-22)           │    │
│  │ • María wants Mývatn (Jul 1-8)                       │    │
│  │ • Pétur wants Snæfellsnes (Aug 10-15)                │    │
│  │ ...                                                   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  ──────────────────────────────────────────────────────────  │
│                                                                │
│  RECENT ACTIVITY                                               │
│                                                                │
│  • 10:30 - You approved booking for Jón (Þingvallavatn)      │
│  • 09:15 - New access request from Anna                       │
│  • Yesterday - María cancelled booking (Mývatn, Aug 1-5)      │
│  • 2 days ago - You approved access for 3 members             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### **Admin - Access Request Queue**

```
┌────────────────────────────────────────────────────────────────┐
│  Íslandsbanki Sumarhús                          [Profile ▼]    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐    │
│  │ Overview │ REQUESTS │ Bookings │ Members  │ Settings │    │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘    │
│                                                                │
│  ──────────────────────────────────────────────────────────  │
│                                                                │
│  ACCESS REQUESTS (5 Pending)                                   │
│                                                                │
│  [Filter: All ▼]  [Sort: Newest ▼]  [Search...]               │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ REQUEST #1                                [Pending]   │    │
│  │ ─────────────────────────────────────────────────────│    │
│  │                                                       │    │
│  │ Name: Jón Jónsson                                     │    │
│  │ Email: jon.jonsson@islandsbanki.is ✓                  │    │
│  │ Employee ID: IB-12345                                 │    │
│  │ Department: IT                                        │    │
│  │                                                       │    │
│  │ Requested: Feb 16, 2026 10:30                         │    │
│  │                                                       │    │
│  │ Reason:                                               │    │
│  │ "I'm an employee and would like to use the summer     │    │
│  │  houses with my family during vacation."              │    │
│  │                                                       │    │
│  │ ✓ Email domain verified (@islandsbanki.is)            │    │
│  │ ✓ Employee ID found in HR system                      │    │
│  │ ℹ️ First-time request                                 │    │
│  │                                                       │    │
│  │ ┌───────────────────────────────────────────────┐    │    │
│  │ │ [✓ Approve]  [✗ Deny]  [📧 Request More Info] │    │    │
│  │ └───────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ REQUEST #2                                [Pending]   │    │
│  │ ─────────────────────────────────────────────────────│    │
│  │                                                       │    │
│  │ Name: Anna Sigurðardóttir                             │    │
│  │ Email: anna.s@gmail.com ⚠️                            │    │
│  │ Employee ID: (not provided)                           │    │
│  │ Department: Sales                                     │    │
│  │                                                       │    │
│  │ Requested: Feb 16, 2026 08:15                         │    │
│  │                                                       │    │
│  │ Reason:                                               │    │
│  │ "I work in sales department and heard about summer    │    │
│  │  houses from colleague."                              │    │
│  │                                                       │    │
│  │ ⚠️ Email not @islandsbanki.is domain                  │    │
│  │ ⚠️ No employee ID provided                            │    │
│  │ ⚠️ Cannot verify in HR system                         │    │
│  │                                                       │    │
│  │ ┌───────────────────────────────────────────────┐    │    │
│  │ │ [✓ Approve]  [✗ Deny]  [📧 Request More Info] │    │    │
│  │ └───────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  [Load More...]                                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### **Admin - Booking Request Queue**

```
┌────────────────────────────────────────────────────────────────┐
│  Íslandsbanki Sumarhús                          [Profile ▼]    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐    │
│  │ Overview │ Requests │ BOOKINGS │ Members  │ Settings │    │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘    │
│                                                                │
│  ──────────────────────────────────────────────────────────  │
│                                                                │
│  BOOKING REQUESTS (3 Pending)                                  │
│                                                                │
│  [Filter: Pending ▼]  [Property: All ▼]  [Search...]          │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ BOOKING REQUEST #1                        [Pending]   │    │
│  │ ─────────────────────────────────────────────────────│    │
│  │                                                       │    │
│  │ Employee: Jón Jónsson (IT Department)                 │    │
│  │ Email: jon.jonsson@islandsbanki.is                    │    │
│  │                                                       │    │
│  │ Property: Sumarhús við Þingvallavatn                  │    │
│  │ Dates: June 15 - June 22, 2026 (7 nights)            │    │
│  │ Guests: 4 people                                      │    │
│  │                                                       │    │
│  │ Purpose: Personal vacation                            │    │
│  │ Notes: "Celebrating our anniversary with family"      │    │
│  │                                                       │    │
│  │ Requested: Feb 16, 2026 11:45                         │    │
│  │                                                       │    │
│  │ ✓ No calendar conflicts                               │    │
│  │ ℹ️ Jón has 0 bookings this year                       │    │
│  │ ℹ️ Member since: Jan 2026 (1 month)                   │    │
│  │                                                       │    │
│  │ Payment: 24.500 kr (3.500 kr/night)                   │    │
│  │                                                       │    │
│  │ [View Calendar →]  [View Property →]                  │    │
│  │                                                       │    │
│  │ ┌───────────────────────────────────────────────┐    │    │
│  │ │ [✓ Approve & Invoice]  [✗ Deny]  [💬 Message] │    │    │
│  │ └───────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ BOOKING REQUEST #2                        [Pending]   │    │
│  │ ─────────────────────────────────────────────────────│    │
│  │                                                       │    │
│  │ Employee: Anna Sigurðardóttir (Sales)                 │    │
│  │                                                       │    │
│  │ Property: Sumarhús við Þingvallavatn                  │    │
│  │ Dates: June 20 - June 25, 2026 (5 nights)            │    │
│  │                                                       │    │
│  │ ⚠️ CONFLICT DETECTED!                                 │    │
│  │ Overlaps with Request #1 (Jun 20-22)                  │    │
│  │                                                       │    │
│  │ Options:                                              │    │
│  │ • Deny this request                                   │    │
│  │ • Contact Anna to change dates                        │    │
│  │ • Suggest alternative property (Mývatn available)     │    │
│  │                                                       │    │
│  │ ┌───────────────────────────────────────────────┐    │    │
│  │ │ [Suggest Alternative]  [✗ Deny]  [💬 Message] │    │    │
│  │ └───────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### **Employee Portal - Landing Page**

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    [Company Logo]                              │
│                                                                │
│              Íslandsbanki Sumarhús                             │
│                                                                │
│  ──────────────────────────────────────────────────────────  │
│                                                                │
│     Þú ert velkomin/n að njóta sumarhúsanna okkar!            │
│                                                                │
│     Við höfum 8 sumarhús víðs vegar um landið sem eru         │
│     í boði fyrir starfsmenn.                                   │
│                                                                │
│  ──────────────────────────────────────────────────────────  │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ [Image]      │  │ [Image]      │  │ [Image]      │        │
│  │              │  │              │  │              │        │
│  │ Þingvallavatn│  │ Mývatn       │  │ Snæfellsnes  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                │
│  ──────────────────────────────────────────────────────────  │
│                                                                │
│  Til að skoða sumarhúsin og bóka, þarftu að fá aðgang.        │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                       │    │
│  │  Ertu með aðgang?                                     │    │
│  │                                                       │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  Email: [________________@islandsbanki.is]  │     │    │
│  │  │  Password: [••••••••]                       │     │    │
│  │  │                                             │     │    │
│  │  │  [Innskrá]                                  │     │    │
│  │  │                                             │     │    │
│  │  │  [Gleymt lykilorð?]                         │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  │                                                       │    │
│  │  ──────────── eða ─────────────                      │    │
│  │                                                       │    │
│  │  Ertu nýr starfsmaður?                                │    │
│  │                                                       │    │
│  │  [Óska eftir aðgangi →]                               │    │
│  │                                                       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 State Machine: Member Status

```
┌──────────────┐
│   NEW USER   │
└──────┬───────┘
       │
       │ Submits access request
       ▼
┌──────────────┐
│   PENDING    │────────┐
└──────┬───────┘        │ Admin denies
       │                ▼
       │ Admin     ┌──────────────┐
       │ approves  │   DENIED     │
       ▼           └──────────────┘
┌──────────────┐
│   APPROVED   │ (Guest access - can browse)
└──────┬───────┘
       │
       │ Submits booking request
       │ → Admin approves
       ▼
┌──────────────┐
│    ACTIVE    │ (Full access - has bookings)
└──────┬───────┘
       │
       │ Admin can suspend
       ▼
┌──────────────┐
│  SUSPENDED   │────┐
└──────┬───────┘    │
       │            │ Admin reactivates
       │            │
       └────────────┘
```

---

## 🔄 State Machine: Booking Status

```
┌──────────────┐
│ USER SUBMITS │
│   REQUEST    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   PENDING    │────────┐
└──────┬───────┘        │ Admin denies
       │                ▼
       │ Admin     ┌──────────────┐
       │ approves  │   DENIED     │
       ▼           └──────────────┘
┌──────────────┐
│  CONFIRMED   │
└──────┬───────┘
       │
       │ User cancels OR
       │ Admin cancels OR
       │ Stay completed
       ▼
┌──────────────┐
│  CANCELLED / │
│  COMPLETED   │
└──────────────┘
```

---

## 🔧 Key Features Needed

### **1. Central Admin Dashboard**
- [x] Overview with stats
- [x] Access request queue
- [x] Booking request queue
- [x] Member management
- [x] Property management
- [x] Analytics & reports
- [x] Settings & configuration

### **2. Approval Workflows**
- [x] Access request approval
- [x] Booking request approval
- [x] Email notifications
- [x] Admin action logging
- [x] Conflict detection

### **3. Employee Portal**
- [x] Self-service signup
- [x] Property browsing (guest mode)
- [x] Booking request form
- [x] My bookings page
- [x] Profile management

### **4. Payment Integration**
- [ ] Invoice generation
- [ ] Payment tracking
- [ ] Payroll deduction option
- [ ] Online payment (Stripe/Valitor)

### **5. Notifications**
- [x] Access approved email
- [x] Booking approved email
- [x] Request denied email
- [x] Admin notification (new requests)
- [ ] SMS notifications (optional)

---

**Next Step:** Skal ég byrja að útfæra þetta? Við getum byrjað á:
1. Database setup (Firestore collections)
2. Admin Dashboard UI
3. Employee Portal UI
4. Approval workflows

Hvað viltu fara í fyrst? 🚀
