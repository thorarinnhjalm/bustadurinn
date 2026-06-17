import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Feedback } from '@/types/models';
import { logger } from '@/utils/logger';

const COLLECTION_NAME = 'feedback';

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
                collection(db, COLLECTION_NAME),
                where('featured', '==', true),
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
            await updateDoc(doc(db, COLLECTION_NAME, id), { featured });
        } catch (error) {
            logger.error('Error toggling featured status:', error);
            throw error;
        }
    },

    /**
     * Delete feedback (Admin only)
     */
    deleteFeedback: async (id: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            logger.error('Error deleting feedback:', error);
            throw error;
        }
    }
};
