import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    doc,
    writeBatch,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Feedback } from '@/types/models';
import { logger } from '@/utils/logger';

const COLLECTION_NAME = 'feedback';
// Sanitised public copies of featured feedback (userName = first name only,
// rating, comment, createdAt, featuredAt). Readable by anyone; see firestore.rules.
const PUBLIC_COLLECTION_NAME = 'featured_feedback';

const firstName = (name?: string): string => {
    const first = (name || '').trim().split(/\s+/)[0];
    return first || 'Notandi';
};

const publicCopy = (d: Record<string, any>) => ({
    userName: firstName(d.userName),
    rating: d.rating,
    comment: d.comment ?? '',
    createdAt: d.createdAt,
    featuredAt: serverTimestamp()
});

export interface FeedbackSubmission {
    userId: string;
    userName: string;
    userEmail?: string;
    rating: number;
    comment: string;
    canContact: boolean;
    path: string;
}

export const feedbackService = {
    /**
     * Submit new user feedback
     */
    submitFeedback: async (data: FeedbackSubmission): Promise<string> => {
        try {
            const feedbackData = {
                ...data,
                userAgent: navigator.userAgent,
                createdAt: serverTimestamp(),
                featured: false
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), feedbackData);
            return docRef.id;
        } catch (error) {
            logger.error('Error submitting feedback:', error);
            throw new Error('Could not submit feedback');
        }
    },

    /**
     * Get all feedback (Admin only)
     */
    getAllFeedback: async (): Promise<Feedback[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            } as Feedback));
        } catch (error) {
            logger.error('Error fetching feedback:', error);
            throw error;
        }
    },

    /**
     * Get featured feedback for landing page
     */
    getFeaturedFeedback: async (): Promise<Feedback[]> => {
        try {
            const q = query(
                collection(db, PUBLIC_COLLECTION_NAME),
                orderBy('createdAt', 'desc'),
                limit(10)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            } as Feedback));
        } catch (error) {
            logger.error('Error fetching featured feedback:', error);
            return [];
        }
    },

    /**
     * Toggle featured status (Admin only)
     */
    toggleFeatured: async (id: string, featured: boolean): Promise<void> => {
        try {
            const batch = writeBatch(db);
            batch.update(doc(db, COLLECTION_NAME, id), { featured });
            const publicRef = doc(db, PUBLIC_COLLECTION_NAME, id);
            if (featured) {
                const snap = await getDoc(doc(db, COLLECTION_NAME, id));
                if (!snap.exists()) throw new Error('Feedback not found');
                batch.set(publicRef, publicCopy(snap.data()));
            } else {
                batch.delete(publicRef);
            }
            await batch.commit();
        } catch (error) {
            logger.error('Error toggling featured status:', error);
            throw error;
        }
    },

    /**
     * Re-create public copies for all featured feedback and remove copies whose
     * source is no longer featured (Admin only). Returns counts.
     */
    syncFeaturedCopies: async (): Promise<{ created: number; removed: number }> => {
        try {
            const [featuredSnap, publicSnap] = await Promise.all([
                getDocs(query(collection(db, COLLECTION_NAME), where('featured', '==', true))),
                getDocs(collection(db, PUBLIC_COLLECTION_NAME))
            ]);
            const featuredIds = new Set(featuredSnap.docs.map(d => d.id));
            const stale = publicSnap.docs.filter(d => !featuredIds.has(d.id));

            const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [
                ...featuredSnap.docs.map(d => (b: ReturnType<typeof writeBatch>) =>
                    b.set(doc(db, PUBLIC_COLLECTION_NAME, d.id), publicCopy(d.data()))),
                ...stale.map(d => (b: ReturnType<typeof writeBatch>) => b.delete(d.ref))
            ];
            for (let i = 0; i < ops.length; i += 400) {
                const batch = writeBatch(db);
                ops.slice(i, i + 400).forEach(op => op(batch));
                await batch.commit();
            }
            return { created: featuredSnap.size, removed: stale.length };
        } catch (error) {
            logger.error('Error syncing featured feedback:', error);
            throw error;
        }
    },

    /**
     * Delete feedback (Admin only)
     */
    deleteFeedback: async (id: string): Promise<void> => {
        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, COLLECTION_NAME, id));
            batch.delete(doc(db, PUBLIC_COLLECTION_NAME, id));
            await batch.commit();
        } catch (error) {
            logger.error('Error deleting feedback:', error);
            throw error;
        }
    }
};
