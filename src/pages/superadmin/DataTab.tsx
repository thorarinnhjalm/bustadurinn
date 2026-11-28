import { Home, Users, UserCog, Building2 } from 'lucide-react';

import type { DataSubTab, SetActionLoading, SetStats, Stats, UserActions } from './types';
import HousesSubTab from './HousesSubTab';
import UsersSubTab from './UsersSubTab';
import OrganizationsSubTab from './OrganizationsSubTab';
import ProvidersSubTab from './ProvidersSubTab';

interface DataTabProps {
    stats: Stats;
    setStats: SetStats;
    actionLoading: string | null;
    setActionLoading: SetActionLoading;
    userActions: UserActions;
    /** Kept by the page so the selection survives switching top-level tabs. */
    subTab: DataSubTab;
    onSubTabChange: (tab: DataSubTab) => void;
}

export default function DataTab({ stats, setStats, actionLoading, setActionLoading, userActions, subTab: dataSubTab, onSubTabChange: setDataSubTab }: DataTabProps) {
    return (
        <>
            <div className="space-y-6">
                {/* Sub-tab Navigation */}
                <div className="flex gap-2 border-b border-stone-200 overflow-x-auto">
                    <button
                        type="button"
                        aria-current={dataSubTab === 'houses' ? 'page' : undefined}
                        onClick={() => setDataSubTab('houses')}
                        className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${dataSubTab === 'houses'
                            ? 'text-charcoal border-b-2 border-amber'
                            : 'text-grey-mid hover:text-stone-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            Hús
                        </div>
                    </button>
                    <button
                        type="button"
                        aria-current={dataSubTab === 'users' ? 'page' : undefined}
                        onClick={() => setDataSubTab('users')}
                        className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${dataSubTab === 'users'
                            ? 'text-charcoal border-b-2 border-amber'
                            : 'text-grey-mid hover:text-stone-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Notendur
                        </div>
                    </button>
                    <button
                        type="button"
                        aria-current={dataSubTab === 'organizations' ? 'page' : undefined}
                        onClick={() => setDataSubTab('organizations')}
                        className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${dataSubTab === 'organizations'
                            ? 'text-charcoal border-b-2 border-amber'
                            : 'text-grey-mid hover:text-stone-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Félög
                        </div>
                    </button>
                    <button
                        type="button"
                        aria-current={dataSubTab === 'providers' ? 'page' : undefined}
                        onClick={() => setDataSubTab('providers')}
                        className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${dataSubTab === 'providers'
                            ? 'text-charcoal border-b-2 border-amber'
                            : 'text-grey-mid hover:text-stone-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <UserCog className="w-4 h-4" />
                            Verktakar
                        </div>
                    </button>
                </div>
            </div>

            {/* Sub-tab Content */}
            {dataSubTab === 'organizations' && <OrganizationsSubTab stats={stats} setStats={setStats} />}
            {dataSubTab === 'providers' && (
                <ProvidersSubTab stats={stats} setStats={setStats} actionLoading={actionLoading} setActionLoading={setActionLoading} />
            )}
            {dataSubTab === 'houses' && (
                <HousesSubTab stats={stats} setStats={setStats} actionLoading={actionLoading} setActionLoading={setActionLoading} />
            )}
            {dataSubTab === 'users' && (
                <UsersSubTab stats={stats} actionLoading={actionLoading} setActionLoading={setActionLoading} userActions={userActions} />
            )}
        </>
    );
}
