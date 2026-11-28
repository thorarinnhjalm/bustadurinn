import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, collectionGroup, getCountFromServer, getDocs, query, where, limit } from 'firebase/firestore';
import { logger } from '@/utils/logger';
import { getAllOrganizations } from '@/services/organizationService';

import type { House, User, ContactSubmission, Feedback, ServiceProvider } from '@/types/models';
import type { NewsletterSubscriber, Stats } from './types';

const CACHE_TTL = 5 * 60 * 1000;
// Single module-level instance shared by every mount of the page.
let statsCache: { data: Stats; timestamp: number } | null = null;

export function invalidateStatsCache() {
    statsCache = null;
}

export function useSuperAdminData() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchWarnings, setFetchWarnings] = useState<string[]>([]);

    const [stats, setStats] = useState<Stats>({
        totalHouses: 0,
        totalUsers: 0,
        totalBookings: 0,
        totalSubscribers: 0,
        totalProviders: 0,
        totalOrganizations: 0,
        activeTasks: 0,
        sandboxVisits: 0,
        allHouses: [],
        allUsers: [],
        allBookings: [],
        allContacts: [],
        allSubscribers: [],
        allFeedback: [],
        allProviders: [],
        allOrganizations: [],
    });

    const fetchStats = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
            setStats(statsCache.data);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setFetchWarnings([]);

            const warnings: string[] = [];

            const safeFetch = async (collName: string, maxDocs = 2000) => {
                try {
                    const snap = await getDocs(query(collection(db, collName), limit(maxDocs)));
                    return snap;
                } catch (e: any) {
                    logger.error(`Error fetching ${collName}:`, e);
                    warnings.push(`Gat ekki sótt gögn fyrir "${collName}"`);
                    return null;
                }
            };

            // Bookings and tasks live in houses/{id}/bookings|tasks, so they are read with
            // collection-group queries (super-admin-only rules).
            const safeFetchGroup = async (groupName: string, maxDocs: number) => {
                try {
                    return await getDocs(query(collectionGroup(db, groupName), limit(maxDocs)));
                } catch (e: any) {
                    logger.error(`Error fetching collection group ${groupName}:`, e);
                    warnings.push(`Gat ekki sótt gögn fyrir "${groupName}"`);
                    return null;
                }
            };
            const bookingsCount = getCountFromServer(collectionGroup(db, 'bookings'))
                .then((c) => c.data().count)
                .catch((e) => {
                    logger.error('Error counting bookings:', e);
                    warnings.push('Gat ekki talið bókanir');
                    return null;
                });

            const [housesSnap, usersSnap, bookingsSnap, tasksSnap, contactsSnap, subSnap, feedbackSnap, providersSnap, providerContactsSnap, organizationsData, sandboxVisitsSnap] = await Promise.all([
                safeFetch('houses'),
                safeFetch('users'),
                safeFetchGroup('bookings', 500),
                safeFetchGroup('tasks', 2000),
                safeFetch('contact_submissions', 500),
                safeFetch('newsletter_subscribers', 2000),
                safeFetch('feedback', 500),
                safeFetch('service_providers', 500),
                safeFetch('service_provider_contacts', 500),
                getAllOrganizations().catch((e) => {
                    logger.error('Error fetching organizations:', e);
                    warnings.push('Gat ekki sótt gögn fyrir "organizations"');
                    return [];
                }),
                getDocs(query(collection(db, 'funnel_events'), where('event_name', '==', 'sandbox_visited'), limit(1000))).catch((e) => {
                    logger.error('Error fetching funnel_events:', e);
                    warnings.push('Gat ekki sótt funnel_events');
                    return null;
                })
            ]);
            const totalBookingsCount = await bookingsCount;

            const users = usersSnap?.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)) || [];
            const activeTasks = tasksSnap?.docs.filter(doc => doc.data().status !== 'completed').length || 0;
            const houses = housesSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() } as House)) || [];
            const contacts = contactsSnap?.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                created_at: doc.data().created_at?.toDate() || new Date()
            } as ContactSubmission)) || [];
            const subscribers = subSnap?.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                created_at: (doc.data().created_at as any)?.toDate() || new Date()
            } as NewsletterSubscriber)) || [];
            const feedback = feedbackSnap?.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: (doc.data().createdAt as any)?.toDate() || new Date()
            } as Feedback)) || [];
            const bookings = bookingsSnap?.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                start: doc.data().start?.toDate(),
                end: doc.data().end?.toDate(),
                created_at: doc.data().created_at?.toDate()
            })) || [];

            const newStats: Stats = {
                totalHouses: houses.length,
                totalUsers: users.length,
                totalBookings: totalBookingsCount ?? bookingsSnap?.size ?? 0,
                totalSubscribers: subSnap?.size || 0,
                totalProviders: providersSnap?.size || 0,
                totalOrganizations: organizationsData.length || 0,
                sandboxVisits: sandboxVisitsSnap?.size || 0,
                activeTasks,
                allHouses: houses,
                allUsers: users,
                allBookings: bookings,
                allContacts: contacts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
                allSubscribers: subscribers.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
                allFeedback: feedback.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
                // Contact fields come from service_provider_contacts; legacy fields on the provider doc are the fallback.
                allProviders: providersSnap?.docs.map(doc => {
                    const c = providerContactsSnap?.docs.find(x => x.id === doc.id)?.data();
                    return {
                        id: doc.id,
                        ...doc.data(),
                        ...(c ? { contact_email: c.contact_email, contact_phone: c.contact_phone, address: c.address } : {})
                    } as ServiceProvider;
                }) || [],
                allOrganizations: organizationsData || [],
            };
            statsCache = { data: newStats, timestamp: Date.now() };
            setStats(newStats);

            if (warnings.length > 0) setFetchWarnings(warnings);
            if (!housesSnap && !usersSnap && warnings.length > 0) {
                logger.warn('Critical core collections failed to load.');
            }
        } catch (error: any) {
            logger.error('Global fetch stats error:', error);
            setError('Ekki tókst að sækja gögn. Reyndu aftur.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        logger.info('SuperAdmin Version: 1.2.0 - Email Service Active');
        fetchStats();
    }, [fetchStats]);

    return { stats, setStats, loading, setLoading, error, fetchWarnings, setFetchWarnings, fetchStats };
}
