import { Link } from 'react-router-dom';
import { Wallet, ChevronRight, Shield } from 'lucide-react';
import type { House, User, BudgetPlan } from '@/types/models';
import type { FinanceSummary } from './useFinanceSummary';

interface FinanceCardProps {
    currentHouse: House;
    currentUser: User | null;
    finances: FinanceSummary;
    budgetPlan: BudgetPlan | null;
}

/** FINANCE SNAPSHOT: all-time fund balance + this year's spend against the budget plan. */
export default function FinanceCard({ currentHouse, currentUser, finances, budgetPlan }: FinanceCardProps) {
    if (!(!currentHouse?.privacy_hide_finances ||
        currentHouse?.manager_id === currentUser?.uid ||
        currentHouse?.finance_viewer_ids?.includes(currentUser?.uid || ''))) {
        return null;
    }

    return (
        <section className="group relative cursor-pointer">
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Hússjóður</h3>
                    {currentHouse?.privacy_hide_finances && (
                        <div role="img" aria-label="Aðeins sýnilegt stjórnendum" title="Aðeins sýnilegt stjórnendum">
                            <Shield size={16} className="text-amber-ink" aria-hidden="true" />
                        </div>
                    )}
                </div>
                <Link
                    to="/finance"
                    aria-label="Opna hússjóð"
                    className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-[#1a1a1a] group-hover:text-white transition-colors after:absolute after:inset-0 after:z-[15]"
                >
                    <ChevronRight size={18} aria-hidden="true" />
                </Link>
            </div>
            <div className="bg-[#1a1a1a] p-6 rounded-2xl text-white shadow-xl shadow-stone-200 relative overflow-hidden group hover:shadow-2xl motion-safe:hover:scale-[1.01] transition-all duration-300">
                {/* Decorative Gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber/20 to-transparent opacity-50 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/10 rounded-md">
                            <Wallet size={16} className="text-amber" aria-hidden="true" />
                        </div>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Staða sjóðs</p>
                    </div>

                    <h4 className="text-4xl font-serif text-white mb-6 tracking-tight">
                        {finances.balance.toLocaleString('is-IS')} <span className="text-xl text-stone-300 font-sans font-normal">kr.</span>
                    </h4>

                    {budgetPlan ? (
                        <div className="space-y-3">
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Nýting áætlunar ({budgetPlan.year})</p>
                                    <p className="text-white text-xs font-bold">{Math.round((finances.actualYTD / (budgetPlan.items.filter(i => i.type !== 'income').reduce((sum, i) => sum + (i.frequency === 'monthly' ? i.estimated_amount * 12 : i.estimated_amount), 0) || 1)) * 100)}%</p>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-label="Nýting áætlunar"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round(Math.min((finances.actualYTD / (budgetPlan.items.filter(i => i.type !== 'income').reduce((sum, i) => sum + (i.frequency === 'monthly' ? i.estimated_amount * 12 : i.estimated_amount), 0) || 1)) * 100, 100))}
                                    className="h-1.5 bg-white/10 rounded-full overflow-hidden"
                                >
                                    <div
                                        className={`h-full transition-all duration-1000 ${finances.actualYTD > budgetPlan.items.filter(i => i.type !== 'income').reduce((sum, i) => sum + (i.frequency === 'monthly' ? i.estimated_amount * 12 : i.estimated_amount), 0) ? 'bg-red-400' : 'bg-amber'}`}
                                        style={{ width: `${Math.min((finances.actualYTD / (budgetPlan.items.filter(i => i.type !== 'income').reduce((sum, i) => sum + (i.frequency === 'monthly' ? i.estimated_amount * 12 : i.estimated_amount), 0) || 1)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                                    <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Áætlun ársins</p>
                                    <p className="text-white font-serif text-lg leading-none">
                                        {budgetPlan.items.filter(i => i.type !== 'income').reduce((sum, i) => sum + (i.frequency === 'monthly' ? i.estimated_amount * 12 : i.estimated_amount), 0).toLocaleString('is-IS')} <span className="text-[10px] font-sans font-normal text-stone-500">kr.</span>
                                    </p>
                                </div>
                                <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                                    <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Raun eyðsla í ár</p>
                                    <p className="text-white font-serif text-lg leading-none">
                                        {finances.actualYTD.toLocaleString('is-IS')} <span className="text-[10px] font-sans font-normal text-stone-500">kr.</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                            <div className="flex items-center gap-3 text-sm">
                                <div aria-hidden="true" className={`w-2 h-2 rounded-full ${finances.lastAction.toLowerCase().includes('greiddi') ? 'bg-red-500' : 'bg-green-500'} shadow-[0_0_8px_rgba(239,68,68,0.6)]`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-stone-300 text-xs uppercase tracking-wide font-bold mb-0.5">Síðasta færsla</p>
                                    <p className="text-white font-medium truncate">{finances.lastAction}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Empty State Overlay - Only if both balance and budget are zero/missing */}
                {finances.balance === 0 && finances.lastAction === "Ekkert að frétta" && !budgetPlan && (
                    <div className="absolute inset-0 bg-charcoal/95 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
                        <div className="text-center p-6">
                            <Wallet size={32} className="mx-auto mb-3 text-amber" aria-hidden="true" />
                            <p className="text-white font-bold mb-2">Engin gögn fundust</p>
                            <p className="text-stone-400 text-sm mb-4">Byrjaðu á að bæta við færslu eða gera áætlun</p>
                            <Link
                                to="/finance"
                                className="inline-block px-4 py-2 bg-amber text-charcoal rounded-lg font-bold text-sm hover:bg-amber/90 transition-colors"
                            >
                                Opna Hússjóð
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
