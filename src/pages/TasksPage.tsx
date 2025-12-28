import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckSquare,
    Plus,
    ArrowLeft,
    Filter,
    Layout
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export default function TasksPage() {
    const navigate = useNavigate();
    const { currentUser } = useAppStore();
    const [view, setView] = useState<'list' | 'board'>('list');

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
                    <button className="btn btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Nýtt verkefni
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center bg-white p-2 rounded-lg border border-grey-warm">
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-sm font-medium text-charcoal bg-bone rounded-md">
                        Öll verkefni
                    </button>
                    <button className="px-3 py-1.5 text-sm text-grey-mid hover:text-charcoal hover:bg-bone rounded-md transition-colors">
                        Mín verkefni
                    </button>
                </div>
                <div className="flex gap-2 border-l border-grey-warm pl-2">
                    <button
                        onClick={() => setView('list')}
                        className={`p-1.5 rounded hover:bg-bone transition-colors ${view === 'list' ? 'text-charcoal' : 'text-grey-mid'}`}
                    >
                        <Layout className="w-4 h-4" />
                    </button>
                    {/* Board view disabled for MVP */}
                    {/* <button className="p-1.5 rounded text-grey-mid">
                        <Grid className="w-4 h-4" />
                    </button> */}
                    <button className="p-1.5 rounded text-grey-mid hover:text-charcoal hover:bg-bone">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Placeholder */}
            <div className="max-w-5xl mx-auto">
                <div className="text-center py-24 text-grey-mid border-2 border-dashed border-grey-warm rounded-xl">
                    <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-medium text-charcoal mb-2">Engin verkefni</h3>
                    <p className="mb-6">Búðu til verkefnalista fyrir sumarbústaðinn.</p>
                </div>
            </div>
        </div>
    );
}
