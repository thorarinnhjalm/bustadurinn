import { useState } from 'react';
import { Calendar, Trophy, Unlock } from 'lucide-react';

const HOLIDAYS = ['Jól', 'Páskar', 'Verslunarmannahelgin', 'Áramót'];

type LastTurn = 'never' | 'long-ago' | 'last-year';

const LAST_TURN_OPTIONS: { id: LastTurn; label: string }[] = [
    { id: 'never', label: 'Aldrei fengið hana' },
    { id: 'long-ago', label: 'Fyrir 2+ árum' },
    { id: 'last-year', label: 'Á síðasta ári' },
];

export default function HolidayPriorityVisualizer() {
    const [selectedHoliday, setSelectedHoliday] = useState<string>('Jól');
    const [lastTurn, setLastTurn] = useState<LastTurn | null>(null);

    const checkResult = () => {
        if (lastTurn === null) return null;

        if (lastTurn === 'last-year') {
            return {
                topOfQueue: false,
                message: `Aðrir eru framar í röðinni núna`,
                description: `Þar sem þú varst með ${selectedHoliday} síðast, eru þeir sem hafa beðið lengur framar í röðinni í ár. Röðin opnast samt öllum meðeigendum þremur mánuðum fyrir helgina, óháð röð.`
            };
        }

        return {
            topOfQueue: true,
            message: 'Röðin er komin að þér!',
            description: `Þar sem þú hefur ekki fengið ${selectedHoliday} í bili, ertu efst(ur) í röðinni og hefur forgang til að bóka á undan öðrum — þangað til þrír mánuðir eru í helgina, en þá opnast bókunin öllum.`
        };
    };

    const result = checkResult();

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-stone-100 max-w-lg mx-auto transform transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber">
                    <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-serif font-bold text-charcoal">Prófaðu Stórhelgar-röðina</h3>
            </div>

            <div className="space-y-6">
                {/* Step 1: Select Holiday */}
                <div>
                    <label className="block text-sm font-medium text-stone-500 mb-2 uppercase tracking-wide">1. Veldu stórhelgi</label>
                    <div className="grid grid-cols-2 gap-2">
                        {HOLIDAYS.map(holiday => (
                            <button
                                key={holiday}
                                onClick={() => { setSelectedHoliday(holiday); setLastTurn(null); }}
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${selectedHoliday === holiday
                                    ? 'bg-charcoal text-white shadow-md'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                    }`}
                            >
                                {holiday}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Last Turn Question */}
                <div className={`transition-opacity duration-300 ${selectedHoliday ? 'opacity-100' : 'opacity-50'}`}>
                    <label className="block text-sm font-medium text-stone-500 mb-2 uppercase tracking-wide">
                        2. Hvenær fékkst þú {selectedHoliday} síðast?
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {LAST_TURN_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => setLastTurn(option.id)}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-sm ${lastTurn === option.id
                                    ? 'border-amber bg-amber/5 text-charcoal font-bold'
                                    : 'border-stone-200 hover:border-amber/50 text-stone-600'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Result Display */}
                <div className={`mt-6 rounded-xl p-5 transition-all duration-500 overflow-hidden ${result ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 h-0 p-0'
                    } ${result?.topOfQueue ? 'bg-green-50 border border-green-100' : 'bg-amber/5 border border-amber/20'
                    }`}>
                    {result && (
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 p-1 rounded-full ${result.topOfQueue ? 'bg-green-200 text-green-700' : 'bg-amber/20 text-amber-800'}`}>
                                {result.topOfQueue ? <Trophy className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className={`text-lg font-bold mb-1 ${result.topOfQueue ? 'text-green-800' : 'text-amber-900'}`}>
                                    {result.message}
                                </h4>
                                <p className={`text-sm leading-relaxed ${result.topOfQueue ? 'text-green-700' : 'text-amber-900/80'}`}>
                                    {result.description}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Empty State / Hint */}
            {!result && (
                <div className="mt-6 text-center text-stone-400 text-sm italic py-4">
                    Veldu svörin hér að ofan til að sjá niðurstöðuna
                </div>
            )}
        </div>
    );
}
