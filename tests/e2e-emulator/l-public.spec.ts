import { test, expect, shot } from './support/fixtures';

test('public: every FAQ answer opens to its full height (no clipping) @mobile', async ({ page }, testInfo) => {
  await page.goto('/spurt-og-svarad');
  const questions = page.locator('button[aria-controls^="faq-a-"]');
  await questions.first().waitFor();
  const count = await questions.count();
  expect(count).toBeGreaterThan(3);
  let tallest = { i: 0, h: 0 };
  for (let i = 0; i < count; i++) {
    if ((await questions.nth(i).getAttribute('aria-expanded')) !== 'true') await questions.nth(i).click(); // the first one starts open
    const panel = page.locator(`#faq-a-${i}`);
    await expect(questions.nth(i)).toHaveAttribute('aria-expanded', 'true');
    await page.waitForTimeout(450); // 300ms transition
    const { client, scroll } = await panel.evaluate((el) => {
      const inner = el.firstElementChild as HTMLElement;
      return { client: el.getBoundingClientRect().height, scroll: inner.scrollHeight };
    });
    expect(Math.round(client), `answer ${i} is fully visible`).toBeGreaterThanOrEqual(scroll - 1);
    if (client > tallest.h) tallest = { i, h: client };
  }
  await questions.nth(tallest.i).scrollIntoViewIfNeeded();
  await shot(page, 'l-faq-longest-open', testInfo);
});

test('public: sandbox banner no longer advertises a trial @mobile', async ({ page }, testInfo) => {
  await page.goto('/prufa');
  await expect(page.getByRole('heading', { name: 'Prófaðu kerfið — ókeypis og án skuldbindinga' })).toBeVisible();
  await expect(page.getByText('30 daga')).toHaveCount(0);
  await shot(page, 'l-sandbox-banner', testInfo);
});

test('public: links in the dark footer hover to bright amber, not the dark amber-ink @mobile', async ({ page }) => {
  await page.goto('/eiginleikar');
  const footer = page.locator('footer.bg-charcoal');
  await footer.scrollIntoViewIfNeeded();
  // a footer link that has no explicit hover colour of its own
  const links = footer.locator('a');
  const n = await links.count();
  let checked = 0;
  for (let i = 0; i < n && checked < 3; i++) {
    const link = links.nth(i);
    if (!(await link.isVisible())) continue;
    const hasOwnHover = await link.evaluate((el) => /(^|\s)hover:text-/.test(el.className));
    if (hasOwnHover) continue;
    await link.hover();
    await page.waitForTimeout(300);
    const color = await link.evaluate((el) => getComputedStyle(el).color);
    expect(color, 'hover colour on charcoal').toBe('rgb(232, 176, 88)');
    checked++;
  }
  expect(checked, 'at least one footer link without its own hover colour was checked').toBeGreaterThan(0);
});
