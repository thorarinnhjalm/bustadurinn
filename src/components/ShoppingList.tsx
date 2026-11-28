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
        <div className="space-y-1">
            {/* Unchecked Items */}
            {uncheckedItems.map(item => (
                <div
                    key={item.id}
                    className="group p-3 rounded-lg hover:bg-stone-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                    <button
                        type="button"
                        role="checkbox"
                        aria-checked={false}
                        aria-label={`Merkja ${item.item} sem keypt`}
                        className="flex items-center gap-3 flex-1 text-left"
                        onClick={() => onToggle(item)}
                    >
                        <div aria-hidden="true" className="w-5 h-5 rounded border border-stone-300 bg-white flex items-center justify-center hover:border-green-500 transition-colors">
                            {/* Empty checkbox */}
                        </div>
                        <span className="text-sm text-[#1a1a1a] font-medium">
                            {item.item}
                        </span>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                            {item.added_by_name}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item);
                            }}
                            aria-label={`Eyða ${item.item}`}
                            className="inline-flex items-center justify-center min-w-6 min-h-6 opacity-0 group-hover:opacity-100 focus:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                        >
                            <Trash2 size={14} aria-hidden="true" className="text-stone-500 hover:text-red-500 transition-colors" />
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
                            <button
                                type="button"
                                role="checkbox"
                                aria-checked={true}
                                aria-label={`Taka ${item.item} af keyptum vörum`}
                                className="flex items-center gap-3 flex-1 text-left"
                                onClick={() => onToggle(item)}
                            >
                                <div aria-hidden="true" className="w-5 h-5 rounded border border-stone-200 bg-stone-200 flex items-center justify-center">
                                    <Check size={12} aria-hidden="true" className="text-stone-500" />
                                </div>
                                <span className="text-sm text-stone-500 line-through">
                                    {item.item}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(item);
                                }}
                                aria-label={`Eyða ${item.item}`}
                                className="inline-flex items-center justify-center min-w-6 min-h-6 opacity-0 group-hover:opacity-100 focus:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14} aria-hidden="true" className="text-stone-500 hover:text-red-500 transition-colors" />
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
                            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) handleAdd();
                            if (e.key === 'Escape') {
                                setShowInput(false);
                                setNewItem('');
                            }
                        }}
                        aria-label="Ný vara á innkaupalista"
                        placeholder="t.d. Klósettpappír..."
                        className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber"
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="px-4 py-2 bg-amber text-charcoal rounded-lg text-sm font-bold hover:bg-amber-dark transition-colors"
                    >
                        Bæta við
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setShowInput(true)}
                    className="w-full mt-2 py-2 text-xs font-bold text-stone-500 border border-dashed border-stone-200 rounded-lg hover:border-amber hover:text-amber-ink flex items-center justify-center gap-1 transition-colors"
                >
                    <Plus size={14} aria-hidden="true" /> Bæta við vöru
                </button>
            )}
        </div>
    );
}
