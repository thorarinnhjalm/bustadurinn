import { useId, useState } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import type { LedgerEntry, LedgerType } from '@/types/models';
import { toDateInputValue, fromDateInputValue } from '@/components/finance/dateInput';
import { validateAmount, parseAmountInput } from '@/components/finance/ledgerUtils';

interface LedgerFormProps {
    onSave: (entry: Partial<LedgerEntry>) => void;
    onCancel: () => void;
    budgetCategories?: string[];
    // A full LedgerEntry (with `id`) edits that entry; a partial without
    // `id` is used to prefill a NEW entry (e.g. from a recurring cost
    // reminder — see RecurringCostReminders / FinancePage).
    initialValues?: Partial<LedgerEntry> | null;
    houseMembers?: { uid: string, name: string }[];
}

export default function LedgerForm({ onSave, onCancel, budgetCategories = [], initialValues, houseMembers = [] }: LedgerFormProps) {
    const baseId = useId();
    const [type, setType] = useState<LedgerType>(initialValues?.type || 'expense');
    const [amount, setAmount] = useState(initialValues?.amount?.toString() || '');
    const [category, setCategory] = useState(initialValues?.category || '');
    const [description, setDescription] = useState(initialValues?.description || '');
    const [date, setDate] = useState(toDateInputValue(initialValues?.date ? new Date(initialValues.date) : new Date()));
    const [error, setError] = useState<string | null>(null);
    const [splitUsers, setSplitUsers] = useState<string[]>(initialValues?.split_between?.map(u => u.uid) || []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !category || !date) return;

        const parsedAmount = Math.round(parseAmountInput(amount));
        const amountError = validateAmount(parsedAmount);
        if (amountError) {
            setError(amountError);
            return;
        }
        const parsedDate = fromDateInputValue(date);
        if (Number.isNaN(parsedDate.getTime())) {
            setError('Dagsetning er ógild.');
            return;
        }
        setError(null);

        // Simplify legacy logic: if splitUsers has entries, we use that.
        // The parent determines paid_by based on context, but here we can define the split.
        const splitData = splitUsers.length > 0
            ? houseMembers.filter(m => splitUsers.includes(m.uid)).map(m => ({ uid: m.uid, name: m.name }))
            : undefined;

        onSave({
            ...(initialValues?.id ? { id: initialValues.id } : {}),
            type,
            amount: parsedAmount,
            category,
            description,
            date: parsedDate,
            split_between: splitData,
            created_at: initialValues?.created_at || new Date()
        });
    };

    const toggleSplitUser = (uid: string) => {
        setSplitUsers(prev =>
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };

    return (
        <form onSubmit={handleSubmit} className="bg-bone p-4 rounded-lg border border-grey-warm mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-charcoal">{initialValues?.id ? 'Breyta færslu' : 'Ný færsla'}</h3>
                <button type="button" onClick={onCancel} aria-label="Loka" className="p-1 text-grey-mid hover:text-charcoal">
                    <X className="w-5 h-5" aria-hidden="true" />
                </button>
            </div>

            {/* Type Toggle */}
            <div role="group" aria-label="Tegund færslu" className="flex gap-2 mb-4 p-1 bg-white/50 rounded-lg w-fit">
                <button
                    type="button"
                    aria-pressed={type === 'expense'}
                    onClick={() => setType('expense')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${type === 'expense'
                        ? 'bg-charcoal text-white shadow-sm'
                        : 'text-grey-mid hover:text-charcoal'
                        }`}
                >
                    Útgjöld
                </button>
                <button
                    type="button"
                    aria-pressed={type !== 'expense'}
                    onClick={() => setType('income')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${type !== 'expense'
                        ? 'bg-green-700 text-white shadow-sm'
                        : 'text-grey-mid hover:text-charcoal'
                        }`}
                >
                    Innborgun / Tekjur
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor={`${baseId}-date`} className="label">Dagsetning</label>
                    <div className="relative">
                        <input
                            id={`${baseId}-date`}
                            type="date"
                            className="input w-full"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                        <Calendar className="w-4 h-4 text-grey-mid absolute right-3 top-3 pointer-events-none" aria-hidden="true" />
                    </div>
                </div>
                <div>
                    <label htmlFor={`${baseId}-amount`} className="label">Upphæð (kr.)</label>
                    <input
                        id={`${baseId}-amount`}
                        type="number"
                        className="input"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor={`${baseId}-category`} className="label">Flokkur</label>
                    <input
                        id={`${baseId}-category`}
                        type="text"
                        className="input"
                        list="category-list"
                        placeholder={type === 'expense' ? "t.d. Bónus, Viðhald" : "t.d. Mánaðargjald"}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    />
                    <datalist id="category-list">
                        {budgetCategories.map((cat, i) => (
                            <option key={i} value={cat} />
                        ))}
                    </datalist>
                </div>
                <div>
                    <label htmlFor={`${baseId}-description`} className="label">Lýsing (valfrjálst)</label>
                    <input
                        id={`${baseId}-description`}
                        type="text"
                        className="input"
                        placeholder="Nánari skýring..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </div>

            {/* Split / Member Selection (Mostly relevant for Income/Innborgun) */}
            {houseMembers.length > 0 && (
                <div className="mb-4 pt-4 border-t border-grey-warm/50">
                    <p id={`${baseId}-split-label`} className="label mb-2 block">
                        {type === 'income' ? 'Hver greiddi inn?' : 'Hver stofnaði til kostnaðar?'}
                    </p>
                    <div role="group" aria-labelledby={`${baseId}-split-label`} className="flex flex-wrap gap-2">
                        {houseMembers.map(member => (
                            <button
                                key={member.uid}
                                type="button"
                                aria-pressed={splitUsers.includes(member.uid)}
                                onClick={() => toggleSplitUser(member.uid)}
                                className={`px-3 py-2 rounded-full text-xs font-medium border transition-all ${splitUsers.includes(member.uid)
                                    ? 'bg-amber text-charcoal border-amber'
                                    : 'bg-white text-stone-600 border-stone-200 hover:border-amber'
                                    }`}
                            >
                                {member.name}
                            </button>
                        ))}
                    </div>
                    {splitUsers.length === 0 && (
                        <p className="text-xs text-stone-500 mt-1 italic">
                            Ef enginn er valinn skráist þetta á þig ({'núverandi notandi'}).
                        </p>
                    )}
                </div>
            )}

            {error && (
                <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>
            )}

            <div className="flex justify-end">
                <button type="submit" className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    Skrá færslu
                </button>
            </div>
        </form>
    );
}
