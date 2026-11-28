import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LedgerEntry, BudgetPlan } from '@/types/models';
import { logger } from '@/utils/logger';
import type { SetDashboardLoading } from './types';

export interface FinanceSummary {
    balance: number;
    lastAction: string;
    totalBudget: number;
    actualYTD: number;
}

/** House fund balance, this year's expenses, last entry and the current-year budget plan. */
export function useFinanceSummary(houseId: string | undefined, uid: string | undefined, setDashboardLoading: SetDashboardLoading) {
    const [finances, setFinances] = useState<FinanceSummary>({ balance: 0, lastAction: "—", totalBudget: 0, actualYTD: 0 });
    const [budgetPlan, setBudgetPlan] = useState<BudgetPlan | null>(null);

    useEffect(() => {
        if (!houseId || !uid) return;
        const unsubscribes: (() => void)[] = [];
        try {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);

            // 5. Finances (Subcollection)
            // All entries are loaded (small collection) so the fund balance is
            // the true balance; the this-year figure is derived from them.
            const qFinance = query(
                collection(db, 'houses', houseId, 'finance_entries'),
                orderBy('date', 'desc')
            );

            // Fetch Budget Plan for current year
            const qBudget = query(
                collection(db, 'houses', houseId, 'budget_plans'),
                where('year', '==', now.getFullYear()),
                limit(1)
            );

            unsubscribes.push(onSnapshot(qBudget, (snapshot) => {
                if (!snapshot.empty) {
                    setBudgetPlan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BudgetPlan);
                } else {
                    setBudgetPlan(null);
                }
            }, (error) => {
                logger.error('Budget listener error:', error);
                setDashboardLoading(false);
            }));

            unsubscribes.push(onSnapshot(qFinance, (snapshot) => {
                const entries = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().date?.toDate(),
                    created_at: doc.data().created_at?.toDate()
                })) as LedgerEntry[];

                const income = entries.filter(e => e.type !== 'expense').reduce((s, e) => s + e.amount, 0);
                const expense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
                const bal = income - expense;
                const expenseThisYear = entries
                    .filter(e => e.type === 'expense' && e.date && e.date >= startOfYear)
                    .reduce((s, e) => s + e.amount, 0);

                let action = "Ekkert að frétta";
                if (entries.length > 0) {
                    // Entries are already sorted by DESC date in query
                    const last = entries[0];
                    const who = last.paid_by_name?.split(' ')[0] || 'Sjóðurinn';
                    const verb = last.type === 'expense' ? 'greiddi' : 'lagði inn';
                    action = `${who} ${verb} ${last.amount.toLocaleString('is-IS')} kr.`;
                }

                setFinances(prev => ({
                    ...prev,
                    balance: bal,
                    lastAction: action,
                    actualYTD: expenseThisYear
                }));
            }, (error) => {
                logger.error("Finance listener error:", error);
                setDashboardLoading(false);
            }));
        } catch (err) {
            logger.error("Setup listeners error:", err);
            setDashboardLoading(false);
        }
        return () => {
            unsubscribes.forEach(u => u());
        };
    }, [houseId, uid, setDashboardLoading]);

    return { finances, budgetPlan };
}
