import { test, expect, freshSeed, login, shot, B } from './support/fixtures';

test.beforeEach(async ({ page }) => {
  await freshSeed();
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
});

test('j: sign out, then protected routes redirect to login @mobile', async ({ page }, testInfo) => {
  await login(page, B, '/settings');
  await page.getByRole('button', { name: 'Skrá út' }).click();
  await page.waitForURL((u) => u.pathname === '/' || u.pathname === '/login');
  for (const path of ['/dashboard', '/calendar', '/finance', '/tasks', '/settings', '/onboarding']) {
    await page.goto(path);
    await expect(page, `${path} redirects to login`).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Skrá inn', exact: true })).toBeVisible();
  }
  await shot(page, 'j-login-after-signout', testInfo);
});
