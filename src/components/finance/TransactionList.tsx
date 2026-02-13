import { Trash2, TrendingDown, TrendingUp, Edit2 } from 'lucide-react';
import type { LedgerEntry } from '@/types/models';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';

interface TransactionListProps {
    entries: LedgerEntry[];
    onDelete: (entry: LedgerEntry) => void;
    onEdit: (entry: LedgerEntry) => void;
    currentUserId: string;
    isManager: boolean;
}

export default function TransactionList({ entries, onDelete, onEdit, currentUserId, isManager }: TransactionListProps) {
    if (entries.length === 0) {
        return (
            <div className="text-center py-8 text-grey-mid">
                Engar færslur fundust.
            </div>
        );
    }

    // Sort by date desc
    const sortedEntries = [...entries].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="text-xs text-grey-mid uppercase border-b border-grey-warm">
                    <tr>
                        <th className="pb-3 pl-2">Dags</th>
                        <th className="pb-3">Flokkur</th>
                        <th className="pb-3">Lýsing</th>
                        <th className="pb-3 text-right">Upphæð</th>
                        <th className="pb-3 w-20"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-grey-warm/50">
                    {sortedEntries.map((entry) => {
                        const isExpense = entry.type === 'expense';
                        const canDelete = isManager || entry.user_uid === currentUserId;

                        // Allow editing if you can delete (heuristic)
                        const canEdit = canDelete;

                        return (
                            <tr key={entry.id} className="group hover:bg-bone/50 transition-colors">
                                <td className="py-3 pl-2 text-sm text-grey-mid whitespace-nowrap">
                                    {format(new Date(entry.date), 'dd. MMM', { locale: is })}
                                </td>
                                <td className="py-3 text-sm font-medium text-charcoal">
                                    <div className="flex items-center gap-2">
                                        {isExpense ? (
                                            <TrendingDown className="w-4 h-4 text-red-500/50" />
                                        ) : (
                                            <TrendingUp className="w-4 h-4 text-green-500/50" />
                                        )}
                                        {entry.category}
                                    </div>
                                </td>
                                <td className="py-3 text-sm text-grey-mid">
                                    {entry.description}
                                    {entry.paid_by_name && (
                                        <span className="text-xs opacity-60 block">
                                            Skráð af: {entry.paid_by_name}
                                        </span>
                                    )}
                                </td>
                                <td className={`py-3 text-sm font-bold text-right whitespace-nowrap ${isExpense ? 'text-charcoal' : 'text-green-600'
                                    }`}>
                                    {isExpense ? '- ' : '+ '}
                                    {entry.amount.toLocaleString()} kr.
                                </td>
                                <td className="py-3 text-right flex items-center justify-end gap-2">
                                    {canEdit && (
                                        <>
                                            <button
                                                onClick={() => onEdit(entry)}
                                                className="text-grey-mid hover:text-amber opacity-0 group-hover:opacity-100 transition-all"
                                                title="Breyta færslu"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <div className="w-px h-4 bg-grey-warm/50 opacity-0 group-hover:opacity-100"></div>
                                        </>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => onDelete(entry)}
                                            className="text-grey-mid hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Eyða færslu"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
