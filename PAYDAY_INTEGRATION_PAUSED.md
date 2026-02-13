# ⏸️ Payday Integration - PAUSED

**Date Paused:** 2026-01-02
**Status:** Code Complete / Waiting on Account Setup

## 📍 Where We Left Off
The technical integration is **100% complete and deployed**. 
The system is successfully communicating with Payday, authenticating, and sending valid invoice requests.

## 🚧 The Blocker
Payday API rejected the invoice creation with:
> *"Please complete the required system setup before creating an invoice"*

**Reason:** The Payday account is missing required business details (likely Bank Account info for claims or Company Address).

## 🚀 How to Resume (When Ready)

1. **Complete Payday Setup:**
   - Log in to [app.payday.is](https://app.payday.is)
   - Go to **Stillingar** (Settings)
   - Fill in **Company Info** (Nafn, KT, Heimilisfang)
   - Fill in **Bank Account** (Bankareikningur) - *Critical for `createClaim: true`*

2. **Test:**
   - Go to `https://www.bustadurinn.is/super-admin` -> **Tengingar**
   - Click **Create Test Invoice**
   - It should proceed immediately.

## 📝 Configuration Snapshot

- **Monthly Price:** 1,990 kr (Hardcoded in `SuperAdminPage.tsx`)
- **Annual Price:** 9,990 kr (Product ID exists in env, but UI defaults to monthly)
- **VAT:** Set to `0%` in code (`api/payday-create-invoice.ts`). 
  - *Note: Once you register for VAT, change this to 24% and update Payday settings.*

---
**Ready when you are!** Just tell the AI: "Let's resume Payday" and point it to this file.
