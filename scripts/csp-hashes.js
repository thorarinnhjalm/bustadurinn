/**
 * Prints the CSP `'sha256-...'` sources for every executable inline <script>
 * (no src, JavaScript type) found in the built HTML under a dist directory.
 *
 *   node scripts/csp-hashes.js [distDir]          # one hash per line, with source file
 *   node scripts/csp-hashes.js [distDir] --header # space-separated, ready for script-src
 *
 * Used by scripts/verify-dist.js. See docs/engineering/CSP.md.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const JS_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module', 'text/ecmascript', 'application/ecmascript']);

export function walkHtml(dir) {
    return readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        if (statSync(p).isDirectory()) return walkHtml(p);
        return p.endsWith('.html') ? [p] : [];
    });
}

/** Executable inline scripts of one HTML string: [{ text, hash }]. */
export function inlineScripts(html) {
    const out = [];
    const re = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
    let m;
    while ((m = re.exec(html))) {
        const attrs = m[1];
        if (/\bsrc\s*=/i.test(attrs)) continue;
        const tm = attrs.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const type = (tm ? (tm[1] ?? tm[2] ?? tm[3] ?? '') : '').trim().toLowerCase();
        if (!JS_TYPES.has(type)) continue; // JSON-LD etc. are data, not executed script
        if (m[2].trim() === '') continue;
        out.push({ text: m[2], hash: `'sha256-${createHash('sha256').update(m[2], 'utf8').digest('base64')}'` });
    }
    return out;
}

/** Map of hash -> { text, files: [relative paths] } for a dist directory. */
export function collectHashes(distDir) {
    const map = new Map();
    for (const file of walkHtml(distDir)) {
        for (const { text, hash } of inlineScripts(readFileSync(file, 'utf8'))) {
            const e = map.get(hash) ?? { text, files: [] };
            e.files.push(file.slice(distDir.length + 1));
            map.set(hash, e);
        }
    }
    return map;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const header = args.includes('--header');
    const dist = resolve(args.find((a) => !a.startsWith('--')) ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'dist'));
    const map = collectHashes(dist);
    if (header) {
        console.log([...map.keys()].sort().join(' '));
    } else {
        for (const [hash, { text, files }] of map) {
            console.log(`${hash}  ${files.length} file(s), e.g. ${files[0]}  ${JSON.stringify(text.trim().slice(0, 50))}`);
        }
    }
}
