/**
 * Organization Dashboard Page
 * For organization admins to manage everything
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Building2,
    Users,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    UserPlus,
    Calendar,
    Settings,
    Home,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import {
    getOrganization,
    getAccessRequests,
    getOrganizationMembers,
    getBookingRequests,
    approveAccessRequest,
    denyAccessRequest,
    approveBookingRequest,
    denyBookingRequest,
    isOrgAdmin,
    getOrganizationHouses,
    createOrganizationHouse,
    removeHouseFromOrganization,
    updateOrganization,
} from '@/services/organizationService';
import type {
    Organization,
    AccessRequest,
    OrganizationMember,
    BookingRequest,
    House,
} from '@/types/models';
import SEO from '@/components/SEO';

type Tab = 'overview' | 'access-requests' | 'members' | 'booking-requests' | 'houses' | 'settings';

export default function OrganizationDashboardPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const currentUser = useAppStore((state) => state.currentUser);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
    const [houses, setHouses] = useState<House[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState('');
    const [showAddHouseModal, setShowAddHouseModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [orgId, currentUser]);

    const loadData = async () => {
        if (!orgId || !currentUser) return;

        try {
            // Check if user is admin
            const adminStatus = await isOrgAdmin(currentUser.uid, orgId);
            setIsAdmin(adminStatus);

            if (!adminStatus) {
                setError('Þú hefur ekki réttindi til að skoða þessa síðu');
                setIsLoading(false);
                return;
            }

            // Load organization
            const org = await getOrganization(orgId);
            if (!org) {
                setError('Félag fannst ekki');
                setIsLoading(false);
                return;
            }
            setOrganization(org);

            // Load data
            const [requests, mems, bookings, orgHouses] = await Promise.all([
                getAccessRequests(orgId),
                getOrganizationMembers(orgId),
                getBookingRequests(orgId),
                getOrganizationHouses(orgId),
            ]);

            setAccessRequests(requests);
            setMembers(mems);
            setBookingRequests(bookings);
            setHouses(orgHouses);
        } catch (err) {
            console.error('Error loading organization data:', err);
            setError('Villa kom upp við að sækja gögn');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveAccess = async (requestId: string) => {
        if (!orgId || !currentUser || !organization) return;

        try {
            await approveAccessRequest(
                orgId,
                requestId,
                currentUser.uid,
                currentUser.name || 'Admin'
            );
            await loadData(); // Reload data
        } catch (err) {
            console.error('Error approving access:', err);
            alert('Villa kom upp við að samþykkja aðgang');
        }
    };

    const handleDenyAccess = async (requestId: string) => {
        if (!orgId || !currentUser) return;

        const reason = prompt('Ástæða fyrir höfnun:');
        if (!reason) return;

        try {
            await denyAccessRequest(
                orgId,
                requestId,
                currentUser.uid,
                currentUser.name || 'Admin',
                reason
            );
            await loadData();
        } catch (err) {
            console.error('Error denying access:', err);
            alert('Villa kom upp við að hafna aðgangi');
        }
    };

    const handleApproveBooking = async (requestId: string) => {
        if (!orgId || !currentUser) return;

        try {
            await approveBookingRequest(
                orgId,
                requestId,
                currentUser.uid,
                currentUser.name || 'Admin'
            );
            await loadData();
        } catch (err) {
            console.error('Error approving booking:', err);
            alert('Villa kom upp við að samþykkja bókun');
        }
    };

    const handleDenyBooking = async (requestId: string) => {
        if (!orgId || !currentUser) return;

        const reason = prompt('Ástæða fyrir höfnun:');
        if (!reason) return;

        try {
            await denyBookingRequest(
                orgId,
                requestId,
                currentUser.uid,
                currentUser.name || 'Admin',
                reason
            );
            await loadData();
        } catch (err) {
            console.error('Error denying booking:', err);
            alert('Villa kom upp við að hafna bókun');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bone flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-grey-mid">Hleð...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin || !organization) {
        return (
            <div className="min-h-screen bg-bone flex items-center justify-center p-6">
                <div className="card max-w-md text-center">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
                    <h2 className="text-2xl font-serif mb-4">Aðgangur bannaður</h2>
                    <p className="text-grey-dark mb-6">{error || 'Þú hefur ekki réttindi til að skoða þessa síðu'}</p>
                </div>
            </div>
        );
    }

    const pendingAccessRequests = accessRequests.filter((r) => r.status === 'pending');
    const pendingBookingRequests = bookingRequests.filter((r) => r.status === 'pending');
    const activeMembers = members.filter((m) => m.status === 'active');

    return (
        <div className="min-h-screen bg-bone">
            <SEO
                title={`Stjórnborð - ${organization.name}`}
                description="Stjórna félagi og bókunum"
            />

            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Building2 className="w-12 h-12 text-charcoal" />
                            <div>
                                <h1 className="text-3xl font-serif">{organization.name}</h1>
                                <p className="text-grey-mid">Stjórnborð</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                    organization.subscription_status === 'trial'
                                        ? 'bg-blue-100 text-blue-800'
                                        : organization.subscription_status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}
                            >
                                {organization.subscription_status === 'trial'
                                    ? 'Prufutímabil'
                                    : organization.subscription_status === 'active'
                                    ? 'Virkt'
                                    : 'Útrunnið'}
                            </span>
                            {organization.subscription_status === 'trial' && (
                                <p className="text-sm text-grey-mid mt-1">
                                    Rennur út:{' '}
                                    {new Date(organization.subscription_end).toLocaleDateString('is-IS')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-8">
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
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 py-4 border-b-2 transition-colors relative ${
                                    activeTab === id
                                        ? 'border-charcoal text-charcoal'
                                        : 'border-transparent text-grey-mid hover:text-charcoal'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{label}</span>
                                {badge !== undefined && badge > 0 && (
                                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-serif">Yfirlit</h2>

                        {/* Main Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="card">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-grey-mid text-sm">Sumarhús</h3>
                                    <Home className="w-5 h-5 text-grey-mid" />
                                </div>
                                <p className="text-3xl font-bold">{houses.length}</p>
                                <p className="text-sm text-grey-mid mt-1">
                                    {organization.stats.total_properties} skráð
                                </p>
                            </div>

                            <div className="card">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-grey-mid text-sm">Starfsmenn</h3>
                                    <Users className="w-5 h-5 text-grey-mid" />
                                </div>
                                <p className="text-3xl font-bold">{organization.stats.total_members}</p>
                                <p className="text-sm text-grey-mid mt-1">
                                    {organization.stats.active_members} virkir
                                </p>
                            </div>

                            <div className="card">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-grey-mid text-sm">Bókanir í ár</h3>
                                    <Calendar className="w-5 h-5 text-grey-mid" />
                                </div>
                                <p className="text-3xl font-bold">{organization.stats.total_bookings}</p>
                                <p className="text-sm text-grey-mid mt-1">Samþykktar</p>
                            </div>

                            <div className="card">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-grey-mid text-sm">Bíða samþykkis</h3>
                                    <Clock className="w-5 h-5 text-grey-mid" />
                                </div>
                                <p className="text-3xl font-bold">
                                    {pendingAccessRequests.length + pendingBookingRequests.length}
                                </p>
                                <p className="text-sm text-grey-mid mt-1">
                                    {pendingAccessRequests.length} aðgangs, {pendingBookingRequests.length}{' '}
                                    bókunar
                                </p>
                            </div>
                        </div>

                        {/* Detailed Stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Member Breakdown */}
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-4">Starfsmannayfirlit</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-2 border-b">
                                        <span className="text-sm">Virkir meðlimir</span>
                                        <span className="font-semibold">{activeMembers.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b">
                                        <span className="text-sm">Með guest aðgang</span>
                                        <span className="font-semibold">
                                            {members.filter((m) => m.access_level === 'guest').length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b">
                                        <span className="text-sm">Með fullan aðgang</span>
                                        <span className="font-semibold">
                                            {members.filter((m) => m.access_level === 'full').length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm">Í bið</span>
                                        <span className="font-semibold">
                                            {members.filter((m) => m.status === 'pending').length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Stats */}
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-4">Bókunaryfirlit</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-2 border-b">
                                        <span className="text-sm">Samþykktar bókanir</span>
                                        <span className="font-semibold">
                                            {bookingRequests.filter((b) => b.status === 'approved').length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b">
                                        <span className="text-sm">Bíða samþykkis</span>
                                        <span className="font-semibold text-yellow-600">
                                            {pendingBookingRequests.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b">
                                        <span className="text-sm">Hafnað</span>
                                        <span className="font-semibold">
                                            {bookingRequests.filter((b) => b.status === 'denied').length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm">Meðalfjöldi nætur</span>
                                        <span className="font-semibold">
                                            {bookingRequests.length > 0
                                                ? Math.round(
                                                      bookingRequests.reduce(
                                                          (sum, b) => sum + b.num_nights,
                                                          0
                                                      ) / bookingRequests.length
                                                  )
                                                : 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Active Members List */}
                        {activeMembers.length > 0 && (
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-4">
                                    Virkustu meðlimir ({activeMembers.length})
                                </h3>
                                <div className="space-y-2">
                                    {activeMembers
                                        .sort((a, b) => b.bookings_total - a.bookings_total)
                                        .slice(0, 5)
                                        .map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-3 bg-grey-lightest rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-sm text-grey-mid">{member.email}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">
                                                        {member.bookings_total} bókanir
                                                    </p>
                                                    <p className="text-sm text-grey-mid">
                                                        {member.days_booked_this_year} nætur í ár
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Activity */}
                        {pendingAccessRequests.length > 0 && (
                            <div className="card">
                                <h3 className="text-xl font-serif mb-4">
                                    Nýjustu aðgangsbeiðnir ({pendingAccessRequests.length})
                                </h3>
                                <div className="space-y-3">
                                    {pendingAccessRequests.slice(0, 5).map((request) => (
                                        <div
                                            key={request.id}
                                            className="flex items-center justify-between p-3 bg-grey-lightest rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium">{request.name}</p>
                                                <p className="text-sm text-grey-mid">{request.email}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproveAccess(request.id)}
                                                    className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Samþykkja
                                                </button>
                                                <button
                                                    onClick={() => handleDenyAccess(request.id)}
                                                    className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Hafna
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {pendingAccessRequests.length > 5 && (
                                    <button
                                        onClick={() => setActiveTab('access-requests')}
                                        className="mt-4 text-charcoal hover:underline"
                                    >
                                        Sjá allar beiðnir →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Access Requests Tab */}
                {activeTab === 'access-requests' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-serif">Aðgangsbeiðnir</h2>

                        {accessRequests.length === 0 ? (
                            <div className="card text-center py-12">
                                <UserPlus className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
                                <p className="text-grey-mid">Engar aðgangsbeiðnir enn</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {accessRequests.map((request) => (
                                    <div key={request.id} className="card">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold">{request.name}</h3>
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            request.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : request.status === 'approved'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {request.status === 'pending'
                                                            ? 'Í bið'
                                                            : request.status === 'approved'
                                                            ? 'Samþykkt'
                                                            : 'Hafnað'}
                                                    </span>
                                                    {request.email_domain_verified && (
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            ✓ Netfangslén staðfest
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-grey-mid mb-1">{request.email}</p>
                                                {request.employee_id && (
                                                    <p className="text-sm text-grey-mid">
                                                        Starfsmannanúmer: {request.employee_id}
                                                    </p>
                                                )}
                                                {request.department && (
                                                    <p className="text-sm text-grey-mid">
                                                        Deild: {request.department}
                                                    </p>
                                                )}
                                                {request.reason && (
                                                    <p className="text-sm text-grey-dark mt-2 p-3 bg-grey-lightest rounded">
                                                        {request.reason}
                                                    </p>
                                                )}
                                                <p className="text-xs text-grey-mid mt-2">
                                                    Óskað: {new Date(request.requested_at).toLocaleDateString('is-IS')}
                                                </p>
                                            </div>
                                            {request.status === 'pending' && (
                                                <div className="flex gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleApproveAccess(request.id)}
                                                        className="btn bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                        Samþykkja
                                                    </button>
                                                    <button
                                                        onClick={() => handleDenyAccess(request.id)}
                                                        className="btn bg-red-600 hover:bg-red-700 text-white"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                        Hafna
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-serif">Starfsmenn ({members.length})</h2>

                        {members.length === 0 ? (
                            <div className="card text-center py-12">
                                <Users className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
                                <p className="text-grey-mid">Engir starfsmenn enn</p>
                            </div>
                        ) : (
                            <div className="card">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4">Nafn</th>
                                                <th className="text-left py-3 px-4">Netfang</th>
                                                <th className="text-left py-3 px-4">Deild</th>
                                                <th className="text-left py-3 px-4">Staða</th>
                                                <th className="text-left py-3 px-4">Bókanir í ár</th>
                                                <th className="text-left py-3 px-4">Aðgangsstig</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {members.map((member) => (
                                                <tr key={member.id} className="border-b hover:bg-grey-lightest">
                                                    <td className="py-3 px-4 font-medium">{member.name}</td>
                                                    <td className="py-3 px-4 text-grey-mid">{member.email}</td>
                                                    <td className="py-3 px-4 text-grey-mid">
                                                        {member.department || '-'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                member.status === 'active'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : member.status === 'approved'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-grey-light text-grey-dark'
                                                            }`}
                                                        >
                                                            {member.status === 'active'
                                                                ? 'Virkur'
                                                                : member.status === 'approved'
                                                                ? 'Samþykkt'
                                                                : member.status === 'suspended'
                                                                ? 'Frysta'
                                                                : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {member.bookings_this_year} ({member.days_booked_this_year}{' '}
                                                        nætur)
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                member.access_level === 'full'
                                                                    ? 'bg-charcoal text-white'
                                                                    : 'bg-grey-light text-grey-dark'
                                                            }`}
                                                        >
                                                            {member.access_level === 'full' ? 'Fullur' : 'Gestur'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Booking Requests Tab */}
                {activeTab === 'booking-requests' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-serif">Bókunarbeiðnir</h2>

                        {bookingRequests.length === 0 ? (
                            <div className="card text-center py-12">
                                <Calendar className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
                                <p className="text-grey-mid">Engar bókunarbeiðnir enn</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bookingRequests.map((request) => (
                                    <div key={request.id} className="card">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold">{request.house_name}</h3>
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            request.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : request.status === 'approved'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {request.status === 'pending'
                                                            ? 'Í bið'
                                                            : request.status === 'approved'
                                                            ? 'Samþykkt'
                                                            : 'Hafnað'}
                                                    </span>
                                                </div>
                                                <p className="text-grey-dark mb-2">
                                                    <strong>{request.user_name}</strong> ({request.user_email})
                                                </p>
                                                <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                                                    <div>
                                                        <span className="text-grey-mid">Dagsetningar:</span>
                                                        <p>
                                                            {new Date(request.start_date).toLocaleDateString('is-IS')} -{' '}
                                                            {new Date(request.end_date).toLocaleDateString('is-IS')}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-grey-mid">Nætur:</span>
                                                        <p>{request.num_nights}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-grey-mid">Gestir:</span>
                                                        <p>{request.num_guests}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-grey-mid">Tilgangur:</span>
                                                        <p>
                                                            {request.purpose === 'personal'
                                                                ? 'Persónulegt'
                                                                : request.purpose === 'family'
                                                                ? 'Fjölskylda'
                                                                : 'Vinnuferð'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {request.notes && (
                                                    <p className="text-sm text-grey-dark p-3 bg-grey-lightest rounded">
                                                        {request.notes}
                                                    </p>
                                                )}
                                            </div>
                                            {request.status === 'pending' && (
                                                <div className="flex gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleApproveBooking(request.id)}
                                                        className="btn bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                        Samþykkja
                                                    </button>
                                                    <button
                                                        onClick={() => handleDenyBooking(request.id)}
                                                        className="btn bg-red-600 hover:bg-red-700 text-white"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                        Hafna
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Houses Tab */}
                {activeTab === 'houses' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-serif">Sumarhús</h2>
                            <button
                                onClick={() => setShowAddHouseModal(true)}
                                className="btn btn-primary"
                            >
                                <Home className="w-5 h-5" />
                                Bæta við húsi
                            </button>
                        </div>

                        {houses.length === 0 ? (
                            <div className="card text-center py-12">
                                <Home className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
                                <p className="text-grey-mid mb-4">Engin hús skráð</p>
                                <p className="text-sm text-grey-mid mb-6">
                                    Byrjaðu með að bæta við fyrsta sumarhúsinu þínu
                                </p>
                                <button
                                    onClick={() => setShowAddHouseModal(true)}
                                    className="btn btn-primary"
                                >
                                    <Home className="w-5 h-5" />
                                    Bæta við húsi
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {houses.map((house) => (
                                    <div key={house.id} className="card">
                                        {house.image_url && (
                                            <img
                                                src={house.image_url}
                                                alt={house.name}
                                                className="w-full h-48 object-cover rounded-lg mb-4"
                                            />
                                        )}
                                        <h3 className="text-xl font-serif mb-2">{house.name}</h3>
                                        <p className="text-sm text-grey-mid mb-4">{house.address}</p>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    // TODO: Open edit modal
                                                    alert('Breyta húsi - í þróun');
                                                }}
                                                className="btn btn-secondary flex-1"
                                            >
                                                Breyta
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (
                                                        confirm(
                                                            `Ertu viss um að þú viljir fjarlægja ${house.name} úr félaginu?`
                                                        )
                                                    ) {
                                                        try {
                                                            await removeHouseFromOrganization(
                                                                house.id,
                                                                orgId!
                                                            );
                                                            await loadData();
                                                        } catch (err) {
                                                            console.error('Error removing house:', err);
                                                            alert('Villa kom upp við að fjarlægja hús');
                                                        }
                                                    }
                                                }}
                                                className="btn bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Fjarlægja
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add House Modal */}
                        {showAddHouseModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                    <div className="p-6">
                                        <h3 className="text-2xl font-serif mb-6">Bæta við sumarhúsi</h3>

                                        <form
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                const formData = new FormData(e.currentTarget);

                                                const houseData: Partial<House> = {
                                                    name: formData.get('name') as string,
                                                    address: formData.get('address') as string,
                                                    location: {
                                                        lat: parseFloat(
                                                            formData.get('lat') as string
                                                        ),
                                                        lng: parseFloat(
                                                            formData.get('lng') as string
                                                        ),
                                                    },
                                                    image_url: formData.get('image_url') as string,
                                                    house_rules: formData.get('house_rules') as string,
                                                    amenities: [],
                                                    holiday_mode: 'fairness',
                                                };

                                                try {
                                                    await createOrganizationHouse(
                                                        orgId!,
                                                        houseData,
                                                        currentUser!.uid
                                                    );
                                                    setShowAddHouseModal(false);
                                                    await loadData();
                                                } catch (err) {
                                                    console.error('Error creating house:', err);
                                                    alert('Villa kom upp við að búa til hús');
                                                }
                                            }}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <label className="label">Nafn húss</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    required
                                                    className="input w-full"
                                                    placeholder="t.d. Sumarbústaður við Þingvallavatn"
                                                />
                                            </div>

                                            <div>
                                                <label className="label">Heimilisfang</label>
                                                <input
                                                    type="text"
                                                    name="address"
                                                    required
                                                    className="input w-full"
                                                    placeholder="t.d. Þingvallavegur 123, 801 Selfoss"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="label">Breiddargráða (Lat)</label>
                                                    <input
                                                        type="number"
                                                        name="lat"
                                                        step="any"
                                                        required
                                                        className="input w-full"
                                                        placeholder="64.1234"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="label">Lengdargráða (Lng)</label>
                                                    <input
                                                        type="number"
                                                        name="lng"
                                                        step="any"
                                                        required
                                                        className="input w-full"
                                                        placeholder="-21.1234"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="label">Mynd URL (valkvætt)</label>
                                                <input
                                                    type="url"
                                                    name="image_url"
                                                    className="input w-full"
                                                    placeholder="https://example.com/mynd.jpg"
                                                />
                                            </div>

                                            <div>
                                                <label className="label">Húsreglur (valkvætt)</label>
                                                <textarea
                                                    name="house_rules"
                                                    className="input w-full min-h-[100px]"
                                                    placeholder="Skrifaðu húsreglur hér..."
                                                />
                                            </div>

                                            <div className="flex gap-3 pt-4">
                                                <button type="submit" className="btn btn-primary flex-1">
                                                    Búa til hús
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAddHouseModal(false)}
                                                    className="btn btn-secondary flex-1"
                                                >
                                                    Hætta við
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-serif">Stillingar</h2>

                        {/* Basic Info */}
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4">Grunnupplýsingar</h3>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);

                                    try {
                                        await updateOrganization(orgId!, {
                                            name: formData.get('name') as string,
                                            billing_email: formData.get('billing_email') as string,
                                        });
                                        await loadData();
                                        alert('Upplýsingar uppfærðar');
                                    } catch (err) {
                                        console.error('Error updating organization:', err);
                                        alert('Villa kom upp við að uppfæra');
                                    }
                                }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Nafn félags</label>
                                        <input
                                            type="text"
                                            name="name"
                                            defaultValue={organization.name}
                                            className="input w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Reikningsnetfang</label>
                                        <input
                                            type="email"
                                            name="billing_email"
                                            defaultValue={organization.billing_email}
                                            className="input w-full"
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    Vista breytingar
                                </button>
                            </form>
                        </div>

                        {/* Access & Booking Rules */}
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4">Aðgangs- og bókunarreglur</h3>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);

                                    try {
                                        await updateOrganization(orgId!, {
                                            settings: {
                                                ...organization.settings,
                                                require_access_approval:
                                                    formData.get('require_access_approval') === 'on',
                                                auto_approve_company_email:
                                                    formData.get('auto_approve_company_email') === 'on',
                                                require_booking_approval:
                                                    formData.get('require_booking_approval') === 'on',
                                                max_nights_per_booking: parseInt(
                                                    formData.get('max_nights_per_booking') as string
                                                ) || undefined,
                                                max_bookings_per_year: parseInt(
                                                    formData.get('max_bookings_per_year') as string
                                                ) || undefined,
                                                advance_booking_days: parseInt(
                                                    formData.get('advance_booking_days') as string
                                                ) || undefined,
                                            },
                                        });
                                        await loadData();
                                        alert('Stillingar uppfærðar');
                                    } catch (err) {
                                        console.error('Error updating settings:', err);
                                        alert('Villa kom upp við að uppfæra');
                                    }
                                }}
                                className="space-y-4"
                            >
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="require_access_approval"
                                            defaultChecked={organization.settings.require_access_approval}
                                            className="w-5 h-5"
                                        />
                                        <div>
                                            <p className="font-medium">Krefja samþykki fyrir aðgang</p>
                                            <p className="text-sm text-grey-mid">
                                                Stjórnandi þarf að samþykkja allar aðgangsbeiðnir
                                            </p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="auto_approve_company_email"
                                            defaultChecked={organization.settings.auto_approve_company_email}
                                            className="w-5 h-5"
                                        />
                                        <div>
                                            <p className="font-medium">Samþykkja sjálfkrafa netföng frá félagi</p>
                                            <p className="text-sm text-grey-mid">
                                                Notendur með leyfileg netfangslén fá sjálfvirkan aðgang
                                            </p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="require_booking_approval"
                                            defaultChecked={organization.settings.require_booking_approval}
                                            className="w-5 h-5"
                                        />
                                        <div>
                                            <p className="font-medium">Krefja samþykki fyrir bókanir</p>
                                            <p className="text-sm text-grey-mid">
                                                Stjórnandi þarf að samþykkja allar bókunarbeiðnir
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                    <div>
                                        <label className="label">Hámarks nætur per bókun</label>
                                        <input
                                            type="number"
                                            name="max_nights_per_booking"
                                            defaultValue={organization.settings.max_nights_per_booking}
                                            className="input w-full"
                                            min="1"
                                            placeholder="Ótakmarkað"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Hámarks bókanir per ár</label>
                                        <input
                                            type="number"
                                            name="max_bookings_per_year"
                                            defaultValue={organization.settings.max_bookings_per_year}
                                            className="input w-full"
                                            min="1"
                                            placeholder="Ótakmarkað"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Bóka fram í tímann (dagar)</label>
                                        <input
                                            type="number"
                                            name="advance_booking_days"
                                            defaultValue={organization.settings.advance_booking_days}
                                            className="input w-full"
                                            min="1"
                                            placeholder="Ótakmarkað"
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary">
                                    Vista reglur
                                </button>
                            </form>
                        </div>

                        {/* Email Domains */}
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4">Leyfileg netfangslén</h3>
                            <p className="text-sm text-grey-mid mb-4">
                                Notendur með þessi netfangslén fá sjálfvirkan aðgang ef kveikt er á því
                            </p>

                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const newDomain = (formData.get('domain') as string).trim().toLowerCase();

                                    if (!newDomain) return;

                                    if (organization.settings.allowed_email_domains.includes(newDomain)) {
                                        alert('Þetta netfangslén er nú þegar á listanum');
                                        return;
                                    }

                                    try {
                                        await updateOrganization(orgId!, {
                                            settings: {
                                                ...organization.settings,
                                                allowed_email_domains: [
                                                    ...organization.settings.allowed_email_domains,
                                                    newDomain,
                                                ],
                                            },
                                        });
                                        await loadData();
                                        e.currentTarget.reset();
                                    } catch (err) {
                                        console.error('Error adding domain:', err);
                                        alert('Villa kom upp við að bæta við léni');
                                    }
                                }}
                                className="flex gap-2 mb-4"
                            >
                                <input
                                    type="text"
                                    name="domain"
                                    className="input flex-1"
                                    placeholder="t.d. example.is"
                                    pattern="[a-z0-9.-]+"
                                />
                                <button type="submit" className="btn btn-primary">
                                    Bæta við
                                </button>
                            </form>

                            {organization.settings.allowed_email_domains.length === 0 ? (
                                <p className="text-grey-mid text-sm">Engin netfangslén tilgreind</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {organization.settings.allowed_email_domains.map((domain) => (
                                        <span
                                            key={domain}
                                            className="inline-flex items-center gap-2 bg-grey-lightest px-3 py-1 rounded-full text-sm"
                                        >
                                            {domain}
                                            <button
                                                onClick={async () => {
                                                    if (
                                                        confirm(
                                                            `Ertu viss um að þú viljir fjarlægja ${domain}?`
                                                        )
                                                    ) {
                                                        try {
                                                            await updateOrganization(orgId!, {
                                                                settings: {
                                                                    ...organization.settings,
                                                                    allowed_email_domains:
                                                                        organization.settings.allowed_email_domains.filter(
                                                                            (d) => d !== domain
                                                                        ),
                                                                },
                                                            });
                                                            await loadData();
                                                        } catch (err) {
                                                            console.error('Error removing domain:', err);
                                                            alert('Villa kom upp við að fjarlægja lén');
                                                        }
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
