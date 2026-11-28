# Firebase Setup Guide
## Bustadurinn.is - Corporate Edition

Complete guide to setting up Firebase for local development and production.

---

## 📋 Prerequisites

- Node.js 18+ installed
- Firebase account
- Firebase CLI installed globally

---

## 🚀 Step-by-Step Setup

### **Step 1: Install Firebase CLI (5 min)**

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

### **Step 2: Login to Firebase (2 min)**

```bash
firebase login
```

This will open a browser window for authentication.

### **Step 3: Create Firebase Project (5 min)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: **bustadurinn-is** (or your preferred name)
4. Disable Google Analytics (not needed for MVP)
5. Click "Create Project"

### **Step 4: Enable Firebase Services (10 min)**

#### **4.1 Enable Authentication**

1. In Firebase Console, go to **Build → Authentication**
2. Click "Get Started"
3. Enable sign-in methods:
   - ✅ **Email/Password** (enable)
   - ✅ **Google** (enable and configure)
4. Click "Save"

#### **4.2 Enable Firestore Database**

1. Go to **Build → Firestore Database**
2. Click "Create Database"
3. Choose **"Start in test mode"** (we'll deploy rules later)
4. Select location: **europe-west1** (closest to Iceland)
5. Click "Enable"

#### **4.3 Enable Storage**

1. Go to **Build → Storage**
2. Click "Get Started"
3. Choose **"Start in test mode"** (we'll deploy rules later)
4. Use same location: **europe-west1**
5. Click "Done"

### **Step 5: Get Firebase Credentials (10 min)**

#### **5.1 Web App Credentials (Client-side)**

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the **Web icon** (`</>`)
4. Register app:
   - App nickname: **Bustadurinn Web**
   - ✅ Also set up Firebase Hosting
5. Copy the config object shown

#### **5.2 Service Account Credentials (Server-side)**

1. In **Project Settings**, go to **Service Accounts** tab
2. Click **"Generate new private key"**
3. Click **"Generate key"** (downloads a JSON file)
4. **IMPORTANT:** Keep this file secure, never commit to git!

### **Step 6: Configure Environment Variables (5 min)**

1. Open `.env.local` file (created from `.env.local.example`)

2. Add Firebase client credentials (from Step 5.1):

```env
# Firebase Client (from Web App config)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bustadurinn-is.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bustadurinn-is
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bustadurinn-is.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
```

3. Add Firebase Admin credentials (from Step 5.2 JSON file):

```env
# Firebase Admin (from service account JSON)
FIREBASE_ADMIN_PROJECT_ID=bustadurinn-is
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@bustadurinn-is.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**Note:** The private key must be in quotes and include `\n` for newlines.

4. Set app URL:

```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Step 7: Initialize Firebase in Project (3 min)**

Link your local project to Firebase:

```bash
firebase init
```

When prompted:
- ✅ Select: **Firestore**, **Storage**, **Hosting**, **Emulators**
- ✅ Use existing project: **bustadurinn-is**
- ✅ Firestore rules file: **firestore.rules** (already exists)
- ✅ Firestore indexes file: **firestore.indexes.json** (already exists)
- ✅ Storage rules file: **storage.rules** (already exists)
- ✅ Hosting public directory: **out**
- ✅ Configure as single-page app: **Yes**
- ✅ Set up automatic builds: **No**
- ✅ Select emulators: **Authentication**, **Firestore**, **Storage**
- ✅ Emulator ports: (use defaults or as shown in `firebase.json`)
- ✅ Download emulators: **Yes**

### **Step 8: Deploy Security Rules (5 min)**

Deploy Firestore and Storage security rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules
```

Verify deployment:
```bash
firebase firestore:indexes
```

You should see the 15 composite indexes listed.

### **Step 9: Create Super Admin (10 min)**

You need to manually create the first super admin user in Firebase Console:

1. Go to **Authentication → Users**
2. Click **"Add User"**
3. Enter your email and password
4. Copy the **User UID** shown

5. Go to **Firestore Database**
6. Create collection: `user_roles`
7. Add document with ID = the User UID you copied
8. Set fields:
```json
{
  "is_super_admin": true,
  "organization_roles": {},
  "created_at": [current timestamp],
  "updated_at": [current timestamp]
}
```

9. Create collection: `users`
10. Add document with same User UID
11. Set fields:
```json
{
  "id": "[your user UID]",
  "email": "[your email]",
  "name": "[your name]",
  "created_at": [current timestamp],
  "updated_at": [current timestamp]
}
```

### **Step 10: Seed Test Data (Optional - 5 min)**

Seed the database with test data (Íslandsbanki organization):

```bash
npm install -D firebase-admin dotenv tsx
```

Run seed script:
```bash
npx tsx scripts/seed-data.ts
```

This creates:
- 1 Organization (Íslandsbanki)
- 3 Houses (Þingvallahús, Skaftafellshús, Mývatnssteinn)
- 2 Pending Access Requests
- 2 Active Members
- 1 Pending Booking Request
- 1 Confirmed Booking

### **Step 11: Test with Emulators (Optional - 10 min)**

For local development, use Firebase emulators:

1. Start emulators:
```bash
firebase emulators:start
```

2. Access Emulator UI:
```
http://localhost:4000
```

3. Update `.env.local` to use emulators:
```env
# Add these for local development
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

4. In your Firebase config (`src/lib/firebase.ts`), add:
```typescript
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

---

## ✅ Verification Checklist

Before proceeding to development, verify:

- [ ] Firebase CLI installed and logged in
- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password + Google)
- [ ] Firestore database enabled
- [ ] Storage enabled
- [ ] Web app registered and credentials copied
- [ ] Service account key downloaded
- [ ] `.env.local` configured with all credentials
- [ ] Security rules deployed
- [ ] Composite indexes deployed
- [ ] Super admin user created
- [ ] (Optional) Test data seeded
- [ ] (Optional) Emulators working

---

## 🧪 Test Your Setup

Run a quick test to verify everything works:

```bash
npm run dev
```

Then test:

1. **Authentication:**
   - Go to `/login`
   - Try signing in with super admin account
   - Should redirect to dashboard

2. **Firestore:**
   - Go to `/admin/dashboard`
   - Should see organization list (empty or seeded data)
   - No console errors about permissions

3. **Storage (later):**
   - Upload organization logo
   - Should appear in Firebase Console → Storage

---

## 🔒 Security Notes

**Important security practices:**

1. **Never commit `.env.local` to git**
   - Already in `.gitignore`
   - Contains sensitive credentials

2. **Never commit service account JSON**
   - Store securely outside of project
   - Use environment variables

3. **Production deployment:**
   - Use Firebase Functions or Vercel for server-side code
   - Set environment variables in hosting platform
   - Enable App Check for added security

4. **Security rules:**
   - Test thoroughly before production
   - Monitor Firebase Console for unauthorized access
   - Review rules regularly

---

## 🚀 Production Deployment

When ready to deploy:

1. **Update `.firebaserc`** with production project ID
2. **Deploy functions** (if using):
   ```bash
   firebase deploy --only functions
   ```
3. **Deploy hosting**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
4. **Set production environment variables** in hosting platform
5. **Enable Firebase App Check** for production security
6. **Set up monitoring** and alerts

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Emulators](https://firebase.google.com/docs/emulator-suite)
- [Next.js with Firebase](https://firebase.google.com/docs/web/setup#next.js)

---

## 🐛 Troubleshooting

### **Error: "Permission Denied"**
- Check security rules are deployed
- Verify user has correct role in `user_roles` collection
- Check authentication token is valid

### **Error: "Index Not Found"**
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Check Firebase Console → Firestore → Indexes
- Wait 2-5 minutes for indexes to build

### **Error: "Module Not Found"**
- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`
- Restart dev server

### **Emulators Not Starting**
- Check ports are not in use
- Kill existing processes: `lsof -ti:4000 | xargs kill`
- Try different ports in `firebase.json`

---

## ✅ Done!

Your Firebase setup is complete! 🎉

**Next steps:**
1. Proceed to **TASK-001: Project Initialization**
2. Start building the application
3. Test with emulators during development
4. Deploy to production when ready

---

**Questions?** Check STATUS.md or ask in the project chat.
