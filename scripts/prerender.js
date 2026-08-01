/**
 * Build-time prerendering for public marketing/handbook routes.
 *
 * Why: the app is a pure client-rendered SPA (vite build + vercel.json's
 * catch-all rewrite to /index.html). Per-route <title>, <meta description>,
 * canonical and JSON-LD are all injected by react-helmet-async AFTER
 * JavaScript runs. Google eventually renders JS but slowly/unreliably for a
 * young domain with a small crawl budget, and AI crawlers (GPTBot,
 * PerplexityBot, ClaudeBot) largely don't run JS at all — they see an empty
 * <div id="root"> today.
 *
 * What this does: serves the already-built dist/ over a local static
 * server, drives real Chromium (playwright-core) to each public route,
 * waits for the route to actually render (an <h1> — the loading spinner
 * fallback has no h1), and writes the resulting fully-rendered HTML to
 * dist/<route>/index.html. On Vercel, static files are matched against the
 * filesystem BEFORE rewrites run, so these files are served as-is for
 * exact-match requests and the SPA rewrite is untouched for every other
 * (dynamic/private) path. See vercel.json — no changes were needed there;
 * see the note at the bottom of this file for why.
 *
 * Route list: imported from scripts/generate-sitemap.js so the sitemap and
 * the prerender set can never drift apart. A couple of sitemap routes are
 * deliberately excluded — see EXCLUDED_ROUTES below.
 *
 * Design choices worth knowing about:
 *  - Rendering happens in one pass against the pristine, un-prerendered
 *    dist/ (all pages are captured into memory first, then written to disk
 *    together). If we wrote files as we went, prerendering /handbok before
 *    /handbok/fjarmal would change what the local server's SPA-fallback
 *    resolves to mid-run, making output depend on route processing order.
 *  - All non-localhost network requests are aborted during rendering
 *    (Firebase Auth/Firestore, Google Fonts, GA, Meta Pixel, etc.). This
 *    keeps the build fast, deterministic and independent of third-party
 *    availability, and it also *is* the "logged-out visitor" state we want
 *    to capture — a fresh browser has no session either way.
 */

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { routes as sitemapRoutes } from './generate-sitemap.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');

// Routes from the sitemap that are intentionally NOT prerendered:
//
// /torgid — MarketplacePage only fetches service_providers from Firestore
// `if (isAuthenticated)` (see src/pages/MarketplacePage.tsx). A logged-out
// prerender would permanently freeze an empty "Engir aðilar fundust" state
// and an empty ItemList JSON-LD into the static file, which is worse for
// GEO than the current (honestly dynamic, if invisible-to-bots) page —
// it would tell crawlers "there is nothing here" about a page whose entire
// point is a live listing. Left dynamic; revisit if/when the listing
// query is ever made available to logged-out visitors.
const EXCLUDED_ROUTES = new Set(['/torgid']);

const ROUTES_TO_PRERENDER = sitemapRoutes
    .map((r) => r.path)
    .filter((path) => !EXCLUDED_ROUTES.has(path));

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml',
    '.map': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
};

/**
 * Minimal static file server mirroring the piece of vercel.json's routing
 * that matters here: exact filesystem matches are served as-is; anything
 * without a matching file falls back to the app shell (dist/index.html),
 * same as the `rewrites` entry does in production.
 */
function startStaticServer() {
    const server = createServer(async (req, res) => {
        try {
            const url = new URL(req.url, 'http://localhost');
            let filePath = join(DIST_DIR, decodeURIComponent(url.pathname));

            let served = false;
            if (existsSync(filePath)) {
                const s = await stat(filePath);
                if (s.isFile()) {
                    served = true;
                } else if (s.isDirectory()) {
                    const indexPath = join(filePath, 'index.html');
                    if (existsSync(indexPath)) {
                        filePath = indexPath;
                        served = true;
                    }
                }
            }

            if (!served) {
                // SPA fallback — only for extensionless (route-like) paths,
                // so a genuinely missing asset still 404s instead of being
                // masked as index.html.
                if (extname(url.pathname)) {
                    res.writeHead(404);
                    res.end('Not found');
                    return;
                }
                filePath = join(DIST_DIR, 'index.html');
            }

            const data = await readFile(filePath);
            const mime = MIME_TYPES[extname(filePath)] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mime });
            res.end(data);
        } catch (err) {
            res.writeHead(500);
            res.end(String(err));
        }
    });

    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => resolve(server));
    });
}

/**
 * playwright-core resolves its executable path from the revision pinned in
 * its own package.json. If the sandbox/CI machine has a different (older or
 * newer) Chromium revision pre-installed than what this playwright-core
 * version expects, that lookup misses even though a perfectly usable
 * Chromium binary exists on disk. Fall back to scanning
 * PLAYWRIGHT_BROWSERS_PATH for any installed chromium-* revision.
 */
async function resolveChromiumExecutable() {
    if (process.env.PRERENDER_CHROMIUM_PATH) {
        return process.env.PRERENDER_CHROMIUM_PATH;
    }

    const expected = chromium.executablePath();
    if (expected && existsSync(expected)) {
        return expected;
    }

    const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
    if (!browsersDir || !existsSync(browsersDir)) {
        return null;
    }

    const entries = await readdir(browsersDir, { withFileTypes: true });
    const revisions = entries
        .filter((e) => e.isDirectory() && /^chromium-\d+$/.test(e.name))
        .map((e) => ({ name: e.name, rev: parseInt(e.name.split('-')[1], 10) }))
        .sort((a, b) => b.rev - a.rev);

    for (const { name } of revisions) {
        const revDir = join(browsersDir, name);
        const subEntries = await readdir(revDir, { withFileTypes: true }).catch(() => []);
        const chromeDir = subEntries.find((e) => e.isDirectory() && /^chrome-linux/.test(e.name));
        if (!chromeDir) continue;
        const candidate = join(revDir, chromeDir.name, 'chrome');
        if (existsSync(candidate)) return candidate;
    }

    return null;
}

async function prerenderRoute(browser, baseUrl, path) {
    const context = await browser.newContext();
    // Deterministic + offline-safe: only allow requests back to our own
    // local static server. See file header for rationale.
    await context.route('**/*', (route) => {
        if (route.request().url().startsWith(baseUrl)) {
            return route.continue();
        }
        return route.abort();
    });

    const page = await context.newPage();
    try {
        await page.goto(`${baseUrl}${path}`, { waitUntil: 'load', timeout: 20000 });
        // Real content signal — the Suspense/PageLoader fallback has no h1,
        // only marketing/handbook pages that actually finished rendering do.
        await page.waitForSelector('h1', { timeout: 15000 });
        // react-helmet-async writes <title>/<meta>/<link> into document.head
        // from an effect that runs just after the h1 commits — give it a
        // beat rather than racing it.
        await page.waitForFunction(
            () => !!document.querySelector('link[rel="canonical"]'),
            { timeout: 5000 }
        );
        await page.waitForTimeout(200);

        const html = await page.content();
        return { path, html };
    } finally {
        await context.close();
    }
}

function outputPathFor(routePath) {
    if (routePath === '/') return join(DIST_DIR, 'index.html');
    return join(DIST_DIR, routePath.replace(/^\//, ''), 'index.html');
}

async function main() {
    if (!existsSync(DIST_DIR)) {
        console.error('[prerender] dist/ not found — run `vite build` first.');
        process.exit(1);
    }

    console.log(`[prerender] Resolving Chromium executable...`);
    const executablePath = await resolveChromiumExecutable();
    if (!executablePath) {
        console.error(
            '[prerender] No usable Chromium found (checked playwright-core\'s expected ' +
            'path and PLAYWRIGHT_BROWSERS_PATH). Install one with ' +
            '`npx playwright install chromium`, or point PRERENDER_CHROMIUM_PATH at an ' +
            'executable. Skipping prerendering — dist/ remains a valid (client-only-' +
            'rendered) build.'
        );
        process.exit(0);
    }
    console.log(`[prerender] Using Chromium at ${executablePath}`);

    const server = await startStaticServer();
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    const browser = await chromium.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const results = [];
    const start = Date.now();

    for (const path of ROUTES_TO_PRERENDER) {
        try {
            const result = await prerenderRoute(browser, baseUrl, path);
            results.push({ path, ok: true, html: result.html });
            console.log(`[prerender] OK    ${path}`);
        } catch (err) {
            results.push({ path, ok: false, error: err.message });
            console.error(`[prerender] FAIL  ${path} — ${err.message}`);
        }
    }

    await browser.close();
    await new Promise((resolve) => server.close(resolve));

    const succeeded = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);

    // Write files only after every route has been rendered — see file
    // header ("Design choices") for why this must not interleave with
    // rendering.
    for (const r of succeeded) {
        const outPath = outputPathFor(r.path);
        await mkdir(dirname(outPath), { recursive: true });
        await writeFile(outPath, r.html);
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log('');
    console.log(`[prerender] ${succeeded.length}/${results.length} routes prerendered in ${elapsed}s`);
    if (failed.length) {
        console.log(`[prerender] Failed routes: ${failed.map((r) => r.path).join(', ')}`);
    }
    if (EXCLUDED_ROUTES.size) {
        console.log(`[prerender] Skipped by design: ${[...EXCLUDED_ROUTES].join(', ')}`);
    }

    if (succeeded.length === 0 && results.length > 0) {
        console.error('[prerender] All routes failed — failing the build.');
        process.exit(1);
    }
}

main().catch((err) => {
    // Prerendering is an SEO enhancement, never a deploy gate. Vercel's build
    // image ships a Chromium download but not the shared libraries it needs
    // (libnspr4.so and friends), and there is no root to install them — that
    // surfaced here as a hard build failure that took the whole site down.
    // Any failure now degrades to a valid client-rendered dist/ instead.
    console.error('[prerender] FAILED — shipping a client-rendered build instead.');
    console.error('[prerender] Cause:', err?.message || err);
    console.error(
        '[prerender] Search engines will still index the site, but AI crawlers ' +
        'that do not run JavaScript will only see index.html + llms.txt.'
    );
    process.exit(0);
});

// --- Vercel routing note ----------------------------------------------
// vercel.json's only rewrite is `/((?!api).*)` -> `/index.html`. Vercel's
// documented routing order is: 1) filesystem (exact static file match,
// including implicit `<dir>/index.html` resolution for extensionless
// paths — the same mechanism that lets framework static exports, e.g.
// Next.js `output: 'export'`, deploy on Vercel without any rewrites
// config), 2) `redirects`, 3) `rewrites`. Because dist/handbok/fjarmal/
// index.html exists on the filesystem after this script runs, a request
// for /handbok/fjarmal is served that file directly and never reaches the
// rewrite. Routes with no prerendered file (dynamic ones like
// /guest/:token, /join/*, and protected ones like /dashboard, /settings)
// have no filesystem match, so they still fall through to the rewrite and
// get the SPA shell, exactly as before. No vercel.json changes were
// needed. This reasoning matches documented Vercel behavior; it was not
// possible to spin up a live Vercel deployment from this environment to
// confirm end-to-end, so a quick post-deploy spot check of one
// prerendered route and one dynamic route is recommended.
