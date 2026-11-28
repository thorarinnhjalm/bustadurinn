import { describe, it, expect } from 'vitest';
import { browserFamily, normalizeReports, parseBody, reduceUrl, MAX_BODY_BYTES } from './cspReport';

describe('cspReport', () => {
    it('normalises the legacy application/csp-report format', () => {
        const out = normalizeReports({
            'csp-report': {
                'document-uri': 'https://www.bustadurinn.is/login?returnUrl=%2Fx&token=secret#frag',
                'blocked-uri': 'inline',
                'violated-directive': "script-src-elem 'self'",
                'effective-directive': 'script-src-elem',
                'source-file': 'https://www.bustadurinn.is/assets/index-abc.js?x=1',
                'line-number': 12,
                'script-sample': 'a'.repeat(200),
                disposition: 'report',
            },
        }, 'Chrome');
        expect(out).toHaveLength(1);
        expect(out[0]).toMatchObject({
            directive: 'script-src-elem',
            blocked: 'inline',
            document: 'https://www.bustadurinn.is/login',
            source: 'https://www.bustadurinn.is/assets/index-abc.js',
            line: 12,
            disposition: 'report',
            browser: 'Chrome',
        });
        expect(out[0].sample).toHaveLength(80);
        expect(JSON.stringify(out)).not.toContain('secret');
    });

    it('normalises the Reporting API format and drops non-csp entries', () => {
        const out = normalizeReports([
            { type: 'deprecation', body: { id: 'x' } },
            {
                type: 'csp-violation',
                body: {
                    documentURL: 'https://www.bustadurinn.is/eiginleikar',
                    blockedURL: 'https://www.googletagmanager.com/gtag/js?id=G-1#x',
                    effectiveDirective: 'script-src-elem',
                    sample: 'secret page data',
                    lineNumber: 3,
                },
            },
        ]);
        expect(out).toHaveLength(1);
        expect(out[0].blocked).toBe('https://www.googletagmanager.com/gtag/js');
        expect(out[0].sample).toBeUndefined(); // only kept for inline/eval
    });

    it('redacts secret-bearing document paths and drops query strings', () => {
        const mk = (u: string) => normalizeReports({ 'csp-report': { 'document-uri': u, 'blocked-uri': 'eval', 'effective-directive': 'script-src' } })[0].document;
        expect(mk('https://www.bustadurinn.is/guest/abc')).toBe('https://www.bustadurinn.is/guest/[token]');
        expect(mk('https://www.bustadurinn.is/join?token=x')).toBe('https://www.bustadurinn.is/join/[redacted]');
        expect(mk('https://www.bustadurinn.is/join/abc123')).toBe('https://www.bustadurinn.is/join/[redacted]');
        expect(mk('https://www.bustadurinn.is/signup?returnUrl=/a&code=1')).toBe('https://www.bustadurinn.is/signup');
    });

    it('keeps the sample for eval and inline only', () => {
        const r = normalizeReports({ 'csp-report': { 'blocked-uri': 'eval', 'document-uri': 'https://a.is/', 'effective-directive': 'script-src', 'script-sample': 'x' } });
        expect(r[0].sample).toBe('x');
    });

    it('drops extension and about/blob noise', () => {
        for (const b of ['chrome-extension://abc/x.js', 'moz-extension://a/b', 'safari-extension://a', 'safari-web-extension://a', 'about:blank', 'blob:https://a.is/uuid']) {
            expect(normalizeReports({ 'csp-report': { 'blocked-uri': b, 'document-uri': 'https://a.is/', 'effective-directive': 'script-src' } })).toHaveLength(0);
        }
        expect(normalizeReports({ 'csp-report': { 'blocked-uri': 'https://a.is/', 'source-file': 'chrome-extension://abc/c.js', 'document-uri': 'https://a.is/' } })).toHaveLength(0);
    });

    it('reduces data: URLs to the scheme', () => {
        expect(reduceUrl('data:text/javascript,alert(1)')).toBe('data:');
    });

    it('rejects oversized bodies and parses strings/Buffers', () => {
        expect(parseBody('x'.repeat(MAX_BODY_BYTES + 1))).toBe('too-large');
        expect(parseBody(Buffer.from(JSON.stringify({ a: 1 })))).toEqual({ a: 1 });
        expect(parseBody('{"csp-report":{}}')).toEqual({ 'csp-report': {} });
        expect(() => parseBody('{nope')).toThrow();
        expect(parseBody(undefined)).toBeUndefined();
        expect(normalizeReports(undefined)).toEqual([]);
        expect(normalizeReports('garbage')).toEqual([]);
    });

    it('derives a coarse browser family', () => {
        expect(browserFamily('Mozilla/5.0 Chrome/120 Safari/537.36 Edg/120')).toBe('Edge');
        expect(browserFamily('Mozilla/5.0 Chrome/120 Safari/537.36')).toBe('Chrome');
        expect(browserFamily('Mozilla/5.0 Firefox/120.0')).toBe('Firefox');
        expect(browserFamily('Mozilla/5.0 Version/17 Safari/605')).toBe('Safari');
        expect(browserFamily(undefined)).toBe('other');
    });
});
