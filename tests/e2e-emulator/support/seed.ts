import { createAuthUser, getDoc, resetEmulators, setDoc } from './emulator';

export const PASSWORD = 'test-pass-123';
export const A = { uid: 'uidA0000000000000000000000000', email: 'anna@example.test', name: 'Anna Umsjón' };
export const B = { uid: 'uidB0000000000000000000000000', email: 'bjarni@example.test', name: 'Bjarni Meðeigandi' };
export const H1 = 'house-h1';
export const GUEST_TOKEN = 'guest-token-0123456789abcdef';
export const HOUSE_NAME = 'Hóll við vatnið';
/** Tiny inline images so no external image host is ever requested. */
export const PIXEL = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#8aa"/><circle cx="320" cy="240" r="120" fill="#fed"/></svg>'
)}`;

const DAY = 86_400_000;
/** UTC midnight (the browser runs in Atlantic/Reykjavik = UTC, no DST). */
export function midnight(offsetDays = 0): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()) + offsetDays * DAY);
}
export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Seeded booking: from today+7 to today+10 (exclusive checkout), created by A. */
export const SEEDED_BOOKING = { start: midnight(7), end: midnight(10) };
export const THIS_YEAR = new Date().getUTCFullYear();
export const LAST_YEAR = THIS_YEAR - 1;

export async function seed() {
  await resetEmulators();
  for (const u of [A, B]) await createAuthUser(u.uid, u.email, PASSWORD, u.name);
  const now = new Date();

  for (const u of [A, B]) {
    await setDoc(`users/${u.uid}`, {
      uid: u.uid,
      email: u.email,
      name: u.name,
      house_ids: [H1],
      push_prompt_dismissed: true,
      created_at: now,
    });
  }

  await setDoc(`houses/${H1}`, {
    id: H1,
    name: HOUSE_NAME,
    address: 'Hólsvegur 1, 801 Selfoss',
    location: { lat: 64.0, lng: -20.9 },
    owner_ids: [A.uid, B.uid],
    manager_id: A.uid,
    holiday_mode: 'first_come',
    invite_code: 'INVITE1234',
    guest_token: GUEST_TOKEN,
    check_in_time: '15:00',
    check_out_time: '12:00',
    wifi_ssid: 'HollWifi',
    wifi_password: 'leyniord123',
    house_rules: 'Engar skór inni í húsinu.',
    arrival_checklist: ['Kveikja á vatni', 'Opna glugga'],
    checkout_checklist: ['Slökkva á ofnum', 'Taka út rusl'],
    supply_checklist: ['Klósettpappír'],
    subscription_status: 'free',
    created_at: now,
    updated_at: now,
  });

  await setDoc(`houses/${H1}/bookings/seeded-booking`, {
    house_id: H1,
    user_id: A.uid,
    user_name: A.name,
    start: SEEDED_BOOKING.start,
    end: SEEDED_BOOKING.end,
    start_date: ymd(SEEDED_BOOKING.start),
    end_date: ymd(SEEDED_BOOKING.end),
    type: 'personal',
    notes: 'Fyrirfram bókun',
    created_at: now,
  });

  await setDoc(`houses/${H1}/finance_entries/fin-this-year`, {
    house_id: H1,
    type: 'expense',
    amount: 40000,
    category: 'Rafmagn',
    description: 'Rafmagnsreikningur',
    date: new Date(Date.UTC(THIS_YEAR, 0, 15)),
    user_uid: A.uid,
    paid_by_user_id: A.uid,
    paid_by_name: A.name,
    created_at: now,
  });
  await setDoc(`houses/${H1}/finance_entries/fin-last-year`, {
    house_id: H1,
    type: 'income',
    amount: 100000,
    category: 'Mánaðargjald',
    description: 'Innborgun frá fyrra ári',
    date: new Date(Date.UTC(LAST_YEAR, 11, 1)),
    user_uid: A.uid,
    paid_by_user_id: A.uid,
    paid_by_name: A.name,
    created_at: now,
  });

  await setDoc(`houses/${H1}/tasks/task-1`, {
    house_id: H1,
    title: 'Mála pallinn',
    category: 'maintenance',
    status: 'pending',
    priority: 'medium',
    created_by: A.uid,
    created_by_name: A.name,
    assigned_to: [A.uid],
    assigned_to_names: [A.name],
    created_at: now,
    updated_at: now,
  });
  await setDoc(`houses/${H1}/tasks/task-2`, {
    house_id: H1,
    title: 'Laga hliðið',
    category: 'repair',
    status: 'pending',
    priority: 'high',
    created_by: A.uid,
    created_by_name: A.name,
    assigned_to: [B.uid],
    assigned_to_names: [B.name],
    created_at: now,
    updated_at: now,
  });

  await setDoc(`houses/${H1}/shopping_list/shop-1`, {
    house_id: H1,
    item: 'Kaffi',
    checked: false,
    added_by: A.uid,
    added_by_name: A.name,
    created_at: now,
  });

  await setDoc(`houses/${H1}/inventory/inv-1`, {
    house_id: H1,
    name: 'Salt',
    category: 'pantry',
    status: 'ok',
    quantity: '1 pakki',
    created_at: now,
  });

  await setDoc(`guestbook/gb-1`, {
    house_id: H1,
    author: 'Gestur Gestsson',
    message: 'Dásamleg dvöl!',
    created_at: now,
  });

  await setDoc(`guest_views/${GUEST_TOKEN}`, {
    houseId: H1,
    house_name: HOUSE_NAME,
    name: HOUSE_NAME,
    address: 'Hólsvegur 1, 801 Selfoss',
    wifi_ssid: 'HollWifi',
    wifi_password: 'leyniord123',
    house_rules: 'Engar skór inni í húsinu.',
    check_in_time: '15:00',
    check_out_time: '12:00',
    directions: 'Beygðu til vinstri við brúna.',
    amenities: ['hot_tub', 'grill'],
    location: { lat: 64.0, lng: -20.9 },
    image_url: PIXEL,
    gallery_urls: [PIXEL, PIXEL],
    owner_email: A.email,
    created_at: now,
  });
}

export const C = { uid: 'uidC0000000000000000000000000', email: 'cecilia@example.test', name: 'Cecilía Nýskráð' };
export const H2 = 'house-h2';
export const H2_NAME = 'Fjallakofinn';

/**
 * Super admin data on top of seed(): A becomes super_admin; plus a second house, a recently registered
 * user without a house (shows as "Festist?"), a contact submission, feedback, a pending and an active
 * service provider, an organization, newsletter subscribers, an email template and funnel events.
 */
export async function seedSuperAdmin() {
  const now = new Date();
  await setDoc(`user_roles/${A.uid}`, { user_id: A.uid, system_role: 'super_admin', created_at: now });

  await createAuthUser(C.uid, C.email, PASSWORD, C.name);
  await setDoc(`users/${C.uid}`, { uid: C.uid, email: C.email, name: C.name, house_ids: [], created_at: now });

  await setDoc(`houses/${H2}`, {
    id: H2,
    name: H2_NAME,
    address: 'Fjallavegur 3, 840 Laugarvatn',
    location: { lat: 64.2, lng: -20.7 },
    owner_ids: [A.uid],
    manager_id: A.uid,
    subscription_status: 'free',
    created_at: now,
    updated_at: now,
  });

  await setDoc('contact_submissions/contact-1', {
    name: 'Gunnar Gestur',
    email: 'gunnar@example.test',
    message: 'Hæ, hvernig get ég boðið meðeigendum í húsið?',
    status: 'new',
    created_at: now,
  });
  await setDoc('contact_submissions/contact-2', {
    name: 'Halla Fyrirspurn',
    email: 'halla@example.test',
    message: 'Er hægt að flytja gögn á milli húsa?',
    status: 'new',
    created_at: new Date(now.getTime() - 3_600_000),
  });

  await setDoc('feedback/feedback-1', {
    userId: B.uid,
    userName: 'Sigríður Jónsdóttir',
    userEmail: 'sigga@example.test',
    rating: 5,
    comment: 'Frábært kerfi fyrir fjölskylduna',
    canContact: true,
    userAgent: 'Mozilla/5.0 (secret-agent)',
    featured: false,
    createdAt: now,
  });

  await setDoc('service_providers/prov-pending', {
    name: 'Snjómokstur Suðurlands',
    category: 'snow_removal',
    description: 'Mokum allt',
    service_areas: ['Grímsnes'],
    status: 'pending',
    rating_avg: 0,
    rating_count: 0,
    owner_uid: C.uid,
    created_at: now,
  });
  await setDoc('service_provider_contacts/prov-pending', {
    contact_email: 'snjor@example.test',
    contact_phone: '5551234',
    address: 'Selfoss',
    owner_uid: C.uid,
  });
  await setDoc('service_providers/prov-active', {
    name: 'Þrif og þjónusta',
    category: 'cleaning',
    description: 'Þrífum bústaði',
    service_areas: ['Biskupstungur'],
    status: 'active',
    rating_avg: 4.5,
    rating_count: 2,
    owner_uid: B.uid,
    created_at: now,
  });

  await setDoc('organizations/org-sa', {
    name: 'Starfsmannafélag Hólsins',
    slug: 'holl',
    type: 'union',
    admin_user_ids: [B.uid],
    settings: {},
    stats: { total_members: 0, active_members: 0, total_houses: 0, total_bookings: 0, bookings_this_year: 0, total_revenue: 0 },
    created_by: B.uid,
    created_at: now,
    updated_at: now,
  });

  await setDoc('newsletter_subscribers/sub-1', { email: 'frettir@example.test', status: 'active', source: '/', created_at: now });
  await setDoc('newsletter_subscribers/sub-2', { email: 'annad@example.test', status: 'active', source: '/spurt-og-svarad', created_at: new Date(now.getTime() - 60_000) });

  await setDoc('email_templates/welcome', {
    id: 'welcome',
    subject: 'Velkomin í Bústaðurinn.is',
    html_content: '<p>Hæ {name}</p>',
    active: true,
    variables: ['name'],
    description: 'Sent when a user creates their first house.',
  });

  const t0 = now.getTime() - 600_000;
  const ev = (id: string, uid: string, name: string, offsetMs: number, data: Record<string, unknown> = {}) =>
    setDoc(`funnel_events/${id}`, {
      uid,
      event_name: name,
      client_ts: t0 + offsetMs,
      timestamp: new Date(t0 + offsetMs),
      session_id: 'sess-1',
      load_id: 'load-1',
      path: '/signup',
      env: 'production',
      ua: 'Mozilla/5.0 (test)',
      buffered: false,
      data,
    });
  await ev('fe-1', B.uid, 'signup_viewed', 0);
  await ev('fe-2', B.uid, 'signup_completed', 5_000);
  await ev('fe-3', B.uid, 'house_create_error', 9_000, { message: 'boom' });
  await ev('fe-4', C.uid, 'signup_viewed', 0);
  await ev('fe-5', C.uid, 'signup_completed', 3_000);
  await ev('sv-1', 'anon-1', 'sandbox_visited', 0);
  await ev('sv-2', 'anon-2', 'sandbox_visited', 0);
}

export const ORG = 'org-1';
export const ORG_NAME = 'Félag Hólsins';
export const MEMBER_M = { uid: 'uidM0000000000000000000000000', email: 'magnus@example.test', name: 'Magnús Félagi' };
export const REQUESTER_1 = { uid: 'uidR1000000000000000000000000', email: 'rannveig@example.test', name: 'Rannveig Beiðandi' };
export const REQUESTER_2 = { uid: 'uidR2000000000000000000000000', email: 'runar@example.test', name: 'Rúnar Beiðandi' };
export const PENDING_MEMBER = { uid: 'uidP0000000000000000000000000', email: 'petra@example.test', name: 'Petra Biðstaða' };

/**
 * Organization on top of seed(): A administers it (admin_user_ids + a members/{A} doc with role admin),
 * H1 belongs to it, one active member, one pending member, two pending access requests (with user_id)
 * and one pending booking request for H1. B is not part of the organization.
 */
export async function seedOrganization() {
  const now = new Date();
  await setDoc(`organizations/${ORG}`, {
    name: ORG_NAME,
    slug: 'felag-holsins',
    type: 'union',
    admin_user_ids: [A.uid],
    settings: {
      require_access_approval: true,
      auto_approve_company_email: false,
      allowed_email_domains: [],
      require_booking_approval: true,
      payment_required: false,
    },
    stats: { total_properties: 1, total_members: 3, active_members: 2, total_bookings: 0, bookings_this_year: 0, total_revenue: 0 },
    created_by: A.uid,
    created_at: now,
    updated_at: now,
  });
  const member = (u: { uid: string; email: string; name: string }, extra: Record<string, unknown>) =>
    setDoc(`organizations/${ORG}/members/${u.uid}`, {
      user_id: u.uid,
      email: u.email,
      name: u.name,
      department: 'Rekstur',
      bookings_this_year: 0,
      bookings_total: 0,
      days_booked_this_year: 0,
      payment_balance: 0,
      total_paid: 0,
      created_at: now,
      updated_at: now,
      ...extra,
    });
  await member(A, { role: 'admin', status: 'active', access_level: 'full' });
  await member(MEMBER_M, { role: 'member', status: 'active', access_level: 'full' });
  await member(PENDING_MEMBER, { role: 'member', status: 'pending', access_level: 'guest' });

  await setDoc(`houses/${H1}`, { ...((await getDoc(`houses/${H1}`)) ?? {}), organization_id: ORG });

  const request = (id: string, u: { uid: string; email: string; name: string }, offsetMs: number) =>
    setDoc(`organizations/${ORG}/access_requests/${id}`, {
      user_id: u.uid,
      email: u.email,
      name: u.name,
      department: 'Bókhald',
      reason: 'Mig langar að bóka bústað',
      status: 'pending',
      email_domain_verified: true,
      employee_id_verified: false,
      requested_at: new Date(now.getTime() - offsetMs),
    });
  await request('ar-1', REQUESTER_1, 60_000);
  await request('ar-2', REQUESTER_2, 120_000);

  await setDoc(`organizations/${ORG}/booking_requests/br-1`, {
    user_id: MEMBER_M.uid,
    user_name: MEMBER_M.name,
    user_email: MEMBER_M.email,
    house_id: H1,
    house_name: HOUSE_NAME,
    start_date: midnight(40),
    end_date: midnight(43),
    num_nights: 3,
    num_guests: 4,
    purpose: 'family',
    notes: 'Fjölskylduhelgi',
    status: 'pending',
    has_conflicts: false,
    quota_check_passed: true,
    payment_required: false,
    requested_at: now,
  });
}
