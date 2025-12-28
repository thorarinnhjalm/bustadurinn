import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { BudgetItem, BudgetFrequency } from '@/types/models';

interface BudgetFormProps {
    onSave: (item: BudgetItem) => void;
    onCancel: () => void;
}

export default function BudgetForm({ onSave, onCancel }: BudgetFormProps) {
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<BudgetFrequency>('monthly');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !amount) return;

        onSave({
            category,
            estimated_amount: parseInt(amount),
            frequency
        });

        // Reset
        setCategory('');
        setAmount('');
        setFrequency('monthly');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-bone p-4 rounded-lg border border-grey-warm mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-charcoal">Nýr kostnaðarliður</h3>
                <button type="button" onClick={onCancel} className="text-grey-mid hover:text-charcoal">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="label">Flokkur</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="t.d. Rafmagn"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    />
                </div>
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

            <div className="flex justify-end">
                <button type="submit" className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Bæta við
                </button>
            </div>
        </form>
    );
}
