# Payment Integration Plan & Failure Handling
**Objective:** Seamlessly integrate Payday.is for automated invoicing and payments, with a robust strategy for handling failed payments and non-payment scenarios.

## 1. Integration Architecture
We will use Payday's **Client Credentials (Server-to-Server)** flow.

*   **API Client:** `api/payday/client.ts` (Already partially implemented)
*   **Webhooks:** Setup Payday webhooks to notify us of invoice status changes (`paid`, `overdue`, `cancelled`).
*   **Recurring Billing:**
    *   **Monthly Plan:** 1.990 kr/month.
    *   **Annual Plan:** 9.900 kr/year.

## 2. Failure Handling Strategy ("What if people see don't pay?")

### A. Grace Period (Warning State)
If an automatic payment fails or an invoice becomes overdue:
1.  **Notification:** Send an automated email immediately.
    *   *Subject:* "Greiðsla mistókst - Bústaðurinn.is"
    *   *Content:* Friendly reminder with a direct link to update card details/pay invoice.
2.  **Dashboard Alert:** Display a persistent banner in the top of the user's dashboard.
    *   *Message:* "Greiðsla í vanskilum. Vinsamlegast uppfærðu greiðsluleið til að forðast lokun."
3.  **Grace Period:** Allow **7 days** of continued full access after the due date.

### B. Restricted Access (Locked State)
If payment is not received after 7 days:
1.  **Notification:** "Aðgangi læst tímabundið".
2.  **App State Change:** Set `subscription_status` to `'expired'` or `'past_due'`.
3.  **UI Restriction:**
    *   **Read-Only Mode:** Users can *see* their data (calendar, tasks) but CANNOT add new bookings, tasks, or invite members.
    *   **Paywall Modal:** Any attempt to modify data triggers a modal: "Vinsamlegast gangið frá greiðslu til að opna fyrir breytingar."
    *   This prevents data loss fears while enforcing payment.

### C. Churn / Cancellation
If payment is not received after 30 days:
1.  **Final Warning:** "Aðgangi verður eytt innan 14 daga."
2.  **Data Retention:** We retain data for 3 months post-cancellation before permanent deletion, unless requested otherwise.

## 3. Technical Implementation Steps

### Phase 1: Invoice Generation (Current Priority)
*   [ ] Enhance `AppStore` to include `auto_renew` flag on House.
*   [ ] Create Cloud Function `generateMonthlyInvoices` (Cron job runs on 1st of month).
*   [ ] Loop through active subscriptions -> Call Payday API -> Send Invoice to `manager_email`.

### Phase 2: Webhook Listener
*   [ ] Create `api/payday/webhook.ts`.
*   [ ] Listen for `invoice.paid` -> Update `subscription_end` (+1 month/year).
*   [ ] Listen for `invoice.overdue` -> Trigger "Grace Period" logic.

### Phase 3: UI Enforcement
*   [ ] Create `RestrictedAccessGuard` component.
*   [ ] Wrap write-actions (Add Booking, Add Task) with this guard.
*   [ ] Build "Update Payment Method" form in SettingsPage.

## 4. Manual Override
As Super Admin, you already have the "Toggle Free / Active" buttons in the Dashboard. This allows manual unlocking of accounts in special cases (e.g., friends/family or dispute resolution).
