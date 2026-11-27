/**
 * useMembers Hook
 * Manages house members and invitations
 */

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { getHouseMembers } from '@/services/houseMembersService';
import { logger } from '@/utils/logger';
import type { User } from '@/types/models';

interface Invitation {
    id: string;
    email: string;
    house_id: string;
    created_at: Date;
    status: string;
}

export function useMembers(houseId: string | undefined, ownerIds: string[] | undefined) {
    const [members, setMembers] = useState<User[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const ownerIdsKey = ownerIds?.join(',');

    useEffect(() => {
        if (!houseId || !ownerIds?.length) return;

        const fetchMembers = async () => {
            setLoading(true);
            setError('');

            // Members and invitations load independently: one failure must not hide the other.
            const [membersResult, invitationsResult] = await Promise.allSettled([
                getHouseMembers(houseId),
                getDocs(query(collection(db, 'invitations'), where('house_id', '==', houseId), limit(50))),
            ]);

            if (membersResult.status === 'fulfilled') {
                setMembers(membersResult.value.map((m) => ({
                    uid: m.uid,
                    name: m.name,
                    email: m.email,
                    avatar: m.avatar_url ?? undefined,
                    house_ids: [],
                    created_at: new Date(),
                } as User)));
            } else {
                logger.error('Error fetching members:', membersResult.reason);
                setError('Gat ekki sótt meðlimi');
            }

            if (invitationsResult.status === 'fulfilled') {
                setInvitations(invitationsResult.value.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                    created_at: d.data().created_at?.toDate() || new Date(),
                })) as Invitation[]);
            } else {
                logger.error('Error fetching invitations:', invitationsResult.reason);
            }

            setLoading(false);
        };

        fetchMembers();
    }, [houseId, ownerIds, ownerIdsKey]); // Use join string to detect changes properly

    return { members, setMembers, invitations, setInvitations, loading, error };
}
