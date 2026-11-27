# 📊 Connecting Real Google Analytics Data

Since we've upgraded the system to use the **real Google Analytics 4 API**, you need to add your credentials to Vercel for the live data to show up.

## 1. Get Your Credentials
You need a **Google Service Account** JSON key and your **GA4 Property ID**.
*(If you don't have these, ask Thorarinn or check the Google Cloud Console).*

## 1.5 Grant Permissions (CRITICAL)
**This is the most common missing step!**
1.  Copy your `GOOGLE_CLIENT_EMAIL` address (e.g. `firebase-adminsdk-xxx@...`).
2.  Go to **Google Analytics** -> **Admin** (Gear icon).
3.  Select your **Property** -> **Property Access Management**.
4.  Click **+** -> **Add users**.
5.  Paste the email address and give it **Viewer** role.
6.  Save.

## 2. Add Environment Variables to Vercel
Go to your project settings on **Vercel.com** -> **Settings** -> **Environment Variables** and add these three:

| Variable Name | Value Description |
|---|---|
| `GA4_PROPERTY_ID` | Your numeric GA4 Property ID (e.g. `123456789`) |
| `GOOGLE_CLIENT_EMAIL` | The service account email (e.g. `firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com`) |
| `GOOGLE_PRIVATE_KEY` | The private key starting with `-----BEGIN PRIVATE KEY-----...` |

> **Pro Tip:** When pasting the private key, make sure to copy the entire block including the BEGIN/END lines. Vercel handles the newlines automatically.

## 3. Verify
After adding the variables, **Redeploy** your latest commit (or just push a small change) so Vercel picks up the new variables.
Then visit `/super-admin` -> **Greining** to see your real live traffic data! 🚀
