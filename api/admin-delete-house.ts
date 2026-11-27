import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin, getAuthErrorResponse } from './utils/apiAuth.js';
import { initializeFirebaseAdmin, getDb, admin } from './utils/firebaseAdmin.js';

/**
 * POST /api/admin-delete-house  { houseId }
 * Super admin only. Deletes a house with all its subcollections and the
 * documents elsewhere that reference it. Storage objects under houses/{id}/
 * are NOT deleted.
 */

const HOUSE_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

async function deleteByQuery(db: FirebaseFirestore.Firestore, collectionName: string, field: string, value: string): Promise<number> {
    let deleted = 0;
    // Loop in pages so large result sets cannot exceed a batch limit.
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await requireAdmin(req);
    } catch (authError: any) {
        const errorResponse = getAuthErrorResponse(authError);
        return res.status(errorResponse.status).json(errorResponse.body);
    }

    const houseId = req.body?.houseId;
    if (typeof houseId !== 'string' || !HOUSE_ID_RE.test(houseId)) {
        return res.status(400).json({ error: 'Invalid houseId' });
    }

    try {
        initializeFirebaseAdmin();
        const db = getDb();
        const houseRef = db.collection('houses').doc(houseId);
        const houseSnap = await houseRef.get();
        if (!houseSnap.exists) {
            return res.status(404).json({ error: 'House not found' });
        }

        const ownerIds: string[] = Array.isArray(houseSnap.data()?.owner_ids)
            ? houseSnap.data()!.owner_ids.filter((id: unknown) => typeof id === 'string')
            : [];

        // Remove the house from members first so nobody keeps a dangling reference
        // even if a later step fails.
        let usersUpdated = 0;
        for (let i = 0; i < ownerIds.length; i += 400) {
            const batch = db.batch();
            const chunk = ownerIds.slice(i, i + 400);
            chunk.forEach((uid) => {
                batch.set(
                    db.collection('users').doc(uid),
                    { house_ids: admin.firestore.FieldValue.arrayRemove(houseId) },
                    { merge: true }
                );
            });
            await batch.commit();
            usersUpdated += chunk.length;
        }

        const guestViews = await deleteByQuery(db, 'guest_views', 'houseId', houseId);
        const invitations = await deleteByQuery(db, 'invitations', 'house_id', houseId);
        const guestbook = await deleteByQuery(db, 'guestbook', 'house_id', houseId);
        const notifications = await deleteByQuery(db, 'notifications', 'house_id', houseId);

        // House doc plus every subcollection (bookings, tasks, finance_entries, ...)
        await db.recursiveDelete(houseRef);

        return res.status(200).json({
            success: true,
            deleted: { house: 1, guest_views: guestViews, invitations, guestbook, notifications },
            usersUpdated,
            note: 'Skrár í Storage undir houses/' + houseId + '/ voru ekki fjarlægðar.',
        });
    } catch (error) {
        console.error('admin-delete-house failed:', error);
        return res.status(500).json({ error: 'Failed to delete house' });
    }
}
