/**
 * useAdminStats Hook
 * Centralized data fetching for Super Admin dashboard
 * Fetches houses, users, bookings, contacts, and newsletter subscribers
 */

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, collectionGroup, getDocs, getDoc, doc } from 'firebase/firestore';
import { logger } from '@/utils/logger';
import type { House, User, ContactSubmission } from '@/types/models';

interface NewsletterSubscriber {
    id: string;
    email: string;
    created_at: Date;
    source?: string;
    status: string;
}

export interface AdminStats {
    totalHouses: number;
    totalUsers: number;
    totalBookings: number;
    totalSubscribers: number;
    activeTasks: number;
    allHouses: House[];
    allUsers: User[];
    allContacts: ContactSubmission[];
    allSubscribers: NewsletterSubscriber[];
    launchOfferCount: number;
}

export function useAdminStats() {
    const [stats, setStats] = useState<AdminStats>({
        totalHouses: 0,
        totalUsers: 0,
        totalBookings: 0,
        totalSubscribers: 0,
        activeTasks: 0,
        allHouses: [],
        allUsers: [],
        allContacts: [],
        allSubscribers: [],
        launchOfferCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);

                const safeFetch = async (collName: string) => {
                    try {
                        const snap = await getDocs(collection(db, collName));
                        return snap;
                    } catch (e) {
                        logger.error(`Error fetching ${collName}:`, e);
                        return null;
                    }
                };

                // Bookings and tasks live in houses/{id}/bookings|tasks.
                const safeFetchGroup = async (groupName: string) => {
                    try {
                        return await getDocs(collectionGroup(db, groupName));
                    } catch (e) {
                        logger.error(`Error fetching collection group ${groupName}:`, e);
                        return null;
                    }
                };

                const [
                    housesSnap,
                    usersSnap,
                    bookingsSnap,
                    tasksSnap,
                    contactsSnap,
                    subSnap,
                    promoSnapResult,
                ] = await Promise.all([
                    safeFetch('houses'),
                    safeFetch('users'),
                    safeFetchGroup('bookings'),
                    safeFetchGroup('tasks'),
                    safeFetch('contact_submissions'),
                    safeFetch('newsletter_subscribers'),
                    getDoc(doc(db, 'system', 'promotions')),
                ]);

                const houses =
                    housesSnap?.docs.map((doc) => ({ id: doc.id, ...doc.data() } as House)) || [];
                const users =
                    usersSnap?.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as User)) || [];
                const activeTasks =
                    tasksSnap?.docs.filter((doc) => doc.data().status !== 'completed').length || 0;

                const contacts =
                    contactsSnap?.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        created_at: doc.data().created_at?.toDate() || new Date(),
                    } as ContactSubmission)) || [];

                const subscribers =
                    subSnap?.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        created_at: (doc.data().created_at as any)?.toDate() || new Date(),
                    } as NewsletterSubscriber)) || [];

                setStats({
                    totalHouses: houses.length,
                    totalUsers: users.length,
                    totalBookings: bookingsSnap?.size || 0,
                    totalSubscribers: subSnap?.size || 0,
                    activeTasks,
                    allHouses: houses,
                    allUsers: users,
                    allContacts: contacts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
                    allSubscribers: subscribers.sort(
                        (a, b) => b.created_at.getTime() - a.created_at.getTime()
                    ),
                    launchOfferCount:
                        promoSnapResult && promoSnapResult.exists()
                            ? promoSnapResult.data().launch_offer_count || 0
                            : 0,
                });

                if (!housesSnap && !usersSnap) {
                    setError('Sum gögn gáfu ekki aðgang. Vinsamlegast athugaðu Console.');
                }
            } catch (error: any) {
                logger.error('Global fetch stats error:', error);
                setError(error.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const refreshStats = async () => {
        setLoading(true);
        // Trigger re-fetch by updating a dependency or calling fetchStats again
        // For simplicity, we can just reload the component or use a refresh flag
    };

    return { stats, loading, error, refreshStats, setStats };
}
