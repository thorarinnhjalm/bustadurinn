import { useNavigate, useLocation, Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import SEO from '@/components/SEO';
import NewsletterSignup from '@/components/NewsletterSignup';
import NewsletterPopup from '@/components/NewsletterPopup';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface MarketingLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    keywords?: string;
    structuredData?: object;
    canonical?: string;
}

export default function MarketingLayout({
    children,
    title,
    description,
    keywords,
    structuredData,
    canonical
}: MarketingLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMenuOpen]);

    const isCurrent = (path: string) => location.pathname === path ? 'text-amber' : 'text-charcoal hover:text-amber';

    const navLinks = [
        { name: 'Eiginleikar', path: '/eiginleikar' },
        { name: 'Spurt & Svarað', path: '/spurt-og-svarad' },
        { name: 'Um Okkur', path: '/um-okkur' },
        { name: 'Hafa samband', path: '/hafa-samband' },
    ];

    return (
        <div className="min-h-screen bg-bone flex flex-col">
            <SEO
                title={title}
                description={description}
                keywords={keywords}
                structuredData={structuredData}
                canonical={canonical}
            />
            <NewsletterPopup />

            <nav className="fixed top-0 left-0 right-0 bg-bone/95 backdrop-blur-md z-[100] border-b border-grey-warm h-20 flex items-center">
                <div className="container mx-auto px-6 flex justify-between items-center relative">
                    <Link to="/" className="flex items-center gap-2 z-[110]">
                        <Logo size={28} className="text-charcoal" />
                        <span className="text-xl font-serif font-bold tracking-tight">Bústaðurinn.is</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`font-medium transition-colors text-sm uppercase tracking-wide ${isCurrent(link.path)}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={() => navigate('/signup')}
                            className="btn btn-primary px-4 py-2 text-sm md:px-6 md:py-2.5 shadow-sm"
                        >
                            Byrja núna
                        </button>

                        <div className="hidden md:block">
                            <button
                                onClick={() => navigate('/login')}
                                className="btn btn-ghost hover:bg-amber/10 text-charcoal font-semibold text-sm"
                            >
                                Innskrá
                            </button>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-charcoal focus:outline-none z-[110] -mr-2"
                            aria-label="Valmynd"
                        >
                            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`fixed inset-0 bg-bone z-[105] transition-transform duration-300 md:hidden flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6 text-center">
                        {navLinks.map((link, idx) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-2xl font-serif font-bold transition-all duration-300 transform ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                                style={{ transitionDelay: `${idx * 50}ms` }}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className={`w-12 h-0.5 bg-amber/20 transition-all duration-500 ${isMenuOpen ? 'w-24' : 'w-0'}`}></div>
                        <button
                            onClick={() => navigate('/login')}
                            className={`text-xl font-semibold text-charcoal hover:text-amber transition-all duration-300 transform ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                            style={{ transitionDelay: `${navLinks.length * 50}ms` }}
                        >
                            Innskrá
                        </button>
                    </div>
                </div>
            </nav >

            <main className="flex-1 pt-20">
                {children}
            </main>

            <footer className="bg-charcoal text-bone py-20 border-t border-white/5">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20 items-start text-left">
                        {/* Company Info */}
                        <div className="space-y-6">
                            <Link to="/" className="flex items-center gap-3">
                                <Logo size={32} className="text-white" />
                                <span className="text-2xl font-serif font-bold text-white tracking-tight">Bústaðurinn.is</span>
                            </Link>
                            <p className="text-stone-100 max-w-sm text-lg leading-relaxed opacity-95">
                                Við færum utanumhald sumarhússins úr flóknum Excel skjölum yfir í fágað og nútímalegt viðmót.
                            </p>
                        </div>

                        {/* Newsletter Mini */}
                        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h4 className="text-lg font-bold mb-2 text-white">Fréttabréf og ráð</h4>
                            <p className="text-stone-200 text-sm mb-6 opacity-90">Fáðu tilkynningu þegar við bætum við nýjum eiginleikum.</p>
                            <NewsletterSignup variant="compact" />
                        </div>
                    </div>

                    <div className="border-t border-white/20 pt-12">
                        <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-x-12 gap-y-6 mb-12">
                            <Link to="/eiginleikar" className="text-white hover:text-amber transition-colors text-base font-bold">Eiginleikar</Link>
                            <Link to="/spurt-og-svarad" className="text-white hover:text-amber transition-colors text-base font-bold whitespace-nowrap">Algengar spurningar</Link>
                            <Link to="/um-okkur" className="text-white hover:text-amber transition-colors text-base font-bold">Um Okkur</Link>
                            <Link to="/hafa-samband" className="text-white hover:text-amber transition-colors text-base font-bold whitespace-nowrap">Hafa samband</Link>
                            <Link to="/personuvernd" className="text-white hover:text-amber transition-colors text-base font-bold">Persónuvernd</Link>
                            <Link to="/skilmalar" className="text-white hover:text-amber transition-colors text-base font-bold">Skilmálar</Link>
                        </div>

                        <div className="text-center space-y-12">
                            <p className="text-white font-serif italic text-2xl tracking-wide">Betra skipulag fyrir sumarhúsið.</p>

                            <div className="space-y-4">
                                <p className="text-[12px] text-white uppercase tracking-[0.3em] font-black opacity-90">
                                    © {new Date().getFullYear()} Bústaðurinn.is.
                                </p>
                                <p className="text-[11px] text-stone-200 uppercase tracking-[0.2em] font-bold opacity-80">
                                    Útgefið af Neðri Hóll Hugmyndahús ehf.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div >
    );
}
