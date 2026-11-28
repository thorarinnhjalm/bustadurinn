/**
 * Pure helpers for api/csp-report.ts: parse and normalise CSP violation reports
 * so that nothing secret-bearing (invitation / guest tokens, query strings, page
 * data in script samples, IPs) ends up in the logs.
 */

export const MAX_BODY_BYTES = 16 * 1024;
export const MAX_REPORTS_PER_REQUEST = 20;
const MAX_SAMPLE = 80;
const MAX_PATH = 200;

export interface NormalizedViolation {
    directive: string;
    blocked: string;
    document: string;
    source?: string;
    line?: number;
    disposition?: string;
    sample?: string;
    browser?: string;
}

const EXTENSION_SCHEMES = /^(chrome-extension|moz-extension|safari-extension|safari-web-extension|about|blob):/i;
const KEYWORDS = new Set(['inline', 'eval', 'wasm-eval', 'self', 'data', 'mediastream', 'trusted-types-policy', 'trusted-types-sink', 'url']);

/** Path of a same-site URL with secret-bearing routes redacted. */
export function redactPath(path: string): string {
    if (path.startsWith('/guest/') || path === '/guest') return '/guest/[token]';
    if (path.startsWith('/join')) return '/join/[redacted]';
    return path.length > MAX_PATH ? path.slice(0, MAX_PATH) + '...' : path;
}

/** origin + (redacted) path. Query string and fragment are always dropped. Keywords and bare schemes pass through. */
export function reduceUrl(value: unknown): string {
    if (typeof value !== 'string' || value === '') return '';
    const v = value.trim();
    if (KEYWORDS.has(v)) return v;
    try {
        const u = new URL(v);
        if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'ws:' || u.protocol === 'wss:') {
            return u.origin + redactPath(u.pathname);
        }
        // data:, blob:, filesystem: ... report the scheme only, never the payload
        return u.protocol;
    } catch {
        return /^[a-z][a-z0-9+.-]*:?$/i.test(v) ? v.slice(0, 30) : 'invalid-url';
    }
}

export function isNoise(rawBlocked: unknown, rawSource?: unknown): boolean {
    for (const v of [rawBlocked, rawSource]) {
        if (typeof v === 'string' && EXTENSION_SCHEMES.test(v.trim())) return true;
    }
    return false;
}

export function browserFamily(ua: unknown): string {
    const s = typeof ua === 'string' ? ua : '';
    if (/Edg(e|A|iOS)?\//.test(s)) return 'Edge';
    if (/Firefox\/|FxiOS\//.test(s)) return 'Firefox';
    if (/Chrome\/|CriOS\//.test(s)) return 'Chrome';
    if (/Safari\//.test(s)) return 'Safari';
    return 'other';
}

const str = (v: unknown): string | undefined => (typeof v === 'string' && v !== '' ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : undefined);

/** Normalise one report body (either the legacy `csp-report` object or a Reporting API `body`). */
export function normalizeViolation(raw: any, browser?: string): NormalizedViolation | null {
    if (!raw || typeof raw !== 'object') return null;
    const blockedRaw = str(raw.blockedURL) ?? str(raw['blocked-uri']) ?? str(raw.blockedUri) ?? '';
    const sourceRaw = str(raw.sourceFile) ?? str(raw['source-file']);
    if (isNoise(blockedRaw, sourceRaw)) return null;

    const directive =
        str(raw.effectiveDirective) ?? str(raw['effective-directive']) ?? str(raw.violatedDirective) ?? str(raw['violated-directive']) ?? 'unknown';
    const blocked = reduceUrl(blockedRaw) || 'unknown';
    const out: NormalizedViolation = {
        directive: directive.split(/\s+/)[0].slice(0, 40),
        blocked,
        document: reduceUrl(str(raw.documentURL) ?? str(raw['document-uri']) ?? str(raw.documentUri)) || 'unknown',
    };
    if (sourceRaw) out.source = reduceUrl(sourceRaw);
    const line = num(raw.lineNumber) ?? num(raw['line-number']);
    if (line !== undefined) out.line = line;
    const disposition = str(raw.disposition);
    if (disposition) out.disposition = disposition.slice(0, 10);
    // Samples can contain page data: only keep them for inline / eval violations.
    const sample = str(raw.sample) ?? str(raw['script-sample']);
    if (sample && (blocked === 'inline' || blocked === 'eval')) out.sample = sample.slice(0, MAX_SAMPLE);
    if (browser) out.browser = browser;
    return out;
}

/** Normalise a parsed request body in either report format. */
export function normalizeReports(parsed: unknown, browser?: string): NormalizedViolation[] {
    const items: any[] = [];
    if (Array.isArray(parsed)) {
        // Reporting API: [{ type: 'csp-violation', body: {...} }, ...]
        for (const r of parsed) {
            if (r && typeof r === 'object' && (r as any).type === 'csp-violation') items.push((r as any).body);
        }
    } else if (parsed && typeof parsed === 'object') {
        const legacy = (parsed as any)['csp-report'];
        if (legacy) items.push(legacy);
        else if ((parsed as any).type === 'csp-violation') items.push((parsed as any).body);
    }
    return items
        .slice(0, MAX_REPORTS_PER_REQUEST)
        .map((i) => normalizeViolation(i, browser))
        .filter((v): v is NormalizedViolation => v !== null);
}

/** Parse a body of unknown shape (string, Buffer, object). Throws on invalid JSON; returns 'too-large' when over the cap. */
export function parseBody(body: unknown): unknown | 'too-large' {
    if (body === undefined || body === null) return undefined;
    if (typeof body === 'string' || (typeof Buffer !== 'undefined' && Buffer.isBuffer(body))) {
        const text = typeof body === 'string' ? body : body.toString('utf8');
        if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) return 'too-large';
        return JSON.parse(text);
    }
    if (typeof body === 'object') {
        // Already parsed by the platform; re-measure to apply the same cap.
        return JSON.stringify(body).length > MAX_BODY_BYTES ? 'too-large' : body;
    }
    return undefined;
}
