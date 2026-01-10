import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
    content: string;
    children?: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-flex items-center">
            {children}
            <button
                type="button"
                className="ml-1.5 text-stone-400 hover:text-amber transition-colors"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onClick={() => setIsVisible(!isVisible)}
                aria-label="Hjálp"
            >
                <HelpCircle size={16} />
            </button>

            {isVisible && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 
                    bg-charcoal text-white text-sm rounded-lg shadow-xl
                    animate-in fade-in zoom-in-95 duration-200">
                    <p className="leading-relaxed">{content}</p>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="border-8 border-transparent border-t-charcoal" />
                    </div>
                </div>
            )}
        </div>
    );
}

// Inline tooltip for use directly in labels
export function TooltipLabel({
    label,
    tooltip
}: {
    label: string;
    tooltip: string;
}) {
    return (
        <Tooltip content={tooltip}>
            <span>{label}</span>
        </Tooltip>
    );
}
