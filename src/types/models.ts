/**
 * Data Models for Bústaðurinn.is
 * Based on Firestore Schema with Manager/Member Role Logic
 */

// UTM Tracking
export interface UTMParams {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    captured_at: string;
    landing_page?: string;
}

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
    gallery_urls?: string[];
    rules?: string;
    wifi_ssid?: string;
    wifi_password?: string;
    no_wifi?: boolean; // True if house has no WiFi available
    seo_slug?: string;

    // Guest Information
    house_rules?: string;
    house_rules_en?: string;
    guest_instructions?: string; // General instructions for guests
    guest_instructions_en?: string;
    amenities?: string[]; // Array of amenity IDs: 'hot_tub', 'tv', 'grill', etc.
    check_in_time?: string;
    check_out_time?: string;
    directions?: string;
    directions_en?: string;
    access_instructions?: string;
    access_instructions_en?: string;
    emergency_contact?: string;

    manager_id: string; // The designated administrator (Bústaðastjóri)
    owner_ids: string[]; // All members
    organization_id?: string; // Optional: if house belongs to an organization

    // Settings
    holiday_mode: 'fairness' | 'first_come';
    invite_code?: string;
    guest_token?: string;

    // Privacy
    privacy_hide_finances?: boolean;
    finance_viewer_ids?: string[]; // Specific members allowed to view finances even if hidden

    // Subscription
    subscription_status?: 'free';

    created_at: Date;
    updated_at: Date;
}

export interface NotificationSettings {
    emails: {
        new_bookings: boolean;
        task_reminders: boolean;
        system_updates: boolean;
        member_activity: boolean;
        weather_alerts: boolean;
    };
    in_app: {
        new_bookings: boolean;
        task_assignments: boolean;
        guestbook_entries: boolean;
        shopping_list_updates: boolean;
        weather_alerts: boolean;
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
    fcm_tokens?: string[];
    utm_params?: UTMParams; // Marketing attribution data
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

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory = 'maintenance' | 'repair' | 'improvement' | 'cleaning' | 'other';

export interface TaskAttachment {
    url: string;
    name: string;
    type: 'image' | 'document';
    uploaded_at: Date;
    uploaded_by: string;
}

export interface Task {
    id: string;
    house_id: string;

    // Basic Info
    title: string;
    description?: string;
    category: TaskCategory;

    // Scheduling
    due_date?: Date;
    completed_at?: Date;

    // Cost Tracking
    estimated_cost?: number;
    actual_cost?: number;
    add_to_finances?: boolean; // Manual option to add completed cost to finance ledger
    finance_entry_id?: string; // Link to created finance entry if added

    // Attachments
    attachments?: TaskAttachment[];

    // Status & Priority
    status: TaskStatus;
    priority: TaskPriority;

    // Assignment
    created_by: string;
    created_by_name?: string;
    assigned_to?: string[]; // UIDs of members
    assigned_to_names?: string[]; // Names for display
    notified_members?: string[]; // Track who has been notified

    // Metadata
    created_at: Date;
    updated_at: Date;
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
    type: 'booking' | 'task' | 'guestbook' | 'shopping' | 'system' | 'join_request';
    read: boolean;
    data?: {
        booking_id?: string;
        task_id?: string;
        guest_access_id?: string;
        requester_id?: string;
        requester_email?: string;
    };
    created_at: Date;
}

export interface ContactReply {
    id?: string;
    body: string;
    from_email: string;
    created_at: Date;
    admin_id?: string;
    is_admin_reply: boolean;
}

export interface ContactSubmission {
    id: string;
    name: string;
    email: string;
    message: string;
    created_at: Date;
    status: 'new' | 'read' | 'replied';
    replies?: ContactReply[];
}

export interface Feedback {
    id: string;
    userId: string;
    userName: string;
    userEmail?: string;
    rating: number; // 1-5
    comment: string;
    canContact: boolean;
    userAgent: string;
    featured?: boolean; // Admin toggle for landing page
    createdAt: Date;
}

// Service Marketplace (Torgið)
export type ProviderStatus = 'active' | 'banned' | 'pending';

export interface ServiceProvider {
    id: string;
    name: string;
    category: string; // e.g. 'snow_removal', 'cleaning', 'maintenance'
    description: string;
    service_areas: string[]; // e.g. ['Grímsnes', 'Biskupstungur']
    contact_email: string;
    contact_phone: string;
    website?: string;
    address?: string;
    location?: { lat: number; lng: number };
    status: ProviderStatus;
    rating_avg: number;
    rating_count: number;
    created_at: Date;
    owner_uid?: string; // The user account managing this profile (optional)
}

export interface ServiceReview {
    id: string;
    provider_id: string;
    user_id: string;
    user_name: string;
    rating: number; // 1-5
    comment: string;
    created_at: Date;
}

// ============================================
// Organization (Starfsmannafélög) Features
// ============================================

export type OrganizationType = 'company' | 'union' | 'municipality';
export type SubscriptionTier = 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trial' | 'active' | 'expired';
export type PaymentMethod = 'invoice' | 'online' | 'payroll' | 'free';

export interface OrganizationSettings {
    require_access_approval: boolean;
    auto_approve_company_email: boolean;
    allowed_email_domains: string[];
    require_booking_approval: boolean;
    payment_required: boolean;
    payment_method?: PaymentMethod;
    price_per_night?: number;
    max_nights_per_booking?: number;
    max_bookings_per_year?: number;
    advance_booking_days?: number;
}

export interface OrganizationStats {
    total_properties: number;
    total_members: number;
    active_members: number;
    total_bookings: number;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    type: OrganizationType;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    subscription_tier: SubscriptionTier;
    subscription_status: SubscriptionStatus;
    subscription_start: Date;
    subscription_end: Date;
    billing_email: string;
    settings: OrganizationSettings;
    admin_user_ids: string[];
    stats: OrganizationStats;
    created_at: Date;
    created_by: string;
    updated_at: Date;
}

export type AccessRequestStatus = 'pending' | 'approved' | 'denied';

export interface AccessRequest {
    id: string;
    email: string;
    name: string;
    employee_id?: string;
    department?: string;
    phone?: string;
    reason?: string;
    status: AccessRequestStatus;
    email_domain_verified: boolean;
    employee_id_verified: boolean;
    reviewed_by?: string;
    reviewed_at?: Date;
    review_notes?: string;
    denial_reason?: string;
    requested_at: Date;
    ip_address?: string;
}

export type MemberStatus = 'pending' | 'approved' | 'active' | 'suspended';
export type AccessLevel = 'guest' | 'full';

export interface OrganizationMember {
    id: string;
    user_id: string;
    email: string;
    name: string;
    employee_id?: string;
    department?: string;
    hire_date?: Date;
    status: MemberStatus;
    access_level: AccessLevel;
    approved_by?: string;
    approved_at?: Date;
    approval_method?: 'manual' | 'auto';
    bookings_this_year: number;
    bookings_total: number;
    days_booked_this_year: number;
    last_booking_date?: Date;
    payment_balance: number;
    total_paid: number;
    created_at: Date;
    updated_at: Date;
}

export type BookingRequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled';
export type BookingPurpose = 'personal' | 'family' | 'work_retreat';
export type PaymentStatus = 'pending' | 'paid' | 'invoiced';

export interface BookingRequest {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    house_id: string;
    house_name: string;
    start_date: Date;
    end_date: Date;
    num_nights: number;
    num_guests: number;
    purpose: BookingPurpose;
    notes?: string;
    status: BookingRequestStatus;
    has_conflicts: boolean;
    conflict_details?: string;
    quota_check_passed: boolean;
    reviewed_by?: string;
    reviewed_at?: Date;
    review_notes?: string;
    denial_reason?: string;
    payment_required: boolean;
    payment_amount?: number;
    payment_method?: PaymentMethod;
    payment_status?: PaymentStatus;
    invoice_id?: string;
    booking_id?: string; // Created booking ID after approval
    requested_at: Date;
    ip_address?: string;
}

export type AdminActionType =
    | 'approve_access'
    | 'deny_access'
    | 'approve_booking'
    | 'deny_booking'
    | 'cancel_booking'
    | 'suspend_member'
    | 'reactivate_member'
    | 'update_settings';

export type AdminActionTarget = 'access_request' | 'booking_request' | 'member' | 'settings';

export interface AdminAction {
    id: string;
    admin_user_id: string;
    admin_name: string;
    action_type: AdminActionType;
    target_id: string;
    target_type: AdminActionTarget;
    target_name?: string;
    details?: string;
    notes?: string;
    timestamp: Date;
    ip_address?: string;
}

// User role for organization access control
export interface UserOrgRole {
    organization_id: string;
    role: 'org_admin' | 'member';
    status: MemberStatus;
    member_id: string;
}

export interface UserRoles {
    id: string; // Same as user.uid
    is_super_admin: boolean;
    organization_roles: Record<string, UserOrgRole>;
    created_at: Date;
    updated_at: Date;
}
