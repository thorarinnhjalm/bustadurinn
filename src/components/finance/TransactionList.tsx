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
        <div role="region" tabIndex={0} aria-label="Færslur í bókhaldi (flettu til hliðar)" className="overflow-x-auto">
            <table className="w-full text-left">
                <caption className="sr-only">Færslur í bókhaldi</caption>
                <thead className="text-xs text-grey-mid uppercase border-b border-grey-warm">
                    <tr>
                        <th scope="col" className="pb-3 pl-0 sm:pl-2 pr-2">Dags</th>
                        <th scope="col" className="pb-3">Flokkur</th>
                        <th scope="col" className="pb-3 hidden sm:table-cell">Lýsing</th>
                        <th scope="col" className="pb-3 text-right">Upphæð</th>
                        <th scope="col" className="pb-3 w-20"><span className="sr-only">Aðgerðir</span></th>
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
                                <td className="py-3 pl-0 sm:pl-2 pr-2 text-sm text-grey-mid whitespace-nowrap">
                                    {format(new Date(entry.date), 'dd. MMM', { locale: is })}
                                </td>
                                <td className="py-3 text-sm font-medium text-charcoal">
                                    <div className="flex items-center gap-2">
                                        {isExpense ? (
                                            <TrendingDown className="w-4 h-4 shrink-0 hidden sm:block text-red-500/50" aria-hidden="true" />
                                        ) : (
                                            <TrendingUp className="w-4 h-4 shrink-0 hidden sm:block text-green-500/50" aria-hidden="true" />
                                        )}
                                        {entry.category}
                                    </div>
                                    {/* Phones: the description column is hidden, so it moves under the category */}
                                    {(entry.description || entry.paid_by_name) && (
                                        <div className="sm:hidden text-xs font-normal text-grey-mid mt-0.5 [overflow-wrap:anywhere]">
                                            {entry.description}
                                            {entry.paid_by_name && (
                                                <span className="block">Skráð af: {entry.paid_by_name}</span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="py-3 text-sm text-grey-mid hidden sm:table-cell">
                                    {entry.description}
                                    {entry.paid_by_name && (
                                        <span className="text-xs block">
                                            Skráð af: {entry.paid_by_name}
                                        </span>
                                    )}
                                </td>
                                <td className={`py-3 text-sm font-bold text-right whitespace-nowrap ${isExpense ? 'text-charcoal' : 'text-green-700'
                                    }`}>
                                    <span className="sr-only">{isExpense ? 'Útgjöld: ' : 'Tekjur: '}</span>
                                    {isExpense ? '- ' : '+ '}
                                    {entry.amount.toLocaleString()} kr.
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    {canEdit && (
                                        <>
                                            <button
                                                onClick={() => onEdit(entry)}
                                                type="button"
                                                className="p-1.5 -m-1 text-grey-mid hover:text-amber-ink focus-visible:opacity-100 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-all"
                                                aria-label="Breyta færslu"
                                                title="Breyta færslu"
                                            >
                                                <Edit2 className="w-4 h-4" aria-hidden="true" />
                                            </button>
                                            <div className="w-px h-4 bg-grey-warm/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100" aria-hidden="true"></div>
                                        </>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => onDelete(entry)}
                                            type="button"
                                            className="p-1.5 -m-1 text-grey-mid hover:text-red-500 focus-visible:opacity-100 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-all"
                                            aria-label="Eyða færslu"
                                            title="Eyða færslu"
                                        >
                                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                    )}
                                  </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
