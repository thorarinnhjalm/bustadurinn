/**
 * Funnel tracking tests
 * Every step of the new-user funnel must reach funnel_events without ever
 * breaking the flow it observes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const addDoc = vi.fn();
vi.mock('firebase/firestore', () => ({
    addDoc: (...args: unknown[]) => addDoc(...args),
    collection: (_db: unknown, name: string) => ({ name }),
    serverTimestamp: () => 'SERVER_TS',
}));

const authMock = { currentUser: null as null | { uid: string } };
vi.mock('@/lib/firebase', () => ({
    get auth() {
        return authMock;
    },
    db: {},
}));

vi.mock('@/utils/logger', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), debug: vi.fn(), info: vi.fn() },
}));

async function load() {
    vi.resetModules();
    return import('@/utils/funnel');
}

describe('trackFunnel', () => {
    beforeEach(() => {
        addDoc.mockReset();
        addDoc.mockResolvedValue({ id: 'x' });
        authMock.currentUser = null;
        sessionStorage.clear();
    });

    it('writes a signed-in event to funnel_events with session, load and path context', async () => {
        authMock.currentUser = { uid: 'u1' };
        const { trackFunnel } = await load();

        await trackFunnel('step_house', { from: 'welcome' });

        expect(addDoc).toHaveBeenCalledTimes(1);
        const [col, payload] = addDoc.mock.calls[0];
        expect(col).toEqual({ name: 'funnel_events' });
        expect(payload).toMatchObject({
            uid: 'u1',
            event_name: 'step_house',
            timestamp: 'SERVER_TS',
            path: window.location.pathname,
            data: { from: 'welcome' },
            buffered: false,
        });
        expect(typeof payload.session_id).toBe('string');
        expect(typeof payload.load_id).toBe('string');
        expect(typeof payload.client_ts).toBe('number');
    });

    it('keeps the same session id across page loads but a new load id', async () => {
        authMock.currentUser = { uid: 'u1' };
        const first = await load();
        await first.trackFunnel('a');
        const second = await load();
        await second.trackFunnel('b');

        const [p1, p2] = addDoc.mock.calls.map((c) => c[1]);
        expect(p1.session_id).toBe(p2.session_id);
        expect(p1.load_id).not.toBe(p2.load_id);
    });

    it('buffers events before sign-in and flushes them with the uid once signed in', async () => {
        const { trackFunnel, flushFunnelBuffer } = await load();

        await trackFunnel('signup_viewed');
        await trackFunnel('signup_error', { code: 'auth/weak-password' });
        expect(addDoc).not.toHaveBeenCalled();

        authMock.currentUser = { uid: 'u2' };
        await flushFunnelBuffer();

        expect(addDoc).toHaveBeenCalledTimes(2);
        const names = addDoc.mock.calls.map((c) => c[1].event_name);
        expect(names).toEqual(['signup_viewed', 'signup_error']);
        for (const [, p] of addDoc.mock.calls) {
            expect(p.uid).toBe('u2');
            expect(p.buffered).toBe(true);
        }

        addDoc.mockClear();
        await flushFunnelBuffer();
        expect(addDoc).not.toHaveBeenCalled();
    });

    it('flushes the buffer before a signed-in event so order is preserved', async () => {
        const { trackFunnel } = await load();
        await trackFunnel('signup_viewed');

        authMock.currentUser = { uid: 'u3' };
        await trackFunnel('signup_completed');

        const names = addDoc.mock.calls.map((c) => c[1].event_name);
        expect(names).toEqual(['signup_viewed', 'signup_completed']);
    });

    it('survives a reload before sign-in (buffer lives in sessionStorage)', async () => {
        const before = await load();
        await before.trackFunnel('signup_viewed');

        const after = await load();
        authMock.currentUser = { uid: 'u4' };
        await after.flushFunnelBuffer();

        expect(addDoc.mock.calls.map((c) => c[1].event_name)).toEqual(['signup_viewed']);
    });

    it('caps the pre-sign-in buffer so it cannot grow without bound', async () => {
        const { trackFunnel, flushFunnelBuffer } = await load();
        for (let i = 0; i < 100; i++) await trackFunnel(`e${i}`);

        authMock.currentUser = { uid: 'u5' };
        await flushFunnelBuffer();

        const names = addDoc.mock.calls.map((c) => c[1].event_name);
        expect(names.length).toBe(30);
        expect(names.at(-1)).toBe('e99');
    });

    it('never throws when the write fails, and keeps later events flowing', async () => {
        authMock.currentUser = { uid: 'u6' };
        addDoc.mockRejectedValueOnce(new Error('permission-denied'));
        const { trackFunnel } = await load();

        await expect(trackFunnel('a')).resolves.toBeUndefined();
        await trackFunnel('b');
        expect(addDoc).toHaveBeenCalledTimes(2);
    });

    it('never throws when sessionStorage is unavailable', async () => {
        const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('SecurityError');
        });
        const { trackFunnel } = await load();
        await expect(trackFunnel('a')).resolves.toBeUndefined();
        spy.mockRestore();
    });

    it('keeps data small and serialisable', async () => {
        authMock.currentUser = { uid: 'u7' };
        const { trackFunnel } = await load();

        await trackFunnel('x', {
            long: 'y'.repeat(5000),
            n: 3,
            ok: true,
            nothing: undefined,
            obj: { nested: 1 },
        });

        const data = addDoc.mock.calls[0][1].data;
        expect(data.long.length).toBeLessThanOrEqual(500);
        expect(data.n).toBe(3);
        expect(data.ok).toBe(true);
        expect('nothing' in data).toBe(false);
        expect(typeof data.obj).toBe('string');
    });
});

describe('describeError', () => {
    it('extracts code and message from Firebase-style and plain errors', async () => {
        const { describeError } = await load();
        expect(describeError({ code: 'auth/email-already-in-use', message: 'taken' })).toEqual({
            code: 'auth/email-already-in-use',
            message: 'taken',
        });
        expect(describeError(new Error('boom'))).toEqual({ code: 'Error', message: 'boom' });
        expect(describeError('weird')).toEqual({ code: 'unknown', message: 'weird' });
    });
});

describe('onboarding mark', () => {
    beforeEach(() => sessionStorage.clear());

    it('is consumed exactly once', async () => {
        const { markInOnboarding, consumeOnboardingMark } = await load();
        expect(consumeOnboardingMark()).toBe(false);
        markInOnboarding();
        expect(consumeOnboardingMark()).toBe(true);
        expect(consumeOnboardingMark()).toBe(false);
    });
});

describe('installFunnelErrorCapture', () => {
    beforeEach(() => {
        addDoc.mockReset();
        addDoc.mockResolvedValue({ id: 'x' });
        authMock.currentUser = { uid: 'u9' };
        sessionStorage.clear();
    });

    it('records uncaught errors on funnel pages only', async () => {
        const { installFunnelErrorCapture } = await load();
        const uninstall = installFunnelErrorCapture();

        window.history.pushState({}, '', '/onboarding');
        window.dispatchEvent(new ErrorEvent('error', { error: new TypeError('x is undefined'), message: 'x is undefined' }));
        await new Promise((r) => setTimeout(r, 0));

        window.history.pushState({}, '', '/dashboard');
        window.dispatchEvent(new ErrorEvent('error', { error: new Error('elsewhere'), message: 'elsewhere' }));
        await new Promise((r) => setTimeout(r, 0));

        const events = addDoc.mock.calls.map((c) => c[1]);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            event_name: 'js_error',
            path: '/onboarding',
            data: { code: 'TypeError', message: 'x is undefined' },
        });
        uninstall();
    });
});

describe('review hardening', () => {
    beforeEach(() => {
        addDoc.mockReset();
        addDoc.mockResolvedValue({ id: 'x' });
        authMock.currentUser = null;
        sessionStorage.clear();
        localStorage.clear();
        window.history.pushState({}, '', '/');
    });

    it('resetFunnelSession drops the buffer and starts a new session (sign-out on a shared tab)', async () => {
        authMock.currentUser = { uid: 'A' };
        const { trackFunnel, resetFunnelSession, flushFunnelBuffer } = await load();
        await trackFunnel('a1');
        const sessionA = addDoc.mock.calls[0][1].session_id;

        authMock.currentUser = null;
        await trackFunnel('buffered_while_signed_out');
        resetFunnelSession();

        authMock.currentUser = { uid: 'B' };
        await flushFunnelBuffer();
        await trackFunnel('b1');

        const names = addDoc.mock.calls.map((c) => c[1].event_name);
        expect(names).toEqual(['a1', 'b1']);
        expect(addDoc.mock.calls[1][1].session_id).not.toBe(sessionA);
    });

    it('drops buffered events older than 30 minutes at flush', async () => {
        const now = Date.now();
        const spy = vi.spyOn(Date, 'now').mockReturnValue(now - 31 * 60_000);
        const { trackFunnel, flushFunnelBuffer } = await load();
        await trackFunnel('stale');
        spy.mockReturnValue(now);
        await trackFunnel('fresh');
        authMock.currentUser = { uid: 'C' };
        await flushFunnelBuffer();
        spy.mockRestore();

        expect(addDoc.mock.calls.map((c) => c[1].event_name)).toEqual(['fresh']);
    });

    it('does not record anything while an admin is impersonating a user', async () => {
        authMock.currentUser = { uid: 'admin' };
        localStorage.setItem('admin_impersonation', '{"uid":"someone"}');
        const { trackFunnel } = await load();
        await trackFunnel('dashboard_reached');
        expect(addDoc).not.toHaveBeenCalled();
    });

    it('redacts the join code from recorded paths and data', async () => {
        authMock.currentUser = { uid: 'D' };
        window.history.pushState({}, '', '/join/house123/SECRET');
        const { trackFunnel, redactPath } = await load();
        await trackFunnel('x', { next: redactPath('/join/house123/SECRET?x=1') });

        const p = addDoc.mock.calls[0][1];
        expect(p.path).toBe('/join/house123/*');
        expect(p.data.next).toBe('/join/house123/*');
    });

    it('caps and de-duplicates uncaught error events per page load', async () => {
        authMock.currentUser = { uid: 'E' };
        const { installFunnelErrorCapture } = await load();
        const uninstall = installFunnelErrorCapture();
        window.history.pushState({}, '', '/onboarding');

        for (let i = 0; i < 50; i++) {
            window.dispatchEvent(new ErrorEvent('error', { error: new Error('same'), message: 'same' }));
        }
        for (let i = 0; i < 50; i++) {
            window.dispatchEvent(new ErrorEvent('error', { error: new Error(`e${i}`), message: `e${i}` }));
        }
        await new Promise((r) => setTimeout(r, 0));

        const messages = addDoc.mock.calls.map((c) => c[1].data.message);
        expect(messages.filter((m) => m === 'same')).toHaveLength(1);
        expect(addDoc.mock.calls.length).toBe(10);
        uninstall();
    });

    it('describeError never throws, even for hostile values', async () => {
        const { describeError } = await load();
        const hostile = Object.create(null);
        const throwing = { toString() { throw new Error('no'); } };
        expect(() => describeError(hostile)).not.toThrow();
        expect(() => describeError(throwing)).not.toThrow();
        expect(describeError(throwing).code).toBe('unknown');
    });
});
