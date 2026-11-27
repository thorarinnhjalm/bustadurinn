/**
 * In-App Notification Emitters (Tasks & Shopping List)
 *
 * Thin client wrappers around `/api/house-notification`. The server reads the
 * recipients' user docs (clients cannot: Firestore rules only allow reading
 * your own `users/{uid}`), applies the `notification_settings.in_app` gating,
 * writes the `notifications` docs and sends push.
 *
 * These functions never throw: every failure is caught and logged so a
 * notification hiccup can never block the task/shopping action that triggered
 * it. `actorUid` / `actorName` are accepted for call-site compatibility; the
 * server derives the actor from the auth token and the caller's profile.
 */

import { auth } from '@/lib/firebase';
import { logger } from '@/utils/logger';

interface NotifyTaskAssignmentParams {
    houseId: string;
    taskId: string;
    taskTitle: string;
    /** UIDs of everyone the task was assigned to. */
    assigneeUids: string[];
    /** UID of the user who created/assigned the task — never notified about their own action. */
    actorUid: string;
    actorName: string;
}

interface NotifyShoppingListAddedParams {
    houseId: string;
    itemName: string;
    /** House owner_ids (all members). Informational: the server uses the house's own list. */
    ownerIds: string[];
    /** UID of whoever added the item — never notified about their own action. */
    actorUid: string;
    actorName: string;
}

async function postHouseNotification(body: Record<string, unknown>): Promise<void> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
        logger.warn('inAppNotifications: no signed-in user, skipping notification');
        return;
    }
    const response = await fetch('/api/house-notification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        logger.warn(`inAppNotifications: server responded with status ${response.status}`);
    }
}

/**
 * Notify each assignee (other than the actor) that a task was assigned to them.
 */
export async function notifyTaskAssignment({
    houseId,
    taskId,
    taskTitle,
    assigneeUids,
    actorUid,
}: NotifyTaskAssignmentParams): Promise<void> {
    try {
        const targets = Array.from(new Set(assigneeUids)).filter((uid) => uid && uid !== actorUid);
        if (targets.length === 0) return;

        await postHouseNotification({
            houseId,
            kind: 'task_assigned',
            taskId,
            taskTitle: String(taskTitle ?? '').slice(0, 200),
            assigneeUids: targets,
        });
    } catch (error) {
        logger.warn('Failed to send task assignment notifications:', error);
    }
}

/**
 * Notify other house members that an item was added to the shopping list.
 */
export async function notifyShoppingListAdded({
    houseId,
    itemName,
    ownerIds,
    actorUid,
}: NotifyShoppingListAddedParams): Promise<void> {
    try {
        const targets = Array.from(new Set(ownerIds)).filter((uid) => uid && uid !== actorUid);
        if (targets.length === 0) return;

        await postHouseNotification({
            houseId,
            kind: 'shopping_added',
            itemName: String(itemName ?? '').slice(0, 200),
        });
    } catch (error) {
        logger.warn('Failed to send shopping list notifications:', error);
    }
}
