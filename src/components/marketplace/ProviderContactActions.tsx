import { useEffect, useState } from 'react';
import type { ServiceProvider } from '@/types/models';
import { fetchProviderContact, type ProviderContact } from './providerContacts';

/** Call / email buttons; loads the contact doc only when rendered (signed-in viewers). */
export default function ProviderContactActions({ provider }: { provider: ServiceProvider }) {
    const [contact, setContact] = useState<ProviderContact | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchProviderContact(provider).then(c => { if (!cancelled) setContact(c); });
        return () => { cancelled = true; };
    }, [provider]);

    const phone = contact?.contact_phone;
    const email = contact?.contact_email;

    return (
        <>
            <a
                href={phone ? `tel:${phone}` : undefined}
                aria-disabled={!phone}
                className={`flex-1 btn btn-secondary text-center py-2 text-sm justify-center ${phone ? '' : 'opacity-50 pointer-events-none'}`}
            >
                Hringja
            </a>
            <a
                href={email ? `mailto:${email}?subject=Fyrirspurn af Bústaðurinn.is` : undefined}
                aria-disabled={!email}
                className={`flex-1 btn btn-primary text-center py-2 text-sm justify-center ${email ? '' : 'opacity-50 pointer-events-none'}`}
            >
                Senda póst
            </a>
        </>
    );
}
