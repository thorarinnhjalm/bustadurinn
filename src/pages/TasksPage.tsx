import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckSquare,
    Plus,
    ArrowLeft,
    List,
    Layout
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import type { Task, TaskStatus } from '@/types/models';
import TaskForm from '@/components/tasks/TaskForm';
import TaskList from '@/components/tasks/TaskList';
import TaskBoard from '@/components/tasks/TaskBoard';
import MobileNav from '@/components/MobileNav';

export default function TasksPage() {
    const navigate = useNavigate();
    const { user: currentUser } = useEffectiveUser();
    const currentHouse = useAppStore((state) => state.currentHouse);
    const [view, setView] = useState<'list' | 'board'>('list');
    const [filter, setFilter] = useState<'all' | 'mine'>('all');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentHouse?.id) return;

        const q = query(
            collection(db, 'houses', currentHouse.id, 'tasks')
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
    }, [currentHouse?.id]);

    const handleCreateTask = async (taskData: Partial<Task>) => {
        if (!currentHouse?.id || !currentUser) return;

        try {
            await addDoc(collection(db, 'houses', currentHouse.id, 'tasks'), {
                ...taskData,
                house_id: currentHouse.id,
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
        if (!currentHouse?.id) return;
        try {
            await updateDoc(doc(db, 'houses', currentHouse.id, 'tasks', task.id), {
                status: newStatus,
                completed_at: newStatus === 'completed' ? serverTimestamp() : null
            });
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleDeleteTask = async (task: Task) => {
        if (!currentHouse?.id) return;
        if (!confirm('Ertu viss um að þú viljir eyða þessu verkefni?')) return;
        try {
            await deleteDoc(doc(db, 'houses', currentHouse.id, 'tasks', task.id));
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
                        title="List view"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setView('board')}
                        className={`p-1.5 rounded transition-colors ${view === 'board' ? 'bg-bone text-charcoal' : 'text-grey-mid'}`}
                        title="Board view"
                    >
                        <Layout className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content  */}
            <div className={`max-w-5xl mx-auto ${view === 'board' ? 'overflow-x-hidden' : ''}`}>
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
                ) : filteredTasks.length === 0 && !showForm ? (
                    <div className="text-center py-24 text-grey-mid border-2 border-dashed border-grey-warm rounded-xl">
                        <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-charcoal mb-2">Engin verkefni fundust</h3>
                        <p className="mb-6">Búðu til nýtt verkefni til að byrja.</p>
                        <button onClick={() => setShowForm(true)} className="btn btn-ghost text-primary">
                            Búa til verkefni
                        </button>
                    </div>
                ) : (
                    <>
                        {view === 'list' ? (
                            <TaskList
                                tasks={filteredTasks}
                                onStatusChange={handleUpdateStatus}
                                onDelete={handleDeleteTask}
                            />
                        ) : (
                            <TaskBoard
                                tasks={filteredTasks}
                                onStatusChange={handleUpdateStatus}
                                onDelete={handleDeleteTask}
                            />
                        )}
                    </>
                )}
            </div>
            <MobileNav />
        </div>
    );
}
