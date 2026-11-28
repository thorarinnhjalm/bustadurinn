import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import type { House, User } from '@/types/models';
import { logger } from '@/utils/logger';
import type { SettingsFeedback } from './types';

export type CropMode = 'main' | 'gallery' | 'avatar';

interface UseHouseImagesArgs extends SettingsFeedback {
    house: House | null;
    setHouse: Dispatch<SetStateAction<House | null>>;
    currentUser: User | null | undefined;
    isImpersonating: boolean;
    isManager: boolean;
    setLoading: (loading: boolean) => void;
}

/**
 * Image selection, cropping and upload for the house photos (main + gallery) and the
 * user's avatar. The cropper and the upload-progress modal are shared by the Hús and
 * Mínar stillingar tabs, so this hook is used at page level.
 */
export function useHouseImages({
    house,
    setHouse,
    currentUser,
    isImpersonating,
    isManager,
    setLoading,
    setSuccess,
    setError,
}: UseHouseImagesArgs) {
    const { startImpersonation } = useImpersonation();
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);

    const [imageFile, setImageFile] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [cropMode, setCropMode] = useState<CropMode>('main');

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

    const cancelCrop = () => {
        setShowCropper(false);
        setImageFile(null);
    };

    return {
        imageFile,
        showCropper,
        uploadingImage,
        uploadProgress,
        cropMode,
        handleImageSelect,
        handleAvatarSelect,
        handleCroppedImage,
        handleRemoveGalleryImage,
        cancelCrop,
    };
}
