import { useState } from 'react';
import { X, HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface QuickHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FAQ_ITEMS = [
    {
        q: "Hvernig bý ég til gestahlekk?",
        a: "Farðu í Stillingar → Gestir flipann. Þar getur þú búið til tímabundna hlekki fyrir hverja bókun eða fastan hlekk fyrir fjölskyldu."
    },
    {
        q: "Hvað er sanngirnisreglan?",
        a: "Kerfið fylgist með hverjir fengu vinsælar helgar (jól, páskar) síðustu ár. Þeir sem fengu ekki í fyrra fá forgang næst. Þetta tryggir jafna skiptingu."
    },
    {
        q: "Hvernig virkar hússjóðurinn?",
        a: "Skráðu sameiginlegan kostnað (rafmagn, tryggingar, viðhald). Kerfið reiknar sjálfkrafa hvað hver á að borga og hver á inni."
    },
    {
        q: "Get ég séð hverjir bókuðu hvað?",
        a: "Já, allar bókanir sjást í dagatali. Bústaðastjórinn getur smellt á bókunarspjöld til að sjá nánari upplýsingar. Aðrir meðeigendur sjá bókanir sínar."
    },
    {
        q: "Hvernig býð ég öðrum í húsið?",
        a: "Stillingar → Meðlimir flipinn. Smelltu á 'Bjóða meðlimi' og sendu boðshlekk í tölvupósti eða skeyti."
    },
    {
        q: "Er hægt að sleppa leiðbeiningasýningunni?",
        a: "Já, en þú getur alltaf smellt á ❓ takkann efst á yfirlitstöflunni til að sjá hana aftur."
    }
];

export default function QuickHelpModal({ isOpen, onClose }: QuickHelpModalProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-amber/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber/20 flex items-center justify-center">
                            <HelpCircle className="w-5 h-5 text-amber" />
                        </div>
                        <div>
                            <h2 className="font-serif font-bold text-lg text-charcoal">Hjálp</h2>
                            <p className="text-sm text-stone-500">Algengar spurningar</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-charcoal transition-colors p-2 hover:bg-stone-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* FAQ List */}
                <div className="overflow-y-auto max-h-[calc(80vh-180px)]">
                    <div className="divide-y divide-stone-100">
                        {FAQ_ITEMS.map((faq, index) => (
                            <div key={index}>
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 transition-colors"
                                >
                                    <span className="font-medium text-charcoal pr-4">{faq.q}</span>
                                    {openIndex === index ? (
                                        <ChevronUp size={18} className="text-amber flex-shrink-0" />
                                    ) : (
                                        <ChevronDown size={18} className="text-stone-400 flex-shrink-0" />
                                    )}
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-200 ${openIndex === index ? 'max-h-48' : 'max-h-0'
                                        }`}
                                >
                                    <p className="px-4 pb-4 text-stone-600 text-sm leading-relaxed">
                                        {faq.a}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-100 bg-stone-50/50">
                    <a
                        href="/faq"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-amber hover:text-amber-600 font-bold text-sm"
                    >
                        Sjá allar spurningar
                        <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
}
