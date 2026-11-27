# 🖼️ FIREBASE STORAGE SETUP GUIDE

## 🚨 CRITICAL FINDING

**Problem:** Images are NOT being stored in Firebase because **Firebase Storage is not enabled** for your project!

The code is correctly implemented to upload images, but Firebase Storage service hasn't been activated yet.

---

## ✅ SOLUTION: Enable Firebase Storage

### **Step 1: Enable Firebase Storage in Console**

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/bustadurinn-599f2/storage
   ```

2. **Click "Get Started"** button

3. **Choose Security Rules:**
   - Select **"Start in production mode"** (we'll deploy custom rules in Step 2)
   - Click **Next**

4. **Select Storage Location:**
   - Choose **europe-west1** (Frankfurt) - closest to Iceland
   - OR **europe-north1** (Finland) - also good option
   - Click **Done**

5. **Wait for storage bucket creation** (takes ~30 seconds)

---

### **Step 2: Deploy Storage Security Rules**

Once Storage is enabled, run this command to deploy our custom security rules:

```bash
npx -y firebase-tools deploy --only storage
```

**What this does:**
- Uploads `storage.rules` to Firebase
- Rules allow:
  ✅ Authenticated house members to upload images
  ✅ Anyone to read images (for guest views)
  ✅ Max 5MB file size
  ✅ Images only (no other file types)

---

### **Step 3: Verify Storage Works**

1. Go to **Settings → Húsupplýsingar** in your app
2. Click **"Bæta við mynd"** (Add image)
3. Select an image file
4. Crop and save
5. Check Firebase Console → Storage:
   ```
   https://console.firebase.google.com/project/bustadurinn-599f2/storage
   ```
6. You should see: `houses/{house_id}/image.jpg`

---

## 📂 Storage Structure

Images are organized as:

```
gs://bustadurinn-599f2.appspot.com/
├── houses/
│   ├── {house_id_1}/
│   │   ├── image.jpg                  ← Main house photo
│   │   ├── gallery_1704369600000.jpg  ← Gallery image 1
│   │   └── gallery_1704369700000.jpg  ← Gallery image 2
│   └── {house_id_2}/
│       └── image.jpg
└── users/
    └── {user_id}/
        └── profile.jpg                 ← User profile photo
```

---

## 🔒 Security Rules Explained

**File:** `storage.rules`

```rules
// House images
match /houses/{houseId}/{imageFile} {
  allow read: if true;  // Anyone can view
  allow write: if request.auth != null &&  // Must be logged in
    request.auth.uid in get(/databases/(default)/documents/houses/$(houseId)).data.owner_ids;  // Must be house member
  allow write: if request.resource.size < 5 * 1024 * 1024;  // Max 5MB
}
```

**Key Points:**
- ✅ Public read access (needed for guest views)
- ✅ Only house members can upload/delete
- ✅ File size limit (5MB)
- ✅ Image type validation

---

## 🐛 Current Code Analysis

**Upload Implementation:** ✅ **CORRECT**

Location: `src/pages/SettingsPage.tsx` (lines 296-359)

```tsx
const handleCroppedImage = async (blob: Blob) => {
  const fileName = cropMode === 'main' ? 'image.jpg' : `gallery_${Date.now()}.jpg`;
  const storageRef = ref(storage, `houses/${house.id}/${fileName}`);
  
  // Upload to Firebase Storage
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  const downloadURL = await getDownloadURL(storageRef);
  
  // Save URL to Firestore
  await updateDoc(doc(db, 'houses', house.id), {
    image_url: downloadURL  // or gallery_urls
  });
};
```

**Why it wasn't working:**
- ❌ Firebase Storage not enabled in project
- ❌ No `storage.rules` file deployed
- ❌ `uploadBytes()` was silently failing

**Now it will work:**
- ✅ Storage bucket created
- ✅ Security rules deployed
- ✅ Uploads will succeed

---

## 📸 Image Upload Flow (After Fix)

1. **User clicks "Bæta við mynd"**
2. **File selector opens**
3. **User selects image**
4. **Image cropper shows** (aspect ratio options)
5. **User crops and saves**
6. **Progress: "Uploading..."** (this was missing, we'll add it)
7. **Upload to Firebase Storage** → `houses/{id}/image.jpg`
8. **Get download URL** → `https://firebasestorage.googleapis.com/...`
9. **Save URL to Firestore** → `houses/{id}.image_url`
10. **Update UI** → Image appears on dashboard

---

## 🎯 Next Steps After Enabling Storage

1. **Enable Firebase Storage** (Step 1 above)
2. **Deploy storage rules** (Step 2 above)
3. **Test image upload** (Step 3 above)
4. **Add upload progress UI** (see below)

---

## 🚀 BONUS: Add Upload Progress Indicator

Want to show upload progress? Add this to `SettingsPage.tsx`:

```tsx
const [uploadProgress, setUploadProgress] = useState(0);

const handleCroppedImage = async (blob: Blob) => {
  const uploadTask = uploadBytesResumable(storageRef, blob, metadata);
  
  uploadTask.on('state_changed', 
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      setUploadProgress(Math.round(progress));
    }
  );
  
  await uploadTask;
  // Rest of code...
};

// In JSX:
{uploadProgress > 0 && uploadProgress < 100 && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 text-center">
      <p className="text-lg font-bold mb-2">Hleður upp mynd...</p>
      <div className="w-64 bg-stone-200 rounded-full h-2">
        <div 
          className="bg-amber h-2 rounded-full transition-all"
          style={{ width: `${uploadProgress}%` }}
        />
      </div>
      <p className="text-sm text-stone-500 mt-2">{uploadProgress}%</p>
    </div>
  </div>
)}
```

---

## 📋 Verification Checklist

After enabling Storage:

- [ ] Firebase Storage appears in Console
- [ ] `npx firebase-tools deploy --only storage` succeeds
- [ ] Can upload images in Settings
- [ ] Images appear in Firebase Console → Storage
- [ ] Images display on Dashboard
- [ ] Mobile upload works
- [ ] Gallery upload works
- [ ] Guest view shows images

---

## 🔗 Useful Links

- **Firebase Console - Storage:** https://console.firebase.google.com/project/bustadurinn-599f2/storage
- **Firebase Storage Docs:** https://firebase.google.com/docs/storage
- **Security Rules Reference:** https://firebase.google.com/docs/storage/security

---

## ⚠️ Important Notes

1. **Storage costs money** after free tier (5GB storage, 1GB/day downloads)
2. **Optimize images before upload** (resize to max 1920px width)
3. **Use image compression** (consider using `canvas` API)
4. **Delete old images** when replacing to save storage space

---

**Status:** ⏳ **Waiting for Step 1** (Enable Firebase Storage in Console)

Once you've enabled Storage, run:
```bash
npx -y firebase-tools deploy --only storage
```

Then test image uploads! 🎉
