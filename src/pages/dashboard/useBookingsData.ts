import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking } from '@/types/models';
import { logger } from '@/utils/logger';
import type { SetDashboardLoading } from './types';

/** Upcoming bookings: the next one plus whether the house is occupied right now. */
export function useBookingsData(houseId: string | undefined, uid: string | undefined, setDashboardLoading: SetDashboardLoading) {
    const [nextBooking, setNextBooking] = useState<Booking | null>(null);
    const [isOccupied, setIsOccupied] = useState(false);

    useEffect(() => {
        if (!houseId || !uid) return;
        const unsubscribes: (() => void)[] = [];
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // 1. Bookings & Occupancy (Subcollection)
            const qBookings = query(
                collection(db, 'houses', houseId, 'bookings'),
                where('end', '>=', todayStart),
                orderBy('end', 'asc'),
                limit(5)
            );

            unsubscribes.push(onSnapshot(qBookings, (snapshot) => {
                const bookingsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    start: doc.data().start?.toDate(),
                    end: doc.data().end?.toDate(),
                    created_at: doc.data().created_at?.toDate()
                })) as Booking[];

                // Set Next Booking
                setNextBooking(bookingsData.length > 0 ? bookingsData[0] : null);

                // Check Occupancy
                const active = bookingsData.find(b => b.start <= new Date() && b.end >= new Date());
                setIsOccupied(!!active);
            }, (error) => {
                logger.error("Bookings listener error:", error);
                setDashboardLoading(false);
            }));
        } catch (err) {
            logger.error("Setup listeners error:", err);
            setDashboardLoading(false);
        }
        return () => {
            unsubscribes.forEach(u => u());
        };
    }, [houseId, uid, setDashboardLoading]);

    return { nextBooking, isOccupied };
}
