import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, auth, initializeFirebaseAdmin } from './utils/firebaseAdmin';
import { verifyAdminToken } from './utils/admin-auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initializeFirebaseAdmin();

        if (!db || !auth) throw new Error('Services failed to init');

        // Security Check & Admin Verification
        const decodedToken = await verifyAdminToken(req, res);
        if (!decodedToken) return; // Response handled in helper

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
