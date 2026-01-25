/**
 * Generate Sitemap for Bústaðurinn.is
 * Run: node scripts/generate-sitemap.js
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseUrl = 'https://bustadurinn.is';
const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

const routes = [
    // Core Marketing Pages
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/eiginleikar', priority: '0.9', changefreq: 'monthly' },
    { path: '/verktakar', priority: '0.9', changefreq: 'monthly' }, // New!
    { path: '/thjonusta', priority: '0.9', changefreq: 'daily' },   // New!

    // Support & Info
    { path: '/spurt-og-svarad', priority: '0.8', changefreq: 'monthly' },
    { path: '/um-okkur', priority: '0.7', changefreq: 'monthly' },
    { path: '/hafa-samband', priority: '0.7', changefreq: 'yearly' },
    { path: '/marketing-map', priority: '0.6', changefreq: 'monthly' },

    // Handbook (SEO Goldmine!)
    { path: '/handbok', priority: '0.9', changefreq: 'monthly' },
    { path: '/handbok/bokunarkerfi', priority: '0.9', changefreq: 'monthly' },
    { path: '/handbok/fjarmal', priority: '0.9', changefreq: 'monthly' },
    { path: '/handbok/vidhald', priority: '0.9', changefreq: 'monthly' },
    { path: '/handbok/uppsetning', priority: '0.9', changefreq: 'monthly' },

    // Legal
    { path: '/personuvernd', priority: '0.5', changefreq: 'yearly' },
    { path: '/skilmalar', priority: '0.5', changefreq: 'yearly' },

    // Auth & App (Lower priority for searching, but good for indexing)
    { path: '/login', priority: '0.5', changefreq: 'yearly' },
    { path: '/signup', priority: '0.8', changefreq: 'monthly' },
    { path: '/join', priority: '0.6', changefreq: 'yearly' },
];

// Marketplace Categories (Boost SEO for specific searches)
const categories = [
    'mokstur',           // snjomokstur -> mokstur ? No, let's use the IDs: snow_removal
    'snow_removal',
    'cleaning',
    'maintenance',
    'hot_tub',
    'security',
    'other'
];

// Add category pages
categories.forEach(cat => {
    routes.push({
        path: `/thjonusta?category=${cat}`,
        priority: '0.8',
        changefreq: 'weekly'
    });
});

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

generateSitemap();
