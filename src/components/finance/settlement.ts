/**
 * Year-end settlement: how much each person paid versus their ownership
 * share of expenses. Payers who are no longer owners are included (under
 * their stored name) so the differences always net to zero.
 */
import type { LedgerEntry } from '@/types/models';
import { computeMemberShares, computeMemberSharePercentages } from '@/utils/financeShares';

export const FORMER_MEMBER_NAME = 'Fyrrverandi meðeigandi';

export interface SettlementRow {
    uid: string;
    name: string;
    isFormerMember: boolean;
    sharePercent: number;
    shareAmount: number;
    paidAmount: number;
    difference: number; // paidAmount - shareAmount
}

export interface Settlement {
    totalExpenses: number;
    totalIncome: number;
    net: number;
    rows: SettlementRow[];
}

export function computeSettlement(
    entries: LedgerEntry[],
    ownerIds: string[],
    memberShares: { [uid: string]: number } | undefined,
    nameFor: (uid: string) => string
): Settlement {
    const expenseEntries = entries.filter((e) => e.type === 'expense');
    const incomeEntries = entries.filter((e) => e.type === 'income');

    const totalExpenses = expenseEntries.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0);

    const uniqueOwners = Array.from(new Set(ownerIds.filter(Boolean)));
    const ownerSet = new Set(uniqueOwners);

    const paidByMember: Record<string, number> = {};
    const storedNames: Record<string, string> = {};
    uniqueOwners.forEach((uid) => { paidByMember[uid] = 0; });

    expenseEntries.forEach((entry) => {
        const payers: { uid: string; name?: string }[] = entry.split_between && entry.split_between.length > 0
            ? entry.split_between
            : [{ uid: entry.paid_by_user_id || 'unknown', name: entry.paid_by_name }];

        const perPayer = entry.amount / payers.length;
        payers.forEach((p) => {
            paidByMember[p.uid] = (paidByMember[p.uid] ?? 0) + perPayer;
            if (p.name && !storedNames[p.uid]) storedNames[p.uid] = p.name;
        });
    });

    const shareAmounts = computeMemberShares(totalExpenses, uniqueOwners, memberShares);
    const sharePercentages = computeMemberSharePercentages(uniqueOwners, memberShares);

    const rows: SettlementRow[] = uniqueOwners.map((uid) => {
        const shareAmount = shareAmounts[uid] ?? 0;
        const paidAmount = paidByMember[uid] ?? 0;
        return {
            uid,
            name: nameFor(uid),
            isFormerMember: false,
            sharePercent: sharePercentages[uid] ?? 0,
            shareAmount,
            paidAmount,
            difference: paidAmount - shareAmount
        };
    });

    Object.keys(paidByMember)
        .filter((uid) => !ownerSet.has(uid))
        .forEach((uid) => {
            const paidAmount = paidByMember[uid];
            rows.push({
                uid,
                name: storedNames[uid] || FORMER_MEMBER_NAME,
                isFormerMember: true,
                sharePercent: 0,
                shareAmount: 0,
                paidAmount,
                difference: paidAmount
            });
        });

    return { totalExpenses, totalIncome, net: totalIncome - totalExpenses, rows };
}
