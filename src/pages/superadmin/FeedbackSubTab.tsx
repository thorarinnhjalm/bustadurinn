import { Star, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';
import { feedbackService } from '@/services/feedbackService';

import type { Feedback } from '@/types/models';
import type { SetActionLoading, SetStats, Stats } from './types';
import { invalidateStatsCache } from './useSuperAdminData';

interface FeedbackSubTabProps {
    stats: Stats;
    setStats: SetStats;
    actionLoading: string | null;
    setActionLoading: SetActionLoading;
}

export default function FeedbackSubTab({ stats, setStats, actionLoading, setActionLoading }: FeedbackSubTabProps) {
    const handleToggleFeatured = async (feedback: Feedback) => {
        setActionLoading(`feature-${feedback.id}`);
        try {
            await feedbackService.toggleFeatured(feedback.id, !feedback.featured);
            invalidateStatsCache();
            setStats(prev => ({
                ...prev,
                allFeedback: prev.allFeedback.map(f => f.id === feedback.id ? { ...f, featured: !f.featured } : f)
            }));
        } catch (error: any) {
            logger.error('Error toggling featured status:', error);
            alert('Villa: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    const handleSyncFeaturedFeedback = async () => {
        setActionLoading('sync-featured');
        try {
            const { created, removed } = await feedbackService.syncFeaturedCopies();
            alert(`Lokið! ${created} birtar umsagnir samstilltar, ${removed} fjarlægðar.`);
        } catch (error: any) {
            logger.error('Error syncing featured feedback:', error);
            alert('Villa: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteFeedback = async (id: string) => {
        if (!confirm('Ertu viss um að þú viljir eyða þessari umsögn?')) return;
        setActionLoading(`delete-feedback-${id}`);
        try {
            await feedbackService.deleteFeedback(id);
            invalidateStatsCache();
            setStats(prev => ({
                ...prev,
                allFeedback: prev.allFeedback.filter(f => f.id !== id)
            }));
        } catch (error: any) {
            logger.error('Error deleting feedback:', error);
            alert('Villa: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="bg-white border border-stone-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif font-semibold">Umsagnir</h2>
                <button
                    type="button"
                    onClick={handleSyncFeaturedFeedback}
                    disabled={actionLoading === 'sync-featured'}
                    className="btn btn-secondary text-sm"
                >
                    Samstilla birtar umsagnir
                </button>
            </div>
            <DataTable
                caption="Umsagnir notenda"
                columns={[
                    {
                        key: 'rating', label: 'Hvað finnst þér?', sortable: true, render: (row) => (
                            <div className="flex text-amber-ink" role="img" aria-label={`${row.rating} af 5 stjörnum`}>
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} aria-hidden="true" className={i < row.rating ? 'fill-amber' : 'text-stone-300'}>★</span>
                                ))}
                            </div>
                        )
                    },
                    {
                        key: 'comment', label: 'Hvað má betur fara?', render: (row) => (
                            <div className="max-w-md truncate" title={row.comment}>{row.comment || '-'}</div>
                        )
                    },
                    {
                        key: 'userName', label: 'Notandi', sortable: true, render: (row) => (
                            <div>
                                <div className="font-medium">{row.userName}</div>
                                <div className="text-xs text-stone-500">{row.userEmail}</div>
                            </div>
                        )
                    },
                    {
                        key: 'canContact', label: 'Má hafa samband?', render: (row) => (
                            row.canContact ? <span className="text-green-700 bg-green-50 px-2 py-1 rounded text-xs">Já</span> : <span className="text-stone-500 text-xs">Nei</span>
                        )
                    },
                    { key: 'createdAt', label: 'Dags', sortable: true, render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString('is-IS') : '-' },
                ]}
                data={stats.allFeedback}
                searchKeys={['userName', 'userEmail', 'comment']}
                actions={(row) => (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleToggleFeatured(row)}
                            className={`p-2 rounded hover:bg-stone-50 transition-colors ${row.featured ? 'text-amber-ink bg-amber/10' : 'text-stone-500'}`}
                            title={row.featured ? "Hætta að birta" : "Birta á forsíðu"}
                            aria-label={row.featured ? "Hætta að birta umsögn á forsíðu" : "Birta umsögn á forsíðu"}
                            aria-pressed={!!row.featured}
                        >
                            <Star className={`w-4 h-4 ${row.featured ? 'fill-amber' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDeleteFeedback(row.id)}
                            className="p-2 text-stone-500 hover:text-red-600 hover:bg-stone-50 rounded transition-colors"
                            title="Eyða"
                            aria-label="Eyða umsögn"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            />
        </div>
    );
}
