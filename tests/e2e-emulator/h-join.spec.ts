import { test, expect, freshSeed, login, shot, H1, HOUSE_NAME, getDoc } from './support/fixtures';
import { createAuthUser } from './support/emulator';
import { setDoc } from './support/emulator';
import { PASSWORD } from './support/seed';

test.beforeEach(async () => { await freshSeed(); });

test('h: logged-out visit to /join?token=x shows the house and a log-in prompt (not an error) @mobile', async ({ page, mocks }, testInfo) => {
  mocks.inviteTokens['x'] = { houseId: H1, houseName: HOUSE_NAME, inviterName: 'Anna Umsjón', email: '' };
  await page.goto('/join?token=x');
  await expect(page.getByRole('heading', { name: HOUSE_NAME })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skrá inn', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Búa til aðgang' })).toBeVisible();
  await expect(page.getByText('Villa', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await shot(page, 'h-join-logged-out', testInfo);
  expect(mocks.calls.filter((c) => c.path === 'invite-info').length).toBeGreaterThan(0); // 2 in dev: React StrictMode

  await page.getByRole('button', { name: 'Skrá inn', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fjoin%3Ftoken%3Dx/);
});

test('h: an invalid invite shows the error card @mobile', async ({ page }, testInfo) => {
  await page.goto('/join?token=nope');
  await expect(page.getByRole('alert')).toContainText('Boðstengill er útrunninn eða ógildur.');
  await shot(page, 'h-join-invalid', testInfo);
});

test('h: a signed-in non-member accepts an invite (join-house is simulated) @mobile', async ({ page, mocks }, testInfo) => {
  const C = { uid: 'uidC0000000000000000000000000', email: 'cecilia@example.test', name: 'Cecilía Ný' };
  await createAuthUser(C.uid, C.email, PASSWORD, C.name);
  await setDoc(`users/${C.uid}`, { uid: C.uid, email: C.email, name: C.name, house_ids: [], push_prompt_dismissed: true, created_at: new Date() });
  mocks.inviteTokens['x'] = { houseId: H1, houseName: HOUSE_NAME, inviterName: 'Anna Umsjón', email: C.email };
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));

  await login(page, C, '');
  // Onboarding redirect happens for a user without a house; go to the invite via client-side nav state:
  await page.goto('/join?token=x');
  await expect(page.getByRole('heading', { name: HOUSE_NAME })).toBeVisible();
  await expect(page.getByText('Boðið af')).toContainText('Anna Umsjón');
  await shot(page, 'h-join-logged-in', testInfo);
  await page.getByRole('button', { name: 'Samþykkja boð og ganga í hús' }).click();
  const welcome = page.getByRole('dialog', { name: `Velkomin í ${HOUSE_NAME}!` });
  await expect(welcome).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await shot(page, 'h-join-welcome', testInfo);
  expect((await getDoc(`houses/${H1}`))!.owner_ids).toContain(C.uid);
  await welcome.getByRole('button', { name: 'Byrja að nota kerfið' }).click();
  await page.waitForURL('**/dashboard');
  await expect(page.getByText(HOUSE_NAME).first()).toBeVisible();
});
