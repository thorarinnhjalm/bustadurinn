import { useState, useCallback, useId } from 'react';
import Cropper from 'react-easy-crop';
import { RotateCw } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { logger } from '@/utils/logger';

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
    onCancel: () => void;
    aspectRatio?: number;
    showSkipCrop?: boolean;
}

interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
}

const dataURLToBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });

const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            }
        }, 'image/jpeg', 0.95);
    });
};

export default function ImageCropper({
    image,
    onCropComplete,
    onCancel,
    aspectRatio,
    showSkipCrop = false
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [processing, setProcessing] = useState(false);
    const baseId = useId();

    const onCropChange = (location: { x: number; y: number }) => {
        setCrop(location);
    };

    const onCropCompleteCallback = useCallback(
        (_croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const handleSave = async () => {
        if (!croppedAreaPixels) return;

        try {
            setProcessing(true);
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            logger.error('Error cropping image:', e);
        } finally {
            setProcessing(false);
        }
    };

    const handleSkipCrop = () => {
        try {
            setProcessing(true);
            const blob = dataURLToBlob(image);
            onCropComplete(blob);
        } catch (e) {
            logger.error('Error skipping crop:', e);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Modal
            open
            onClose={onCancel}
            title="Klippa mynd"
            size="full"
            bodyClassName="!p-0"
            footer={
                <div className="flex gap-3 w-full">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-ghost flex-1"
                    >
                        Hætta við
                    </button>
                    {showSkipCrop && (
                        <button
                            type="button"
                            onClick={handleSkipCrop}
                            disabled={processing}
                            className="btn btn-secondary flex-1"
                        >
                            Sleppa klippingu
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={processing}
                        className="btn btn-primary flex-1"
                    >
                        {processing ? 'Vinnur...' : 'Vista'}
                    </button>
                </div>
            }
        >
            <div className="flex flex-col bg-black/90">
                <div className="relative h-[55vh]">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspectRatio}
                        onCropChange={onCropChange}
                        onZoomChange={setZoom}
                        onCropComplete={onCropCompleteCallback}
                    />
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor={`${baseId}-zoom`} className="text-white text-sm mb-2 block">Aðdráttur</label>
                        <input
                            id={`${baseId}-zoom`}
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label htmlFor={`${baseId}-rotation`} className="text-white text-sm mb-2 flex items-center gap-2">
                            <RotateCw size={16} aria-hidden="true" />
                            Snúningur
                        </label>
                        <input
                            id={`${baseId}-rotation`}
                            type="range"
                            min={0}
                            max={360}
                            step={1}
                            value={rotation}
                            onChange={(e) => setRotation(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
