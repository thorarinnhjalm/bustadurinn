/**
 * In-App Notification Emitters (Tasks & Shopping List)
 *
 * Fire-and-forget helpers that honor the `NotificationSettings.in_app`
 * toggles (`task_assignments`, `shopping_list_updates`) that previously had
 * no reader anywhere in the app. Follows the same fetch-user-doc-then-check-
 * settings pattern as `sendBookingNotifications` in
 * src/services/bookingService.ts, but in-app only — no push or email.
 *
 * These functions never throw: every failure is caught and logged via
 * `logger.error` so a notification hiccup can never block the task/shopping
 * action that triggered it. Call sites should invoke them without awaiting
 * (or await without letting the result gate anything user-visible).
 */

import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/types/models';
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

/**
 * Notify each assignee (other than the actor) that a task was assigned to
 * them, respecting `notification_settings.in_app.task_assignments` (default
 * true when unset).
 */
export async function notifyTaskAssignment({
    houseId,
    taskId,
    taskTitle,
    assigneeUids,
    actorUid,
    actorName,
}: NotifyTaskAssignmentParams): Promise<void> {
    try {
        const targets = Array.from(new Set(assigneeUids)).filter((uid) => uid && uid !== actorUid);
        if (targets.length === 0) return;

        await Promise.all(targets.map((uid) => notifyOneTaskAssignee(uid, houseId, taskId, taskTitle, actorName)));
    } catch (error) {
        logger.error('Failed to send task assignment notifications:', error);
    }
}

async function notifyOneTaskAssignee(
    uid: string,
    houseId: string,
    taskId: string,
    taskTitle: string,
    actorName: string
): Promise<void> {
    try {
        const userSnap = await getDoc(doc(db, 'users', uid));
        const userData = userSnap.data() as User | undefined;
        if (!userData) return;

        const inAppEnabled = userData.notification_settings?.in_app?.task_assignments ?? true;
        if (!inAppEnabled) return;

        await addDoc(collection(db, 'notifications'), {
            user_id: uid,
            house_id: houseId,
            title: 'Nýtt verkefni á þig',
            message: `${actorName} úthlutaði þér verkefninu „${taskTitle}“`,
            type: 'task',
            read: false,
            data: { task_id: taskId },
            created_at: serverTimestamp(),
        });
    } catch (error) {
        logger.error(`Failed to notify user ${uid} of task assignment:`, error);
    }
}

interface NotifyShoppingListAddedParams {
    houseId: string;
    itemName: string;
    /** House owner_ids (all members) — the other members to notify. */
    ownerIds: string[];
    /** UID of whoever added the item — never notified about their own action. */
    actorUid: string;
    actorName: string;
}

/**
 * Notify other house members that an item was added to the shopping list,
 * respecting `notification_settings.in_app.shopping_list_updates` (default
 * true when unset).
 */
export async function notifyShoppingListAdded({
    houseId,
    itemName,
    ownerIds,
    actorUid,
    actorName,
}: NotifyShoppingListAddedParams): Promise<void> {
    try {
        const targets = Array.from(new Set(ownerIds)).filter((uid) => uid && uid !== actorUid);
        if (targets.length === 0) return;

        await Promise.all(targets.map((uid) => notifyOneShoppingMember(uid, houseId, itemName, actorName)));
    } catch (error) {
        logger.error('Failed to send shopping list notifications:', error);
    }
}

async function notifyOneShoppingMember(
    uid: string,
    houseId: string,
    itemName: string,
    actorName: string
): Promise<void> {
    try {
        const userSnap = await getDoc(doc(db, 'users', uid));
        const userData = userSnap.data() as User | undefined;
        if (!userData) return;

        const inAppEnabled = userData.notification_settings?.in_app?.shopping_list_updates ?? true;
        if (!inAppEnabled) return;

        await addDoc(collection(db, 'notifications'), {
            user_id: uid,
            house_id: houseId,
            title: 'Ný vara á innkaupalistann',
            message: `${actorName} bætti „${itemName}“ á innkaupalistann`,
            type: 'shopping',
            read: false,
            created_at: serverTimestamp(),
        });
    } catch (error) {
        logger.error(`Failed to notify user ${uid} of shopping list update:`, error);
    }
}
