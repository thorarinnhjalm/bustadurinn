/**
 * House membership helpers (server side).
 *
 * A membership is stored in two places that must change together:
 *   houses/{id}.owner_ids  and  users/{uid}.house_ids
 * Firestore rules rightly do not let a client write both, so every change
 * goes through these helpers (api/leave-house, api/remove-member,
 * api/transfer-manager, api/delete-account).
 *
 * Storage objects under houses/{id}/ are NOT deleted by deleteHouseCompletely.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { admin, initializeFirebaseAdmin, getDb } from './firebaseAdmin.js';
import { requireAuth, getAuthErrorResponse } from './apiAuth.js';
import { checkRateLimit, getMembershipChangeRateLimit, tryGetRateLimit } from './ratelimit.js';

type Db = FirebaseFirestore.Firestore;

export type MembershipErrorCode =
    | 'house_not_found'
    | 'not_member'
    | 'not_manager'
    | 'sole_owner'
    | 'new_manager_required'
    | 'invalid_new_manager'
    | 'target_not_member'
    | 'cannot_remove_self'
    | 'same_manager';

const STATUS_BY_CODE: Record<MembershipErrorCode, number> = {
    house_not_found: 404,
    not_member: 403,
    not_manager: 403,
    sole_owner: 409,
    new_manager_required: 400,
    invalid_new_manager: 400,
    target_not_member: 404,
    cannot_remove_self: 400,
    same_manager: 400,
};

/** Expected, user-actionable failure. `code` is safe to send to the client. */
export class MembershipError extends Error {
    readonly code: MembershipErrorCode;
    readonly status: number;
    constructor(code: MembershipErrorCode) {
        super(code);
        this.name = 'MembershipError';
        this.code = code;
        this.status = STATUS_BY_CODE[code];
    }
}

/** Firestore document ids as used in this app: non-empty, no slashes. */
export function isValidDocId(value: unknown): value is string {
    return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

function ownerIdsOf(data: FirebaseFirestore.DocumentData | undefined): string[] {
    return Array.isArray(data?.owner_ids)
        ? data!.owner_ids.filter((id: unknown): id is string => typeof id === 'string')
        : [];
}

/**
 * Remove `uid` from a house in one transaction (owner_ids, finance_viewer_ids,
 * the user's house_ids). Idempotent: if the user is no longer an owner only the
 * user's house_ids entry is cleaned up and `removed` is false.
 *
 * If `uid` is the manager and other owners remain, `newManagerId` must be one
 * of them and is set in the same transaction. If nobody would remain,
 * throws MembershipError('sole_owner'): the caller must delete the house.
 */
export async function removeUserFromHouse(
    db: Db,
    houseId: string,
    uid: string,
    options: { newManagerId?: string | null } = {}
): Promise<{ removed: boolean; newManagerId: string | null }> {
    const houseRef = db.collection('houses').doc(houseId);
    const userRef = db.collection('users').doc(uid);
    const FieldValue = admin.firestore.FieldValue;

    return db.runTransaction(async (t) => {
        const [houseSnap, userSnap] = await Promise.all([t.get(houseRef), t.get(userRef)]);

        if (!houseSnap.exists) {
            // Stale reference: just drop it from the user.
            if (userSnap.exists) t.update(userRef, { house_ids: FieldValue.arrayRemove(houseId) });
            return { removed: false, newManagerId: null };
        }

        const house = houseSnap.data() || {};
        const owners = ownerIdsOf(house);
        const isOwner = owners.includes(uid);

        if (!isOwner) {
            if (userSnap.exists) t.update(userRef, { house_ids: FieldValue.arrayRemove(houseId) });
            return { removed: false, newManagerId: null };
        }

        const remaining = owners.filter((id) => id !== uid);
        if (remaining.length === 0) {
            throw new MembershipError('sole_owner');
        }

        const houseUpdate: Record<string, unknown> = {
            owner_ids: FieldValue.arrayRemove(uid),
            finance_viewer_ids: FieldValue.arrayRemove(uid),
            updated_at: FieldValue.serverTimestamp(),
        };

        let newManagerId: string | null = null;
        if (house.manager_id === uid) {
            const candidate = options.newManagerId;
            if (!candidate) throw new MembershipError('new_manager_required');
            if (!remaining.includes(candidate)) throw new MembershipError('invalid_new_manager');
            houseUpdate.manager_id = candidate;
            newManagerId = candidate;
        }

        t.update(houseRef, houseUpdate);
        if (userSnap.exists) t.update(userRef, { house_ids: FieldValue.arrayRemove(houseId) });
        return { removed: true, newManagerId };
    });
}

/** True when the house has a manager who is also one of its owners. */
export function hasValidManager(house: FirebaseFirestore.DocumentData | undefined): boolean {
    const manager = house?.manager_id;
    return typeof manager === 'string' && manager.length > 0 && ownerIdsOf(house).includes(manager);
}

/**
 * Hand the manager role from `callerUid` to `newManagerId` (both must be owners).
 * Recovery: when the house has no valid manager (missing/null/empty manager_id,
 * or one that is not an owner), any current owner may set the manager, to
 * themselves or to another owner.
 */
export async function transferManager(
    db: Db,
    houseId: string,
    callerUid: string,
    newManagerId: string
): Promise<void> {
    const houseRef = db.collection('houses').doc(houseId);
    await db.runTransaction(async (t) => {
        const snap = await t.get(houseRef);
        if (!snap.exists) throw new MembershipError('house_not_found');
        const house = snap.data() || {};
        const owners = ownerIdsOf(house);
        if (!owners.includes(callerUid)) throw new MembershipError('not_member');
        const managerless = !hasValidManager(house);
        if (!managerless && house.manager_id !== callerUid) throw new MembershipError('not_manager');
        if (!managerless && newManagerId === callerUid) throw new MembershipError('same_manager');
        if (!owners.includes(newManagerId)) throw new MembershipError('target_not_member');
        t.update(houseRef, {
            manager_id: newManagerId,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
}

/** Delete every document matching `field == value`, in pages of 400. */
async function deleteByQuery(db: Db, collectionName: string, field: string, value: string): Promise<number> {
    let deleted = 0;
    for (;;) {
        const snap = await db.collection(collectionName).where(field, '==', value).limit(400).get();
        if (snap.empty) break;
        const batch = db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        deleted += snap.size;
        if (snap.size < 400) break;
    }
    return deleted;
}

/**
 * Permanently delete a house: the doc and all its subcollections (bookings,
 * tasks, finance_entries, ...), guest_views, invitations, guestbook entries and
 * house notifications, then drop the house from every former owner's house_ids.
 *
 * Order matters: public guest_views (they hold the wifi password) and
 * invitations go first so a failure cannot leave a live link to a deleted
 * house; the house itself goes before the (harmless if stale) user cleanup.
 * Throws on failure; safe to retry while the house doc still exists.
 * Storage objects under houses/{houseId}/ are not removed.
 */
export async function deleteHouseCompletely(
    db: Db,
    houseId: string,
    knownOwnerIds: string[] = []
): Promise<{ guestViews: number; invitations: number; guestbook: number; notifications: number }> {
    const houseRef = db.collection('houses').doc(houseId);
    const houseSnap = await houseRef.get();
    const ownerIds = Array.from(new Set([...ownerIdsOf(houseSnap.data()), ...knownOwnerIds]));

    const guestViews = await deleteByQuery(db, 'guest_views', 'houseId', houseId);
    const invitations = await deleteByQuery(db, 'invitations', 'house_id', houseId);
    const guestbook = await deleteByQuery(db, 'guestbook', 'house_id', houseId);
    const notifications = await deleteByQuery(db, 'notifications', 'house_id', houseId);

    await db.recursiveDelete(houseRef);

    for (let i = 0; i < ownerIds.length; i += 400) {
        const batch = db.batch();
        const chunk = ownerIds.slice(i, i + 400);
        const userSnaps = await db.getAll(...chunk.map((uid) => db.collection('users').doc(uid)));
        userSnaps.forEach((s) => {
            if (s.exists) batch.update(s.ref, { house_ids: admin.firestore.FieldValue.arrayRemove(houseId) });
        });
        await batch.commit();
    }

    return { guestViews, invitations, guestbook, notifications };
}

/**
 * Detach a user that is being deleted from every house they own: the house is
 * deleted when they are the sole owner, otherwise they are removed and, if
 * they were the manager, the first remaining owner becomes manager.
 * Safe to call after users/{uid} is gone. Throws on the first failure.
 */
export async function detachUserFromAllHouses(
    db: Db,
    uid: string
): Promise<{ removedFrom: number; deleted: number }> {
    const snap = await db.collection('houses').where('owner_ids', 'array-contains', uid).get();
    let removedFrom = 0;
    let deleted = 0;
    for (const houseDoc of snap.docs) {
        const owners = ownerIdsOf(houseDoc.data());
        const remaining = owners.filter((id) => id !== uid);
        if (remaining.length === 0) {
            await deleteHouseCompletely(db, houseDoc.id, owners);
            deleted++;
            continue;
        }
        try {
            await removeUserFromHouse(db, houseDoc.id, uid, { newManagerId: remaining[0] });
            removedFrom++;
        } catch (e) {
            if (e instanceof MembershipError && e.code === 'sole_owner') {
                await deleteHouseCompletely(db, houseDoc.id, owners);
                deleted++;
            } else {
                throw e;
            }
        }
    }
    return { removedFrom, deleted };
}

/**
 * Shared preamble of the membership endpoints: POST only, Firebase ID token,
 * per-uid rate limit (fail open: the caller is already authenticated), Firestore.
 * Writes the HTTP response itself and returns null when the request must stop.
 */
export async function beginMembershipRequest(
    req: VercelRequest,
    res: VercelResponse
): Promise<{ db: Db; decoded: DecodedIdToken } | null> {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return null;
    }

    initializeFirebaseAdmin();

    let decoded: DecodedIdToken;
    try {
        decoded = await requireAuth(req);
    } catch (authError: any) {
        const errorResponse = getAuthErrorResponse(authError);
        res.status(errorResponse.status).json(errorResponse.body);
        return null;
    }

    const limiter = tryGetRateLimit(getMembershipChangeRateLimit);
    if (limiter) {
        const rl = await checkRateLimit(limiter, decoded.uid, { failOpen: true });
        if (!rl.allowed) {
            res.status(rl.error.status).json(rl.error.body);
            return null;
        }
    }

    const db = getDb();
    if (!db) {
        console.error('membership: Firestore not available');
        res.status(500).json({ error: 'Internal server error' });
        return null;
    }
    return { db, decoded };
}

/** Map an error thrown by the helpers to an HTTP response (generic body for unexpected errors). */
export function sendMembershipError(res: VercelResponse, error: unknown, context: string): void {
    if (error instanceof MembershipError) {
        res.status(error.status).json({ error: error.code, code: error.code });
        return;
    }
    console.error(`${context} failed:`, error);
    res.status(500).json({ error: 'Internal server error' });
}
