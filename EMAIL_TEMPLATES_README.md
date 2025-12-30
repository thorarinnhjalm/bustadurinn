# Email Templates - One Command Setup

## Quick Start (2 minutes)

### Step 1: Authenticate with Google Cloud
```bash
gcloud auth application-default login
```

This opens your browser to authenticate. Use your **thorarinnhjalmarsson@gmail.com** account.

### Step 2: Seed Templates
```bash
npm run seed-email-templates
```

That's it! ✅

---

## What This Does

Seeds these email templates to Firestore:
- **Welcome Email** - Sent after user completes onboarding
- **Co-owner Invitation** - Sent when inviting someone to a house
- **Trial Ending Reminder** - Sent 7 days before trial expires

## Templates Use

Variables that get replaced when sending:
- `{name}` - User's name
- `{houseName}` - Name of the house
- `{senderName}` - Person sending the invite
- `{inviteLink}` - Join URL
- `{expiryDate}` - When trial ends

## Troubleshooting

### "Could not load the default credentials"
Run: `gcloud auth application-default login`

### "gcloud command not found"
Install Google Cloud SDK:
```bash
brew install google-cloud-sdk
```

### Still not working?
Alternative method - use a service account key:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `serviceAccountKey.json` in project root
4. Uncomment lines 14-17 in `scripts/seedEmailTemplatesAdmin.js`
5. Run `npm run seed-email-templates`

---

**Pro tip:** You only need to do this once. Templates persist in Firestore.
