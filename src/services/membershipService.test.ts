import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/firebase', () => ({
    auth: { currentUser: { getIdToken: vi.fn(() => Promise.resolve('tok')) } },
}));

import { callMembershipApi, membershipErrorMessage } from './membershipService';

const fetchMock = vi.fn();
beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('callMembershipApi', () => {
    it('posts with the bearer token and reports success', async () => {
        fetchMock.mockResolvedValue({ ok: true, status: 200 });
        const r = await callMembershipApi('leave-house', { houseId: 'h1' });
        expect(r).toEqual({ ok: true, status: 200 });
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('/api/leave-house');
        expect(init.headers.Authorization).toBe('Bearer tok');
        expect(JSON.parse(init.body)).toEqual({ houseId: 'h1' });
    });

    it('surfaces the server code on failure', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 409, json: async () => ({ code: 'sole_owner' }) });
        const r = await callMembershipApi('leave-house', { houseId: 'h1' });
        expect(r).toEqual({ ok: false, status: 409, code: 'sole_owner' });
        expect(membershipErrorMessage(r)).toContain('eini eigandi');
    });

    it('maps network errors without throwing', async () => {
        fetchMock.mockRejectedValue(new Error('boom'));
        const r = await callMembershipApi('delete-account', { confirm: 'EYÐA' });
        expect(r.ok).toBe(false);
        expect(r.code).toBe('network');
    });
});

describe('membershipErrorMessage', () => {
    it('explains reauth and rate limiting in Icelandic', () => {
        expect(membershipErrorMessage({ ok: false, status: 401, code: 'reauth_required' })).toContain('skrá þig út og inn');
        expect(membershipErrorMessage({ ok: false, status: 429 })).toContain('Of margar');
    });
});
