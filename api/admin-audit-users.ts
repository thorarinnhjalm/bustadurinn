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
        let authUsers: any[] = [];
        try {
            const listUsersResult = await auth.listUsers(1000);
            authUsers = listUsersResult.users;
        } catch (authError: any) {
            console.error('Audit Error (Auth):', authError);
            return res.status(500).json({
                error: 'Failed to fetch users from Firebase Auth',
                details: authError.message
            });
        }

        // 2. Fetch Firestore Users
        const firestoreUsers = new Map();
        try {
            const usersSnap = await db.collection('users').get();
            usersSnap.forEach((doc: any) => {
                firestoreUsers.set(doc.id, doc.data());
            });
        } catch (dbError: any) {
            console.error('Audit Error (Firestore):', dbError);
            return res.status(500).json({
                error: 'Failed to fetch user profiles from Firestore',
                details: dbError.message
            });
        }

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

        // Sort - with safety for missing dates
        const sortByDate = (a: any, b: any) => {
            const dateA = a.created ? new Date(a.created).getTime() : 0;
            const dateB = b.created ? new Date(b.created).getTime() : 0;
            return dateB - dateA;
        };
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
        console.error('Global Audit API Error:', error);
        return res.status(500).json({
            error: 'Unexpected server error during audit',
            details: error.message
        });
    }
}
