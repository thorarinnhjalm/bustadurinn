import { test, expect, freshSeed, login, shot, A, B, getDoc } from './support/fixtures';

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

test.beforeEach(async () => { await freshSeed(); });

test('walkthrough is a real modal dialog: focus trapped, Escape dismisses and is remembered @mobile', async ({ page }, testInfo) => {
  await login(page, B, '/dashboard');
  const walk = page.getByRole('dialog', { name: 'Kynning á Bústaðnum' });
  await expect(walk).toBeVisible({ timeout: 10_000 });
  await expect(walk.getByRole('heading', { name: 'Velkomin í Bústaðinn!' })).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await shot(page, 'k-walkthrough', testInfo);

  // Focus never lands on the page behind (a native modal dialog makes it inert; after the last
  // control Tab goes to the browser UI, i.e. body, and comes back into the dialog)
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const where = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return 'browser-ui';
      return el.closest('dialog') ? 'dialog' : `page: ${el.tagName} ${el.getAttribute('aria-label') ?? el.textContent?.slice(0, 30)}`;
    });
    expect(['dialog', 'browser-ui'], `Tab #${i + 1} focus is ${where}`).toContain(where);
  }

  // Step through
  for (const next of ['Bókanir & Dagatal', 'Verkefni & Viðhald', 'Hússjóðurinn', 'Allt klárt!']) {
    await walk.getByRole('button', { name: 'Áfram' }).click();
    await expect(walk.getByRole('heading', { name: next })).toBeVisible();
  }
  await walk.getByRole('button', { name: 'Byrja að nota' }).click();
  await expect(walk).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('has_seen_walkthrough'))).toBe('true');

  // Escape on a fresh visit
  await page.evaluate(() => localStorage.removeItem('has_seen_walkthrough'));
  await page.reload();
  await expect(walk).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('Escape');
  await expect(walk).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('has_seen_walkthrough'))).toBe('true');
  // and the page behind is usable again
  await page.getByRole('button', { name: 'Skrá komu', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Skrá komu' })).toBeVisible();
});

test('image cropper opens on a dark panel and a profile picture can be uploaded under the real storage rules @mobile', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
  await login(page, B, '/settings?tab=profile');
  await expect(page.getByRole('heading', { level: 2, name: 'Mínar stillingar' })).toBeVisible();

  await page.setInputFiles('#avatar-upload', { name: 'mynd.png', mimeType: 'image/png', buffer: PNG });
  const cropper = page.getByRole('dialog', { name: 'Klippa mynd' });
  await expect(cropper).toBeVisible();
  const bg = await cropper.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg, 'cropper panel is black, not white').toMatch(/^rgb\(\s*0,\s*0,\s*0\)/);
  await expect(cropper.getByLabel('Aðdráttur')).toBeVisible();
  await expect(cropper.getByLabel('Snúningur')).toBeVisible();
  // The title (visible heading) must be readable on the dark panel
  const titleColor = await cropper.getByRole('heading', { name: 'Klippa mynd' }).evaluate((el) => getComputedStyle(el).color);
  expect(titleColor).toBe('rgb(255, 255, 255)');
  await shot(page, 'k-cropper', testInfo);
  await cropper.getByRole('button', { name: 'Hætta við' }).click();
  await expect(cropper).toBeHidden();

  // Save one for real (Storage emulator + rules)
  await page.setInputFiles('#avatar-upload', { name: 'mynd.png', mimeType: 'image/png', buffer: PNG });
  await expect(cropper).toBeVisible();
  await cropper.getByRole('button', { name: 'Vista' }).click();
  await expect(page.getByText('Prófílmynd uppfærð!')).toBeVisible({ timeout: 20_000 });
  expect(String((await getDoc(`users/${B.uid}`))!.avatar)).toContain('127.0.0.1:9199');
});

test('guest preview opens on a dark panel and closes with Escape @mobile', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
  await login(page, A, '/settings?tab=guests');
  const opener = page.getByRole('button', { name: 'Forskoða' });
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  const preview = page.getByRole('dialog', { name: 'Forskoðun gestasíðu' });
  await expect(preview).toBeVisible();
  const bg = await preview.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg, 'preview panel is charcoal').toBe('rgb(26, 26, 26)');
  await expect(preview.getByText('Forskoðun gestasíðu — Þannig sjá gestir upplýsingarnar')).toBeVisible();
  await shot(page, 'k-guest-preview', testInfo);
  await page.keyboard.press('Escape');
  await expect(preview).toBeHidden();
  await expect(opener).toBeFocused();
});
