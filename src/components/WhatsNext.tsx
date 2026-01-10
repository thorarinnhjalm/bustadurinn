import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Link2, ChevronRight, Sparkles } from 'lucide-react';
import type { House, User } from '@/types/models';

interface WhatsNextProps {
    house: House | null;
    currentUser: User | null;
    bookingsCount: number;
    membersCount: number;
}

interface Nudge {
    id: string;
    icon: typeof Calendar;
    title: string;
    description: string;
    link: string;
    color: string;
}

export default function WhatsNext({ house, currentUser, bookingsCount, membersCount }: WhatsNextProps) {
    const navigate = useNavigate();

    if (!house || !currentUser) return null;

    // Calculate what's done
    const hasBookings = bookingsCount > 0;
    const hasMultipleMembers = membersCount > 1;
    const hasGuestLink = !!house.guest_token;

    // Suggest next actions based on what's missing
    const nudges: Nudge[] = [];

    if (!hasBookings) {
        nudges.push({
            id: 'booking',
            icon: Calendar,
            title: 'Bókaðu fyrstu helgina',
            description: 'Dagatalið bíður þín — smelltu til að bóka dvöl.',
            link: '/calendar',
            color: 'bg-blue-50 text-blue-600'
        });
    }

    if (!hasMultipleMembers) {
        nudges.push({
            id: 'members',
            icon: Users,
            title: 'Bjóddu fjölskyldunni',
            description: 'Sendu boðshlekk til annarra eigenda húsins.',
            link: '/settings?tab=members',
            color: 'bg-purple-50 text-purple-600'
        });
    }

    if (!hasGuestLink && hasBookings) {
        nudges.push({
            id: 'guest',
            icon: Link2,
            title: 'Búðu til gestahlekk',
            description: 'Deildu upplýsingum með gestum á einfaldan hátt.',
            link: '/settings?tab=guests',
            color: 'bg-emerald-50 text-emerald-600'
        });
    }

    // If nothing to nudge, don't show
    if (nudges.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-amber" />
                <h3 className="font-serif font-bold text-lg text-charcoal">
                    Næstu skref
                </h3>
            </div>

            <div className="space-y-3">
                {nudges.slice(0, 2).map(nudge => (
                    <button
                        key={nudge.id}
                        onClick={() => navigate(nudge.link)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl border border-stone-100 hover:border-amber/30 hover:bg-amber/5 transition-all group text-left"
                    >
                        <div className={`w-10 h-10 rounded-full ${nudge.color} flex items-center justify-center flex-shrink-0`}>
                            <nudge.icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-charcoal">{nudge.title}</p>
                            <p className="text-xs text-stone-500 truncate">{nudge.description}</p>
                        </div>
                        <ChevronRight size={16} className="text-stone-300 group-hover:text-amber transition-colors flex-shrink-0" />
                    </button>
                ))}
            </div>
        </div>
    );
}
