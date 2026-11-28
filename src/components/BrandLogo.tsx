import Logo from '@/components/Logo';

interface BrandLogoProps {
    /** sm: app bars and sidebars, md: marketing header, lg: footer, xl: sign-in pages */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Colour comes from the text colour; pass e.g. `text-white` on dark surfaces */
    className?: string;
}

const SIZES = {
    sm: { icon: 20, gap: 'gap-2', text: 'text-lg' },
    md: { icon: 28, gap: 'gap-2', text: 'text-xl' },
    lg: { icon: 32, gap: 'gap-3', text: 'text-2xl' },
    xl: { icon: 36, gap: 'gap-3', text: 'text-3xl md:text-4xl' },
} as const;

/**
 * The one brand lockup: A-frame icon + the "Bústaðurinn.is" wordmark.
 * Use this wherever the product name appears as a logo, so it looks the same everywhere.
 */
export default function BrandLogo({ size = 'md', className = 'text-charcoal' }: BrandLogoProps) {
    const s = SIZES[size];
    return (
        <span className={`inline-flex items-center ${s.gap} ${className}`}>
            <Logo size={s.icon} decorative className="shrink-0" />
            <span className={`${s.text} font-serif font-bold tracking-tight leading-none`}>Bústaðurinn.is</span>
        </span>
    );
}
