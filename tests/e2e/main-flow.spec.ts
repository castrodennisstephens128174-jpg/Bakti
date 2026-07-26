import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { Keypair } from '@stellar/stellar-sdk';

const SEED_PUBLIC =
  process.env.DEMO_SENDER_PUBLIC ?? 'GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47';

async function testLogin(page: Page, publicKey: string) {
  const res = await page.request.post('/api/auth/test-login', { data: { publicKey } });
  expect(res.ok()).toBeTruthy();
}

async function ensureOneAllowance(page: Page) {
  const list = await (await page.request.get('/api/allowances')).json();
  if (list.ok && list.data.length > 0) return;
  await page.request.post('/api/allowances', {
    data: {
      recipientName: 'Seed Parent',
      recipientAddress: Keypair.random().publicKey(),
      corridor: 'Malaysia → Philippines · research corridor',
      asset: 'XLM',
      monthlyAmount: '4',
      dayOfMonth: 5,
    },
  });
}

test.describe('landing', () => {
  test('heading and CTA are visible above the fold', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const cta = page.getByTestId('cta-button');
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box).not.toBeNull();
    if (!box) throw new Error('CTA has no bounding box');
    expect(box.y).toBeLessThan(720);
  });

  test('has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('mobile 375px', () => {
  test('no horizontal scroll and CTA reachable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 780 });
    await page.goto('/');
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientW = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollW).toBeLessThanOrEqual(clientW + 1);
    const cta = page.getByTestId('cta-button');
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    if (!box) throw new Error('CTA has no bounding box');
    expect(box.y).toBeLessThan(780);
  });
});

test.describe('dashboard', () => {
  test('fresh wallet sees a helpful empty state', async ({ page }) => {
    await testLogin(page, Keypair.random().publicKey());
    await page.goto('/dashboard');
    const empty = page.getByTestId('empty-state');
    await expect(empty).toBeVisible();
    const text = (await empty.innerText()).trim();
    expect(text.length).toBeGreaterThan(20);
  });

  test('seeded wallet shows a stat card and create flow adds a row', async ({ page }) => {
    await testLogin(page, SEED_PUBLIC);
    await ensureOneAllowance(page);
    await page.goto('/dashboard');

    const statCard = page.getByTestId('stat-active');
    await expect(statCard).toBeVisible();
    await expect(page.getByTestId('allowance-list')).toBeVisible();

    const rowsBefore = await page.getByTestId('allowance-row').count();
    const uniqueName = `Nenek Wati ${Date.now()}`;

    await page.getByTestId('new-allowance-button').click();
    await expect(page.getByTestId('create-allowance-form')).toBeVisible();
    await page.getByTestId('recipient-name').fill(uniqueName);
    await page.getByTestId('recipient-address').fill(Keypair.random().publicKey());
    await page.getByTestId('asset-XLM').click();
    await page.getByTestId('monthly-amount').fill('5');
    await page.getByTestId('day-of-month').fill('7');
    await page.getByTestId('submit-allowance').click();

    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 15_000 });
    const rowsAfter = await page.getByTestId('allowance-row').count();
    expect(rowsAfter).toBe(rowsBefore + 1);
  });

  test('has at most two accessibility violations', async ({ page }) => {
    await testLogin(page, SEED_PUBLIC);
    await page.goto('/dashboard');
    await expect(page.getByTestId('allowance-list')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations.length).toBeLessThanOrEqual(2);
  });
});
