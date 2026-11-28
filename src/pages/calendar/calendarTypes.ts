import type { Booking, BookingType } from '@/types/models';

// View type derived from string as generic View type import is tricky
export type CalendarView = 'month' | 'week' | 'work_week' | 'day' | 'agenda';

export interface BookingEvent {
    id: string;
    booking: Booking;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;

    resource?: any;
}

export interface NewBookingForm {
    start: Date;
    end: Date;
    type: BookingType;
    notes: string;
}

export interface SuccessBooking {
    user_name: string;
    start: Date;
    end: Date;
}

/** Today at local midnight (bookings are whole-day ranges). */
export const startOfToday = (): Date => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
