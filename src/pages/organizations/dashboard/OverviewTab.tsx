import { Users, CheckCircle, XCircle, Clock, Calendar, Home } from 'lucide-react';
import type { Organization, AccessRequest, OrganizationMember, BookingRequest, House } from '@/types/models';

interface OverviewTabProps {
    organization: Organization;
    houses: House[];
    members: OrganizationMember[];
    bookingRequests: BookingRequest[];
    pendingAccessRequests: AccessRequest[];
    pendingBookingRequests: BookingRequest[];
    onApproveAccess: (requestId: string) => void;
    onDenyAccess: (requestId: string) => void;
    onShowAccessRequests: () => void;
}

export default function OverviewTab({
    organization,
    houses,
    members,
    bookingRequests,
    pendingAccessRequests,
    pendingBookingRequests,
    onApproveAccess,
    onDenyAccess,
    onShowAccessRequests,
}: OverviewTabProps) {
    const activeMembers = members.filter((m) => m.status === 'active');

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-serif">Yfirlit</h2>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-grey-mid text-sm">Sumarhús</h3>
                        <Home aria-hidden="true" className="w-5 h-5 text-grey-mid" />
                    </div>
                    <p className="text-3xl font-bold">{houses.length}</p>
                    <p className="text-sm text-grey-mid mt-1">
                        {organization.stats.total_properties} skráð
                    </p>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-grey-mid text-sm">Starfsmenn</h3>
                        <Users aria-hidden="true" className="w-5 h-5 text-grey-mid" />
                    </div>
                    <p className="text-3xl font-bold">{organization.stats.total_members}</p>
                    <p className="text-sm text-grey-mid mt-1">
                        {organization.stats.active_members} virkir
                    </p>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-grey-mid text-sm">Bókanir í ár</h3>
                        <Calendar aria-hidden="true" className="w-5 h-5 text-grey-mid" />
                    </div>
                    <p className="text-3xl font-bold">{organization.stats.total_bookings}</p>
                    <p className="text-sm text-grey-mid mt-1">Samþykktar</p>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-grey-mid text-sm">Bíða samþykkis</h3>
                        <Clock aria-hidden="true" className="w-5 h-5 text-grey-mid" />
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
                            <span className="text-sm">Með gestaaðgang</span>
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
                            <span className="font-semibold text-yellow-800">
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
                                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 bg-grey-lightest rounded-lg"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium">{request.name}</p>
                                    <p className="text-sm text-grey-mid">{request.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onApproveAccess(request.id)}
                                        className="btn btn-sm bg-green-700 hover:bg-green-800 text-white"
                                    >
                                        <CheckCircle aria-hidden="true" className="w-4 h-4" />
                                        Samþykkja
                                    </button>
                                    <button
                                        onClick={() => onDenyAccess(request.id)}
                                        className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        <XCircle aria-hidden="true" className="w-4 h-4" />
                                        Hafna
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {pendingAccessRequests.length > 5 && (
                        <button
                            onClick={onShowAccessRequests}
                            className="mt-4 text-charcoal hover:underline"
                        >
                            Sjá allar beiðnir →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
