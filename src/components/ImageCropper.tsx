import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, RotateCw } from 'lucide-react';

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
            console.error('Error cropping image:', e);
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
            console.error('Error skipping crop:', e);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            <div className="bg-black/50 backdrop-blur-sm p-4 flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Klippa mynd</h3>
                <button
                    onClick={onCancel}
                    className="text-white/70 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 relative">
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

            <div className="bg-black/50 backdrop-blur-sm p-6 space-y-4">
                <div>
                    <label className="text-white text-sm mb-2 block">Aðdráttur</label>
                    <input
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
                    <label className="text-white text-sm mb-2 block flex items-center gap-2">
                        <RotateCw size={16} />
                        Snúningur
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={360}
                        step={1}
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="w-full"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="btn btn-ghost flex-1 text-white border-white/20 hover:bg-white/10"
                    >
                        Hætta við
                    </button>
                    {showSkipCrop && (
                        <button
                            type="button"
                            onClick={handleSkipCrop}
                            disabled={processing}
                            className="btn btn-secondary flex-1 border-white/20 text-white hover:bg-white/10"
                        >
                            Sleppa klippingu
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={processing}
                        className="btn btn-primary flex-1 bg-amber text-charcoal hover:bg-amber-dark"
                    >
                        {processing ? 'Vinnur...' : 'Vista'}
                    </button>
                </div>
            </div>
        </div>
    );
}
