/**
 * Super Admin Mission Control - Professional Dashboard
 * Desktop-first, high-density data tables, real impersonation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, BarChart2, TrendingUp, Activity, Database, UserCog, Edit, Send, Tag, Settings, CheckCircle, XCircle, Mail, Trash2, Loader2, RefreshCw, MapPin, Shield, LogOut, LayoutDashboard, Reply, MessageSquare } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, getDoc, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, setDoc, query, where } from 'firebase/firestore';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useAppStore } from '@/store/appStore';
import { seedDemoData } from '@/utils/seedDemoData';
import { updateUserNameInAllCollections } from '@/services/userService';
import AdminLayout from '@/components/AdminLayout';
import DataTable from '@/components/DataTable';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

import type { House, User, Coupon, ContactSubmission } from '@/types/models';

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
    activeTasks: number;
    allHouses: House[];
    allUsers: User[];
    allContacts: ContactSubmission[];
    allCoupons: Coupon[];
    allSubscribers: NewsletterSubscriber[];
}

export default function SuperAdminPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'houses' | 'users' | 'contacts' | 'coupons' | 'integrations' | 'emails' | 'newsletter'>('overview');
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [editingHouse, setEditingHouse] = useState<House | null>(null);
    const [replyingTo, setReplyingTo] = useState<ContactSubmission | null>(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount_type: 'percent',
        discount_value: 0,
        description: '',
        max_uses: 0
    });

    const [paydayStatus, setPaydayStatus] = useState<{ success: boolean; message: string } | null>(null);
    const [invoiceTestResult, setInvoiceTestResult] = useState<{ success: boolean; message: string; invoice?: any } | null>(null);
    const [selectedHouseForInvoice, setSelectedHouseForInvoice] = useState<string>('');


    const [stats, setStats] = useState<Stats>({
        totalHouses: 0,
        totalUsers: 0,
        totalBookings: 0,
        totalSubscribers: 0,
        activeTasks: 0,
        allHouses: [],
        allUsers: [],
        allContacts: [],
        allCoupons: [],
        allSubscribers: []
    });

    // Email Templates Logic - Define BEFORE useEffect
    const fetchTemplates = async () => {
        try {
            const snap = await getDocs(collection(db, 'email_templates'));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as EmailTemplate[];
            setTemplates(list);
        } catch (e) {
            console.error("Fetch templates error:", e);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);

                const safeFetch = async (collName: string) => {
                    try {
                        const snap = await getDocs(collection(db, collName));
                        return snap;
                    } catch (e) {
                        console.error(`Error fetching ${collName}:`, e);
                        return null;
                    }
                };

                const [housesSnap, usersSnap, bookingsSnap, tasksSnap, contactsSnap, couponsSnap, subSnap] = await Promise.all([
                    safeFetch('houses'),
                    safeFetch('users'),
                    safeFetch('bookings'),
                    safeFetch('tasks'),
                    safeFetch('contact_submissions'),
                    safeFetch('coupons'),
                    safeFetch('newsletter_subscribers')
                ]);

                const houses = housesSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() } as House)) || [];
                const users = usersSnap?.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)) || [];
                const activeTasks = tasksSnap?.docs.filter(doc => doc.data().status !== 'completed').length || 0;

                const contacts = contactsSnap?.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate() || new Date()
                } as ContactSubmission)) || [];

                const coupons = couponsSnap?.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: (doc.data().created_at as any)?.toDate() || new Date(),
                    valid_until: (doc.data().valid_until as any)?.toDate() || undefined
                } as Coupon)) || [];

                const subscribers = subSnap?.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: (doc.data().created_at as any)?.toDate() || new Date()
                } as NewsletterSubscriber)) || [];

                setStats({
                    totalHouses: houses.length,
                    totalUsers: users.length,
                    totalBookings: bookingsSnap?.size || 0,
                    totalSubscribers: subSnap?.size || 0,
                    activeTasks,
                    allHouses: houses,
                    allUsers: users,
                    allContacts: contacts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
                    allCoupons: coupons,
                    allSubscribers: subscribers.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
                });

                if (!housesSnap && !usersSnap) {
                    setError("Sum gögn gáfu ekki aðgang. Vinsamlegast athugaðu Console.");
                }
            } catch (error: any) {
                console.error('Global fetch stats error:', error);
                setError(error.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        console.log('📊 SuperAdmin Version: 1.2.0 - Email Service Active');
        fetchStats();
    }, []);

    // Fetch email templates when emails tab is active
    useEffect(() => {
        if (activeTab === 'emails') {
            fetchTemplates();
        }
    }, [activeTab]);

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
            alert(`❌ Error: ${error.message}`);
        } finally {
            setSeeding(false);
        }
    };

    // Extend trial for a house
    const handleExtendTrial = async (houseId: string) => {
        if (!confirm('Extend trial by 14 days?')) return;

        setActionLoading(houseId);
        try {
            const house = stats.allHouses.find(h => h.id === houseId);
            if (!house) throw new Error('House not found');

            const currentEnd = house.subscription_end
                ? (house.subscription_end instanceof Date ? house.subscription_end : new Date(house.subscription_end))
                : new Date();

            // Add 14 days
            const newEnd = new Date(currentEnd.getTime() + 14 * 24 * 60 * 60 * 1000);

            await updateDoc(doc(db, 'houses', houseId), {
                subscription_end: newEnd,
                subscription_status: house.subscription_status === 'free' ? 'free' : 'trial'
            });

            // Update local state
            setStats(prev => ({
                ...prev,
                allHouses: prev.allHouses.map(h =>
                    h.id === houseId
                        ? { ...h, subscription_end: newEnd, subscription_status: h.subscription_status === 'free' ? 'free' : 'trial' } as House
                        : h
                )
            }));

            alert('✅ Trial extended by 14 days!');
        } catch (error: any) {
            console.error('Error extending trial:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleFree = async (houseId: string) => {
        const house = stats.allHouses.find(h => h.id === houseId);
        if (!house) return;

        const isFree = house.subscription_status === 'free';
        if (!confirm(isFree ? 'Revoke free access?' : 'Grant FREE lifetime access?')) return;

        setActionLoading(houseId);
        try {
            const newStatus = isFree ? 'trial' : 'free';

            await updateDoc(doc(db, 'houses', houseId), {
                subscription_status: newStatus
            });

            // Update local state
            setStats(prev => ({
                ...prev,
                allHouses: prev.allHouses.map(h =>
                    h.id === houseId
                        ? { ...h, subscription_status: newStatus } as House
                        : h
                )
            }));

            alert(isFree ? 'ℹ️ Access revoked (set to trial)' : '✅ Access granted permanently (Free)');
        } catch (error: any) {
            console.error('Error toggling status:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteHouse = async (houseId: string) => {
        const house = stats.allHouses.find(h => h.id === houseId);
        if (!house) return;

        const confirmText = `EYÐA "${house.name}"?\n\nÞETTA EYÐIR:\n- Húsinu\n- Öllum bókunum\n- Öllum verkefnum\n- Innkaupalistanum\n- Öllum log færslum\n\nÞetta er ÓAFTURKRÆFT!\n\nSkrifaðu nafn hússins til að sta staðfesta:`;
        const userInput = prompt(confirmText);

        if (userInput !== house.name) {
            alert('Hætt við - nafnið passaði ekki');
            return;
        }

        setActionLoading(houseId);
        try {
            // Delete all related data
            const collections = ['bookings', 'tasks', 'shopping_list', 'internal_logs', 'finance_entries'];

            for (const collectionName of collections) {
                const q = query(collection(db, collectionName), where('house_id', '==', houseId));
                const snapshot = await getDocs(q);
                const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, collectionName, docSnap.id)));
                await Promise.all(deletePromises);
            }

            // Delete the house itself
            await deleteDoc(doc(db, 'houses', houseId));

            // Update local state
            setStats(prev => ({
                ...prev,
                totalHouses: prev.totalHouses - 1,
                allHouses: prev.allHouses.filter(h => h.id !== houseId)
            }));

            alert('✅ Húsinu og öllum gögnum eytt!');
        } catch (error: any) {
            console.error('Error deleting house:', error);
            alert(`❌ Villa: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleTestPayday = async () => {
        setActionLoading('payday-test');
        setPaydayStatus(null);
        try {
            const res = await fetch('/api/payday-test', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setPaydayStatus({ success: true, message: `Connected to Payday! Token expires in ${Math.round(data.expires_in / 60)} minutes.` });
            } else {
                setPaydayStatus({ success: false, message: data.error || 'Failed to connect' });
            }
        } catch (err: any) {
            setPaydayStatus({ success: false, message: err.message });
        } finally {
            setActionLoading(null);
        }
    };

    const handleTestInvoice = async () => {
        if (!selectedHouseForInvoice) {
            alert('Veldu hús til að búa til reikning');
            return;
        }

        setActionLoading('invoice-test');
        setInvoiceTestResult(null);

        try {
            // Get house details
            const house = stats.allHouses.find(h => h.id === selectedHouseForInvoice);
            if (!house) {
                setInvoiceTestResult({ success: false, message: 'Hús fannst ekki' });
                return;
            }

            // Get manager details
            const manager = stats.allUsers.find(u => u.uid === house.manager_id);
            if (!manager) {
                setInvoiceTestResult({ success: false, message: 'Stjórnandi fannst ekki' });
                return;
            }

            const productId = import.meta.env.VITE_PAYDAY_PRODUCT_ANNUAL || '005';

            // Create invoice via API
            const res = await fetch('/api/payday-create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: house.name || manager.name || 'Viðskiptavinur',
                    customerEmail: manager.email,
                    lineItems: [{
                        productCode: productId,
                        description: `Bústaðurinn.is - Ársáskrift fyrir ${house.name}`,
                        quantity: 1,
                        unitPrice: 4990
                    }],
                    notes: `Test invoice for ${house.name} (${house.address || 'Enging staðsetning'})`
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setInvoiceTestResult({
                    success: true,
                    message: `Reikningur stofnaður! Send á ${manager.email}`,
                    invoice: data.invoice
                });
            } else {
                setInvoiceTestResult({
                    success: false,
                    message: data.error || data.details?.error_description || 'Mistókst að búa til reikning'
                });
            }
        } catch (err: any) {
            setInvoiceTestResult({ success: false, message: err.message });
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
                manager_id: houseData.manager_id,
                subscription_status: houseData.subscription_status
            });
            setStats(prev => ({
                ...prev,
                allHouses: prev.allHouses.map(h => h.id === houseData.id ? houseData : h)
            }));
            setEditingHouse(null);
            alert('Hús uppfært!');
        } catch (e: any) {
            console.error(e);
            alert('Villa við að uppfæra hús: ' + e.message);
        } finally {
            setActionLoading(null);
        }
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
            <a href="https://bustadurinn.is/dashboard" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
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
            await fetchTemplates();
            alert('Templates seeded!');
        } catch (e) {
            console.error(e);
            alert('Error seeding');
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
            alert('Error saving: ' + e.message);
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: tpl.id,
                    to: currentUser.email,
                    variables: {
                        name: currentUser.name || 'Prófunarnotandi',
                        houseName: 'Sýnishornsbústaður',
                        inviteLink: 'https://bustadurinn.is/join?test=1',
                        expiryDate: '15. janúar 2025'
                    }
                })
            });

            const data = await res.text();
            let parsedData: any = {};
            try {
                parsedData = JSON.parse(data);
            } catch (e) {
                // Not JSON
            }

            if (res.ok) {
                alert(`✅ Prufupóstur sendur! Athugaðu inboxið þitt (${currentUser.email}).\n\nResend ID: ${parsedData.data?.id || 'N/A'}`);
            } else {
                const errorMsg = parsedData.error || data || res.statusText;
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            console.error('Test email error:', error);
            alert(`❌ Villa: ${error.message}`);
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
                const firstHouseId = user.house_ids[0];

                try {
                    const houseDocRef = doc(db, 'houses', firstHouseId);
                    const houseSnap = await getDoc(houseDocRef);

                    if (houseSnap.exists()) {
                        userHouse = { id: houseSnap.id, ...houseSnap.data() } as House;
                        console.log('🏠 Loaded user house:', userHouse.name);
                    } else {
                        console.warn('House not found:', firstHouseId);
                    }
                } catch (fetchError) {
                    console.error('Error fetching user house:', fetchError);
                    // Continue anyway - user might not have a house
                }
            }

            // Set impersonation context FIRST
            startImpersonation(user);
            console.log('🎭 Impersonation context set for:', user.name);

            // Then update store with their house
            if (userHouse) {
                useAppStore.getState().setCurrentHouse(userHouse);
                useAppStore.getState().setUserHouses([userHouse]);
                console.log('✅ Store updated with user house');
            } else {
                // Clear house if they don't have one
                useAppStore.getState().setCurrentHouse(null);
                useAppStore.getState().setUserHouses([]);
                console.log('ℹ️ User has no house - cleared store');
            }

            // Save return URL
            localStorage.setItem('admin_return_url', window.location.pathname);

            // Small delay to ensure store updates are processed
            await new Promise(resolve => setTimeout(resolve, 200));

            console.log('🚀 Navigating to dashboard as', user.name);

            // Navigate to their dashboard
            navigate('/dashboard');
        } catch (error: any) {
            console.error('Impersonation error:', error);
            alert('Failed to impersonate user: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (user: User) => {
        const confirmText = `EYÐA NOTANDA "${user.name}" (${user.email})?\n\nÞetta eyðir aðganginum varanlega úr Auth og gagnagrunni.\n\nSkrifaðu "DELETE" til að staðfesta:`;
        if (prompt(confirmText) !== 'DELETE') return;

        setActionLoading(`delete-user-${user.uid}`);
        try {
            const res = await fetch('/api/admin-delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user.uid })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete user');
            }

            setStats(prev => ({
                ...prev,
                totalUsers: prev.totalUsers - 1,
                allUsers: prev.allUsers.filter(u => u.uid !== user.uid)
            }));

            alert('✅ Notanda eytt!');
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert(`❌ Villa: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSyncName = async (user: User) => {
        if (!confirm(`Force update name "${user.name}" across all system records (tasks, logs, bookings etc)?`)) return;

        setActionLoading(`sync-name-${user.uid}`);
        try {
            await updateUserNameInAllCollections(user.uid, user.name, user.house_ids || []);
            alert('✅ User name synced successfully across all collections.');
        } catch (error: any) {
            console.error('Error syncing name:', error);
            alert(`❌ Error: ${error.message}`);
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

            const res = await fetch('/api/admin-send-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: replyingTo.email,
                    subject: `Sv: Erindi frá Bústaðurinn.is`,
                    text: replyText,
                    originalMessage: replyingTo.message
                })
            });

            if (!res.ok) throw new Error('Failed to send email via API');

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
            console.error('Reply error:', error);
            alert('Mistókst að senda svar: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading('create-coupon');
            const docRef = await addDoc(collection(db, 'coupons'), {
                code: newCoupon.code.toUpperCase(),
                discount_type: newCoupon.discount_type,
                discount_value: Number(newCoupon.discount_value),
                description: newCoupon.description,
                max_uses: Number(newCoupon.max_uses) || null,
                used_count: 0,
                active: true,
                created_at: serverTimestamp(),
                valid_until: null
            });

            // Add to local state
            const createdCoupon: Coupon = {
                id: docRef.id,
                code: newCoupon.code.toUpperCase(),
                discount_type: newCoupon.discount_type as 'percent' | 'fixed',
                discount_value: Number(newCoupon.discount_value),
                description: newCoupon.description,
                max_uses: Number(newCoupon.max_uses) || undefined,
                used_count: 0,
                active: true,
                created_at: new Date()
            };

            setStats(prev => ({
                ...prev,
                allCoupons: [...prev.allCoupons, createdCoupon]
            }));

            // Reset form
            setNewCoupon({
                code: '',
                discount_type: 'percent',
                discount_value: 0,
                description: '',
                max_uses: 0
            });

            alert('✅ Coupon created successfully!');
        } catch (error: any) {
            console.error('Error creating coupon:', error);
            alert(`❌ Error creating coupon: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;

        try {
            await deleteDoc(doc(db, 'coupons', id));

            setStats(prev => ({
                ...prev,
                allCoupons: prev.allCoupons.filter(c => c.id !== id)
            }));

            alert('✅ Coupon deleted.');
        } catch (error: any) {
            console.error('Error deleting coupon:', error);
            alert(`❌ Error: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <AdminLayout
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as 'overview' | 'houses' | 'users')}
                onBackClick={() => navigate('/dashboard')}
                userHouses={userHouses}
                onHouseSelect={handleHouseSwitch}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-stone-500 font-mono text-sm">Loading system data...</p>
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
                onTabChange={(tab) => setActiveTab(tab as 'overview' | 'houses' | 'users')}
                onBackClick={() => navigate('/dashboard')}
                userHouses={userHouses}
                onHouseSelect={handleHouseSwitch}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-serif font-bold text-charcoal mb-2">Failed to Load Data</h2>
                        <p className="text-stone-600 mb-4">{error}</p>
                        <button onClick={() => window.location.reload()} className="btn btn-primary">
                            Retry
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
                onTabChange={(tab) => setActiveTab(tab as 'overview' | 'houses' | 'users')}
                onBackClick={() => navigate('/dashboard')}
                userHouses={userHouses}
                onHouseSelect={handleHouseSwitch}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Database className="w-8 h-8 text-stone-400" />
                        </div>
                        <h2 className="text-xl font-serif font-bold text-charcoal mb-2">No Data Found</h2>
                        <p className="text-stone-600 mb-6">Database seems empty or access was denied.</p>

                        <div className="bg-stone-50 p-4 rounded-lg mb-6 text-left text-xs font-mono text-stone-500 break-all border border-stone-200">
                            <p className="font-bold text-stone-700 mb-2">Debug Info:</p>
                            <p>UID: {currentUser?.uid}</p>
                            <p>Email: {currentUser?.email}</p>
                            <p className="mt-2 text-amber-600">
                                Verify this UID exists in firestore.rules "isSuperAdmin()" function.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleSeedDemo}
                                disabled={seeding}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <Database className="w-4 h-4" />
                                {seeding ? 'Seeding...' : 'Seed Demo Data'}
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors font-medium text-stone-600"
                            >
                                Refresh Page
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
            {/* Premium Sticky Header & Navigation */}
            <div className="sticky top-0 z-50 flex flex-col bg-white/80 backdrop-blur-xl border-b border-stone-200/60 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
                    {/* Top Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 md:h-20 gap-4 md:gap-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br from-charcoal to-stone-800 text-white shadow-lg shadow-charcoal/20 transition-transform duration-500 hover:rotate-180`}>
                                    <Shield className={`w-5 h-5 md:w-6 md:h-6`} />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-charcoal to-stone-600">
                                        Super Admin
                                    </h1>
                                    <p className="text-[10px] md:text-xs text-stone-500 font-medium tracking-wide">
                                        v1.2.0 • <span className="text-green-600 flex-inline items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>Online</span>
                                    </p>
                                </div>
                            </div>

                            {/* Mobile Actions */}
                            <div className="flex md:hidden gap-2">
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="p-2 text-stone-400 hover:text-charcoal transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={handleSeedDemo}
                                disabled={actionLoading === 'seed'}
                                className="flex items-center gap-2 px-4 py-2 bg-stone-100/50 hover:bg-stone-100 text-stone-600 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95"
                            >
                                <Database className={`w-4 h-4 ${actionLoading === 'seed' ? 'animate-spin' : ''}`} />
                                <span className="font-bold">Seed Data</span>
                            </button>

                            <div className="h-8 w-px bg-stone-200 mx-2"></div>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="group flex items-center gap-2 px-4 py-2 text-stone-500 hover:text-red-600 transition-colors"
                            >
                                <span className="text-sm font-medium group-hover:underline decoration-red-600/30 underline-offset-4">Hætta</span>
                                <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Navigation Tabs */}
                    <div className="flex items-center gap-1 md:gap-2 pb-0 overflow-x-auto no-scrollbar [mask-image:linear-gradient(to_right,transparent,black_10px,black_calc(100%-10px),transparent)]">
                        {/* Primary Tabs */}
                        {[
                            { id: 'overview', icon: LayoutDashboard, label: 'Yfirlit' },
                            { id: 'houses', icon: Home, label: 'Hús' },
                            { id: 'users', icon: Users, label: 'Notendur' },
                            { id: 'analytics', icon: BarChart2, label: 'Greining' },
                            { id: 'integrations', icon: Settings, label: 'Tengingar' },
                            { id: 'coupons', icon: Tag, label: 'Afslættir' },
                            { id: 'contacts', icon: Mail, label: 'Samskipti' },
                            { id: 'newsletter', icon: Send, label: 'Póstlisti' }
                        ].map(tab => (
                            <button
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
                                <tab.icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110 text-amber' : 'group-hover:scale-110'}`} />
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
            <div className="p-4 md:p-8">
                {/* Analytics Tab */}
                {activeTab === 'analytics' && <AnalyticsDashboard />}

                {/* Overview Tab */}
                {activeTab === 'overview' && (() => {
                    // Calculate metrics locally for display
                    const trialHouses = stats.allHouses.filter(h =>
                        (h as any).subscription_status === 'trial' || !(h as any).subscription_active
                    );
                    const activeHousesCount = stats.totalHouses - trialHouses.length;

                    // Trials expiring soon
                    const now = new Date();
                    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
                    const expiringTrials = trialHouses.filter(h => {
                        const trialEnd = (h as any).trial_end;
                        if (!trialEnd) return false;
                        const endDate = trialEnd.toDate ? trialEnd.toDate() : new Date(trialEnd);
                        return endDate <= threeDaysFromNow && endDate >= now;
                    });

                    // MRR Calculation
                    const demoHouseNames = ['Sumarbústaður við Þingvallavatn', 'Demo House'];
                    const paidHouses = stats.allHouses.filter(h =>
                        !demoHouseNames.includes(h.name || '') &&
                        ((h as any).subscription_status === 'active' || (h as any).subscription_active)
                    );
                    const estimatedMRR = paidHouses.length * 1990;

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
                                    <div className="flex items-center gap-2 text-[10px] md:text-xs text-stone-400">
                                        <span className="text-green-600 font-medium">{activeHousesCount} virk</span>
                                        <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                                        <span>{trialHouses.length} prufa</span>
                                    </div>
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
                                    <p className="text-[10px] md:text-xs text-stone-400">
                                        {stats.totalHouses > 0 ? (stats.totalUsers / stats.totalHouses).toFixed(1) : 0} að meðaltali
                                    </p>
                                </div>

                                {/* Trials Expiring */}
                                <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                                            <Activity className="w-4 h-4 text-amber" />
                                        </div>
                                        <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Rennur út</p>
                                    </div>
                                    <p className="text-2xl md:text-4xl font-serif font-bold text-charcoal mb-1">{expiringTrials.length}</p>
                                    <p className={`text-[10px] md:text-xs font-medium ${expiringTrials.length > 0 ? 'text-amber' : 'text-green-600'}`}>
                                        {expiringTrials.length > 0 ? 'Aðgerð nauðsynleg' : 'Allt í lagi'}
                                    </p>
                                </div>

                                {/* MRR */}
                                <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                        </div>
                                        <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">MRR</p>
                                    </div>
                                    <p className="text-2xl md:text-4xl font-serif font-bold text-charcoal mb-1 tracking-tight">
                                        {estimatedMRR.toLocaleString('is-IS')}
                                    </p>
                                    <p className="text-[10px] md:text-xs text-stone-400">
                                        {paidHouses.length} greiðandi hús
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
                                    <p className="text-[10px] md:text-xs text-stone-400">
                                        Væntanlegir viðskiptavinir
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
                                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'house' ? 'bg-amber/10 text-amber' : 'bg-blue-50 text-blue-600'
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
                        </div>
                    );
                })()}

                {/* Houses Tab Start */}

                {/* Houses Tab */}
                {
                    activeTab === 'houses' && (
                        <div className="space-y-6">
                            {/* Desktop Table */}
                            <div className="hidden md:block bg-white border border-stone-200 rounded-lg p-6">
                                <h2 className="text-lg font-serif font-semibold mb-6">Húsaskrá</h2>
                                <DataTable
                                    columns={[
                                        { key: 'name', label: 'Nafn hús', sortable: true },
                                        {
                                            key: 'subscription_status',
                                            label: 'Staða',
                                            render: (row) => {
                                                const status = row.subscription_status || 'trial';
                                                const statusLabels = { free: 'Frítt', active: 'Virkt', trial: 'Prufa', expired: 'Útrunnið' };
                                                const colors = {
                                                    free: 'bg-green-100 text-green-700 border-green-200',
                                                    active: 'bg-blue-100 text-blue-700 border-blue-200',
                                                    trial: 'bg-amber-100 text-amber-700 border-amber-200',
                                                    expired: 'bg-red-100 text-red-700 border-red-200'
                                                };
                                                return (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border uppercase ${colors[status] || colors.trial}`}>
                                                        {statusLabels[status] || statusLabels.trial}
                                                    </span>
                                                );
                                            }
                                        },
                                        {
                                            key: 'address',
                                            label: 'Staðsetning',
                                            sortable: true,
                                            render: (row) => row.address || '—'
                                        },
                                        {
                                            key: 'days_left',
                                            label: 'Dagar eftir',
                                            render: (row) => {
                                                if (row.subscription_status === 'free') return <span className="text-green-600 font-bold uppercase text-[10px]">Lifetime</span>;
                                                if (row.subscription_status === 'active') return <span className="text-blue-600 font-bold uppercase text-[10px]">Subscribed</span>;

                                                if (!row.subscription_end) return <span className="text-stone-400">—</span>;

                                                const now = new Date();
                                                const endDate = (row.subscription_end as any).toDate ? (row.subscription_end as any).toDate() : new Date(row.subscription_end);
                                                const diffTime = endDate.getTime() - now.getTime();
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                if (diffDays <= 0) return <span className="text-red-600 font-bold">Expired</span>;
                                                if (diffDays <= 3) return <span className="text-amber-600 font-bold">{diffDays} dagar!</span>;
                                                return <span className="text-stone-600">{diffDays} dagar</span>;
                                            }
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
                                                onClick={() => handleExtendTrial(row.id!)}
                                                disabled={actionLoading === row.id}
                                                className="px-3 py-1.5 text-xs font-medium border border-amber/30 text-amber hover:bg-amber hover:text-charcoal rounded transition-colors disabled:opacity-50"
                                                title="Lengja prufu"
                                            >
                                                {actionLoading === row.id ? 'Lengja...' : 'Lengja prufu'}
                                            </button>
                                            <button
                                                onClick={() => handleToggleFree(row.id!)}
                                                disabled={actionLoading === row.id}
                                                className={`px-3 py-1.5 text-xs font-bold border rounded transition-colors disabled:opacity-50 ${row.subscription_status === 'free'
                                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                    : 'border-green-200 text-green-600 hover:bg-green-50'
                                                    }`}
                                                title={row.subscription_status === 'free' ? 'Afturkalla frítt' : 'Veita frítt'}
                                            >
                                                {row.subscription_status === 'free' ? 'Afturkalla' : 'Veita frítt'}
                                            </button>
                                            <button
                                                onClick={() => setEditingHouse(row)}
                                                className="p-1 hover:bg-stone-100 rounded"
                                                title="Breyta"
                                            >
                                                <Edit className="w-4 h-4 text-stone-500" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteHouse(row.id!)}
                                                disabled={actionLoading === row.id}
                                                className="p-1 hover:bg-red-100 rounded disabled:opacity-50"
                                                title="Eyða húsi"
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
                                {stats.allHouses.map((house) => {
                                    const status = house.subscription_status || 'trial';
                                    const statusLabels = { free: 'Frítt', active: 'Virkt', trial: 'Prufa', expired: 'Útrunnið' };
                                    const colors = {
                                        free: 'bg-green-100 text-green-700 border-green-200',
                                        active: 'bg-blue-100 text-blue-700 border-blue-200',
                                        trial: 'bg-amber-100 text-amber-700 border-amber-200',
                                        expired: 'bg-red-100 text-red-700 border-red-200'
                                    };

                                    // Calculate days left
                                    let daysLeftDisplay = null;
                                    if (status === 'free') daysLeftDisplay = <span className="text-green-600 font-bold uppercase text-[10px]">Lifetime</span>;
                                    else if (status === 'active') daysLeftDisplay = <span className="text-blue-600 font-bold uppercase text-[10px]">Subscribed</span>;
                                    else if (house.subscription_end) {
                                        const now = new Date();
                                        const endDate = (house.subscription_end as any).toDate ? (house.subscription_end as any).toDate() : new Date(house.subscription_end);
                                        const diffTime = endDate.getTime() - now.getTime();
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                        if (diffDays <= 0) daysLeftDisplay = <span className="text-red-600 font-bold text-xs">Expired</span>;
                                        else if (diffDays <= 3) daysLeftDisplay = <span className="text-amber-600 font-bold text-xs">{diffDays} dagar!</span>;
                                        else daysLeftDisplay = <span className="text-stone-600 text-xs">{diffDays} dagar</span>;
                                    }

                                    return (
                                        <div key={house.id} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-serif font-bold text-lg text-charcoal">{house.name}</h3>
                                                    <p className="text-sm text-stone-500 flex items-center gap-1 mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {house.address || 'Engin staðsetning'}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase ${colors[status] || colors.trial}`}>
                                                    {statusLabels[status] || statusLabels.trial}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                <div>
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Stjórnandi</p>
                                                    <p className="font-medium truncate">{stats.allUsers.find(u => u.uid === house.manager_id)?.email || '—'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Dagar eftir</p>
                                                    <div>{daysLeftDisplay}</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-3 border-t border-stone-100">
                                                <button
                                                    onClick={() => handleExtendTrial(house.id!)}
                                                    disabled={actionLoading === house.id}
                                                    className="flex-1 px-3 py-2 text-xs font-semibold bg-amber/10 text-amber border border-amber/20 rounded-lg hover:bg-amber hover:text-charcoal transition-colors"
                                                >
                                                    Lengja prufu
                                                </button>
                                                <button
                                                    onClick={() => setEditingHouse(house)}
                                                    className="px-3 py-2 bg-stone-100 text-stone-600 rounded-lg"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteHouse(house.id!)}
                                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                }

                {/* Coupons Tab */}
                {
                    activeTab === 'coupons' && (
                        <div className="space-y-8">
                            {/* Create Coupon Form */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-amber" />
                                    Búa til nýjan afsláttarkóða
                                </h3>
                                <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-stone-500 mb-1">Kóði</label>
                                        <input
                                            type="text"
                                            required
                                            className="input uppercase"
                                            placeholder="SUMAR2025"
                                            value={newCoupon.code}
                                            onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-stone-500 mb-1">Tegund</label>
                                        <select
                                            className="input"
                                            value={newCoupon.discount_type}
                                            onChange={e => setNewCoupon({ ...newCoupon, discount_type: e.target.value as 'percent' | 'fixed' })}
                                        >
                                            <option value="percent">Prósenta (%)</option>
                                            <option value="fixed">Fast upphæð (kr)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-stone-500 mb-1">Gildi</label>
                                        <input
                                            type="number"
                                            required
                                            className="input"
                                            placeholder="20"
                                            value={newCoupon.discount_value || ''}
                                            onChange={e => setNewCoupon({ ...newCoupon, discount_value: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-stone-500 mb-1">Hámarks notkun (0 = ótakmarkað)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            placeholder="0"
                                            value={newCoupon.max_uses || ''}
                                            onChange={e => setNewCoupon({ ...newCoupon, max_uses: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <button
                                            type="submit"
                                            className="btn btn-primary w-full h-[42px] flex items-center justify-center gap-2"
                                            disabled={actionLoading === 'create-coupon'}
                                        >
                                            {actionLoading === 'create-coupon' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Búa til'}
                                        </button>
                                    </div>
                                    <div className="md:col-span-5">
                                        <label className="block text-xs font-bold text-stone-500 mb-1">Lýsing (innri)</label>
                                        <input
                                            type="text"
                                            required
                                            className="input"
                                            placeholder="Summer campaign for Facebook ads"
                                            value={newCoupon.description}
                                            onChange={e => setNewCoupon({ ...newCoupon, description: e.target.value })}
                                        />
                                    </div>
                                </form>
                            </div>

                            {/* Coupons Table */}
                            <div>
                                <h2 className="text-2xl font-serif mb-6">Virkir afsláttarkóðar</h2>
                                <DataTable
                                    columns={[
                                        { key: 'code', label: 'Kóði', render: r => <span className="font-mono font-bold">{r.code}</span> },
                                        {
                                            key: 'discount',
                                            label: 'Afsláttur',
                                            render: r => r.discount_type === 'percent' ? `${r.discount_value}%` : `${r.discount_value} kr`
                                        },
                                        { key: 'description', label: 'Lýsing' },
                                        {
                                            key: 'usage',
                                            label: 'Notkun',
                                            render: r => `${r.used_count} / ${r.max_uses || '∞'}`
                                        },
                                        {
                                            key: 'created_at',
                                            label: 'Búið til',
                                            render: (row) => {
                                                if (!row.created_at) return '—';
                                                const date = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
                                                return date.toLocaleDateString('is-IS');
                                            }
                                        }
                                    ]}
                                    data={stats.allCoupons}
                                    searchKeys={['code', 'description']}
                                    actions={(row) => (
                                        <button
                                            onClick={() => handleDeleteCoupon(row.id)}
                                            className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-50"
                                        >
                                            Eyða
                                        </button>
                                    )}
                                />
                            </div>
                        </div>
                    )
                }


                {/* Users Tab */}
                {
                    activeTab === 'users' && (
                        <div className="space-y-6">
                            {/* Desktop Table */}
                            <div className="hidden md:block bg-white border border-stone-200 rounded-lg p-6">
                                <h2 className="text-lg font-serif font-semibold mb-6">Notendaskrá</h2>
                                <DataTable
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
                                                onClick={() => handleImpersonate(row)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-amber/30 text-amber hover:bg-amber hover:text-charcoal rounded transition-colors"
                                            >
                                                <UserCog className="w-3 h-3" />
                                                Líkja eftir
                                            </button>
                                            <button
                                                onClick={() => handleSyncName(row)}
                                                disabled={actionLoading === `sync-name-${row.uid}`}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Samstilla nafn í öllu kerfinu"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${actionLoading === `sync-name-${row.uid}` ? 'animate-spin' : ''}`} />
                                                Sync
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(row)}
                                                disabled={actionLoading === `delete-user-${row.uid}`}
                                                className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded transition-colors"
                                                title="Eyða notanda"
                                            >
                                                {actionLoading === `delete-user-${row.uid}` ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
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
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Hús</p>
                                                    <p className="font-mono">{user.house_ids?.length || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Skráður</p>
                                                    <p className="font-mono text-xs">{timestamp.toLocaleDateString('is-IS')}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => handleImpersonate(user)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber/10 text-amber border border-amber/20 rounded-lg text-xs font-bold hover:bg-amber hover:text-charcoal transition-colors"
                                                >
                                                    <UserCog className="w-3 h-3" />
                                                    Líkja eftir
                                                </button>
                                                <button
                                                    onClick={() => handleSyncName(user)}
                                                    className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${actionLoading === `sync-name-${user.uid}` ? 'animate-spin' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-lg"
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
                    activeTab === 'contacts' && (
                        <div>
                            <h2 className="text-2xl font-serif mb-6">Samskipti frá síðu</h2>
                            <DataTable
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

                {/* Integrations Tab */}
                {
                    activeTab === 'integrations' && (
                        <div className="max-w-4xl space-y-6">
                            <h2 className="text-2xl font-serif mb-6">Integrations</h2>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <div className="w-8 h-8 rounded bg-[#101010] flex items-center justify-center text-white font-mono text-xs">P</div>
                                        Payday.is
                                    </h3>
                                    {paydayStatus?.success && (
                                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Connected
                                        </span>
                                    )}
                                </div>

                                <p className="text-stone-600 mb-6 text-sm">
                                    Connect to Payday to automatically generate invoices. This integration uses Client Credentials flow (Server-to-Server).
                                </p>

                                <div className="bg-stone-50 p-4 rounded mb-6 font-mono text-xs text-stone-500 border border-stone-100">
                                    <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                                        <span className="font-bold">Client ID:</span>
                                        <span className="text-charcoal bg-white px-2 py-1 rounded border border-stone-200 inline-block w-fit">
                                            {import.meta.env.VITE_PAYDAY_CLIENT_ID ? `${import.meta.env.VITE_PAYDAY_CLIENT_ID.substring(0, 10)}...` : 'Missing ❌'}
                                        </span>
                                        <span className="font-bold">Auth Method:</span>
                                        <span className="text-charcoal">Client Credentials (Secret Key)</span>

                                        <span className="font-bold mt-2">Plan (Monthly):</span>
                                        <span className="text-charcoal bg-white px-2 py-1 rounded border border-stone-200 inline-block w-fit mt-2">
                                            {import.meta.env.VITE_PAYDAY_PLAN_MONTHLY || '004'}
                                        </span>
                                        <span className="font-bold mt-2">Plan (Annual):</span>
                                        <span className="text-charcoal bg-white px-2 py-1 rounded border border-stone-200 inline-block w-fit mt-2">
                                            {import.meta.env.VITE_PAYDAY_PLAN_ANNUAL || '005'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleTestPayday}
                                    disabled={actionLoading === 'payday-test'}
                                    className="btn btn-secondary flex items-center gap-2"
                                >
                                    {actionLoading === 'payday-test' ? <div className="w-4 h-4 border-2 border-stone-500/30 border-t-stone-500 rounded-full animate-spin" /> : <Activity className="w-4 h-4" />}
                                    {paydayStatus?.success ? 'Test Connection Again' : 'Test Connection'}
                                </button>

                                {paydayStatus && (
                                    <div className={`mt-4 p-4 rounded text-sm border ${paydayStatus.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        <div className="flex items-center gap-2 font-bold mb-1">
                                            {paydayStatus.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            {paydayStatus.success ? 'Success' : 'Connection Failed'}
                                        </div>
                                        {paydayStatus.message}
                                    </div>
                                )}

                                {/* Invoice Test Section */}
                                {paydayStatus?.success && (
                                    <div className="mt-8 pt-8 border-t border-stone-200">
                                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                            <Send className="w-5 h-5 text-amber" />
                                            Test Invoice Creation
                                        </h4>
                                        <p className="text-stone-600 text-sm mb-4">
                                            Create a test invoice for a house to verify the full integration.
                                        </p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-stone-500 mb-2">Select House</label>
                                                <select
                                                    className="input"
                                                    value={selectedHouseForInvoice}
                                                    onChange={(e) => setSelectedHouseForInvoice(e.target.value)}
                                                >
                                                    <option value="">-- Veldu hús --</option>
                                                    {stats.allHouses.map(house => {
                                                        const manager = stats.allUsers.find(u => u.uid === house.manager_id);
                                                        return (
                                                            <option key={house.id} value={house.id}>
                                                                {house.name} ({manager?.email || 'No email'})
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>

                                            <button
                                                onClick={handleTestInvoice}
                                                disabled={actionLoading === 'invoice-test' || !selectedHouseForInvoice}
                                                className="btn btn-primary flex items-center gap-2"
                                            >
                                                {actionLoading === 'invoice-test' ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                                {actionLoading === 'invoice-test' ? 'Creating Invoice...' : 'Create Test Invoice'}
                                            </button>

                                            {invoiceTestResult && (
                                                <div className={`p-4 rounded text-sm border ${invoiceTestResult.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                    <div className="flex items-center gap-2 font-bold mb-2">
                                                        {invoiceTestResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                        {invoiceTestResult.success ? 'Invoice Created!' : 'Failed'}
                                                    </div>
                                                    <p className="mb-2">{invoiceTestResult.message}</p>
                                                    {invoiceTestResult.invoice && (
                                                        <div className="mt-3 pt-3 border-t border-green-200 font-mono text-xs">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <span className="text-green-600">Invoice ID:</span>
                                                                <span className="font-bold">{invoiceTestResult.invoice.id || 'N/A'}</span>
                                                                <span className="text-green-600">Amount:</span>
                                                                <span className="font-bold">{invoiceTestResult.invoice.total || invoiceTestResult.invoice.amount || '4,490'} kr</span>
                                                                <span className="text-green-600">Status:</span>
                                                                <span className="font-bold">{invoiceTestResult.invoice.status || 'Sent'}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    )
                }
                {/* Newsletter Tab */}
                {
                    activeTab === 'newsletter' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-serif">Póstlisti</h2>
                                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold border border-blue-100">
                                    {stats.totalSubscribers} skráðir
                                </div>
                            </div>

                            <DataTable
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
                                        label: '',
                                        render: (row) => (
                                            <button
                                                onClick={async () => {
                                                    if (!confirm(`Eyða ${row.email} af póstlista?`)) return;
                                                    await deleteDoc(doc(db, 'newsletter_subscribers', row.id));
                                                    setStats(prev => ({
                                                        ...prev,
                                                        allSubscribers: prev.allSubscribers.filter(s => s.id !== row.id),
                                                        totalSubscribers: prev.totalSubscribers - 1
                                                    }));
                                                }}
                                                className="text-stone-400 hover:text-red-500 transition-colors p-1"
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
                    activeTab === 'emails' && (
                        <div className="max-w-4xl space-y-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-serif">Email Templates</h2>
                                <button onClick={fetchTemplates} className="btn btn-ghost btn-sm">Refresh</button>
                            </div>

                            {templates.length === 0 && !loading ? (
                                <div className="text-center py-12 bg-white rounded-lg border border-stone-200">
                                    <p className="text-stone-500 mb-4">No templates found.</p>
                                    <button onClick={handleSeedTemplates} className="btn btn-secondary">
                                        Seed Default Templates
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
                                                                <CheckCircle className="w-3 h-3" /> Active
                                                            </span>
                                                        ) : (
                                                            <span className="bg-stone-100 text-stone-500 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                                <XCircle className="w-3 h-3" /> Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-stone-500 mt-1">{tpl.description}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSendTestEmail(tpl)}
                                                        disabled={actionLoading === `test-email-${tpl.id}`}
                                                        className="btn btn-ghost btn-sm text-stone-500 hover:text-amber border border-stone-200"
                                                        title="Senda prufupóst á sjálfan þig"
                                                    >
                                                        {actionLoading === `test-email-${tpl.id}` ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Send className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingTemplate(tpl)}
                                                        className="btn btn-secondary btn-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="text-sm">
                                                    <span className="font-bold text-stone-700">Subject:</span> {tpl.subject}
                                                </div>
                                                {tpl.variables && tpl.variables.length > 0 && (
                                                    <div className="text-sm">
                                                        <span className="font-bold text-stone-700">Variables:</span>
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
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                                        <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50 rounded-t-lg">
                                            <h3 className="font-bold text-xl">Edit Template: {editingTemplate.id}</h3>
                                            <button onClick={() => setEditingTemplate(null)} className="text-stone-400 hover:text-stone-600">
                                                <XCircle className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                            <div className="flex items-center gap-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                                                <div className="flex-1">
                                                    <strong>Status:</strong> {editingTemplate.active ? 'Ready to Send' : 'Draft (Not sending)'}
                                                </div>
                                                <button
                                                    onClick={() => setEditingTemplate({ ...editingTemplate, active: !editingTemplate.active })}
                                                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${editingTemplate.active ? 'bg-green-600 text-white' : 'bg-stone-300 text-stone-600'}`}
                                                >
                                                    {editingTemplate.active ? 'Active' : 'Set Active'}
                                                </button>
                                            </div>

                                            <div>
                                                <label className="label">Subject Line</label>
                                                <input
                                                    type="text"
                                                    className="input font-bold"
                                                    value={editingTemplate.subject}
                                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                                />
                                            </div>

                                            <div className="flex-1 flex flex-col">
                                                <label className="label flex justify-between">
                                                    <span>HTML Content</span>
                                                    <span className="text-xs font-normal text-stone-500">Supports standard HTML tags</span>
                                                </label>
                                                <textarea
                                                    className="input font-mono text-xs leading-relaxed min-h-[300px]"
                                                    value={editingTemplate.html_content}
                                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, html_content: e.target.value })}
                                                />
                                            </div>

                                            <div className="bg-stone-100 p-4 rounded text-xs">
                                                <strong>Available Variables:</strong> {editingTemplate.variables?.map(v => `{${v}}`).join(', ') || 'None'}
                                            </div>
                                        </div>

                                        <div className="p-6 border-t border-stone-200 bg-stone-50 rounded-b-lg flex justify-between items-center">
                                            <button
                                                onClick={() => handleSendTestEmail(editingTemplate)}
                                                disabled={actionLoading === `test-email-${editingTemplate.id}`}
                                                className="btn btn-ghost text-amber hover:bg-amber/5 font-bold flex items-center gap-2"
                                            >
                                                {actionLoading === `test-email-${editingTemplate.id}` ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                                {actionLoading === `test-email-${editingTemplate.id}` ? 'Sending...' : 'Send Test to Me'}
                                            </button>
                                            <div className="flex gap-3">
                                                <button onClick={() => setEditingTemplate(null)} className="btn btn-ghost">Cancel</button>
                                                <button
                                                    onClick={() => handleSaveTemplate(editingTemplate)}
                                                    className="btn btn-primary"
                                                    disabled={actionLoading === 'saving-template'}
                                                >
                                                    {actionLoading === 'saving-template' ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Edit House Modal */}
                {
                    editingHouse && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                                <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50 rounded-t-lg">
                                    <h3 className="font-bold text-xl">Breyta húsi</h3>
                                    <button onClick={() => setEditingHouse(null)} className="text-stone-400 hover:text-stone-600">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase">Nafn húss</label>
                                        <input
                                            type="text"
                                            className="input mt-1"
                                            value={editingHouse.name}
                                            onChange={e => setEditingHouse({ ...editingHouse, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase">Heimilisfang</label>
                                        <input
                                            type="text"
                                            className="input mt-1"
                                            value={editingHouse.address || ''}
                                            onChange={e => setEditingHouse({ ...editingHouse, address: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase">Stjórnandi (UID)</label>
                                        <input
                                            type="text"
                                            className="input mt-1 font-mono text-xs"
                                            value={editingHouse.manager_id}
                                            onChange={e => setEditingHouse({ ...editingHouse, manager_id: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase">Áskriftar staða</label>
                                        <select
                                            className="input mt-1"
                                            value={editingHouse.subscription_status || 'trial'}
                                            onChange={e => setEditingHouse({ ...editingHouse, subscription_status: e.target.value as any })}
                                        >
                                            <option value="trial">Trial</option>
                                            <option value="active">Active</option>
                                            <option value="free">Free (Lifetime)</option>
                                            <option value="expired">Expired</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-stone-200 bg-stone-50 rounded-b-lg flex justify-end gap-3">
                                    <button onClick={() => setEditingHouse(null)} className="btn btn-ghost">Hætta við</button>
                                    <button
                                        onClick={() => handleUpdateHouse(editingHouse)}
                                        className="btn btn-primary"
                                        disabled={actionLoading === 'updating-house'}
                                    >
                                        {actionLoading === 'updating-house' ? 'Vistar...' : 'Vista breytingar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Reply to Contact Modal */}
                {
                    replyingTo && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                                <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50 rounded-t-lg">
                                    <h3 className="font-bold text-xl font-serif">Svara Erindi</h3>
                                    <button onClick={() => setReplyingTo(null)} className="text-stone-400 hover:text-stone-600">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {/* Original Message */}
                                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-charcoal">{replyingTo.name}</div>
                                            <div className="text-xs text-stone-500">{new Date(replyingTo.created_at).toLocaleString('is-IS')}</div>
                                        </div>
                                        <div className="text-sm text-stone-600 mb-2 font-mono text-xs">{replyingTo.email}</div>
                                        <p className="text-stone-800 whitespace-pre-wrap">{replyingTo.message}</p>
                                    </div>

                                    {/* Previous Replies */}
                                    {replyingTo.replies && replyingTo.replies.length > 0 && (
                                        <div className="pl-6 border-l-2 border-stone-200 space-y-4">
                                            <h5 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Samskiptasaga</h5>
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
                                        <label className="text-xs font-bold text-stone-500 uppercase mb-2 block">Svar</label>
                                        <textarea
                                            className="w-full h-40 p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent font-sans"
                                            placeholder="Skrifaðu svar..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="p-6 border-t border-stone-200 bg-stone-50 rounded-b-lg flex justify-end gap-3">
                                    <button onClick={() => setReplyingTo(null)} className="btn btn-ghost">Loka</button>
                                    <button
                                        onClick={handleSendReply}
                                        className="btn btn-primary flex items-center gap-2"
                                        disabled={actionLoading === 'sending-reply' || !replyText.trim()}
                                    >
                                        {actionLoading === 'sending-reply' ? 'Sendi...' : 'Senda Svar'}
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

            </div >
        </AdminLayout >
    );
}
