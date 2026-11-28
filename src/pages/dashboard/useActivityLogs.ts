import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/utils/logger';
import type { CheckInOutLog, LastCheckoutChecklist, SetDashboardLoading } from './types';

/**
 * The internal_logs listener: derives the current user's check-in status, the
 * last checkout checklist (any user) and the seasonal-checklist status.
 */
export function useActivityLogs(houseId: string | undefined, uid: string | undefined, setDashboardLoading: SetDashboardLoading) {
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [lastCheckoutChecklist, setLastCheckoutChecklist] = useState<LastCheckoutChecklist | null>(null);
    // Seasonal checklist state: whether a seasonal_spring/seasonal_autumn log
    // already exists for the current calendar year (derived from the same
    // internal_logs listener used for check-in/out status, see setup below).
    const [seasonalLogged, setSeasonalLogged] = useState({ spring: false, autumn: false });

    useEffect(() => {
        if (!houseId || !uid) return;
        const unsubscribes: (() => void)[] = [];
        try {
            // 4. Internal Logs (Subcollection - for Check-in status)
            // Limit raised from 5 to 30 so this same listener can also answer
            // "has a seasonal checklist already been logged this year?" for
            // SeasonalChecklistCard (that only happens twice a year, but a
            // busy house's check-in/check-out traffic could otherwise push
            // it out of a tighter window) without standing up a second
            // onSnapshot subscription just for that.
            const qLogs = query(
                collection(db, 'houses', houseId, 'internal_logs'),
                orderBy('created_at', 'desc'),
                limit(30)
            );
            unsubscribes.push(onSnapshot(qLogs, (snapshot) => {
                const logsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate()
                })) as CheckInOutLog[];

                // Check check-in status
                if (uid) {
                    const userLogs = logsData.filter(log => log.user_id === uid);
                    if (userLogs.length > 0) {
                        const last = userLogs[0];
                        // Prefer the structured field; fall back to string-matching
                        // Icelandic log text for older logs written before `kind` existed.
                        if (last.kind === 'check_in') setIsCheckedIn(true);
                        else if (last.kind === 'check_out') setIsCheckedIn(false);
                        else if (last.text.includes('skráði komu')) setIsCheckedIn(true);
                        else if (last.text.includes('skráði brottför')) setIsCheckedIn(false);
                    }
                }

                // Last checkout checklist state (any user, not just the current
                // user) — shown to whoever arrives next. `logsData` is already
                // ordered desc by created_at, so the first check_out log found
                // is the most recent one overall.
                const lastCheckoutLog = logsData.find(log => log.kind === 'check_out');
                if (lastCheckoutLog?.checklist && Object.keys(lastCheckoutLog.checklist).length > 0) {
                    const entries = Object.entries(lastCheckoutLog.checklist);
                    const uncheckedItems = entries.filter(([, checked]) => !checked).map(([item]) => item);
                    setLastCheckoutChecklist({ allChecked: uncheckedItems.length === 0, uncheckedItems });
                } else {
                    setLastCheckoutChecklist(null);
                }

                // Seasonal checklist status: has a seasonal_spring/seasonal_autumn
                // log already been written this calendar year?
                const currentYear = new Date().getFullYear();
                const springLogged = logsData.some(
                    log => log.kind === 'seasonal_spring' && log.created_at?.getFullYear() === currentYear
                );
                const autumnLogged = logsData.some(
                    log => log.kind === 'seasonal_autumn' && log.created_at?.getFullYear() === currentYear
                );
                setSeasonalLogged({ spring: springLogged, autumn: autumnLogged });
            }, (error) => {
                logger.error("Logs listener error:", error);
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

    return { isCheckedIn, setIsCheckedIn, lastCheckoutChecklist, seasonalLogged };
}
