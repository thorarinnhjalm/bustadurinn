import MarketingLayout from '@/components/MarketingLayout';
import { Calendar, User, Wallet, Wifi, Bell, Shield } from 'lucide-react';

export default function FeaturesPage() {
    const features = [
        {
            icon: Calendar,
            title: "Bókunardagatal",
            description: "Einfalt og skýrt dagatal sem sýnir hver á hvaða helgi. Hægt að bóka fram í tímann og sjá yfirlit yfir nýtingu."
        },
        {
            icon: Shield,
            title: "Sanngirnisregla",
            description: "Kerfið reiknar út forgang byggt á fyrri úthlutunum. Tryggir að allir fái sanngjarnan og jafnan aðgang að vinsælum dagsetningum."
        },
        {
            icon: Wallet,
            title: "Fjárhagsyfirlit",
            description: "Haldtu utan um hússjóðinn. Skráðu innborgarnir og útgjöld. Sjáðu strax ef reksturinn er í mínus."
        },
        {
            icon: User,
            title: "Hlutverkastýring",
            description: "Skilgreindu Bústaðastjóra (Manager) sem hefur yfirumsjón, og almenna Meðeigendur. Einfalt að bjóða nýju fólki."
        },
        {
            icon: Wifi,
            title: "Stafrænn Gestaref",
            description: "Búðu til tímabundinn hlekk fyrir leigjendur eða gesti. Þar sjá þeir Wi-Fi lykilorð, húsreglur og leiðbeiningar, en ekkert annað."
        },
        {
            icon: Bell,
            title: "Tilkynningar",
            description: "Fáðu tölvupóst þegar ný bókun er gerð eða gjalddagi nálgast. (Væntanlegt)"
        }
    ];

    return (
        <MarketingLayout
            title="Eiginleikar"
            description="Yfirlit yfir alla eiginleika Bústaðurinn.is. Bókunarkerfi, fjármál, verkefnastaða og fleira."
        >
            <div className="bg-bone py-24">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-serif mb-4">Allt sem þú þarft</h1>
                        <p className="text-xl text-grey-dark max-w-2xl mx-auto">
                            Við höfum hannað kerfið frá grunni með þarfir íslenskra sumarhúsaeigenda í huga.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <feature.icon className="w-10 h-10 text-amber mb-6" />
                                <h3 className="text-xl font-serif mb-3">{feature.title}</h3>
                                <p className="text-grey-dark leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
