import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { createEnv } from './helpers';

// storage.rules calls firestore.get() for house membership, so the house doc is
// seeded in the Firestore emulator of the same environment.

let env: RulesTestEnvironment;
const MB = 1024 * 1024;
const bytes = (n: number) => new Uint8Array(n);
const jpeg = { contentType: 'image/jpeg' };

const st = (uid?: string) =>
  (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).storage();

beforeAll(async () => {
  env = await createEnv();
});
afterAll(async () => {
  await env.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'houses/H1'), { owner_ids: ['alice', 'bob'], manager_id: 'alice' });
    await uploadBytes(ref(ctx.storage(), 'houses/H1/existing.jpg'), bytes(10), jpeg);
    await uploadBytes(ref(ctx.storage(), 'users/carol/avatar.jpg'), bytes(10), jpeg);
  });
});

describe('houses/{houseId}/{file}', () => {
  it('members upload an image under 5 MB', async () => {
    await assertSucceeds(uploadBytes(ref(st('alice'), 'houses/H1/image.jpg'), bytes(1 * MB), jpeg));
    await assertSucceeds(uploadBytes(ref(st('bob'), 'houses/H1/gallery_123.jpg'), bytes(1 * MB), jpeg));
    await assertSucceeds(uploadBytes(ref(st('bob'), 'houses/H1/image.jpg'), bytes(1 * MB), jpeg)); // overwrite = update
  });
  it('carol and anon cannot upload', async () => {
    await assertFails(uploadBytes(ref(st('carol'), 'houses/H1/image.jpg'), bytes(1000), jpeg));
    await assertFails(uploadBytes(ref(st(), 'houses/H1/image.jpg'), bytes(1000), jpeg));
  });
  it('a house that does not exist denies uploads', async () => {
    await assertFails(uploadBytes(ref(st('alice'), 'houses/NOPE/image.jpg'), bytes(1000), jpeg));
  });
  it('6 MB and non-image content types are denied', async () => {
    await assertFails(uploadBytes(ref(st('alice'), 'houses/H1/big.jpg'), bytes(6 * MB), jpeg));
    await assertFails(uploadBytes(ref(st('alice'), 'houses/H1/doc.pdf'), bytes(1000), { contentType: 'application/pdf' }));
  });
  it('anyone reads', async () => {
    await assertSucceeds(getBytes(ref(st(), 'houses/H1/existing.jpg')));
    await assertSucceeds(getBytes(ref(st('carol'), 'houses/H1/existing.jpg')));
  });
  it('delete: member yes, carol and anon no', async () => {
    await assertFails(deleteObject(ref(st('carol'), 'houses/H1/existing.jpg')));
    await assertFails(deleteObject(ref(st(), 'houses/H1/existing.jpg')));
    await assertSucceeds(deleteObject(ref(st('bob'), 'houses/H1/existing.jpg')));
  });
});

describe('users/{uid}/{file}', () => {
  it('own uid uploads up to 2 MB of image', async () => {
    await assertSucceeds(uploadBytes(ref(st('carol'), 'users/carol/avatar.jpg'), bytes(1 * MB), jpeg));
  });
  it('3 MB, non-image, other uid, anon are denied', async () => {
    await assertFails(uploadBytes(ref(st('carol'), 'users/carol/avatar.jpg'), bytes(3 * MB), jpeg));
    await assertFails(uploadBytes(ref(st('carol'), 'users/carol/a.pdf'), bytes(100), { contentType: 'application/pdf' }));
    await assertFails(uploadBytes(ref(st('alice'), 'users/carol/avatar.jpg'), bytes(100), jpeg));
    await assertFails(uploadBytes(ref(st(), 'users/carol/avatar.jpg'), bytes(100), jpeg));
  });
  it('anyone reads; only the owner deletes', async () => {
    await assertSucceeds(getBytes(ref(st(), 'users/carol/avatar.jpg')));
    await assertFails(deleteObject(ref(st('alice'), 'users/carol/avatar.jpg')));
    await assertSucceeds(deleteObject(ref(st('carol'), 'users/carol/avatar.jpg')));
  });
});

describe('everything else', () => {
  it('any other path is denied for read and write, signed in or not', async () => {
    await assertFails(uploadBytes(ref(st('alice'), 'misc/file.jpg'), bytes(100), jpeg));
    await assertFails(getBytes(ref(st('alice'), 'misc/file.jpg')));
    await assertFails(uploadBytes(ref(st('alice'), 'houses/H1/sub/dir/file.jpg'), bytes(100), jpeg));
  });
});
