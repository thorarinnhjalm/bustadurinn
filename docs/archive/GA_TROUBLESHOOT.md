# 🆘 Troubleshooting: "One or more email addresses are invalid"

If Google Analytics says the email is "invalid" or "not allowed," it is usually one of two things:

## 1. Hidden Spaces (Most Common)
When copy-pasting from the JSON file, it's easy to accidentally grab a quote mark `"` or a space at the end.

**Try copying this exact text (triple-click to select all):**
```text
firebase-adminsdk-fbsvc@bustadurinn-599f2.iam.gserviceaccount.com
```

## 2. Organization Restrictions
If you are using a corporate/business Google Analytics account, it might block users from outside your organization domains.
*   **Solution:** You might need to ask an Admin to allow external users, OR...
*   **Alternative:** Link your Firebase project to Analytics.
    1.  Go to **Firebase Console** -> Project Settings -> Integrations -> Google Analytics.
    2.  Make sure it is linked to this specific GA4 property.
    3.  Once linked, the Firebase service accounts often get added automatically.

## 3. Enable the API
Also, ensure the API is enabled for the project so the code can actually work once permission is granted.
1.  Go to this link: [Enable GA4 Data API](https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com?project=bustadurinn-599f2)
2.  Click **Enable**.

---

## 4. "DECODER routines::unsupported" Error (Critical)
If you see this error, the `GOOGLE_PRIVATE_KEY` in Vercel is formatted incorrectly.

**How to Fix:**
1. Open your `serviceAccountKey.json`.
2. Find the `"private_key"` field. It looks like: `"-----BEGIN PRIVATE KEY-----\nMII...`
3. **DO NOT copy the surrounding quotes (" ").**
4. Copy **only** the text inside the quotes, including the `-----BEGIN` and `-----END` parts.
5. Go to Vercel > Settings > Environment Variables.
6. Edit `GOOGLE_PRIVATE_KEY`.
7. Paste the key.
    - **Note:** Vercel might show it as one long line. That is okay, our code handles the `\n` characters.
    - **Crucial:** Ensure there are no spaces at the start or end, and NO quote marks `"` around it.
