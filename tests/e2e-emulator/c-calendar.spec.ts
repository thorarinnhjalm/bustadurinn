import { test, expect, freshSeed, login, shot, B, H1, listDocs } from './support/fixtures';
import { midnight, ymd } from './support/seed';

test.beforeEach(async ({ page }) => {
  await freshSeed();
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
});

async function openNewBooking(page: import('@playwright/test').Page) {
  const opener = page.getByRole('button', { name: 'Ný bókun', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Ný bókun', exact: true });
  await expect(dialog).toBeVisible();
  return { opener, dialog };
}

async function fillDates(dialog: import('@playwright/test').Locator, start: Date, end: Date) {
  await dialog.getByLabel('Upphafsdagur').fill(ymd(start));
  await dialog.getByLabel('Lokadagur').fill(ymd(end));
}

test('c: booking with conflict warning, create, view in month+list, delete @mobile', async ({ page, isMobile }, testInfo) => {
  await login(page, B, '/calendar');
  await expect(page.getByRole('heading', { name: 'Bókunardagatal' })).toBeVisible();
  // By design phones default to the list view, desktops to the month grid.
  await expect(page.getByRole('button', { name: isMobile ? 'Listi' : 'Mánuður' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Mánuður' }).click();
  await expect(page.getByRole('button', { name: 'Mánuður' })).toHaveAttribute('aria-pressed', 'true');
  await shot(page, 'c-calendar-month', testInfo);

  // --- Overlap with the seeded booking -> conflict dialog with both choices -> cancel
  const { opener, dialog } = await openNewBooking(page);
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog')), 'focus is in the booking dialog').toBe(true);
  await fillDates(dialog, midnight(8), midnight(9));
  await dialog.getByRole('button', { name: 'Búa til bókun' }).click();
  const conflict = page.getByRole('dialog', { name: 'Skörun bókana' });
  await expect(conflict).toBeVisible();
  await expect(conflict.getByText('Anna Umsjón')).toBeVisible();
  await expect(conflict.getByRole('button', { name: 'Hætta við' })).toBeVisible();
  await expect(conflict.getByRole('button', { name: 'Bóka samt' })).toBeVisible();
  await shot(page, 'c-conflict-dialog', testInfo);
  await conflict.getByRole('button', { name: 'Hætta við' }).click();
  await expect(conflict).toBeHidden();
  // The booking form is still open with the typed dates (state did not reset)
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Upphafsdagur')).toHaveValue(ymd(midnight(8)));
  expect((await listDocs(`houses/${H1}/bookings`)).length, 'nothing was booked').toBe(1);

  // --- Free dates -> success
  await fillDates(dialog, midnight(20), midnight(22));
  await dialog.getByLabel('Athugasemd (valfrjálst)').fill('Helgarferð');
  await dialog.getByRole('button', { name: 'Búa til bókun' }).click();
  const success = page.getByRole('dialog', { name: 'Bókun staðfest!' });
  await expect(success).toBeVisible();
  await expect(success.getByText('Bjarni Meðeigandi')).toBeVisible();
  await shot(page, 'c-booking-success', testInfo);
  await success.getByRole('button', { name: 'Loka', exact: true }).first().click();
  await expect(success).toBeHidden();
  await expect(opener).toBeFocused();
  await expect.poll(async () => (await listDocs(`houses/${H1}/bookings`)).length).toBe(2);
  const stored = await listDocs(`houses/${H1}/bookings`);
  expect(stored.find((b) => b.notes === 'Helgarferð')?.start_date).toBe(ymd(midnight(20)));

  // --- Appears in the month view (navigate to the booking's month if needed)
  const target = midnight(20);
  const now = new Date();
  if (target.getUTCMonth() !== now.getUTCMonth()) {
    await page.getByRole('button', { name: 'Næsta tímabil' }).click();
  }
  const monthEvent = page.locator('.rbc-event').filter({ hasText: 'Bjarni Meðeigandi' }).first();
  await expect(monthEvent).toBeVisible();
  await shot(page, 'c-calendar-month-with-booking', testInfo);

  // --- And in the list view
  await page.getByRole('button', { name: 'Listi' }).click();
  await expect(page.getByRole('heading', { name: 'Allar bókanir' })).toBeVisible();
  const card = page.getByRole('button').filter({ hasText: 'Bjarni Meðeigandi' }).first();
  await expect(card).toBeVisible();
  await shot(page, 'c-calendar-list', testInfo);

  // --- Open it and delete it
  await card.click();
  const detail = page.getByRole('dialog', { name: 'Bókun', exact: true });
  await expect(detail).toBeVisible();
  await expect(detail.getByText('Helgarferð')).toBeVisible();
  await shot(page, 'c-booking-detail', testInfo);
  await detail.getByRole('button', { name: 'Eyða Bókun' }).click();
  await expect(detail.getByText('Ertu viss um að þú viljir eyða þessari bókun?')).toBeVisible();
  await detail.getByRole('button', { name: 'Já, eyða' }).click();
  await expect(detail).toBeHidden();
  await expect.poll(async () => (await listDocs(`houses/${H1}/bookings`)).length).toBe(1);
  await expect(page.getByRole('button').filter({ hasText: 'Bjarni Meðeigandi' })).toHaveCount(0);
});

test('c: same-day booking is accepted, a second same-day attempt conflicts @mobile', async ({ page }, testInfo) => {
  await login(page, B, '/calendar');
  const day = midnight(30);

  let { dialog } = await openNewBooking(page);
  await fillDates(dialog, day, day);
  await dialog.getByRole('button', { name: 'Búa til bókun' }).click();
  const success = page.getByRole('dialog', { name: 'Bókun staðfest!' });
  await expect(success).toBeVisible();
  await success.getByRole('button', { name: 'Loka', exact: true }).first().click();
  await expect.poll(async () => (await listDocs(`houses/${H1}/bookings`)).length).toBe(2);
  const stored = await listDocs(`houses/${H1}/bookings`);
  const one = stored.find((b) => b.start_date === ymd(day));
  expect(one, 'same-day booking stored').toBeTruthy();
  expect(one!.end_date).toBe(ymd(midnight(31)));

  ({ dialog } = await openNewBooking(page));
  await fillDates(dialog, day, day);
  await dialog.getByRole('button', { name: 'Búa til bókun' }).click();
  const conflict = page.getByRole('dialog', { name: 'Skörun bókana' });
  await expect(conflict).toBeVisible();
  await expect(conflict.getByText('Bjarni Meðeigandi')).toBeVisible();
  await shot(page, 'c-same-day-conflict', testInfo);
  await conflict.getByRole('button', { name: 'Hætta við' }).click();
  await dialog.getByRole('button', { name: 'Hætta við' }).click();
  await expect(dialog).toBeHidden();
  expect((await listDocs(`houses/${H1}/bookings`)).length).toBe(2);
});
