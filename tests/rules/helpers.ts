import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

// Only ever a demo- project: the emulator never talks to real Firebase.
export const PROJECT_ID = 'demo-bustadurinn';

// Must match the address hardcoded in isSuperAdmin() in firestore.rules.
export const OWNER_EMAIL = 'thorarinnhjalmarsson@gmail.com';

function hostPort(envVar: string, fallbackPort: number) {
  const raw = process.env[envVar];
  if (raw) {
    const [host, port] = raw.split(':');
    return { host, port: Number(port) };
  }
  return { host: '127.0.0.1', port: fallbackPort };
}

// RULES_DIR (optional) points at a directory holding alternative copies of the
// rules files; used only to sanity-check that the tests really bite.
const rulesDir = () => process.env.RULES_DIR ?? process.cwd();

export async function createEnv(): Promise<RulesTestEnvironment> {
  const fs = hostPort('FIRESTORE_EMULATOR_HOST', 8080);
  const st = hostPort('FIREBASE_STORAGE_EMULATOR_HOST', 9199);
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      ...fs,
      rules: readFileSync(resolve(rulesDir(), 'firestore.rules'), 'utf8'),
    },
    storage: {
      ...st,
      rules: readFileSync(resolve(rulesDir(), 'storage.rules'), 'utf8'),
    },
  });
}

// Personas (uids). Token claims for the two email personas are in `ctx`.
export const UID = {
  alice: 'alice',
  bob: 'bob',
  carol: 'carol',
  dave: 'dave',
  orgAdmin: 'orgAdmin',
  orgMember: 'orgMember',
  orgSuspended: 'orgSuspended',
  root: 'root',
  ownerEmail: 'ownerEmail',
  fakeOwnerEmail: 'fakeOwnerEmail',
} as const;

export function personas(env: RulesTestEnvironment) {
  const db = (uid: string, claims: Record<string, unknown> = {}) =>
    env.authenticatedContext(uid, claims).firestore();
  return {
    anon: env.unauthenticatedContext().firestore(),
    alice: db(UID.alice),
    bob: db(UID.bob),
    carol: db(UID.carol),
    dave: db(UID.dave),
    orgAdmin: db(UID.orgAdmin),
    orgMember: db(UID.orgMember),
    orgSuspended: db(UID.orgSuspended),
    root: db(UID.root),
    ownerEmail: db(UID.ownerEmail, { email: OWNER_EMAIL, email_verified: true }),
    fakeOwnerEmail: db(UID.fakeOwnerEmail, { email: OWNER_EMAIL, email_verified: false }),
  };
}
