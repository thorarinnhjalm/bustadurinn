/**
 * Public Sandbox Page - Try without signup
 * Uses demo-house-001 (fixed ID)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, CheckSquare, Home, ArrowLeft, Eye } from 'lucide-react';

export default function SandboxPage() {
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState<'dashboard' | 'calendar' | 'finance' | 'tasks'>('dashboard');

    const features = [
        {
            id: 'dashboard',
            icon: Home,
            title: 'Yfirlit',
            description: 'Sjáðu aðalyfirlit sumarhússins',
            color: 'bg-charcoal'
        },
        {
            id: 'calendar',
            icon: Calendar,
            title: 'Bókunardagatal',
            description: 'Skoða bókanir og dagatal',
            color: 'bg-amber'
        },
        {
            id: 'finance',
            icon: DollarSign,
            title: 'Hússjóður',
            description: 'Rekstraráætl og bókhald',
            color: 'bg-green-500'
        },
        {
            id: 'tasks',
            icon: CheckSquare,
            title: 'Verkefni',
            description: 'Viðhaldsverkefni',
            color: 'bg-blue-500'
        }
    ];

    return (
        <div className="min-h-screen bg-bone">
            {/* Demo Banner */}
            <div className="bg-amber text-charcoal px-6 py-4 border-b-2 border-charcoal">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5" />
                        <div>
                            <p className="font-bold text-sm">Prufuumhverfi</p>
                            <p className="text-xs opacity-80">Þetta er sýnishorn. Gögnin endurstillast á 24 klst fresti.</p>
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
                            Byrja núna →
                        </button>
                    </div>
                </div>
            </div>

            {/* Sandbox Content */}
            <div className="container mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-serif font-bold mb-4">Prófaðu kerfið</h1>
                    <p className="text-xl text-grey-dark max-w-2xl mx-auto">
                        Skoðaðu alla eiginleika Bústaðurinn.is án þess að skrá þig.
                        Þetta er alvöru gögn frá sýnisumarhúsi.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {features.map((feature) => (
                        <button
                            key={feature.id}
                            onClick={() => setActiveView(feature.id as any)}
                            className={`card p-8 text-left hover:shadow-lg transition-all ${activeView === feature.id ? 'ring-2 ring-amber' : ''
                                }`}
                        >
                            <feature.icon className={`w-10 h-10 text-amber mb-4`} />
                            <h3 className="text-xl font-serif mb-2">{feature.title}</h3>
                            <p className="text-grey-dark text-sm">{feature.description}</p>
                        </button>
                    ))}
                </div>

                {/* Preview Area */}
                <div className="card p-12 text-center">
                    <div className="max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-amber/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-10 h-10 text-amber" />
                        </div>
                        <h2 className="text-2xl font-serif mb-4">Sumarbústaður við Þingvallavatn</h2>
                        <p className="text-grey-dark mb-8">
                            Þetta er sýnisumarhús með raunhæfum gögnum.
                            Þú getur skoðað allt - bókanir, fjármál, verkefni og fleira.
                        </p>

                        {/* Demo Stats */}
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div className="p-4 bg-stone-50 rounded-lg">
                                <p className="text-2xl font-bold font-mono text-amber">12</p>
                                <p className="text-sm text-grey-dark">Bókanir í ár</p>
                            </div>
                            <div className="p-4 bg-stone-50 rounded-lg">
                                <p className="text-2xl font-bold font-mono text-green-600">3</p>
                                <p className="text-sm text-grey-dark">Meðeigendur</p>
                            </div>
                            <div className="p-4 bg-stone-50 rounded-lg">
                                <p className="text-2xl font-bold font-mono text-blue-600">5</p>
                                <p className="text-sm text-grey-dark">Verkefni</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/signup')}
                                className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark text-lg px-8"
                            >
                                Búa til eigið hús
                            </button>
                            <button
                                onClick={() => window.open('/eiginleikar', '_blank')}
                                className="btn btn-secondary border-stone-300 text-stone-700 hover:bg-stone-100"
                            >
                                Sjá alla eiginleika
                            </button>
                        </div>
                    </div>
                </div>

                {/* Features Showcase */}
                <div className="mt-16 text-center">
                    <p className="text-sm text-grey-mid mb-4">
                        💡 Þetta prufuumhverfi endurstillist sjálfkrafa á 24 klst fresti
                    </p>
                    <p className="text-xs text-grey-mid">
                        Bústaðurinn.is · Betra skipulag fyrir sumarhúsið
                    </p>
                </div>
            </div>
        </div>
    );
}
