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

**What error exactly does it give you?**
*   "One or more email addresses are invalid" -> Typo/Space
*   "Email addresses from this domain are not allowed" -> Organization Policy
*   "Something went wrong" -> Try refreshing
