/* eslint-disable no-empty-pattern -- Playwright fixtures must destructure their dependencies, even when there are none */
import { test as base, expect, type BrowserContext, type Page, type Route } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { addToArray, deleteDocByPath, getDoc, listDocs, removeFromArray, setDoc } from './emulator';
import { A, B, H1, HOUSE_NAME, PASSWORD, seed } from './seed';

const BASE = 'http://127.0.0.1:5197';
export const SHOTS = join(process.cwd(), 'tests', 'e2e-emulator', 'screenshots');

export interface Member { uid: string; name: string; email: string; avatar_url: string | null }

export interface Mocks {
  members: Member[];
  managerId: string;
  /** `invite-info` answers for these tokens/codes; anything else is a 404 like the real handler. */
  inviteTokens: Record<string, { houseId: string; houseName: string; inviterName: string; email: string }>;
  calls: Array<{ path: string; method: string; body: any; uid: string | null }>;
  /** Result of the (mocked) /api/admin-audit-users scan. */
  audit: { orphans: any[]; stuckUsers: any[]; testUsers: any[] };
  /** Overrides the answer of /api/admin-send-reply (default: success). */
  replyStatus: number;
}

export interface Problems {
  pageErrors: string[];
  consoleErrors: string[];
  permissionDenied: string[];
  unmockedApi: string[];
  /** Requests to a real (non-local) host that should never happen: prod API, real Firebase. */
  forbidden: string[];
  /** Allow-listed console noise, kept so the report can list it. */
  allowed: string[];
}

function uidFromAuthHeader(h: string | undefined): string | null {
  const tok = h?.replace(/^Bearer\s+/i, '');
  if (!tok) return null;
  try {
    const payload = JSON.parse(Buffer.from(tok.split('.')[1], 'base64url').toString());
    return payload.user_id ?? payload.sub ?? null;
  } catch {
    return null;
  }
}

export function defaultMembers(): Member[] {
  return [
    { uid: A.uid, name: A.name, email: A.email, avatar_url: null },
    { uid: B.uid, name: B.name, email: B.email, avatar_url: null },
  ];
}

function metNoForecast() {
  const series = [];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  for (let h = 0; h < 24 * 6; h += 3) {
    series.push({
      time: new Date(start.getTime() + h * 3_600_000).toISOString(),
      data: {
        instant: { details: { air_temperature: 8 + (h % 5), wind_speed: 4, relative_humidity: 70 } },
        next_1_hours: { summary: { symbol_code: 'partlycloudy_day' }, details: { precipitation_amount: 0 } },
      },
    });
  }
  return { properties: { timeseries: series } };
}

/** Blocked third parties: abort. Fonts CSS is answered empty so no console noise. */
const THIRD_PARTY_ABORT = /google-analytics|googletagmanager|facebook|sentry|umsognin|maps\.google|maps\.gstatic|allorigins|met\.no|vegagerdin|gstatic\.com\/firebasejs/i;

export async function installRoutes(context: BrowserContext, mocks: Mocks, problems: Problems) {
  // 1. Catch-all for everything that is not the local dev server.
  await context.route('**/*', async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.origin === BASE || url.hostname === '127.0.0.1' || url.protocol === 'data:' || url.protocol === 'blob:') {
      return route.fallback();
    }
    const href = url.href;
    if (/^https:\/\/(www\.)?bustadurinn\.is/.test(href)) {
      problems.forbidden.push(`production site: ${route.request().method()} ${href}`);
      return route.abort();
    }
    if (url.hostname === 'api.open-meteo.com') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ current: { temperature_2m: 7.4, weather_code: 2, wind_speed_10m: 14.4 } }),
      });
    }
    if (url.hostname === 'fonts.googleapis.com') {
      return route.fulfill({ status: 200, contentType: 'text/css', body: '/* fonts blocked in tests */' });
    }
    if (url.hostname === 'fonts.gstatic.com') return route.abort();
    if (THIRD_PARTY_ABORT.test(href)) return route.abort();
    if (/googleapis\.com|firebaseio\.com|firebaseapp\.com|firebasestorage|identitytoolkit|securetoken/i.test(href)) {
      problems.forbidden.push(`real Firebase endpoint: ${route.request().method()} ${href}`);
      return route.abort();
    }
    // Any other third party (images, etc.) is simply blocked.
    return route.abort();
  });

  // 2. Every /api/* call is answered by a fake built from the real handlers' response shapes.
  await context.route('**/api/**', async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== BASE || !url.pathname.startsWith('/api/')) return route.fallback();

    const name = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
    let body: any = null;
    try {
      body = req.postDataJSON();
    } catch {
      body = null;
    }
    const uid = uidFromAuthHeader(req.headers()['authorization']);
    mocks.calls.push({ path: name, method: req.method(), body, uid });
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    switch (name) {
      case 'house-members':
        return json({ members: mocks.members, managerId: mocks.managerId });
      case 'house-notification':
      case 'booking-notification':
        return json({ success: true, recipients: 1, inAppCount: 1, pushCount: 0, failCount: 0 });
      case 'push-notification':
        return json({ success: true, sent: 0 });
      case 'send-email':
        return json({ success: true, id: 'mock-email-id' });
      case 'invite-member':
        return json({ success: true, token: 'mock-invite-token' });
      case 'contact':
        return json({ success: true });
      case 'invite-info': {
        const key = body?.token ?? body?.code;
        const info = mocks.inviteTokens[String(key)];
        return info ? json(info) : json({ error: 'not_found' }, 404);
      }
      case 'join-house': {
        // SIMULATED side effect of api/join-house.ts (Admin SDK): add the caller to the house.
        if (!uid || !body?.houseId) return json({ error: 'Unauthorized' }, 401);
        await addToArray(`houses/${body.houseId}`, 'owner_ids', uid);
        await addToArray(`users/${uid}`, 'house_ids', body.houseId);
        return json({ success: true, message: 'Joined house successfully' });
      }
      case 'guestbook-entry': {
        // SIMULATED: the real handler validates the guest token and writes with the Admin SDK.
        if (!body?.token || !body?.name || !body?.message) return json({ error: 'bad_request' }, 400);
        const view = await getDoc(`guest_views/${body.token}`);
        if (!view) return json({ error: 'not_found' }, 404);
        await setDoc(`guestbook/gb-${Date.now()}`, {
          house_id: view.houseId,
          author: body.name,
          message: body.message,
          created_at: new Date(),
        });
        return json({ success: true });
      }
      case 'leave-house': {
        // SIMULATED side effect of api/leave-house.ts.
        if (!uid || !body?.houseId) return json({ error: 'invalid_request', code: 'invalid_request' }, 400);
        await removeFromArray(`houses/${body.houseId}`, 'owner_ids', uid);
        await removeFromArray(`users/${uid}`, 'house_ids', body.houseId);
        mocks.members = mocks.members.filter((m) => m.uid !== uid);
        return json({ success: true, left: true });
      }
      case 'remove-member': {
        // SIMULATED side effect of api/remove-member.ts.
        if (!body?.houseId || !body?.memberId) return json({ error: 'invalid_request', code: 'invalid_request' }, 400);
        await removeFromArray(`houses/${body.houseId}`, 'owner_ids', body.memberId);
        await removeFromArray(`users/${body.memberId}`, 'house_ids', body.houseId);
        mocks.members = mocks.members.filter((m) => m.uid !== body.memberId);
        return json({ success: true, removed: true });
      }
      case 'transfer-manager': {
        if (!body?.houseId || !body?.newManagerId) return json({ error: 'invalid_request', code: 'invalid_request' }, 400);
        const h = (await getDoc(`houses/${body.houseId}`)) ?? {};
        await setDoc(`houses/${body.houseId}`, { ...h, manager_id: body.newManagerId });
        mocks.managerId = body.newManagerId;
        return json({ success: true });
      }
      case 'delete-account':
        // Not actually deleting anything: the dialog tests only verify the confirm gate.
        return body?.confirm === 'EYÐA' ? json({ success: true }) : json({ error: 'invalid_request', code: 'invalid_request' }, 400);
      case 'admin-audit-users':
      case 'admin-delete-user':
      case 'admin-repair-user':
      case 'admin-delete-house':
      case 'admin-send-reply':
      case 'analytics':
      case 'search-console': {
        // Like api/utils/apiAuth.ts requireAdmin: a Firebase ID token whose user has user_roles.system_role = super_admin.
        const role = uid ? await getDoc(`user_roles/${uid}`) : null;
        if (!uid) return json({ error: 'Unauthorized' }, 401);
        if (role?.system_role !== 'super_admin') return json({ error: 'Forbidden' }, 403);
        switch (name) {
          case 'admin-audit-users':
            return json({
              ...mocks.audit,
              stats: {
                totalAuth: 5,
                totalFirestore: 3,
                orphanCount: mocks.audit.orphans.length,
                stuckCount: mocks.audit.stuckUsers.length,
                testCount: mocks.audit.testUsers.length,
              },
            });
          case 'admin-delete-user':
            if (!body?.uid) return json({ error: 'Missing uid' }, 400);
            return json({ success: true, message: `User ${body.uid} deleted completely` });
          case 'admin-repair-user':
            if (!body?.uid) return json({ error: 'Missing uid' }, 400);
            return json({ success: true, message: 'Profile created' });
          case 'admin-delete-house':
            if (!body?.houseId) return json({ error: 'Invalid houseId' }, 400);
            // SIMULATED: the real handler recursively deletes the house with the Admin SDK.
            await deleteDocByPath(`houses/${body.houseId}`);
            return json({
              success: true,
              deleted: { house: 1, guest_views: 0, invitations: 0, guestbook: 0, notifications: 0 },
              usersUpdated: 0,
              note: `Skrár í Storage undir houses/${body.houseId}/ voru ekki fjarlægðar.`,
            });
          case 'admin-send-reply':
            if (mocks.replyStatus !== 200) return json({ error: 'Failed to send email' }, mocks.replyStatus);
            if (!body?.to || !body?.text || !body?.submissionId) return json({ error: 'Invalid message' }, 400);
            return json({ success: true });
          case 'analytics':
            return json({
              activeUsers: 1234,
              sessions: 2345,
              screenPageViews: 9876,
              engagementRate: 0.62,
              topPages: [{ pagePath: '/eiginleikar', screenPageViews: 700 }, { pagePath: '/', screenPageViews: 500 }],
              trafficSources: [{ source: 'google', users: 800 }, { source: '(direct)', users: 300 }],
            });
          default:
            return json({
              clicks: 321,
              impressions: 12345,
              ctr: 2.6,
              position: 8.4,
              topQueries: [{ query: 'sumarhús skipulag', clicks: 40, impressions: 900 }],
            });
        }
      }
      case 'road-conditions':
        return json([{ NAFN: 'Hringvegur', ASTAND: 'Greiðfært', LYSING: 'Greiðfært' }]);
      case 'weather':
        return json(metNoForecast());
      default:
        problems.unmockedApi.push(`${req.method()} ${url.pathname}${url.search}`);
        return route.abort();
    }
  });
}

/** Console noise that is not an app defect. Everything else fails the test. */
const NOISE: Array<{ re: RegExp; why: string; onlyForUrl?: RegExp }> = [
  {
    re: /Failed to load resource: net::ERR_FAILED/i,
    why: 'a request we deliberately aborted (blocked third party such as fonts.gstatic.com / analytics)',
  },
  {
    // The real api/invite-info answers 404 for an unknown/expired invite; Chromium logs every non-2xx fetch.
    re: /Failed to load resource: the server responded with a status of 404/i,
    why: 'the expected 404 of /api/invite-info for an invalid invite (the page then shows its error card)',
    onlyForUrl: /\/api\/invite-info$/,
  },
  {
    // Closing a page while the Firestore long-polling channel is open makes the SDK send a
    // `TYPE=terminate` request that the emulator can answer with 400. It only happens at teardown.
    re: /Failed to load resource: the server responded with a status of 400/i,
    why: 'the Firestore channel `TYPE=terminate` request sent while the page is closing',
    onlyForUrl: /\/google\.firestore\.v1\.Firestore\/(Write|Listen)\/channel\?.*TYPE=terminate/,
  },
];

function attach(page: Page, problems: Problems) {
  page.on('pageerror', (e) => problems.pageErrors.push(`${e.message}\n${e.stack ?? ''}`.slice(0, 600)));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    const where = msg.location()?.url ?? '';
    if (/permission-denied|Missing or insufficient permissions/i.test(text)) {
      problems.permissionDenied.push(text.slice(0, 400));
    }
    const noise = NOISE.find((n) => n.re.test(text) && (n.onlyForUrl ? n.onlyForUrl.test(where) : !/127\.0\.0\.1/.test(where)));
    if (noise) {
      problems.allowed.push(`${noise.why}: ${text.slice(0, 120)} (${where.slice(0, 80)})`);
      return;
    }
    problems.consoleErrors.push(`${text.slice(0, 500)}${where ? `  @ ${where}` : ''}`);
  });
}

export interface AppFixtures {
  mocks: Mocks;
  problems: Problems;
  /** Dialogs (confirm/alert) shown by the page; they are accepted automatically. */
  nativeDialogs: string[];
  /** Answers handed to `window.prompt()` in order (empty string when the queue is empty). */
  promptAnswers: string[];
  /**
   * Uncaught page errors a test knowingly tolerates (matched against the message). Empty by default;
   * a test that adds one must say why next to the push.
   */
  allowedPageErrors: RegExp[];
}

export const test = base.extend<AppFixtures>({
  mocks: async ({}, provide) => {
    await provide({
      members: defaultMembers(),
      managerId: A.uid,
      inviteTokens: {},
      calls: [],
      audit: { orphans: [], stuckUsers: [], testUsers: [] },
      replyStatus: 200,
    });
  },
  problems: async ({}, provide) => {
    await provide({ pageErrors: [], consoleErrors: [], permissionDenied: [], unmockedApi: [], forbidden: [], allowed: [] });
  },
  nativeDialogs: async ({}, provide) => {
    await provide([]);
  },
  promptAnswers: async ({}, provide) => {
    await provide([]);
  },
  allowedPageErrors: async ({}, provide) => {
    await provide([]);
  },
  context: async ({ context, mocks, problems }, provide) => {
    await installRoutes(context, mocks, problems);
    await provide(context);
  },
  page: async ({ page, problems, nativeDialogs, promptAnswers, allowedPageErrors }, provide, testInfo) => {
    attach(page, problems);
    page.on('dialog', async (d) => {
      nativeDialogs.push(`${d.type()}: ${d.message()}`);
      await d.accept(d.type() === 'prompt' ? (promptAnswers.shift() ?? '') : undefined);
    });
    await provide(page);
    // Fail on anything the app did wrong or any request that should never have been made.
    const label = testInfo.title;
    expect.soft(problems.unmockedApi, `[${label}] un-mocked /api calls`).toEqual([]);
    expect.soft(problems.forbidden, `[${label}] requests to real hosts`).toEqual([]);
    const pageErrors = problems.pageErrors.filter((e) => !allowedPageErrors.some((re) => re.test(e)));
    expect.soft(pageErrors, `[${label}] uncaught page errors`).toEqual([]);
    expect.soft(problems.permissionDenied, `[${label}] Firestore permission-denied`).toEqual([]);
    expect.soft(problems.consoleErrors, `[${label}] console.error output`).toEqual([]);
  },
});

export { expect };

/** Wipes + reseeds the emulators. Call from beforeEach. */
export async function freshSeed() {
  await seed();
}

export async function login(page: Page, user: { email: string }, then = '/dashboard') {
  await page.goto('/login');
  await page.getByLabel('Netfang').fill(user.email);
  await page.getByLabel('Lykilorð').fill(PASSWORD);
  await page.getByRole('button', { name: 'Skrá inn', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20_000 });
  if (then) await page.goto(then);
}

export async function shot(page: Page, name: string, testInfo: { project: { name: string } }) {
  mkdirSync(SHOTS, { recursive: true });
  await page.waitForTimeout(400); // let dialog/fade animations settle
  await page.screenshot({ path: join(SHOTS, `${name}.${testInfo.project.name}.png`), fullPage: false });
}

export { A, B, H1, HOUSE_NAME, PASSWORD, getDoc, listDocs, setDoc, deleteDocByPath };
