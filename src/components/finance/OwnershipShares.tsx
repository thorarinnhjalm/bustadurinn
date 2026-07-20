import { useState } from 'react';
import { Percent, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { computeMemberSharePercentages } from '@/utils/financeShares';
import { logger } from '@/utils/logger';

interface OwnershipSharesProps {
    houseId: string;
    ownerIds: string[];
    members: { uid: string; name: string }[];
    memberShares?: { [uid: string]: number };
    onSaved: (memberShares: { [uid: string]: number }) => void;
}

/**
 * Manager-only editor for House.finance_settings.member_shares — the
 * ownership weights used to split shared costs (see src/utils/financeShares.ts).
 * Never used for usage/nights-based splitting; ownership share only.
 */
export default function OwnershipShares({ houseId, ownerIds, members, memberShares, onSaved }: OwnershipSharesProps) {
    const [expanded, setExpanded] = useState(false);
    const [weights, setWeights] = useState<{ [uid: string]: string }>(() => {
        const initial: { [uid: string]: string } = {};
        ownerIds.forEach((uid) => {
            initial[uid] = (memberShares?.[uid] ?? 1).toString();
        });
        return initial;
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const nameFor = (uid: string) => members.find((m) => m.uid === uid)?.name || uid;

    const previewPercentages = computeMemberSharePercentages(
        ownerIds,
        Object.fromEntries(
            Object.entries(weights).map(([uid, v]) => [uid, parseFloat(v)])
        )
    );

    const handleChange = (uid: string, value: string) => {
        setWeights((prev) => ({ ...prev, [uid]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const parsed: { [uid: string]: number } = {};
            ownerIds.forEach((uid) => {
                const n = parseFloat(weights[uid]);
                parsed[uid] = Number.isFinite(n) && n > 0 ? n : 1;
            });

            await updateDoc(doc(db, 'houses', houseId), {
                'finance_settings.member_shares': parsed
            });

            onSaved(parsed);
            setSaved(true);
        } catch (error) {
            logger.error('Error saving ownership shares:', error);
        } finally {
            setSaving(false);
        }
    };

    if (ownerIds.length === 0) return null;

    return (
        <div className="card">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex justify-between items-center"
            >
                <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-amber" />
                    <div className="text-left">
                        <h3 className="font-serif text-lg text-charcoal">Eignarhlutir</h3>
                        <p className="text-xs text-grey-mid mt-0.5">
                            Vægi hvers eiganda í skiptingu sameiginlegs kostnaðar
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-grey-mid" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-grey-mid" />
                )}
            </button>

            {expanded && (
                <div className="mt-6 space-y-4">
                    <p className="text-sm text-grey-mid">
                        Notað til að reikna hlutdeild hvers eiganda í sameiginlegum kostnaði.
                        Sjálfgefið er jöfn skipting (allir með vægi 1).
                    </p>

                    <div className="space-y-3">
                        {ownerIds.map((uid) => (
                            <div key={uid} className="flex items-center justify-between gap-4">
                                <span className="text-sm font-medium text-charcoal truncate">{nameFor(uid)}</span>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        className="input w-20 text-right"
                                        value={weights[uid] ?? '1'}
                                        onChange={(e) => handleChange(uid, e.target.value)}
                                    />
                                    <span className="text-xs text-grey-mid w-12 text-right">
                                        {(previewPercentages[uid] ?? 0).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-grey-warm">
                        {saved && <span className="text-xs text-green-600">Vistað</span>}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary btn-sm"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Vista...' : 'Vista eignarhluti'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
