import { useMemo } from 'react';
import type { BudgetItem, FinanceEntry } from '@/types/models';
import { AlertCircle } from 'lucide-react';

interface VarianceWidgetProps {
    budgetItems: BudgetItem[];
    entries: FinanceEntry[];
}

export default function VarianceWidget({ budgetItems, entries }: VarianceWidgetProps) {
    const comparison = useMemo(() => {
        // 1. Aggregate Actual Expenses by Category (Lowercase normalization)
        const expenseMap = new Map<string, number>();
        let totalActual = 0;

        entries
            .filter(e => e.type === 'expense')
            .forEach(e => {
                const cat = e.category.trim().toLowerCase();
                const current = expenseMap.get(cat) || 0;
                expenseMap.set(cat, current + e.amount);
                totalActual += e.amount;
            });

        // 2. Map Budget Items to Actuals
        const rows = budgetItems.map(item => {
            const annualBudget = item.frequency === 'monthly'
                ? item.estimated_amount * 12
                : item.estimated_amount;

            const cat = item.category.trim().toLowerCase();
            const actual = expenseMap.get(cat) || 0;

            // Remove matched from map to find "Uncategorized" later logic if needed
            // But Map deletion inside map is side-effecty. 
            // We'll just ignore for now or handle sophisticatedly later.

            const percent = annualBudget > 0 ? (actual / annualBudget) * 100 : 0;

            return {
                category: item.category,
                budget: annualBudget,
                actual,
                percent,
                status: percent > 100 ? 'over' : percent > 90 ? 'warning' : 'ok'
            };
        });

        // Calculate Totals
        const totalBudget = rows.reduce((sum, r) => sum + r.budget, 0);
        const totalPercent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

        return { rows, totalBudget, totalActual, totalPercent };
    }, [budgetItems, entries]);

    if (budgetItems.length === 0) return null;

    return (
        <div className="card">
            <h3 className="font-serif text-xl mb-6">Staða áætlunar (YTD)</h3>

            {/* Overall Progress */}
            <div className="mb-8">
                <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Heildarnýting</span>
                    <span className="text-grey-mid">
                        {comparison.totalActual.toLocaleString()} / {comparison.totalBudget.toLocaleString()} kr.
                    </span>
                </div>
                <div className="h-4 bg-bone rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${comparison.totalPercent > 100 ? 'bg-red-400' : 'bg-green-500'
                            }`}
                        style={{ width: `${Math.min(comparison.totalPercent, 100)}%` }}
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="space-y-6">
                {comparison.rows.map((row) => (
                    <div key={row.category}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-charcoal">{row.category}</span>
                            <span className={`text-xs ${row.status === 'over' ? 'text-red-500 font-bold' : 'text-grey-mid'
                                }`}>
                                {row.actual.toLocaleString()} / {row.budget.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-2 bg-bone rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${row.status === 'over' ? 'bg-red-400' :
                                        row.status === 'warning' ? 'bg-amber' : 'bg-green-500'
                                    }`}
                                style={{ width: `${Math.min(row.percent, 100)}%` }}
                            />
                        </div>
                        {row.status === 'over' && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                                <AlertCircle className="w-3 h-3" />
                                <span>Farið fram úr áætlun (+{(row.actual - row.budget).toLocaleString()} kr.)</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-grey-warm text-xs text-grey-mid text-center">
                * Miðað við heilsársáætlun vs. skráðan kostnað það sem af er ári.
            </div>
        </div>
    );
}
