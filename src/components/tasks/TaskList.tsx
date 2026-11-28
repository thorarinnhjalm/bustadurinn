import {
    CheckCircle,
    Circle,
    Clock,
    Calendar as CalendarIcon,
    User as UserIcon,
    Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import type { Task, TaskStatus } from '@/types/models';

interface TaskListProps {
    tasks: Task[];
    onStatusChange: (task: Task, newStatus: TaskStatus) => void;
    onDelete: (task: Task) => void;

}

export default function TaskList({ tasks, onStatusChange, onDelete }: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 text-grey-mid">
                Engin verkefni fundust.
            </div>
        );
    }

    const getStatusIcon = (status: TaskStatus) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />;
            case 'in_progress':
                return <Clock className="w-5 h-5 text-amber-ink" aria-hidden="true" />;
            default:
                return <Circle className="w-5 h-5 text-grey-mid" aria-hidden="true" />;
        }
    };

    const getStatusLabel = (status: TaskStatus) => {
        switch (status) {
            case 'completed': return 'Lokið';
            case 'in_progress': return 'Í vinnslu';
            default: return 'Óunnið';
        }
    };

    return (
        <div className="space-y-3">
            {tasks.map((task) => (
                <div
                    key={task.id}
                    className={`card flex items-center gap-4 p-4 transition-all hover:shadow-md group ${task.status === 'completed' ? 'opacity-60 bg-bone/50' : ''
                        }`}
                >
                    {/* Status Button */}
                    <button
                        type="button"
                        onClick={() => {
                            const nextStatus = task.status === 'pending' ? 'in_progress'
                                : task.status === 'in_progress' ? 'completed'
                                    : 'pending';
                            onStatusChange(task, nextStatus);
                        }}
                        className="flex-shrink-0 p-1 motion-safe:hover:scale-110 transition-transform"
                        title={`Breyta stöðu: ${getStatusLabel(task.status)}`}
                        aria-label={`Staða: ${getStatusLabel(task.status)}. Breyta stöðu verkefnis: ${task.title}`}
                    >
                        {getStatusIcon(task.status)}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-charcoal truncate ${task.status === 'completed' ? 'line-through' : ''
                            }`}>
                            {task.title}
                        </h4>
                        {task.description && (
                            <p className="text-sm text-grey-mid truncate">
                                {task.description}
                            </p>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 mt-1 text-xs text-grey-mid">
                            {task.due_date && (
                                <div className={`flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'completed'
                                    ? 'text-red-500 font-medium'
                                    : ''
                                    }`}>
                                    <CalendarIcon className="w-3 h-3" aria-hidden="true" />
                                    {format(new Date(task.due_date), 'd. MMM', { locale: is })}
                                </div>
                            )}
                            {task.assigned_to_names && task.assigned_to_names.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <UserIcon className="w-3 h-3" aria-hidden="true" />
                                    {task.assigned_to_names[0]}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onClick={() => onDelete(task)}
                            aria-label={`Eyða verkefni: ${task.title}`}
                            className="p-2 text-grey-mid hover:text-red-500 rounded-full hover:bg-bone transition-colors"
                        >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
