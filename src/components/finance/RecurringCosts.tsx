import { useState } from 'react';
import { Repeat, Plus, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import type { RecurringCost, BudgetItem, BudgetPlan } from '@/types/models';
import { logger } from '@/utils/logger';

const MONTHS = [
    'Janúar', 'Febrúar', 'Mars', 'Apríl', 'Maí', 'Júní',
    'Júlí', 'Ágúst', 'September', 'Október', 'Nóvember', 'Desember'
];

interface RecurringCostsProps {
    houseId: string;
    currentUserId: string;
    recurringCosts: RecurringCost[];
    budgetCategories: string[];
    onChanged: (recurringCosts: RecurringCost[]) => void;
}

/** Builds the BudgetItem that mirrors a given RecurringCost. */
function toBudgetItem(cost: RecurringCost): BudgetItem {
    const item: BudgetItem = {
        category: cost.category,
        estimated_amount: cost.estimated_amount,
        frequency: cost.frequency === 'yearly' ? 'yearly' : 'monthly',
        type: 'expense',
        recurring_cost_id: cost.id
    };
    if (cost.frequency === 'yearly') {
        item.month = cost.due_month;
    }
    return item;
}

/**
 * Upserts a BudgetItem for `cost` into the house's current-year BudgetPlan,
 * matched by `recurring_cost_id` so repeated saves of the same recurring
 * cost update the existing item instead of duplicating it.
 */
async function upsertBudgetItem(houseId: string, cost: RecurringCost, currentUserId: string) {
    const currentYear = new Date().getFullYear();
    const q = query(
        collection(db, 'houses', houseId, 'budget_plans'),
        where('year', '==', currentYear)
    );
    const snap = await getDocs(q);
    const newItem = toBudgetItem(cost);

    if (!snap.empty) {
        const planDoc = snap.docs[0];
        const plan = planDoc.data() as BudgetPlan;
        const items = plan.items || [];
        const idx = items.findIndex((i) => i.recurring_cost_id === cost.id);
        const nextItems = idx >= 0
            ? items.map((i, n) => (n === idx ? newItem : i))
            : [...items, newItem];

        await updateDoc(doc(db, 'houses', houseId, 'budget_plans', planDoc.id), {
            items: nextItems,
            updated_at: serverTimestamp()
        });
    } else {
        await addDoc(collection(db, 'houses', houseId, 'budget_plans'), {
            house_id: houseId,
            year: currentYear,
            items: [newItem],
            created_by: currentUserId,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });
    }
}

/** Removes the BudgetItem mirroring `costId`, if one exists (best-effort). */
async function removeBudgetItem(houseId: string, costId: string) {
    const currentYear = new Date().getFullYear();
    const q = query(
        collection(db, 'houses', houseId, 'budget_plans'),
        where('year', '==', currentYear)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const planDoc = snap.docs[0];
    const plan = planDoc.data() as BudgetPlan;
    const items = plan.items || [];
    const nextItems = items.filter((i) => i.recurring_cost_id !== costId);
    if (nextItems.length === items.length) return;

    await updateDoc(doc(db, 'houses', houseId, 'budget_plans', planDoc.id), {
        items: nextItems,
        updated_at: serverTimestamp()
    });
}

export default function RecurringCosts({ houseId, currentUserId, recurringCosts, budgetCategories, onChanged }: RecurringCostsProps) {
    const [expanded, setExpanded] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [dueMonth, setDueMonth] = useState('1');
    const [frequency, setFrequency] = useState<'yearly' | 'monthly'>('yearly');
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setName('');
        setCategory('');
        setAmount('');
        setDueMonth('1');
        setFrequency('yearly');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !category || !amount) return;

        setSaving(true);
        try {
            const cost: RecurringCost = {
                id: crypto.randomUUID(),
                name,
                category,
                estimated_amount: parseInt(amount, 10),
                due_month: parseInt(dueMonth, 10),
                frequency
            };

            const nextCosts = [...recurringCosts, cost];
            await updateDoc(doc(db, 'houses', houseId), { recurring_costs: nextCosts });
            await upsertBudgetItem(houseId, cost, currentUserId);

            onChanged(nextCosts);
            resetForm();
            setShowForm(false);
        } catch (error) {
            logger.error('Error saving recurring cost:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (cost: RecurringCost) => {
        try {
            const nextCosts = recurringCosts.filter((c) => c.id !== cost.id);
            await updateDoc(doc(db, 'houses', houseId), { recurring_costs: nextCosts });
            await removeBudgetItem(houseId, cost.id);
            onChanged(nextCosts);
        } catch (error) {
            logger.error('Error deleting recurring cost:', error);
        }
    };

    return (
        <div className="card">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex justify-between items-center"
            >
                <div className="flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-amber" />
                    <div className="text-left">
                        <h3 className="font-serif text-lg text-charcoal">Endurtekinn kostnaður</h3>
                        <p className="text-xs text-grey-mid mt-0.5">
                            Áminningar um fastan kostnað sem kemur reglulega, t.d. tryggingar og rafmagn
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-grey-mid" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-grey-mid" />
                )}
            </button>

            {expanded && (
                <div className="mt-6 space-y-4">
                    {recurringCosts.length === 0 && !showForm && (
                        <p className="text-sm text-grey-mid">Enginn endurtekinn kostnaður skráður ennþá.</p>
                    )}

                    {recurringCosts.length > 0 && (
                        <div className="space-y-2">
                            {recurringCosts.map((cost) => (
                                <div key={cost.id} className="flex items-center justify-between gap-3 p-3 bg-bone/50 rounded group">
                                    <div className="min-w-0">
                                        <div className="font-medium text-sm text-charcoal truncate">{cost.name}</div>
                                        <div className="text-xs text-grey-mid">
                                            {cost.category} • {cost.frequency === 'monthly' ? 'Mánaðarlega' : `Árlega (${MONTHS[cost.due_month - 1]})`}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-sm font-bold text-charcoal">{cost.estimated_amount.toLocaleString()} kr.</span>
                                        <button
                                            onClick={() => handleDelete(cost)}
                                            className="text-grey-mid hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Eyða"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {showForm ? (
                        <form onSubmit={handleSubmit} className="bg-bone p-4 rounded-lg border border-grey-warm space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-medium text-sm text-charcoal">Nýr endurtekinn kostnaður</h4>
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="text-grey-mid hover:text-charcoal">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Heiti</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="t.d. Húsatrygging - VÍS"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Flokkur</label>
                                    <input
                                        type="text"
                                        className="input"
                                        list="recurring-category-list"
                                        placeholder="t.d. Tryggingar"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        required
                                    />
                                    <datalist id="recurring-category-list">
                                        {budgetCategories.map((cat, i) => (
                                            <option key={i} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="label">Áætluð upphæð (kr.)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Tíðni</label>
                                    <select
                                        className="input"
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value as 'yearly' | 'monthly')}
                                    >
                                        <option value="yearly">Árlega</option>
                                        <option value="monthly">Mánaðarlega</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">{frequency === 'monthly' ? 'Fyrsti gjalddagi' : 'Gjalddagi (mánuður)'}</label>
                                    <select
                                        className="input"
                                        value={dueMonth}
                                        onChange={(e) => setDueMonth(e.target.value)}
                                    >
                                        {MONTHS.map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    {saving ? 'Vista...' : 'Vista kostnað'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button onClick={() => setShowForm(true)} className="btn btn-secondary btn-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Bæta við endurteknum kostnaði
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
