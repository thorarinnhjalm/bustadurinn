import type { Page } from '@playwright/test';
import { test, expect, freshSeed, login, shot, A, B, H1, getDoc, listDocs } from './support/fixtures';
import { ORG, ORG_NAME, REQUESTER_1, REQUESTER_2, MEMBER_M, PENDING_MEMBER, seedOrganization } from './support/seed';

test.beforeEach(async ({ page }) => {
  await freshSeed();
  await seedOrganization();
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
});

const ADMIN_URL = `/organizations/${ORG}/admin`;
const tab = (page: Page, name: string | RegExp) => page.getByRole('tab', { name });
const panel = (page: Page) => page.getByRole('tabpanel');

const TABS: Array<{ label: RegExp; heading: string }> = [
  { label: /^Yfirlit/, heading: 'Yfirlit' },
  { label: /^Aðgangsbeiðnir/, heading: 'Aðgangsbeiðnir' },
  { label: /^Starfsmenn/, heading: 'Starfsmenn (3)' },
  { label: /^Bókunarbeiðnir/, heading: 'Bókunarbeiðnir' },
  { label: /^Hús/, heading: 'Sumarhús' },
  { label: /^Stillingar/, heading: 'Stillingar' },
];

test('n: organization admin dashboard: six tabs by click and by keyboard, badge counts @mobile', async ({ page }, testInfo) => {
  await login(page, A, ADMIN_URL);
  await expect(page.getByRole('heading', { level: 1, name: ORG_NAME })).toBeVisible();
  await expect(page.getByRole('tablist', { name: 'Hlutar stjórnborðs' })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(6);

  // Badge counts: 2 pending access requests, 1 pending booking request
  await expect(tab(page, /^Aðgangsbeiðnir/)).toContainText('Í bið: 2');
  await expect(tab(page, /^Bókunarbeiðnir/)).toContainText('Í bið: 1');
  await expect(tab(page, /^Yfirlit/)).not.toContainText('Í bið');
  await shot(page, 'n-org-overview', testInfo);

  // By click
  for (const t of TABS) {
    await tab(page, t.label).click();
    await expect(tab(page, t.label)).toHaveAttribute('aria-selected', 'true');
    await expect(panel(page).getByRole('heading', { level: 2, name: t.heading })).toBeVisible();
    await expect(panel(page)).toHaveAttribute('aria-labelledby', (await tab(page, t.label).getAttribute('id'))!);
    // no horizontal page scroll at phone width (tab labels and request buttons used to spill out)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `${t.heading}: horizontal overflow`).toBeLessThanOrEqual(1);
  }

  // By keyboard: End -> last, Home -> first, ArrowRight/ArrowLeft move and wrap
  await tab(page, /^Yfirlit/).click();
  await tab(page, /^Yfirlit/).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tab(page, /^Aðgangsbeiðnir/)).toBeFocused();
  await expect(tab(page, /^Aðgangsbeiðnir/)).toHaveAttribute('aria-selected', 'true');
  await expect(panel(page).getByRole('heading', { level: 2, name: 'Aðgangsbeiðnir' })).toBeVisible();
  await page.keyboard.press('End');
  await expect(tab(page, /^Stillingar/)).toBeFocused();
  await expect(panel(page).getByRole('heading', { level: 2, name: 'Stillingar' })).toBeVisible();
  await page.keyboard.press('ArrowRight'); // wraps to the first
  await expect(tab(page, /^Yfirlit/)).toBeFocused();
  await page.keyboard.press('ArrowLeft'); // wraps to the last
  await expect(tab(page, /^Stillingar/)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tab(page, /^Yfirlit/)).toBeFocused();
  await expect(tab(page, /^Yfirlit/)).toHaveAttribute('aria-selected', 'true');
  // Roving tabindex: only the selected tab is in the tab order
  await expect(page.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
});

test('n: members tab and overview use Icelandic labels only', async ({ page }) => {
  await login(page, A, ADMIN_URL);
  await expect(page.getByText('Með gestaaðgang')).toBeVisible();
  await tab(page, /^Starfsmenn/).click();
  const table = page.getByRole('table', { name: 'Starfsmenn félagsins' });
  await expect(table.getByRole('row').filter({ hasText: PENDING_MEMBER.name })).toContainText('Í bið');
  await expect(table.getByRole('row').filter({ hasText: MEMBER_M.name })).toContainText('Virkur');
  await expect(page.getByText('Pending', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/\bguest\b/i)).toHaveCount(0);
});

test('n: approve and deny access requests, approve a booking request @mobile', async ({ page, promptAnswers, nativeDialogs }, testInfo) => {
  await login(page, A, ADMIN_URL);
  await tab(page, /^Aðgangsbeiðnir/).click();
  const r1 = panel(page).locator('.card').filter({ hasText: REQUESTER_1.name });
  const r2 = panel(page).locator('.card').filter({ hasText: REQUESTER_2.name });
  await expect(r1).toContainText('Í bið');
  await shot(page, 'n-org-access-requests', testInfo);

  // Approve -> members/{requester uid} exists and is active
  await r1.getByRole('button', { name: 'Samþykkja' }).click();
  await expect(r1).toContainText('Samþykkt');
  await expect(r1.getByRole('button', { name: 'Samþykkja' })).toHaveCount(0);
  const member = await getDoc(`organizations/${ORG}/members/${REQUESTER_1.uid}`);
  expect(member).toMatchObject({ status: 'active', user_id: REQUESTER_1.uid, email: REQUESTER_1.email, access_level: 'full' });
  expect((await getDoc(`organizations/${ORG}/access_requests/ar-1`))!.status).toBe('approved');
  await expect(tab(page, /^Aðgangsbeiðnir/)).toContainText('Í bið: 1');

  // Deny asks for a reason
  promptAnswers.push('Ekki starfsmaður');
  await r2.getByRole('button', { name: 'Hafna' }).click();
  await expect(r2).toContainText('Hafnað');
  expect(nativeDialogs).toContain('prompt: Ástæða fyrir höfnun:');
  const denied = await getDoc(`organizations/${ORG}/access_requests/ar-2`);
  expect(denied).toMatchObject({ status: 'denied', denial_reason: 'Ekki starfsmaður' });
  expect(await getDoc(`organizations/${ORG}/members/${REQUESTER_2.uid}`)).toBeNull();
  await expect(tab(page, /^Aðgangsbeiðnir/)).not.toContainText('Í bið');

  // The new member shows up in the members tab
  await tab(page, /^Starfsmenn/).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Starfsmenn (4)' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Starfsmenn félagsins' }).getByText(REQUESTER_1.name)).toBeVisible();

  // Booking request: approve -> a booking appears under houses/{id}/bookings
  await tab(page, /^Bókunarbeiðnir/).click();
  const br = panel(page).locator('.card').filter({ hasText: 'Fjölskylduhelgi' });
  await expect(br).toContainText(MEMBER_M.name);
  await br.getByRole('button', { name: 'Samþykkja' }).click();
  await expect(br).toContainText('Samþykkt');
  await expect.poll(async () => (await listDocs(`houses/${H1}/bookings`)).length).toBe(2);
  const booking = (await listDocs(`houses/${H1}/bookings`)).find((b) => b.created_from_request_id === 'br-1')!;
  expect(booking).toMatchObject({ user_id: MEMBER_M.uid, organization_id: ORG, num_nights: 3, status: 'confirmed' });
  expect((await getDoc(`organizations/${ORG}/booking_requests/br-1`))!.status).toBe('approved');
  expect((await getDoc(`organizations/${ORG}/members/${MEMBER_M.uid}`))!.bookings_total).toBe(1);
  await expect(tab(page, /^Bókunarbeiðnir/)).not.toContainText('Í bið');
  await shot(page, 'n-org-booking-approved', testInfo);
});

test('n: houses tab: add-house dialog is labelled, accepts input, cancel returns focus; a house can be added', async ({ page }, testInfo) => {
  await login(page, A, ADMIN_URL);
  await tab(page, /^Hús/).click();
  await expect(panel(page).getByRole('heading', { level: 3, name: 'Hóll við vatnið' })).toBeVisible();

  const opener = panel(page).getByRole('button', { name: 'Bæta við húsi' }).first();
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Bæta við sumarhúsi' });
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await dialog.getByLabel(/^Nafn húss/).fill('Sjávarkot');
  await dialog.getByLabel(/^Heimilisfang/).fill('Strandgata 1');
  await dialog.getByLabel(/^Breiddargráða/).fill('64.1');
  await dialog.getByLabel(/^Lengdargráða/).fill('-21.9');
  await dialog.getByLabel(/^Húsreglur/).fill('Engin gæludýr');
  await expect(dialog.getByLabel(/^Nafn húss/)).toHaveValue('Sjávarkot');
  await shot(page, 'n-org-add-house', testInfo);
  await dialog.getByRole('button', { name: 'Hætta við' }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect((await listDocs('houses')).filter((h) => h.organization_id === ORG)).toHaveLength(1);

  // Now actually add one
  await opener.click();
  await dialog.getByLabel(/^Nafn húss/).fill('Sjávarkot');
  await dialog.getByLabel(/^Heimilisfang/).fill('Strandgata 1');
  await dialog.getByLabel(/^Breiddargráða/).fill('64.1');
  await dialog.getByLabel(/^Lengdargráða/).fill('-21.9');
  await dialog.getByRole('button', { name: 'Búa til hús' }).click();
  await expect(dialog).toBeHidden();
  await expect(panel(page).getByRole('heading', { level: 3, name: 'Sjávarkot' })).toBeVisible();
  const created = (await listDocs('houses')).find((h) => h.name === 'Sjávarkot')!;
  expect(created).toMatchObject({ organization_id: ORG, manager_id: A.uid, owner_ids: [A.uid] });
  expect((await getDoc(`organizations/${ORG}`))!.stats.total_properties).toBe(2);
});

test('n: settings: changing the organization name is saved', async ({ page, nativeDialogs }, testInfo) => {
  await login(page, A, ADMIN_URL);
  await tab(page, /^Stillingar/).click();
  const name = page.getByLabel(/^Nafn félags/);
  await expect(name).toHaveValue(ORG_NAME);
  await name.fill('Félag Hólsins og vina');
  await page.getByRole('button', { name: 'Vista breytingar' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Félag Hólsins og vina' })).toBeVisible();
  expect((await getDoc(`organizations/${ORG}`))!.name).toBe('Félag Hólsins og vina');
  await expect.poll(() => nativeDialogs).toContain('alert: Upplýsingar uppfærðar'); // the alert follows the reload
  await shot(page, 'n-org-settings', testInfo);
});

test('n: a signed-in user who does not administer the organization sees the access-denied state @mobile', async ({ page }) => {
  await login(page, B, ADMIN_URL);
  await expect(page.getByRole('heading', { name: 'Aðgangur bannaður' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Þú hefur ekki réttindi');
  await expect(page.getByRole('tablist')).toHaveCount(0);
});
