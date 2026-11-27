import { describe, it, expect } from 'vitest';
import { safeRedirect } from '@/utils/safeRedirect';

describe('safeRedirect', () => {
    it('allows same-origin relative paths', () => {
        expect(safeRedirect('/dashboard')).toBe('/dashboard');
        expect(safeRedirect('/join?token=abc')).toBe('/join?token=abc');
    });

    it('rejects null and empty strings', () => {
        expect(safeRedirect(null)).toBeNull();
        expect(safeRedirect('')).toBeNull();
    });

    it('rejects absolute and protocol-relative URLs', () => {
        expect(safeRedirect('https://evil.com')).toBeNull();
        expect(safeRedirect('//evil.com')).toBeNull();
    });

    it('rejects backslash tricks', () => {
        expect(safeRedirect('/\\evil.com')).toBeNull();
    });

    it('rejects control characters', () => {
        expect(safeRedirect('/ok\nLocation: x')).toBeNull();
        expect(safeRedirect('/ok\tx')).toBeNull();
    });

    it('rejects non-path schemes', () => {
        expect(safeRedirect('javascript:alert(1)')).toBeNull();
    });
});
