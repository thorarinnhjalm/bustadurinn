import { describe, it, expect } from 'vitest';
import { generateSecureToken, generateInviteCode } from './secureToken';

describe('generateSecureToken', () => {
    it('returns URL-safe base64 of the expected length', () => {
        const token = generateSecureToken();
        expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(token.length).toBe(32); // 24 bytes -> 32 base64url chars
    });

    it('honours the byte count', () => {
        expect(generateSecureToken(32).length).toBe(43);
        expect(generateSecureToken(16).length).toBe(22);
    });

    it('produces distinct values', () => {
        const seen = new Set(Array.from({ length: 200 }, () => generateSecureToken()));
        expect(seen.size).toBe(200);
    });
});

describe('generateInviteCode', () => {
    it('defaults to 8 characters from the unambiguous alphabet', () => {
        const code = generateInviteCode();
        expect(code).toHaveLength(8);
        expect(code).toMatch(/^[A-HJKMNP-Z2-9]+$/);
    });

    it('never contains ambiguous characters', () => {
        for (let i = 0; i < 300; i++) {
            expect(generateInviteCode(12)).not.toMatch(/[01OIL]/);
        }
    });

    it('honours the requested length', () => {
        expect(generateInviteCode(4)).toHaveLength(4);
        expect(generateInviteCode(40)).toHaveLength(40);
    });

    it('produces distinct values', () => {
        const seen = new Set(Array.from({ length: 200 }, () => generateInviteCode()));
        expect(seen.size).toBe(200);
    });
});
