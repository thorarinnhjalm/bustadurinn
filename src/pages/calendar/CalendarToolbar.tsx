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
                        className="h-10 w-10 rounded-md flex items-center justify-center border border-stone-300 bg-white hover:bg-stone-50 hover:border-stone-400 transition-colors duration-200"
                        onClick={() => onNavigate('PREV')}
                        aria-label="Fyrra tímabil"
                    >
                        <ChevronLeft className="w-5 h-5 text-charcoal" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="h-10 w-10 rounded-md flex items-center justify-center border border-stone-300 bg-white hover:bg-stone-50 hover:border-stone-400 transition-colors duration-200"
                        onClick={() => onNavigate('NEXT')}
                        aria-label="Næsta tímabil"
                    >
                        <ChevronRight className="w-5 h-5 text-charcoal" aria-hidden="true" />
                    </button>
                    <h2 aria-live="polite" className="text-xl font-serif font-semibold text-charcoal ml-2 mb-0 first-letter:uppercase">
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
