# Weather Feature Debugging Guide

## Why Weather Might Not Show Up

### 1. **House Missing GPS Coordinates** (Most Common)
Your house in Firestore needs this structure:
```json
{
  "name": "Sumarbústaðurinn",
  "location": {
    "lat": 64.1466,  // Reykjavík example
    "lng": -21.9426
  }
}
```

**How to Fix:**
1. Go to Firebase Console → Firestore Database
2. Find your house document in the `houses` collection
3. Add a `location` field with `lat` and `lng` values
4. Use [Google Maps](https://www.google.com/maps) to get coordinates (right-click → coordinates)

---

### 2. **Booking Too Far Away**
Weather only shows for bookings **within 7 days** (forecast reliability).

Check: Is your booking start date ≤ 7 days from now?

---

### 3. **Check Browser Console**
Open DevTools (F12 or Cmd+Option+I) and look for:
- Red errors
- Failed fetch to `api.met.no`
- CORS errors
- Component errors

---

## Data Sources

### Weather Forecast
- **API**: [met.no LocationForecast](https://api.met.no/weatherapi/locationforecast/2.0/)
- **Coverage**: All of Iceland
- **Cost**: Free (no API key needed)
- **Format**: JSON
- **Caching**: 30 minutes

### Weather Warnings (Future)
- **API**: [Veður.is](https://xmlweather.vedur.is/) or [apis.is/weather/warnings](https://apis.is/weather/warnings)
- **Coverage**: All Iceland regions
- **Cost**: Free
- **Format**: XML or JSON

---

## Quick Test

Open browser console and run:
```javascript
// Test if house has coordinates
console.log('House location:', currentHouse?.location);

// Test if booking is within 7 days
const daysUntil = Math.ceil((nextBooking.start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
console.log('Days until booking:', daysUntil, '(should be ≤ 7)');

// Test API
fetch('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=64.1466&lon=-21.9426', {
  headers: { 'User-Agent': 'Bustadurinn.is/1.0' }
})
.then(r => r.json())
.then(d => console.log('Weather API works:', d))
.catch(e => console.error('Weather API failed:', e));
```

---

## Example Valid House Location

**Reykjavík Area:**
```
lat: 64.1466
lng: -21.9426
```

**Akureyri:**
```
lat: 65.6885
lng: -18.1262
```

**Selfoss:**
```
lat: 63.9333
lng: -21.0000
```

---

## Need to Add Coordinates?

**Option 1: Firebase Console** (Manual)
1. Go to https://console.firebase.google.com
2. Firestore Database → `houses` collection
3. Click your house document
4. Add field: `location` (map)
   - Add field: `lat` (number) = YOUR_LATITUDE
   - Add field: `lng` (number) = YOUR_LONGITUDE

**Option 2: Via App** (Coming Soon)
We should add a UI in Settings to update house coordinates!

---

*Created: Jan 4, 2026*
