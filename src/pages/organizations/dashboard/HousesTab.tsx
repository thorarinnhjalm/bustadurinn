import { useState } from 'react';
import { Home } from 'lucide-react';
import { logger } from '@/utils/logger';
import { removeHouseFromOrganization } from '@/services/organizationService';
import type { House, User } from '@/types/models';
import AddHouseDialog from './AddHouseDialog';

interface HousesTabProps {
    idPrefix: string;
    orgId: string;
    currentUser: User | null;
    houses: House[];
    loadData: () => Promise<void>;
}

export default function HousesTab({ idPrefix, orgId, currentUser, houses, loadData }: HousesTabProps) {
    const [showAddHouseModal, setShowAddHouseModal] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif">Sumarhús</h2>
                <button
                    onClick={() => setShowAddHouseModal(true)}
                    className="btn btn-primary"
                >
                    <Home aria-hidden="true" className="w-5 h-5" />
                    Bæta við húsi
                </button>
            </div>

            {houses.length === 0 ? (
                <div className="card text-center py-12">
                    <Home aria-hidden="true" className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
                    <p className="text-grey-mid mb-4">Engin hús skráð</p>
                    <p className="text-sm text-grey-mid mb-6">
                        Byrjaðu með að bæta við fyrsta sumarhúsinu þínu
                    </p>
                    <button
                        onClick={() => setShowAddHouseModal(true)}
                        className="btn btn-primary"
                    >
                        <Home aria-hidden="true" className="w-5 h-5" />
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
                                    alt={`Mynd af ${house.name}`}
                                    loading="lazy"
                                    decoding="async"
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
                                                    orgId
                                                );
                                                await loadData();
                                            } catch (err) {
                                                logger.error('Error removing house:', err);
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
                <AddHouseDialog
                    idPrefix={idPrefix}
                    orgId={orgId}
                    currentUser={currentUser}
                    onClose={() => setShowAddHouseModal(false)}
                    loadData={loadData}
                />
            )}
        </div>
    );
}
