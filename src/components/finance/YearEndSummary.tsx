import { useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import type { LedgerEntry } from '@/types/models';
import { computeMemberShares, computeMemberSharePercentages } from '@/utils/financeShares';

interface YearEndSummaryProps {
    year: number;
    entries: LedgerEntry[];
    ownerIds: string[];
    members: { uid: string; name: string }[];
    memberShares?: { [uid: string]: number };
}

interface MemberRow {
    uid: string;
    name: string;
    sharePercent: number;
    shareAmount: number;
    paidAmount: number;
    difference: number; // paidAmount - shareAmount
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
    const nameFor = (uid: string) => members.find((m) => m.uid === uid)?.name || uid;

    const { totalExpenses, totalIncome, net, rows } = useMemo(() => {
        const expenseEntries = entries.filter((e) => e.type === 'expense');
        const incomeEntries = entries.filter((e) => e.type === 'income');

        const totalExpenses = expenseEntries.reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0);

        // How much each owner actually paid, based on expense entries only
        // (compared against their share of expenses below).
        const paidByMember: Record<string, number> = {};
        ownerIds.forEach((uid) => { paidByMember[uid] = 0; });

        expenseEntries.forEach((entry) => {
            const payerUids = entry.split_between && entry.split_between.length > 0
                ? entry.split_between.map((p) => p.uid)
                : [entry.paid_by_user_id];

            const perPayer = entry.amount / payerUids.length;
            payerUids.forEach((uid) => {
                paidByMember[uid] = (paidByMember[uid] ?? 0) + perPayer;
            });
        });

        const shareAmounts = computeMemberShares(totalExpenses, ownerIds, memberShares);
        const sharePercentages = computeMemberSharePercentages(ownerIds, memberShares);

        const rows: MemberRow[] = ownerIds.map((uid) => {
            const shareAmount = shareAmounts[uid] ?? 0;
            const paidAmount = paidByMember[uid] ?? 0;
            return {
                uid,
                name: nameFor(uid),
                sharePercent: sharePercentages[uid] ?? 0,
                shareAmount,
                paidAmount,
                difference: paidAmount - shareAmount
            };
        });

        return { totalExpenses, totalIncome, net: totalIncome - totalExpenses, rows };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entries, ownerIds, memberShares, members]);

    return (
        <div className="space-y-6">
            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <ClipboardList className="w-5 h-5 text-amber" />
                    <h2 className="text-xl font-serif text-charcoal">Ársyfirlit {year}</h2>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-bone/50 rounded-lg mb-6">
                    <div>
                        <div className="text-xs text-grey-mid mb-1">Tekjur alls</div>
                        <div className="font-bold text-green-600">+{formatKr(totalIncome)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-grey-mid mb-1">Gjöld alls</div>
                        <div className="font-bold text-red-600">-{formatKr(totalExpenses)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-grey-mid mb-1">Nettóstaða</div>
                        <div className={`font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {net >= 0 ? '+' : ''}{formatKr(net)}
                        </div>
                    </div>
                </div>

                {ownerIds.length === 0 ? (
                    <p className="text-sm text-grey-mid">Engir eigendur skráðir.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-grey-mid uppercase border-b border-grey-warm">
                                <tr>
                                    <th className="pb-3 pl-2">Eigandi</th>
                                    <th className="pb-3 text-right">Eignarhlutur</th>
                                    <th className="pb-3 text-right">Hlutdeild í gjöldum</th>
                                    <th className="pb-3 text-right">Greitt af honum</th>
                                    <th className="pb-3 text-right pr-2">Mismunur</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-grey-warm/50">
                                {rows.map((row) => (
                                    <tr key={row.uid}>
                                        <td className="py-3 pl-2 font-medium text-charcoal">{row.name}</td>
                                        <td className="py-3 text-right text-grey-mid">{row.sharePercent.toFixed(0)}%</td>
                                        <td className="py-3 text-right text-grey-mid">{formatKr(row.shareAmount)}</td>
                                        <td className="py-3 text-right text-grey-mid">{formatKr(row.paidAmount)}</td>
                                        <td className={`py-3 text-right pr-2 font-medium ${row.difference > 0 ? 'text-green-600' : row.difference < 0 ? 'text-red-600' : 'text-grey-mid'
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
