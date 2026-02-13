import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, TaskStatus, TaskPriority, TaskCategory, House, User } from '@/types/models';
import { Plus, Calendar, DollarSign, Check, Trash2 } from 'lucide-react';

interface TaskManagerProps {
    house: House;
    currentUser: User;
    members: User[];
}

export default function TaskManager({ house, currentUser, members }: TaskManagerProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'maintenance' as TaskCategory,
        priority: 'medium' as TaskPriority,
        due_date: '',
        estimated_cost: '',
        assigned_to: [] as string[],
    });

    // Fetch tasks
    useEffect(() => {
        if (!house?.id) return;

        const q = query(
            collection(db, 'houses', house.id, 'tasks'),
            orderBy('created_at', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const taskList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                created_at: doc.data().created_at?.toDate() || new Date(),
                updated_at: doc.data().updated_at?.toDate() || new Date(),
                due_date: doc.data().due_date?.toDate(),
                completed_at: doc.data().completed_at?.toDate(),
            })) as Task[];
            setTasks(taskList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [house?.id]);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !house?.id) return;

        try {
            const newTask: Partial<Task> = {
                house_id: house.id,
                title: formData.title,
                description: formData.description || undefined,
                category: formData.category,
                priority: formData.priority,
                status: 'pending',
                created_by: currentUser.uid,
                created_by_name: currentUser.name,
                assigned_to: formData.assigned_to.length > 0 ? formData.assigned_to : undefined,
                assigned_to_names: formData.assigned_to.map(uid =>
                    members.find(m => m.uid === uid)?.name || 'Unknown'
                ),
                due_date: formData.due_date ? Timestamp.fromDate(new Date(formData.due_date)) as any : undefined,
                estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : undefined,
                created_at: Timestamp.now() as any,
                updated_at: Timestamp.now() as any,
            };

            await addDoc(collection(db, 'houses', house.id, 'tasks'), newTask);

            // Reset form
            setFormData({
                title: '',
                description: '',
                category: 'maintenance',
                priority: 'medium',
                due_date: '',
                estimated_cost: '',
                assigned_to: [],
            });
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const handleUpdateStatus = async (task: Task, newStatus: TaskStatus) => {
        if (!house?.id) return;

        try {
            const updates: Partial<Task> = {
                status: newStatus,
                updated_at: Timestamp.now() as any,
            };

            if (newStatus === 'completed') {
                updates.completed_at = Timestamp.now() as any;
            }

            await updateDoc(doc(db, 'houses', house.id, 'tasks', task.id), updates as any);
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!house?.id || !confirm('Ertu viss um að þú viljir eyða þessu verkefni?')) return;

        try {
            await deleteDoc(doc(db, 'houses', house.id, 'tasks', taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    const getCategoryIcon = () => {
        // Simple placeholder - can be expanded later
        return '📋';
    };

    if (loading) {
        return <div className="text-center py-8 text-stone-500">Hleð verkefnum...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-charcoal">Verkefni & Viðhald</h3>
                    <p className="text-sm text-stone-500">{tasks.length} verkefni samtals</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={16} />
                    Nýtt verkefni
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <form onSubmit={handleCreateTask} className="bg-bone p-6 rounded-xl border-2 border-amber/20 space-y-4">
                    <h4 className="font-bold text-charcoal mb-4">Nýtt verkefni</h4>

                    <div>
                        <label className="label">Titill *</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="t.d. Skipta um ljósaperu"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Lýsing</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Nánar um verkefnið..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Flokkur</label>
                            <select
                                className="input"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                            >
                                <option value="maintenance">Viðhald</option>
                                <option value="repair">Viðgerð</option>
                                <option value="improvement">Umbætur</option>
                                <option value="cleaning">Þrif</option>
                                <option value="other">Annað</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Forgangur</label>
                            <select
                                className="input"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                            >
                                <option value="low">Lítill</option>
                                <option value="medium">Miðlungs</option>
                                <option value="high">Mikill</option>
                                <option value="urgent">Brýnt</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Tímasetning</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">Áætlaður kostnaður (kr.)</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.estimated_cost}
                                onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button type="submit" className="btn btn-primary">
                            Stofna verkefni
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(false)}
                            className="btn btn-ghost"
                        >
                            Hætta við
                        </button>
                    </div>
                </form>
            )}

            {/* Task List */}
            <div className="space-y-3">
                {tasks.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                        <p>Engin verkefni enn. Smelltu á "Nýtt verkefni" til að byrja!</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div
                            key={task.id}
                            className="bg-white p-4 rounded-lg border border-stone-200 hover:border-amber-200 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">{getCategoryIcon()}</span>
                                        <h4 className="font-bold text-charcoal">{task.title}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </div>

                                    {task.description && (
                                        <p className="text-sm text-stone-600 mb-2">{task.description}</p>
                                    )}

                                    <div className="flex flex-wrap gap-3 text-xs text-stone-500">
                                        {task.due_date && (
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(task.due_date).toLocaleDateString('is-IS')}
                                            </div>
                                        )}
                                        {task.estimated_cost && (
                                            <div className="flex items-center gap-1">
                                                <DollarSign size={12} />
                                                {task.estimated_cost.toLocaleString('is-IS')} kr.
                                            </div>
                                        )}
                                        {task.created_by_name && (
                                            <div>Stofnað af: {task.created_by_name}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {task.status !== 'completed' && (
                                        <button
                                            onClick={() => handleUpdateStatus(task, 'completed')}
                                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Merkja sem lokið"
                                        >
                                            <Check size={16} className="text-green-600" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eyða"
                                    >
                                        <Trash2 size={16} className="text-red-600" />
                                    </button>
                                </div>
                            </div>

                            {task.status === 'completed' && (
                                <div className="mt-3 pt-3 border-t border-stone-100">
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <Check size={14} />
                                        <span>Lokið {task.completed_at && new Date(task.completed_at).toLocaleDateString('is-IS')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
