export interface GlossaryItem {
  term: string;
  definition: string;
  category: string;
}

const GLOSSARY: GlossaryItem[] = [
  // ── Finance ──
  { term: 'APR (Annual Percentage Rate)', definition: 'The total yearly cost of borrowing, including interest and fees, expressed as a percentage of the loan amount.', category: 'Finance' },
  { term: 'APY (Annual Percentage Yield)', definition: 'The effective annual rate of return accounting for compound interest. Higher than the nominal interest rate when compounding occurs more than once per year.', category: 'Finance' },
  { term: 'Amortization', definition: 'The process of spreading out a loan into a series of fixed payments over time. Each payment covers both interest and principal.', category: 'Finance' },
  { term: 'Compound Interest', definition: 'Interest calculated on both the initial principal and the accumulated interest from previous periods. Accelerates growth over time.', category: 'Finance' },
  { term: 'Equity', definition: 'The difference between the market value of an asset and the amount owed on it. For a home, equity = home value minus mortgage balance.', category: 'Finance' },
  { term: 'Principal', definition: 'The original sum of money borrowed or invested, excluding any interest or earnings.', category: 'Finance' },
  { term: 'Amortization Schedule', definition: 'A table showing each loan payment broken down into interest and principal portions, along with the remaining balance after each payment.', category: 'Finance' },
  { term: 'Return on Investment (ROI)', definition: 'A measure of profitability calculated as (gain − cost) ÷ cost, usually expressed as a percentage.', category: 'Finance' },
  { term: 'Net Worth', definition: 'Total assets minus total liabilities. A snapshot of financial health at a given point in time.', category: 'Finance' },
  { term: 'Inflation', definition: 'The rate at which the general level of prices rises, reducing purchasing power over time. Measured by indices like CPI.', category: 'Finance' },
  { term: 'Diversification', definition: 'Spreading investments across different asset types to reduce risk. A diversified portfolio balances high- and low-risk assets.', category: 'Finance' },
  { term: 'Liquidity', definition: 'How quickly an asset can be converted to cash without significant loss of value. Cash is the most liquid asset.', category: 'Finance' },
  { term: 'Depreciation', definition: 'The decrease in an asset\'s value over time due to wear, age, or obsolescence. Used in tax calculations and financial reporting.', category: 'Finance' },
  { term: 'Capital Gains', definition: 'Profit from selling an asset for more than its purchase price. Short-term and long-term capital gains are taxed at different rates.', category: 'Finance' },
  { term: 'Marginal Tax Rate', definition: 'The tax rate applied to the last dollar of income. In progressive tax systems, different portions of income are taxed at different rates.', category: 'Finance' },
  { term: '401(k)', definition: 'An employer-sponsored retirement account that allows tax-deferred contributions, often with employer matching.', category: 'Finance' },
  { term: 'IRA (Individual Retirement Account)', definition: 'A personal retirement account with tax advantages. Traditional IRAs offer tax-deferred growth; Roth IRAs offer tax-free withdrawals.', category: 'Finance' },
  { term: 'RMD (Required Minimum Distribution)', definition: 'The minimum amount you must withdraw annually from tax-deferred retirement accounts starting at age 73 (as of 2024).', category: 'Finance' },
  { term: 'Debt-to-Income Ratio (DTI)', definition: 'Monthly debt payments divided by gross monthly income. Lenders use DTI to assess borrowing risk.', category: 'Finance' },
  { term: 'Loan-to-Value Ratio (LTV)', definition: 'The loan amount divided by the appraised property value. Higher LTV typically means higher interest rates and requires PMI.', category: 'Finance' },
  { term: 'Refinancing', definition: 'Replacing an existing loan with a new one, typically to secure a lower interest rate, change loan terms, or access equity.', category: 'Finance' },
  { term: 'Future Value (FV)', definition: 'The value of an asset or investment at a specified date in the future, accounting for growth or interest.', category: 'Finance' },
  { term: 'Present Value (PV)', definition: 'The current worth of a future sum of money, discounted at a specific rate. The foundation of discounted cash flow analysis.', category: 'Finance' },
  { term: 'Time Value of Money (TVM)', definition: 'The principle that money available today is worth more than the same amount in the future due to its earning potential.', category: 'Finance' },
  { term: 'Cap Rate (Capitalization Rate)', definition: 'A real estate metric calculated as net operating income ÷ property value. Used to estimate potential return on investment property.', category: 'Finance' },
  { term: 'PMI (Private Mortgage Insurance)', definition: 'Insurance required by lenders when the down payment is less than 20% of the home price. Protects the lender, not the borrower.', category: 'Finance' },
  { term: 'Escrow', definition: 'A neutral third-party account that holds funds during a real estate transaction or for paying property taxes and insurance.', category: 'Finance' },
  { term: 'Roth vs. Traditional', definition: 'Roth accounts use after-tax dollars and allow tax-free withdrawals; traditional accounts use pre-tax dollars but withdrawals are taxed as income.', category: 'Finance' },

  // ── Health & Fitness ──
  { term: 'BMI (Body Mass Index)', definition: 'A weight-for-height index calculated as weight (kg) ÷ height² (m²). Used to screen for weight categories that may indicate health risks.', category: 'Health & Fitness' },
  { term: 'BMR (Basal Metabolic Rate)', definition: 'The number of calories your body needs at complete rest to maintain vital functions like breathing, circulation, and cell production.', category: 'Health & Fitness' },
  { term: 'TDEE (Total Daily Energy Expenditure)', definition: 'Total calories burned per day, including BMR plus physical activity and the thermic effect of food. Used for weight management.', category: 'Health & Fitness' },
  { term: 'Macronutrients (Macros)', definition: 'Nutrients required in large amounts: carbohydrates (4 cal/g), protein (4 cal/g), and fat (9 cal/g). The foundation of dietary planning.', category: 'Health & Fitness' },
  { term: 'Body Fat Percentage', definition: 'The proportion of fat mass to total body weight. Measured via calipers, bioelectrical impedance, DEXA scans, or circumference methods.', category: 'Health & Fitness' },
  { term: 'Lean Body Mass (LBM)', definition: 'Total body weight minus fat mass. Includes muscle, bone, organs, and water. Used to calculate protein needs and metabolic rate.', category: 'Health & Fitness' },
  { term: 'Heart Rate Zone', definition: 'A percentage range of your maximum heart rate used to target specific exercise intensities: fat burn, cardio, and peak zones.', category: 'Health & Fitness' },
  { term: 'One-Rep Max (1RM)', definition: 'The maximum weight you can lift for a single repetition of an exercise. Used to structure strength training programs.', category: 'Health & Fitness' },
  { term: 'eGFR (Estimated Glomerular Filtration Rate)', definition: 'A blood test-based estimate of kidney function. Lower values may indicate chronic kidney disease.', category: 'Health & Fitness' },
  { term: 'BAC (Blood Alcohol Content)', definition: 'The percentage of alcohol in your bloodstream. Used to measure intoxication levels and legal driving limits.', category: 'Health & Fitness' },
  { term: 'BSA (Body Surface Area)', definition: 'A measurement used in medical dosing, calculated from height and weight. Common formulas include Mosteller and Du Bois.', category: 'Health & Fitness' },
  { term: 'Due Date (EDD)', definition: 'The estimated date of delivery, typically calculated as 280 days (40 weeks) from the first day of the last menstrual period.', category: 'Health & Fitness' },

  // ── Mathematics ──
  { term: 'Mean (Average)', definition: 'The sum of all values divided by the count of values. The most common measure of central tendency.', category: 'Mathematics' },
  { term: 'Median', definition: 'The middle value when data is sorted in order. Less affected by outliers than the mean.', category: 'Mathematics' },
  { term: 'Standard Deviation', definition: 'A measure of how spread out numbers are from the mean. A low standard deviation means values cluster close to the mean.', category: 'Mathematics' },
  { term: 'Variance', definition: 'The average of squared differences from the mean. The square root of variance gives the standard deviation.', category: 'Mathematics' },
  { term: 'Z-Score', definition: 'The number of standard deviations a data point is from the mean. Used to compare values from different distributions.', category: 'Mathematics' },
  { term: 'P-Value', definition: 'The probability of obtaining results at least as extreme as observed, assuming the null hypothesis is true. Used in hypothesis testing.', category: 'Mathematics' },
  { term: 'Confidence Interval', definition: 'A range of values that likely contains the population parameter with a specified level of confidence (typically 95%).', category: 'Mathematics' },
  { term: 'Permutation', definition: 'An arrangement of items where order matters. nPk = n! ÷ (n−k)!.', category: 'Mathematics' },
  { term: 'Combination', definition: 'A selection of items where order does not matter. nCk = n! ÷ (k! × (n−k)!).', category: 'Mathematics' },
  { term: 'Pythagorean Theorem', definition: 'In a right triangle: a² + b² = c², where c is the hypotenuse. The foundation of distance calculations in geometry.', category: 'Mathematics' },
  { term: 'Exponent', definition: 'A number indicating how many times a base is multiplied by itself. For example, 2³ = 2 × 2 × 2 = 8.', category: 'Mathematics' },
  { term: 'Logarithm', definition: 'The inverse operation of exponentiation. log_b(x) answers "what exponent makes b equal x?"', category: 'Mathematics' },
  { term: 'Quadratic Equation', definition: 'An equation of form ax² + bx + c = 0. Solutions found via the quadratic formula: x = (−b ± √(b² − 4ac)) ÷ 2a.', category: 'Mathematics' },
  { term: 'Prime Factorization', definition: 'Breaking down a number into its prime factors. For example, 12 = 2 × 2 × 3. Every number has a unique prime factorization.', category: 'Mathematics' },
  { term: 'Greatest Common Factor (GCF)', definition: 'The largest number that divides evenly into two or more numbers. Also called the greatest common divisor (GCD).', category: 'Mathematics' },
  { term: 'Least Common Multiple (LCM)', definition: 'The smallest positive number that is a multiple of two or more numbers. Used when finding common denominators.', category: 'Mathematics' },
  { term: 'Scientific Notation', definition: 'A way of writing very large or very small numbers as a × 10ⁿ, where 1 ≤ a < 10. For example, 0.000001 = 1 × 10⁻⁶.', category: 'Mathematics' },
  { term: 'Half-Life', definition: 'The time required for a quantity to reduce to half its initial value. Used in radioactive decay, pharmacology, and exponential decay models.', category: 'Mathematics' },

  // ── Engineering ──
  { term: 'Ohm\'s Law', definition: 'The relationship between voltage (V), current (I), and resistance (R): V = I × R. The fundamental law of electrical circuits.', category: 'Engineering' },
  { term: 'Voltage Drop', definition: 'The reduction in voltage as electricity travels through a conductor. Excessive voltage drop causes inefficient operation and heat.', category: 'Engineering' },
  { term: 'Wire Gauge (AWG)', definition: 'The American Wire Gauge standard for measuring wire diameter. Lower gauge numbers mean thicker wires with less resistance.', category: 'Engineering' },
  { term: 'Gear Ratio', definition: 'The ratio of the number of teeth on two meshing gears. Determines torque multiplication and speed reduction in mechanical systems.', category: 'Engineering' },
  { term: 'Flow Rate', definition: 'The volume of fluid passing through a point per unit time. Measured in GPM (gallons per minute) or L/min.', category: 'Engineering' },
  { term: 'MTBF (Mean Time Between Failures)', definition: 'The average time a system operates between failures. Used in reliability engineering and maintenance planning.', category: 'Engineering' },
  { term: 'Rate Limiting', definition: 'Controlling the rate of traffic or requests to a system to prevent overload. Common in API design and network management.', category: 'Engineering' },
  { term: 'Resistor', definition: 'An electrical component that opposes current flow. Resistance is measured in ohms (Ω) and follows Ohm\'s Law.', category: 'Engineering' },

  // ── Everyday / DIY ──
  { term: 'Square Footage', definition: 'The area of a space measured in square feet. Calculated as length × width for rectangular rooms.', category: 'Everyday & DIY' },
  { term: 'Coverage Area', definition: 'The total area a material can cover — used for paint, tile, mulch, and other home improvement materials.', category: 'Everyday & DIY' },
  { term: 'Net Working Days', definition: 'Business days excluding weekends and holidays. Used for project timelines, shipping estimates, and contract terms.', category: 'Everyday & DIY' },

  // ── E-Commerce ──
  { term: 'ROAS (Return on Ad Spend)', definition: 'Revenue generated per dollar spent on advertising. ROAS = revenue ÷ ad spend. A key metric for marketing campaigns.', category: 'E-Commerce' },
  { term: 'CAC (Customer Acquisition Cost)', definition: 'Total cost of acquiring a new customer, including marketing and sales expenses. CAC = total acquisition costs ÷ new customers.', category: 'E-Commerce' },
  { term: 'LTV (Lifetime Value)', definition: 'The total revenue a business can expect from a single customer over their entire relationship. LTV > 3× CAC is considered healthy.', category: 'E-Commerce' },
  { term: 'COGS (Cost of Goods Sold)', definition: 'The direct cost of producing or purchasing goods sold, including materials and labor. Used to calculate gross profit.', category: 'E-Commerce' },
  { term: 'Break-Even Point', definition: 'The level of sales at which total revenue equals total costs. Below break-even = loss; above = profit.', category: 'E-Commerce' },
  { term: 'Profit Margin', definition: 'The percentage of revenue that becomes profit. Gross margin = (revenue − COGS) ÷ revenue. Net margin accounts for all expenses.', category: 'E-Commerce' },
];

export default GLOSSARY;

// ─── Alias map for case-insensitive matching ─────────────────────────────

/**
 * Builds a set of searchable aliases for a glossary term.
 * - Full term (e.g. "PMI (Private Mortgage Insurance)")
 * - Short form before parentheses (e.g. "PMI")
 * - Cleaned version with non-alphanumeric chars removed (e.g. "401k")
 */
function getTermAliases(term: string): string[] {
  const aliases = [term];
  const parenIdx = term.indexOf('(');
  if (parenIdx > 0) {
    const before = term.slice(0, parenIdx).trim();
    if (before && !/^\d+$/.test(before)) {
      aliases.push(before);
    }
  }
  const cleaned = term.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  if (cleaned && cleaned !== term && !aliases.includes(cleaned)) {
    aliases.push(cleaned);
  }
  return aliases;
}

const termAliasMap = new Map<string, GlossaryItem>();

for (const item of GLOSSARY) {
  for (const alias of getTermAliases(item.term)) {
    termAliasMap.set(alias.toLowerCase(), item);
  }
}

/**
 * Look up a glossary term by its exact key (case-insensitive).
 * Also matches short-form aliases (e.g. "PMI" resolves to "PMI (Private Mortgage Insurance)").
 */
export function getGlossaryTerm(term: string): GlossaryItem | undefined {
  return termAliasMap.get(term.toLowerCase());
}

/**
 * Finds all glossary terms that appear in a given text string.
 * Terms are sorted longest-first so callers can apply "longest match wins" logic.
 * Matching is case-insensitive and uses aliases for short-form support.
 */
export function findGlossaryTerms(text: string): GlossaryItem[] {
  const lowerText = text.toLowerCase();
  const found: GlossaryItem[] = [];
  const seen = new Set<string>();

  for (const [alias, item] of termAliasMap) {
    if (seen.has(item.term)) continue;
    if (lowerText.includes(alias)) {
      found.push(item);
      seen.add(item.term);
    }
  }

  return found.sort((a, b) => b.term.length - a.term.length);
}
