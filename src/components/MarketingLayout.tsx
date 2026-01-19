import { useNavigate, useLocation, Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import SEO from '@/components/SEO';
import NewsletterSignup from '@/components/NewsletterSignup';
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
        { name: 'Torgið', path: '/thjonusta' },
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
                <div className={`fixed inset-0 bg-white z-[105] transition-transform duration-300 md:hidden flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6 text-center">
                        {navLinks.map((link, idx) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`text-lg font-serif font-bold text-charcoal transition-all duration-300 transform ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                                style={{ transitionDelay: `${idx * 50}ms` }}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className={`w-12 h-0.5 bg-amber/20 transition-all duration-500 ${isMenuOpen ? 'w-24' : 'w-0'}`}></div>
                        <button
                            onClick={() => { setIsMenuOpen(false); navigate('/login'); }}
                            className={`text-lg font-semibold text-charcoal hover:text-amber transition-all duration-300 transform ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
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
                            <Link to="/verktakar" className="text-amber-400 hover:text-amber-300 transition-colors text-base font-bold">Fyrir Verktaka</Link>
                        </div>

                        <div className="text-center space-y-12">
                            {/* Social Media Links */}
                            <div className="flex justify-center gap-4">
                                <a
                                    href="https://www.facebook.com/bustadurinn.is/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 hover:border-amber/50 transition-all duration-300 hover:scale-105"
                                    aria-label="Fylgdu okkur á Facebook"
                                >
                                    <svg className="w-5 h-5 text-white group-hover:text-amber transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    <span className="text-white font-semibold group-hover:text-amber transition-colors">
                                        Fylgdu okkur á Facebook
                                    </span>
                                </a>
                                <a
                                    href="https://www.linkedin.com/company/bústaðurinn-is/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 hover:border-amber/50 transition-all duration-300 hover:scale-105"
                                    aria-label="Fylgdu okkur á LinkedIn"
                                >
                                    <svg className="w-5 h-5 text-white group-hover:text-amber transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    <span className="text-white font-semibold group-hover:text-amber transition-colors">
                                        Fylgdu okkur á LinkedIn
                                    </span>
                                </a>
                            </div>

                            <p className="text-white font-serif italic text-2xl tracking-wide">Betra skipulag fyrir sumarhúsið.</p>

                            <div className="space-y-4">
                                <p className="text-[12px] text-white uppercase tracking-[0.3em] font-black opacity-90">
                                    © {new Date().getFullYear()} Bústaðurinn.is.
                                </p>
                                <p className="text-[11px] text-stone-200 uppercase tracking-[0.2em] font-bold opacity-80">
                                    Útgefið af Neðri Hóll Hugmyndahús ehf.
                                </p>
                                <div className="text-[10px] text-stone-300/70 space-y-1 font-medium">
                                    <p>Kennitala: 4701262480 • VSK númer: 159950</p>
                                    <p>Álfhólsvegi 97, 200 Kópavogur</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div >
    );
}
