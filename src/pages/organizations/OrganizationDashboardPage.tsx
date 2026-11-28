/**
 * Organization Dashboard Page
 * For organization admins to manage everything
 */

import { useState, useId } from 'react';
import { useParams } from 'react-router-dom';
import {
    Building2,
    Users,
    FileText,
    UserPlus,
    Settings,
    Home,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import SEO from '@/components/SEO';
import { useOrganizationDashboard } from './dashboard/useOrganizationDashboard';
import { useRequestActions } from './dashboard/useRequestActions';
import OverviewTab from './dashboard/OverviewTab';
import AccessRequestsTab from './dashboard/AccessRequestsTab';
import MembersTab from './dashboard/MembersTab';
import BookingRequestsTab from './dashboard/BookingRequestsTab';
import HousesTab from './dashboard/HousesTab';
import SettingsTab from './dashboard/SettingsTab';

type Tab = 'overview' | 'access-requests' | 'members' | 'booking-requests' | 'houses' | 'settings';

export default function OrganizationDashboardPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const currentUser = useAppStore((state) => state.currentUser);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const uid = useId();
    const fieldId = (name: string) => `${uid}-${name}`;

    // Platform super admins may open any organization (the rules allow it).
    const { isAdmin: isSuperAdmin } = useEffectiveUser();

    const {
        organization,
        accessRequests,
        members,
        bookingRequests,
        houses,
        isLoading,
        isAdmin,
        error,
        loadData,
    } = useOrganizationDashboard(orgId, currentUser, isSuperAdmin);

    const { handleApproveAccess, handleDenyAccess, handleApproveBooking, handleDenyBooking } =
        useRequestActions(orgId, currentUser, organization, loadData);

    if (isLoading) {
        return (
            <main id="main" className="min-h-screen bg-bone flex items-center justify-center">
                <div role="status" className="text-center">
                    <div aria-hidden="true" className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-grey-mid">Hleð...</p>
                </div>
            </main>
        );
    }

    if (!isAdmin || !organization) {
        return (
            <main id="main" className="min-h-screen bg-bone flex items-center justify-center p-6">
                <div className="card max-w-md text-center">
                    <Building2 aria-hidden="true" className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
                    <h1 className="text-2xl font-serif mb-4">Aðgangur bannaður</h1>
                    <p role="alert" className="text-grey-dark mb-6">{error || 'Þú hefur ekki réttindi til að skoða þessa síðu'}</p>
                </div>
            </main>
        );
    }

    const pendingAccessRequests = accessRequests.filter((r) => r.status === 'pending');
    const pendingBookingRequests = bookingRequests.filter((r) => r.status === 'pending');

    return (
        <main id="main" className="min-h-screen bg-bone">
            <SEO
                title={`Stjórnborð - ${organization.name}`}
                description="Stjórna félagi og bókunum"
            />

            {/* Header */}
            <header className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Building2 aria-hidden="true" className="w-12 h-12 text-charcoal" />
                            <div>
                                <h1 className="text-3xl font-serif">{organization.name}</h1>
                                <p className="text-grey-mid">Stjórnborð</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6">
                    <div
                        role="tablist"
                        aria-label="Hlutar stjórnborðs"
                        className="flex gap-8"
                        onKeyDown={(e) => {
                            // Arrow-key navigation between tabs (roving tabindex)
                            const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
                            if (!keys.includes(e.key)) return;
                            const tabs = Array.from(
                                e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                            );
                            const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
                            if (current === -1) return;
                            e.preventDefault();
                            let next = current;
                            if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
                            if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
                            if (e.key === 'Home') next = 0;
                            if (e.key === 'End') next = tabs.length - 1;
                            tabs[next].focus();
                            tabs[next].click();
                        }}
                    >
                        {[
                            { id: 'overview' as Tab, label: 'Yfirlit', icon: Building2 },
                            { id: 'access-requests' as Tab, label: 'Aðgangsbeiðnir', icon: UserPlus, badge: pendingAccessRequests.length },
                            { id: 'members' as Tab, label: 'Starfsmenn', icon: Users },
                            { id: 'booking-requests' as Tab, label: 'Bókunarbeiðnir', icon: FileText, badge: pendingBookingRequests.length },
                            { id: 'houses' as Tab, label: 'Hús', icon: Home },
                            { id: 'settings' as Tab, label: 'Stillingar', icon: Settings },
                        ].map(({ id, label, icon: Icon, badge }) => (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                id={fieldId(`tab-${id}`)}
                                aria-selected={activeTab === id}
                                aria-controls={fieldId('tabpanel')}
                                tabIndex={activeTab === id ? 0 : -1}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 py-4 border-b-2 transition-colors relative ${
                                    activeTab === id
                                        ? 'border-charcoal text-charcoal'
                                        : 'border-transparent text-grey-mid hover:text-charcoal'
                                }`}
                            >
                                <Icon aria-hidden="true" className="w-5 h-5" />
                                <span className="font-medium">{label}</span>
                                {badge !== undefined && badge > 0 && (
                                    <span className="absolute -top-1 -right-2 bg-red-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        <span className="sr-only">Í bið: </span>
                                        {badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div
                role="tabpanel"
                id={fieldId('tabpanel')}
                aria-labelledby={fieldId(`tab-${activeTab}`)}
                className="max-w-7xl mx-auto px-6 py-8"
            >
                {activeTab === 'overview' && (
                    <OverviewTab
                        organization={organization}
                        houses={houses}
                        members={members}
                        bookingRequests={bookingRequests}
                        pendingAccessRequests={pendingAccessRequests}
                        pendingBookingRequests={pendingBookingRequests}
                        onApproveAccess={handleApproveAccess}
                        onDenyAccess={handleDenyAccess}
                        onShowAccessRequests={() => setActiveTab('access-requests')}
                    />
                )}

                {activeTab === 'access-requests' && (
                    <AccessRequestsTab
                        accessRequests={accessRequests}
                        onApproveAccess={handleApproveAccess}
                        onDenyAccess={handleDenyAccess}
                    />
                )}

                {activeTab === 'members' && <MembersTab members={members} />}

                {activeTab === 'booking-requests' && (
                    <BookingRequestsTab
                        bookingRequests={bookingRequests}
                        onApproveBooking={handleApproveBooking}
                        onDenyBooking={handleDenyBooking}
                    />
                )}

                {activeTab === 'houses' && (
                    <HousesTab
                        idPrefix={uid}
                        orgId={orgId!}
                        currentUser={currentUser}
                        houses={houses}
                        loadData={loadData}
                    />
                )}

                {activeTab === 'settings' && (
                    <SettingsTab
                        idPrefix={uid}
                        orgId={orgId!}
                        organization={organization}
                        loadData={loadData}
                    />
                )}
            </div>
        </main>
    );
}
