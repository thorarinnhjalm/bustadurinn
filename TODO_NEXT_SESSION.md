
# Next Session Goals

## Completed This Session (2025-12-29)
✅ **Weather Integration** - Connected Dashboard & Guest Page to Open-Meteo API  
✅ **Mobile Navigation Overhaul** - Created unified MobileNav component  
✅ **Calendar Mobile Responsiveness** - Fixed layout, height, and navigation  
✅ **Store Synchronization** - Fixed data sync between Settings → Dashboard  
✅ **Layout Alignment** - Fixed bottom section width consistency  
✅ **Super Admin Impersonation** - Fully integrated useEffectiveUser hook  
✅ **Super Admin Permissions** - Added Firestore rules for contact_submissions, coupons, email_templates  
✅ **House Deletion** - Added cascading delete functionality with Icelandic confirmation  

---

## Urgent: Super Admin Improvements

### 🎨 UI/UX Redesign (Top Priority)
The Super Admin dashboard needs a visual overhaul to match the quality of the main app:

**Current Issues**:
- Layout feels cramped and not premium
- Tabs are simple text links (not visually distinct)
- Cards lack the Scandi-minimalist polish
- Spacing and typography need refinement
- Missing visual hierarchy

**Design Goals**:
- Match the elegance of DashboardPage/SettingsPage
- Use Scandi-minimalist design system
- Improve data visualization (charts, sparklines)
- Better use of whitespace
- Premium feel for business intelligence hub

### 🇮🇸 Icelandic Translation (High Priority)
Convert ALL English text to Icelandic:

**Tab Names**:
- Overview → Yfirlit
- Houses → Hús
- Users → Notendur  
- Contact → Samskipti
- Coupons → Afsláttarkóðar
- Emails → Tölvupóstur
- Integrations → Tengingar

**Button/Action Text**:
- Extend Trial → Lengja próf
- Grant Free → Veita frítt
- Revoke Free → Afturkalla frítt
- Impersonate → Líkja eftir
- Exit God Mode → Loka stjórnham
- Seed Demo Data → Fylla prufu gögn

**Metrics**:
- Total Houses → Heildarfjöldi húsa
- Total Users → Heildarfjöldi notenda
- Expiring Soon → Rennur út brátt
- Est. MRR → Áætlaðar MRR

**System Health**:
- Active Houses → Virk hús
- Trial Houses → Prófunarhús
- System Health → Kerfisstjórn

### 📊 Future Analytics Features
- [ ] Google Analytics 4 widget
- [ ] Facebook Ads metrics
- [ ] Sparkline charts for trends
- [ ] Conversion funnel visualization

---

## Pending Items

1.  **Monitor Launch Stability**
    - Watch for any `searchByText` errors (quota/permissions)
    - Monitor email delivery rates (Resend)

2.  **Address Search Upgrade (HMS Staðfangaskrá)**
    - [ ] Investigate HMS/Fasteignaskrá API integration
    - [ ] Replace/augment Google Places for better summerhouse coverage

3.  **Enhance Settings Location**
    - [ ] Add "Pin Drop" map (Leaflet or Google Maps)
    - [ ] Let users refine coordinates manually

4.  **Payday Checkout UI**
    - [ ] Build frontend checkout page for plans 004/005

5.  **Deployment Optimization**
    - [ ] Code splitting for large chunks (currently 1.09MB)
    - [ ] Lazy loading for heavy components
    - [ ] Consider staging branch workflow
