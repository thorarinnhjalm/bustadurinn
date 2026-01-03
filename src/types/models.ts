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
    house_rules_en?: string;
    check_in_time?: string;
    check_out_time?: string;
    directions?: string;
    directions_en?: string;
    access_instructions?: string;
    access_instructions_en?: string;
    emergency_contact?: string;

    manager_id: string; // The designated administrator (Bústaðastjóri)
    owner_ids: string[]; // All members

    // Settings
    holiday_mode: 'fairness' | 'first_come';
    invite_code?: string;
    guest_token?: string;

    // Subscription
    subscription_status?: 'trial' | 'active' | 'free' | 'expired';
    plan_id?: 'monthly' | 'annual';
    subscription_end?: Date;

    created_at: Date;
    updated_at: Date;
}

export interface NotificationSettings {
    emails: {
        new_bookings: boolean;
        task_reminders: boolean;
        system_updates: boolean;
        member_activity: boolean;
    };
    in_app: {
        new_bookings: boolean;
        task_assignments: boolean;
        guestbook_entries: boolean;
        shopping_list_updates: boolean;
    };
}

export interface User {
    uid: string;
    email: string;
    name: string;
    avatar?: string;
    house_ids: string[];
    language?: 'is' | 'en' | 'de' | 'fr' | 'es'; // Preferred language
    notification_settings?: NotificationSettings;
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
export type BudgetItemType = 'expense' | 'income';

export interface BudgetItem {
    category: string; // e.g., "Electricity", "Maintenance", "Property Tax" or "Monthly Contribution"
    estimated_amount: number;
    frequency: BudgetFrequency;
    type: BudgetItemType; // expense or income
    assigned_owner_id?: string; // For income: which co-owner contributes this (optional)
    assigned_owner_name?: string; // For display purposes
    month?: number; // Optional: 1-12. If set, the expense is allocated to this specific month.
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
    split_between?: { uid: string, name: string }[];
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

export interface Coupon {
    id: string;
    code: string; // e.g., "SUMAR2025"
    discount_type: 'percent' | 'fixed'; // 20% off vs. 2000 kr off
    discount_value: number; // 20 vs 2000
    description: string;
    valid_until?: Date;
    max_uses?: number; // Total usages across system
    used_count: number;
    active: boolean;
    created_at: Date;
}

// Shopping List
export interface ShoppingItem {
    id: string;
    house_id: string;
    item: string;
    checked: boolean;
    added_by: string;
    added_by_name: string;
    checked_by?: string;
    checked_by_name?: string;
    checked_at?: Date;
    created_at: Date;
}

// Logbook (Internal Communication between owners)
export interface InternalLog {
    id: string;
    house_id: string;
    user_id: string;
    user_name: string;
    text: string;
    created_at: Date;
}

// Notifications
export interface AppNotification {
    id: string;
    user_id: string;
    house_id: string;
    title: string;
    message: string;
    type: 'booking' | 'task' | 'guestbook' | 'shopping' | 'system';
    read: boolean;
    data?: {
        booking_id?: string;
        task_id?: string;
        guest_access_id?: string;
    };
    created_at: Date;
}
