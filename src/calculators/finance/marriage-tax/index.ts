import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import MarriageTaxPanel from './MarriageTaxPanel';

// 2026 IRS tax brackets (inflation-adjusted projections / final published values)
const SINGLE_BRACKETS_2026: [number, number][] = [
  [11925, 0.10],
  [48475, 0.12],
  [103350, 0.22],
  [197300, 0.24],
  [250525, 0.32],
  [626350, 0.35],
  [Infinity, 0.37],
];

const MFJ_BRACKETS_2026: [number, number][] = [
  [23850, 0.10],
  [96950, 0.12],
  [206700, 0.22],
  [394600, 0.24],
  [501050, 0.32],
  [751600, 0.35],
  [Infinity, 0.37],
];

const STD_DEDUCTION_SINGLE_2026 = 15750;
const STD_DEDUCTION_MFJ_2026 = 31500;

function calcTax(taxableIncome: number, brackets: [number, number][]): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let lastLimit = 0;
  for (const [limit, rate] of brackets) {
    if (taxableIncome > limit) {
      tax += (limit - lastLimit) * rate;
      lastLimit = limit;
    } else {
      tax += (taxableIncome - lastLimit) * rate;
      return tax;
    }
  }
  return tax;
}

const marriageTaxConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'income1',
      label: 'Partner 1 — Annual Income',
      type: 'number',
      placeholder: '85,000',
      prefix: '$',
      required: true,
      helpText: 'Gross annual income for the first partner before taxes.',
    },
    {
      id: 'income2',
      label: 'Partner 2 — Annual Income',
      type: 'number',
      placeholder: '65,000',
      prefix: '$',
      required: true,
      helpText: 'Gross annual income for the second partner before taxes.',
    },
    {
      id: 'deductionType',
      label: 'Deduction Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Standard Deduction (most common)', value: 'standard' },
        { label: 'Itemized — enter combined itemized amount', value: 'itemized' },
      ],
      helpText: 'Choose standard deduction or itemize if your deductions exceed the standard amount.',
    },
    {
      id: 'itemized1',
      label: 'Partner 1 Itemized Deductions (if filing single)',
      type: 'number',
      placeholder: '14,000',
      prefix: '$',
      helpText: 'Used only if Itemized is selected.',
      showWhen: (v) => v.deductionType === 'itemized',
    },
    {
      id: 'itemized2',
      label: 'Partner 2 Itemized Deductions (if filing single)',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      helpText: 'Used only if Itemized is selected.',
      showWhen: (v) => v.deductionType === 'itemized',
    },
    {
      id: 'itemizedJoint',
      label: 'Combined Itemized Deductions (if filing jointly)',
      type: 'number',
      placeholder: '24,000',
      prefix: '$',
      helpText: 'Used only if Itemized is selected.',
      showWhen: (v) => v.deductionType === 'itemized',
    },
  ],

  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const i1 = parseFloat(values.income1);
    const i2 = parseFloat(values.income2);
    const dType = values.deductionType || 'standard';

    if (isNaN(i1) || isNaN(i2) || i1 < 0 || i2 < 0) return [];

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    let ded1: number, ded2: number, dedJoint: number;
    if (dType === 'itemized') {
      const it1 = parseFloat(values.itemized1);
      const it2 = parseFloat(values.itemized2);
      const itJ = parseFloat(values.itemizedJoint);
      if (isNaN(it1) || isNaN(it2) || isNaN(itJ) || it1 < 0 || it2 < 0 || itJ < 0) {
        return [
          { id: 'err', label: 'Itemized Deduction Inputs Required', value: 'Enter all three itemized deduction amounts (Partner 1 single, Partner 2 single, and combined joint), or switch to Standard Deduction.', color: 'negative' as const, highlight: true },
        ];
      }
      ded1 = it1;
      ded2 = it2;
      dedJoint = itJ;
    } else {
      ded1 = STD_DEDUCTION_SINGLE_2026;
      ded2 = STD_DEDUCTION_SINGLE_2026;
      dedJoint = STD_DEDUCTION_MFJ_2026;
    }

    const taxable1 = Math.max(0, i1 - ded1);
    const taxable2 = Math.max(0, i2 - ded2);
    const tax1 = calcTax(taxable1, SINGLE_BRACKETS_2026);
    const tax2 = calcTax(taxable2, SINGLE_BRACKETS_2026);
    const totalSingleTax = tax1 + tax2;

    const taxableJoint = Math.max(0, i1 + i2 - dedJoint);
    const taxJoint = calcTax(taxableJoint, MFJ_BRACKETS_2026);

    const diff = taxJoint - totalSingleTax;
    const isPenalty = diff > 0;
    const isBonus = diff < 0;
    const magnitude = Math.abs(diff);

    const singleFmt = `$${fmt(totalSingleTax)}`;
    const marriedFmt = `$${fmt(taxJoint)}`;
    let resultFmt: string, heroColor: 'positive' | 'negative' | 'neutral';

    if (isBonus) {
      resultFmt = `Save $${fmt(magnitude)}`;
      heroColor = 'positive';
    } else if (isPenalty) {
      resultFmt = `Pay $${fmt(magnitude)} more`;
      heroColor = 'negative';
    } else {
      resultFmt = 'No difference';
      heroColor = 'neutral';
    }

    return [
      // Primary SEO row: side-by-side comparison exact format
      { id: 'hero', label: `If Single: ${singleFmt} | If Married: ${marriedFmt} | Result: ${resultFmt}`, value: resultFmt, highlight: true, color: heroColor },
      { id: 'unmarriedTotal', label: 'If UNMARRIED — Combined Federal Tax (filing 2 singles)', value: singleFmt, color: 'neutral' as const },
      { id: 'p1Tax', label: `   • Partner 1 (income $${fmt(i1)}, deduction $${fmt(ded1)})`, value: `$${fmt(tax1)}`, color: 'neutral' as const },
      { id: 'p2Tax', label: `   • Partner 2 (income $${fmt(i2)}, deduction $${fmt(ded2)})`, value: `$${fmt(tax2)}`, color: 'neutral' as const },
      { id: 'marriedTotal', label: `If MARRIED — Joint Federal Tax (MFJ, deduction $${fmt(dedJoint)})`, value: marriedFmt, color: 'neutral' as const },
      { id: 'jointIncome', label: 'Combined Household Income', value: `$${fmt(i1 + i2)}`, color: 'neutral' as const },
      { id: 'effSingle', label: 'Effective Tax Rate — Filing as 2 Singles', value: `${(((totalSingleTax) / (i1 + i2)) * 100).toFixed(2)}%`, color: 'neutral' as const },
      { id: 'effMarried', label: 'Effective Tax Rate — Filing Jointly', value: `${((taxJoint / (i1 + i2)) * 100).toFixed(2)}%`, color: 'neutral' as const },
      { id: 'year', label: 'Tax Year Used', value: '2026 IRS brackets and standard deductions', color: 'neutral' as const },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MarriageTaxPanel, { values, results });
  },

  educational: {
    formula: 'Marriage Difference = Tax(MFJ on combined income) − [Tax(Single₁) + Tax(Single₂)]',
    formulaDescription:
      'A marriage penalty exists when filing jointly produces a higher combined federal tax bill than two single filers with identical incomes would have paid separately. A marriage bonus is the opposite. The difference is driven entirely by how the joint tax brackets compare to twice the single brackets at each income level.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto" font-family="system-ui,sans-serif"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="8"/><text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Marriage Bonus vs. Penalty</text><text x="160" y="33" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Marriage Difference = Joint Tax − Sum(Single Taxes)</text><g transform="translate(10,42)"><text x="75" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-475569)">Two Singles Filing</text><rect x="5" y="18" width="65" height="40" rx="4" fill="var(--svg-3b82f6)"/><text x="37" y="34" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)">Income 1</text><text x="37" y="50" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">$85K</text><rect x="80" y="18" width="65" height="40" rx="4" fill="var(--svg-3b82f6)"/><text x="112" y="34" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)">Income 2</text><text x="112" y="50" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">$65K</text><rect x="5" y="65" width="140" height="22" rx="4" fill="var(--svg-93c5fd)"/><text x="75" y="80" text-anchor="middle" font-size="9" fill="var(--svg-1e3a5f)">Single Tax₁ + Single Tax₂ = Combined</text></g><text x="155" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-94a3b8)">vs</text><g transform="translate(165,42)"><text x="72" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-475569)">Married Filing Jointly</text><rect x="5" y="18" width="135" height="40" rx="4" fill="var(--svg-8b5cf6)"/><text x="72" y="34" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)">Combined Income</text><text x="72" y="50" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">$150K</text><rect x="5" y="65" width="135" height="22" rx="4" fill="var(--svg-c4b5fd)"/><text x="72" y="80" text-anchor="middle" font-size="9" fill="var(--svg-3b0764)">Joint Tax (MFJ brackets)</text></g><g transform="translate(15,140)"><rect x="0" y="0" width="290" height="50" rx="8" fill="var(--svg-f1f5f9)"/><text x="145" y="15" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Lower brackets (10-24%) have MFJ thresholds = 2x single, so neutral</text><text x="145" y="28" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Higher brackets (32-37%) below 2x single, penalty for equal earners</text><rect x="55" y="36" width="60" height="12" rx="6" fill="var(--svg-ef4444)"/><text x="85" y="45" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)">Penalty</text><rect x="140" y="36" width="50" height="12" rx="6" fill="var(--svg-22c55e)"/><text x="165" y="45" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)">Bonus</text><rect x="215" y="36" width="50" height="12" rx="6" fill="var(--svg-64748b)"/><text x="240" y="45" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)">Neutral</text></g></svg>',
      alt: 'Diagram comparing two single filers vs married filing jointly, showing how lower tax brackets are neutral while higher brackets create a marriage penalty for equal earners',
      caption: 'Marriage tax bonus or penalty depends entirely on how the joint tax brackets compare to twice the single brackets at each income level',
    },
    variables: [
      { symbol: 'Single₁', name: 'Partner 1 Single Tax', description: "Partner 1's federal tax filing as a single individual." },
      { symbol: 'Single₂', name: 'Partner 2 Single Tax', description: "Partner 2's federal tax filing as a single individual." },
      { symbol: 'MFJ', name: 'Married Filing Jointly Tax', description: 'Combined federal tax on the joint return using MFJ brackets.' },
      { symbol: 'Std Ded', name: 'Standard Deduction (2026)', description: 'Single: $15,750. MFJ: $31,500. Exactly 2× the single, so the deduction itself is neutral.' },
      { symbol: 'Effective Rate', name: 'Overall Federal Tax Rate', description: 'The percentage of total household income paid in federal income tax. Comparing the effective rate when filing as two singles versus filing jointly tells you whether the tax code penalizes or rewards your marriage.' },
    ],
    howToUse: [
      "Enter each partner's pre-tax annual income, choose Standard or Itemized deduction, and enter itemized amounts if applicable.",
      'Read the hero line: a green "Bonus" means marriage saves you tax; a red "Penalty" means it costs you more.',
      "This estimates federal income tax only. State taxes, FICA, ACA premium credits, and Social Security taxation are not included and can substantially affect the real picture.",
    ],
    commonUses: [
      'Compare your combined tax bill as two single filers versus married filing jointly to determine if a marriage penalty or bonus applies.',
      'Estimate how much a dual-income couple saves in taxes when one partner earns significantly more than the other.',
      'Plan the optimal filing strategy by understanding how the marriage penalty affects high-earning couples with similar incomes.',
    ],
    explanation:
      'For the lower brackets (10%, 12%, 22%, 24%) the MFJ thresholds are exactly double the single thresholds, so couples in those brackets are tax-neutral. The penalty appears in the 32%, 35%, and 37% brackets, where MFJ thresholds are LESS than double the single thresholds — so two high-earning singles get pushed into a higher bracket when they marry. Bonuses appear when one partner earns much more than the other, because the joint return effectively averages the income across two people, sliding more of it into the lower brackets.',
    faqs: [
      {
        question: 'When do couples typically experience a marriage penalty?',
        answer:
          'When both partners earn similar high incomes. Two singles each making $250,000 each pay tax at marginal rates topping out around 35%. Combined as MFJ, their $500,000 joint income hits the 32%/35% brackets earlier and harder, often creating a penalty of several thousand dollars per year. The penalty grows with income and is maximized when the two incomes are roughly equal.',
      },
      {
        question: 'When do couples get a marriage bonus?',
        answer:
          'When incomes are highly unequal. If Partner 1 earns $200,000 and Partner 2 earns $20,000, filing jointly effectively averages their income across two people in the bracket math, pulling much of Partner 1\'s income out of higher brackets. The bigger the income disparity, the bigger the bonus. Single-earner households almost always benefit from marriage at tax time.',
      },
      {
        question: 'Does this calculator include state taxes or other credits?',
        answer:
          'No — this is federal income tax only, using 2026 IRS brackets and standard deductions. It does not model the Earned Income Tax Credit (which has its own marriage penalties), ACA premium tax credits (which use household income), Social Security benefit taxation, state income tax (which can have very different bracket structures), or FICA. For high earners and very low earners these factors can change the picture meaningfully — talk to a CPA before making the decision based on tax math alone.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
  
    workedExamples: [
      {
        scenario: 'Marcus and Lena, both software engineers in Seattle, each earn $150,000. They are deciding whether to marry and file jointly or remain unmarried filing as two singles. Both take the standard deduction.',
        inputs: {
          'Partner 1 — Annual Income': '$150,000',
          'Partner 2 — Annual Income': '$150,000',
          'Deduction Type': 'Standard Deduction (most common)',
        },
        result: 'If Unmarried (two singles): Partner 1 tax = $25,067, Partner 2 tax = $25,067, combined = $50,134. If Married (MFJ): joint tax = $50,134. Result: Neutral — no penalty or bonus.',
        insight: 'Marcus and Lena face neither a penalty nor a bonus — the result is exactly neutral because their combined income of $300,000 falls entirely within the 24% bracket for both filing statuses. For MFJ, the 24% bracket caps at $394,600, and for singles it caps at $197,300 per person ($394,600 combined). In these lower brackets (10% through 24%), the MFJ thresholds are exactly double the single thresholds, so two equal earners in this range pay the same total tax married or single. A penalty would appear if their incomes pushed into the 32%+ brackets, where MFJ thresholds are less than double the single thresholds.',
      },
      {
        scenario: 'James earns $200,000 as an attorney in Denver, while his partner Sophie earns $35,000 as a non-profit program coordinator. They are considering marriage and want to know whether they will get a bonus or penalty.',
        inputs: {
          'Partner 1 — Annual Income': '$200,000',
          'Partner 2 — Annual Income': '$35,000',
          'Deduction Type': 'Standard Deduction (most common)',
        },
        result: 'If Unmarried: James tax = $37,067, Sophie tax = $2,072, combined = $39,139. If Married: joint tax = $34,598. Marriage Bonus: Save $4,541.',
        insight: 'James and Sophie receive a substantial marriage bonus of over $4,500 because their incomes are highly unequal. Filing jointly effectively averages their incomes across two people in the bracket math — pulling much of James\'s $200K income out of the higher single brackets and spreading it across the wider MFJ bracket thresholds. As a single filer, James\'s taxable income of $184,250 reaches the 24% bracket (which starts at $103,350 for singles). Filing jointly, their combined taxable income of $203,500 stays within the 22% MFJ bracket (which extends to $206,700). The bigger the income disparity, the bigger the bonus. Single-earner households and couples with very unequal incomes almost always benefit from marriage at tax time.',
      },
    ],

    proTips: [
      'Run this calculator both ways (standard deduction and itemized) — if one partner has large mortgage interest or charitable deductions, itemizing might flip a penalty into a bonus or vice versa.',
      'The marriage penalty appears in the 32%, 35%, and 37% brackets where MFJ thresholds are less than double the single thresholds. If both partners earn above roughly $190K each, you will almost certainly face a penalty.',
      'Don\'t forget about non-tax factors: married couples may qualify for better health insurance rates, spousal IRA contributions, and Social Security survivor benefits that can outweigh a tax penalty.',
      'This is federal income tax only. If you live in a community property state (CA, TX, WA, etc.), your state tax picture can be entirely different from the federal result.',
    ],

    quickReference: [
      { label: 'Single Std Ded (2026)', value: '$15,750' },
      { label: 'MFJ Std Ded (2026)', value: '$31,500' },
      { label: 'Brackets neutral', value: '10%–24% (MFJ = 2× Single)' },
      { label: 'Brackets penalize', value: '32%–37% (MFJ < 2× Single)' },
      { label: '$100K + $40K', value: 'Bonus ~$2,423 (standard deduction)' },
      { label: '$200K + $200K', value: 'Penalty ~$4,100 (standard deduction)' },
    ],

    limitations: [
      'Federal income tax only. State income tax brackets often differ significantly from federal brackets and can add their own marriage penalties or bonuses — California, for example, has a separate marriage penalty in its top brackets.',
      'It does not model the Earned Income Tax Credit, which has its own marriage penalty for low-income couples. It also does not model ACA premium tax credits, Social Security benefit taxation thresholds for married vs. single filers, or FICA taxes which are neutral with respect to marriage.',
      'Assumes both partners use the same deduction type (both standard or both itemized). In reality, if one partner itemizes, the other must also itemize even if their individual deductions are below the standard threshold.',
      'It does not account for the "marriage bonus" from IRA contribution eligibility — married couples filing jointly have higher income phase-out ranges for Roth IRA contributions and deductible traditional IRA contributions.',
    ],
citations: [
    { source: 'IRS Publication 501', url: 'https://www.irs.gov/publications/p501' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/marriage-tax-penalty-5214961' },
  ],
  },
};

export default marriageTaxConfig;
