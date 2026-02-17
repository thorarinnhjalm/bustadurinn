/**
 * Access Request Form Page
 * For employees to request access to organization
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, User, Briefcase, Phone, Building2, CheckCircle } from 'lucide-react';
import { getOrganization, submitAccessRequest } from '@/services/organizationService';
import type { Organization } from '@/types/models';
import SEO from '@/components/SEO';

export default function AccessRequestFormPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        employee_id: '',
        department: '',
        phone: '',
        reason: '',
    });

    useEffect(() => {
        loadOrganization();
    }, [orgId]);

    const loadOrganization = async () => {
        if (!orgId) return;

        try {
            const org = await getOrganization(orgId);
            if (!org) {
                setError('Félag fannst ekki');
                setIsLoading(false);
                return;
            }
            setOrganization(org);
        } catch (err) {
            console.error('Error loading organization:', err);
            setError('Villa kom upp við að sækja upplýsingar um félag');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!orgId || !organization) {
            setError('Félag fannst ekki');
            return;
        }

        // Basic validation
        if (!formData.name || !formData.email) {
            setError('Vinsamlegast fylltu út öll nauðsynleg reitir');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Ógilt netfang');
            return;
        }

        setIsSubmitting(true);

        try {
            await submitAccessRequest(orgId, formData);
            setSubmitted(true);
        } catch (err: any) {
            console.error('Error submitting access request:', err);
            setError(err.message || 'Villa kom upp við að senda beiðni');
        } finally {
            setIsSubmitting(false);
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

    if (!organization) {
        return (
            <div className="min-h-screen bg-bone flex items-center justify-center p-6">
                <div className="card max-w-md text-center">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
                    <h2 className="text-2xl font-serif mb-4">Félag fannst ekki</h2>
                    <p className="text-grey-dark mb-6">
                        Þetta félag er ekki til eða hefur verið eytt.
                    </p>
                    <button onClick={() => navigate('/')} className="btn btn-primary">
                        Fara á forsíðu
                    </button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-bone flex items-center justify-center p-6">
                <SEO
                    title={`Aðgangsbeiðni send - ${organization.name}`}
                    description="Beiðni þín hefur verið móttekin"
                />
                <div className="card max-w-md text-center">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                    <h2 className="text-2xl font-serif mb-4">Beiðni móttekin!</h2>
                    <p className="text-grey-dark mb-6">
                        Þakka þér fyrir að sækja um aðgang að sumarhúsum {organization.name}.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold mb-2">Næstu skref:</h3>
                        <ol className="text-sm text-grey-dark space-y-2 list-decimal list-inside">
                            <li>Stjórnandi félags mun fara yfir beiðni þína</li>
                            <li>Þú færð tölvupóst þegar beiðni hefur verið samþykkt</li>
                            <li>Eftir samþykki getur þú skráð þig inn og bókað sumarhús</li>
                        </ol>
                    </div>
                    <p className="text-sm text-grey-mid mb-6">
                        Athugaðu tölvupóstinn þinn á{' '}
                        <span className="font-semibold">{formData.email}</span>
                    </p>
                    <button onClick={() => navigate('/')} className="btn btn-secondary">
                        Fara á forsíðu
                    </button>
                </div>
            </div>
        );
    }

    // Check if email domain is in allowed list
    const emailDomain = formData.email.split('@')[1] || '';
    const isAllowedDomain = organization.settings.allowed_email_domains.includes(emailDomain);

    return (
        <div className="min-h-screen bg-bone">
            <SEO
                title={`Óska eftir aðgangi - ${organization.name}`}
                description={`Sæktu um aðgang að sumarhúsum ${organization.name}`}
            />

            <div className="max-w-2xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <UserPlus className="w-16 h-16 mx-auto mb-4 text-charcoal" />
                    <h1 className="text-4xl font-serif mb-2">Óska eftir aðgangi</h1>
                    <p className="text-xl text-grey-dark mb-6">{organization.name}</p>
                    <p className="text-grey-mid max-w-lg mx-auto">
                        Fylltu út formið hér að neðan til að óska eftir aðgangi að sumarhúsum félagsins
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="card">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-charcoal mb-2">
                                Fullt nafn <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-mid" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input w-full pl-10"
                                    placeholder="Jón Jónsson"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-charcoal mb-2">
                                Netfang <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-mid" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input w-full pl-10"
                                    placeholder="jon@example.is"
                                    required
                                />
                            </div>
                            {formData.email && isAllowedDomain && (
                                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    Netfangslén er á leyfilegum lista - beiðni þín verður sjálfkrafa samþykkt
                                </p>
                            )}
                            {organization.settings.allowed_email_domains.length > 0 && (
                                <p className="text-sm text-grey-mid mt-1">
                                    Leyfileg netfangslén:{' '}
                                    {organization.settings.allowed_email_domains.join(', ')}
                                </p>
                            )}
                        </div>

                        {/* Employee ID */}
                        <div>
                            <label className="block text-sm font-medium text-charcoal mb-2">
                                Starfsmannanúmer
                            </label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-mid" />
                                <input
                                    type="text"
                                    value={formData.employee_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, employee_id: e.target.value })
                                    }
                                    className="input w-full pl-10"
                                    placeholder="IB-1234"
                                />
                            </div>
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-medium text-charcoal mb-2">
                                Deild
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-mid" />
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="input w-full pl-10"
                                    placeholder="IT"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-charcoal mb-2">
                                Símanúmer
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-mid" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input w-full pl-10"
                                    placeholder="+354 555 1234"
                                />
                            </div>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-sm font-medium text-charcoal mb-2">
                                Ástæða beiðni (valkvæmt)
                            </label>
                            <textarea
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                className="input w-full min-h-[100px] resize-y"
                                placeholder="Starfsmaður í IT deild, vil gjarnan nýta sumarhúsin fyrir fjölskylduna..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold mb-2">Hvað gerist næst?</h3>
                            <ul className="text-sm text-grey-dark space-y-1 list-disc list-inside">
                                {organization.settings.require_access_approval ? (
                                    <>
                                        <li>Stjórnandi félags fer yfir beiðni þína</li>
                                        <li>Þú færð tölvupóst þegar beiðni hefur verið samþykkt eða hafnað</li>
                                        {organization.settings.require_booking_approval ? (
                                            <li>
                                                Eftir samþykki getur þú skoðað laus hús og óskað eftir bókun
                                            </li>
                                        ) : (
                                            <li>Eftir samþykki getur þú bókað laus hús beint</li>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <li>Þú færð sjálfkrafa aðgang</li>
                                        <li>Þú getur byrjað að skoða og bóka hús strax</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                    <span>Sendi beiðni...</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    <span>Senda beiðni</span>
                                </>
                            )}
                        </button>

                        <p className="text-sm text-grey-mid text-center">
                            Með því að senda þessa beiðni samþykkir þú{' '}
                            <a href="/skilmalar" className="text-charcoal hover:underline">
                                skilmála
                            </a>{' '}
                            og{' '}
                            <a href="/personuvernd" className="text-charcoal hover:underline">
                                persónuverndarstefnu
                            </a>{' '}
                            Bústaðurinn.is
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
