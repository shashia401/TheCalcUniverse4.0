import { test, expect } from '@playwright/test';

// The "Can I afford this house?" decision tool, against the built site.
const URL = '/decisions/can-i-afford-a-house/';
const ready = (page: import('@playwright/test').Page) => page.locator('[data-hd-ready="true"]').waitFor({ timeout: 15_000 });

test.describe('decision tool: can I afford this house', () => {
  test('ships the default verdict and numbers in the static HTML (no JavaScript)', async ({ page }) => {
    await page.context().route('**/*.js', (route) => route.abort());
    await page.goto(URL);
    await expect(page.locator('h1')).toContainText('Can I afford this house?');
    // $400k at 20% down on $100k income: over the $368k the 28/36 limits allow
    await expect(page.getByText('Over budget').first()).toBeVisible();
    await expect(page.getByText('$2,567').first()).toBeVisible(); // monthly housing payment
    await expect(page.getByText('Is buying better than renting?')).toBeVisible();
    await expect(page.getByText('Is my information sent anywhere?')).toBeVisible();
  });

  test('changing the price changes the verdict and every linked answer', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.fill('#hd-price', '250000');
    await expect(page.getByText('Within your budget').first()).toBeVisible();
    // 250k at 20% down, 6.75%, 30y: P&I 1,297 + tax 229 + insurance 125
    await expect(page.getByText('$1,651').first()).toBeVisible();
    await page.fill('#hd-savings', '20000');
    await expect(page.getByText('Possible, but tight').first()).toBeVisible();
    await expect(page.getByText(/short/).first()).toBeVisible();
  });

  test('a shared link seeds every input', async ({ page }) => {
    await page.goto(URL + '?income=150000&price=500000&down=25&rate=6');
    await ready(page);
    await expect(page.locator('#hd-income')).toHaveValue('150,000');
    await expect(page.locator('#hd-price')).toHaveValue('500,000');
    await expect(page.locator('#hd-downPct')).toHaveValue('25');
    await expect(page.locator('#hd-rate')).toHaveValue('6');
  });

  test('invalid input explains itself instead of showing numbers', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.fill('#hd-price', '');
    await expect(page.getByRole('alert')).toContainText('Enter a number in every field');
  });

  test('saved scenarios compare side by side and survive a reload', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.getByRole('button', { name: 'Save scenario' }).click();
    await page.fill('#hd-price', '300000');
    await page.getByRole('button', { name: 'Save scenario' }).click();
    const table = page.getByRole('region', { name: 'Compared scenarios table' });
    await expect(table).toContainText('Scenario A');
    await expect(table).toContainText('Scenario B');
    await expect(table).toContainText('$400,000');
    await expect(table).toContainText('$300,000');
    await page.goto(URL);
    await ready(page);
    await expect(page.getByRole('region', { name: 'Compared scenarios table' })).toContainText('Scenario B');
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(URL);
    await ready(page);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});
