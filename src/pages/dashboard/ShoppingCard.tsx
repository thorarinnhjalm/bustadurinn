import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingCart, Check } from 'lucide-react';
import { collection, query, getDocs, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { House, User, ShoppingItem } from '@/types/models';
import { logger } from '@/utils/logger';

interface ShoppingCardProps {
    currentHouse: House;
    currentUser: User | null;
    shoppingItems: ShoppingItem[];
}

/** SHOPPING LIST */
export default function ShoppingCard({ currentHouse, currentUser, shoppingItems }: ShoppingCardProps) {
    const handleCheckShoppingItem = async (e: React.MouseEvent, item: ShoppingItem) => {
        e.stopPropagation();
        if (!currentHouse) return;
        try {
            await updateDoc(doc(db, 'houses', currentHouse.id, 'shopping_list', item.id), {
                checked: true,
                checked_by: currentUser?.uid,
                checked_at: serverTimestamp()
            });

            // Bi-directional sync with inventory subcollection
            if (item.item) {
                const qInv = query(collection(db, 'houses', currentHouse.id, 'inventory'));
                const invSnap = await getDocs(qInv);
                for (const docSnap of invSnap.docs) {
                    const invData = docSnap.data();
                    if (invData.name?.trim().toLowerCase() === item.item.trim().toLowerCase() && invData.status === 'out') {
                        await updateDoc(doc(db, 'houses', currentHouse.id, 'inventory', docSnap.id), {
                            status: 'ok',
                            updated_at: serverTimestamp(),
                            updated_by: currentUser?.uid || '',
                            updated_by_name: currentUser?.name || ''
                        });
                    }
                }
            }
        } catch (err) {
            logger.error("Error checking shopping item on dashboard:", err);
        }
    };

    return (
        <section className="group">
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Innkaupalistinn</h3>
                <Link
                    to="/settings?tab=shopping"
                    aria-label="Opna innkaupalistann"
                    className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-amber group-hover:text-charcoal transition-colors"
                >
                    <ChevronRight size={18} aria-hidden="true" />
                </Link>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300 min-h-[200px]">
                {shoppingItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-6">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3" aria-hidden="true">
                            <ShoppingCart size={20} />
                        </div>
                        <p className="font-bold text-[#1a1a1a]">Allt til alls!</p>
                        <p className="text-xs text-stone-500">Enginn hefur skráð vantar efni.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {shoppingItems.map(item => (
                            <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 group/item hover:bg-amber/10 transition-colors">
                                <button
                                    type="button"
                                    onClick={(e) => handleCheckShoppingItem(e, item)}
                                    className="group/check mt-0.5 w-5 h-5 rounded-md border-2 border-stone-400 flex items-center justify-center cursor-pointer hover:border-amber hover:bg-amber/20 transition-colors shrink-0 relative before:absolute before:-inset-1.5 before:content-['']"
                                    title="Merkja sem keypt"
                                    aria-label={`Merkja sem keypt: ${item.item}`}
                                >
                                    <Check size={14} aria-hidden="true" className="text-amber-ink hidden group-hover/item:block group-focus-visible/check:block [@media(hover:none)]:block" />
                                </button>
                                <div>
                                    <p className="font-bold text-[#1a1a1a] text-sm leading-tight">{item.item}</p>
                                    <p className="text-[10px] text-stone-500 mt-0.5">Skráð af {item.added_by_name?.split(' ')[0]}</p>
                                </div>
                            </div>
                        ))}
                        {shoppingItems.length >= 5 && (
                            <p className="text-xs text-center text-stone-500 pt-2">... og fleira</p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
