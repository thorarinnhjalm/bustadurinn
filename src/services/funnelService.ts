/**
 * Reads the new-user funnel (`funnel_events`, written by `src/utils/funnel.ts`)
 * for the super-admin view. Reads are super-admin only in firestore.rules.
 */

import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// A stuck signup has a few dozen events; this only guards against runaways.
const MAX_EVENTS = 500;

type FunnelValue = string | number | boolean | null;

export interface FunnelEvent {
    id: string;
    event_name: string;
    /** When the event happened in the browser. Buffered events are written later, so this is the order to trust. Null if unknown. */
    at: Date | null;
    session_id: string;
    load_id: string;
    path: string;
    env: string;
    ua: string;
    buffered: boolean;
    data: Record<string, FunnelValue>;
}

export interface AnnotatedFunnelEvent extends FunnelEvent {
    /** First event of a new session after an earlier one: a new tab, a new visit or a new sign-in. */
    newSession: boolean;
    /** Same session, new page load: the user reloaded, or the app itself did a full page load. */
    reload: boolean;
}

function toDate(clientTs: unknown, timestamp: any): Date | null {
    if (typeof clientTs === 'number') return new Date(clientTs);
    if (typeof timestamp?.toDate === 'function') return timestamp.toDate();
    return null;
}

function toText(value: unknown): string {
    try {
        return typeof value === 'string' ? value : JSON.stringify(value) ?? '';
    } catch {
        return '';
    }
}

// Any signed-in user can create funnel_events, so documents are not trusted
// to have the shape funnel.ts writes. Everything rendered is a primitive.
function toData(raw: unknown): Record<string, FunnelValue> {
    const out: Record<string, FunnelValue> = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const [key, value] of Object.entries(raw)) {
        out[key] = value === null || typeof value === 'number' || typeof value === 'boolean'
            ? value
            : toText(value);
    }
    return out;
}

/** Marks where a new tab or a reload starts, in chronological order. */
export function annotateFunnelEvents(events: FunnelEvent[]): AnnotatedFunnelEvent[] {
    const sorted = [...events].sort((a, b) => (a.at?.getTime() ?? 0) - (b.at?.getTime() ?? 0));
    const seenSessions = new Set<string>();
    const seenLoads = new Set<string>();
    return sorted.map((event) => {
        // Events from before session/load ids were recorded say nothing about tabs or reloads.
        if (!event.session_id || !event.load_id) return { ...event, newSession: false, reload: false };
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
            event_name: toText(raw.event_name),
            at: toDate(raw.client_ts, raw.timestamp),
            session_id: toText(raw.session_id),
            load_id: toText(raw.load_id),
            path: toText(raw.path),
            env: toText(raw.env),
            ua: toText(raw.ua),
            buffered: raw.buffered === true,
            data: toData(raw.data),
        };
    });
    return annotateFunnelEvents(events);
}
