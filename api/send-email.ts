/**
 * Unified Email Service
 * Fetches templates from Firestore and sends via Resend
 */

import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import DOMPurify from 'isomorphic-dompurify';

// Lazy init variables
let db: admin.firestore.Firestore | null = null;
let resend: Resend | null = null;

function initServices() {
    // Initialize Resend
    if (!resend) {
        if (!process.env.RESEND_API_KEY) {
            console.warn('⚠️ RESEND_API_KEY is not set');
        }
        resend = new Resend(process.env.RESEND_API_KEY);
    }

    // Initialize Firebase Admin
    if (!admin.apps.length) {
        try {
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id
                });
            } else {
                // Fallback for local or managed environment
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    projectId: 'bustadurinn-is'
                });
            }
        } catch (error) {
            console.error('❌ Firebase Admin initialization error:', error);
            throw new Error(`Firebase Init Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    if (!db) {
        db = admin.firestore();
    }
}

interface EmailTemplate {
    id: string;
    subject: string;
    html_content: string;
    active: boolean;
    variables: string[];
    description: string;
}

/**
 * Replace template variables with actual values
 */
function replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
        // 🔒 SECURITY: Sanitize HTML to prevent XSS injection
        const sanitized = DOMPurify.sanitize(value, {
            ALLOWED_TAGS: [],  // Strip all HTML tags
            ALLOWED_ATTR: []   // Strip all attributes
        });
        const regex = new RegExp(`{${key}}`, 'g');
        result = result.replace(regex, sanitized);
    }
    return result;
}

/**
 * Send email using a Firestore template
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initServices();

        // 🔒 SECURITY: Require authentication to send emails
        try {
            const { requireAuth, getAuthErrorResponse } = await import('./utils/apiAuth');
            await requireAuth(req);
        } catch (authError: any) {
            const { getAuthErrorResponse } = await import('./utils/apiAuth');
            const errorResponse = getAuthErrorResponse(authError);
            return res.status(errorResponse.status).json(errorResponse.body);
        }

        if (!db || !resend) {
            throw new Error('Internal services failed to initialize');
        }

        const { templateId, to, variables } = req.body;

        if (!templateId || !to) {
            return res.status(400).json({ error: 'Missing templateId or recipient' });
        }

        // Fetch template from Firestore
        const templateDoc = await db.collection('email_templates').doc(templateId).get();
        let template: EmailTemplate;

        if (templateDoc.exists) {
            template = templateDoc.data() as EmailTemplate;
            if (!template.active) {
                return res.status(400).json({ error: `Template '${templateId}' is inactive` });
            }
        } else {
            // Fallback for system templates that haven't been seeded yet
            const systemTemplates: Record<string, EmailTemplate> = {
                'general_notification': {
                    id: 'general_notification',
                    subject: '{title} - Bústaðurinn.is',
                    html_content: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #4a4642;">{title}</h2>
                            <p style="font-size: 16px; color: #1c1917; line-height: 1.6;">{message}</p>
                            <div style="margin-top: 24px; text-align: center;">
                                <a href="{actionUrl}" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Skoða nánar</a>
                            </div>
                        </div>
                    `,
                    active: true,
                    variables: ['title', 'message', 'actionUrl'],
                    description: 'System fallback for general notifications'
                },
                'welcome': {
                    id: 'welcome',
                    subject: 'Velkomin í Bústaðurinn.is',
                    html_content: `<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { background: #1a1a1a; color: #fdfcf8; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-family: 'Fraunces', serif; }
        .content { background: white; padding: 40px; border: 1px solid #e8e4df; border-top: none; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #e8b058; color: #1a1a1a; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #8a8580; font-size: 14px; }
        .feature { margin: 20px 0; padding: 16px; background: #fdfcf8; border-left: 3px solid #e8b058; }
    </style>
</head>

<body>
    <div class="container">
        <div class="header"><h1>Velkomin í Bústaðurinn.is</h1></div>
        <div class="content">
            <p>Hæ {name},</p>
            <p>Takk fyrir að skrá þig! Við erum spennt að fá þig um borð í Bústaðurinn.is.</p>
            <p><strong>Næstu skref:</strong></p>
            <div class="feature"><strong>📅 Bókaðu fyrstu dvölina</strong><br>Farðu í dagatalið og veldu dagsetningar fyrir næstu helgi.</div>
            <div class="feature"><strong>✅ Bættu við verkefnum</strong><br>Haltu utan um viðhald og verkefni á einfaldan hátt.</div>
            <div class="feature"><strong>💰 Skráðu útgjöld</strong><br>Haltu utan um kostnað og skiptu honum sanngjarnt á milli eigenda.</div>
            <p style="margin-top: 30px;">Þú hefur <strong>30 daga ókeypis prufutíma</strong> til að prófa alla eiginleika kerfisins.</p>
            <a href="https://bustadurinn.is/dashboard" class="button">Fara á stjórnborð</a>
            <p style="margin-top: 40px; font-size: 14px; color: #4a4642;">Ef þú hefur spurningar, ekki hika við að hafa samband við okkur á <a href="mailto:hjalp@bustadurinn.is" style="color: #e8b058;">hjalp@bustadurinn.is</a></p>
        </div>
        <div class="footer">
            <p>© 2025 Bústaðurinn.is - Neðri Hóll Hugmyndahús ehf.</p>
            <p>Þetta tölvupóstfang er ekki vaktað - vinsamlegast svarið ekki þessum pósti.</p>
        </div>
    </div>
</body>
</html>`,
                    active: true,
                    variables: ['name'],
                    description: 'Welcome email for new users'
                },
                'onboarding_complete': {
                    id: 'onboarding_complete',
                    subject: 'Velkomin í Bústaðurinn.is! 🏡 - Komdu í gang',
                    html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f0; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { font-size: 32px; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
        .feature-box { background: #f5f5f0; border-left: 4px solid #e8b058; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .feature-box h3 { margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px; }
        .feature-box p { margin: 0; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #e8b058; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 0; text-align: center; }
        .footer { background: #f5f5f0; padding: 30px; text-align: center; font-size: 13px; color: #666; }
        .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><div class="logo">🏡</div><h1>Velkomin í Bústaðurinn!</h1></div>
        <div class="content">
            <p class="greeting">Hæ {name}! 👋</p>
            <p>Til hamingju með að skrá <strong>{house_name}</strong> í kerfið hjá okkur! Nú getur þú hafist handa við að skipuleggja dvalir ásamt því að halda utan um fjármál og verkefni.</p>
            <div class="divider"></div>
            <h2 style="color: #1a1a1a; margin-bottom: 20px;">Hér er það helsta sem þú getur gert:</h2>
            <div class="feature-box"><h3>📅 Bókunardagatal</h3><p>Skipuleggðu dvalir fyrir fjölskylduna. Kerfið sér til þess að engar tvíbókanir verði og að helgum sé skipt á sanngjarnan hátt.</p></div>
            <div class="feature-box"><h3>💰 Fjármál</h3><p>Haltu utan um útgjöld, gerðu rekstraráætlun og fylgstu með stöðu hússjóðsins. Allir meðeigendur geta skráð útgjöld.</p></div>
            <div class="feature-box"><h3>✅ Verkefni</h3><p>Haltu utan um viðhaldsverkefni. Deildu verkefnum með meðeigendum og fylgstu með framvindunni.</p></div>
            <div class="feature-box"><h3>👥 Gestir</h3><p>Búðu til gestahlekk með WiFi kóða og helstu upplýsingum. Svo enginn þurfi að hringja og spyrja!</p></div>
            <div style="text-align: center; margin: 40px 0;"><a href="https://bustadurinn.is/dashboard" class="button">Opna stjórnborð →</a></div>
            <div class="divider"></div>
            <h3 style="color: #1a1a1a;">💡 Ábendingar:</h3>
            <ul style="color: #666; line-height: 1.8;">
                <li><strong>Bjóddu meðeigendum:</strong> Í stillingum geturðu búið til boðshlekk og sent öðrum.</li>
                <li><strong>Bókaðu fyrstu dvölina:</strong> Farðu í dagatalið og smelltu á dagsetningu til að bóka.</li>
                <li><strong>Gerðu rekstraráætlun:</strong> Útbúðu áætlun svo allir sjái hvað þarf að greiða í hússjóð.</li>
                <li><strong>Í símanum?</strong> Bættu Bústaðnum við á heimaskjáinn fyrir skjótari aðgang.</li>
            </ul>
            <div class="divider"></div>
            <p style="color: #666; font-size: 14px;"><strong>Spurningar?</strong><br>Svarum fúslega - sendu póst á <a href="mailto:hjalp@bustadurinn.is" style="color: #e8b058;">hjalp@bustadurinn.is</a></p>
        </div>
        <div class="footer"><p><strong>Bústaðurinn.is</strong> - Sumarhúsastjórnun án vesens</p><p style="margin-top: 10px;"><a href="https://bustadurinn.is" style="color: #e8b058; text-decoration: none;">bustadurinn.is</a></p></div>
    </div>
</body>
</html>`,
                    active: true,
                    variables: ['name', 'house_name'],
                    description: 'Onboarding completed successfully'
                }
            };

            if (systemTemplates[templateId]) {
                template = systemTemplates[templateId];
                console.log(`ℹ️ Using system fallback for template '${templateId}'`);
            } else {
                return res.status(404).json({ error: `Template '${templateId}' not found` });
            }
        }

        // Replace variables in subject and content
        const subject = replaceVariables(template.subject, variables || {});
        const html = replaceVariables(template.html_content, variables || {});

        // Send email via Resend
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not configured on the server');
        }

        const response = await resend.emails.send({
            from: 'Bústaðurinn <no-reply@bustadurinn.is>',
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        });

        if (response.error) {
            console.error(`❌ Resend API Error for '${templateId}':`, response.error);
            return res.status(400).json({
                error: response.error.message,
                code: (response.error as any).code || 'resend_error'
            });
        }

        console.log(`✅ Successfully sent email '${templateId}' to ${to}. ID: ${response.data?.id}`);

        return res.status(200).json({ success: true, data: response.data });
    } catch (error: any) {
        console.error('❌ Server Error sending email:', error);

        // Don't expose stack traces in production
        const errorResponse = process.env.NODE_ENV === 'production'
            ? { error: 'Internal server error' }
            : { error: error.message, code: error.code || 'internal_server_error' };

        return res.status(500).json(errorResponse);
    }
}
