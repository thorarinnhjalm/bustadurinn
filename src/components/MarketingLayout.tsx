import { useNavigate, useLocation, Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Helmet } from 'react-helmet-async';

interface MarketingLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function MarketingLayout({ children, title, description }: MarketingLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const isCurrent = (path: string) => location.pathname === path ? 'text-amber' : 'text-charcoal hover:text-amber';

    return (
        <div className="min-h-screen bg-bone flex flex-col">
            <Helmet>
                <title>{title ? `${title} | Bústaðurinn.is` : 'Bústaðurinn.is - Betra skipulag fyrir sumarhús'}</title>
                <meta name="description" content={description || "Betra skipulag fyrir sameignarhúsið. Bókunardagatal, gagnsær fjármál og stafræn lyklakippa."} />
                <link rel="canonical" href={`https://bustadurinn.is${location.pathname}`} />
            </Helmet>

            <nav className="fixed top-0 left-0 right-0 bg-bone/95 backdrop-blur-sm z-50 border-b border-grey-warm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3">
                        <Logo size={32} className="text-charcoal" />
                        <h1 className="text-2xl font-serif font-bold pt-1">Bústaðurinn.is</h1>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/eiginleikar" className={`font-medium transition-colors ${isCurrent('/eiginleikar')}`}>Eiginleikar</Link>
                        <Link to="/spurt-og-svarad" className={`font-medium transition-colors ${isCurrent('/spurt-og-svarad')}`}>Spurt & Svarað</Link>
                        <Link to="/um-okkur" className={`font-medium transition-colors ${isCurrent('/um-okkur')}`}>Um Okkur</Link>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => navigate('/login')} className="btn btn-ghost hover:bg-amber/10">Innskrá</button>
                        <button onClick={() => navigate('/signup')} className="btn btn-primary">Byrja núna</button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 pt-20">
                {children}
            </main>

            <footer className="bg-charcoal text-bone py-12 border-t border-white/5">
                <div className="container mx-auto text-center">
                    <div className="mb-8 flex justify-center">
                        <Logo size={48} className="text-white opacity-20" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 mb-8 text-grey-warm font-medium">
                        <Link to="/eiginleikar" className="hover:text-white transition-colors">Eiginleikar</Link>
                        <Link to="/spurt-og-svarad" className="hover:text-white transition-colors">Algengar spurningar</Link>
                        <Link to="/um-okkur" className="hover:text-white transition-colors">Um Okkur</Link>
                        <Link to="/personuvernd" className="hover:text-white transition-colors">Persónuvernd</Link>
                        <Link to="/skilmalar" className="hover:text-white transition-colors">Skilmálar</Link>
                    </div>
                    <p className="text-grey-warm mb-6 font-serif italic">Betra skipulag fyrir sumarhúsið.</p>
                    <p className="text-sm text-grey-mid">
                        © {new Date().getFullYear()} Bústaðurinn.is.<br />
                        Útgefið af Neðri Hóll Hugmyndahús ehf.
                    </p>
                </div>
            </footer>
        </div>
    );
}
