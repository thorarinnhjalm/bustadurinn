/**
 * Demo Data Seeder for Bústaðurinn.is
 * Run this to create a fully populated demo house with realistic data
 */

import { db, auth } from '../lib/firebase';
import {
    collection,
    doc,
    setDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Demo Users
const DEMO_USERS = [
    {
        email: 'jon.jonsson@demo.is',
        password: 'Demo123!',
        name: 'Jón Jónsson',
        role: 'manager'
    },
    {
        email: 'gudrun.gudmundsdottir@demo.is',
        password: 'Demo123!',
        name: 'Guðrún Guðmundsdóttir',
        role: 'member'
    },
    {
        email: 'olafur.olafsson@demo.is',
        password: 'Demo123!',
        name: 'Ólafur Ólafsson',
        role: 'member'
    }
];

// Demo House
const DEMO_HOUSE = {
    name: 'Sumarbústaður við Þingvallavatn',
    address: 'Þingvellir, 801 Selfoss',
    wifi_ssid: 'DemoHouse_WiFi',
    wifi_password: 'ThingvellirDemo2025',
    house_rules: `1. Hafðu hvítt sófa hreint - enginn rauðvín!\n2. Vinsamlegast skilja eftir sorphirðu.\n3. Slökkva á öllum ljósum þegar þú ferð.\n4. Njóttu vel og virðu náttúruna!`,
    check_in_time: '15:00',
    check_out_time: '11:00',
    directions: 'Aktu austur á 1, beygðu til hægri við skilti "Þingvellir". Húsið er það bláa á vinstri hönd.',
    access_instructions: 'Lykillinn er í læsta kassanum við hurðina. Kóðinn er 4321.',
    emergency_contact: '+354 555 1234 (Jón Jónsson)',
    created_at: serverTimestamp()
};

// Demo Bookings
const createDemoBookings = (houseId: string, userIds: string[]) => {
    const now = new Date();
    const bookings = [];

    // Past booking
    bookings.push({
        house_id: houseId,
        user_id: userIds[0],
        user_name: 'Jón Jónsson',
        start: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() - 1, 15)),
        end: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() - 1, 17)),
        type: 'personal',
        notes: 'Fjölskylduhelgi',
        created_at: serverTimestamp()
    });

    // Current booking
    bookings.push({
        house_id: houseId,
        user_id: userIds[1],
        user_name: 'Guðrún Guðmundsdóttir',
        start: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)),
        end: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)),
        type: 'personal',
        notes: 'Jólahátíð með börnunum',
        created_at: serverTimestamp()
    });

    // Future booking
    bookings.push({
        house_id: houseId,
        user_id: userIds[2],
        user_name: 'Ólafur Ólafsson',
        start: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 10)),
        end: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 15)),
        type: 'personal',
        notes: 'Vetrarfrí',
        created_at: serverTimestamp()
    });

    return bookings;
};

// Demo Tasks
const createDemoTasks = (houseId: string, userIds: string[]) => {
    return [
        {
            house_id: houseId,
            title: 'Laga skemmd ljósaperu í stofunni',
            description: 'Þessi perur eru til hjá Byko',
            status: 'pending',
            assigned_to: userIds[0],
            assigned_to_name: 'Jón Jónsson',
            due_date: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
            created_at: serverTimestamp()
        },
        {
            house_id: houseId,
            title: 'Mála verönd',
            description: 'Kaupa veðurheldni mál',
            status: 'in_progress',
            assigned_to: userIds[1],
            assigned_to_name: 'Guðrún Guðmundsdóttir',
            due_date: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            created_at: serverTimestamp()
        },
        {
            house_id: houseId,
            title: 'Hreinsa flísar',
            description: '',
            status: 'completed',
            assigned_to: userIds[2],
            assigned_to_name: 'Ólafur Ólafsson',
            completed_at: serverTimestamp(),
            created_at: serverTimestamp()
        }
    ];
};

// Demo Finance Entries
const createDemoFinance = (houseId: string, userIds: string[]) => {
    return [
        {
            house_id: houseId,
            amount: 45000,
            type: 'expense',
            category: 'utilities',
            description: 'Rafmagnreikningur - des 2024',
            date: Timestamp.fromDate(new Date(2024, 11, 15)),
            user_uid: userIds[0],
            paid_by_name: 'Jón Jónsson',
            created_at: serverTimestamp()
        },
        {
            house_id: houseId,
            amount: 12500,
            type: 'expense',
            category: 'maintenance',
            description: 'Ljósaperur og verkfæri',
            date: Timestamp.fromDate(new Date(2024, 11, 20)),
            user_uid: userIds[1],
            paid_by_name: 'Guðrún Guðmundsdóttir',
            created_at: serverTimestamp()
        },
        {
            house_id: houseId,
            amount: 150000,
            type: 'income',
            category: 'rental',
            description: 'Skammtímaleiga - júlí 2024',
            date: Timestamp.fromDate(new Date(2024, 6, 1)),
            user_uid: userIds[0],
            paid_by_name: 'Jón Jónsson',
            created_at: serverTimestamp()
        }
    ];
};

export async function seedDemoData() {
    console.log('🌱 Starting demo data seeding...');

    try {
        // Create demo users
        const userIds: string[] = [];

        for (const demoUser of DEMO_USERS) {
            try {
                const userCred = await createUserWithEmailAndPassword(
                    auth,
                    demoUser.email,
                    demoUser.password
                );

                userIds.push(userCred.user.uid);

                // Create user document
                await setDoc(doc(db, 'users', userCred.user.uid), {
                    uid: userCred.user.uid,
                    email: demoUser.email,
                    name: demoUser.name,
                    house_ids: [], // Will update after house creation
                    created_at: serverTimestamp()
                });

                console.log(`✅ Created user: ${demoUser.name}`);
            } catch (error: any) {
                if (error.code === 'auth/email-already-in-use') {
                    console.log(`⚠️ User ${demoUser.email} already exists`);
                    // You'd need to fetch the existing user ID here
                } else {
                    throw error;
                }
            }
        }

        // Create demo house
        const houseRef = doc(collection(db, 'houses'));
        const houseId = houseRef.id;

        await setDoc(houseRef, {
            ...DEMO_HOUSE,
            id: houseId,
            owner_ids: userIds,
            manager_id: userIds[0] // Jón is the manager
        });

        console.log(`✅ Created demo house: ${DEMO_HOUSE.name}`);

        // Update users with house_id
        for (const userId of userIds) {
            await setDoc(doc(db, 'users', userId), {
                house_ids: [houseId]
            }, { merge: true });
        }

        // Create bookings
        const bookings = createDemoBookings(houseId, userIds);
        for (let i = 0; i < bookings.length; i++) {
            await setDoc(doc(collection(db, 'bookings')), bookings[i]);
        }
        console.log(`✅ Created ${bookings.length} demo bookings`);

        // Create tasks
        const tasks = createDemoTasks(houseId, userIds);
        for (let i = 0; i < tasks.length; i++) {
            await setDoc(doc(collection(db, 'tasks')), tasks[i]);
        }
        console.log(`✅ Created ${tasks.length} demo tasks`);

        // Create finance entries
        const financeEntries = createDemoFinance(houseId, userIds);
        for (let i = 0; i < financeEntries.length; i++) {
            await setDoc(doc(collection(db, 'finance_entries')), financeEntries[i]);
        }
        console.log(`✅ Created ${financeEntries.length} demo finance entries`);

        console.log('\n🎉 Demo data seeding complete!');
        console.log('\n📧 Demo User Credentials:');
        DEMO_USERS.forEach(user => {
            console.log(`   ${user.name} (${user.role})`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${user.password}\n`);
        });

        return {
            success: true,
            houseId,
            userIds,
            users: DEMO_USERS
        };

    } catch (error) {
        console.error('❌ Error seeding demo data:', error);
        throw error;
    }
}
