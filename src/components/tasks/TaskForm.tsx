import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Task, TaskStatus } from '@/types/models';

interface TaskFormProps {
    onSave: (task: Partial<Task>) => void;
    onCancel: () => void;
    members?: { uid: string; name: string }[];
}

export default function TaskForm({ onSave, onCancel, members = [] }: TaskFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status] = useState<TaskStatus>('pending');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        const assignedMember = members.find(m => m.uid === assignedTo);

        onSave({
            title,
            description,
            status,
            assigned_to: assignedTo || undefined,
            assigned_to_name: assignedMember?.name,
            due_date: dueDate ? new Date(dueDate) : undefined,
            created_at: new Date()
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-bone p-4 rounded-lg border border-grey-warm mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-charcoal">Nýtt verkefni</h3>
                <button type="button" onClick={onCancel} className="text-grey-mid hover:text-charcoal">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="label">Titill</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="t.d. Mála pallinn..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <div>
                    <label className="label">Lýsing (valfrjálst)</label>
                    <textarea
                        className="input min-h-[80px]"
                        placeholder="Nánari lýsing á verkinu..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Ábyrgðarmaður (valfrjálst)</label>
                        <div className="relative">
                            <select
                                className="input w-full"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                            >
                                <option value="">Enginn valinn</option>
                                {members.map(member => (
                                    <option key={member.uid} value={member.uid}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">Lokadagur (valfrjálst)</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="input w-full"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <button type="submit" className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Búa til verkefni
                </button>
            </div>
        </form>
    );
}
