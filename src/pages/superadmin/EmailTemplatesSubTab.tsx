import { useId, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { CheckCircle, XCircle, Loader2, Send } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { useAppStore } from '@/store/appStore';
import Modal from '@/components/ui/Modal';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';

import type { EmailTemplate, SetActionLoading } from './types';

interface EmailTemplatesSubTabProps {
    templates: EmailTemplate[];
    setTemplates: Dispatch<SetStateAction<EmailTemplate[]>>;
    fetchTemplates: () => Promise<void>;
    /** Page-level loading flag; seeding templates raises it, which shows the full-page loading screen. */
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    actionLoading: string | null;
    setActionLoading: SetActionLoading;
}

export default function EmailTemplatesSubTab({
    templates, setTemplates, fetchTemplates, loading, setLoading, actionLoading, setActionLoading
}: EmailTemplatesSubTabProps) {
    const fieldBaseId = useId();
    const tplSubjectId = `${fieldBaseId}-tpl-subject`;
    const tplHtmlId = `${fieldBaseId}-tpl-html`;
    const currentUser = useAppStore((state) => state.currentUser);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

    const handleSeedTemplates = async () => {
        if (!confirm('Create default templates?')) return;
        setLoading(true);
        try {
            const welcomeTpl: EmailTemplate = {
                id: 'welcome',
                subject: 'Velkomin í Bústaðurinn.is! 🏠',
                active: true, // Default to true or false as per user preference
                description: 'Sent when a user creates their first house.',
                variables: ['name'],
                html_content: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917;">
    <div style="background-color: #f5f5f4; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #1a1a1a; margin: 0; font-family: Georgia, serif;">Bústaðurinn.is</h1>
    </div>

    <div style="padding: 32px; border: 1px solid #e7e5e4; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin-top: 0; color: #1c1917;">Velkomin/n, {name}! 👋</h2>

        <p style="font-size: 16px; line-height: 1.6; color: #44403c;">
            Gaman að sjá þig. Aðgangurinn þinn hefur verið stofnaður.
        </p>

        <div style="text-align: center; margin: 32px 0;">
            <a href="https://www.bustadurinn.is/dashboard" style="background-color: #e8b058; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Fara á stjórnborð
            </a>
        </div>

        <p style="font-size: 14px; color: #78716c; text-align: center;">
            Ef þú hefur einhverjar spurningar, ekki hika við að svara þessum pósti.
        </p>
    </div>
</div>`
            };

            await setDoc(doc(db, 'email_templates', 'welcome'), welcomeTpl);

            const finishSetupTpl: EmailTemplate = {
                id: 'finish_setup',
                subject: 'Kláraðu uppsetninguna á Bústaðurinn.is 🏡',
                active: true,
                description: 'Recovery email for orphaned users who have not created a house.',
                variables: ['name'],
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
        .button { display: inline-block; background: #e8b058; color: #1a1a1a; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; text-align: center; width: 100%; box-sizing: border-box; }
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
            <a href="https://bustadurinn.is/onboarding" class="button">Klára uppsetningu</a>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">Ef þú lendir í vandræðum, svaraðu þessum pósti og við hjálpum þér.</p>
        </div>
        <div class="footer"><p><strong>Bústaðurinn.is</strong></p></div>
    </div>
</body>
</html>`
            };
            await setDoc(doc(db, 'email_templates', 'finish_setup'), finishSetupTpl);

            await fetchTemplates();
            alert('Sniðmát búin til!');
        } catch (e) {
            logger.error(e);
            alert('Villa við gerð sniðmáta');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = async (tpl: EmailTemplate) => {
        setActionLoading('saving-template');
        try {
            await setDoc(doc(db, 'email_templates', tpl.id), tpl);
            setTemplates(prev => prev.map(t => t.id === tpl.id ? tpl : t));
            setEditingTemplate(null);
        } catch (e: any) {
            logger.error('Error saving template:', e);
            alert('Villa við vistun: ' + getUserMessage(e));
        } finally {
            setActionLoading(null);
        }
    };

    const handleSendTestEmail = async (tpl: EmailTemplate) => {
        if (!currentUser?.email) return;

        const confirmSend = confirm(`Senda prufupóst ("${tpl.subject}") á ${currentUser.email}?`);
        if (!confirmSend) return;

        setActionLoading(`test-email-${tpl.id}`);
        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
                },
                body: JSON.stringify({
                    templateId: tpl.id,
                    to: currentUser.email,
                    variables: {
                        name: currentUser.name || 'Prófunarnotandi',
                        houseName: 'Sýnishornsbústaður',
                        inviteLink: 'https://www.bustadurinn.is/join?test=1',
                        expiryDate: '15. janúar 2025'
                    }
                })
            });

            const data = await res.text();
            let parsedData: any = {};
            try {
                parsedData = JSON.parse(data);
            } catch {
                // Not JSON
            }

            if (res.ok) {
                alert(`✅ Prufupóstur sendur! Athugaðu inboxið þitt (${currentUser.email}).\n\nResend ID: ${parsedData.data?.id || 'N/A'}`);
            } else {
                const errorMsg = parsedData.error || data || res.statusText;
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            logger.error('Test email error:', error);
            alert(`❌ Villa: ${getUserMessage(error)}`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif">Tölvupóstsniðmát</h2>
                <div className="flex gap-2">
                    <button type="button" onClick={handleSeedTemplates} className="btn btn-secondary btn-sm">Búa til sjálfgefin</button>
                    <button type="button" onClick={fetchTemplates} className="btn btn-ghost btn-sm">Endurhlaða</button>
                </div>
            </div>

            {templates.length === 0 && !loading ? (
                <div className="text-center py-12 bg-white rounded-lg border border-stone-200">
                    <p className="text-stone-500 mb-4">Engin sniðmát fundust.</p>
                    <button type="button" onClick={handleSeedTemplates} className="btn btn-secondary">
                        Búa til sjálfgefin sniðmát
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {templates.map(tpl => (
                        <div key={tpl.id} className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg">{tpl.id}</h3>
                                        {tpl.active ? (
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Virkt
                                            </span>
                                        ) : (
                                            <span className="bg-stone-100 text-grey-mid text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                <XCircle className="w-3 h-3" /> Óvirkt
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-stone-500 mt-1">{tpl.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSendTestEmail(tpl)}
                                        disabled={actionLoading === `test-email-${tpl.id}`}
                                        className="btn btn-ghost btn-sm text-stone-500 hover:text-amber-ink border border-stone-200"
                                        title="Senda prufupóst á sjálfan þig"
                                        aria-label={`Senda prufupóst úr sniðmáti ${tpl.id} á sjálfan þig`}
                                    >
                                        {actionLoading === `test-email-${tpl.id}` ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingTemplate(tpl)}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        Breyta
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="text-sm">
                                    <span className="font-bold text-stone-700">Efnislína:</span> {tpl.subject}
                                </div>
                                {tpl.variables && tpl.variables.length > 0 && (
                                    <div className="text-sm">
                                        <span className="font-bold text-stone-700">Breytur:</span>
                                        <span className="font-mono text-xs bg-stone-100 px-1 ml-1 rounded text-stone-600">
                                            {tpl.variables.join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal / Overlay */}
            {editingTemplate && (
                <Modal
                    open
                    onClose={() => setEditingTemplate(null)}
                    title={`Breyta sniðmáti: ${editingTemplate.id}`}
                    size="xl"
                    footer={
                        <div className="flex w-full flex-wrap justify-between items-center gap-3">
                            <button
                                type="button"
                                onClick={() => handleSendTestEmail(editingTemplate)}
                                disabled={actionLoading === `test-email-${editingTemplate.id}`}
                                className="btn btn-ghost text-amber-ink hover:bg-amber/5 font-bold flex items-center gap-2"
                            >
                                {actionLoading === `test-email-${editingTemplate.id}` ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                {actionLoading === `test-email-${editingTemplate.id}` ? 'Sendi...' : 'Senda prufu á mig'}
                            </button>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditingTemplate(null)} className="btn btn-ghost">Hætta við</button>
                                <button
                                    type="button"
                                    onClick={() => handleSaveTemplate(editingTemplate)}
                                    className="btn btn-primary"
                                    disabled={actionLoading === 'saving-template'}
                                >
                                    {actionLoading === 'saving-template' ? 'Vistar...' : 'Vista breytingar'}
                                </button>
                            </div>
                        </div>
                    }
                >
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                            <div className="flex-1">
                                <strong>Staða:</strong> {editingTemplate.active ? 'Tilbúið til sendingar' : 'Drög (ekki í sendingu)'}
                            </div>
                            <button
                                type="button"
                                aria-pressed={!!editingTemplate.active}
                                onClick={() => setEditingTemplate({ ...editingTemplate, active: !editingTemplate.active })}
                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${editingTemplate.active ? 'bg-green-700 text-white' : 'bg-stone-300 text-stone-700'}`}
                            >
                                {editingTemplate.active ? 'Virkt' : 'Virkja'}
                            </button>
                        </div>

                        <div>
                            <label htmlFor={tplSubjectId} className="label">Efnislína</label>
                            <input
                                id={tplSubjectId}
                                type="text"
                                className="input font-bold"
                                value={editingTemplate.subject}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                            />
                        </div>

                        <div className="flex-1 flex flex-col">
                            <label htmlFor={tplHtmlId} className="label flex justify-between">
                                <span>HTML efni</span>
                                <span className="text-xs font-normal text-stone-500">Styður venjuleg HTML merki</span>
                            </label>
                            <textarea
                                id={tplHtmlId}
                                className="input font-mono text-xs leading-relaxed min-h-[300px]"
                                value={editingTemplate.html_content}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, html_content: e.target.value })}
                            />
                        </div>

                        <div className="bg-stone-100 p-4 rounded text-xs">
                            <strong>Tiltækar breytur:</strong> {editingTemplate.variables?.map(v => `{${v}}`).join(', ') || 'Engar'}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
