import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { MessageSquarePlus } from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import GuestPreviewModal from '@/components/GuestPreviewModal';
import FeedbackModal from '@/components/feedback/FeedbackModal';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { logger } from '@/utils/logger';
import { useSettingsTab } from './settings/useSettingsTab';
import { useSettingsHouse } from './settings/useSettingsHouse';
import { useHouseMembers } from './settings/useHouseMembers';
import { useHouseImages } from './settings/useHouseImages';
import { useSaveHouse } from './settings/useSaveHouse';
import { useMembershipActions } from './settings/useMembershipActions';
import SettingsNav from './settings/SettingsNav';
import NoManagerNotice from './settings/NoManagerNotice';
import ImageUploadModals from './settings/ImageUploadModals';
import MembershipConfirmModal from './settings/MembershipConfirmModal';
import TransferManagerModal from './settings/TransferManagerModal';
import ShoppingTab from './settings/ShoppingTab';
import LogsTab from './settings/LogsTab';
import HouseTab from './settings/HouseTab';
import MembersTab from './settings/MembersTab';
import GuestsTab from './settings/GuestsTab';
import GuestbookTab from './settings/GuestbookTab';
import ProfileTab from './settings/ProfileTab';

export default function SettingsPage() {
    const navigate = useNavigate();
    const { user: currentUser, isImpersonating } = useEffectiveUser();

    // Active tab, synced with ?tab= (and location.state.initialTab)
    const { activeTab, setActiveTab } = useSettingsTab();
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showGuestPreview, setShowGuestPreview] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    // House + the form state the Gestir tab edits
    const { house, setHouse, houseForm, setHouseForm, loading, setLoading } = useSettingsHouse(currentUser, setError);

    // Only the manager (manager_id) may write the house document (see firestore.rules);
    // other owners can still invite, manage guest links and their own profile.
    const isManager = !!(house && currentUser && house.manager_id === currentUser.uid);
    // Membership actions call the API with the real Firebase user's token, so they
    // must not be offered while impersonating someone else.
    const canChangeMembership = !isImpersonating;

    const feedback = { setSuccess, setError };

    const { members, loadingMembers, membersError, reloadMembers, clearMembers } = useHouseMembers(house, activeTab);
    const images = useHouseImages({ house, setHouse, currentUser, isImpersonating, isManager, setLoading, ...feedback });
    const { isSaving, handleSaveHouse } = useSaveHouse({ house, setHouse, isManager, ...feedback });
    const membership = useMembershipActions({
        house,
        setHouse,
        currentUser,
        isManager,
        reloadMembers,
        clearMembers,
        ...feedback,
    });

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (err) {
            logger.error('Logout error:', err);
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
                    <SettingsNav activeTab={activeTab} onSelectTab={setActiveTab} onLogout={handleLogout} />

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
                            <ShoppingTab house={house} currentUser={currentUser} />
                        )}

                        {/* TAB: LOGS */}
                        {activeTab === 'logs' && (
                            <LogsTab house={house} currentUser={currentUser} members={members} />
                        )}

                        <NoManagerNotice
                            house={house}
                            currentUser={currentUser}
                            canChangeMembership={canChangeMembership}
                            onClaimManager={membership.handleClaimManager}
                        />

                        {/* TAB: HOUSE INFO */}
                        {activeTab === 'house' && house && (
                            <HouseTab
                                house={house}
                                isManager={isManager}
                                members={members}
                                loadingMembers={loadingMembers}
                                isSaving={isSaving}
                                onSave={handleSaveHouse}
                                onImageSelect={images.handleImageSelect}
                                onRemoveGalleryImage={images.handleRemoveGalleryImage}
                                setHouseForm={setHouseForm}
                            />
                        )}

                        {/* TAB: MEMBERS */}
                        {activeTab === 'members' && house && (
                            <MembersTab
                                house={house}
                                setHouse={setHouse}
                                setHouseForm={setHouseForm}
                                currentUser={currentUser}
                                isManager={isManager}
                                canChangeMembership={canChangeMembership}
                                members={members}
                                loadingMembers={loadingMembers}
                                membersError={membersError}
                                reloadMembers={reloadMembers}
                                onTransferManager={membership.setMemberToTransfer}
                                onOpenMembershipAction={membership.openMembershipAction}
                                {...feedback}
                            />
                        )}

                        {/* TAB: GUESTS */}
                        {activeTab === 'guests' && house && (
                            <GuestsTab
                                house={house}
                                setHouse={setHouse}
                                houseForm={houseForm}
                                setHouseForm={setHouseForm}
                                isManager={isManager}
                                loading={loading}
                                setLoading={setLoading}
                                onSaveHouse={handleSaveHouse}
                                onPreview={() => setShowGuestPreview(true)}
                                {...feedback}
                            />
                        )}

                        {/* TAB: GUESTBOOK */}
                        {activeTab === 'guestbook' && house && (
                            <GuestbookTab house={house} currentUser={currentUser} success={success} {...feedback} />
                        )}

                        {/* TAB: PROFILE / MY SETTINGS */}
                        {activeTab === 'profile' && (
                            <ProfileTab
                                currentUser={currentUser}
                                isImpersonating={isImpersonating}
                                loading={loading}
                                setLoading={setLoading}
                                canChangeMembership={canChangeMembership}
                                onAvatarSelect={images.handleAvatarSelect}
                                onLogout={handleLogout}
                                onOpenMembershipAction={membership.openMembershipAction}
                                {...feedback}
                            />
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

            <ImageUploadModals
                imageFile={images.imageFile}
                showCropper={images.showCropper}
                cropMode={images.cropMode}
                onCropComplete={images.handleCroppedImage}
                onCancelCrop={images.cancelCrop}
                uploadingImage={images.uploadingImage}
                uploadProgress={images.uploadProgress}
            />

            <MembershipConfirmModal
                membership={membership}
                house={house}
                members={members}
                currentUserId={currentUser?.uid}
                isManager={isManager}
            />

            <TransferManagerModal membership={membership} />
            <MobileNav />
        </div >
    );
}
