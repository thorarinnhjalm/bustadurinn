/**
 * Public Sandbox Page - Try features without signup
 * Uses demo-house-001 with real app features
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, CheckSquare, Home, ArrowLeft, Eye, Play } from 'lucide-react';

export default function SandboxPage() {
    const navigate = useNavigate();

    const features = [
        {
            id: 'calendar',
            icon: Calendar,
            title: 'Bókunardagatal',
            description: 'Sjáðu hvernig bókunarkerfið virkar',
            action: () => navigate('/sandbox/calendar'),
            color: 'bg-amber'
        },
        {
            id: 'finance',
            icon: DollarSign,
            title: 'Hússjóður',
            description: 'Rekstraráætlun og fjármál',
            action: () => navigate('/sandbox/finance'),
            color: 'bg-green-500'
        },
        {
            id: 'tasks',
            icon: CheckSquare,
            title: 'Verkefni',
            description: 'Viðhaldsverkefni og verkefnalisti',
            action: () => navigate('/sandbox/tasks'),
            color: 'bg-blue-500'
        },
        {
            id: 'settings',
            icon: Home,
            title: 'Stillingar',
            description: 'Hússtillingar og meðeigendur',
            action: () => navigate('/sandbox/settings'),
            color: 'bg-purple-500'
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
                            <p className="font-bold text-sm">Prufuumhverfi</p>
                            <p className="text-xs opacity-80">Þú getur prófað allt án þess að skrá þig</p>
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
                    <h1 className="text-5xl font-serif font-bold mb-6">Prófaðu Bústaðurinn.is</h1>
                    <p className="text-xl text-grey-dark max-w-3xl mx-auto leading-relaxed">
                        Smelltu á hvaða eiginleika sem er til að sjá hvernig kerfið virkar.
                        Þetta eru alvöru gögn frá <strong>Sumarbústaður við Þingvallavatn</strong>.
                    </p>
                </div>

                {/* Interactive Feature Cards */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
                    {features.map((feature) => (
                        <button
                            key={feature.id}
                            onClick={feature.action}
                            className="card p-8 text-left hover:shadow-xl hover:scale-[1.02] transition-all group"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-14 h-14 ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-serif mb-2 flex items-center justify-between">
                                        {feature.title}
                                        <Play className="w-5 h-5 text-amber opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-grey-dark text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Demo House Info */}
                <div className="card p-12 max-w-3xl mx-auto text-center">
                    <div className="w-16 h-16 bg-amber/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Home className="w-8 h-8 text-amber" />
                    </div>
                    <h2 className="text-2xl font-serif mb-4">Sumarbústaður við Þingvallavatn</h2>
                    <p className="text-grey-dark mb-8 leading-relaxed">
                        Sýnisumarhús með raunhæfum gögnum - bókanir, fjármál, verkefni og fleira.
                        Kerfið endurstillist sjálfkrafa á 24 klst fresti.
                    </p>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="p-6 bg-amber/5 rounded-lg border border-amber/20">
                            <p className="text-3xl font-bold font-mono text-amber mb-1">12</p>
                            <p className="text-sm text-grey-dark">Bókanir í ár</p>
                        </div>
                        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-3xl font-bold font-mono text-green-600 mb-1">3</p>
                            <p className="text-sm text-grey-dark">Meðeigendur</p>
                        </div>
                        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-3xl font-bold font-mono text-blue-600 mb-1">5</p>
                            <p className="text-sm text-grey-dark">Verkefni</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/signup')}
                        className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark text-lg px-12 py-4"
                    >
                        Búa til eigið hús →
                    </button>
                </div>
            </div>
        </div>
    );
}
