import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckSquare,
    Plus,
    ArrowLeft,
    Filter,
    Layout,
    List
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import type { Task, TaskStatus } from '@/types/models';
import TaskForm from '@/components/tasks/TaskForm';
import TaskList from '@/components/tasks/TaskList';

export default function TasksPage() {
    const navigate = useNavigate();
    const { currentUser } = useAppStore();
    const [view, setView] = useState<'list' | 'board'>('list');
    const [filter, setFilter] = useState<'all' | 'mine'>('all');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const houseId = currentUser?.house_ids?.[0];

    useEffect(() => {
        if (!houseId) return;

        const q = query(
            collection(db, 'tasks'),
            where('house_id', '==', houseId)
            // Note: orderBy requires an index if combined with where filter on different field
            // We'll sort in client for now to avoid index creation delay
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                due_date: doc.data().due_date?.toDate(),
                created_at: doc.data().created_at?.toDate()
            })) as Task[];

            // Sort by created_at desc
            const sorted = data.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
            setTasks(sorted);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [houseId]);

    const handleCreateTask = async (taskData: Partial<Task>) => {
        if (!houseId || !currentUser) return;

        try {
            await addDoc(collection(db, 'tasks'), {
                ...taskData,
                house_id: houseId,
                created_by: currentUser.uid,
                created_at: serverTimestamp(),
                status: 'pending'
            });
            setShowForm(false);
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const handleUpdateStatus = async (task: Task, newStatus: TaskStatus) => {
        try {
            await updateDoc(doc(db, 'tasks', task.id), {
                status: newStatus,
                completed_at: newStatus === 'completed' ? serverTimestamp() : null
            });
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleDeleteTask = async (task: Task) => {
        if (!confirm('Ertu viss um að þú viljir eyða þessu verkefni?')) return;
        try {
            await deleteDoc(doc(db, 'tasks', task.id));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    // Filter logic
    const filteredTasks = tasks.filter(task => {
        if (filter === 'mine') {
            return task.assigned_to === currentUser?.uid;
        }
        return true;
    });

    // Members for assignment (Just current user for now, until we handle member fetching)
    const members = currentUser ? [{ uid: currentUser.uid, name: currentUser.name }] : [];

    return (
        <div className="min-h-screen bg-bone p-6 pb-24">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-grey-mid hover:text-charcoal mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Til baka
                </button>

                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-serif text-charcoal mb-2">Verkefni</h1>
                        <p className="text-grey-mid">Umsjón með viðhaldi og verkum</p>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn btn-primary"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nýtt verkefni
                        </button>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center bg-white p-2 rounded-lg border border-grey-warm">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-bone text-charcoal' : 'text-grey-mid hover:text-charcoal'
                            }`}
                    >
                        Öll verkefni
                    </button>
                    <button
                        onClick={() => setFilter('mine')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'mine' ? 'bg-bone text-charcoal' : 'text-grey-mid hover:text-charcoal'
                            }`}
                    >
                        Mín verkefni
                    </button>
                </div>
                <div className="flex gap-2 border-l border-grey-warm pl-2">
                    <button
                        onClick={() => setView('list')}
                        className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-bone text-charcoal' : 'text-grey-mid'}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                    {/* Placeholder for Board View Toggle */}
                    {/* <button className="p-1.5 rounded text-grey-mid">
                        <Layout className="w-4 h-4" />
                    </button> */}
                </div>
            </div>

            {/* Content  */}
            <div className="max-w-5xl mx-auto">
                {showForm && (
                    <div className="mb-8 animate-fade-in">
                        <TaskForm
                            onSave={handleCreateTask}
                            onCancel={() => setShowForm(false)}
                            members={members}
                        />
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-grey-mid">Hleð verkefnum...</div>
                ) : (
                    <TaskList
                        tasks={filteredTasks}
                        onStatusChange={handleUpdateStatus}
                        onDelete={handleDeleteTask}
                        currentUserId={currentUser?.uid || ''}
                    />
                )}

                {!loading && filteredTasks.length === 0 && !showForm && (
                    <div className="text-center py-24 text-grey-mid border-2 border-dashed border-grey-warm rounded-xl">
                        <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-charcoal mb-2">Engin verkefni fundust</h3>
                        <p className="mb-6">Búðu til nýtt verkefni til að byrja.</p>
                        <button onClick={() => setShowForm(true)} className="btn btn-ghost text-primary">
                            Búa til verkefni
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
