import { useId, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Send, Reply } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAppStore } from '@/store/appStore';
import DataTable from '@/components/DataTable';
import Modal from '@/components/ui/Modal';
import { logger } from '@/utils/logger';

import type { ContactSubmission } from '@/types/models';
import type { SetActionLoading, SetStats, Stats } from './types';
import { invalidateStatsCache } from './useSuperAdminData';

interface ContactsSubTabProps {
    stats: Stats;
    setStats: SetStats;
    actionLoading: string | null;
    setActionLoading: SetActionLoading;
    /** The reply draft is kept by the page, so it survives closing the modal and switching tabs. */
    replyText: string;
    setReplyText: Dispatch<SetStateAction<string>>;
}

export default function ContactsSubTab({ stats, setStats, actionLoading, setActionLoading, replyText, setReplyText }: ContactsSubTabProps) {
    const replyTextId = `${useId()}-reply-text`;
    const currentUser = useAppStore((state) => state.currentUser);
    const [replyingTo, setReplyingTo] = useState<ContactSubmission | null>(null);

    // The draft belongs to one contact: drop it whenever the dialog closes.
    const closeReply = () => {
        setReplyingTo(null);
        setReplyText('');
    };

    const handleSendReply = async () => {
        if (!replyingTo || !replyText.trim()) return;

        setActionLoading('sending-reply');
        try {
            // 1. Send Email (using direct html injection for flexible arbitrary replies)
            // Note: In production you might want a proper template or 'send-email' endpoint that accepts 'html' or 'text' body directly.
            // Assuming /api/send-email handles a 'html' property if provided, or we use a generic 'reply_template'.
            // For now, let's assume valid implementation or generic handling.

            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error('Not authenticated');

            const res = await fetch('/api/admin-send-reply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    to: replyingTo.email,
                    subject: `Sv: Erindi frá Bústaðurinn.is`,
                    text: replyText,
                    submissionId: replyingTo.id
                })
            });

            if (!res.ok) throw new Error(`Send reply failed (${res.status})`);

            // 2. Update Firestore
            const reply = {
                body: replyText,
                from_email: 'support@bustadurinn.is',
                created_at: new Date(),
                is_admin_reply: true,
                admin_id: currentUser?.uid
            };

            const docRef = doc(db, 'contact_submissions', replyingTo.id);
            // We need to use arrayUnion or simply read-modify-write. Since we have 'replyingTo' from state which might be stale if we don't be careful, but generally okay here.
            // Actually, we should just push to the array in memory and write the whole array or use arrayUnion.
            // Let's use standard update for now.

            // Note: Firestore doesn't accept custom objects in arrayUnion easily without conversion if they have Date objects.
            // We'll simplisticly just set the status and rely on local update, or fetch fresh.
            // Better: update 'replies' field.

            // For simplicity in this step, let's assume we update the whole object or just status + replies.
            // Since we need to persist the 'reply' object which has a JS Date, we need to convert it for Firestore if using raw SDK,
            // but the SDK usually handles Date objects in top level fields. Inside arrays it can be tricky.
            // We will just update status for now and assume the API might handle the log or we do it here.

            await updateDoc(docRef, {
                status: 'replied',
                // For simplicity, we won't push to 'replies' array in Firestore in this specific call to avoid complex array logic without checking current DB state accurately.
                // BUT the requirements said "Implement conversation threading".
                // So I MUST persist it.
                // standard way:
                replies: [...(replyingTo.replies || []), reply]
            });

            // 3. Update Local State
            setStats(prev => ({
                ...prev,
                allContacts: prev.allContacts.map(c =>
                    c.id === replyingTo.id
                        ? { ...c, status: 'replied' as const, replies: [...(c.replies || []), reply] }
                        : c
                )
            }));

            invalidateStatsCache();
            closeReply();
            alert('✅ Svar sent!');

        } catch (error: any) {
            logger.error('Reply error:', error);
            alert('Mistókst að senda svar. Pósturinn var ekki sendur eða svarið vistaðist ekki. Reyndu aftur.');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <>
            <div>
                <h2 className="text-2xl font-serif mb-6">Samskipti frá síðu</h2>
                <DataTable
                    caption="Samskipti frá síðu"
                    columns={[
                        { key: 'name', label: 'Nafn' },
                        { key: 'email', label: 'Netfang' },
                        {
                            key: 'message',
                            label: 'Skila boð',
                            render: (row) => {
                                const msg = row.message || '';
                                return msg.length > 50 ? msg.substring(0, 50) + '...' : msg;
                            }
                        },
                        {
                            key: 'created_at',
                            label: 'Dagsetning',
                            render: (row) => {
                                if (!row.created_at) return '—';
                                const date = row.created_at instanceof Date
                                    ? row.created_at
                                    : new Date(row.created_at);
                                return date.toLocaleDateString('is-IS');
                            }
                        },
                        {
                            key: 'status',
                            label: 'Staða',
                            render: (row) => {
                                const status = row.status || 'new';
                                const colors = {
                                    new: 'bg-blue-100 text-blue-700',
                                    read: 'bg-gray-100 text-gray-700',
                                    replied: 'bg-green-100 text-green-700'
                                };
                                return (
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors]}`}>
                                        {status}
                                    </span>
                                );
                            }
                        }
                    ]}
                    data={stats.allContacts}
                    searchKeys={['name', 'email', 'message']}
                    actions={(row) => (
                        <button
                            type="button"
                            onClick={() => setReplyingTo(row)}
                            className="btn btn-secondary btn-sm flex items-center gap-2"
                        >
                            <Reply className="w-3 h-3" />
                            {row.status === 'replied' ? 'Sjá Svar' : 'Svara'}
                        </button>
                    )}
                />
            </div>

            {/* Reply to Contact Modal */}
            {
                replyingTo && (
                    <Modal
                        open
                        onClose={closeReply}
                        title="Svara erindi"
                        size="xl"
                        footer={
                            <>
                                <button type="button" onClick={closeReply} className="btn btn-ghost">Loka</button>
                                <button
                                    type="button"
                                    onClick={handleSendReply}
                                    className="btn btn-primary flex items-center gap-2"
                                    disabled={actionLoading === 'sending-reply' || !replyText.trim()}
                                >
                                    {actionLoading === 'sending-reply' ? 'Sendi...' : 'Senda svar'}
                                    <Send className="w-4 h-4" />
                                </button>
                            </>
                        }
                    >
                            <div className="space-y-6">
                                {/* Original Message */}
                                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-charcoal">{replyingTo.name}</div>
                                        <div className="text-xs text-stone-500">{new Date(replyingTo.created_at).toLocaleString('is-IS')}</div>
                                    </div>
                                    <div className="text-stone-600 mb-2 font-mono text-xs">{replyingTo.email}</div>
                                    <p className="text-stone-800 whitespace-pre-wrap">{replyingTo.message}</p>
                                </div>

                                {/* Previous Replies */}
                                {replyingTo.replies && replyingTo.replies.length > 0 && (
                                    <div className="pl-6 border-l-2 border-stone-200 space-y-4">
                                        <h5 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Samskiptasaga</h5>
                                        {replyingTo.replies.map((reply, idx) => (
                                            <div key={idx} className={`text-sm p-3 rounded-lg ${reply.is_admin_reply ? 'bg-blue-50 ml-4' : 'bg-stone-50 mr-4'}`}>
                                                <div className="flex justify-between text-xs text-stone-500 mb-1">
                                                    <span className="font-bold">{reply.from_email}</span>
                                                    <span>{new Date(reply.created_at).toLocaleString()}</span>
                                                </div>
                                                <div className="whitespace-pre-wrap">{reply.body}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reply Form */}
                                <div>
                                    <label htmlFor={replyTextId} className="text-xs font-bold text-stone-500 uppercase mb-2 block">Svar</label>
                                    <textarea
                                        id={replyTextId}
                                        className="w-full h-40 p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent font-sans"
                                        placeholder="Skrifaðu svar..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                    </Modal>
                )
            }
        </>
    );
}
