import { test, expect } from '@playwright/test';

// The "Am I saving enough to retire?" decision tool, against the built site.
// Figures below come from an independent Python Decimal simulation (see test/calculators/decisions/retirement-decision.test.ts).
const URL = '/decisions/am-i-saving-enough-to-retire/';
const ready = (page: import('@playwright/test').Page) => page.locator('[data-decision-ready="true"]').waitFor({ timeout: 15_000 });

test.describe('decision tool: am I saving enough to retire', () => {
  test('ships the default verdict and numbers in the static HTML (no JavaScript)', async ({ page }) => {
    await page.context().route('**/*.js', (route) => route.abort());
    await page.goto(URL);
    await expect(page.locator('h1')).toContainText('Am I saving enough to retire?');
    // age 35 to 67, plan to 95, $60k saved, $800 a month: $806,212 projected against $995,535 needed = 81.0% funded
    await expect(page.getByText('Close, but short').first()).toBeVisible();
    await expect(page.getByText('$806,212').first()).toBeVisible();
    await expect(page.getByText('$995,535').first()).toBeVisible();
    await expect(page.getByText('81.0%').first()).toBeVisible();
    await expect(page.getByText('$252 a month').first()).toBeVisible();
    await expect(page.getByText('How long will the money last?')).toBeVisible();
    await expect(page.getByText('What is the 4% rule, and what are its limits?')).toBeVisible();
    await expect(page.getByText('Is my information sent anywhere, and is this financial advice?')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Decision tools' }).first()).toBeVisible();
  });

  test('the page says the starting numbers are examples, not predictions', async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByText(/examples, not predictions/).first()).toBeVisible();
    await expect(page.getByText(/today.s dollars/).first()).toBeVisible();
  });

  test('changing the monthly saving changes the verdict and every linked answer', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.fill('#rd-monthly', '1500');
    // $1,500 a month: $1,332,923 projected, 133.9% funded, no gap
    await expect(page.getByText('On track').first()).toBeVisible();
    await expect(page.getByText('$1,332,923').first()).toBeVisible();
    await expect(page.getByText('133.9%').first()).toBeVisible();
    await page.fill('#rd-monthly', '200');
    // $200 a month: $354,745 projected, 35.6% funded, needs $852 more a month, runs out around 75.3
    await expect(page.getByText('Not on track').first()).toBeVisible();
    await expect(page.getByText('$354,745').first()).toBeVisible();
    await expect(page.getByText('35.6%').first()).toBeVisible();
    await expect(page.getByText('$852 a month').first()).toBeVisible();
    await expect(page.getByText('about age 75.3').first()).toBeVisible();
  });

  test('a shared link seeds every input', async ({ page }) => {
    await page.goto(URL + '?age=41&retire=63&life=92&saved=250000&monthly=1234&ret=5.25&rret=3.75&infl=3&spend=82000&benefit=31500');
    await ready(page);
    await expect(page.locator('#rd-age')).toHaveValue('41');
    await expect(page.locator('#rd-retireAge')).toHaveValue('63');
    await expect(page.locator('#rd-lifeAge')).toHaveValue('92');
    await expect(page.locator('#rd-savings')).toHaveValue('250,000');
    await expect(page.locator('#rd-monthly')).toHaveValue('1,234');
    await expect(page.locator('#rd-returnPct')).toHaveValue('5.25');
    await expect(page.locator('#rd-retireReturnPct')).toHaveValue('3.75');
    await expect(page.locator('#rd-inflationPct')).toHaveValue('3');
    await expect(page.locator('#rd-spend')).toHaveValue('82,000');
    await expect(page.locator('#rd-benefit')).toHaveValue('31,500');
    // 61.99% funded: $818,887 projected against $1,321,094 needed
    await expect(page.getByText('Not on track').first()).toBeVisible();
    await expect(page.getByText('$818,887').first()).toBeVisible();
  });

  test('step cards deep-link into the existing calculators', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await expect(page.getByRole('link', { name: /Open the retirement calculator/ })).toHaveAttribute(
      'href',
      /^\/finance\/retirement-calculator\/\?.*currentAge=35.*desiredIncome=46000/,
    );
    await expect(page.getByRole('link', { name: /Estimate your Social Security benefit/ })).toHaveAttribute('href', /^\/finance\/social-security-calculator\/\?.*retirementAge=67/);
    await expect(page.getByRole('link', { name: /See what an employer match could add/ })).toHaveAttribute('href', /^\/finance\/401k-calculator\/\?.*currentBalance=60000/);
    await expect(page.getByRole('link', { name: /Check it in the annuity payout calculator/ })).toHaveAttribute('href', /^\/finance\/annuity-payout-calculator\/\?.*solveFor=duration/);
  });

  test('invalid input explains itself instead of showing numbers', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.fill('#rd-retireAge', '30'); // below the current age of 35
    await expect(page.getByRole('alert')).toContainText('Enter a number in every field');
    await page.fill('#rd-retireAge', '67');
    await page.fill('#rd-spend', '');
    await expect(page.getByRole('alert')).toContainText('Enter a number in every field');
  });

  test('saved scenarios compare side by side and survive a reload', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.getByRole('button', { name: 'Save scenario' }).click();
    await page.fill('#rd-monthly', '1500');
    await page.getByRole('button', { name: 'Save scenario' }).click();
    const table = page.getByRole('region', { name: 'Compared scenarios table' });
    await expect(table).toContainText('Scenario A');
    await expect(table).toContainText('Scenario B');
    await expect(table).toContainText('$800');
    await expect(table).toContainText('$1,500');
    await expect(table).toContainText('Close, but short');
    await expect(table).toContainText('On track');
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
