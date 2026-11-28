import { test, expect, freshSeed, login, listDocs, A, PASSWORD } from './support/fixtures';

/**
 * Auth start-up: AuthHandler (and with it the Firebase SDK) is a lazily loaded chunk that starts
 * immediately on app routes and at idle on public marketing routes. These specs pin down the
 * behaviours that must survive that: no flash of the login page for a signed-in user, the redirect
 * of a returning user from "/", auth starting on client-side navigation, protected content never
 * shown to a logged-out visitor, and funnel events recorded before sign-in still being flushed.
 */

test.beforeEach(async ({ page }) => {
  await freshSeed();
  // try/catch: the init script also runs in documents that may not touch storage (e.g. the aborted third-party iframe on "/").
  await page.addInitScript(() => {
    try {
      localStorage.setItem('has_seen_walkthrough', 'true');
    } catch {
      /* opaque-origin frame */
    }
  });
});

/** Records every URL the page's main frame visits, including client-side (history API) navigations. */
async function trackUrls(page: import('@playwright/test').Page) {
  const seen: string[] = [];
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) seen.push(new URL(f.url()).pathname);
  });
  return seen;
}

test('q1: a signed-in user hard-reloading /dashboard never sees the login page @mobile', async ({ page }) => {
  await login(page, A, '/dashboard');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

  const seen = await trackUrls(page);
  // Watch the DOM too: a flash of the login form that is replaced before a URL change would not show up in `seen`.
  await page.addInitScript(() => {
    (window as any).__sawLoginForm = false;
    new MutationObserver(() => {
      if (document.querySelector('input[type="password"]')) (window as any).__sawLoginForm = true;
    }).observe(document, { childList: true, subtree: true });
  });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(seen.filter((p) => p.startsWith('/login')), 'URLs visited during the reload').toEqual([]);
  expect(await page.evaluate(() => (window as any).__sawLoginForm), 'a login form was rendered').toBe(false);
});

test('q2: a signed-in user opening "/" is sent to the dashboard within a few seconds @mobile', async ({ page }) => {
  await login(page, A, '/dashboard');
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 8_000 });
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
});

test('q3: "Innskrá" clicked right after first paint on "/" works without waiting for idle @mobile', async ({ page, isMobile }) => {
  await page.goto('/', { waitUntil: 'commit' });
  const menu = page.getByRole('button', { name: 'Opna valmynd' });
  if (isMobile) await menu.click();
  const link = page.getByRole('link', { name: 'Innskrá', exact: true });
  await link.click();
  await expect(page).toHaveURL(/\/login$/);
  // The URL changes before the lazily loaded login page replaces the landing page: wait for its form.
  await expect(page.getByRole('button', { name: 'Skrá inn', exact: true })).toBeVisible();
  await page.getByLabel('Netfang').fill(A.email);
  await page.getByLabel('Lykilorð').fill(PASSWORD);
  await page.getByRole('button', { name: 'Skrá inn', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
});

test('q4: a logged-out visitor opening /dashboard ends on /login and never sees protected content @mobile', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__sawDashboard = false;
    new MutationObserver(() => {
      if (document.querySelector('main h1, [data-testid="dashboard"]') && location.pathname === '/dashboard') (window as any).__sawDashboard = true;
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Skrá inn', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__sawDashboard), 'dashboard content rendered while logged out').toBe(false);
});

test('q5: signup -> onboarding -> dashboard still records the funnel events, buffered ones included @mobile', async ({ page, isMobile }, testInfo) => {
  const email = `funnel-${testInfo.project.name}@example.test`;
  await page.goto('/signup');
  await page.getByLabel('Nafn', { exact: true }).fill('Trektur Notandi');
  await page.getByLabel('Netfang').fill(email);
  await page.getByLabel('Lykilorð').fill(PASSWORD);
  await page.getByRole('button', { name: 'Stofna ókeypis aðgang' }).click();

  await page.waitForURL('**/onboarding');
  await page.getByRole('button', { name: 'Byrja uppsetningu' }).click();
  await page.getByLabel(/Nafn á húsinu/).fill('Trektarhúsið');
  await page.getByRole('button', { name: 'Áfram', exact: true }).click();
  await page.getByRole('button', { name: /Sleppa þessu/ }).click();
  await expect(page.getByRole('heading', { name: 'Allt tilbúið!' })).toBeVisible();
  await page.getByRole('button', { name: 'Fara á stjórnborð' }).click();
  if (isMobile) {
    // Phone UA: the add-to-home-screen prompt blocks the page until dismissed (see a-signup-onboarding).
    await page.getByRole('dialog', { name: /á heimaskjá/ }).getByRole('button', { name: 'Kannski seinna' }).click({ timeout: 15_000 });
  }
  await page.waitForURL('**/dashboard');
  await expect(page.getByText('Trektarhúsið').first()).toBeVisible();

  const users = await listDocs('users');
  const me = users.find((u) => u.email === email);
  expect(me, 'profile exists').toBeTruthy();

  await expect
    .poll(async () => (await listDocs('funnel_events')).filter((e) => e.uid === me!.uid).map((e) => e.event_name), { timeout: 15_000 })
    .toEqual(expect.arrayContaining(['signup_viewed', 'signup_completed', 'onboarding_started', 'house_created', 'dashboard_reached']));

  // signup_viewed happens before the account exists: it can only be there if the buffer was flushed after sign-in.
  const events = (await listDocs('funnel_events')).filter((e) => e.uid === me!.uid);
  expect(events.find((e) => e.event_name === 'signup_viewed')!.buffered, 'signup_viewed went through the pre-sign-in buffer').toBe(true);
});
