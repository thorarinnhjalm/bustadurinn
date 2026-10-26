/**
 * funnelService tests: reading one user's funnel and marking tabs/reloads.
 * Uses the mocked firestore SDK (see inAppNotifications.test.ts for the pattern).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDocs, where } from 'firebase/firestore';
import { annotateFunnelEvents, getFunnelEventsForUser } from './funnelService';
import type { FunnelEvent } from './funnelService';

vi.mock('@/lib/firebase', () => ({
    db: {},
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(),
}));

const mockedGetDocs = vi.mocked(getDocs);

function event(name: string, at: number, session: string, load: string): FunnelEvent {
    return {
        id: name,
        event_name: name,
        at: new Date(at),
        session_id: session,
        load_id: load,
        path: '/onboarding',
        env: 'production',
        ua: '',
        buffered: false,
        data: {},
    };
}

describe('annotateFunnelEvents', () => {
    it('sorts by browser time and marks reloads and new tabs', () => {
        const result = annotateFunnelEvents([
            event('step_house', 2000, 's1', 'l1'),
            event('signup_viewed', 1000, 's1', 'l1'),
            event('onboarding_mounted', 3000, 's1', 'l2'),
            event('login_completed', 4000, 's2', 'l3'),
        ]);

        expect(result.map((e) => e.event_name)).toEqual([
            'signup_viewed', 'step_house', 'onboarding_mounted', 'login_completed',
        ]);
        expect(result.map((e) => [e.reload, e.newSession])).toEqual([
            [false, false],
            [false, false],
            [true, false],
            [false, true],
        ]);
    });
});

describe('getFunnelEventsForUser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('queries by uid and falls back to the server timestamp', async () => {
        mockedGetDocs.mockResolvedValue({
            docs: [
                {
                    id: 'b',
                    data: () => ({
                        event_name: 'onboarding_back',
                        client_ts: 5000,
                        session_id: 's1',
                        load_id: 'l1',
                        data: { from: 'house' },
                    }),
                },
                {
                    id: 'a',
                    data: () => ({
                        event_name: 'signup_completed',
                        timestamp: { toDate: () => new Date(1000) },
                        session_id: 's1',
                        load_id: 'l1',
                    }),
                },
            ],
        } as any);

        const result = await getFunnelEventsForUser('user-1');

        expect(where).toHaveBeenCalledWith('uid', '==', 'user-1');
        expect(result.map((e) => e.id)).toEqual(['a', 'b']);
        expect(result[0].data).toEqual({});
        expect(result[1].data).toEqual({ from: 'house' });
    });

    it('turns malformed documents into plain text instead of crashing', async () => {
        mockedGetDocs.mockResolvedValue({
            docs: [
                {
                    id: 'x',
                    data: () => ({
                        event_name: { nested: true },
                        data: { obj: { toString: 'a' }, n: 3, missing: null },
                    }),
                },
            ],
        } as any);

        const [result] = await getFunnelEventsForUser('user-1');

        expect(result.event_name).toBe('{"nested":true}');
        expect(result.at).toBeNull();
        expect(result.data).toEqual({ obj: '{"toString":"a"}', n: 3, missing: null });
        expect([result.reload, result.newSession]).toEqual([false, false]);
    });
});
