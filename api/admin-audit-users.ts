import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, admin, db, auth } from './utils/firebaseAdmin';

async function requireAdmin(req: VercelRequest): Promise<admin.auth.DecodedIdToken> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('UNAUTHORIZED');
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Check RBAC user_roles collection for super_admin
        const roleDoc = await admin.firestore().collection('user_roles').doc(decodedToken.uid).get();
        if (!roleDoc.exists || roleDoc.data()?.system_role !== 'super_admin') {
            throw new Error('FORBIDDEN');
        }

        return decodedToken;
    } catch (error: any) {
        if (error.message === 'FORBIDDEN') throw error;
        throw new Error('UNAUTHORIZED');
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initializeFirebaseAdmin();
        await requireAdmin(req);

        if (!auth || !db) throw new Error('Services not initialized');

        // 1. List all Auth users
        const authUsers: admin.auth.UserRecord[] = [];
        let nextPageToken: string | undefined;
        do {
            const result: admin.auth.ListUsersResult = await auth.listUsers(1000, nextPageToken);
            authUsers.push(...result.users);
            nextPageToken = result.pageToken;
        } while (nextPageToken);

        // 2. Cross-reference with Firestore
        const orphans = [];
        const testKeywords = ['test', 'debug', 'prufa', 'example.com', 'testing'];

        // Batch checks to avoid hitting Firestore limits on large lists
        // For current volume, we can check sequentially or in chunks
        for (const user of authUsers) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                const isTest = testKeywords.some(kw =>
                    (user.email?.toLowerCase().includes(kw)) ||
                    (user.displayName?.toLowerCase().includes(kw))
                );

                orphans.push({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    createdAt: user.metadata.creationTime,
                    lastLogin: user.metadata.lastSignInTime,
                    isTest
                });
            }
        }

        return res.status(200).json({
            count: orphans.length,
            orphans: orphans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        });

    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') return res.status(401).json({ error: 'Unauthorized' });
        if (error.message === 'FORBIDDEN') return res.status(403).json({ error: 'Forbidden' });

        console.error('Audit Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
