import { logger } from '@/utils/logger';
import { createOrganizationHouse } from '@/services/organizationService';
import type { House, User } from '@/types/models';
import Modal from '@/components/ui/Modal';

interface AddHouseDialogProps {
    /** `useId`-derived prefix shared with the rest of the dashboard */
    idPrefix: string;
    orgId: string;
    currentUser: User | null;
    onClose: () => void;
    loadData: () => Promise<void>;
}

export default function AddHouseDialog({ idPrefix, orgId, currentUser, onClose, loadData }: AddHouseDialogProps) {
    const fieldId = (name: string) => `${idPrefix}-${name}`;
    const addHouseFormId = `${idPrefix}-add-house-form`;

    return (
        <Modal
            open={true}
            onClose={onClose}
            title="Bæta við sumarhúsi"
            size="xl"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary"
                    >
                        Hætta við
                    </button>
                    <button type="submit" form={addHouseFormId} className="btn btn-primary">
                        Búa til hús
                    </button>
                </>
            }
        >
            <form
                id={addHouseFormId}
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
                            orgId,
                            houseData,
                            currentUser!.uid
                        );
                        onClose();
                        await loadData();
                    } catch (err) {
                        logger.error('Error creating house:', err);
                        alert('Villa kom upp við að búa til hús');
                    }
                }}
                className="space-y-4"
            >
                <p className="text-sm text-grey-dark">
                    Reitir merktir með <span aria-hidden="true">*</span><span className="sr-only">stjörnu</span> eru nauðsynlegir.
                </p>
                <div>
                    <label htmlFor={fieldId('house-name')} className="label">Nafn húss <span aria-hidden="true">*</span></label>
                    <input
                        id={fieldId('house-name')}
                        type="text"
                        name="name"
                        required
                        className="input w-full"
                        placeholder="t.d. Sumarbústaður við Þingvallavatn"
                    />
                </div>

                <div>
                    <label htmlFor={fieldId('house-address')} className="label">Heimilisfang <span aria-hidden="true">*</span></label>
                    <input
                        id={fieldId('house-address')}
                        type="text"
                        autoComplete="street-address"
                        name="address"
                        required
                        className="input w-full"
                        placeholder="t.d. Þingvallavegur 123, 801 Selfoss"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor={fieldId('house-lat')} className="label">Breiddargráða (Lat) <span aria-hidden="true">*</span></label>
                        <input
                            id={fieldId('house-lat')}
                            type="number"
                            inputMode="decimal"
                            name="lat"
                            step="any"
                            required
                            className="input w-full"
                            placeholder="64.1234"
                        />
                    </div>
                    <div>
                        <label htmlFor={fieldId('house-lng')} className="label">Lengdargráða (Lng) <span aria-hidden="true">*</span></label>
                        <input
                            id={fieldId('house-lng')}
                            type="number"
                            inputMode="decimal"
                            name="lng"
                            step="any"
                            required
                            className="input w-full"
                            placeholder="-21.1234"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor={fieldId('house-image')} className="label">Mynd URL (valkvætt)</label>
                    <input
                        id={fieldId('house-image')}
                        type="url"
                        inputMode="url"
                        name="image_url"
                        className="input w-full"
                        placeholder="https://example.com/mynd.jpg"
                    />
                </div>

                <div>
                    <label htmlFor={fieldId('house-rules')} className="label">Húsreglur (valkvætt)</label>
                    <textarea
                        id={fieldId('house-rules')}
                        name="house_rules"
                        className="input w-full min-h-[100px]"
                        placeholder="Skrifaðu húsreglur hér..."
                    />
                </div>

            </form>
        </Modal>
    );
}
