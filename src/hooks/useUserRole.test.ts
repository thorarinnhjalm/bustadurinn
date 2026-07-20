/**
 * useUserRole Hook Tests
 * Verifies the Zustand-backed role cache: same userId reuses the cached
 * result, a different userId (e.g. impersonation) triggers a fresh fetch,
 * and a failed fetch never poisons the cache with the 'regular_user' fallback.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { getDoc } from 'firebase/firestore';
import { useUserRole } from '@/hooks/useUserRole';
import { useAppStore } from '@/store/appStore';

vi.mock('@/lib/firebase', () => ({
    db: {},
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    getDoc: vi.fn(),
}));

const mockedGetDoc = vi.mocked(getDoc);

function roleDocSnapshot(systemRole: string, houseRoles: Record<string, { role: string }> = {}) {
    return {
        exists: () => true,
        data: () => ({
            system_role: systemRole,
            house_roles: houseRoles,
        }),
    } as unknown as Awaited<ReturnType<typeof getDoc>>;
}

describe('useUserRole caching', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAppStore.setState({ cachedRole: null });
    });

    it('fetches and returns the role on first mount', async () => {
        mockedGetDoc.mockResolvedValueOnce(roleDocSnapshot('super_admin'));

        const { result } = renderHook(() => useUserRole('user-1'));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.systemRole).toBe('super_admin');
        expect(result.current.error).toBeNull();
        expect(mockedGetDoc).toHaveBeenCalledTimes(1);
        expect(useAppStore.getState().cachedRole).toEqual({
            userId: 'user-1',
            systemRole: 'super_admin',
            houseRoles: {},
        });
    });

    it('does not call getDoc again on a second mount with the same userId', async () => {
        mockedGetDoc.mockResolvedValueOnce(roleDocSnapshot('support_admin'));

        const first = renderHook(() => useUserRole('user-1'));
        await waitFor(() => expect(first.result.current.loading).toBe(false));
        expect(mockedGetDoc).toHaveBeenCalledTimes(1);

        // Second mount for the same user should be served from the store cache
        const second = renderHook(() => useUserRole('user-1'));

        expect(second.result.current.systemRole).toBe('support_admin');
        expect(second.result.current.loading).toBe(false);
        expect(mockedGetDoc).toHaveBeenCalledTimes(1); // still just the one call
    });

    it('fetches again when a different userId is requested (e.g. impersonation)', async () => {
        mockedGetDoc.mockResolvedValueOnce(roleDocSnapshot('regular_user'));

        const first = renderHook(() => useUserRole('user-1'));
        await waitFor(() => expect(first.result.current.loading).toBe(false));
        expect(mockedGetDoc).toHaveBeenCalledTimes(1);

        mockedGetDoc.mockResolvedValueOnce(roleDocSnapshot('super_admin'));
        const second = renderHook(() => useUserRole('user-2'));
        await waitFor(() => expect(second.result.current.loading).toBe(false));

        expect(mockedGetDoc).toHaveBeenCalledTimes(2);
        expect(second.result.current.systemRole).toBe('super_admin');

        // The cache is a single slot keyed by userId (not a per-user map), so
        // switching back to user-1 is a cache miss against the now-cached
        // user-2 entry and correctly triggers a third fetch rather than ever
        // returning user-2's role for user-1.
        mockedGetDoc.mockResolvedValueOnce(roleDocSnapshot('regular_user'));
        const backToFirst = renderHook(() => useUserRole('user-1'));
        await waitFor(() => expect(backToFirst.result.current.loading).toBe(false));
        expect(backToFirst.result.current.systemRole).toBe('regular_user');
        expect(mockedGetDoc).toHaveBeenCalledTimes(3);
    });

    it('deduplicates concurrent fetches for the same userId', async () => {
        let resolveGetDoc!: (value: Awaited<ReturnType<typeof getDoc>>) => void;
        mockedGetDoc.mockImplementationOnce(
            () => new Promise((resolve) => {
                resolveGetDoc = resolve;
            })
        );

        // Simulate a page load where several permission-aware components
        // mount for the same user before the first fetch has resolved.
        const first = renderHook(() => useUserRole('user-1'));
        const second = renderHook(() => useUserRole('user-1'));

        expect(first.result.current.loading).toBe(true);
        expect(second.result.current.loading).toBe(true);
        expect(mockedGetDoc).toHaveBeenCalledTimes(1); // only the first mount issued a getDoc

        resolveGetDoc(roleDocSnapshot('support_admin'));

        await waitFor(() => expect(first.result.current.loading).toBe(false));
        await waitFor(() => expect(second.result.current.loading).toBe(false));

        expect(mockedGetDoc).toHaveBeenCalledTimes(1); // still just the one call
        expect(first.result.current.systemRole).toBe('support_admin');
        expect(second.result.current.systemRole).toBe('support_admin');
        expect(useAppStore.getState().cachedRole).toEqual({
            userId: 'user-1',
            systemRole: 'support_admin',
            houseRoles: {},
        });
    });

    it('returns regular_user on error and does not cache the failure', async () => {
        mockedGetDoc.mockRejectedValueOnce(new Error('boom'));

        const first = renderHook(() => useUserRole('user-1'));
        await waitFor(() => expect(first.result.current.loading).toBe(false));

        expect(first.result.current.systemRole).toBe('regular_user');
        expect(first.result.current.error).toBe('Failed to load user permissions');
        expect(useAppStore.getState().cachedRole).toBeNull();

        // Because the error was not cached, the next mount for the same
        // userId must attempt to fetch again rather than reusing a bad result.
        mockedGetDoc.mockResolvedValueOnce(roleDocSnapshot('super_admin'));
        const second = renderHook(() => useUserRole('user-1'));
        await waitFor(() => expect(second.result.current.loading).toBe(false));

        expect(mockedGetDoc).toHaveBeenCalledTimes(2);
        expect(second.result.current.systemRole).toBe('super_admin');
        expect(second.result.current.error).toBeNull();
    });
});
