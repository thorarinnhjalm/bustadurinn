import { test, expect, freshSeed, login, shot, A, B, H1, getDoc } from './support/fixtures';
import { H2, H2_NAME, HOUSE_NAME, seedSuperAdmin, C } from './support/seed';

test.beforeEach(async ({ page }) => {
  await freshSeed();
  await seedSuperAdmin();
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
});

const TOP = ['Yfirlit', 'Gögn', 'Samskipti', 'Greining', 'Kerfi'];

function topTab(page: import('@playwright/test').Page, name: string) {
  return page.getByRole('tab', { name, exact: true });
}
function subTab(page: import('@playwright/test').Page, name: string) {
  // The admin sidebar has buttons with the same names as some sub-tabs: scope to the tab panel.
  return page.getByRole('tabpanel').getByRole('button', { name, exact: true });
}

test('m: super admin page loads without the error state and every top-level tab renders @mobile', async ({ page, mocks }, testInfo) => {
  await login(page, A, '/super-admin');
  await expect(page.getByRole('heading', { name: 'Super Admin' })).toBeVisible();
  await expect(page.getByText('Ekki tókst að sækja gögn')).toHaveCount(0);
  await expect(page.getByText('Engin gögn fundust')).toHaveCount(0);
  await expect(page.getByRole('alert').filter({ hasText: 'Sum gögn hlóðust ekki rétt' })).toHaveCount(0);
  await shot(page, 'm-superadmin-overview', testInfo);

  // Overview content: the seeded totals
  const panel = page.getByRole('tabpanel', { name: 'Yfirlit' });
  await expect(panel).toBeVisible();
  await expect(topTab(page, 'Yfirlit')).toHaveAttribute('aria-selected', 'true');

  // Every top-level tab by click; the matching tab panel is labelled and has content
  for (const name of TOP) {
    await topTab(page, name).click();
    await expect(topTab(page, name)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name })).toBeVisible();
  }
  await topTab(page, 'Gögn').click();
  await expect(subTab(page, 'Hús')).toHaveAttribute('aria-current', 'page');
  await topTab(page, 'Samskipti').click();
  await expect(subTab(page, 'Samskipti')).toHaveAttribute('aria-current', 'page');
  await topTab(page, 'Greining').click();
  await expect(subTab(page, 'Business Intel')).toHaveAttribute('aria-current', 'page');
  await topTab(page, 'Kerfi').click();
  await expect(subTab(page, 'Audit')).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'Úttekt notenda' })).toBeVisible();
  await shot(page, 'm-superadmin-system', testInfo);
  expect(mocks.calls.filter((c) => c.path === 'admin-audit-users').length).toBeGreaterThan(0);
});

test('m: every sub-tab under Gögn, Samskipti, Greining and Kerfi shows its seeded rows, and the sub-tab is remembered', async ({ page, mocks }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'tables are desktop-only');
  await login(page, A, '/super-admin');
  await expect(page.getByRole('heading', { name: 'Super Admin' })).toBeVisible();

  // --- Gögn
  await topTab(page, 'Gögn').click();
  const houses = page.getByRole('table', { name: 'Húsaskrá' });
  await expect(houses.getByRole('cell', { name: HOUSE_NAME, exact: true })).toBeVisible();
  await expect(houses.getByRole('cell', { name: H2_NAME, exact: true })).toBeVisible();

  await subTab(page, 'Notendur').click();
  await expect(subTab(page, 'Notendur')).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText(C.email).first()).toBeVisible();
  await expect(page.getByText(B.email).first()).toBeVisible();

  await subTab(page, 'Félög').click();
  await expect(page.getByRole('table', { name: 'Skráð félög' }).getByText('Starfsmannafélag Hólsins')).toBeVisible();

  await subTab(page, 'Verktakar').click();
  const providers = page.getByRole('table', { name: 'Skráðir verktakar' });
  await expect(providers.getByText('Snjómokstur Suðurlands')).toBeVisible();
  await expect(providers.getByText('Þrif og þjónusta')).toBeVisible();
  // service_provider_contacts is merged onto the provider
  await expect(providers.getByText('snjor@example.test')).toBeVisible();
  await shot(page, 'm-superadmin-providers', testInfo);

  // Leave Gögn on the non-default "Verktakar" and come back: remembered
  await topTab(page, 'Yfirlit').click();
  await topTab(page, 'Gögn').click();
  await expect(subTab(page, 'Verktakar')).toHaveAttribute('aria-current', 'page');
  await expect(providers).toBeVisible();

  // --- Samskipti
  await topTab(page, 'Samskipti').click();
  const contacts = page.getByRole('table', { name: 'Samskipti frá síðu' });
  await expect(contacts.getByText('Gunnar Gestur')).toBeVisible();
  await expect(contacts.getByText('Halla Fyrirspurn')).toBeVisible();

  await subTab(page, 'Sniðmát').click();
  await expect(page.getByRole('heading', { name: 'Tölvupóstsniðmát' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'welcome' })).toBeVisible();

  await subTab(page, 'Póstlisti').click();
  const news = page.getByRole('table', { name: 'Póstlisti' });
  await expect(news.getByText('frettir@example.test')).toBeVisible();
  await expect(news.getByText('annad@example.test')).toBeVisible();

  await subTab(page, 'Umsagnir').click();
  const fb = page.getByRole('table', { name: 'Umsagnir notenda' });
  await expect(fb.getByText('Sigríður Jónsdóttir')).toBeVisible();
  await expect(fb.getByText('Frábært kerfi fyrir fjölskylduna')).toBeVisible();

  await topTab(page, 'Kerfi').click();
  await topTab(page, 'Samskipti').click();
  await expect(subTab(page, 'Umsagnir')).toHaveAttribute('aria-current', 'page');
  await expect(fb).toBeVisible();

  // --- Greining
  await topTab(page, 'Greining').click();
  await expect(subTab(page, 'Business Intel')).toHaveAttribute('aria-current', 'page');
  await subTab(page, 'Greining').click();
  await expect(page.getByRole('heading', { name: /Vefgreining/ })).toBeVisible();
  await expect(page.getByText(/^1[.,\s]?234$/).first()).toBeVisible();
  await expect(page.getByText('sumarhús skipulag')).toBeVisible();
  await topTab(page, 'Kerfi').click();
  await topTab(page, 'Greining').click();
  await expect(page.getByRole('heading', { name: /Vefgreining/ })).toBeVisible();
  await shot(page, 'm-superadmin-analytics', testInfo);
  expect(mocks.calls.map((c) => c.path)).toEqual(expect.arrayContaining(['analytics', 'search-console']));
});

test('m: recent signups: expanding a row shows the funnel timeline @mobile', async ({ page }, testInfo) => {
  await login(page, A, '/super-admin');
  const signups = page.getByRole('table', { name: 'Nýskráningar síðustu 24 klukkustundir' });
  await expect(signups.getByText(B.email)).toBeVisible();
  // C has no house: flagged as stuck
  const cRow = signups.getByRole('row').filter({ hasText: C.email });
  await expect(cRow).toContainText('Festist?');

  const toggle = signups.getByRole('button', { name: `Sýna skref notanda ${B.name}` });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(signups.getByText('Opnaði nýskráningu')).toBeVisible();
  await expect(signups.getByText('Nýskráningu lokið')).toBeVisible();
  await expect(signups.getByText('Villa við að stofna hús')).toBeVisible();
  await shot(page, 'm-superadmin-funnel', testInfo);
  await toggle.click();
  await expect(signups.getByText('Opnaði nýskráningu')).toHaveCount(0);
});

test('m: houses: edit the name, then delete with the typed confirmation', async ({ page, mocks, promptAnswers, nativeDialogs }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop table');
  await login(page, A, '/super-admin');
  await topTab(page, 'Gögn').click();
  const houses = page.getByRole('table', { name: 'Húsaskrá' });

  // --- edit
  await houses.getByRole('button', { name: `Breyta húsi ${H2_NAME}` }).click();
  const dialog = page.getByRole('dialog', { name: 'Breyta húsi' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Nafn húss').fill('Fjallakofinn endurnýjaður');
  await shot(page, 'm-superadmin-edit-house', testInfo);
  await dialog.getByRole('button', { name: 'Vista breytingar' }).click();
  await expect(dialog).toBeHidden();
  await expect(houses.getByRole('cell', { name: 'Fjallakofinn endurnýjaður', exact: true })).toBeVisible();
  expect((await getDoc(`houses/${H2}`))!.name).toBe('Fjallakofinn endurnýjaður');
  await expect.poll(() => nativeDialogs).toContain('alert: Hús uppfært!');

  // --- delete: wrong confirmation does nothing
  promptAnswers.push('rangt nafn');
  await houses.getByRole('button', { name: 'Eyða húsi Fjallakofinn endurnýjaður' }).click();
  await expect.poll(() => nativeDialogs.some((d) => d.startsWith('alert: Hætt við'))).toBe(true);
  expect(mocks.calls.filter((c) => c.path === 'admin-delete-house')).toHaveLength(0);

  // --- delete: typed name -> API called with the house id, row disappears
  promptAnswers.push('Fjallakofinn endurnýjaður');
  await houses.getByRole('button', { name: 'Eyða húsi Fjallakofinn endurnýjaður' }).click();
  await expect.poll(() => mocks.calls.filter((c) => c.path === 'admin-delete-house').length).toBe(1);
  expect(mocks.calls.find((c) => c.path === 'admin-delete-house')!.body).toEqual({ houseId: H2 });
  await expect(houses.getByRole('cell', { name: 'Fjallakofinn endurnýjaður', exact: true })).toHaveCount(0);
  const prompt = nativeDialogs.find((d) => d.startsWith('prompt:'))!;
  expect(prompt).toContain('Skrifaðu nafn hússins til að staðfesta:');
  expect(prompt).not.toContain('sta staðfesta');
  expect(await getDoc(`houses/${H2}`)).toBeNull();
  expect(await getDoc(`houses/${H1}`)).toBeTruthy();
});

test('m: contacts: reply dialog, send, history, and the draft does not leak to another contact', async ({ page, mocks }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop table');
  await login(page, A, '/super-admin');
  await topTab(page, 'Samskipti').click();
  const table = page.getByRole('table', { name: 'Samskipti frá síðu' });
  const gunnar = table.getByRole('row').filter({ hasText: 'Gunnar Gestur' });
  const halla = table.getByRole('row').filter({ hasText: 'Halla Fyrirspurn' });

  await gunnar.getByRole('button', { name: 'Svara' }).click();
  const dialog = page.getByRole('dialog', { name: 'Svara erindi' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Hæ, hvernig get ég boðið meðeigendum í húsið?')).toBeVisible();
  const send = dialog.getByRole('button', { name: 'Senda svar' });
  await expect(send).toBeDisabled();
  await dialog.getByLabel('Svar').fill('Ég er ekki búin(n) að senda þetta');

  // closing without sending clears the draft: a different contact opens an empty form
  await dialog.getByRole('button', { name: 'Loka', exact: true }).first().click();
  await expect(dialog).toBeHidden();
  await halla.getByRole('button', { name: 'Svara' }).click();
  await expect(dialog.getByLabel('Svar')).toHaveValue('');
  await dialog.getByRole('button', { name: 'Loka', exact: true }).first().click();

  // send for real
  await gunnar.getByRole('button', { name: 'Svara' }).click();
  await dialog.getByLabel('Svar').fill('Þú getur boðið þeim undir Stillingar > Meðeigendur.');
  await shot(page, 'm-superadmin-reply', testInfo);
  await send.click();
  await expect(dialog).toBeHidden();
  const call = mocks.calls.find((c) => c.path === 'admin-send-reply')!;
  expect(call.body).toMatchObject({ to: 'gunnar@example.test', text: 'Þú getur boðið þeim undir Stillingar > Meðeigendur.', submissionId: 'contact-1' });
  const stored = await getDoc('contact_submissions/contact-1');
  expect(stored!.status).toBe('replied');
  expect(stored!.replies).toHaveLength(1);

  // status flipped, history shows the reply, draft is cleared
  await expect(gunnar).toContainText('replied');
  await gunnar.getByRole('button', { name: 'Sjá Svar' }).click();
  await expect(dialog.getByText('Samskiptasaga')).toBeVisible();
  await expect(dialog.getByText('Þú getur boðið þeim undir Stillingar > Meðeigendur.')).toBeVisible();
  await expect(dialog.getByLabel('Svar')).toHaveValue('');
});

test('m: email templates: edit the subject and save', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop layout');
  await login(page, A, '/super-admin');
  await topTab(page, 'Samskipti').click();
  await subTab(page, 'Sniðmát').click();
  await page.getByRole('button', { name: 'Breyta', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Breyta sniðmáti: welcome' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Efnislína').fill('Nýtt efni: velkomin');
  await dialog.getByRole('button', { name: 'Vista breytingar' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Nýtt efni: velkomin')).toBeVisible();
  expect((await getDoc('email_templates/welcome'))!.subject).toBe('Nýtt efni: velkomin');
  await shot(page, 'm-superadmin-templates', testInfo);
});

test('m: feedback: featuring writes a sanitised public copy, unfeaturing removes it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop table');
  await login(page, A, '/super-admin');
  await topTab(page, 'Samskipti').click();
  await subTab(page, 'Umsagnir').click();
  const fb = page.getByRole('table', { name: 'Umsagnir notenda' });
  await fb.getByRole('button', { name: 'Birta umsögn á forsíðu' }).click();
  await expect(fb.getByRole('button', { name: 'Hætta að birta umsögn á forsíðu' })).toHaveAttribute('aria-pressed', 'true');

  await expect.poll(async () => !!(await getDoc('featured_feedback/feedback-1'))).toBe(true);
  const copy = (await getDoc('featured_feedback/feedback-1'))!;
  expect(Object.keys(copy).sort()).toEqual(['comment', 'createdAt', 'featuredAt', 'rating', 'userName']);
  expect(copy.userName).toBe('Sigríður'); // first name only
  expect(JSON.stringify(copy)).not.toContain('example.test');
  expect(JSON.stringify(copy)).not.toContain('secret-agent');
  expect((await getDoc('feedback/feedback-1'))!.featured).toBe(true);

  await fb.getByRole('button', { name: 'Hætta að birta umsögn á forsíðu' }).click();
  await expect.poll(async () => await getDoc('featured_feedback/feedback-1')).toBeNull();
  await shot(page, 'm-superadmin-feedback', testInfo);
});

test('m: providers: pending -> active; a deleted provider does not come back from the stats cache', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop table');
  await login(page, A, '/super-admin');
  await topTab(page, 'Gögn').click();
  await subTab(page, 'Verktakar').click();
  const providers = page.getByRole('table', { name: 'Skráðir verktakar' });
  const row = providers.getByRole('row').filter({ hasText: 'Snjómokstur Suðurlands' });
  await expect(row).toContainText('pending');
  await row.getByRole('button', { name: 'Samþykkja verktaka Snjómokstur Suðurlands' }).click();
  await expect(row).toContainText('active');
  expect((await getDoc('service_providers/prov-pending'))!.status).toBe('active');
  await expect(row.getByRole('button', { name: 'Setja verktaka Snjómokstur Suðurlands í bið' })).toBeVisible();

  await row.getByRole('button', { name: 'Eyða verktaka Snjómokstur Suðurlands' }).click();
  await expect(providers.getByText('Snjómokstur Suðurlands')).toHaveCount(0);
  expect(await getDoc('service_providers/prov-pending')).toBeNull();

  // Leave the page and come back inside the SPA (module state, i.e. the 5 minute stats cache, survives):
  // the deleted provider must not reappear.
  await page.getByTitle(`Fara í ${HOUSE_NAME}`).click();
  await page.waitForURL('**/dashboard');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Super Admin' })).toBeVisible();
  await topTab(page, 'Gögn').click();
  await subTab(page, 'Verktakar').click();
  await expect(page.getByRole('table', { name: 'Skráðir verktakar' }).getByText('Þrif og þjónusta')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Skráðir verktakar' }).getByText('Snjómokstur Suðurlands')).toHaveCount(0);
});

test('m: users: impersonate (God mode) opens the user\'s dashboard under the red banner', async ({ page, allowedPageErrors }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop table');
  // KNOWN, PRE-EXISTING, DEV-SERVER ONLY: with the Vite dev server (React StrictMode double-subscribes every
  // dashboard listener) the Firestore SDK asserts "pendingResponses < 0" a moment after the dashboard mounts as the
  // impersonated user. Reproduces on the pre-refactor commit a7d9a0b; the production build does not do it. After it
  // fires the dev page's Firestore client is unusable, so the test ends right after the dashboard is shown.
  allowedPageErrors.push(/INTERNAL ASSERTION FAILED: Unexpected state \(ID: ca9\)/);
  await login(page, A, '/super-admin');
  await topTab(page, 'Gögn').click();
  await subTab(page, 'Notendur').click();
  const users = page.getByRole('table', { name: 'Notendaskrá' });
  await users.getByRole('row').filter({ hasText: B.email }).getByRole('button', { name: 'Líkja eftir' }).click();
  await page.waitForURL('**/dashboard');
  const banner = page.getByRole('region', { name: 'Notendahermir' });
  await expect(banner).toContainText(B.email);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bjarni');
  await expect(banner.getByRole('button', { name: 'Hætta hermun' })).toBeVisible();
});

test('m: users: delete a user with the typed confirmation', async ({ page, mocks, promptAnswers, nativeDialogs }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop table');
  await login(page, A, '/super-admin');
  await topTab(page, 'Gögn').click();
  await subTab(page, 'Notendur').click();
  const users = page.getByRole('table', { name: 'Notendaskrá' });

  promptAnswers.push('delete'); // case matters: nothing happens
  await users.getByRole('button', { name: `Eyða notanda ${C.name}` }).click();
  await page.waitForTimeout(300);
  expect(mocks.calls.filter((c) => c.path === 'admin-delete-user')).toHaveLength(0);

  promptAnswers.push('DELETE');
  await users.getByRole('button', { name: `Eyða notanda ${C.name}` }).click();
  await expect.poll(() => mocks.calls.filter((c) => c.path === 'admin-delete-user').length).toBe(1);
  expect(mocks.calls.find((c) => c.path === 'admin-delete-user')!.body).toEqual({ uid: C.uid });
  await expect(users.getByText(C.email)).toHaveCount(0);
  await expect.poll(() => nativeDialogs.some((d) => d.startsWith('alert: ✅ Notanda eytt!'))).toBe(true);
});

test('m: system audit renders the mocked orphans and repairing one removes it', async ({ page, mocks }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop layout');
  mocks.audit = {
    orphans: [{ uid: 'orphan-1', email: 'munadarlaus@example.test', created: new Date().toISOString(), isTest: false }],
    stuckUsers: [{ uid: C.uid, email: C.email, name: C.name, created: new Date().toISOString() }],
    testUsers: [{ uid: 'test-1', email: 'test+1@example.test', name: 'Prufa', created: new Date().toISOString() }],
  };
  await login(page, A, '/super-admin');
  await topTab(page, 'Kerfi').click();
  await expect(page.getByRole('heading', { name: /Munaðarlausir notendur \(1\)/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Fastir notendur \(án húss\) \(1\)/ })).toBeVisible();
  const orphans = page.getByRole('table', { name: 'Munaðarlausir notendur' }).first();
  await expect(orphans.getByText('munadarlaus@example.test')).toBeVisible();
  await shot(page, 'm-superadmin-audit', testInfo);

  await orphans.getByRole('button', { name: 'Laga' }).click();
  await expect(page.getByText('munadarlaus@example.test')).toHaveCount(0);
  expect(mocks.calls.find((c) => c.path === 'admin-repair-user')!.body).toEqual({ uid: 'orphan-1' });
  await expect(page.getByRole('heading', { name: /Munaðarlausir notendur \(0\)/ })).toBeVisible();
});

test('m: a normal signed-in user gets "Aðgangur bannaður" and no admin API call is made @mobile', async ({ page, mocks }) => {
  await login(page, B, '/super-admin');
  await expect(page.getByRole('heading', { name: 'Aðgangur bannaður' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Super Admin' })).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(mocks.calls.filter((c) => /^(admin-|analytics|search-console)/.test(c.path))).toEqual([]);
});

