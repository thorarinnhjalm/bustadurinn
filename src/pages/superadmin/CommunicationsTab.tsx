import type { Dispatch, SetStateAction } from 'react';
import { Mail, Send, Star } from 'lucide-react';

import type { CommunicationsSubTab, EmailTemplate, SetActionLoading, SetStats, Stats } from './types';
import ContactsSubTab from './ContactsSubTab';
import EmailTemplatesSubTab from './EmailTemplatesSubTab';
import NewsletterSubTab from './NewsletterSubTab';
import FeedbackSubTab from './FeedbackSubTab';

interface CommunicationsTabProps {
    stats: Stats;
    setStats: SetStats;
    /** Page-level loading flag (see EmailTemplatesSubTab). */
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    actionLoading: string | null;
    setActionLoading: SetActionLoading;
    emailTemplates: {
        templates: EmailTemplate[];
        setTemplates: Dispatch<SetStateAction<EmailTemplate[]>>;
        fetchTemplates: () => Promise<void>;
    };
    reply: {
        replyText: string;
        setReplyText: Dispatch<SetStateAction<string>>;
    };
    /** Kept by the page so the selection survives switching top-level tabs. */
    subTab: CommunicationsSubTab;
    onSubTabChange: (tab: CommunicationsSubTab) => void;
}

export default function CommunicationsTab({
    stats, setStats, loading, setLoading, actionLoading, setActionLoading, emailTemplates, reply,
    subTab: communicationsSubTab, onSubTabChange: setCommunicationsSubTab
}: CommunicationsTabProps) {
    return (
        <>
            <div className="space-y-6">
                {/* Sub-tab Navigation */}
                <div className="flex gap-2 border-b border-stone-200 overflow-x-auto">
                    <button
                        type="button"
                        aria-current={communicationsSubTab === 'contacts' ? 'page' : undefined}
                        onClick={() => setCommunicationsSubTab('contacts')}
                        className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${communicationsSubTab === 'contacts'
                            ? 'text-charcoal border-b-2 border-amber'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Samskipti
                        </div>
                    </button>
                    <button
                        type="button"
                        aria-current={communicationsSubTab === 'emails' ? 'page' : undefined}
                        onClick={() => setCommunicationsSubTab('emails')}
                        className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${communicationsSubTab === 'emails'
                            ? 'text-charcoal border-b-2 border-amber'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Sniðmát
                        </div>
                    </button>
                    <button
                        type="button"
                        aria-current={communicationsSubTab === 'newsletter' ? 'page' : undefined}
                        onClick={() => setCommunicationsSubTab('newsletter')}
                        className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${communicationsSubTab === 'newsletter'
                            ? 'text-charcoal border-b-2 border-amber'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            Póstlisti
                        </div>
                    </button>
                    <button
                        type="button"
                        aria-current={communicationsSubTab === 'feedback' ? 'page' : undefined}
                        onClick={() => setCommunicationsSubTab('feedback')}
                        className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${communicationsSubTab === 'feedback'
                            ? 'text-charcoal border-b-2 border-amber'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Umsagnir
                        </div>
                    </button>
                </div>
            </div>

            {/* Sub-tab Content */}
            {communicationsSubTab === 'feedback' && (
                <FeedbackSubTab stats={stats} setStats={setStats} actionLoading={actionLoading} setActionLoading={setActionLoading} />
            )}
            {communicationsSubTab === 'contacts' && (
                <ContactsSubTab
                    stats={stats}
                    setStats={setStats}
                    actionLoading={actionLoading}
                    setActionLoading={setActionLoading}
                    replyText={reply.replyText}
                    setReplyText={reply.setReplyText}
                />
            )}
            {communicationsSubTab === 'newsletter' && <NewsletterSubTab stats={stats} setStats={setStats} />}
            {communicationsSubTab === 'emails' && (
                <EmailTemplatesSubTab
                    templates={emailTemplates.templates}
                    setTemplates={emailTemplates.setTemplates}
                    fetchTemplates={emailTemplates.fetchTemplates}
                    loading={loading}
                    setLoading={setLoading}
                    actionLoading={actionLoading}
                    setActionLoading={setActionLoading}
                />
            )}
        </>
    );
}
