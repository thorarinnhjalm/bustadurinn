import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { logger } from '@/utils/logger';

import type { EmailTemplate } from './types';

/** Reads email_templates; resolves to null (after logging) when the read fails. */
async function readTemplates(): Promise<EmailTemplate[] | null> {
    try {
        const snap = await getDocs(collection(db, 'email_templates'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() })) as EmailTemplate[];
    } catch (e) {
        logger.error('Fetch templates error:', e);
        return null;
    }
}

/**
 * Email templates list. Fetched whenever `enabled` turns true (Communications tab with the
 * Sniðmát sub-tab active). Lives in the page so it survives the full-page loading gate that
 * handleSeedTemplates triggers.
 */
export function useEmailTemplates(enabled: boolean) {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);

    // Email Templates Logic - Define BEFORE useEffect
    const fetchTemplates = async () => {
        const list = await readTemplates();
        if (list) setTemplates(list);
    };

    // Fetch email templates when emails tab is active
    useEffect(() => {
        if (enabled) {
            readTemplates().then(list => {
                if (list) setTemplates(list);
            });
        }
    }, [enabled]);

    return { templates, setTemplates, fetchTemplates };
}
