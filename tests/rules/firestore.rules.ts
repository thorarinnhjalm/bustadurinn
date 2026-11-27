import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  limit,
  writeBatch,
  arrayUnion,
  arrayRemove,
  runTransaction,
} from 'firebase/firestore';
import { createEnv, personas } from './helpers';

// Executes firestore.rules against the Firestore emulator. Query shapes are
// copied from the client code (file noted next to each) because a list query the
// rules cannot prove is rejected even if every document would pass.

let env: RulesTestEnvironment;
let p: ReturnType<typeof personas>;

const future = () => Timestamp.fromMillis(Date.now() + 7 * 24 * 3600 * 1000);
const past = () => Timestamp.fromMillis(Date.now() - 24 * 3600 * 1000);

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const now = Timestamp.now();
    await setDoc(doc(db, 'user_roles/root'), { system_role: 'super_admin' });
    await setDoc(doc(db, 'user_roles/legacyRoot'), { is_super_admin: true });
    await setDoc(doc(db, 'user_roles/carol'), { system_role: 'regular_user' });
    await setDoc(doc(db, 'users/alice'), { name: 'Alice', email: 'a@x.is' });
    await setDoc(doc(db, 'users/bob'), { name: 'Bob', email: 'b@x.is' });

    await setDoc(doc(db, 'houses/H1'), {
      name: 'H1', owner_ids: ['alice', 'bob'], manager_id: 'alice', invite_code: 'ABC123',
      supplies_out: [], gas_cylinder: {}, updated_at: now,
    });
    await setDoc(doc(db, 'houses/H2'), { name: 'H2', owner_ids: ['dave'], manager_id: 'dave' });
    await setDoc(doc(db, 'houses/H3'), {
      name: 'H3', owner_ids: ['orgAdmin'], manager_id: 'orgAdmin', organization_id: 'O1',
    });
    for (const sub of ['tasks', 'finance_entries', 'budget_plans', 'shopping_list', 'inventory', 'internal_logs']) {
      await setDoc(doc(db, `houses/H1/${sub}/x1`), { title: 'x', created_at: now });
      await setDoc(doc(db, `houses/H3/${sub}/x1`), { title: 'x', created_at: now });
    }
    await setDoc(doc(db, 'houses/H1/bookings/b1'), { start: now, end: now, user_id: 'alice' });
    await setDoc(doc(db, 'houses/H3/bookings/b1'), { start: now, end: now, user_id: 'orgMember' });
    await setDoc(doc(db, 'houses/H3/tasks/t1'), { title: 't' });

    await setDoc(doc(db, 'organizations/O1'), {
      name: 'Org', created_by: 'orgAdmin', admin_user_ids: ['orgAdmin'], created_at: now,
    });
    await setDoc(doc(db, 'organizations/O1/members/orgAdmin'), { user_id: 'orgAdmin', role: 'admin', status: 'active', created_at: now });
    await setDoc(doc(db, 'organizations/O1/members/orgMember'), { user_id: 'orgMember', role: 'member', status: 'active', created_at: now });
    await setDoc(doc(db, 'organizations/O1/members/orgSuspended'), { user_id: 'orgSuspended', role: 'member', status: 'suspended', created_at: now });
    await setDoc(doc(db, 'organizations/O1/access_requests/ar1'), { user_id: 'carol', status: 'pending', requested_at: now });
    await setDoc(doc(db, 'organizations/O1/access_requests/ar2'), { user_id: 'dave', status: 'pending', requested_at: now });
    await setDoc(doc(db, 'organizations/O1/booking_requests/br1'), { user_id: 'orgMember', status: 'pending', house_id: 'H3', requested_at: now });
    await setDoc(doc(db, 'organizations/O1/booking_requests/br2'), { user_id: 'orgAdmin', status: 'pending', house_id: 'H3', requested_at: now });
    await setDoc(doc(db, 'organizations/O1/admin_actions/aa1'), { admin_user_id: 'orgAdmin', timestamp: now });

    await setDoc(doc(db, 'guest_views/tok_valid'), { houseId: 'H1', valid_until: future(), created_at: now });
    await setDoc(doc(db, 'guest_views/tok_noexp'), { houseId: 'H1', created_at: now });
    await setDoc(doc(db, 'guest_views/tok_expired'), { houseId: 'H1', valid_until: past(), created_at: now });

    await setDoc(doc(db, 'notifications/n_alice'), { user_id: 'alice', house_id: 'H1', created_at: now });
    await setDoc(doc(db, 'notifications/n_bob'), { user_id: 'bob', house_id: 'H1', created_at: now });
    await setDoc(doc(db, 'invitations/inv1'), { house_id: 'H1', status: 'pending', token: 't' });
    await setDoc(doc(db, 'guestbook/g1'), { house_id: 'H1', created_at: now, text: 'hi' });
    await setDoc(doc(db, 'guestbook/g2'), { house_id: 'H2', created_at: now, text: 'hi' });

    await setDoc(doc(db, 'service_providers/P_active'), { name: 'A', status: 'active', rating_avg: 4, rating_count: 2, owner_uid: 'dave' });
    await setDoc(doc(db, 'service_providers/P_pending'), { name: 'B', status: 'pending', rating_avg: 0, rating_count: 0, owner_uid: 'carol' });
    await setDoc(doc(db, 'service_provider_contacts/P_active'), { contact_email: 'a@b.is', contact_phone: '1', address: 'x', owner_uid: 'dave' });
    await setDoc(doc(db, 'service_reviews/P_active_dave'), { provider_id: 'P_active', user_id: 'dave', rating: 5 });

    await setDoc(doc(db, 'feedback/f1'), { comment: 'x' });
    await setDoc(doc(db, 'featured_feedback/f1'), { comment: 'x' });
    await setDoc(doc(db, 'funnel_events/e1'), { uid: 'carol' });
    await setDoc(doc(db, 'internal_logs/l1'), { m: 1 });
    await setDoc(doc(db, 'contact_submissions/c1'), { m: 1 });
    await setDoc(doc(db, 'newsletter_subscribers/s1'), { m: 1 });
    await setDoc(doc(db, 'coupons/cp1'), { m: 1 });
    await setDoc(doc(db, 'email_templates/welcome'), { m: 1 });
    await setDoc(doc(db, 'system/s'), { m: 1 });
    await setDoc(doc(db, 'bookings/legacy'), { m: 1 });
    await setDoc(doc(db, 'does_not_exist/x'), { m: 1 });
  });
}

beforeAll(async () => {
  env = await createEnv();
});
afterAll(async () => {
  await env.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await seed();
  p = personas(env);
});

describe('isSuperAdmin()', () => {
  it('role doc system_role super_admin passes', async () => {
    await assertSucceeds(getDoc(doc(p.root, 'coupons/cp1')));
  });
  it('role doc with only is_super_admin: true passes', async () => {
    const db = env.authenticatedContext('legacyRoot').firestore();
    await assertSucceeds(getDoc(doc(db, 'coupons/cp1')));
  });
  it('verified owner email passes without a role doc', async () => {
    await assertSucceeds(getDoc(doc(p.ownerEmail, 'coupons/cp1')));
  });
  it('same email with email_verified false fails', async () => {
    await assertFails(getDoc(doc(p.fakeOwnerEmail, 'coupons/cp1')));
  });
  it('a regular_user role doc (no is_super_admin key) is simply denied', async () => {
    await assertFails(getDoc(doc(p.carol, 'coupons/cp1')));
  });
  it('anon fails', async () => {
    await assertFails(getDoc(doc(p.anon, 'coupons/cp1')));
  });
});

describe('catch-all', () => {
  it('a collection with no rule is denied, for everyone including super admin', async () => {
    await assertFails(getDoc(doc(p.root, 'does_not_exist/x')));
    await assertFails(getDoc(doc(p.alice, 'does_not_exist/x')));
    await assertFails(setDoc(doc(p.root, 'does_not_exist/y'), { a: 1 }));
  });
});

describe('users', () => {
  it('owner reads and writes own doc', async () => {
    await assertSucceeds(getDoc(doc(p.alice, 'users/alice')));
    await assertSucceeds(updateDoc(doc(p.alice, 'users/alice'), { name: 'A2' }));
    await assertSucceeds(setDoc(doc(p.carol, 'users/carol'), { name: 'C' }));
  });
  it('bob cannot read or write alice, anon cannot read', async () => {
    await assertFails(getDoc(doc(p.bob, 'users/alice')));
    await assertFails(updateDoc(doc(p.bob, 'users/alice'), { name: 'x' }));
    await assertFails(getDoc(doc(p.anon, 'users/alice')));
  });
  it('root reads any user; only root deletes', async () => {
    await assertSucceeds(getDoc(doc(p.root, 'users/alice')));
    await assertFails(deleteDoc(doc(p.alice, 'users/alice')));
    await assertFails(deleteDoc(doc(p.bob, 'users/alice')));
    await assertSucceeds(deleteDoc(doc(p.root, 'users/alice')));
  });
});

describe('user_roles', () => {
  it('user reads own, not others', async () => {
    await assertSucceeds(getDoc(doc(p.carol, 'user_roles/carol')));
    await assertFails(getDoc(doc(p.carol, 'user_roles/root')));
    await assertSucceeds(getDoc(doc(p.root, 'user_roles/carol')));
  });
  it('no self-promotion', async () => {
    await assertFails(setDoc(doc(p.carol, 'user_roles/carol'), { system_role: 'super_admin' }));
    await assertFails(updateDoc(doc(p.carol, 'user_roles/carol'), { system_role: 'super_admin' }));
    await assertFails(setDoc(doc(p.alice, 'user_roles/alice'), { system_role: 'super_admin' }));
    await assertFails(deleteDoc(doc(p.carol, 'user_roles/carol')));
  });
  it('root writes and deletes', async () => {
    await assertSucceeds(setDoc(doc(p.root, 'user_roles/alice'), { system_role: 'support_admin' }));
    await assertSucceeds(deleteDoc(doc(p.root, 'user_roles/alice')));
  });
});

describe('houses', () => {
  it('members read H1; carol, dave, anon cannot', async () => {
    await assertSucceeds(getDoc(doc(p.alice, 'houses/H1')));
    await assertSucceeds(getDoc(doc(p.bob, 'houses/H1')));
    await assertFails(getDoc(doc(p.carol, 'houses/H1')));
    await assertFails(getDoc(doc(p.dave, 'houses/H1')));
    await assertFails(getDoc(doc(p.anon, 'houses/H1')));
    await assertSucceeds(getDoc(doc(p.root, 'houses/H1')));
  });
  it('member list query by owner_ids (array-contains)', async () => {
    const q = (db: typeof p.alice) => getDocs(query(collection(db, 'houses'), where('owner_ids', 'array-contains', 'alice')));
    await assertSucceeds(q(p.alice));
    // Someone else asking for alice's houses is denied.
    await assertFails(q(p.carol));
  });
  it('unfiltered houses list is denied for a normal user, allowed for root', async () => {
    await assertFails(getDocs(collection(p.alice, 'houses')));
    await assertSucceeds(getDocs(collection(p.root, 'houses')));
  });
  it('org houses: orgMember and orgAdmin read H3, suspended cannot, none read H1', async () => {
    await assertSucceeds(getDoc(doc(p.orgMember, 'houses/H3')));
    await assertSucceeds(getDoc(doc(p.orgAdmin, 'houses/H3')));
    await assertFails(getDoc(doc(p.orgSuspended, 'houses/H3')));
    await assertFails(getDoc(doc(p.carol, 'houses/H3')));
    await assertFails(getDoc(doc(p.orgMember, 'houses/H1')));
    await assertFails(getDoc(doc(p.orgAdmin, 'houses/H1')));
  });
  it('org houses list: organizationService.getOrganizationHouses query', async () => {
    const q = (db: typeof p.alice) => getDocs(query(collection(db, 'houses'), where('organization_id', '==', 'O1')));
    await assertSucceeds(q(p.orgMember));
    await assertSucceeds(q(p.orgAdmin));
    await assertFails(q(p.orgSuspended));
    await assertFails(q(p.carol));
  });
  it('create requires manager_id == caller and caller in owner_ids', async () => {
    await assertSucceeds(setDoc(doc(p.carol, 'houses/NEW'), { name: 'n', manager_id: 'carol', owner_ids: ['carol'] }));
    await assertFails(setDoc(doc(p.carol, 'houses/NEW2'), { name: 'n', manager_id: 'alice', owner_ids: ['carol'] }));
    await assertFails(setDoc(doc(p.carol, 'houses/NEW3'), { name: 'n', manager_id: 'carol', owner_ids: ['alice'] }));
    await assertFails(setDoc(doc(p.anon, 'houses/NEW4'), { name: 'n', manager_id: 'carol', owner_ids: ['carol'] }));
  });
  it('manager updates anything', async () => {
    await assertSucceeds(updateDoc(doc(p.alice, 'houses/H1'), { name: 'new', invite_code: 'ZZZ', owner_ids: ['alice', 'bob', 'carol'] }));
  });
  it('organization_id can only be set by an admin of that organization', async () => {
    // alice manages H1 but does not administer O1
    await assertFails(updateDoc(doc(p.alice, 'houses/H1'), { organization_id: 'O1' }));
    await assertFails(setDoc(doc(p.carol, 'houses/NEWORG'), { name: 'n', manager_id: 'carol', owner_ids: ['carol'], organization_id: 'O1' }));
    // orgAdmin administers O1: may create a house in it, detach it and re-attach it
    await assertSucceeds(setDoc(doc(p.orgAdmin, 'houses/NEWORG2'), { name: 'n', manager_id: 'orgAdmin', owner_ids: ['orgAdmin'], organization_id: 'O1' }));
    await assertSucceeds(updateDoc(doc(p.orgAdmin, 'houses/H3'), { organization_id: null }));
    await assertSucceeds(updateDoc(doc(p.orgAdmin, 'houses/H3'), { organization_id: 'O1' }));
    // a manager can still edit other fields of a house already in an organization
    await assertSucceeds(updateDoc(doc(p.orgAdmin, 'houses/H3'), { name: 'renamed' }));
    // and an ordinary house without organization_id is unaffected
    await assertSucceeds(setDoc(doc(p.carol, 'houses/PLAIN'), { name: 'n', manager_id: 'carol', owner_ids: ['carol'] }));
  });
  it('co-owner may update only supplies_out, gas_cylinder, updated_at', async () => {
    await assertSucceeds(updateDoc(doc(p.bob, 'houses/H1'), { supplies_out: ['salt'] }));
    await assertSucceeds(updateDoc(doc(p.bob, 'houses/H1'), { gas_cylinder: { changed: true }, updated_at: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(p.bob, 'houses/H1'), { supplies_out: ['x'], gas_cylinder: {}, updated_at: serverTimestamp() }));
  });
  it('co-owner is denied when touching anything else, even alongside allowed keys', async () => {
    for (const extra of [
      { name: 'x' },
      { owner_ids: ['alice', 'bob', 'carol'] },
      { manager_id: 'bob' },
      { invite_code: 'HACK' },
      { organization_id: 'O1' },
    ]) {
      await assertFails(updateDoc(doc(p.bob, 'houses/H1'), { supplies_out: ['x'], ...extra }));
      await assertFails(updateDoc(doc(p.bob, 'houses/H1'), extra));
    }
  });
  it('non-members cannot update; root can', async () => {
    await assertFails(updateDoc(doc(p.carol, 'houses/H1'), { supplies_out: ['x'] }));
    await assertFails(updateDoc(doc(p.dave, 'houses/H1'), { name: 'x' }));
    await assertFails(updateDoc(doc(p.anon, 'houses/H1'), { name: 'x' }));
    await assertSucceeds(updateDoc(doc(p.root, 'houses/H1'), { name: 'x' }));
  });
  it('delete: manager and root only', async () => {
    await assertFails(deleteDoc(doc(p.bob, 'houses/H1')));
    await assertFails(deleteDoc(doc(p.carol, 'houses/H1')));
    await assertSucceeds(deleteDoc(doc(p.alice, 'houses/H1')));
    await assertSucceeds(deleteDoc(doc(p.root, 'houses/H2')));
  });
});

describe('house subcollections', () => {
  for (const sub of ['tasks', 'finance_entries', 'budget_plans', 'shopping_list', 'inventory', 'internal_logs']) {
    describe(sub, () => {
      it('members read (get + list) and create', async () => {
        for (const m of [p.alice, p.bob]) {
          await assertSucceeds(getDoc(doc(m, `houses/H1/${sub}/x1`)));
          await assertSucceeds(getDocs(collection(m, `houses/H1/${sub}`)));
        }
        await assertSucceeds(addDoc(collection(p.bob, `houses/H1/${sub}`), { title: 'n', created_at: serverTimestamp() }));
        await assertSucceeds(getDocs(collection(p.root, `houses/H1/${sub}`)));
      });
      it('carol, dave and anon denied', async () => {
        for (const x of [p.carol, p.dave, p.anon]) {
          await assertFails(getDoc(doc(x, `houses/H1/${sub}/x1`)));
          await assertFails(getDocs(collection(x, `houses/H1/${sub}`)));
          await assertFails(addDoc(collection(x, `houses/H1/${sub}`), { title: 'n' }));
        }
      });
      if (sub === 'internal_logs') {
        it('update and delete: root only', async () => {
          await assertFails(updateDoc(doc(p.alice, 'houses/H1/internal_logs/x1'), { title: 'y' }));
          await assertFails(deleteDoc(doc(p.alice, 'houses/H1/internal_logs/x1')));
          await assertFails(deleteDoc(doc(p.bob, 'houses/H1/internal_logs/x1')));
          await assertSucceeds(updateDoc(doc(p.root, 'houses/H1/internal_logs/x1'), { title: 'y' }));
          await assertSucceeds(deleteDoc(doc(p.root, 'houses/H1/internal_logs/x1')));
        });
      } else {
        it('members update and delete', async () => {
          await assertSucceeds(updateDoc(doc(p.bob, `houses/H1/${sub}/x1`), { title: 'y' }));
          await assertSucceeds(deleteDoc(doc(p.alice, `houses/H1/${sub}/x1`)));
          await assertFails(updateDoc(doc(p.carol, `houses/H1/${sub}/x1`), { title: 'y' }));
          await assertFails(deleteDoc(doc(p.carol, `houses/H1/${sub}/x1`)));
        });
      }
      it('org admin/member of H3 get no access here', async () => {
        await assertFails(getDoc(doc(p.orgMember, `houses/H3/${sub}/x1`)));
        await assertFails(getDoc(doc(p.orgSuspended, `houses/H3/${sub}/x1`)));
      });
    });
  }
});

describe('houses/{id}/bookings', () => {
  it('house members: full access (CalendarPage query: orderBy start)', async () => {
    const q = (db: typeof p.alice) => getDocs(query(collection(db, 'houses/H1/bookings'), orderBy('start', 'asc')));
    await assertSucceeds(q(p.alice));
    await assertSucceeds(q(p.bob));
    await assertSucceeds(addDoc(collection(p.bob, 'houses/H1/bookings'), { start: Timestamp.now(), end: Timestamp.now() }));
    await assertSucceeds(updateDoc(doc(p.alice, 'houses/H1/bookings/b1'), { notes: 'x' }));
    await assertSucceeds(deleteDoc(doc(p.bob, 'houses/H1/bookings/b1')));
  });
  it('carol, dave, anon and org people denied on H1 (not org house)', async () => {
    for (const x of [p.carol, p.dave, p.anon, p.orgMember, p.orgAdmin]) {
      await assertFails(getDoc(doc(x, 'houses/H1/bookings/b1')));
      await assertFails(getDocs(collection(x, 'houses/H1/bookings')));
      await assertFails(addDoc(collection(x, 'houses/H1/bookings'), { start: Timestamp.now() }));
    }
  });
  it('H3 (org house): orgMember reads, cannot write', async () => {
    await assertSucceeds(getDoc(doc(p.orgMember, 'houses/H3/bookings/b1')));
    await assertSucceeds(getDocs(query(collection(p.orgMember, 'houses/H3/bookings'), orderBy('start', 'asc'))));
    await assertFails(addDoc(collection(p.orgMember, 'houses/H3/bookings'), { start: Timestamp.now() }));
    await assertFails(updateDoc(doc(p.orgMember, 'houses/H3/bookings/b1'), { notes: 'x' }));
    await assertFails(deleteDoc(doc(p.orgMember, 'houses/H3/bookings/b1')));
  });
  it('H3: orgAdmin (also house owner) creates/updates/deletes', async () => {
    await assertSucceeds(addDoc(collection(p.orgAdmin, 'houses/H3/bookings'), { start: Timestamp.now() }));
    await assertSucceeds(updateDoc(doc(p.orgAdmin, 'houses/H3/bookings/b1'), { notes: 'x' }));
    await assertSucceeds(deleteDoc(doc(p.orgAdmin, 'houses/H3/bookings/b1')));
  });
  it('H3 owned by someone else: orgAdmin still writes bookings via org rule', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'houses/H4'), { owner_ids: ['carol'], manager_id: 'carol', organization_id: 'O1' });
    });
    await assertSucceeds(addDoc(collection(p.orgAdmin, 'houses/H4/bookings'), { start: Timestamp.now() }));
    await assertFails(addDoc(collection(p.orgMember, 'houses/H4/bookings'), { start: Timestamp.now() }));
  });
  it('H3: suspended member and non-member denied', async () => {
    for (const x of [p.orgSuspended, p.carol, p.anon]) {
      await assertFails(getDoc(doc(x, 'houses/H3/bookings/b1')));
      await assertFails(getDocs(collection(x, 'houses/H3/bookings')));
      await assertFails(addDoc(collection(x, 'houses/H3/bookings'), { start: Timestamp.now() }));
    }
  });
});

describe('collection-group reads (SuperAdminPage)', () => {
  it('bookings: root only', async () => {
    await assertSucceeds(getDocs(query(collectionGroup(p.root, 'bookings'), limit(10))));
    await assertFails(getDocs(query(collectionGroup(p.alice, 'bookings'), limit(10))));
    await assertFails(getDocs(query(collectionGroup(p.orgAdmin, 'bookings'), limit(10))));
    await assertFails(getDocs(query(collectionGroup(p.anon, 'bookings'), limit(10))));
  });
  it('tasks: root only', async () => {
    await assertSucceeds(getDocs(query(collectionGroup(p.root, 'tasks'), limit(10))));
    await assertFails(getDocs(query(collectionGroup(p.alice, 'tasks'), limit(10))));
    await assertFails(getDocs(query(collectionGroup(p.anon, 'tasks'), limit(10))));
  });
  it('collection-group bookings does not let a member write', async () => {
    await assertFails(setDoc(doc(p.carol, 'houses/H2/bookings/zz'), { a: 1 }));
  });
});

describe('invitations', () => {
  it('no client create or update by anyone', async () => {
    await assertFails(addDoc(collection(p.alice, 'invitations'), { house_id: 'H1', status: 'pending' }));
    await assertFails(setDoc(doc(p.root, 'invitations/new'), { house_id: 'H1' }));
    await assertFails(updateDoc(doc(p.alice, 'invitations/inv1'), { status: 'x' }));
    await assertFails(updateDoc(doc(p.root, 'invitations/inv1'), { status: 'x' }));
  });
  it('SettingsPage list query: where house_id == H1', async () => {
    const q = (db: typeof p.alice) => getDocs(query(collection(db, 'invitations'), where('house_id', '==', 'H1')));
    await assertSucceeds(q(p.alice));
    await assertSucceeds(q(p.bob));
    await assertFails(q(p.carol));
    await assertFails(q(p.anon));
  });
  it('get by id: members yes; carol and anon no', async () => {
    await assertSucceeds(getDoc(doc(p.alice, 'invitations/inv1')));
    await assertFails(getDoc(doc(p.carol, 'invitations/inv1')));
    await assertFails(getDoc(doc(p.anon, 'invitations/inv1')));
  });
  it('unfiltered list: root allowed, member denied', async () => {
    await assertSucceeds(getDocs(collection(p.root, 'invitations')));
    await assertFails(getDocs(collection(p.alice, 'invitations')));
  });
  it('delete: members and root yes, carol/anon no', async () => {
    await assertFails(deleteDoc(doc(p.carol, 'invitations/inv1')));
    await assertFails(deleteDoc(doc(p.anon, 'invitations/inv1')));
    await assertSucceeds(deleteDoc(doc(p.bob, 'invitations/inv1')));
  });
});

describe('guest_views', () => {
  it('anon gets a valid token doc, one without valid_until, and a missing one', async () => {
    await assertSucceeds(getDoc(doc(p.anon, 'guest_views/tok_valid')));
    await assertSucceeds(getDoc(doc(p.anon, 'guest_views/tok_noexp')));
    await assertSucceeds(getDoc(doc(p.anon, 'guest_views/nope')));
  });
  it('expired token is not served, even to a signed-in non-member', async () => {
    await assertFails(getDoc(doc(p.anon, 'guest_views/tok_expired')));
    await assertFails(getDoc(doc(p.carol, 'guest_views/tok_expired')));
  });
  it('anon cannot list', async () => {
    await assertFails(getDocs(collection(p.anon, 'guest_views')));
    await assertFails(getDocs(query(collection(p.anon, 'guest_views'), where('houseId', '==', 'H1'))));
  });
  it('member list: where houseId == H1 (MagicLinkGenerator)', async () => {
    const q = (db: typeof p.alice) => getDocs(query(collection(db, 'guest_views'), where('houseId', '==', 'H1')));
    await assertSucceeds(q(p.bob));
    await assertSucceeds(q(p.alice));
    await assertFails(q(p.carol));
    await assertFails(getDocs(collection(p.carol, 'guest_views')));
  });
  it('create: members for H1 only', async () => {
    const data = { houseId: 'H1', booking_id: 'b1', valid_until: future(), created_at: serverTimestamp() };
    await assertSucceeds(setDoc(doc(p.alice, 'guest_views/new1'), data));
    await assertSucceeds(setDoc(doc(p.bob, 'guest_views/new2'), data));
    await assertFails(setDoc(doc(p.carol, 'guest_views/new3'), data));
    await assertFails(setDoc(doc(p.dave, 'guest_views/new4'), data));
    await assertFails(setDoc(doc(p.anon, 'guest_views/new5'), data));
  });
  it('update: member ok, cannot move houseId, carol cannot', async () => {
    await assertSucceeds(updateDoc(doc(p.bob, 'guest_views/tok_valid'), { note: 'x' }));
    await assertFails(updateDoc(doc(p.bob, 'guest_views/tok_valid'), { houseId: 'H2' }));
    await assertFails(updateDoc(doc(p.carol, 'guest_views/tok_valid'), { note: 'x' }));
    await assertFails(updateDoc(doc(p.anon, 'guest_views/tok_valid'), { note: 'x' }));
  });
  it('SettingsPage syncs: setDoc merge on an existing and on a missing link, delete of a missing one', async () => {
    await assertSucceeds(setDoc(doc(p.alice, 'guest_views/tok_valid'), { houseId: 'H1', image_url: 'u', updated_at: serverTimestamp() }, { merge: true }));
    await assertSucceeds(setDoc(doc(p.alice, 'guest_views/gone'), { houseId: 'H1', image_url: 'u' }, { merge: true }));
    await assertSucceeds(deleteDoc(doc(p.alice, 'guest_views/never_existed')));
    await assertFails(setDoc(doc(p.carol, 'guest_views/tok_valid'), { houseId: 'H1', image_url: 'u' }, { merge: true }));
    await assertFails(setDoc(doc(p.bob, 'guest_views/tok_valid'), { houseId: 'H2' }, { merge: true }));
  });
  it('delete: member ok, carol and anon cannot', async () => {
    await assertFails(deleteDoc(doc(p.carol, 'guest_views/tok_valid')));
    await assertFails(deleteDoc(doc(p.anon, 'guest_views/tok_valid')));
    await assertSucceeds(deleteDoc(doc(p.bob, 'guest_views/tok_valid')));
  });
});

describe('notifications', () => {
  it('useNotifications query: house_id + user_id + limit', async () => {
    const q = (db: typeof p.alice, uid: string) =>
      getDocs(query(collection(db, 'notifications'), where('house_id', '==', 'H1'), where('user_id', '==', uid), limit(40)));
    await assertSucceeds(q(p.alice, 'alice'));
    await assertFails(q(p.alice, 'bob'));
    await assertFails(q(p.anon, 'alice'));
  });
  it('recipient reads, updates, deletes own; others cannot', async () => {
    await assertSucceeds(getDoc(doc(p.alice, 'notifications/n_alice')));
    await assertSucceeds(updateDoc(doc(p.alice, 'notifications/n_alice'), { read: true }));
    await assertFails(getDoc(doc(p.bob, 'notifications/n_alice')));
    await assertFails(updateDoc(doc(p.bob, 'notifications/n_alice'), { read: true }));
    await assertFails(deleteDoc(doc(p.bob, 'notifications/n_alice')));
    await assertSucceeds(deleteDoc(doc(p.alice, 'notifications/n_alice')));
  });
  it('nobody creates from the client, not even for themselves', async () => {
    await assertFails(addDoc(collection(p.alice, 'notifications'), { user_id: 'alice', house_id: 'H1' }));
    await assertFails(addDoc(collection(p.alice, 'notifications'), { user_id: 'bob', house_id: 'H1' }));
    await assertFails(addDoc(collection(p.root, 'notifications'), { user_id: 'root' }));
  });
});

describe('guestbook', () => {
  const q = (db: typeof p.alice, house = 'H1') =>
    getDocs(query(collection(db, 'guestbook'), where('house_id', '==', house), orderBy('created_at', 'desc')));
  it('members read with the client query', async () => {
    await assertSucceeds(q(p.alice));
    await assertSucceeds(q(p.bob));
    await assertSucceeds(getDoc(doc(p.alice, 'guestbook/g1')));
  });
  it('carol, dave, anon denied', async () => {
    await assertFails(q(p.carol));
    await assertFails(q(p.dave));
    await assertFails(q(p.anon));
    await assertFails(getDoc(doc(p.carol, 'guestbook/g1')));
    await assertFails(getDoc(doc(p.anon, 'guestbook/g1')));
  });
  it('create for H1: members yes, carol/anon no', async () => {
    const data = { house_id: 'H1', text: 'x', created_at: serverTimestamp() };
    await assertSucceeds(addDoc(collection(p.alice, 'guestbook'), data));
    await assertSucceeds(addDoc(collection(p.bob, 'guestbook'), data));
    await assertFails(addDoc(collection(p.carol, 'guestbook'), data));
    await assertFails(addDoc(collection(p.anon, 'guestbook'), data));
  });
  it('delete: members yes, carol/anon no', async () => {
    await assertFails(deleteDoc(doc(p.carol, 'guestbook/g1')));
    await assertFails(deleteDoc(doc(p.anon, 'guestbook/g1')));
    await assertSucceeds(deleteDoc(doc(p.bob, 'guestbook/g1')));
  });
  it('update: root only', async () => {
    await assertFails(updateDoc(doc(p.alice, 'guestbook/g1'), { text: 'y' }));
    await assertSucceeds(updateDoc(doc(p.root, 'guestbook/g1'), { text: 'y' }));
  });
});

describe('organizations', () => {
  it('get: any signed-in user, not anon', async () => {
    await assertSucceeds(getDoc(doc(p.carol, 'organizations/O1')));
    await assertFails(getDoc(doc(p.anon, 'organizations/O1')));
  });
  it('list: root only (getAllOrganizations query)', async () => {
    const q = (db: typeof p.alice) => getDocs(query(collection(db, 'organizations'), orderBy('created_at', 'desc')));
    await assertSucceeds(q(p.root));
    await assertFails(q(p.carol));
    await assertFails(q(p.orgAdmin));
    await assertFails(q(p.anon));
  });
  it('create requires created_by == uid and uid in admin_user_ids', async () => {
    await assertSucceeds(setDoc(doc(p.carol, 'organizations/O2'), { created_by: 'carol', admin_user_ids: ['carol'] }));
    await assertFails(setDoc(doc(p.carol, 'organizations/O3'), { created_by: 'dave', admin_user_ids: ['carol'] }));
    await assertFails(setDoc(doc(p.carol, 'organizations/O4'), { created_by: 'carol', admin_user_ids: ['dave'] }));
    await assertFails(setDoc(doc(p.anon, 'organizations/O5'), { created_by: 'x', admin_user_ids: ['x'] }));
  });
  it('createOrganization(): org doc + creator member doc in ONE batch succeeds (getAfter)', async () => {
    const db = p.carol;
    const batch = writeBatch(db);
    batch.set(doc(db, 'organizations/O9'), {
      name: 'N', created_at: serverTimestamp(), created_by: 'carol', updated_at: serverTimestamp(),
      admin_user_ids: ['carol'], stats: { total_properties: 0 },
    });
    batch.set(doc(db, 'organizations/O9/members/carol'), {
      user_id: 'carol', role: 'admin', status: 'active', created_at: serverTimestamp(), approved_by: 'carol',
    });
    await assertSucceeds(batch.commit());
  });
  it('member doc alone for a new org the caller has not created is denied', async () => {
    await assertFails(setDoc(doc(p.carol, 'organizations/ONEW/members/carol'), { user_id: 'carol', role: 'admin', status: 'active' }));
  });
  it('batch creating a member doc for an org the caller does not administer fails', async () => {
    const db = p.carol;
    const batch = writeBatch(db);
    batch.set(doc(db, 'organizations/O1/members/carol'), { user_id: 'carol', role: 'admin', status: 'active' });
    await assertFails(batch.commit());
  });
  it('batch: own org doc plus a member doc for a DIFFERENT org fails', async () => {
    const db = p.carol;
    const batch = writeBatch(db);
    batch.set(doc(db, 'organizations/O9'), { created_by: 'carol', admin_user_ids: ['carol'] });
    batch.set(doc(db, 'organizations/O1/members/carol'), { user_id: 'carol', role: 'admin', status: 'active' });
    await assertFails(batch.commit());
  });
  it('update: org admin ok, emptying admin_user_ids denied, carol denied, root ok', async () => {
    await assertSucceeds(updateDoc(doc(p.orgAdmin, 'organizations/O1'), { name: 'New', updated_at: serverTimestamp() }));
    await assertFails(updateDoc(doc(p.orgAdmin, 'organizations/O1'), { admin_user_ids: [] }));
    await assertFails(updateDoc(doc(p.carol, 'organizations/O1'), { name: 'x' }));
    await assertFails(updateDoc(doc(p.orgMember, 'organizations/O1'), { name: 'x' }));
    await assertSucceeds(updateDoc(doc(p.root, 'organizations/O1'), { name: 'x' }));
  });
  it('setUserOrgRole(): org admin batch (member merge + arrayUnion/arrayRemove)', async () => {
    const db = p.orgAdmin;
    const b1 = writeBatch(db);
    b1.set(doc(db, 'organizations/O1/members/orgMember'), { user_id: 'orgMember', role: 'admin', status: 'active', updated_at: serverTimestamp() }, { merge: true });
    b1.update(doc(db, 'organizations/O1'), { admin_user_ids: arrayUnion('orgMember'), updated_at: serverTimestamp() });
    await assertSucceeds(b1.commit());
    const b2 = writeBatch(db);
    b2.set(doc(db, 'organizations/O1/members/orgMember'), { user_id: 'orgMember', role: 'member', status: 'active' }, { merge: true });
    b2.update(doc(db, 'organizations/O1'), { admin_user_ids: arrayRemove('orgMember') });
    await assertSucceeds(b2.commit());
  });
  it('delete: root only', async () => {
    await assertFails(deleteDoc(doc(p.orgAdmin, 'organizations/O1')));
    await assertSucceeds(deleteDoc(doc(p.root, 'organizations/O1')));
  });

  describe('members', () => {
    it('org admin reads the list (getOrganizationMembers query)', async () => {
      await assertSucceeds(getDocs(query(collection(p.orgAdmin, 'organizations/O1/members'), orderBy('created_at', 'desc'))));
    });
    it('a member reads only their own doc and cannot list', async () => {
      await assertSucceeds(getDoc(doc(p.orgMember, 'organizations/O1/members/orgMember')));
      await assertSucceeds(getDoc(doc(p.orgSuspended, 'organizations/O1/members/orgSuspended')));
      await assertFails(getDoc(doc(p.orgMember, 'organizations/O1/members/orgAdmin')));
      await assertFails(getDocs(collection(p.orgMember, 'organizations/O1/members')));
    });
    it('legacy lookup where user_id == x is fine for org admin', async () => {
      await assertSucceeds(getDocs(query(collection(p.orgAdmin, 'organizations/O1/members'), where('user_id', '==', 'orgMember'))));
    });
    it('carol and anon denied', async () => {
      await assertFails(getDoc(doc(p.carol, 'organizations/O1/members/orgMember')));
      await assertFails(getDocs(collection(p.carol, 'organizations/O1/members')));
      await assertFails(getDoc(doc(p.anon, 'organizations/O1/members/orgMember')));
    });
    it('create/update/delete: org admin yes; member and carol no (no self-add, no self-promote)', async () => {
      await assertSucceeds(setDoc(doc(p.orgAdmin, 'organizations/O1/members/carol'), { user_id: 'carol', role: 'member', status: 'active' }));
      await assertSucceeds(updateDoc(doc(p.orgAdmin, 'organizations/O1/members/orgMember'), { status: 'suspended' }));
      await assertSucceeds(deleteDoc(doc(p.orgAdmin, 'organizations/O1/members/orgMember')));
      await assertFails(setDoc(doc(p.dave, 'organizations/O1/members/dave'), { user_id: 'dave', role: 'member', status: 'active' }));
      await assertFails(updateDoc(doc(p.orgSuspended, 'organizations/O1/members/orgSuspended'), { status: 'active' }));
      await assertFails(updateDoc(doc(p.orgMember, 'organizations/O1/members/orgMember'), { role: 'admin' }));
      await assertFails(deleteDoc(doc(p.carol, 'organizations/O1/members/orgMember')));
    });
  });

  describe('access_requests', () => {
    it('carol creates own pending request (submitAccessRequest shape)', async () => {
      await assertSucceeds(addDoc(collection(p.carol, 'organizations/O1/access_requests'), {
        user_id: 'carol', email: 'c@x.is', name: 'C', status: 'pending', email_domain_verified: false, employee_id_verified: false, requested_at: serverTimestamp(),
      }));
    });
    it('cannot create for another uid, nor with a non-pending status, anon denied', async () => {
      await assertFails(addDoc(collection(p.carol, 'organizations/O1/access_requests'), { user_id: 'dave', status: 'pending' }));
      await assertFails(addDoc(collection(p.carol, 'organizations/O1/access_requests'), { user_id: 'carol', status: 'approved' }));
      await assertFails(addDoc(collection(p.anon, 'organizations/O1/access_requests'), { user_id: 'carol', status: 'pending' }));
    });
    it('requester reads own, not others; cannot list unfiltered', async () => {
      await assertSucceeds(getDoc(doc(p.carol, 'organizations/O1/access_requests/ar1')));
      await assertFails(getDoc(doc(p.carol, 'organizations/O1/access_requests/ar2')));
      await assertFails(getDocs(collection(p.carol, 'organizations/O1/access_requests')));
    });
    it('org admin lists with the client query (with and without status)', async () => {
      const c = collection(p.orgAdmin, 'organizations/O1/access_requests');
      await assertSucceeds(getDocs(query(c, orderBy('requested_at', 'desc'))));
      await assertSucceeds(getDocs(query(c, where('status', '==', 'pending'), orderBy('requested_at', 'desc'))));
    });
    it('approve batch: admin updates request and creates the member doc', async () => {
      const db = p.orgAdmin;
      const b = writeBatch(db);
      b.update(doc(db, 'organizations/O1/access_requests/ar1'), { status: 'approved', reviewed_by: 'orgAdmin', reviewed_at: serverTimestamp() });
      b.set(doc(db, 'organizations/O1/members/carol'), { user_id: 'carol', role: 'member', status: 'active', created_at: serverTimestamp() });
      await assertSucceeds(b.commit());
    });
    it('update/delete: org admin only', async () => {
      await assertFails(updateDoc(doc(p.carol, 'organizations/O1/access_requests/ar1'), { status: 'approved' }));
      await assertFails(deleteDoc(doc(p.carol, 'organizations/O1/access_requests/ar1')));
      await assertSucceeds(updateDoc(doc(p.orgAdmin, 'organizations/O1/access_requests/ar1'), { status: 'denied' }));
      await assertSucceeds(deleteDoc(doc(p.orgAdmin, 'organizations/O1/access_requests/ar1')));
    });
  });

  describe('booking_requests', () => {
    const req = (uid: string, extra: Record<string, unknown> = {}) => ({
      user_id: uid, status: 'pending', house_id: 'H3', requested_at: serverTimestamp(), ...extra,
    });
    it('active member creates own pending request', async () => {
      await assertSucceeds(addDoc(collection(p.orgMember, 'organizations/O1/booking_requests'), req('orgMember')));
      await assertSucceeds(addDoc(collection(p.orgAdmin, 'organizations/O1/booking_requests'), req('orgAdmin')));
    });
    it('suspended, non-member and anon denied; other uid / non-pending status denied', async () => {
      await assertFails(addDoc(collection(p.orgSuspended, 'organizations/O1/booking_requests'), req('orgSuspended')));
      await assertFails(addDoc(collection(p.carol, 'organizations/O1/booking_requests'), req('carol')));
      await assertFails(addDoc(collection(p.anon, 'organizations/O1/booking_requests'), req('orgMember')));
      await assertFails(addDoc(collection(p.orgMember, 'organizations/O1/booking_requests'), req('orgAdmin')));
      await assertFails(addDoc(collection(p.orgMember, 'organizations/O1/booking_requests'), req('orgMember', { status: 'approved' })));
    });
    it('requester reads own with getMyBookingRequests query, not others', async () => {
      const q = (db: typeof p.alice, uid: string) =>
        getDocs(query(collection(db, 'organizations/O1/booking_requests'), where('user_id', '==', uid), orderBy('requested_at', 'desc')));
      await assertSucceeds(q(p.orgMember, 'orgMember'));
      await assertSucceeds(q(p.orgSuspended, 'orgSuspended'));
      await assertFails(q(p.orgMember, 'orgAdmin'));
      await assertFails(getDoc(doc(p.orgMember, 'organizations/O1/booking_requests/br2')));
      await assertSucceeds(getDoc(doc(p.orgMember, 'organizations/O1/booking_requests/br1')));
      await assertFails(getDocs(collection(p.orgMember, 'organizations/O1/booking_requests')));
    });
    it('org admin lists with getBookingRequests queries and approves', async () => {
      const c = collection(p.orgAdmin, 'organizations/O1/booking_requests');
      await assertSucceeds(getDocs(query(c, orderBy('requested_at', 'desc'))));
      await assertSucceeds(getDocs(query(c, where('status', '==', 'pending'), orderBy('requested_at', 'desc'))));
      await assertSucceeds(updateDoc(doc(p.orgAdmin, 'organizations/O1/booking_requests/br1'), { status: 'approved' }));
      await assertFails(updateDoc(doc(p.orgMember, 'organizations/O1/booking_requests/br1'), { status: 'approved' }));
      await assertFails(deleteDoc(doc(p.orgMember, 'organizations/O1/booking_requests/br1')));
    });
  });

  describe('admin_actions', () => {
    it('org admin creates and reads (logAdminAction / getAdminActions)', async () => {
      await assertSucceeds(addDoc(collection(p.orgAdmin, 'organizations/O1/admin_actions'), { admin_user_id: 'orgAdmin', timestamp: serverTimestamp() }));
      await assertSucceeds(getDocs(query(collection(p.orgAdmin, 'organizations/O1/admin_actions'), orderBy('timestamp', 'desc'))));
      await assertSucceeds(addDoc(collection(p.root, 'organizations/O1/admin_actions'), { admin_user_id: 'root' }));
    });
    it('members, carol, anon denied', async () => {
      await assertFails(getDocs(collection(p.orgMember, 'organizations/O1/admin_actions')));
      await assertFails(addDoc(collection(p.orgMember, 'organizations/O1/admin_actions'), { a: 1 }));
      await assertFails(getDoc(doc(p.carol, 'organizations/O1/admin_actions/aa1')));
      await assertFails(getDoc(doc(p.anon, 'organizations/O1/admin_actions/aa1')));
    });
    it('append-only: nobody updates or deletes, including root', async () => {
      for (const x of [p.orgAdmin, p.root, p.ownerEmail]) {
        await assertFails(updateDoc(doc(x, 'organizations/O1/admin_actions/aa1'), { a: 2 }));
        await assertFails(deleteDoc(doc(x, 'organizations/O1/admin_actions/aa1')));
      }
    });
  });
});

describe('service_providers', () => {
  // ForProvidersPage.tsx: batch of provider + contact doc under a client id.
  const applicant = (db: typeof p.anon, uid: string | null, id = 'NEWP', providerExtra: Record<string, unknown> = {}, contactExtra: Record<string, unknown> = {}) => {
    const b = writeBatch(db);
    b.set(doc(db, `service_providers/${id}`), {
      name: 'Snjomokstur ehf', category: 'snow_removal', website: '', description: 'lýsing',
      service_areas: ['Árnessýsla'], status: 'pending', rating_avg: 0, rating_count: 0,
      created_at: serverTimestamp(), owner_uid: uid, ...providerExtra,
    });
    b.set(doc(db, `service_provider_contacts/${id}`), {
      contact_email: 'a@b.is', contact_phone: '5551234', address: 'Gata 1', owner_uid: uid, ...contactExtra,
    });
    return b.commit();
  };

  it('marketplace query (status == active, orderBy rating_avg desc): anon and signed-in succeed', async () => {
    const q = (db: typeof p.anon) => getDocs(query(collection(db, 'service_providers'), where('status', '==', 'active'), orderBy('rating_avg', 'desc')));
    await assertSucceeds(q(p.anon));
    await assertSucceeds(q(p.carol));
  });
  it('get active by anon ok; pending not readable by anon or carol (non-owner), readable by owner and root', async () => {
    await assertSucceeds(getDoc(doc(p.anon, 'service_providers/P_active')));
    await assertFails(getDoc(doc(p.anon, 'service_providers/P_pending')));
    await assertFails(getDoc(doc(p.bob, 'service_providers/P_pending')));
    await assertSucceeds(getDoc(doc(p.carol, 'service_providers/P_pending')));
    await assertSucceeds(getDoc(doc(p.root, 'service_providers/P_pending')));
  });
  it('unfiltered list is denied for anon and signed-in, allowed for root', async () => {
    await assertFails(getDocs(collection(p.anon, 'service_providers')));
    await assertFails(getDocs(collection(p.carol, 'service_providers')));
    await assertSucceeds(getDocs(collection(p.root, 'service_providers')));
  });
  it('MyServiceWidget query (owner_uid == uid) works for the owner only', async () => {
    const q = (db: typeof p.anon, uid: string) => getDocs(query(collection(db, 'service_providers'), where('owner_uid', '==', uid)));
    const snap = await assertSucceeds(q(p.carol, 'carol'));
    if (snap.size !== 1) throw new Error(`expected 1 provider, got ${snap.size}`);
    await assertFails(q(p.bob, 'carol'));
    await assertFails(q(p.anon, 'carol'));
  });
  it('anon applies (exact ForProvidersPage fields), batch with contact doc', async () => {
    await assertSucceeds(applicant(p.anon, null));
  });
  it('signed-in applicant with owner_uid == uid', async () => {
    await assertSucceeds(applicant(p.carol, 'carol'));
    await assertFails(applicant(p.carol, 'dave', 'NEWP2'));
    await assertFails(applicant(p.anon, 'carol', 'NEWP3'));
  });
  it('rejects status active, a rating, extra keys, contact fields on the provider doc', async () => {
    await assertFails(applicant(p.anon, null, 'X1', { status: 'active' }));
    await assertFails(applicant(p.anon, null, 'X2', { rating_avg: 5 }));
    await assertFails(applicant(p.anon, null, 'X3', { rating_count: 1 }));
    await assertFails(applicant(p.anon, null, 'X4', { verified: true }));
    await assertFails(applicant(p.anon, null, 'X5', { contact_email: 'a@b.is' }));
    await assertFails(applicant(p.anon, null, 'X6', { name: 'x'.repeat(101) }));
    await assertFails(applicant(p.anon, null, 'X7', { created_at: Timestamp.fromMillis(0) }));
  });
  it('rejects extra keys on the contact doc', async () => {
    await assertFails(applicant(p.anon, null, 'X8', {}, { extra: 1 }));
  });
  it('provider doc without the contact doc is accepted on its own; contact doc alone is not', async () => {
    await assertSucceeds(setDoc(doc(p.anon, 'service_providers/ALONE'), {
      name: 'a', category: 'c', website: '', description: 'd', service_areas: [], status: 'pending',
      rating_avg: 0, rating_count: 0, created_at: serverTimestamp(), owner_uid: null,
    }));
    await assertFails(setDoc(doc(p.anon, 'service_provider_contacts/ORPHAN'), {
      contact_email: 'a', contact_phone: '1', address: 'x', owner_uid: null,
    }));
  });
  it('cannot create a contact doc for an already existing provider', async () => {
    await assertFails(setDoc(doc(p.dave, 'service_provider_contacts/P_pending'), {
      contact_email: 'a', contact_phone: '1', address: 'x', owner_uid: 'carol',
    }));
    await assertFails(setDoc(doc(p.carol, 'service_provider_contacts/P_pending'), {
      contact_email: 'a', contact_phone: '1', address: 'x', owner_uid: 'carol',
    }));
  });
  it('update/delete: root only', async () => {
    await assertFails(updateDoc(doc(p.dave, 'service_providers/P_active'), { name: 'x' }));
    await assertFails(deleteDoc(doc(p.dave, 'service_providers/P_active')));
    await assertFails(updateDoc(doc(p.anon, 'service_providers/P_active'), { status: 'active' }));
    await assertSucceeds(updateDoc(doc(p.root, 'service_providers/P_pending'), { status: 'active' }));
    await assertSucceeds(deleteDoc(doc(p.root, 'service_providers/P_active')));
  });
  it('contacts: readable when signed in, not anon; update/delete root only', async () => {
    await assertSucceeds(getDoc(doc(p.carol, 'service_provider_contacts/P_active')));
    await assertFails(getDoc(doc(p.anon, 'service_provider_contacts/P_active')));
    await assertFails(updateDoc(doc(p.dave, 'service_provider_contacts/P_active'), { address: 'y' }));
    await assertFails(deleteDoc(doc(p.dave, 'service_provider_contacts/P_active')));
    await assertSucceeds(updateDoc(doc(p.root, 'service_provider_contacts/P_active'), { address: 'y' }));
  });
});

describe('service_reviews', () => {
  const review = (uid: string, extra: Record<string, unknown> = {}) => ({
    provider_id: 'P_active', user_id: uid, user_name: 'Name', rating: 4, comment: 'gott', created_at: serverTimestamp(), ...extra,
  });
  it('carol creates P_active_carol (ReviewModal fields)', async () => {
    await assertSucceeds(setDoc(doc(p.carol, 'service_reviews/P_active_carol'), review('carol')));
  });
  it('wrong id, rating 0/6/non-int, another user_id, missing provider, extra key, anon: all denied', async () => {
    await assertFails(setDoc(doc(p.carol, 'service_reviews/wrongid'), review('carol')));
    await assertFails(setDoc(doc(p.carol, 'service_reviews/P_active_carol'), review('carol', { rating: 0 })));
    await assertFails(setDoc(doc(p.carol, 'service_reviews/P_active_carol'), review('carol', { rating: 6 })));
    await assertFails(setDoc(doc(p.carol, 'service_reviews/P_active_carol'), review('carol', { rating: 4.5 })));
    await assertFails(setDoc(doc(p.carol, 'service_reviews/P_active_carol'), review('dave')));
    await assertFails(setDoc(doc(p.carol, 'service_reviews/NOPE_carol'), review('carol', { provider_id: 'NOPE' })));
    await assertFails(setDoc(doc(p.carol, 'service_reviews/P_active_carol'), review('carol', { extra: 1 })));
    await assertFails(setDoc(doc(p.carol, 'service_reviews/P_active_carol'), review('carol', { comment: 'x'.repeat(1001) })));
    await assertFails(setDoc(doc(p.anon, 'service_reviews/P_active_carol'), review('carol')));
  });
  it('a second write to the same id is an update and is denied; root may update/delete', async () => {
    await assertSucceeds(setDoc(doc(p.carol, 'service_reviews/P_active_carol'), review('carol')));
    await assertFails(setDoc(doc(p.carol, 'service_reviews/P_active_carol'), review('carol', { rating: 1 })));
    await assertFails(deleteDoc(doc(p.carol, 'service_reviews/P_active_carol')));
    await assertSucceeds(deleteDoc(doc(p.root, 'service_reviews/P_active_carol')));
  });
  it('anon reads (get and the marketplace full-collection list)', async () => {
    await assertSucceeds(getDoc(doc(p.anon, 'service_reviews/P_active_dave')));
    await assertSucceeds(getDocs(collection(p.anon, 'service_reviews')));
  });
});

describe('feedback and public copies', () => {
  it('feedback: signed-in create, anon create denied, read root only', async () => {
    await assertSucceeds(addDoc(collection(p.carol, 'feedback'), { comment: 'x' }));
    await assertFails(addDoc(collection(p.anon, 'feedback'), { comment: 'x' }));
    await assertFails(getDoc(doc(p.carol, 'feedback/f1')));
    await assertFails(getDocs(collection(p.carol, 'feedback')));
    await assertSucceeds(getDocs(query(collection(p.root, 'feedback'), where('featured', '==', true))));
    await assertFails(updateDoc(doc(p.carol, 'feedback/f1'), { featured: true }));
    await assertSucceeds(updateDoc(doc(p.root, 'feedback/f1'), { featured: true }));
  });
  it('featured_feedback: anon reads, root writes only', async () => {
    await assertSucceeds(getDocs(collection(p.anon, 'featured_feedback')));
    await assertSucceeds(getDoc(doc(p.anon, 'featured_feedback/f1')));
    await assertFails(setDoc(doc(p.alice, 'featured_feedback/f2'), { comment: 'x' }));
    await assertFails(setDoc(doc(p.anon, 'featured_feedback/f2'), { comment: 'x' }));
    await assertSucceeds(setDoc(doc(p.root, 'featured_feedback/f2'), { comment: 'x' }));
  });
});

describe('platform collections', () => {
  it('funnel_events: signed-in create; read root only (funnelService query)', async () => {
    await assertSucceeds(addDoc(collection(p.carol, 'funnel_events'), { uid: 'carol', event_name: 'x' }));
    await assertFails(addDoc(collection(p.anon, 'funnel_events'), { uid: 'x' }));
    await assertFails(getDocs(query(collection(p.carol, 'funnel_events'), where('uid', '==', 'carol'), limit(10))));
    await assertSucceeds(getDocs(query(collection(p.root, 'funnel_events'), where('uid', '==', 'carol'), limit(10))));
  });
  it('top-level internal_logs: signed-in create; read root only', async () => {
    await assertSucceeds(addDoc(collection(p.carol, 'internal_logs'), { m: 1 }));
    await assertFails(addDoc(collection(p.anon, 'internal_logs'), { m: 1 }));
    await assertFails(getDoc(doc(p.carol, 'internal_logs/l1')));
    await assertSucceeds(getDoc(doc(p.root, 'internal_logs/l1')));
  });
  it('contact_submissions: anyone creates; read root only', async () => {
    await assertSucceeds(addDoc(collection(p.anon, 'contact_submissions'), { m: 1 }));
    await assertFails(getDoc(doc(p.carol, 'contact_submissions/c1')));
    await assertSucceeds(getDoc(doc(p.root, 'contact_submissions/c1')));
  });
  it('newsletter_subscribers: anyone creates; read root only', async () => {
    await assertSucceeds(addDoc(collection(p.anon, 'newsletter_subscribers'), { email: 'a@b.is' }));
    await assertFails(getDocs(collection(p.carol, 'newsletter_subscribers')));
    await assertSucceeds(getDocs(collection(p.root, 'newsletter_subscribers')));
  });
  it('coupons and email_templates: root only', async () => {
    for (const path of ['coupons/cp1', 'email_templates/welcome']) {
      await assertFails(getDoc(doc(p.carol, path)));
      await assertFails(setDoc(doc(p.carol, path), { a: 1 }));
      await assertSucceeds(getDoc(doc(p.root, path)));
      await assertSucceeds(setDoc(doc(p.root, path), { a: 1 }));
    }
  });
  it('system: signed-in read, root write', async () => {
    await assertSucceeds(getDoc(doc(p.carol, 'system/s')));
    await assertFails(getDoc(doc(p.anon, 'system/s')));
    await assertFails(setDoc(doc(p.carol, 'system/s'), { a: 1 }));
    await assertSucceeds(setDoc(doc(p.root, 'system/s'), { a: 1 }));
  });
  it('legacy top-level bookings: root only', async () => {
    await assertFails(getDoc(doc(p.alice, 'bookings/legacy')));
    await assertFails(setDoc(doc(p.alice, 'bookings/n'), { a: 1 }));
    await assertSucceeds(getDoc(doc(p.root, 'bookings/legacy')));
    await assertSucceeds(setDoc(doc(p.root, 'bookings/n'), { a: 1 }));
  });
});

describe('multi-write client flows', () => {
  it('OnboardingPage: transaction creates the house and updates users/{uid}.house_ids', async () => {
    await assertSucceeds(
      runTransaction(p.alice, async (tx) => {
        const userRef = doc(p.alice, 'users/alice');
        await tx.get(userRef);
        tx.set(doc(p.alice, 'houses/NEWH'), {
          name: 'n', manager_id: 'alice', owner_ids: ['alice'], invite_code: 'X', created_at: new Date(), updated_at: new Date(),
        });
        tx.update(userRef, { house_ids: arrayUnion('NEWH') });
      })
    );
    // and the creator can then use the new house's subcollections
    await assertSucceeds(addDoc(collection(p.alice, 'houses/NEWH/tasks'), { title: 't' }));
    await assertSucceeds(addDoc(collection(p.alice, 'houses/NEWH/internal_logs'), { title: 't' }));
  });
  it('userService.commitInChunks: a 450-update batch on house subcollections by a member', async () => {
    const batch = writeBatch(p.bob);
    for (let i = 0; i < 450; i++) {
      batch.set(doc(p.bob, `houses/H1/${i % 2 ? 'tasks' : 'bookings'}/bulk${i}`), { user_name: 'New', n: i });
    }
    await assertSucceeds(batch.commit());
  });
  it('feedbackService: root toggles featured in one batch with the public copy', async () => {
    const b = writeBatch(p.root);
    b.update(doc(p.root, 'feedback/f1'), { featured: true });
    b.set(doc(p.root, 'featured_feedback/f1'), { userName: 'A', rating: 5 });
    await assertSucceeds(b.commit());
  });
});
