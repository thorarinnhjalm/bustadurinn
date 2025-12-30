# Trial Reminder Cron Setup Guide

## ✅ What Was Created

A daily cron job that:
- Runs automatically at **10:00 UTC** (11:00 in Iceland winter, 10:00 in summer)
- Checks for trials expiring in **exactly 7 days**
- Sends the `trial_ending` email template to house managers
- Logs all activity to Vercel dashboard

## 🔧 Setup Required

### 1. Set CRON_SECRET Environment Variable

In Vercel dashboard:
1. Go to **Project Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** Generate a random secure string (e.g., use password generator)
   - **Environments:** Production, Preview, Development

Example value (generate your own!):
```
CRON_SECRET=cron_sk_live_abc123xyz789randomsecurestring
```

### 2. Deploy to Production

```bash
git add -A
git commit -m "Add trial reminder cron job"
git push
```

Vercel will automatically:
- Deploy the new cron configuration
- Schedule the job to run daily at 10:00 UTC
- Secure it with your CRON_SECRET

## 📊 How It Works

### Daily Execution
1. **10:00 UTC** - Cron triggers
2. Query Firestore for houses where:
   - `subscription_status` = `'trial'`
   - `subscription_end` = 7 days from today
3. For each house:
   - Get manager's email from users collection
   - Fetch `trial_ending` template
   - Replace `{name}` and `{expiryDate}` variables
   - Send via Resend
4. Return summary JSON with count of emails sent

### Example Response
```json
{
  "success": true,
  "emailsSent": 3,
  "housesChecked": 3,
  "timestamp": "2025-01-06T10:00:32.123Z"
}
```

## 🧪 Testing

### Test Manually (Before Cron is Active)
You can trigger the cron manually:

```bash
curl -X GET https://bustadurinn.is/api/cron/trial-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Note:** This will send REAL emails to users with trials ending in 7 days!

### Test with Fake Data
1. Create a test house in Super Admin
2. Set `subscription_end` to exactly 7 days from now
3. Set `subscription_status` to `'trial'`
4. Run the cron manually
5. Check if email is sent

## 📈 Monitoring

### View Cron Logs
1. Go to Vercel dashboard
2. **Deployments** → Click your deployment
3. **Functions** tab → Find `/api/cron/trial-reminders`
4. View logs and execution history

### Check Email Delivery
1. Go to [Resend Dashboard](https://resend.com/emails)
2. Filter by `trial_ending` subject
3. See delivery status, opens, clicks

## 🛡️ Security

The cron endpoint is protected by `CRON_SECRET`:
- Only requests with correct Authorization header can trigger it
- Vercel automatically provides this header when running scheduled crons
- Manual requests need the secret

## ⏰ Schedule Details

**Current Schedule:** `0 10 * * *` (Daily at 10:00 UTC)

Format: `minute hour day month dayOfWeek`
- `0 10 * * *` = Every day at 10:00 UTC
- `0 8 * * 1` = Every Monday at 08:00 UTC
- `0 18 * * *` = Every day at 18:00 UTC

Change in `vercel.json` if needed.

## ✅ Checklist

Before marking as complete:
- [ ] `CRON_SECRET` set in Vercel env vars
- [ ] Code deployed to production
- [ ] Cron shows in Vercel dashboard
- [ ] Test email sent successfully
- [ ] Template renders correctly
- [ ] Monitoring dashboard checked

---

**Status:** Ready for deployment! 🚀
