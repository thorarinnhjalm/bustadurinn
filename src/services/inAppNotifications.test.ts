/**
 * inAppNotifications tests. The functions POST to /api/house-notification and
 * never throw.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/firebase', () => ({
    auth: { currentUser: { getIdToken: vi.fn(() => Promise.resolve('tok')) } },
}));

import { notifyTaskAssignment, notifyShoppingListAdded } from './inAppNotifications';

const fetchMock = vi.fn();

beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('notifyTaskAssignment', () => {
    it('posts the assignees other than the actor', async () => {
        await notifyTaskAssignment({
            houseId: 'h1',
            taskId: 't1',
            taskTitle: 'Slá grasið',
            assigneeUids: ['actor', 'u2', 'u2', 'u3'],
            actorUid: 'actor',
            actorName: 'Anna',
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('/api/house-notification');
        expect(init.headers.Authorization).toBe('Bearer tok');
        expect(JSON.parse(init.body)).toEqual({
            houseId: 'h1',
            kind: 'task_assigned',
            taskId: 't1',
            taskTitle: 'Slá grasið',
            assigneeUids: ['u2', 'u3'],
        });
    });

    it('does nothing when the actor is the only assignee', async () => {
        await notifyTaskAssignment({
            houseId: 'h1', taskId: 't1', taskTitle: 'x',
            assigneeUids: ['actor'], actorUid: 'actor', actorName: 'Anna',
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('never throws when the request fails', async () => {
        fetchMock.mockRejectedValue(new Error('network'));
        await expect(notifyTaskAssignment({
            houseId: 'h1', taskId: 't1', taskTitle: 'x',
            assigneeUids: ['u2'], actorUid: 'actor', actorName: 'Anna',
        })).resolves.toBeUndefined();
    });
});

describe('notifyShoppingListAdded', () => {
    it('posts the item when there are other members', async () => {
        await notifyShoppingListAdded({
            houseId: 'h1', itemName: 'Mjólk', ownerIds: ['actor', 'u2'], actorUid: 'actor', actorName: 'Anna',
        });
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
            houseId: 'h1', kind: 'shopping_added', itemName: 'Mjólk',
        });
    });

    it('does nothing when there are no other members', async () => {
        await notifyShoppingListAdded({
            houseId: 'h1', itemName: 'Mjólk', ownerIds: ['actor'], actorUid: 'actor', actorName: 'Anna',
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('never throws on a non-ok response', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500 });
        await expect(notifyShoppingListAdded({
            houseId: 'h1', itemName: 'Mjólk', ownerIds: ['u2'], actorUid: 'actor', actorName: 'Anna',
        })).resolves.toBeUndefined();
    });
});
