
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'bustadurinn-599f2.firebasestorage.app'
    });
}

const storage = admin.storage();
const bucket = storage.bucket(); // Uses the default bucket from config

async function findHouseImages() {
    const houseId = 'lnnZcTI9OYcl3giFL4QS';
    const prefix = `houses/${houseId}/`;

    console.log(`Searching storage for images with prefix: ${prefix}`);

    try {
        const [files] = await bucket.getFiles({ prefix });

        if (files.length === 0) {
            console.log("❌ No images found in storage for this house.");
            return;
        }

        console.log(`✅ Found ${files.length} files:`);

        const updates = {};
        let mainImageSet = false;
        const galleryUrls = [];

        for (const file of files) {
            console.log(`- ${file.name}`);

            // Generate a signed URL or public URL
            // Since we are admin, we can get a signed URL, but for the app we usually use the public download token URL.
            // Getting the actual 'downloadURL' used by client SDK is tricky from Admin SDK without metadata parsing.
            // Let's inspect metadata.
            const [metadata] = await file.getMetadata();
            // console.log('Metadata:', metadata);

            // Construct download URL if token exists, otherwise we might need to generate one
            let downloadUrl = '';

            if (metadata.metadata && metadata.metadata.firebaseStorageDownloadTokens) {
                const token = metadata.metadata.firebaseStorageDownloadTokens.split(',')[0];
                downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`;
            } else {
                console.log(`   ⚠️ No public token found for ${file.name}. Generating signed URL for temporary view.`);
                const [url] = await file.getSignedUrl({
                    action: 'read',
                    expires: '03-01-2030'
                });
                downloadUrl = url;
            }

            console.log(`   URL: ${downloadUrl}`);

            if (file.name.endsWith('image.jpg')) {
                updates.image_url = downloadUrl;
                mainImageSet = true;
            } else if (file.name.includes('gallery_')) {
                galleryUrls.push(downloadUrl);
            }
        }

        if (galleryUrls.length > 0) {
            updates.gallery_urls = galleryUrls;
        }

        if (Object.keys(updates).length > 0) {
            console.log("Updates to apply:", updates);

            // Apply updates to Firestore
            const db = admin.firestore();
            await db.collection('houses').doc(houseId).update(updates);
            console.log("✅ House document updated with found images!");
        } else {
            console.log("No relevant image files found (checked for image.jpg and gallery_*)");
        }

    } catch (error) {
        console.error("Error searching storage:", error);
    }
}

findHouseImages();
