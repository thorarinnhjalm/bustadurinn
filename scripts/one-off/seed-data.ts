import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  }),
});

const db = getFirestore(app);

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // ============================================
    // 1. Create Test Organization (Íslandsbanki)
    // ============================================
    console.log('Creating organization: Íslandsbanki...');

    const orgId = 'islandsbanki';
    const orgRef = db.collection('organizations').doc(orgId);

    await orgRef.set({
      id: orgId,
      name: 'Íslandsbanki',
      slug: 'islandsbanki',
      type: 'company',
      logo_url: 'https://www.islandsbanki.is/logo.png',
      primary_color: '#003D5C',
      secondary_color: '#00A3E0',
      subscription_tier: 'pro',
      subscription_status: 'trial',
      subscription_start: Timestamp.now(),
      subscription_end: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
      billing_email: 'billing@islandsbanki.is',
      settings: {
        require_access_approval: true,
        auto_approve_company_email: true,
        allowed_email_domains: ['islandsbanki.is'],
        require_booking_approval: true,
        payment_required: true,
        payment_method: 'payroll',
        price_per_night: 5000,
        max_nights_per_booking: 14,
        max_bookings_per_year: 2,
        advance_booking_days: 365,
      },
      admin_user_ids: ['admin1', 'admin2'],
      stats: {
        total_properties: 3,
        total_members: 450,
        active_members: 380,
        total_bookings: 0,
      },
      created_at: Timestamp.now(),
      created_by: 'system',
      updated_at: Timestamp.now(),
    });

    console.log('✅ Organization created\n');

    // ============================================
    // 2. Create Houses
    // ============================================
    console.log('Creating houses...');

    const houses = [
      {
        id: 'house-1',
        name: 'Þingvallahús',
        address: 'Þingvöllum 1, 801 Selfoss',
        location: { lat: 64.2558, lng: -21.1308 },
        organization_id: orgId,
        organization_name: 'Íslandsbanki',
        capacity: 8,
        bedrooms: 4,
        bathrooms: 2,
        square_meters: 120,
        image_url: 'https://example.com/thingvellir.jpg',
        amenities: ['WiFi', 'Hot Tub', 'BBQ', 'Lake View', 'Fishing'],
        house_rules: 'No smoking. No pets. Check-out cleaning required.',
        check_in_time: '16:00',
        check_out_time: '12:00',
        min_nights: 2,
        max_nights: 14,
        created_at: Timestamp.now(),
        created_by: 'system',
        updated_at: Timestamp.now(),
      },
      {
        id: 'house-2',
        name: 'Skaftafellshús',
        address: 'Skaftafelli 5, 785 Öræfi',
        location: { lat: 64.0167, lng: -16.9667 },
        organization_id: orgId,
        organization_name: 'Íslandsbanki',
        capacity: 6,
        bedrooms: 3,
        bathrooms: 1,
        square_meters: 90,
        image_url: 'https://example.com/skaftafell.jpg',
        amenities: ['WiFi', 'Fireplace', 'Hiking Trails', 'Mountain View'],
        house_rules: 'No smoking. Outdoor shoes off inside.',
        check_in_time: '15:00',
        check_out_time: '11:00',
        min_nights: 3,
        max_nights: 10,
        created_at: Timestamp.now(),
        created_by: 'system',
        updated_at: Timestamp.now(),
      },
      {
        id: 'house-3',
        name: 'Mývatnssteinn',
        address: 'Mývatni 12, 660 Mývatn',
        location: { lat: 65.6292, lng: -16.9175 },
        organization_id: orgId,
        organization_name: 'Íslandsbanki',
        capacity: 10,
        bedrooms: 5,
        bathrooms: 3,
        square_meters: 150,
        image_url: 'https://example.com/myvatn.jpg',
        amenities: ['WiFi', 'Hot Tub', 'Sauna', 'BBQ', 'Lake View', 'Northern Lights'],
        house_rules: 'No smoking. No parties. Respect quiet hours 22:00-08:00.',
        check_in_time: '16:00',
        check_out_time: '12:00',
        min_nights: 2,
        max_nights: 14,
        created_at: Timestamp.now(),
        created_by: 'system',
        updated_at: Timestamp.now(),
      },
    ];

    for (const house of houses) {
      await db.collection('houses').doc(house.id).set(house);
      console.log(`✅ Created house: ${house.name}`);
    }

    console.log('\n');

    // ============================================
    // 3. Create Access Requests
    // ============================================
    console.log('Creating access requests...');

    const accessRequests = [
      {
        id: 'access-req-1',
        email: 'jon.jonsson@islandsbanki.is',
        name: 'Jón Jónsson',
        employee_id: 'IB-1234',
        department: 'IT',
        phone: '+354 555 1234',
        reason: 'Starfsmaður í IT deild, vil bóka sumarhús fyrir fjölskylduna',
        status: 'pending',
        email_domain_verified: true,
        employee_id_verified: false,
        requested_at: Timestamp.now(),
        ip_address: '192.168.1.100',
      },
      {
        id: 'access-req-2',
        email: 'gudrun.gudmunds@islandsbanki.is',
        name: 'Guðrún Guðmundsdóttir',
        employee_id: 'IB-5678',
        department: 'Marketing',
        phone: '+354 555 5678',
        reason: 'Starfsmaður í markaðsdeild',
        status: 'pending',
        email_domain_verified: true,
        employee_id_verified: false,
        requested_at: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
        ip_address: '192.168.1.101',
      },
    ];

    for (const request of accessRequests) {
      await orgRef.collection('access_requests').doc(request.id).set(request);
      console.log(`✅ Created access request: ${request.name}`);
    }

    console.log('\n');

    // ============================================
    // 4. Create Approved Members
    // ============================================
    console.log('Creating members...');

    const members = [
      {
        id: 'member-1',
        user_id: 'user-1',
        email: 'sigurdur.sigurdsson@islandsbanki.is',
        name: 'Sigurður Sigurðsson',
        employee_id: 'IB-1111',
        department: 'Finance',
        hire_date: Timestamp.fromDate(new Date('2020-01-15')),
        status: 'active',
        access_level: 'full',
        approved_by: 'admin1',
        approved_at: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
        approval_method: 'manual',
        bookings_this_year: 0,
        bookings_total: 3,
        days_booked_this_year: 0,
        last_booking_date: Timestamp.fromDate(new Date('2025-08-15')),
        payment_balance: 0,
        total_paid: 45000,
        created_at: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
        updated_at: Timestamp.now(),
      },
      {
        id: 'member-2',
        user_id: 'user-2',
        email: 'anna.arnardottir@islandsbanki.is',
        name: 'Anna Arnardóttir',
        employee_id: 'IB-2222',
        department: 'HR',
        hire_date: Timestamp.fromDate(new Date('2019-03-01')),
        status: 'active',
        access_level: 'full',
        approved_by: 'admin1',
        approved_at: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)), // 15 days ago
        approval_method: 'auto',
        bookings_this_year: 1,
        bookings_total: 5,
        days_booked_this_year: 7,
        last_booking_date: Timestamp.fromDate(new Date('2026-01-20')),
        payment_balance: 0,
        total_paid: 75000,
        created_at: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
        updated_at: Timestamp.now(),
      },
    ];

    for (const member of members) {
      await orgRef.collection('members').doc(member.id).set(member);
      console.log(`✅ Created member: ${member.name}`);
    }

    console.log('\n');

    // ============================================
    // 5. Create Booking Request (Pending)
    // ============================================
    console.log('Creating booking request...');

    const bookingRequest = {
      id: 'booking-req-1',
      user_id: 'user-1',
      user_name: 'Sigurður Sigurðsson',
      user_email: 'sigurdur.sigurdsson@islandsbanki.is',
      house_id: 'house-1',
      house_name: 'Þingvallahús',
      start_date: Timestamp.fromDate(new Date('2026-07-01')),
      end_date: Timestamp.fromDate(new Date('2026-07-08')),
      num_nights: 7,
      num_guests: 6,
      purpose: 'family',
      notes: 'Fjölskyldufrí yfir sumartímann',
      status: 'pending',
      has_conflicts: false,
      quota_check_passed: true,
      payment_required: true,
      payment_amount: 35000,
      payment_method: 'payroll',
      payment_status: 'pending',
      requested_at: Timestamp.now(),
      ip_address: '192.168.1.100',
    };

    await orgRef.collection('booking_requests').doc(bookingRequest.id).set(bookingRequest);
    console.log('✅ Created booking request\n');

    // ============================================
    // 6. Create Confirmed Booking (Past)
    // ============================================
    console.log('Creating confirmed booking...');

    const booking = {
      id: 'booking-1',
      house_id: 'house-2',
      organization_id: orgId,
      user_id: 'user-2',
      user_name: 'Anna Arnardóttir',
      user_email: 'anna.arnardottir@islandsbanki.is',
      start: Timestamp.fromDate(new Date('2026-01-20')),
      end: Timestamp.fromDate(new Date('2026-01-27')),
      num_nights: 7,
      num_guests: 4,
      type: 'family',
      notes: 'Vetrarhátíð með fjölskyldunni',
      status: 'confirmed',
      payment_amount: 35000,
      payment_status: 'paid',
      payment_method: 'payroll',
      paid_at: Timestamp.fromDate(new Date('2026-01-15')),
      approved_by: 'admin1',
      approved_at: Timestamp.fromDate(new Date('2026-01-10')),
      created_from_request_id: 'booking-req-past-1',
      created_at: Timestamp.fromDate(new Date('2026-01-10')),
    };

    await db.collection('houses').doc('house-2').collection('bookings').doc(booking.id).set(booking);
    console.log('✅ Created confirmed booking\n');

    // ============================================
    // 7. Create User Roles
    // ============================================
    console.log('Creating user roles...');

    const userRoles = [
      {
        id: 'user-1',
        is_super_admin: false,
        organization_roles: {
          [orgId]: {
            role: 'member',
            status: 'active',
            member_id: 'member-1',
          },
        },
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      },
      {
        id: 'user-2',
        is_super_admin: false,
        organization_roles: {
          [orgId]: {
            role: 'member',
            status: 'active',
            member_id: 'member-2',
          },
        },
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      },
      {
        id: 'admin1',
        is_super_admin: false,
        organization_roles: {
          [orgId]: {
            role: 'org_admin',
            status: 'active',
            member_id: 'admin-member-1',
          },
        },
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      },
    ];

    for (const role of userRoles) {
      await db.collection('user_roles').doc(role.id).set(role);
      console.log(`✅ Created user role: ${role.id}`);
    }

    console.log('\n');

    // ============================================
    // Summary
    // ============================================
    console.log('🎉 Database seeded successfully!\n');
    console.log('Summary:');
    console.log('- 1 Organization (Íslandsbanki)');
    console.log('- 3 Houses (Þingvallahús, Skaftafellshús, Mývatnssteinn)');
    console.log('- 2 Pending Access Requests');
    console.log('- 2 Active Members');
    console.log('- 1 Pending Booking Request');
    console.log('- 1 Confirmed Booking');
    console.log('- 3 User Roles\n');

    console.log('Next steps:');
    console.log('1. Run your dev server: npm run dev');
    console.log('2. Test the admin dashboard');
    console.log('3. Approve access requests');
    console.log('4. Approve booking requests\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
