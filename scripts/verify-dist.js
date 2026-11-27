/**
 * Post-build sanity check for the shell / prerender / service worker / Vercel
 * wiring. Run after `npm run build`:  node scripts/verify-dist.js
 * Exits non-zero if any assertion fails.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
let failed = 0;

function check(name, ok, detail = '') {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? ` -- ${detail}` : ''}`);
    if (!ok) failed++;
}
const read = (p) => readFileSync(p, 'utf8');
function walk(dir) {
    return readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? walk(p) : [p];
    });
}
const entryScript = (html) => (html.match(/<script[^>]+type="module"[^>]+src="(\/assets\/[^"]+\.js)"/) || [])[1];

const shellPath = join(DIST, 'app-shell.html');
const indexPath = join(DIST, 'index.html');
check('dist/app-shell.html exists', existsSync(shellPath));
check('dist/index.html exists', existsSync(indexPath));
if (!existsSync(shellPath) || !existsSync(indexPath)) process.exit(1);

const shell = read(shellPath);
const index = read(indexPath);

// Landing-only markers: the shell's #root is empty (its only <h1> lives in a
// <noscript> fallback), the prerendered page has a rendered <h1> in the body.
const stripNoscript = (html) => html.replace(/<noscript[\s\S]*?<\/noscript>/g, '');
const rootStart = (html) => stripNoscript(html).split('<div id="root">')[1] ?? '';
check('shell has no rendered <h1> outside <noscript>', !/<h1[\s>]/.test(stripNoscript(shell)));
check('shell #root has no element children', !/^\s*<[a-z]/i.test(rootStart(shell)), rootStart(shell).slice(0, 80));
check('dist/index.html is prerendered (rendered <h1> outside <noscript>)', /<h1[\s>]/.test(stripNoscript(index)));
check('shell and index.html differ', shell !== index);

// Same hashed entry script everywhere.
const shellEntry = entryScript(shell);
check('shell references a hashed entry script', !!shellEntry, String(shellEntry));
const prerendered = walk(DIST).filter((p) => p.endsWith('index.html'));
const mismatched = prerendered.filter((p) => entryScript(read(p)) !== shellEntry);
check(`all ${prerendered.length} prerendered HTML files use the shell's entry script`, mismatched.length === 0, mismatched.join(', '));

// Service worker precache manifest.
const swPath = join(DIST, 'firebase-messaging-sw.js');
check('service worker exists', existsSync(swPath));
const sw = existsSync(swPath) ? read(swPath) : '';
check('SW precache manifest contains app-shell.html', /"url"\s*:\s*"app-shell\.html"|url\s*:\s*"app-shell\.html"/.test(sw));
check('SW precache manifest does NOT contain index.html', !/"url"\s*:\s*"index\.html"/.test(sw));
check('SW navigation fallback is bound to app-shell.html', /\(\s*"app-shell\.html"\s*\)\s*,\s*\{\s*denylist/.test(sw));
check('SW still wires FCM background messages', /onBackgroundMessage/.test(sw) || /showNotification/.test(sw));

// vercel.json.
const vercel = JSON.parse(read(join(ROOT, 'vercel.json')));
const fallback = vercel.rewrites.find((r) => r.source.includes('(?!api'));
check('vercel.json fallback destination equals /app-shell.html', fallback?.destination === '/app-shell.html', String(fallback?.destination));
check('fallback target exists in dist', existsSync(join(DIST, fallback?.destination?.slice(1) ?? '__none__')));

// No duplicated third-party tags in prerendered output.
const count = (s, re) => (s.match(re) || []).length;
for (const p of prerendered) {
    const html = read(p);
    const rel = p.slice(DIST.length + 1);
    const g = count(html, /<script[^>]+src="[^"]*gtag\/js/g);
    const f = count(html, /<script[^>]+src="[^"]*fbevents\.js/g);
    check(`${rel}: <=1 gtag/js tag (${g}), <=1 fbevents.js tag (${f})`, g <= 1 && f <= 1);
}
const withTags = prerendered.filter((p) => /<script[^>]+src="[^"]*(gtag\/js|fbevents\.js)/.test(read(p)));
check('no prerendered file has a baked-in gtag/fbevents tag', withTags.length === 0, withTags.join(', '));

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
