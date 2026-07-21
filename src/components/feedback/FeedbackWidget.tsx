import { useState, useEffect } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { useAppStore } from '@/store/appStore';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { isAuthenticated, isLoading } = useAppStore();

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Only show if authenticated, not loading, and not on mobile
    if (isLoading || !isAuthenticated || isMobile) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="hidden md:flex fixed bottom-6 right-6 z-40 bg-white text-[#1a1a1a] p-3 rounded-full shadow-lg shadow-stone-300 hover:shadow-xl hover:scale-105 transition-all border border-stone-100 group items-center gap-2 overflow-hidden pr-3 hover:pr-5"
                title="Gefa umsögn"
            >
                <div className="bg-amber w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0">
                    <MessageSquarePlus size={18} />
                </div>
                <span className="font-bold text-sm max-w-0 group-hover:max-w-[100px] transition-all duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    Gefa umsögn
                </span>
            </button>

            <ErrorBoundary fallback={
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="text-center">
                            <div className="text-4xl mb-4">⚠️</div>
                            <h3 className="font-serif font-bold text-xl mb-2">Villa kom upp</h3>
                            <p className="text-stone-600 mb-4">Ekki tókst að hlaða umsagnarglugga</p>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="btn btn-primary"
                            >
                                Loka
                            </button>
                        </div>
                    </div>
                </div>
            }>
                <FeedbackModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                />
            </ErrorBoundary>
        </>
    );
}
