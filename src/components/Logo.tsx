/**
 * Bústaðurinn.is Logo Component
 * A-Frame Cabin SVG Icon
 */

interface LogoProps {
    className?: string;
    size?: number;
    /** Set when the logo sits next to the brand name text, so it is not announced twice */
    decorative?: boolean;
}

export default function Logo({ className = "", size = 24, decorative = false }: LogoProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            width={size}
            height={size}
            className={className}
            {...(decorative
                ? { 'aria-hidden': true as const }
                : { role: 'img', 'aria-label': 'Bústaðurinn.is merki' })}
        >
            {/* The A-Frame Roof */}
            <path d="M12 2L2 22H22L12 2Z" />

            {/* The Doorway */}
            <path d="M12 15V22" />
        </svg>
    );
}
