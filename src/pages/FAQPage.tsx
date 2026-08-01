import { useState } from 'react';
import { Link } from 'react-router-dom';
import MarketingLayout from '@/components/MarketingLayout';
import { Plus, Minus } from 'lucide-react';

export default function FAQPage() {
    const faqs = [
        {
            q: "Hvað kostar þjónustan?",
            a: "Ekkert! Bústaðurinn.is er ókeypis og opið öllum. Allir eiginleikar eru innifaldir og þú getur boðið ótakmörkuðum fjölda notenda og gesta. Ef þér líkar við kerfið og vilt styrkja þróun þess er velkomið að kaupa handa okkur kaffibolla."
        },
        {
            q: "Hvað er Torgið?",
            a: "Torgið er markaðstorg Bústaðurinn.is þar sem þú getur fundið iðnaðarmenn og þjónustuaðila fyrir sumarbústaðinn. Þú getur leitað eftir landshluta og flokkum, lesið umsagnir og haft samband beint."
        },
        {
            q: "Hvernig skrái ég mig sem verktaka á Torgið?",
            a: "Smelltu á 'Torgið' í valmyndinni og veldu 'Ertu verktaki?' hnappinn efst. Það er frítt að skrá sig og þjónustan er sýnileg öllum notendum kerfisins."
        },
        {
            q: "Get ég hætt að nota kerfið?",
            a: "Já, hvenær sem er. Bústaðurinn.is er ókeypis og engin binding fylgir — það er engin áskrift til að segja upp. Ef þú vilt hætta alveg getur þú eytt aðgangnum þínum úr stillingum, eða haft samband við okkur og við eyðum gögnunum þínum."
        },
        {
            q: "Er appið til fyrir iPhone og Android?",
            a: "Bústaðurinn.is er vefapp (PWA) sem virkar í öllum símum og tölvum án þess að sækja þarf app í App Store. Þú getur sett það á heimaskjáinn þinn eins og venjulegt app."
        },
        {
            q: "Hvernig virkar sanngirnisreglan?",
            a: "Sanngirnisreglan er röðunarkerfi fyrir fjórar stórhelgar: páska, verslunarmannahelgina, jólin og áramótin. Kerfið heldur utan um sögu hvers meðeiganda og raðar þeim sem sjaldnast — eða lengst síðan — hafa fengið helgina fremst í röðina. „Stórhelgar\"-spjaldið á dagatalinu sýnir hvers réttur er hverju sinni og sögu síðustu ára. Þremur mánuðum fyrir hverja helgi opnast bókunin öllum meðeigendum, óháð röð."
        },
        {
            q: "Geta allir séð fjármálin?",
            a: "Já, allir skráðir eigendur hafa aðgang að 'Bókhald' flipanum þar sem hægt er að sjá stöðu hússjóðs, tekjur og gjöld. Þetta eykur gagnsæi og traust í húsfélaginu."
        },
        {
            q: "Hvernig skipti ég helgum í sumarhúsi á sanngjarnan hátt?",
            a: "Bústaðurinn.is er með innbyggða sanngirnisreglu sem raðar meðeigendum fyrir fjórar stórhelgar — páska, verslunarmannahelgina, jólin og áramótin. Sá sem sjaldnast eða lengst síðan hefur fengið helgina er efstur í röðinni, og „Stórhelgar\"-spjaldið á dagatalinu sýnir hvers réttur er hverju sinni. Enginn þarf að rökræða eða semja — kerfið gerir þetta allt sjálfkrafa, og röðin opnast öllum þremur mánuðum fyrir hverja helgi."
        },
        {
            q: "Hvað ef fjölskyldan á sumarhús saman og við erum ekki sammála um bókanir?",
            a: "Það er einmitt ástæðan fyrir Bústaðnum. Kerfið kemur í veg fyrir árekstra og tryggir gagnsæi. Allir sjá sömu bókanirnar, sömu reglurnar og sömu fjármálin. Þegar allt er skýrt og sanngjarnt minnkar ágreiningur verulega."
        },
        {
            q: "Get ég notað kerfið fyrir orlofshús starfsmannafélags?",
            a: "Já! Bústaðurinn.is býður sérstaka lausn fyrir starfsmannafélög og stéttarfélög. Kerfið styður marga notendur, aðgangsstýringu og bókunarmörk per félagsmann. Hafðu samband við okkur eða skoðaðu 'Fyrir starfsmannafélög' síðuna til að fá sérsniðið tilboð."
        },
        {
            q: "Hvernig er kostnaði skipt á milli meðeigenda sumarhúss?",
            a: "Hússjóðskerfið gerir þér kleift að skrá öll útgjöld (rafmagn, fasteignagjöld, viðhald) og skipta kostnaði sjálfkrafa á milli meðeigenda. Allir sjá stöðuna í rauntíma og kerfið reiknar sjálfkrafa hvað hver skuldar."
        },
        {
            q: "Er til app fyrir utanumhald á sumarhúsi?",
            a: "Já, Bústaðurinn.is er fullkomið bókunarkerfi og app fyrir sumarhús. Það virkar eins og venjulegt app á símanum þínum (PWA) og þú getur bætt því á heimaskjáinn þinn. Kerfið er hannað sérstaklega fyrir íslensk sumarhús í sameign og býður upp á bókunardagatal, sanngirnisreglu, hússjóð og verkefnalista."
        },
        {
            q: "Hvernig virkar sameiginlegur bankareikningur (hússjóður) fyrir sumarhús?",
            a: "Þegar mörg húsfélög eða meðeigendur sumarhúsa ákveða að halda utan um fjármálin er oft stofnaður sameiginlegur bankareikningur (hússjóður). Með Bústaðurinn.is getið þið haldið utan um allar innborganir og útgjöld á einum stað. Kerfið reiknar sjálfkrafa út hlut hvers og eins jafnt á milli allra, eða samkvæmt eignarhlutfalli ef stjórnandi hússins stillir það þannig — sem auðveldar uppgjör og eykur gagnsæi."
        },
        {
            q: "Af hverju er rafmagnsreikningurinn í bústaðnum stundum hár og hver er meðalkostnaðurinn?",
            a: "Hár rafmagnsreikningur í sumarhúsi stafar oftast af kyndingu (ofnum eða gólfhita) yfir vetrarmánuðina eða heitum potti sem er í stöðugri notkun. Meðalkostnaður á sumrin er yfirleitt 4.000 – 8.000 kr. á mánuði en getur farið í 12.000 – 20.000 kr. á veturna, og allt upp í 45.000 kr. eða meira ef heitur pottur er kyntur í miklum frostum. Í kerfinu getið þið skipt þessum kostnaði á sanngjarnan og einfaldan hátt."
        },
        {
            q: "Hvar finn ég handbók hússins eða reglur fyrir bústaðinn?",
            a: "Bústaðurinn.is býður upp á sérstakan hluta þar sem hægt er að skrifa og vista handbók hússins. Þar er tilvalið að skrá mikilvægar upplýsingar svo sem hvernig eigi að ganga frá bústaðnum, hvar lyklar eru geymdir, hvar eigi að skrúfa fyrir vatn, og hvernig eigi að þrífa heita pottinn. Allir meðeigendur og gestir hafa þannig greiðan aðgang að reglum bústaðarins á einum stað."
        },
        {
            q: "Hver á rétt á jólunum eða páskunum í ár?",
            a: "„Stórhelgar\"-spjaldið á dagatalinu sýnir þetta sjálfkrafa fyrir allar fjórar stórhelgarnar — páska, verslunarmannahelgina, jólin og áramótin. Sá meðeigandi sem hefur sjaldnast eða lengst síðan fengið helgina er efstur í röðinni, og þú sérð sögu síðustu ára með einum smelli. Þegar röðin er komin að þér getur þú tekið helgina beint úr spjaldinu. Þremur mánuðum fyrir hverja helgi opnast bókunin öllum, óháð röð."
        },
        {
            q: "Virkar kerfið ef það er ekkert netsamband í bústaðnum?",
            a: "Já. Bústaðurinn.is er byggður sem vefapp (PWA) með ofangeymslu, svo dagatalið, verkefnalistinn og innkaupalistinn eru læsileg þó ekkert samband sé í bústaðnum. Breytingar sem þú gerir ótengd(ur) samstillast sjálfkrafa um leið og síminn nær sambandi á ný."
        },
        {
            q: "Hvað eru gátlistar og árbók?",
            a: "Kerfið er með komu- og brottfarargátlista með íslenskum sjálfgefnum atriðum sem hægt er að sérsníða. Þegar farið er í gegnum brottfarargátlistann er hægt að merkja hluti sem eru á þrotum — þeir bætast sjálfkrafa á innkaupalistann. Árstíðabundnir listar fyrir vor-opnun og vetrarfrágang birtast sem áminningar á yfirlitssíðunni. Í lok hvers árs útbýr kerfið sjálfkrafa prentanlega árbók á /arbok með tölfræði, lengstu dvölinni, hver vann hverja stórhelgi og völdum tilvitnunum úr gestabókinni."
        }
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
            }
        }))
    };

    return (
        <MarketingLayout
            title="Algengar spurningar um sumarhús | Bústaðurinn.is — Ókeypis app"
            description="Svör við algengum spurningum um Bústaðurinn.is — ókeypis app og bókunarkerfi fyrir sumarhús. Hvernig virkar kerfið, sanngirnisreglan, hússjóður og fleira."
            keywords="algengar spurningar sumarhús, sumarhúsaforrit spurningar, ókeypis sumarhús app, bókunarkerfi sumarhús, sanngirnisregla, hússjóður"
            structuredData={structuredData}
        >
            <div className="bg-white py-24">
                <div className="container max-w-3xl mx-auto px-6">
                    <h1 className="text-4xl font-serif mb-4 text-center">Algengar spurningar um sumarhúsið</h1>
                    <p className="text-grey-dark text-center mb-16">Hér eru svör við algengustu spurningunum um Bústaðurinn.is.</p>

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

            {/* Cross-link to Handbook */}
            <div className="py-16 bg-bone border-t border-stone-200">
                <div className="container max-w-4xl mx-auto px-6">
                    <div className="bg-gradient-to-br from-amber/10 to-white rounded-2xl p-8 md:p-12 text-center border-2 border-amber/20">
                        <h2 className="text-3xl font-serif font-bold mb-4">Viltu læra meira?</h2>
                        <p className="text-xl text-grey-dark mb-8 max-w-2xl mx-auto">
                            Skoðaðu ítarlega handbók okkar með leiðbeiningum um bókunarkerfi, fjármál, viðhald og uppsetningu.
                        </p>
                        <Link
                            to="/handbok"
                            className="btn btn-primary bg-amber text-charcoal hover:bg-amber/90 px-8 py-4 text-lg inline-flex items-center gap-2"
                        >
                            Skoða handbók
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
