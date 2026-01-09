/**
 * useMembers Hook
 * Manages house members and invitations
 */

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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

    useEffect(() => {
        if (!houseId || !ownerIds?.length) return;

        const fetchMembers = async () => {
            setLoading(true);
            setError('');

            try {
                // Fetch members (max 10 due to Firestore 'in' query limit)
                const promises = ownerIds.map((uid) => getDoc(doc(db, 'users', uid)));
                const docs = await Promise.all(promises);
                const users = docs
                    .map((d) => {
                        if (d.exists()) {
                            return { uid: d.id, ...d.data() } as User;
                        }
                        return null;
                    })
                    .filter((u): u is User => u !== null);

                setMembers(users);

                // Fetch pending invitations
                const invQ = query(collection(db, 'invitations'), where('house_id', '==', houseId));
                const invSnap = await getDocs(invQ);
                const invs = invSnap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                    created_at: d.data().created_at?.toDate() || new Date(),
                })) as Invitation[];

                setInvitations(invs);
            } catch (err) {
                logger.error('Error fetching members:', err);
                setError('Gat ekki sótt meðlimi');
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [houseId, ownerIds?.join(',')]); // Use join to avoid array reference issues

    return { members, setMembers, invitations, setInvitations, loading, error };
}
