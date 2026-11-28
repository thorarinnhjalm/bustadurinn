import { logger } from '@/utils/logger';
import {
    approveAccessRequest,
    denyAccessRequest,
    approveBookingRequest,
    denyBookingRequest,
} from '@/services/organizationService';
import type { Organization, User } from '@/types/models';

/** Approve/deny handlers for access and booking requests (each reloads the data). */
export function useRequestActions(
    orgId: string | undefined,
    currentUser: User | null,
    organization: Organization | null,
    loadData: () => Promise<void>
) {
    const handleApproveAccess = async (requestId: string) => {
        if (!orgId || !currentUser || !organization) return;

        try {
            await approveAccessRequest(
                orgId,
                requestId,
                currentUser.uid,
                currentUser.name || 'Admin'
            );
            await loadData(); // Reload data
        } catch (err) {
            logger.error('Error approving access:', err);
            alert('Villa kom upp við að samþykkja aðgang');
        }
    };

    const handleDenyAccess = async (requestId: string) => {
        if (!orgId || !currentUser) return;

        const reason = prompt('Ástæða fyrir höfnun:');
        if (!reason) return;

        try {
            await denyAccessRequest(
                orgId,
                requestId,
                currentUser.uid,
                currentUser.name || 'Admin',
                reason
            );
            await loadData();
        } catch (err) {
            logger.error('Error denying access:', err);
            alert('Villa kom upp við að hafna aðgangi');
        }
    };

    const handleApproveBooking = async (requestId: string) => {
        if (!orgId || !currentUser) return;

        try {
            await approveBookingRequest(
                orgId,
                requestId,
                currentUser.uid,
                currentUser.name || 'Admin'
            );
            await loadData();
        } catch (err) {
            logger.error('Error approving booking:', err);
            alert('Villa kom upp við að samþykkja bókun');
        }
    };

    const handleDenyBooking = async (requestId: string) => {
        if (!orgId || !currentUser) return;

        const reason = prompt('Ástæða fyrir höfnun:');
        if (!reason) return;

        try {
            await denyBookingRequest(
                orgId,
                requestId,
                currentUser.uid,
                currentUser.name || 'Admin',
                reason
            );
            await loadData();
        } catch (err) {
            logger.error('Error denying booking:', err);
            alert('Villa kom upp við að hafna bókun');
        }
    };

    return { handleApproveAccess, handleDenyAccess, handleApproveBooking, handleDenyBooking };
}
