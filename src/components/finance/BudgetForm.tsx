import { useId, useState } from 'react';
import { Plus, X, TrendingDown, TrendingUp } from 'lucide-react';
import type { BudgetItem, BudgetFrequency, BudgetItemType } from '@/types/models';
import { validateAmount, parseAmountInput } from '@/components/finance/ledgerUtils';

interface BudgetFormProps {
    onSave: (item: BudgetItem) => void;
    onCancel: () => void;
    members?: { uid: string; name: string }[]; // Co-owners (for assigning income)
}

export default function BudgetForm({ onSave, onCancel, members = [] }: BudgetFormProps) {
    const baseId = useId();
    const [type, setType] = useState<BudgetItemType>('expense');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<BudgetFrequency>('monthly');
    const [assignedOwnerId, setAssignedOwnerId] = useState('');
    const [error, setError] = useState<string | null>(null);
    // Co-owners come from the parent (loaded via getHouseMembers); other
    // users' docs are not readable from the client.
    const owners = members;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !amount) return;

        const parsedAmount = Math.round(parseAmountInput(amount));
        const amountError = validateAmount(parsedAmount);
        if (amountError) {
            setError(amountError);
            return;
        }
        setError(null);

        const selectedOwner = owners.find(o => o.uid === assignedOwnerId);

        // Build the item object conditionally to avoid undefined values
        const item: BudgetItem = {
            category,
            estimated_amount: parsedAmount,
            frequency,
            type
        };

        // Only add owner fields if they have values (for income items)
        if (type === 'income' && assignedOwnerId && selectedOwner) {
            item.assigned_owner_id = assignedOwnerId;
            item.assigned_owner_name = selectedOwner.name;
        }

        onSave(item);

        // Reset
        setCategory('');
        setAmount('');
        setFrequency('monthly');
        setAssignedOwnerId('');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-bone p-4 rounded-lg border border-grey-warm mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-charcoal">
                    {type === 'expense' ? 'Nýr kostnaðarliður' : 'Nýjar tekjur'}
                </h3>
                <button type="button" onClick={onCancel} aria-label="Loka" className="p-1 text-grey-mid hover:text-charcoal">
                    <X className="w-5 h-5" aria-hidden="true" />
                </button>
            </div>

            {/* Type Toggle */}
            <div role="group" aria-label="Tegund liðar" className="flex gap-2 mb-4">
                <button
                    type="button"
                    aria-pressed={type === 'expense'}
                    onClick={() => setType('expense')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${type === 'expense'
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-grey-mid hover:bg-bone'
                        }`}
                >
                    <TrendingDown className="w-4 h-4" aria-hidden="true" />
                    Kostnaður
                </button>
                <button
                    type="button"
                    aria-pressed={type === 'income'}
                    onClick={() => setType('income')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${type === 'income'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-grey-mid hover:bg-bone'
                        }`}
                >
                    <TrendingUp className="w-4 h-4" aria-hidden="true" />
                    Tekjur
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                    <label htmlFor={`${baseId}-category`} className="label">Flokkur</label>
                    <input
                        id={`${baseId}-category`}
                        type="text"
                        className="input"
                        placeholder={type === 'expense' ? 't.d. Rafmagn' : 't.d. Mánaðargjöld'}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                        <label htmlFor={`${baseId}-frequency`} className="label">Tíðni</label>
                        <select
                            id={`${baseId}-frequency`}
                            className="input"
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as BudgetFrequency)}
                        >
                            <option value="monthly">Mánaðarlega</option>
                            <option value="yearly">Árlega</option>
                            <option value="one-time">Einskiptis</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Co-owner selection for income */}
            {type === 'income' && owners.length > 0 && (
                <div className="mb-4">
                    <label htmlFor={`${baseId}-owner`} className="label">Meðeigandi (valfrjálst)</label>
                    <select
                        id={`${baseId}-owner`}
                        className="input"
                        value={assignedOwnerId}
                        onChange={(e) => setAssignedOwnerId(e.target.value)}
                    >
                        <option value="">Engin úthlutun</option>
                        {owners.map((owner) => (
                            <option key={owner.uid} value={owner.uid}>
                                {owner.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-grey-mid mt-1">
                        Veldu meðeiganda ef þetta eru framlag frá ákveðnum aðila
                    </p>
                </div>
            )}

            {error && (
                <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>
            )}

            <div className="flex justify-end">
                <button type="submit" className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    Bæta við
                </button>
            </div>
        </form>
    );
}
