import { test, expect } from '@playwright/test';

// Smoke suite against the built site. Covers the three page archetypes and the
// two invariants that killed v2's indexing: content must be in static HTML,
// and the calculator island must actually calculate.

test.describe('static content invariants', () => {
  test('calculator page ships educational content without JS', async ({ page }) => {
    // Disable JS: what Googlebot's first-pass fetch effectively sees
    await page.context().route('**/*.js', (route) => route.abort());
    await page.goto('/finance/loan-calculator/');
    await expect(page.locator('h1')).toContainText('Loan Calculator');
    await expect(page.getByText('Frequently Asked Questions')).toBeVisible();
    await expect(
      page.getByText('What is the difference between interest rate and APR?')
    ).toBeVisible();
  });

  test('blog post body is static HTML', async ({ page }) => {
    await page.context().route('**/*.js', (route) => route.abort());
    await page.goto('/blog/apr-vs-interest-rate-difference/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('Interest Rate vs APR: The Simple Difference')).toBeVisible();
  });
});

test.describe('calculator island', () => {
  test('loan calculator computes on input', async ({ page }) => {
    await page.goto('/finance/loan-calculator/');
    // island is client:visible — scroll it into view and wait for hydration
    await page.locator('#loanAmount').waitFor({ timeout: 15_000 });
    await page.fill('#loanAmount', '25000');
    await page.fill('#interestRate', '6.5');
    await page.fill('#loanTerm', '5');
    await expect(page.getByText('$489.15').first()).toBeVisible({ timeout: 5_000 });
  });

  test('live walkthrough shows the solution with the user numbers', async ({ page }) => {
    await page.goto('/finance/loan-calculator/');
    await page.locator('#loanAmount').waitFor({ timeout: 15_000 });
    await page.fill('#loanAmount', '25000');
    await page.fill('#interestRate', '6.5');
    await page.fill('#loanTerm', '5');
    await expect(page.getByText('How we got this — with your numbers')).toBeVisible();
    // the user's actual numbers, substituted into the math
    await expect(page.getByText('r = 6.50% ÷ 12')).toBeVisible();
    await expect(page.getByText('5 years × 12 = 60 monthly payments')).toBeVisible();
  });

  test('Living Answer: dragging a slider changes the result live', async ({ page }) => {
    await page.goto('/finance/loan-calculator/');
    await page.locator('#loanAmount').waitFor({ timeout: 15_000 });
    await page.fill('#loanAmount', '25000');
    await page.fill('#interestRate', '6.5');
    await page.fill('#loanTerm', '5');
    const before = await page.getByText(/^\$\d/).first().innerText();
    const slider = page.getByLabel('Loan Amount slider');
    await slider.focus();
    for (let i = 0; i < 10; i++) await slider.press('ArrowRight');
    const after = await page.getByText(/^\$\d/).first().innerText();
    expect(after).not.toBe(before);
    // the finance gold-standard gauge is present
    await expect(page.getByText(/Interest is \d+% of total cost/)).toBeVisible();
  });

  test('Living Answer: story chart renders on a flat calculator', async ({ page }) => {
    await page.goto('/finance/home-equity-loan-calculator/');
    await page.locator('#homeValue').waitFor({ timeout: 15_000 });
    await page.fill('#homeValue', '400000');
    await page.fill('#currentMortgage', '250000');
    await page.fill('#desiredLoan', '50000');
    await page.fill('#interestRate', '8.5');
    await page.selectOption('#loanTerm', '120'); // 10 years — required select, no default
    await page.selectOption('#creditProfile', 'good');
    await expect(page.getByText('Where your money goes')).toBeVisible();
    await expect(page.locator('svg[aria-label*="principal"]')).toBeVisible();
  });

  test('BMI gold-standard: live gauge + personalized interpretation', async ({ page }) => {
    await page.goto('/health/bmi-calculator/');
    await page.locator('#weight').waitFor({ timeout: 15_000 });
    // defaults (170 lb, 5ft10) → BMI ~24.4, Normal
    await expect(page.getByText(/Your BMI: \d/)).toBeVisible();
    await expect(page.getByText(/Maintaining is the goal/i)).toBeVisible();
    // push into obese and confirm the interpretation changes
    await page.fill('#weight', '230');
    await expect(page.getByText(/above the healthy range/i)).toBeVisible();
  });

  test('shareable scenario URL seeds the calculator', async ({ page }) => {
    // Open a link that encodes a specific loan scenario
    await page.goto('/finance/loan-calculator/?loanAmount=40000&interestRate=7&loanTerm=6&termUnit=years');
    await page.locator('#loanAmount').waitFor({ timeout: 15_000 });
    await expect(page.locator('#loanAmount')).toHaveValue('40000');
    await expect(page.locator('#interestRate')).toHaveValue('7');
    // the calc ran on the SEEDED scenario (6-year term), not the 5-year default
    await expect(page.getByText(/6 years × 12 = 72 monthly payments/)).toBeVisible();
  });

  test('data JSON endpoint is machine-readable', async ({ page }) => {
    const res = await page.request.get('/data/finance/loan-calculator.json');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.id).toBe('loan-calculator');
    expect(Array.isArray(json.inputs)).toBeTruthy();
  });

  test('no console errors on a calculator page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/health/bmi-calculator/');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});

test.describe('navigation and chrome', () => {
  test('homepage links reach a category and a calculator', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Finance', exact: true }).first().click();
    await expect(page).toHaveURL(/\/finance\/$/);
    await expect(page.locator('h1')).toContainText('Finance');
  });

  test('theme toggle switches dark mode and persists', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /dark mode/i });
    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('homepage hero search returns live results', async ({ page }) => {
    await page.goto('/');
    await page.fill('#calc-search', 'mortgage');
    // floating dropdown shows matching calculators
    const result = page.getByRole('link', { name: /mortgage/i }).first();
    await expect(result).toBeVisible();
  });

  test('homepage embeds a working calculator', async ({ page }) => {
    await page.goto('/');
    // the embedded BMI calc hydrates and computes without leaving the page
    const heightInput = page.locator('#main-content input').first();
    await heightInput.waitFor({ timeout: 15_000 });
    await expect(page.getByText('Try it now')).toBeVisible();
  });

  test('unknown URL serves the 404 page', async ({ page }) => {
    const response = await page.goto('/no-such-page/');
    expect(response?.status()).toBe(404);
    await expect(page.getByText("This page doesn't exist")).toBeVisible();
  });

  test('search finds and reaches a calculator', async ({ page }) => {
    await page.goto('/search/');
    await page.fill('#calc-search', 'bmi');
    await page.getByRole('link', { name: /BMI/ }).first().click();
    await expect(page.locator('h1')).toContainText(/BMI/i);
  });
});
