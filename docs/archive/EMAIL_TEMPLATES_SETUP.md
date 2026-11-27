# Email Templates Setup Guide

## Problem
Email templates keep disappearing from Firestore because they need to be properly seeded with the correct structure.

## Solution Options

### Option 1: Use Firebase Console (Recommended for now)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Firestore Database
3. Add documents to the `email_templates` collection manually:

#### Template 1: Welcome Email
**Document ID:** `welcome`
```
{
  "id": "welcome",
  "name": "Welcome Email",
  "subject": "Velkomin í Bústaðurinn.is! 🏡",
  "html_content": "<see scripts/email-templates/welcome.html>",
  "active": true,
  "created_at": <current timestamp>,
  "updated_at": <current timestamp>
}
```

#### Template 2: Co-owner Invitation
**Document ID:** `invite`
```
{
  "id": "invite",
  "name": "Co-owner Invitation",
  "subject": "Þér hefur verið boðið í {houseName}",
  "html_content": "<see scripts/email-templates/invite.html>",
  "active": true,
  "created_at": <current timestamp>,
  "updated_at": <current timestamp>
}
```

#### Template 3: Trial Ending
**Document ID:** `trial_ending`
```
{
  "id": "trial_ending",
  "name": "Trial Ending Reminder",
  "subject": "Prufutíminn þinn rennur út eftir 7 daga",
  "html_content": "<see scripts/email-templates/trial_ending.html>",
  "active": true,
  "created_at": <current timestamp>,
  "updated_at": <current timestamp>
}
```

### Option 2: Admin Dashboard UI (🚧 To Be Implemented)
Add an "Email Templates" section to the Super Admin Dashboard where you can:
- View all templates
- Create new templates with WYSIWYG editor
- Test templates with sample data
- Toggle active/inactive status

## Why Templates Disappear

The seeding script fails because:
1. **Firestore Security Rules**: Only `thorarinnhjalmarsson@gmail.com` can write to `email_templates`
2. **Client SDK**: The seeding script uses client SDK which doesn't have admin privileges
3. **No Authentication**: Script runs unauthenticated

## Temporary Fix

Until we build the Admin Dashboard UI, manually add templates via Firebase Console using the HTML files in `scripts/email-templates/`.

## Template Variables

Templates use these placeholders:
- `{name}` - User's name
- `{houseName}` - House name
- `{senderName}` - Person sending invite
- `{inviteLink}` - Join link
- `{expiryDate}` - Trial expiry date

These are replaced when emails are sent.
