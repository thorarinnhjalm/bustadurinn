import { useState } from 'react';
import MarketingLayout from '@/components/MarketingLayout';
import { Plus, Minus } from 'lucide-react';

export default function FAQPage() {
    const faqs = [
        {
            q: "Hvað kostar þjónustan?",
            a: "14.900 kr. á ári (ein greiðsla) eða 1.990 kr. á mánuði. Innifalið eru allir eiginleikar, ótakmarkaður fjöldi notenda og gesta. 14 daga prufutími er í boði án skuldbindinga."
        },
        {
            q: "Get ég sagt upp áskriftinni?",
            a: "Já, hvenær sem er. Engur uppsagnarfrestur er á mánaðaráskrift."
        },
        {
            q: "Er appið til fyrir iPhone og Android?",
            a: "Bústaðurinn.is er vefapp (PWA) sem virkar í öllum símum og tölvum án þess að sækja þarf app í App Store. Þú getur sett það á heimaskjáinn þinn eins og venjulegt app."
        },
        {
            q: "Hvernig virkar sanngirnisreglan?",
            a: "Kerfið heldur utan um hver fékk úthlutað vinsælum dögum (jól, páskar, verslunarmannahelgi) síðustu ár. Þegar sótt er um sömu helgi aftur, raðar kerfið umsóknum eftir sanngirni – sá sem fékk ekki í fyrra hefur forgang."
        },
        {
            q: "Geta allir séð fjármálin?",
            a: "Já, allir skráðir eigendur hafa aðgang að 'Bókhald' flipanum þar sem hægt er að sjá stöðu hússjóðs, tekjur og gjöld. Þetta eykur gagnsæi og traust í húsfélaginu."
        }
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <MarketingLayout
            title="Spurt og Svarað"
            description="Algengar spurningar um Bústaðurinn.is. Verðskrá, virkni og tæknilegar upplýsingar."
        >
            <div className="bg-white py-24">
                <div className="container max-w-3xl mx-auto px-6">
                    <h1 className="text-4xl font-serif mb-4 text-center">Spurt og Svarað</h1>
                    <p className="text-grey-dark text-center mb-16">Hér eru svör við algengustu spurningunum.</p>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border border-grey-warm rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full flex justify-between items-center p-6 text-left hover:bg-bone transition-colors"
                                >
                                    <span className="font-medium text-lg text-charcoal pr-8">{faq.q}</span>
                                    {openIndex === index ? (
                                        <Minus className="w-5 h-5 text-amber flex-shrink-0" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-grey-mid flex-shrink-0" />
                                    )}
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <div className="p-6 pt-0 text-grey-dark leading-relaxed border-t border-grey-warm/50 bg-bone/30">
                                        {faq.a}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 text-center bg-bone p-8 rounded-xl">
                        <h3 className="text-xl font-serif mb-2">Fannstu ekki svarið?</h3>
                        <p className="text-grey-dark mb-4">Sendu okkur línu og við svörum um hæl.</p>
                        <a href="mailto:hall@bustadurinn.is" className="text-amber hover:text-amber-dark font-medium underline underline-offset-4">
                            hafa samband
                        </a>
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
