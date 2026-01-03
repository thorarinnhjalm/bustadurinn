import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

import fs from 'fs';
import path from 'path';

interface SearchConsoleData {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    topQueries: {
        query: string;
        clicks: number;
        impressions: number;
    }[];
}

// Fallback data
const MOCK_DATA: SearchConsoleData = {
    clicks: 124,
    impressions: 4300,
    ctr: 2.8,
    position: 14.2,
    topQueries: [
        { query: 'sumarbústaður leiga', clicks: 45, impressions: 800 },
        { query: 'bústaður til leigu', clicks: 32, impressions: 650 },
    ]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { period = '30d' } = req.query;

    // 1. Check for configuration
    const propertyUrl = 'sc-domain:bustadurinn.is'; // Your verified domain property in Search Console

    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    // Try reading from gsc-key.json if env vars are missing
    if (!clientEmail || !privateKey) {
        try {
            const keyPath = path.join(process.cwd(), 'gsc-key.json');
            if (fs.existsSync(keyPath)) {
                const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                clientEmail = keyFile.client_email;
                privateKey = keyFile.private_key;
            }
        } catch (e) {
            console.warn('Could not read gsc-key.json');
        }
    }

    if (!clientEmail || !privateKey) {
        console.warn('⚠️ Missing Google Auth Configuration (Env or File)');
        return res.status(500).json({ error: 'Missing Google Auth Configuration' });
    }

    // 🧹 Cleanup Key (Same logic as analytics.ts)
    // 1. Handle literal "\n" from JSON copy-paste
    privateKey = privateKey.replace(/\\n/g, '\n');

    // 2. Handle surrounding quotes
    if (privateKey.startsWith('"')) privateKey = privateKey.slice(1);
    if (privateKey.endsWith('"')) privateKey = privateKey.slice(0, -1);

    // 3. Ensure Headers have newlines (Fixes "space instead of newline" issues)
    const beginHeader = '-----BEGIN PRIVATE KEY-----';
    const endHeader = '-----END PRIVATE KEY-----';

    if (privateKey.includes(beginHeader) && !privateKey.includes(beginHeader + '\n')) {
        privateKey = privateKey.replace(beginHeader, beginHeader + '\n');
    }
    if (privateKey.includes(endHeader) && !privateKey.includes('\n' + endHeader)) {
        privateKey = privateKey.replace(endHeader, '\n' + endHeader);
    }

    try {
        const jwtClient = new google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
        });

        await jwtClient.authorize();

        const searchConsole = google.webmasters({ version: 'v3', auth: jwtClient });

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        if (period === '7d') startDate.setDate(endDate.getDate() - 7);
        else if (period === '90d') startDate.setDate(endDate.getDate() - 90);
        else startDate.setDate(endDate.getDate() - 30);

        // Limit query to last 2 days ago because Search Console data has lag
        endDate.setDate(endDate.getDate() - 2);
        const dateStr = (d: Date) => d.toISOString().split('T')[0];

        // Fetch Search Analytics
        const response = await searchConsole.searchanalytics.query({
            siteUrl: propertyUrl,
            requestBody: {
                startDate: dateStr(startDate),
                endDate: dateStr(endDate),
                dimensions: ['query'],
                rowLimit: 10
            }
        });

        // Calculate Totals
        // The API returns rows broken down by dimension. To get totals, we either sum these up (if they cover everything) 
        // OR we make a separate call without dimensions. For efficiency, let's sum or make a separate lightweight call.
        // Let's make a separate call for accurate totals.

        const totalsResponse = await searchConsole.searchanalytics.query({
            siteUrl: propertyUrl,
            requestBody: {
                startDate: dateStr(startDate),
                endDate: dateStr(endDate),
                dimensions: [] // No dimensions = Aggregated totals
            }
        });

        const totals = totalsResponse.data.rows?.[0] || {};

        const finalData: SearchConsoleData = {
            clicks: totals.clicks || 0,
            impressions: totals.impressions || 0,
            ctr: (totals.ctr || 0) * 100, // Convert to percentage
            position: totals.position || 0,
            topQueries: response.data.rows?.map(row => ({
                query: row.keys?.[0] || 'Unknown',
                clicks: row.clicks || 0,
                impressions: row.impressions || 0
            })) || []
        };

        return res.status(200).json(finalData);

    } catch (e: any) {
        console.error('❌ Search Console API Error:', e.message);
        if (e.response && e.response.data) {
            console.error('Error Details:', JSON.stringify(e.response.data, null, 2));
        }

        // Return actual error so we can debug
        return res.status(500).json({
            error: e.message,
            details: e.response?.data
        });
    }
}
