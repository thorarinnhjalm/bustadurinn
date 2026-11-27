/**
 * Member Dashboard Page
 * For organization members to browse houses and request bookings
 */

import { useState, useEffect, useCallback, useId } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, Home, Calendar, User, MapPin } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import {
    getOrganization,
    getMyBookingRequests,
    getOrganizationHouses,
    submitBookingRequest,
    isOrgMember,
} from '@/services/organizationService';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';
import { toLocalDateInputValue, parseLocalDateInput } from './localDate';
import type { Organization, BookingRequest, House } from '@/types/models';
import SEO from '@/components/SEO';
import Modal from '@/components/ui/Modal';

export default function MemberDashboardPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const uid = useId();
    const fieldId = (name: string) => `${uid}-${name}`;
    const bookingFormId = `${uid}-booking-form`;
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState('');
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
    const currentUser = useAppStore((state) => state.currentUser);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [houses, setHouses] = useState<House[]>([]);
    const [myBookingRequests, setMyBookingRequests] = useState<BookingRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [error, setError] = useState('');
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedHouse, setSelectedHouse] = useState<House | null>(null);

    const [bookingFormData, setBookingFormData] = useState({
        start_date: '',
        end_date: '',
        num_guests: 2,
        purpose: 'personal' as 'personal' | 'family' | 'work_retreat',
        notes: '',
    });

    const loadData = useCallback(async () => {
        if (!orgId || !currentUser) return;

        try {
            // Check if user is member
            const memberStatus = await isOrgMember(currentUser.uid, orgId);
            setIsMember(memberStatus);

            if (!memberStatus) {
                setError('Þú ert ekki skráður starfsmaður í þessu félagi');
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

            // Houses of the organization (readable for org members) and my own
            // booking requests (the user_id filter is what the rules require).
            const [housesData, myRequests] = await Promise.all([
                getOrganizationHouses(orgId),
                getMyBookingRequests(orgId, currentUser.uid),
            ]);
            setHouses(housesData);
            setMyBookingRequests(myRequests);
        } catch (err) {
            logger.error('Error loading member dashboard:', err);
            setError('Villa kom upp við að sækja gögn');
        } finally {
            setIsLoading(false);
        }
    }, [orgId, currentUser]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRequestBooking = (house: House) => {
        setSelectedHouse(house);
        setBookingError('');
        setBookingSuccess('');
        setShowBookingForm(true);
    };

    const handleSubmitBooking = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!orgId || !currentUser || !selectedHouse || !organization) return;
        if (isSubmittingBooking) return;
        setBookingError('');

        // Validation
        if (!bookingFormData.start_date || !bookingFormData.end_date) {
            setBookingError('Vinsamlegast veldu dagsetningar');
            return;
        }

        const startDate = parseLocalDateInput(bookingFormData.start_date);
        const endDate = parseLocalDateInput(bookingFormData.end_date);

        if (!startDate || !endDate) {
            setBookingError('Vinsamlegast veldu dagsetningar');
            return;
        }

        if (startDate >= endDate) {
            setBookingError('Brottfarardagur verður að vera eftir komudags');
            return;
        }

        setIsSubmittingBooking(true);
        try {
            await submitBookingRequest(orgId, {
                user_id: currentUser.uid,
                user_name: currentUser.name || currentUser.email || 'Unknown',
                user_email: currentUser.email || '',
                house_id: selectedHouse.id,
                house_name: selectedHouse.name,
                start_date: startDate,
                end_date: endDate,
                num_guests: bookingFormData.num_guests,
                purpose: bookingFormData.purpose,
                notes: bookingFormData.notes,
            });

            // Reset form
            setShowBookingForm(false);
            setSelectedHouse(null);
            setBookingFormData({
                start_date: '',
                end_date: '',
                num_guests: 2,
                purpose: 'personal',
                notes: '',
            });

            // Reload data
            await loadData();

            setBookingSuccess('Bókunarbeiðni send!');
        } catch (err: unknown) {
            logger.error('Error submitting booking request:', err);
            setBookingError(getUserMessage(err, 'Villa kom upp við að senda bókunarbeiðni'));
        } finally {
            setIsSubmittingBooking(false);
        }
    };

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

    if (!isMember || !organization) {
        return (
            <main id="main" className="min-h-screen bg-bone flex items-center justify-center p-6">
                <div className="card max-w-md text-center">
                    <Building2 aria-hidden="true" className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
                    <h1 className="text-2xl font-serif mb-4">Aðgangur bannaður</h1>
                    <p role="alert" className="text-grey-dark mb-6">{error || 'Þú hefur ekki aðgang að þessu félagi'}</p>
                </div>
            </main>
        );
    }

    const pendingRequests = myBookingRequests.filter((r) => r.status === 'pending');
    const approvedRequests = myBookingRequests.filter((r) => r.status === 'approved');

    return (
        <main id="main" className="min-h-screen bg-bone">
            <SEO
                title={`Mitt svæði - ${organization.name}`}
                description="Skoða hús og bóka"
            />

            {/* Header */}
            <header className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4">
                        <Building2 aria-hidden="true" className="w-12 h-12 text-charcoal" />
                        <div>
                            <h1 className="text-3xl font-serif">{organization.name}</h1>
                            <p className="text-grey-mid">Mitt svæði</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div role="status">
                    {bookingSuccess && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-800">
                            {bookingSuccess}
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-grey-mid text-sm mb-4">Tiltæk hús</h2>
                            <Home aria-hidden="true" className="w-5 h-5 text-grey-mid" />
                        </div>
                        <p className="text-3xl font-bold">{houses.length}</p>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-grey-mid text-sm mb-4">Beiðnir í bið</h2>
                            <Calendar aria-hidden="true" className="w-5 h-5 text-grey-mid" />
                        </div>
                        <p className="text-3xl font-bold">{pendingRequests.length}</p>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-grey-mid text-sm mb-4">Samþykktar bókanir</h2>
                            <User aria-hidden="true" className="w-5 h-5 text-grey-mid" />
                        </div>
                        <p className="text-3xl font-bold">{approvedRequests.length}</p>
                    </div>
                </div>

                {/* My Booking Requests */}
                {myBookingRequests.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-serif mb-4">Mínar bókunarbeiðnir</h2>
                        <div className="space-y-4">
                            {myBookingRequests.slice(0, 3).map((request) => (
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
                                                        : request.status === 'denied'
                                                        ? 'Hafnað'
                                                        : 'Hætt við'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm text-grey-dark">
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
                                            </div>
                                            {request.denial_reason && (
                                                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm">
                                                    <strong>Ástæða höfnunar:</strong> {request.denial_reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Houses */}
                <div>
                    <h2 className="text-2xl font-serif mb-4">Tiltæk hús ({houses.length})</h2>

                    {houses.length === 0 ? (
                        <div className="card text-center py-12">
                            <Home aria-hidden="true" className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
                            <p className="text-grey-mid">Engin hús tiltæk enn</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {houses.map((house) => (
                                <div key={house.id} className="card hover:shadow-lg transition-shadow">
                                    {house.image_url && (
                                        <img
                                            src={house.image_url}
                                            alt={`Mynd af ${house.name}`}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-48 object-cover rounded-lg mb-4"
                                        />
                                    )}
                                    <h3 className="text-xl font-serif mb-2">{house.name}</h3>
                                    <div className="flex items-start gap-2 text-grey-mid text-sm mb-4">
                                        <MapPin aria-hidden="true" className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p>{house.address}</p>
                                    </div>

                                    {house.amenities && house.amenities.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {house.amenities.slice(0, 3).map((amenity) => (
                                                <span
                                                    key={amenity}
                                                    className="bg-grey-light px-2 py-1 rounded text-xs"
                                                >
                                                    {amenity}
                                                </span>
                                            ))}
                                            {house.amenities.length > 3 && (
                                                <span className="bg-grey-light px-2 py-1 rounded text-xs">
                                                    +{house.amenities.length - 3} meira
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleRequestBooking(house)}
                                        className="btn btn-primary w-full"
                                    >
                                        <Calendar aria-hidden="true" className="w-5 h-5" />
                                        Óska eftir bókun
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Form Modal */}
            <Modal
                open={showBookingForm && !!selectedHouse}
                onClose={() => setShowBookingForm(false)}
                title="Bókunarbeiðni"
                size="xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setShowBookingForm(false)}
                            className="btn btn-secondary"
                        >
                            Hætta við
                        </button>
                        <button
                            type="submit"
                            form={bookingFormId}
                            aria-busy={isSubmittingBooking}
                            className="btn btn-primary"
                        >
                            Senda beiðni
                        </button>
                    </>
                }
            >
                {selectedHouse && (
                    <>
                        <div className="mb-6 p-4 bg-grey-lightest rounded-lg">
                            <h3 className="text-xl font-semibold mb-1">{selectedHouse.name}</h3>
                            <p className="text-sm text-grey-mid">{selectedHouse.address}</p>
                        </div>

                        <form id={bookingFormId} onSubmit={handleSubmitBooking} className="space-y-6" aria-busy={isSubmittingBooking}>
                            <div role="alert">
                                {bookingError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                                        {bookingError}
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-grey-dark">
                                Reitir merktir með <span aria-hidden="true">*</span><span className="sr-only">stjörnu</span> eru nauðsynlegir.
                            </p>
                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor={fieldId('start')} className="block text-sm font-medium text-charcoal mb-2">
                                        Komudagur <span aria-hidden="true" className="text-red-700">*</span>
                                    </label>
                                    <input
                                        id={fieldId('start')}
                                        type="date"
                                        value={bookingFormData.start_date}
                                        onChange={(e) =>
                                            setBookingFormData({
                                                ...bookingFormData,
                                                start_date: e.target.value,
                                            })
                                        }
                                        className="input w-full"
                                        required
                                        min={toLocalDateInputValue(new Date())}
                                    />
                                </div>
                                <div>
                                    <label htmlFor={fieldId('end')} className="block text-sm font-medium text-charcoal mb-2">
                                        Brottfarardagur <span aria-hidden="true" className="text-red-700">*</span>
                                    </label>
                                    <input
                                        id={fieldId('end')}
                                        type="date"
                                        value={bookingFormData.end_date}
                                        onChange={(e) =>
                                            setBookingFormData({
                                                ...bookingFormData,
                                                end_date: e.target.value,
                                            })
                                        }
                                        className="input w-full"
                                        required
                                        min={
                                            bookingFormData.start_date ||
                                            toLocalDateInputValue(new Date())
                                        }
                                    />
                                </div>
                            </div>

                            {/* Number of Guests */}
                            <div>
                                <label htmlFor={fieldId('guests')} className="block text-sm font-medium text-charcoal mb-2">
                                    Fjöldi gesta
                                </label>
                                <input
                                    id={fieldId('guests')}
                                    type="number"
                                    inputMode="numeric"
                                    value={bookingFormData.num_guests}
                                    onChange={(e) =>
                                        setBookingFormData({
                                            ...bookingFormData,
                                            num_guests: parseInt(e.target.value) || 2,
                                        })
                                    }
                                    className="input w-full"
                                    min="1"
                                    max={10}
                                />
                            </div>

                            {/* Purpose */}
                            <div>
                                <label htmlFor={fieldId('purpose')} className="block text-sm font-medium text-charcoal mb-2">
                                    Tilgangur
                                </label>
                                <select
                                    id={fieldId('purpose')}
                                    value={bookingFormData.purpose}
                                    onChange={(e) =>
                                        setBookingFormData({
                                            ...bookingFormData,
                                            purpose: e.target.value as
                                                | 'personal'
                                                | 'family'
                                                | 'work_retreat',
                                        })
                                    }
                                    className="input w-full"
                                >
                                    <option value="personal">Persónulegt</option>
                                    <option value="family">Fjölskylda</option>
                                    <option value="work_retreat">Vinnuferð</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label htmlFor={fieldId('notes')} className="block text-sm font-medium text-charcoal mb-2">
                                    Athugasemdir (valkvæmt)
                                </label>
                                <textarea
                                    id={fieldId('notes')}
                                    value={bookingFormData.notes}
                                    onChange={(e) =>
                                        setBookingFormData({ ...bookingFormData, notes: e.target.value })
                                    }
                                    className="input w-full min-h-[100px] resize-y"
                                    placeholder="Einhverjar sérstakar óskir eða athugasemdir..."
                                />
                            </div>

                            {/* Info */}
                            {organization.settings.require_booking_approval && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Athugið:</strong> Bókunarbeiðni þín verður send til stjórnanda
                                        félagsins til samþykktar. Þú færð tölvupóst þegar beiðni hefur verið
                                        samþykkt eða hafnað.
                                    </p>
                                </div>
                            )}
                        </form>
                    </>
                )}
            </Modal>
        </main>
    );
}
