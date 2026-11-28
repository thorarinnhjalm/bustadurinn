import { useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import type { LedgerEntry } from '@/types/models';
import { computeSettlement } from '@/components/finance/settlement';

interface YearEndSummaryProps {
    year: number;
    entries: LedgerEntry[];
    ownerIds: string[];
    members: { uid: string; name: string }[];
    memberShares?: { [uid: string]: number };
}

const formatKr = (n: number) => `${Math.round(n).toLocaleString('is-IS')} kr.`;

/**
 * Read-only, printable-friendly year-end summary. Ownership share always
 * comes from House.finance_settings.member_shares (equal by default) — see
 * src/utils/financeShares.ts. "Paid" is derived exactly as the ledger does:
 * an entry's payer(s) are its `split_between` list if set, otherwise its
 * single `paid_by_user_id`; a multi-person split_between divides that
 * entry's amount evenly among the listed payers.
 */
export default function YearEndSummary({ year, entries, ownerIds, members, memberShares }: YearEndSummaryProps) {
    const nameFor = (uid: string) => members.find((m) => m.uid === uid)?.name || 'Meðeigandi';

    const { totalExpenses, totalIncome, net, rows } = useMemo(
        () => computeSettlement(entries, ownerIds, memberShares, nameFor),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [entries, ownerIds, memberShares, members]
    );

    return (
        <div className="space-y-6">
            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <ClipboardList className="w-5 h-5 text-amber-ink" aria-hidden="true" />
                    <h2 className="text-xl font-serif text-charcoal">Ársyfirlit {year}</h2>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-bone/50 rounded-lg mb-6">
                    <div>
                        <div className="text-xs text-grey-mid mb-1">Tekjur alls</div>
                        <div className="font-bold text-green-700">+{formatKr(totalIncome)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-grey-mid mb-1">Gjöld alls</div>
                        <div className="font-bold text-red-600">-{formatKr(totalExpenses)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-grey-mid mb-1">Nettóstaða</div>
                        <div className={`font-bold ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {net >= 0 ? '+' : ''}{formatKr(net)}
                        </div>
                    </div>
                </div>

                {ownerIds.length === 0 && rows.length === 0 ? (
                    <p className="text-sm text-grey-mid">Engir eigendur skráðir.</p>
                ) : (
                    <div role="region" tabIndex={0} aria-label="Ársyfirlit eftir eigendum (flettu til hliðar)" className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <caption className="sr-only">Ársyfirlit {year} eftir eigendum</caption>
                            <thead className="text-xs text-grey-mid uppercase border-b border-grey-warm">
                                <tr>
                                    <th scope="col" className="pb-3 pl-2">Eigandi</th>
                                    <th scope="col" className="pb-3 text-right">Eignarhlutur</th>
                                    <th scope="col" className="pb-3 text-right">Hlutdeild í gjöldum</th>
                                    <th scope="col" className="pb-3 text-right">Greitt af honum</th>
                                    <th scope="col" className="pb-3 text-right pr-2">Mismunur</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-grey-warm/50">
                                {rows.map((row) => (
                                    <tr key={row.uid}>
                                        <th scope="row" className="py-3 pl-2 font-medium text-charcoal">{row.name}</th>
                                        <td className="py-3 text-right text-grey-mid">{row.sharePercent.toFixed(0)}%</td>
                                        <td className="py-3 text-right text-grey-mid">{formatKr(row.shareAmount)}</td>
                                        <td className="py-3 text-right text-grey-mid">{formatKr(row.paidAmount)}</td>
                                        <td className={`py-3 text-right pr-2 font-medium ${row.difference > 0 ? 'text-green-700' : row.difference < 0 ? 'text-red-600' : 'text-grey-mid'
                                            }`}>
                                            {row.difference === 0
                                                ? '—'
                                                : row.difference > 0
                                                    ? `+${formatKr(row.difference)} umfram hlutdeild`
                                                    : `${formatKr(row.difference)} vantar upp á hlutdeild`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-grey-warm text-xs text-grey-mid text-center">
                    * Hlutdeild miðast við eignarhlutföll (sjá „Eignarhlutir" í Rekstraráætlun). Greitt miðast við skráðan greiðanda hverrar færslu í bókhaldi.
                </div>
            </div>
        </div>
    );
}
