import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import type { BookingRequest } from '@/types/models';

interface BookingRequestsTabProps {
    bookingRequests: BookingRequest[];
    onApproveBooking: (requestId: string) => void;
    onDenyBooking: (requestId: string) => void;
}

export default function BookingRequestsTab({ bookingRequests, onApproveBooking, onDenyBooking }: BookingRequestsTabProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-serif">Bókunarbeiðnir</h2>

            {bookingRequests.length === 0 ? (
                <div className="card text-center py-12">
                    <Calendar aria-hidden="true" className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
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
                                            onClick={() => onApproveBooking(request.id)}
                                            className="btn bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle aria-hidden="true" className="w-5 h-5" />
                                            Samþykkja
                                        </button>
                                        <button
                                            onClick={() => onDenyBooking(request.id)}
                                            className="btn bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <XCircle aria-hidden="true" className="w-5 h-5" />
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
    );
}
