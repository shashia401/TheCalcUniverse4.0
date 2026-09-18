import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SelfEmploymentTaxPanel from './SelfEmploymentTaxPanel';

const SS_RATE = 0.124; // 12.4%
const MEDICARE_RATE = 0.029; // 2.9%
const SS_WAGE_BASE_2026 = 176100;
const SE_MULTIPLIER = 0.9235; // 92.35% of net earnings subject to SE tax

const selfEmploymentTaxConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'netProfit',
      label: 'Net Profit from Self-Employment (1099 income minus expenses)',
      type: 'number',
      placeholder: '100,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Your total self-employment income after business expenses (Schedule C net profit).',
    },
    {
      id: 'w2Income',
      label: 'W-2 Wages (if applicable)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 1000,
      required: false,
      helpText: 'If you have W-2 wages, SS taxes already paid through your employer reduce the SS wage base remaining for SE income.',
    },
    {
      id: 'qbiDeduction',
      label: 'Qualified Business Income (QBI) Deduction (Section 199A)',
      type: 'select',
      required: true,
      options: [
        { label: 'Yes — Apply QBI deduction (simplified 20%)', value: 'yes' },
        { label: 'No — Do not apply QBI deduction', value: 'no' },
      ],
      helpText: 'The QBI deduction allows you to deduct up to 20% of qualified business income from your income tax. It does not reduce SE tax itself but lowers your overall tax burden.',
    },
  ],

  calculate: (values) => {
    const netProfit = parseFloat(values.netProfit);
    const w2Income = parseFloat(values.w2Income) || 0;
    const qbiEnabled = values.qbiDeduction === 'yes';

    if (isNaN(netProfit) || netProfit <= 0) return [];

    const seEarnings = netProfit * SE_MULTIPLIER;

    // SS wage base: if W-2 wages already consumed some of the SS base
    const remainingSSBase = Math.max(0, SS_WAGE_BASE_2026 - w2Income);
    const ssEarnings = Math.min(seEarnings, remainingSSBase);
    const socialSecurityPortion = Math.max(0, ssEarnings * SS_RATE);

    const medicarePortion = seEarnings * MEDICARE_RATE;

    const secaTax = socialSecurityPortion + medicarePortion;

    // Deductible half of SE tax (above-the-line deduction on Form 1040)
    const deductiblePortion = secaTax / 2;

    // QBI savings estimate (simplified: 20% of net profit at an assumed 22% marginal rate)
    const qbiSavings = qbiEnabled ? netProfit * 0.2 * 0.22 : 0;

    const effectiveRate = (secaTax / netProfit) * 100;

    const totalIncome = netProfit + w2Income;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'secaTax',
        label: 'Total Self-Employment (SECA) Tax',
        value: `$${fmt(secaTax)}`,
        highlight: true,
        color: 'negative' as const,
        interpretation: `This covers both halves of Social Security and Medicare that a W-2 employer would normally split with you — as a self-employed filer, you owe all of it. Half of this amount is deductible on your income tax return, which softens the real cost; set this aside quarterly rather than facing it as one bill in April.`,
      },
      {
        id: 'socialSecurityPortion',
        label: 'Social Security Portion (12.4%)',
        value: `$${fmt(socialSecurityPortion)}`,
        color: 'neutral' as const,
      },
      {
        id: 'medicarePortion',
        label: 'Medicare Portion (2.9%)',
        value: `$${fmt(medicarePortion)}`,
        color: 'neutral' as const,
      },
      {
        id: 'effectiveRate',
        label: 'Effective SE Tax Rate',
        value: `${effectiveRate.toFixed(2)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'deductiblePortion',
        label: 'Deductible Half of SE Tax (Form 1040 adjustment)',
        value: `$${fmt(deductiblePortion)}`,
        color: 'positive' as const,
      },
      {
        id: 'qbiSavings',
        label: 'Estimated QBI Deduction Savings (income tax)',
        value: qbiEnabled ? `$${fmt(qbiSavings)}` : '$0.00 (QBI not applied)',
        color: qbiEnabled ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'totalIncome',
        label: 'Total Combined Income (1099 + W-2)',
        value: `$${fmt(totalIncome)}`,
        color: 'neutral' as const,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SelfEmploymentTaxPanel, { values, results });
  },

  educational: {
    formula: 'SECA Tax = Net Profit × 92.35% × 15.3%',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Self-Employment Tax Breakdown</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Self-employed pay both the employee AND employer share of FICA</text><g transform="translate(30,65)"><!-- Net Profit at top --><rect x="60" y="0" width="310" height="40" rx="8" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="215" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-1e40af)">Net Profit: $100,000</text><text x="215" y="34" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Schedule C net earnings after business expenses</text><!-- 92.35% multiplier arrow --><path d="M 215,40 L 215,58" stroke="var(--svg-64748b)" stroke-width="2" marker-end="url(#arrow)"/><rect x="60" y="58" width="310" height="30" rx="6" fill="var(--svg-e2e8f0)"/><text x="215" y="78" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-475569)">SE Earnings Base: $92,350 (92.35% of profit)</text><!-- Split into SS and Medicare --><rect x="60" y="100" width="200" height="40" rx="6" fill="var(--svg-3b82f6)"/><text x="160" y="118" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Social Security: 12.4%</text><text x="160" y="134" text-anchor="middle" font-size="9" fill="var(--svg-dbeafe)">$11,451 (cap $176,100)</text><rect x="280" y="100" width="90" height="40" rx="6" fill="var(--svg-8b5cf6)"/><text x="325" y="118" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Medicare: 2.9%</text><text x="325" y="134" text-anchor="middle" font-size="9" fill="var(--svg-e9d5ff)">$2,678 (no cap)</text><!-- Total SECA --><rect x="60" y="155" width="310" height="40" rx="8" fill="var(--svg-ef4444)"/><text x="215" y="175" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-ffffff)">Total SECA Tax: $14,129</text><text x="215" y="191" text-anchor="middle" font-size="9" fill="var(--svg-fecaca)">= $100K × 92.35% × 15.3%</text><!-- Employee vs Employer comparison --><rect x="40" y="210" width="350" height="65" rx="10" fill="var(--svg-f1f5f9)"/><text x="215" y="228" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Employee vs. Self-Employed: Same Total, Different Pocket</text><text x="80" y="248" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Employee: 7.65% ($7,650)</text><text x="80" y="262" text-anchor="middle" font-size="9" fill="var(--svg-f59e0b)">Employer: 7.65% ($7,650)</text><text x="215" y="248" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">↕</text><text x="310" y="248" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">Self-Employed: 15.3% ($14,129)</text><text x="215" y="272" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)">Deductible half: $7,064 (reduces income tax, not SE tax)</text></g></svg>',
      alt: 'Self-employment tax diagram flowing from Net Profit through 92.35% adjustment to 12.4% Social Security and 2.9% Medicare components, comparing employee (7.65%) vs self-employed (15.3%) rates',
      caption: 'Self-employed individuals pay the full 15.3% SECA tax (both employee and employer shares of FICA), but can deduct half as an above-the-line adjustment',
    },
    formulaDescription:
      'Self-employment tax is 15.3% of 92.35% of your net self-employment income. The 15.3% breaks into 12.4% for Social Security (up to the annual wage base of $176,100 in 2026) and 2.9% for Medicare (no cap). You can deduct half of your SE tax as an above-the-line adjustment on Form 1040. The QBI deduction (Section 199A) allows eligible self-employed individuals to deduct up to 20% of qualified business income from income tax.',
    variables: [
      {
        symbol: '92.35%',
        name: 'SE Earnings Multiplier',
        description: 'Only 92.35% of your net profit is subject to SE tax. This accounts for the deductibility of the employer-half of SE tax.',
      },
      {
        symbol: 'SECA Components',
        name: 'Social Security & Medicare Rates',
        description: 'SE tax has two parts: 12.4% for Social Security (capped at $176,100 for 2026) and 2.9% for Medicare (no cap). Together they form the 15.3% total SECA rate. An additional 0.9% Medicare surtax applies above $200K/$250K.',
      },
      {
        symbol: 'QBI',
        name: 'Qualified Business Income Deduction',
        description: 'Section 199A allows a deduction of up to 20% of qualified business income. This reduces income tax but not SE tax.',
      },
    ],
    howToUse: [
      'Enter your net profit from Schedule C and optionally any W-2 wages.',
      'Toggle the QBI deduction on/off to see estimated income tax savings.',
      'Review the breakdown: total SECA tax, SS/Medicare portions, deductible half, and QBI savings.',
    ],
    commonUses: [
      'Calculate the self-employment tax owed on your freelance or small business net profit including both the employee and employer portions of FICA.',
      'Estimate the tax savings from the qualified business income deduction and the deductible half of self-employment tax.',
      'Plan estimated quarterly tax payments by understanding your total SE tax liability alongside your income tax obligation.',
    ],
    explanation:
      'Self-employment tax is the self-employed person\'s equivalent of FICA (Social Security + Medicare). While employees split FICA 50/50 with their employer (each pays 7.65%), the self-employed pay both halves (15.3%). However, you can deduct the employer-half as an above-the-line adjustment on Form 1040, effectively reducing income tax but not the SE tax itself. The 92.35% multiplier accounts for this deduction. For 2026, the Social Security wage base is $176,100 — any SE earnings above this are only subject to the 2.9% Medicare portion.',
    faqs: [
      {
        question: 'Why does only 92.35% of my net profit get taxed for SE tax?',
        answer:
          'The 92.35% figure accounts for the fact that you can deduct half of your SE tax as an adjustment on Form 1040. Since this deduction reduces both your income tax and (conceptually) your SE earnings base, the IRS applies the 92.35% factor to approximate the net effect.',
      },
      {
        question: 'Does the QBI deduction reduce self-employment tax?',
        answer:
          'No. The QBI deduction (Section 199A) reduces your income tax, not your self-employment tax. SE tax is calculated on your net profit regardless of the QBI deduction. However, the QBI deduction can significantly reduce your overall tax bill, which is why this calculator shows it as a separate savings line.',
      },
      {
        question: 'What if I have both W-2 wages and 1099 income?',
        answer:
          'Your W-2 wages count toward the Social Security wage base ($176,100 for 2026). If your W-2 wages already exceed the wage base, you owe $0 SS tax on your SE income. If not, the remaining wage base is available for your SE income. Medicare tax has no cap, so you always owe the 2.9% Medicare portion on SE earnings regardless of W-2 income.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
  
    workedExamples: [
      {
        scenario: 'Elena is a freelance graphic designer in Austin with $100,000 in net profit (after business expenses). She has no W-2 income and wants to understand her self-employment tax liability and how the QBI deduction helps.',
        inputs: {
          'Net Profit from Self-Employment': '$100,000',
          'W-2 Wages (if applicable)': '0',
          'Qualified Business Income (QBI) Deduction': 'Yes — Apply QBI deduction (simplified 20%)',
        },
        result: 'Total SECA Tax: $14,129.55. Social Security Portion: $11,451.40 (12.4% of $92,350). Medicare Portion: $2,678.15 (2.9% of $92,350). Effective SE Tax Rate: 14.13%. Deductible Half: $7,064.78. Estimated QBI Savings: $4,400. Total Combined Income: $100,000.',
        insight: 'Elena owes $14,130 in self-employment tax — the equivalent of both the employee (7.65%) and employer (7.65%) halves of FICA. Her effective SE tax rate is 14.13% rather than 15.3% because of the 92.35% multiplier. She can deduct $7,065 (half) on her Form 1040 as an above-the-line adjustment, which reduces her income tax but not the SE tax itself. The QBI deduction saves her an estimated $4,400 in income tax (20% of $100K at an assumed 22% marginal rate). Combined, Elena should set aside roughly 25-30% of her net profit for federal taxes (SE tax + income tax) and make quarterly estimated payments to avoid underpayment penalties.',
      },
      {
        scenario: 'Raj is a software consultant in Seattle with $180,000 in 1099 income and $45,000 in W-2 wages from a part-time teaching position. He wants to understand how his W-2 wages affect his SE tax on the 1099 income.',
        inputs: {
          'Net Profit from Self-Employment': '$180,000',
          'W-2 Wages (if applicable)': '45,000',
          'Qualified Business Income (QBI) Deduction': 'Yes — Apply QBI deduction (simplified 20%)',
        },
        result: 'Total SECA Tax: $21,077.07. Social Security Portion: $16,256.40 (12.4% of $131,100). Medicare Portion: $4,820.67 (2.9% of $166,230). Effective SE Tax Rate: 11.71%. Deductible Half: $10,538.54. Estimated QBI Savings: $7,920. Total Combined Income: $225,000.',
        insight: 'Raj\'s W-2 wages of $45,000 have already used $45K of the Social Security wage base ($176,100 for 2026). Only $131,100 of the wage base remains available for his SE income. His SE earnings base is $166,230 ($180K × 92.35%), but only $131,100 of it is subject to the 12.4% Social Security portion — the rest escapes Social Security tax entirely. His effective SE tax rate drops to 11.71% (down from the full 14.13% Elena pays with no W-2 offset). The Medicare portion of 2.9% applies to the full SE earnings base with no cap. His total combined income of $225K puts him above the $200K threshold where the additional 0.9% Medicare surtax may apply on earned income — though this simplified calculator does not model that surtax.',
      },
    ],

    proTips: [
      'Set aside 25-30% of your net profit for self-employment tax + federal income tax, and pay quarterly estimated taxes (due April 15, June 15, September 15, January 15). Missing quarterly deadlines triggers underpayment penalties even if you pay in full by April.',
      'The deductible half of SE tax is an above-the-line deduction — it reduces your AGI dollar-for-dollar, which can also help you qualify for other tax benefits with AGI phaseouts (IRA deductions, student loan interest deduction, child tax credit).',
      'If your net profit exceeds the Social Security wage base ($176,100 in 2026), only the Medicare portion (2.9%) applies above that threshold. High-earning freelancers effectively get a 12.4% tax cut on income above the cap — the SE tax rate drops from 15.3% to 2.9%.',
      'Consider forming an S-Corp if your net profit consistently exceeds $60,000-$80,000. An S-Corp allows you to pay yourself a "reasonable salary" (subject to FICA) and take the remainder as distributions (not subject to SE tax). The savings can be thousands per year but requires payroll administration and corporate tax filings.',
    ],

    quickReference: [
      { label: 'SECA Rate', value: '15.3% (12.4% SS + 2.9% Medicare)' },
      { label: 'SE Earnings Multiplier', value: '92.35% of net profit' },
      { label: 'SS Wage Base (2026)', value: '$176,100' },
      { label: 'Medicare Cap', value: 'No cap — 2.9% on all SE earnings' },
      { label: 'Deductible Half', value: 'Above-the-line, Form 1040 adjustment' },
      { label: '$100K net profit', value: '~$14,130 SE tax (effective ~14.1%)' },
      { label: 'Additional Medicare', value: '0.9% above $200K/$250K (not modeled)' },
    ],

    limitations: [
      'The QBI deduction estimate uses a simplified 20% at 22% marginal rate. In reality, the QBI deduction is the lesser of 20% of QBI or 20% of taxable income, and phases out for high earners in specified service trades (SSTBs like doctors, lawyers, consultants above certain income thresholds). The actual savings depend on your specific tax situation.',
      'Does not model the 0.9% Additional Medicare Tax on earned income above $200,000 (single) or $250,000 (MFJ). For high-earning self-employed individuals, this surtax adds meaningfully to the total SE tax burden on income above those thresholds.',
      'The interaction between W-2 wages and the SE Social Security wage base is simplified. It assumes W-2 wages consume the wage base first, which is correct for the employee portion but the employer portion of FICA on W-2 wages does not count toward the SE wage base.',
      'Does not account for self-employed health insurance deduction, SEP IRA or Solo 401(k) contributions, home office deduction, or business use of vehicle — all of which reduce both your net profit (and thus SE tax) and your income tax liability.',
    ],
citations: [
    { source: 'IRS Publication 334', url: 'https://www.irs.gov/publications/p334' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/s/selfemploymenttax.asp' },
  ],
  },
};

export default selfEmploymentTaxConfig;
