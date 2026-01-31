import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Helper to init services (Copied from admin-delete-user.ts for consistency)
let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

function initServices() {
    if (admin.apps.length > 0) {
        db = admin.firestore();
        auth = admin.auth();
        return;
    }

    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id
                });
            } catch (jsonError: any) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', jsonError.message);
                throw new Error(`Service Account JSON Parse Error: ${jsonError.message}`);
            }
        } else {
            // Fallback
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: 'bustadurinn-is'
            });
        }
    } catch (error: any) {
        console.error('Firebase Admin initialization error:', error);
        throw new Error(`Firebase Init Failed: ${error.message}`);
    }

    if (!db) db = admin.firestore();
    if (!auth) auth = admin.auth();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initServices();

        if (!db || !auth) throw new Error('Services failed to init');

        // Security Check
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: Missing token' });
        }

        const token = authHeader.split('Bearer ')[1];
        try {
            await auth.verifyIdToken(token);
            // Could add RBAC check here if strictly needed
        } catch (e) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // 1. Fetch Auth Users (Limit 1000)
        // Note: listUsers() returns UserRecord[]
        const listUsersResult = await auth.listUsers(1000);
        const authUsers = listUsersResult.users;

        // 2. Fetch Firestore Users
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

        // Sort
        const sortByDate = (a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime();
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

    } catch (error: any) {
        console.error('Audit API Error:', error);
        return res.status(500).json({
            error: error.message,
            details: error.stack
        });
    }
}
