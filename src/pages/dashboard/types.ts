import type { InternalLog } from '@/types/models';

// InternalLog does not (yet) declare a structured `kind` field in src/types/models.ts.
// We add it locally here rather than editing the shared model file (owned by another
// concurrent change). Older logs in production predate this field, hence optional.
// `checklist` is populated on check_out/check_in logs when the house has a configured
// checkout/arrival checklist, and on the once-a-year seasonal logs — keyed by item label.
export type CheckInOutLog = InternalLog & {
    kind?: 'check_in' | 'check_out' | 'seasonal_spring' | 'seasonal_autumn';
    checklist?: Record<string, boolean>;
};

export interface LastCheckoutChecklist {
    allChecked: boolean;
    uncheckedItems: string[];
}

/** Called by the data hooks when a Firestore listener fails (state setter, stable identity). */
export type SetDashboardLoading = (loading: boolean) => void;
