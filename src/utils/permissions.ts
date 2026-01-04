/**
 * Permission utilities for access control
 */

import type { Booking, User, House } from '@/types/models';

/**
 * Check if current user can view detailed booking information
 * (weather, notes, full details)
 * 
 * Rules:
 * - Booking owner: Always can view
 * - House manager: Can view all bookings
 * - Other members: Only basic info (name, dates, type)
 */
export const canViewBookingDetails = (
    booking: Booking,
    currentUser: User | null,
    house: House | null
): boolean => {
    if (!currentUser || !house || !booking) return false;

    // Booking owner can always see their own booking details
    if (booking.user_id === currentUser.uid) return true;

    // House manager can see all booking details
    if (house.manager_id === currentUser.uid) return true;

    // Other members: no detailed access
    return false;
};

/**
 * Check if current user can edit/delete a booking
 */
export const canEditBooking = (
    booking: Booking,
    currentUser: User | null,
    house: House | null
): boolean => {
    if (!currentUser || !house || !booking) return false;

    // Booking owner can edit their own bookings
    if (booking.user_id === currentUser.uid) return true;

    // House manager can edit all bookings
    if (house.manager_id === currentUser.uid) return true;

    return false;
};

/**
 * Check if current user is house manager
 */
export const isHouseManager = (
    currentUser: User | null,
    house: House | null
): boolean => {
    if (!currentUser || !house) return false;
    return house.manager_id === currentUser.uid;
};
