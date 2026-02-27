
interface ToggleProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (val: boolean) => void;
    disabled?: boolean;
}

export default function Toggle({ label, description, checked, onChange, disabled }: ToggleProps) {
    return (
        <div
            className={`flex items-start justify-between p-4 rounded-xl border transition-all ${checked
                ? 'bg-amber/5 border-amber/20'
                : 'bg-stone-50 border-stone-100'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && onChange(!checked)}
        >
            <div className="flex-1 mr-4">
                <h4 className="font-bold text-charcoal text-sm mb-1">{label}</h4>
                <p className="text-xs text-stone-500 leading-relaxed">{description}</p>
            </div>
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-amber' : 'bg-stone-200'}`}>
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
                />
            </div>
        </div>
    );
}
