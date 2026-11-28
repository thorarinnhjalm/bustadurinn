import type { Dispatch, SetStateAction } from 'react';
import type { House, User, ContactSubmission, Feedback, ServiceProvider, Organization } from '@/types/models';

export interface EmailTemplate {
    id: string; // 'welcome', 'inactive_engagement'
    subject: string;
    html_content: string;
    active: boolean;
    variables: string[];
    description: string;
}

export interface NewsletterSubscriber {
    id: string;
    email: string;
    created_at: Date;
    source?: string;
    status: string;
}

export interface Stats {
    totalHouses: number;
    totalUsers: number;
    totalBookings: number;
    totalSubscribers: number;
    totalProviders: number;
    totalOrganizations: number; // NEW
    activeTasks: number;
    allHouses: House[];
    allUsers: User[];
    allBookings: any[]; // Booking data for BI dashboard
    allContacts: ContactSubmission[];
    allSubscribers: NewsletterSubscriber[];
    allFeedback: Feedback[];
    allProviders: ServiceProvider[];
    allOrganizations: Organization[];
    sandboxVisits: number;
}

export type TopTab = 'overview' | 'data' | 'communications' | 'analytics' | 'system';
export type DataSubTab = 'houses' | 'users' | 'organizations' | 'providers';
export type CommunicationsSubTab = 'contacts' | 'emails' | 'newsletter' | 'feedback';
export type AnalyticsSubTab = 'bi' | 'analytics';
export type SystemSubTab = 'audit' | 'integrations';

export type SetStats = Dispatch<SetStateAction<Stats>>;
export type SetActionLoading = Dispatch<SetStateAction<string | null>>;

/** Per-row actions on users, shared by the Data > Users sub-tab and the System > Audit panels. */
export interface UserActions {
    handleImpersonate: (user: User) => Promise<void>;
    handleDeleteUser: (user: User) => Promise<void>;
    handleSendRecoveryEmail: (user: User) => Promise<void>;
}

/** Props shared by the two System > Audit panels. */
export interface AuditPanelProps {
    audit: AuditState;
    userActions: UserActions;
    actionLoading: string | null;
    handleRepairOrphan: (uid: string) => Promise<void>;
    exportOrphansCSV: () => void;
}

/** Result of the /api/admin-audit-users scan, plus the setters the user actions need. */
export interface AuditState {
    orphans: any[];
    stuckUsers: any[];
    testUsers: any[];
    auditLoading: boolean;
    setOrphans: Dispatch<SetStateAction<any[]>>;
    setStuckUsers: Dispatch<SetStateAction<any[]>>;
    fetchOrphans: () => Promise<void>;
}
