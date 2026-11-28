import { useState, useEffect, useId } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
    signOut,
    sendPasswordResetEmail,
    reauthenticateWithPopup,
    reauthenticateWithCredential,
    EmailAuthProvider,
    GoogleAuthProvider,
    FacebookAuthProvider,
} from 'firebase/auth';
import { db, storage, auth } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
    Home,
    ShoppingBag,
    ClipboardList,
    Users,
    User as UserIcon,
    LogOut,
    CheckCircle,
    Save,
    Edit2,
    Loader2,
    Image as ImageIcon,
    AlertTriangle,
    Copy,
    RefreshCw,
    Link as LinkIcon,
    Bell,
    Mail,
    Check,
    Hammer,
    BookOpen,
    Heart,
    MessageSquarePlus,
    Eye
} from 'lucide-react';
import { requestPushPermission } from '@/utils/pushNotifications';
import ImageCropper from '@/components/ImageCropper';
import Modal from '@/components/ui/Modal';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import {
    doc,
    getDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    serverTimestamp,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    onSnapshot,
    limit
} from 'firebase/firestore';
import MagicLinkGenerator from '@/components/guest/MagicLinkGenerator';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import type { House, User, NotificationSettings, ShoppingItem } from '@/types/models';
import { searchHMSAddresses, formatHMSAddress } from '@/utils/hmsSearch';
import { logger } from '@/utils/logger'; // Ensure imports

type Tab = 'house' | 'members' | 'profile' | 'guests' | 'guestbook' | 'shopping' | 'logs';

const TAB_IDS: readonly Tab[] = ['house', 'members', 'profile', 'guests', 'guestbook', 'shopping', 'logs'];
// Alternative names accepted in /settings?tab=...
const TAB_ALIASES: Record<string, Tab> = { tasks: 'logs', verkefni: 'logs' };

/** Resolve a ?tab= value (or router state) to a known tab id, or null. */
function parseTab(value: unknown): Tab | null {
    if (typeof value !== 'string') return null;
    if ((TAB_IDS as readonly string[]).includes(value)) return value as Tab;
    return TAB_ALIASES[value] ?? null;
}


// ... other imports
import MobileNav from '@/components/MobileNav';
import GuestbookViewer from '@/components/GuestbookViewer';
import ShoppingList from '@/components/ShoppingList';
import TaskManager from '@/components/TaskManager';
import HouseSettings from '@/components/settings/HouseSettings';
import GuestPreviewModal from '@/components/GuestPreviewModal';
import { updateUserNameInAllCollections } from '@/services/userService';
import FeedbackModal from '@/components/feedback/FeedbackModal';
import { notifyShoppingListAdded } from '@/services/inAppNotifications';
import { generateSecureToken, generateInviteCode } from '@/utils/secureToken';
import Toggle from '@/components/settings/Toggle';
import { getHouseMembers, clearHouseMembersCache } from '@/services/houseMembersService';
import { callMembershipApi, membershipErrorMessage } from '@/services/membershipService';
import { accountDeletionState } from '@/components/authHandlerHelpers';

export default function SettingsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const baseId = useId();
    const { user: currentUser, isImpersonating } = useEffectiveUser();
    const { startImpersonation } = useImpersonation();
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);
    const setUserHouses = useAppStore((state) => state.setUserHouses);

    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTabState] = useState<Tab>(() => {
        const state = location.state as { initialTab?: Tab } | null;
        return parseTab(searchParams.get('tab')) || parseTab(state?.initialTab) || 'house';
    });

    // Switching tabs keeps the URL in sync (replace, so Back does not step through tabs)
    const setActiveTab = (tab: Tab) => {
        setActiveTabState(tab);
        if (searchParams.get('tab') !== tab) {
            const next = new URLSearchParams(searchParams);
            next.set('tab', tab);
            setSearchParams(next, { replace: true });
        }
    };

    // Follow the URL when it changes from outside (e.g. a notification link while already on this page)
    const urlTab = parseTab(searchParams.get('tab'));
    useEffect(() => {
        if (urlTab) setActiveTabState(urlTab);
    }, [urlTab]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showGuestPreview, setShowGuestPreview] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    // House State
    const [house, setHouse] = useState<House | null>(null);
    const [houseForm, setHouseForm] = useState({
        name: '',
        address: '',
        lat: 0,
        lng: 0,
        invite_code: '',
        wifi_ssid: '',
        wifi_password: '',
        no_wifi: false,
        holiday_mode: 'first_come' as 'fairness' | 'first_come',
        house_rules: '',
        house_rules_en: '',
        check_in_time: '',
        check_out_time: '',
        directions: '',
        directions_en: '',
        access_instructions: '',
        access_instructions_en: '',
        emergency_contact: '',
        guest_instructions: '',
        guest_instructions_en: '',
        amenities: [] as string[],
        privacy_hide_finances: false,
        finance_viewer_ids: [] as string[]
    });

    // Language Toggle for dual-input fields
    const [editLang, setEditLang] = useState<'is' | 'en'>('is');

    const [isSaving, setIsSaving] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [debounceTimer, setDebounceTimer] = useState<any>(null);
    const [members, setMembers] = useState<User[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [membersError, setMembersError] = useState('');

    // Ownership Transfer State
    const [memberToTransfer, setMemberToTransfer] = useState<User | null>(null);

    // Membership actions (leave / remove member / delete house / delete account)
    type MembershipAction =
        | { type: 'leave' }
        | { type: 'remove'; member: User }
        | { type: 'delete_house' }
        | { type: 'delete_account' };
    const [membershipAction, setMembershipAction] = useState<MembershipAction | null>(null);
    const [membershipText, setMembershipText] = useState('');
    const [newManagerChoice, setNewManagerChoice] = useState('');
    const [membershipBusy, setMembershipBusy] = useState(false);
    const [membershipModalError, setMembershipModalError] = useState('');
    const [transferBusy, setTransferBusy] = useState(false);
    const [membersReloadKey, setMembersReloadKey] = useState(0);
    // Account deletion re-authentication (password accounts)
    const [reauthPasswordNeeded, setReauthPasswordNeeded] = useState(false);
    const [reauthPassword, setReauthPassword] = useState('');
    const [transferConfirmation, setTransferConfirmation] = useState('');
    const [imageFile, setImageFile] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [cropMode, setCropMode] = useState<'main' | 'gallery' | 'avatar'>('main');

    // Shopping State
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);

    // Fetch Shopping List
    useEffect(() => {
        if (activeTab === 'shopping' && house?.id) {
            const q = query(
                collection(db, 'houses', house.id, 'shopping_list'),
                orderBy('created_at', 'desc'),
                limit(100)
            );
            // Use onSnapshot for realtime updates
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingItem));
                setShoppingItems(items);
            });
            return () => unsubscribe();
        }
    }, [activeTab, house?.id]);


    // Shopping handlers
    const handleToggleShoppingItem = async (item: ShoppingItem) => {
        if (!house) return;
        const newCheckedState = !item.checked;
        await updateDoc(doc(db, 'houses', house.id, 'shopping_list', item.id), {
            checked: newCheckedState,
            ...(newCheckedState ? { checked_by: currentUser?.uid, checked_at: serverTimestamp() } : {})
        });

        // Bi-directional sync with "Hvað er til" (Inventory)
        if (newCheckedState && item.item) {
            try {
                const qInv = query(collection(db, 'houses', house.id, 'inventory'));
                const invSnap = await getDocs(qInv);
                for (const docSnap of invSnap.docs) {
                    const invData = docSnap.data();
                    if (invData.name?.trim().toLowerCase() === item.item.trim().toLowerCase() && invData.status === 'out') {
                        await updateDoc(doc(db, 'houses', house.id, 'inventory', docSnap.id), {
                            status: 'ok',
                            updated_at: serverTimestamp(),
                            updated_by: currentUser?.uid || '',
                            updated_by_name: currentUser?.name || ''
                        });
                    }
                }
            } catch (err) {
                logger.error("Error syncing inventory from shopping list check:", err);
            }
        }
    };

    const handleDeleteShoppingItem = async (item: ShoppingItem) => {
        if (!house) return;
        await deleteDoc(doc(db, 'houses', house.id, 'shopping_list', item.id));
    };

    const handleAddShoppingItem = async (text: string) => {
        if (!house || !currentUser) return;
        await addDoc(collection(db, 'houses', house.id, 'shopping_list'), {
            house_id: house.id,
            item: text,
            checked: false,
            created_at: new Date(),
            added_by: currentUser.uid,
            added_by_name: currentUser.name
        });

        // Fire-and-forget: notify other house members (in-app only). Never
        // blocks the shopping list update — failures are logged inside the service.
        if (house.owner_ids && house.owner_ids.length > 0) {
            notifyShoppingListAdded({
                houseId: house.id,
                itemName: text,
                ownerIds: house.owner_ids,
                actorUid: currentUser.uid,
                actorName: currentUser.name,
            }).catch((error) => logger.error('Failed to notify house members of shopping list update:', error));
        }
    };



    const handleDeleteGuestbookEntry = async (entry: any) => {
        if (!confirm('Ertu viss um að þú viljir eyða þessari færslu úr gestabókinni?')) return;
        try {
            await deleteDoc(doc(db, 'guestbook', entry.id));
            // Force refresh of guestbook viewer? 
            // Since GuestbookViewer fetches its own data on mount/update, we might need a way to trigger refresh.
            // For now, simple approach: The component manages its own state? No, it fetches on mount.
            // We can pass a key to force re-render or let it handle its own update if we passed the list.
            // Actually, GuestbookViewer manages its own state. 
            // We should probably move the state up OR make GuestbookViewer listen to changes.
            // OR simpler: Just reload the page or show success and let user refresh.
            // BETTER: Pass a "refreshTrigger" prop to GuestbookViewer?
            setSuccess('Færslu eytt');
            setTimeout(() => setSuccess(''), 2000);

            // To make the UI update immediately without refresh, we would need to lift state up.
            // Given the complexity constraints, I'll trigger a re-mount by changing key or similar.
            // But let's look at how GuestbookViewer is implemented. 
            // It fetches data in useEffect.
        } catch (e) {
            logger.error('Error deleting guestbook entry:', e);
            setError('Gat ekki eytt færslu');
        }
    };

    // Invite State
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [invitationsReloadKey, setInvitationsReloadKey] = useState(0);

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

    // Profile State
    const [userName, setUserName] = useState('');
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        emails: {
            new_bookings: true,
            task_reminders: true,
            system_updates: true,
            member_activity: true,
            weather_alerts: true
        },
        in_app: {
            new_bookings: true,
            task_assignments: true,
            guestbook_entries: true,
            shopping_list_updates: true,
            weather_alerts: true
        }
    });

    useEffect(() => {
        if (currentUser?.name) {
            setUserName(currentUser.name);
        }
        if (currentUser?.notification_settings) {
            setNotificationSettings(currentUser.notification_settings);
        }
    }, [currentUser]);

    const handleSaveProfile = async () => {
        if (!currentUser || !userName.trim()) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                name: userName.trim()
            });

            // Update the denormalised name copies in every house
            const nameResult = await updateUserNameInAllCollections(currentUser.uid, userName.trim(), currentUser.house_ids || []);

            const updatedUser = { ...currentUser, name: userName.trim() };

            if (isImpersonating) {
                startImpersonation(updatedUser);
            } else {
                setCurrentUser(updatedUser);
            }

            if (nameResult.ok) {
                setSuccess('Nafni breytt!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(
                    `Nafninu var breytt, en það tókst ekki að uppfæra það á eldri færslum í ${nameResult.failedHouseIds.length} húsi. ` +
                    'Eldri færslur geta enn sýnt gamla nafnið. Reyndu að vista aftur síðar.'
                );
            }
        } catch (err) {
            logger.error('Error updating profile:', err);
            setError('Gat ekki vistað nafn.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (err) {
            logger.error('Logout error:', err);
        }
    };

    const handlePasswordReset = async () => {
        if (!currentUser?.email) return;
        try {
            await sendPasswordResetEmail(auth, currentUser.email);
            setSuccess(`Tölvupóstur sendur á ${currentUser.email}. Athugaðu ruslpóstinn ef hann berst ekki.`);
        } catch (err) {
            logger.error('Error sending password reset:', err);
            setError('Gat ekki sent tölvupóst. Reyndu aftur síðar.');
        }
    };

    const handleUpdateLanguage = async (code: 'is' | 'en' | 'de' | 'fr' | 'es') => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                language: code
            });
            const updatedUser = { ...currentUser, language: code };
            if (isImpersonating) {
                startImpersonation(updatedUser);
            } else {
                setCurrentUser(updatedUser);
            }
            setSuccess('Tungumál uppfært');
            setTimeout(() => setSuccess(''), 2000);
        } catch (e) {
            logger.error('Error updating language', e);
            setError('Gat ekki uppfært tungumál');
        }
    };

    const handleUpdateNotificationSettings = async (
        category: 'emails' | 'in_app',
        setting: string,
        value: boolean
    ) => {
        if (!currentUser) return;

        const newSettings = {
            ...notificationSettings,
            [category]: {
                ...notificationSettings[category],
                [setting]: value
            }
        };

        setNotificationSettings(newSettings);

        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                notification_settings: newSettings
            });

            // Update global state
            setCurrentUser({
                ...currentUser,
                notification_settings: newSettings
            });
        } catch (err) {
            logger.error('Error updating notification settings:', err);
            setError('Gat ekki uppfært tilkynningastillingar.');
            // Revert on error
            setNotificationSettings(notificationSettings);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, mode: 'main' | 'gallery' = 'main') => {
        const file = e.target.files?.[0];
        if (file) {
            setCropMode(mode);
            const reader = new FileReader();
            reader.onload = () => {
                setImageFile(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCropMode('avatar');
            const reader = new FileReader();
            reader.onload = () => {
                setImageFile(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleCroppedImage = async (blob: Blob) => {
        if (!house) {
            logger.error("No house object found in handleCroppedImage");
            return;
        }
        // Only the manager may write the house document (avatars are the user's own)
        if (cropMode !== 'avatar' && !isManager) {
            setError('Aðeins umsjónarmaður hússins getur breytt myndum hússins.');
            return;
        }
        try {
            logger.debug("Saving cropped image for house:", house.id, "cropMode:", cropMode);
            setUploadingImage(true);
            setUploadProgress(0);
            const fileName = cropMode === 'main' ? 'image.jpg' : `gallery_${Date.now()}.jpg`;
            const storageRef = ref(storage, `houses/${house.id}/${fileName}`);

            // Added explicit metadata
            const metadata = { contentType: 'image/jpeg' };

            // Use uploadBytesResumable for progress tracking
            const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

            // Track upload progress
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(Math.round(progress));
                },
                (error) => {
                    logger.error('Upload error:', error);
                }
            );

            // Wait for upload to complete
            await uploadTask;
            const downloadURL = await getDownloadURL(storageRef);

            if (cropMode === 'avatar') {
                if (!currentUser) return;
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    avatar: downloadURL
                });

                // Update globally
                const updatedUser = { ...currentUser, avatar: downloadURL };
                if (isImpersonating) {
                    startImpersonation(updatedUser);
                } else {
                    setCurrentUser(updatedUser);
                }

                // Also update in current house's owner list if needed? 
                // No, member lists usually just store UID and name, Avatar is fetched or stored in users collection.
                // However, some local cached lists might need it. 

                setShowCropper(false);
                setImageFile(null);
                setSuccess('Prófílmynd uppfærð!');
                setTimeout(() => setSuccess(''), 3000);
                return;
            }

            let updatedHouse: House;
            if (cropMode === 'main') {
                logger.debug("Updating main image_url to:", downloadURL);
                await updateDoc(doc(db, 'houses', house.id), {
                    image_url: downloadURL,
                    updated_at: serverTimestamp()
                });
                updatedHouse = { ...house, image_url: downloadURL };
            } else {
                const currentGallery = house.gallery_urls || [];
                const newGallery = [...currentGallery, downloadURL];
                logger.debug("Updating gallery_urls, new count:", newGallery.length);
                await updateDoc(doc(db, 'houses', house.id), {
                    gallery_urls: newGallery,
                    updated_at: serverTimestamp()
                });
                updatedHouse = { ...house, gallery_urls: newGallery };
            }

            setHouse(updatedHouse);
            setCurrentHouse(updatedHouse);
            setShowCropper(false);
            setImageFile(null);
            setSuccess('Mynd vistuð!');

            // Clear success after 3s
            setTimeout(() => setSuccess(''), 3000);

            // Sync with Guest View if token exists (Use setDoc merge for robustness)
            if (updatedHouse.guest_token) {
                logger.debug("Syncing image with guest view:", updatedHouse.guest_token);
                try {
                    await setDoc(doc(db, 'guest_views', updatedHouse.guest_token), {
                        houseId: updatedHouse.id,
                        image_url: updatedHouse.image_url || '',
                        gallery_urls: updatedHouse.gallery_urls || [],
                        updated_at: serverTimestamp()
                    }, { merge: true });
                } catch (guestErr) {
                    logger.error("Error syncing with guest view:", guestErr);
                }
            }
        } catch (error: any) {
            logger.error('Error uploading image:', error);
            setError('Villa kom upp við að vista mynd. Reyndu aftur.');
        } finally {
            setUploadingImage(false);
            setUploadProgress(0);
        }
    };

    const handleRemoveGalleryImage = async (url: string) => {
        if (!house || !house.gallery_urls || !isManager) return;
        if (!confirm('Ertu viss um að þú viljir eyða þessari mynd úr galleríinu?')) return;

        try {
            setLoading(true);
            const newGallery = house.gallery_urls.filter(item => item !== url);
            await updateDoc(doc(db, 'houses', house.id), {
                gallery_urls: newGallery,
                updated_at: serverTimestamp()
            });

            const updatedHouse = { ...house, gallery_urls: newGallery };
            setHouse(updatedHouse);
            setCurrentHouse(updatedHouse);
            setSuccess('Mynd eytt!');

            // Sync with Guest View if token exists
            if (updatedHouse.guest_token) {
                try {
                    await updateDoc(doc(db, 'guest_views', updatedHouse.guest_token), {
                        gallery_urls: newGallery,
                        updated_at: serverTimestamp()
                    });
                } catch (guestErr) {
                    logger.error("Error syncing gallery deletion with guest view:", guestErr);
                }
            }
        } catch (error) {
            logger.error("Error removing gallery image", error);
            setError('Gat ekki eytt mynd.');
        } finally {
            setLoading(false);
        }
    };

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
        setMembersReloadKey((k) => k + 1);
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
        setMembers([]);
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

    const currentHouse = useAppStore((state) => state.currentHouse);

    const userHouseIds = currentUser?.house_ids;
    const currentUserId = currentUser?.uid;
    const currentStoredHouseId = currentHouse?.id;

    useEffect(() => {
        if (!userHouseIds?.[0]) return;

        const loadHouse = async () => {
            setLoading(true);
            try {
                // Prioritize the globally selected house, otherwise default to first available
                const houseId = currentStoredHouseId || userHouseIds[0];
                if (!houseId) return;

                const houseSnap = await getDoc(doc(db, 'houses', houseId));

                if (houseSnap.exists()) {
                    const houseData = { id: houseSnap.id, ...houseSnap.data() } as House;

                    // Auto-generate invite code if missing (for legacy houses)
                    if (currentUserId && !houseData.invite_code && houseData.manager_id === currentUserId) {
                        logger.info('Auto-generating invite code for house:', houseId);
                        const newCode = generateInviteCode();
                        try {
                            await updateDoc(doc(db, 'houses', houseId), {
                                invite_code: newCode
                            });
                            houseData.invite_code = newCode;
                            logger.info('Invite code generated for house:', houseId);
                        } catch (err) {
                            logger.error('Failed to generate invite code:', err);
                        }
                    }

                    setHouse(houseData);
                    // The Gestir tab edits and saves houseForm, so it must start
                    // from the stored values or a save would blank them out.
                    setHouseForm(prev => ({
                        ...prev,
                        name: houseData.name || '',
                        address: houseData.address || '',
                        lat: houseData.location?.lat || 0,
                        lng: houseData.location?.lng || 0,
                        invite_code: houseData.invite_code || '',
                        wifi_ssid: houseData.wifi_ssid || '',
                        wifi_password: houseData.wifi_password || '',
                        no_wifi: houseData.no_wifi || false,
                        holiday_mode: (houseData.holiday_mode as any) || 'first_come',
                        house_rules: houseData.house_rules || '',
                        house_rules_en: houseData.house_rules_en || '',
                        check_in_time: houseData.check_in_time || '',
                        check_out_time: houseData.check_out_time || '',
                        directions: houseData.directions || '',
                        directions_en: houseData.directions_en || '',
                        access_instructions: houseData.access_instructions || '',
                        access_instructions_en: houseData.access_instructions_en || '',
                        emergency_contact: houseData.emergency_contact || '',
                        guest_instructions: houseData.guest_instructions || '',
                        guest_instructions_en: houseData.guest_instructions_en || '',
                        amenities: houseData.amenities || [],
                        privacy_hide_finances: houseData.privacy_hide_finances || false,
                        finance_viewer_ids: houseData.finance_viewer_ids || []
                    }));
                }
            } catch (err) {
                logger.error('Error loading house:', err);
                setError('Gat ekki sótt upplýsingar um sumarhúsið.');
            } finally {
                setLoading(false);
            }
        };

        loadHouse();
    }, [userHouseIds, currentStoredHouseId, currentUserId]);

    // Only the manager (manager_id) may write the house document (see firestore.rules);
    // other owners can still invite, manage guest links and their own profile.
    const isManager = !!(house && currentUser && house.manager_id === currentUser.uid);
    // Membership actions call the API with the real Firebase user's token, so they
    // must not be offered while impersonating someone else.
    const canChangeMembership = !isImpersonating;


    // Fetch members (via /api/house-members: users may only read their own user doc)
    useEffect(() => {
        if ((activeTab === 'members' || activeTab === 'house' || activeTab === 'logs') && house?.id) {
            let cancelled = false;
            const houseId = house.id;
            const fetchMembers = async () => {
                setLoadingMembers(true);
                setMembersError('');
                try {
                    const list = await getHouseMembers(houseId, membersReloadKey > 0 ? { force: true } : undefined);
                    if (cancelled) return;
                    setMembers(list.map((m) => ({
                        uid: m.uid,
                        name: m.name,
                        email: m.email,
                        avatar: m.avatar_url ?? undefined,
                        house_ids: [],
                        created_at: new Date(),
                    } as User)));
                } catch (err) {
                    logger.error('Error fetching members', err);
                    if (!cancelled) setMembersError('Gat ekki sótt lista yfir meðeigendur.');
                } finally {
                    if (!cancelled) setLoadingMembers(false);
                }
            };
            fetchMembers();
            return () => { cancelled = true; };
        }
    }, [activeTab, house?.owner_ids, house?.id, membersReloadKey]);

    // Pending invitations load on their own so a failure in one list never hides the other
    useEffect(() => {
        if (activeTab !== 'members' || !house?.id) return;
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
    }, [activeTab, house?.id, invitationsReloadKey]);

    const handleSaveHouse = async (formData: any) => {
        if (!house || !isManager) return;

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const updates: Record<string, any> = {
                name: formData.name,
                address: formData.address,
                wifi_ssid: formData.wifi_ssid,
                wifi_password: formData.wifi_password,
                no_wifi: formData.no_wifi,
                holiday_mode: formData.holiday_mode as any,
                house_rules: formData.house_rules,
                house_rules_en: formData.house_rules_en,
                check_in_time: formData.check_in_time,
                check_out_time: formData.check_out_time,
                directions: formData.directions,
                directions_en: formData.directions_en,
                access_instructions: formData.access_instructions,
                access_instructions_en: formData.access_instructions_en,

                emergency_contact: formData.emergency_contact,
                guest_instructions: formData.guest_instructions,
                guest_instructions_en: formData.guest_instructions_en,
                amenities: formData.amenities,
                privacy_hide_finances: formData.privacy_hide_finances,
                finance_viewer_ids: formData.finance_viewer_ids,
                checkout_checklist: formData.checkout_checklist,
                arrival_checklist: formData.arrival_checklist,
                supply_checklist: formData.supply_checklist,
                seasonal_checklists: formData.seasonal_checklists,
                updated_at: new Date()
            };

            // Only write the fields this form actually supplied. Defaulting a
            // missing field to ''/[]/0 would wipe data a partial form (e.g. the
            // Gestir tab) doesn't edit — that is how house locations got reset
            // to 0,0 and the dashboard weather went blank.
            for (const key of Object.keys(updates)) {
                if (updates[key] === undefined) delete updates[key];
            }

            // Skip 0,0 too: it's the "no location" placeholder, never a real house.
            const lat = Number(formData.lat);
            const lng = Number(formData.lng);
            if (lat && lng) {
                updates.location = { lat, lng };
            }

            // Gas cylinder: the settings form only owns size/connection/notes.
            // last_changed_* is stamped from the dashboard, so merge rather than
            // overwrite or a save here would wipe the replacement date.
            if (formData.gas_cylinder_size && formData.gas_cylinder_connection) {
                updates.gas_cylinder = {
                    ...(house.gas_cylinder || {}),
                    size: formData.gas_cylinder_size,
                    connection: formData.gas_cylinder_connection,
                    notes: formData.gas_cylinder_notes || ''
                };
            }

            await updateDoc(doc(db, 'houses', house.id), updates);

            // Sync Guest View
            if (house.guest_token) {
                await setDoc(doc(db, 'guest_views', house.guest_token), {
                    houseId: house.id,
                    name: formData.name,
                    address: formData.address,
                    wifi_ssid: formData.wifi_ssid,
                    wifi_password: formData.wifi_password,
                    no_wifi: formData.no_wifi,
                    house_rules: formData.house_rules,
                    house_rules_en: formData.house_rules_en,
                    check_in_time: formData.check_in_time,
                    check_out_time: formData.check_out_time,
                    directions: formData.directions,
                    directions_en: formData.directions_en,
                    access_instructions: formData.access_instructions,
                    access_instructions_en: formData.access_instructions_en,
                    emergency_contact: formData.emergency_contact,
                    guest_instructions: formData.guest_instructions,
                    guest_instructions_en: formData.guest_instructions_en,
                    amenities: formData.amenities,
                    ...(updates.location && { location: updates.location }),
                    image_url: house.image_url || '',
                    gallery_urls: house.gallery_urls || [],
                    updated_at: new Date()
                }, { merge: true });
            }

            const updatedHouse = { ...house, ...updates } as House;
            setHouse(updatedHouse);

            // Also need to update the app store's currentHouse but we need to find it first in list
            // For now, simple success message
            setSuccess('Breytingar vistaðar!');

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            logger.error('Error updating house:', err);
            setError('Villa kom upp við að vista breytingar.');
        } finally {
            setIsSaving(false);
        }
    };

    // Gestir tab: send only the fields it edits so a stale houseForm can't
    // overwrite changes saved from the Hús tab (name, wifi, location, ...).
    const handleSaveGuestInfo = (e: React.FormEvent) => {
        e.preventDefault();
        handleSaveHouse({
            house_rules: houseForm.house_rules,
            house_rules_en: houseForm.house_rules_en,
            check_in_time: houseForm.check_in_time,
            check_out_time: houseForm.check_out_time,
            directions: houseForm.directions,
            directions_en: houseForm.directions_en,
            access_instructions: houseForm.access_instructions,
            access_instructions_en: houseForm.access_instructions_en,
            emergency_contact: houseForm.emergency_contact,
            guest_instructions: houseForm.guest_instructions,
            guest_instructions_en: houseForm.guest_instructions_en,
            amenities: houseForm.amenities
        });
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

    const handleAddressChange = (val: string) => {
        setHouseForm(prev => ({ ...prev, address: val }));
        if (!isManager) return;

        if (debounceTimer) clearTimeout(debounceTimer);

        if (val.length >= 2) {
            const timer = setTimeout(async () => {
                try {
                    const hms = await searchHMSAddresses(val);
                    setSuggestions(hms.map(item => ({
                        id: `hms-${item.lat}-${item.lng}-${Math.random()}`,
                        description: formatHMSAddress(item),
                        location: { lat: item.lat, lng: item.lng },
                        source: 'hms'
                    })));
                } catch (e) {
                    logger.error("HMS search error in settings", e);
                }
            }, 400);
            setDebounceTimer(timer);
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectPrediction = (suggestion: any) => {
        setSuggestions([]);
        setHouseForm(prev => ({
            ...prev,
            address: suggestion.description,
            lat: suggestion.location.lat,
            lng: suggestion.location.lng
        }));
    };

    const handleGenerateGuestToken = async (replace = false) => {
        // The fixed guest link is stored on the house document (guest_token), which only
        // the manager may write, so only the manager creates/replaces/deletes it.
        if (!house || !isManager) return;
        if (replace && !confirm('Ertu viss? Gamli hlekkurinn mun hætta að virka.')) return;

        // Check if we have enough info to make a useful guest page
        const hasInfo =
            houseForm.wifi_ssid ||
            houseForm.wifi_password ||
            houseForm.house_rules ||
            houseForm.check_in_time ||
            houseForm.check_out_time ||
            houseForm.directions ||
            houseForm.access_instructions ||
            (houseForm.lat !== 0 && houseForm.lng !== 0); // Valid coordinates act as "info" (Directions)

        if (!hasInfo) {
            setError('Vinsamlegast fylltu út einhverjar upplýsingar (t.d. WiFi, reglur, eða staðsetningu) áður en þú býrð til gestahlekk.');
            // Switch to relevant tab (e.g. house or guests) if needed, currently mainly in Guests
            // But some info is in House tab (location). 
            return;
        }

        setLoading(true);
        try {
            // Delete old if exists
            if (house.guest_token) {
                await deleteDoc(doc(db, 'guest_views', house.guest_token));
            }

            const newToken = generateSecureToken();

            // Create new view
            await setDoc(doc(db, 'guest_views', newToken), {
                houseId: house.id,
                name: houseForm.name,
                address: houseForm.address,
                wifi_ssid: houseForm.wifi_ssid,
                wifi_password: houseForm.wifi_password,
                no_wifi: houseForm.no_wifi,
                house_rules: houseForm.house_rules,
                house_rules_en: houseForm.house_rules_en,
                check_in_time: houseForm.check_in_time,
                check_out_time: houseForm.check_out_time,
                directions: houseForm.directions,
                directions_en: houseForm.directions_en,
                access_instructions: houseForm.access_instructions,
                access_instructions_en: houseForm.access_instructions_en,
                emergency_contact: houseForm.emergency_contact,
                guest_instructions: houseForm.guest_instructions,
                guest_instructions_en: houseForm.guest_instructions_en,
                amenities: houseForm.amenities || [],
                location: {
                    lat: houseForm.lat,
                    lng: houseForm.lng
                },
                image_url: house.image_url || '',
                updated_at: new Date()
            });

            await updateDoc(doc(db, 'houses', house.id), { guest_token: newToken });
            setHouse({ ...house, guest_token: newToken });
            setSuccess('Nýr gestahlekkur búinn til! Gestir geta nú nálgast upplýsingar.');
        } catch (err) {
            logger.error('Error creating guest link:', err);
            setError('Villa við að búa til hlekk.');
        } finally {
            setLoading(false);
        }
    };



    if (loading && !house) {
        return <div role="status" className="p-8 text-center text-grey-mid">Hleð...</div>;
    }

    return (
        <div className="min-h-screen bg-bone pb-24">
            {/* Header */}
            <div className="bg-white border-b border-grey-warm">
                <div className="container mx-auto px-6 py-6">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="text-stone-500 hover:text-charcoal font-bold text-sm mb-4 flex items-center gap-1 transition-colors"
                    >
                        ← Til baka á stjórnborð
                    </button>
                    <h1 className="text-3xl font-serif mb-2">Stillingar</h1>
                    <p className="text-grey-mid">Stjórnaðu húsinu og þínum aðgangi</p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8 pb-32">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar Navigation */}
                    <nav aria-label="Stillingar" className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <button
                                type="button"
                                aria-current={activeTab === 'house' ? 'page' : undefined}
                                onClick={() => setActiveTab('house')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'house'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <Home className="w-5 h-5" aria-hidden="true" />
                                <span>Húsupplýsingar</span>
                            </button>

                            <button
                                type="button"
                                aria-current={activeTab === 'shopping' ? 'page' : undefined}
                                onClick={() => setActiveTab('shopping')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'shopping'
                                    ? 'bg-amber text-charcoal font-bold'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                                <span>Innkaupalisti</span>
                            </button>

                            <button
                                type="button"
                                aria-current={activeTab === 'logs' ? 'page' : undefined}
                                onClick={() => setActiveTab('logs')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'logs'
                                    ? 'bg-amber text-charcoal font-bold'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <ClipboardList className="w-5 h-5" aria-hidden="true" />
                                <span>Verkefni & Viðhald</span>
                            </button>

                            <button
                                type="button"
                                aria-current={activeTab === 'members' ? 'page' : undefined}
                                onClick={() => setActiveTab('members')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'members'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <Users className="w-5 h-5" aria-hidden="true" />
                                <span>Meðeigendur</span>
                            </button>

                            <button
                                type="button"
                                aria-current={activeTab === 'guests' ? 'page' : undefined}
                                onClick={() => setActiveTab('guests')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'guests'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <BookOpen className="w-5 h-5" aria-hidden="true" />
                                <span>Gestaupplýsingar</span>
                            </button>

                            <button
                                type="button"
                                aria-current={activeTab === 'guestbook' ? 'page' : undefined}
                                onClick={() => setActiveTab('guestbook')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'guestbook'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <Heart className="w-5 h-5" aria-hidden="true" />
                                <span>Gestabók</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/torgid')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-grey-dark hover:bg-bone transition-colors"
                            >
                                <Hammer className="w-5 h-5" aria-hidden="true" />
                                <span>Þjónustutorg</span>
                            </button>

                            <button
                                type="button"
                                aria-current={activeTab === 'profile' ? 'page' : undefined}
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'profile'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <UserIcon className="w-5 h-5" aria-hidden="true" />
                                <span>Mínar stillingar</span>
                            </button>


                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left border-t border-grey-warm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-5 h-5" aria-hidden="true" />
                                <span>Skrá út</span>
                            </button>
                        </div>
                    </nav>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Feedback Messages (live regions stay mounted so announcements are reliable) */}
                        <div role="status" aria-live="polite">
                            {success && (
                                <div className="mb-4 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded relative">
                                    {success}
                                </div>
                            )}
                        </div>
                        <div role="alert">
                            {error && (
                                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* TAB: SHOPPING */}
                        {activeTab === 'shopping' && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-serif font-bold mb-4">Innkaupalisti</h2>
                                <p className="text-stone-500 mb-6">Hvað vantar í bústaðinn?</p>
                                <ShoppingList
                                    items={shoppingItems}
                                    onToggle={handleToggleShoppingItem}
                                    onDelete={handleDeleteShoppingItem}
                                    onAdd={handleAddShoppingItem}
                                />
                            </div>
                        )}

                        {/* TAB: LOGS */}
                        {activeTab === 'logs' && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-serif font-bold mb-4">Verkefni & Viðhald</h2>
                                <p className="text-stone-500 mb-6">Halda utan um verkefni, viðhald og umbætur á bústaðnum.</p>
                                {house && currentUser && (
                                    <TaskManager
                                        house={house}
                                        currentUser={currentUser}
                                        members={members}
                                    />
                                )}
                            </div>
                        )}

                        {house && currentUser && house.owner_ids?.includes(currentUser.uid) &&
                            !(house.manager_id && house.owner_ids.includes(house.manager_id)) && (
                            <div className="mb-4 bg-amber/10 border border-amber/30 text-charcoal px-4 py-3 rounded text-sm flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                                <span>Húsið er án umsjónarmanns</span>
                                <button
                                    type="button"
                                    onClick={handleClaimManager}
                                    disabled={!canChangeMembership}
                                    className="btn-primary text-sm disabled:opacity-50"
                                >
                                    Gerast umsjónarmaður
                                </button>
                            </div>
                        )}

                        {/* TAB: HOUSE INFO */}
                        {activeTab === 'house' && house && !isManager && (
                            <div id="house-readonly-note" className="mb-4 bg-amber/10 border border-amber/30 text-charcoal px-4 py-3 rounded text-sm">
                                Aðeins umsjónarmaður hússins getur breytt húsupplýsingum. Þú getur skoðað þær hér.
                            </div>
                        )}
                        {activeTab === 'house' && house && (
                            <HouseSettings
                                house={house}
                                isManager={!!isManager}
                                members={members}
                                loadingMembers={loadingMembers}
                                isSaving={isSaving}
                                onSave={handleSaveHouse}
                                onImageSelect={handleImageSelect}
                                onRemoveGalleryImage={handleRemoveGalleryImage}
                                suggestions={suggestions}
                                handleAddressChange={handleAddressChange}
                                handleSelectPrediction={handleSelectPrediction}
                            />
                        )}

                        {/* TAB: MEMBERS */}
                        {activeTab === 'members' && house && (
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
                                                onClick={() => setMembersReloadKey((k) => k + 1)}
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
                                                                onClick={() => setMemberToTransfer(member)}
                                                                className="text-xs text-amber-ink hover:text-amber-dark font-medium"
                                                            >
                                                                Gera að umsjónarmanni<span className="sr-only">: {member.name || member.email}</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openMembershipAction({ type: 'remove', member })}
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
                                                                <p className="text-xs text-stone-500">Boðið {new Date(invite.created_at?.seconds * 1000).toLocaleDateString('is-IS')}</p>
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
                                                        onClick={() => openMembershipAction({ type: 'leave' })}
                                                        className="btn btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                                                    >
                                                        Yfirgefa hús
                                                    </button>
                                                )}
                                                {isManager && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openMembershipAction({ type: 'delete_house' })}
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
                        )}

                        {/* TAB: GUESTS */}
                        {activeTab === 'guests' && house && (
                            <div className="max-w-4xl mx-auto space-y-12">

                                {/* Dynamic Links (New) */}
                                <section>
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-serif font-bold text-charcoal mb-2">Bókunarhlekkir</h2>
                                        <p className="text-grey-mid">Búðu til tímabundna hlekki sem virka sjálfkrafa fyrir hverja bókun.</p>
                                    </div>
                                    <MagicLinkGenerator house={house} />
                                </section>

                                <hr className="border-stone-200" />

                                {/* Static Link (Old) */}
                                <section>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-2xl font-serif font-bold text-charcoal mb-2">Fastur Gestahlekkur</h2>
                                            <p className="text-grey-mid">Einn fastur hlekkur fyrir húsið sem hægt er að senda handvirkt. Virkur þar til honum er eytt.</p>
                                        </div>
                                        <div className="bg-amber/10 text-amber-ink px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                            Mælt með fyrir fjölskyldu
                                        </div>
                                    </div>

                                    <div className="card p-6 border-2 border-stone-100">
                                        {house.guest_token ? (
                                            <div className="space-y-6">
                                                <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center">
                                                    <p className="text-green-800 font-medium mb-2">✓ Gestasíða er virk</p>
                                                    <div className="flex items-center justify-center gap-2 mb-4">
                                                        <code className="bg-white px-3 py-1 rounded border border-green-200 text-green-900 font-mono text-lg">
                                                            bustadurinn.is/guest/{house.guest_token}
                                                        </code>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(`${window.location.origin}/guest/${house.guest_token}`);
                                                                setSuccess('Hlekkur afritaður!');
                                                            }}
                                                            className="p-2 hover:bg-green-100 rounded-lg text-green-700 transition-colors"
                                                            aria-label="Afrita gestahlekk"
                                                        >
                                                            <Copy size={20} aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                    <div className="flex justify-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowGuestPreview(true)}
                                                            className="btn bg-amber-500 text-charcoal hover:bg-amber-600 border-none text-sm px-4"
                                                        >
                                                            <Eye size={16} className="mr-2" aria-hidden="true" />
                                                            Forskoða
                                                        </button>
                                                        <a
                                                            href={`/guest/${house.guest_token}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn bg-green-700 text-white hover:bg-green-800 border-none text-sm px-6"
                                                        >
                                                            Opna síðu<span className="sr-only"> (opnast í nýjum glugga)</span>
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (navigator.share) {
                                                                    navigator.share({
                                                                        title: `Gestasíða - ${house.name}`,
                                                                        url: `${window.location.origin}/guest/${house.guest_token}`
                                                                    });
                                                                }
                                                            }}
                                                            className="btn bg-white text-green-700 border border-green-200 hover:bg-green-50 text-sm px-4"
                                                        >
                                                            Deila
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                                                    <p id="guest-link-readonly-note" className="text-sm text-stone-500">
                                                        {isManager
                                                            ? 'Viltu endurnýja hlekkinn? Gamli hlekkurinn hættir að virka.'
                                                            : 'Aðeins umsjónarmaður hússins getur breytt eða eytt fasta hlekknum.'}
                                                    </p>
                                                    <div className="mt-4 flex gap-2">
                                                        {isManager && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const input = document.querySelector('input[type="file"][data-upload-type="gallery"]') as HTMLInputElement;
                                                                input?.click();
                                                            }}
                                                            className="btn btn-ghost text-stone-500 hover:text-charcoal text-sm"
                                                        >
                                                            <RefreshCw size={14} className="mr-2" aria-hidden="true" />
                                                            Endurnýja
                                                        </button>
                                                        )}
                                                        {isManager && (
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                if (!confirm('Ertu viss? Þetta lokar á aðganginn strax.')) return;
                                                                setLoading(true);
                                                                try {
                                                                    await deleteDoc(doc(db, 'guest_views', house.guest_token!));
                                                                    await updateDoc(doc(db, 'houses', house.id), { guest_token: null });
                                                                    setHouse({ ...house, guest_token: undefined });
                                                                    setSuccess('Gestasíðu eytt');
                                                                } catch (e) {
                                                                    logger.error('Error deleting guest page:', e);
                                                                    setError('Gat ekki eytt síðu');
                                                                } finally {
                                                                    setLoading(false);
                                                                }
                                                            }}
                                                            className="btn btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700 text-sm"
                                                        >
                                                            Eyða<span className="sr-only"> gestasíðu</span>
                                                        </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : !isManager ? (
                                            <div className="text-center py-8">
                                                <h3 className="text-lg font-bold text-charcoal mb-2">Enginn fastur gestahlekkur</h3>
                                                <p className="text-stone-500 max-w-sm mx-auto">
                                                    Aðeins umsjónarmaður hússins getur búið til fastan gestahlekk. Bókunarhlekkirnir hér að ofan virka fyrir alla meðeigendur.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <LinkIcon size={32} className="text-stone-500" aria-hidden="true" />
                                                </div>
                                                <h3 className="text-lg font-bold text-charcoal mb-2">Enginn fastur gestahlekkur</h3>
                                                <p className="text-stone-500 mb-6 max-w-sm mx-auto">
                                                    Þú getur búið til einn fastan hlekk sem er alltaf virkur, til dæmis fyrir fjölskyldumeðlimi.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleGenerateGuestToken(false)}
                                                    disabled={loading}
                                                    className="btn btn-primary"
                                                >
                                                    {loading ? 'Bý til...' : 'Búa til fastan hlekk'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <hr className="border-stone-200" />

                                {!isManager && (
                                    <div id="guest-info-readonly-note" className="bg-amber/10 border border-amber/30 text-charcoal px-4 py-3 rounded text-sm">
                                        Aðeins umsjónarmaður hússins getur breytt gestaupplýsingum. Þú getur skoðað þær hér.
                                    </div>
                                )}
                                {/* House-document fields: disabled unless the user is the manager */}
                                <fieldset disabled={!isManager} aria-describedby={!isManager ? 'guest-info-readonly-note' : undefined} className="space-y-12 min-w-0 border-0 p-0 m-0">
                                <legend className="sr-only">Gestaupplýsingar hússins</legend>

                                {/* Amenities Section */}
                                <section>
                                    <div className="mb-6">
                                        <h2 id={`${baseId}-amenities-h`} className="text-2xl font-serif font-bold text-charcoal mb-2">Þægindi</h2>
                                        <p className="text-grey-mid">Merktu við það sem er í boði í húsinu. Þetta birtist á gestasíðunni.</p>
                                    </div>

                                    <div className="card p-6 border-2 border-stone-100">
                                        <div role="group" aria-labelledby={`${baseId}-amenities-h`} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                { id: 'hot_tub', label: 'Heitur pottur' },
                                                { id: 'grill', label: 'Grill' },
                                                { id: 'tv', label: 'Sjónvarp / Apple TV' },
                                                { id: 'sauna', label: 'Sauna / Gufa' },
                                                { id: 'washer', label: 'Þvottavél' },
                                                { id: 'dishwasher', label: 'Uppþvottavél' },
                                                { id: 'fireplace', label: 'Arinn' },
                                                { id: 'outdoor_furniture', label: 'Verönd / Garðhúsgögn' },
                                                { id: 'kayak', label: 'Kajak / Bátur' },
                                                { id: 'bikes', label: 'Reiðhjól' },
                                                { id: 'games', label: 'Leikir / Spil' },
                                                { id: 'coffee_machine', label: 'Kaffivél' }
                                            ].map(amenity => (
                                                <label key={amenity.id} htmlFor={`${baseId}-amenity-${amenity.id}`} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-stone-50 transition-colors">
                                                    <input
                                                        id={`${baseId}-amenity-${amenity.id}`}
                                                        type="checkbox"
                                                        checked={houseForm.amenities.includes(amenity.id)}
                                                        onChange={(e) => {
                                                            const newAmenities = e.target.checked
                                                                ? [...houseForm.amenities, amenity.id]
                                                                : houseForm.amenities.filter(a => a !== amenity.id);
                                                            setHouseForm({ ...houseForm, amenities: newAmenities });
                                                        }}
                                                        className="w-5 h-5 rounded border-stone-300 text-amber focus:ring-amber"
                                                    />
                                                    <span className="text-sm text-charcoal">{amenity.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <hr className="border-stone-200" />

                                {/* Guest Instructions */}
                                <section>
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-serif font-bold text-charcoal mb-2">Almennar leiðbeiningar</h2>
                                        <p className="text-grey-mid">Frjálst svæði fyrir ráðleggingar og upplýsingar sem gestir ættu að vita.</p>
                                    </div>

                                    <div className="card p-6 border-2 border-stone-100">
                                        <textarea
                                            id={`${baseId}-guest-instr`}
                                            aria-label="Almennar leiðbeiningar fyrir gesti"
                                            className="input min-h-[120px]"
                                            value={editLang === 'is' ? houseForm.guest_instructions : houseForm.guest_instructions_en}
                                            onChange={(e) => setHouseForm({
                                                ...houseForm,
                                                [editLang === 'is' ? 'guest_instructions' : 'guest_instructions_en']: e.target.value
                                            })}
                                            placeholder="t.d. Gott að vita: Heitt vatn tekur 10 mín að hitna. Nálægustu matvöruverslanir eru í Selfossi..."
                                        />
                                        <p className="text-xs text-stone-500 mt-2">
                                            Skiptið á milli íslensku/ensku með tungumálarofanum hér fyrir neðan.
                                        </p>
                                    </div>
                                </section>

                                <hr className="border-stone-200" />

                                {/* Content Editor */}
                                <section>
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-serif font-bold text-charcoal mb-2">Upplýsingar fyrir gesti</h2>
                                        <p className="text-grey-mid">Þessar upplýsingar birtast sjálfkrafa á gestasíðunni.</p>
                                    </div>

                                    <div className="card p-6 border-2 border-stone-100">
                                        <form onSubmit={handleSaveGuestInfo} className="space-y-6 pb-24">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor={`${baseId}-gi-checkin`} className="label">Innritun (kl.)</label>
                                                    <input
                                                        id={`${baseId}-gi-checkin`}
                                                        type="text"
                                                        className="input"
                                                        value={houseForm.check_in_time}
                                                        onChange={(e) => setHouseForm({ ...houseForm, check_in_time: e.target.value })}
                                                        placeholder="16:00"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor={`${baseId}-gi-checkout`} className="label">Útritun (kl.)</label>
                                                    <input
                                                        id={`${baseId}-gi-checkout`}
                                                        type="text"
                                                        className="input"
                                                        value={houseForm.check_out_time}
                                                        onChange={(e) => setHouseForm({ ...houseForm, check_out_time: e.target.value })}
                                                        placeholder="12:00"
                                                    />
                                                </div>
                                            </div>

                                            {/* Language Toggle */}
                                            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                                                <span className="text-sm font-medium text-stone-500">Tungumál lýsingar:</span>
                                                <div role="group" aria-label="Tungumál lýsingar" className="flex bg-stone-100 rounded-lg p-1">
                                                    <button
                                                        type="button"
                                                        aria-pressed={editLang === 'is'}
                                                        onClick={() => setEditLang('is')}
                                                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${editLang === 'is'
                                                            ? 'bg-white text-charcoal shadow-sm'
                                                            : 'text-stone-500 hover:text-stone-700'
                                                            }`}
                                                    >
                                                        🇮🇸 Íslenska
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-pressed={editLang === 'en'}
                                                        onClick={() => setEditLang('en')}
                                                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${editLang === 'en'
                                                            ? 'bg-white text-charcoal shadow-sm'
                                                            : 'text-stone-500 hover:text-stone-700'
                                                            }`}
                                                    >
                                                        🇬🇧 English
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={`transition-all duration-300 ${editLang === 'en' ? 'bg-amber-50/50 p-4 rounded-lg border border-amber-100' : ''}`}>
                                                <div className="mb-4">
                                                    <label htmlFor={`${baseId}-gi-rules`} className="label flex items-center gap-2">
                                                        Húsreglur
                                                        {editLang === 'en' && <span className="text-[10px] uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Enska</span>}
                                                    </label>
                                                    <textarea
                                                        id={`${baseId}-gi-rules`}
                                                        className="input min-h-[100px]"
                                                        value={editLang === 'is' ? houseForm.house_rules : houseForm.house_rules_en}
                                                        onChange={(e) => setHouseForm({
                                                            ...houseForm,
                                                            [editLang === 'is' ? 'house_rules' : 'house_rules_en']: e.target.value
                                                        })}
                                                        placeholder={editLang === 'is' ? "t.d. Reykingar bannaðar. Þrífa eftir sig..." : "e.g. No smoking. Clean up after yourself..."}
                                                    />
                                                </div>

                                                <div className="mb-4">
                                                    <label htmlFor={`${baseId}-gi-directions`} className="label flex items-center gap-2">
                                                        Leiðarlýsing (eða hlekkur á kort)
                                                        {editLang === 'en' && <span className="text-[10px] uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Enska</span>}
                                                    </label>
                                                    <textarea
                                                        id={`${baseId}-gi-directions`}
                                                        className="input"
                                                        value={editLang === 'is' ? houseForm.directions : houseForm.directions_en}
                                                        onChange={(e) => setHouseForm({
                                                            ...houseForm,
                                                            [editLang === 'is' ? 'directions' : 'directions_en']: e.target.value
                                                        })}
                                                        placeholder={editLang === 'is' ? "t.d. Keyrt er í gegnum..." : "e.g. Drive through..."}
                                                    />
                                                    {(houseForm.lat !== 0 && houseForm.lng !== 0) && (
                                                        <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                                                            <CheckCircle size={12} aria-hidden="true" />
                                                            GPS hnit eru skráð. Gestasíðan mun sýna "Rata í hús" takka sjálfkrafa.
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label htmlFor={`${baseId}-gi-access`} className="label flex items-center gap-2">
                                                        Aðgangsleiðbeiningar (Lykilbox ofl.)
                                                        {editLang === 'en' && <span className="text-[10px] uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Enska</span>}
                                                    </label>
                                                    <textarea
                                                        id={`${baseId}-gi-access`}
                                                        className="input"
                                                        value={editLang === 'is' ? houseForm.access_instructions : houseForm.access_instructions_en}
                                                        onChange={(e) => setHouseForm({
                                                            ...houseForm,
                                                            [editLang === 'is' ? 'access_instructions' : 'access_instructions_en']: e.target.value
                                                        })}
                                                        placeholder={editLang === 'is' ? "t.d. Kóði í lykilbox er 1234..." : "e.g. Keybox code is 1234..."}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor={`${baseId}-gi-emergency`} className="label">Neyðarnúmer / Tengiliður</label>
                                                <input
                                                    id={`${baseId}-gi-emergency`}
                                                    type="text"
                                                    className="input"
                                                    value={houseForm.emergency_contact}
                                                    onChange={(e) => setHouseForm({ ...houseForm, emergency_contact: e.target.value })}
                                                    placeholder="Sími 555-1234"
                                                />
                                            </div>

                                            <div className="pt-4 border-t border-stone-100">
                                                <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={loading}>
                                                    <Save className="w-4 h-4 mr-2 inline" aria-hidden="true" />
                                                    Vista upplýsingar
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </section>
                                </fieldset>
                            </div>
                        )}

                        {/* TAB: GUESTBOOK */}
                        {activeTab === 'guestbook' && house && (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Heart className="w-6 h-6 text-amber-ink" aria-hidden="true" />
                                        <h2 className="text-xl font-serif">Gestabók</h2>
                                    </div>
                                    <p className="text-grey-dark mb-6">
                                        Hér geta gestir og fjölskyldumeðlimir skrifað minningar og upplifanir af dvöl sinni í húsinu.
                                        Fagurt skjalasafn til að líta til baka.
                                    </p>
                                    <GuestbookViewer
                                        houseId={house.id}
                                        // Force re-render on delete/success? Simple key change
                                        key={success}
                                        isManager={house.manager_id === currentUser?.uid}
                                        onDeleteEntry={handleDeleteGuestbookEntry}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB: PROFILE / MY SETTINGS */}
                        {activeTab === 'profile' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <UserIcon className="w-6 h-6 text-amber-ink" aria-hidden="true" />
                                    <h2 className="text-xl font-serif">Mínar stillingar</h2>
                                </div>

                                <div className="space-y-6">
                                    {/* Avatar Section */}
                                    <div className="flex flex-col items-center pb-6 border-b border-stone-200">
                                        <div className="relative group cursor-pointer mb-4">
                                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-stone-100">
                                                {currentUser?.avatar ? (
                                                    <img loading="lazy" src={currentUser.avatar} alt="Prófílmynd" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-stone-500">
                                                        <UserIcon size={40} aria-hidden="true" />
                                                    </div>
                                                )}
                                            </div>
                                            <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity cursor-pointer text-white">
                                                <ImageIcon size={24} aria-hidden="true" />
                                                <span className="sr-only">Velja nýja prófílmynd</span>
                                                <input
                                                    id="avatar-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    accept="image/*"
                                                    onChange={handleAvatarSelect}
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                aria-label="Breyta prófílmynd"
                                                className="absolute bottom-0 right-0 bg-amber text-charcoal p-1.5 rounded-full shadow-sm hover:bg-amber-dark transition-colors"
                                                onClick={() => {
                                                    const input = document.getElementById('avatar-upload') as HTMLInputElement;
                                                    input?.click();
                                                }}
                                            >
                                                <Edit2 size={12} aria-hidden="true" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-stone-500">Smelltu á myndina til að breyta</p>
                                    </div>

                                    <div>
                                        <p id={`${baseId}-lang-h`} className="label">Tungumál</p>
                                        <div role="group" aria-labelledby={`${baseId}-lang-h`} className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            {[
                                                { code: 'is', label: '🇮🇸 Íslenska' },
                                                { code: 'en', label: '🇬🇧 English' },
                                                { code: 'de', label: '🇩🇪 Deutsch' },
                                                { code: 'fr', label: '🇫🇷 Français' },
                                                { code: 'es', label: '🇪🇸 Español' },
                                            ].map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    type="button"
                                                    aria-pressed={currentUser?.language === lang.code}
                                                    onClick={() => handleUpdateLanguage(lang.code as any)}
                                                    className={`
                            p-3 rounded-lg border text-sm font-medium transition-all
                            ${currentUser?.language === lang.code
                                                            ? 'border-amber bg-amber/10 text-charcoal ring-1 ring-amber'
                                                            : 'border-grey-warm hover:border-grey-mid'
                                                        }
                          `}
                                                >
                                                    {lang.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-grey-warm">
                                        <label htmlFor={`${baseId}-user-name`} className="label">Nafn</label>
                                        <div className="flex gap-2">
                                            <input
                                                id={`${baseId}-user-name`}
                                                type="text"
                                                className="input max-w-md"
                                                value={userName}
                                                onChange={(e) => setUserName(e.target.value)}
                                                placeholder="Nafn..."
                                                aria-describedby={`${baseId}-user-name-help`}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSaveProfile}
                                                disabled={loading || !userName.trim() || userName === currentUser?.name}
                                                className="btn btn-primary whitespace-nowrap"
                                            >
                                                Vista
                                            </button>
                                        </div>
                                        <p id={`${baseId}-user-name-help`} className="text-xs text-grey-mid mt-1">Hér getur þú breytt nafninu þínu sem birtist öðrum notendum.</p>
                                    </div>

                                    {/* Granular Notification Settings */}
                                    <div className="pt-8 border-t border-stone-200">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-amber-50 rounded-lg text-amber-ink">
                                                <Bell size={20} aria-hidden="true" />
                                            </div>
                                            <div>
                                                <h3 className="font-serif text-lg font-bold">Tilkynningar</h3>
                                                <p className="text-xs text-stone-500">Stjórnaðu hvernig og hvenær þú færð tilkynningar.</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-8">
                                            {/* Email Notifications */}
                                            <div role="group" aria-labelledby={`${baseId}-notif-email-h`} className="space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Mail size={16} className="text-stone-500" aria-hidden="true" />
                                                    <h4 id={`${baseId}-notif-email-h`} className="text-sm font-bold uppercase tracking-wider text-stone-600">Tölvupóstur</h4>
                                                </div>

                                                <Toggle
                                                    variant="row"
                                                    label="Nýjar bókanir"
                                                    description="Fá tölvupóst þegar húsfélagsmeðlimur bókar"
                                                    checked={notificationSettings.emails.new_bookings}
                                                    onChange={(val) => handleUpdateNotificationSettings('emails', 'new_bookings', val)}
                                                />
                                                <Toggle
                                                    variant="row"
                                                    label="Verkefni"
                                                    description="Áminningar um verkefni sem eiga að klárast"
                                                    checked={notificationSettings.emails.task_reminders}
                                                    onChange={(val) => handleUpdateNotificationSettings('emails', 'task_reminders', val)}
                                                />
                                                <Toggle
                                                    variant="row"
                                                    label="Veðurviðvaranir"
                                                    description="Fá sjarmerandi veðuráminningar fyrir dvalir"
                                                    checked={notificationSettings.emails.weather_alerts}
                                                    onChange={(val) => handleUpdateNotificationSettings('emails', 'weather_alerts', val)}
                                                />
                                            </div>

                                            {/* In-App Notifications */}
                                            <div role="group" aria-labelledby={`${baseId}-notif-app-h`} className="space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Bell size={16} className="text-stone-500" aria-hidden="true" />
                                                    <h4 id={`${baseId}-notif-app-h`} className="text-sm font-bold uppercase tracking-wider text-stone-600">Í forritinu</h4>
                                                </div>

                                                <Toggle
                                                    variant="row"
                                                    label="Nýjar bókanir"
                                                    description="Tilkynning á stjórnborði þegar ný bókun kemur"
                                                    checked={notificationSettings.in_app.new_bookings}
                                                    onChange={(val) => handleUpdateNotificationSettings('in_app', 'new_bookings', val)}
                                                />
                                                <Toggle
                                                    variant="row"
                                                    label="Gestabók"
                                                    description="Þegar gestir skrifa í gestabókina"
                                                    checked={notificationSettings.in_app.guestbook_entries}
                                                    onChange={(val) => handleUpdateNotificationSettings('in_app', 'guestbook_entries', val)}
                                                />
                                                <Toggle
                                                    variant="row"
                                                    label="Veðurviðvaranir"
                                                    description="Veðurspá og aðstæður á stjórnborði"
                                                    checked={notificationSettings.in_app.weather_alerts}
                                                    onChange={(val) => handleUpdateNotificationSettings('in_app', 'weather_alerts', val)}
                                                />
                                            </div>

                                            {/* Push Notifications */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div aria-hidden="true" className="w-4 h-4 rounded-full bg-amber flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                    </div>
                                                    <h4 className="text-sm font-bold uppercase tracking-wider text-stone-600">Push-tilkynningar</h4>
                                                </div>

                                                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                                                    <p className="text-xs text-stone-500 mb-4">
                                                        Virkaðu push-tilkynningar til að fá skilaboð beint í símann þinn (eins og "native" app).
                                                    </p>

                                                    {currentUser?.fcm_tokens && currentUser.fcm_tokens.length > 0 ? (
                                                        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                                            <Check size={14} aria-hidden="true" />
                                                            <span className="text-xs font-bold">Virkjað á þessu tæki</span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                if (!currentUser) return;
                                                                const token = await requestPushPermission(currentUser);
                                                                if (token) {
                                                                    setSuccess('Push-tilkynningar virkjaðar!');
                                                                    // We need to refresh the UI state or rely on currentUser from store updating
                                                                } else {
                                                                    setError('Gat ekki virkjað tilkynningar. Athugaðu leyfi í vafranum.');
                                                                }
                                                            }}
                                                            className="w-full btn btn-primary text-xs py-2"
                                                        >
                                                            Virkja í þessum síma/vafra
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-grey-warm">
                                        <p className="label">Netfang & Aðgangur</p>
                                        <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <div>
                                                    <p className="text-sm font-bold text-charcoal">Netfang</p>
                                                    <p className="text-stone-600 font-mono text-sm">{currentUser?.email}</p>
                                                </div>
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Virkt</span>
                                            </div>
                                            <div className="pt-3 border-t border-stone-200 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={handlePasswordReset}
                                                    className="text-sm font-bold text-amber-ink hover:text-amber-dark flex items-center gap-1 hover:underline"
                                                >
                                                    <RefreshCw size={14} aria-hidden="true" />
                                                    Endurstilla lykilorð (Senda tölvupóst)
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {canChangeMembership && (
                                        <div className="pt-8 border-t border-red-200">
                                            <div className="flex items-center gap-2 mb-2 text-red-600">
                                                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                                                <h3 className="font-serif text-lg font-bold">Eyða aðgangi</h3>
                                            </div>
                                            <p className="text-sm text-stone-600 mb-4 max-w-xl">
                                                Aðgangnum þínum er eytt varanlega. Hús þar sem þú ert eini eigandinn eyðast með öllum bókunum,
                                                fjármálum, verkefnum og gestahlekkjum. Í öðrum húsum ert þú fjarlægð(ur) og ef þú ert umsjónarmaður
                                                tekur næsti meðeigandi við.
                                            </p>
                                            <button
                                                onClick={() => openMembershipAction({ type: 'delete_account' })}
                                                className="btn btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                Eyða aðgangi
                                            </button>
                                        </div>
                                    )}

                                    <div className="pt-8 border-t border-grey-warm flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="btn btn-ghost text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                                            Skrá út
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty State / Loading safety */}
                        {!house && !loading && (
                            <div className="text-center py-12">
                                <p className="text-grey-dark">Engin hús fundust. Vinsamlegast búðu til hús fyrst.</p>
                            </div>
                        )}

                        {/* Feedback Button (Mobile Friendly way to get there) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 w-full md:w-80 flex-shrink-0">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquarePlus className="text-amber-ink" size={24} aria-hidden="true" />
                                <h3 className="font-serif font-bold text-lg text-[#1a1a1a]">Gefa umsögn</h3>
                            </div>
                            <p className="text-stone-600 mb-4 text-sm">
                                Hvað finnst þér um Bústaðinn.is? Við viljum endilega heyra frá þér til að gera kerfið enn betra.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowFeedbackModal(true)}
                                className="btn btn-secondary w-full border-stone-200 hover:bg-stone-50"
                            >
                                Senda ábendingu
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <FeedbackModal
                isOpen={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
            />

            {
                showGuestPreview && house && (
                    <GuestPreviewModal
                        isOpen={showGuestPreview}
                        onClose={() => setShowGuestPreview(false)}
                        house={house}
                    />
                )
            }

            {
                showCropper && imageFile && (
                    <ImageCropper
                        image={imageFile}
                        onCropComplete={handleCroppedImage}
                        onCancel={() => {
                            setShowCropper(false);
                            setImageFile(null);
                        }}
                        aspectRatio={
                            cropMode === 'avatar' ? 1 : 
                            cropMode === 'main' ? 16 / 9 : 
                            undefined
                        }
                        showSkipCrop={cropMode !== 'avatar'}
                    />
                )
            }

            {/* Upload Progress Overlay */}
            {
                uploadingImage && (
                    <Modal
                        open
                        onClose={() => { /* upload cannot be dismissed */ }}
                        title="Hleður upp mynd..."
                        size="sm"
                        dismissible={false}
                    >
                        <div className="text-center">
                            <div aria-hidden="true" className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber/20 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-amber-ink animate-spin" />
                            </div>
                            <div
                                role="progressbar"
                                aria-label="Framvinda upphleðslu"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={uploadProgress}
                                className="w-full bg-stone-200 rounded-full h-3 mb-2 overflow-hidden"
                            >
                                <div
                                    className="bg-gradient-to-r from-amber to-orange-500 h-3 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p role="status" className="text-sm text-stone-500 font-medium">{uploadProgress}%</p>
                        </div>
                    </Modal>
                )
            }

            {/* Membership action modal (leave / remove / delete house / delete account) */}
            {
                membershipAction && (() => {
                    const type = membershipAction.type;
                    const others = members.filter((m) => m.uid !== currentUser?.uid);
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

            {/* Ownership Transfer Modal */}
            {
                memberToTransfer && (
                    <Modal
                        open
                        onClose={() => {
                            setMemberToTransfer(null);
                            setTransferConfirmation('');
                        }}
                        title="Flytja Eignarhald?"
                        size="md"
                        dismissible={!transferBusy}
                        footer={
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMemberToTransfer(null);
                                        setTransferConfirmation('');
                                    }}
                                    disabled={transferBusy}
                                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-md text-sm font-medium transition-colors"
                                >
                                    Hætta við
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTransferOwnership}
                                    disabled={transferConfirmation !== 'SAMÞYKKJA' || transferBusy}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    Staðfesta Flutning
                                </button>
                            </>
                        }
                    >
                        <div>
                            <p className="text-stone-600 mb-4 text-sm leading-relaxed">
                                Þú ert að fara að gera <strong>{memberToTransfer.name || memberToTransfer.email}</strong> að umsjónarmanni hússins.
                            </p>

                            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-800">
                                <strong>Aðvörun:</strong> Þú munt missa umsjónarréttindi (húsupplýsingar, stillingar, o.fl.) og verður venjulegur meðeigandi.
                            </div>

                            <label htmlFor={`${baseId}-transfer-confirm`} className="block text-xs text-stone-500 mb-2 uppercase font-bold tracking-wide">
                                Skrifaðu "SAMÞYKKJA" til að staðfesta:
                            </label>

                            <input
                                id={`${baseId}-transfer-confirm`}
                                type="text"
                                className="w-full border border-stone-300 rounded-md px-3 py-2 font-mono text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 uppercase"
                                placeholder="SAMÞYKKJA"
                                value={transferConfirmation}
                                onChange={(e) => setTransferConfirmation(e.target.value.toUpperCase())}
                                autoComplete="off"
                            />
                        </div>
                    </Modal>
                )
            }
            <MobileNav />
        </div >
    );
}

