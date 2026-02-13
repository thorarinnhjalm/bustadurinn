import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { houseName, userName, startDate, endDate, bookingType, ownerEmails } = req.body;

        // Validation
        if (!houseName || !userName || !startDate || !endDate || !ownerEmails) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Initialize language
        const language = req.body.language || 'is';

        const translations: any = {
            is: {
                subject: `Ný bókun í ${houseName}`,
                title: '🏠 Ný bókun hefur verið gerð',
                house: 'Hús',
                bookedBy: 'Bókað af',
                date: 'Dags.',
                type: 'Tegund',
                personal: 'Persónuleg',
                guest: 'Gestur',
                rental: 'Leiga',
                maintenance: 'Viðhald',
                footer: 'Sjá allar bókanir á <a href="https://bustadurinn.is/dashboard">bustadurinn.is</a>'
            },
            en: {
                subject: `New booking in ${houseName}`,
                title: '🏠 A new booking has been made',
                house: 'House',
                bookedBy: 'Booked by',
                date: 'Date',
                type: 'Type',
                personal: 'Personal',
                guest: 'Guest',
                rental: 'Rental',
                maintenance: 'Maintenance',
                footer: 'View all bookings on <a href="https://bustadurinn.is/dashboard">bustadurinn.is</a>'
            }
        };

        const t = translations[language] || translations.is;

        // Format dates
        const locale = language === 'is' ? 'is-IS' : 'en-GB';
        const start = new Date(startDate).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const end = new Date(endDate).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const typeLabel = t[bookingType] || bookingType || t.personal;

        // Send email to all house owners
        const data = await resend.emails.send({
            from: 'Bústaðurinn <hallo@bustadurinn.is>',
            to: ownerEmails,
            subject: t.subject,
            html: `
                <h2>${t.title}</h2>
                <p><strong>${t.house}:</strong> ${houseName}</p>
                <p><strong>${t.bookedBy}:</strong> ${userName}</p>
                <p><strong>${t.date}:</strong> ${start} - ${end}</p>
                <p><strong>${t.type}:</strong> ${typeLabel}</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e5e5;">
                <p style="color: #666; font-size: 14px;">
                    ${t.footer}
                </p>
            `,
        });

        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error sending booking notification:', error);
        return res.status(500).json({ error: error.message });
    }
}
