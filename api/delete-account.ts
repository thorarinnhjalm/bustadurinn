import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuth } from './utils/firebaseAdmin.js';
import { isSuperAdminRole } from './utils/apiAuth.js';
import {
    MembershipError,
    beginMembershipRequest,
    deleteHouseCompletely,
    removeUserFromHouse,
} from './utils/membership.js';

/**
 * POST /api/delete-account  { confirm: 'EYÐA' }
 *
 * Deletes the caller's account. Auth: Firebase ID token whose sign-in
 * (auth_time) is at most 10 minutes old.
 *
 * For every house the caller belongs to: sole owner -> the house and all its
 * data are deleted; otherwise the caller is removed and, if they were manager,
 * the first remaining owner becomes manager. Then user_roles/{uid},
 * notifications of the user, users/{uid} and finally the Firebase Auth user
 * are deleted. If a house step fails nothing after it runs (the Auth user
 * stays) and 500 is returned so the user can retry; the whole flow is
 * idempotent.
 *
 * Responses: 200 { success: true }
 * Errors: { error, code }
 *   400 invalid_request
 *   401 reauth_required (sign in again, then retry)
 *   403 super_admin_forbidden
 *   500 internal
 * Storage objects under houses/{id}/ are not deleted.
 */

const REAUTH_WINDOW_SECONDS = 10 * 60;

async function deleteUserNotifications(db: FirebaseFirestore.Firestore, uid: string): Promise<void> {
    for (;;) {
        const snap = await db.collection('notifications').where('user_id', '==', uid).limit(400).get();
        if (snap.empty) return;
        const batch = db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        if (snap.size < 400) return;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const ctx = await beginMembershipRequest(req, res);
        if (!ctx) return;
        const { db, decoded } = ctx;
        const uid = decoded.uid;

        if (req.body?.confirm !== 'EYÐA') {
            return res.status(400).json({ error: 'invalid_request', code: 'invalid_request' });
        }

        const authTime = typeof decoded.auth_time === 'number' ? decoded.auth_time : 0;
        if (Math.floor(Date.now() / 1000) - authTime > REAUTH_WINDOW_SECONDS) {
            return res.status(401).json({ error: 'reauth_required', code: 'reauth_required' });
        }

        const [roleSnap, userSnap] = await Promise.all([
            db.collection('user_roles').doc(uid).get(),
            db.collection('users').doc(uid).get(),
        ]);
        if (roleSnap.exists && isSuperAdminRole(roleSnap.data())) {
            return res.status(403).json({ error: 'super_admin_forbidden', code: 'super_admin_forbidden' });
        }

        // owner_ids is authoritative; house_ids may hold stale ids.
        const houseIds = new Set<string>();
        const ownedSnap = await db.collection('houses').where('owner_ids', 'array-contains', uid).get();
        ownedSnap.docs.forEach((d) => houseIds.add(d.id));
        const listed = userSnap.data()?.house_ids;
        if (Array.isArray(listed)) {
            listed.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0 && !id.includes('/'))
                .forEach((id) => houseIds.add(id));
        }

        let failedHouses = 0;
        for (const houseId of houseIds) {
            try {
                const houseSnap = await db.collection('houses').doc(houseId).get();
                const house = houseSnap.data() || {};
                const owners: string[] = Array.isArray(house.owner_ids) ? house.owner_ids : [];
                const others = owners.filter((id) => id !== uid);

                if (houseSnap.exists && owners.includes(uid) && others.length === 0) {
                    await deleteHouseCompletely(db, houseId, owners);
                    console.info(`delete-account: uid=${uid} deleted house=${houseId}`);
                    continue;
                }

                try {
                    await removeUserFromHouse(db, houseId, uid, { newManagerId: others[0] ?? null });
                    console.info(`delete-account: uid=${uid} removed from house=${houseId}`);
                } catch (e) {
                    if (e instanceof MembershipError && e.code === 'sole_owner') {
                        // Everyone else left in the meantime.
                        await deleteHouseCompletely(db, houseId, owners);
                        console.info(`delete-account: uid=${uid} deleted house=${houseId}`);
                    } else {
                        throw e;
                    }
                }
            } catch (e) {
                failedHouses++;
                console.error(`delete-account: house step failed uid=${uid} house=${houseId}:`, e);
            }
        }

        if (failedHouses > 0) {
            return res.status(500).json({ error: 'Internal server error', code: 'internal' });
        }

        await db.collection('user_roles').doc(uid).delete();
        await deleteUserNotifications(db, uid);
        await db.collection('users').doc(uid).delete();

        const auth = getAuth();
        if (!auth) {
            console.error('delete-account: Auth not available');
            return res.status(500).json({ error: 'Internal server error', code: 'internal' });
        }
        try {
            await auth.deleteUser(uid);
        } catch (e: any) {
            if (e?.code !== 'auth/user-not-found') throw e;
        }

        console.info(`delete-account: uid=${uid} deleted (houses=${houseIds.size})`);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('delete-account failed:', error);
        return res.status(500).json({ error: 'Internal server error', code: 'internal' });
    }
}
