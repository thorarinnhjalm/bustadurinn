import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import MobileNav from '@/components/MobileNav';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { ArrowLeft } from 'lucide-react';

// A-Frame Lógóið okkar (reused from DashboardPage)
const CabinLogo = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

interface AppLayoutWrapperProps {
    children: React.ReactNode;
    title?: string;
    showBackButton?: boolean;
}

export default function AppLayoutWrapper({ children, title, showBackButton = false }: AppLayoutWrapperProps) {
    const navigate = useNavigate();
    const { user: currentUser } = useEffectiveUser();
    const currentHouse = useAppStore((state) => state.currentHouse);

    return (
        <div className="min-h-screen bg-[#FDFCF8] flex flex-col pb-24 md:pb-0">
            {/* --- TOP NAVIGATION (Fixed) --- */}
            <nav className="fixed top-0 left-0 right-0 h-16 bg-[#FDFCF8]/95 backdrop-blur-md border-b border-stone-100 z-50 px-4 md:px-6">
                <div className="max-w-5xl mx-auto h-full flex items-center justify-between">
                    {/* Left: Logo or Back Button */}
                    <div className="flex items-center gap-4">
                        {showBackButton ? (
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 -ml-2 text-stone-500 hover:text-charcoal hover:bg-stone-100 rounded-full transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        ) : (
                            <div className="text-amber">
                                <CabinLogo size={28} />
                            </div>
                        )}

                        {title && (
                            <h1 className="text-lg font-serif font-bold text-charcoal">{title}</h1>
                        )}

                        {!title && currentHouse && (
                            <span className="text-sm font-bold text-charcoal truncate max-w-[150px] md:max-w-none">
                                {currentHouse.name}
                            </span>
                        )}
                    </div>

                    {/* Right: User Profile */}
                    <div className="flex items-center gap-4">
                        <div
                            className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-stone-800"
                            onClick={() => navigate('/settings?tab=profile')}
                        >
                            {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'ME'}
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 pt-16">
                {children}
            </main>

            {/* --- MOBILE NAVIGATION --- */}
            <MobileNav />
        </div>
    );
}
