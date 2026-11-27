/**
 * Cryptographically secure token / code generation.
 *
 * Use these instead of Math.random() for anything that acts as a bearer
 * secret (guest links, house invite codes).
 */

// Uppercase letters and digits without the ambiguous 0/O, 1/I/L.
const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
}

/**
 * URL-safe random token (base64url, no padding) built from `bytes` random bytes.
 * Default 24 bytes = 192 bits = 32 characters.
 */
export function generateSecureToken(bytes = 24): string {
    const raw = randomBytes(Math.max(1, Math.floor(bytes)));
    let binary = '';
    for (let i = 0; i < raw.length; i++) {
        binary += String.fromCharCode(raw[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Human-friendly invite code from an unambiguous alphabet.
 * Uses rejection sampling so every character is equally likely (no modulo bias).
 */
export function generateInviteCode(length = 8): string {
    const size = INVITE_ALPHABET.length;
    // Largest multiple of `size` that fits in a byte; bytes >= limit are rejected.
    const limit = 256 - (256 % size);
    const wanted = Math.max(1, Math.floor(length));
    let result = '';
    while (result.length < wanted) {
        const bytes = randomBytes(Math.max(16, (wanted - result.length) * 2));
        for (let i = 0; i < bytes.length && result.length < wanted; i++) {
            if (bytes[i] < limit) {
                result += INVITE_ALPHABET[bytes[i] % size];
            }
        }
    }
    return result;
}
