/**
 * Client for the server-side membership endpoints (leave a house, remove a
 * member, hand over the manager role, delete a house, delete the account).
 * Membership lives in two documents that must change together, so the rules
 * do not allow it from the client.
 */

import { auth } from '@/lib/firebase';
import { logger } from '@/utils/logger';

export type MembershipEndpoint = 'leave-house' | 'remove-member' | 'transfer-manager' | 'delete-account';

export interface MembershipResult {
    ok: boolean;
    status: number;
    /** Machine code from the server (e.g. 'sole_owner', 'reauth_required') */
    code?: string;
}

export async function callMembershipApi(
    endpoint: MembershipEndpoint,
    body: Record<string, unknown>
): Promise<MembershipResult> {
    try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return { ok: false, status: 401, code: 'unauthenticated' };

        const response = await fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
        if (response.ok) return { ok: true, status: response.status };

        let code: string | undefined;
        try {
            const data = await response.json();
            if (typeof data?.code === 'string') code = data.code;
        } catch {
            // non-JSON error body
        }
        return { ok: false, status: response.status, code };
    } catch (error) {
        logger.error(`Membership request ${endpoint} failed:`, error);
        return { ok: false, status: 0, code: 'network' };
    }
}

/** Icelandic user-facing message for a failed membership call. */
export function membershipErrorMessage(result: MembershipResult): string {
    switch (result.code) {
        case 'sole_owner':
            return 'Þú ert eini eigandi hússins. Eyddu húsinu í staðinn.';
        case 'new_manager_required':
            return 'Veldu nýjan umsjónarmann áður en þú yfirgefur húsið.';
        case 'invalid_new_manager':
        case 'target_not_member':
            return 'Valinn aðili er ekki lengur meðeigandi í húsinu.';
        case 'not_manager':
            return 'Aðeins umsjónarmaður hússins getur gert þetta.';
        case 'not_member':
        case 'house_not_found':
            return 'Þú ert ekki lengur í þessu húsi.';
        case 'cannot_remove_self':
            return 'Þú getur ekki fjarlægt sjálfa(n) þig. Notaðu „Yfirgefa hús“.';
        case 'same_manager':
            return 'Þessi aðili er nú þegar umsjónarmaður.';
        case 'reauth_required':
            return 'Af öryggisástæðum þarftu að skrá þig út og inn aftur áður en þú eyðir aðganginum. Reyndu svo aftur innan 10 mínútna.';
        case 'super_admin_forbidden':
            return 'Ekki er hægt að eyða þessum aðgangi.';
        case 'sole_org_admin':
            return 'Þú ert eini stjórnandi stofnunar. Bættu við öðrum stjórnanda eða hafðu samband við okkur áður en þú eyðir aðganginum.';
        case 'unauthenticated':
            return 'Þú þarft að skrá þig inn aftur.';
        case 'network':
            return 'Ekkert netsamband. Reyndu aftur.';
        default:
            break;
    }
    if (result.status === 429) return 'Of margar beiðnir. Reyndu aftur síðar.';
    return 'Villa kom upp. Reyndu aftur síðar.';
}
