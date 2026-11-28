import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
    getOrganization,
    getAccessRequests,
    getOrganizationMembers,
    getBookingRequests,
    isOrgAdmin,
    getOrganizationHouses,
} from '@/services/organizationService';
import type {
    Organization,
    AccessRequest,
    OrganizationMember,
    BookingRequest,
    House,
    User,
} from '@/types/models';

/**
 * Loads the organization and its access requests, members, booking requests and
 * houses. Runs the admin gate (platform super admins may open any organization,
 * the rules allow it) and loads on mount / when its inputs change.
 */
export function useOrganizationDashboard(
    orgId: string | undefined,
    currentUser: User | null,
    isSuperAdmin: boolean
) {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
    const [houses, setHouses] = useState<House[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        if (!orgId || !currentUser) return;

        try {
            setError('');
            // Check if user is admin
            const adminStatus = isSuperAdmin || (await isOrgAdmin(currentUser.uid, orgId));
            setIsAdmin(adminStatus);

            if (!adminStatus) {
                setError('Þú hefur ekki réttindi til að skoða þessa síðu');
                setIsLoading(false);
                return;
            }

            // Load organization
            const org = await getOrganization(orgId);
            if (!org) {
                setError('Félag fannst ekki');
                setIsLoading(false);
                return;
            }
            setOrganization(org);

            // Load data
            const [requests, mems, bookings, orgHouses] = await Promise.all([
                getAccessRequests(orgId),
                getOrganizationMembers(orgId),
                getBookingRequests(orgId),
                getOrganizationHouses(orgId),
            ]);

            setAccessRequests(requests);
            setMembers(mems);
            setBookingRequests(bookings);
            setHouses(orgHouses);
        } catch (err) {
            logger.error('Error loading organization data:', err);
            setError('Villa kom upp við að sækja gögn');
        } finally {
            setIsLoading(false);
        }
    }, [orgId, currentUser, isSuperAdmin]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        organization,
        accessRequests,
        members,
        bookingRequests,
        houses,
        isLoading,
        isAdmin,
        error,
        loadData,
    };
}
