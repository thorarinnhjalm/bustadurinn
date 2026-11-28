import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';

import type { AuditState } from './types';

/**
 * Audit state (orphans / stuck users / test users). The scan runs whenever `enabled`
 * turns true (System tab with the Audit sub-tab active). The state lives in the page
 * because deleting a user from the Data tab also prunes these lists.
 */
export function useAdminAudit(enabled: boolean): AuditState {
    const [orphans, setOrphans] = useState<any[]>([]);
    const [stuckUsers, setStuckUsers] = useState<any[]>([]);
    const [testUsers, setTestUsers] = useState<any[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);

    // Audit & Health Logic
    const fetchOrphans = async () => {
        setAuditLoading(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/admin-audit-users', {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            let data;
            try {
                data = await res.json();
            } catch {
                // If parsing fails (e.g. 404 HTML page), throw specific error
                throw new Error(`Server returned non-JSON response (${res.status}). Ensure API is deployed.`);
            }

            if (res.ok) {
                setOrphans(data.orphans || []);
                setStuckUsers(data.stuckUsers || []);
                setTestUsers(data.testUsers || []);
            } else {
                throw new Error(data.error || 'Failed to fetch orphans');
            }
        } catch (e: any) {
            logger.error('Audit error:', e);
            alert('Villa í úttekt: ' + getUserMessage(e));
        } finally {
            setAuditLoading(false);
        }
    };

    useEffect(() => {
        if (enabled) {
            fetchOrphans();
        }
    }, [enabled]);

    return { orphans, stuckUsers, testUsers, auditLoading, setOrphans, setStuckUsers, fetchOrphans };
}
