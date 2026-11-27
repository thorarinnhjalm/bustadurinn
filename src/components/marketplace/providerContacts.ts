import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ServiceProvider } from '@/types/models';

export interface ProviderContact {
    contact_email: string;
    contact_phone: string;
    address?: string;
}

/**
 * Contact details live in service_provider_contacts/{providerId} (signed-in
 * readers only). Providers not yet migrated still carry the three fields on
 * the provider doc, so fall back to those when no contact doc exists.
 */
export async function fetchProviderContact(
    provider: Pick<ServiceProvider, 'id' | 'contact_email' | 'contact_phone' | 'address'>
): Promise<ProviderContact> {
    try {
        const snap = await getDoc(doc(db, 'service_provider_contacts', provider.id));
        if (snap.exists()) {
            const d = snap.data();
            return {
                contact_email: d.contact_email || '',
                contact_phone: d.contact_phone || '',
                address: d.address || undefined,
            };
        }
    } catch {
        // fall through to legacy fields
    }
    return {
        contact_email: provider.contact_email || '',
        contact_phone: provider.contact_phone || '',
        address: provider.address,
    };
}
