import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    MembershipError,
    beginMembershipRequest,
    isValidDocId,
    removeUserFromHouse,
    sendMembershipError,
} from './utils/membership.js';

/**
 * POST /api/remove-member  { houseId, memberId }
 *
 * Auth: Firebase ID token. Only the house manager. The manager cannot remove
 * themselves (use /api/leave-house).
 * Responses: 200 { success: true, removed: boolean }
 * Errors: { error, code }
 *   400 invalid_request | cannot_remove_self
 *   403 not_member | not_manager
 *   404 house_not_found | target_not_member
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const ctx = await beginMembershipRequest(req, res);
        if (!ctx) return;
        const { db, decoded } = ctx;
        const callerUid = decoded.uid;

        const { houseId, memberId } = req.body || {};
        if (!isValidDocId(houseId) || !isValidDocId(memberId)) {
            return res.status(400).json({ error: 'invalid_request', code: 'invalid_request' });
        }
        if (memberId === callerUid) throw new MembershipError('cannot_remove_self');

        const houseSnap = await db.collection('houses').doc(houseId).get();
        if (!houseSnap.exists) throw new MembershipError('house_not_found');
        const house = houseSnap.data() || {};
        const owners: string[] = Array.isArray(house.owner_ids) ? house.owner_ids : [];
        if (!owners.includes(callerUid)) throw new MembershipError('not_member');
        if (house.manager_id !== callerUid) throw new MembershipError('not_manager');
        if (!owners.includes(memberId)) throw new MembershipError('target_not_member');

        // The target is never the manager (the caller is), so no new manager is needed.
        const result = await removeUserFromHouse(db, houseId, memberId);
        console.info(`remove-member: uid=${callerUid} removed member=${memberId} from house=${houseId}`);
        return res.status(200).json({ success: true, removed: result.removed });
    } catch (error) {
        sendMembershipError(res, error, 'remove-member');
    }
}
