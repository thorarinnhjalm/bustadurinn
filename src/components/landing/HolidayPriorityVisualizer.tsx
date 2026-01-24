import { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export default function HolidayPriorityVisualizer() {
    const [selectedHoliday, setSelectedHoliday] = useState<string>('Jól');
    const [hadLastYear, setHadLastYear] = useState<boolean | null>(null);

    const checkResult = () => {
        if (hadLastYear === null) return null;
        if (hadLastYear) {
            return {
                allowed: false,
                message: `Því miður, þú varst með ${selectedHoliday} í fyrra.`,
                description: "Sanngirnisreglan tryggir að aðrir fái tækifæri í ár. Kerfið hvetur til dreifingar á vinsælustu dögunum."
            };
        } else {
            return {
                allowed: true,
                message: "Glæsilegt! Þú hefur forgang.",
                description: `Þar sem þú varst ekki með ${selectedHoliday} í fyrra, þá átt þú rétt á að bóka í ár á undan þeim sem nýttu daginn síðast.`
            };
        }
    };

    const result = checkResult();

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-stone-100 max-w-lg mx-auto transform transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber">
                    <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-serif font-bold text-charcoal">Prófaðu Sanngirnisregluna</h3>
            </div>

            <div className="space-y-6">
                {/* Step 1: Select Holiday */}
                <div>
                    <label className="block text-sm font-medium text-stone-500 mb-2 uppercase tracking-wide">1. Veldu hátíð</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['Jól', 'Páskar', 'Áramót'].map(holiday => (
                            <button
                                key={holiday}
                                onClick={() => { setSelectedHoliday(holiday); setHadLastYear(null); }}
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

                {/* Step 2: Last Year Question */}
                <div className={`transition-opacity duration-300 ${selectedHoliday ? 'opacity-100' : 'opacity-50'}`}>
                    <label className="block text-sm font-medium text-stone-500 mb-2 uppercase tracking-wide">
                        2. Varst þú með {selectedHoliday} í fyrra?
                    </label>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setHadLastYear(true)}
                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${hadLastYear === true
                                ? 'border-amber bg-amber/5 text-charcoal font-bold'
                                : 'border-stone-200 hover:border-amber/50 text-stone-600'
                                }`}
                        >
                            Já, ég nýtti hann
                        </button>
                        <button
                            onClick={() => setHadLastYear(false)}
                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${hadLastYear === false
                                ? 'border-amber bg-amber/5 text-charcoal font-bold'
                                : 'border-stone-200 hover:border-amber/50 text-stone-600'
                                }`}
                        >
                            Nei, alls ekki
                        </button>
                    </div>
                </div>

                {/* Result Display */}
                <div className={`mt-6 rounded-xl p-5 transition-all duration-500 overflow-hidden ${result ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 h-0 p-0'
                    } ${result?.allowed ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                    }`}>
                    {result && (
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 p-1 rounded-full ${result.allowed ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                                {result.allowed ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className={`text-lg font-bold mb-1 ${result.allowed ? 'text-green-800' : 'text-red-800'}`}>
                                    {result.message}
                                </h4>
                                <p className={`text-sm leading-relaxed ${result.allowed ? 'text-green-700' : 'text-red-700'}`}>
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
