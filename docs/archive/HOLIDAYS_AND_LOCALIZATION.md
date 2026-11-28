# 🇮🇸 ICELANDIC HOLIDAYS & LOCALIZATION - IMPLEMENTATION GUIDE

**Date:** 2025-12-28  
**Feature:** Dynamic Calendar Localization + Íslenskir Frídagar

---

## ✅ WHAT'S BEEN ADDED

### **1. Multi-Language Support**
The calendar now supports **5 languages:**
- 🇮🇸 **Íslenska** (Icelandic) - Default
- 🇬🇧 **English**
- 🇩🇪 **Deutsch** (German)
- 🇫🇷 **Français** (French)
- 🇪🇸 **Español** (Spanish)

**Changes dynamically:**
- Calendar month/day names
- Button labels ("Next", "Previous", "Today")
- Booking type labels
- Date formatting

**Location:** `src/utils/i18n.ts`

---

### **2. Icelandic Holidays (Íslenskir Frídagar)**
All official Icelandic holidays are **automatically calculated** for any year:

#### **Fixed Holidays:**
- Nýársdagur (Jan 1)
- Verkalýðsdagurinn (May 1)
- Þjóðhátíðardagurinn (June 17)
- Aðfangadagur jóla (Dec 24)
- Jóladagur (Dec 25)
- Annar í jólum (Dec 26)
- Gamlársdagur (Dec 31)

#### **Movable Holidays (Calculated Dynamically):**
✨ **Easter-based** (using Computus algorithm):
- Skírdagur (Maundy Thursday) = Easter - 3 days
- Föstudagurinn langi (Good Friday) = Easter - 2 days
- Páskadagur (Easter Sunday)
- Annar í páskum (Easter Monday) = Easter + 1 day
- Uppstigningardagur (Ascension Day) = Easter + 39 days
- Hvítasunnudagur (Whit Sunday) = Easter + 49 days
- Annar í hvítasunnu (Whit Monday) = Easter + 50 days

✨ **Sumardagurinn fyrsti:**
- First Thursday after April 18th
- Celebrates the beginning of summer

✨ **Frídagur verslunarmanna:**
- First Monday in August
- Commerce/Shop Workers' Day

**Location:** `src/utils/icelandicHolidays.ts`

---

## 🎨 HOW IT LOOKS

### **Calendar Features:**

1. **Language Selector**
   - Dropdown in top-right corner
   - Instantly changes all calendar text
   - Persists in session

2. **Holiday Highlighting**
   - Holidays shown with **yellow background** (#fef3c7)
   - Amber border (#f59e0b)
   - High-importance holidays (Jól, Páskir) = darker yellow
   - Medium-importance = lighter yellow

3. **Holiday Info Panel**
   - Below calendar
   - Shows first 6 upcoming holidays
   - Format: "Dec 25 - Jóladagur"
   - "+ X fleiri frídagar" if more exist

4. **Legend**
   - Booking type colors
   - Holiday indicator: 🇮🇸 Frídagur

---

## 🔧 TECHNICAL DETAILS

### **Easter Calculation (Computus Algorithm):**
```typescript
// Calculates Easter Sunday for ANY year
const calculateEaster = (year: number): Date => {
  // Uses Gauss's algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  // ... complex math ...
  return new Date(year, month, day);
};
```

**Why it matters:**
- Easter moves between March 22 - April 25
- Many Icelandic holidays depend on Easter
- System automatically calculates for 2025, 2026, 2027, etc.

### **Holiday Detection:**
```typescript
// Check if a specific date is a holiday
const holiday = isHoliday(new Date('2025-12-25'));
// Returns: { name: 'Jóladagur', type: 'public', importance: 'high' }

// Check if date range includes major holidays
const majorHoliday  = includesMajorHoliday(start, end);
// Returns holiday object or null
```

### **Localization:**
```typescript
// Calendar automatically uses user's language preference
const localizer = dateFnsLocalizer({
  format: (date, fmt) => format(date, fmt, { locale: dateLocales[lang] }),
  // ...
});
```

---

## 🚀 FUTURE ENHANCEMENTS

### **Planned for Settings Page:**
```typescript
// User preferences
interface UserSettings {
  language: SupportedLanguage;  // Default calendar language
  firstDayOfWeek: 0 | 1;       // Sunday or Monday
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  highlightHolidays: boolean;   // Toggle holiday highlighting
}
```

### **Planned for Fairness Logic:**
```typescript
// When creating a booking:
const holiday = includesMajorHoliday(start, end);

if (holiday && settings.holiday_mode === 'fairness') {
  // Check if user had this holiday last year
  const lastYearBooking = await getLastYearHolidayBooking(
    userId,
    holiday.name
  );
  
  if (lastYearBooking) {
    throw new Error(
      `Sanngirnisregla: Þú fékkst ${holiday.name} í fyrra. ` +
      `Aðrir eiga rétt á þessum tíma.`
    );
  }
}
```

### **Holiday Booking Restrictions (Optional):**
```typescript
// Prevent bookings on specific holidays
const RESTRICTED_HOLIDAYS = ['Jóladagur', 'Páskadagur', 'Nýársdagur'];

if (RESTRICTED_HOLIDAYS.includes(holiday.name) && !userIsManager) {
  throw new Error('Aðeins stjórnandi getur búið til bókanir á þessum degi');
}
```

---

## 📊 HOLIDAY DATA STRUCTURE

```typescript
interface Holiday {
  name: string;              // "Jóladagur"
  date: Date;                // Actual date (dynamic)
  type: 'public' | 'bank' | 'observance';
  importance: 'high' | 'medium' | 'low';
}

// Example for 2025:
{
  name: 'Páskadagur',
  date: new Date('2025-04-20'),  // Calculated dynamically!
  type: 'public',
  importance: 'high'
}
```

---

## 🧪 TESTING

### **Test Easter Calculation:**
```typescript
import { getIcelandicHolidays } from '@/utils/icelandicHolidays';

// Easter 2025 should be April 20
const holidays2025 = getIcelandicHolidays(2025);
const easter2025 = holidays2025.find(h => h.name === 'Páskadagur');
console.log(easter2025.date); // Should show April 20, 2025

// Easter 2026 should be April 5
const holidays2026 = getIcelandicHolidays(2026);
const easter2026 = holidays2026.find(h => h.name === 'Páskadagur');
console.log(easter2026.date); // Should show April 5, 2026
```

### **Test Language Switching:**
1. Open calendar at http://localhost:5173/calendar
2. Change language dropdown from "Íslenska" → "English"
3. Verify:
   - Month names change (Janúar → January)
   - "Næsta" button → "Next"
   - "Persónuleg" → "Personal"

### **Test Holiday Highlighting:**
1. Navigate to December 2025
2. December 24, 25, 26 should have yellow background
3. Hover to see holiday names (future enhancement)

---

## 📁 FILES CREATED/MODIFIED

### **New Files:**
- `src/utils/i18n.ts` - Localization system (5 languages)
- `src/utils/icelandicHolidays.ts` - Holiday calculator

### **Modified Files:**
- `src/pages/CalendarPage.tsx` - Added localization + holiday highlighting

---

## 🎯 KEY FEATURES

✅ **Automatic Easter Calculation** - Works for any year, no hardcoding  
✅ **5 Language Support** - Icelandic, English, German, French, Spanish  
✅ **Visual Holiday Highlighting** - Yellow background on holidays  
✅ **Dynamic Holiday Info Panel** - Shows upcoming Íslenskir frídagar  
✅ **Responsive Design** - Language selector integrated cleanly

---

## 💡 USAGE EXAMPLES

### **In Calendar Component:**
```typescript
// Check if selected date is a holiday
const holiday = isHoliday(selectedDate);
if (holiday) {
  showNotification(`Þetta er ${holiday.name}! 🇮🇸`);
}

// Get all holidays in booking range
const holidaysInBooking = getHolidaysInRange(startDate, endDate);
if (holidaysInBooking.length > 0) {
  console.log('Bókunin þín inniheldur frídaga:', holidaysInBooking);
}
```

### **In Fairness Logic (Future):**
```typescript
// Prevent consecutive holiday bookings
const holiday = includesMajorHoliday(start, end);
if (holiday?.name === 'Jóladagur') {
  const hadChristmasLastYear = await checkLastYearBooking(
    userId,
    'Jóladagur',
    currentYear - 1
  );
  
  if (hadChristmasLastYear) {
    return { 
      allowed: false,
      reason: 'Þú fékkst jólin í fyrra. Sanngirnisregla gildir.' 
    };
  }
}
```

---

## 🌍 LANGUAGE SUPPORT DETAILS

**dateLocales** - Proper date formatting for each language:
- `is`: "25. desember 2025"
- `en`: "December 25, 2025"
- `de`: "25. Dezember 2025"
- `fr`: "25 décembre 2025"
- `es`: "25 de diciembre de 2025"

**calendarMessages** - All UI text translated:
- Navigation buttons
- View modes
- Empty states
- "Show more" text

**bookingTypeLabels** - Booking categories:
- Personal: Persónuleg / Personal / Persönlich / Personnel / Personal
- Guest: Gestur / Guest / Gast / Invité / Invitado
- Rental: Útleiga / Rental / Vermietung / Location / Alquiler
- Maintenance: Viðhald / Maintenance / Wartung / Maintenance / Mantenimiento

---

## 🚀 NEXT STEPS

1. **Save Language Preference:**
   - Store in Firestore: `users/{uid}/settings/language`
   - Auto-load on login

2. **Add Holiday Tooltips:**
   - Hover over highlighted day → Show "Jóladagur (Public Holiday)"

3. **Holiday Filter:**
   - Toggle: "Show only available (non-holiday) dates"

4. **Conflict Detection:**
   - Integrate holiday checking with booking creation
   - Warn if booking overlaps major holiday

5. **Email Notifications:**
   - Use user's preferred language for booking confirmations
   - "Your booking for Jóladagur has been confirmed"

---

**Status:** ✅ Fully Implemented  
**Languages:** 5 supported  
**Holidays:** All Icelandic holidays (fixed + movable)  
**Easter Calculation:** ✅ Automatic for any year

The calendar now respects user language preferences AND highlights all Icelandic holidays dynamically! 🇮🇸 🎉
