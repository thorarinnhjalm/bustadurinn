/**
 * Finance Page (Hússjóður)
 * Tabs: Rekstraráætlun (Budget) & Bókhald (Ledger)
 */

import { useState, useEffect, useId, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    PiggyBank,
    Receipt,
    Plus,
    Trash2,
    Calculator,
    ArrowLeft,
    Wallet,
    Shield,
    Eye,
    ClipboardList
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    arrayUnion,
    serverTimestamp,
    arrayRemove,
    deleteField,
    orderBy
} from 'firebase/firestore';
import type { BudgetPlan, BudgetItem, LedgerEntry, House, RecurringCost } from '@/types/models';
import BudgetForm from '@/components/finance/BudgetForm';
import LedgerForm from '@/components/finance/LedgerForm';
import TransactionList from '@/components/finance/TransactionList';
import VarianceWidget from '@/components/finance/VarianceWidget';
import MonthlyBreakdown from '@/components/finance/MonthlyBreakdown';
import OwnershipShares from '@/components/finance/OwnershipShares';
import RecurringCosts from '@/components/finance/RecurringCosts';
import RecurringCostReminders from '@/components/finance/RecurringCostReminders';
import YearEndSummary from '@/components/finance/YearEndSummary';
import { logger } from '@/utils/logger';
import { getHouseMembers } from '@/services/houseMembersService';
import type { HouseMember } from '@/services/houseMembersService';
import {
    filterEntriesByYear,
    getEntryYears,
    computeTotals,
    resolvePaidByName,
    validateAmount
} from '@/components/finance/ledgerUtils';
import PageTitle from '@/components/PageTitle';

type Tab = 'budget' | 'ledger' | 'summary';

interface EntriesState {
    houseId: string;
    entries: LedgerEntry[];
    error: boolean;
}

interface MembersState {
    houseId: string;
    members: HouseMember[] | null; // null = failed to load
}

export default function FinancePage() {
    const navigate = useNavigate();
    const { user: currentUser } = useEffectiveUser();
    const [activeTab, setActiveTab] = useState<Tab>('budget');
    const [house, setHouse] = useState<House | null>(null);
    const [houseError, setHouseError] = useState(false);
    const [entriesState, setEntriesState] = useState<EntriesState | null>(null);
    const [membersState, setMembersState] = useState<MembersState | null>(null);
    const [prefillEntry, setPrefillEntry] = useState<Partial<LedgerEntry> | null>(null);
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const currentHouse = useAppStore((state) => state.currentHouse);
    const primaryHouseId = currentHouse?.id;

    useEffect(() => {
        if (!primaryHouseId) return;
        let cancelled = false;

        const fetchHouse = async () => {
            try {
                const houseDoc = await getDoc(doc(db, 'houses', primaryHouseId));
                if (cancelled) return;
                if (houseDoc.exists()) {
                    setHouse({ id: houseDoc.id, ...houseDoc.data() } as House);
                }
                setHouseError(false);
            } catch (err) {
                logger.error('Error fetching house:', err);
                if (!cancelled) setHouseError(true);
            }
        };
        fetchHouse();
        return () => { cancelled = true; };
    }, [primaryHouseId]);

    // Members — fetched once per house through the members service (other
    // users' docs are not readable from the client). Shared by ownership
    // shares, the year-end summary, and the ledger's split-payer picker.
    useEffect(() => {
        if (!primaryHouseId) return;
        let cancelled = false;

        getHouseMembers(primaryHouseId)
            .then((list) => {
                if (!cancelled) setMembersState({ houseId: primaryHouseId, members: list });
            })
            .catch((err) => {
                logger.error('Error fetching members:', err);
                if (!cancelled) setMembersState({ houseId: primaryHouseId, members: null });
            });

        return () => { cancelled = true; };
    }, [primaryHouseId]);

    const membersFailed = !!primaryHouseId && membersState?.houseId === primaryHouseId && membersState.members === null;
    const currentUid = currentUser?.uid;
    const currentName = currentUser?.name;
    const members = useMemo<{ uid: string; name: string }[]>(() => {
        if (membersState && membersState.houseId === primaryHouseId && membersState.members) {
            return membersState.members.map((m) => ({ uid: m.uid, name: m.name }));
        }
        // Fallback (loading or failed): the current user only
        return currentUid ? [{ uid: currentUid, name: currentName || 'Notandi' }] : [];
    }, [membersState, primaryHouseId, currentUid, currentName]);

    // Applies a partial update to the locally-held house doc after a
    // finance_settings/recurring_costs write (avoids a second getDoc round-trip).
    const handleHouseChange = (updates: Partial<House>) => {
        setHouse((prev) => (prev ? { ...prev, ...updates } : prev));
    };

    // Opens the ledger tab with a new entry pre-filled from a recurring cost
    // reminder — the user just needs to confirm/adjust the actual amount.
    const handleFillReminder = (cost: RecurringCost) => {
        setActiveTab('ledger');
        setPrefillEntry({
            type: 'expense',
            category: cost.category,
            amount: cost.estimated_amount,
            description: cost.name,
            date: new Date()
        });
    };

    // One real-time listener over ALL entries of the house (these collections
    // are small). Per-year views and the fund balance are derived below.
    useEffect(() => {
        if (!primaryHouseId) return;

        const q = query(
            collection(db, 'houses', primaryHouseId, 'finance_entries'),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                date: d.data().date?.toDate() || new Date()
            })) as LedgerEntry[];

            setEntriesState({ houseId: primaryHouseId, entries: data, error: false });
        }, (error) => {
            logger.error('Finance entries listener error:', error);
            setEntriesState({ houseId: primaryHouseId, entries: [], error: true });
        });

        return () => unsubscribe();
    }, [primaryHouseId]);

    const currentEntriesState = entriesState && entriesState.houseId === primaryHouseId ? entriesState : null;
    const loading = !!primaryHouseId && !currentEntriesState;
    const entriesError = currentEntriesState?.error ?? false;
    const allEntries = useMemo(() => currentEntriesState?.entries ?? [], [currentEntriesState]);
    const years = useMemo(() => getEntryYears(allEntries, currentYear), [allEntries, currentYear]);
    const yearEntries = useMemo(() => filterEntriesByYear(allEntries, selectedYear), [allEntries, selectedYear]);
    const currentYearEntries = useMemo(() => filterEntriesByYear(allEntries, currentYear), [allEntries, currentYear]);

    const isManager = house?.manager_id === currentUser?.uid;
    const canViewFinances = isManager || (house?.finance_viewer_ids?.includes(currentUser?.uid || '') || false);

    // Arrow keys / Home / End move between the tabs (roving tabindex)
    const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const order: Tab[] = ['budget', 'ledger', 'summary'];
        const idx = order.indexOf(activeTab);
        let next = -1;
        if (e.key === 'ArrowRight') next = (idx + 1) % order.length;
        else if (e.key === 'ArrowLeft') next = (idx - 1 + order.length) % order.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = order.length - 1;
        if (next < 0) return;
        e.preventDefault();
        setActiveTab(order[next]);
        document.getElementById(`finance-tab-${order[next]}`)?.focus();
    };

    if (!primaryHouseId) {
        return (
            <div className="min-h-screen bg-bone p-6 pb-24">
                <div className="max-w-5xl mx-auto">
                    <EmptyState
                        icon={PiggyBank}
                        title="Ekkert hús valið"
                        description="Veldu eða stofnaðu hús til að sjá hússjóðinn og bókhaldið."
                        actionLabel="Til baka á stjórnborð"
                        onAction={() => navigate('/dashboard')}
                    />
                </div>
            </div>
        );
    }

    if (house?.privacy_hide_finances && !canViewFinances) {
        return (
            <div className="min-h-screen bg-bone p-6 flex flex-col items-center justify-center text-center">
                <Shield className="w-16 h-16 text-stone-300 mb-4" aria-hidden="true" />
                <h2 className="text-xl font-serif font-bold text-charcoal mb-2">Enginn aðgangur</h2>
                <p className="text-stone-500 mb-6 max-w-sm">Hússtjórn hefur lokað fyrir aðgang að fjármálaupplýsingum fyrir almenna meðeigendur.</p>
                <Link to="/dashboard" className="btn btn-primary">Til baka á stjórnborð</Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-bone p-6 pb-24">
            <PageTitle title="Hússjóður" />
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center text-grey-mid hover:text-charcoal mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                    Til baka
                </Link>

                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-serif text-charcoal mb-2">Hússjóður</h1>
                        <p className="text-grey-mid">Umsjón með rekstri og bókhaldi</p>
                    </div>
                    {isManager && (
                        <Link
                            to="/settings?tab=house"
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${house?.privacy_hide_finances
                                ? 'bg-amber/10 text-amber-700 border-amber/20 hover:bg-amber/20'
                                : 'bg-stone-100 text-grey-mid border-stone-200 hover:bg-stone-200'
                                }`}
                        >
                            {house?.privacy_hide_finances ? (
                                <>
                                    <Shield size={14} aria-hidden="true" />
                                    <span>Aðeins stjórnendur</span>
                                </>
                            ) : (
                                <>
                                    <Eye size={14} aria-hidden="true" />
                                    <span>Sýnilegt öllum</span>
                                </>
                            )}
                        </Link>
                    )}
                </div>
            </div>


            {/* Tabs */}
            <div className="max-w-5xl mx-auto mb-8 border-b border-grey-warm">
                <div role="tablist" aria-label="Hússjóður" className="flex gap-8" onKeyDown={handleTabKeyDown}>
                    <button
                        type="button"
                        role="tab"
                        id="finance-tab-budget"
                        aria-selected={activeTab === 'budget'}
                        aria-controls="finance-tabpanel"
                        tabIndex={activeTab === 'budget' ? 0 : -1}
                        onClick={() => setActiveTab('budget')}
                        className={`pb-4 px-2 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'budget'
                            ? 'text-charcoal'
                            : 'text-grey-mid hover:text-charcoal'
                            }`}
                    >
                        <Calculator className="w-5 h-5" aria-hidden="true" />
                        Rekstraráætlun
                        {activeTab === 'budget' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber" />
                        )}
                    </button>

                    <button
                        type="button"
                        role="tab"
                        id="finance-tab-ledger"
                        aria-selected={activeTab === 'ledger'}
                        aria-controls="finance-tabpanel"
                        tabIndex={activeTab === 'ledger' ? 0 : -1}
                        onClick={() => setActiveTab('ledger')}
                        className={`pb-4 px-2 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'ledger'
                            ? 'text-charcoal'
                            : 'text-grey-mid hover:text-charcoal'
                            }`}
                    >
                        <Receipt className="w-5 h-5" aria-hidden="true" />
                        Bókhald
                        {activeTab === 'ledger' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber" />
                        )}
                    </button>

                    <button
                        type="button"
                        role="tab"
                        id="finance-tab-summary"
                        aria-selected={activeTab === 'summary'}
                        aria-controls="finance-tabpanel"
                        tabIndex={activeTab === 'summary' ? 0 : -1}
                        onClick={() => setActiveTab('summary')}
                        className={`pb-4 px-2 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'summary'
                            ? 'text-charcoal'
                            : 'text-grey-mid hover:text-charcoal'
                            }`}
                    >
                        <ClipboardList className="w-5 h-5" aria-hidden="true" />
                        Ársyfirlit
                        {activeTab === 'summary' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto" role="tabpanel" id="finance-tabpanel" aria-labelledby={`finance-tab-${activeTab}`}>
                {(houseError || entriesError) && (
                    <div role="alert" className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">
                        {entriesError
                            ? 'Ekki tókst að sækja færslur. Reyndu að endurhlaða síðuna.'
                            : 'Ekki tókst að sækja upplýsingar um húsið. Reyndu að endurhlaða síðuna.'}
                    </div>
                )}
                {membersFailed && (
                    <div role="status" className="mb-4 p-3 rounded border border-amber/30 bg-amber/10 text-sm text-charcoal">
                        Ekki tókst að sækja nöfn meðeigenda. Aðeins þú birtist í listanum að svo stöddu.
                    </div>
                )}
                {house && (
                    <RecurringCostReminders
                        recurringCosts={house.recurring_costs || []}
                        entries={currentYearEntries}
                        onFill={handleFillReminder}
                    />
                )}

                {activeTab === 'budget' ? (
                    <BudgetView
                        houseId={house?.id}
                        currentUserId={currentUser?.uid}
                        house={house}
                        entries={currentYearEntries}
                        loading={loading}
                        isManager={isManager}
                        members={members}
                        onHouseChange={handleHouseChange}
                    />
                ) : activeTab === 'ledger' ? (
                    <LedgerView
                        houseId={house?.id}
                        currentUserId={currentUser?.uid}
                        isManager={isManager}
                        currentUserName={currentUser?.name}
                        allEntries={allEntries}
                        yearEntries={yearEntries}
                        years={years}
                        selectedYear={selectedYear}
                        onYearChange={setSelectedYear}
                        loading={loading}
                        members={members}
                        prefillEntry={prefillEntry}
                        onPrefillConsumed={() => setPrefillEntry(null)}
                    />
                ) : (
                    <div className="space-y-4">
                        <YearSelect years={years} value={selectedYear} onChange={setSelectedYear} />
                        <YearEndSummary
                        year={selectedYear}
                        entries={yearEntries}
                        ownerIds={house?.owner_ids || []}
                        members={members}
                        memberShares={house?.finance_settings?.member_shares}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}

function YearSelect({ years, value, onChange }: { years: number[]; value: number; onChange: (year: number) => void }) {
    const selectId = useId();
    return (
        <label htmlFor={selectId} className="inline-flex items-center gap-2 text-sm text-grey-mid">
            <span>Ár:</span>
            <select
                id={selectId}
                className="input w-auto py-1"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            >
                {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </label>
    );
}

// ------------------------------------------------------------------
// Budget View
// ------------------------------------------------------------------

interface BudgetViewProps {
    houseId?: string;
    currentUserId?: string;
    house?: House | null;
    entries: LedgerEntry[];
    loading: boolean;
    isManager: boolean;
    members: { uid: string, name: string }[];
    onHouseChange: (updates: Partial<House>) => void;
}

function BudgetView({ houseId, currentUserId, house, entries, loading, isManager, members, onHouseChange }: BudgetViewProps) {
    const [plan, setPlan] = useState<BudgetPlan | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState(true);
    const [actionError, setActionError] = useState<string | null>(null);

    const currentYear = new Date().getFullYear();

    // Fetch Budget Plan
    useEffect(() => {
        if (!houseId) return;

        const q = query(
            collection(db, 'houses', houseId, 'budget_plans'),
            where('year', '==', currentYear)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const docData = snapshot.docs[0].data();
                setPlan({ id: snapshot.docs[0].id, ...docData } as BudgetPlan);
            } else {
                setPlan(null);
            }
            setLoadingPlan(false);
            setActionError(null);
        }, (error) => {
            logger.error('Budget plan listener error:', error);
            setActionError('Ekki tókst að sækja rekstraráætlun. Reyndu að endurhlaða síðuna.');
            setLoadingPlan(false);
        });

        return () => unsubscribe();
    }, [houseId, currentYear]);

    const handleSaveItem = async (item: BudgetItem) => {
        if (!houseId || !currentUserId) return;

        try {
            if (plan) {
                await updateDoc(doc(db, 'houses', houseId, 'budget_plans', plan.id), {
                    items: arrayUnion(item),
                    updated_at: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, 'houses', houseId, 'budget_plans'), {
                    house_id: houseId,
                    year: currentYear,
                    items: [item],
                    created_by: currentUserId,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
            }
            setShowForm(false);
            setActionError(null);
        } catch (error) {
            logger.error('Error saving budget item:', error);
            setActionError('Ekki tókst að vista kostnaðarliðinn. Reyndu aftur.');
        }
    };

    const handleDeleteItem = async (item: BudgetItem) => {
        if (!plan || !houseId) return;
        try {
            await updateDoc(doc(db, 'houses', houseId, 'budget_plans', plan.id), {
                items: arrayRemove(item)
            });
            setActionError(null);
        } catch (error) {
            logger.error('Error deleting item:', error);
            setActionError('Ekki tókst að eyða kostnaðarliðnum. Reyndu aftur.');
        }
    };

    // Separate income and expenses (backwards compatible: items without type default to expense)
    const { totalExpenses, totalIncome, netPosition, monthlyContribution } = useMemo(() => {
        const expenses = plan?.items
            .filter(item => (item.type || 'expense') === 'expense')
            .reduce((sum, item) => {
                let annualAmount = item.estimated_amount;
                if (item.frequency === 'monthly') annualAmount *= 12;
                return sum + annualAmount;
            }, 0) || 0;

        const income = plan?.items
            .filter(item => item.type === 'income')
            .reduce((sum, item) => {
                let annualAmount = item.estimated_amount;
                if (item.frequency === 'monthly') annualAmount *= 12;
                return sum + annualAmount;
            }, 0) || 0;

        const pos = income - expenses;
        const contribution = Math.ceil(Math.max(0, expenses - income) / 12);

        return { totalExpenses: expenses, totalIncome: income, netPosition: pos, monthlyContribution: contribution };
    }, [plan]);

    // Shared category taxonomy (also used by the ledger's category datalist)
    // for the recurring-cost form's own datalist.
    const budgetCategories = useMemo(() => {
        const cats = plan?.items?.map(i => i.category).filter(Boolean) || [];
        return Array.from(new Set(cats)).sort();
    }, [plan]);

    if (loading || loadingPlan) return <div role="status" className="p-8 text-center text-grey-mid">Hleð gögnum...</div>;

    return (
        <div className="space-y-6">
            {/* Summary Card - Improved Mobile Layout */}
            <div className={`card text-white p-4 sm:p-6 ${netPosition >= 0 ? 'bg-charcoal' : 'bg-red-800'}`}>
                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    <div className="p-2.5 sm:p-3 bg-white/10 rounded-full flex-shrink-0">
                        <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-amber" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base sm:text-lg font-medium text-white opacity-90 mb-1">Rekstraráætlun {currentYear}</h2>
                        <div className="text-2xl sm:text-3xl font-serif font-bold">
                            {netPosition >= 0 ? '+' : ''}{netPosition.toLocaleString()} kr.
                        </div>
                        <div className="text-xs sm:text-sm opacity-60 mt-1">Áætluð nettóstaða í lok árs</div>
                    </div>
                </div>

                {/* Mobile: Stack vertically, Desktop: 3 columns */}
                <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4 mt-4 border-t border-white/10 pt-4">
                    <div className="flex justify-between sm:block">
                        <div className="text-xs sm:text-sm opacity-60">Tekjur áætlaðar</div>
                        <div className="text-lg sm:text-xl font-medium text-green-400">+{totalIncome.toLocaleString()} kr.</div>
                    </div>
                    <div className="flex justify-between sm:block">
                        <div className="text-xs sm:text-sm opacity-60">Gjöld áætluð</div>
                        <div className="text-lg sm:text-xl font-medium text-red-300">-{totalExpenses.toLocaleString()} kr.</div>
                    </div>
                    <div className="flex justify-between sm:block">
                        <div className="text-xs sm:text-sm opacity-60">Þörf fyrir framlag</div>
                        <div className="text-lg sm:text-xl font-medium text-amber">{monthlyContribution.toLocaleString()} kr./mán</div>
                    </div>
                </div>
            </div>

            {actionError && (
                <div role="alert" className="p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">
                    {actionError}
                </div>
            )}

            {/* Budget Items List - Improved Mobile Layout */}
            <div className="card">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                    <h3 className="text-lg sm:text-xl font-serif">Kostnaðarliðir</h3>
                    {!showForm && (
                        <button type="button" onClick={() => setShowForm(true)} className="btn btn-primary btn-sm w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                            Bæta við lið
                        </button>
                    )}
                </div>

                {showForm && (
                    <BudgetForm
                        onSave={handleSaveItem}
                        onCancel={() => setShowForm(false)}
                        members={members}
                    />
                )}

                {!plan || !plan.items || plan.items.length === 0 ? (
                    !showForm && (
                        <EmptyState
                            icon={Calculator}
                            title="Hússjóðurinn er tómur"
                            description="Skráðu sameiginlegan kostnað hér: rafmagn, tryggingar, viðhald og fleira. Svo vitið þið alltaf hver á inni."
                            actionLabel="Bæta við lið"
                            onAction={() => setShowForm(true)}
                        />
                    )
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {plan.items.map((item, index) => {
                            const itemType = item.type || 'expense';
                            return (
                                <div
                                    key={index}
                                    className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded hover:bg-bone transition-colors group ${itemType === 'income' ? 'bg-green-50 border border-green-200' : 'bg-bone/50'
                                        }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className={`font-medium text-sm sm:text-base ${itemType === 'income' ? 'text-green-700' : 'text-charcoal'
                                                }`}>
                                                {item.category}
                                            </div>
                                            {itemType === 'income' && (
                                                <span className="text-xs bg-green-700 text-white px-2 py-0.5 rounded">
                                                    Tekjur
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-grey-mid capitalize mt-1">
                                            {item.frequency === 'monthly' ? 'Mánaðarlega' :
                                                item.frequency === 'yearly' ? `Árlega${item.month ? ` (${new Date(2000, item.month - 1).toLocaleString('is', { month: 'long' })})` : ''}` :
                                                    `Einskiptis${item.month ? ` (${new Date(2000, item.month - 1).toLocaleString('is', { month: 'long' })})` : ''}`}
                                            {item.assigned_owner_name && ` • ${item.assigned_owner_name}`}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                                        <div className="text-left sm:text-right">
                                            <div className={`font-bold text-sm sm:text-base ${itemType === 'income' ? 'text-green-700' : 'text-charcoal'
                                                }`}>
                                                {itemType === 'income' ? '+' : ''}{item.estimated_amount.toLocaleString()} kr.
                                            </div>
                                            {item.frequency === 'monthly' && (
                                                <div className="text-xs text-grey-mid">
                                                    x 12 = {itemType === 'income' ? '+' : ''}{(item.estimated_amount * 12).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteItem(item)}
                                            className="sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 p-2 text-red-600 hover:text-red-700 transition-opacity touch-manipulation"
                                            aria-label={`Eyða lið: ${item.category}`}
                                        >
                                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sidebar Widgets - Stack on Mobile */}
            <div className="space-y-6">
                <VarianceWidget budgetItems={plan?.items?.filter(i => (i.type || 'expense') === 'expense') || []} entries={entries} />

                <div className="card">
                    <h3 className="font-medium mb-4 text-sm sm:text-base">Um Rekstraráætlun</h3>
                    <p className="text-sm text-grey-mid mb-4">
                        Hér setur þú upp áætlun fyrir fastan kostnað og tekjur búsins.
                        Stöðukortið hér að ofan sýnir samanburð við raunverulegan kostnað.
                    </p>
                </div>
            </div>

            {/* Manager-only: ownership shares + recurring cost reminders */}
            {isManager && houseId && currentUserId && (
                <div className="space-y-6">
                    <OwnershipShares
                        houseId={houseId}
                        ownerIds={house?.owner_ids || []}
                        members={members}
                        memberShares={house?.finance_settings?.member_shares}
                        onSaved={(memberShares) => onHouseChange({ finance_settings: { ...house?.finance_settings, member_shares: memberShares } })}
                    />

                    <RecurringCosts
                        houseId={houseId}
                        currentUserId={currentUserId}
                        recurringCosts={house?.recurring_costs || []}
                        budgetCategories={budgetCategories}
                        onChanged={(recurringCosts) => onHouseChange({ recurring_costs: recurringCosts })}
                    />
                </div>
            )}

            {/* Monthly Breakdown - Full Width */}
            <div className="w-full">
                <MonthlyBreakdown budgetItems={plan?.items || []} />
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// Ledger View
// ------------------------------------------------------------------

interface LedgerViewProps {
    houseId?: string;
    currentUserId?: string;
    isManager: boolean;
    currentUserName?: string;
    // Fund balance is computed over ALL entries; the list and the
    // income/expense breakdown are for the selected year only.
    allEntries: LedgerEntry[];
    yearEntries: LedgerEntry[];
    years: number[];
    selectedYear: number;
    onYearChange: (year: number) => void;
    loading: boolean;
    members: { uid: string, name: string }[];
    // A pending prefill (e.g. from a recurring cost reminder) opens the form
    // pre-populated with these values for a NEW entry; consumed once applied.
    prefillEntry?: Partial<LedgerEntry> | null;
    onPrefillConsumed?: () => void;
}

function LedgerView({ houseId, currentUserId, isManager, currentUserName, allEntries, yearEntries, years, selectedYear, onYearChange, loading, members, prefillEntry, onPrefillConsumed }: LedgerViewProps) {
    const [showForm, setShowForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Partial<LedgerEntry> | null>(null);
    const [budgetCategories, setBudgetCategories] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const currentYear = new Date().getFullYear();

    // Fetch Budget Categories for dropdown
    useEffect(() => {
        if (!houseId) return;
        const q = query(
            collection(db, 'houses', houseId, 'budget_plans'),
            where('year', '==', currentYear)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const plan = snapshot.docs[0].data() as BudgetPlan;
                const cats = plan.items?.map(i => i.category).filter(Boolean) || [];
                // Unique categories
                setBudgetCategories(Array.from(new Set(cats)).sort());
            }
        }, (err) => {
            logger.error('Budget categories listener error:', err);
            setError('Ekki tókst að sækja flokka úr rekstraráætlun. Þú getur samt skráð færslu.');
        });
        return () => unsubscribe();
    }, [houseId, currentYear]);

    // Open the form pre-filled when a recurring cost reminder is clicked.
    useEffect(() => {
        if (!prefillEntry) return;
        setEditingEntry(prefillEntry);
        setShowForm(true);
        onPrefillConsumed?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefillEntry]);

    const handleSaveEntry = async (entryData: Partial<LedgerEntry>) => {
        if (!houseId || !currentUserId) return;

        const amountError = validateAmount(entryData.amount as number);
        if (amountError) {
            setError(amountError);
            return;
        }

        try {
            const isEdit = !!entryData.id;
            const original = isEdit ? editingEntry : null;
            const paidByName = resolvePaidByName({
                isEdit,
                split: entryData.split_between,
                creatorName: isEdit
                    ? (original?.user_uid === currentUserId || original?.paid_by_user_id === currentUserId
                        ? currentUserName
                        : members.find(m => m.uid === original?.paid_by_user_id)?.name)
                    : currentUserName,
                original
            });

            if (isEdit) {
                const { id, ...rest } = entryData;
                const data: Record<string, unknown> = {
                    ...rest,
                    house_id: houseId,
                    updated_at: serverTimestamp()
                };
                // `undefined` would be silently dropped: explicitly clear the split.
                if (!entryData.split_between || entryData.split_between.length === 0) {
                    data.split_between = deleteField();
                }
                if (paidByName !== undefined) data.paid_by_name = paidByName;
                await updateDoc(doc(db, 'houses', houseId, 'finance_entries', id!), data);
            } else {
                await addDoc(collection(db, 'houses', houseId, 'finance_entries'), {
                    ...entryData,
                    house_id: houseId,
                    paid_by_name: paidByName,
                    user_uid: currentUserId,
                    paid_by_user_id: currentUserId // Primary creator/payer
                });
            }
            setError(null);
            setShowForm(false);
            setEditingEntry(null);
        } catch (err) {
            logger.error('Error saving entry:', err);
            setError('Ekki tókst að vista færsluna. Reyndu aftur.');
        }
    };

    const handleDeleteEntry = async (entry: LedgerEntry) => {
        if (!houseId) return;
        if (!confirm('Ertu viss um að þú viljir eyða þessari færslu?')) return;
        try {
            await deleteDoc(doc(db, 'houses', houseId, 'finance_entries', entry.id));
            setError(null);
        } catch (err) {
            logger.error('Error deleting entry:', err);
            setError('Ekki tókst að eyða færslunni. Reyndu aftur.');
        }
    };

    const handleEditEntry = (entry: LedgerEntry) => {
        setEditingEntry(entry);
        setShowForm(true);
    };

    // Fund standing: all entries, all years.
    const fund = useMemo(() => computeTotals(allEntries), [allEntries]);
    // Selected year only.
    const yearTotals = useMemo(() => computeTotals(yearEntries), [yearEntries]);

    if (loading) return <div role="status" className="p-8 text-center text-grey-mid">Hleð gögnum...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Balance Card (whole history) */}
            <div className={`col-span-1 md:col-span-3 card text-white p-6 mb-6 ${fund.balance >= 0 ? 'bg-charcoal' : 'bg-red-800'}`}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/10 rounded-full">
                        <Wallet className="w-6 h-6 text-amber" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-white opacity-90">Staða sjóðsins</h2>
                        <div className="text-3xl font-serif font-bold mt-1">
                            {fund.balance.toLocaleString()} kr.
                        </div>
                        <div className="text-xs opacity-60 mt-1">Samtals frá upphafi, óháð ári</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 border-t border-white/10 pt-4">
                    <div>
                        <div className="text-sm opacity-60">Tekjur {selectedYear}</div>
                        <div className="text-xl font-medium text-green-400">+{yearTotals.income.toLocaleString()} kr.</div>
                    </div>
                    <div>
                        <div className="text-sm opacity-60">Útgjöld {selectedYear}</div>
                        <div className="text-xl font-medium text-red-300">-{yearTotals.expense.toLocaleString()} kr.</div>
                    </div>
                </div>
            </div>

            <div className="col-span-1 md:col-span-2 card p-4 md:p-8">
                <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
                    <div className="flex items-center gap-4 flex-wrap">
                        <h3 className="text-xl font-serif">Bókhald {selectedYear}</h3>
                        <YearSelect years={years} value={selectedYear} onChange={onYearChange} />
                    </div>
                    {!showForm && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingEntry(null);
                                setShowForm(true);
                            }}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                            Skrá færslu
                        </button>
                    )}
                </div>

                {error && (
                    <div role="alert" className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {showForm && (
                    <LedgerForm
                        key={editingEntry?.id ?? 'new'}
                        onSave={handleSaveEntry}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingEntry(null);
                        }}
                        budgetCategories={budgetCategories}
                        initialValues={editingEntry}
                        houseMembers={members}
                    />
                )}

                <TransactionList
                    entries={yearEntries}
                    onDelete={handleDeleteEntry}
                    onEdit={handleEditEntry}
                    currentUserId={currentUserId || ''}
                    isManager={isManager}
                />
            </div>

            <div className="col-span-1 card">
                <h3 className="font-medium mb-4">Um Bókhald</h3>
                <p className="text-sm text-grey-mid">
                    Hér heldur þú utan um raunverulegar tekjur (innborganir) og útgjöld.
                    Staða sjóðsins nær yfir allar færslur frá upphafi; listinn og tekjur/útgjöld sýna valið ár.
                </p>
            </div>
        </div>
    );
}
