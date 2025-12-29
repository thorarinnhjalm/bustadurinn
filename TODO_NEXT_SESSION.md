
# Next Session Goals

## Completed This Session (2025-12-29)
✅ **Weather Integration** - Connected Dashboard & Guest Page to Open-Meteo API  
✅ **Mobile Navigation Overhaul** - Created unified MobileNav component  
✅ **Calendar Mobile Responsiveness** - Fixed layout, height, and navigation  
✅ **Store Synchronization** - Fixed data sync between Settings → Dashboard  
✅ **Layout Alignment** - Fixed bottom section width consistency  

---

## Pending Items

1.  **Monitor Launch Stability**
    - Watch for any `searchByText` errors (quota/permissions).
    - Monitor email delivery rates (Resend).

2.  **Address Search Upgrade (HMS Staðfangaskrá)**
    - [ ] Investigate interacting with HMS/Fasteignaskrá API (https://hms.is/gogn-og-maelabord/grunngogntilnidurhals/stadfangaskra).
    - [ ] Replace or Augment Google Places with official Icelandic address data for broader summerhouse coverage.

3.  **Enhance Settings Location**
    - [ ] Add "Pin Drop" map to `SettingsPage` (using Leaflet or Google Maps) to let users refine coordinates manually.

4.  **Payday Checkout UI**
    - [ ] Build the frontend checkout page for plans 004/005.

5.  **Deployment Optimization**
    - [ ] Consider batching commits or using staging branch to avoid hitting deployment limits
    - [ ] Set up Vercel build optimization (code splitting for large chunks)
