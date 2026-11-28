import { deflateSync } from 'node:zlib';
import type { Page } from '@playwright/test';
import { test, expect, freshSeed, login, shot, A, B, H1, HOUSE_NAME, getDoc, listDocs, setDoc, deleteDocByPath } from './support/fixtures';
import { GUEST_TOKEN, midnight, ymd } from './support/seed';

test.beforeEach(async ({ page }) => {
  await freshSeed();
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
});

/** A real (decodable) 64x36 PNG, so the 16:9 cropper has something to crop. */
function makePng(width = 64, height = 36): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) {
      row[1 + x * 3] = (x * 4) & 255;
      row[2 + x * 3] = (y * 7) & 255;
      row[3 + x * 3] = 160;
    }
    rows.push(row);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const navTab = (page: Page, name: string) => page.getByRole('navigation', { name: 'Stillingar' }).getByRole('button', { name });

// ---------------------------------------------------------------- Settings

test('o: settings: typing an invite email, switching tabs and back does not crash and the field stays usable @mobile', async ({ page, mocks }) => {
  await login(page, A, '/settings?tab=members');
  const invite = page.getByLabel('Bjóða með tölvupósti');
  await invite.fill('nyr@example.test');
  await expect(invite).toHaveValue('nyr@example.test');

  await navTab(page, 'Húsupplýsingar').click();
  await expect(page.getByLabel('Nafn sumarhúss')).toBeVisible();
  await navTab(page, 'Meðeigendur').click();
  await expect(page.getByRole('heading', { level: 2, name: 'Meðeigendur' })).toBeVisible();

  // The Members tab remounted, so the half-typed address is gone (expected); the field works again.
  const again = page.getByLabel('Bjóða með tölvupósti');
  await expect(again).toBeEnabled();
  await again.fill('annar@example.test');
  await expect(again).toHaveValue('annar@example.test');
  await page.getByRole('button', { name: 'Senda boð' }).click();
  await expect(page.getByText('Boð sent!')).toBeVisible();
  expect(mocks.calls.find((c) => c.path === 'invite-member')!.body).toMatchObject({ email: 'annar@example.test', houseId: H1 });
  await expect(again).toHaveValue('');
});

test('o: settings: the manager uploads a house image through crop, progress and save (real storage rules)', async ({ page }, testInfo) => {
  // Hold the upload back so the progress dialog can be observed
  await page.route(/127\.0\.0\.1:9199/, async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await login(page, A, '/settings?tab=house');
  await page.locator('label', { hasText: 'Hlaða upp aðalmynd' }).locator('input[type=file]').setInputFiles({ name: 'hus.png', mimeType: 'image/png', buffer: makePng() });
  const cropper = page.getByRole('dialog', { name: 'Klippa mynd' });
  await expect(cropper).toBeVisible();
  await shot(page, 'o-house-cropper', testInfo);
  await cropper.getByRole('button', { name: 'Vista' }).click();

  const progress = page.getByRole('dialog', { name: 'Hleður upp mynd...' });
  await expect(progress).toBeVisible();
  await expect(progress.getByRole('progressbar', { name: 'Framvinda upphleðslu' })).toBeVisible();
  await expect(page.getByText('Mynd vistuð!')).toBeVisible({ timeout: 30_000 });
  await expect(progress).toBeHidden();
  await expect(cropper).toBeHidden();

  const house = (await getDoc(`houses/${H1}`))!;
  expect(String(house.image_url)).toContain('127.0.0.1:9199');
  expect(String(house.image_url)).toContain(encodeURIComponent(`houses/${H1}/image.jpg`));
  // the fixed guest link's view is kept in sync with the new picture
  expect(String((await getDoc(`guest_views/${GUEST_TOKEN}`))!.image_url)).toContain('127.0.0.1:9199');
  await expect(page.getByAltText(`Mynd af ${HOUSE_NAME}`)).toBeVisible();
  await shot(page, 'o-house-image-saved', testInfo);
});

test('o: settings: a house without a manager lets an owner claim the role', async ({ page, mocks }) => {
  const house = (await getDoc(`houses/${H1}`))!;
  delete house.manager_id;
  await setDoc(`houses/${H1}`, house);
  mocks.managerId = '';

  await login(page, B, '/settings?tab=members');
  const notice = page.getByText('Húsið er án umsjónarmanns');
  await expect(notice).toBeVisible();
  await page.getByRole('button', { name: 'Gerast umsjónarmaður' }).click();
  await expect(page.getByText('Þú ert nú umsjónarmaður hússins')).toBeVisible();
  expect(mocks.calls.find((c) => c.path === 'transfer-manager')!.body).toEqual({ houseId: H1, newManagerId: B.uid });
  await expect(notice).toBeHidden();
  expect((await getDoc(`houses/${H1}`))!.manager_id).toBe(B.uid);
});

test('o: settings: Endurnýja replaces the fixed guest link, the copy notice clears, a missing invite date shows a dash, "Eyða aðgangi" is a plain button', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:5197' });
  await setDoc('invitations/inv-no-date', { house_id: H1, email: 'utan-dagsetningar@example.test', status: 'pending', token: 'tok-1' });

  await login(page, A, '/settings?tab=guests');
  const copy = page.getByRole('button', { name: 'Afrita gestahlekk' });
  await copy.scrollIntoViewIfNeeded();
  await copy.click();
  const copied = page.getByText('Hlekkur afritaður!');
  await expect(copied).toBeVisible();
  await expect(copied).toBeHidden({ timeout: 6000 }); // clears by itself after a few seconds

  const renew = page.getByRole('button', { name: 'Endurnýja' });
  await renew.click();
  await expect(page.getByText('Nýr gestahlekkur búinn til!')).toBeVisible();
  const house = (await getDoc(`houses/${H1}`))!;
  expect(house.guest_token).toBeTruthy();
  expect(house.guest_token).not.toBe(GUEST_TOKEN);
  expect(await getDoc(`guest_views/${GUEST_TOKEN}`), 'old link stopped working').toBeNull();
  expect(await getDoc(`guest_views/${house.guest_token}`)).toMatchObject({ houseId: H1 });
  await expect(page.getByText(`bustadurinn.is/guest/${house.guest_token}`)).toBeVisible();

  await navTab(page, 'Meðeigendur').click();
  const row = page.locator('div').filter({ hasText: 'utan-dagsetningar@example.test' }).last();
  await expect(row).toContainText('Boðið —');
  await expect(page.getByText('Invalid Date')).toHaveCount(0);

  await navTab(page, 'Mínar stillingar').click();
  await expect(page.getByRole('button', { name: 'Eyða aðgangi', exact: true })).toHaveAttribute('type', 'button');
});

test('o: settings: a non-manager does not get the renew button', async ({ page }) => {
  await login(page, B, '/settings?tab=guests');
  await expect(page.getByText('Aðeins umsjónarmaður hússins getur breytt eða eytt fasta hlekknum.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Endurnýja' })).toHaveCount(0);
});

// ---------------------------------------------------------------- Dashboard

test('o: dashboard: check-in then checkout in one session without reload, and the stretched-link cards navigate @mobile', async ({ page }, testInfo) => {
  await login(page, B, '/dashboard');
  await expect(page.getByText('Kaffi')).toBeVisible(); // every dashboard listener has delivered
  const stay = page.getByRole('button', { name: /^Skrá (komu|brottför)$/ }).first();
  await expect(stay).toHaveText('Skrá komu');
  await stay.click();
  const checkIn = page.getByRole('dialog', { name: 'Skrá komu' });
  await checkIn.getByRole('checkbox', { name: 'Opna glugga' }).check();
  await checkIn.getByRole('button', { name: 'Skrá komu', exact: true }).click();
  await expect(checkIn).toBeHidden();
  await expect(stay).toHaveText('Skrá brottför');
  await expect(page.getByText('Húsið er í notkun')).toBeHidden(); // occupancy is about bookings, not check-ins

  // checkout in the same page session (no reload in between)
  await stay.click();
  const checkout = page.getByRole('dialog', { name: 'Skrá brottför' });
  await expect(checkout).toBeVisible();
  await checkout.getByLabel('Skilaboð í gestabók (valfrjálst)').fill('Takk fyrir okkur!');
  await checkout.getByRole('checkbox', { name: 'Slökkva á ofnum' }).check();
  await shot(page, 'o-checkout', testInfo);
  await checkout.getByRole('button', { name: 'Skrá brottför', exact: true }).click();
  await expect(checkout).toBeHidden();
  await expect(stay).toHaveText('Skrá komu');

  const logs = await listDocs(`houses/${H1}/internal_logs`);
  expect(logs.map((l) => l.kind).sort()).toEqual(['check_in', 'check_out']);
  expect(logs.find((l) => l.kind === 'check_out')!.checklist).toMatchObject({ 'Slökkva á ofnum': true, 'Taka út rusl': false });
  const entry = (await listDocs('guestbook')).find((g) => g.message === 'Takk fyrir okkur!');
  expect(entry, 'checkout message went to the guestbook').toBeTruthy();
  expect(entry!.house_id).toBe(H1);
  // and the next-checkout strip now shows the unticked item
  await expect(page.getByText(/Taka út rusl/).first()).toBeVisible();

  // Stretched links: a click anywhere on the card, not just on the arrow
  // (a real mouse click at coordinates: Playwright's own click() refuses because the link's ::after covers the card)
  const clickInsideCard = async (card: import('@playwright/test').Locator, inner: import('@playwright/test').Locator) => {
    await inner.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const box = (await inner.boundingBox())!;
    const cardBox = (await card.boundingBox())!;
    expect(box.x, 'inner area lies inside the card').toBeGreaterThanOrEqual(cardBox.x);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };
  const financeCard = page.locator('section', { has: page.getByRole('link', { name: 'Opna hússjóð' }) });
  await clickInsideCard(financeCard, financeCard.getByText('Staða sjóðs'));
  await expect(page).toHaveURL(/\/finance$/);
  await page.goBack();
  await expect(page.getByRole('link', { name: 'Opna verkefnalistann' })).toBeVisible();

  const tasksCard = page.locator('section', { has: page.getByRole('link', { name: 'Opna verkefnalistann' }) });
  await clickInsideCard(tasksCard, tasksCard.getByText('Laga hliðið').first());
  await expect(page).toHaveURL(/\/tasks$/);
  await page.goBack();

  // Next booking: the whole card opens the detail dialog
  const nextCard = page.locator('section', { has: page.getByRole('button', { name: 'Sjá nánari upplýsingar um næstu bókun' }) });
  await clickInsideCard(nextCard, nextCard.getByText('Anna Umsjón'));
  const detail = page.getByRole('dialog', { name: 'Bókun' });
  await expect(detail).toBeVisible();
  await expect(detail).toContainText('3 nætur');
  await detail.getByRole('button', { name: 'Loka', exact: true }).last().click();
  await expect(detail).toBeHidden();
});

test('o: dashboard: the finance status dot is red for an expense and green for a deposit', async ({ page }) => {
  await login(page, A, '/dashboard');
  // seeded entries: last-year deposit and this-year expense; newest by date is the expense ("greiddi")
  const status = page.getByText('Síðasta færsla').locator('xpath=ancestor::div[contains(@class,"flex items-center gap-3")][1]');
  await expect(status).toContainText('greiddi');
  await expect(status.locator('div').first()).toHaveClass(/bg-red-500/);
  await expect(status.locator('div').first()).toHaveClass(/shadow-\[0_0_8px_rgba\(239,68,68,0\.6\)\]/);
});

// ---------------------------------------------------------------- Calendar

async function openCalendar(page: Page, who = B) {
  await login(page, who, '/calendar');
  await expect(page.getByRole('heading', { name: 'Bókunardagatal' })).toBeVisible();
}

test('o: calendar: the note and dates survive a conflict dialog that is cancelled @mobile', async ({ page }) => {
  await openCalendar(page);
  await page.getByRole('button', { name: 'Ný bókun', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Ný bókun', exact: true });
  await dialog.getByLabel('Upphafsdagur').fill(ymd(midnight(8)));
  await dialog.getByLabel('Lokadagur').fill(ymd(midnight(9)));
  await dialog.getByLabel('Athugasemd (valfrjálst)').fill('Minnisatriði sem má ekki tapast');
  await dialog.getByRole('button', { name: 'Búa til bókun' }).click();
  const conflict = page.getByRole('dialog', { name: 'Skörun bókana' });
  await expect(conflict).toBeVisible();
  await conflict.getByRole('button', { name: 'Hætta við' }).click();
  await expect(conflict).toBeHidden();
  await expect(dialog.getByLabel('Athugasemd (valfrjálst)')).toHaveValue('Minnisatriði sem má ekki tapast');
  await expect(dialog.getByLabel('Upphafsdagur')).toHaveValue(ymd(midnight(8)));
  await expect(dialog.getByLabel('Lokadagur')).toHaveValue(ymd(midnight(9)));
  // "Bóka samt" then books it with the same note
  await dialog.getByRole('button', { name: 'Búa til bókun' }).click();
  await page.getByRole('dialog', { name: 'Skörun bókana' }).getByRole('button', { name: 'Bóka samt' }).click();
  await expect(page.getByRole('dialog', { name: 'Bókun staðfest!' })).toBeVisible();
  await expect.poll(async () => (await listDocs(`houses/${H1}/bookings`)).find((b) => b.notes === 'Minnisatriði sem má ekki tapast')?.start_date).toBe(ymd(midnight(8)));
});

test('o: calendar: closing the detail dialog without confirming a delete does not leave the next one in confirm mode; dates only, nights from calendar days @mobile', async ({ page }) => {
  await setDoc(`houses/${H1}/bookings/second-booking`, {
    house_id: H1,
    user_id: B.uid,
    user_name: B.name,
    start: midnight(15),
    end: midnight(17),
    start_date: ymd(midnight(15)),
    end_date: ymd(midnight(17)),
    type: 'personal',
    notes: 'Önnur bókun',
    created_at: new Date(),
  });
  await openCalendar(page);
  await page.getByRole('button', { name: 'Listi' }).click();

  const first = page.getByRole('button').filter({ hasText: 'Fyrirfram bókun' });
  await expect(first).toBeVisible();
  await expect(first).toContainText('3');
  await expect(first).toContainText('nætur');
  await first.click();
  const detail = page.getByRole('dialog', { name: 'Bókun', exact: true });
  await expect(detail).toBeVisible();
  // whole-day booking: no clock times in the dialog
  expect(await detail.innerText()).not.toMatch(/\b\d{1,2}[:.]\d{2}\b/);
  await detail.getByRole('button', { name: 'Eyða Bókun' }).click();
  await expect(detail.getByText('Ertu viss um að þú viljir eyða þessari bókun?')).toBeVisible();

  await page.keyboard.press('Escape'); // close WITHOUT confirming
  await expect(detail).toBeHidden();

  await page.getByRole('button').filter({ hasText: 'Önnur bókun' }).click();
  await expect(detail).toBeVisible();
  await expect(detail.getByText('Önnur bókun')).toBeVisible();
  await expect(detail.getByText('Ertu viss um að þú viljir eyða þessari bókun?')).toHaveCount(0);
  await expect(detail.getByRole('button', { name: 'Eyða Bókun' })).toBeVisible();

  // Switching straight to the same state again (re-open the first one) is also clean
  await detail.getByRole('button', { name: 'Eyða Bókun' }).click();
  await expect(detail.getByRole('button', { name: 'Já, eyða' })).toBeVisible();
  await detail.getByRole('button', { name: 'Hætta við' }).click();
  await expect(detail.getByRole('button', { name: 'Eyða Bókun' })).toBeVisible();
  expect((await listDocs(`houses/${H1}/bookings`)).length, 'nothing was deleted').toBe(2);
});

test('o: calendar: with only past bookings the list explains that older ones are not shown @mobile', async ({ page }) => {
  await setDoc(`houses/${H1}/bookings/seeded-booking`, {
    house_id: H1,
    user_id: A.uid,
    user_name: A.name,
    start: midnight(-12),
    end: midnight(-9),
    start_date: ymd(midnight(-12)),
    end_date: ymd(midnight(-9)),
    type: 'personal',
    notes: 'Gömul bókun',
    created_at: new Date(),
  });
  await openCalendar(page);
  await page.getByRole('button', { name: 'Listi' }).click();
  await expect(page.getByText('Engar framtíðarbókanir')).toBeVisible();
  await expect(page.getByText('Eldri bókanir eru ekki sýndar í þessum lista.')).toBeVisible();
  await expect(page.getByText('Gamlari')).toHaveCount(0);
});

test('o: calendar: a booking made by a co-owner appears without reloading, and disappears when deleted', async ({ page }) => {
  await openCalendar(page, B);
  await page.getByRole('button', { name: 'Listi' }).click();
  await expect(page.getByRole('button').filter({ hasText: 'Fyrirfram bókun' })).toBeVisible();
  await expect(page.getByRole('button').filter({ hasText: 'Samtímis bókun' })).toHaveCount(0);

  // "A" books through the REST API of the Firestore emulator while B has the page open
  await setDoc(`houses/${H1}/bookings/realtime-booking`, {
    house_id: H1,
    user_id: A.uid,
    user_name: A.name,
    start: midnight(25),
    end: midnight(27),
    start_date: ymd(midnight(25)),
    end_date: ymd(midnight(27)),
    type: 'personal',
    notes: 'Samtímis bókun',
    created_at: new Date(),
  });
  const card = page.getByRole('button').filter({ hasText: 'Samtímis bókun' });
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card).toContainText(A.name);

  // B tries to book the same days: the local pre-check already knows about it (live data, not a stale load)
  await page.getByRole('button', { name: 'Ný bókun', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Ný bókun', exact: true });
  await dialog.getByLabel('Upphafsdagur').fill(ymd(midnight(25)));
  await dialog.getByLabel('Lokadagur').fill(ymd(midnight(26)));
  await dialog.getByRole('button', { name: 'Búa til bókun' }).click();
  const conflict = page.getByRole('dialog', { name: 'Skörun bókana' });
  await expect(conflict.getByText('Anna Umsjón')).toBeVisible();
  await conflict.getByRole('button', { name: 'Hætta við' }).click();
  await dialog.getByRole('button', { name: 'Hætta við' }).click();

  // A deletes it again
  await deleteDocByPath(`houses/${H1}/bookings/realtime-booking`);
  await expect(card).toHaveCount(0, { timeout: 15_000 });
});

test('o: calendar: creating a booking shows it exactly once (listener, no extra reload) @mobile', async ({ page }) => {
  await openCalendar(page);
  await page.getByRole('button', { name: 'Listi' }).click();
  await page.getByRole('button', { name: 'Ný bókun', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Ný bókun', exact: true });
  await dialog.getByLabel('Upphafsdagur').fill(ymd(midnight(30)));
  await dialog.getByLabel('Lokadagur').fill(ymd(midnight(32)));
  await dialog.getByLabel('Athugasemd (valfrjálst)').fill('Aðeins einu sinni');
  await dialog.getByRole('button', { name: 'Búa til bókun' }).click();
  const success = page.getByRole('dialog', { name: 'Bókun staðfest!' });
  await expect(success).toBeVisible();
  await success.getByRole('button', { name: 'Loka', exact: true }).first().click();
  await expect(page.getByRole('button').filter({ hasText: 'Aðeins einu sinni' })).toHaveCount(1);
  await page.waitForTimeout(1500);
  await expect(page.getByRole('button').filter({ hasText: 'Aðeins einu sinni' })).toHaveCount(1);
  expect((await listDocs(`houses/${H1}/bookings`)).filter((b) => b.notes === 'Aðeins einu sinni')).toHaveLength(1);
});
