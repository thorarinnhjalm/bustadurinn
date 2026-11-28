import { test, expect, freshSeed, shot } from './support/fixtures';
import { GUEST_TOKEN, HOUSE_NAME, A } from './support/seed';
import { listDocs } from './support/emulator';

test.beforeEach(async () => { await freshSeed(); });

test('g: anonymous guest sees the house, lightbox is dark, guestbook form works @mobile', async ({ page }, testInfo) => {
  await page.goto(`/guest/${GUEST_TOKEN}`);
  await expect(page.getByRole('heading', { name: 'Góðan daginn!' })).toBeVisible();
  await expect(page.getByText(HOUSE_NAME).first()).toBeVisible();
  await expect(page.getByText('HollWifi')).toBeVisible();
  await expect(page.getByRole('link', { name: /Rata í hús/ })).toBeVisible();
  await shot(page, 'g-guest-top', testInfo);

  // --- House rules tile opens the rules (it used to be a button that did nothing)
  const rulesTile = page.getByRole('button', { name: 'Húsreglur' });
  await rulesTile.scrollIntoViewIfNeeded();
  await rulesTile.click();
  const rules = page.getByRole('dialog', { name: 'Húsreglur' });
  await expect(rules).toBeVisible();
  await expect(rules.getByText('Engar skór inni í húsinu.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(rules).toBeHidden();
  await expect(rulesTile).toBeFocused();

  // --- Gallery lightbox: dark panel, Escape closes, focus returns
  const opener = page.getByRole('button', { name: 'Opna mynd 1 í fullri stærð' });
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  const lightbox = page.getByRole('dialog', { name: 'Mynd í fullri stærð' });
  await expect(lightbox).toBeVisible();
  const bg = await lightbox.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg, 'lightbox panel must be black, not the default white').toMatch(/^rgb\(\s*0,\s*0,\s*0\)|^rgba\(\s*0,\s*0,\s*0/);
  await shot(page, 'g-guest-lightbox', testInfo);
  await page.keyboard.press('Escape');
  await expect(lightbox).toBeHidden();
  await expect(opener).toBeFocused();

  // --- Guestbook form (api/guestbook-entry is mocked and writes to the emulator)
  const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Senda inn' }) });
  await form.scrollIntoViewIfNeeded();
  await form.getByLabel('Nafn þitt').fill('Sigga Gestur');
  await form.getByLabel('Skilaboð í gestabókina').fill('Takk fyrir okkur!');
  await form.getByRole('button', { name: 'Senda inn' }).click();
  await expect(page.getByText('Takk fyrir að skrifa í gestabókina!')).toBeVisible();
  await expect(form.getByLabel('Nafn þitt')).toHaveValue('');
  await shot(page, 'g-guest-guestbook-sent', testInfo);
  const entries = await listDocs('guestbook');
  expect(entries.some((e) => e.author === 'Sigga Gestur' && e.house_id === 'house-h1')).toBe(true);
  void A;
});

test('g: unknown guest token shows the not-found/expired state @mobile', async ({ page }, testInfo) => {
  await page.goto('/guest/does-not-exist');
  await expect(page.getByText('Hlekkurinn er útrunninn eða ógildur.')).toBeVisible();
  await shot(page, 'g-guest-unknown', testInfo);
});
