import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    beginMembershipRequest,
    isValidDocId,
    sendMembershipError,
    transferManager,
} from './utils/membership.js';

/**
 * POST /api/transfer-manager  { houseId, newManagerId }
 *
 * Auth: Firebase ID token. Only the current manager; the target must be an owner.
 * Responses: 200 { success: true }
 * Errors: { error, code }
 *   400 invalid_request | same_manager
 *   403 not_member | not_manager
 *   404 house_not_found | target_not_member
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const ctx = await beginMembershipRequest(req, res);
        if (!ctx) return;
        const { db, decoded } = ctx;
        const callerUid = decoded.uid;

        const { houseId, newManagerId } = req.body || {};
        if (!isValidDocId(houseId) || !isValidDocId(newManagerId)) {
            return res.status(400).json({ error: 'invalid_request', code: 'invalid_request' });
        }

        await transferManager(db, houseId, callerUid, newManagerId);
        console.info(`transfer-manager: uid=${callerUid} house=${houseId} newManager=${newManagerId}`);
        return res.status(200).json({ success: true });
    } catch (error) {
        sendMembershipError(res, error, 'transfer-manager');
    }
}
