import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { useUserRole } from '@/hooks/useUserRole';
import { ArrowLeft, Play, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/ui/Modal';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';

export default function MigrationPage() {
    const navigate = useNavigate();
    const { user: currentUser } = useEffectiveUser();
    const { systemRole } = useUserRole(currentUser?.uid);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const isSuperAdmin = systemRole === 'super_admin';

    const log = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString('is-IS')}: ${msg}`]);

    const migrateCollection = async (houseId: string, collectionName: string) => {
        log(`Færi ${collectionName} fyrir hús ${houseId}...`);
        try {
            // Query legacy top-level collection
            const q = query(collection(db, collectionName), where('house_id', '==', houseId));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                log(`Engin skjöl fundust í ${collectionName} fyrir hús ${houseId}`);
                return 0;
            }

            const batch = writeBatch(db);
            let count = 0;

            for (const docSnapshot of snapshot.docs) {
                const data = docSnapshot.data();
                // Create ref in new subcollection
                const newRef = doc(db, 'houses', houseId, collectionName, docSnapshot.id);
                // Set data (will overwrite if exists, which is fine for migration)
                batch.set(newRef, data);
                count++;
            }

            await batch.commit();
            log(`Færði ${count} skjöl í ${collectionName}`);
            return count;
        } catch (error) {
            logger.error(`Error migrating ${collectionName}:`, error);
            log(`VILLA við færslu á ${collectionName}: ${getUserMessage(error)}`);
            return 0;
        }
    };

    const handleMigration = async () => {
        setConfirmOpen(false);
        setLoading(true);
        setLogs([]);

        try {
            log("Sæki öll hús...");
            const housesSnap = await getDocs(collection(db, 'houses'));
            const houses = housesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

            log(`Fann ${houses.length} hús.`);

            let completed = 0;
            const collectionsToMigrate = [
                'bookings',
                'tasks',
                'shopping_list',
                'internal_logs',
                'finance_entries',
                'budget_plans'
            ];

            for (const house of houses) {
                log(`Vinn hús: ${house.name || house.id} (${house.id})`);

                for (const colName of collectionsToMigrate) {
                    await migrateCollection(house.id, colName);
                }

                completed++;
                setProgress((completed / houses.length) * 100);
            }

            log("Gagnafærslu lokið!");

        } catch (e: any) {
            logger.error('Migration failed:', e);
            log(`ALVARLEG VILLA: ${getUserMessage(e)}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isSuperAdmin) {
        return (
            <div className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
                <h1 className="text-xl font-bold">Aðgangur bannaður</h1>
                <p>Aðeins kerfisstjórar mega framkvæma gagnafærslur.</p>
                <button type="button" onClick={() => navigate('/')} className="mt-4 btn btn-primary">Heim</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bone p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button type="button" onClick={() => navigate('/dashboard')} aria-label="Til baka á stjórnborð" className="p-2 hover:bg-stone-200 rounded-full">
                        <ArrowLeft className="w-6 h-6" aria-hidden="true" />
                    </button>
                    <h1 className="text-2xl font-serif font-bold">Gagnafærsla</h1>
                </div>

                <div className="card mb-8">
                    <h2 className="text-lg font-bold mb-4">Flytja gögn í undirsöfn (Subcollections)</h2>
                    <p className="mb-6 text-grey-dark">
                        Þetta tól mun fara í gegnum öll hús og afrita gögn úr gömlu söfnunum (bookings, tasks, osfrv.)
                        yfir í nýju undirsöfnin (/houses/ID/...).
                    </p>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setConfirmOpen(true)}
                            disabled={loading}
                            aria-busy={loading}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
                            Byrja Færslu
                        </button>
                    </div>

                    {loading && (
                        <div className="mt-4">
                            <div
                                className="w-full bg-stone-200 rounded-full h-2.5"
                                role="progressbar"
                                aria-label="Framvinda gagnafærslu"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Math.round(progress)}
                            >
                                <div className="bg-amber h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-right text-xs mt-1 text-grey-mid">{Math.round(progress)}%</p>
                        </div>
                    )}
                </div>

                <div
                    role="log"
                    aria-label="Færsluskrá"
                    tabIndex={0}
                    className="bg-charcoal text-green-400 font-mono p-4 rounded-lg h-96 overflow-y-auto text-sm"
                >
                    {logs.length === 0 ? (
                        <span className="text-stone-300">// Skrár birtast hér...</span>
                    ) : (
                        logs.map((L, i) => <div key={i}>{L}</div>)
                    )}
                </div>
            </div>

            <Modal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title="Hefja gagnafærslu?"
                size="sm"
                footer={
                    <>
                        <button type="button" className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>
                            Hætta við
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleMigration}>
                            Já, hefja færslu
                        </button>
                    </>
                }
            >
                <p className="text-grey-dark">
                    Þetta afritar gögn úr gömlu söfnunum yfir í undirsöfn hvers húss. Ertu viss um að þú viljir hefja færsluna?
                </p>
            </Modal>
        </div>
    );
}
