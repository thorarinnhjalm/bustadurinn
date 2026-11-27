/**
 * Super Admin Mission Control - Professional Dashboard
 * Desktop-first, high-density data tables, real impersonation
 */

import { Fragment, useId, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Home, Users, BarChart2, Mail, FileSearch, Settings, Send,
    Database, LogOut, Trash2, CheckCircle, AlertTriangle,
    XCircle, RefreshCw, Loader2, Shield, Activity, Reply, Star,
    Edit, MapPin, UserCog, Zap, Building2, Eye, ChevronDown, ChevronRight
} from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, collectionGroup, getCountFromServer, getDocs, getDoc, deleteDoc, deleteField, writeBatch, doc, updateDoc, setDoc, query, where, limit } from 'firebase/firestore';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useAppStore } from '@/store/appStore';
import { seedDemoData } from '@/utils/seedDemoData';
import { updateUserNameInAllCollections } from '@/services/userService';
import { searchHMSAddresses, formatHMSAddress } from '@/utils/hmsSearch';
import AdminLayout from '@/components/AdminLayout';
import DataTable from '@/components/DataTable';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import BusinessIntelligenceDashboard from '@/components/analytics/BusinessIntelligenceDashboard';
import FunnelTimeline from '@/components/analytics/FunnelTimeline';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';
import Modal from '@/components/ui/Modal';
import { feedbackService } from '@/services/feedbackService';
import { getAllOrganizations } from '@/services/organizationService';

import type { House, User, ContactSubmission, Feedback, ServiceProvider, Organization } from '@/types/models';

interface EmailTemplate {
    id: string; // 'welcome', 'inactive_engagement'
    subject: string;
    html_content: string;
    active: boolean;
    variables: string[];
    description: string;
}

interface NewsletterSubscriber {
    id: string;
    email: string;
    created_at: Date;
    source?: string;
    status: string;
}

interface Stats {
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

const CACHE_TTL = 5 * 60 * 1000;
let statsCache: { data: Stats; timestamp: number } | null = null;

export default function SuperAdminPage() {
    const navigate = useNavigate();
    const fieldBaseId = useId();
    const tplSubjectId = `${fieldBaseId}-tpl-subject`;
    const tplHtmlId = `${fieldBaseId}-tpl-html`;
    const houseNameId = `${fieldBaseId}-house-name`;
    const houseAddressId = `${fieldBaseId}-house-address`;
    const houseManagerId = `${fieldBaseId}-house-manager`;
    const replyTextId = `${fieldBaseId}-reply-text`;
    const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'communications' | 'analytics' | 'system'>('overview');

    // Sub-tab states for consolidated tabs
    const [dataSubTab, setDataSubTab] = useState<'houses' | 'users' | 'organizations' | 'providers'>('houses');
    const [communicationsSubTab, setCommunicationsSubTab] = useState<'contacts' | 'emails' | 'newsletter' | 'feedback'>('contacts');
    const [analyticsSubTab, setAnalyticsSubTab] = useState<'bi' | 'analytics'>('bi');
    const [systemSubTab, setSystemSubTab] = useState<'audit' | 'integrations'>('audit');

    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [editingHouse, setEditingHouse] = useState<House | null>(null);
    const [replyingTo, setReplyingTo] = useState<ContactSubmission | null>(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchWarnings, setFetchWarnings] = useState<string[]>([]);
    const [expandedSignupUid, setExpandedSignupUid] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { startImpersonation } = useImpersonation();
    const currentUser = useAppStore((state) => state.currentUser);
    const userHouses = useAppStore((state) => state.userHouses);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);

    const handleHouseSwitch = (house: House) => {
        setCurrentHouse(house);
        navigate('/dashboard');
    };

    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [addressSearchTimer, setAddressSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    // Audit State
    const [orphans, setOrphans] = useState<any[]>([]);
    const [stuckUsers, setStuckUsers] = useState<any[]>([]);
    const [testUsers, setTestUsers] = useState<any[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);


    const [stats, setStats] = useState<Stats>({
        totalHouses: 0,
        totalUsers: 0,
        totalBookings: 0,
        totalSubscribers: 0,
        totalProviders: 0,
        totalOrganizations: 0,
        activeTasks: 0,
        sandboxVisits: 0,
        allHouses: [],
        allUsers: [],
        allBookings: [],
        allContacts: [],
        allSubscribers: [],
        allFeedback: [],
        allProviders: [],
        allOrganizations: [],
    });

    // Email Templates Logic - Define BEFORE useEffect
    const fetchTemplates = async () => {
        try {
            const snap = await getDocs(collection(db, 'email_templates'));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as EmailTemplate[];
            setTemplates(list);
        } catch (e) {
            logger.error('Fetch templates error:', e);
        }
    };

    const fetchStats = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
            setStats(statsCache.data);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setFetchWarnings([]);

            const warnings: string[] = [];

            const safeFetch = async (collName: string, maxDocs = 2000) => {
                try {
                    const snap = await getDocs(query(collection(db, collName), limit(maxDocs)));
                    return snap;
                } catch (e: any) {
                    logger.error(`Error fetching ${collName}:`, e);
                    warnings.push(`Gat ekki sótt gögn fyrir "${collName}"`);
                    return null;
                }
            };

            // Bookings and tasks live in houses/{id}/bookings|tasks, so they are read with
            // collection-group queries (super-admin-only rules).
            const safeFetchGroup = async (groupName: string, maxDocs: number) => {
                try {
                    return await getDocs(query(collectionGroup(db, groupName), limit(maxDocs)));
                } catch (e: any) {
                    logger.error(`Error fetching collection group ${groupName}:`, e);
                    warnings.push(`Gat ekki sótt gögn fyrir "${groupName}"`);
                    return null;
                }
            };
            const bookingsCount = getCountFromServer(collectionGroup(db, 'bookings'))
                .then((c) => c.data().count)
                .catch((e) => {
                    logger.error('Error counting bookings:', e);
                    warnings.push('Gat ekki talið bókanir');
                    return null;
                });

            const [housesSnap, usersSnap, bookingsSnap, tasksSnap, contactsSnap, subSnap, feedbackSnap, providersSnap, providerContactsSnap, organizationsData, sandboxVisitsSnap] = await Promise.all([
                safeFetch('houses'),
                safeFetch('users'),
                safeFetchGroup('bookings', 500),
                safeFetchGroup('tasks', 2000),
                safeFetch('contact_submissions', 500),
                safeFetch('newsletter_subscribers', 2000),
                safeFetch('feedback', 500),
                safeFetch('service_providers', 500),
                safeFetch('service_provider_contacts', 500),
                getAllOrganizations().catch((e) => {
                    logger.error('Error fetching organizations:', e);
                    warnings.push('Gat ekki sótt gögn fyrir "organizations"');
                    return [];
                }),
                getDocs(query(collection(db, 'funnel_events'), where('event_name', '==', 'sandbox_visited'), limit(1000))).catch((e) => {
                    logger.error('Error fetching funnel_events:', e);
                    warnings.push('Gat ekki sótt funnel_events');
                    return null;
                })
            ]);
            const totalBookingsCount = await bookingsCount;

            const users = usersSnap?.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)) || [];
            const activeTasks = tasksSnap?.docs.filter(doc => doc.data().status !== 'completed').length || 0;
            const houses = housesSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() } as House)) || [];
            const contacts = contactsSnap?.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                created_at: doc.data().created_at?.toDate() || new Date()
            } as ContactSubmission)) || [];
            const subscribers = subSnap?.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                created_at: (doc.data().created_at as any)?.toDate() || new Date()
            } as NewsletterSubscriber)) || [];
            const feedback = feedbackSnap?.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: (doc.data().createdAt as any)?.toDate() || new Date()
            } as Feedback)) || [];
            const bookings = bookingsSnap?.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                start: doc.data().start?.toDate(),
                end: doc.data().end?.toDate(),
                created_at: doc.data().created_at?.toDate()
            })) || [];

            const newStats: Stats = {
                totalHouses: houses.length,
                totalUsers: users.length,
                totalBookings: totalBookingsCount ?? bookingsSnap?.size ?? 0,
                totalSubscribers: subSnap?.size || 0,
                totalProviders: providersSnap?.size || 0,
                totalOrganizations: organizationsData.length || 0,
                sandboxVisits: sandboxVisitsSnap?.size || 0,
                activeTasks,
                allHouses: houses,
                allUsers: users,
                allBookings: bookings,
                allContacts: contacts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
                allSubscribers: subscribers.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
                allFeedback: feedback.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
                // Contact fields come from service_provider_contacts; legacy fields on the provider doc are the fallback.
                allProviders: providersSnap?.docs.map(doc => {
                    const c = providerContactsSnap?.docs.find(x => x.id === doc.id)?.data();
                    return {
                        id: doc.id,
                        ...doc.data(),
                        ...(c ? { contact_email: c.contact_email, contact_phone: c.contact_phone, address: c.address } : {})
                    } as ServiceProvider;
                }) || [],
                allOrganizations: organizationsData || [],
            };
            statsCache = { data: newStats, timestamp: Date.now() };
            setStats(newStats);

            if (warnings.length > 0) setFetchWarnings(warnings);
            if (!housesSnap && !usersSnap && warnings.length > 0) {
                logger.warn('Critical core collections failed to load.');
            }
        } catch (error: any) {
            logger.error('Global fetch stats error:', error);
            setError('Ekki tókst að sækja gögn. Reyndu aftur.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        logger.info('SuperAdmin Version: 1.2.0 - Email Service Active');
        fetchStats();
    }, [fetchStats]);

    // Fetch email templates when emails tab is active
    useEffect(() => {
        if (activeTab === 'communications' && communicationsSubTab === 'emails') {
            fetchTemplates();
        }
    }, [activeTab, communicationsSubTab]);

    // Seed demo data
    const handleSeedDemo = async () => {
        if (!confirm('Create demo house with 3 users, bookings, tasks, and finance data?')) {
            return;
        }

        setSeeding(true);
        try {
            const result = await seedDemoData();
            alert(`✅ Demo data created!\n\nHouse: Sumarbústaður við Þingvallavatn\n\nDemo Users:\n${result.users.map(u => `• ${u.name} (${u.email})`).join('\n')}\n\nPassword: Demo123!`);
            // Refresh data instead of reloading page
            window.location.reload();
        } catch (error: any) {
            logger.error('Seed demo error:', error);
            alert(`❌ Villa: ${getUserMessage(error)}`);
        } finally {
            setSeeding(false);
        }
    };

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'danger' | 'info' | 'success';
        onConfirm: () => void;
    } | null>(null);

    const handleDeleteHouse = async (houseId: string) => {
        const house = stats.allHouses.find(h => h.id === houseId);
        if (!house) return;

        const confirmText = `EYÐA "${house.name}"?\n\nÞETTA EYÐIR:\n- Húsinu\n- Öllum bókunum, verkefnum, fjármálum og innkaupalistanum\n- Gestatenglum, boðum, gestabók og tilkynningum\n- Húsinu af notendum\n\nÞetta er ÓAFTURKRÆFT!\n\nSkrifaðu nafn hússins til að sta staðfesta:`;
        const userInput = prompt(confirmText);

        if (userInput !== house.name) {
            alert('Hætt við - nafnið passaði ekki');
            return;
        }

        setActionLoading(houseId);
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error('Not authenticated');

            const res = await fetch('/api/admin-delete-house', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ houseId })
            });
            if (!res.ok) throw new Error(`Delete house failed (${res.status})`);
            const result = await res.json().catch(() => ({}));

            // Update local state
            setStats(prev => ({
                ...prev,
                totalHouses: prev.totalHouses - 1,
                allHouses: prev.allHouses.filter(h => h.id !== houseId)
            }));
            statsCache = null;

            alert(`✅ Húsinu og tengdum gögnum var eytt (bókanir, verkefni, fjármál, innkaupalisti, gestatenglar, boð o.fl.).${result?.note ? `\n\n${result.note}` : ''}`);
        } catch (error: any) {
            logger.error('Error deleting house:', error);
            alert('❌ Ekki tókst að eyða húsinu. Sumum gögnum gæti hafa verið eytt að hluta. Athugaðu stöðuna og reyndu aftur.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateHouse = async (houseData: House) => {
        if (!houseData.id) return;
        setActionLoading('updating-house');
        try {
            await updateDoc(doc(db, 'houses', houseData.id), {
                name: houseData.name,
                address: houseData.address,
                location: houseData.location || { lat: 0, lng: 0 },
                manager_id: houseData.manager_id
            });
            setStats(prev => ({
                ...prev,
                allHouses: prev.allHouses.map(h => h.id === houseData.id ? houseData : h)
            }));
            setEditingHouse(null);
            alert('Hús uppfært!');
        } catch (e: any) {
            logger.error('Error updating house:', e);
            alert('Villa við að uppfæra hús. Reyndu aftur.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleAddressChange = (val: string) => {
        if (!editingHouse) return;
        setEditingHouse({ ...editingHouse, address: val });

        if (addressSearchTimer) clearTimeout(addressSearchTimer);

        if (val.length < 2) {
            setAddressSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const results = await searchHMSAddresses(val);
                setAddressSuggestions(results);
            } catch (e) {
                logger.error(e);
            }
        }, 300);
        setAddressSearchTimer(timer);
    };

    const selectCMSAddress = (hmsItem: any) => {
        if (!editingHouse) return;
        const fullAddr = formatHMSAddress(hmsItem);
        setEditingHouse({
            ...editingHouse,
            address: fullAddr,
            location: {
                lat: hmsItem.lat,
                lng: hmsItem.lng
            }
        });
        setAddressSuggestions([]);
    };

    const handleSeedTemplates = async () => {
        if (!confirm('Create default templates?')) return;
        setLoading(true);
        try {
            const welcomeTpl: EmailTemplate = {
                id: 'welcome',
                subject: 'Velkomin í Bústaðurinn.is! 🏠',
                active: true, // Default to true or false as per user preference
                description: 'Sent when a user creates their first house.',
                variables: ['name'],
                html_content: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917;">
    <div style="background-color: #f5f5f4; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #d97706; margin: 0; font-family: serif;">Bústaðurinn.is</h1>
    </div>
    
    <div style="padding: 32px; border: 1px solid #e7e5e4; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin-top: 0; color: #1c1917;">Velkomin/n, {name}! 👋</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #44403c;">
            Gaman að sjá þig. Aðgangurinn þinn hefur verið stofnaður.
        </p>

        <div style="text-align: center; margin: 32px 0;">
            <a href="https://www.bustadurinn.is/dashboard" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Fara á stjórnborð
            </a>
        </div>
        
        <p style="font-size: 14px; color: #78716c; text-align: center;">
            Ef þú hefur einhverjar spurningar, ekki hika við að svara þessum pósti.
        </p>
    </div>
</div>`
            };

            await setDoc(doc(db, 'email_templates', 'welcome'), welcomeTpl);

            const finishSetupTpl: EmailTemplate = {
                id: 'finish_setup',
                subject: 'Kláraðu uppsetninguna á Bústaðurinn.is 🏡',
                active: true,
                description: 'Recovery email for orphaned users who have not created a house.',
                variables: ['name'],
                html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f0; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { font-size: 32px; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
        .button { display: inline-block; background: #e8b058; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; text-align: center; width: 100%; box-sizing: border-box; }
        .footer { background: #f5f5f0; padding: 30px; text-align: center; font-size: 13px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><div class="logo">🏡</div><h1>Eitt skref í viðbót...</h1></div>
        <div class="content">
            <p class="greeting">Hæ {name},</p>
            <p>Við tókum eftir því að þú byrjaðir að skrá þig en kláraðir ekki að stofna húsið þitt.</p>
            <p>Engar áhyggjur, aðgangurinn þinn er tilbúinn. Þú þarft bara að skrá inn upplýsingar um bústaðinn til að byrja.</p>
            <a href="https://bustadurinn.is/onboarding" class="button">Klára uppsetningu</a>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">Ef þú lendir í vandræðum, svaraðu þessum pósti og við hjálpum þér.</p>
        </div>
        <div class="footer"><p><strong>Bústaðurinn.is</strong></p></div>
    </div>
</body>
</html>`
            };
            await setDoc(doc(db, 'email_templates', 'finish_setup'), finishSetupTpl);

            await fetchTemplates();
            alert('Sniðmát búin til!');
        } catch (e) {
            logger.error(e);
            alert('Villa við gerð sniðmáta');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = async (tpl: EmailTemplate) => {
        setActionLoading('saving-template');
        try {
            await setDoc(doc(db, 'email_templates', tpl.id), tpl);
            setTemplates(prev => prev.map(t => t.id === tpl.id ? tpl : t));
            setEditingTemplate(null);
        } catch (e: any) {
            logger.error('Error saving template:', e);
            alert('Villa við vistun: ' + getUserMessage(e));
        } finally {
            setActionLoading(null);
        }
    };

    const handleSendTestEmail = async (tpl: EmailTemplate) => {
        if (!currentUser?.email) return;

        const confirmSend = confirm(`Senda prufupóst ("${tpl.subject}") á ${currentUser.email}?`);
        if (!confirmSend) return;

        setActionLoading(`test-email-${tpl.id}`);
        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
                },
                body: JSON.stringify({
                    templateId: tpl.id,
                    to: currentUser.email,
                    variables: {
                        name: currentUser.name || 'Prófunarnotandi',
                        houseName: 'Sýnishornsbústaður',
                        inviteLink: 'https://www.bustadurinn.is/join?test=1',
                        expiryDate: '15. janúar 2025'
                    }
                })
            });

            const data = await res.text();
            let parsedData: any = {};
            try {
                parsedData = JSON.parse(data);
            } catch {
                // Not JSON
            }

            if (res.ok) {
                alert(`✅ Prufupóstur sendur! Athugaðu inboxið þitt (${currentUser.email}).\n\nResend ID: ${parsedData.data?.id || 'N/A'}`);
            } else {
                const errorMsg = parsedData.error || data || res.statusText;
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            logger.error('Test email error:', error);
            alert(`❌ Villa: ${getUserMessage(error)}`);
        } finally {
            setActionLoading(null);
        }
    };

    // Impersonate user
    const handleImpersonate = async (user: User) => {
        if (!confirm(`View as ${user.name}?\n\nYou'll see exactly what they see. Click "Exit God Mode" to return.`)) {
            return;
        }

        try {
            setActionLoading(`impersonate-${user.uid}`);

            // Fetch the impersonated user's house DIRECTLY (not all houses)
            let userHouse = null;
            if (user.house_ids && user.house_ids.length > 0) {
                const houseId = user.house_ids[0];

                try {
                    const houseDocRef = doc(db, 'houses', houseId);
                    const houseSnap = await getDoc(houseDocRef);

                    if (houseSnap.exists()) {
                        userHouse = { id: houseSnap.id, ...houseSnap.data() } as House;
                        logger.debug('Loaded user house:', userHouse.name);
                    } else {
                        logger.warn('House not found:', houseId);
                    }
                } catch (fetchError) {
                    logger.error('Error fetching user house:', fetchError);
                    // Continue anyway - user might not have a house
                }
            }

            // Set impersonation context FIRST
            startImpersonation(user);
            logger.info('Impersonation context set for:', user.name);

            // Then update store with their house
            if (userHouse) {
                useAppStore.getState().setCurrentHouse(userHouse);
                useAppStore.getState().setUserHouses([userHouse]);
                logger.debug('Store updated with user house');
            } else {
                // Clear house if they don't have one
                useAppStore.getState().setCurrentHouse(null);
                useAppStore.getState().setUserHouses([]);
                logger.debug('User has no house - cleared store');
            }

            // Save return URL
            localStorage.setItem('admin_return_url', window.location.pathname);

            // Small delay to ensure store updates are processed
            await new Promise(resolve => setTimeout(resolve, 200));

            logger.info('Navigating to dashboard as', user.name);

            // Navigate to their dashboard
            navigate('/dashboard');
        } catch (error: any) {
            logger.error('Impersonation error:', error);
            alert('Ekki tókst að setja þig í spor notandans: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (user: User) => {
        const confirmText = `EYÐA NOTANDA "${user.name}" (${user.email})?\n\nÞetta eyðir aðganginum varanlega úr Auth og gagnagrunni.\n\nSkrifaðu "DELETE" til að staðfesta:`;
        if (prompt(confirmText) !== 'DELETE') return;

        setActionLoading(`delete-user-${user.uid}`);
        try {
            // Get Firebase auth token for API authentication
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const res = await fetch('/api/admin-delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`  // 🔒 Auth token required
                },
                body: JSON.stringify({ uid: user.uid })
            });

            if (!res.ok) {
                const text = await res.text();
                let errorMessage = 'Failed to delete user';
                try {
                    const data = JSON.parse(text);
                    errorMessage = data.error || data.message || errorMessage;
                    if (data.details) errorMessage += `\n\nDetails: ${data.details}`;
                } catch {
                    // Not JSON, use raw text (might be Vercel crash page)
                    errorMessage = `Server Error (${res.status}): ${text.slice(0, 200)}`;
                }
                throw new Error(errorMessage);
            }

            setStats(prev => ({
                ...prev,
                totalUsers: prev.totalUsers - 1,
                allUsers: prev.allUsers.filter(u => u.uid !== user.uid)
            }));

            // Also update audit lists if they exist
            setOrphans(prev => prev.filter(o => o.uid !== user.uid));
            setStuckUsers(prev => prev.filter(s => s.uid !== user.uid));

            alert('✅ Notanda eytt!');
        } catch (error: any) {
            logger.error('Error deleting user:', error);
            alert(`❌ Villa: ${getUserMessage(error)}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSyncName = async (user: User) => {
        if (!confirm(`Force update name "${user.name}" across all system records (tasks, logs, bookings etc)?`)) return;

        setActionLoading(`sync-name-${user.uid}`);
        try {
            await updateUserNameInAllCollections(user.uid, user.name, user.house_ids || []);
            alert('✅ Nafn notanda samstillt í öllum söfnum.');
        } catch (error: any) {
            logger.error('Error syncing name:', error);
            alert(`❌ Villa: ${getUserMessage(error)}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSendReply = async () => {
        if (!replyingTo || !replyText.trim()) return;

        setActionLoading('sending-reply');
        try {
            // 1. Send Email (using direct html injection for flexible arbitrary replies)
            // Note: In production you might want a proper template or 'send-email' endpoint that accepts 'html' or 'text' body directly.
            // Assuming /api/send-email handles a 'html' property if provided, or we use a generic 'reply_template'.
            // For now, let's assume valid implementation or generic handling.

            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error('Not authenticated');

            const res = await fetch('/api/admin-send-reply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    to: replyingTo.email,
                    subject: `Sv: Erindi frá Bústaðurinn.is`,
                    text: replyText,
                    submissionId: replyingTo.id
                })
            });

            if (!res.ok) throw new Error(`Send reply failed (${res.status})`);

            // 2. Update Firestore
            const reply = {
                body: replyText,
                from_email: 'support@bustadurinn.is',
                created_at: new Date(),
                is_admin_reply: true,
                admin_id: currentUser?.uid
            };

            const docRef = doc(db, 'contact_submissions', replyingTo.id);
            // We need to use arrayUnion or simply read-modify-write. Since we have 'replyingTo' from state which might be stale if we don't be careful, but generally okay here.
            // Actually, we should just push to the array in memory and write the whole array or use arrayUnion.
            // Let's use standard update for now.

            // Note: Firestore doesn't accept custom objects in arrayUnion easily without conversion if they have Date objects.
            // We'll simplisticly just set the status and rely on local update, or fetch fresh.
            // Better: update 'replies' field.

            // For simplicity in this step, let's assume we update the whole object or just status + replies.
            // Since we need to persist the 'reply' object which has a JS Date, we need to convert it for Firestore if using raw SDK, 
            // but the SDK usually handles Date objects in top level fields. Inside arrays it can be tricky.
            // We will just update status for now and assume the API might handle the log or we do it here.

            await updateDoc(docRef, {
                status: 'replied',
                // For simplicity, we won't push to 'replies' array in Firestore in this specific call to avoid complex array logic without checking current DB state accurately. 
                // BUT the requirements said "Implement conversation threading". 
                // So I MUST persist it.
                // standard way: 
                replies: [...(replyingTo.replies || []), reply]
            });

            // 3. Update Local State
            setStats(prev => ({
                ...prev,
                allContacts: prev.allContacts.map(c =>
                    c.id === replyingTo.id
                        ? { ...c, status: 'replied' as const, replies: [...(c.replies || []), reply] }
                        : c
                )
            }));

            setReplyingTo(null);
            setReplyText('');
            alert('✅ Svar sent!');

        } catch (error: any) {
            logger.error('Reply error:', error);
            alert('Mistókst að senda svar. Pósturinn var ekki sendur eða svarið vistaðist ekki. Reyndu aftur.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSendRecoveryEmail = async (user: User) => {
        if (!confirm(`Senda 'Finish Setup' póst á ${user.email}?`)) return;
        setActionLoading(`recovery-${user.uid}`);
        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
                },
                body: JSON.stringify({
                    templateId: 'finish_setup',
                    to: user.email,
                    variables: {
                        name: user.name || 'Vinur',
                    }
                })
            });
            if (!res.ok) throw new Error(`send-email failed (${res.status})`);
            alert('Póstur sendur!');
        } catch (error) {
            logger.error(error);
            alert('Mistókst að senda póst.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkRecoveryEmails = async () => {
        const count = stuckUsers.length;
        if (count === 0) return;
        if (!confirm(`Viltu senda recovery tölvupóst á ALLA ${count} notendur sem vantar hús?`)) return;

        setActionLoading('bulk-recovery');
        let successCount = 0;
        let failCount = 0;

        for (const user of stuckUsers) {
            try {
                const res = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
                    },
                    body: JSON.stringify({
                        templateId: 'finish_setup',
                        to: user.email,
                        variables: {
                            name: user.name || 'Vinur',
                        }
                    })
                });
                if (!res.ok) throw new Error(`send-email failed (${res.status})`);
                successCount++;
            } catch (error) {
                logger.error(`Failed to send to ${user.email}:`, error);
                failCount++;
            }
        }

        setActionLoading(null);
        alert(`Lokið! Sendi á ${successCount} notendur. ${failCount > 0 ? `${failCount} mistókust.` : ''}`);
    };

    const handleToggleFeatured = async (feedback: Feedback) => {
        setActionLoading(`feature-${feedback.id}`);
        try {
            await feedbackService.toggleFeatured(feedback.id, !feedback.featured);
            setStats(prev => ({
                ...prev,
                allFeedback: prev.allFeedback.map(f => f.id === feedback.id ? { ...f, featured: !f.featured } : f)
            }));
        } catch (error: any) {
            logger.error('Error toggling featured status:', error);
            alert('Villa: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    const handleSyncFeaturedFeedback = async () => {
        setActionLoading('sync-featured');
        try {
            const { created, removed } = await feedbackService.syncFeaturedCopies();
            alert(`Lokið! ${created} birtar umsagnir samstilltar, ${removed} fjarlægðar.`);
        } catch (error: any) {
            logger.error('Error syncing featured feedback:', error);
            alert('Villa: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    // One-off: move contact fields from service_providers docs to service_provider_contacts.
    const handleMigrateProviderContacts = async () => {
        if (!confirm('Færa tengiliðaupplýsingar verktaka í sér safn og fjarlægja þær af opinberu skránni?')) return;
        setActionLoading('migrate-provider-contacts');
        try {
            const snap = await getDocs(collection(db, 'service_providers'));
            const legacy = snap.docs.filter(d => {
                const x = d.data();
                return x.contact_email !== undefined || x.contact_phone !== undefined || x.address !== undefined;
            });
            for (let i = 0; i < legacy.length; i += 200) {
                const batch = writeBatch(db);
                legacy.slice(i, i + 200).forEach(d => {
                    const x = d.data();
                    batch.set(doc(db, 'service_provider_contacts', d.id), {
                        contact_email: x.contact_email ?? '',
                        contact_phone: x.contact_phone ?? '',
                        address: x.address ?? '',
                        owner_uid: x.owner_uid ?? null
                    });
                    batch.update(d.ref, {
                        contact_email: deleteField(),
                        contact_phone: deleteField(),
                        address: deleteField()
                    });
                });
                await batch.commit();
            }
            alert(`Lokið! ${legacy.length} verktakar fluttir.`);
        } catch (error: any) {
            logger.error('Error migrating provider contacts:', error);
            alert('Villa: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteFeedback = async (id: string) => {
        if (!confirm('Ertu viss um að þú viljir eyða þessari umsögn?')) return;
        setActionLoading(`delete-feedback-${id}`);
        try {
            await feedbackService.deleteFeedback(id);
            setStats(prev => ({
                ...prev,
                allFeedback: prev.allFeedback.filter(f => f.id !== id)
            }));
        } catch (error: any) {
            logger.error('Error deleting feedback:', error);
            alert('Villa: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    // Provider Logic
    const handleToggleProviderStatus = async (provider: ServiceProvider) => {
        const newStatus = provider.status === 'active' ? 'pending' : 'active';
        if (!confirm(`Breyta stöðu ${provider.name} í "${newStatus}"?`)) return;

        setActionLoading(`provider-${provider.id}`);
        try {
            await updateDoc(doc(db, 'service_providers', provider.id), {
                status: newStatus
            });

            setStats(prev => ({
                ...prev,
                allProviders: prev.allProviders.map(p =>
                    p.id === provider.id ? { ...p, status: newStatus } : p
                )
            }));
            alert(`✅ Staða uppfærð: ${newStatus}`);
        } catch (error: any) {
            logger.error('Error updating provider:', error);
            alert('Villa: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteProvider = async (providerId: string) => {
        if (!confirm('Ertu viss um að þú viljir eyða þessum verktaka?')) return;
        setActionLoading(`delete-provider-${providerId}`);
        try {
            const delBatch = writeBatch(db);
            delBatch.delete(doc(db, 'service_providers', providerId));
            delBatch.delete(doc(db, 'service_provider_contacts', providerId));
            await delBatch.commit();
            setStats(prev => ({
                ...prev,
                allProviders: prev.allProviders.filter(p => p.id !== providerId)
            }));
            alert('✅ Verktaka eytt!');
        } catch (error: any) {
            logger.error('Error deleting provider:', error);
            alert('Villa: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    // Audit & Health Logic
    const fetchOrphans = async () => {
        setAuditLoading(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/admin-audit-users', {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            let data;
            try {
                data = await res.json();
            } catch {
                // If parsing fails (e.g. 404 HTML page), throw specific error
                throw new Error(`Server returned non-JSON response (${res.status}). Ensure API is deployed.`);
            }

            if (res.ok) {
                setOrphans(data.orphans || []);
                setStuckUsers(data.stuckUsers || []);
                setTestUsers(data.testUsers || []);
            } else {
                throw new Error(data.error || 'Failed to fetch orphans');
            }
        } catch (e: any) {
            logger.error('Audit error:', e);
            alert('Villa í úttekt: ' + getUserMessage(e));
        } finally {
            setAuditLoading(false);
        }
    };

    const handleRepairOrphan = async (uid: string) => {
        if (!confirm('Viltu búa til Firestore prófíl fyrir þennan notanda?')) return;

        setActionLoading(`repair-${uid}`);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/admin-repair-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ uid })
            });

            if (res.ok) {
                alert('✅ Notandi lagfærður!');
                setOrphans(prev => prev.filter(o => o.uid !== uid));
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Failed to repair');
            }
        } catch (e: any) {
            logger.error('Repair error:', e);
            alert('Villa við viðgerð: ' + getUserMessage(e));
        } finally {
            setActionLoading(null);
        }
    };

    const exportOrphansCSV = () => {
        if (orphans.length === 0) return;

        const headers = ['Created', 'Email', 'Name', 'isTest', 'UID'];
        const rows = orphans.map(o => [
            new Date(o.createdAt).toISOString(),
            o.email || '',
            o.displayName || '',
            o.isTest ? 'TRUE' : 'FALSE',
            o.uid
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `orphan_users_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        if (activeTab === 'system' && systemSubTab === 'audit') {
            fetchOrphans();
        }
    }, [activeTab, systemSubTab]);

    if (loading) {
        return (
            <AdminLayout
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as 'overview' | 'data' | 'communications' | 'analytics' | 'system')}
                onBackClick={() => navigate('/dashboard')}
                userHouses={userHouses}
                onHouseSelect={handleHouseSwitch}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center" role="status">
                        <div className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4" aria-hidden="true"></div>
                        <p className="text-stone-500 font-mono text-sm">Hleð kerfisgögnum...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <AdminLayout
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as 'overview' | 'data' | 'communications' | 'analytics' | 'system')}
                onBackClick={() => navigate('/dashboard')}
                userHouses={userHouses}
                onHouseSelect={handleHouseSwitch}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md" role="alert">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl" aria-hidden="true">⚠️</span>
                        </div>
                        <h2 className="text-xl font-serif font-bold text-charcoal mb-2">Ekki tókst að sækja gögn</h2>
                        <p className="text-stone-600 mb-4">{error}</p>
                        <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
                            Reyna aftur
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Empty state with Debug Info
    const isEmpty = stats.totalHouses === 0 && stats.totalUsers === 0;
    if (isEmpty) {
        return (
            <AdminLayout
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as 'overview' | 'data' | 'communications' | 'analytics' | 'system')}
                onBackClick={() => navigate('/dashboard')}
                userHouses={userHouses}
                onHouseSelect={handleHouseSwitch}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Database className="w-8 h-8 text-stone-400" aria-hidden="true" />
                        </div>
                        <h2 className="text-xl font-serif font-bold text-charcoal mb-2">Engin gögn fundust</h2>
                        <p className="text-stone-600 mb-6">Gagnagrunnurinn virðist tómur eða aðgangi var hafnað.</p>

                        <div className="bg-stone-50 p-4 rounded-lg mb-6 text-left text-xs font-mono text-stone-500 break-all border border-stone-200">
                            <p className="font-bold text-stone-700 mb-2">Villuleitarupplýsingar:</p>
                            <p>UID: {currentUser?.uid}</p>
                            <p>Netfang: {currentUser?.email}</p>
                            <p className="mt-2 text-amber-700">
                                Athugaðu að þetta UID sé í firestore.rules í fallinu "isSuperAdmin()".
                            </p>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                type="button"
                                onClick={handleSeedDemo}
                                disabled={seeding}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <Database className="w-4 h-4" aria-hidden="true" />
                                {seeding ? 'Bý til gögn...' : 'Búa til sýnigögn'}
                            </button>
                            <button
                                type="button"
                                onClick={() => fetchStats(true)}
                                className="px-4 py-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors font-medium text-stone-600"
                            >
                                Endurhlaða
                            </button>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as any)}
            onBackClick={() => navigate('/dashboard')}
            userHouses={userHouses}
            onHouseSelect={handleHouseSwitch}
        >
            {fetchWarnings.length > 0 && (
                <div className="bg-amber/10 border border-amber/30 text-amber-900 px-4 py-3 rounded-xl mb-6 relative shadow-sm" role="alert">
                    <strong className="font-bold flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600"/> Athugið: Sum gögn hlóðust ekki rétt</strong>
                    <ul className="list-disc ml-8 mt-2 text-sm space-y-1 text-amber-800">
                        {fetchWarnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                        ))}
                    </ul>
                    <p className="mt-3 text-xs text-amber-700 bg-amber/10 inline-block px-2 py-1 rounded-md">Aðgerðir eða greiningar gætu verið ófullkomnar. Athugaðu Firebase öryggisreglur (Firestore Rules).</p>
                    <button type="button" aria-label="Loka viðvörun" onClick={() => setFetchWarnings([])} className="absolute top-2 right-2 p-1.5 hover:bg-amber/20 rounded-lg transition-colors">
                        <XCircle size={20} className="text-amber-700" aria-hidden="true"/>
                    </button>
                </div>
            )}
            
            {/* Recent Signups / Drop-off Monitor */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 mb-8">
                <h3 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Nýskráningar (síðustu 24 klst)
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <caption className="sr-only">Nýskráningar síðustu 24 klukkustundir</caption>
                        <thead>
                            <tr className="border-b border-stone-100 text-grey-dark">
                                <th scope="col" className="pb-2">Tími</th>
                                <th scope="col" className="pb-2">Nafn / Netfang</th>
                                <th scope="col" className="pb-2">Staða</th>
                                <th scope="col" className="pb-2">Hús</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.allUsers
                                .filter(u => {
                                    const now = new Date();
                                    const created = u.created_at ? new Date((u.created_at as any).seconds * 1000) : new Date();
                                    return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
                                })
                                .sort((a, b) => {
                                    const dateA = a.created_at ? new Date((a.created_at as any).seconds * 1000) : new Date();
                                    const dateB = b.created_at ? new Date((b.created_at as any).seconds * 1000) : new Date();
                                    return dateB.getTime() - dateA.getTime();
                                })
                                .map(user => {
                                    const hasHouse = user.house_ids && user.house_ids.length > 0;
                                    const createdDate = user.created_at ? new Date((user.created_at as any).seconds * 1000) : new Date();
                                    const expanded = expandedSignupUid === user.uid;
                                    return (
                                        <Fragment key={user.uid}>
                                        <tr
                                            className="relative border-b border-stone-50 last:border-0 hover:bg-stone-50"
                                        >
                                            <td className="py-2 text-grey-mid">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedSignupUid(expanded ? null : user.uid)}
                                                    aria-expanded={expanded}
                                                    aria-label={`Sýna skref notanda ${user.name || user.email}`}
                                                    title="Smelltu til að sjá skrefin"
                                                    className="flex items-center gap-1 after:absolute after:inset-0 after:content-['']"
                                                >
                                                    {expanded ? <ChevronDown className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                                                    {createdDate.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' })}
                                                </button>
                                            </td>
                                            <td className="py-2 font-medium text-charcoal">
                                                <div>{user.name || 'Nafnlaust'}</div>
                                                <div className="text-xs text-grey-mid">{user.email}</div>
                                            </td>
                                            <td className="py-2">
                                                {hasHouse ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                                        Kláraði
                                                    </span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                                                        Festist?
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 text-grey-dark">
                                                {hasHouse ? `${user.house_ids?.length} hús` : '-'}
                                            </td>
                                        </tr>
                                        {expanded && (
                                            <tr className="border-b border-stone-100 bg-stone-50/50">
                                                <td colSpan={4} className="py-3 px-2">
                                                    <FunnelTimeline uid={user.uid} />
                                                </td>
                                            </tr>
                                        )}
                                        </Fragment>
                                    );
                                })}
                            {stats.allUsers.filter(u => {
                                const now = new Date();
                                const created = u.created_at ? new Date((u.created_at as any).seconds * 1000) : new Date();
                                return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
                            }).length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-grey-mid italic">
                                            Engar nýskráningar í dag
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Sticky Header & Navigation */}
            <div className="sticky top-0 z-50 flex flex-col bg-white/80 backdrop-blur-xl border-b border-stone-200/60 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
                    {/* Top Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 md:h-20 gap-4 md:gap-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br from-charcoal to-stone-800 text-white shadow-lg shadow-charcoal/20 transition-transform duration-500 motion-safe:hover:rotate-180`}>
                                    <Shield className={`w-5 h-5 md:w-6 md:h-6`} aria-hidden="true" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-charcoal to-stone-600">
                                        Super Admin
                                    </h1>
                                    <p className="text-[10px] md:text-xs text-stone-500 font-medium tracking-wide">
                                        v1.2.0 • <span className="text-green-600 flex-inline items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 motion-safe:animate-pulse inline-block" aria-hidden="true"></span>Online</span>
                                    </p>
                                </div>
                            </div>

                            {/* Mobile Actions */}
                            <div className="flex md:hidden gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.location.href = '/'}
                                    aria-label="Hætta"
                                    className="p-2 text-stone-500 hover:text-charcoal transition-colors"
                                >
                                    <LogOut className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleSeedDemo}
                                disabled={actionLoading === 'seed'}
                                className="flex items-center gap-2 px-4 py-2 bg-stone-100/50 hover:bg-stone-100 text-stone-600 rounded-lg text-sm font-medium transition-all motion-safe:hover:scale-105 motion-safe:active:scale-95"
                            >
                                <Database className={`w-4 h-4 ${actionLoading === 'seed' ? 'animate-spin' : ''}`} aria-hidden="true" />
                                <span className="font-bold">Seed Data</span>
                            </button>

                            <div className="h-8 w-px bg-stone-200 mx-2"></div>

                            <button
                                type="button"
                                onClick={() => window.location.href = '/'}
                                className="group flex items-center gap-2 px-4 py-2 text-stone-500 hover:text-red-600 transition-colors"
                            >
                                <span className="text-sm font-medium group-hover:underline decoration-red-600/30 underline-offset-4">Hætta</span>
                                <LogOut className="w-4 h-4 motion-safe:group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    {/* Streamlined 5-Tab Navigation */}
                    <div className="flex items-center gap-1 md:gap-2 pb-0 overflow-x-auto no-scrollbar" role="tablist" aria-label="Flipar stjórnborðs">
                        {[
                            { id: 'overview', icon: LayoutDashboard, label: 'Yfirlit' },
                            { id: 'data', icon: Database, label: 'Gögn' },
                            { id: 'communications', icon: Mail, label: 'Samskipti' },
                            { id: 'analytics', icon: BarChart2, label: 'Greining' },
                            { id: 'system', icon: Settings, label: 'Kerfi' }
                        ].map(tab => (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    relative flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300
                                    whitespace-nowrap rounded-t-lg select-none
                                    ${activeTab === tab.id
                                        ? 'text-charcoal'
                                        : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50/50'
                                    }
                                `}
                            >
                                <tab.icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110 text-amber-ink' : 'motion-safe:group-hover:scale-110'}`} aria-hidden="true" />
                                {tab.label}

                                {/* Active Indicator Line */}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber to-orange-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-8" role="tabpanel" aria-label={{ overview: 'Yfirlit', data: 'Gögn', communications: 'Samskipti', analytics: 'Greining', system: 'Kerfi' }[activeTab as string]}>
                {/* Analytics Tab - Consolidated */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* Sub-tab Navigation */}
                        <div className="flex gap-2 border-b border-stone-200">
                            <button
                                type="button"
                                aria-current={analyticsSubTab === 'bi' ? 'page' : undefined}
                                onClick={() => setAnalyticsSubTab('bi')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${analyticsSubTab === 'bi'
                                    ? 'text-charcoal border-b-2 border-amber'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    Business Intel
                                </div>
                            </button>
                            <button
                                type="button"
                                aria-current={analyticsSubTab === 'analytics' ? 'page' : undefined}
                                onClick={() => setAnalyticsSubTab('analytics')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${analyticsSubTab === 'analytics'
                                    ? 'text-charcoal border-b-2 border-amber'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4" />
                                    Greining
                                </div>
                            </button>
                        </div>

                        {/* Sub-tab Content */}
                        {analyticsSubTab === 'bi' && (
                            <BusinessIntelligenceDashboard
                                allHouses={stats.allHouses}
                                allUsers={stats.allUsers}
                                allBookings={stats.allBookings}
                                sandboxVisits={stats.sandboxVisits}
                            />
                        )}
                        {analyticsSubTab === 'analytics' && <AnalyticsDashboard />}
                    </div>
                )}

                {/* Data Tab - Consolidated */}
                {activeTab === 'data' && (
                    <div className="space-y-6">
                        {/* Sub-tab Navigation */}
                        <div className="flex gap-2 border-b border-stone-200 overflow-x-auto">
                            <button
                                type="button"
                                aria-current={dataSubTab === 'houses' ? 'page' : undefined}
                                onClick={() => setDataSubTab('houses')}
                                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${dataSubTab === 'houses'
                                    ? 'text-charcoal border-b-2 border-amber'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Home className="w-4 h-4" />
                                    Hús
                                </div>
                            </button>
                            <button
                                type="button"
                                aria-current={dataSubTab === 'users' ? 'page' : undefined}
                                onClick={() => setDataSubTab('users')}
                                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${dataSubTab === 'users'
                                    ? 'text-charcoal border-b-2 border-amber'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Notendur
                                </div>
                            </button>
                            <button
                                type="button"
                                aria-current={dataSubTab === 'organizations' ? 'page' : undefined}
                                onClick={() => setDataSubTab('organizations')}
                                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${dataSubTab === 'organizations'
                                    ? 'text-charcoal border-b-2 border-amber'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Félög
                                </div>
                            </button>
                            <button
                                type="button"
                                aria-current={dataSubTab === 'providers' ? 'page' : undefined}
                                onClick={() => setDataSubTab('providers')}
                                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${dataSubTab === 'providers'
                                    ? 'text-charcoal border-b-2 border-amber'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <UserCog className="w-4 h-4" />
                                    Verktakar
                                </div>
                            </button>
                        </div>

                        {/* Sub-tab Content - will be populated below by changing conditions */}
                    </div>
                )}

                {/* Communications Tab - Consolidated */}
                {activeTab === 'communications' && (
                    <div className="space-y-6">
                        {/* Sub-tab Navigation */}
                        <div className="flex gap-2 border-b border-stone-200 overflow-x-auto">
                            <button
                                type="button"
                                aria-current={communicationsSubTab === 'contacts' ? 'page' : undefined}
                                onClick={() => setCommunicationsSubTab('contacts')}
                                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${communicationsSubTab === 'contacts'
                                    ? 'text-charcoal border-b-2 border-amber'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Samskipti
                                </div>
                            </button>
                            <button
                                type="button"
                                aria-current={communicationsSubTab === 'emails' ? 'page' : undefined}
                                onClick={() => setCommunicationsSubTab('emails')}
                                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${communicationsSubTab === 'emails'
                                    ? 'text-charcoal border-b-2 border-amber'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Sniðmát
                                </div>
                            </button>
                            <button
                                type="button"
                                aria-current={communicationsSubTab === 'newsletter' ? 'page' : undefined}
                                onClick={() => setCommunicationsSubTab('newsletter')}
                                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${communicationsSubTab === 'newsletter'
                                    ? 'text-charcoal border-b-2 border-amber'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    Póstlisti
                                </div>
                            </button>
                            <button
                                type="button"
                                aria-current={communicationsSubTab === 'feedback' ? 'page' : undefined}
                                onClick={() => setCommunicationsSubTab('feedback')}
                                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${communicationsSubTab === 'feedback'
                                    ? 'text-charcoal border-b-2 border-amber'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4" />
                                    Umsagnir
                                </div>
                            </button>
                        </div>

                        {/* Sub-tab Content - will be populated below by changing conditions */}
                    </div>
                )}

                {/* System Tab - Consolidated */}
                {activeTab === 'system' && (
                    <div className="space-y-6">
                        {/* Sub-tab Navigation */}
                        <div className="flex gap-2 border-b border-stone-200 overflow-x-auto">
                            <button
                                type="button"
                                aria-current={systemSubTab === 'audit' ? 'page' : undefined}
                                onClick={() => setSystemSubTab('audit')}
                                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${systemSubTab === 'audit'
                                    ? 'text-charcoal border-b-2 border-amber'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileSearch className="w-4 h-4" />
                                    Audit
                                </div>
                            </button>
                        </div>

                        {/* Sub-tab Content - will be populated below by changing conditions */}
                    </div>
                )}

                {/* Audit Tab */}
                {activeTab === 'system' && systemSubTab === 'audit' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                            <h3 className="text-lg font-bold text-charcoal mb-2">Úttekt notenda</h3>
                            <p className="text-stone-500 mb-6">Athugar samræmi milli auðkenningar (Auth) og Firestore.</p>

                            {auditLoading ? (
                                <div className="text-center py-10" role="status">
                                    <div className="animate-spin w-8 h-8 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4" aria-hidden="true"></div>
                                    <p>Skanna gagnagrunn...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* ORPHANS */}
                                    <div className="border border-red-100 bg-red-50/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-red-700 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                Munaðarlausir notendur ({orphans.length})
                                            </h4>
                                            <button type="button" onClick={exportOrphansCSV} className="text-xs text-stone-500 underline px-2 py-1">Flytja út CSV</button>
                                        </div>
                                        <p className="text-sm text-stone-600 mb-4">
                                            Notendur sem eru til í auðkenningu en hafa <strong>engan Firestore-prófíl</strong>.
                                            Þetta þýðir yfirleitt að nýskráning hrundi eftir að aðgangur var stofnaður en áður en prófíll var búinn til.
                                        </p>

                                        <div className="max-h-60 overflow-y-auto bg-white rounded border border-red-100">
                                            {orphans.length === 0 ? (
                                                <div className="p-4 text-center text-stone-500 text-sm">Engir munaðarlausir notendur fundust. ✅</div>
                                            ) : (
                                                <table className="w-full text-left text-xs">
                                                    <caption className="sr-only">Munaðarlausir notendur</caption>
                                                    <thead className="bg-stone-50 sticky top-0">
                                                        <tr>
                                                            <th scope="col" className="p-2">Netfang</th>
                                                            <th scope="col" className="p-2">Stofnað</th>
                                                            <th scope="col" className="p-2">Aðgerð</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {orphans.map(u => (
                                                            <tr key={u.uid} className="border-b border-stone-100">
                                                                <td className="p-2 font-mono">{u.email}</td>
                                                                <td className="p-2 text-stone-500">{new Date(u.created).toLocaleDateString()}</td>
                                                                <td className="p-2">
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRepairOrphan(u.uid)}
                                                                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                                                                        >
                                                                            Laga
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteUser({ uid: u.uid, name: u.name || 'Unknown', email: u.email } as any)}
                                                                            className="px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                                                                        >
                                                                            Eyða
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>

                                    {/* STUCK USERS */}
                                    <div className="border border-orange-100 bg-orange-50/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-orange-700 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                Fastir notendur (án húss) ({stuckUsers.length})
                                            </h4>
                                        </div>
                                        <p className="text-sm text-stone-600 mb-4">
                                            Notendur sem eru með prófíl en <strong>ekkert hús tengt</strong>.
                                            Þeir hættu líklega við í skrefinu „Stofna hús“.
                                        </p>
                                        <div className="max-h-60 overflow-y-auto bg-white rounded border border-orange-100">
                                            {stuckUsers.length === 0 ? (
                                                <div className="p-4 text-center text-stone-500 text-sm">Engir fastir notendur fundust. ✅</div>
                                            ) : (
                                                <table className="w-full text-left text-xs">
                                                    <caption className="sr-only">Fastir notendur án húss</caption>
                                                    <thead className="bg-stone-50 sticky top-0">
                                                        <tr>
                                                            <th scope="col" className="p-2">Nafn / Netfang</th>
                                                            <th scope="col" className="p-2">Stofnað</th>
                                                            <th scope="col" className="p-2">Aðgerð</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {stuckUsers.map(u => (
                                                            <tr key={u.uid} className="border-b border-stone-100">
                                                                <td className="p-2">
                                                                    <div className="font-bold">{u.name}</div>
                                                                    <div className="text-[10px] font-mono text-stone-500">{u.email}</div>
                                                                </td>
                                                                <td className="p-2 text-stone-500">{new Date(u.created).toLocaleDateString()}</td>
                                                                <td className="p-2">
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteUser({ uid: u.uid, email: u.email, name: u.name || 'Prufuaðgangur' } as any)}
                                                                            className="text-red-600 hover:text-red-700 bg-red-50 p-1.5 rounded"
                                                                            aria-label={`Eyða notandaprófíl ${u.email}`}
                                                                            title="Eyða notandaprófíl"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* TEST USERS (PRUFUAÐGANGAR) */}
                                    <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold flex items-center gap-2 text-purple-900 m-0">
                                                <AlertTriangle className="w-4 h-4" />
                                                Prufuaðgangar ({testUsers.length})
                                            </h4>
                                        </div>
                                        <p className="text-sm text-purple-700 mb-4">
                                            Notendur sem hafa 'test', 'prufa', 'demo' eða '@example.com' í nafninu eða netfanginu. 
                                            Þessu ætti að eyða til að halda kerfinu hreinu.
                                        </p>
                                        <div className="max-h-60 overflow-y-auto bg-white rounded border border-purple-100">
                                            {testUsers.length === 0 ? (
                                                <div className="p-4 text-center text-purple-700 text-sm">Engir prufuaðgangar fundust. ✅</div>
                                            ) : (
                                                <table className="w-full text-left text-xs">
                                                    <caption className="sr-only">Prufuaðgangar</caption>
                                                    <thead className="bg-purple-50 sticky top-0">
                                                        <tr>
                                                            <th scope="col" className="p-2">Nafn / Netfang</th>
                                                            <th scope="col" className="p-2">Hús</th>
                                                            <th scope="col" className="p-2">Stofnað</th>
                                                            <th scope="col" className="p-2">Aðgerð</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {testUsers.map(u => (
                                                            <tr key={u.uid} className="border-b border-purple-100">
                                                                <td className="p-2">
                                                                    <div className="font-bold">{u.name}</div>
                                                                    <div className="text-[10px] font-mono text-purple-500">{u.email}</div>
                                                                </td>
                                                                <td className="p-2 text-stone-500">
                                                                    {u.houseIds && u.houseIds.length > 0 ? (
                                                                        <span className="text-red-600 font-bold">{u.houseIds.length} hús</span>
                                                                    ) : (
                                                                        "0"
                                                                    )}
                                                                </td>
                                                                <td className="p-2 text-stone-500">{new Date(u.created).toLocaleDateString()}</td>
                                                                <td className="p-2">
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleImpersonate(u as any)}
                                                                            className="px-2 py-1 bg-amber/10 text-amber-ink rounded hover:bg-amber hover:text-charcoal"
                                                                            title="Hefja uppsetningu fyrir notandann"
                                                                        >
                                                                            Setja sig í spor notanda
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleSendRecoveryEmail(u as any)}
                                                                            disabled={actionLoading === `recovery-${u.uid}`}
                                                                            className="px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                                                                            title="Senda tölvupóst um að klára uppsetningu"
                                                                        >
                                                                            Hafa samband
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && (() => {
                    // Activity Calculation
                    const unifiedActivity = [
                        ...stats.allHouses.map(h => {
                            const date = (h.created_at as any)?.toDate ? (h.created_at as any).toDate() : new Date(h.created_at || 0);
                            return { type: 'house', data: h, date };
                        }),
                        ...stats.allUsers.map(u => {
                            const date = (u.created_at as any)?.toDate ? (u.created_at as any).toDate() : new Date(u.created_at || 0);
                            return { type: 'user', data: u, date };
                        })
                    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

                    return (
                        <div className="space-y-6">
                            {/* Primary Metrics Grid - Mobile Optimized */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
                                {/* Total Houses */}
                                <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                                            <Home className="w-4 h-4 text-stone-500" />
                                        </div>
                                        <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Hús</p>
                                    </div>
                                    <p className="text-2xl md:text-4xl font-serif font-bold text-charcoal mb-1">{stats.totalHouses}</p>
                                    <p className="text-[10px] md:text-xs text-stone-500">Skráð hús</p>
                                </div>

                                {/* Total Users */}
                                <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-stone-500" />
                                        </div>
                                        <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Notendur</p>
                                    </div>
                                    <p className="text-2xl md:text-4xl font-serif font-bold text-charcoal mb-1">{stats.totalUsers}</p>
                                    <p className="text-[10px] md:text-xs text-stone-500">
                                        {stats.totalHouses > 0 ? (stats.totalUsers / stats.totalHouses).toFixed(1) : 0} að meðaltali
                                    </p>
                                </div>

                                {/* Newsletter Subscribers */}
                                <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Send className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Póstlisti</p>
                                    </div>
                                    <p className="text-2xl md:text-4xl font-serif font-bold text-charcoal mb-1">{stats.totalSubscribers}</p>
                                    <p className="text-[10px] md:text-xs text-stone-500">
                                        Væntanlegir viðskiptavinir
                                    </p>
                                </div>

                                {/* Total Providers */}
                                <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                                            <UserCog className="w-4 h-4 text-amber-ink" />
                                        </div>
                                        <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Verktakar</p>
                                    </div>
                                    <p className="text-2xl md:text-4xl font-serif font-bold text-charcoal mb-1">{stats.totalProviders}</p>
                                    <p className="text-[10px] md:text-xs text-stone-500">
                                        Skráðir þjónustuaðilar
                                    </p>
                                </div>

                                {/* Organizations */}
                                <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                            <Building2 className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Félög</p>
                                    </div>
                                    <p className="text-2xl md:text-4xl font-serif font-bold text-charcoal mb-1">{stats.totalOrganizations}</p>
                                    <p className="text-[10px] md:text-xs text-stone-500">
                                        Skráð félög og fyrirtæki
                                    </p>
                                </div>
                            </div>

                            {/* Recent Activity Feed */}
                            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-serif font-bold mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-stone-400" />
                                    Nýleg virkni
                                </h3>
                                <div className="space-y-4">
                                    {unifiedActivity.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-start gap-3 pb-4 border-b border-stone-100 last:border-0 last:pb-0">
                                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'house' ? 'bg-amber/10 text-amber-ink' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {item.type === 'house' ? <Home className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-charcoal">
                                                    {item.type === 'house'
                                                        ? `Nýtt hús skráð: ${item.data.name}`
                                                        : `Nýr notandi skráður: ${item.data.name}`
                                                    }
                                                </p>
                                                <p className="text-xs text-stone-500">
                                                    {item.date.toLocaleDateString('is-IS', {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                    {item.type === 'house' && item.data.address && ` • ${item.data.address}`}
                                                    {item.type === 'user' && ` • ${item.data.email}`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {unifiedActivity.length === 0 && (
                                        <p className="text-stone-500 text-sm italic">Engin nýleg virkni fundin.</p>
                                    )}
                                </div>
                            </div>

                            {/* Organizations Overview */}
                            {stats.allOrganizations.length > 0 && (
                                <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                                    <h3 className="text-lg font-serif font-bold mb-4 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-stone-400" />
                                        Félög - Yfirlit
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Top Organizations by Members */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-stone-600 mb-3">Stærstu félög (eftir meðlimum)</h4>
                                            <div className="space-y-3">
                                                {stats.allOrganizations
                                                    .sort((a, b) => (b.stats?.total_members || 0) - (a.stats?.total_members || 0))
                                                    .slice(0, 5)
                                                    .map((org, idx) => (
                                                        <div key={org.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                                    {idx + 1}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm text-charcoal">{org.name}</p>
                                                                    <p className="text-xs text-stone-500">
                                                                        {org.type === 'company' ? 'Fyrirtæki' : 'Félag'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-charcoal">{org.stats?.total_members || 0}</p>
                                                                <p className="text-xs text-stone-500">meðlimir</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                {stats.allOrganizations.length === 0 && (
                                                    <p className="text-stone-500 text-sm italic">Engin félög skráð ennþá.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Recent Organizations */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-stone-600 mb-3">Nýjustu félög</h4>
                                            <div className="space-y-3">
                                                {stats.allOrganizations
                                                    .sort((a, b) => {
                                                        const dateA = a.created_at instanceof Date ? a.created_at : new Date(0);
                                                        const dateB = b.created_at instanceof Date ? b.created_at : new Date(0);
                                                        return dateB.getTime() - dateA.getTime();
                                                    })
                                                    .slice(0, 5)
                                                    .map((org) => (
                                                        <div key={org.id} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                                <Building2 className="w-4 h-4 text-indigo-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm text-charcoal truncate">{org.name}</p>
                                                                <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                                                                    <span>
                                                                        {org.created_at instanceof Date
                                                                            ? org.created_at.toLocaleDateString('is-IS', { month: 'short', day: 'numeric' })
                                                                            : 'Óþekkt dagsetning'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Houses Tab Start */}

                {/* Feedback Tab */}
                {activeTab === 'communications' && communicationsSubTab === 'feedback' && (
                    <div className="bg-white border border-stone-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-serif font-semibold">Umsagnir</h2>
                            <button
                                type="button"
                                onClick={handleSyncFeaturedFeedback}
                                disabled={actionLoading === 'sync-featured'}
                                className="btn btn-secondary text-sm"
                            >
                                Samstilla birtar umsagnir
                            </button>
                        </div>
                        <DataTable
                            caption="Umsagnir notenda"
                            columns={[
                                {
                                    key: 'rating', label: 'Hvað finnst þér?', sortable: true, render: (row) => (
                                        <div className="flex text-amber-ink" role="img" aria-label={`${row.rating} af 5 stjörnum`}>
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} aria-hidden="true" className={i < row.rating ? 'fill-amber' : 'text-stone-300'}>★</span>
                                            ))}
                                        </div>
                                    )
                                },
                                {
                                    key: 'comment', label: 'Hvað má betur fara?', render: (row) => (
                                        <div className="max-w-md truncate" title={row.comment}>{row.comment || '-'}</div>
                                    )
                                },
                                {
                                    key: 'userName', label: 'Notandi', sortable: true, render: (row) => (
                                        <div>
                                            <div className="font-medium">{row.userName}</div>
                                            <div className="text-xs text-stone-500">{row.userEmail}</div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'canContact', label: 'Má hafa samband?', render: (row) => (
                                        row.canContact ? <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">Já</span> : <span className="text-stone-500 text-xs">Nei</span>
                                    )
                                },
                                { key: 'createdAt', label: 'Dags', sortable: true, render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString('is-IS') : '-' },
                            ]}
                            data={stats.allFeedback}
                            searchKeys={['userName', 'userEmail', 'comment']}
                            actions={(row) => (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleFeatured(row)}
                                        className={`p-2 rounded hover:bg-stone-50 transition-colors ${row.featured ? 'text-amber-ink bg-amber/10' : 'text-stone-500'}`}
                                        title={row.featured ? "Hætta að birta" : "Birta á forsíðu"}
                                        aria-label={row.featured ? "Hætta að birta umsögn á forsíðu" : "Birta umsögn á forsíðu"}
                                        aria-pressed={!!row.featured}
                                    >
                                        <Star className={`w-4 h-4 ${row.featured ? 'fill-amber' : ''}`} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteFeedback(row.id)}
                                        className="p-2 text-stone-500 hover:text-red-600 hover:bg-stone-50 rounded transition-colors"
                                        title="Eyða"
                                        aria-label="Eyða umsögn"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        />
                    </div>
                )}

                {/* Organizations Tab */}
                {activeTab === 'data' && dataSubTab === 'organizations' && (
                    <div className="bg-white border border-stone-200 rounded-lg p-6">
                        <h2 className="text-lg font-serif font-semibold mb-6">Skráð félög</h2>
                        <DataTable
                            caption="Skráð félög"
                            columns={[
                                { key: 'name', label: 'Nafn', sortable: true },
                                {
                                    key: 'type', label: 'Tegund', sortable: true, render: (row) => (
                                        <span className="capitalize">
                                            {row.type === 'company' ? 'Fyrirtæki' : 'Félag'}
                                        </span>
                                    )
                                },
                                {
                                    key: 'stats', label: 'Hús', render: (row) => (
                                        <span className="text-sm font-medium">
                                            {row.stats?.total_properties || 0}
                                        </span>
                                    )
                                },
                                {
                                    key: 'stats', label: 'Meðlimir', render: (row) => (
                                        <span className="text-sm font-medium">
                                            {row.stats?.total_members || 0}
                                        </span>
                                    )
                                },
                                {
                                    key: 'stats', label: 'Bókanir', render: (row) => (
                                        <span className="text-sm font-medium">
                                            {row.stats?.total_bookings || 0}
                                        </span>
                                    )
                                },
                                {
                                    key: 'created_at', label: 'Stofnað', render: (row) => (
                                        <span className="text-xs text-stone-500">
                                            {row.created_at ? new Date(row.created_at).toLocaleDateString('is-IS') : '-'}
                                        </span>
                                    )
                                },
                            ]}
                            data={stats.allOrganizations}
                            searchKeys={['name', 'billing_email']}
                            actions={(row) => (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Navigate to organization dashboard or show details
                                            window.open(`/organizations/${row.id}/admin`, '_blank');
                                        }}
                                        className="p-2 text-stone-500 hover:text-charcoal hover:bg-stone-50 rounded transition-colors"
                                        title="Skoða félag"
                                        aria-label={`Skoða félag ${row.name}`}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (window.confirm(`Ertu viss um að þú viljir eyða ${row.name}?`)) {
                                                try {
                                                    await deleteDoc(doc(db, 'organizations', row.id));
                                                    setStats(prev => ({
                                                        ...prev,
                                                        allOrganizations: prev.allOrganizations.filter(org => org.id !== row.id),
                                                        totalOrganizations: prev.totalOrganizations - 1
                                                    }));
                                                } catch (error) {
                                                    logger.error('Error deleting organization:', error);
                                                    alert('Villa kom upp við að eyða félagi');
                                                }
                                            }
                                        }}
                                        className="p-2 text-stone-500 hover:text-red-600 hover:bg-stone-50 rounded transition-colors"
                                        title="Eyða félagi"
                                        aria-label={`Eyða félagi ${row.name}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        />
                    </div>
                )}

                {/* Providers Tab */}
                {activeTab === 'data' && dataSubTab === 'providers' && (
                    <div className="bg-white border border-stone-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-serif font-semibold">Skráðir Verktakar</h2>
                            <button
                                type="button"
                                onClick={handleMigrateProviderContacts}
                                disabled={actionLoading === 'migrate-provider-contacts'}
                                className="btn btn-secondary text-sm"
                            >
                                Færa tengiliðaupplýsingar
                            </button>
                        </div>
                        <DataTable
                            caption="Skráðir verktakar"
                            columns={[
                                { key: 'name', label: 'Nafn', sortable: true },
                                { key: 'category', label: 'Flokkur', sortable: true },
                                {
                                    key: 'service_areas', label: 'Svæði', render: (row) => (
                                        <div className="flex flex-wrap gap-1">
                                            {row.service_areas?.map((area: string, i: number) => (
                                                <span key={i} className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                                                    {area}
                                                </span>
                                            )) || '-'}
                                        </div>
                                    )
                                },
                                { key: 'address', label: 'Heimilisfang', sortable: true },
                                {
                                    key: 'contact_phone', label: 'Sími / Netfang', render: (row) => (
                                        <div className="text-xs">
                                            <div>{row.contact_phone}</div>
                                            <div className="text-stone-500">{row.contact_email}</div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'status', label: 'Staða', render: (row) => (
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                            ${row.status === 'active' ? 'bg-green-100 text-green-700' :
                                                row.status === 'banned' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'}`}>
                                            {row.status}
                                        </span>
                                    )
                                },

                            ]}
                            data={stats.allProviders}
                            searchKeys={['name', 'category', 'contact_email']}
                            actions={(row) => (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleProviderStatus(row)}
                                        className={`p-2 rounded hover:bg-stone-50 transition-colors ${row.status === 'active' ? 'text-amber-ink hover:text-amber-700' : 'text-green-600 hover:text-green-700'}`}
                                        title={row.status === 'active' ? 'Setja í bið' : 'Samþykkja'}
                                        aria-label={row.status === 'active' ? `Setja verktaka ${row.name} í bið` : `Samþykkja verktaka ${row.name}`}
                                    >
                                        {row.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteProvider(row.id)}
                                        className="p-2 text-stone-500 hover:text-red-600 hover:bg-stone-50 rounded transition-colors"
                                        title="Eyða verktaka"
                                        aria-label={`Eyða verktaka ${row.name}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        />
                    </div>
                )}

                {/* Houses Tab */}
                {
                    activeTab === 'data' && dataSubTab === 'houses' && (
                        <div className="space-y-6">
                            {/* Desktop Table */}
                            <div className="hidden md:block bg-white border border-stone-200 rounded-lg p-6">
                                <h2 className="text-lg font-serif font-semibold mb-6">Húsaskrá</h2>
                                <DataTable
                                    caption="Húsaskrá"
                                    columns={[
                                        { key: 'name', label: 'Nafn hús', sortable: true },
                                        {
                                            key: 'address',
                                            label: 'Staðsetning',
                                            sortable: true,
                                            render: (row) => row.address || '—'
                                        },
                                        {
                                            key: 'owner_ids',
                                            label: 'Meðlimir',
                                            render: (row) => (
                                                <span className="font-mono">{row.owner_ids?.length || 0}</span>
                                            )
                                        },
                                        {
                                            key: 'manager_id',
                                            label: 'Stjórnandi',
                                            render: (row) => {
                                                const manager = stats.allUsers.find(u => u.uid === row.manager_id);
                                                return <span className="font-mono text-xs">{manager?.email || '—'}</span>;
                                            }
                                        },
                                        {
                                            key: 'created_at',
                                            label: 'Búið til',
                                            sortable: true,
                                            render: (row) => {
                                                if (!row.created_at) return '—';
                                                const date = row.created_at as any;
                                                const timestamp = date.seconds ? new Date(date.seconds * 1000) : new Date();
                                                return timestamp.toLocaleDateString('is-IS');
                                            }
                                        },
                                    ]}
                                    data={stats.allHouses}
                                    searchKeys={['name', 'address']}
                                    actions={(row) => (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditingHouse(row)}
                                                className="p-1.5 hover:bg-stone-100 rounded"
                                                title="Breyta"
                                                aria-label={`Breyta húsi ${row.name}`}
                                            >
                                                <Edit className="w-4 h-4 text-stone-500" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteHouse(row.id!)}
                                                disabled={actionLoading === row.id}
                                                className="p-1.5 hover:bg-red-100 rounded disabled:opacity-50"
                                                title="Eyða húsi"
                                                aria-label={`Eyða húsi ${row.name}`}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </button>
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-4">
                                <h2 className="text-xl font-serif font-bold px-1">Húsaskrá ({stats.allHouses.length})</h2>
                                {stats.allHouses.map((house) => (
                                    <div key={house.id} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                                        <div className="mb-3">
                                            <h3 className="font-serif font-bold text-lg text-charcoal">{house.name}</h3>
                                            <p className="text-sm text-stone-500 flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                {house.address || 'Engin staðsetning'}
                                            </p>
                                        </div>
                                        <div className="text-sm mb-4">
                                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">Stjórnandi</p>
                                            <p className="font-medium truncate">{stats.allUsers.find(u => u.uid === house.manager_id)?.email || '—'}</p>
                                        </div>
                                        <div className="flex gap-2 pt-3 border-t border-stone-100">
                                            <button
                                                type="button"
                                                onClick={() => setEditingHouse(house)}
                                                className="px-3 py-2 bg-stone-100 text-stone-600 rounded-lg"
                                                aria-label={`Breyta húsi ${house.name}`}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteHouse(house.id!)}
                                                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg"
                                                aria-label={`Eyða húsi ${house.name}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* Users Tab */}
                {
                    activeTab === 'data' && dataSubTab === 'users' && (
                        <div className="space-y-6">
                            {/* Desktop Table */}
                            <div className="hidden md:block bg-white border border-stone-200 rounded-lg p-6">
                                <h2 className="text-lg font-serif font-semibold mb-6">Notendaskrá</h2>
                                <DataTable
                                    caption="Notendaskrá"
                                    columns={[
                                        { key: 'name', label: 'Nafn', sortable: true },
                                        {
                                            key: 'email',
                                            label: 'Netfang',
                                            sortable: true,
                                            render: (row) => <span className="font-mono text-xs">{row.email}</span>
                                        },
                                        {
                                            key: 'house_ids',
                                            label: 'Hús',
                                            render: (row) => (
                                                <span className="font-mono">{row.house_ids?.length || 0}</span>
                                            )
                                        },
                                        {
                                            key: 'created_at',
                                            label: 'Skráður',
                                            sortable: true,
                                            render: (row) => {
                                                if (!row.created_at) return '—';
                                                const date = row.created_at as any;
                                                const timestamp = date.seconds ? new Date(date.seconds * 1000) : new Date();
                                                return timestamp.toLocaleDateString('is-IS');
                                            }
                                        }
                                    ]}
                                    data={stats.allUsers}
                                    searchKeys={['name', 'email']}
                                    actions={(row) => (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleImpersonate(row)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-amber/30 text-amber-ink hover:bg-amber hover:text-charcoal rounded transition-colors"
                                            >
                                                <UserCog className="w-3 h-3" />
                                                Líkja eftir
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSyncName(row)}
                                                disabled={actionLoading === `sync-name-${row.uid}`}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Samstilla nafn í öllu kerfinu"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${actionLoading === `sync-name-${row.uid}` ? 'animate-spin' : ''}`} />
                                                Samstilla
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteUser(row)}
                                                disabled={actionLoading === `delete-user-${row.uid}`}
                                                className="p-1.5 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded transition-colors"
                                                title="Eyða notanda"
                                                aria-label={`Eyða notanda ${row.name}`}
                                            >
                                                {actionLoading === `delete-user-${row.uid}` ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSendRecoveryEmail(row)}
                                                disabled={actionLoading === `recovery-${row.uid}`}
                                                className="p-1.5 hover:bg-purple-50 text-stone-500 hover:text-purple-600 rounded transition-colors"
                                                title="Senda póst um að klára uppsetningu"
                                                aria-label={`Senda ${row.name} póst um að klára uppsetningu`}
                                            >
                                                {actionLoading === `recovery-${row.uid}` ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Mail className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-4">
                                <h2 className="text-xl font-serif font-bold px-1">Notendaskrá ({stats.allUsers.length})</h2>
                                {stats.allUsers.map((user) => {
                                    const createdAt = user.created_at as any;
                                    const timestamp = createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date();

                                    return (
                                        <div key={user.uid} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-lg font-serif font-bold text-stone-500">
                                                    {user.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-charcoal truncate">{user.name}</h3>
                                                    <p className="text-xs text-stone-500 font-mono truncate">{user.email}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm mb-4 border-t border-stone-100 pt-3">
                                                <div>
                                                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">Hús</p>
                                                    <p className="font-mono">{user.house_ids?.length || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">Skráður</p>
                                                    <p className="font-mono text-xs">{timestamp.toLocaleDateString('is-IS')}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleImpersonate(user)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber/10 text-amber-ink border border-amber/20 rounded-lg text-xs font-bold hover:bg-amber hover:text-charcoal transition-colors"
                                                >
                                                    <UserCog className="w-3 h-3" />
                                                    Líkja eftir
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSyncName(user)}
                                                    className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg"
                                                    aria-label={`Samstilla nafn ${user.name}`}
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${actionLoading === `sync-name-${user.uid}` ? 'animate-spin' : ''}`} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-lg"
                                                    aria-label={`Eyða notanda ${user.name}`}
                                                >
                                                    {actionLoading === `delete-user-${user.uid}` ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                }

                {/* Contacts Tab */}
                {
                    activeTab === 'communications' && communicationsSubTab === 'contacts' && (
                        <div>
                            <h2 className="text-2xl font-serif mb-6">Samskipti frá síðu</h2>
                            <DataTable
                                caption="Samskipti frá síðu"
                                columns={[
                                    { key: 'name', label: 'Nafn' },
                                    { key: 'email', label: 'Netfang' },
                                    {
                                        key: 'message',
                                        label: 'Skila boð',
                                        render: (row) => {
                                            const msg = row.message || '';
                                            return msg.length > 50 ? msg.substring(0, 50) + '...' : msg;
                                        }
                                    },
                                    {
                                        key: 'created_at',
                                        label: 'Dagsetning',
                                        render: (row) => {
                                            if (!row.created_at) return '—';
                                            const date = row.created_at instanceof Date
                                                ? row.created_at
                                                : new Date(row.created_at);
                                            return date.toLocaleDateString('is-IS');
                                        }
                                    },
                                    {
                                        key: 'status',
                                        label: 'Staða',
                                        render: (row) => {
                                            const status = row.status || 'new';
                                            const colors = {
                                                new: 'bg-blue-100 text-blue-700',
                                                read: 'bg-gray-100 text-gray-700',
                                                replied: 'bg-green-100 text-green-700'
                                            };
                                            return (
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors]}`}>
                                                    {status}
                                                </span>
                                            );
                                        }
                                    }
                                ]}
                                data={stats.allContacts}
                                searchKeys={['name', 'email', 'message']}
                                actions={(row) => (
                                    <button
                                        type="button"
                                        onClick={() => setReplyingTo(row)}
                                        className="btn btn-secondary btn-sm flex items-center gap-2"
                                    >
                                        <Reply className="w-3 h-3" />
                                        {row.status === 'replied' ? 'Sjá Svar' : 'Svara'}
                                    </button>
                                )}
                            />
                        </div>
                    )
                }

                {/* Newsletter Tab */}
                {
                    activeTab === 'communications' && communicationsSubTab === 'newsletter' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-serif">Póstlisti</h2>
                                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold border border-blue-100">
                                    {stats.totalSubscribers} skráðir
                                </div>
                            </div>

                            <DataTable
                                caption="Póstlisti"
                                columns={[
                                    {
                                        key: 'email',
                                        label: 'Netfang',
                                        render: (row) => <span className="font-medium text-charcoal">{row.email}</span>
                                    },
                                    {
                                        key: 'created_at',
                                        label: 'Skráður þann',
                                        render: (row) => row.created_at.toLocaleDateString('is-IS', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                    },
                                    {
                                        key: 'source',
                                        label: 'Uppruni',
                                        render: (row) => (
                                            <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded">
                                                {row.source || '/'}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'status',
                                        label: 'Staða',
                                        render: (row) => (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">
                                                {row.status || 'active'}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'actions',
                                        label: 'Aðgerðir',
                                        render: (row) => (
                                            <button
                                                type="button"
                                                aria-label={`Eyða ${row.email} af póstlista`}
                                                onClick={async () => {
                                                    if (!confirm(`Eyða ${row.email} af póstlista?`)) return;
                                                    await deleteDoc(doc(db, 'newsletter_subscribers', row.id));
                                                    setStats(prev => ({
                                                        ...prev,
                                                        allSubscribers: prev.allSubscribers.filter(s => s.id !== row.id),
                                                        totalSubscribers: prev.totalSubscribers - 1
                                                    }));
                                                }}
                                                className="text-stone-500 hover:text-red-600 transition-colors p-1.5"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )
                                    }
                                ]}
                                data={stats.allSubscribers}
                                searchKeys={['email']}
                            />
                        </div>
                    )
                }

                {/* Emails Tab (Old Templates - keeping for logic) */}
                {
                    activeTab === 'communications' && communicationsSubTab === 'emails' && (
                        <div className="max-w-4xl space-y-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-serif">Tölvupóstsniðmát</h2>
                                <div className="flex gap-2">
                                    <button type="button" onClick={handleSeedTemplates} className="btn btn-secondary btn-sm">Búa til sjálfgefin</button>
                                    <button type="button" onClick={fetchTemplates} className="btn btn-ghost btn-sm">Endurhlaða</button>
                                </div>
                            </div>

                            {templates.length === 0 && !loading ? (
                                <div className="text-center py-12 bg-white rounded-lg border border-stone-200">
                                    <p className="text-stone-500 mb-4">Engin sniðmát fundust.</p>
                                    <button type="button" onClick={handleSeedTemplates} className="btn btn-secondary">
                                        Búa til sjálfgefin sniðmát
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {templates.map(tpl => (
                                        <div key={tpl.id} className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-lg">{tpl.id}</h3>
                                                        {tpl.active ? (
                                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                                <CheckCircle className="w-3 h-3" /> Virkt
                                                            </span>
                                                        ) : (
                                                            <span className="bg-stone-100 text-stone-500 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                                <XCircle className="w-3 h-3" /> Óvirkt
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-stone-500 mt-1">{tpl.description}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSendTestEmail(tpl)}
                                                        disabled={actionLoading === `test-email-${tpl.id}`}
                                                        className="btn btn-ghost btn-sm text-stone-500 hover:text-amber-ink border border-stone-200"
                                                        title="Senda prufupóst á sjálfan þig"
                                                        aria-label={`Senda prufupóst úr sniðmáti ${tpl.id} á sjálfan þig`}
                                                    >
                                                        {actionLoading === `test-email-${tpl.id}` ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Send className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingTemplate(tpl)}
                                                        className="btn btn-secondary btn-sm"
                                                    >
                                                        Breyta
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="text-sm">
                                                    <span className="font-bold text-stone-700">Efnislína:</span> {tpl.subject}
                                                </div>
                                                {tpl.variables && tpl.variables.length > 0 && (
                                                    <div className="text-sm">
                                                        <span className="font-bold text-stone-700">Breytur:</span>
                                                        <span className="font-mono text-xs bg-stone-100 px-1 ml-1 rounded text-stone-600">
                                                            {tpl.variables.join(', ')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Edit Modal / Overlay */}
                            {editingTemplate && (
                                <Modal
                                    open
                                    onClose={() => setEditingTemplate(null)}
                                    title={`Breyta sniðmáti: ${editingTemplate.id}`}
                                    size="xl"
                                    footer={
                                        <div className="flex w-full flex-wrap justify-between items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSendTestEmail(editingTemplate)}
                                                disabled={actionLoading === `test-email-${editingTemplate.id}`}
                                                className="btn btn-ghost text-amber-ink hover:bg-amber/5 font-bold flex items-center gap-2"
                                            >
                                                {actionLoading === `test-email-${editingTemplate.id}` ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                                {actionLoading === `test-email-${editingTemplate.id}` ? 'Sendi...' : 'Senda prufu á mig'}
                                            </button>
                                            <div className="flex gap-3">
                                                <button type="button" onClick={() => setEditingTemplate(null)} className="btn btn-ghost">Hætta við</button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveTemplate(editingTemplate)}
                                                    className="btn btn-primary"
                                                    disabled={actionLoading === 'saving-template'}
                                                >
                                                    {actionLoading === 'saving-template' ? 'Vistar...' : 'Vista breytingar'}
                                                </button>
                                            </div>
                                        </div>
                                    }
                                >
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                                            <div className="flex-1">
                                                <strong>Staða:</strong> {editingTemplate.active ? 'Tilbúið til sendingar' : 'Drög (ekki í sendingu)'}
                                            </div>
                                            <button
                                                type="button"
                                                aria-pressed={!!editingTemplate.active}
                                                onClick={() => setEditingTemplate({ ...editingTemplate, active: !editingTemplate.active })}
                                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${editingTemplate.active ? 'bg-green-700 text-white' : 'bg-stone-300 text-stone-700'}`}
                                            >
                                                {editingTemplate.active ? 'Virkt' : 'Virkja'}
                                            </button>
                                        </div>

                                        <div>
                                            <label htmlFor={tplSubjectId} className="label">Efnislína</label>
                                            <input
                                                id={tplSubjectId}
                                                type="text"
                                                className="input font-bold"
                                                value={editingTemplate.subject}
                                                onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                            />
                                        </div>

                                        <div className="flex-1 flex flex-col">
                                            <label htmlFor={tplHtmlId} className="label flex justify-between">
                                                <span>HTML efni</span>
                                                <span className="text-xs font-normal text-stone-500">Styður venjuleg HTML merki</span>
                                            </label>
                                            <textarea
                                                id={tplHtmlId}
                                                className="input font-mono text-xs leading-relaxed min-h-[300px]"
                                                value={editingTemplate.html_content}
                                                onChange={(e) => setEditingTemplate({ ...editingTemplate, html_content: e.target.value })}
                                            />
                                        </div>

                                        <div className="bg-stone-100 p-4 rounded text-xs">
                                            <strong>Tiltækar breytur:</strong> {editingTemplate.variables?.map(v => `{${v}}`).join(', ') || 'Engar'}
                                        </div>
                                    </div>
                                </Modal>
                            )}
                        </div>
                    )
                }

                {/* Edit House Modal */}
                {
                    editingHouse && (
                        <Modal
                            open
                            onClose={() => setEditingHouse(null)}
                            title="Breyta húsi"
                            size="md"
                            footer={
                                <>
                                    <button type="button" onClick={() => setEditingHouse(null)} className="btn btn-ghost">Hætta við</button>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateHouse(editingHouse)}
                                        className="btn btn-primary"
                                        disabled={actionLoading === 'updating-house'}
                                    >
                                        {actionLoading === 'updating-house' ? 'Vistar...' : 'Vista breytingar'}
                                    </button>
                                </>
                            }
                        >
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor={houseNameId} className="text-xs font-bold text-stone-500 uppercase">Nafn húss</label>
                                        <input
                                            id={houseNameId}
                                            type="text"
                                            className="input mt-1"
                                            value={editingHouse.name}
                                            onChange={e => setEditingHouse({ ...editingHouse, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <label htmlFor={houseAddressId} className="text-xs font-bold text-stone-500 uppercase">Heimilisfang (HMS Leit)</label>
                                        <input
                                            id={houseAddressId}
                                            type="text"
                                            className="input mt-1"
                                            value={editingHouse.address || ''}
                                            onChange={e => handleAddressChange(e.target.value)}
                                            placeholder="Byrjaðu að skrifa heimilisfang..."
                                            autoComplete="off"
                                        />
                                        {/* Suggestions dropdown */}
                                        {addressSuggestions.length > 0 && (
                                            <div className="absolute z-50 w-full bg-white border border-stone-200 mt-1 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                {addressSuggestions.map((item, idx) => (
                                                    <button
                                                        type="button"
                                                        key={idx}
                                                        className="w-full text-left px-4 py-2 hover:bg-amber/10 text-sm border-b border-stone-50 last:border-0 transition-colors flex items-center justify-between group"
                                                        onClick={() => selectCMSAddress(item)}
                                                    >
                                                        <span className="font-medium text-stone-700 group-hover:text-charcoal">{formatHMSAddress(item)}</span>
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold uppercase">HMS</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {/* Lat/Lng Indicator */}
                                        <div className="absolute right-2 top-0 text-[10px] font-mono text-stone-500 mt-1">
                                            {editingHouse.location?.lat ? '📍 GPS fannst' : '❌ Ekkert GPS'}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor={houseManagerId} className="text-xs font-bold text-stone-500 uppercase">Stjórnandi (UID)</label>
                                        <input
                                            id={houseManagerId}
                                            type="text"
                                            className="input mt-1 font-mono text-xs"
                                            value={editingHouse.manager_id}
                                            onChange={e => setEditingHouse({ ...editingHouse, manager_id: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-stone-500 uppercase">Staða</span>
                                        <p className="mt-1 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">Frítt (öll hús)</p>
                                    </div>
                                </div>
                        </Modal>
                    )
                }

                {/* Reply to Contact Modal */}
                {
                    replyingTo && (
                        <Modal
                            open
                            onClose={() => setReplyingTo(null)}
                            title="Svara erindi"
                            size="xl"
                            footer={
                                <>
                                    <button type="button" onClick={() => setReplyingTo(null)} className="btn btn-ghost">Loka</button>
                                    <button
                                        type="button"
                                        onClick={handleSendReply}
                                        className="btn btn-primary flex items-center gap-2"
                                        disabled={actionLoading === 'sending-reply' || !replyText.trim()}
                                    >
                                        {actionLoading === 'sending-reply' ? 'Sendi...' : 'Senda svar'}
                                        <Send className="w-4 h-4" />
                                    </button>
                                </>
                            }
                        >
                                <div className="space-y-6">
                                    {/* Original Message */}
                                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-charcoal">{replyingTo.name}</div>
                                            <div className="text-xs text-stone-500">{new Date(replyingTo.created_at).toLocaleString('is-IS')}</div>
                                        </div>
                                        <div className="text-stone-600 mb-2 font-mono text-xs">{replyingTo.email}</div>
                                        <p className="text-stone-800 whitespace-pre-wrap">{replyingTo.message}</p>
                                    </div>

                                    {/* Previous Replies */}
                                    {replyingTo.replies && replyingTo.replies.length > 0 && (
                                        <div className="pl-6 border-l-2 border-stone-200 space-y-4">
                                            <h5 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Samskiptasaga</h5>
                                            {replyingTo.replies.map((reply, idx) => (
                                                <div key={idx} className={`text-sm p-3 rounded-lg ${reply.is_admin_reply ? 'bg-blue-50 ml-4' : 'bg-stone-50 mr-4'}`}>
                                                    <div className="flex justify-between text-xs text-stone-500 mb-1">
                                                        <span className="font-bold">{reply.from_email}</span>
                                                        <span>{new Date(reply.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <div className="whitespace-pre-wrap">{reply.body}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Reply Form */}
                                    <div>
                                        <label htmlFor={replyTextId} className="text-xs font-bold text-stone-500 uppercase mb-2 block">Svar</label>
                                        <textarea
                                            id={replyTextId}
                                            className="w-full h-40 p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent font-sans"
                                            placeholder="Skrifaðu svar..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                        </Modal>
                    )
                }

                {/* Custom Confirmation Modal */}
                {
                    confirmModal && confirmModal.isOpen && (
                        <Modal
                            open
                            onClose={() => setConfirmModal(null)}
                            title={confirmModal.title}
                            size="sm"
                            footer={
                                <div className="flex w-full gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmModal(null)}
                                        className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg transition-colors"
                                    >
                                        Hætta við
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmModal.onConfirm}
                                        className={`flex-1 py-3 px-4 font-bold rounded-lg shadow-md transition-transform motion-safe:active:scale-95 ${confirmModal.type === 'danger' ? 'bg-red-700 hover:bg-red-800 text-white' : confirmModal.type === 'success' ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-amber hover:bg-amber-600 text-charcoal'
                                            }`}
                                    >
                                        Staðfesta
                                    </button>
                                </div>
                            }
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm ${confirmModal.type === 'danger' ? 'bg-red-50 text-red-600' : confirmModal.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-stone-50 text-amber-ink'
                                    }`}>
                                    {confirmModal.type === 'success' ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                                </div>
                                <p className="text-sm text-stone-600 leading-relaxed">{confirmModal.message}</p>
                            </div>
                        </Modal>
                    )
                }

                {activeTab === 'system' && systemSubTab === 'audit' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center text-charcoal">
                            <div>
                                <h2 className="text-2xl font-serif font-bold">Audit & Health</h2>
                                <p className="text-stone-500">Finna og laga notendur sem vantar Firestore prófíl (Orphans)</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={exportOrphansCSV}
                                    disabled={orphans.length === 0}
                                    className="btn border-stone-200 bg-white text-charcoal hover:bg-stone-50 flex items-center gap-2"
                                >
                                    <Reply className="w-4 h-4 rotate-180" />
                                    Flytja út CSV
                                </button>
                                <button
                                    type="button"
                                    onClick={fetchOrphans}
                                    disabled={auditLoading}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
                                    Keyra úttekt
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                            <table className="w-full text-left">
                                <caption className="sr-only">Munaðarlausir notendur</caption>
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Stofnað</th>
                                        <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Netfang</th>
                                        <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Nafn</th>
                                        <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Tegund</th>
                                        <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Aðgerðir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {auditLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-stone-500" role="status">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                                Sæki gögn og athuga Firestore...
                                            </td>
                                        </tr>
                                    ) : orphans.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-green-600 font-medium">
                                                ✅ Engir munaðarlausir notendur fundust! Allt í góðu.
                                            </td>
                                        </tr>
                                    ) : (
                                        orphans.map((o) => (
                                            <tr key={o.uid} className="hover:bg-stone-50">
                                                <td className="px-6 py-4 text-sm text-stone-600">
                                                    {new Date(o.createdAt).toLocaleString('is-IS')}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-charcoal">{o.email}</td>
                                                <td className="px-6 py-4 text-sm text-stone-500">{o.displayName || '-'}</td>
                                                <td className="px-6 py-4">
                                                    {o.isTest ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[10px] uppercase font-bold tracking-wider">Prufuaðgangur</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] uppercase font-bold tracking-wider">Mögulega raunverulegur notandi</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRepairOrphan(o.uid)}
                                                            disabled={actionLoading === `repair-${o.uid}`}
                                                            className="px-3 py-1 text-xs bg-amber/10 text-amber-ink border border-amber/20 rounded hover:bg-amber/20 flex items-center gap-1"
                                                        >
                                                            {actionLoading === `repair-${o.uid}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                                            Gera við
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteUser({ uid: o.uid, email: o.email, name: o.displayName || 'Munaðarlaus' } as any)}
                                                            disabled={actionLoading === `delete-user-${o.uid}`}
                                                            className="p-1.5 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded transition-colors"
                                                            title="Eyða notanda"
                                                            aria-label={`Eyða notanda ${o.email}`}
                                                        >
                                                            {actionLoading === `delete-user-${o.uid}` ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {orphans.length > 0 && (
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold">Hvað eru „munaðarlausir notendur“?</p>
                                    <p className="mt-1 opacity-90">
                                        Þetta eru notendur sem hafa tekist að stofna aðgang (Firebase Auth) en vegna villu tókst ekki að búa til prófíl í gagnagrunninum (Firestore).
                                        Með því að smella á "Gera við" býrðu til lágmarks prófíl svo þeir geti skráð sig inn og haldið áfram.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="pt-8 border-t border-stone-200">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-xl font-serif font-bold">Notendur án húss (Stuck)</h3>
                                    <p className="text-stone-500 text-sm">Notendur sem hafa búið til prófíl en ekki klárað að búa til eða tengjast húsi.</p>
                                </div>
                                {stuckUsers.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleBulkRecoveryEmails}
                                        disabled={actionLoading === 'bulk-recovery'}
                                        className="btn bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                                    >
                                        {actionLoading === 'bulk-recovery' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                        Senda á alla ({stuckUsers.length})
                                    </button>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <caption className="sr-only">Notendur án húss</caption>
                                    <thead className="bg-stone-50 border-b border-stone-200">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Stofnað</th>
                                            <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Netfang</th>
                                            <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Nafn</th>
                                            <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Aðgerðir</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {auditLoading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-stone-500" role="status">
                                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                                    Sæki gögn...
                                                </td>
                                            </tr>
                                        ) : stuckUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-green-600 font-medium">
                                                    ✅ Engir notendur fastir í onboarding!
                                                </td>
                                            </tr>
                                        ) : (
                                            stuckUsers.map((u) => (
                                                <tr key={u.uid} className="hover:bg-stone-50">
                                                    <td className="px-6 py-4 text-sm text-stone-600">
                                                        {new Date(u.created).toLocaleString('is-IS')}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-charcoal">{u.email}</td>
                                                    <td className="px-6 py-4 text-sm text-stone-500">{u.name}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSendRecoveryEmail(u)}
                                                                disabled={actionLoading === `recovery-${u.uid}`}
                                                                className="px-3 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded hover:bg-indigo-100 flex items-center gap-1"
                                                            >
                                                                {actionLoading === `recovery-${u.uid}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                                                                Senda tölvupóst
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteUser({ uid: u.uid, email: u.email, name: u.name || 'Óþekktur' } as any)}
                                                                disabled={actionLoading === `delete-user-${u.uid}`}
                                                                className="p-1.5 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded transition-colors"
                                                                title="Eyða notanda"
                                                                aria-label={`Eyða notanda ${u.email}`}
                                                            >
                                                                {actionLoading === `delete-user-${u.uid}` ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-3 h-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div >
        </AdminLayout >
    );
}
