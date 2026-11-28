import { Link } from 'react-router-dom';
import { Plus, Home, LogOut } from 'lucide-react';

interface StayActionsBarProps {
    isCheckedIn: boolean;
    onStayButtonClick: () => void;
}

/** Quick actions: book a weekend + check in / check out. */
export default function StayActionsBar({ isCheckedIn, onStayButtonClick }: StayActionsBarProps) {
    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 flex p-1.5 gap-2">
            <Link
                to="/calendar"
                className="flex-1 bg-[#1a1a1a] text-white py-4 rounded-xl font-bold text-sm hover:bg-stone-800 transition-all active:scale-[0.98] flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></div>
                <div className="w-8 h-8 md:w-6 md:h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-amber group-hover:text-[#1a1a1a] transition-colors relative z-10" aria-hidden="true">
                    <Plus size={16} />
                </div>
                <span className="relative z-10">Bóka helgi</span>
            </Link>

            <button
                type="button"
                onClick={onStayButtonClick}
                className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 border ${isCheckedIn
                    ? 'bg-amber text-[#1a1a1a] border-amber shadow-lg shadow-amber/20 hover:bg-[#d9a044]'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                    } `}
            >
                <div aria-hidden="true" className={`w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-colors ${isCheckedIn ? 'bg-black/10' : 'bg-stone-100'} `}>
                    {isCheckedIn ? <LogOut size={16} /> : <Home size={16} />}
                </div>
                <span>{isCheckedIn ? 'Skrá brottför' : 'Skrá komu'}</span>
            </button>
        </div>
    );
}
