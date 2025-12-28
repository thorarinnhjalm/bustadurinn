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
const currentDate = new Date().toISOString();

const routes = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/login', priority: '0.5', changefreq: 'monthly' },
    { path: '/signup', priority: '0.8', changefreq: 'monthly' },
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
    console.log('✅ Sitemap generated successfully at public/sitemap.xml');
};

generateSitemap();
