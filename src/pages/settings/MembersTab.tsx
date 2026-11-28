import { useState, useEffect, useId } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Users } from 'lucide-react';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { House, User } from '@/types/models';
import { generateInviteCode } from '@/utils/secureToken';
import { logger } from '@/utils/logger';
import type { MembershipAction, SetHouseForm, SettingsFeedback } from './types';

interface MembersTabProps extends SettingsFeedback {
    house: House;
    setHouse: Dispatch<SetStateAction<House | null>>;
    setHouseForm: SetHouseForm;
    currentUser: User | null | undefined;
    isManager: boolean;
    canChangeMembership: boolean;
    members: User[];
    loadingMembers: boolean;
    membersError: string;
    reloadMembers: () => void;
    onTransferManager: (member: User) => void;
    onOpenMembershipAction: (action: MembershipAction) => void;
}

/** Meðeigendur tab: member list, pending invitations, invite form / link and the leave / delete-house buttons. */
export default function MembersTab({
    house,
    setHouse,
    setHouseForm,
    currentUser,
    isManager,
    canChangeMembership,
    members,
    loadingMembers,
    membersError,
    reloadMembers,
    onTransferManager,
    onOpenMembershipAction,
    setSuccess,
    setError,
}: MembersTabProps) {
    const baseId = useId();

    const [invitations, setInvitations] = useState<any[]>([]);

    // Invite State
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [invitationsReloadKey, setInvitationsReloadKey] = useState(0);

    // Pending invitations load on their own so a failure in one list never hides the other
    useEffect(() => {
        let cancelled = false;
        const loadInvitations = async () => {
            try {
                const qInvites = query(collection(db, 'invitations'), where('house_id', '==', house.id));
                const inviteSnap = await getDocs(qInvites);
                if (!cancelled) setInvitations(inviteSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                logger.error('Error fetching invitations', err);
            }
        };
        loadInvitations();
        return () => { cancelled = true; };
    }, [house.id, invitationsReloadKey]);

    const handleRevokeInvite = async (inviteId: string) => {
        if (!confirm('Ertu viss um að þú viljir afturkalla þetta boð?')) return;
        try {
            await deleteDoc(doc(db, 'invitations', inviteId));
            setInvitations(prev => prev.filter(i => i.id !== inviteId));
            setSuccess('Boð afturkallað.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            logger.error('Error revoking invite:', e);
            setError('Gat ekki afturkallað boð.');
        }
    };

    const handleSendInvite = async () => {
        if (!inviteEmail.trim() || !house || !currentUser) return;
        setInviteLoading(true);
        setError('');
        try {
            // Get Firebase auth token for API authentication
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const resp = await fetch('/api/invite-member', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`  // 🔒 Auth token required
                },
                body: JSON.stringify({
                    email: inviteEmail.trim(),
                    houseId: house.id,
                    houseName: house.name,
                    senderName: currentUser.name || 'Notandi',
                    senderUid: currentUser.uid
                })
            });

            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                logger.warn('Invite request rejected:', resp.status, data?.error);
                const serverError = typeof data?.error === 'string' ? data.error : '';
                if (resp.status === 429) setError('Of mörg boð send. Reyndu aftur síðar.');
                else if (/already a member/i.test(serverError)) setError('Þessi aðili er þegar í húsinu.');
                else if (/already pending/i.test(serverError)) setError('Boð hefur þegar verið sent á þetta netfang.');
                else if (resp.status === 403) setError('Þú hefur ekki heimild til að bjóða í þetta hús.');
                else setError('Gat ekki sent boð. Athugaðu netfangið og reyndu aftur.');
                return;
            }

            setSuccess('Boð sent!');
            setInviteEmail('');
            setTimeout(() => setSuccess(''), 3000);
            if (house) setInvitationsReloadKey((k) => k + 1);
        } catch (err) {
            logger.error('Invite error:', err);
            setError('Gat ekki sent boð. Reyndu aftur.');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleGenerateInvite = async () => {
        if (!house || !isManager) return;
        const newCode = generateInviteCode();
        try {
            await updateDoc(doc(db, 'houses', house.id), {
                invite_code: newCode
            });
            setHouseForm(prev => ({ ...prev, invite_code: newCode }));
            setHouse(prev => prev ? { ...prev, invite_code: newCode } : null);
            setSuccess('Nýr boðshlekkur búinn til!');
        } catch (err) {
            logger.error('Error generating invite code:', err);
            setError('Gat ekki búið til boðshlekk.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-amber-ink" aria-hidden="true" />
                    <h2 className="text-xl font-serif">Meðeigendur</h2>
                </div>
            </div>

            <div className="space-y-4">
                {/* Members List */}
                {loadingMembers ? (
                    <div role="status" className="text-center py-8">
                        <div aria-hidden="true" className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-grey-mid">Hleð meðeigendum...</p>
                    </div>
                ) : membersError ? (
                    <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-lg text-center">
                        {membersError}
                        <button
                            type="button"
                            onClick={reloadMembers}
                            className="block mx-auto mt-2 text-sm underline hover:text-red-800"
                        >
                            Reyna aftur
                        </button>
                    </div>
                ) : members.length === 0 ? (
                    <div className="text-center text-grey-mid py-4">Engir meðeigendur fundust.</div>
                ) : (
                    members.map(member => (
                        <div key={member.uid} className="flex items-center justify-between p-4 border rounded-lg bg-white mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-lg ${member.uid === currentUser?.uid ? 'bg-charcoal text-white' : 'bg-bone text-charcoal'}`}>
                                    {member.name?.[0] || member.email?.[0]}
                                </div>
                                <div>
                                    <div className="font-semibold flex items-center gap-2">
                                        {member.name || member.email}
                                        {member.uid === currentUser?.uid && <span className="text-xs bg-grey-light px-2 py-0.5 rounded text-charcoal">Þú</span>}
                                    </div>
                                    <div className="text-sm text-grey-mid">
                                        {house.manager_id === member.uid ? 'Umsjónarmaður' : 'Meðeigandi'}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                {isManager && canChangeMembership && house.manager_id !== member.uid && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => onTransferManager(member)}
                                            className="text-xs text-amber-ink hover:text-amber-dark font-medium"
                                        >
                                            Gera að umsjónarmanni<span className="sr-only">: {member.name || member.email}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onOpenMembershipAction({ type: 'remove', member })}
                                            className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
                                        >
                                            Fjarlægja<span className="sr-only">: {member.name || member.email}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <div className="mt-6 border-t border-stone-100 pt-4">
                        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Í bið</h3>
                        <div className="space-y-2">
                            {invitations.map(invite => (
                                <div key={invite.id} className="flex items-center justify-between p-3 border border-stone-200 border-dashed rounded-lg bg-stone-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500">
                                            <Users size={14} aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-stone-600">{invite.email}</p>
                                            <p className="text-xs text-stone-500">Boðið {invite.created_at?.seconds ? new Date(invite.created_at.seconds * 1000).toLocaleDateString('is-IS') : '—'}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRevokeInvite(invite.id)}
                                        className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
                                    >
                                        Afturkalla<span className="sr-only"> boð til {invite.email}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Invite Section */}
                {(house.owner_ids?.includes(currentUser?.uid || '') || house.manager_id === currentUser?.uid) && (
                    <div className="mt-8 pt-6 border-t border-grey-warm">
                        <h3 className="text-lg font-serif mb-4">Bjóða nýjum aðilum</h3>
                        <p className="text-sm text-grey-dark mb-4">
                            Deildu hlekknum hér að neðan til að bjóða öðrum að ganga í húsfélagið, eða sendu boð í tölvupósti.
                        </p>

                        {/* Email Invite Form */}
                        <div className="bg-bone p-4 rounded-lg mb-4 border border-stone-200">
                            <label htmlFor={`${baseId}-invite-email`} className="label text-xs uppercase text-grey-mid">Bjóða með tölvupósti</label>
                            <div className="flex gap-2">
                                <input
                                    id={`${baseId}-invite-email`}
                                    type="email"
                                    placeholder="sláðu inn netfang..."
                                    className="input w-full"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    disabled={inviteLoading}
                                />
                                <button
                                    type="button"
                                    onClick={handleSendInvite}
                                    disabled={inviteLoading || !inviteEmail.trim().includes('@')}
                                    className="btn btn-primary whitespace-nowrap"
                                >
                                    {inviteLoading ? 'Sendi...' : 'Senda boð'}
                                </button>
                            </div>
                            <p className="text-xs text-stone-500 mt-2">
                                Við sendum tölvupóst. Ef viðkomandi er ekki skráður þá fær hann boð um að stofna aðgang.
                            </p>
                        </div>

                        <div className="bg-bone p-4 rounded-lg flex flex-col gap-4">
                            {house.invite_code ? (
                                <div>
                                    <label htmlFor={`${baseId}-invite-link`} className="label text-xs uppercase text-grey-mid">Boðshlekkur</label>
                                    <div className="flex gap-2">
                                        <input
                                            id={`${baseId}-invite-link`}
                                            readOnly
                                            className="input font-mono text-sm bg-white"
                                            value={`${window.location.origin}/join?houseId=${house.id}&code=${house.invite_code}`}
                                            onClick={(e) => e.currentTarget.select()}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/join?houseId=${house.id}&code=${house.invite_code}`);
                                                setSuccess('Hlekkur afritaður!');
                                                setTimeout(() => setSuccess(''), 2000);
                                            }}
                                            className="btn btn-secondary whitespace-nowrap"
                                        >
                                            Afrita
                                        </button>
                                        {navigator.share && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const inviteUrl = `${window.location.origin}/join?houseId=${house.id}&code=${house.invite_code}`;
                                                    navigator.share({
                                                        title: `Boð í ${house.name}`,
                                                        text: `Má bjóða þér í bústað?`,
                                                        url: inviteUrl
                                                    });
                                                }}
                                                className="btn btn-primary whitespace-nowrap"
                                            >
                                                Deila
                                            </button>
                                        )}
                                    </div>
                                    {isManager && (
                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                onClick={handleGenerateInvite}
                                                className="text-xs text-grey-mid hover:underline"
                                            >
                                                Endurnýja hlekk (Gera gamlan ógildan)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : isManager ? (
                                <button
                                    type="button"
                                    onClick={handleGenerateInvite}
                                    className="btn btn-primary w-full md:w-auto self-start"
                                >
                                    Búa til boðshlekk
                                </button>
                            ) : (
                                <p className="text-sm text-grey-mid">
                                    Enginn boðshlekkur er til. Umsjónarmaður hússins getur búið hann til. Þú getur boðið með tölvupósti hér að ofan.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Leave / delete house */}
                {canChangeMembership && (
                    <div className="mt-8 pt-6 border-t border-grey-warm">
                        <h3 className="text-lg font-serif mb-2">Aðild að húsinu</h3>
                        <div className="flex flex-wrap gap-3">
                            {house.owner_ids.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onOpenMembershipAction({ type: 'leave' })}
                                    className="btn btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    Yfirgefa hús
                                </button>
                            )}
                            {isManager && (
                                <button
                                    type="button"
                                    onClick={() => onOpenMembershipAction({ type: 'delete_house' })}
                                    className="btn btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    Eyða húsi
                                </button>
                            )}
                        </div>
                        {house.owner_ids.length <= 1 && (
                            <p className="text-xs text-stone-500 mt-2">
                                Þú ert eini eigandi hússins og getur því ekki yfirgefið það. Þú getur eytt húsinu í staðinn.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
