# Weather & Road Intelligence - Debugging Guide

## Why the Weather Card Might Not Appear

### 1. **House Missing GPS Coordinates** (Most Common)
For the weather and road service to activate, your house in Firestore needs a `location` object with `lat` and `lng`.
```json
{
  "location": {
    "lat": 64.1466,
    "lng": -21.9426
  }
}
```

**How to Fix:**
1. Go to Firebase Console → Firestore Database.
2. Find the house in the `houses` collection.
3. Add a map field called `location` with sub-fields `lat` (number) and `lng` (number).

---

### 2. **CORS and Proxy issues**
We use internal proxies to avoid CORS issues with met.no and Vegagerðin.
- Weather: `/api/weather`
- Roads: `/api/road-conditions`

**In Development:**
- Make sure you are running `vercel dev` or that your local server can reach these endpoints.
- If you see `500` errors in the console for these paths, checked the server logs.

---

### 3. **Booking Timeline**
The widget only loads if the booking start date is **within 7 days** from today. This ensures we only show reliable forecasts.

---

## Data Sources & Reliability

### Weather Forecast
- **Provider**: [met.no](https://api.met.no/) (via `/api/weather`)
- **Reliability**: Extremely high for Iceland.
- **Cache**: 30 minutes on the server level.

### Road Conditions
- **Provider**: [Vegagerðin](https://gagnaveita.vegagerdin.is/) (via `/api/road-conditions`)
- **Region**: Major routes near the house (identified by NAFN/ASTAND fields).
- **Cache**: 10 minutes.

---

## Quick Console Tests

Run these in your browser's DevTools to check connectivity:

```javascript
// Test Weather Proxy
fetch('/api/weather?lat=64.1466&lon=-21.9426')
  .then(r => r.json())
  .then(d => console.log('Weather Proxy OK:', d))
  .catch(e => console.error('Weather Proxy Failed:', e));

// Test Road Proxy
fetch('/api/road-conditions')
  .then(r => r.json())
  .then(d => console.log('Road Proxy OK:', d))
  .catch(e => console.error('Road Proxy Failed:', e));
```

---

## Known Issues & Tips

1. **"Unknown Road Status"**: If Vegagerðin doesn't provide a description, we fallback to "Óþekktarástand".
2. **GPS Accuracy**: If the coordinates are slightly off, the road service might look for roads in the wrong area (though we currently return major routes throughout).
3. **Icelandic Characters**: If names like "Hellisheiði" look broken, ensure your meta charset is UTF-8 (it should be by default).

---

*Last Updated: Jan 4, 2026*
