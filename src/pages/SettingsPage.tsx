import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { db, storage, auth } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
    Home,
    Users,
    BookOpen,
    Heart,
    User as UserIcon,
    LogOut,
    CheckCircle,
    Save,
    Shield,
    Wifi,
    Edit2,
    X,
    Upload,
    Loader2,
    Image as ImageIcon,
    AlertTriangle,
    Copy,
    RefreshCw,
    Link as LinkIcon,
    Bell,
    Mail,
    Check,
    Trash2,
    Plus
} from 'lucide-react';
import { requestPushPermission } from '@/utils/pushNotifications';
import ImageCropper from '@/components/ImageCropper';
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
    arrayRemove
} from 'firebase/firestore';
import MagicLinkGenerator from '@/components/guest/MagicLinkGenerator';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import type { House, User, NotificationSettings, ShoppingItem, InternalLog } from '@/types/models';
import { searchHMSAddresses, formatHMSAddress } from '@/utils/hmsSearch';
import { MapPin } from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import GuestbookViewer from '@/components/GuestbookViewer';
import ShoppingList from '@/components/ShoppingList';
import InternalLogbook from '@/components/InternalLogbook';
import { updateUserNameInAllCollections } from '@/services/userService';
import { ShoppingBag, ClipboardList } from 'lucide-react';
import { logger } from '@/utils/logger'; // Ensure imports

type Tab = 'house' | 'members' | 'profile' | 'guests' | 'guestbook' | 'shopping' | 'logs';


// ... other imports

export default function SettingsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser, isImpersonating } = useEffectiveUser();
    const { startImpersonation } = useImpersonation();
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);

    const [activeTab, setActiveTab] = useState<Tab>(() => {
        const state = location.state as { initialTab?: Tab };
        return state?.initialTab || 'house';
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

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
        privacy_hide_finances: false,
        finance_viewer_ids: [] as string[]
    });

    // Language Toggle for dual-input fields
    const [editLang, setEditLang] = useState<'is' | 'en'>('is');

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [debounceTimer, setDebounceTimer] = useState<any>(null);
    const [members, setMembers] = useState<User[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [membersError, setMembersError] = useState('');
    const [isEditingLocation, setIsEditingLocation] = useState(false);

    // Ownership Transfer State
    const [memberToTransfer, setMemberToTransfer] = useState<User | null>(null);
    const [transferConfirmation, setTransferConfirmation] = useState('');
    const [imageFile, setImageFile] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [cropMode, setCropMode] = useState<'main' | 'gallery' | 'avatar'>('main');

    // Shopping & Logs State
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
    const [logs, setLogs] = useState<InternalLog[]>([]);

    // Fetch Shopping List
    useEffect(() => {
        if (activeTab === 'shopping' && house?.id) {
            const q = query(
                collection(db, 'houses', house.id, 'shopping_list'),
                orderBy('created_at', 'desc')
            );
            // Use onSnapshot for realtime updates
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingItem));
                setShoppingItems(items);
            });
            return () => unsubscribe();
        }
    }, [activeTab, house?.id]);

    // Fetch Internal Logs
    useEffect(() => {
        if (activeTab === 'logs' && house?.id) {
            const fetchLogs = async () => {
                const q = query(
                    collection(db, 'houses', house.id, 'internal_logs'),
                    orderBy('created_at', 'desc')
                );
                const snapshot = await getDocs(q);
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InternalLog));
                setLogs(items);
            };
            fetchLogs();
        }
    }, [activeTab, house?.id]);

    // Shopping handlers
    const handleToggleShoppingItem = async (item: ShoppingItem) => {
        if (!house) return;
        await updateDoc(doc(db, 'houses', house.id, 'shopping_list', item.id), { checked: !item.checked });
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
    };

    // Log handlers
    const handleAddLog = async (text: string) => {
        if (!house || !currentUser) return;
        const newLog = {
            house_id: house.id,
            user_id: currentUser.uid,
            user_name: currentUser.name || 'Óþekktur',
            text: text,
            created_at: new Date()
        };
        const docRef = await addDoc(collection(db, 'houses', house.id, 'internal_logs'), newLog);
        setLogs(prev => [{ id: docRef.id, ...newLog } as InternalLog, ...prev]);
    };

    const handleDeleteLog = async (log: InternalLog) => {
        if (!house || !currentUser) return;
        if (!confirm('Ertu viss um að þú viljir eyða þessari færslu?')) return;

        try {
            await deleteDoc(doc(db, 'houses', house.id, 'internal_logs', log.id));
            setLogs(prev => prev.filter(l => l.id !== log.id));
            setSuccess('Færslu eytt');
            setTimeout(() => setSuccess(''), 2000);
        } catch (e) {
            console.error('Error deleting log:', e);
            setError('Gat ekki eytt færslu');
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
            console.error('Error deleting guestbook entry:', e);
            setError('Gat ekki eytt færslu');
        }
    };

    // Invite State
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);

    const handleRevokeInvite = async (inviteId: string) => {
        if (!confirm('Ertu viss um að þú viljir afturkalla þetta boð?')) return;
        try {
            await deleteDoc(doc(db, 'invitations', inviteId));
            setInvitations(prev => prev.filter(i => i.id !== inviteId));
            setSuccess('Boð afturkallað.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            console.error('Error revoking invite:', e);
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

            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Failed to send invite');

            setSuccess(data.message || 'Boð sent!');
            setInviteEmail('');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            console.error('Invite error:', err);
            setError(err.message || 'Gat ekki sent boð.');
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

            // Update name globally in all collections
            await updateUserNameInAllCollections(currentUser.uid, userName.trim(), currentUser.house_ids || []);

            const updatedUser = { ...currentUser, name: userName.trim() };

            if (isImpersonating) {
                startImpersonation(updatedUser);
            } else {
                setCurrentUser(updatedUser);
            }

            setSuccess('Nafni breytt!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
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
            console.error('Logout error:', err);
        }
    };

    const handlePasswordReset = async () => {
        if (!currentUser?.email) return;
        try {
            await sendPasswordResetEmail(auth, currentUser.email);
            setSuccess(`Tölvupóstur sendur á ${currentUser.email}. Athugaðu ruslpóstinn ef hann berst ekki.`);
        } catch (err) {
            console.error('Error sending password reset:', err);
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
            console.error('Error updating language', e);
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
            console.error('Error updating notification settings:', err);
            setError('Gat ekki uppfært tilkynningastillingar.');
            // Revert on error
            setNotificationSettings(notificationSettings);
        }
    };

    const Toggle = ({ label, description, checked, onChange, disabled }: {
        label: string,
        description: string,
        checked: boolean,
        onChange: (val: boolean) => void,
        disabled?: boolean
    }) => (
        <div className={`flex items-start justify-between py-2 ${disabled ? 'opacity-50' : ''}`}>
            <div className="flex-1 mr-4">
                <p className="text-sm font-bold text-charcoal">{label}</p>
                <p className="text-xs text-stone-500">{description}</p>
            </div>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none 
                    ${checked ? 'bg-amber' : 'bg-stone-200'}
                `}
            >
                <span
                    className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                        transition duration-200 ease-in-out
                        ${checked ? 'translate-x-5' : 'translate-x-0'}
                    `}
                />
            </button>
        </div>
    );

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCropMode('main'); // Default to house
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
            console.error("No house object found in handleCroppedImage");
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
                    console.error('Upload error:', error);
                    throw error;
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
                        image_url: updatedHouse.image_url || '',
                        gallery_urls: updatedHouse.gallery_urls || [],
                        updated_at: serverTimestamp()
                    }, { merge: true });
                } catch (guestErr) {
                    console.error("Error syncing with guest view:", guestErr);
                }
            }
        } catch (error: any) {
            console.error('Error uploading image:', error);
            setError(`Villa við að vista mynd: ${error.message}`);
        } finally {
            setUploadingImage(false);
            setUploadProgress(0);
        }
    };

    const handleRemoveGalleryImage = async (url: string) => {
        if (!house || !house.gallery_urls) return;
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
                    console.error("Error syncing gallery deletion with guest view:", guestErr);
                }
            }
        } catch (error) {
            console.error("Error removing gallery image", error);
            setError('Gat ekki eytt mynd.');
        } finally {
            setLoading(false);
        }
    };

    const handleTransferOwnership = async () => {
        if (!house || !currentUser || !memberToTransfer) return;

        try {
            await updateDoc(doc(db, 'houses', house.id), {
                manager_id: memberToTransfer.uid,
                updated_at: serverTimestamp()
            });

            setHouse({ ...house, manager_id: memberToTransfer.uid });
            setSuccess(`Eignarhaldi flutt yfir á ${memberToTransfer.name || memberToTransfer.email}`);
            setMemberToTransfer(null);
            setTransferConfirmation('');
        } catch (e) {
            console.error('Error transferring ownership:', e);
            setError('Villa kom upp við að færa eignarhald.');
        }
    };

    const currentHouse = useAppStore((state) => state.currentHouse);

    useEffect(() => {
        if (!currentUser?.house_ids?.[0]) return;

        const loadHouse = async () => {
            setLoading(true);
            try {
                // Prioritize the globally selected house, otherwise default to first available
                const houseId = currentHouse?.id || currentUser.house_ids[0];
                const houseSnap = await getDoc(doc(db, 'houses', houseId));

                if (houseSnap.exists()) {
                    const houseData = { id: houseSnap.id, ...houseSnap.data() } as House;

                    // Auto-generate invite code if missing (for legacy houses)
                    if (!houseData.invite_code && houseData.manager_id === currentUser.uid) {
                        logger.info('Auto-generating invite code for house:', houseId);
                        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                        try {
                            await updateDoc(doc(db, 'houses', houseId), {
                                invite_code: newCode
                            });
                            houseData.invite_code = newCode;
                            logger.info('Invite code generated:', newCode);
                        } catch (err) {
                            console.error('Failed to generate invite code:', err);
                        }
                    } else {
                        console.log('Invite code status:', {
                            hasCode: !!houseData.invite_code,
                            isManager: houseData.manager_id === currentUser.uid,
                            code: houseData.invite_code
                        });
                    }

                    setHouse(houseData);
                    setHouseForm({
                        name: houseData.name || '',
                        address: houseData.address || '',
                        lat: houseData.location?.lat || 0,
                        lng: houseData.location?.lng || 0,
                        invite_code: houseData.invite_code || '',
                        wifi_ssid: houseData.wifi_ssid || '',
                        wifi_password: houseData.wifi_password || '',
                        holiday_mode: houseData.holiday_mode || 'first_come',
                        house_rules: houseData.house_rules || '',
                        house_rules_en: houseData.house_rules_en || '',
                        check_in_time: houseData.check_in_time || '',
                        check_out_time: houseData.check_out_time || '',
                        directions: houseData.directions || '',
                        directions_en: houseData.directions_en || '',
                        access_instructions: houseData.access_instructions || '',
                        access_instructions_en: houseData.access_instructions_en || '',
                        emergency_contact: houseData.emergency_contact || '',
                        privacy_hide_finances: houseData.privacy_hide_finances || false,
                        finance_viewer_ids: houseData.finance_viewer_ids || []
                    });
                }
            } catch (err) {
                console.error('Error loading house:', err);
                setError('Gat ekki sótt upplýsingar um sumarhúsið.');
            } finally {
                setLoading(false);
            }
        };

        loadHouse();
    }, [currentUser?.house_ids]);

    // Allow any owner to edit house settings, not just the designated manager
    const isManager = house && currentUser && house.owner_ids?.includes(currentUser.uid);

    const handleDeleteHouse = async () => {
        if (!house || !currentUser) return;
        if (!confirm('Ertu viss um að þú viljir eyða þessu húsi? Þessu er ekki hægt að afturkalla.')) return;
        if (!confirm('ALLAR UPPLÝSINGAR MUNU EYÐAST: Bókanir, fjármál, verkefni o.s.frv. Ertu alveg viss?')) return;

        setLoading(true);
        try {
            // 1. Remove house from all owners' house_ids using atomic arrayRemove
            const owners = house.owner_ids || [];
            await Promise.all(owners.map(uid =>
                updateDoc(doc(db, 'users', uid), {
                    house_ids: arrayRemove(house.id)
                }).catch(e => console.warn(`Failed to remove house from user ${uid}`, e))
            ));

            // 2. Delete the house document
            // Note: Subcollections (bookings, tasks etc) are NOT automatically deleted by Firestore
            // but they become inaccessible. A Cloud Function is usually best for recursive delete.
            await deleteDoc(doc(db, 'houses', house.id));

            // 3. Update local state
            const currentHouseIds = (currentUser.house_ids || []).filter(id => id !== house.id);
            setCurrentUser({
                ...currentUser,
                house_ids: currentHouseIds
            });

            // 4. Navigate
            if (currentHouseIds.length > 0) {
                // Switch to another house
                const nextHouseSnap = await getDoc(doc(db, 'houses', currentHouseIds[0]));
                if (nextHouseSnap.exists()) {
                    const nextHouse = { id: nextHouseSnap.id, ...nextHouseSnap.data() } as House;
                    setCurrentHouse(nextHouse);
                    localStorage.setItem('last_house_id', nextHouse.id);
                    navigate('/dashboard');
                } else {
                    setCurrentHouse(null);
                    navigate('/onboarding');
                }
            } else {
                setCurrentHouse(null);
                navigate('/onboarding');
            }

        } catch (error) {
            console.error('Error deleting house:', error);
            setError('Gat ekki eytt húsi. Vinsamlegast reyndu aftur.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Members
    useEffect(() => {
        if (activeTab === 'members' && house?.owner_ids?.length) {
            const fetchMembers = async () => {
                setLoadingMembers(true);
                setMembersError('');
                try {
                    // Note: Firestore 'in' query supports max 10. Using Promise.all for robustness.
                    const promises = house.owner_ids.map(uid => getDoc(doc(db, 'users', uid)));
                    const docs = await Promise.all(promises);
                    const users = docs.map(d => {
                        if (d.exists()) {
                            return { uid: d.id, ...d.data() } as User;
                        }
                        return null;
                    }).filter((u): u is User => u !== null);

                    setMembers(users);

                    // Also fetch invitations
                    const qInvites = query(collection(db, 'invitations'), where('house_id', '==', house.id));
                    const inviteSnap = await getDocs(qInvites);
                    const invites = inviteSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setInvitations(invites);

                } catch (err) {
                    console.error("Error fetching members", err);
                    setMembersError('Gat ekki sótt lista yfir meðeigendur.');
                } finally {
                    setLoadingMembers(false);
                }
            };
            fetchMembers();
        }
    }, [activeTab, house?.owner_ids]);

    const handleSaveHouse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!house || !isManager) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const updates = {
                name: houseForm.name,
                address: houseForm.address,
                location: {
                    lat: Number(houseForm.lat) || 0,
                    lng: Number(houseForm.lng) || 0
                },
                wifi_ssid: houseForm.wifi_ssid,
                wifi_password: houseForm.wifi_password,
                holiday_mode: houseForm.holiday_mode as any,
                house_rules: houseForm.house_rules,
                house_rules_en: houseForm.house_rules_en,
                check_in_time: houseForm.check_in_time,
                check_out_time: houseForm.check_out_time,
                directions: houseForm.directions,
                directions_en: houseForm.directions_en,
                access_instructions: houseForm.access_instructions,
                access_instructions_en: houseForm.access_instructions_en,

                emergency_contact: houseForm.emergency_contact,
                privacy_hide_finances: houseForm.privacy_hide_finances,
                finance_viewer_ids: houseForm.finance_viewer_ids || [],
                updated_at: new Date()
            };

            await updateDoc(doc(db, 'houses', house.id), updates);

            // Sync Guest View
            if (house.guest_token) {
                await setDoc(doc(db, 'guest_views', house.guest_token), {
                    houseId: house.id,
                    name: houseForm.name,
                    address: houseForm.address,
                    wifi_ssid: houseForm.wifi_ssid,
                    wifi_password: houseForm.wifi_password,
                    house_rules: houseForm.house_rules,
                    house_rules_en: houseForm.house_rules_en,
                    check_in_time: houseForm.check_in_time,
                    check_out_time: houseForm.check_out_time,
                    directions: houseForm.directions,
                    directions_en: houseForm.directions_en,
                    access_instructions: houseForm.access_instructions,
                    access_instructions_en: houseForm.access_instructions_en,
                    emergency_contact: houseForm.emergency_contact,
                    location: {
                        lat: houseForm.lat,
                        lng: houseForm.lng
                    },
                    image_url: house.image_url || '',
                    gallery_urls: house.gallery_urls || [],
                    updated_at: new Date()
                }, { merge: true });
            }

            const updatedHouse = { ...house, ...updates } as House;
            setHouse(updatedHouse);
            setCurrentHouse(updatedHouse);
            setSuccess('Breytingar vistaðar!');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating house:', err);
            setError('Villa kom upp við að vista breytingar.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateInvite = async () => {
        if (!house || !isManager) return;
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        try {
            await updateDoc(doc(db, 'houses', house.id), {
                invite_code: newCode
            });
            setHouseForm(prev => ({ ...prev, invite_code: newCode }));
            setHouse(prev => prev ? { ...prev, invite_code: newCode } : null);
            setSuccess('Nýr boðshlekkur búinn til!');
        } catch (err) {
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
                    console.error("HMS search error in settings", e);
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
        if (replace && !confirm('Ertu viss? Gamli hlekkurinn mun hætta að virka.')) return;
        if (!house) return;

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

            const newToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

            // Create new view
            await setDoc(doc(db, 'guest_views', newToken), {
                houseId: house.id,
                name: houseForm.name,
                address: houseForm.address,
                wifi_ssid: houseForm.wifi_ssid,
                wifi_password: houseForm.wifi_password,
                house_rules: houseForm.house_rules,
                house_rules_en: houseForm.house_rules_en,
                check_in_time: houseForm.check_in_time,
                check_out_time: houseForm.check_out_time,
                directions: houseForm.directions,
                directions_en: houseForm.directions_en,
                access_instructions: houseForm.access_instructions,
                access_instructions_en: houseForm.access_instructions_en,
                emergency_contact: houseForm.emergency_contact,
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
            console.error(err);
            setError('Villa við að búa til hlekk.');
        } finally {
            setLoading(false);
        }
    };



    if (loading && !house) {
        return <div className="p-8 text-center text-grey-mid">Hleð...</div>;
    }

    return (
        <div className="min-h-screen bg-bone pb-24">
            {/* Header */}
            <div className="bg-white border-b border-grey-warm">
                <div className="container mx-auto px-6 py-6">
                    <button
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
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <button
                                onClick={() => setActiveTab('house')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'house'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <Home className="w-5 h-5" />
                                <span>Húsupplýsingar</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('shopping')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'shopping'
                                    ? 'bg-amber text-charcoal font-bold'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <ShoppingBag className="w-5 h-5" />
                                <span>Innkaupalisti</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'logs'
                                    ? 'bg-amber text-charcoal font-bold'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <ClipboardList className="w-5 h-5" />
                                <span>Rekstrarbók</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('members')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'members'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <Users className="w-5 h-5" />
                                <span>Meðeigendur</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('guests')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'guests'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <BookOpen className="w-5 h-5" />
                                <span>Gestaupplýsingar</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('guestbook')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'guestbook'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <Heart className="w-5 h-5" />
                                <span>Gestabók (Journal)</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'profile'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <UserIcon className="w-5 h-5" />
                                <span>Mínar stillingar</span>
                            </button>


                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left border-t border-grey-warm text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Skrá út</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Feedback Messages */}
                        {success && (
                            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                                {success}
                            </div>
                        )}
                        {error && (
                            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                                {error}
                            </div>
                        )}

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
                                <h2 className="text-xl font-serif font-bold mb-4">Rekstrarbók</h2>
                                <p className="text-stone-500 mb-6">Skráðu niður verkefni, viðhald eða ábendingar.</p>
                                <InternalLogbook
                                    logs={logs}
                                    currentUserName={currentUser?.name || ''}
                                    currentUserUid={currentUser?.uid}
                                    isManager={house?.manager_id === currentUser?.uid}
                                    onAddLog={handleAddLog}
                                    onDeleteLog={handleDeleteLog}
                                />
                            </div>
                        )}

                        {/* TAB: HOUSE INFO */}
                        {activeTab === 'house' && house && (
                            <div className="space-y-6">

                                {/* House Image Upload */}
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <ImageIcon className="w-6 h-6 text-amber" />
                                        <h2 className="text-xl font-serif">Myndir af húsinu</h2>
                                    </div>

                                    <div className="space-y-6">
                                        {/* MAIN IMAGE */}
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">Aðalmynd (Cover)</h3>
                                            {house.image_url ? (
                                                <div className="relative aspect-video rounded-lg overflow-hidden border border-stone-200 group">
                                                    <img src={house.image_url} alt={house.name} className="w-full h-full object-cover" />
                                                    <label className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-stone-600 border border-stone-200 cursor-pointer hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                                        <span className="flex items-center gap-2">
                                                            <Upload className="w-3 h-3" /> Skipta um mynd
                                                        </span>
                                                        <input type="file" accept="image/*" onChange={(e) => {
                                                            setCropMode('main');
                                                            handleImageSelect(e);
                                                        }} className="hidden" />
                                                    </label>
                                                </div>
                                            ) : (
                                                <label className="border-2 border-dashed border-stone-300 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-amber transition-colors bg-stone-50">
                                                    <Upload className="w-8 h-8 text-stone-400 mb-3" />
                                                    <p className="text-stone-600 font-medium mb-1">Hlaða upp aðalmynd</p>
                                                    <p className="text-stone-400 text-xs text-center">Þessi mynd birtist á stjórnborði og gestasíðu.</p>
                                                    <input type="file" accept="image/*" onChange={(e) => {
                                                        setCropMode('main');
                                                        handleImageSelect(e);
                                                    }} className="hidden" />
                                                </label>
                                            )}
                                        </div>

                                        {/* GALLERY */}
                                        <div className="pt-6 border-t border-stone-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">Gallerí</h3>
                                                <label className="text-xs font-bold text-amber hover:underline cursor-pointer flex items-center gap-1.5">
                                                    <Plus className="w-3.5 h-3.5" /> Bæta við myndum
                                                    <input type="file" accept="image/*" onChange={(e) => {
                                                        setCropMode('gallery');
                                                        handleImageSelect(e);
                                                    }} className="hidden" />
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {house.gallery_urls?.map((url, idx) => (
                                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-stone-100 group shadow-sm bg-stone-100">
                                                        <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => handleRemoveGalleryImage(url)}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* ADD BOX */}
                                                <label className="aspect-square border-2 border-dashed border-stone-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber hover:bg-amber-50/30 transition-all text-stone-400">
                                                    <Plus size={20} />
                                                    <span className="text-[10px] font-bold mt-1 uppercase tracking-tight">Ný mynd</span>
                                                    <input type="file" accept="image/*" onChange={(e) => {
                                                        setCropMode('gallery');
                                                        handleImageSelect(e);
                                                    }} className="hidden" />
                                                </label>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* General Info */}
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Home className="w-6 h-6 text-amber" />
                                        <h2 className="text-xl font-serif">Grunnupplýsingar</h2>
                                    </div>

                                    <form onSubmit={handleSaveHouse} className="space-y-4">
                                        <div>
                                            <label className="label">Nafn sumarhúss</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={houseForm.name}
                                                onChange={(e) => setHouseForm({ ...houseForm, name: e.target.value })}
                                                disabled={!isManager}
                                            />
                                        </div>

                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="label">
                                                    Heimilisfang & Staðsetning
                                                    {houseForm.lat === 0 && (
                                                        <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-sans font-medium uppercase tracking-wide">
                                                            Vantar GPS
                                                        </span>
                                                    )}
                                                </label>
                                                {isManager && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsEditingLocation(!isEditingLocation)}
                                                        className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${isEditingLocation
                                                            ? 'bg-[#e8b058] text-white hover:bg-[#d4a04d]'
                                                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                                            }`}
                                                    >
                                                        {isEditingLocation ? (
                                                            <><X size={14} /> Loka</>
                                                        ) : (
                                                            <><Edit2 size={14} /> Breyta</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            {isEditingLocation && (
                                                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <p className="text-xs text-amber-800 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                                        Breytingarham virkur - Leitaðu að heimilisfangi hér að neðan
                                                    </p>
                                                </div>
                                            )}
                                            <input
                                                type="text"
                                                className={`input ${isEditingLocation ? 'border-[#e8b058] border-2' : ''}`}
                                                value={houseForm.address}
                                                onChange={(e) => handleAddressChange(e.target.value)}
                                                disabled={!isManager || !isEditingLocation}
                                                autoComplete="off"
                                                placeholder={isEditingLocation ? "Leitaðu að heimilisfangi..." : houseForm.address || "Heimilisfang"}
                                            />
                                            {suggestions.length > 0 && isEditingLocation && (
                                                <ul className="absolute z-20 w-full bg-white border border-stone-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {suggestions.map((suggestion) => (
                                                        <li
                                                            key={suggestion.id}
                                                            onClick={() => handleSelectPrediction(suggestion)}
                                                            className="px-4 py-3 hover:bg-stone-50 cursor-pointer text-sm border-b last:border-0 border-stone-100 flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {suggestion.source === 'hms' ? (
                                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                                ) : (
                                                                    <MapPin className="w-4 h-4 text-stone-400" />
                                                                )}
                                                                <span className="font-medium">{suggestion.description}</span>
                                                            </div>
                                                            {suggestion.source === 'hms' && (
                                                                <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold uppercase">HMS</span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Breiddargráða (Lat)</label>
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    className="input"
                                                    value={houseForm.lat}
                                                    onChange={(e) => setHouseForm({ ...houseForm, lat: parseFloat(e.target.value) })}
                                                    disabled={!isManager || !isEditingLocation}
                                                    placeholder="64.123456"
                                                />
                                            </div>
                                            <div>
                                                <label className="label">Lengdargráða (Lng)</label>
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    className="input"
                                                    value={houseForm.lng}
                                                    onChange={(e) => setHouseForm({ ...houseForm, lng: parseFloat(e.target.value) })}
                                                    disabled={!isManager || !isEditingLocation}
                                                    placeholder="-21.123456"
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-grey-warm pt-4 mt-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Wifi className="w-5 h-5 text-amber" />
                                                <h3 className="font-serif text-lg">Internet (Wi-Fi)</h3>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="label">Nafn nets (SSID)</label>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={houseForm.wifi_ssid}
                                                        onChange={(e) => setHouseForm({ ...houseForm, wifi_ssid: e.target.value })}
                                                        disabled={!isManager}
                                                        placeholder="t.d. Sumarbústaður 5G"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="label">Lykilorð (Password)</label>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={houseForm.wifi_password}
                                                        onChange={(e) => setHouseForm({ ...houseForm, wifi_password: e.target.value })}
                                                        disabled={!isManager}
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-grey-warm pt-4 mt-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Shield className="w-5 h-5 text-amber" />
                                                <h3 className="font-serif text-lg">Aðgangsstýring</h3>
                                            </div>

                                            <div className="space-y-4">
                                                <Toggle
                                                    label="Fela fjármál (Hússjóður)"
                                                    description="Ef kveikt er á þessu sjá einungis stjórnendur (þú) fjármálayfirlitið sjálfkrafa. Aðrir sjá það ekki nema þeim sé sérstaklega veittur aðgangur hér að neðan."
                                                    checked={houseForm.privacy_hide_finances}
                                                    onChange={(val) => setHouseForm({ ...houseForm, privacy_hide_finances: val })}
                                                    disabled={!isManager}
                                                />

                                                {/* Viewer Selection (Only visible if finances are hidden) */}
                                                {houseForm.privacy_hide_finances && isManager && (
                                                    <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 animate-in fade-in slide-in-from-top-2">
                                                        <h5 className="text-sm font-bold text-charcoal mb-3 flex items-center gap-2">
                                                            <Users size={14} className="text-amber" />
                                                            Hverjir mega sjá?
                                                        </h5>

                                                        {loadingMembers ? (
                                                            <div className="text-sm text-stone-400">Hleð notendum...</div>
                                                        ) : (
                                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                                {members
                                                                    .filter(m => m.uid !== house?.manager_id) // Exclude manager as they always see it
                                                                    .map(member => {
                                                                        const canView = houseForm.finance_viewer_ids?.includes(member.uid) || false;
                                                                        return (
                                                                            <div
                                                                                key={member.uid}
                                                                                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${canView
                                                                                    ? 'bg-white border-green-500 shadow-sm'
                                                                                    : 'bg-transparent border-transparent hover:bg-stone-100 hover:border-stone-200'
                                                                                    }`}
                                                                                onClick={() => {
                                                                                    const currentViewers = houseForm.finance_viewer_ids || [];
                                                                                    let newViewers;

                                                                                    if (canView) {
                                                                                        newViewers = currentViewers.filter(id => id !== member.uid);
                                                                                    } else {
                                                                                        newViewers = [...currentViewers, member.uid];
                                                                                    }
                                                                                    setHouseForm({ ...houseForm, finance_viewer_ids: newViewers });
                                                                                }}
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-xs font-bold overflow-hidden border border-stone-100">
                                                                                        {member.avatar ? (
                                                                                            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                                                                                        ) : (
                                                                                            (member.name || member.email || '?').substring(0, 2).toUpperCase()
                                                                                        )}
                                                                                    </div>
                                                                                    <span className={`text-sm ${canView ? 'font-bold text-charcoal' : 'text-stone-600'}`}>
                                                                                        {member.name || member.email}
                                                                                    </span>
                                                                                </div>

                                                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${canView
                                                                                    ? 'bg-green-500 border-green-500 text-white scale-110'
                                                                                    : 'border-stone-300 bg-white'
                                                                                    }`}>
                                                                                    {canView && <Check size={12} strokeWidth={3} />}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}

                                                                {members.filter(m => m.uid !== house?.manager_id).length === 0 && (
                                                                    <p className="text-xs text-stone-400 italic py-2 text-center">
                                                                        Engir aðrir meðeigendur fundust.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {isManager && (
                                            <div className="pt-4">
                                                <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={loading}>
                                                    <Save className="w-4 h-4" />
                                                    Vista breytingar
                                                </button>
                                            </div>
                                        )}
                                    </form>
                                </div>

                                {/* Booking Modes */}
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Shield className="w-6 h-6 text-amber" />
                                        <h2 className="text-xl font-serif">Bókunarreglur</h2>
                                    </div>

                                    <p className="text-grey-dark mb-4">Veldu hvernig úthlutun á helgum og frídögum fer fram.</p>

                                    <div className="space-y-3">
                                        <label className={`
                      flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all
                      ${houseForm.holiday_mode === 'fairness' ? 'border-amber bg-amber/5' : 'border-grey-warm hover:bg-bone'}
                    `}>
                                            <input
                                                type="radio"
                                                name="holiday_mode"
                                                value="fairness"
                                                checked={houseForm.holiday_mode === 'fairness'}
                                                onChange={() => setHouseForm({ ...houseForm, holiday_mode: 'fairness' })}
                                                disabled={!isManager}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="font-semibold mb-1">Sanngirnisregla (Fairness Logic)</div>
                                                <p className="text-sm text-grey-dark">
                                                    Kerfið fylgist með bókunum á vinsælum helgum og frídögum (t.d. Jólum).
                                                    Ef meðeigandi fékk úthlutað í fyrra, getur hann ekki bókað sama frídag í ár.
                                                </p>
                                            </div>
                                        </label>

                                        <label className={`
                      flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all
                      ${houseForm.holiday_mode === 'first_come' ? 'border-amber bg-amber/5' : 'border-grey-warm hover:bg-bone'}
                    `}>
                                            <input
                                                type="radio"
                                                name="holiday_mode"
                                                value="first_come"
                                                checked={houseForm.holiday_mode === 'first_come'}
                                                onChange={() => setHouseForm({ ...houseForm, holiday_mode: 'first_come' })}
                                                disabled={!isManager}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="font-semibold mb-1">Fyrstur kemur, fyrstur fær</div>
                                                <p className="text-sm text-grey-dark">
                                                    Engar takmarkanir. Sá sem bókar fyrstur fær dagana. Einfalt og fljótlegt.
                                                </p>
                                            </div>
                                        </label>
                                    </div>

                                    {isManager && (
                                        <div className="mt-4">
                                            <button
                                                onClick={handleSaveHouse}
                                                className="btn btn-secondary text-sm"
                                                disabled={loading}
                                            >
                                                Uppfæra reglur
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Danger Zone */}
                                {isManager && (
                                    <div className="border border-red-200 bg-red-50 p-6 rounded-lg">
                                        <div className="flex items-center gap-2 mb-4 text-red-700">
                                            <AlertTriangle className="w-6 h-6" />
                                            <h2 className="text-xl font-serif">Hættusvæði</h2>
                                        </div>
                                        <p className="text-sm text-red-600 mb-4">
                                            Ef þú eyðir húsinu þá tapast allar upplýsingar, bókanir og fjárhagsfærslur. Þessari aðgerð er ekki hægt að afturkalla.
                                        </p>
                                        <button
                                            onClick={handleDeleteHouse}
                                            disabled={loading}
                                            className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded hover:bg-red-50 text-sm font-medium disabled:opacity-50"
                                        >
                                            {loading ? 'Eyði...' : 'Eyða sumarhúsi'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: MEMBERS */}
                        {activeTab === 'members' && house && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-6 h-6 text-amber" />
                                        <h2 className="text-xl font-serif">Meðeigendur</h2>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Members List */}
                                    {loadingMembers ? (
                                        <div className="text-center py-8">
                                            <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-grey-mid">Hleð meðeigendum...</p>
                                        </div>
                                    ) : membersError ? (
                                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
                                            {membersError}
                                            <button
                                                onClick={() => window.location.reload()}
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
                                                            {house.manager_id === member.uid ? 'Bústaðastjóri (Manager)' : 'Meðeigandi (Member)'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div>
                                                    {isManager && house.manager_id !== member.uid && (
                                                        <button
                                                            onClick={() => setMemberToTransfer(member)}
                                                            className="text-xs text-amber hover:text-amber-dark font-medium"
                                                        >
                                                            Gera að stjórnanda
                                                        </button>
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
                                                            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-400">
                                                                <Users size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm text-stone-600">{invite.email}</p>
                                                                <p className="text-xs text-stone-400">Boðið {new Date(invite.created_at?.seconds * 1000).toLocaleDateString('is-IS')}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRevokeInvite(invite.id)}
                                                            className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                                                        >
                                                            Afturkalla
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Invite Section */}
                                    {house.owner_ids?.includes(currentUser?.uid || '') && (
                                        <div className="mt-8 pt-6 border-t border-grey-warm">
                                            <h3 className="text-lg font-serif mb-4">Bjóða nýjum aðilum</h3>
                                            <p className="text-sm text-grey-dark mb-4">
                                                Deildu hlekknum hér að neðan til að bjóða öðrum að ganga í húsfélagið, eða sendu boð í tölvupósti.
                                            </p>

                                            {/* Email Invite Form */}
                                            <div className="bg-bone p-4 rounded-lg mb-4 border border-stone-200">
                                                <label className="label text-xs uppercase text-grey-mid">Bjóða með tölvupósti</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="email"
                                                        placeholder="sláðu inn netfang..."
                                                        className="input w-full"
                                                        value={inviteEmail}
                                                        onChange={(e) => setInviteEmail(e.target.value)}
                                                        disabled={inviteLoading}
                                                    />
                                                    <button
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
                                                        <label className="label text-xs uppercase text-grey-mid">Boðshlekkur</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                readOnly
                                                                className="input font-mono text-sm bg-white"
                                                                value={`${window.location.origin}/join?houseId=${house.id}&code=${house.invite_code}`}
                                                                onClick={(e) => e.currentTarget.select()}
                                                            />
                                                            <button
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
                                                        <div className="mt-4">
                                                            <button
                                                                onClick={handleGenerateInvite}
                                                                className="text-xs text-grey-mid hover:underline"
                                                            >
                                                                Endurnýja hlekk (Gera gamlan ógildan)
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={handleGenerateInvite}
                                                        className="btn btn-primary w-full md:w-auto self-start"
                                                    >
                                                        Búa til boðshlekk
                                                    </button>
                                                )}
                                            </div>
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
                                        <div className="bg-amber/10 text-amber-700 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
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
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(`${window.location.origin}/guest/${house.guest_token}`);
                                                                setSuccess('Hlekkur afritaður!');
                                                            }}
                                                            className="p-2 hover:bg-green-100 rounded-lg text-green-700 transition-colors"
                                                            title="Afrita hlekk"
                                                        >
                                                            <Copy size={20} />
                                                        </button>
                                                    </div>
                                                    <div className="flex justify-center gap-3">
                                                        <a
                                                            href={`/guest/${house.guest_token}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn bg-green-600 text-white hover:bg-green-700 border-none text-sm px-6"
                                                        >
                                                            Opna síðu
                                                        </a>
                                                        <button
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
                                                    <p className="text-sm text-stone-500">
                                                        Viltu endurnýja hlekkinn? Gamli hlekkurinn hættir að virka.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleGenerateGuestToken(true)}
                                                            className="btn btn-ghost text-stone-500 hover:text-charcoal text-sm"
                                                        >
                                                            <RefreshCw size={14} className="mr-2" />
                                                            Endurnýja
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('Ertu viss? Þetta lokar á aðganginn strax.')) return;
                                                                setLoading(true);
                                                                try {
                                                                    await deleteDoc(doc(db, 'guest_views', house.guest_token!));
                                                                    await updateDoc(doc(db, 'houses', house.id), { guest_token: null });
                                                                    setHouse({ ...house, guest_token: undefined });
                                                                    setSuccess('Gestasíðu eytt');
                                                                } catch (e) {
                                                                    console.error(e);
                                                                    setError('Gat ekki eytt síðu');
                                                                } finally {
                                                                    setLoading(false);
                                                                }
                                                            }}
                                                            className="btn btn-ghost text-red-400 hover:bg-red-50 hover:text-red-600 text-sm"
                                                        >
                                                            Eyða
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <LinkIcon size={32} className="text-stone-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-charcoal mb-2">Enginn fastur gestahlekkur</h3>
                                                <p className="text-stone-500 mb-6 max-w-sm mx-auto">
                                                    Þú getur búið til einn fastan hlekk sem er alltaf virkur, til dæmis fyrir fjölskyldumeðlimi.
                                                </p>
                                                <button
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

                                {/* Content Editor */}
                                <section>
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-serif font-bold text-charcoal mb-2">Upplýsingar fyrir gesti</h2>
                                        <p className="text-grey-mid">Þessar upplýsingar birtast sjálfkrafa á gestasíðunni.</p>
                                    </div>

                                    <div className="card p-6 border-2 border-stone-100">
                                        <form onSubmit={handleSaveHouse} className="space-y-6 pb-24">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="label">Innritun (kl.)</label>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={houseForm.check_in_time}
                                                        onChange={(e) => setHouseForm({ ...houseForm, check_in_time: e.target.value })}
                                                        placeholder="16:00"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="label">Útritun (kl.)</label>
                                                    <input
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
                                                <div className="flex bg-stone-100 rounded-lg p-1">
                                                    <button
                                                        type="button"
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
                                                    <label className="label flex items-center gap-2">
                                                        Húsreglur
                                                        {editLang === 'en' && <span className="text-[10px] uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Enska</span>}
                                                    </label>
                                                    <textarea
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
                                                    <label className="label flex items-center gap-2">
                                                        Leiðarlýsing (eða hlekkur á kort)
                                                        {editLang === 'en' && <span className="text-[10px] uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Enska</span>}
                                                    </label>
                                                    <textarea
                                                        className="input"
                                                        value={editLang === 'is' ? houseForm.directions : houseForm.directions_en}
                                                        onChange={(e) => setHouseForm({
                                                            ...houseForm,
                                                            [editLang === 'is' ? 'directions' : 'directions_en']: e.target.value
                                                        })}
                                                        placeholder={editLang === 'is' ? "t.d. Keyrt er í gegnum..." : "e.g. Drive through..."}
                                                    />
                                                    {(houseForm.lat !== 0 && houseForm.lng !== 0) && (
                                                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                            <CheckCircle size={12} />
                                                            GPS hnit eru skráð. Gestasíðan mun sýna "Rata í hús" takka sjálfkrafa.
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="label flex items-center gap-2">
                                                        Aðgangsleiðbeiningar (Lykilbox ofl.)
                                                        {editLang === 'en' && <span className="text-[10px] uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Enska</span>}
                                                    </label>
                                                    <textarea
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
                                                <label className="label">Neyðarnúmer / Tengiliður</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={houseForm.emergency_contact}
                                                    onChange={(e) => setHouseForm({ ...houseForm, emergency_contact: e.target.value })}
                                                    placeholder="Sími 555-1234"
                                                />
                                            </div>

                                            <div className="pt-4 border-t border-stone-100">
                                                <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={loading}>
                                                    <Save className="w-4 h-4 mr-2 inline" />
                                                    Vista upplýsingar
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* TAB: GUESTBOOK */}
                        {activeTab === 'guestbook' && house && (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Heart className="w-6 h-6 text-amber" />
                                        <h2 className="text-xl font-serif">Gestabók (Digital Journal)</h2>
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
                                    <UserIcon className="w-6 h-6 text-amber" />
                                    <h2 className="text-xl font-serif">Mínar stillingar</h2>
                                </div>

                                <div className="space-y-6">
                                    {/* Avatar Section */}
                                    <div className="flex flex-col items-center pb-6 border-b border-stone-200">
                                        <div className="relative group cursor-pointer mb-4">
                                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-stone-100">
                                                {currentUser?.avatar ? (
                                                    <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                                                        <UserIcon size={40} />
                                                    </div>
                                                )}
                                            </div>
                                            <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                                <ImageIcon size={24} />
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleAvatarSelect}
                                                />
                                            </label>
                                            <button
                                                className="absolute bottom-0 right-0 bg-amber text-white p-1.5 rounded-full shadow-sm hover:bg-amber-dark transition-colors"
                                                onClick={() => (document.querySelector('input[type="file"][onChange]') as HTMLInputElement)?.click()}
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-stone-500">Smelltu á myndina til að breyta</p>
                                    </div>

                                    <div>
                                        <label className="label">Tungumál (Language)</label>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            {[
                                                { code: 'is', label: '🇮🇸 Íslenska' },
                                                { code: 'en', label: '🇬🇧 English' },
                                                { code: 'de', label: '🇩🇪 Deutsch' },
                                                { code: 'fr', label: '🇫🇷 Français' },
                                                { code: 'es', label: '🇪🇸 Español' },
                                            ].map((lang) => (
                                                <button
                                                    key={lang.code}
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
                                        <label className="label">Nafn</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="input max-w-md"
                                                value={userName}
                                                onChange={(e) => setUserName(e.target.value)}
                                                placeholder="Nafn..."
                                            />
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={loading || !userName.trim() || userName === currentUser?.name}
                                                className="btn btn-primary whitespace-nowrap"
                                            >
                                                Vista
                                            </button>
                                        </div>
                                        <p className="text-xs text-grey-mid mt-1">Hér getur þú breytt nafninu þínu sem birtist öðrum notendum.</p>
                                    </div>

                                    {/* Granular Notification Settings */}
                                    <div className="pt-8 border-t border-stone-200">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-amber-50 rounded-lg text-amber">
                                                <Bell size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-serif text-lg font-bold">Tilkynningar</h3>
                                                <p className="text-xs text-stone-500">Stjórnaðu hvernig og hvenær þú færð tilkynningar.</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-8">
                                            {/* Email Notifications */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Mail size={16} className="text-stone-400" />
                                                    <h4 className="text-sm font-bold uppercase tracking-wider text-stone-600">Tölvupóstur</h4>
                                                </div>

                                                <Toggle
                                                    label="Nýjar bókanir"
                                                    description="Fá tölvupóst þegar húsfélagsmeðlimur bókar"
                                                    checked={notificationSettings.emails.new_bookings}
                                                    onChange={(val) => handleUpdateNotificationSettings('emails', 'new_bookings', val)}
                                                />
                                                <Toggle
                                                    label="Verkefni"
                                                    description="Áminningar um verkefni sem eiga að klárast"
                                                    checked={notificationSettings.emails.task_reminders}
                                                    onChange={(val) => handleUpdateNotificationSettings('emails', 'task_reminders', val)}
                                                />
                                                <Toggle
                                                    label="Veðurviðvaranir"
                                                    description="Fá sjarmerandi veðuráminningar fyrir dvalir"
                                                    checked={notificationSettings.emails.weather_alerts}
                                                    onChange={(val) => handleUpdateNotificationSettings('emails', 'weather_alerts', val)}
                                                />
                                            </div>

                                            {/* In-App Notifications */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Bell size={16} className="text-stone-400" />
                                                    <h4 className="text-sm font-bold uppercase tracking-wider text-stone-600">Í forritinu</h4>
                                                </div>

                                                <Toggle
                                                    label="Nýjar bókanir"
                                                    description="Tilkynning á stjórnborði þegar ný bókun kemur"
                                                    checked={notificationSettings.in_app.new_bookings}
                                                    onChange={(val) => handleUpdateNotificationSettings('in_app', 'new_bookings', val)}
                                                />
                                                <Toggle
                                                    label="Gestabók"
                                                    description="Þegar gestir skrifa í gestabókina"
                                                    checked={notificationSettings.in_app.guestbook_entries}
                                                    onChange={(val) => handleUpdateNotificationSettings('in_app', 'guestbook_entries', val)}
                                                />
                                                <Toggle
                                                    label="Veðurviðvaranir"
                                                    description="Veðurspá og aðstæður á stjórnborði"
                                                    checked={notificationSettings.in_app.weather_alerts}
                                                    onChange={(val) => handleUpdateNotificationSettings('in_app', 'weather_alerts', val)}
                                                />
                                            </div>

                                            {/* Push Notifications */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-4 h-4 rounded-full bg-amber flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                    </div>
                                                    <h4 className="text-sm font-bold uppercase tracking-wider text-stone-600">Push-tilkynningar</h4>
                                                </div>

                                                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                                                    <p className="text-xs text-stone-500 mb-4">
                                                        Virkaðu push-tilkynningar til að fá skilaboð beint í símann þinn (eins og "native" app).
                                                    </p>

                                                    {currentUser?.fcm_tokens && currentUser.fcm_tokens.length > 0 ? (
                                                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                                            <Check size={14} />
                                                            <span className="text-xs font-bold">Virkjað á þessu tæki</span>
                                                        </div>
                                                    ) : (
                                                        <button
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
                                        <label className="label">Netfang & Aðgangur</label>
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
                                                    onClick={handlePasswordReset}
                                                    className="text-sm font-bold text-amber hover:text-amber-dark flex items-center gap-1 hover:underline"
                                                >
                                                    <RefreshCw size={14} />
                                                    Endurstilla lykilorð (Senda tölvupóst)
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-grey-warm flex justify-end">
                                        <button
                                            onClick={handleLogout}
                                            className="btn btn-ghost text-red-500 hover:bg-red-50"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
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
                    </div>
                </div >
            </div >

            {/* Image Cropper Modal */}
            {
                showCropper && imageFile && (
                    <ImageCropper
                        image={imageFile}
                        onCropComplete={handleCroppedImage}
                        onCancel={() => {
                            setShowCropper(false);
                            setImageFile(null);
                        }}
                        aspectRatio={16 / 9}
                    />
                )
            }

            {/* Upload Progress Overlay */}
            {
                uploadingImage && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber/20 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-amber animate-spin" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Hleður upp mynd...</h3>
                            <div className="w-full bg-stone-200 rounded-full h-3 mb-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-amber to-orange-500 h-3 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-sm text-stone-500 font-medium">{uploadProgress}%</p>
                        </div>
                    </div>
                )
            }
            {/* Ownership Transfer Modal */}
            {memberToTransfer && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertTriangle className="w-8 h-8" />
                            <h3 className="text-xl font-bold font-serif">Flytja Eignarhald?</h3>
                        </div>

                        <p className="text-stone-600 mb-4 text-sm leading-relaxed">
                            Þú ert að fara að gera <strong>{memberToTransfer.name || memberToTransfer.email}</strong> að Bústaðastjóra.
                        </p>

                        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-800">
                            <strong>Aðvörun:</strong> Þú munt missa öll stjórnendaréttindi (bókunarreglur, stillingar, o.fl.) og verður venjulegur meðeigandi.
                        </div>

                        <p className="text-xs text-stone-500 mb-2 uppercase font-bold tracking-wide">
                            Skrifaðu "SAMÞYKKJA" til að staðfesta:
                        </p>

                        <input
                            type="text"
                            className="w-full border border-stone-300 rounded-md px-3 py-2 mb-6 font-mono text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 uppercase"
                            placeholder="SAMÞYKKJA"
                            value={transferConfirmation}
                            onChange={(e) => setTransferConfirmation(e.target.value.toUpperCase())}
                        />

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setMemberToTransfer(null);
                                    setTransferConfirmation('');
                                }}
                                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-md text-sm font-medium transition-colors"
                            >
                                Hætta við
                            </button>
                            <button
                                onClick={handleTransferOwnership}
                                disabled={transferConfirmation !== 'SAMÞYKKJA'}
                                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                Staðfesta Flutning
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <MobileNav />
        </div >
    );
}
