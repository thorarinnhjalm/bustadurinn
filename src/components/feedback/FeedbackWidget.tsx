import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { useAppStore } from '@/store/appStore';

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated, isLoading } = useAppStore();

    // Only show if authenticated and not loading
    // HIDDEN ON MOBILE (md:flex) to prevent obstruction
    if (isLoading || !isAuthenticated) return null;

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

            <FeedbackModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}
