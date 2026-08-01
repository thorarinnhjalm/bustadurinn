import { useState } from 'react';
import { Flame, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { is } from 'date-fns/locale';
import type { GasCylinder } from '@/types/models';

// Module-level constants: an inline object/array default would be a new
// reference every render (see the CheckoutModal render-loop incident).
const SIZE_LABELS: Record<string, string> = {
    '5l': '5 lítra',
    '10l': '10 lítra',
};

const CONNECTION_LABELS: Record<string, string> = {
    smellugas: 'Smellugas',
    standard: 'Venjulegt tengi',
};

/**
 * The dashboard's house listener maps snapshots with `{ id, ...snap.data() }`
 * and never converts nested Timestamps, so `last_changed_at` arrives here as a
 * Firestore Timestamp rather than a Date. `new Date(timestamp)` yields an
 * Invalid Date, which made a successful save look like nothing had happened:
 * the card fell back to "not recorded" every time.
 */
function toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof (value as any).toDate === 'function') {
        const d = (value as any).toDate();
        return d instanceof Date ? d : null;
    }
    const parsed = new Date(value as any);
    return isNaN(parsed.getTime()) ? null : parsed;
}

interface GasCylinderCardProps {
    gasCylinder?: GasCylinder;
    onRecordChange: () => Promise<void> | void;
}

/**
 * Shows which gas cylinder the house takes — the thing you need to know while
 * standing in the shop — and how long since it was last replaced.
 */
export default function GasCylinderCard({ gasCylinder, onRecordChange }: GasCylinderCardProps) {
    const [saving, setSaving] = useState(false);
    const [failed, setFailed] = useState(false);

    // Not configured: nothing useful to show, and the settings page is where
    // it gets set up.
    if (!gasCylinder?.size || !gasCylinder?.connection) return null;

    const sizeLabel = SIZE_LABELS[gasCylinder.size] ?? gasCylinder.size;
    const connectionLabel = CONNECTION_LABELS[gasCylinder.connection] ?? gasCylinder.connection;

    const lastChanged = toDate(gasCylinder.last_changed_at);
    const lastChangedValid = lastChanged && !isNaN(lastChanged.getTime());

    const handleClick = async () => {
        setSaving(true);
        setFailed(false);
        try {
            await onRecordChange();
        } catch {
            // Silence here would look identical to success — the whole reason
            // this went unnoticed the first time round.
            setFailed(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center flex-shrink-0 text-amber">
                    <Flame size={18} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                        Gaskútur
                    </p>
                    <p className="font-medium text-charcoal">
                        {sizeLabel} · {connectionLabel}
                    </p>

                    <p className="text-sm text-stone-500 mt-1">
                        {lastChangedValid ? (
                            <>
                                Skipt fyrir {formatDistanceToNow(lastChanged, { locale: is })}
                                {gasCylinder.last_changed_by_name
                                    ? ` — ${gasCylinder.last_changed_by_name}`
                                    : ''}
                            </>
                        ) : (
                            'Ekki skráð hvenær síðast var skipt'
                        )}
                    </p>

                    {gasCylinder.notes && (
                        <p className="text-xs text-stone-400 mt-1">{gasCylinder.notes}</p>
                    )}

                    {failed && (
                        <p className="text-xs text-red-600 mt-2">
                            Ekki tókst að skrá skiptin. Reyndu aftur.
                        </p>
                    )}
                </div>
            </div>

            <button
                onClick={handleClick}
                disabled={saving}
                className="btn btn-secondary text-sm whitespace-nowrap disabled:opacity-50 flex items-center gap-2 justify-center"
            >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Skipti um kút
            </button>
        </div>
    );
}
