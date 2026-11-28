import { Users } from 'lucide-react';
import type { OrganizationMember } from '@/types/models';

export default function MembersTab({ members }: { members: OrganizationMember[] }) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-serif">Starfsmenn ({members.length})</h2>

            {members.length === 0 ? (
                <div className="card text-center py-12">
                    <Users aria-hidden="true" className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
                    <p className="text-grey-mid">Engir starfsmenn enn</p>
                </div>
            ) : (
                <div className="card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <caption className="sr-only">Starfsmenn félagsins</caption>
                            <thead>
                                <tr className="border-b">
                                    <th scope="col" className="text-left py-3 px-4">Nafn</th>
                                    <th scope="col" className="text-left py-3 px-4">Netfang</th>
                                    <th scope="col" className="text-left py-3 px-4">Deild</th>
                                    <th scope="col" className="text-left py-3 px-4">Staða</th>
                                    <th scope="col" className="text-left py-3 px-4">Bókanir í ár</th>
                                    <th scope="col" className="text-left py-3 px-4">Aðgangsstig</th>
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
    );
}
