import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import MileagePanel from './MileagePanel';
import Decimal from 'decimal.js';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { hasAnswer, resultValue } from '../../../utils/explainResults';

/** Exact dollars (half-up to the cent); whole-dollar amounts print without ".00". */
function fmtCurrency(n: Decimal): string {
  const d = n.abs().toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return `$${d.isInteger() ? d.toFixed(0) : d.toFixed(2)}`;
}

/** IRS rates go to a tenth of a cent (72.5, 23.5 cents): "$0.725", "$0.76". */
const fmtRate = (r: Decimal): string => `$${r.toFixed(3).replace(/0$/, '')}`;

// Rates in dollars per mile. 2026 changed mid-year, so it has two periods (the miles driven on each side of
// July 1 use different rates). Source: irs.gov/tax-professionals/standard-mileage-rates -
// 2026 Jan 1-Jun 30: IR-2025-128; 2026 Jul 1-Dec 31: IR-2026-29; 2025: IR-2024-312.
// The "2026" value keeps meaning "current rates" so saved links still work.
const RATES: Record<string, Record<string, string>> = {
  '2026': { business: '0.76', medical: '0.235', charitable: '0.14' },
  '2026h1': { business: '0.725', medical: '0.205', charitable: '0.14' },
  '2025': { business: '0.70', medical: '0.21', charitable: '0.14' },
};

const RATE_LABELS: Record<string, string> = {
  business: 'Business',
  medical: 'Medical / Moving',
  charitable: 'Charitable',
};

const PERIOD_LABELS: Record<string, string> = {
  '2026': '2026 (Jul 1 - Dec 31)',
  '2026h1': '2026 (Jan 1 - Jun 30)',
  '2025': '2025',
};

const IRS_CITATIONS: Record<string, string> = {
  '2026': 'IRS IR-2026-29 (standard mileage rates from July 1, 2026)',
  '2026h1': 'IRS IR-2025-128 (standard mileage rates for 2026, Jan 1 - Jun 30)',
  '2025': 'IRS IR-2024-312 (standard mileage rates for 2025)',
};

const mileageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'miles',
      label: 'Total Miles',
      type: 'number',
      min: 0,
      step: 0.1,
      placeholder: 'e.g., 5000',
    },
    {
      id: 'mileageType',
      label: 'Mileage Type',
      type: 'select',
      options: [
        { label: 'Business', value: 'business' },
        { label: 'Medical / Moving', value: 'medical' },
        { label: 'Charitable', value: 'charitable' },
      ],
    },
    {
      id: 'year',
      label: 'Tax Year / Period',
      type: 'select',
      options: [
        { label: '2026 - Jul 1 to Dec 31', value: '2026' },
        { label: '2026 - Jan 1 to Jun 30', value: '2026h1' },
        { label: '2025', value: '2025' },
      ],
      helpText: 'The 2026 rates changed on July 1: use the period the miles were driven in',
    },
    {
      id: 'additionalExpenses',
      label: 'Additional Expenses (tolls, parking)',
      type: 'number',
      min: 0,
      step: 0.01,
      placeholder: 'e.g., 50.00',
      helpText: 'Optional: add tolls, parking fees, etc.',
    },
  ],
  calculate: (values) => {
    const milesNum = parseNumberStrict(values.miles);
    const mileageType = values.mileageType || 'business';
    const year = values.year || '2026';

    if (isNaN(milesNum) || milesNum < 0 || milesNum > 1e9) return [];
    const rateStr = RATES[year]?.[mileageType];
    if (!rateStr) return [];

    // Blank expenses = none; anything typed must be a valid non-negative amount.
    const extraRaw = (values.additionalExpenses ?? '').trim();
    const extraNum = extraRaw === '' ? 0 : parseNumberStrict(extraRaw);
    if (isNaN(extraNum) || extraNum < 0 || extraNum > 1e9) return [];

    const rate = new Decimal(rateStr);
    const mileageAmount = new Decimal(milesNum).times(rate);
    const additionalExpenses = new Decimal(extraNum);
    const hasAdditional = additionalExpenses.gt(0);

    const reimbursement = mileageAmount.plus(additionalExpenses);

    const results: Array<{
      id: string;
      label: string;
      value: string;
      highlight?: boolean;
      color?: 'positive' | 'negative' | 'neutral';
    }> = [
      {
        id: 'reimbursement',
        label: 'Total Reimbursement',
        value: fmtCurrency(reimbursement),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'mileageAmount',
        label: 'Mileage Amount',
        value: fmtCurrency(mileageAmount),
      },
      {
        id: 'rateUsed',
        label: 'Rate Used',
        value: fmtRate(rate) + '/mi',
      },
      { id: 'year', label: 'Tax Year / Period', value: PERIOD_LABELS[year] ?? year },
    ];

    if (hasAdditional) {
      results.push({
        id: 'additionalAmount',
        label: 'Additional Expenses',
        value: fmtCurrency(additionalExpenses),
      });
    }

    results.push({
      id: 'irsNote',
      label: 'IRS Reference',
      value: `${IRS_CITATIONS[year]} - ${RATE_LABELS[mileageType]} rate: ${fmtRate(rate)}/mile`,
    });

    // Tax savings for business use (self-employed)
    if (mileageType === 'business') {
      const taxSavings = reimbursement.times('0.30');
      results.push({
        id: 'taxSavings',
        label: 'Estimated Tax Savings',
        value: `~${fmtCurrency(taxSavings)} (at ~30% marginal rate)`,
      });
    }

    return results;
  },
  explainSteps: (values) => {
    const rows = mileageConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const g = (id: string) => resultValue(rows, id) ?? '';
    const miles = parseNumberStrict(values.miles);
    const rate = g('rateUsed');
    const extra = g('additionalAmount');
    return [
      {
        label: `Look up the ${(RATE_LABELS[values.mileageType || 'business'] ?? '').toLowerCase()} rate for the chosen period`,
        expr: `${g('year')}: ${rate}`,
        note: 'The IRS publishes one rate per mile for each kind of use, and it can change part-way through a year.',
      },
      { label: 'Multiply the miles by the rate', expr: `${miles} mi × ${rate.replace('/mi', '')} = ${g('mileageAmount')}` },
      ...(extra ? [{ label: 'Add the other expenses (tolls, parking)', expr: `${g('mileageAmount')} + ${extra} = ${g('reimbursement')}`, note: 'Rounded to the cent after adding.' }] : []),
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MileagePanel, { values, results });
  },
  educational: {
    formula: 'Reimbursement = Miles × Rate + Additional Expenses',
    formulaDescription:
      'The IRS standard mileage rate is a simplified method for calculating deductible vehicle costs. Multiply your business miles by the IRS rate, then add any tolls or parking fees.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-333333)">Mileage Reimbursement Formula</text><rect x="20" y="35" width="85" height="30" rx="5" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="62" y="53" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">Miles</text><text x="112" y="53" font-size="12" fill="var(--svg-333333)">×</text><rect x="125" y="35" width="85" height="30" rx="5" fill="var(--svg-3b82f6)" opacity="0.6"/><text x="167" y="53" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">IRS Rate</text><text x="217" y="53" font-size="12" fill="var(--svg-333333)">+</text><rect x="230" y="35" width="70" height="30" rx="5" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="265" y="53" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Fees</text><text x="160" y="80" text-anchor="middle" font-size="12" fill="var(--svg-333333)">=</text><rect x="100" y="90" width="120" height="30" rx="5" fill="var(--svg-ef4444)" opacity="0.8"/><text x="160" y="108" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)" font-weight="bold">Reimbursement</text><line x1="20" y1="130" x2="300" y2="130" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="148" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-555555)">2026 IRS Standard Mileage Rates</text><rect x="20" y="155" width="88" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="64" y="170" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Business: $0.76</text><rect x="116" y="155" width="88" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.6"/><text x="160" y="170" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Medical: $0.235</text><rect x="212" y="155" width="88" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.5"/><text x="256" y="170" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Charity: $0.14</text></svg>',
      alt: 'Flow diagram showing the mileage reimbursement formula: Miles times IRS Rate plus Fees equals Reimbursement',
      caption: 'Reimbursement = Miles × IRS Rate + Additional Expenses. The 2026 business rate is $0.76/mile, medical $0.235/mile, charitable $0.14/mile.',
    },
    variables: [
      {
        symbol: 'Miles',
        name: 'Total Miles',
        description: 'The number of miles driven for business, medical, moving, or charitable purposes.',
      },
      {
        symbol: 'Rate',
        name: 'Standard Mileage Rate',
        description: 'The per-mile rate set by the IRS for the tax year. Varies by use type and year.',
      },
      {
        symbol: 'Expenses',
        name: 'Additional Expenses',
        description: 'Tolls, parking fees, and other vehicle-related expenses separate from mileage.',
      },
    ],
    howToUse: [
      'Enter the total miles driven for the eligible purpose.',
      'Select the mileage type (Business, Medical/Moving, or Charitable).',
      'Choose the tax year to apply the correct rate.',
      'Optionally add tolls, parking, or other expenses.',
      'Read your total reimbursement and estimated tax savings.',
    ],
    explanation:
      'The IRS standard mileage rate simplifies vehicle expense deduction. Instead of tracking actual costs (gas, repairs, insurance, depreciation), you multiply your business miles by the IRS rate. For 2026 the IRS changed the rates mid-year: miles driven January 1 - June 30 use $0.725 (business) and $0.205 (medical/moving), miles driven from July 1 use $0.76 and $0.235 (IR-2025-128 and IR-2026-29); charitable stays $0.14. Run the calculator once per period and add the results. Self-employed individuals can deduct this on Schedule C, reducing their taxable income. Practical example: a real estate agent drives 8,000 business miles January - June and 7,000 July - December 2026. The mileage deduction is 8,000 × $0.725 + 7,000 × $0.76 = $5,800 + $5,320 = $11,120. If they also paid $200 in tolls and $150 in parking, the total deduction is $11,470. At a 30% marginal tax rate, this saves approximately $3,441 in taxes. Edge cases: for rideshare drivers (Uber, Lyft), the distinction between personal and business miles is critical — only miles driven while the app is on and you are actively working count as business miles. Miles driven to the first pickup location are not deductible as business miles (they are commuting miles). If you use the standard mileage rate in the first year of vehicle ownership, you cannot switch to actual expenses in later years. For a vehicle leased for business use, you must use the standard mileage rate for the entire lease period. Medical mileage includes trips for medical care, dental visits, and pharmacy runs — but the 7.5% of AGI floor for medical expenses applies. Charitable mileage is only deductible if you itemize deductions on Schedule A. Medical mileage is an itemized deduction only to the extent total medical expenses exceed 7.5% of AGI, and moving mileage is deductible only for active-duty military under a permanent change of station. For mixed-use vehicles (personal and business), keep a detailed mileage log showing date, purpose, starting and ending odometer readings for each business trip.',
    faqs: [
      {
        question: 'What is the standard mileage rate for 2026?',
        answer:
          'For miles driven from July 1, 2026 the IRS business rate is $0.76 per mile (medical/moving $0.235). For January 1 - June 30, 2026 it was $0.725 (medical/moving $0.205). The charitable rate is $0.14 per mile all year. Pick the matching period in the calculator.',
      },
      {
        question: 'Can I use both actual expenses and standard mileage?',
        answer:
          'For leased vehicles, you must use the standard mileage rate for the entire lease period. For owned vehicles, you can choose either method in the first year, but switching later is restricted.',
      },
      {
        question: 'What counts as additional expenses?',
        answer:
          'Tolls and parking fees are separately deductible on top of the mileage rate. Other costs like gas, insurance, and repairs are covered by the standard mileage rate.',
      },
      {
        question: 'Is the mileage rate the same for all purposes?',
        answer:
          'No. Business rates are the highest. Medical and moving have a lower rate, and charitable mileage has the lowest rate. The rates are updated annually by the IRS.',
      },
      {
        question: 'Do I need a mileage log, and what should it contain?',
        answer: 'Yes, the IRS requires a contemporaneous mileage log (recorded at or near the time of the trip) for all business mileage deductions. Your log should include the date of each trip, the starting and ending odometer readings, the total miles driven, the destination and purpose of each trip, and the business relationship of anyone you met with. For mixed-use vehicles, you must separate business and personal miles — commuting miles (travel between home and a regular workplace) are not deductible. The IRS accepts electronic logs, mileage tracking apps, or paper logs. Apps like MileIQ, Stride, and QuickBooks Self-Employed can automate GPS-based mileage tracking and generate IRS-compliant reports. If you are audited, the IRS will expect to see a complete log for the entire tax year, not just a sample. For employees using the actual expense method (not standard mileage), you also need records of all vehicle-related expenses: gas, oil changes, tires, repairs, insurance, registration fees, lease payments, and depreciation. The standard mileage rate simplifies this by bundling all costs into a single per-mile rate, but you still need the mileage log to substantiate the business use percentage.',
      },
    ],
    citations: [

      { source: 'IRS', title: 'IRS Mileage Rates', url: 'https://www.irs.gov/tax-professionals/standard-mileage-rates' },
    ],
  },
};

export default mileageConfig;
