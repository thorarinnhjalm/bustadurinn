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
            {/*
              sm and up: a normal table. Phones: the same table markup, but each row is a small grid:
              line 1 category + amount, line 2 description (full width), line 3 date . "Skráð af" + actions.
            */}
            <table className="w-full text-left max-sm:block">
                <caption className="sr-only">Færslur í bókhaldi</caption>
                <thead className="text-xs text-grey-mid uppercase border-b border-grey-warm max-sm:sr-only">
                    <tr>
                        <th scope="col" className="pb-3 pl-0 sm:pl-2 pr-2">Dags</th>
                        <th scope="col" className="pb-3">Flokkur</th>
                        <th scope="col" className="pb-3">Lýsing</th>
                        <th scope="col" className="pb-3 text-right">Upphæð</th>
                        <th scope="col" className="pb-3 w-20"><span className="sr-only">Aðgerðir</span></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-grey-warm/50 max-sm:block">
                    {sortedEntries.map((entry) => {
                        const isExpense = entry.type === 'expense';
                        const canDelete = isManager || entry.user_uid === currentUserId;

                        // Allow editing if you can delete (heuristic)
                        const canEdit = canDelete;

                        return (
                            <tr key={entry.id} className="group hover:bg-bone/50 transition-colors max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:items-center max-sm:gap-x-3 max-sm:gap-y-1 max-sm:py-3">
                                <td className="py-3 pl-0 sm:pl-2 pr-2 text-sm text-grey-mid whitespace-nowrap max-sm:col-start-1 max-sm:row-start-3 max-sm:py-0 max-sm:pr-0 max-sm:text-xs max-sm:whitespace-normal">
                                    {format(new Date(entry.date), 'dd. MMM', { locale: is })}
                                    {entry.paid_by_name && (
                                        <span className="sm:hidden"> · Skráð af: {entry.paid_by_name}</span>
                                    )}
                                </td>
                                <td className="py-3 text-sm font-medium text-charcoal max-sm:col-start-1 max-sm:row-start-1 max-sm:py-0 max-sm:text-base">
                                    <div className="flex items-center gap-2">
                                        {isExpense ? (
                                            <TrendingDown className="w-4 h-4 shrink-0 hidden sm:block text-red-500/50" aria-hidden="true" />
                                        ) : (
                                            <TrendingUp className="w-4 h-4 shrink-0 hidden sm:block text-green-500/50" aria-hidden="true" />
                                        )}
                                        <span className="min-w-0 break-words [hyphens:none]">{entry.category}</span>
                                    </div>
                                </td>
                                <td className={`py-3 text-sm text-grey-mid break-words [hyphens:none] max-sm:col-span-2 max-sm:row-start-2 max-sm:py-0 max-sm:text-charcoal ${entry.description ? '' : 'max-sm:hidden'}`}>
                                    {entry.description}
                                    {entry.paid_by_name && (
                                        <span className="text-xs block max-sm:hidden">
                                            Skráð af: {entry.paid_by_name}
                                        </span>
                                    )}
                                </td>
                                <td className={`py-3 text-sm font-bold text-right whitespace-nowrap tabular-nums max-sm:col-start-2 max-sm:row-start-1 max-sm:py-0 max-sm:text-base ${isExpense ? 'text-charcoal' : 'text-green-700'
                                    }`}>
                                    <span className="sr-only">{isExpense ? 'Útgjöld: ' : 'Tekjur: '}</span>
                                    {isExpense ? '- ' : '+ '}
                                    {entry.amount.toLocaleString()} kr.
                                </td>
                                <td className="py-3 text-right max-sm:col-start-2 max-sm:row-start-3 max-sm:py-0">
                                  <div className="flex items-center justify-end gap-3 max-sm:gap-1">
                                    {canEdit && (
                                        <>
                                            <button
                                                onClick={() => onEdit(entry)}
                                                type="button"
                                                className="p-1.5 -m-1 max-sm:m-0 max-sm:flex max-sm:h-10 max-sm:w-10 max-sm:items-center max-sm:justify-center text-grey-mid hover:text-amber-ink focus-visible:opacity-100 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-all"
                                                aria-label="Breyta færslu"
                                                title="Breyta færslu"
                                            >
                                                <Edit2 className="w-4 h-4" aria-hidden="true" />
                                            </button>
                                            <div className="w-px h-4 bg-grey-warm/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 max-sm:hidden" aria-hidden="true"></div>
                                        </>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => onDelete(entry)}
                                            type="button"
                                            className="p-1.5 -m-1 max-sm:m-0 max-sm:flex max-sm:h-10 max-sm:w-10 max-sm:items-center max-sm:justify-center text-grey-mid hover:text-red-500 focus-visible:opacity-100 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-all"
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
