/**
 * Status Badge Component - Color-coded status pills
 */

interface StatusBadgeProps {
    status: 'active' | 'trial' | 'churned' | 'admin';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const styles = {
        active: 'bg-green-100 text-green-700 border-green-200',
        trial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        churned: 'bg-red-100 text-red-700 border-red-200',
        admin: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    const labels = {
        active: '🟢 Active',
        trial: '🟡 Trial',
        churned: '🔴 Churned',
        admin: '🔵 Admin',
    };

    return (
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}
