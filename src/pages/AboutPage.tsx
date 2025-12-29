import MarketingLayout from '@/components/MarketingLayout';
import ContactForm from '@/components/ContactForm';

export default function AboutPage() {
    return (
        <MarketingLayout
            title="Um Okkur"
            description="Um Bústaðurinn.is. Hugbúnaður hannaður á Íslandi fyrir íslensk sumarhús."
        >
            <div className="bg-white py-24">
                <div className="container max-w-3xl mx-auto px-6">
                    <h1 className="text-4xl font-serif mb-8">Um Okkur</h1>

                    <div className="prose prose-lg text-grey-dark leading-relaxed">
                        <p className="mb-6">
                            Bústaðurinn.is spratt upp úr þörf fyrir betra utanumhald um sameiginlegt fjölskyldusumarhús.
                            Eftir að hafa reynt að halda utan um bókanir í Excel, rætt viðgerðir á Facebook og
                            reiknað kostnaðarskiptingu á servíettum, ákváðum við að búa til sérsniðna lausn.
                        </p>

                        <p className="mb-6">
                            Markmið okkar er að minnka ágreining og auka gleðina sem fylgir sumarhúsinu.
                            Þegar allar reglur eru skýrar, bókanir gagnsæjar og fjármálin á hreinu, þá geta allir slakað á.
                        </p>

                        <h3 className="text-2xl font-serif text-charcoal mt-10 mb-4">Hafið samband</h3>
                        <p className="mb-6">
                            Við erum stöðugt að bæta kerfið. Ef þú hefur ábendingar eða spurningar, heyrðu endilega í okkur.
                        </p>

                        <div className="mb-8">
                            <p className="mb-4">
                                <a href="mailto:hallo@bustadurinn.is" className="text-amber hover:text-amber-dark font-medium underline underline-offset-4">
                                    hallo@bustadurinn.is
                                </a>
                            </p>
                            <p className="text-sm text-grey-mid">Eða fylltu út formið hér að neðan:</p>
                        </div>

                        {/* Contact Form */}
                        <div className="not-prose my-12">
                            <ContactForm />
                        </div>

                        <div className="mt-12 pt-8 border-t border-grey-warm/20">
                            <h3 className="text-lg font-serif mb-4">Systurverkefni</h3>
                            <p className="text-sm">
                                Bústaðurinn.is er hluti af fjölskyldu hugbúnaðarlausna frá Neðri Hóll Hugmyndahús ehf.
                                Skoðaðu einnig <a href="https://vaktaplan.is" target="_blank" rel="noopener" className="text-charcoal font-medium hover:underline">Vaktaplan.is</a> fyrir vaktasipulag og <a href="https://nagrannar.is" target="_blank" rel="noopener" className="text-charcoal font-medium hover:underline">Nágrannar.is</a> fyrir húsfélög í fjöleignarhúsum.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
