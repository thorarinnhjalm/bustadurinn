import { createAuthUser, resetEmulators, setDoc } from './emulator';

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
