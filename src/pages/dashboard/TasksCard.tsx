import { Link } from 'react-router-dom';
import { ChevronRight, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import type { Task } from '@/types/models';

interface TasksCardProps {
    tasks: Task[];
}

/** TASKS */
export default function TasksCard({ tasks }: TasksCardProps) {
    return (
        <section className="group relative cursor-pointer">
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Verkefni</h3>
                <Link
                    to="/tasks"
                    aria-label="Opna verkefnalistann"
                    className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-amber group-hover:text-charcoal transition-colors after:absolute after:inset-0 after:z-[15]"
                >
                    <ChevronRight size={18} aria-hidden="true" />
                </Link>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300 min-h-[200px]">
                {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-6">
                        <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mb-3" aria-hidden="true">
                            <CheckSquare size={20} />
                        </div>
                        <p className="font-bold text-[#1a1a1a]">Ekkert á listanum</p>
                        <p className="text-xs text-stone-500">Bústaðurinn er í toppstandi!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                                <div aria-hidden="true" className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-500' : 'bg-blue-500'
                                    }`} />
                                <div className="flex-1 min-w-0">
                                    {(task.priority === 'high' || task.priority === 'urgent') && (
                                        <span className="sr-only">Áríðandi: </span>
                                    )}
                                    <p className="font-bold text-[#1a1a1a] text-sm truncate">{task.title}</p>
                                    <p className="text-[10px] text-stone-500 truncate">
                                        {task.assigned_to_names && task.assigned_to_names.length > 0
                                            ? `Ábyrgð: ${task.assigned_to_names[0].split(' ')[0]}`
                                            : 'Óúthlutað'}
                                    </p>
                                </div>
                                {task.due_date && (
                                    <span className="text-[10px] bg-white px-2 py-1 rounded-md border border-stone-200 text-stone-500 whitespace-nowrap">
                                        {format(task.due_date, 'd. MMM', { locale: is })}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
