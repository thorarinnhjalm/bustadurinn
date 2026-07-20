import { useState } from 'react';
import { Trash2, Plus, type LucideIcon } from 'lucide-react';

interface ChecklistEditorProps {
    icon: LucideIcon;
    title: string;
    description: string;
    items: string[];
    onChange: (items: string[]) => void;
    defaults: string[];
    isManager: boolean;
    emptyMessage?: string;
    placeholder?: string;
}

/**
 * Reusable "list of short text items" editor, extracted from the original
 * checkout-checklist editor in HouseSettings. Used for the checkout, arrival,
 * supply and seasonal (spring/autumn) checklists — all share the same shape:
 * an ordered string[] with one-click Icelandic defaults, manager-only add/
 * remove, plain text input + Enter-to-add.
 */
export default function ChecklistEditor({
    icon: Icon,
    title,
    description,
    items,
    onChange,
    defaults,
    isManager,
    emptyMessage = 'Enginn listi hefur verið settur upp.',
    placeholder = 'T.d. Nýtt atriði'
}: ChecklistEditorProps) {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        const label = newItem.trim();
        if (!label) return;
        onChange([...items, label]);
        setNewItem('');
    };

    const handleRemove = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const handleInsertDefaults = () => {
        onChange([...defaults]);
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-amber" />
                <h3 className="font-serif text-lg">{title}</h3>
            </div>
            <p className="text-sm text-stone-500 mb-4">{description}</p>

            {items.length === 0 ? (
                <div className="text-center py-6 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                    <p className="text-sm text-stone-500 mb-3">{emptyMessage}</p>
                    {isManager && (
                        <button
                            type="button"
                            onClick={handleInsertDefaults}
                            className="text-xs font-bold text-amber hover:underline"
                        >
                            Setja inn sjálfgefinn lista
                        </button>
                    )}
                </div>
            ) : (
                <ul className="space-y-2 mb-4">
                    {items.map((item, idx) => (
                        <li
                            key={`${item}-${idx}`}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100"
                        >
                            <span className="text-sm text-stone-700">{item}</span>
                            {isManager && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(idx)}
                                    className="text-stone-400 hover:text-red-500 transition-colors"
                                    aria-label={`Eyða ${item}`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {isManager && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="input flex-1"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAdd();
                            }
                        }}
                        placeholder={placeholder}
                    />
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="btn btn-secondary flex items-center gap-2 px-4"
                    >
                        <Plus className="w-4 h-4" /> Bæta við
                    </button>
                </div>
            )}
        </div>
    );
}
