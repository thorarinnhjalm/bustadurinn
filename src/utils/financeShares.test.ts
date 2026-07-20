import { describe, it, expect } from 'vitest';
import { computeMemberShares, computeMemberSharePercentages } from './financeShares';

describe('computeMemberShares', () => {
    it('splits equally when memberShares is absent', () => {
        const result = computeMemberShares(300, ['a', 'b', 'c']);
        expect(result).toEqual({ a: 100, b: 100, c: 100 });
        expect(result.a + result.b + result.c).toBe(300);
    });

    it('splits equally when memberShares is an empty object', () => {
        const result = computeMemberShares(300, ['a', 'b', 'c'], {});
        expect(result).toEqual({ a: 100, b: 100, c: 100 });
    });

    it('splits by weight when memberShares is provided', () => {
        const result = computeMemberShares(300, ['a', 'b'], { a: 2, b: 1 });
        expect(result).toEqual({ a: 200, b: 100 });
        expect(result.a + result.b).toBe(300);
    });

    it('treats an owner missing from memberShares as weight 1 (equal default)', () => {
        // a=2, b unset => 1, total weight 3
        const result = computeMemberShares(300, ['a', 'b'], { a: 2 });
        expect(result).toEqual({ a: 200, b: 100 });
    });

    it('always sums exactly to the rounded total (largest remainder method)', () => {
        const result = computeMemberShares(100, ['a', 'b', 'c']);
        const sum = Object.values(result).reduce((s, v) => s + v, 0);
        expect(sum).toBe(100);
        // 100 / 3 = 33.33 -> two members get 34, one gets 33 (or similar split)
        const values = Object.values(result).sort((a, b) => a - b);
        expect(values).toEqual([33, 33, 34]);
    });

    it('breaks remainder ties deterministically by ascending uid', () => {
        // Equal weights, so all fractional remainders tie exactly.
        const result1 = computeMemberShares(10, ['b', 'a', 'c']);
        const result2 = computeMemberShares(10, ['c', 'b', 'a']);
        expect(result1).toEqual(result2);
        // 10 / 3 = 3.33 -> remainder 1 goes to the alphabetically-first uid
        expect(result1.a).toBe(4);
        expect(result1.b).toBe(3);
        expect(result1.c).toBe(3);
    });

    it('guards against a zero weight by excluding that member from allocation', () => {
        const result = computeMemberShares(300, ['a', 'b', 'c'], { a: 1, b: 1, c: 0 });
        expect(result.c).toBe(0);
        expect(result.a + result.b).toBe(300);
        expect(result.a).toBe(result.b);
    });

    it('guards against a negative weight the same way as zero', () => {
        const result = computeMemberShares(300, ['a', 'b'], { a: 1, b: -5 });
        expect(result.b).toBe(0);
        expect(result.a).toBe(300);
    });

    it('guards against non-finite weights (NaN/Infinity)', () => {
        const result = computeMemberShares(300, ['a', 'b'], { a: NaN, b: Infinity });
        // Both invalid -> total weight 0 -> falls back to equal split
        expect(result).toEqual({ a: 150, b: 150 });
    });

    it('falls back to an equal split when every configured weight is invalid', () => {
        const result = computeMemberShares(90, ['a', 'b', 'c'], { a: 0, b: 0, c: 0 });
        expect(result).toEqual({ a: 30, b: 30, c: 30 });
    });

    it('returns all zeros when totalExpenses is 0', () => {
        const result = computeMemberShares(0, ['a', 'b']);
        expect(result).toEqual({ a: 0, b: 0 });
    });

    it('returns an empty object when there are no owners', () => {
        expect(computeMemberShares(1000, [])).toEqual({});
    });

    it('rounds a fractional total to the nearest whole ISK before splitting', () => {
        const result = computeMemberShares(100.6, ['a']);
        expect(result.a).toBe(101);
    });

    it('deduplicates repeated uids in ownerIds', () => {
        const result = computeMemberShares(200, ['a', 'a', 'b']);
        expect(Object.keys(result).sort()).toEqual(['a', 'b']);
        expect(result.a + result.b).toBe(200);
    });

    it('handles a single owner (gets 100% of the total)', () => {
        const result = computeMemberShares(12345, ['a']);
        expect(result).toEqual({ a: 12345 });
    });

    it('handles negative totals (e.g. a net refund) preserving the sum', () => {
        const result = computeMemberShares(-100, ['a', 'b', 'c']);
        const sum = Object.values(result).reduce((s, v) => s + v, 0);
        expect(sum).toBe(-100);
    });
});

describe('computeMemberSharePercentages', () => {
    it('splits 100% equally when memberShares is absent', () => {
        const result = computeMemberSharePercentages(['a', 'b']);
        expect(result.a).toBeCloseTo(50);
        expect(result.b).toBeCloseTo(50);
    });

    it('reflects relative weights as percentages', () => {
        const result = computeMemberSharePercentages(['a', 'b'], { a: 3, b: 1 });
        expect(result.a).toBeCloseTo(75);
        expect(result.b).toBeCloseTo(25);
    });

    it('returns an empty object for no owners', () => {
        expect(computeMemberSharePercentages([])).toEqual({});
    });
});
