import { useState } from 'react';
import {
    X, ChevronRight, CheckCircle,
    Calendar, CheckSquare, Wallet,
    Home
} from 'lucide-react';

interface WalkthroughProps {
    onClose: () => void;
}

const STEPS = [
    {
        id: 'welcome',
        title: 'Velkomin í Bústaðinn!',
        description: 'Frábært að sjá þig. Við höfum sett upp kerfi sem hjálpar þér að halda utan um sumarbústaðinn, bókanir, verkefni og fjármál á einum stað.',
        icon: Home,
        color: 'bg-amber text-charcoal'
    },
    {
        id: 'bookings',
        title: 'Bókanir & Dagatal',
        description: 'Hér sérðu hvenær bústaðurinn er laus. Þú getur bókað með einum smelli og séð hverjir aðrir eru á leiðinni.',
        icon: Calendar,
        color: 'bg-blue-100 text-blue-600'
    },
    {
        id: 'tasks',
        title: 'Verkefni & Viðhald',
        description: 'Henda ruslinu? Klippa grasið? Skráðu öll verkefni hér svo ekkert gleymist. Þú getur líka úthlutað verkum á aðra.',
        icon: CheckSquare,
        color: 'bg-emerald-100 text-emerald-600'
    },
    {
        id: 'finance',
        title: 'Hússjóðurinn',
        description: 'Haltu utan um sameiginlegan kostnað. Hver borgaði rafmagnið? Hver á inni? Allt svart á hvítu.',
        icon: Wallet,
        color: 'bg-purple-100 text-purple-600'
    },
    {
        id: 'ready',
        title: 'Allt klárt!',
        description: 'Þú ert tilbúin(n). Ef þú þarft að breyta stillingum eða bjóða fleirum, kíktu þá í Stillingar.',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-600'
    }
];

export default function Walkthrough({ onClose }: WalkthroughProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            complete();
        }
    };

    const complete = () => {
        localStorage.setItem('has_seen_walkthrough', 'true');
        onClose();
    };

    const step = STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={complete}
                    className="absolute top-4 right-4 text-stone-400 hover:text-charcoal transition-colors z-10"
                >
                    <X size={24} />
                </button>

                {/* Progress Bar */}
                <div className="flex gap-1 p-1 absolute top-0 left-0 right-0">
                    {STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1 flex-1 rounded-full transition-all duration-500 ${idx <= currentStep ? 'bg-amber' : 'bg-stone-100'
                                }`}
                        />
                    ))}
                </div>

                <div className="p-8 pt-12 text-center min-h-[400px] flex flex-col items-center">

                    {/* Icon Animation */}
                    <div className="mb-8 relative">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-colors duration-500 ${step.color}`}>
                            <step.icon size={48} strokeWidth={1.5} />
                        </div>
                        {/* Ripple Effect */}
                        <div className={`absolute inset-0 rounded-full opacity-20 animate-ping-slow ${step.color.split(' ')[0]}`}></div>
                    </div>

                    <h2 className="text-2xl font-serif font-bold text-charcoal mb-4 transition-all duration-300">
                        {step.title}
                    </h2>

                    <p className="text-stone-500 leading-relaxed mb-8 max-w-sm transition-all duration-300">
                        {step.description}
                    </p>

                    <div className="mt-auto w-full space-y-3">
                        <button
                            onClick={handleNext}
                            className="btn btn-primary w-full py-3 text-lg flex items-center justify-center gap-2 group"
                        >
                            {currentStep === STEPS.length - 1 ? 'Byrja að nota' : 'Áfram'}
                            {currentStep !== STEPS.length - 1 && (
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            )}
                        </button>

                        {currentStep < STEPS.length - 1 && (
                            <button
                                onClick={complete}
                                className="text-sm font-bold text-stone-400 hover:text-charcoal"
                            >
                                Sleppa kynningu
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
