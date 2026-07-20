/**
 * Ownership-share cost splitting.
 *
 * Owner decision (see ROADMAP_2026.md Phase 4): shared costs are ALWAYS
 * split by ownership share (equal by default). There is no usage/nights
 * based splitting anywhere in this codebase — do not add one.
 */

/** Per-uid ownership weight, e.g. House.finance_settings.member_shares. */
export type MemberShareWeights = { [uid: string]: number };

/**
 * Resolves the effective weight for each owner:
 * - Missing entry (uid not present in `memberShares`, or `memberShares`
 *   itself absent) => weight 1 (equal split contribution).
 * - Present but invalid (non-finite, zero, or negative) => weight 0,
 *   guarding against divide-by-zero / negative allocations from bad data.
 * - If every resolved weight ends up 0 (e.g. all entries invalid, or all
 *   explicitly set to 0), falls back to an equal split (weight 1 each)
 *   rather than allocating nothing.
 */
function resolveWeights(ownerIds: string[], memberShares?: MemberShareWeights): number[] {
    let weights = ownerIds.map((uid) => {
        const raw = memberShares?.[uid];
        if (raw === undefined) return 1;
        if (!Number.isFinite(raw) || raw <= 0) return 0;
        return raw;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight <= 0) {
        weights = ownerIds.map(() => 1);
    }

    return weights;
}

/**
 * Computes each owner's ownership share, as a percentage of the total
 * weight (0-100), independent of any monetary amount. Percentages sum to
 * ~100 (floating point).
 */
export function computeMemberSharePercentages(
    ownerIds: string[],
    memberShares?: MemberShareWeights
): Record<string, number> {
    const uids = Array.from(new Set(ownerIds.filter(Boolean)));
    const result: Record<string, number> = {};
    if (uids.length === 0) return result;

    const weights = resolveWeights(uids, memberShares);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    uids.forEach((uid, i) => {
        result[uid] = totalWeight > 0 ? (weights[i] / totalWeight) * 100 : 0;
    });

    return result;
}

/**
 * Splits `totalExpenses` across `ownerIds` by ownership weight
 * (`memberShares`, equal when absent — see resolveWeights above).
 *
 * Returns whole-ISK amounts per uid that sum EXACTLY to
 * `Math.round(totalExpenses)` (largest-remainder method: each member's
 * exact fractional share is floored, then the leftover 1-ISK units are
 * handed out to the members with the largest fractional remainder,
 * ties broken by ascending uid for determinism).
 */
export function computeMemberShares(
    totalExpenses: number,
    ownerIds: string[],
    memberShares?: MemberShareWeights
): Record<string, number> {
    const uids = Array.from(new Set(ownerIds.filter(Boolean)));
    const result: Record<string, number> = {};
    if (uids.length === 0) return result;

    if (!Number.isFinite(totalExpenses) || totalExpenses === 0) {
        uids.forEach((uid) => { result[uid] = 0; });
        return result;
    }

    const target = Math.round(totalExpenses);
    const weights = resolveWeights(uids, memberShares);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // totalWeight is guaranteed > 0 by resolveWeights' fallback.
    const exact = weights.map((w) => (target * w) / totalWeight);
    const floored = exact.map((v) => Math.floor(v));
    const allocated = floored.reduce((sum, v) => sum + v, 0);
    let remainder = target - allocated;

    // Distribute the leftover whole-ISK units to the largest fractional
    // remainders first; ties broken by ascending uid for a deterministic,
    // reproducible result (important for tests and for not looking random
    // to end users across re-renders).
    const order = uids
        .map((uid, i) => ({ uid, i, frac: exact[i] - floored[i] }))
        .sort((a, b) => {
            if (b.frac !== a.frac) return b.frac - a.frac;
            return a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0;
        });

    const finalAmounts = [...floored];
    // remainder may be negative-adjacent-safe: 0 <= remainder < uids.length
    // for positive targets; for negative targets the same identity holds
    // with signs flipped (remainder stays within [0, n)) because
    // sum(exact) === target exactly.
    for (let k = 0; k < Math.abs(remainder) && k < order.length; k++) {
        const idx = order[k].i;
        finalAmounts[idx] += remainder > 0 ? 1 : -1;
    }

    uids.forEach((uid, i) => { result[uid] = finalAmounts[i]; });
    return result;
}
