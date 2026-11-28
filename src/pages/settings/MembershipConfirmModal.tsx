import { useId } from 'react';
import Modal from '@/components/ui/Modal';
import type { House, User } from '@/types/models';
import type { MembershipController } from './useMembershipActions';

interface MembershipConfirmModalProps {
    membership: MembershipController;
    house: House | null;
    members: User[];
    currentUserId: string | undefined;
    isManager: boolean;
}

/** Confirmation modal for leaving / removing / deleting a house and for deleting the account. */
export default function MembershipConfirmModal({
    membership,
    house,
    members,
    currentUserId,
    isManager,
}: MembershipConfirmModalProps) {
    const baseId = useId();
    const {
        membershipAction,
        membershipText,
        setMembershipText,
        newManagerChoice,
        setNewManagerChoice,
        membershipBusy,
        membershipModalError,
        reauthPasswordNeeded,
        reauthPassword,
        setReauthPassword,
        closeMembershipAction,
        handleConfirmMembershipAction,
    } = membership;

    return (
        <>
            {/* Membership action modal (leave / remove / delete house / delete account) */}
            {
                membershipAction && (() => {
                    const type = membershipAction.type;
                    const others = members.filter((m) => m.uid !== currentUserId);
                    const needsNewManager = type === 'leave' && isManager && (house?.owner_ids.length || 0) > 1;
                    const needsTyped = type === 'delete_house' || type === 'delete_account';
                    const title =
                        type === 'leave' ? 'Yfirgefa hús?'
                        : type === 'remove' ? 'Fjarlægja meðeiganda?'
                        : type === 'delete_house' ? 'Eyða húsi?'
                        : 'Eyða aðgangi?';
                    const confirmLabel =
                        type === 'leave' ? 'Yfirgefa hús'
                        : type === 'remove' ? 'Fjarlægja'
                        : type === 'delete_house' ? 'Eyða húsi varanlega'
                        : 'Eyða aðgangi varanlega';
                    const canConfirm =
                        !membershipBusy &&
                        (!needsNewManager || !!newManagerChoice) &&
                        (!needsTyped || membershipText === 'EYÐA');
                    return (
                        <Modal
                            open
                            onClose={closeMembershipAction}
                            title={title}
                            size="md"
                            dismissible={!membershipBusy}
                            footer={
                                <>
                                    <button
                                        type="button"
                                        onClick={closeMembershipAction}
                                        disabled={membershipBusy}
                                        className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Hætta við
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmMembershipAction}
                                        disabled={!canConfirm}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    >
                                        {membershipBusy ? 'Augnablik...' : confirmLabel}
                                    </button>
                                </>
                            }
                        >
                            <div>
                                {type === 'leave' && (
                                    <p className="text-stone-600 mb-4 text-sm leading-relaxed">
                                        Þú missir aðgang að húsinu <strong>{house?.name}</strong>. Aðrir meðeigendur halda áfram að hafa aðgang.
                                    </p>
                                )}
                                {type === 'remove' && (
                                    <p className="text-stone-600 mb-4 text-sm leading-relaxed">
                                        <strong>{membershipAction.member.name || membershipAction.member.email}</strong> missir aðgang að húsinu <strong>{house?.name}</strong>.
                                    </p>
                                )}
                                {type === 'delete_house' && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-800 leading-relaxed">
                                        <strong>Aðvörun:</strong> Húsinu <strong>{house?.name}</strong> er eytt varanlega fyrir alla meðeigendur
                                        ({house?.owner_ids.length || 1}). Allar bókanir, fjármál, verkefni, innkaupalistar, gestabók og gestahlekkir
                                        eyðast og ekki er hægt að afturkalla það.
                                    </div>
                                )}
                                {type === 'delete_account' && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-800 leading-relaxed">
                                        <strong>Aðvörun:</strong> Aðgangnum þínum er eytt varanlega og ekki er hægt að afturkalla það.
                                        Hús þar sem þú ert eini eigandinn eyðast með öllum gögnum (bókanir, fjármál, verkefni og gestahlekkir).
                                        Í öðrum húsum ert þú fjarlægð(ur).
                                    </div>
                                )}

                                {needsNewManager && (
                                    <div className="mb-4">
                                        <label className="label text-xs uppercase text-grey-mid" htmlFor="new-manager-select">
                                            Þú ert umsjónarmaður. Veldu nýjan umsjónarmann:
                                        </label>
                                        <select
                                            id="new-manager-select"
                                            className="input w-full"
                                            value={newManagerChoice}
                                            onChange={(e) => setNewManagerChoice(e.target.value)}
                                        >
                                            <option value="">Veldu meðeiganda...</option>
                                            {others.map((m) => (
                                                <option key={m.uid} value={m.uid}>{m.name || m.email}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {needsTyped && (
                                    <>
                                        <label htmlFor={`${baseId}-confirm-text`} className="block text-xs text-stone-500 mb-2 uppercase font-bold tracking-wide">
                                            Skrifaðu &quot;EYÐA&quot; til að staðfesta:
                                        </label>
                                        <input
                                            id={`${baseId}-confirm-text`}
                                            type="text"
                                            className="w-full border border-stone-300 rounded-md px-3 py-2 mb-4 font-mono text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 uppercase"
                                            placeholder="EYÐA"
                                            value={membershipText}
                                            onChange={(e) => setMembershipText(e.target.value.toUpperCase())}
                                            autoComplete="off"
                                        />
                                    </>
                                )}

                                {type === 'delete_account' && reauthPasswordNeeded && (
                                    <div className="mb-4">
                                        <label className="label text-xs uppercase text-grey-mid" htmlFor="reauth-password">
                                            Lykilorð
                                        </label>
                                        <input
                                            id="reauth-password"
                                            type="password"
                                            className="input w-full"
                                            value={reauthPassword}
                                            onChange={(e) => setReauthPassword(e.target.value)}
                                            autoComplete="current-password"
                                        />
                                    </div>
                                )}

                                {membershipModalError && (
                                    <div role="alert" className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                                        {membershipModalError}
                                    </div>
                                )}
                            </div>
                        </Modal>
                    );
                })()
            }
        </>
    );
}
