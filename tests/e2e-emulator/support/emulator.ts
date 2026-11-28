/**
 * Talks to the LOCAL Firebase emulators only (127.0.0.1). Seeding goes through the
 * emulators' admin-style REST endpoints with `Authorization: Bearer owner`, which
 * bypasses security rules; the app itself always runs under the real rules.
 */

export const PROJECT = 'demo-bustadurinn';
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const FS_EMU = `http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}`;
const AUTH_ADMIN = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJECT}`;
const AUTH_EMU = `http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}`;
const OWNER = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

type FsValue = Record<string, unknown>;

export function toFs(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFs) } };
  if (typeof v === 'object') {
    const fields: Record<string, FsValue> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val !== undefined) fields[k] = toFs(val);
    }
    return { mapValue: { fields } };
  }
  throw new Error(`cannot encode ${typeof v}`);
}

export function fromFs(v: any): any {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return new Date(v.timestampValue);
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fromFs);
  if ('mapValue' in v) {
    return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, fromFs(x)]));
  }
  return undefined;
}

async function check(res: Response, what: string) {
  if (!res.ok) throw new Error(`${what} failed: ${res.status} ${await res.text()}`);
  return res;
}

export async function setDoc(path: string, data: Record<string, unknown>) {
  const body = { fields: (toFs(data) as any).mapValue.fields };
  await check(await fetch(`${FS}/${path}`, { method: 'PATCH', headers: OWNER, body: JSON.stringify(body) }), `setDoc ${path}`);
}

export async function getDoc(path: string): Promise<Record<string, any> | null> {
  const res = await fetch(`${FS}/${path}`, { headers: OWNER });
  if (res.status === 404) return null;
  await check(res, `getDoc ${path}`);
  const json: any = await res.json();
  return Object.fromEntries(Object.entries(json.fields ?? {}).map(([k, v]) => [k, fromFs(v)]));
}

export async function listDocs(collectionPath: string): Promise<Array<Record<string, any> & { id: string }>> {
  const res = await check(await fetch(`${FS}/${collectionPath}?pageSize=300`, { headers: OWNER }), `listDocs ${collectionPath}`);
  const json: any = await res.json();
  return (json.documents ?? []).map((d: any) => ({
    id: String(d.name).split('/').pop(),
    ...Object.fromEntries(Object.entries(d.fields ?? {}).map(([k, v]) => [k, fromFs(v)])),
  }));
}

export async function addToArray(path: string, field: string, value: string) {
  const doc = (await getDoc(path)) ?? {};
  const arr: string[] = Array.isArray(doc[field]) ? doc[field] : [];
  if (!arr.includes(value)) await setDoc(path, { ...doc, [field]: [...arr, value] });
}

export async function removeFromArray(path: string, field: string, value: string) {
  const doc = (await getDoc(path)) ?? {};
  const arr: string[] = Array.isArray(doc[field]) ? doc[field] : [];
  await setDoc(path, { ...doc, [field]: arr.filter((x) => x !== value) });
}

export async function createAuthUser(uid: string, email: string, password: string, displayName: string) {
  await check(
    await fetch(`${AUTH_ADMIN}/accounts`, {
      method: 'POST',
      headers: OWNER,
      body: JSON.stringify({ localId: uid, email, password, displayName, emailVerified: true }),
    }),
    `createAuthUser ${email}`
  );
}

export async function resetEmulators() {
  await check(await fetch(`${FS_EMU}/databases/(default)/documents`, { method: 'DELETE' }), 'clear firestore');
  await check(await fetch(`${AUTH_EMU}/accounts`, { method: 'DELETE' }), 'clear auth');
}

export async function emulatorsUp(): Promise<boolean> {
  try {
    const [a, f] = await Promise.all([fetch('http://127.0.0.1:9099/'), fetch('http://127.0.0.1:8080/')]);
    return a.ok && f.ok;
  } catch {
    return false;
  }
}
