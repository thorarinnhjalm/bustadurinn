import { describe, it, expect } from 'vitest';
import { getUserMessage } from './userMessages';

describe('getUserMessage', () => {
    it('maps auth codes to Icelandic text', () => {
        expect(getUserMessage({ code: 'auth/invalid-credential' })).toMatch(/lykilorð/i);
        expect(getUserMessage({ code: 'auth/email-already-in-use' })).toMatch(/netfang/i);
        expect(getUserMessage({ code: 'auth/too-many-requests' })).toMatch(/Bíddu/);
    });

    it('maps firestore and storage codes', () => {
        expect(getUserMessage({ code: 'permission-denied' })).toMatch(/aðgang/);
        expect(getUserMessage({ code: 'unavailable' })).toMatch(/Reyndu aftur/);
        expect(getUserMessage({ code: 'storage/quota-exceeded' })).toMatch(/Geymslurými/);
    });

    it('maps fetch failures', () => {
        expect(getUserMessage(new TypeError('Failed to fetch'))).toMatch(/nettenging/);
    });

    it('returns the default fallback for unknown errors and never leaks English text', () => {
        const msg = getUserMessage(new Error('Something exploded internally'));
        expect(msg).toBe('Villa kom upp. Reyndu aftur.');
        expect(getUserMessage('weird')).toBe('Villa kom upp. Reyndu aftur.');
        expect(getUserMessage(null)).toBe('Villa kom upp. Reyndu aftur.');
    });

    it('uses a custom fallback', () => {
        expect(getUserMessage({ code: 'auth/nope' }, 'Sérsniðin villa')).toBe('Sérsniðin villa');
    });
});
