import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp,
    writeBatch,
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

// ============================================
// Organization Management
// ============================================

export const createOrganization = async (
    data: Partial<Organization>,
    userId: string
): Promise<string> => {
    const organizationsRef = collection(db, 'organizations');

    const newOrg = {
        ...data,
        created_at: serverTimestamp(),
        created_by: userId,
        updated_at: serverTimestamp(),
        admin_user_ids: [userId],
        stats: {
            total_properties: 0,
            total_members: 0,
            active_members: 0,
            total_bookings: 0,
        },
    };

    const docRef = await addDoc(organizationsRef, newOrg);

    // Also create user_roles entry for the creator as org_admin
    await setUserOrgRole(userId, docRef.id, 'org_admin', 'active', 'admin-member-1');

    return docRef.id;
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

export const submitAccessRequest = async (
    orgId: string,
    data: Partial<AccessRequest>
): Promise<string> => {
    const accessRequestsRef = collection(db, 'organizations', orgId, 'access_requests');

    const org = await getOrganization(orgId);
    if (!org) throw new Error('Organization not found');

    // Check if email domain is in allowed list
    const emailDomain = data.email?.split('@')[1] || '';
    const emailDomainVerified = org.settings.allowed_email_domains.includes(emailDomain);

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

    const requestData = requestSnap.data() as AccessRequest;

    // Update access request status
    await updateDoc(requestRef, {
        status: 'approved',
        reviewed_by: adminUserId,
        reviewed_at: serverTimestamp(),
    });

    // Create organization member with guest access
    const membersRef = collection(db, 'organizations', orgId, 'members');
    const memberDoc = await addDoc(membersRef, {
        user_id: '', // Will be filled when user creates account
        email: requestData.email,
        name: requestData.name,
        employee_id: requestData.employee_id,
        department: requestData.department,
        status: 'approved',
        access_level: 'guest', // Guest access initially
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

    // Update org stats
    const orgRef = doc(db, 'organizations', orgId);
    const orgSnap = await getDoc(orgRef);
    if (orgSnap.exists()) {
        const currentStats = orgSnap.data().stats || {};
        await updateDoc(orgRef, {
            'stats.total_members': (currentStats.total_members || 0) + 1,
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

export const upgradeMemberToFullAccess = async (
    orgId: string,
    memberId: string,
    userId: string
): Promise<void> => {
    const memberRef = doc(db, 'organizations', orgId, 'members', memberId);
    await updateDoc(memberRef, {
        user_id: userId,
        access_level: 'full',
        status: 'active',
        updated_at: serverTimestamp(),
    });

    // Create user_roles entry
    await setUserOrgRole(userId, orgId, 'member', 'active', memberId);
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
    const numNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Check for conflicts (basic check - should be more thorough)
    const hasConflicts = false; // TODO: Implement conflict checking

    // Check quota (basic check)
    const quotaCheckPassed = true; // TODO: Implement quota checking

    // Calculate payment
    const paymentAmount = org.settings.payment_required
        ? (org.settings.price_per_night || 0) * numNights
        : 0;

    const newRequest = {
        ...data,
        num_nights: numNights,
        status: 'pending' as const,
        has_conflicts: hasConflicts,
        quota_check_passed: quotaCheckPassed,
        payment_required: org.settings.payment_required,
        payment_amount: paymentAmount,
        payment_method: org.settings.payment_method,
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

    // Update member stats
    const membersRef = collection(db, 'organizations', orgId, 'members');
    const memberQuery = query(membersRef, where('user_id', '==', requestData.user_id));
    const memberSnap = await getDocs(memberQuery);

    if (!memberSnap.empty) {
        const memberDoc = memberSnap.docs[0];
        const memberData = memberDoc.data() as OrganizationMember;

        await updateDoc(memberDoc.ref, {
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
// User Roles Management
// ============================================

export const getUserRoles = async (userId: string): Promise<UserRoles | null> => {
    const docRef = doc(db, 'user_roles', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        created_at: data.created_at?.toDate(),
        updated_at: data.updated_at?.toDate(),
    } as UserRoles;
};

export const setUserOrgRole = async (
    userId: string,
    orgId: string,
    role: 'org_admin' | 'member',
    status: 'active' | 'suspended',
    memberId: string
): Promise<void> => {
    const userRolesRef = doc(db, 'user_roles', userId);
    const userRolesSnap = await getDoc(userRolesRef);

    if (userRolesSnap.exists()) {
        // Update existing roles
        const currentRoles = userRolesSnap.data().organization_roles || {};
        await updateDoc(userRolesRef, {
            [`organization_roles.${orgId}`]: {
                organization_id: orgId,
                role,
                status,
                member_id: memberId,
            },
            updated_at: serverTimestamp(),
        });
    } else {
        // Create new roles document
        await updateDoc(userRolesRef, {
            is_super_admin: false,
            organization_roles: {
                [orgId]: {
                    organization_id: orgId,
                    role,
                    status,
                    member_id: memberId,
                },
            },
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        });
    }
};

// ============================================
// Helper Functions
// ============================================

export const isOrgAdmin = async (userId: string, orgId: string): Promise<boolean> => {
    const roles = await getUserRoles(userId);
    if (!roles) return false;

    const orgRole = roles.organization_roles[orgId];
    return orgRole?.role === 'org_admin' && orgRole?.status === 'active';
};

export const isOrgMember = async (userId: string, orgId: string): Promise<boolean> => {
    const roles = await getUserRoles(userId);
    if (!roles) return false;

    const orgRole = roles.organization_roles[orgId];
    return !!orgRole && orgRole.status === 'active';
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
        subscription_end: doc.data().subscription_end?.toDate(),
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
    adminUserId: string
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
