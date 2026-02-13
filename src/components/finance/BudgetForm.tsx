import { useState, useEffect } from 'react';
import { Plus, X, TrendingDown, TrendingUp } from 'lucide-react';
import type { BudgetItem, BudgetFrequency, BudgetItemType, User } from '@/types/models';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface BudgetFormProps {
    onSave: (item: BudgetItem) => void;
    onCancel: () => void;
    ownerIds?: string[]; // List of co-owner IDs
}

export default function BudgetForm({ onSave, onCancel, ownerIds = [] }: BudgetFormProps) {
    const [type, setType] = useState<BudgetItemType>('expense');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<BudgetFrequency>('monthly');
    const [assignedOwnerId, setAssignedOwnerId] = useState('');
    const [owners, setOwners] = useState<User[]>([]);

    // Fetch owner details for the dropdown
    useEffect(() => {
        const fetchOwners = async () => {
            if (!ownerIds.length) return;

            const promises = ownerIds.map(uid => getDoc(doc(db, 'users', uid)));
            const docs = await Promise.all(promises);
            const userData = docs
                .filter(d => d.exists())
                .map(d => ({ uid: d.id, ...d.data() } as User));

            setOwners(userData);
        };

        fetchOwners();
    }, [ownerIds]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !amount) return;

        const selectedOwner = owners.find(o => o.uid === assignedOwnerId);

        // Build the item object conditionally to avoid undefined values
        const item: BudgetItem = {
            category,
            estimated_amount: parseInt(amount),
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
                <button type="button" onClick={onCancel} className="text-grey-mid hover:text-charcoal">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Type Toggle */}
            <div className="flex gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${type === 'expense'
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-grey-mid hover:bg-bone'
                        }`}
                >
                    <TrendingDown className="w-4 h-4" />
                    Kostnaður
                </button>
                <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${type === 'income'
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-grey-mid hover:bg-bone'
                        }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    Tekjur
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                    <label className="label">Flokkur</label>
                    <input
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
                        <label className="label">Upphæð (kr.)</label>
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
                    <label className="label">Meðeigandi (valfrjálst)</label>
                    <select
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

            <div className="flex justify-end">
                <button type="submit" className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Bæta við
                </button>
            </div>
        </form>
    );
}
