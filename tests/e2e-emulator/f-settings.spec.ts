import type { Page } from '@playwright/test';
import { test, expect, freshSeed, login, shot, A, B, H1, getDoc } from './support/fixtures';
import { HOUSE_NAME } from './support/seed';

test.beforeEach(async ({ page }) => {
  await freshSeed();
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
});

const TABS: Array<{ nav: string; heading: string }> = [
  { nav: 'Húsupplýsingar', heading: 'Grunnupplýsingar' },
  { nav: 'Innkaupalisti', heading: 'Innkaupalisti' },
  { nav: 'Verkefni & Viðhald', heading: 'Verkefni & Viðhald' },
  { nav: 'Meðeigendur', heading: 'Meðeigendur' },
  { nav: 'Gestaupplýsingar', heading: 'Bókunarhlekkir' },
  { nav: 'Gestabók', heading: 'Gestabók' },
  { nav: 'Mínar stillingar', heading: 'Mínar stillingar' },
];

async function settingsNav(page: Page) {
  return page.getByRole('navigation', { name: 'Stillingar' });
}

test('f: settings as non-manager B: every tab, deep link, members, read-only house, leave dialog @mobile', async ({ page }, testInfo) => {
  await login(page, B, '/settings');
  await expect(page.getByRole('heading', { name: 'Stillingar', exact: true })).toBeVisible();
  const nav = await settingsNav(page);

  for (const tab of TABS) {
    await nav.getByRole('button', { name: tab.nav }).click();
    await expect(nav.getByRole('button', { name: tab.nav })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { level: 2, name: tab.heading }).first()).toBeVisible();
    await shot(page, `f-settings-tab-${TABS.indexOf(tab)}`, testInfo);
  }

  // --- Deep link
  await page.goto('/settings?tab=members');
  await expect(page.getByRole('heading', { level: 2, name: 'Meðeigendur' })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Meðeigendur' })).toHaveAttribute('aria-current', 'page');

  // --- Members list: A is "Umsjónarmaður", B (you) "Meðeigandi"
  const annaRow = page.getByText('Anna Umsjón').locator('xpath=ancestor::div[contains(@class,"justify-between")][1]');
  await expect(annaRow).toContainText('Umsjónarmaður');
  const bjarniRow = page.getByText('Bjarni Meðeigandi').locator('xpath=ancestor::div[contains(@class,"justify-between")][1]');
  await expect(bjarniRow).toContainText('Meðeigandi');
  await expect(bjarniRow).toContainText('Þú');
  // Non-manager has no manager-only actions
  await expect(page.getByRole('button', { name: /Fjarlægja/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Gera að umsjónarmanni/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Eyða húsi' })).toHaveCount(0);
  await shot(page, 'f-settings-members', testInfo);

  // --- Leave dialog -> cancel; focus returns to the opener
  const leave = page.getByRole('button', { name: 'Yfirgefa hús', exact: true });
  await leave.click();
  const dialog = page.getByRole('dialog', { name: 'Yfirgefa hús?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(HOUSE_NAME)).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await shot(page, 'f-settings-leave-dialog', testInfo);
  await expect(dialog.getByRole('button', { name: 'Yfirgefa hús' })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Hætta við' }).click();
  await expect(dialog).toBeHidden();
  await expect(leave).toBeFocused();
  expect((await getDoc(`houses/${H1}`))!.owner_ids).toContain(B.uid);

  // --- House fields are disabled and the note explains why
  await nav.getByRole('button', { name: 'Húsupplýsingar' }).click();
  await expect(page.getByText('Aðeins umsjónarmaður hússins getur breytt húsupplýsingum.')).toBeVisible();
  const nameInput = page.getByLabel('Nafn sumarhúss');
  await expect(nameInput).toBeDisabled();
  await expect(nameInput).toHaveValue(HOUSE_NAME);
  await expect(nameInput).toHaveAccessibleDescription(/Aðeins umsjónarmaður/);
  await shot(page, 'f-settings-house-readonly', testInfo);
});

test('f: profile: B changes display name @mobile', async ({ page }, testInfo) => {
  await login(page, B, '/settings?tab=profile');
  await expect(page.getByRole('heading', { level: 2, name: 'Mínar stillingar' })).toBeVisible();
  const name = page.getByLabel('Nafn', { exact: true });
  await expect(name).toHaveValue(B.name);
  await name.fill('Bjarni Nýnafn');
  await page.getByRole('button', { name: 'Vista', exact: true }).click();
  await expect(page.getByText('Nafni breytt!')).toBeVisible();
  expect((await getDoc(`users/${B.uid}`))!.name).toBe('Bjarni Nýnafn');
  await shot(page, 'f-settings-profile-saved', testInfo);
});

test('f: manager A edits house name, opens remove-member and delete-account dialogs @mobile', async ({ page }, testInfo) => {
  await login(page, A, '/settings');
  const nav = await settingsNav(page);

  // --- Edit the house name
  const nameInput = page.getByLabel('Nafn sumarhúss');
  await expect(nameInput).toBeEnabled();
  await nameInput.fill('Hóll við vatnið - nýtt nafn');
  await shot(page, 'f-settings-house-manager', testInfo);
  await page.getByRole('button', { name: 'Vista breytingar' }).click();
  await expect(page.getByText('Breytingar vistaðar!')).toBeVisible();
  expect((await getDoc(`houses/${H1}`))!.name).toBe('Hóll við vatnið - nýtt nafn');

  // --- Remove-member dialog for B -> cancel
  await nav.getByRole('button', { name: 'Meðeigendur' }).click();
  const removeBtn = page.getByRole('button', { name: /Fjarlægja\s*:\s*Bjarni Meðeigandi/ });
  await removeBtn.click();
  const removeDialog = page.getByRole('dialog', { name: 'Fjarlægja meðeiganda?' });
  await expect(removeDialog).toBeVisible();
  await expect(removeDialog.getByText('Bjarni Meðeigandi')).toBeVisible();
  await shot(page, 'f-settings-remove-member', testInfo);
  await removeDialog.getByRole('button', { name: 'Hætta við' }).click();
  await expect(removeDialog).toBeHidden();
  await expect(removeBtn).toBeFocused();
  expect((await getDoc(`houses/${H1}`))!.owner_ids).toContain(B.uid);

  // --- Delete-account dialog: wrong word keeps the confirm button disabled
  await nav.getByRole('button', { name: 'Mínar stillingar' }).click();
  await page.getByRole('button', { name: 'Eyða aðgangi', exact: true }).click();
  const del = page.getByRole('dialog', { name: 'Eyða aðgangi?' });
  await expect(del).toBeVisible();
  const confirm = del.getByRole('button', { name: 'Eyða aðgangi varanlega' });
  await expect(confirm).toBeDisabled();
  await del.getByLabel(/Skrifaðu/).fill('RANGT');
  await expect(confirm).toBeDisabled();
  await shot(page, 'f-settings-delete-account', testInfo);
  await del.getByLabel(/Skrifaðu/).fill('eyða'); // upper-cased by the input
  await expect(del.getByLabel(/Skrifaðu/)).toHaveValue('EYÐA');
  await expect(confirm).toBeEnabled();
  await del.getByRole('button', { name: 'Hætta við' }).click();
  await expect(del).toBeHidden();
  // nothing was deleted
  expect(await getDoc(`users/${A.uid}`)).toBeTruthy();
});
