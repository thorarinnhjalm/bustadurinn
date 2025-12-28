/**
 * Data Models for Bústaðurinn.is
 * Based on Firestore Schema with Manager/Member Role Logic
 */

// Role Types
export type UserRole = 'manager' | 'member' | 'guest';

export interface House {
    id: string;
    name: string;
    address: string;
    location: {
        lat: number;
        lng: number;
    };
    image_url?: string;
    rules?: string;
    wifi_ssid?: string;
    wifi_password?: string;
    seo_slug?: string;

    // Guest Information
    house_rules?: string;
    check_in_time?: string;
    check_out_time?: string;
    directions?: string;
    access_instructions?: string;
    emergency_contact?: string;

    manager_id: string; // The designated administrator (Bústaðastjóri)
    owner_ids: string[]; // All members

    // Settings
    holiday_mode: 'fairness' | 'first_come';
    invite_code?: string;
    guest_token?: string;

    created_at: Date;
    updated_at: Date;
}

export interface User {
    uid: string;
    email: string;
    name: string;
    avatar?: string;
    house_ids: string[];
    language?: 'is' | 'en' | 'de' | 'fr' | 'es'; // Preferred language
    created_at: Date;
    last_login?: Date;
}

export type BookingType = 'personal' | 'guest' | 'rental' | 'maintenance';

export interface Booking {
    id: string;
    house_id: string;
    user_id: string;
    user_name: string;
    start: Date;
    end: Date;
    type: BookingType;
    notes?: string;
    created_at: Date;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
    id: string;
    house_id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    assigned_to?: string;
    assigned_to_name?: string;
    due_date?: Date;
    created_by: string;
    created_at: Date;
    completed_at?: Date;
}

// Budget Playground (Rekstrarhermir)
export type BudgetFrequency = 'monthly' | 'yearly' | 'one-time';

export interface BudgetItem {
    category: string; // e.g., "Electricity", "Maintenance", "Property Tax"
    estimated_amount: number;
    frequency: BudgetFrequency;
}

export interface BudgetPlan {
    id: string;
    house_id: string;
    year: number;
    items: BudgetItem[];
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

// Finance Ledger (Bókhald) - Internal Only
export type LedgerType = 'expense' | 'income';

export interface LedgerEntry {
    id: string;
    house_id: string;
    date: Date; // ISO YYYY-MM-DD or Date object
    category: string;
    description: string;
    amount: number;
    type: LedgerType;
    paid_by_user_id: string; // Who paid / received
    user_uid?: string; // Creator ID (optional for backward compact)
    paid_by_name?: string;
    created_at: Date;
}

export interface GuestbookEntry {
    id: string;
    house_id: string;
    author: string;
    message: string;
    created_at: Date;
}

export interface GuestAccess {
    id: string;
    house_id: string;
    guest_name: string;
    guest_email?: string;
    valid_from: Date; // 48h before booking start
    valid_until: Date; // 48h after booking end
    magic_link: string;
    booking_id?: string;
    used?: boolean;
    created_by: string;
    created_at: Date;
}

// Pricing Plans
export type PlanType = 'monthly' | 'annual';

export interface PricingPlan {
    id: PlanType;
    name: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
    recommended?: boolean;
}
