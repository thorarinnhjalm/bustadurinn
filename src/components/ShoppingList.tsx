import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import type { ShoppingItem } from '@/types/models';

interface ShoppingListProps {
    items: ShoppingItem[];
    onToggle: (item: ShoppingItem) => void;
    onDelete: (item: ShoppingItem) => void;
    onAdd: (itemName: string) => void;
}

export default function ShoppingList({ items, onToggle, onDelete, onAdd }: ShoppingListProps) {
    const [newItem, setNewItem] = useState('');
    const [showInput, setShowInput] = useState(false);

    const handleAdd = () => {
        if (newItem.trim()) {
            onAdd(newItem.trim());
            setNewItem('');
            setShowInput(false);
        }
    };

    const uncheckedItems = items.filter(i => !i.checked);
    const checkedItems = items.filter(i => i.checked);

    return (
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-2">
            {/* Unchecked Items */}
            {uncheckedItems.map(item => (
                <div
                    key={item.id}
                    className="group p-3 rounded-lg hover:bg-stone-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                    <div className="flex items-center gap-3 flex-1" onClick={() => onToggle(item)}>
                        <div className="w-5 h-5 rounded border border-stone-300 bg-white flex items-center justify-center hover:border-green-500 transition-colors">
                            {/* Empty checkbox */}
                        </div>
                        <span className="text-sm text-[#1a1a1a] font-medium">
                            {item.item}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                            {item.added_by_name}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={14} className="text-stone-300 hover:text-red-500 transition-colors" />
                        </button>
                    </div>
                </div>
            ))}

            {/* Checked Items (Collapsed) */}
            {checkedItems.length > 0 && (
                <div className="mt-2 pt-2 border-t border-stone-100">
                    {checkedItems.map(item => (
                        <div
                            key={item.id}
                            className="group p-3 rounded-lg hover:bg-stone-50 flex items-center justify-between cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-3 flex-1" onClick={() => onToggle(item)}>
                                <div className="w-5 h-5 rounded border border-stone-200 bg-stone-200 flex items-center justify-center">
                                    <Check size={12} className="text-stone-500" />
                                </div>
                                <span className="text-sm text-stone-400 line-through">
                                    {item.item}
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(item);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14} className="text-stone-300 hover:text-red-500 transition-colors" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Item */}
            {showInput ? (
                <div className="flex gap-2 mt-2">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAdd();
                            if (e.key === 'Escape') {
                                setShowInput(false);
                                setNewItem('');
                            }
                        }}
                        placeholder="t.d. Klósettpappír..."
                        className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber"
                        autoFocus
                    />
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-amber text-charcoal rounded-lg text-sm font-bold hover:bg-amber-dark transition-colors"
                    >
                        Bæta við
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowInput(true)}
                    className="w-full mt-2 py-2 text-xs font-bold text-stone-400 border border-dashed border-stone-200 rounded-lg hover:border-amber hover:text-amber flex items-center justify-center gap-1 transition-colors"
                >
                    <Plus size={14} /> Bæta við vöru
                </button>
            )}
        </div>
    );
}
