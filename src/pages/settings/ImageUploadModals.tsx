import { Loader2 } from 'lucide-react';
import ImageCropper from '@/components/ImageCropper';
import Modal from '@/components/ui/Modal';
import type { CropMode } from './useHouseImages';

interface ImageUploadModalsProps {
    imageFile: string | null;
    showCropper: boolean;
    cropMode: CropMode;
    onCropComplete: (blob: Blob) => void | Promise<void>;
    onCancelCrop: () => void;
    uploadingImage: boolean;
    uploadProgress: number;
}

/** The image cropper and the (non-dismissible) upload progress modal. */
export default function ImageUploadModals({
    imageFile,
    showCropper,
    cropMode,
    onCropComplete,
    onCancelCrop,
    uploadingImage,
    uploadProgress,
}: ImageUploadModalsProps) {
    return (
        <>
            {
                showCropper && imageFile && (
                    <ImageCropper
                        image={imageFile}
                        onCropComplete={onCropComplete}
                        onCancel={onCancelCrop}
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
        </>
    );
}
