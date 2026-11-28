import { useId } from 'react';

interface ToggleProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (val: boolean) => void;
    disabled?: boolean;
    /** 'card' = boxed, whole card clickable; 'row' = plain row (profile notification lists) */
    variant?: 'card' | 'row';
}

/**
 * Accessible on/off switch: a real <button role="switch" aria-checked>
 * labelled and described by the visible text next to it.
 */
export default function Toggle({ label, description, checked, onChange, disabled, variant = 'card' }: ToggleProps) {
    const id = useId();
    const labelId = `${id}-label`;
    const descId = `${id}-desc`;

    const switchButton = (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-labelledby={labelId}
            aria-describedby={descId}
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                onChange(!checked);
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 ${checked ? 'bg-amber' : 'bg-stone-200'} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
            <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    );

    if (variant === 'row') {
        return (
            <div className={`flex items-start justify-between py-2`}>
                <div className="flex-1 mr-4">
                    <p id={labelId} className="text-sm font-bold text-charcoal">{label}</p>
                    <p id={descId} className="text-xs text-stone-500">{description}</p>
                </div>
                {switchButton}
            </div>
        );
    }

    return (
        <div
            className={`flex items-start justify-between p-4 rounded-xl border transition-all ${checked
                ? 'bg-amber/5 border-amber/20'
                : 'bg-stone-50 border-stone-100'
                } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && onChange(!checked)}
        >
            <div className="flex-1 mr-4">
                <h4 id={labelId} className="font-bold text-charcoal text-sm mb-1">{label}</h4>
                <p id={descId} className="text-xs text-stone-500 leading-relaxed">{description}</p>
            </div>
            {switchButton}
        </div>
    );
}
