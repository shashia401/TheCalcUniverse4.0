import { test, expect } from '@playwright/test';

// The "Should I refinance?" decision tool, against the built site.
const URL = '/decisions/should-i-refinance/';
const ready = (page: import('@playwright/test').Page) => page.locator('[data-decision-ready="true"]').waitFor({ timeout: 15_000 });

test.describe('decision tool: should I refinance', () => {
  test('ships the default verdict and numbers in the static HTML (no JavaScript)', async ({ page }) => {
    await page.context().route('**/*.js', (route) => route.abort());
    await page.goto(URL);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Should I refinance');
    // $250k, 7.5% / 25y -> 6% / 25y, $6,000 costs, 7-year stay: comfortably worth it
    await expect(page.getByText('Worth refinancing').first()).toBeVisible();
    await expect(page.getByText('$1,611').first()).toBeVisible(); // new monthly payment
    await expect(page.getByText('When do you break even?')).toBeVisible();
    await expect(page.getByText('Why can a lower payment still cost me more?')).toBeVisible();
    await expect(page.getByText('What is a “no-cost” refinance, and is it really free?')).toBeVisible();
  });

  test('changing the new rate changes the verdict and every linked answer', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.fill('#rf-newRate', '7.5'); // same rate, same term: the closing costs buy nothing
    await expect(page.getByText('Not worth it at these numbers').first()).toBeVisible();
    await page.fill('#rf-newRate', '6');
    await expect(page.getByText('Worth refinancing').first()).toBeVisible();
  });

  test('resetting the term to 30 years flags the extra lifetime interest', async ({ page }) => {
    await page.goto(URL + '?bal=200000&rate=7&left=20&nrate=6.5&nterm=30&cost=0&cash=0&stay=2');
    await ready(page);
    await expect(page.getByText('Worth a closer look').first()).toBeVisible();
    await expect(page.getByText('$82,945').first()).toBeVisible(); // extra interest to payoff
    await page.fill('#rf-stay', '10');
    await page.fill('#rf-closingCosts', '3000');
    await expect(page.getByText('Not worth it at these numbers').first()).toBeVisible();
  });

  test('a shared link seeds every input', async ({ page }) => {
    await page.goto(URL + '?bal=300000&rate=7&left=22.5&nrate=5.5&nterm=20&cost=4500&cash=10000&stay=6');
    await ready(page);
    await expect(page.locator('#rf-balance')).toHaveValue('300,000');
    await expect(page.locator('#rf-currentRate')).toHaveValue('7');
    await expect(page.locator('#rf-yearsLeft')).toHaveValue('22.5');
    await expect(page.locator('#rf-newRate')).toHaveValue('5.5');
    await expect(page.locator('#rf-newYears')).toHaveValue('20');
    await expect(page.locator('#rf-closingCosts')).toHaveValue('4,500');
    await expect(page.locator('#rf-cashOut')).toHaveValue('10,000');
    await expect(page.locator('#rf-stay')).toHaveValue('6');
  });

  test('step links carry the numbers into the refinance calculator', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    const href = await page.getByRole('link', { name: 'Open the full refinance calculator' }).first().getAttribute('href');
    expect(href).toContain('/finance/refinance-calculator/?');
    expect(href).toContain('currentBalance=250000');
    expect(href).toContain('currentTerm=300');
    expect(href).toContain('plannedStay=84');
  });

  test('invalid input explains itself instead of showing numbers', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.fill('#rf-balance', '');
    await expect(page.getByRole('alert')).toContainText('Enter a number in every field');
  });

  test('saved scenarios compare side by side and survive a reload', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.getByRole('button', { name: 'Save scenario' }).click();
    await page.fill('#rf-newRate', '6.5');
    await page.getByRole('button', { name: 'Save scenario' }).click();
    const table = page.getByRole('region', { name: 'Compared scenarios table' });
    await expect(table).toContainText('Scenario A');
    await expect(table).toContainText('Scenario B');
    await expect(table).toContainText('7.5% to 6%');
    await expect(table).toContainText('7.5% to 6.5%');
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
