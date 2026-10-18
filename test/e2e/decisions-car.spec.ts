import { test, expect } from '@playwright/test';

// The "Can I afford this car?" decision tool, against the built site.
// Figures below come from an independent Python Decimal calculation (see test/calculators/decisions/car-decision.test.ts).
const URL = '/decisions/can-i-afford-a-car/';
const ready = (page: import('@playwright/test').Page) => page.locator('[data-decision-ready="true"]').waitFor({ timeout: 15_000 });

test.describe('decision tool: can I afford this car', () => {
  test('ships the default verdict and numbers in the static HTML (no JavaScript)', async ({ page }) => {
    await page.context().route('**/*.js', (route) => route.abort());
    await page.goto(URL);
    await expect(page.locator('h1')).toContainText('Can I afford this car?');
    // $32k car, 20% down, 7%, 60 months on $75k: payment $507, all-in $857, tight on the 4-year and 10% tests
    await expect(page.getByText('Possible, but tight').first()).toBeVisible();
    await expect(page.getByText('$857').first()).toBeVisible();
    await expect(page.getByText('$507').first()).toBeVisible();
    await expect(page.getByText('Does it pass the 20/4/10 check?')).toBeVisible();
    await expect(page.getByText('Is my information sent anywhere, and is this financial advice?')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Decision tools' }).first()).toBeVisible();
  });

  test('changing the price changes the verdict and every linked answer', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.fill('#cd-price', '60000');
    // $60k: needs $16,800 at signing against $15,000 saved, and 20.8% of income
    await expect(page.getByText('Over budget').first()).toBeVisible();
    await expect(page.getByText(/\$1,800 short/).first()).toBeVisible();
    await expect(page.getByText('$950').first()).toBeVisible(); // loan payment
    await page.fill('#cd-price', '14000');
    await page.fill('#cd-months', '48');
    // $14k on 48 months: payment $268, all-in $618, 9.9% of income, every test passes
    await expect(page.getByText('Within your budget').first()).toBeVisible();
    await expect(page.getByText('$618').first()).toBeVisible();
  });

  test('a shared link seeds every input', async ({ page }) => {
    await page.goto(URL + '?income=90000&price=28000&down=25&rate=6&term=48&trade=3000');
    await ready(page);
    await expect(page.locator('#cd-income')).toHaveValue('90,000');
    await expect(page.locator('#cd-price')).toHaveValue('28,000');
    await expect(page.locator('#cd-tradeIn')).toHaveValue('3,000');
    await expect(page.locator('#cd-downPct')).toHaveValue('25');
    await expect(page.locator('#cd-rate')).toHaveValue('6');
    await expect(page.locator('#cd-months')).toHaveValue('48');
  });

  test('step cards deep-link into the existing calculators', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    const loan = page.getByRole('link', { name: /Open the auto loan calculator/ });
    await expect(loan).toHaveAttribute('href', /^\/automotive\/auto-loan-calculator\/\?.*vehiclePrice=32000/);
    await expect(page.getByRole('link', { name: /Open the debt-to-income calculator/ })).toHaveAttribute('href', /^\/finance\/dti-ratio-calculator\//);
  });

  test('invalid input explains itself instead of showing numbers', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.fill('#cd-price', '');
    await expect(page.getByRole('alert')).toContainText('Enter a number in every field');
  });

  test('saved scenarios compare side by side and survive a reload', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.getByRole('button', { name: 'Save scenario' }).click();
    await page.fill('#cd-price', '20000');
    await page.getByRole('button', { name: 'Save scenario' }).click();
    const table = page.getByRole('region', { name: 'Compared scenarios table' });
    await expect(table).toContainText('Scenario A');
    await expect(table).toContainText('Scenario B');
    await expect(table).toContainText('$32,000');
    await expect(table).toContainText('$20,000');
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
