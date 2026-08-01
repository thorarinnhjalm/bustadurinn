/**
 * Generate Sitemap for Bústaðurinn.is
 * Run: node scripts/generate-sitemap.js
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseUrl = 'https://www.bustadurinn.is';
const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// This array is also imported by scripts/prerender.js, which prerenders
// (a subset of) these routes at build time. Keep it as the single source of
// truth for "which public marketing/handbook routes exist" so the sitemap
// and the prerenderer can never drift apart.
export const routes = [
    // Core Marketing Pages
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/eiginleikar', priority: '0.9', changefreq: 'monthly' },
    { path: '/verktakar', priority: '0.9', changefreq: 'monthly' }, // New!
    { path: '/torgid', priority: '0.9', changefreq: 'daily' },   // New!

    // Support & Info
    { path: '/spurt-og-svarad', priority: '0.8', changefreq: 'monthly' },
    { path: '/um-okkur', priority: '0.7', changefreq: 'monthly' },
    { path: '/hafa-samband', priority: '0.7', changefreq: 'yearly' },

    // Handbook (SEO Goldmine!)
    { path: '/handbok', priority: '0.9', changefreq: 'monthly' },
    { path: '/handbok/bokunarkerfi', priority: '0.9', changefreq: 'monthly' },
    { path: '/handbok/fjarmal', priority: '0.9', changefreq: 'monthly' },
    { path: '/handbok/vidhald', priority: '0.9', changefreq: 'monthly' },
    { path: '/handbok/uppsetning', priority: '0.9', changefreq: 'monthly' },

    // Legal
    { path: '/personuvernd', priority: '0.5', changefreq: 'yearly' },
    { path: '/skilmalar', priority: '0.5', changefreq: 'yearly' },

    // Auth
    { path: '/signup', priority: '0.8', changefreq: 'monthly' },
    { path: '/organizations/signup', priority: '0.8', changefreq: 'monthly' },
];

const generateSitemap = () => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
            .map(
                (route) => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
            )
            .join('\n')}
</urlset>`;

    const outputPath = join(__dirname, '..', 'public', 'sitemap.xml');
    writeFileSync(outputPath, sitemap);
    console.log(`✅ Sitemap (${routes.length} URLs) generated successfully at public/sitemap.xml`);
};

// Only run when invoked directly (`node scripts/generate-sitemap.js` / `npm
// run generate-sitemap`, and via the `prebuild` hook) — not when imported by
// scripts/prerender.js for its route list.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
    generateSitemap();
}
