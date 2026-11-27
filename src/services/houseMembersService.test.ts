import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/firebase', () => ({
    auth: { currentUser: { getIdToken: vi.fn(() => Promise.resolve('tok')) } },
}));

import { getHouseMembers, getHouseMemberName, clearHouseMembersCache } from './houseMembersService';

const members = [
    { uid: 'a', name: 'Anna', email: 'a@x.is', avatar_url: null },
    { uid: 'b', name: 'Bjarni', email: 'b@x.is', avatar_url: 'http://img' },
];

function okResponse() {
    return { ok: true, status: 200, json: () => Promise.resolve({ members, managerId: 'a' }) };
}

describe('houseMembersService', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
        clearHouseMembersCache();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetches with bearer token and caches the result', async () => {
        fetchMock.mockResolvedValue(okResponse());
        expect(await getHouseMembers('h1')).toEqual(members);
        expect(await getHouseMembers('h1')).toEqual(members);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('/api/house-members');
        expect(init.headers.Authorization).toBe('Bearer tok');
        expect(JSON.parse(init.body)).toEqual({ houseId: 'h1' });
    });

    it('bypasses the cache with force', async () => {
        fetchMock.mockResolvedValue(okResponse());
        await getHouseMembers('h1');
        await getHouseMembers('h1', { force: true });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('de-duplicates concurrent calls for the same house', async () => {
        fetchMock.mockResolvedValue(okResponse());
        const [x, y] = await Promise.all([getHouseMembers('h1'), getHouseMembers('h1')]);
        expect(x).toEqual(y);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('throws on failure and does not cache it', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 403, json: () => Promise.resolve({}) });
        await expect(getHouseMembers('h1')).rejects.toThrow();
        fetchMock.mockResolvedValueOnce(okResponse());
        expect(await getHouseMembers('h1')).toEqual(members);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('getHouseMemberName returns name or fallback', () => {
        expect(getHouseMemberName(members, 'a')).toBe('Anna');
        expect(getHouseMemberName(members, 'zzz')).toBe('Meðeigandi');
        expect(getHouseMemberName(members, 'zzz', 'X')).toBe('X');
    });
});
