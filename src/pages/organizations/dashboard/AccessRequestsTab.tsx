import { UserPlus, CheckCircle, XCircle } from 'lucide-react';
import type { AccessRequest } from '@/types/models';

interface AccessRequestsTabProps {
    accessRequests: AccessRequest[];
    onApproveAccess: (requestId: string) => void;
    onDenyAccess: (requestId: string) => void;
}

export default function AccessRequestsTab({ accessRequests, onApproveAccess, onDenyAccess }: AccessRequestsTabProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-serif">Aðgangsbeiðnir</h2>

            {accessRequests.length === 0 ? (
                <div className="card text-center py-12">
                    <UserPlus aria-hidden="true" className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
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
                                            onClick={() => onApproveAccess(request.id)}
                                            className="btn bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle aria-hidden="true" className="w-5 h-5" />
                                            Samþykkja
                                        </button>
                                        <button
                                            onClick={() => onDenyAccess(request.id)}
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
