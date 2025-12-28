import { useState } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import type { FinanceEntry, FinanceType } from '@/types/models';

interface LedgerFormProps {
    onSave: (entry: Partial<FinanceEntry>) => void;
    onCancel: () => void;
}

export default function LedgerForm({ onSave, onCancel }: LedgerFormProps) {
    const [type, setType] = useState<FinanceType>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !category || !date) return;

        onSave({
            type,
            amount: parseInt(amount),
            category,
            description,
            date: new Date(date),
            created_at: new Date()
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-bone p-4 rounded-lg border border-grey-warm mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-charcoal">Ný færsla</h3>
                <button type="button" onClick={onCancel} className="text-grey-mid hover:text-charcoal">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Type Toggle */}
            <div className="flex gap-2 mb-4 p-1 bg-white/50 rounded-lg w-fit">
                <button
                    type="button"
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
                    onClick={() => setType('contribution')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${type !== 'expense'
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'text-grey-mid hover:text-charcoal'
                        }`}
                >
                    Innborgun / Tekjur
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="label">Dagsetning</label>
                    <div className="relative">
                        <input
                            type="date"
                            className="input w-full"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                        <Calendar className="w-4 h-4 text-grey-mid absolute right-3 top-3 pointer-events-none" />
                    </div>
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
                    <label className="label">Flokkur</label>
                    <input
                        type="text"
                        className="input"
                        placeholder={type === 'expense' ? "t.d. Bónus, Viðhald" : "t.d. Mánaðargjald"}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="label">Lýsing (valfrjálst)</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Nánari skýring..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button type="submit" className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Skrá færslu
                </button>
            </div>
        </form>
    );
}
