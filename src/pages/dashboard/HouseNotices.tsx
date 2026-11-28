import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { House, User } from '@/types/models';
import type { LastCheckoutChecklist } from './types';

interface HouseNoticesProps {
    currentHouse: House;
    currentUser: User | null;
    lastCheckoutChecklist: LastCheckoutChecklist | null;
}

/** Last-checkout checklist strip and the missing-address warning (managers/owners only). */
export default function HouseNotices({ currentHouse, currentUser, lastCheckoutChecklist }: HouseNoticesProps) {
    return (
        <>
            {/* Last Checkout Checklist Strip */}
            {lastCheckoutChecklist && (
                lastCheckoutChecklist.allChecked ? (
                    <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-medium">
                        Síðasta brottför: allt staðfest <span aria-hidden="true">✓</span>
                    </div>
                ) : (
                    <div className="bg-amber/10 border border-amber/20 text-amber-900 px-4 py-2.5 rounded-xl text-xs font-medium">
                        Ekki staðfest við síðustu brottför: {lastCheckoutChecklist.uncheckedItems.join(', ')}
                    </div>
                )
            )}

            {/* Missing Address Warning */}
            {(!currentHouse.address || currentHouse.address.trim() === '') && currentUser?.uid && (currentUser.uid === currentHouse.manager_id || currentHouse.owner_ids?.includes(currentUser.uid)) && (
                <div className="bg-amber/10 border border-amber/20 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="w-10 h-10 bg-amber rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber/20" aria-hidden="true">
                            <MapPin size={24} className="text-[#1a1a1a]" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-[#1a1a1a] text-lg mb-1">Vantar heimilisfang!</h3>
                            <p className="text-stone-600 text-sm leading-relaxed max-w-2xl">
                                Til þess að fá <strong>veðurspá</strong>, nákvæma <strong>staðsetningu á korti</strong> og leiðbeiningar fyrir gesti þarf að skrá heimilisfang hússins.
                            </p>
                        </div>
                        <Link
                            to="/settings?tab=house"
                            className="bg-[#1a1a1a] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-stone-800 transition-all whitespace-nowrap shadow-lg"
                        >
                            Skrá heimilisfang
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
