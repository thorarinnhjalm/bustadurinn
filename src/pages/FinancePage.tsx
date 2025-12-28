/**
 * Finance Page (Hússjóður)
 * Tabs: Rekstraráætlun (Budget) & Bókhald (Ledger)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PiggyBank,
    Receipt,
    Plus,
    Trash2,
    Calculator,
    ArrowLeft,
    Wallet
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
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
    arrayRemove
} from 'firebase/firestore';
import type { BudgetPlan, BudgetItem, FinanceEntry, House } from '@/types/models';
import BudgetForm from '@/components/finance/BudgetForm';
import LedgerForm from '@/components/finance/LedgerForm';
import TransactionList from '@/components/finance/TransactionList';
import VarianceWidget from '@/components/finance/VarianceWidget';

type Tab = 'budget' | 'ledger';

export default function FinancePage() {
    const navigate = useNavigate();
    const { currentUser } = useAppStore();
    const [activeTab, setActiveTab] = useState<Tab>('budget');
    const [house, setHouse] = useState<House | null>(null);

    useEffect(() => {
        if (!currentUser?.house_ids?.[0]) return;

        const fetchHouse = async () => {
            const houseDoc = await getDoc(doc(db, 'houses', currentUser.house_ids[0]));
            if (houseDoc.exists()) {
                setHouse({ id: houseDoc.id, ...houseDoc.data() } as House);
            }
        };
        fetchHouse();
    }, [currentUser]);

    const isManager = house?.manager_uid === currentUser?.uid;

    return (
        <div className="min-h-screen bg-bone p-6 pb-24">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-grey-mid hover:text-charcoal mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Til baka
                </button>

                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-serif text-charcoal mb-2">Hússjóður</h1>
                        <p className="text-grey-mid">Umsjón með rekstri og bókhaldi</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-5xl mx-auto mb-8 border-b border-grey-warm">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('budget')}
                        className={`pb-4 px-2 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'budget'
                            ? 'text-charcoal'
                            : 'text-grey-mid hover:text-charcoal'
                            }`}
                    >
                        <Calculator className="w-5 h-5" />
                        Rekstraráætlun
                        {activeTab === 'budget' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`pb-4 px-2 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'ledger'
                            ? 'text-charcoal'
                            : 'text-grey-mid hover:text-charcoal'
                            }`}
                    >
                        <Receipt className="w-5 h-5" />
                        Bókhald
                        {activeTab === 'ledger' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto">
                {activeTab === 'budget' ? (
                    <BudgetView houseId={house?.id} currentUserId={currentUser?.uid} />
                ) : (
                    <LedgerView
                        houseId={house?.id}
                        currentUserId={currentUser?.uid}
                        isManager={isManager}
                        currentUserName={currentUser?.name}
                    />
                )}
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// Budget View
// ------------------------------------------------------------------

function BudgetView({ houseId, currentUserId }: { houseId?: string, currentUserId?: string }) {
    const [plan, setPlan] = useState<BudgetPlan | null>(null);
    const [entries, setEntries] = useState<FinanceEntry[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const currentYear = new Date().getFullYear();

    // Fetch Budget Plan
    useEffect(() => {
        if (!houseId) return;

        const q = query(
            collection(db, 'budget_plans'),
            where('house_id', '==', houseId),
            where('year', '==', currentYear)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const docData = snapshot.docs[0].data();
                setPlan({ id: snapshot.docs[0].id, ...docData } as BudgetPlan);
            } else {
                setPlan(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [houseId, currentYear]);

    // Fetch Actual Expenses (for Variance)
    useEffect(() => {
        if (!houseId) return;

        const q = query(
            collection(db, 'finance_entries'),
            where('house_id', '==', houseId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate() || new Date()
            })) as FinanceEntry[];

            // Filter entries for current year (or filter within widget)
            // Filtering here is better for clean props
            const thisYear = data.filter(e => e.date.getFullYear() === currentYear);
            setEntries(thisYear);
        });

        return () => unsubscribe();
    }, [houseId, currentYear]);

    const handleSaveItem = async (item: BudgetItem) => {
        if (!houseId || !currentUserId) return;

        try {
            if (plan) {
                await updateDoc(doc(db, 'budget_plans', plan.id), {
                    items: arrayUnion(item),
                    updated_at: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, 'budget_plans'), {
                    house_id: houseId,
                    year: currentYear,
                    items: [item],
                    created_by: currentUserId,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
            }
            setShowForm(false);
        } catch (error) {
            console.error('Error saving budget item:', error);
        }
    };

    const handleDeleteItem = async (item: BudgetItem) => {
        if (!plan) return;
        try {
            await updateDoc(doc(db, 'budget_plans', plan.id), {
                items: arrayRemove(item)
            });
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const totalBudget = plan?.items.reduce((sum, item) => {
        let annualAmount = item.estimated_amount;
        if (item.frequency === 'monthly') annualAmount *= 12;
        return sum + annualAmount;
    }, 0) || 0;

    const monthlyContribution = Math.ceil(totalBudget / 12);

    if (loading) return <div className="p-8 text-center text-grey-mid">Hleð gögnum...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-3 card bg-charcoal text-white p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/10 rounded-full">
                        <PiggyBank className="w-6 h-6 text-amber" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium opacity-90">Áætlaður kostnaður {currentYear}</h2>
                        <div className="text-3xl font-serif font-bold mt-1">
                            {totalBudget.toLocaleString()} kr.
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 border-t border-white/10 pt-4">
                    <div>
                        <div className="text-sm opacity-60">Mánaðarlegt framlag</div>
                        <div className="text-xl font-medium">{monthlyContribution.toLocaleString()} kr.</div>
                    </div>
                    <div>
                        <div className="text-sm opacity-60">Staða í lok árs</div>
                        <div className="text-xl font-medium text-amber">0 kr.</div>
                    </div>
                </div>
            </div>

            <div className="col-span-1 md:col-span-2 card">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-serif">Kostnaðarliðir</h3>
                    {!showForm && (
                        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Bæta við lið
                        </button>
                    )}
                </div>

                {showForm && (
                    <BudgetForm onSave={handleSaveItem} onCancel={() => setShowForm(false)} />
                )}

                {!plan || !plan.items || plan.items.length === 0 ? (
                    !showForm && (
                        <div className="text-center py-12 text-grey-mid">
                            <Calculator className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Engir liðir skráðir. Bættu við kostnaði til að byrja.</p>
                        </div>
                    )
                ) : (
                    <div className="space-y-4">
                        {plan.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-bone/50 rounded hover:bg-bone transition-colors group">
                                <div>
                                    <div className="font-medium text-charcoal">{item.category}</div>
                                    <div className="text-xs text-grey-mid capitalize">
                                        {item.frequency === 'monthly' ? 'Mánaðarlega' :
                                            item.frequency === 'yearly' ? 'Árlega' : 'Einskiptis'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="font-bold text-charcoal">
                                            {item.estimated_amount.toLocaleString()} kr.
                                        </div>
                                        {item.frequency === 'monthly' && (
                                            <div className="text-xs text-grey-mid">
                                                x 12 = {(item.estimated_amount * 12).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteItem(item)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="col-span-1">
                <VarianceWidget budgetItems={plan?.items || []} entries={entries} />

                <div className="card mt-6">
                    <h3 className="font-medium mb-4">Um Rekstraráætlun</h3>
                    <p className="text-sm text-grey-mid mb-4">
                        Hér setur þú upp áætlun fyrir fastan kostnað búsins.
                        Stöðukortið hér að ofan sýnir samanburð við raunverulegan kostnað.
                    </p>
                </div>
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
}

function LedgerView({ houseId, currentUserId, isManager, currentUserName }: LedgerViewProps) {
    const [entries, setEntries] = useState<FinanceEntry[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!houseId) return;

        const q = query(
            collection(db, 'finance_entries'),
            where('house_id', '==', houseId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate() || new Date()
            })) as FinanceEntry[];
            setEntries(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [houseId]);

    const handleSaveEntry = async (entryData: Partial<FinanceEntry>) => {
        if (!houseId || !currentUserId) return;

        try {
            await addDoc(collection(db, 'finance_entries'), {
                ...entryData,
                house_id: houseId,
                user_uid: currentUserId,
                paid_by: currentUserId,
                paid_by_name: currentUserName || 'Notandi'
            });
            setShowForm(false);
        } catch (error) {
            console.error('Error saving entry:', error);
        }
    };

    const handleDeleteEntry = async (entry: FinanceEntry) => {
        try {
            await deleteDoc(doc(db, 'finance_entries', entry.id));
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    const totalIncome = entries
        .filter(e => e.type !== 'expense')
        .reduce((sum, e) => sum + e.amount, 0);

    const totalExpense = entries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);

    const balance = totalIncome - totalExpense;

    if (loading) return <div className="p-8 text-center text-grey-mid">Hleð gögnum...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Balance Card */}
            <div className={`col-span-1 md:col-span-3 card text-white p-6 mb-6 ${balance >= 0 ? 'bg-charcoal' : 'bg-red-800'}`}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/10 rounded-full">
                        <Wallet className="w-6 h-6 text-amber" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium opacity-90">Staða sjóðsins</h2>
                        <div className="text-3xl font-serif font-bold mt-1">
                            {balance.toLocaleString()} kr.
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 border-t border-white/10 pt-4">
                    <div>
                        <div className="text-sm opacity-60">Allar tekjur</div>
                        <div className="text-xl font-medium text-green-400">+{totalIncome.toLocaleString()} kr.</div>
                    </div>
                    <div>
                        <div className="text-sm opacity-60">Allar útgjöld</div>
                        <div className="text-xl font-medium text-red-300">-{totalExpense.toLocaleString()} kr.</div>
                    </div>
                </div>
            </div>

            <div className="col-span-1 md:col-span-2 card">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-serif">Bókhald</h3>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Skrá færslu
                        </button>
                    )}
                </div>

                {showForm && (
                    <LedgerForm onSave={handleSaveEntry} onCancel={() => setShowForm(false)} />
                )}

                <TransactionList
                    entries={entries}
                    onDelete={handleDeleteEntry}
                    currentUserId={currentUserId || ''}
                    isManager={isManager}
                />
            </div>

            <div className="col-span-1 card">
                <h3 className="font-medium mb-4">Um Bókhald</h3>
                <p className="text-sm text-grey-mid">
                    Hér heldur þú utan um raunverulegar tekjur (innborganir) og útgjöld.
                </p>
            </div>
        </div>
    );
}
