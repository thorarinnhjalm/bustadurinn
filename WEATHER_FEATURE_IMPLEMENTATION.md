# Booking Weather Integration - Implementation Plan
*Feature: Show weather forecast, road conditions, and packing suggestions for upcoming bookings*

---

## 🎯 Feature Scope

### What We're Building:
Display contextual weather information on booking cards in the Dashboard, **only when forecast is reliable** (within 7 days of booking start).

### Key User Stories:
1. As a user, I see accurate weather forecast for my upcoming weekend stay
2. As a user, I get alerts about dangerous road conditions before I drive
3. As a user, I receive smart packing suggestions based on the weather
4. As a user, I only see this information when it's actually useful (close to departure)

---

## 🔌 API Research

### Option 1: Veður.is (Icelandic Met Office) ⭐ RECOMMENDED
**Endpoint**: `https://apis.is/weather/forecasts/text`
- Free, no API key needed
- Covers all Iceland
- 5-day text forecast by region
- Reliable, government-run

**Alternative Endpoint**: `https://api.met.no/weatherapi/locationforecast/2.0/compact`
- Norwegian Met Office (they cover Iceland too)
- More detailed JSON data
- Free, but requires User-Agent header
- Hourly forecasts

### Option 2: OpenWeatherMap
**Endpoint**: `https://api.openweathermap.org/data/2.5/forecast`
- Requires free API key (1000 calls/day free tier)
- 5-day forecast, 3-hour intervals
- More detailed than Veður.is
- Better for specific coordinates

**Recommendation**: Start with **apis.is** (no key needed), fallback to **met.no** for detailed data.

---

### Road Conditions API 🚗

**Vegagerðin (Icelandic Road Administration)**
**Endpoint**: `https://api.vegagerdin.is/v1/conditions`
- Free, public API
- Real-time road conditions
- Ice/snow warnings
- Road closures

**Alternative**: Can also scrape from `https://www.road.is/api/v1/conditions`

---

## 📐 Data Model

### Extended Booking Type:
```typescript
interface Booking {
  // ... existing fields
  weather?: WeatherForecast;
  roadConditions?: RoadCondition[];
  packingSuggestions?: string[];
}

interface WeatherForecast {
  location: string;
  fetchedAt: Date;
  days: WeatherDay[];
}

interface WeatherDay {
  date: Date;
  tempHigh: number;
  tempLow: number;
  condition: string; // "sunny", "rain", "snow", "cloudy"
  windSpeed?: number;
  precipitation?: number;
  icon: string; // emoji or icon name
}

interface RoadCondition {
  route: string; // "Route 1", "Route 36"
  condition: "clear" | "icy" | "snow" | "closed";
  warning?: string;
  lastUpdated: Date;
}
```

---

## 🏗️ Architecture

### New Files to Create:

```
src/
├── services/
│   ├── weatherService.ts       # Fetch from Veður.is / met.no
│   └── roadService.ts          # Fetch from Vegagerðin
├── components/
│   └── BookingWeatherCard.tsx  # Weather display component
├── utils/
│   └── packingSuggestions.ts   # Logic for packing recommendations
└── types/
    └── weather.ts              # TypeScript interfaces
```

---

## 🛠️ Implementation Steps

### Phase 1: API Integration (Day 1)
1. ✅ Create `src/types/weather.ts` with TypeScript interfaces
2. ✅ Create `src/services/weatherService.ts`
   - `getWeatherForecast(lat: number, lon: number, startDate: Date): Promise<WeatherForecast>`
   - Fetch from apis.is or met.no
   - Parse and normalize data
   - Add 24hr cache (localStorage or in-memory)
3. ✅ Create `src/services/roadService.ts`
   - `getRoadConditions(region: string): Promise<RoadCondition[]>`
   - Fetch from Vegagerðin API
   - Filter relevant routes near house location

### Phase 2: Business Logic (Day 1)
4. ✅ Create `src/utils/packingSuggestions.ts`
   - Logic: If temp < 0°C → "Extra firewood, warm bedding"
   - If rain forecast → "Rain gear, umbrella"
   - If snow → "Snow shovel, winter tires"
   - If wind > 15 m/s → "Secure outdoor items"
5. ✅ Create helper: `shouldShowWeather(booking: Booking): boolean`
   - Only show if booking starts within 7 days

### Phase 3: UI Component (Day 2)
6. ✅ Create `src/components/BookingWeatherCard.tsx`
   - Accept booking as prop
   - Fetch weather on mount (with loading state)
   - Display forecast, roads, packing suggestions
   - Collapsible/expandable design
   - Mobile-responsive

### Phase 4: Integration (Day 2)
7. ✅ Update `DashboardPage.tsx`
   - Add weather card to upcoming bookings
   - Only render if `shouldShowWeather()` is true
8. ✅ Add loading states and error handling
   - Skeleton loader while fetching
   - Graceful fallback if APIs fail
   - Retry logic

### Phase 5: Polish (Day 3)
9. ✅ Add icons/emojis for weather conditions
10. ✅ Implement smart notifications (optional)
    - Show browser notification 3 days before if bad weather
11. ✅ Add to House settings: "Toggle weather forecasts"
12. ✅ Performance: Cache forecasts, don't refetch constantly

---

## 🧪 Testing Plan

### Manual Testing:
1. Create a test booking 2 days from today
2. Verify weather card appears
3. Create booking 10 days out → Should NOT show weather
4. Test with different house locations
5. Test with no internet (graceful failure)
6. Test on mobile viewport

### Edge Cases:
- Booking today (should show current weather)
- Multi-day booking (show range)
- House with no GPS coordinates set
- API timeout/failure

---

## 📊 Success Metrics

### After 2 Weeks:
- % of bookings with weather viewed
- Click rate on packing suggestions
- User feedback: "Was this useful?"
- Performance: API response times

---

## 🚀 Future Enhancements

1. **Historical Weather**: "Last time you visited it was 15°C and sunny"
2. **Aurora Forecast**: KP index for Northern Lights viewing
3. **Tide Tables**: For coastal summer houses
4. **Webcams**: Link to nearby road/scenic webcams
5. **Smart Alerts**: Push notification if severe weather upcoming

---

## 📝 Notes

- Keep API calls minimal (cache aggressively)
- Design should work WITHOUT weather data (progressive enhancement)
- Use Icelandic terms: "Veður", "Vegaastand"
- Consider using Icelandic Met Office regions for better accuracy

---

## 🎨 Design Mock (Text)

```
┌───────────────────────────────────────────────┐
│ 📅 Næsta vika í Bústaðnum                    │
│ Föstudagur 10. jan - Sunnudagur 12. jan      │
├───────────────────────────────────────────────┤
│ 🌤️ VEÐURSPÁ (vedur.is)                       │
│                                               │
│ Föstudagur    ⛅  5°C   Hæg suðlæg átt       │
│ Laugardagur   🌧️  3°C   Rigning síðdegis     │
│ Sunnudagur    ❄️  -2°C  Snjókoma að morgni   │
│                                               │
├───────────────────────────────────────────────┤
│ 🚗 VEGAASTAND                                 │
│ ⚠️  Þjóðvegur 1 (norðan): Ísing á köflum     │
│ ✅  Vegur 36: Góð akstursskilyrði            │
│                                               │
├───────────────────────────────────────────────┤
│ 🎒 MÆLT MEÐ AÐ PAKKA                         │
│ • Aukaeldivið (kalt um helgina)              │
│ • Rigningarfatnaður (laugardagur)            │
│ • Nagladekkjum sleppur ekki (snjókoma)       │
│                                               │
└───────────────────────────────────────────────┘
```

---

*Let's start building! 🚀*
