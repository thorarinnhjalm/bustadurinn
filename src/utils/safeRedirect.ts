/**
 * Validates a post-login redirect target.
 *
 * Only same-origin relative paths are allowed. Returns the url unchanged when it
 * is a single-slash path with no backslashes or ASCII control characters;
 * otherwise returns null.
 */
export function safeRedirect(url: string | null): string | null {
    if (typeof url !== 'string' || url.length === 0) return null;
    if (!url.startsWith('/') || url.startsWith('//')) return null;
    if (url.includes('\\')) return null;
    for (let i = 0; i < url.length; i++) {
        if (url.charCodeAt(i) < 0x20) return null;
    }
    return url;
}
