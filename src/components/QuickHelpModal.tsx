import { useId, useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Modal from '@/components/ui/Modal';

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
        a: "Fyrir stórhelgarnar (páska, verslunarmannahelgi, jól, áramót) reiknar kerfið hver á forgang: sá sem aldrei hefur haldið helgina — eða lengst er síðan — fær hann. Forgangurinn er ekki bann, heldur röð; hann fellur niður 3 mánuðum fyrir helgina og þá má hver sem er bóka hana. 'Stórhelgar' spjaldið á dagatalinu sýnir röðina og söguna."
    },
    {
        q: "Hvað gerist ef tveir bóka sömu helgina?",
        a: "Kerfið kemur ekki sjálfkrafa í veg fyrir skörun — það varar þig við, sýnir hver er þegar með bókun og hvenær, og þú velur 'Bóka samt' ef um vísvitandi samveru er að ræða."
    },
    {
        q: "Hvernig virkar hússjóðurinn?",
        a: "Skráðu sameiginlegan kostnað (rafmagn, tryggingar, viðhald). Kerfið reiknar sjálfkrafa hvað hver á að borga, ýmist jafnt skipt eða eftir eignarhlutföllum sem stjórnandi stillir, og hver á inni. Ársyfirlit í lok árs tekur saman hlutdeild og greiðslur hvers eiganda."
    },
    {
        q: "Hvað eru gátlistar og hvar stilli ég þá?",
        a: "Í Stillingar → Gátlistar má setja upp komu- og brottfarargátlista, birgðastöðu (hlutir sem eru 'Á þrotum' fara sjálfkrafa á innkaupalistann) og árstíðalista fyrir vor-opnun og vetrarfrágang — allt með tilbúnum sjálfgefnum atriðum."
    },
    {
        q: "Get ég séð hverjir bókuðu hvað?",
        a: "Já, allar bókanir sjást í dagatali. Bústaðastjórinn getur smellt á bókunarspjöld til að sjá nánari upplýsingar. Meðeigendur sjá bókanir en ekki nánar (t.d. veðurspá eða innkaupalista)."
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
    const baseId = useId();
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title="Hjálp"
            size="lg"
            bodyClassName="!px-0 !pb-0"
            footer={
                <a
                    href="/faq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 text-amber-ink hover:text-amber-700 font-bold text-sm"
                >
                    Sjá allar spurningar
                    <span className="sr-only"> (opnast í nýjum flipa)</span>
                    <ExternalLink size={14} aria-hidden="true" />
                </a>
            }
        >
            <div className="flex items-center gap-3 px-6 pb-4 border-b border-stone-100">
                <div className="w-10 h-10 rounded-full bg-amber/20 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-amber-ink" aria-hidden="true" />
                </div>
                <p className="text-sm text-stone-500">Algengar spurningar</p>
            </div>

            {/* FAQ List */}
            <div className="divide-y divide-stone-100">
                {FAQ_ITEMS.map((faq, index) => {
                    const isOpenItem = openIndex === index;
                    const buttonId = `${baseId}-q-${index}`;
                    const panelId = `${baseId}-a-${index}`;
                    return (
                        <div key={index}>
                            <h3 className="m-0">
                                <button
                                    type="button"
                                    id={buttonId}
                                    aria-expanded={isOpenItem}
                                    aria-controls={panelId}
                                    onClick={() => setOpenIndex(isOpenItem ? null : index)}
                                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-stone-50 transition-colors"
                                >
                                    <span className="font-medium text-charcoal pr-4">{faq.q}</span>
                                    {isOpenItem ? (
                                        <ChevronUp size={18} className="text-amber-ink flex-shrink-0" aria-hidden="true" />
                                    ) : (
                                        <ChevronDown size={18} className="text-stone-500 flex-shrink-0" aria-hidden="true" />
                                    )}
                                </button>
                            </h3>
                            <div
                                id={panelId}
                                role="region"
                                aria-labelledby={buttonId}
                                inert={!isOpenItem}
                                className={`overflow-hidden transition-all duration-200 ${isOpenItem ? 'max-h-48' : 'max-h-0'}`}
                            >
                                <p className="px-6 pb-4 text-stone-600 text-sm leading-relaxed">
                                    {faq.a}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
}
