import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarView } from './calendarTypes';

interface CustomToolbarProps {
    date: Date;
    view: CalendarView;
    views: CalendarView[];
    label: string;
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', newDate?: Date) => void;

    onView: (view: any) => void;

    localizer: { messages: any };
}

// Simplified toolbar - only navigation since view toggle is now external
const CalendarToolbar = ({ label, onNavigate }: CustomToolbarProps) => {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="p-2 h-10 w-10 rounded-full flex items-center justify-center border border-stone-300 hover:bg-stone-100 bg-white shadow-md active:scale-95 transition-all"
                        onClick={() => onNavigate('PREV')}
                        aria-label="Fyrra tímabil"
                    >
                        <ChevronLeft className="w-6 h-6 text-stone-800" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="p-2 h-10 w-10 rounded-full flex items-center justify-center border border-stone-300 hover:bg-stone-100 bg-white shadow-md active:scale-95 transition-all"
                        onClick={() => onNavigate('NEXT')}
                        aria-label="Næsta tímabil"
                    >
                        <ChevronRight className="w-6 h-6 text-stone-800" aria-hidden="true" />
                    </button>
                    <h2 aria-live="polite" className="text-xl font-serif font-bold text-charcoal ml-2 capitalize">
                        {label}
                    </h2>
                </div>

                <button
                    type="button"
                    className="btn btn-secondary text-sm hidden md:flex"
                    onClick={() => onNavigate('TODAY')}
                    aria-label="Fara á daginn í dag"
                >
                    Í dag
                </button>
            </div>
        </div>
    );
};

export default CalendarToolbar;
