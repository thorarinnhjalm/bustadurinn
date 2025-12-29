
# Next Session Goals

1.  **Migrate to Google Maps "New" Places API**
    - [x] Migrate `OnboardingPage` to use `Place.searchByText` (New API).
    - [x] Fix the `RefererNotAllowedMapError` (Resolved with New API + Cloud Console update).

2.  **Add Address Management to Settings**
    - [ ] Copy the new Address/Pin logic to `SettingsPage`.
    - [ ] Allow users to "Refine Location" (backfill the missing pin for existing users).

3.  **Connect Dashboard to Real Weather**
    - [ ] Use the newly stored `location` (`lat`/`lng`) to fetch weather (currently mock).

4.  **Payday Integration (Checkout)**
    - [x] Backend API for Subscribe/Test (`api/payday-test`).
    - [x] Admin UI Integration.
    - [ ] Build the User Checkout Page for Plan 004/005.

5.  **Clean Up**
    - [ ] Remove Mock Booking Data from Dashboard (Connect to real booking form).
