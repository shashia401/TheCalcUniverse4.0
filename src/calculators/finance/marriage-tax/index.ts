import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import { FEDERAL_BRACKETS, STANDARD_DEDUCTION } from '../../../utils/taxData';
import MarriageTaxPanel from './MarriageTaxPanel';

// Derived from the shared, actively-maintained bracket data (utils/taxData.ts) —
// this file used to hardcode its own copy that had drifted (wrong standard deduction).
const SINGLE_BRACKETS_2026: [number, number][] = FEDERAL_BRACKETS.single.map((b) => [b.to, b.rate]);
const MFJ_BRACKETS_2026: [number, number][] = FEDERAL_BRACKETS.mfj.map((b) => [b.to, b.rate]);

const STD_DEDUCTION_SINGLE_2026 = STANDARD_DEDUCTION.single;
const STD_DEDUCTION_MFJ_2026 = STANDARD_DEDUCTION.mfj;

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
      min: 0,
      helpText: 'Gross annual income for the first partner before taxes.',
    },
    {
      id: 'income2',
      label: 'Partner 2 — Annual Income',
      type: 'number',
      placeholder: '65,000',
      prefix: '$',
      required: true,
      min: 0,
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
      helpText: 'Choose standard deduction or itemize if your deductions exceed the standard amount. If an itemized figure is lower than the standard deduction, the standard deduction is used instead.',
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
      // A taxpayer takes the LARGER of itemized and standard, so a low itemized figure
      // never raises the tax above the standard-deduction result.
      ded1 = Math.max(it1, STD_DEDUCTION_SINGLE_2026);
      ded2 = Math.max(it2, STD_DEDUCTION_SINGLE_2026);
      dedJoint = Math.max(itJ, STD_DEDUCTION_MFJ_2026);
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

    const totalIncome = i1 + i2;
    const pct = (t: number) => (totalIncome > 0 ? ((t / totalIncome) * 100).toFixed(2) : '0.00');
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
      { id: 'hero', label: `If Single: ${singleFmt} | If Married: ${marriedFmt} | Result: ${resultFmt}`, value: resultFmt, highlight: true, color: heroColor, interpretation: `A "penalty" or "bonus" shows up when combining incomes pushes you into different tax brackets than filing separately would — it's most common when both partners earn similar, high incomes. This compares married-filing-jointly against two single filers; married-filing-separately is rarely better but exists as an option in specific situations (e.g., income-driven student loan repayment).` },
      { id: 'unmarriedTotal', label: 'If UNMARRIED — Combined Federal Tax (filing 2 singles)', value: singleFmt, color: 'neutral' as const },
      { id: 'p1Tax', label: `   • Partner 1 (income $${fmt(i1)}, deduction $${fmt(ded1)})`, value: `$${fmt(tax1)}`, color: 'neutral' as const },
      { id: 'p2Tax', label: `   • Partner 2 (income $${fmt(i2)}, deduction $${fmt(ded2)})`, value: `$${fmt(tax2)}`, color: 'neutral' as const },
      { id: 'marriedTotal', label: `If MARRIED — Joint Federal Tax (MFJ, deduction $${fmt(dedJoint)})`, value: marriedFmt, color: 'neutral' as const },
      { id: 'jointIncome', label: 'Combined Household Income', value: `$${fmt(i1 + i2)}`, color: 'neutral' as const },
      { id: 'effSingle', label: 'Effective Tax Rate — Filing as 2 Singles', value: `${pct(totalSingleTax)}%`, color: 'neutral' as const },
      { id: 'effMarried', label: 'Effective Tax Rate — Filing Jointly', value: `${pct(taxJoint)}%`, color: 'neutral' as const },
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
      { symbol: 'Std Ded', name: 'Standard Deduction (2026)', description: 'Single: $16,100. MFJ: $32,200. Exactly 2× the single, so the deduction itself is neutral.' },
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
      'For most brackets (10% through 32%) the MFJ thresholds are exactly double the single thresholds, so couples in those brackets are tax-neutral no matter how the income is split. The penalty only appears once income reaches the top 37% bracket, where the MFJ threshold ($768,700) is less than double the single threshold ($640,600) — so two very high-earning singles, each already deep in the 35% bracket, get pushed into the 37% bracket sooner when they marry. Bonuses appear when one partner earns much more than the other, because the joint return effectively averages the income across two people, sliding more of it into the lower brackets.',
    faqs: [
      {
        question: 'When do couples typically experience a marriage penalty?',
        answer:
          'When both partners individually earn very high, similar incomes — specifically once each partner is already deep into the 35% single bracket (roughly $400K+ of income each, i.e. about $384K of taxable income each after the standard deduction). Two singles each making $450,000 pay tax at a marginal rate of 35%. Combined as MFJ, their $900,000 joint income crosses into the 37% bracket sooner than it would on two separate returns, creating a penalty of about $1,982 per year (2026 brackets, standard deduction). With the standard deduction, below this income level the brackets are exactly neutral between filing separately and jointly, so no penalty exists for moderate earners.',
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
        result: 'If Unmarried (two singles): Partner 1 tax = $24,734, Partner 2 tax = $24,734, combined = $49,468. If Married (MFJ): joint tax = $49,468. Result: Neutral — no penalty or bonus.',
        insight: 'Marcus and Lena face neither a penalty nor a bonus — the result is exactly neutral because their combined income of $300,000 falls entirely within the 24% bracket for both filing statuses. For MFJ, the 24% bracket caps at $403,550, and for singles it caps at $201,775 per person ($403,550 combined). In these lower brackets (10% through 24%), the MFJ thresholds are exactly double the single thresholds, so two equal earners in this range pay the same total tax married or single. A penalty only appears once joint income is high enough to push into the MFJ 37% bracket while each partner individually remains in the single 35% bracket — the MFJ 37% threshold is less than double the single 35%-bracket threshold.',
      },
      {
        scenario: 'James earns $200,000 as an attorney in Denver, while his partner Sophie earns $35,000 as a non-profit program coordinator. They are considering marriage and want to know whether they will get a bonus or penalty.',
        inputs: {
          'Partner 1 — Annual Income': '$200,000',
          'Partner 2 — Annual Income': '$35,000',
          'Deduction Type': 'Standard Deduction (most common)',
        },
        result: 'If Unmarried: James tax = $36,734, Sophie tax = $2,020, combined = $38,754. If Married: joint tax = $34,040. Marriage Bonus: Save $4,714.',
        insight: 'James and Sophie receive a substantial marriage bonus of over $4,700 because their incomes are highly unequal. Filing jointly effectively averages their incomes across two people in the bracket math — pulling much of James\'s $200K income out of the higher single brackets and spreading it across the wider MFJ bracket thresholds. As a single filer, James\'s taxable income of $183,900 reaches the 24% bracket (which starts at $105,700 for singles). Filing jointly, their combined taxable income of $202,800 stays within the 22% MFJ bracket (which extends to $211,400). The bigger the income disparity, the bigger the bonus. Single-earner households and couples with very unequal incomes almost always benefit from marriage at tax time.',
      },
    ],

    proTips: [
      'Run this calculator both ways (standard deduction and itemized) — if one partner has large mortgage interest or charitable deductions, itemizing might flip a penalty into a bonus or vice versa.',
      'The marriage penalty only appears once joint income pushes into the 37% MFJ bracket while each partner individually is still in the 35% single bracket — the 10% through 32% brackets are all exactly double for singles vs. MFJ, so they are neutral. If both partners individually earn above roughly $400K each, you will likely face a penalty.',
      'Don\'t forget about non-tax factors: married couples may qualify for better health insurance rates, spousal IRA contributions, and Social Security survivor benefits that can outweigh a tax penalty.',
      'This is federal income tax only. If you live in a community property state (CA, TX, WA, etc.), your state tax picture can be entirely different from the federal result.',
    ],

    quickReference: [
      { label: 'Single Std Ded (2026)', value: '$16,100' },
      { label: 'MFJ Std Ded (2026)', value: '$32,200' },
      { label: 'Brackets neutral', value: '10%–32% (MFJ = 2× Single)' },
      { label: 'Bracket that penalizes', value: '37% (MFJ threshold < 2× Single 35% threshold)' },
      { label: '$100K + $40K', value: 'Bonus ~$2,650 (standard deduction)' },
      { label: '$500K + $500K', value: 'Penalty ~$3,982 (standard deduction)' },
    ],

    limitations: [
      'Federal income tax only. State income tax brackets often differ significantly from federal brackets and can add their own marriage penalties or bonuses — California, for example, has a separate marriage penalty in its top brackets.',
      'It does not model the Earned Income Tax Credit, which has its own marriage penalty for low-income couples. It also does not model ACA premium tax credits, Social Security benefit taxation thresholds for married vs. single filers, or FICA taxes which are neutral with respect to marriage.',
      'Uses the same deduction choice for both partners (standard or itemized, with itemized amounts floored at the standard deduction). Two unmarried filers can each choose independently; a mixed choice is not modelled. Itemized limits such as the SALT cap are not applied to the amounts you enter.',
      'It does not account for the "marriage bonus" from IRA contribution eligibility — married couples filing jointly have higher income phase-out ranges for Roth IRA contributions and deductible traditional IRA contributions.',
    ],
citations: [
    { source: 'IRS Publication 501', url: 'https://www.irs.gov/publications/p501' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/marriage-tax-penalty-5214961' },
  ],
  },
};

export default marriageTaxConfig;
