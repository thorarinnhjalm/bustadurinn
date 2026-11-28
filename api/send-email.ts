import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, getDb } from './utils/firebaseAdmin.js';
import { requireAuth, getAuthErrorResponse, isAdminIdentity } from './utils/apiAuth.js';
import { checkRateLimit, getEmailRateLimit, getUnverifiedEmailRateLimit, tryGetRateLimit } from './utils/ratelimit.js';

const SITE_ORIGIN = 'https://www.bustadurinn.is';
const TEMPLATE_ID_PATTERN = /^[a-z0-9_-]{1,64}$/i;
const VARIABLE_KEY_PATTERN = /^[A-Za-z0-9_]{1,64}$/;
const MAX_VARIABLE_LENGTH = 2000;
const MAX_ADMIN_RECIPIENTS = 50;
// Templates the onboarding flow sends to the user's own address. The app never
// verifies password sign-ups, so callers with an unverified token email are
// limited to these (and to a stricter limiter), not blocked outright.
const UNVERIFIED_ALLOWED_TEMPLATES = new Set(['welcome', 'onboarding_complete']);
const EMAIL_PATTERN = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

/**
 * Coerce `variables` to a flat Record<string, string>: strings kept, numbers
 * coerced, everything else dropped. Keys restricted to a safe charset.
 */
function sanitizeVariables(input: unknown): Record<string, string> {
    const out: Record<string, string> = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
        if (!VARIABLE_KEY_PATTERN.test(key)) continue;
        let str: string | null = null;
        if (typeof value === 'string') str = value;
        else if (typeof value === 'number' && Number.isFinite(value)) str = String(value);
        if (str === null) continue;
        out[key] = str.slice(0, MAX_VARIABLE_LENGTH);
    }
    return out;
}

/**
 * 🔒 SECURITY: Escape HTML entities to prevent XSS injection in template variables.
 * Replaces isomorphic-dompurify which caused ESM/CJS conflicts on Vercel runtime.
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getDb();

// Lazy init Resend
let resend: Resend | null = null;

function initServices() {
    // Initialize Resend
    if (!resend) {
        if (!process.env.RESEND_API_KEY) {
            console.warn('⚠️ RESEND_API_KEY is not set');
        }
        resend = new Resend(process.env.RESEND_API_KEY);
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
        // 🔒 SECURITY: Escape HTML to prevent XSS injection
        const sanitized = escapeHtml(value);
        // split/join: no regex built from user input, no `$&` replacement patterns
        result = result.split(`{${key}}`).join(sanitized);
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
        let decodedToken;
        try {
            decodedToken = await requireAuth(req);
        } catch (authError: any) {
            const errorResponse = getAuthErrorResponse(authError);
            return res.status(errorResponse.status).json(errorResponse.body);
        }

        if (!resend) {
            throw new Error('Resend client failed to initialize (Missing API Key?)');
        }

        if (!db) {
            throw new Error('Firebase DB failed to initialize (Missing/Invalid FIREBASE_SERVICE_ACCOUNT?)');
        }

        const body = req.body || {};
        const { templateId, to } = body;

        if (!templateId || !to) {
            return res.status(400).json({ error: 'Missing templateId or recipient' });
        }
        if (typeof templateId !== 'string' || !TEMPLATE_ID_PATTERN.test(templateId)) {
            return res.status(400).json({ error: 'Invalid templateId' });
        }

        // Normalise recipients to a string array
        const toList: unknown[] = Array.isArray(to) ? to : [to];
        if (toList.length === 0 || toList.some((r) => typeof r !== 'string' || r.length > 254 || !EMAIL_PATTERN.test(r.trim()))) {
            return res.status(400).json({ error: 'Invalid recipient' });
        }
        const recipients = (toList as string[]).map((r) => r.trim());

        // 🔒 SECURITY: recipient restriction. Super admins may mail anyone;
        // everyone else only their own (token) email address.
        let isAdmin = false;
        try {
            const roleSnap = await db.collection('user_roles').doc(decodedToken.uid).get();
            isAdmin = isAdminIdentity(decodedToken, roleSnap.exists ? roleSnap.data() : undefined);
        } catch (roleError) {
            console.error('send-email: role lookup failed', roleError);
            isAdmin = false;
        }

        if (isAdmin) {
            if (recipients.length > MAX_ADMIN_RECIPIENTS) {
                return res.status(400).json({ error: 'Too many recipients' });
            }
        } else {
            const ownEmail = typeof decodedToken.email === 'string' ? decodedToken.email.toLowerCase() : '';
            if (recipients.length !== 1 || !ownEmail || recipients[0].toLowerCase() !== ownEmail) {
                return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
            }
        }

        // An unverified token email can be registered by anyone for a victim's
        // address, so such callers only get the self-onboarding templates.
        const isUnverified = !isAdmin && decodedToken.email_verified !== true;
        if (isUnverified && !UNVERIFIED_ALLOWED_TEMPLATES.has(templateId)) {
            return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
        }

        // Rate limit per uid (admins exempt; fail open when Redis is unavailable)
        if (!isAdmin) {
            const limiter = tryGetRateLimit(isUnverified ? getUnverifiedEmailRateLimit : getEmailRateLimit);
            if (limiter) {
                const rl = await checkRateLimit(limiter, decodedToken.uid, { failOpen: true });
                if (!rl.allowed) {
                    return res.status(rl.error.status).json(rl.error.body);
                }
            }
        }

        const variables = sanitizeVariables(body.variables);

        // 🔒 SECURITY: non-admins may not inject off-site links through URL-like variables
        if (!isAdmin) {
            for (const [key, value] of Object.entries(variables)) {
                if (/url|link/i.test(key) && value !== '' && !value.startsWith(`${SITE_ORIGIN}/`) && value !== SITE_ORIGIN) {
                    return res.status(400).json({ error: 'Invalid link variable' });
                }
            }
        }

        // Constant base URL for links (never derived from request headers)
        const baseUrl = SITE_ORIGIN;

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
            <p style="margin-top: 30px;">Kerfið er <strong>ókeypis og opið öllum</strong> — engin binding, enginn falinn kostnaður. Velkomin um borð! 🎉</p>
            <a href="${baseUrl}/dashboard" class="button">Fara á stjórnborð</a>
            <p style="margin-top: 40px; font-size: 14px; color: #4a4642;">Ef þú hefur spurningar, ekki hika við að hafa samband við okkur á <a href="mailto:hjalp@bustadurinn.is" style="color: #e8b058;">hjalp@bustadurinn.is</a></p>
        </div>
        <div class="footer">
            <p>© 2025 Bústaðurinn.is - Neðri Hóll Hugmyndahús ehf.</p>
            <p>Spurningar? Sendu okkur línu á <a href="mailto:hjalp@bustadurinn.is" style="color: #e8b058;">hjalp@bustadurinn.is</a></p>
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
            <div style="text-align: center; margin: 40px 0;"><a href="${baseUrl}/dashboard" class="button">Opna stjórnborð →</a></div>
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
                },
                'finish_setup': {
                    id: 'finish_setup',
                    subject: 'Kláraðu uppsetninguna á Bústaðurinn.is 🏡',
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
        .button { display: inline-block; background: #e8b058; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; text-align: center; width: 100%; box-sizing: border-box; }
        .footer { background: #f5f5f0; padding: 30px; text-align: center; font-size: 13px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><div class="logo">🏡</div><h1>Eitt skref í viðbót...</h1></div>
        <div class="content">
            <p class="greeting">Hæ {name},</p>
            <p>Við tókum eftir því að þú byrjaðir að skrá þig en kláraðir ekki að stofna húsið þitt.</p>
            <p>Engar áhyggjur, aðgangurinn þinn er tilbúinn. Þú þarft bara að skrá inn upplýsingar um bústaðinn til að byrja.</p>
            <a href="${baseUrl}/onboarding" class="button">Klára uppsetningu</a>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">Ef þú lendir í vandræðum, svaraðu þessum pósti og við hjálpum þér.</p>
        </div>
        <div class="footer"><p><strong>Bústaðurinn.is</strong></p></div>
    </div>
</body>
</html>`,
                    active: true,
                    variables: ['name'],
                    description: 'Recovery email for orphaned users'
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
        const subject = replaceVariables(template.subject, variables);
        const html = replaceVariables(template.html_content, variables);

        // Send email via Resend
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not configured on the server');
        }

        const response = await resend.emails.send({
            from: 'Bústaðurinn <hallo@bustadurinn.is>',
            to: recipients,
            subject,
            html,
        });

        if (response.error) {
            console.error(`❌ Resend API Error for '${templateId}':`, response.error);
            return res.status(502).json({
                error: 'Failed to send email',
                code: 'resend_error'
            });
        }

        console.log(`✅ Successfully sent email '${templateId}'. ID: ${response.data?.id}`);

        return res.status(200).json({ success: true, data: response.data });
    } catch (error: any) {
        console.error('❌ Server Error sending email:', error);

        return res.status(500).json({ error: 'Internal server error', code: 'internal_server_error' });
    }
}
