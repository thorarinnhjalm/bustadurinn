/**
 * Access Request Form Page
 * For employees to request access to organization
 */

import { useState, useEffect, useCallback, useId } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { UserPlus, Mail, User, Briefcase, Phone, Building2, CheckCircle } from 'lucide-react';
import { getOrganization, submitAccessRequest } from '@/services/organizationService';
import type { Organization } from '@/types/models';
import SEO from '@/components/SEO';
import { useAppStore } from '@/store/appStore';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';

export default function AccessRequestFormPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const uid = useId();
    const fieldId = (name: string) => `${uid}-${name}`;
    const location = useLocation();
    const currentUser = useAppStore((state) => state.currentUser);
    const isAuthLoading = useAppStore((state) => state.isLoading);
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

    const loadOrganization = useCallback(async () => {
        if (!orgId) return;

        // Reading the organization requires a signed-in user; wait for auth and
        // show the login prompt below for visitors who are not signed in.
        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        try {
            const org = await getOrganization(orgId);
            if (!org) {
                setError('Félag fannst ekki');
                setIsLoading(false);
                return;
            }
            setOrganization(org);
        } catch (err) {
            logger.error('Error loading organization:', err);
            setError('Villa kom upp við að sækja upplýsingar um félag');
        } finally {
            setIsLoading(false);
        }
    }, [orgId, currentUser]);

    useEffect(() => {
        if (isAuthLoading) return;
        loadOrganization();
    }, [isAuthLoading, loadOrganization]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setError('');

        if (!orgId || !organization || !currentUser) {
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
            await submitAccessRequest(orgId, { ...formData, user_id: currentUser.uid });
            setSubmitted(true);
        } catch (err: unknown) {
            logger.error('Error submitting access request:', err);
            setError(getUserMessage(err, 'Villa kom upp við að senda beiðni'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || isAuthLoading) {
        return (
            <main id="main" className="min-h-screen bg-bone flex items-center justify-center">
                <div role="status" className="text-center">
                    <div aria-hidden="true" className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-grey-mid">Hleð...</p>
                </div>
            </main>
        );
    }

    if (!currentUser) {
        const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
        return (
            <main id="main" className="min-h-screen bg-bone flex items-center justify-center p-6">
                <SEO title="Óska eftir aðgangi" description="Skráðu þig inn til að óska eftir aðgangi" />
                <div className="card max-w-md text-center">
                    <UserPlus aria-hidden="true" className="w-16 h-16 mx-auto mb-4 text-charcoal" />
                    <h1 className="text-2xl font-serif mb-4">Skráðu þig inn til að halda áfram</h1>
                    <p className="text-grey-dark mb-6">
                        Til að óska eftir aðgangi að sumarhúsum félagsins þarftu að vera skráð(ur) inn.
                        Ef þú átt ekki aðgang getur þú stofnað hann á augabragði og kemur svo hingað
                        aftur.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to={`/login?returnUrl=${returnUrl}`} className="btn btn-primary">
                            Skrá inn
                        </Link>
                        <Link to={`/signup?returnUrl=${returnUrl}`} className="btn btn-secondary">
                            Stofna aðgang
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (!organization) {
        return (
            <main id="main" className="min-h-screen bg-bone flex items-center justify-center p-6">
                <div className="card max-w-md text-center">
                    <Building2 aria-hidden="true" className="w-16 h-16 mx-auto mb-4 text-grey-mid" />
                    <h1 className="text-2xl font-serif mb-4">Félag fannst ekki</h1>
                    <p className="text-grey-dark mb-6">
                        Þetta félag er ekki til eða hefur verið eytt.
                    </p>
                    <Link to="/" className="btn btn-primary">
                        Fara á forsíðu
                    </Link>
                </div>
            </main>
        );
    }

    if (submitted) {
        return (
            <main id="main" className="min-h-screen bg-bone flex items-center justify-center p-6">
                <SEO
                    title={`Aðgangsbeiðni send - ${organization.name}`}
                    description="Beiðni þín hefur verið móttekin"
                />
                <div role="status" className="card max-w-md text-center">
                    <CheckCircle aria-hidden="true" className="w-16 h-16 mx-auto mb-4 text-green-700" />
                    <h1 className="text-2xl font-serif mb-4">Beiðni móttekin!</h1>
                    <p className="text-grey-dark mb-6">
                        Þakka þér fyrir að sækja um aðgang að sumarhúsum {organization.name}.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                        <h2 className="text-3xl font-semibold mb-2">Næstu skref:</h2>
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
                    <Link to="/" className="btn btn-secondary">
                        Fara á forsíðu
                    </Link>
                </div>
            </main>
        );
    }

    // Check if email domain is in allowed list
    const emailDomain = formData.email.split('@')[1] || '';
    const allowedDomains = organization.settings?.allowed_email_domains ?? [];
    const isAllowedDomain = allowedDomains.includes(emailDomain);

    return (
        <main id="main" className="min-h-screen bg-bone">
            <SEO
                title={`Óska eftir aðgangi - ${organization.name}`}
                description={`Sæktu um aðgang að sumarhúsum ${organization.name}`}
            />

            <div className="max-w-2xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <UserPlus aria-hidden="true" className="w-16 h-16 mx-auto mb-4 text-charcoal" />
                    <h1 className="text-4xl font-serif mb-2">Óska eftir aðgangi</h1>
                    <p className="text-xl text-grey-dark mb-6">{organization.name}</p>
                    <p className="text-grey-mid max-w-lg mx-auto">
                        Fylltu út formið hér að neðan til að óska eftir aðgangi að sumarhúsum félagsins
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="card" aria-busy={isSubmitting}>
                    <div role="alert">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <p className="text-red-800">{error}</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <p className="text-sm text-grey-dark">
                            Reitir merktir með <span aria-hidden="true">*</span><span className="sr-only">stjörnu</span> eru nauðsynlegir.
                        </p>
                        {/* Name */}
                        <div>
                            <label htmlFor={fieldId('name')} className="block text-sm font-medium text-charcoal mb-2">
                                Fullt nafn <span aria-hidden="true" className="text-red-700">*</span>
                            </label>
                            <div className="relative">
                                <User aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-mid" />
                                <input
                                    id={fieldId('name')}
                                    type="text"
                                    autoComplete="name"
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
                            <label htmlFor={fieldId('email')} className="block text-sm font-medium text-charcoal mb-2">
                                Netfang <span aria-hidden="true" className="text-red-700">*</span>
                            </label>
                            <div className="relative">
                                <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-mid" />
                                <input
                                    id={fieldId('email')}
                                    type="email"
                                    autoComplete="email"
                                    inputMode="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input w-full pl-10"
                                    placeholder="jon@example.is"
                                    required
                                />
                            </div>
                            <div role="status">
                                {formData.email && isAllowedDomain && (
                                    <p className="text-sm text-green-700 mt-1 flex items-center gap-1">
                                        <CheckCircle aria-hidden="true" className="w-4 h-4" />
                                        Netfangslén er á leyfilegum lista - beiðni þín verður sjálfkrafa samþykkt
                                    </p>
                                )}
                            </div>
                            {allowedDomains.length > 0 && (
                                <p className="text-sm text-grey-mid mt-1">
                                    Leyfileg netfangslén:{' '}
                                    {allowedDomains.join(', ')}
                                </p>
                            )}
                        </div>

                        {/* Employee ID */}
                        <div>
                            <label htmlFor={fieldId('employee')} className="block text-sm font-medium text-charcoal mb-2">
                                Starfsmannanúmer
                            </label>
                            <div className="relative">
                                <Briefcase aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-mid" />
                                <input
                                    id={fieldId('employee')}
                                    type="text"
                                    autoComplete="off"
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
                            <label htmlFor={fieldId('department')} className="block text-sm font-medium text-charcoal mb-2">
                                Deild
                            </label>
                            <div className="relative">
                                <Building2 aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-mid" />
                                <input
                                    id={fieldId('department')}
                                    type="text"
                                    autoComplete="organization-title"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="input w-full pl-10"
                                    placeholder="IT"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor={fieldId('phone')} className="block text-sm font-medium text-charcoal mb-2">
                                Símanúmer
                            </label>
                            <div className="relative">
                                <Phone aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-mid" />
                                <input
                                    id={fieldId('phone')}
                                    type="tel"
                                    autoComplete="tel"
                                    inputMode="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input w-full pl-10"
                                    placeholder="+354 555 1234"
                                />
                            </div>
                        </div>

                        {/* Reason */}
                        <div>
                            <label htmlFor={fieldId('reason')} className="block text-sm font-medium text-charcoal mb-2">
                                Ástæða beiðni (valkvæmt)
                            </label>
                            <textarea
                                id={fieldId('reason')}
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                className="input w-full min-h-[100px] resize-y"
                                placeholder="Starfsmaður í IT deild, vil gjarnan nýta sumarhúsin fyrir fjölskylduna..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h2 className="text-3xl font-semibold mb-2">Hvað gerist næst?</h2>
                            <ul className="text-sm text-grey-dark space-y-1 list-disc list-inside">
                                {organization.settings?.require_access_approval ? (
                                    <>
                                        <li>Stjórnandi félags fer yfir beiðni þína</li>
                                        <li>Þú færð tölvupóst þegar beiðni hefur verið samþykkt eða hafnað</li>
                                        {organization.settings?.require_booking_approval ? (
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
                            aria-busy={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span role="status">
                                        <span aria-hidden="true" className="block animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                        <span className="sr-only">Hleð…</span>
                                    </span>
                                    <span>Sendi beiðni...</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus aria-hidden="true" className="w-5 h-5" />
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
        </main>
    );
}
