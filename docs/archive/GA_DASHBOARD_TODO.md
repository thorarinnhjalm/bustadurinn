# Google Analytics Dashboard Integration - TODO

## Goal
Show GA4 data directly in Super-Admin Dashboard

## What You Need

### 1. Google Cloud Setup (15 min)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project OR select existing
3. Enable "Google Analytics Data API"
4. Create Service Account:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Name it: "bustadurinn-analytics"
   - Grant role: "Viewer"
   - Create JSON key → Download it

### 2. Google Analytics Setup (5 min)
1. Go to [analytics.google.com](https://analytics.google.com)
2. Admin > Property Access Management
3. Add the service account email (from JSON key)
4. Grant "Viewer" role

### 3. Code Implementation (30 min)

**Add environment variable:**
```bash
GOOGLE_APPLICATION_CREDENTIALS_JSON='{...paste JSON key content...}'
GA4_PROPERTY_ID='your-property-id'  # Find in GA Admin
```

**Create API endpoint** (`/api/analytics-data.ts`):
```typescript
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!)
});

export default async function handler(req, res) {
    const [response] = await analyticsDataClient.runReport({
        property: `properties/${process.env.GA4_PROPERTY_ID}`,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' }
        ]
    });
    
    res.json({ success: true, data: response });
}
```

**Install package:**
```bash
npm install @google-analytics/data
```

**Add to Super-Admin Dashboard:**
```tsx
// Fetch analytics data
const [analyticsData, setAnalyticsData] = useState(null);

useEffect(() => {
    fetch('/api/analytics-data')
        .then(res => res.json())
        .then(data => setAnalyticsData(data));
}, []);

// Display in panel
<div className="card">
    <h3>Last 7 Days</h3>
    <div>Active Users: {analyticsData?.activeUsers}</div>
    <div>Sessions: {analyticsData?.sessions}</div>
</div>
```

## Alternative: Use existing GA dashboard
For now, just link to Google Analytics:
```tsx
<a href="https://analytics.google.com/analytics/web/#/p123456789/reports/intelligenthome" 
   target="_blank" 
   className="btn btn-secondary">
    View Analytics →
</a>
```

## Decision
- **Quick win**: Add link to GA (5 min) ✅
- **Full integration**: Follow steps above when needed

---
**Status**: Documented, not yet implemented  
**Priority**: Medium (nice-to-have)  
**Time**: ~1 hour total if needed
