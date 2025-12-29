
# Next Session Goals

1.  **Migrate to Google Maps "New" Places API**
    - The legacy `Autocomplete` widget is deprecated (March 2025).
    - Migrate `OnboardingPage` to use `PlaceAutocompleteElement`.
    - Fix the `RefererNotAllowedMapError` (likely strictly enforced on new API).

2.  **Add Address Management to Settings**
    - Copy the new Address/Pin logic to `SettingsPage`.
    - Allow users to "Refine Location" (backfill the missing pin).

3.  **Connect Dashboard to Real Weather**
    - Use the stored `location` (`lat`/`lng`) to fetch weather from `vedur.is` or OpenWeatherMap.

4.  **Payday Integration (Checkout)**
    - Build the Checkout Page for Plan 004/005.
    - Connect to Payday API for real invoicing.

5.  **Clean Up**
    - Remove Mock Data from Dashboard.
    - Ensure VSK/VAT number is ready.
