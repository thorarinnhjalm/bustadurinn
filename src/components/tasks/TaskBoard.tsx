import { useState } from 'react';

import type { Task, TaskStatus } from '@/types/models';

interface TaskBoardProps {
    tasks: Task[];
    onStatusChange: (task: Task, newStatus: TaskStatus) => void;
    onDelete: (task: Task) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'pending', label: 'Óunnið', color: 'bg-grey-warm' },
    { id: 'in_progress', label: 'Í vinnslu', color: 'bg-amber/20' },
    { id: 'completed', label: 'Lokið', color: 'bg-green-100' }
];

export default function TaskBoard({ tasks, onStatusChange, onDelete }: TaskBoardProps) {
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
        // Transparent drag image or default
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        if (draggedTaskId) {
            const task = tasks.find(t => t.id === draggedTaskId);
            if (task && task.status !== status) {
                onStatusChange(task, status);
            }
            setDraggedTaskId(null);
        }
    };

    const getColumnTasks = (status: TaskStatus) => {
        return tasks.filter(t => t.status === status);
    };

    return (
        <div className="flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-250px)] min-h-[500px]">
            {COLUMNS.map(col => (
                <div
                    key={col.id}
                    className="flex-1 min-w-[300px] flex flex-col bg-bone/50 rounded-xl border border-grey-warm/50"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                >
                    {/* Column Header */}
                    <div className="p-4 flex items-center justify-between border-b border-grey-warm/50">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${col.id === 'completed' ? 'bg-green-500' :
                                col.id === 'in_progress' ? 'bg-amber' : 'bg-grey-mid'
                                }`} />
                            <h3 className="font-medium text-charcoal">{col.label}</h3>
                            <span className="text-xs text-grey-mid bg-white px-2 py-0.5 rounded-full border border-grey-warm">
                                {getColumnTasks(col.id).length}
                            </span>
                        </div>
                    </div>

                    {/* Draggable Area */}
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                        {getColumnTasks(col.id).map(task => (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                className={`
                                    bg-white p-4 rounded-lg shadow-sm border border-grey-warm 
                                    cursor-grab active:cursor-grabbing hover:shadow-md transition-all
                                    ${draggedTaskId === task.id ? 'opacity-50' : 'opacity-100'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-charcoal text-sm">{task.title}</h4>
                                    <button
                                        onClick={() => onDelete(task)}
                                        className="text-grey-warm hover:text-red-500 transition-colors p-1 -mr-2 -mt-2"
                                    >
                                        <div className="sr-only">Delete</div>
                                        <div className="w-4 h-4 rounded-full border-2 border-current" />
                                    </button>
                                </div>

                                {task.description && (
                                    <p className="text-xs text-grey-mid mb-3 line-clamp-2">
                                        {task.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-bone">
                                    <div className="flex items-center gap-2">
                                        {task.assigned_to_name && (
                                            <div className="w-6 h-6 rounded-full bg-charcoal text-white text-[10px] flex items-center justify-center" title={task.assigned_to_name}>
                                                {task.assigned_to_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    {task.due_date && (
                                        <div className="text-[10px] text-grey-mid bg-bone px-1.5 py-0.5 rounded">
                                            {new Date(task.due_date).toLocaleDateString('is-IS', { day: 'numeric', month: 'short' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
