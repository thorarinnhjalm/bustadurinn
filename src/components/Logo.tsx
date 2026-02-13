/**
 * Bústaðurinn.is Logo Component
 * A-Frame Cabin SVG Icon
 */

interface LogoProps {
    className?: string;
    size?: number;
}

export default function Logo({ className = "", size = 24 }: LogoProps) {
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
            aria-label="Bústaðurinn.is - A-Frame Cabin"
        >
            {/* The A-Frame Roof */}
            <path d="M12 2L2 22H22L12 2Z" />

            {/* The Doorway */}
            <path d="M12 15V22" />
        </svg>
    );
}
