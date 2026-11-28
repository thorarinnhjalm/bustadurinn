import type { House, User } from '@/types/models';

interface NoManagerNoticeProps {
    house: House | null;
    currentUser: User | null | undefined;
    canChangeMembership: boolean;
    onClaimManager: () => void;
}

/**
 * Shown on every tab when the house has no manager who is still an owner:
 * any owner may take the role.
 */
export default function NoManagerNotice({ house, currentUser, canChangeMembership, onClaimManager }: NoManagerNoticeProps) {
    if (!(house && currentUser && house.owner_ids?.includes(currentUser.uid) &&
        !(house.manager_id && house.owner_ids.includes(house.manager_id)))) {
        return null;
    }

    return (
        <div className="mb-4 bg-amber/10 border border-amber/30 text-charcoal px-4 py-3 rounded text-sm flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <span>Húsið er án umsjónarmanns</span>
            <button
                type="button"
                onClick={onClaimManager}
                disabled={!canChangeMembership}
                className="btn-primary text-sm disabled:opacity-50"
            >
                Gerast umsjónarmaður
            </button>
        </div>
    );
}
