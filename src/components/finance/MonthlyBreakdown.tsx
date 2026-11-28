import { useId, useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import type { BudgetItem } from '@/types/models';

interface MonthlyBreakdownProps {
    budgetItems: BudgetItem[];
}

interface MonthData {
    month: string;
    monthNumber: number;
    income: number;
    expenses: number;
    net: number;
    runningBalance: number;
}

export default function MonthlyBreakdown({ budgetItems }: MonthlyBreakdownProps) {
    const baseId = useId();
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate monthly breakdown
    const monthlyData: MonthData[] = [];
    const months = [
        'Janúar', 'Febrúar', 'Mars', 'Apríl', 'Maí', 'Júní',
        'Júlí', 'Ágúst', 'September', 'Október', 'Nóvember', 'Desember'
    ];

    let runningBalance = 0;

    for (let i = 0; i < 12; i++) {
        let monthlyIncome = 0;
        let monthlyExpenses = 0;

        budgetItems.forEach(item => {
            let monthlyAmount = 0;

            if (item.frequency === 'monthly') {
                monthlyAmount = item.estimated_amount;
            } else if (item.frequency === 'yearly') {
                if (item.month) {
                    // Specific month for yearly expense
                    monthlyAmount = (i + 1) === item.month ? item.estimated_amount : 0;
                } else {
                    // Spread yearly costs across all months
                    monthlyAmount = item.estimated_amount / 12;
                }
            } else if (item.frequency === 'one-time') {
                if (item.month) {
                    // Specific month for one-time expense
                    monthlyAmount = (i + 1) === item.month ? item.estimated_amount : 0;
                } else {
                    // Default to January if no month specified
                    monthlyAmount = i === 0 ? item.estimated_amount : 0;
                }
            }

            if (item.type === 'income') {
                monthlyIncome += monthlyAmount;
            } else {
                // Default to expense if type is not set (backwards compatibility)
                monthlyExpenses += monthlyAmount;
            }
        });

        const net = monthlyIncome - monthlyExpenses;
        runningBalance += net;

        monthlyData.push({
            month: months[i],
            monthNumber: i + 1,
            income: monthlyIncome,
            expenses: monthlyExpenses,
            net,
            runningBalance
        });
    }

    // Summary for the year
    const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
    const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
    const yearEndBalance = monthlyData[11].runningBalance;

    return (
        <div className="card">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-controls={`${baseId}-panel`}
                className="w-full flex justify-between items-center"
            >
                <div>
                    <h3 className="font-serif text-xl text-charcoal">Mánaðarleg sundurliðun</h3>
                    <p className="text-sm text-grey-mid mt-1">
                        Sjá hvernig áætlun dreifist yfir árið
                    </p>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-grey-mid" aria-hidden="true" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-grey-mid" aria-hidden="true" />
                )}
            </button>

            {isExpanded && (
                <div id={`${baseId}-panel`} className="mt-6 space-y-4">
                    {/* Year Summary */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-bone/50 rounded-lg">
                        <div>
                            <div className="text-xs text-grey-mid mb-1">Tekjur alls</div>
                            <div className="font-bold text-green-700">
                                +{Math.round(totalIncome).toLocaleString()} kr.
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-grey-mid mb-1">Gjöld alls</div>
                            <div className="font-bold text-red-600">
                                -{Math.round(totalExpenses).toLocaleString()} kr.
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-grey-mid mb-1">Staða í lok árs</div>
                            <div className={`font-bold ${yearEndBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                {Math.round(yearEndBalance).toLocaleString()} kr.
                            </div>
                        </div>
                    </div>

                    {/* Monthly Grid */}
                    <div role="table" aria-label="Mánaðarleg sundurliðun áætlunar" className="space-y-4">
                    <div role="rowgroup" className="space-y-2">
                        {monthlyData.map((data) => (
                            <div
                                key={data.monthNumber}
                                role="row"
                                className="grid grid-cols-5 gap-3 p-3 bg-white rounded hover:bg-bone/30 transition-colors text-sm"
                            >
                                <div role="rowheader" className="font-medium text-charcoal">
                                    {data.month}
                                </div>
                                <div role="cell" className="text-right text-green-700">
                                    +{Math.round(data.income).toLocaleString()}
                                </div>
                                <div role="cell" className="text-right text-red-600">
                                    -{Math.round(data.expenses).toLocaleString()}
                                </div>
                                <div role="cell" className="text-right font-medium flex items-center justify-end gap-1">
                                    {data.net >= 0 ? (
                                        <>
                                            <TrendingUp className="w-3 h-3 text-green-700" aria-hidden="true" />
                                            <span className="text-green-700">+{Math.round(data.net).toLocaleString()}</span>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingDown className="w-3 h-3 text-red-600" aria-hidden="true" />
                                            <span className="text-red-600">{Math.round(data.net).toLocaleString()}</span>
                                        </>
                                    )}
                                </div>
                                <div role="cell" className="text-right font-bold text-charcoal">
                                    {Math.round(data.runningBalance).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Legend (column headers; sits below the rows visually, exposed as the header row) */}
                    <div role="rowgroup">
                    <div role="row" className="grid grid-cols-5 gap-3 px-3 text-xs text-grey-mid border-t border-grey-warm pt-3">
                        <div role="columnheader">Mánuður</div>
                        <div role="columnheader" className="text-right">Tekjur</div>
                        <div role="columnheader" className="text-right">Gjöld</div>
                        <div role="columnheader" className="text-right">Nettó</div>
                        <div role="columnheader" className="text-right">Staða</div>
                    </div>
                    </div>
                    </div>

                    <div className="text-xs text-grey-mid text-center pt-2 border-t border-grey-warm">
                        * Árleg gjöld dreifð jafnt yfir mánuði. Einskiptiskostnaður í janúar.
                    </div>
                </div>
            )}
        </div>
    );
}
