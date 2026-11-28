import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import type { Booking } from '@/types/models';

interface NextBookingCardProps {
    nextBooking: Booking | null;
    onOpenDetails: () => void;
}

const formatBookingDates = (start: Date, end: Date) => {
    // 17. - 20. júní
    const startDay = start.getDate();
    const endDay = end.getDate();
    const month = format(end, 'MMMM', { locale: is });
    return `${startDay}.- ${endDay}. ${month} `;
};

const getDaysUntil = (date: Date) => {
    const diff = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Í dag';
    if (diff === 1) return 'Á morgun';
    return `Eftir ${diff} daga`;
};

/** NEXT BOOKING CARD */
export default function NextBookingCard({ nextBooking, onOpenDetails }: NextBookingCardProps) {
    return (
        <section
            className={nextBooking ? "group relative cursor-pointer" : ""}
        >
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Næst á dagskrá</h3>
                {nextBooking ? (
                    <button
                        type="button"
                        onClick={onOpenDetails}
                        aria-label="Sjá nánari upplýsingar um næstu bókun"
                        className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-amber group-hover:text-charcoal transition-colors after:absolute after:inset-0 after:z-[15]"
                    >
                        <ChevronRight size={18} aria-hidden="true" />
                    </button>
                ) : (
                    <div aria-hidden="true" className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                        <ChevronRight size={18} />
                    </div>
                )}
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber" aria-hidden="true"></div>

                {/* Background Pattern */}
                <div className="absolute right-0 top-0 opacity-[0.03] transform translate-x-1/3 -translate-y-1/3 pointer-events-none" aria-hidden="true">
                    <Calendar size={200} />
                </div>

                <div className="relative z-10">
                    {nextBooking ? (
                        <>
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber/10 text-amber-ink font-bold text-xs rounded-full uppercase tracking-wider mb-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber motion-safe:animate-pulse" aria-hidden="true"></div>
                                        {getDaysUntil(nextBooking.start)}
                                    </div>
                                    <h4 className="text-2xl font-serif font-bold text-[#1a1a1a] mb-1">
                                        {formatBookingDates(nextBooking.start, nextBooking.end)}
                                    </h4>
                                    <p className="text-stone-500 font-medium">
                                        {nextBooking.user_name}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-stone-100">
                                <div className="text-center flex-1">
                                    <p className="text-[10px] uppercase text-stone-500 font-bold tracking-widest mb-0.5">Nætur</p>
                                    <p className="font-bold text-lg text-[#1a1a1a]">
                                        {Math.ceil((nextBooking.end.getTime() - nextBooking.start.getTime()) / (1000 * 60 * 60 * 24))}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-8 text-center">
                            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300" aria-hidden="true">
                                <Calendar size={32} />
                            </div>
                            <h4 className="font-bold text-lg text-stone-900 mb-2">Ekkert bókað</h4>
                            <p className="text-stone-500 text-sm mb-6 max-w-[200px] mx-auto">
                                Það eru engar bókanir framundan. Bústaðurinn er laus!
                            </p>
                            <Link
                                to="/calendar"
                                className="text-amber-ink font-bold text-sm hover:underline"
                            >
                                Bóka helgi núna
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
