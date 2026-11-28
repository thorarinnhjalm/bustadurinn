import { test, expect, freshSeed, login, shot, A, B, H1, listDocs } from './support/fixtures';

test.beforeEach(async ({ page }) => {
  await freshSeed();
  await page.addInitScript(() => localStorage.setItem('has_seen_walkthrough', 'true'));
});

test('e: create a task for A, list/board, status select, "Mín verkefni", delete @mobile', async ({ page, mocks }, testInfo) => {
  await login(page, B, '/tasks');
  await expect(page.getByRole('heading', { name: 'Verkefni', exact: true })).toBeVisible();
  await expect(page.getByText('Mála pallinn')).toBeVisible();
  await expect(page.getByText('Laga hliðið')).toBeVisible();
  await shot(page, 'e-tasks-list', testInfo);

  // --- Create a task assigned to A
  await page.getByRole('button', { name: 'Nýtt verkefni' }).click();
  const form = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Nýtt verkefni' }) });
  await expect(form).toBeVisible();
  await form.getByLabel('Titill').fill('Þrífa skorsteininn');
  await form.getByLabel('Ábyrgðarmaður (valfrjálst)').selectOption({ label: 'Anna Umsjón' });
  await shot(page, 'e-task-form', testInfo);
  await form.getByRole('button', { name: 'Búa til verkefni' }).click();
  await expect(page.getByText('Þrífa skorsteininn')).toBeVisible();
  await expect.poll(async () => (await listDocs(`houses/${H1}/tasks`)).some((t) => t.title === 'Þrífa skorsteininn')).toBe(true);
  const created = (await listDocs(`houses/${H1}/tasks`)).find((t) => t.title === 'Þrífa skorsteininn');
  expect(created!.assigned_to).toEqual([A.uid]);
  expect(created!.created_by).toBe(B.uid);
  expect(mocks.calls.some((c) => c.path === 'house-notification' && c.body?.assigneeUids?.includes(A.uid))).toBe(true);

  // --- Board view + the status select
  await page.getByRole('button', { name: 'Töfluyfirlit' }).click();
  await expect(page.getByRole('button', { name: 'Töfluyfirlit' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Í vinnslu' })).toBeVisible();
  await shot(page, 'e-tasks-board', testInfo);
  const status = page.getByLabel('Staða verkefnis: Laga hliðið');
  await expect(status).toHaveValue('pending');
  await status.selectOption('in_progress');
  await expect(status).toHaveValue('in_progress');
  await expect.poll(async () => (await listDocs(`houses/${H1}/tasks`)).find((t) => t.id === 'task-2')?.status).toBe('in_progress');

  // --- Back to the list; "Mín verkefni" shows only B's tasks
  await page.getByRole('button', { name: 'Listayfirlit' }).click();
  await expect(page.getByRole('button', { name: 'Listayfirlit' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Mín verkefni' }).click();
  await expect(page.getByRole('button', { name: 'Mín verkefni' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Laga hliðið')).toBeVisible();
  await expect(page.getByText('Mála pallinn')).toHaveCount(0);
  await expect(page.getByText('Þrífa skorsteininn')).toHaveCount(0);
  await shot(page, 'e-tasks-mine', testInfo);

  // --- Delete (native confirm auto-accepted)
  await page.getByRole('button', { name: 'Eyða verkefni: Laga hliðið' }).click();
  await expect(page.getByText('Laga hliðið')).toHaveCount(0);
  await expect.poll(async () => (await listDocs(`houses/${H1}/tasks`)).some((t) => t.id === 'task-2')).toBe(false);
  await page.getByRole('button', { name: 'Öll verkefni' }).click();
  await expect(page.getByText('Mála pallinn')).toBeVisible();
});
