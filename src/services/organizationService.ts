import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    writeBatch,
    arrayUnion,
    arrayRemove,
    increment,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp,
} from 'firebase/firestore';
import type {
    Organization,
    AccessRequest,
    OrganizationMember,
    BookingRequest,
    AdminAction,
    UserRoles,
    House,
} from '@/types/models';

/**
 * Identity model (single source of truth, no user_roles dependency):
 *  - org admins   = organizations/{orgId}.admin_user_ids
 *  - org members  = organizations/{orgId}/members/{uid}   (document ID is the uid)
 * Legacy member docs created with auto-generated IDs may still exist; they have
 * no uid in their ID and are therefore not recognised by the security rules.
 */

/** Fields that belonged to the decommissioned subscription model. Never written on new orgs. */
const LEGACY_BILLING_FIELDS = [
    'subscription_tier',
    'subscription_status',
    'subscription_start',
    'subscription_end',
    'billing_email',
] as const;

// ============================================
// Organization Management
// ============================================

export const createOrganization = async (
    data: Partial<Organization>,
    userId: string,
    creator?: { name?: string; email?: string }
): Promise<string> => {
    const orgRef = doc(collection(db, 'organizations'));
    const memberRef = doc(db, 'organizations', orgRef.id, 'members', userId);

    // Never persist subscription/billing fields on new organizations.
    const cleaned: Record<string, unknown> = { ...data };
    for (const field of LEGACY_BILLING_FIELDS) delete cleaned[field];
    delete cleaned.id;

    const batch = writeBatch(db);

    batch.set(orgRef, {
        ...cleaned,
        created_at: serverTimestamp(),
        created_by: userId,
        updated_at: serverTimestamp(),
        admin_user_ids: [userId],
        stats: {
            total_properties: 0,
            total_members: 1,
            active_members: 1,
            total_bookings: 0,
        },
    });

    // The creator is also the first (admin) member. Written in the same batch so
    // the org can never exist without its admin member (or the other way round).
    batch.set(memberRef, {
        user_id: userId,
        email: creator?.email ?? '',
        name: creator?.name ?? '',
        role: 'admin',
        status: 'active',
        access_level: 'full',
        approved_by: userId,
        approved_at: serverTimestamp(),
        approval_method: 'manual',
        bookings_this_year: 0,
        bookings_total: 0,
        days_booked_this_year: 0,
        payment_balance: 0,
        total_paid: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
    });

    await batch.commit();

    return orgRef.id;
};

export const getAllOrganizations = async (): Promise<Organization[]> => {
    const organizationsRef = collection(db, 'organizations');
    const q = query(organizationsRef, orderBy('created_at', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
        updated_at: doc.data().updated_at?.toDate(),
        subscription_start: doc.data().subscription_start?.toDate(),
        subscription_end: doc.data().subscription_end?.toDate(),
    })) as Organization[];
};

export const getOrganization = async (orgId: string): Promise<Organization | null> => {
    const docRef = doc(db, 'organizations', orgId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        created_at: data.created_at?.toDate(),
        updated_at: data.updated_at?.toDate(),
        subscription_start: data.subscription_start?.toDate(),
        subscription_end: data.subscription_end?.toDate(),
    } as Organization;
};

export const updateOrganization = async (
    orgId: string,
    data: Partial<Organization>
): Promise<void> => {
    const docRef = doc(db, 'organizations', orgId);
    await updateDoc(docRef, {
        ...data,
        updated_at: serverTimestamp(),
    });
};

// ============================================
// Access Requests
// ============================================

/** An access request always belongs to a signed-in user (`user_id` = their uid). */
export type AccessRequestInput = Partial<AccessRequest> & { user_id: string };

export const submitAccessRequest = async (
    orgId: string,
    data: AccessRequestInput
): Promise<string> => {
    const accessRequestsRef = collection(db, 'organizations', orgId, 'access_requests');

    if (!data.user_id) throw new Error('Notandi verður að vera skráður inn');

    const org = await getOrganization(orgId);
    if (!org) throw new Error('Organization not found');

    // Check if email domain is in allowed list
    const emailDomain = data.email?.split('@')[1] || '';
    const emailDomainVerified = (org.settings?.allowed_email_domains ?? []).includes(emailDomain);

    const newRequest = {
        ...data,
        status: 'pending' as const,
        email_domain_verified: emailDomainVerified,
        employee_id_verified: false,
        requested_at: serverTimestamp(),
    };

    const docRef = await addDoc(accessRequestsRef, newRequest);
    return docRef.id;
};

export const getAccessRequests = async (
    orgId: string,
    status?: string
): Promise<AccessRequest[]> => {
    const accessRequestsRef = collection(db, 'organizations', orgId, 'access_requests');

    let q = query(accessRequestsRef, orderBy('requested_at', 'desc'));

    if (status) {
        q = query(accessRequestsRef, where('status', '==', status), orderBy('requested_at', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        requested_at: doc.data().requested_at?.toDate(),
        reviewed_at: doc.data().reviewed_at?.toDate(),
    })) as AccessRequest[];
};

export const approveAccessRequest = async (
    orgId: string,
    requestId: string,
    adminUserId: string,
    adminName: string
): Promise<void> => {
    const requestRef = doc(db, 'organizations', orgId, 'access_requests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) throw new Error('Access request not found');

    const requestData = requestSnap.data() as AccessRequest & { user_id?: string };

    // The member document ID is the requester's uid (that is what the security
    // rules look up). Requests made before user_id was recorded cannot be
    // approved: the requester has to submit a new request while signed in.
    const memberUid = requestData.user_id;
    if (!memberUid) {
        throw new Error('Beiðnin er ekki tengd notanda. Biddu starfsmanninn um að senda nýja beiðni.');
    }

    const memberRef = doc(db, 'organizations', orgId, 'members', memberUid);
    const existingMember = await getDoc(memberRef);

    const batch = writeBatch(db);

    batch.update(requestRef, {
        status: 'approved',
        reviewed_by: adminUserId,
        reviewed_at: serverTimestamp(),
    });

    if (existingMember.exists()) {
        // Already a member (e.g. suspended earlier): just reactivate, keep counters.
        batch.update(memberRef, {
            status: 'active',
            updated_at: serverTimestamp(),
        });
    } else {
        batch.set(memberRef, {
            user_id: memberUid,
            email: requestData.email,
            name: requestData.name,
            employee_id: requestData.employee_id ?? '',
            department: requestData.department ?? '',
            role: 'member',
            status: 'active',
            access_level: 'full',
            approved_by: adminUserId,
            approved_at: serverTimestamp(),
            approval_method: 'manual',
            bookings_this_year: 0,
            bookings_total: 0,
            days_booked_this_year: 0,
            payment_balance: 0,
            total_paid: 0,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        });
    }

    await batch.commit();

    // Log admin action
    await logAdminAction(orgId, {
        admin_user_id: adminUserId,
        admin_name: adminName,
        action_type: 'approve_access',
        target_id: requestId,
        target_type: 'access_request',
        target_name: requestData.name,
        details: `Approved access request for ${requestData.email}`,
    });

    if (!existingMember.exists()) {
        await updateDoc(doc(db, 'organizations', orgId), {
            'stats.total_members': increment(1),
            'stats.active_members': increment(1),
        });
    }
};

export const denyAccessRequest = async (
    orgId: string,
    requestId: string,
    adminUserId: string,
    adminName: string,
    reason: string
): Promise<void> => {
    const requestRef = doc(db, 'organizations', orgId, 'access_requests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) throw new Error('Access request not found');

    const requestData = requestSnap.data() as AccessRequest;

    await updateDoc(requestRef, {
        status: 'denied',
        reviewed_by: adminUserId,
        reviewed_at: serverTimestamp(),
        denial_reason: reason,
    });

    // Log admin action
    await logAdminAction(orgId, {
        admin_user_id: adminUserId,
        admin_name: adminName,
        action_type: 'deny_access',
        target_id: requestId,
        target_type: 'access_request',
        target_name: requestData.name,
        details: `Denied access request for ${requestData.email}`,
        notes: reason,
    });
};

// ============================================
// Organization Members
// ============================================

export const getOrganizationMembers = async (orgId: string): Promise<OrganizationMember[]> => {
    const membersRef = collection(db, 'organizations', orgId, 'members');
    const q = query(membersRef, orderBy('created_at', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        hire_date: doc.data().hire_date?.toDate(),
        approved_at: doc.data().approved_at?.toDate(),
        last_booking_date: doc.data().last_booking_date?.toDate(),
        created_at: doc.data().created_at?.toDate(),
        updated_at: doc.data().updated_at?.toDate(),
    })) as OrganizationMember[];
};

export const updateMemberStatus = async (
    orgId: string,
    memberId: string,
    status: 'active' | 'suspended',
    adminUserId: string,
    adminName: string
): Promise<void> => {
    const memberRef = doc(db, 'organizations', orgId, 'members', memberId);
    await updateDoc(memberRef, {
        status,
        updated_at: serverTimestamp(),
    });

    const memberSnap = await getDoc(memberRef);
    const memberData = memberSnap.data() as OrganizationMember;

    // Log admin action
    await logAdminAction(orgId, {
        admin_user_id: adminUserId,
        admin_name: adminName,
        action_type: status === 'suspended' ? 'suspend_member' : 'reactivate_member',
        target_id: memberId,
        target_type: 'member',
        target_name: memberData.name,
        details: `${status === 'suspended' ? 'Suspended' : 'Reactivated'} member ${memberData.name}`,
    });
};

/**
 * Gives a member full access. `memberId` may be a legacy auto-ID member doc; in
 * that case its data is moved to `members/{userId}` (the ID the rules look up).
 */
export const upgradeMemberToFullAccess = async (
    orgId: string,
    memberId: string,
    userId: string
): Promise<void> => {
    const targetRef = doc(db, 'organizations', orgId, 'members', userId);
    const patch = {
        user_id: userId,
        access_level: 'full',
        status: 'active',
        updated_at: serverTimestamp(),
    };

    if (memberId === userId) {
        await updateDoc(targetRef, patch);
        return;
    }

    const legacyRef = doc(db, 'organizations', orgId, 'members', memberId);
    const legacySnap = await getDoc(legacyRef);
    const batch = writeBatch(db);
    batch.set(targetRef, { ...(legacySnap.exists() ? legacySnap.data() : {}), ...patch });
    if (legacySnap.exists()) batch.delete(legacyRef);
    await batch.commit();
};

// ============================================
// Booking Requests
// ============================================

export const submitBookingRequest = async (
    orgId: string,
    data: Partial<BookingRequest>
): Promise<string> => {
    const bookingRequestsRef = collection(db, 'organizations', orgId, 'booking_requests');

    const org = await getOrganization(orgId);
    if (!org) throw new Error('Organization not found');

    // Calculate number of nights
    const startDate = data.start_date as Date;
    const endDate = data.end_date as Date;
    const numNights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Check for conflicts (basic check - should be more thorough)
    const hasConflicts = false; // TODO: Implement conflict checking

    // Check quota (basic check)
    const quotaCheckPassed = true; // TODO: Implement quota checking

    // Calculate payment
    const paymentRequired = !!org.settings?.payment_required;
    const paymentAmount = paymentRequired ? (org.settings.price_per_night || 0) * numNights : 0;

    const newRequest = {
        ...data,
        num_nights: numNights,
        status: 'pending' as const,
        has_conflicts: hasConflicts,
        quota_check_passed: quotaCheckPassed,
        payment_required: paymentRequired,
        payment_amount: paymentAmount,
        payment_method: org.settings?.payment_method ?? null,
        payment_status: 'pending' as const,
        requested_at: serverTimestamp(),
    };

    const docRef = await addDoc(bookingRequestsRef, newRequest);
    return docRef.id;
};

export const getBookingRequests = async (
    orgId: string,
    status?: string
): Promise<BookingRequest[]> => {
    const bookingRequestsRef = collection(db, 'organizations', orgId, 'booking_requests');

    let q = query(bookingRequestsRef, orderBy('requested_at', 'desc'));

    if (status) {
        q = query(
            bookingRequestsRef,
            where('status', '==', status),
            orderBy('requested_at', 'desc')
        );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        start_date: doc.data().start_date?.toDate(),
        end_date: doc.data().end_date?.toDate(),
        requested_at: doc.data().requested_at?.toDate(),
        reviewed_at: doc.data().reviewed_at?.toDate(),
    })) as BookingRequest[];
};

/**
 * A member's own booking requests. The `user_id ==` filter is what lets the
 * security rules allow this list query for a non-admin member.
 * (Composite index booking_requests: user_id ASC, requested_at DESC already exists.)
 */
export const getMyBookingRequests = async (
    orgId: string,
    userId: string
): Promise<BookingRequest[]> => {
    const bookingRequestsRef = collection(db, 'organizations', orgId, 'booking_requests');
    const q = query(
        bookingRequestsRef,
        where('user_id', '==', userId),
        orderBy('requested_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        start_date: d.data().start_date?.toDate(),
        end_date: d.data().end_date?.toDate(),
        requested_at: d.data().requested_at?.toDate(),
        reviewed_at: d.data().reviewed_at?.toDate(),
    })) as BookingRequest[];
};

export const approveBookingRequest = async (
    orgId: string,
    requestId: string,
    adminUserId: string,
    adminName: string
): Promise<string> => {
    const requestRef = doc(db, 'organizations', orgId, 'booking_requests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) throw new Error('Booking request not found');

    const requestData = requestSnap.data() as BookingRequest;

    // Create actual booking in house's bookings subcollection
    const bookingsRef = collection(db, 'houses', requestData.house_id, 'bookings');
    const bookingDoc = await addDoc(bookingsRef, {
        house_id: requestData.house_id,
        organization_id: orgId,
        user_id: requestData.user_id,
        user_name: requestData.user_name,
        user_email: requestData.user_email,
        start: Timestamp.fromDate(requestData.start_date),
        end: Timestamp.fromDate(requestData.end_date),
        num_nights: requestData.num_nights,
        num_guests: requestData.num_guests,
        type: requestData.purpose,
        notes: requestData.notes,
        status: 'confirmed',
        payment_amount: requestData.payment_amount || 0,
        payment_status: requestData.payment_status || 'pending',
        payment_method: requestData.payment_method,
        approved_by: adminUserId,
        approved_at: serverTimestamp(),
        created_from_request_id: requestId,
        created_at: serverTimestamp(),
    });

    // Update booking request
    await updateDoc(requestRef, {
        status: 'approved',
        reviewed_by: adminUserId,
        reviewed_at: serverTimestamp(),
        booking_id: bookingDoc.id,
    });

    // Update member stats (member doc ID is the uid; fall back to a user_id
    // lookup for legacy auto-ID member docs)
    let memberDocRef = doc(db, 'organizations', orgId, 'members', requestData.user_id);
    let memberSnap = await getDoc(memberDocRef);
    if (!memberSnap.exists()) {
        const legacy = await getDocs(
            query(
                collection(db, 'organizations', orgId, 'members'),
                where('user_id', '==', requestData.user_id)
            )
        );
        if (!legacy.empty) {
            memberDocRef = legacy.docs[0].ref;
            memberSnap = legacy.docs[0] as unknown as typeof memberSnap;
        }
    }

    if (memberSnap.exists()) {
        const memberData = memberSnap.data() as OrganizationMember;

        await updateDoc(memberDocRef, {
            bookings_this_year: (memberData.bookings_this_year || 0) + 1,
            bookings_total: (memberData.bookings_total || 0) + 1,
            days_booked_this_year: (memberData.days_booked_this_year || 0) + requestData.num_nights,
            last_booking_date: serverTimestamp(),
            updated_at: serverTimestamp(),
        });
    }

    // Log admin action
    await logAdminAction(orgId, {
        admin_user_id: adminUserId,
        admin_name: adminName,
        action_type: 'approve_booking',
        target_id: requestId,
        target_type: 'booking_request',
        target_name: requestData.house_name,
        details: `Approved booking for ${requestData.user_name} at ${requestData.house_name}`,
    });

    // Update org stats
    const orgRef = doc(db, 'organizations', orgId);
    const orgSnap = await getDoc(orgRef);
    if (orgSnap.exists()) {
        const currentStats = orgSnap.data().stats || {};
        await updateDoc(orgRef, {
            'stats.total_bookings': (currentStats.total_bookings || 0) + 1,
        });
    }

    return bookingDoc.id;
};

export const denyBookingRequest = async (
    orgId: string,
    requestId: string,
    adminUserId: string,
    adminName: string,
    reason: string
): Promise<void> => {
    const requestRef = doc(db, 'organizations', orgId, 'booking_requests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) throw new Error('Booking request not found');

    const requestData = requestSnap.data() as BookingRequest;

    await updateDoc(requestRef, {
        status: 'denied',
        reviewed_by: adminUserId,
        reviewed_at: serverTimestamp(),
        denial_reason: reason,
    });

    // Log admin action
    await logAdminAction(orgId, {
        admin_user_id: adminUserId,
        admin_name: adminName,
        action_type: 'deny_booking',
        target_id: requestId,
        target_type: 'booking_request',
        target_name: requestData.house_name,
        details: `Denied booking for ${requestData.user_name} at ${requestData.house_name}`,
        notes: reason,
    });
};

// ============================================
// Admin Actions (Audit Log)
// ============================================

export const logAdminAction = async (
    orgId: string,
    data: Partial<AdminAction>
): Promise<void> => {
    const actionsRef = collection(db, 'organizations', orgId, 'admin_actions');
    await addDoc(actionsRef, {
        ...data,
        timestamp: serverTimestamp(),
    });
};

export const getAdminActions = async (orgId: string, limit = 50): Promise<AdminAction[]> => {
    const actionsRef = collection(db, 'organizations', orgId, 'admin_actions');
    const q = query(actionsRef, orderBy('timestamp', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
    })) as AdminAction[];
};

// ============================================
// Roles (derived from the org doc and its members subcollection)
// ============================================

const readOrgMembership = async (
    userId: string,
    orgId: string
): Promise<{ isAdmin: boolean; member: OrganizationMember | null }> => {
    const [orgSnap, memberSnap] = await Promise.all([
        getDoc(doc(db, 'organizations', orgId)),
        getDoc(doc(db, 'organizations', orgId, 'members', userId)),
    ]);

    const adminIds: string[] = orgSnap.exists() ? orgSnap.data().admin_user_ids ?? [] : [];

    return {
        isAdmin: adminIds.includes(userId),
        member: memberSnap.exists()
            ? ({ id: memberSnap.id, ...memberSnap.data() } as OrganizationMember)
            : null,
    };
};

/**
 * Roles of a user in the given organizations. Organizations cannot be listed by
 * regular users, so the caller names the orgs to inspect. `is_super_admin` is
 * not authoritative here (see useUserRole for platform roles).
 */
export const getUserRoles = async (
    userId: string,
    orgIds: string[] = []
): Promise<UserRoles> => {
    const organization_roles: UserRoles['organization_roles'] = {};

    for (const orgId of orgIds) {
        const { isAdmin, member } = await readOrgMembership(userId, orgId);
        if (!isAdmin && !member) continue;
        organization_roles[orgId] = {
            organization_id: orgId,
            role: isAdmin ? 'org_admin' : 'member',
            status: member?.status ?? 'active',
            member_id: member?.id ?? userId,
        };
    }

    const now = new Date();
    return {
        id: userId,
        is_super_admin: false,
        organization_roles,
        created_at: now,
        updated_at: now,
    };
};

/**
 * Sets a user's role in an org: writes `members/{userId}` and, for org admins,
 * adds/removes the uid in the org doc's `admin_user_ids`. The caller must be an
 * org admin (enforced by the security rules). `_memberId` is ignored: the member
 * doc ID is always the uid.
 */
export const setUserOrgRole = async (
    userId: string,
    orgId: string,
    role: 'org_admin' | 'member',
    status: 'active' | 'suspended',
    _memberId?: string
): Promise<void> => {
    const batch = writeBatch(db);

    batch.set(
        doc(db, 'organizations', orgId, 'members', userId),
        {
            user_id: userId,
            role: role === 'org_admin' ? 'admin' : 'member',
            status,
            updated_at: serverTimestamp(),
        },
        { merge: true }
    );

    batch.update(doc(db, 'organizations', orgId), {
        admin_user_ids:
            role === 'org_admin' && status === 'active' ? arrayUnion(userId) : arrayRemove(userId),
        updated_at: serverTimestamp(),
    });

    await batch.commit();
};

// ============================================
// Helper Functions
// ============================================

export const isOrgAdmin = async (userId: string, orgId: string): Promise<boolean> => {
    const { isAdmin } = await readOrgMembership(userId, orgId);
    return isAdmin;
};

export const isOrgMember = async (userId: string, orgId: string): Promise<boolean> => {
    const { isAdmin, member } = await readOrgMembership(userId, orgId);
    if (isAdmin) return true;
    return !!member && (member.status === 'active' || member.status === 'approved');
};

// ============================================
// House Management
// ============================================

export const getOrganizationHouses = async (orgId: string): Promise<House[]> => {
    const housesRef = collection(db, 'houses');
    const q = query(housesRef, where('organization_id', '==', orgId));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
        updated_at: doc.data().updated_at?.toDate(),
    })) as House[];
};

export const createOrganizationHouse = async (
    orgId: string,
    data: Partial<House>,
    adminUserId: string
): Promise<string> => {
    const housesRef = collection(db, 'houses');

    const newHouse = {
        ...data,
        organization_id: orgId,
        manager_id: adminUserId,
        owner_ids: [adminUserId],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(housesRef, newHouse);

    // Update organization stats
    const orgRef = doc(db, 'organizations', orgId);
    const orgSnap = await getDoc(orgRef);
    if (orgSnap.exists()) {
        const currentStats = orgSnap.data().stats || {};
        await updateDoc(orgRef, {
            'stats.total_properties': (currentStats.total_properties || 0) + 1,
        });
    }

    return docRef.id;
};

export const addHouseToOrganization = async (
    houseId: string,
    orgId: string,
    _adminUserId: string
): Promise<void> => {
    const houseRef = doc(db, 'houses', houseId);

    await updateDoc(houseRef, {
        organization_id: orgId,
        updated_at: serverTimestamp(),
    });

    // Update organization stats
    const orgRef = doc(db, 'organizations', orgId);
    const orgSnap = await getDoc(orgRef);
    if (orgSnap.exists()) {
        const currentStats = orgSnap.data().stats || {};
        await updateDoc(orgRef, {
            'stats.total_properties': (currentStats.total_properties || 0) + 1,
        });
    }
};

export const removeHouseFromOrganization = async (
    houseId: string,
    orgId: string
): Promise<void> => {
    const houseRef = doc(db, 'houses', houseId);

    await updateDoc(houseRef, {
        organization_id: null,
        updated_at: serverTimestamp(),
    });

    // Update organization stats
    const orgRef = doc(db, 'organizations', orgId);
    const orgSnap = await getDoc(orgRef);
    if (orgSnap.exists()) {
        const currentStats = orgSnap.data().stats || {};
        await updateDoc(orgRef, {
            'stats.total_properties': Math.max(0, (currentStats.total_properties || 0) - 1),
        });
    }
};

export const updateOrganizationHouse = async (
    houseId: string,
    data: Partial<House>
): Promise<void> => {
    const houseRef = doc(db, 'houses', houseId);
    await updateDoc(houseRef, {
        ...data,
        updated_at: serverTimestamp(),
    });
};
