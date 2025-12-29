/**
 * Public Sandbox - Visual Showcase
 * Show visitors how the real system works and looks
 */

import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, CheckSquare, Home, ArrowLeft, Eye } from 'lucide-react';

export default function SandboxPage() {
    const navigate = useNavigate();

    // Mock UI previews - showing the actual design
    const previews = [
        {
            id: 'calendar',
            title: 'Bókunardagatal',
            description: 'Einfalt dagatal með sanngjarni - kerfið reiknar út forgang sjálfkrafa',
            icon: Calendar,
            color: 'bg-amber',
            mockup: (
                <div className="bg-white rounded-lg border border-stone-200 p-6">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-serif font-semibold">Janúar 2025</h3>
                        <button className="btn btn-primary bg-amber text-charcoal px-4 py-2 text-sm">
                            + Ný bókun
                        </button>
                    </div>
                    {/* Mini Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 text-center text-sm">
                        {['M', 'Þ', 'M', 'F', 'F', 'L', 'S'].map((day, i) => (
                            <div key={i} className="text-grey-mid font-medium">{day}</div>
                        ))}
                        {[...Array(31)].map((_, i) => (
                            <div key={i} className={`p-2 rounded ${i === 10 || i === 11 ? 'bg-amber/20 text-amber font-semibold' :
                                i === 24 ? 'bg-green-100 text-green-700' :
                                    'hover:bg-stone-50'
                                }`}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-amber/5 border-l-4 border-amber rounded text-sm">
                        <p className="font-medium">Jón Jónsson · 11-13 jan</p>
                        <p className="text-grey-mid text-xs mt-1">Fjölskylduhelgi</p>
                    </div>
                </div>
            )
        },
        {
            id: 'finance',
            title: 'Hússjóður',
            description: 'Haltu utan um tekjur og gjöld - sjáðu strax ef þú ert í mínus',
            icon: DollarSign,
            color: 'bg-green-500',
            mockup: (
                <div className="bg-white rounded-lg border border-stone-200 p-6">
                    {/* Balance Card */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 mb-6">
                        <p className="text-sm opacity-90 mb-2">Staða hússjóðs</p>
                        <p className="text-4xl font-bold font-mono">342.500 kr</p>
                    </div>
                    {/* Transactions */}
                    <div className="space-y-3">
                        {[
                            { label: 'Rafmagn - des', amount: '−45.000', type: 'expense' },
                            { label: 'Leigjutekjur', amount: '+150.000', type: 'income' },
                            { label: 'Viðhald', amount: '−12.500', type: 'expense' }
                        ].map((tx, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border border-stone-200 rounded">
                                <span className="text-sm">{tx.label}</span>
                                <span className={`font-mono font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                                    }`}>{tx.amount} kr</span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 'tasks',
            title: 'Verkefni',
            description: 'Halda utan um viðhald - úthluta verkefnum til meðeigenda',
            icon: CheckSquare,
            color: 'bg-blue-500',
            mockup: (
                <div className="bg-white rounded-lg border border-stone-200 p-6">
                    <button className="btn btn-primary bg-blue-500 text-white px-4 py-2 text-sm mb-6 w-full">
                        + Nýtt verkefni
                    </button>
                    <div className="space-y-3">
                        {[
                            { task: 'Laga skemmda ljósaperu', status: 'pending', assignee: 'Jón' },
                            { task: 'Mála verönd', status: 'in_progress', assignee: 'Guðrún' },
                            { task: 'Hreinsa flísar', status: 'completed', assignee: 'Ólafur' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 border border-stone-200 rounded">
                                <input
                                    type="checkbox"
                                    checked={item.status === 'completed'}
                                    className="w-5 h-5"
                                    readOnly
                                />
                                <div className="flex-1">
                                    <p className={`text-sm ${item.status === 'completed' ? 'line-through text-grey-mid' : ''}`}>
                                        {item.task}
                                    </p>
                                    <p className="text-xs text-grey-mid">→ {item.assignee}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 'settings',
            title: 'Hússtillingar',
            description: 'WiFi, húsreglur, aðgangsleiðbeiningar fyrir leigjendur',
            icon: Home,
            color: 'bg-purple-500',
            mockup: (
                <div className="bg-white rounded-lg border border-stone-200 p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-grey-dark block mb-2">WiFi Network</label>
                            <input
                                type="text"
                                value="SumarhusWiFi"
                                className="w-full px-4 py-2 border border-stone-300 rounded text-sm"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-grey-dark block mb-2">Lykilorð</label>
                            <input
                                type="password"
                                value="thingvellir2025"
                                className="w-full px-4 py-2 border border-stone-300 rounded text-sm"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-grey-dark block mb-2">Húsreglur</label>
                            <textarea
                                className="w-full px-4 py-2 border border-stone-300 rounded text-sm"
                                rows={3}
                                defaultValue="1. Hafðu hvíta sófann hreinan&#10;2. Slökktu á ljósum&#10;3. Njóttu vel!"
                                readOnly
                            />
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-bone">
            {/* Demo Banner */}
            <div className="bg-amber text-charcoal px-6 py-4 border-b-2 border-charcoal sticky top-0 z-50">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5" />
                        <div>
                            <p className="font-bold text-sm">Sýnishorn</p>
                            <p className="text-xs opacity-80">Sjáðu hvernig kerfið virkar</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="btn btn-ghost text-sm flex items-center gap-2 border border-charcoal/20 hover:bg-charcoal/10"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Til baka
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="btn btn-primary bg-charcoal text-bone hover:bg-charcoal/90 text-sm"
                        >
                            Búa til eigið hús →
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-serif font-bold mb-6">Sjáðu kerfið í vinnslu</h1>
                    <p className="text-xl text-grey-dark max-w-3xl mx-auto leading-relaxed">
                        Þetta er alvöru viðmótið frá <strong>Sumarbústaður við Þingvallavatn</strong>.
                        Fágað, einfallt, og hannað fyrir íslenskar þarfir.
                    </p>
                </div>

                {/* Feature Showcases */}
                <div className="space-y-12 max-w-5xl mx-auto">
                    {previews.map((preview, idx) => (
                        <div key={preview.id} className={`${idx % 2 === 0 ? '' : 'flex flex-row-reverse'}`}>
                            <div className="grid md:grid-cols-2 gap-8 items-center">
                                {/* Description */}
                                <div className="space-y-4">
                                    <div className={`w-14 h-14 ${preview.color} rounded-lg flex items-center justify-center`}>
                                        <preview.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-serif font-bold">{preview.title}</h2>
                                    <p className="text-lg text-grey-dark leading-relaxed">{preview.description}</p>
                                </div>

                                {/* Live Preview */}
                                <div className="transform hover:scale-[1.02] transition-transform">
                                    {preview.mockup}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-16 p-12 card max-w-3xl mx-auto">
                    <h3 className="text-3xl font-serif font-bold mb-4">Tilbúinn að byrja?</h3>
                    <p className="text-grey-dark mb-8">
                        Búðu til þitt eigið sumarhús og fáðu aðgang að öllu þessu og meira.
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark text-lg px-12 py-4"
                    >
                        Byrja núna - Frítt í 14 daga →
                    </button>
                </div>
            </div>
        </div>
    );
}
