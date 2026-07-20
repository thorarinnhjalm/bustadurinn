/**
 * inAppNotifications tests.
 * Covers the settings-gating logic (task_assignments / shopping_list_updates)
 * using the mocked firestore SDK (see bookingService.test.ts for the pattern).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDoc, addDoc } from 'firebase/firestore';
import { notifyTaskAssignment, notifyShoppingListAdded } from './inAppNotifications';

vi.mock('@/lib/firebase', () => ({
    db: {},
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    addDoc: vi.fn(() => Promise.resolve()),
    serverTimestamp: vi.fn(() => 'server-timestamp'),
}));

const mockedGetDoc = vi.mocked(getDoc);
const mockedAddDoc = vi.mocked(addDoc);

function userSnap(data: Record<string, any> | undefined) {
    return { data: () => data } as unknown as Awaited<ReturnType<typeof getDoc>>;
}

describe('notifyTaskAssignment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('writes a notification for each assignee other than the actor', async () => {
        mockedGetDoc.mockResolvedValue(userSnap({ notification_settings: undefined }));

        await notifyTaskAssignment({
            houseId: 'house-1',
            taskId: 'task-1',
            taskTitle: 'Mála pallinn',
            assigneeUids: ['user-a', 'user-b', 'actor-1'],
            actorUid: 'actor-1',
            actorName: 'Jón',
        });

        expect(mockedAddDoc).toHaveBeenCalledTimes(2);
        expect(mockedAddDoc).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({ user_id: 'user-a', type: 'task', house_id: 'house-1' })
        );
        expect(mockedAddDoc).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({ user_id: 'user-b', type: 'task' })
        );
    });

    it('skips a user who disabled task_assignments in-app notifications', async () => {
        mockedGetDoc.mockResolvedValue(
            userSnap({ notification_settings: { in_app: { task_assignments: false } } })
        );

        await notifyTaskAssignment({
            houseId: 'house-1',
            taskId: 'task-1',
            taskTitle: 'Mála pallinn',
            assigneeUids: ['user-a'],
            actorUid: 'actor-1',
            actorName: 'Jón',
        });

        expect(mockedAddDoc).not.toHaveBeenCalled();
    });

    it('does nothing when the only assignee is the actor themself', async () => {
        await notifyTaskAssignment({
            houseId: 'house-1',
            taskId: 'task-1',
            taskTitle: 'Mála pallinn',
            assigneeUids: ['actor-1'],
            actorUid: 'actor-1',
            actorName: 'Jón',
        });

        expect(mockedGetDoc).not.toHaveBeenCalled();
        expect(mockedAddDoc).not.toHaveBeenCalled();
    });

    it('never throws even if getDoc rejects', async () => {
        mockedGetDoc.mockRejectedValue(new Error('firestore down'));

        await expect(
            notifyTaskAssignment({
                houseId: 'house-1',
                taskId: 'task-1',
                taskTitle: 'Mála pallinn',
                assigneeUids: ['user-a'],
                actorUid: 'actor-1',
                actorName: 'Jón',
            })
        ).resolves.toBeUndefined();
    });
});

describe('notifyShoppingListAdded', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('notifies other house members but not the actor', async () => {
        mockedGetDoc.mockResolvedValue(userSnap({}));

        await notifyShoppingListAdded({
            houseId: 'house-1',
            itemName: 'Klósettpappír',
            ownerIds: ['actor-1', 'member-a', 'member-b'],
            actorUid: 'actor-1',
            actorName: 'Anna',
        });

        expect(mockedAddDoc).toHaveBeenCalledTimes(2);
        expect(mockedAddDoc).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({ user_id: 'member-a', type: 'shopping' })
        );
    });

    it('skips a member who disabled shopping_list_updates', async () => {
        mockedGetDoc.mockResolvedValue(
            userSnap({ notification_settings: { in_app: { shopping_list_updates: false } } })
        );

        await notifyShoppingListAdded({
            houseId: 'house-1',
            itemName: 'Klósettpappír',
            ownerIds: ['member-a'],
            actorUid: 'actor-1',
            actorName: 'Anna',
        });

        expect(mockedAddDoc).not.toHaveBeenCalled();
    });
});
