import { useState, useEffect } from 'react';
import type { House, User } from '@/types/models';
import { getHouseMembers } from '@/services/houseMembersService';
import { logger } from '@/utils/logger';
import type { Tab } from './tabs';

/**
 * The house's member list. Shared by the Hús, Meðeigendur and Verkefni tabs and by
 * the membership modals, so it lives at page level and fetches whenever one of those
 * tabs is active (via /api/house-members: users may only read their own user doc).
 */
export function useHouseMembers(house: House | null, activeTab: Tab) {
    const [members, setMembers] = useState<User[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [membersError, setMembersError] = useState('');
    const [membersReloadKey, setMembersReloadKey] = useState(0);

    // Fetch members (via /api/house-members: users may only read their own user doc)
    useEffect(() => {
        if ((activeTab === 'members' || activeTab === 'house' || activeTab === 'logs') && house?.id) {
            let cancelled = false;
            const houseId = house.id;
            const fetchMembers = async () => {
                setLoadingMembers(true);
                setMembersError('');
                try {
                    const list = await getHouseMembers(houseId, membersReloadKey > 0 ? { force: true } : undefined);
                    if (cancelled) return;
                    setMembers(list.map((m) => ({
                        uid: m.uid,
                        name: m.name,
                        email: m.email,
                        avatar: m.avatar_url ?? undefined,
                        house_ids: [],
                        created_at: new Date(),
                    } as User)));
                } catch (err) {
                    logger.error('Error fetching members', err);
                    if (!cancelled) setMembersError('Gat ekki sótt lista yfir meðeigendur.');
                } finally {
                    if (!cancelled) setLoadingMembers(false);
                }
            };
            fetchMembers();
            return () => { cancelled = true; };
        }
    }, [activeTab, house?.owner_ids, house?.id, membersReloadKey]);

    const reloadMembers = () => setMembersReloadKey((k) => k + 1);
    const clearMembers = () => setMembers([]);

    return { members, loadingMembers, membersError, reloadMembers, clearMembers };
}
