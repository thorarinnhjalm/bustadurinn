import { test, expect, freshSeed, login, shot, B, A, H1, listDocs } from './support/fixtures';
import { LAST_YEAR, THIS_YEAR } from './support/seed';

test.beforeEach(async ({ page }) => {
  await freshSeed();
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
});

test('d: finance balance, keyboard tabs, add/edit/delete a split expense, year selector @mobile', async ({ page }, testInfo) => {
  await login(page, B, '/finance');
  await expect(page.getByRole('heading', { name: 'Hússjóður', exact: true })).toBeVisible();

  // --- Tabs with the keyboard (roving tabindex)
  const budget = page.getByRole('tab', { name: 'Rekstraráætlun' });
  const ledger = page.getByRole('tab', { name: 'Bókhald' });
  const summary = page.getByRole('tab', { name: 'Ársyfirlit' });
  await budget.focus();
  await page.keyboard.press('ArrowRight');
  await expect(ledger).toHaveAttribute('aria-selected', 'true');
  await expect(ledger).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(summary).toHaveAttribute('aria-selected', 'true');
  await expect(summary).toBeFocused();
  await shot(page, 'd-finance-summary', testInfo);
  await page.keyboard.press('ArrowRight'); // wraps to the first
  await expect(budget).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft'); // and back to the last
  await expect(summary).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(budget).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(ledger).toHaveAttribute('aria-selected', 'true');

  // The tabpanel is labelled by the active tab
  await expect(page.getByRole('tabpanel', { name: 'Bókhald' })).toBeVisible();

  // --- All-time balance includes last year's income: 100000 - 40000 = 60000
  const fund = page.getByRole('heading', { name: 'Staða sjóðsins' }).locator('xpath=..');
  await expect(fund).toContainText(/60[.\s\u00a0,]?000\s*kr/);
  await expect(page.getByRole('row', { name: /Rafmagn/ })).toBeVisible();
  await shot(page, 'd-finance-ledger', testInfo);

  // --- Add an expense split between A and B (names come from the mocked house-members)
  await page.getByRole('button', { name: 'Skrá færslu' }).click();
  const form = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Ný færsla' }) });
  await expect(form).toBeVisible();
  await form.getByLabel('Upphæð (kr.)').fill('12345');
  await form.getByLabel('Flokkur').fill('Bónus');
  await form.getByLabel('Lýsing (valfrjálst)').fill('Matvörur');
  const anna = form.getByRole('button', { name: 'Anna Umsjón' });
  const bjarni = form.getByRole('button', { name: 'Bjarni Meðeigandi' });
  await expect(anna).toBeVisible();
  await anna.click();
  await bjarni.click();
  await expect(anna).toHaveAttribute('aria-pressed', 'true');
  await expect(bjarni).toHaveAttribute('aria-pressed', 'true');
  await shot(page, 'd-finance-form', testInfo);
  await form.getByRole('button', { name: 'Skrá færslu' }).click();

  const row = page.getByRole('row', { name: /Bónus/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText(/12[.\s\u00a0,]?345/);
  // B did not create the seeded entry, so only B's own row has actions. On a phone they must be
  // reachable without scrolling the table sideways.
  await row.scrollIntoViewIfNeeded();
  await shot(page, 'd-finance-ledger-table', testInfo);
  const delBox = await row.getByRole('button', { name: 'Eyða færslu' }).boundingBox();
  expect(delBox!.x + delBox!.width, 'row actions inside the viewport').toBeLessThanOrEqual(page.viewportSize()!.width);
  const tableBox = await page.getByRole('table').boundingBox();
  expect(tableBox!.x + tableBox!.width, 'table fits the viewport').toBeLessThanOrEqual(page.viewportSize()!.width);
  await expect.poll(async () => (await listDocs(`houses/${H1}/finance_entries`)).some((e) => e.category === 'Bónus')).toBe(true);
  const saved = (await listDocs(`houses/${H1}/finance_entries`)).find((e) => e.category === 'Bónus');
  expect(saved!.split_between.map((s: any) => s.uid).sort()).toEqual([A.uid, B.uid].sort());
  expect(saved!.user_uid).toBe(B.uid);
  await expect(fund).toContainText(/47[.\s\u00a0,]?655\s*kr/);

  // --- Edit it
  await row.getByRole('button', { name: 'Breyta færslu' }).click();
  const editForm = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Breyta færslu' }) });
  await expect(editForm).toBeVisible();
  await expect(editForm.getByLabel('Upphæð (kr.)')).toHaveValue('12345');
  await editForm.getByLabel('Upphæð (kr.)').fill('20000');
  await editForm.getByRole('button', { name: 'Skrá færslu' }).click();
  await expect(page.getByRole('row', { name: /Bónus/ })).toContainText(/20[.\s\u00a0,]?000/);
  await expect(fund).toContainText(/40[.\s\u00a0,]?000\s*kr/);

  // --- Delete it (native confirm is auto-accepted by the fixture)
  await page.getByRole('row', { name: /Bónus/ }).getByRole('button', { name: 'Eyða færslu' }).click();
  await expect(page.getByRole('row', { name: /Bónus/ })).toHaveCount(0);
  await expect(fund).toContainText(/60[.\s\u00a0,]?000\s*kr/);

  // --- Year selector: last year's entry shows
  await expect(page.getByRole('row', { name: /Mánaðargjald/ })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Ár:' }).selectOption(String(LAST_YEAR));
  await expect(page.getByRole('heading', { name: `Bókhald ${LAST_YEAR}` })).toBeVisible();
  await expect(page.getByRole('row', { name: /Mánaðargjald/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Rafmagn/ })).toHaveCount(0);
  // the all-time balance does not change with the year
  await expect(fund).toContainText(/60[.\s\u00a0,]?000\s*kr/);
  await shot(page, 'd-finance-last-year', testInfo);
  await page.getByRole('combobox', { name: 'Ár:' }).selectOption(String(THIS_YEAR));
  await expect(page.getByRole('row', { name: /Rafmagn/ })).toBeVisible();
});
