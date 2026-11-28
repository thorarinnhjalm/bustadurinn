/**
 * Data Table Component - High-density admin tables
 * Sortable, searchable, professional
 */

import { useId, useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    searchKeys?: string[];
    actions?: (row: T) => React.ReactNode;
    caption?: string;
}

export default function DataTable<T extends Record<string, any>>({
    columns,
    data,
    searchKeys = [],
    actions,
    caption = 'Gagnatafla'
}: DataTableProps<T>) {
    const searchId = useId();
    const [sortKey, setSortKey] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    // Handle sorting
    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    // Filter data by search
    const filteredData = data.filter(row => {
        if (!searchTerm) return true;
        return searchKeys.some(key => {
            const value = row[key];
            return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
    });

    // Sort data
    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortKey) return 0;

        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal === bVal) return 0;

        const comparison = aVal > bVal ? 1 : -1;
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    return (
        <div className="space-y-4">
            {/* Search */}
            {searchKeys.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" aria-hidden="true" />
                    <label htmlFor={searchId} className="sr-only">Leita í töflu</label>
                    <input
                        id={searchId}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Leita..."
                        className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent"
                    />
                </div>
            )}

            {/* Table */}
            <div className="border border-stone-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <caption className="sr-only">{caption}</caption>
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    aria-sort={column.sortable ? (sortKey === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                                    className="px-4 py-3 text-left font-medium text-stone-700"
                                >
                                    {column.sortable ? (
                                        <button
                                            type="button"
                                            onClick={() => handleSort(column.key)}
                                            className="flex items-center gap-1 hover:text-amber-ink transition-colors"
                                        >
                                            {column.label}
                                            {sortKey === column.key && (
                                                sortDirection === 'asc' ?
                                                    <ChevronUp className="w-4 h-4" aria-hidden="true" /> :
                                                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                                            )}
                                        </button>
                                    ) : (
                                        column.label
                                    )}
                                </th>
                            ))}
                            {actions && <th scope="col" className="px-4 py-3 text-left font-medium text-stone-700">Aðgerðir</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-stone-500">
                                    Engin gögn fundust
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-stone-50 transition-colors">
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-4 py-3 text-stone-900">
                                            {column.render ? column.render(row) : row[column.key]}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-4 py-3">
                                            {actions(row)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Results count */}
            <p className="text-xs text-stone-500">
                Sýni {sortedData.length} af {data.length} niðurstöðum
            </p>
        </div>
    );
}
