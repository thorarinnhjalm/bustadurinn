import { test, expect, freshSeed, login, shot, B, H1, listDocs } from './support/fixtures';

test.beforeEach(async ({ page }) => {
  await freshSeed();
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
});

test('b: dashboard renders the cards, check-in and checkout dialogs behave @mobile', async ({ page }, testInfo) => {
  await login(page, B);

  // Cards: next booking, finance fund, shopping list, tasks
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bjarni');
  await expect(page.getByText('Hóll við vatnið').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sjá nánari upplýsingar um næstu bókun' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Opna hússjóð' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Opna innkaupalistann' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Opna verkefnalistann' })).toBeVisible();
  await expect(page.getByText('Kaffi')).toBeVisible();
  await expect(page.getByText('Laga hliðið').first()).toBeVisible();
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await shot(page, 'b-dashboard', testInfo);

  // The top bar must fit: the house name is a single line and nothing overflows horizontally
  const name = page.getByRole('navigation', { name: 'Efri valmynd' }).getByRole('button', { name: /Hóll við vatnið/ });
  const box = await name.boundingBox();
  expect(box!.height, 'house name does not wrap into several lines').toBeLessThan(50);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal page scroll').toBe(true);

  // --- Check-in dialog: focus in, Escape closes, focus returns to the opener
  const opener = page.getByRole('button', { name: 'Skrá komu', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Skrá komu' });
  await expect(dialog).toBeVisible();
  const focusInside = await page.evaluate(() => !!document.activeElement?.closest('dialog'));
  expect(focusInside, 'focus moved into the check-in dialog').toBe(true);
  await shot(page, 'b-checkin-dialog', testInfo);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  // --- Reopen, tick checklist items, submit
  await opener.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('checkbox', { name: 'Kveikja á vatni' }).check();
  await dialog.getByRole('checkbox', { name: 'Opna glugga' }).check();
  await expect(dialog.getByRole('checkbox', { name: 'Kveikja á vatni' })).toBeChecked();
  await dialog.getByRole('button', { name: 'Skrá komu', exact: true }).click();
  await expect(dialog).toBeHidden();

  // The check-in is recorded and the primary action flips to checkout
  const checkout = page.getByRole('button', { name: 'Skrá brottför', exact: true });
  await expect(checkout).toBeVisible();
  const logs = await listDocs(`houses/${H1}/internal_logs`);
  const checkIn = logs.find((l) => l.kind === 'check_in');
  expect(checkIn, 'a check_in log was written').toBeTruthy();
  expect(checkIn!.checklist).toMatchObject({ 'Kveikja á vatni': true, 'Opna glugga': true });

  // --- Checkout dialog: focus, Escape, focus returns
  await checkout.click();
  const outDialog = page.getByRole('dialog', { name: /brottför/i });
  await expect(outDialog).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await shot(page, 'b-checkout-dialog', testInfo);
  await page.keyboard.press('Escape');
  await expect(outDialog).toBeHidden();
  await expect(checkout).toBeFocused();
});
