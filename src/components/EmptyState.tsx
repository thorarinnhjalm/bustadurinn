import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
    children?: ReactNode;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
    children
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center mb-6">
                <Icon className="w-8 h-8 text-amber" strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-serif font-bold text-charcoal mb-2">
                {title}
            </h3>

            {/* Description */}
            <p className="text-stone-500 max-w-sm mb-6 leading-relaxed">
                {description}
            </p>

            {/* Actions */}
            {(actionLabel || secondaryActionLabel) && (
                <div className="flex flex-wrap gap-3 justify-center">
                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className="btn btn-primary"
                        >
                            {actionLabel}
                        </button>
                    )}
                    {secondaryActionLabel && onSecondaryAction && (
                        <button
                            onClick={onSecondaryAction}
                            className="btn btn-secondary"
                        >
                            {secondaryActionLabel}
                        </button>
                    )}
                </div>
            )}

            {/* Custom children */}
            {children}
        </div>
    );
}
