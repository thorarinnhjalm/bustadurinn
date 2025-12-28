# 🚀 Quick Start Guide - Bústaðurinn.is

## Step 1: Firebase Setup (Required)

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it "bustadurinn-dev" (or your preferred name)
4. Disable Google Analytics (optional for dev)
5. Click "Create project"

### 1.2 Enable Authentication
1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. Click "Save"

### 1.3 Create Firestore Database
1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (e.g., europe-west3)
5. Click "Enable"

### 1.4 Get Firebase Credentials
1. In Firebase Console, click the ⚙️ (Settings) icon
2. Select "Project settings"
3. Scroll to "Your apps" section
4. Click the web icon ("</>")
5. Register app with nickname "Bústaðurinn Web"
6. Copy the firebaseConfig object

### 1.5 Configure Environment Variables
1. In your project root, create `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and paste your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=bustadurinn-dev.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=bustadurinn-dev
   VITE_FIREBASE_STORAGE_BUCKET=bustadurinn-dev.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

## Step 2: Run the App

```bash
# Start the development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Step 3: Test the Flow

### Create Your First Account
1. Click **"Byrja núna"** (Start now) button
2. Fill in:
   - Name: "Test Notandi"
   - Email: "test@example.com"
   - Password: "test123"
   - Confirm password: "test123"
3. Click **"Búa til aðgang"** (Create account)

### Complete Onboarding
1. Click **"Byrja uppsetningu"** (Start setup)
2. Enter house details:
   - Name: "Sumarbústaðurinn"
   - Address: "Sumarhúsabyggð 12, 800 Selfoss"
3. Click **"Áfram"** (Next)
4. (Optional) Add co-owner emails or click **"Sleppa  þessu skrefi"** (Skip)
5. Click **"Fara á stjórnborð"** (Go to dashboard)

### You're In! 🎉
You should now see the dashboard. The app is working correctly.

## Step 4: Firebase Security Rules (Recommended)

Add these basic security rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Houses - users can read houses they're part of
    match /houses/{houseId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.owner_ids;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.owner_ids;
    }
    
    // Bookings - users can read/write for their houses
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null;
    }
    
    // Tasks - users can read/write for their houses
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
    
    // Finance - users can read/write for their houses
    match /finance/{financeId} {
      allow read, write: if request.auth != null;
    }
    
    // Guestbook - users can read/write for their houses
    match /guestbook/{entryId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Error: "Firebase config not found"
- Make sure `.env.local` exists with correct Firebase credentials
- Restart the dev server: `Ctrl+C` then `npm run dev`

### Error: "Firebase: Error (auth/...)"
- Check that Email/Password auth is enabled in Firebase Console
- Verify your .env.local credentials are correct

### Page doesn't load / White screen
- Check browser console for errors (F12)
- Make sure dev server is running
- Try hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### CSS not loading correctly
- Clear browser cache
- Restart dev server
- Check that `src/index.css` exists

## Understanding the Project Structure

```
src/
├── config/
│   └── firebase.ts          # Firebase configuration from .env
├── lib/
│   └── firebase.ts          # Firebase service initialization
├── store/
│   └── appStore.ts          # Zustand global state
├── types/
│   └── models.ts            # TypeScript data models
├── pages/
│   ├── LandingPage.tsx      # Public homepage
│   ├── LoginPage.tsx        # Authentication
│   ├── SignupPage.tsx       # Account creation
│   ├── OnboardingPage.tsx   # New user wizard
│   ├── DashboardPage.tsx    # Main app (protected)
│   └── SuperAdminPage.tsx   # Admin panel (protected)
├── App.tsx                  # Router and auth listener
├── main.tsx                 # App entry point
└── index.css                # Scandi design system
```

## What's Next?

Now that the scaffolding is working, you can:

1. **Implement Features** (See PROJECT_STATUS.md for roadmap)
   - Booking calendar
   - Task management
   - Financial tracking

2. **Add More Styling**
   - Customize colors in `index.css`
   - Add more components

3. **Integrate External Services**
   - Google Maps for locations
   - Weather API
   - Email notifications

4. **Deploy to Production**
   - Set up Vercel project
   - Add production Firebase project
   - Configure custom domain

## Need Help?

- 📖 Read the full [README.md](./README.md)
- 📋 Check [PROJECT_STATUS.md](./PROJECT_STATUS.md) for implementation details
- 🔥 [Firebase Docs](https://firebase.google.com/docs)
- ⚛️ [React Router Docs](https://reactrouter.com)
- 🐻 [Zustand Docs](https://zustand-demo.pmnd.rs/)

---

**Happy Building! 🏡**
