/**
 * New-user funnel tracking (signup → onboarding → first dashboard).
 *
 * Every step, error and reset is written to the `funnel_events` collection so
 * that when a new user gets stuck we can read exactly where and why.
 *
 * - `session_id` is per browser tab (sessionStorage), so it survives reloads.
 * - `load_id` is per JS page load, so a reload shows up as a new load_id
 *   within the same session, while a React remount or a "Til baka" click does
 *   not. That is what tells the three apart.
 * - Firestore rules only allow authenticated creates, so events recorded
 *   before sign-in (signup page, failed signup attempts) are buffered in
 *   sessionStorage and flushed with the uid once the user is signed in.
 *
 * Tracking must never break the flow it observes: every path swallows errors.
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { logger } from '@/utils/logger';

const SESSION_KEY = 'funnel_session_id';
const BUFFER_KEY = 'funnel_buffer';
const MAX_BUFFER = 30;
const MAX_STRING = 500;
// Buffered events older than this are dropped at flush: on a shared tab they
// most likely belong to someone else.
const MAX_BUFFER_AGE_MS = 30 * 60_000;
const MAX_ERROR_EVENTS_PER_LOAD = 10;
// Set by ImpersonationContext while a super admin acts as another user.
const IMPERSONATION_KEY = 'admin_impersonation';

type FunnelValue = string | number | boolean | null;
export type FunnelData = Record<string, unknown>;

interface PendingEvent {
    event_name: string;
    client_ts: number;
    path: string;
    load_id: string;
    data: Record<string, FunnelValue>;
}

const randomId = (): string =>
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const LOAD_ID = randomId();

function safeStorageGet(key: string): string | null {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

function safeStorageSet(key: string, value: string | null): void {
    try {
        if (value === null) sessionStorage.removeItem(key);
        else sessionStorage.setItem(key, value);
    } catch {
        // Private mode / blocked storage: tracking degrades, flow continues.
    }
}

let memorySessionId: string | null = null;

function getSessionId(): string {
    const stored = safeStorageGet(SESSION_KEY);
    if (stored) return stored;
    const id = memorySessionId ?? randomId();
    memorySessionId = id;
    safeStorageSet(SESSION_KEY, id);
    return id;
}

function truncate(value: string): string {
    return value.length > MAX_STRING ? value.slice(0, MAX_STRING) : value;
}

function sanitize(data?: FunnelData): Record<string, FunnelValue> {
    const out: Record<string, FunnelValue> = {};
    if (!data) return out;
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        if (value === null || typeof value === 'number' || typeof value === 'boolean') {
            out[key] = value;
        } else if (typeof value === 'string') {
            out[key] = truncate(value);
        } else {
            let text: string;
            try {
                text = JSON.stringify(value) ?? String(value);
            } catch {
                text = String(value);
            }
            out[key] = truncate(text);
        }
    }
    return out;
}

function readBuffer(): PendingEvent[] {
    const raw = safeStorageGet(BUFFER_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/** Strips secrets from app paths: `/join/:houseId/:code` keeps only the house id. */
export function redactPath(path: string): string {
    const withoutQuery = path.split(/[?#]/)[0];
    return withoutQuery.replace(/^(\/join\/[^/]+)\/[^/]+.*$/, '$1/*');
}

function currentPath(): string {
    try {
        return redactPath(window.location.pathname);
    } catch {
        return '';
    }
}

function isImpersonating(): boolean {
    try {
        return !!localStorage.getItem(IMPERSONATION_KEY);
    } catch {
        return false;
    }
}

function userAgent(): string {
    try {
        return truncate(navigator.userAgent || '');
    } catch {
        return '';
    }
}

async function write(uid: string, event: PendingEvent, buffered: boolean): Promise<void> {
    try {
        const houseId = event.data.house_id;
        await addDoc(collection(db, 'funnel_events'), {
            uid,
            event_name: event.event_name,
            timestamp: serverTimestamp(),
            client_ts: event.client_ts,
            session_id: getSessionId(),
            load_id: event.load_id,
            path: event.path,
            env: import.meta.env.MODE ?? 'unknown',
            ua: userAgent(),
            buffered,
            // Kept top-level for compatibility with the original onboarding events.
            house_id: typeof houseId === 'string' ? houseId : null,
            data: event.data,
        });
    } catch (e) {
        logger.warn('Funnel event write failed:', event.event_name, e);
    }
}

/**
 * Writes any events recorded before sign-in, attributing them to the now
 * signed-in user. Safe to call repeatedly.
 */
export async function flushFunnelBuffer(): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const pending = readBuffer();
    if (pending.length === 0) return;
    safeStorageSet(BUFFER_KEY, null);
    const cutoff = Date.now() - MAX_BUFFER_AGE_MS;
    // Start every write before awaiting any, so all are queued even if the
    // tab closes mid-flush. Order is recoverable from client_ts.
    await Promise.all(
        pending.filter((event) => event.client_ts >= cutoff).map((event) => write(uid, event, true))
    );
}

/**
 * Forgets everything tied to the previous user of this tab: the pre-sign-in
 * buffer and the session id. Call on sign-out.
 */
export function resetFunnelSession(): void {
    safeStorageSet(BUFFER_KEY, null);
    safeStorageSet(SESSION_KEY, null);
    memorySessionId = null;
}

/** Records one funnel event. Never throws. */
export async function trackFunnel(eventName: string, data?: FunnelData): Promise<void> {
    try {
        // An admin acting as another user is not a funnel participant.
        if (isImpersonating()) return;

        const event: PendingEvent = {
            event_name: eventName,
            client_ts: Date.now(),
            path: currentPath(),
            load_id: LOAD_ID,
            data: sanitize(data),
        };

        const uid = auth.currentUser?.uid;
        if (!uid) {
            const buffer = [...readBuffer(), event].slice(-MAX_BUFFER);
            safeStorageSet(BUFFER_KEY, JSON.stringify(buffer));
            return;
        }

        await flushFunnelBuffer();
        await write(uid, event, false);
    } catch (e) {
        logger.warn('Funnel tracking failed:', eventName, e);
    }
}

/** Normalises anything thrown into a small { code, message } pair for logging. */
export function describeError(err: unknown): { code: string; message: string } {
    try {
        if (err && typeof err === 'object') {
            const e = err as { code?: unknown; name?: unknown; message?: unknown };
            const code = typeof e.code === 'string' ? e.code : typeof e.name === 'string' ? e.name : 'unknown';
            const message = typeof e.message === 'string' ? e.message : String(err);
            return { code, message: truncate(message) };
        }
        return { code: 'unknown', message: truncate(String(err)) };
    } catch {
        return { code: 'unknown', message: 'unserialisable error' };
    }
}

const IN_ONBOARDING_KEY = 'funnel_in_onboarding';

/** Marks this tab as having been through onboarding, so the dashboard can record arrival once. */
export function markInOnboarding(): void {
    safeStorageSet(IN_ONBOARDING_KEY, '1');
}

/** True once per tab after onboarding was visited; clears the mark. */
export function consumeOnboardingMark(): boolean {
    const marked = safeStorageGet(IN_ONBOARDING_KEY) === '1';
    if (marked) safeStorageSet(IN_ONBOARDING_KEY, null);
    return marked;
}

// Paths where an uncaught error could stop a new user. Errors elsewhere are
// not funnel events and are left alone.
const FUNNEL_PATH_PREFIXES = ['/signup', '/login', '/onboarding', '/join'];

function onFunnelPath(): boolean {
    const path = currentPath();
    return FUNNEL_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

let errorCaptureInstalled = false;
const seenErrors = new Set<string>();

/** Records an uncaught error once per distinct message, at most 10 per page load. */
function trackUncaught(eventName: string, details: { code: string; message: string }, extra?: FunnelData): void {
    const key = `${eventName}|${details.code}|${details.message}`;
    if (seenErrors.has(key) || seenErrors.size >= MAX_ERROR_EVENTS_PER_LOAD) return;
    seenErrors.add(key);
    void trackFunnel(eventName, { ...details, ...extra });
}

/**
 * Records uncaught errors and unhandled promise rejections while the user is
 * on a funnel page. Call once at startup. Returns an uninstall function.
 */
export function installFunnelErrorCapture(): () => void {
    if (errorCaptureInstalled || typeof window === 'undefined') return () => {};
    errorCaptureInstalled = true;

    const onError = (event: ErrorEvent) => {
        if (!onFunnelPath()) return;
        trackUncaught('js_error', describeError(event.error ?? event.message), {
            source: event.filename,
            line: event.lineno,
        });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
        if (!onFunnelPath()) return;
        trackUncaught('js_unhandled_rejection', describeError(event.reason));
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);
        errorCaptureInstalled = false;
    };
}
