# Firestore Database Design
## Bustadurinn.is - Corporate Edition

**Version:** 1.0
**Date:** 16. febrúar 2026

---

## 📚 Table of Contents

1. [Collection Structure](#collection-structure)
2. [Document Examples](#document-examples)
3. [Security Rules](#security-rules)
4. [Indexes](#indexes)
5. [Query Patterns](#query-patterns)
6. [Denormalization Strategy](#denormalization-strategy)
7. [Data Migration](#data-migration)

---

## 🗂️ Collection Structure

### **Overview**

```
firestore/
│
├── organizations/              (Top-level: All organizations)
│   └── {orgId}/
│       ├── (org document)
│       └── subcollections:
│           ├── access_requests/
│           │   └── {requestId}
│           ├── members/
│           │   └── {userId}
│           ├── booking_requests/
│           │   └── {requestId}
│           └── admin_actions/
│               └── {actionId}
│
├── users/                      (Top-level: All users)
│   └── {userId}/
│       └── (user profile)
│
├── houses/                     (Top-level: All properties)
│   └── {houseId}/
│       ├── (house document)
│       └── subcollections:
│           └── bookings/
│               └── {bookingId}
│
└── user_roles/                 (Top-level: System roles)
    └── {userId}/
        └── (role document)
```

---

### **Why This Structure?**

**1. Organizations as Top-Level**
- ✅ Easy to query all orgs (for super admin)
- ✅ Can add org-specific subcollections
- ✅ Clear data isolation per org

**2. Subcollections for Org-Specific Data**
- ✅ Better security (scoped rules)
- ✅ Better performance (smaller queries)
- ✅ Clear ownership model

**3. Houses as Top-Level**
- ✅ Can be individual OR org-owned
- ✅ Easier to share across orgs (future)
- ✅ Simpler queries for calendar

**4. Users Separate from Members**
- ✅ One user can be member of multiple orgs
- ✅ User profile separate from org membership
- ✅ Cleaner auth flow

---

## 📄 Document Examples

### **organizations/{orgId}**

```javascript
{
  // Identity
  "id": "org_islandsbanki_abc123",
  "name": "Íslandsbanki",
  "slug": "islandsbanki",  // Unique, used in URLs
  "type": "company",

  // Branding
  "logo_url": "gs://bucket/orgs/islandsbanki/logo.png",
  "primary_color": "#003D5C",
  "secondary_color": "#00A9E0",

  // Subscription
  "subscription_tier": "pro",
  "subscription_status": "active",
  "subscription_start": Timestamp("2026-02-16T00:00:00Z"),
  "subscription_end": Timestamp("2027-02-16T00:00:00Z"),
  "billing_email": "finance@islandsbanki.is",

  // Settings
  "settings": {
    // Access control
    "require_access_approval": true,
    "auto_approve_company_email": true,
    "allowed_email_domains": ["islandsbanki.is"],

    // Booking control
    "require_booking_approval": true,

    // Payment
    "payment_required": true,
    "payment_method": "invoice",
    "price_per_night": 3500,

    // Booking rules
    "max_nights_per_booking": 14,
    "max_bookings_per_year": 3,
    "advance_booking_days": 365
  },

  // Admin users (array of Firebase Auth UIDs)
  "admin_user_ids": [
    "user_abc123",
    "user_def456"
  ],

  // Stats (denormalized for dashboard)
  "stats": {
    "total_properties": 8,
    "total_members": 142,
    "active_members": 138,
    "total_bookings": 324
  },

  // Metadata
  "created_at": Timestamp("2026-02-16T10:00:00Z"),
  "created_by": "user_abc123",
  "updated_at": Timestamp("2026-02-16T10:00:00Z")
}
```

---

### **organizations/{orgId}/access_requests/{requestId}**

```javascript
{
  "id": "req_xyz789",

  // Requester info
  "email": "jon.jonsson@islandsbanki.is",
  "name": "Jón Jónsson",
  "employee_id": "IB-12345",
  "department": "IT",
  "phone": "+3548881234",
  "reason": "I'm an employee and would like to use the summer houses.",

  // Status
  "status": "pending",  // pending | approved | denied

  // Auto-verification
  "email_domain_verified": true,   // @islandsbanki.is matches
  "employee_id_verified": false,   // No HR integration yet

  // Admin action (if reviewed)
  "reviewed_by": null,
  "reviewed_at": null,
  "review_notes": null,
  "denial_reason": null,

  // Metadata
  "requested_at": Timestamp("2026-02-16T10:30:00Z"),
  "ip_address": "123.45.67.89"
}
```

**After approval:**
```javascript
{
  // ... same as above ...
  "status": "approved",
  "reviewed_by": "user_abc123",
  "reviewed_at": Timestamp("2026-02-16T11:00:00Z"),
  "review_notes": "Verified employee"
}
```

---

### **organizations/{orgId}/members/{userId}**

```javascript
{
  "id": "user_jon123",
  "user_id": "user_jon123",  // Same as ID (Firebase Auth UID)
  "email": "jon.jonsson@islandsbanki.is",
  "name": "Jón Jónsson",

  // Employment
  "employee_id": "IB-12345",
  "department": "IT",
  "hire_date": Timestamp("2020-01-15T00:00:00Z"),

  // Access
  "status": "active",  // pending | approved | active | suspended
  "access_level": "guest",  // guest | full

  // Approval
  "approved_by": "user_abc123",
  "approved_at": Timestamp("2026-02-16T11:00:00Z"),
  "approval_method": "manual",  // manual | auto

  // Usage tracking
  "bookings_this_year": 2,
  "bookings_total": 2,
  "days_booked_this_year": 14,
  "last_booking_date": Timestamp("2026-06-22T00:00:00Z"),

  // Payment
  "payment_balance": 0,  // ISK
  "total_paid": 49000,   // ISK

  // Metadata
  "created_at": Timestamp("2026-02-16T11:00:00Z"),
  "updated_at": Timestamp("2026-06-22T12:00:00Z")
}
```

---

### **organizations/{orgId}/booking_requests/{requestId}**

```javascript
{
  "id": "breq_abc123",

  // Requester (denormalized for display)
  "user_id": "user_jon123",
  "user_name": "Jón Jónsson",
  "user_email": "jon.jonsson@islandsbanki.is",

  // Booking details
  "house_id": "house_thingvellir_xyz",
  "house_name": "Sumarhús við Þingvallavatn",  // Denormalized
  "start_date": Timestamp("2026-06-15T15:00:00Z"),
  "end_date": Timestamp("2026-06-22T11:00:00Z"),
  "num_nights": 7,
  "num_guests": 4,

  // Purpose
  "purpose": "personal",  // personal | family | work_retreat
  "notes": "Celebrating anniversary with family",

  // Status
  "status": "pending",  // pending | approved | denied | cancelled

  // Validation (auto-computed)
  "has_conflicts": false,
  "conflict_details": null,
  "quota_check_passed": true,

  // Admin action (if reviewed)
  "reviewed_by": null,
  "reviewed_at": null,
  "review_notes": null,
  "denial_reason": null,

  // Payment
  "payment_required": true,
  "payment_amount": 24500,  // 7 nights × 3500 kr
  "payment_method": null,
  "payment_status": null,
  "invoice_id": null,

  // If approved, links to actual booking
  "booking_id": null,

  // Metadata
  "requested_at": Timestamp("2026-02-16T11:45:00Z"),
  "ip_address": "123.45.67.89"
}
```

**After approval:**
```javascript
{
  // ... same as above ...
  "status": "approved",
  "reviewed_by": "user_abc123",
  "reviewed_at": Timestamp("2026-02-16T14:00:00Z"),
  "review_notes": "Approved - no conflicts",
  "payment_method": "invoice",
  "payment_status": "invoiced",
  "invoice_id": "inv_20260216_001",
  "booking_id": "book_xyz789"  // Link to actual booking
}
```

---

### **houses/{houseId}**

```javascript
{
  "id": "house_thingvellir_xyz",

  // Basic info
  "name": "Sumarhús við Þingvallavatn",
  "address": "Þingvallavegur 123, 801 Selfoss",
  "location": {
    "lat": 64.2551,
    "lng": -21.1271
  },

  // Organization (if belongs to org)
  "organization_id": "org_islandsbanki_abc123",
  "organization_name": "Íslandsbanki",  // Denormalized

  // Property details
  "capacity": 6,
  "bedrooms": 3,
  "bathrooms": 2,
  "square_meters": 120,

  // Media
  "image_url": "gs://bucket/houses/thingvellir/main.jpg",
  "gallery_urls": [
    "gs://bucket/houses/thingvellir/1.jpg",
    "gs://bucket/houses/thingvellir/2.jpg",
    "gs://bucket/houses/thingvellir/3.jpg"
  ],

  // Amenities
  "amenities": [
    "wifi",
    "hottub",
    "bbq",
    "dishwasher",
    "washing_machine",
    "lake_view"
  ],

  // Guest info
  "house_rules": "No smoking. No pets. Check-out cleaning required.",
  "check_in_time": "15:00",
  "check_out_time": "11:00",
  "wifi_ssid": "SumarhusThingvellir",
  "wifi_password": "SecurePass123",
  "emergency_contact": "+354 888 1234",

  // Booking rules
  "min_nights": 2,
  "max_nights": 14,
  "seasonal_availability": {
    "winter_closed": false,
    "available_months": [1,2,3,4,5,6,7,8,9,10,11,12]  // All year
  },

  // Metadata
  "created_at": Timestamp("2026-02-16T09:00:00Z"),
  "created_by": "user_abc123",
  "updated_at": Timestamp("2026-02-16T09:00:00Z")
}
```

---

### **houses/{houseId}/bookings/{bookingId}**

```javascript
{
  "id": "book_xyz789",

  // Property
  "house_id": "house_thingvellir_xyz",
  "organization_id": "org_islandsbanki_abc123",

  // Booker (denormalized)
  "user_id": "user_jon123",
  "user_name": "Jón Jónsson",
  "user_email": "jon.jonsson@islandsbanki.is",

  // Dates
  "start": Timestamp("2026-06-15T15:00:00Z"),
  "end": Timestamp("2026-06-22T11:00:00Z"),
  "num_nights": 7,
  "num_guests": 4,

  // Type
  "type": "personal",
  "notes": "Celebrating anniversary",

  // Status
  "status": "confirmed",  // confirmed | cancelled | completed

  // Payment
  "payment_amount": 24500,
  "payment_status": "invoiced",  // pending | paid | invoiced
  "payment_method": "invoice",
  "payment_due_date": Timestamp("2026-03-01T00:00:00Z"),
  "invoice_id": "inv_20260216_001",
  "paid_at": null,

  // Admin
  "approved_by": "user_abc123",
  "approved_at": Timestamp("2026-02-16T14:00:00Z"),
  "created_from_request_id": "breq_abc123",

  // Metadata
  "created_at": Timestamp("2026-02-16T14:00:00Z"),
  "cancelled_at": null,
  "cancelled_by": null,
  "cancellation_reason": null
}
```

---

### **users/{userId}**

```javascript
{
  "uid": "user_jon123",  // Firebase Auth UID
  "email": "jon.jonsson@islandsbanki.is",
  "name": "Jón Jónsson",
  "phone": "+3548881234",
  "avatar_url": null,

  // Organization memberships
  "organization_ids": [
    "org_islandsbanki_abc123"
  ],
  "primary_organization_id": "org_islandsbanki_abc123",

  // Preferences
  "language": "is",
  "email_notifications": true,
  "sms_notifications": false,

  // Metadata
  "created_at": Timestamp("2026-02-16T11:15:00Z"),
  "last_login": Timestamp("2026-02-16T12:00:00Z")
}
```

---

### **user_roles/{userId}**

```javascript
{
  "user_id": "user_abc123",

  // System-wide role
  "system_role": "regular_user",  // super_admin | support_admin | regular_user

  // Organization-specific roles
  "organization_roles": {
    "org_islandsbanki_abc123": {
      "role": "org_admin",
      "granted_at": Timestamp("2026-02-16T10:00:00Z"),
      "granted_by": "system"
    }
  }
}
```

---

## 🔒 Security Rules

### **Complete firestore.rules File**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserId() {
      return request.auth.uid;
    }

    function getUserEmail() {
      return request.auth.token.email;
    }

    function isSuperAdmin() {
      let role = get(/databases/$(database)/documents/user_roles/$(getUserId()));
      return role.data.system_role == 'super_admin';
    }

    function isOrgAdmin(orgId) {
      let role = get(/databases/$(database)/documents/user_roles/$(getUserId()));
      return role.data.organization_roles[orgId].role == 'org_admin';
    }

    function isOrgMember(orgId) {
      let member = get(/databases/$(database)/documents/organizations/$(orgId)/members/$(getUserId()));
      return member.data != null && member.data.status in ['approved', 'active'];
    }

    function isHouseOwner(houseId) {
      let house = get(/databases/$(database)/documents/houses/$(houseId));
      return house.data.created_by == getUserId();
    }

    // ============================================
    // ORGANIZATIONS
    // ============================================

    match /organizations/{orgId} {
      // Anyone can read (for public pages, guest access)
      allow read: if true;

      // Only super admins can create
      allow create: if isSuperAdmin();

      // Org admins and super admins can update
      allow update: if isOrgAdmin(orgId) || isSuperAdmin();

      // Only super admins can delete
      allow delete: if isSuperAdmin();

      // ----------------------------------------
      // ACCESS REQUESTS SUBCOLLECTION
      // ----------------------------------------
      match /access_requests/{requestId} {
        // Anyone can create (public signup)
        allow create: if isAuthenticated();

        // User can read their own request
        allow read: if isAuthenticated() &&
                      resource.data.email == getUserEmail();

        // Org admins can read all requests
        allow read: if isOrgAdmin(orgId) || isSuperAdmin();

        // Org admins can update (approve/deny)
        allow update: if isOrgAdmin(orgId) || isSuperAdmin();

        // No one can delete (audit trail)
        allow delete: if false;
      }

      // ----------------------------------------
      // MEMBERS SUBCOLLECTION
      // ----------------------------------------
      match /members/{userId} {
        // Member can read their own document
        allow read: if isAuthenticated() && userId == getUserId();

        // Org members can read other members (for display)
        allow read: if isOrgMember(orgId);

        // Org admins can read all members
        allow read: if isOrgAdmin(orgId) || isSuperAdmin();

        // Only org admins can write
        allow write: if isOrgAdmin(orgId) || isSuperAdmin();
      }

      // ----------------------------------------
      // BOOKING REQUESTS SUBCOLLECTION
      // ----------------------------------------
      match /booking_requests/{requestId} {
        // Org members can create
        allow create: if isOrgMember(orgId);

        // User can read their own requests
        allow read: if isAuthenticated() &&
                      resource.data.user_id == getUserId();

        // Org admins can read all requests
        allow read: if isOrgAdmin(orgId) || isSuperAdmin();

        // Org admins can update (approve/deny)
        allow update: if isOrgAdmin(orgId) || isSuperAdmin();

        // User can cancel their own pending request
        allow update: if isAuthenticated() &&
                        resource.data.user_id == getUserId() &&
                        resource.data.status == 'pending' &&
                        request.resource.data.status == 'cancelled';

        // No one can delete (audit trail)
        allow delete: if false;
      }

      // ----------------------------------------
      // ADMIN ACTIONS SUBCOLLECTION
      // ----------------------------------------
      match /admin_actions/{actionId} {
        // Only org admins can read
        allow read: if isOrgAdmin(orgId) || isSuperAdmin();

        // Only org admins can create (logged automatically)
        allow create: if isOrgAdmin(orgId) || isSuperAdmin();

        // No updates or deletes (immutable audit log)
        allow update, delete: if false;
      }
    }

    // ============================================
    // USERS
    // ============================================

    match /users/{userId} {
      // User can read/write their own document
      allow read, write: if isAuthenticated() && userId == getUserId();

      // Super admins can read all users
      allow read: if isSuperAdmin();
    }

    // ============================================
    // USER ROLES
    // ============================================

    match /user_roles/{userId} {
      // User can read their own roles
      allow read: if isAuthenticated() && userId == getUserId();

      // Super admins can read/write all roles
      allow read, write: if isSuperAdmin();
    }

    // ============================================
    // HOUSES
    // ============================================

    match /houses/{houseId} {
      // Public can read if no organization
      allow read: if resource.data.organization_id == null;

      // Org members can read if belongs to their org
      allow read: if resource.data.organization_id != null &&
                    isOrgMember(resource.data.organization_id);

      // House owner can read/write
      allow read, write: if isHouseOwner(houseId);

      // Org admins can write if belongs to their org
      allow write: if resource.data.organization_id != null &&
                     isOrgAdmin(resource.data.organization_id);

      // Super admins can do anything
      allow read, write: if isSuperAdmin();

      // ----------------------------------------
      // BOOKINGS SUBCOLLECTION
      // ----------------------------------------
      match /bookings/{bookingId} {
        // User can read their own bookings
        allow read: if isAuthenticated() &&
                      resource.data.user_id == getUserId();

        // Org members can read bookings for houses in their org
        allow read: if resource.data.organization_id != null &&
                      isOrgMember(resource.data.organization_id);

        // Org admins can read/write all bookings for their org
        allow read, write: if resource.data.organization_id != null &&
                             isOrgAdmin(resource.data.organization_id);

        // House owner can read/write
        allow read, write: if isHouseOwner(houseId);

        // Super admins can do anything
        allow read, write: if isSuperAdmin();

        // User can cancel their own confirmed booking
        allow update: if isAuthenticated() &&
                        resource.data.user_id == getUserId() &&
                        resource.data.status == 'confirmed' &&
                        request.resource.data.status == 'cancelled';
      }
    }
  }
}
```

---

## 📇 Indexes

### **firestore.indexes.json**

```json
{
  "indexes": [
    {
      "collectionGroup": "organizations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "slug", "order": "ASCENDING" },
        { "fieldPath": "subscription_status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "access_requests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "requested_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "access_requests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "email", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "members",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "members",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "email", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "booking_requests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "requested_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "booking_requests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "booking_requests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "house_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "start_date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "houses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organization_id", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "houses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organization_id", "order": "ASCENDING" },
        { "fieldPath": "capacity", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "house_id", "order": "ASCENDING" },
        { "fieldPath": "start", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "house_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "start", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "organization_id", "order": "ASCENDING" },
        { "fieldPath": "start", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "start", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "admin_actions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "action_type", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## 🔍 Query Patterns

### **1. Get Pending Access Requests for Org**

```typescript
const q = query(
  collection(db, 'organizations', orgId, 'access_requests'),
  where('status', '==', 'pending'),
  orderBy('requested_at', 'desc'),
  limit(50)
);

const snapshot = await getDocs(q);
```

**Index Required:** `access_requests (status ASC, requested_at DESC)`

---

### **2. Get All Members for Org**

```typescript
const q = query(
  collection(db, 'organizations', orgId, 'members'),
  where('status', 'in', ['approved', 'active']),
  orderBy('created_at', 'desc')
);

const snapshot = await getDocs(q);
```

**Index Required:** `members (status ASC, created_at DESC)`

---

### **3. Get Pending Booking Requests for Org**

```typescript
const q = query(
  collection(db, 'organizations', orgId, 'booking_requests'),
  where('status', '==', 'pending'),
  orderBy('requested_at', 'desc'),
  limit(50)
);

const snapshot = await getDocs(q);
```

**Index Required:** `booking_requests (status ASC, requested_at DESC)`

---

### **4. Get All Houses for Org**

```typescript
const q = query(
  collection(db, 'houses'),
  where('organization_id', '==', orgId),
  orderBy('name', 'asc')
);

const snapshot = await getDocs(q);
```

**Index Required:** `houses (organization_id ASC, name ASC)`

---

### **5. Get Bookings for House (Calendar)**

```typescript
const q = query(
  collection(db, 'houses', houseId, 'bookings'),
  where('status', '==', 'confirmed'),
  where('start', '>=', startDate),
  where('start', '<=', endDate),
  orderBy('start', 'asc')
);

const snapshot = await getDocs(q);
```

**Index Required:** `bookings (house_id ASC, status ASC, start ASC)`

---

### **6. Check for Booking Conflicts**

```typescript
// Find bookings that overlap with requested dates
const q = query(
  collectionGroup(db, 'bookings'),
  where('house_id', '==', houseId),
  where('status', '==', 'confirmed'),
  where('start', '<', requestedEndDate),
  where('end', '>', requestedStartDate)
);

const snapshot = await getDocs(q);
const hasConflicts = !snapshot.empty;
```

**Note:** This requires app-level logic since Firestore doesn't support range queries on two fields.

**Better approach:**
```typescript
// Get all bookings for the house in the date range
const q = query(
  collection(db, 'houses', houseId, 'bookings'),
  where('status', '==', 'confirmed'),
  where('start', '>=', rangeStart),
  where('start', '<=', rangeEnd)
);

const snapshot = await getDocs(q);

// Check conflicts in app
const conflicts = snapshot.docs.filter(doc => {
  const booking = doc.data();
  return (
    booking.start < requestedEnd &&
    booking.end > requestedStart
  );
});
```

---

### **7. Get User's Booking History**

```typescript
const q = query(
  collectionGroup(db, 'bookings'),
  where('user_id', '==', userId),
  orderBy('start', 'desc'),
  limit(20)
);

const snapshot = await getDocs(q);
```

**Index Required:** `bookings (user_id ASC, start DESC)` with collection group scope

---

### **8. Get Organization Dashboard Stats**

```typescript
// Most stats are denormalized on org doc
const orgDoc = await getDoc(doc(db, 'organizations', orgId));
const stats = orgDoc.data().stats;

// For real-time pending counts:
const pendingAccessCount = await getCountFromServer(
  query(
    collection(db, 'organizations', orgId, 'access_requests'),
    where('status', '==', 'pending')
  )
);

const pendingBookingCount = await getCountFromServer(
  query(
    collection(db, 'organizations', orgId, 'booking_requests'),
    where('status', '==', 'pending')
  )
);
```

---

## 📊 Denormalization Strategy

### **What We Denormalize:**

**1. User Names/Emails on Bookings**
- **Why:** Display booking without additional query
- **Trade-off:** Name changes don't auto-update
- **Solution:** Background job to sync (low priority)

**2. House Names on Booking Requests**
- **Why:** Display request without house query
- **Trade-off:** House name changes don't auto-update
- **Acceptable:** House names rarely change

**3. Organization Name on Houses**
- **Why:** Display house owner without org query
- **Trade-off:** Org name changes don't auto-update
- **Solution:** Update houses when org name changes (rare)

**4. Stats on Organization Doc**
- **Why:** Fast dashboard load
- **Trade-off:** Can get out of sync
- **Solution:** Cloud Function to recalculate periodically

### **What We DON'T Denormalize:**

**1. User Profile Data**
- **Why:** Changes frequently
- **Solution:** Query user doc when needed

**2. House Details**
- **Why:** Changes occasionally
- **Solution:** Query house doc, cache in app

**3. Organization Settings**
- **Why:** Critical, must be current
- **Solution:** Always query fresh

---

## 🔄 Data Migration

### **Future Schema Changes**

If we need to change schema:

**1. Additive Changes (Easy)**
```typescript
// Add new field to existing docs
const batch = writeBatch(db);
const snapshot = await getDocs(collection(db, 'organizations'));

snapshot.docs.forEach(doc => {
  batch.update(doc.ref, {
    'new_field': defaultValue
  });
});

await batch.commit();
```

**2. Rename Field (Medium)**
```typescript
// Copy old field to new field, delete old
snapshot.docs.forEach(doc => {
  const data = doc.data();
  batch.update(doc.ref, {
    'new_name': data.old_name,
    'old_name': deleteField()
  });
});
```

**3. Restructure (Hard)**
```typescript
// May need to create new collection
// Migrate data
// Update app to use new collection
// Delete old collection when safe
```

---

## ✅ Setup Checklist

**Before first deploy:**

- [ ] Create Firebase project
- [ ] Enable Firestore
- [ ] Deploy security rules (`firestore.rules`)
- [ ] Create indexes (`firestore.indexes.json`)
- [ ] Test rules with emulator
- [ ] Seed test data
- [ ] Verify queries work
- [ ] Load test with sample data

**Commands:**
```bash
# Deploy rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Test locally
firebase emulators:start
```

---

## 🎯 Next Steps

1. ✅ Review this document
2. ✅ Approve structure
3. ✅ Set up Firebase project
4. ✅ Deploy rules and indexes
5. ✅ Start building!

---

**Ready to build on this foundation? 🚀**
