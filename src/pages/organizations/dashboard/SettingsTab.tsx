import { XCircle } from 'lucide-react';
import { logger } from '@/utils/logger';
import { updateOrganization } from '@/services/organizationService';
import type { Organization } from '@/types/models';

interface SettingsTabProps {
    idPrefix: string;
    orgId: string;
    organization: Organization;
    loadData: () => Promise<void>;
}

export default function SettingsTab({ idPrefix, orgId, organization, loadData }: SettingsTabProps) {
    const fieldId = (name: string) => `${idPrefix}-${name}`;

    return (
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
                            await updateOrganization(orgId, {
                                name: formData.get('name') as string,
                            });
                            await loadData();
                            alert('Upplýsingar uppfærðar');
                        } catch (err) {
                            logger.error('Error updating organization:', err);
                            alert('Villa kom upp við að uppfæra');
                        }
                    }}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor={fieldId('org-name')} className="label">Nafn félags <span aria-hidden="true">*</span></label>
                            <input
                                id={fieldId('org-name')}
                                type="text"
                                autoComplete="organization"
                                name="name"
                                defaultValue={organization.name}
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
                            await updateOrganization(orgId, {
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
                            logger.error('Error updating settings:', err);
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
                            <label htmlFor={fieldId('max-nights')} className="label">Hámarks nætur per bókun</label>
                            <input
                                id={fieldId('max-nights')}
                                type="number"
                                inputMode="numeric"
                                name="max_nights_per_booking"
                                defaultValue={organization.settings.max_nights_per_booking}
                                className="input w-full"
                                min="1"
                                placeholder="Ótakmarkað"
                            />
                        </div>
                        <div>
                            <label htmlFor={fieldId('max-bookings')} className="label">Hámarks bókanir per ár</label>
                            <input
                                id={fieldId('max-bookings')}
                                type="number"
                                inputMode="numeric"
                                name="max_bookings_per_year"
                                defaultValue={organization.settings.max_bookings_per_year}
                                className="input w-full"
                                min="1"
                                placeholder="Ótakmarkað"
                            />
                        </div>
                        <div>
                            <label htmlFor={fieldId('advance-days')} className="label">Bóka fram í tímann (dagar)</label>
                            <input
                                id={fieldId('advance-days')}
                                type="number"
                                inputMode="numeric"
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
                            await updateOrganization(orgId, {
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
                            logger.error('Error adding domain:', err);
                            alert('Villa kom upp við að bæta við léni');
                        }
                    }}
                    className="flex gap-2 mb-4"
                >
                    <input
                        type="text"
                        name="domain"
                        aria-label="Nýtt netfangslén"
                        autoComplete="off"
                        inputMode="url"
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
                                    type="button"
                                    aria-label={`Fjarlægja ${domain}`}
                                    onClick={async () => {
                                        if (
                                            confirm(
                                                `Ertu viss um að þú viljir fjarlægja ${domain}?`
                                            )
                                        ) {
                                            try {
                                                await updateOrganization(orgId, {
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
                                                logger.error('Error removing domain:', err);
                                                alert('Villa kom upp við að fjarlægja lén');
                                            }
                                        }
                                    }}
                                    className="inline-flex items-center justify-center min-w-6 min-h-6 text-red-600 hover:text-red-800"
                                >
                                    <XCircle aria-hidden="true" className="w-4 h-4" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
