import { test, expect, freshSeed, shot, listDocs, getDoc } from './support/fixtures';

test.beforeEach(async () => { await freshSeed(); });

test('a: new user signs up, creates a house manually and lands on the dashboard @mobile', async ({ page, isMobile }, testInfo) => {
  const email = `nyr-${testInfo.project.name}@example.test`;
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));

  await page.goto('/signup');
  await expect(page.getByRole('heading', { name: 'Bústaðurinn.is' })).toBeVisible();
  await shot(page, 'a-signup', testInfo);
  await page.getByLabel('Nafn', { exact: true }).fill('Nýr Notandi');
  await page.getByLabel('Netfang').fill(email);
  await page.getByLabel('Lykilorð').fill('test-pass-123');
  await page.getByRole('button', { name: 'Stofna ókeypis aðgang' }).click();

  // Onboarding: welcome -> house (manual path, no address) -> invite (skip) -> finish
  await page.waitForURL('**/onboarding');
  await expect(page.getByRole('heading', { name: 'Velkomin í Bústaðurinn.is' })).toBeVisible();
  await shot(page, 'a-onboarding-welcome', testInfo);
  await page.getByRole('button', { name: 'Byrja uppsetningu' }).click();

  await expect(page.getByRole('heading', { name: 'Upplýsingar um húsið' })).toBeVisible();
  await page.getByLabel(/Nafn á húsinu/).fill('Nýja sumarhúsið');
  await shot(page, 'a-onboarding-house', testInfo);
  await page.getByRole('button', { name: 'Áfram', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Bjóða meðeigendum' })).toBeVisible();
  await shot(page, 'a-onboarding-invite', testInfo);
  await page.getByRole('button', { name: /Sleppa þessu/ }).click();

  await expect(page.getByRole('heading', { name: 'Allt tilbúið!' })).toBeVisible();
  await page.getByRole('button', { name: 'Fara á stjórnborð' }).click();

  if (isMobile) {
    // Phone UA: the add-to-home-screen prompt (a real modal dialog) appears and blocks the page.
    const prompt = page.getByRole('dialog', { name: /á heimaskjá/ });
    await expect(prompt).toBeVisible({ timeout: 10_000 });
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog')), 'focus is inside the prompt').toBe(true);
    await shot(page, 'a-pwa-prompt', testInfo);
    // The notification step stacks a second dialog on top
    await prompt.getByRole('button', { name: 'Virkja tilkynningar líka' }).click();
    const notif = page.getByRole('dialog', { name: 'Fá tilkynningar?' });
    await expect(notif).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(notif).toBeHidden();
    await expect(prompt).toBeVisible();
    await prompt.getByRole('button', { name: 'Kannski seinna' }).click();
  }

  await page.waitForURL('**/dashboard');
  await expect(page.getByText('Nýja sumarhúsið').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Opna hússjóð' })).toBeVisible();
  await shot(page, 'a-dashboard-new-house', testInfo);

  const houses = await listDocs('houses');
  const created = houses.find((h) => h.name === 'Nýja sumarhúsið');
  expect(created, 'house document exists').toBeTruthy();
  expect(created!.owner_ids).toHaveLength(1);
  const users = await listDocs('users');
  const me = users.find((u) => u.email === email);
  expect(me!.house_ids).toContain(created!.id);
  expect(await getDoc(`houses/${created!.id}`)).toBeTruthy();
});
