import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect, freshSeed, login, A, B, H1 } from './support/fixtures';
import { createAuthUser, setDoc } from './support/emulator';
import { GUEST_TOKEN, HOUSE_NAME, ORG, PASSWORD, midnight, seedOrganization, seedSuperAdmin, ymd } from './support/seed';

/**
 * p: automated accessibility scan (axe-core, WCAG 2.0/2.1/2.2 A + AA) of the signed-in app and the public
 * entry pages, at desktop (1280x800) and phone (390x844) size.
 *
 * `serious` and `critical` violations fail the test. `moderate` and `minor` ones are attached to the test
 * output as annotations and do not fail. Every scan prints its violations compactly (rule, impact, count,
 * up to three targets with their HTML) so a failure can be fixed from the log alone.
 *
 * A known false positive is excluded for ONE rule on ONE selector in KNOWN_FALSE_POSITIVES, with the reason.
 * Never disable a rule globally.
 */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** rule + a regex on the node's selector path; each entry says why axe is wrong about it. */
const KNOWN_FALSE_POSITIVES: Array<{ rule: string; target: RegExp; why: string }> = [];

const GENERIC_TITLE = 'Bústaðurinn.is — Bókunarkerfi fyrir sumarhús í sameign';

interface Found { scan: string; rule: string; impact: string; count: number }

async function scan(page: Page, name: string, opts: { title?: 'specific' | 'any' } = {}) {
  const info = test.info();
  // Let route transitions, dialog fades and lazy chunks finish; axe computes contrast from the settled frame.
  // (no `networkidle`: the Firestore long-poll channel keeps the network busy forever)
  await page.waitForTimeout(800);

  const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();

  const violations = result.violations
    .map((v) => ({
      ...v,
      nodes: v.nodes.filter(
        (n) => !KNOWN_FALSE_POSITIVES.some((fp) => fp.rule === v.id && fp.target.test(n.target.join(' ')))
      ),
    }))
    .filter((v) => v.nodes.length > 0);

  const lines = violations.map((v) => {
    const targets = v.nodes
      .slice(0, 3)
      .map((n) => {
        const why = (n.any[0]?.message ?? n.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 200);
        return `      ${n.target.join(' ')}\n        ${n.html.replace(/\s+/g, ' ').slice(0, 160)}\n        -> ${why}`;
      })
      .join('\n');
    return `  [${v.impact}] ${v.id} x${v.nodes.length}: ${v.help}\n${targets}`;
  });
  const report = `axe: ${name} (${info.project.name}) -> ${violations.length} violation(s)${lines.length ? '\n' + lines.join('\n') : ''}`;
  console.log(report);
  for (const v of violations) {
    if (v.impact === 'serious' || v.impact === 'critical') continue;
    info.annotations.push({ type: `axe-${v.impact}`, description: `${name}: ${v.id} x${v.nodes.length} - ${v.help}` });
  }

  const blocking: Found[] = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ scan: name, rule: v.id, impact: String(v.impact), count: v.nodes.length }));
  expect.soft(blocking, `${name}: serious/critical axe violations (see the console report above)`).toEqual([]);

  if (opts.title === 'specific') {
    // react-helmet-async applies the title on the next animation frame after the page renders.
    await expect
      .poll(() => page.title(), { message: `${name}: signed-in routes need their own <title>`, timeout: 5_000 })
      .not.toBe(GENERIC_TITLE);
    expect.soft((await page.title()).trim(), `${name}: <title> is not empty`).not.toBe('');
  }
}

test.beforeEach(async ({ page }) => {
  await freshSeed();
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
  // Same as a user who asked for reduced motion: no animation frames mid-fade when axe measures contrast.
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('p: dashboard, calendar (page + new booking dialog) @mobile', async ({ page }) => {
  // One booking of every colour in the calendar legend (the seed only has a personal one)
  for (const [i, type] of (['rental', 'maintenance', 'guest'] as const).entries()) {
    const start = midnight(14 + i * 3);
    const end = midnight(16 + i * 3);
    await setDoc(`houses/${H1}/bookings/a11y-${type}`, {
      house_id: H1, user_id: A.uid, user_name: A.name, start, end,
      start_date: ymd(start), end_date: ymd(end), type, notes: type, created_at: new Date(),
    });
  }
  await login(page, B, '/dashboard');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await scan(page, '/dashboard', { title: 'specific' });

  await page.goto('/calendar');
  await expect(page.getByRole('heading', { name: 'Bókunardagatal' })).toBeVisible();
  for (const view of ['Mánuður', 'Listi']) {
    await page.getByRole('button', { name: view }).click();
    await expect(page.getByRole('button', { name: view })).toHaveAttribute('aria-pressed', 'true');
    await scan(page, `/calendar (${view})`, { title: 'specific' });
  }
  await page.getByRole('button', { name: 'Ný bókun', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Ný bókun', exact: true })).toBeVisible();
  await scan(page, '/calendar new booking dialog');
});

test('p: finance (each tab, add-entry form) @mobile', async ({ page }) => {
  await login(page, B, '/finance');
  await expect(page.getByRole('heading', { name: 'Hússjóður', exact: true })).toBeVisible();
  for (const tab of ['Rekstraráætlun', 'Bókhald', 'Ársyfirlit']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
    await scan(page, `/finance ${tab}`, { title: 'specific' });
  }
  await page.getByRole('tab', { name: 'Bókhald' }).click();
  await page.getByRole('button', { name: 'Skrá færslu' }).click();
  await expect(page.getByRole('heading', { name: 'Ný færsla' })).toBeVisible();
  await scan(page, '/finance add-entry form');
});

test('p: tasks (list, board, new task form) @mobile', async ({ page }) => {
  await login(page, B, '/tasks');
  await expect(page.getByText('Mála pallinn')).toBeVisible();
  await scan(page, '/tasks list', { title: 'specific' });
  await page.getByRole('button', { name: 'Töfluyfirlit' }).click();
  await expect(page.getByRole('button', { name: 'Töfluyfirlit' })).toHaveAttribute('aria-pressed', 'true');
  await scan(page, '/tasks board');
  await page.getByRole('button', { name: 'Nýtt verkefni' }).click();
  await expect(page.getByRole('heading', { name: 'Nýtt verkefni' })).toBeVisible();
  await scan(page, '/tasks new task form');
});

const SETTINGS_TABS = [
  'Húsupplýsingar',
  'Innkaupalisti',
  'Verkefni & Viðhald',
  'Meðeigendur',
  'Gestaupplýsingar',
  'Gestabók',
  'Mínar stillingar',
];

test('p: settings as co-owner (seven tabs, leave dialog) @mobile', async ({ page }) => {
  await login(page, B, '/settings');
  await expect(page.getByRole('heading', { name: 'Stillingar', exact: true })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Stillingar' });
  for (const tab of SETTINGS_TABS) {
    await nav.getByRole('button', { name: tab }).click();
    await expect(nav.getByRole('button', { name: tab })).toHaveAttribute('aria-current', 'page');
    await scan(page, `/settings ${tab}`, { title: 'specific' });
  }
  await nav.getByRole('button', { name: 'Meðeigendur' }).click();
  await page.getByRole('button', { name: 'Yfirgefa hús', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Yfirgefa hús?' })).toBeVisible();
  await scan(page, '/settings leave-house dialog');
});

test('p: settings house tab as manager, and /arbok @mobile', async ({ page }) => {
  await login(page, A, '/settings?tab=house');
  await expect(page.getByRole('heading', { name: 'Stillingar', exact: true })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Stillingar' });
  await nav.getByRole('button', { name: 'Húsupplýsingar' }).click();
  await expect(page.getByLabel('Nafn sumarhúss')).toBeEnabled();
  await scan(page, '/settings house tab (manager)', { title: 'specific' });

  await page.goto('/arbok');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await scan(page, '/arbok', { title: 'specific' });
});

test('p: guest page, login, signup and invite page while logged out @mobile', async ({ page, mocks }) => {
  await page.goto(`/guest/${GUEST_TOKEN}`);
  await expect(page.getByRole('heading', { name: 'Góðan daginn!' })).toBeVisible();
  await scan(page, '/guest/:token');

  await page.goto('/login');
  await expect(page.getByLabel('Netfang')).toBeVisible();
  await scan(page, '/login');

  await page.goto('/signup');
  await expect(page.getByLabel('Nafn', { exact: true })).toBeVisible();
  await scan(page, '/signup');

  mocks.inviteTokens['x'] = { houseId: H1, houseName: HOUSE_NAME, inviterName: 'Anna Umsjón', email: '' };
  await page.goto('/join?token=x');
  await expect(page.getByRole('heading', { name: HOUSE_NAME })).toBeVisible();
  await scan(page, '/join?token=x (logged out)');
});

test('p: onboarding as a fresh user @mobile', async ({ page }) => {
  const FRESH = { uid: 'uidF0000000000000000000000000', email: 'fersk@example.test', name: 'Fersk Notandi' };
  await createAuthUser(FRESH.uid, FRESH.email, PASSWORD, FRESH.name);
  await setDoc(`users/${FRESH.uid}`, { uid: FRESH.uid, email: FRESH.email, name: FRESH.name, house_ids: [], created_at: new Date() });
  await login(page, FRESH, '/onboarding');
  await expect(page.getByRole('heading', { name: 'Velkomin í Bústaðurinn.is' })).toBeVisible();
  await scan(page, '/onboarding welcome', { title: 'specific' });
  await page.getByRole('button', { name: 'Byrja uppsetningu' }).click();
  await expect(page.getByRole('heading', { name: 'Upplýsingar um húsið' })).toBeVisible();
  await scan(page, '/onboarding house step');
});

test('p: super admin (each top-level tab) and organization admin @mobile', async ({ page }) => {
  await seedSuperAdmin();
  await seedOrganization();
  await login(page, A, '/super-admin');
  await expect(page.getByRole('heading', { name: 'Super Admin' })).toBeVisible();
  for (const tab of ['Yfirlit', 'Gögn', 'Samskipti', 'Greining', 'Kerfi']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await expect(page.getByRole('tab', { name: tab, exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: tab })).toBeVisible();
    await scan(page, `/super-admin ${tab}`, { title: 'specific' });
  }

  await page.goto(`/organizations/${ORG}/admin`);
  await expect(page.getByRole('tablist', { name: 'Hlutar stjórnborðs' })).toBeVisible();
  const tabs = page.getByRole('tab');
  const count = await tabs.count();
  for (let i = 0; i < count; i++) {
    await tabs.nth(i).click();
    await scan(page, `/organizations/:id/admin tab ${i + 1}`, { title: 'specific' });
  }
});
