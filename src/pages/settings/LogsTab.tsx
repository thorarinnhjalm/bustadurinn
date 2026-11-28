import TaskManager from '@/components/TaskManager';
import type { House, User } from '@/types/models';

interface LogsTabProps {
    house: House | null;
    currentUser: User | null | undefined;
    members: User[];
}

export default function LogsTab({ house, currentUser, members }: LogsTabProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-serif font-bold mb-4">Verkefni & Viðhald</h2>
            <p className="text-stone-500 mb-6">Halda utan um verkefni, viðhald og umbætur á bústaðnum.</p>
            {house && currentUser && (
                <TaskManager
                    house={house}
                    currentUser={currentUser}
                    members={members}
                />
            )}
        </div>
    );
}
