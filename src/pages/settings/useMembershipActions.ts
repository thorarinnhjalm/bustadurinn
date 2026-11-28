import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    signOut,
    reauthenticateWithPopup,
    reauthenticateWithCredential,
    EmailAuthProvider,
    GoogleAuthProvider,
    FacebookAuthProvider,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import type { House, User } from '@/types/models';
import { clearHouseMembersCache } from '@/services/houseMembersService';
import { callMembershipApi, membershipErrorMessage } from '@/services/membershipService';
import { accountDeletionState } from '@/components/authHandlerHelpers';
import { logger } from '@/utils/logger';
import type { MembershipAction, SettingsFeedback } from './types';

interface UseMembershipActionsArgs extends SettingsFeedback {
    house: House | null;
    setHouse: Dispatch<SetStateAction<House | null>>;
    currentUser: User | null | undefined;
    isManager: boolean;
    reloadMembers: () => void;
    clearMembers: () => void;
}

/**
 * Membership flows: leave a house, remove a member, hand over the manager role, delete
 * the house and delete the account (typed confirmation + in-place re-authentication).
 * They are opened from the Meðeigendur and Mínar stillingar tabs and confirmed in the
 * page-level MembershipConfirmModal / TransferManagerModal.
 */
export function useMembershipActions({
    house,
    setHouse,
    currentUser,
    isManager,
    reloadMembers,
    clearMembers,
    setSuccess,
    setError,
}: UseMembershipActionsArgs) {
    const navigate = useNavigate();
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);
    const setUserHouses = useAppStore((state) => state.setUserHouses);

    // Ownership Transfer State
    const [memberToTransfer, setMemberToTransfer] = useState<User | null>(null);

    // Membership actions (leave / remove member / delete house / delete account)
    const [membershipAction, setMembershipAction] = useState<MembershipAction | null>(null);
    const [membershipText, setMembershipText] = useState('');
    const [newManagerChoice, setNewManagerChoice] = useState('');
    const [membershipBusy, setMembershipBusy] = useState(false);
    const [membershipModalError, setMembershipModalError] = useState('');
    const [transferBusy, setTransferBusy] = useState(false);
    // Account deletion re-authentication (password accounts)
    const [reauthPasswordNeeded, setReauthPasswordNeeded] = useState(false);
    const [reauthPassword, setReauthPassword] = useState('');
    const [transferConfirmation, setTransferConfirmation] = useState('');

    // Re-read the house after a membership change and refresh local + store state
    const refreshHouseAfterChange = async () => {
        if (!house) return;
        clearHouseMembersCache(house.id);
        try {
            const snap = await getDoc(doc(db, 'houses', house.id));
            if (snap.exists()) {
                const fresh = { id: snap.id, ...snap.data() } as House;
                setHouse(fresh);
                setCurrentHouse(fresh);
                setUserHouses(useAppStore.getState().userHouses.map((h) => (h.id === fresh.id ? fresh : h)));
            }
        } catch (e) {
            logger.warn('Could not refresh house after membership change:', e);
        }
        reloadMembers();
    };

    // The user is no longer in the house (left or deleted it): drop it everywhere locally
    const handleHouseGone = (houseId: string) => {
        clearHouseMembersCache(houseId);
        const remaining = useAppStore.getState().userHouses.filter((h) => h.id !== houseId);
        setUserHouses(remaining);
        setCurrentHouse(remaining[0] || null);
        try {
            if (localStorage.getItem('last_house_id') === houseId) localStorage.removeItem('last_house_id');
        } catch {
            // storage unavailable: nothing to clean up
        }
        if (currentUser) {
            setCurrentUser({ ...currentUser, house_ids: (currentUser.house_ids || []).filter((id) => id !== houseId) });
        }
        setHouse(null);
        clearMembers();
        navigate('/dashboard');
    };

    const handleTransferOwnership = async () => {
        if (!house || !currentUser || !memberToTransfer) return;

        setTransferBusy(true);
        let result;
        try {
            result = await callMembershipApi('transfer-manager', {
                houseId: house.id,
                newManagerId: memberToTransfer.uid,
            });
        } finally {
            setTransferBusy(false);
        }
        if (!result.ok) {
            setMemberToTransfer(null);
            setTransferConfirmation('');
            setError(membershipErrorMessage(result));
            return;
        }

        setSuccess(`Umsjón flutt yfir á ${memberToTransfer.name || memberToTransfer.email}`);
        setMemberToTransfer(null);
        setTransferConfirmation('');
        await refreshHouseAfterChange();
    };

    const closeTransferModal = () => {
        setMemberToTransfer(null);
        setTransferConfirmation('');
    };

    const openMembershipAction = (action: MembershipAction) => {
        setMembershipAction(action);
        setMembershipText('');
        setNewManagerChoice('');
        setMembershipModalError('');
        setReauthPasswordNeeded(false);
        setReauthPassword('');
    };

    const closeMembershipAction = () => {
        if (membershipBusy) return;
        setMembershipAction(null);
        setMembershipText('');
        setNewManagerChoice('');
        setMembershipModalError('');
        setReauthPasswordNeeded(false);
        setReauthPassword('');
    };

    // Re-authenticate the signed-in user in place so account deletion can
    // proceed without signing out. Returns null on success, 'need_password'
    // when a password account must type its password first, or an Icelandic
    // error message.
    const reauthenticateInPlace = async (): Promise<string | null> => {
        const user = auth.currentUser;
        if (!user) return membershipErrorMessage({ ok: false, status: 401, code: 'reauth_required' });
        const providers = user.providerData.map((p) => p.providerId);
        try {
            if (providers.includes('google.com')) {
                await reauthenticateWithPopup(user, new GoogleAuthProvider());
            } else if (providers.includes('facebook.com')) {
                await reauthenticateWithPopup(user, new FacebookAuthProvider());
            } else if (providers.includes('password') && user.email) {
                if (!reauthPassword) return 'need_password';
                await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, reauthPassword));
            } else {
                return membershipErrorMessage({ ok: false, status: 401, code: 'reauth_required' });
            }
            await user.getIdToken(true);
            return null;
        } catch (e) {
            const code = (e as { code?: string })?.code;
            logger.warn('Re-authentication failed:', code);
            if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
                return 'Rangt lykilorð. Reyndu aftur.';
            }
            if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                return 'Innskráningarglugganum var lokað áður en auðkenningu lauk. Reyndu aftur.';
            }
            return membershipErrorMessage({ ok: false, status: 401, code: 'reauth_required' });
        }
    };

    // The house has no manager who is still an owner (legacy data or a deleted
    // manager): any owner may take the role.
    const handleClaimManager = async () => {
        if (!house || !currentUser) return;
        const result = await callMembershipApi('transfer-manager', {
            houseId: house.id,
            newManagerId: currentUser.uid,
        });
        if (!result.ok) {
            setError(membershipErrorMessage(result));
            return;
        }
        setSuccess('Þú ert nú umsjónarmaður hússins');
        await refreshHouseAfterChange();
    };

    const handleConfirmMembershipAction = async () => {
        if (!membershipAction || membershipBusy) return;
        setMembershipBusy(true);
        setMembershipModalError('');
        try {
            if (membershipAction.type === 'delete_account') {
                // Keep AuthHandler from re-creating the profile the server is about to delete
                accountDeletionState.inProgress = true;
                let result = await callMembershipApi('delete-account', { confirm: 'EYÐA' });
                if (!result.ok && result.code === 'reauth_required') {
                    const reauthError = await reauthenticateInPlace();
                    if (reauthError === 'need_password') {
                        accountDeletionState.inProgress = false;
                        setReauthPasswordNeeded(true);
                        setMembershipModalError('Sláðu inn lykilorðið þitt til að staðfesta auðkenni þitt.');
                        return;
                    }
                    if (reauthError) {
                        accountDeletionState.inProgress = false;
                        setMembershipModalError(reauthError);
                        return;
                    }
                    result = await callMembershipApi('delete-account', { confirm: 'EYÐA' });
                }
                if (!result.ok) {
                    accountDeletionState.inProgress = false;
                    setMembershipModalError(membershipErrorMessage(result));
                    return;
                }
                try {
                    await signOut(auth);
                } catch (e) {
                    logger.warn('Sign-out after account deletion failed:', e);
                }
                useAppStore.getState().logout();
                accountDeletionState.inProgress = false;
                navigate('/');
                return;
            }

            if (!house) return;

            if (membershipAction.type === 'remove') {
                const result = await callMembershipApi('remove-member', {
                    houseId: house.id,
                    memberId: membershipAction.member.uid,
                });
                if (!result.ok) {
                    setMembershipModalError(membershipErrorMessage(result));
                    return;
                }
                setMembershipAction(null);
                setSuccess(`${membershipAction.member.name || membershipAction.member.email} var fjarlægð(ur) úr húsinu.`);
                await refreshHouseAfterChange();
                return;
            }

            if (membershipAction.type === 'delete_house') {
                const result = await callMembershipApi('leave-house', { houseId: house.id, deleteHouse: true });
                if (!result.ok) {
                    setMembershipModalError(membershipErrorMessage(result));
                    return;
                }
                setMembershipAction(null);
                handleHouseGone(house.id);
                return;
            }

            // leave
            const needsNewManager = isManager && house.owner_ids.length > 1;
            const result = await callMembershipApi('leave-house', {
                houseId: house.id,
                ...(needsNewManager ? { newManagerId: newManagerChoice } : {}),
            });
            if (!result.ok) {
                setMembershipModalError(membershipErrorMessage(result));
                return;
            }
            setMembershipAction(null);
            handleHouseGone(house.id);
        } finally {
            setMembershipBusy(false);
        }
    };

    return {
        // transfer-manager modal
        memberToTransfer,
        setMemberToTransfer,
        transferConfirmation,
        setTransferConfirmation,
        transferBusy,
        closeTransferModal,
        handleTransferOwnership,
        // confirmation modal (leave / remove / delete house / delete account)
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
        openMembershipAction,
        closeMembershipAction,
        handleConfirmMembershipAction,
        // "house has no manager" notice
        handleClaimManager,
    };
}

export type MembershipController = ReturnType<typeof useMembershipActions>;
