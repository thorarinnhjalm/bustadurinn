import MarketingMap from '@/components/MarketingMap';
import { Helmet } from 'react-helmet-async';

export default function MarketingMapPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Helmet>
                <title>Kort af bústöðum | Bústaðurinn.is</title>
            </Helmet>

            <div className="flex-1 relative bg-stone-100">
                <MarketingMap />
            </div>
        </div>
    );
}
