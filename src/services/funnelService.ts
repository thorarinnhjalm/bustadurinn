/**
 * Reads the new-user funnel (`funnel_events`, written by `src/utils/funnel.ts`)
 * for the super-admin view. Reads are super-admin only in firestore.rules.
 */

import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// A stuck signup has a few dozen events; this only guards against runaways.
const MAX_EVENTS = 500;

export interface FunnelEvent {
    id: string;
    event_name: string;
    /** When the event happened in the browser. Buffered events are written later, so this is the order to trust. */
    at: Date;
    session_id: string;
    load_id: string;
    path: string;
    env: string;
    ua: string;
    buffered: boolean;
    data: Record<string, string | number | boolean | null>;
}

export interface AnnotatedFunnelEvent extends FunnelEvent {
    /** First event in a new browser tab (session) after an earlier one. */
    newSession: boolean;
    /** Same tab, new page load: the user reloaded or came back to the site. */
    reload: boolean;
}

function toDate(clientTs: unknown, timestamp: any): Date {
    if (typeof clientTs === 'number') return new Date(clientTs);
    if (timestamp?.toDate) return timestamp.toDate();
    return new Date(0);
}

/** Marks where a new tab or a reload starts, in chronological order. */
export function annotateFunnelEvents(events: FunnelEvent[]): AnnotatedFunnelEvent[] {
    const sorted = [...events].sort((a, b) => a.at.getTime() - b.at.getTime());
    const seenSessions = new Set<string>();
    const seenLoads = new Set<string>();
    return sorted.map((event) => {
        const firstOfSession = !seenSessions.has(event.session_id);
        const firstOfLoad = !seenLoads.has(event.load_id);
        const newSession = firstOfSession && seenSessions.size > 0;
        const reload = !firstOfSession && firstOfLoad;
        seenSessions.add(event.session_id);
        seenLoads.add(event.load_id);
        return { ...event, newSession, reload };
    });
}

/** All funnel events for one user, oldest first. */
export async function getFunnelEventsForUser(uid: string): Promise<AnnotatedFunnelEvent[]> {
    // No orderBy: uid + timestamp would need a composite index. Sorted client-side.
    const snapshot = await getDocs(
        query(collection(db, 'funnel_events'), where('uid', '==', uid), limit(MAX_EVENTS))
    );
    const events: FunnelEvent[] = snapshot.docs.map((d) => {
        const raw = d.data();
        return {
            id: d.id,
            event_name: String(raw.event_name ?? ''),
            at: toDate(raw.client_ts, raw.timestamp),
            session_id: String(raw.session_id ?? ''),
            load_id: String(raw.load_id ?? ''),
            path: String(raw.path ?? ''),
            env: String(raw.env ?? ''),
            ua: String(raw.ua ?? ''),
            buffered: raw.buffered === true,
            data: raw.data && typeof raw.data === 'object' ? raw.data : {},
        };
    });
    return annotateFunnelEvents(events);
}
