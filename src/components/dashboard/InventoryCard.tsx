import { useState } from 'react';
import {
    Package,
    Utensils,
    Bed,
    Sparkles,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    Loader2
} from 'lucide-react';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    getDocs,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { InventoryItem } from '@/types/models';

interface InventoryCardProps {
    houseId: string;
    currentUserId: string;
    currentUserName: string;
    inventoryItems: InventoryItem[];
    onInitialize: () => Promise<void>;
}

type CategoryKey = 'pantry' | 'kitchen' | 'bedding' | 'cleaning';

interface CategoryConfig {
    key: CategoryKey;
    label: string;
    icon: any;
    placeholder: string;
    defaultQuantity?: string;
    isConsumable: boolean;
}

const CATEGORIES: CategoryConfig[] = [
    {
        key: 'pantry',
        label: 'Krydd & matvara',
        icon: Sparkles,
        placeholder: 'T.d. Salt, Ólífuolía, Kaffi',
        isConsumable: true
    },
    {
        key: 'kitchen',
        label: 'Leirtau & borðbúnaður',
        icon: Utensils,
        placeholder: 'T.d. Diskar, Glös, Hnífapör',
        defaultQuantity: '12 stk',
        isConsumable: false
    },
    {
        key: 'bedding',
        label: 'Sængur & lín',
        icon: Bed,
        placeholder: 'T.d. Sængur, Koddar, Rúmföt',
        defaultQuantity: '6 stk',
        isConsumable: false
    },
    {
        key: 'cleaning',
        label: 'Hreinlæti & annað',
        icon: Package,
        placeholder: 'T.d. Uppþvottalögur, Klósettpappír',
        isConsumable: true
    }
];

export default function InventoryCard({
    houseId,
    currentUserId,
    currentUserName,
    inventoryItems,
    onInitialize
}: InventoryCardProps) {
    const [activeTab, setActiveTab] = useState<CategoryKey>('pantry');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editQuantity, setEditQuantity] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);

    const activeCategoryConfig = CATEGORIES.find((c) => c.key === activeTab)!;
    const currentTabItems = inventoryItems.filter((i) => i.category === activeTab);

    // Toggle consumable item status (Til vs Á þrotum)
    const handleToggleStatus = async (item: InventoryItem) => {
        if (!houseId || !currentUserId) return;
        const newStatus = item.status === 'ok' ? 'out' : 'ok';
        try {
            const itemRef = doc(db, 'houses', houseId, 'inventory', item.id);
            await updateDoc(itemRef, {
                status: newStatus,
                updated_at: serverTimestamp(),
                updated_by: currentUserId,
                updated_by_name: currentUserName
            });

            // Sync with Shopping List
            const shoppingColRef = collection(db, 'houses', houseId, 'shopping_list');
            if (newStatus === 'out') {
                // Add to shopping list if not already there
                const q = query(
                    shoppingColRef,
                    where('item', '==', item.name),
                    where('checked', '==', false)
                );
                const querySnap = await getDocs(q);
                if (querySnap.empty) {
                    await addDoc(shoppingColRef, {
                        house_id: houseId,
                        item: item.name,
                        checked: false,
                        added_by: currentUserId,
                        added_by_name: currentUserName,
                        created_at: serverTimestamp()
                    });
                }
            } else {
                // Remove from shopping list when marked as in stock
                const q = query(
                    shoppingColRef,
                    where('item', '==', item.name),
                    where('checked', '==', false)
                );
                const querySnap = await getDocs(q);
                for (const docSnap of querySnap.docs) {
                    await deleteDoc(doc(db, 'houses', houseId, 'shopping_list', docSnap.id));
                }
            }
        } catch (error) {
            console.error('Error toggling inventory item status:', error);
        }
    };

    // Add new item
    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newItemName.trim();
        if (!name || !houseId) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'houses', houseId, 'inventory'), {
                house_id: houseId,
                name,
                category: activeTab,
                status: 'ok',
                quantity: newItemQuantity.trim(),
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                updated_by: currentUserId,
                updated_by_name: currentUserName
            });
            setNewItemName('');
            setNewItemQuantity('');
            setShowAddForm(false);
        } catch (error) {
            console.error('Error adding inventory item:', error);
        } finally {
            setLoading(false);
        }
    };

    // Start editing item
    const startEditing = (item: InventoryItem) => {
        setEditingItemId(item.id);
        setEditName(item.name);
        setEditQuantity(item.quantity || '');
    };

    // Save edited item
    const handleSaveEdit = async (itemId: string) => {
        const name = editName.trim();
        if (!name || !houseId) return;

        try {
            const itemRef = doc(db, 'houses', houseId, 'inventory', itemId);
            await updateDoc(itemRef, {
                name,
                quantity: editQuantity.trim(),
                updated_at: serverTimestamp(),
                updated_by: currentUserId,
                updated_by_name: currentUserName
            });
            setEditingItemId(null);
        } catch (error) {
            console.error('Error updating inventory item:', error);
        }
    };

    // Delete item
    const handleDeleteItem = async (itemId: string) => {
        if (!houseId) return;
        try {
            await deleteDoc(doc(db, 'houses', houseId, 'inventory', itemId));
        } catch (error) {
            console.error('Error deleting inventory item:', error);
        }
    };

    const handleInit = async () => {
        setInitializing(true);
        try {
            await onInitialize();
        } finally {
            setInitializing(false);
        }
    };

    const isTotalEmpty = inventoryItems.length === 0;

    return (
        <section className="group">
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber" />
                    <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Hvað er til</h3>
                </div>
                {!isTotalEmpty && (
                    <button
                        type="button"
                        onClick={() => {
                            setShowAddForm(!showAddForm);
                            setNewItemQuantity(activeCategoryConfig.defaultQuantity || '');
                        }}
                        className="text-xs font-bold text-amber hover:underline flex items-center gap-1 bg-amber/10 hover:bg-amber/20 px-3 py-1.5 rounded-full transition-colors"
                    >
                        <Plus size={14} />
                        Skrá atriði
                    </button>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden min-h-[220px]">
                {isTotalEmpty ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8">
                        <div className="w-14 h-14 bg-amber/10 text-amber rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Package size={26} />
                        </div>
                        <h4 className="font-bold text-base text-[#1a1a1a] mb-1">Ekkert hefur verið skráð</h4>
                        <p className="text-xs text-stone-500 mb-6 max-w-xs leading-relaxed">
                            Búðu til lista yfir það sem er til í bústaðnum — krydd, leirtau, sængur og fleira.
                        </p>
                        <button
                            type="button"
                            onClick={handleInit}
                            disabled={initializing}
                            className="btn btn-primary text-xs px-5 py-2.5 font-bold shadow-md flex items-center gap-2"
                        >
                            {initializing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            Virkja sjálfgefinn lista
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Subcategory Tabs */}
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-stone-100">
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const count = inventoryItems.filter((i) => i.category === cat.key).length;
                                const isActive = activeTab === cat.key;
                                return (
                                    <button
                                        key={cat.key}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(cat.key);
                                            setShowAddForm(false);
                                            setEditingItemId(null);
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                            isActive
                                                ? 'bg-[#1a1a1a] text-white shadow-sm'
                                                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                                        }`}
                                    >
                                        <Icon size={14} className={isActive ? 'text-amber' : 'text-stone-400'} />
                                        <span>{cat.label}</span>
                                        {count > 0 && (
                                            <span
                                                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                                                    isActive ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Inline Add Form */}
                        {showAddForm && (
                            <form
                                onSubmit={handleAddItem}
                                className="bg-amber/5 p-4 rounded-xl border border-amber/20 space-y-3 animate-in fade-in duration-200"
                            >
                                <div className="flex justify-between items-center">
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                        Nýtt atriði í ({activeCategoryConfig.label})
                                    </h5>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="text-stone-400 hover:text-stone-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        placeholder={activeCategoryConfig.placeholder}
                                        className="sm:col-span-2 input text-xs py-2"
                                        required
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        value={newItemQuantity}
                                        onChange={(e) => setNewItemQuantity(e.target.value)}
                                        placeholder="T.d. 12 stk eða Magni"
                                        className="input text-xs py-2"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="btn btn-ghost text-xs py-1.5 px-3"
                                    >
                                        Hætta við
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !newItemName.trim()}
                                        className="btn btn-primary text-xs py-1.5 px-4 font-bold bg-amber hover:bg-amber-dark text-charcoal"
                                    >
                                        {loading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Plus size={12} className="mr-1" />}
                                        Skrá
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Items Grid / List */}
                        {currentTabItems.length === 0 ? (
                            <div className="py-6 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
                                <p className="text-xs text-stone-500 mb-2">Engin atriði skráð í þessum flokki.</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddForm(true);
                                        setNewItemQuantity(activeCategoryConfig.defaultQuantity || '');
                                    }}
                                    className="text-xs font-bold text-amber hover:underline inline-flex items-center gap-1"
                                >
                                    <Plus size={12} /> Bæta við {activeCategoryConfig.label.toLowerCase()}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                                {currentTabItems.map((item) => {
                                    const isOut = item.status === 'out';
                                    const isEditing = editingItemId === item.id;

                                    if (isEditing) {
                                        return (
                                            <div
                                                key={item.id}
                                                className="col-span-1 sm:col-span-2 p-3 bg-white rounded-xl border-2 border-amber shadow-sm flex flex-wrap gap-2 items-center"
                                            >
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="input text-xs py-1.5 flex-1 min-w-[120px]"
                                                />
                                                <input
                                                    type="text"
                                                    value={editQuantity}
                                                    onChange={(e) => setEditQuantity(e.target.value)}
                                                    placeholder="Magn (t.d. 12 stk)"
                                                    className="input text-xs py-1.5 w-28"
                                                />
                                                <div className="flex gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveEdit(item.id)}
                                                        className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                                                        title="Vista"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingItemId(null)}
                                                        className="p-1.5 bg-stone-200 text-stone-600 rounded-lg hover:bg-stone-300"
                                                        title="Hætta við"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={item.id}
                                            className={`group/item flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                                isOut
                                                    ? 'bg-amber/5 border-amber/20 text-stone-700'
                                                    : 'bg-stone-50 border-stone-100 text-stone-700 hover:border-stone-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                                <span className="text-xs font-bold truncate text-[#1a1a1a]">
                                                    {item.name}
                                                </span>
                                                {item.quantity && (
                                                    <span className="text-[10px] font-medium bg-stone-200/60 text-stone-600 px-1.5 py-0.5 rounded-md shrink-0">
                                                        {item.quantity}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {/* Edit & Delete Controls (visible on hover or always on touch) */}
                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(item)}
                                                    className="opacity-0 group-hover/item:opacity-100 p-1 text-stone-400 hover:text-amber transition-opacity"
                                                    title="Breyta"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="opacity-0 group-hover/item:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-opacity mr-1"
                                                    title="Eyða"
                                                >
                                                    <Trash2 size={12} />
                                                </button>

                                                {/* Status Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(item)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                        isOut
                                                            ? 'bg-amber text-[#1a1a1a] shadow-sm'
                                                            : 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                                                    }`}
                                                >
                                                    {isOut ? 'Á þrotum' : 'Til'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
