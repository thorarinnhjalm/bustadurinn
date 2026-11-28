import { useState, useEffect } from 'react';
import { Home, Share, Download, Bell } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { logger } from '@/utils/logger';

interface AddToHomeScreenPromptProps {
    houseName: string;
    onDismiss: () => void;
}

export default function AddToHomeScreenPrompt({ houseName, onDismiss }: AddToHomeScreenPromptProps) {
    const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | null>(null);
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

    useEffect(() => {
        // Detect platform
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        const isMobile = isIOS || isAndroid;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (isIOS) setPlatform('ios');
        else if (isAndroid) setPlatform('android');
        else if (!isMobile) setPlatform('desktop');
    }, []);

    const handleRequestNotifications = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                logger.info('Notifications enabled!');
            }
        }
        setShowNotificationPrompt(false);
        onDismiss();
    };

    // Don't show on desktop
    if (platform === 'desktop' || !platform) {
        return null;
    }

    return (
        <>
            {/* Main Prompt: blocks the page behind it, so it is a real modal dialog */}
            <Modal
                open
                onClose={onDismiss}
                title={`Setja ${houseName} á heimaskjá?`}
                size="md"
            >
                <div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-amber/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Home className="w-10 h-10 text-amber-ink" aria-hidden="true" />
                        </div>
                        <p className="text-grey-mid mb-6">
                            Fáðu skjótari aðgang með því að vista kerfið sem app á símann þinn.
                        </p>
                    </div>

                    {platform === 'ios' && (
                        <div className="space-y-4 mb-6">
                            <div className="bg-bone p-4 rounded-lg text-left">
                                <h3 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                                    Opnaðu Share valmynd
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-grey-dark">
                                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <Share className="w-5 h-5 text-white" />
                                    </div>
                                    <span>Smelltu á Share-tákkann neðst á skjánum</span>
                                </div>
                            </div>

                            <div className="bg-bone p-4 rounded-lg text-left">
                                <h3 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                                    Veldu "Add to Home Screen"
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-grey-dark">
                                    <div className="w-8 h-8 bg-grey-mid rounded-lg flex items-center justify-center">
                                        <Home className="w-5 h-5 text-white" />
                                    </div>
                                    <span>Skrunaðu niður og veldu "Add to Home Screen"</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {platform === 'android' && (
                        <div className="space-y-4 mb-6">
                            <div className="bg-bone p-4 rounded-lg text-left">
                                <h3 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                                    Opnaðu valmynd
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-grey-dark">
                                    <div className="w-8 h-8 bg-grey-mid rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold">⋮</span>
                                    </div>
                                    <span>Smelltu á valmyndina (3 punktar)</span>
                                </div>
                            </div>

                            <div className="bg-bone p-4 rounded-lg text-left">
                                <h3 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                                    Veldu "Install App" / "Add to Home screen"
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-grey-dark">
                                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                        <Download className="w-5 h-5 text-white" />
                                    </div>
                                    <span>Smelltu á "Install" eða "Add to Home screen"</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={() => setShowNotificationPrompt(true)}
                            className="btn btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <Bell className="w-4 h-4" aria-hidden="true" />
                            Virkja tilkynningar líka
                        </button>
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="btn btn-ghost w-full"
                        >
                            Kannski seinna
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Notification Permission Prompt (stacked above the first dialog) */}
            <Modal
                open={showNotificationPrompt}
                onClose={() => setShowNotificationPrompt(false)}
                title="Fá tilkynningar?"
                size="md"
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-10 h-10 text-blue-600" aria-hidden="true" />
                    </div>
                    <p className="text-grey-mid mb-6">
                        Fáðu tilkynningar um nýjar bókanir, verkefni og fjármál í húsinu.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={handleRequestNotifications}
                        className="btn btn-primary w-full"
                    >
                        Virkja tilkynningar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowNotificationPrompt(false);
                            onDismiss();
                        }}
                        className="btn btn-ghost w-full"
                    >
                        Ekki núna
                    </button>
                </div>
            </Modal>
        </>
    );
}
