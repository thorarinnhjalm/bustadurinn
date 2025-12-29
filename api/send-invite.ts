
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { emails, houseName, houseId, inviteCode, senderName } = req.body;

        if (!emails || !houseId || !inviteCode) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const emailList = emails.split(',').map((e: string) => e.trim()).filter((e: string) => e.includes('@'));

        if (emailList.length === 0) {
            return res.status(400).json({ error: 'No valid emails provided' });
        }

        const inviteUrl = `https://bustadurinn.is/join?houseId=${houseId}&code=${inviteCode}`;

        const data = await resend.emails.send({
            from: 'Bústaðurinn.is <onboarding@resend.dev>',
            to: emailList,
            subject: `Boð í húsfélagið ${houseName || 'sumarhúsið'}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917;">
                    <div style="background-color: #f5f5f4; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #d97706; margin: 0; font-family: serif;">Bústaðurinn.is</h1>
                    </div>
                    
                    <div style="padding: 32px; border: 1px solid #e7e5e4; border-top: none; border-radius: 0 0 8px 8px;">
                        <h2 style="margin-top: 0; color: #1c1917;">Hæ! 👋</h2>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #44403c;">
                            ${senderName || 'Vinur þinn'} hefur boðið þér að gerast meðeigandi í <strong>${houseName || 'sumarhúsi'}</strong> á Bústaðurinn.is.
                        </p>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #44403c;">
                            Með því að ganga í húsfélagið getur þú bókað dvalir, séð verkefni og fylgst með rekstrinum á einum stað.
                        </p>

                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${inviteUrl}" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                Samþykkja boð
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #78716c; text-align: center;">
                            Hlökkum til að sjá þig!
                        </p>
                    </div>
                </div>
            `,
        });

        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error sending invites:', error);
        return res.status(500).json({ error: error.message });
    }
}
