import MarketingLayout from '@/components/MarketingLayout';
import ContactForm from '@/components/ContactForm';
import { Heart, ShieldCheck, Users } from 'lucide-react';

export default function AboutPage() {
    return (
        <MarketingLayout
            title="Um Okkur | Bústaðurinn.is"
            description="Sagan á bak við Bústaðinn. Hugbúnaður hannaður á Íslandi fyrir íslensk sumarhús og fjölskyldur."
        >
            {/* Hero Section */}
            <div className="bg-bone py-20 border-b border-grey-warm/20">
                <div className="container max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-serif mb-6 text-charcoal">Sagan okkar</h1>
                    <p className="text-xl text-grey-dark leading-relaxed max-w-2xl mx-auto">
                        Við teljum að bestu minningarnar verði til í sumarhúsinu.
                        Okkar markmið er að tryggja að skipulagið standi ekki í vegi fyrir þeim.
                    </p>
                </div>
            </div>

            <div className="bg-white py-24">
                <div className="container max-w-3xl mx-auto px-6">
                    <div className="prose prose-lg text-grey-dark leading-relaxed">
                        <h2 className="text-3xl font-serif text-charcoal mb-6">Hvers vegna Bústaðurinn.is?</h2>
                        <p className="mb-6">
                            Bústaðurinn.is spratt upp úr raunverulegri þörf fyrir betra utanumhald um sameiginlegt fjölskyldusumarhús.
                            Eftir að hafa reynt að halda utan um bókanir í Excel, rætt viðgerðir í mörgum mismunandi Facebook hópum og
                            reiknað kostnaðarskiptingu á servíettum, ákváðum við að búa til lausn sem virkar.
                        </p>

                        <div className="grid md:grid-cols-3 gap-8 my-16 not-prose">
                            <div className="text-center p-6 bg-bone rounded-2xl">
                                <Heart className="w-10 h-10 text-amber mx-auto mb-4" />
                                <h4 className="font-serif text-lg mb-2">Fjölskyldufriður</h4>
                                <p className="text-sm text-grey-mid">Skýrar reglur og sanngjörn skipting dregur úr nagli.</p>
                            </div>
                            <div className="text-center p-6 bg-bone rounded-2xl">
                                <ShieldCheck className="w-10 h-10 text-amber mx-auto mb-4" />
                                <h4 className="font-serif text-lg mb-2">Gagnsæi</h4>
                                <p className="text-sm text-grey-mid">Allir sjá hver bókaði hvað og hvað hlutirnir kosta.</p>
                            </div>
                            <div className="text-center p-6 bg-bone rounded-2xl">
                                <Users className="w-10 h-10 text-amber mx-auto mb-4" />
                                <h4 className="font-serif text-lg mb-2">Einfaldleiki</h4>
                                <p className="text-sm text-grey-mid">Hannað til að vera auðvelt í notkun fyrir alla kynslóðir.</p>
                            </div>
                        </div>

                        <p className="mb-6">
                            Markmið okkar er einfalt: að minnka ágreining og auka gleðina sem fylgir sumarhúsinu.
                            Þegar allar reglur eru skýrar, bókanir gagnsæjar og fjármálin á hreinu, þá geta allir slakað á og notið dvalarinnar.
                        </p>

                        <div className="bg-charcoal text-bone p-10 rounded-3xl my-16 not-prose relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-serif mb-4">Hvað er næst?</h3>
                                <p className="text-grey-warm mb-0">
                                    Við erum stöðugt að bæta kerfið í samstarfi við okkar notendur. Framundan eru spennandi nýjungar eins og snjalltenginar við rafmagnsmæla og enn dýpri samþætting við íslenska banka.
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        </div>

                        <h3 className="text-2xl font-serif text-charcoal mt-12 mb-6 text-center">Hafið samband</h3>
                        <p className="mb-8 text-center">
                            Við elskum að heyra í notendum okkar. Ef þú hefur ábendingar, spurningar eða vilt einfaldlega segja hæ, sendu okkur línu.
                        </p>

                        {/* Contact Form */}
                        <div className="not-prose max-w-xl mx-auto mb-24">
                            <ContactForm />
                        </div>

                        <div className="mt-20 pt-10 border-t border-grey-warm/30">
                            <h3 className="text-lg font-serif mb-4">Systurverkefni</h3>
                            <p className="text-sm text-grey-mid leading-relaxed">
                                Bústaðurinn.is er hluti af vöruúrvali frá <strong>Neðri Hóll Hugmyndahús ehf</strong>.
                                Við leggjum metnað í að smíða hugbúnað sem einfaldar líf fólks.
                                <br /><br />
                                Skoðaðu einnig <a href="https://vaktaplan.is" target="_blank" rel="noopener" className="text-charcoal font-semibold hover:text-amber transition-colors underline decoration-amber/30 underline-offset-4">Vaktaplan.is</a> fyrir snjallara vaktaskipulag og <a href="https://nagrannar.is" target="_blank" rel="noopener" className="text-charcoal font-semibold hover:text-amber transition-colors underline decoration-amber/30 underline-offset-4">Nágrannar.is</a> sem er sérsniðið utanumhald fyrir húsfélög í fjöleignarhúsum.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
