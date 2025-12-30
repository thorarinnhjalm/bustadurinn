/**
 * Trial Reminder Cron Job
 * 
 * Runs daily to send reminder emails 7 days before trial expires
 * Scheduled via vercel.json
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { Resend } from 'resend';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'bustadurinn-is'
    });
}

const db = admin.firestore();
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Replace template variables
 */
function replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{${key}}`, 'g');
        result = result.replace(regex, value);
    }
    return result;
}

/**
 * Format date in Icelandic format
 */
function formatIcelandicDate(date: Date): string {
    const months = [
        'janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní',
        'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}. ${month} ${year}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Verify this is a cron request (security)
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('🔄 Running trial reminder cron job...');

        // Calculate date range: 7 days from now
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Set to start/end of day for range query
        const startOfDay = new Date(sevenDaysFromNow);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(sevenDaysFromNow);
        endOfDay.setHours(23, 59, 59, 999);

        // Query houses with trials expiring in 7 days
        const housesSnapshot = await db.collection('houses')
            .where('subscription_status', '==', 'trial')
            .where('subscription_end', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
            .where('subscription_end', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
            .get();

        if (housesSnapshot.empty) {
            console.log('✅ No trials expiring in 7 days');
            return res.status(200).json({
                success: true,
                message: 'No trials expiring',
                count: 0
            });
        }

        // Fetch the trial_ending template
        const templateDoc = await db.collection('email_templates').doc('trial_ending').get();

        if (!templateDoc.exists) {
            throw new Error('trial_ending template not found');
        }

        const template = templateDoc.data();
        if (!template || !template.active) {
            console.log('⚠️ trial_ending template is inactive');
            return res.status(200).json({
                success: true,
                message: 'Template inactive',
                count: 0
            });
        }

        let emailsSent = 0;
        const errors: string[] = [];

        // Send emails to each house manager
        for (const houseDoc of housesSnapshot.docs) {
            const house = houseDoc.data();
            const managerId = house.manager_id;

            if (!managerId) {
                console.warn(`House ${houseDoc.id} has no manager`);
                continue;
            }

            // Get manager's user document
            const userDoc = await db.collection('users').doc(managerId).get();

            if (!userDoc.exists) {
                console.warn(`Manager ${managerId} not found`);
                continue;
            }

            const user = userDoc.data();
            if (!user || !user.email) {
                console.warn(`Manager ${managerId} has no email`);
                continue;
            }

            // Prepare email variables
            const expiryDate = (house.subscription_end as admin.firestore.Timestamp).toDate();
            const variables = {
                name: user.name || user.email.split('@')[0],
                expiryDate: formatIcelandicDate(expiryDate)
            };

            const subject = replaceVariables(template.subject, variables);
            const html = replaceVariables(template.html_content, variables);

            try {
                await resend.emails.send({
                    from: 'Bústaðurinn.is <onboarding@resend.dev>',
                    to: user.email,
                    subject,
                    html,
                });

                console.log(`✅ Sent trial reminder to ${user.email} for house ${house.name}`);
                emailsSent++;
            } catch (error: any) {
                console.error(`❌ Failed to send to ${user.email}:`, error.message);
                errors.push(`${user.email}: ${error.message}`);
            }
        }

        console.log(`🎉 Trial reminder job complete: ${emailsSent} emails sent`);

        return res.status(200).json({
            success: true,
            emailsSent,
            housesChecked: housesSnapshot.size,
            errors: errors.length > 0 ? errors : undefined,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ Cron job error:', error);
        return res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
