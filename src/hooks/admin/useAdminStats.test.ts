/**
 * useAdminStats Hook Tests
 * Tests centralized admin data fetching
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAdminStats } from '@/hooks/admin/useAdminStats';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
    db: {},
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    doc: vi.fn(),
}));

describe('useAdminStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with loading state', () => {
        const { result } = renderHook(() => useAdminStats());

        expect(result.current.loading).toBe(true);
        expect(result.current.stats.totalHouses).toBe(0);
        expect(result.current.stats.totalUsers).toBe(0);
        expect(result.current.error).toBeNull();
    });

    it('should have all required stats properties', () => {
        const { result } = renderHook(() => useAdminStats());

        expect(result.current.stats).toHaveProperty('totalHouses');
        expect(result.current.stats).toHaveProperty('totalUsers');
        expect(result.current.stats).toHaveProperty('totalBookings');
        expect(result.current.stats).toHaveProperty('allHouses');
        expect(result.current.stats).toHaveProperty('allUsers');
        expect(result.current.stats).toHaveProperty('allContacts');
        expect(result.current.stats).toHaveProperty('launchOfferCount');
    });

    it('should provide setStats function', () => {
        const { result } = renderHook(() => useAdminStats());

        expect(typeof result.current.setStats).toBe('function');
    });

    it('should provide refreshStats function', () => {
        const { result } = renderHook(() => useAdminStats());

        expect(typeof result.current.refreshStats).toBe('function');
    });
});
