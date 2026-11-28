import { test, expect, freshSeed, login, shot, B, H1, listDocs } from './support/fixtures';

test.beforeEach(async ({ page }) => {
  await freshSeed();
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
});

test('i: shopping list in settings: add, tick, untick, delete @mobile', async ({ page }, testInfo) => {
  await login(page, B, '/settings');
  await page.getByRole('navigation', { name: 'Stillingar' }).getByRole('button', { name: 'Innkaupalisti' }).click();
  await expect(page.getByText('Kaffi')).toBeVisible();

  await page.getByRole('button', { name: 'Bæta við vöru' }).click();
  const input = page.getByLabel('Ný vara á innkaupalista');
  await expect(input).toBeFocused();
  await input.fill('Mjólk');
  await page.getByRole('button', { name: 'Bæta við', exact: true }).click();
  await expect(page.getByText('Mjólk')).toBeVisible();
  await expect.poll(async () => (await listDocs(`houses/${H1}/shopping_list`)).find((i) => i.item === 'Mjólk')?.added_by).toBe(B.uid);
  await shot(page, 'i-shopping-added', testInfo);

  // tick it
  await page.getByRole('checkbox', { name: 'Merkja Mjólk sem keypt' }).click();
  const ticked = page.getByRole('checkbox', { name: 'Taka Mjólk af keyptum vörum' });
  await expect(ticked).toHaveAttribute('aria-checked', 'true');
  await expect.poll(async () => (await listDocs(`houses/${H1}/shopping_list`)).find((i) => i.item === 'Mjólk')?.checked).toBe(true);
  await shot(page, 'i-shopping-ticked', testInfo);

  // untick, then delete
  await ticked.click();
  await expect(page.getByRole('checkbox', { name: 'Merkja Mjólk sem keypt' })).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('button', { name: 'Eyða Mjólk' }).click();
  await expect(page.getByText('Mjólk')).toHaveCount(0);
  await expect.poll(async () => (await listDocs(`houses/${H1}/shopping_list`)).some((i) => i.item === 'Mjólk')).toBe(false);
});

test('i: dashboard inventory ("Hvað er til"): add, toggle status, delete @mobile', async ({ page }, testInfo) => {
  await login(page, B, '/dashboard');
  const card = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Hvað er til' }) });
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByText('Salt', { exact: true })).toBeVisible();

  await card.getByRole('button', { name: 'Skrá atriði' }).click();
  await card.getByLabel('Heiti atriðis').fill('Pipar');
  await card.getByLabel('Magn').fill('2 stk');
  await shot(page, 'i-inventory-form', testInfo);
  await card.getByRole('button', { name: 'Skrá', exact: true }).click();
  await expect(card.getByText('Pipar', { exact: true })).toBeVisible();
  await expect.poll(async () => (await listDocs(`houses/${H1}/inventory`)).some((i) => i.name === 'Pipar')).toBe(true);

  // tick = flip the status to "Á þrotum" (also lands on the shopping list)
  await card.getByRole('button', { name: /Til\s*–\s*Pipar/ }).click();
  await expect(card.getByRole('button', { name: /Á þrotum\s*–\s*Pipar/ })).toBeVisible();
  await expect.poll(async () => (await listDocs(`houses/${H1}/inventory`)).find((i) => i.name === 'Pipar')?.status).toBe('out');
  await shot(page, 'i-inventory-out', testInfo);

  await card.getByRole('button', { name: 'Eyða Pipar' }).click();
  await expect(card.getByText('Pipar', { exact: true })).toHaveCount(0);
  await expect.poll(async () => (await listDocs(`houses/${H1}/inventory`)).some((i) => i.name === 'Pipar')).toBe(false);
});
