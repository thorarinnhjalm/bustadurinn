import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { ArrowLeft, Play, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MigrationPage() {
    const navigate = useNavigate();
    const { user: currentUser } = useEffectiveUser();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    const isSuperAdmin = currentUser?.email === 'thorarinnhjalmarsson@gmail.com' || currentUser?.email === 'thorarinnhjalm@gmail.com';

    const log = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const migrateCollection = async (houseId: string, collectionName: string) => {
        log(`Migrating ${collectionName} for house ${houseId}...`);
        try {
            // Query legacy top-level collection
            const q = query(collection(db, collectionName), where('house_id', '==', houseId));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                log(`No documents found in ${collectionName} for house ${houseId}`);
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
            log(`Migrated ${count} documents in ${collectionName}`);
            return count;
        } catch (error) {
            console.error(`Error migrating ${collectionName}:`, error);
            log(`ERROR migrating ${collectionName}: ${error}`);
            return 0;
        }
    };

    const handleMigration = async () => {
        if (!confirm('Are you sure you want to start the migration? This will copy data to subcollections.')) return;

        setLoading(true);
        setLogs([]);

        try {
            log("Fetching all houses...");
            const housesSnap = await getDocs(collection(db, 'houses'));
            const houses = housesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

            log(`Found ${houses.length} houses.`);

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
                log(`Processing House: ${house.name || house.id} (${house.id})`);

                for (const colName of collectionsToMigrate) {
                    await migrateCollection(house.id, colName);
                }

                completed++;
                setProgress((completed / houses.length) * 100);
            }

            log("Migration Completed Successfully!");

        } catch (e: any) {
            log(`FATAL ERROR: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isSuperAdmin) {
        return (
            <div className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold">Aðgangur bannaður</h1>
                <p>Aðeins kerfisstjórar mega framkvæma gagnafærslur.</p>
                <button onClick={() => navigate('/')} className="mt-4 btn btn-primary">Heim</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bone p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-stone-200 rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-serif font-bold">Gagnafærsla (Migration Tool)</h1>
                </div>

                <div className="card mb-8">
                    <h2 className="text-lg font-bold mb-4">Flytja gögn í undirsöfn (Subcollections)</h2>
                    <p className="mb-6 text-grey-dark">
                        Þetta tól mun fara í gegnum öll hús og afrita gögn úr gömlu söfnunum (bookings, tasks, osfrv.)
                        yfir í nýju undirsöfnin (/houses/ID/...).
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={handleMigration}
                            disabled={loading}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            Byrja Færslu
                        </button>
                    </div>

                    {loading && (
                        <div className="mt-4">
                            <div className="w-full bg-stone-200 rounded-full h-2.5">
                                <div className="bg-amber h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-right text-xs mt-1 text-grey-mid">{Math.round(progress)}%</p>
                        </div>
                    )}
                </div>

                <div className="bg-charcoal text-green-400 font-mono p-4 rounded-lg h-96 overflow-y-auto text-sm">
                    {logs.length === 0 ? (
                        <span className="opacity-50">// Logs will appear here...</span>
                    ) : (
                        logs.map((L, i) => <div key={i}>{L}</div>)
                    )}
                </div>
            </div>
        </div>
    );
}
