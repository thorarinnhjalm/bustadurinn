import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    MembershipError,
    beginMembershipRequest,
    deleteHouseCompletely,
    isValidDocId,
    removeUserFromHouse,
    sendMembershipError,
} from './utils/membership.js';

/**
 * POST /api/leave-house
 *   { houseId, newManagerId? }       leave the house
 *   { houseId, deleteHouse: true }   delete the house and all its data (manager only)
 *
 * Auth: Firebase ID token. The caller must be in owner_ids.
 * Responses: 200 { success: true, left?: true, deleted?: true, newManagerId? }
 * Errors: { error, code }
 *   400 invalid_request | new_manager_required | invalid_new_manager
 *   403 not_member | not_manager
 *   404 house_not_found
 *   409 sole_owner  (the caller is the only owner: use deleteHouse instead)
 * Storage objects under houses/{id}/ are not deleted.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const ctx = await beginMembershipRequest(req, res);
        if (!ctx) return;
        const { db, decoded } = ctx;
        const callerUid = decoded.uid;

        const { houseId, newManagerId, deleteHouse } = req.body || {};
        if (!isValidDocId(houseId)) {
            return res.status(400).json({ error: 'invalid_request', code: 'invalid_request' });
        }
        if (newManagerId !== undefined && newManagerId !== null && !isValidDocId(newManagerId)) {
            return res.status(400).json({ error: 'invalid_request', code: 'invalid_request' });
        }
        if (deleteHouse !== undefined && typeof deleteHouse !== 'boolean') {
            return res.status(400).json({ error: 'invalid_request', code: 'invalid_request' });
        }

        const houseSnap = await db.collection('houses').doc(houseId).get();
        if (!houseSnap.exists) throw new MembershipError('house_not_found');
        const house = houseSnap.data() || {};
        const owners: string[] = Array.isArray(house.owner_ids) ? house.owner_ids : [];
        if (!owners.includes(callerUid)) throw new MembershipError('not_member');

        if (deleteHouse === true) {
            if (house.manager_id !== callerUid) throw new MembershipError('not_manager');
            await deleteHouseCompletely(db, houseId, owners);
            console.info(`leave-house: uid=${callerUid} deleted house=${houseId} (owners=${owners.length})`);
            return res.status(200).json({ success: true, deleted: true });
        }

        const result = await removeUserFromHouse(db, houseId, callerUid, { newManagerId: newManagerId ?? null });
        console.info(
            `leave-house: uid=${callerUid} left house=${houseId}` +
            (result.newManagerId ? ` newManager=${result.newManagerId}` : '')
        );
        return res.status(200).json({ success: true, left: true, newManagerId: result.newManagerId });
    } catch (error) {
        sendMembershipError(res, error, 'leave-house');
    }
}
