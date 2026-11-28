import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, getCspReportRateLimit, getIdentifier, tryGetRateLimit } from './utils/ratelimit.js';
import { MAX_BODY_BYTES, browserFamily, normalizeReports, parseBody } from './utils/cspReport.js';

/**
 * CSP violation report sink (see docs/engineering/CSP.md).
 *
 * Browsers send these without credentials, so there is no auth. Reports are
 * best-effort: one `csp-violation` log line each, nothing stored, nothing echoed.
 * Always 204, except 405 for non-POST and 413 for bodies over 16 KB.
 * Accepts `application/csp-report` (legacy report-uri) and `application/reports+json` (report-to).
 */

async function readStream(req: VercelRequest): Promise<string | 'too-large'> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req as any) {
        const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += b.length;
        if (size > MAX_BODY_BYTES) return 'too-large';
        chunks.push(b);
    }
    return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end();
    }

    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return res.status(413).end();

    try {
        // Fail closed in the opposite direction from other routes: if the limiter is
        // unavailable or exhausted, drop the report so this can never flood the logs.
        const limiter = tryGetRateLimit(getCspReportRateLimit);
        if (!limiter) return res.status(204).end();
        const limit = await checkRateLimit(limiter, getIdentifier(req));
        if (!limit.allowed) return res.status(204).end();

        let raw: unknown = req.body;
        if (raw === undefined || raw === null || raw === '') {
            raw = await readStream(req);
            if (raw === 'too-large') return res.status(413).end();
        }
        const parsed = parseBody(raw);
        if (parsed === 'too-large') return res.status(413).end();

        const browser = browserFamily(req.headers['user-agent']);
        for (const violation of normalizeReports(parsed, browser)) {
            console.warn('csp-violation', JSON.stringify(violation));
        }
    } catch {
        // malformed JSON or limiter trouble: drop silently
    }
    return res.status(204).end();
}
