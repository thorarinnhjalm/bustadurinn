
import { cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load service account (cached)
const serviceAccountPath = join(process.cwd(), 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin (Singleton pattern for Vercel)
let app;
import { getApps, initializeApp } from 'firebase-admin/app';
if (getApps().length === 0) {
    app = initializeApp({
        credential: cert(serviceAccount)
    });
} else {
    app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Security: Basic check (In prod, verify ID token from header)
    // For this internal tool, we rely on the implementation simplicity 
    // but strictly speaking should verify req.headers.authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(idToken);

        // Optional: Check if admin
        // if (!decodedToken.email.includes('admin')) ... 

        // 1. Fetch all Auth Users (Batching if necessary, here limiting to 1000 for speed)
        const listUsersResult = await auth.listUsers(1000);
        const authUsers = listUsersResult.users;

        // 2. Fetch all Firestore Users
        const usersSnap = await db.collection('users').get();
        const firestoreUsers = new Map();
        usersSnap.forEach(doc => {
            firestoreUsers.set(doc.id, doc.data());
        });

        // 3. Analyze
        const orphans = [];
        const stuckUsers = [];

        for (const user of authUsers) {
            if (!firestoreUsers.has(user.uid)) {
                orphans.push({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || 'N/A',
                    created: user.metadata.creationTime,
                    lastSignIn: user.metadata.lastSignInTime
                });
            } else {
                const data = firestoreUsers.get(user.uid);
                if (!data.house_ids || data.house_ids.length === 0) {
                    stuckUsers.push({
                        uid: user.uid,
                        email: user.email,
                        name: data.name || user.displayName || 'Unknown',
                        created: user.metadata.creationTime,
                        lastSignIn: user.metadata.lastSignInTime
                    });
                }
            }
        }

        // Sort by most recent
        const sortByDate = (a, b) => new Date(b.created) - new Date(a.created);
        orphans.sort(sortByDate);
        stuckUsers.sort(sortByDate);

        return res.status(200).json({
            orphans,
            stuckUsers,
            stats: {
                totalAuth: authUsers.length,
                totalFirestore: firestoreUsers.size,
                orphanCount: orphans.length,
                stuckCount: stuckUsers.length
            }
        });

    } catch (error) {
        console.error('Audit error:', error);
        return res.status(500).json({ error: error.message });
    }
}
