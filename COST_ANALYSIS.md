# Cost Analysis for Bústaðurinn.is

This document outlines the running costs for the Bústaðurinn.is platform.

**Key Takeaway:** The estimated **~2.445 ISK/month** is a **Fixed Base Cost**.
You pay this amount regardless of whether you have 0 users or ~100 active houses. The cost only begins to increase (variable costs) once you exceed the "included capacity" of the Pro plans and Free tiers.

## 1. Executive Summary

| Component | Service | Tier | Cost | Included Capacity (Estimated Users) |
|-----------|---------|------|--------------------------|-------------------------------------|
| **Hosting** | Vercel | Pro (Shared) | **~930 ISK** (Fixed) | **~5,000+ Houses** (1TB Bandwidth is massive covers almost unlimited static traffic) |
| **Email** | Resend | Pro (Shared) | **~930 ISK** (Fixed) | **~1,000 Houses** (at 50 emails/house/month) |
| **Domain** | ISNIC | .is domain | **~585 ISK** (Fixed) | N/A |
| **Database** | Firebase | Blaze | **0 ISK** (Free Tier) | **~100 Active Houses** (Daily active usage) |
| **Total** | | | **~2.445 ISK / Month** | **Capacity: ~100 Active Houses** |

*Once you exceed ~100 daily active houses, the Firebase cost (Variable) will start adding small amounts (e.g. +$1 - $5).*

---

## 2. Infrastructure Breakdown

### A. Hosting (Vercel)
*   **Cost:** Fixed ~$6.67 USD (1/3 share of $20).
*   **Capacity:** 1TB Bandwidth.
*   **Constraint:** Virtually unlimited for text-based apps. You will not hit this limit soon.

### B. Email (Resend)
*   **Cost:** Fixed ~$6.67 USD (1/3 share of $20).
*   **Capacity:** 50,000 emails / month (Standard Pro Plan).
*   **Usage Est:** A typical house might generate 20-50 emails month (bookings, password resets, invites).
*   **Buffer:** You can support **~1,000 houses** before paying overage ($0.60 per 1,000 extra emails).

### C. Database (Firebase)
*   **Cost:** Pay-as-you-go (starts at $0).
*   **Included (Free):** 50,000 Reads / Day.
*   **Usage Est:** A highly active user might read 200-500 docs in a session (dashboard load, calendar scan, logs).
    *   If 100 users log in daily: 100 * 500 = 50,000 reads.
*   **Constraint:** This is your primary "Soft Limit".
*   **Growth:**
    *   At **200 daily active houses**: Cost is ~$0.18 / day (~750 ISK / month).
    *   At **500 daily active houses**: Cost is ~$0.90 / day (~3.700 ISK / month).

### D. Domain (ISNIC)
*   **Cost:** Fixed ~7.000 ISK / year (~585 ISK/mo).

---

## 3. Profitability Thresholds

Since the running cost is **fixed** at ~2.445 ISK:

*   **1 Annual Subscriber (9.900 kr):** Covers **4 months** of running costs.
*   **3 Annual Subscribers:** Cover the **entire year** of running costs.
*   **Everything after subscriber #3 is ~100% Margin** (minus 2.5% transaction fees and small usage costs).

## 4. Scaling Scenarios

### Phase 1: Launch (0 - 100 Houses)
*   **Base Cost:** ~2.445 ISK.
*   **Overage:** 0 ISK.
*   **Total:** **~2.445 ISK / month**.

### Phase 2: Growth (100 - 500 Houses)
*   **Base Cost:** ~2.445 ISK.
*   **Firebase Overage:** ~1.500 - 4.000 ISK (estimated).
*   **Total:** **~4.000 - 6.500 ISK / month**.
*   *Revenue at 500 houses:* ~5M - 7M ISK / year.

### Phase 3: Scale (1000+ Houses)
*   **Base Cost:** ~2.445 ISK.
*   **Firebase Overage:** ~10.000 ISK+.
*   **Resend Overage:** Potential small overage.
*   **Total:** **~15.000 ISK / month**.
