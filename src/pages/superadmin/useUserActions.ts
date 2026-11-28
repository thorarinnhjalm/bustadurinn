import { useNavigate } from 'react-router-dom';
import { db, auth } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useAppStore } from '@/store/appStore';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';

import type { House, User } from '@/types/models';
import type { AuditState, SetActionLoading, SetStats, UserActions } from './types';

/**
 * Handlers on a single user that are reachable from more than one tab
 * (Data > Users and the System > Audit panels).
 */
export function useUserActions(
    setStats: SetStats,
    setActionLoading: SetActionLoading,
    audit: Pick<AuditState, 'setOrphans' | 'setStuckUsers'>
): UserActions {
    const navigate = useNavigate();
    const { startImpersonation } = useImpersonation();
    const { setOrphans, setStuckUsers } = audit;

    // Impersonate user
    const handleImpersonate = async (user: User) => {
        if (!confirm(`View as ${user.name}?\n\nYou'll see exactly what they see. Click "Exit God Mode" to return.`)) {
            return;
        }

        try {
            setActionLoading(`impersonate-${user.uid}`);

            // Fetch the impersonated user's house DIRECTLY (not all houses)
            let userHouse = null;
            if (user.house_ids && user.house_ids.length > 0) {
                const houseId = user.house_ids[0];

                try {
                    const houseDocRef = doc(db, 'houses', houseId);
                    const houseSnap = await getDoc(houseDocRef);

                    if (houseSnap.exists()) {
                        userHouse = { id: houseSnap.id, ...houseSnap.data() } as House;
                        logger.debug('Loaded user house:', userHouse.name);
                    } else {
                        logger.warn('House not found:', houseId);
                    }
                } catch (fetchError) {
                    logger.error('Error fetching user house:', fetchError);
                    // Continue anyway - user might not have a house
                }
            }

            // Set impersonation context FIRST
            startImpersonation(user);
            logger.info('Impersonation context set for:', user.name);

            // Then update store with their house
            if (userHouse) {
                useAppStore.getState().setCurrentHouse(userHouse);
                useAppStore.getState().setUserHouses([userHouse]);
                logger.debug('Store updated with user house');
            } else {
                // Clear house if they don't have one
                useAppStore.getState().setCurrentHouse(null);
                useAppStore.getState().setUserHouses([]);
                logger.debug('User has no house - cleared store');
            }

            // Save return URL
            localStorage.setItem('admin_return_url', window.location.pathname);

            // Small delay to ensure store updates are processed
            await new Promise(resolve => setTimeout(resolve, 200));

            logger.info('Navigating to dashboard as', user.name);

            // Navigate to their dashboard
            navigate('/dashboard');
        } catch (error: any) {
            logger.error('Impersonation error:', error);
            alert('Ekki tókst að setja þig í spor notandans: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (user: User) => {
        const confirmText = `EYÐA NOTANDA "${user.name}" (${user.email})?\n\nÞetta eyðir aðganginum varanlega úr Auth og gagnagrunni.\n\nSkrifaðu "DELETE" til að staðfesta:`;
        if (prompt(confirmText) !== 'DELETE') return;

        setActionLoading(`delete-user-${user.uid}`);
        try {
            // Get Firebase auth token for API authentication
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const res = await fetch('/api/admin-delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`  // 🔒 Auth token required
                },
                body: JSON.stringify({ uid: user.uid })
            });

            if (!res.ok) {
                const text = await res.text();
                let errorMessage = 'Failed to delete user';
                try {
                    const data = JSON.parse(text);
                    errorMessage = data.error || data.message || errorMessage;
                    if (data.details) errorMessage += `\n\nDetails: ${data.details}`;
                } catch {
                    // Not JSON, use raw text (might be Vercel crash page)
                    errorMessage = `Server Error (${res.status}): ${text.slice(0, 200)}`;
                }
                throw new Error(errorMessage);
            }

            setStats(prev => ({
                ...prev,
                totalUsers: prev.totalUsers - 1,
                allUsers: prev.allUsers.filter(u => u.uid !== user.uid)
            }));

            // Also update audit lists if they exist
            setOrphans(prev => prev.filter(o => o.uid !== user.uid));
            setStuckUsers(prev => prev.filter(s => s.uid !== user.uid));

            alert('✅ Notanda eytt!');
        } catch (error: any) {
            logger.error('Error deleting user:', error);
            alert(`❌ Villa: ${getUserMessage(error)}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSendRecoveryEmail = async (user: User) => {
        if (!confirm(`Senda 'Finish Setup' póst á ${user.email}?`)) return;
        setActionLoading(`recovery-${user.uid}`);
        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
                },
                body: JSON.stringify({
                    templateId: 'finish_setup',
                    to: user.email,
                    variables: {
                        name: user.name || 'Vinur',
                    }
                })
            });
            if (!res.ok) throw new Error(`send-email failed (${res.status})`);
            alert('Póstur sendur!');
        } catch (error) {
            logger.error(error);
            alert('Mistókst að senda póst.');
        } finally {
            setActionLoading(null);
        }
    };

    return { handleImpersonate, handleDeleteUser, handleSendRecoveryEmail };
}
