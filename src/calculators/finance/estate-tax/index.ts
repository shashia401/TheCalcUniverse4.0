import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import EstateTaxPanel from './EstateTaxPanel';

const FEDERAL_EXEMPTION_2025 = 13_990_000;
const TAX_YEAR = 2025;

const STATE_EXEMPTIONS: Record<string, { name: string; exemption: number; topRate: number }> = {
  'none': { name: 'No State Estate Tax', exemption: 0, topRate: 0 },
  'CT': { name: 'Connecticut', exemption: 13_610_000, topRate: 12 },
  'HI': { name: 'Hawaii', exemption: 5_490_000, topRate: 20 },
  'IL': { name: 'Illinois', exemption: 4_000_000, topRate: 16 },
  'ME': { name: 'Maine', exemption: 6_800_000, topRate: 12 },
  'MD': { name: 'Maryland', exemption: 5_000_000, topRate: 16 },
  'MA': { name: 'Massachusetts', exemption: 2_000_000, topRate: 16 },
  'MN': { name: 'Minnesota', exemption: 3_000_000, topRate: 16 },
  'NY': { name: 'New York', exemption: 7_160_000, topRate: 16 },
  'OR': { name: 'Oregon', exemption: 1_000_000, topRate: 16 },
  'RI': { name: 'Rhode Island', exemption: 1_774_583, topRate: 16 },
  'VT': { name: 'Vermont', exemption: 5_000_000, topRate: 16 },
  'WA': { name: 'Washington', exemption: 2_193_000, topRate: 20 },
  'DC': { name: 'Washington D.C.', exemption: 4_716_000, topRate: 16 },
};

function calcFederalEstateTax(taxableEstate: number): number {
  if (taxableEstate <= 0) return 0;
  const brackets = [
    { min: 0, max: 10_000, rate: 0.18 },
    { min: 10_000, max: 20_000, rate: 0.20 },
    { min: 20_000, max: 40_000, rate: 0.22 },
    { min: 40_000, max: 60_000, rate: 0.24 },
    { min: 60_000, max: 80_000, rate: 0.26 },
    { min: 80_000, max: 100_000, rate: 0.28 },
    { min: 100_000, max: 150_000, rate: 0.30 },
    { min: 150_000, max: 250_000, rate: 0.32 },
    { min: 250_000, max: 500_000, rate: 0.34 },
    { min: 500_000, max: 750_000, rate: 0.37 },
    { min: 750_000, max: 1_000_000, rate: 0.39 },
    { min: 1_000_000, max: Infinity, rate: 0.40 },
  ];
  let tax = 0;
  for (const b of brackets) {
    if (taxableEstate <= b.min) break;
    tax += (Math.min(taxableEstate, b.max) - b.min) * b.rate;
  }
  return tax;
}

const estateTaxSvg = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="4"/><text x="160" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Estate Tax: Only Above Exemption</text><rect x="30" y="30" width="260" height="28" rx="4" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="160" y="49" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-1e40af)">Gross Estate: $20M</text><line x1="160" y1="58" x2="160" y2="66" stroke="var(--svg-64748b)" stroke-width="1.5"/><rect x="30" y="66" width="25" height="22" rx="3" fill="var(--svg-f59e0b)"/><text x="42" y="82" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ffffff)">Debts</text><rect x="58" y="66" width="170" height="22" rx="3" fill="var(--svg-22c55e)"/><text x="143" y="82" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ffffff)">Federal Exemption: $13.99M</text><rect x="232" y="66" width="58" height="22" rx="3" fill="var(--svg-ef4444)"/><text x="261" y="82" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ffffff)">Taxable</text><text x="160" y="105" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ef4444)">Taxable = $20M - $0.2M - $13.99M = $5.81M</text><rect x="30" y="114" width="260" height="36" rx="6" fill="var(--svg-f1f5f9)"/><text x="160" y="130" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-1e293b)">Graduated rate up to 40% on taxable portion</text><text x="160" y="146" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">Est. Tax ~$2.3M | Net to Heirs ~$17.5M</text><rect x="30" y="158" width="260" height="28" rx="6" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="160" y="172" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-1e40af)">99.9% of estates pay $0 federal estate tax</text><text x="160" y="184" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">State taxes may apply at much lower thresholds ($1M-$7M)</text></svg>';

const estateTaxConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'totalAssets',
      label: 'Total Gross Estate Value',
      type: 'number',
      placeholder: '5,000,000',
      prefix: '$',
      min: 0,
      step: 10000,
      required: true,
      helpText: 'Real estate, cash, investments, retirement accounts, business interests, life insurance proceeds, personal property',
    },
    {
      id: 'debtsDeductions',
      label: 'Debts & Deductions',
      type: 'number',
      placeholder: '200,000',
      prefix: '$',
      min: 0,
      step: 10000,
      helpText: 'Mortgages, debts, funeral expenses, administrative costs. These reduce the taxable estate.',
    },
    {
      id: 'filingStatus',
      label: 'Filing Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Single / Unmarried', value: 'single' },
        { label: 'Married (portability election available)', value: 'married' },
      ],
      helpText: 'Married couples can combine exemptions via portability, effectively doubling the federal exemption.',
    },
    {
      id: 'spouseEstate',
      label: 'Surviving Spouse\'s Own Estate (if married)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 10000,
      helpText: 'Used to calculate combined exposure at the second death. Leave 0 if unknown.',
    },
    {
      id: 'stateResidence',
      label: 'State of Residence',
      type: 'select',
      required: true,
      options: [
        { label: 'No state estate tax (most states)', value: 'none' },
        { label: 'Connecticut', value: 'CT' },
        { label: 'Hawaii', value: 'HI' },
        { label: 'Illinois', value: 'IL' },
        { label: 'Maine', value: 'ME' },
        { label: 'Maryland', value: 'MD' },
        { label: 'Massachusetts', value: 'MA' },
        { label: 'Minnesota', value: 'MN' },
        { label: 'New York', value: 'NY' },
        { label: 'Oregon', value: 'OR' },
        { label: 'Rhode Island', value: 'RI' },
        { label: 'Vermont', value: 'VT' },
        { label: 'Washington', value: 'WA' },
        { label: 'Washington D.C.', value: 'DC' },
      ],
      helpText: '12 states plus DC levy estate taxes with exemptions from $1M to $13.61M. Most states have no estate tax.',
    },
  ],
  calculate: (values) => {
    const totalAssets = parseFloat(values.totalAssets) || 0;
    const debtsDeductions = parseFloat(values.debtsDeductions) || 0;
    const filingStatus = values.filingStatus || 'single';
    const stateKey = values.stateResidence || 'none';

    if (totalAssets <= 0) return [];

    const grossEstate = totalAssets;
    const adjustedEstate = Math.max(0, grossEstate - debtsDeductions);

    const federalExemption = filingStatus === 'married'
      ? FEDERAL_EXEMPTION_2025 * 2
      : FEDERAL_EXEMPTION_2025;

    const federalTaxableEstate = Math.max(0, adjustedEstate - federalExemption);
    const federalTax = calcFederalEstateTax(federalTaxableEstate);

    const stateInfo = STATE_EXEMPTIONS[stateKey] || STATE_EXEMPTIONS['none'];
    const stateTaxableEstate = stateInfo.topRate > 0
      ? Math.max(0, adjustedEstate - stateInfo.exemption)
      : 0;
    const estimatedStateTax = stateInfo.topRate > 0
      ? stateTaxableEstate * (stateInfo.topRate / 100) * 0.5
      : 0;

    const totalTax = federalTax + estimatedStateTax;
    const netToHeirsFinal = adjustedEstate - totalTax;

    const fmtM = (n: number) => {
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
      return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

    const effectiveRate = adjustedEstate > 0 ? (totalTax / adjustedEstate) * 100 : 0;
    const belowExemption = federalTaxableEstate <= 0;

    const results: CalculatorResult[] = [
      {
        id: 'notice',
        label: `${TAX_YEAR} Federal Exemption (${filingStatus === 'married' ? 'Married Couple' : 'Individual'})`,
        value: fmtM(federalExemption),
        color: 'neutral' as const,
      },
      {
        id: 'adjustedEstate',
        label: 'Adjusted Gross Estate (after debts)',
        value: fmtM(adjustedEstate),
        color: 'neutral' as const,
      },
      {
        id: 'federalTaxableEstate',
        label: 'Federal Taxable Estate (above exemption)',
        value: belowExemption ? '$0 — Below exemption threshold' : fmtM(federalTaxableEstate),
        highlight: belowExemption,
        color: belowExemption ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'federalTax',
        label: 'Estimated Federal Estate Tax',
        value: federalTax > 0 ? fmtM(federalTax) : '$0',
        highlight: !belowExemption,
        color: federalTax > 0 ? 'negative' as const : 'positive' as const,
      },
    ];

    if (stateInfo.topRate > 0) {
      results.push({
        id: 'stateExemption',
        label: `${stateInfo.name} State Exemption`,
        value: fmtM(stateInfo.exemption),
        color: 'neutral' as const,
      });
      results.push({
        id: 'stateTax',
        label: `Est. ${stateInfo.name} Estate Tax (approx.)`,
        value: estimatedStateTax > 0 ? fmtM(estimatedStateTax) : '$0',
        color: estimatedStateTax > 0 ? 'negative' as const : 'positive' as const,
      });
    }

    results.push({
      id: 'totalTax',
      label: 'Total Estimated Estate Tax',
      value: totalTax > 0 ? fmtM(totalTax) : '$0 — Estate is below exemption',
      highlight: true,
      interpretation: totalTax > 0
        ? `This is due within 9 months of death, which can force a quick sale of illiquid assets (a business, real estate) if there's no liquidity plan. Trusts, gifting strategies, and life insurance are common ways to reduce or pre-fund this — worth a conversation with an estate attorney well before it's owed.`
        : `Your estate falls below the exemption threshold, so no federal estate tax is owed at these numbers. Exemptions are set by current law and can change — revisit this periodically, especially after major asset growth.`,
      color: totalTax > 0 ? 'negative' as const : 'positive' as const,
    });
    results.push({
      id: 'netToHeirs',
      label: 'Estimated Net Value to Heirs',
      value: fmtM(netToHeirsFinal),
      color: 'positive' as const,
    });
    if (totalTax > 0) {
      results.push({
        id: 'effectiveRate',
        label: 'Effective Estate Tax Rate',
        value: `${effectiveRate.toFixed(2)}%`,
        color: 'neutral' as const,
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(EstateTaxPanel, { values, results });
  },
  educational: {
    formula: 'Taxable Estate = Gross Estate − Debts − Federal Exemption ($13.99M in 2025)',
    diagram: {
      svg: estateTaxSvg,
      alt: 'Estate tax stacked bar showing gross estate split into debts deduction, federal exemption of alt: 3.99M, and taxable portion only for amounts above the exemption',
      caption: 'Only about 0.1% of estates owe federal estate tax - the first caption: 3.99M per individual is exempt in 2025, though state taxes may apply at lower thresholds',
    },
    formulaDescription: `Federal estate tax applies a graduated rate (up to 40%) only on the portion of the estate exceeding the exemption. For ${TAX_YEAR}, the federal exemption is $${(FEDERAL_EXEMPTION_2025 / 1_000_000).toFixed(2)} million per individual ($${((FEDERAL_EXEMPTION_2025 * 2) / 1_000_000).toFixed(2)}M for married couples using portability).`,
    variables: [
      { symbol: '$13.99M', name: `${TAX_YEAR} Federal Exemption`, description: `The IRS allows each person to transfer up to $${(FEDERAL_EXEMPTION_2025 / 1_000_000).toFixed(2)} million tax-free. Estates below this amount owe zero federal estate tax. This limit is scheduled to sunset to approximately $7M (inflation-adjusted) after 2025 unless Congress acts.` },
      { symbol: 'Portability', name: 'Married Couple Exemption', description: 'Married couples can combine exemptions via a "portability election" on the first spouse\'s estate return, effectively doubling the exemption. This requires filing a federal estate tax return (Form 706) even if no tax is owed.' },
      { symbol: 'DSUE', name: 'Deceased Spouse Unused Exclusion', description: 'The portability amount — the unused portion of the first spouse\'s exemption that can be transferred to the surviving spouse. Must be elected on a timely filed Form 706.' },
    ],
    howToUse: [
      'Enter the total fair market value of all assets: real estate, investments, retirement accounts, business interests, life insurance.',
      'Subtract known debts and deductions (mortgages, funeral costs, admin fees).',
      'Select filing status — married couples effectively have double the federal exemption.',
      'Select your state — 12 states plus DC levy their own estate taxes with lower exemptions.',
      'If your estate is below the federal exemption, you owe $0 in federal estate tax.',
    ],
    commonUses: [
      'Estimate whether your estate exceeds the federal exemption threshold and calculate the potential estate tax liability for your heirs.',
      'Compare how different filing statuses and state estate tax thresholds affect the total tax burden on your estate.',
      'Plan estate reduction strategies by understanding how the progressive estate tax rates apply to assets above the exemption limit.',
    ],
    explanation:
      `Only about 0.1% of estates actually owe federal estate tax — estates must exceed $${(FEDERAL_EXEMPTION_2025 / 1_000_000).toFixed(2)} million (2025) before any federal tax applies. However, state estate taxes can apply at much lower thresholds: Oregon taxes estates above $1 million, Massachusetts above $2 million. IMPORTANT NOTE: This calculator uses the ${TAX_YEAR} federal exemption of $${(FEDERAL_EXEMPTION_2025 / 1_000_000).toFixed(2)}M. The Tax Cuts and Jobs Act provisions are scheduled to sunset after 2025, which could reduce the exemption to approximately $7M. Consult an estate planning attorney for current law status.`,
    faqs: [
      {
        question: 'What is included in a taxable estate?',
        answer: 'The gross estate includes virtually all assets: real property (including primary residence), bank and investment accounts, retirement accounts (401k, IRA), life insurance proceeds (if you own the policy), business interests, vehicles, jewelry, art, and other personal property at fair market value. Debts, mortgages, funeral expenses, and charitable contributions are deductible.',
      },
      {
        question: 'Does my spouse inherit tax-free?',
        answer: 'Yes. The unlimited marital deduction allows spouses who are US citizens to inherit any amount completely free of federal estate tax. Estate tax is assessed at the second death (when the surviving spouse dies), on the combined remaining estate above the exemption. State taxes may differ.',
      },
      {
        question: 'What about the annual gift exclusion?',
        answer: `In ${TAX_YEAR}, you can give up to $19,000 per person per year (the annual gift exclusion) without touching your lifetime estate/gift tax exemption. This is an effective strategy to gradually reduce a large estate tax-free over time.`,
      },
      {
        question: 'Will the exemption change?',
        answer: 'Possibly. The elevated $13.99M exemption (from the 2017 Tax Cuts and Jobs Act) is currently scheduled to sunset at the end of 2025, reverting to approximately $7M (inflation-adjusted). Congress may extend or modify this. Consult an estate planning attorney for the most current information.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
  
    workedExamples: [
      {
        scenario: 'Robert Chen, a widower in Portland, OR, has a gross estate valued at $5.8 million including his home, investment accounts, and a small business. After subtracting $350,000 in remaining mortgage debt and funeral expenses, he wants to know if his heirs will owe federal estate tax. Oregon has a $1M state exemption and a top rate of 16%.',
        inputs: { totalAssets: '5800000', debtsDeductions: '350000', filingStatus: 'single', stateResidence: 'OR' },
        result: 'Adjusted gross estate: $5.45M. Federal taxable estate: $0 (well below the $13.99M individual exemption). However, Oregon state taxable estate: $4.45M ($5.45M minus $1M state exemption). Estimated Oregon estate tax: approximately $356,000. Net to heirs: roughly $5.09M.',
        insight: 'Robert\'s estate owes zero federal estate tax — like 99.9% of estates — but faces a significant state estate tax bill in Oregon. This is a critical planning insight: even estates far below the federal exemption can trigger state estate taxes in the 12 states (plus DC) that levy their own estate taxes with much lower thresholds. Robert should consult an estate planning attorney about strategies like irrevocable life insurance trusts (ILITs) or gifting programs to reduce his Oregon taxable estate, as Oregon\'s $1M exemption is one of the lowest in the country.',
      },
      {
        scenario: 'Margaret and Thomas Sullivan in Greenwich, CT have a combined estate of $18.5 million including a primary residence worth $3.2M, a vacation home in Florida worth $1.8M, investment portfolios valued at $11M, and life insurance policies. They have $600,000 in debts and want to know their estate tax exposure as a married couple with portability.',
        inputs: { totalAssets: '18500000', debtsDeductions: '600000', filingStatus: 'married', stateResidence: 'CT' },
        result: 'Adjusted gross estate: $17.9M. Federal exemption (married with portability): $27.98M. Federal taxable estate: $0. Connecticut exemption: $13.61M. CT taxable estate: $4.29M. Estimated CT estate tax: approximately $257,400. Net to heirs: roughly $17.64M.',
        insight: 'The Sullivans benefit from the married exemption, which doubles the federal exemption to $27.98M — far above their $17.9M adjusted estate. However, Connecticut\'s estate tax uses its own exemption of $13.61M and does not allow portability at the state level (each spouse\'s CT exemption is not transferable). This means at the second death, the entire $17.9M faces the Connecticut estate tax with only a single $13.61M exemption. This scenario highlights why wealthy couples in state-estate-tax jurisdictions need careful planning — the federal exemption may shield you, but state taxes can still take a substantial bite. Credit shelter trusts (bypass trusts) are a common tool to preserve both spouses\' state exemptions.',
      },
    ],

    proTips: [
      'If you are married, make sure the executor of the first spouse\'s estate files IRS Form 706 to elect portability — even if no tax is owed. Without this election, the deceased spouse\'s unused exemption ($13.99M) is permanently lost. The portability election deadline is 9 months after death (with a 6-month automatic extension available).',
      'The annual gift exclusion ($19,000 per recipient in 2025) lets you reduce your estate tax-free over time without touching your lifetime exemption. A married couple with three children can gift $114,000 per year ($19,000 × 2 parents × 3 children) without filing a gift tax return — that is over $1M removed from the estate over a decade.',
      'Life insurance proceeds are included in your gross estate if you own the policy at death. To exclude them, place the policy in an Irrevocable Life Insurance Trust (ILIT) — the trust owns the policy, not you, so the death benefit passes to heirs outside your taxable estate.',
      'The current $13.99M federal exemption is scheduled to sunset at the end of 2025, dropping to approximately $7M (inflation-adjusted). If you have an estate between $7M and $14M, consider making large gifts before the sunset to lock in the higher exemption — the IRS has confirmed it will not claw back gifts made under the higher exemption.',
    ],

    quickReference: [
      { label: 'Federal Exemption (2025 Individual)', value: '$13,990,000 — applies to estate + lifetime gifts combined' },
      { label: 'Federal Exemption (2025 Married)', value: '$27,980,000 — with portability election on first spouse\'s Form 706' },
      { label: 'Top Federal Estate Tax Rate', value: '40% — applied only to the portion above the exemption' },
      { label: 'Lowest State Exemption', value: 'Oregon: $1,000,000 (Massachusetts: $2,000,000, Washington: $2,193,000)' },
      { label: 'Estates Owing Federal Tax', value: '~0.1% of all estates — roughly 2,000 estates per year' },
      { label: 'Annual Gift Exclusion (2025)', value: '$19,000 per recipient per year (does not count against lifetime exemption)' },
      { label: 'Unlimited Marital Deduction', value: 'Spouses who are US citizens inherit unlimited amounts free of federal estate tax' },
      { label: 'Sunset Risk (Post-2025)', value: 'Exemption may drop to ~$7M if Congress does not extend TCJA provisions' },
    ],

    limitations: [
      'This calculator uses the 2025 federal exemption of $13.99M and may not reflect future legislative changes. The Tax Cuts and Jobs Act provisions are scheduled to sunset after 2025, which would approximately halve the federal exemption. Always verify the current exemption amount before making planning decisions.',
      'State estate tax estimates use a simplified calculation (50% of the top rate applied to taxable estate). Actual state estate taxes use graduated brackets similar to federal income tax, and many states have special credits, deductions, or different rules for non-residents with property in the state.',
      'This calculator does not account for lifetime taxable gifts that reduce the available estate tax exemption. If you have made large gifts exceeding the annual exclusion in prior years, your remaining exemption may be lower than the full statutory amount.',
      'It does not model specialized estate planning tools: Qualified Terminable Interest Property (QTIP) trusts, Grantor Retained Annuity Trusts (GRATs), Charitable Remainder Trusts (CRTs), family limited partnerships, or valuation discounts for closely-held business interests — all of which can significantly reduce taxable estate value.',
    ],
citations: [
    { source: 'IRS Form 706', url: 'https://www.irs.gov/forms-pubs/about-form-706' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/e/estatetax.asp' },
  ],
  },
};

export default estateTaxConfig;
