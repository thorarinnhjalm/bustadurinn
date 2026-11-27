import { db } from '@/lib/firebase';
import {
    collection,
    getDocs,
    query,
    where,
    writeBatch,
    type DocumentReference,
} from 'firebase/firestore';
import { logger } from '@/utils/logger';

/** Max writes per batch (Firestore allows 500; keep headroom). */
const BATCH_SIZE = 450;

export interface NameUpdateResult {
    /** True only if every house was processed and every write committed. */
    ok: boolean;
    /** Number of documents whose name copy was updated. */
    updatedDocs: number;
    /** Houses where at least one query or write failed. */
    failedHouseIds: string[];
}

type PendingUpdate = { ref: DocumentReference; data: Record<string, unknown> };

/**
 * Updates the denormalised copies of a user's name in the house subcollections
 * (houses/{id}/bookings, tasks, shopping_list, finance_entries, inventory,
 * budget_plans). internal_logs are append-only under the security rules and
 * are intentionally left alone.
 *
 * Never throws for per-house failures: the result says whether it fully
 * succeeded so callers can show an honest message.
 */
export async function updateUserNameInAllCollections(
    userId: string,
    newName: string,
    houseIds: string[]
): Promise<NameUpdateResult> {
    const result: NameUpdateResult = { ok: true, updatedDocs: 0, failedHouseIds: [] };
    const uniqueHouseIds = Array.from(new Set((houseIds || []).filter(Boolean)));

    for (const houseId of uniqueHouseIds) {
        try {
            const updates = await collectHouseUpdates(houseId, userId, newName);
            result.updatedDocs += await commitInChunks(updates);
        } catch (error) {
            logger.error(`Name update failed for house ${houseId}:`, error);
            result.ok = false;
            result.failedHouseIds.push(houseId);
        }
    }

    logger.info(`Name update finished: ${result.updatedDocs} docs, ${result.failedHouseIds.length} failed houses`);
    return result;
}

/** Gather every update for one house, merged per document. */
async function collectHouseUpdates(houseId: string, userId: string, newName: string): Promise<PendingUpdate[]> {
    const pending = new Map<string, PendingUpdate>();
    const add = (ref: DocumentReference, data: Record<string, unknown>) => {
        const existing = pending.get(ref.path);
        if (existing) Object.assign(existing.data, data);
        else pending.set(ref.path, { ref, data: { ...data } });
    };
    const sub = (name: string) => collection(db, 'houses', houseId, name);

    // Queries that map "field == user" to "name field"
    const simple: Array<[string, string, string]> = [
        ['bookings', 'user_id', 'user_name'],
        ['tasks', 'created_by', 'created_by_name'],
        ['shopping_list', 'added_by', 'added_by_name'],
        ['shopping_list', 'checked_by', 'checked_by_name'],
        ['finance_entries', 'paid_by_user_id', 'paid_by_name'],
        ['inventory', 'updated_by', 'updated_by_name'],
    ];
    for (const [coll, whereField, nameField] of simple) {
        const snap = await getDocs(query(sub(coll), where(whereField, '==', userId)));
        snap.docs.forEach((d) => add(d.ref, { [nameField]: newName }));
    }

    // Tasks: assigned_to is an array of uids with a parallel assigned_to_names array
    const assigned = await getDocs(query(sub('tasks'), where('assigned_to', 'array-contains', userId)));
    assigned.docs.forEach((d) => {
        const data = d.data();
        const uids: string[] = Array.isArray(data.assigned_to) ? data.assigned_to : [];
        const names: string[] = Array.isArray(data.assigned_to_names) ? [...data.assigned_to_names] : [];
        uids.forEach((uid, i) => {
            if (uid === userId) names[i] = newName;
        });
        add(d.ref, { assigned_to_names: names });
    });

    // Budget plans: the name lives inside items[]
    const plans = await getDocs(sub('budget_plans'));
    plans.docs.forEach((d) => {
        const items: any[] = Array.isArray(d.data().items) ? d.data().items : [];
        let changed = false;
        const next = items.map((item) => {
            if (item?.assigned_owner_id === userId) {
                changed = true;
                return { ...item, assigned_owner_name: newName };
            }
            return item;
        });
        if (changed) add(d.ref, { items: next });
    });

    return Array.from(pending.values());
}

/** Commit updates in batches of at most BATCH_SIZE writes; returns how many were committed. */
async function commitInChunks(updates: PendingUpdate[]): Promise<number> {
    let committed = 0;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const chunk = updates.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(({ ref, data }) => batch.update(ref, data));
        await batch.commit();
        committed += chunk.length;
    }
    return committed;
}
