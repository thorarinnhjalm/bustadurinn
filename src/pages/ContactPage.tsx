import MarketingLayout from '@/components/MarketingLayout';
import ContactForm from '@/components/ContactForm';

export default function ContactPage() {
    return (
        <MarketingLayout
            title="Hafa samband"
            description="Hafðu samband við Bústaðurinn.is. Við svörum fljótt."
        >
            <div className="bg-white py-24">
                <div className="container max-w-2xl mx-auto px-6">
                    <h1 className="text-4xl font-serif mb-6 text-center">Hafa samband</h1>

                    <p className="text-lg text-grey-dark text-center mb-12 leading-relaxed">
                        Við erum stöðugt að bæta kerfið. Ef þú hefur ábendingar eða spurningar, heyrðu endilega í okkur.
                    </p>

                    {/* Contact Form */}
                    <div className="bg-bone/30 rounded-2xl p-8 border border-stone-200">
                        <ContactForm />
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
