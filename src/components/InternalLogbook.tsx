import { useState } from 'react';
import { Clock } from 'lucide-react';
import type { InternalLog } from '@/types/models';
import { formatDistanceToNow } from 'date-fns';
import { is } from 'date-fns/locale';

interface InternalLogbookProps {
    logs: InternalLog[];
    currentUserName: string;
    onAddLog: (text: string) => void;
}

export default function InternalLogbook({ logs, currentUserName, onAddLog }: InternalLogbookProps) {
    const [newLog, setNewLog] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newLog.trim()) {
            onAddLog(newLog.trim());
            setNewLog('');
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getTimeAgo = (date: Date) => {
        try {
            return formatDistanceToNow(date, { addSuffix: true, locale: is });
        } catch {
            return date.toLocaleDateString('is-IS');
        }
    };

    return (
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-4 space-y-6">
            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="w-8 h-8 bg-amber rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {getInitials(currentUserName)}
                </div>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                        placeholder="Skrifa færslu..."
                        className="w-full bg-stone-50 border border-stone-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber transition-shadow"
                    />
                </div>
            </form>

            {/* Timeline */}
            {logs.length > 0 ? (
                <div className="relative pl-4 border-l-2 border-stone-100 space-y-6">
                    {logs.map((log, idx) => (
                        <div key={log.id} className="relative">
                            <div className="absolute -left-[21px] top-0 w-3 h-3 bg-stone-200 rounded-full border-2 border-white"></div>
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-bold text-[#1a1a1a]">{log.user_name}</p>
                                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                                    <Clock size={10} /> {getTimeAgo(log.created_at)}
                                </span>
                            </div>
                            <div className="bg-stone-50 p-3 rounded-lg rounded-tl-none text-sm text-stone-600 border border-stone-100/50">
                                {log.text}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-stone-400 text-sm">
                    Engar færslur ennþá. Vertu fyrstur til að skrifa!
                </div>
            )}
        </div>
    );
}
