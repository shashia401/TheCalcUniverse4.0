import { test, expect } from '@playwright/test';

// One live-walkthrough assertion per high-traffic calculator. Mirrors the
// "live walkthrough shows the solution with the user numbers" test in
// smoke.spec.ts: fill the island, then confirm explainSteps rendered the
// solution with the user's actual numbers substituted into the math.

test.describe('live walkthrough — explainSteps', () => {
  test('bmi calculator substitutes the height conversion', async ({ page }) => {
    await page.goto('/health/bmi-calculator/');
    await page.locator('#weight').waitFor({ timeout: 15_000 });
    await page.selectOption('#unit', 'imperial');
    await page.fill('#weight', '170');
    await page.fill('#heightFt', '5');
    await page.fill('#heightIn', '10');
    await expect(page.getByText('How we got this — with your numbers')).toBeVisible();
    await expect(page.getByText('5 ft 10 in = 70 in × 0.0254 = 1.778 m')).toBeVisible();
  });

  test('tdee calculator substitutes the metric conversion', async ({ page }) => {
    await page.goto('/health/tdee-calculator/');
    await page.locator('#age').waitFor({ timeout: 15_000 });
    await page.selectOption('#unit', 'imperial');
    await page.selectOption('#sex', 'male');
    await page.selectOption('#activityLevel', '1.55');
    await page.fill('#age', '30');
    await page.fill('#weight', '170');
    await page.fill('#heightFt', '5');
    await page.fill('#heightIn', '10');
    await expect(page.getByText('How we got this — with your numbers')).toBeVisible();
    await expect(
      page.getByText('170 lb × 0.453592 = 77.1 kg · height = 177.8 cm')
    ).toBeVisible();
  });

  test('calorie calculator substitutes the Mifflin-St Jeor BMR', async ({ page }) => {
    await page.goto('/health/calorie-calculator/');
    await page.locator('#age').waitFor({ timeout: 15_000 });
    await page.selectOption('#unit', 'metric');
    await page.selectOption('#gender', 'male');
    await page.selectOption('#activityLevel', '1.55');
    await page.fill('#age', '30');
    await page.fill('#weight', '70');
    await page.fill('#heightCm', '175');
    await expect(page.getByText('How we got this — with your numbers')).toBeVisible();
    await expect(
      page.getByText('10×70.0 + 6.25×175.0 − 5×30 + 5 = 1,649 kcal/day')
    ).toBeVisible();
  });

  test('compound interest substitutes the periodic rate', async ({ page }) => {
    await page.goto('/finance/compound-interest-calculator/');
    await page.locator('#principal').waitFor({ timeout: 15_000 });
    await page.fill('#principal', '10000');
    await page.fill('#rate', '7');
    await page.fill('#years', '10');
    await page.selectOption('#compoundFrequency', '12');
    await expect(page.getByText('How we got this — with your numbers')).toBeVisible();
    await expect(
      page.getByText('7.00% ÷ 12 = 0.5833% per period · 12 × 10 = 120 periods')
    ).toBeVisible();
  });

  test('mortgage amortization substitutes the loan amount', async ({ page }) => {
    await page.goto('/finance/mortgage-amortization-calculator/');
    await page.locator('#homePrice').waitFor({ timeout: 15_000 });
    await page.fill('#homePrice', '400000');
    await page.fill('#downPayment', '80000');
    await page.selectOption('#loanTerm', '30');
    await page.fill('#interestRate', '6.8');
    await expect(page.getByText('How we got this — with your numbers')).toBeVisible();
    await expect(
      page.getByText('$400,000.00 − $80,000.00 = $320,000.00')
    ).toBeVisible();
  });

  test('amortization calculator substitutes the payment count', async ({ page }) => {
    await page.goto('/finance/amortization-calculator/');
    await page.locator('#loanAmount').waitFor({ timeout: 15_000 });
    await page.fill('#loanAmount', '250000');
    await page.fill('#interestRate', '6.5');
    await page.selectOption('#termUnit', 'years');
    await page.fill('#loanTerm', '30');
    await expect(page.getByText('How we got this — with your numbers')).toBeVisible();
    await expect(
      page.getByText('n = 30 years × 12 = 360 monthly payments')
    ).toBeVisible();
  });

  test('personal loan substitutes the monthly rate', async ({ page }) => {
    await page.goto('/finance/personal-loan-calculator/');
    await page.locator('#loanAmount').waitFor({ timeout: 15_000 });
    await page.fill('#loanAmount', '20000');
    await page.selectOption('#loanTerm', '60');
    await page.fill('#interestRate', '11.5');
    await page.selectOption('#originationFeeType', 'none');
    await expect(page.getByText('How we got this — with your numbers')).toBeVisible();
    await expect(page.getByText('r = 11.5% ÷ 12 = 0.9583%')).toBeVisible();
  });

  test('percentage calculator substitutes the percent-of steps', async ({ page }) => {
    await page.goto('/everyday/percentage-calculator/');
    await page.locator('#x').waitFor({ timeout: 15_000 });
    await page.selectOption('#mode', 'of');
    await page.fill('#x', '15');
    await page.fill('#y', '200');
    await expect(page.getByText('How we got this — with your numbers')).toBeVisible();
    await expect(page.getByText('15% = 15 ÷ 100 = 0.15')).toBeVisible();
  });

  test('age calculator substitutes the exact age', async ({ page }) => {
    await page.goto('/everyday/age-calculator/');
    await page.locator('#birthDate').waitFor({ timeout: 15_000 });
    await page.fill('#birthDate', '1990-03-15');
    await page.fill('#toDate', '2020-03-15');
    // Scope to the walkthrough — the same exact age also renders in the result card.
    const walkthrough = page.locator('div:has(> h2:text("How we got this"))');
    await expect(walkthrough).toBeVisible();
    await expect(walkthrough.getByText('30 years, 0 months, 0 days')).toBeVisible();
  });

  test('fraction calculator substitutes the LCM', async ({ page }) => {
    await page.goto('/math/fraction-calculator/');
    await page.locator('#aNum').waitFor({ timeout: 15_000 });
    await page.selectOption('#mode', 'add');
    await page.fill('#aNum', '3');
    await page.fill('#aDen', '4');
    await page.fill('#bNum', '1');
    await page.fill('#bDen', '3');
    // Scope to the walkthrough — the extra panel also shows the LCM work.
    const walkthrough = page.locator('div:has(> h2:text("How we got this"))');
    await expect(walkthrough).toBeVisible();
    await expect(walkthrough.getByText('LCM(4, 3) = 12')).toBeVisible();
  });
});
