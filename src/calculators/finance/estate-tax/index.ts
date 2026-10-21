import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult, ExplainStep } from '../../../types/calculator';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';
import EstateTaxPanel from './EstateTaxPanel';

import { computeEstate, FEDERAL_EXEMPTION, TAX_YEAR, STATE_EXEMPTIONS, STATE_AVG_RATE_FACTOR } from './estateMath';

const estateTaxSvg = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="4"/><text x="160" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Estate Tax: Only Above Exemption</text><rect x="30" y="30" width="260" height="28" rx="4" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="160" y="49" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-1e40af)">Gross Estate: $20M</text><line x1="160" y1="58" x2="160" y2="66" stroke="var(--svg-64748b)" stroke-width="1.5"/><rect x="30" y="66" width="25" height="22" rx="3" fill="var(--svg-f59e0b)"/><text x="42" y="82" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ffffff)">Debts</text><rect x="58" y="66" width="170" height="22" rx="3" fill="var(--svg-22c55e)"/><text x="143" y="82" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ffffff)">Federal Exemption: $15M</text><rect x="232" y="66" width="58" height="22" rx="3" fill="var(--svg-ef4444)"/><text x="261" y="82" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ffffff)">Taxable</text><text x="160" y="105" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ef4444)">Taxable = $20M - $0.2M - $15M = $4.8M</text><rect x="30" y="114" width="260" height="36" rx="6" fill="var(--svg-f1f5f9)"/><text x="160" y="130" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-1e293b)">40% on the portion above the exemption</text><text x="160" y="146" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">Est. Tax ~$1.9M | Net to Heirs ~$17.9M</text><rect x="30" y="158" width="260" height="28" rx="6" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="160" y="172" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-1e40af)">99.9% of estates pay $0 federal estate tax</text><text x="160" y="184" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">State taxes may apply at much lower thresholds ($1M-$7M)</text></svg>';

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
      helpText: 'Married couples can combine exemptions via portability, effectively doubling the federal exemption to $30M (this assumes the first spouse made a portability election on Form 706).',
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
      helpText: 'Added to the estate above (married only), because estate tax is assessed on the combined estate at the second death. Leave 0 if the Total Gross Estate Value already includes it.',
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
      helpText: '12 states plus DC levy estate taxes with exemptions from about $1M to $15M (Connecticut). Most states have no estate tax.',
    },
  ],
  explainSteps: (values) => {
    const rows = estateTaxConfig.calculate(values);
    const totalAssets = parseFloat(values.totalAssets) || 0;
    if (!rows.length || totalAssets <= 0) return [];
    const married = (values.filingStatus || 'single') === 'married';
    const debts = Math.max(0, parseFloat(values.debtsDeductions) || 0);
    const spouseEstate = Math.max(0, parseFloat(values.spouseEstate) || 0);
    const est = computeEstate({ totalAssets, debts, married, spouseEstate: parseFloat(values.spouseEstate) || 0, stateKey: values.stateResidence || 'none' });
    const m = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    const steps: ExplainStep[] = [
      {
        label: 'Add up the gross estate and subtract debts',
        expr: `${m(totalAssets)}${married && spouseEstate > 0 ? ` + ${m(spouseEstate)} surviving spouse's estate` : ''} − ${m(debts)} debts and deductions = ${m(est.adjusted)}`,
        note: married ? 'For a married couple the tax is assessed on the combined estate at the second death.' : undefined,
      },
      {
        label: `Find the ${TAX_YEAR} federal exemption`,
        expr: `${m(FEDERAL_EXEMPTION)}${married ? ` × 2 spouses (portability) = ${m(est.exemption)}` : ' for one person'}`,
        note: 'Only the part of the estate above the exemption is taxed. Exemptions are set by current law and can change.',
      },
    ];
    if (est.state.topRate > 0) {
      steps.push({
        label: `Estimate ${est.state.name} estate tax`,
        expr: `max(0, ${m(est.adjusted)} − ${m(est.state.exemption)} state exemption) × ${est.state.topRate}% top rate × ${STATE_AVG_RATE_FACTOR} = ${m(est.stateTax)}`,
        note: 'State schedules are graduated, so the calculator uses half the top rate as a planning approximation.',
      });
    }
    steps.push({
      label: 'Subtract state tax, then the exemption, to get the federal taxable estate',
      expr: `${m(est.adjusted)} − ${m(est.stateTax)} state tax = ${m(est.federalBase)} · ${m(est.federalBase)} − ${m(est.exemption)} exemption = ${m(est.federalTaxable)}`,
      note: 'State death taxes paid are deductible from the federal estate.',
    });
    steps.push(
      est.federalTaxable > 0
        ? {
            label: 'Apply the federal rate to the amount over the exemption',
            expr: `${m(est.federalTaxable)} × 40% = ${m(est.federalTax)}`,
            note: 'The unified credit cancels the lower rate bands, leaving the top 40% rate on the excess.',
          }
        : { label: 'Apply the federal rate to the amount over the exemption', expr: `Nothing is above the exemption, so federal estate tax = $0` },
    );
    steps.push({
      label: 'Total tax and what heirs receive',
      expr: `${m(est.federalTax)} federal + ${m(est.stateTax)} state = ${m(est.totalTax)}${est.totalTax > 0 ? ` (shown as ${resultValue(rows, 'totalTax')})` : ''} · ${m(est.adjusted)} − ${m(est.totalTax)} = ${m(est.netToHeirs)} to heirs (${resultValue(rows, 'netToHeirs')})`,
    });
    return finiteSteps(steps);
  },

  calculate: (values) => {
    const totalAssets = parseFloat(values.totalAssets) || 0;
    const filingStatus = values.filingStatus || 'single';
    if (totalAssets <= 0) return [];

    const est = computeEstate({
      totalAssets,
      debts: Math.max(0, parseFloat(values.debtsDeductions) || 0),
      married: filingStatus === 'married',
      spouseEstate: parseFloat(values.spouseEstate) || 0,
      stateKey: values.stateResidence || 'none',
    });
    const { adjusted: adjustedEstate, exemption: federalExemption, federalTaxable: federalTaxableEstate, federalTax } = est;
    const stateInfo = est.state;
    const estimatedStateTax = est.stateTax;
    const totalTax = est.totalTax;
    const netToHeirsFinal = est.netToHeirs;
    const effectiveRate = est.effectiveRate;
    const belowExemption = federalTaxableEstate <= 0;

    const fmtM = (n: number) => {
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
      return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

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
    formula: 'Federal Tax = 40% × (Gross Estate − Debts − State Estate Tax − Exemption), exemption $15M in 2026',
    diagram: {
      svg: estateTaxSvg,
      alt: 'Estate tax stacked bar showing a $20M gross estate split into a $0.2M debts deduction, the $15M federal exemption, and the $4.8M taxable portion, taxed at 40%',
      caption: 'Only about 0.1% of estates owe federal estate tax — $15M per individual is exempt in 2026, though state taxes may apply at lower thresholds',
    },
    formulaDescription: `Federal estate tax uses the unified rate schedule (18% to 40%), and the exemption works as a credit equal to the tax on the exemption amount, so every dollar of the estate above the exemption is taxed at 40%. State estate tax paid is deductible from the federal taxable estate (IRC §2058). For ${TAX_YEAR}, the federal exemption is $${(FEDERAL_EXEMPTION / 1_000_000).toFixed(2)} million per individual ($${((FEDERAL_EXEMPTION * 2) / 1_000_000).toFixed(2)}M for married couples using portability).`,
    variables: [
      { symbol: '$15M', name: `${TAX_YEAR} Federal Exemption`, description: `The IRS allows each person to transfer up to $${(FEDERAL_EXEMPTION / 1_000_000).toFixed(2)} million tax-free. Estates below this amount owe zero federal estate tax. The One Big Beautiful Bill Act (OBBBA), signed in 2025, made this elevated exemption permanent starting in 2026 (inflation-indexed thereafter), replacing the prior law's scheduled sunset to roughly $7M.` },
      { symbol: 'Portability', name: 'Married Couple Exemption', description: 'Married couples can combine exemptions via a "portability election" on the first spouse\'s estate return, effectively doubling the exemption. This requires filing a federal estate tax return (Form 706) even if no tax is owed.' },
      { symbol: 'DSUE', name: 'Deceased Spouse Unused Exclusion', description: 'The portability amount — the unused portion of the first spouse\'s exemption that can be transferred to the surviving spouse. Must be elected on a timely filed Form 706.' },
    ],
    howToUse: [
      'Enter the total fair market value of all assets: real estate, investments, retirement accounts, business interests, life insurance.',
      'Subtract known debts and deductions (mortgages, funeral costs, admin fees).',
      'Select filing status — for a married couple, enter the estate in the main field and the surviving spouse\'s own estate in the spouse field. The combined estate gets double the federal exemption at the second death.',
      'Select your state — 12 states plus DC levy their own estate taxes with lower exemptions.',
      'If your estate is below the federal exemption, you owe $0 in federal estate tax.',
    ],
    commonUses: [
      'Estimate whether your estate exceeds the federal exemption threshold and calculate the potential estate tax liability for your heirs.',
      'Compare how different filing statuses and state estate tax thresholds affect the total tax burden on your estate.',
      'Plan estate reduction strategies by understanding how the 40% rate applies to every dollar above the exemption.',
    ],
    explanation:
      `Only about 0.1% of estates actually owe federal estate tax — estates must exceed $${(FEDERAL_EXEMPTION / 1_000_000).toFixed(2)} million (${TAX_YEAR}) before any federal tax applies. However, state estate taxes can apply at much lower thresholds: Oregon taxes estates above $1 million, Massachusetts above $2 million. This calculator uses the ${TAX_YEAR} federal exemption of $${(FEDERAL_EXEMPTION / 1_000_000).toFixed(2)}M, made permanent (and inflation-indexed) by the One Big Beautiful Bill Act — the exemption is no longer scheduled to sunset back to roughly $7M as it was under prior law. Consult an estate planning attorney for current law status.`,
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
        answer: 'The One Big Beautiful Bill Act (OBBBA), signed in 2025, permanently set the exemption at $15M per person starting in 2026 (inflation-indexed thereafter), replacing the prior law under which the elevated Tax Cuts and Jobs Act exemption was scheduled to sunset to roughly $7M. Future Congresses could still change the law, so consult an estate planning attorney for the most current information.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
  
    workedExamples: [
      {
        scenario: 'Robert Chen, a widower in Portland, OR, has a gross estate valued at $5.8 million including his home, investment accounts, and a small business. After subtracting $350,000 in remaining mortgage debt and funeral expenses, he wants to know if his heirs will owe federal estate tax. Oregon has a $1M state exemption and a top rate of 16%.',
        inputs: { totalAssets: '5800000', debtsDeductions: '350000', filingStatus: 'single', stateResidence: 'OR' },
        result: 'Adjusted gross estate: $5.45M. Federal taxable estate: $0 (well below the $15M individual exemption). However, Oregon state taxable estate: $4.45M ($5.45M minus $1M state exemption). Estimated Oregon estate tax: approximately $356,000. Net to heirs: roughly $5.09M.',
        insight: 'Robert\'s estate owes zero federal estate tax — like 99.9% of estates — but faces a significant state estate tax bill in Oregon. This is a critical planning insight: even estates far below the federal exemption can trigger state estate taxes in the 12 states (plus DC) that levy their own estate taxes with much lower thresholds. Robert should consult an estate planning attorney about strategies like irrevocable life insurance trusts (ILITs) or gifting programs to reduce his Oregon taxable estate, as Oregon\'s $1M exemption is one of the lowest in the country.',
      },
      {
        scenario: 'Margaret and Thomas Sullivan in Greenwich, CT have a combined estate of $18.5 million including a primary residence worth $3.2M, a vacation home in Florida worth $1.8M, investment portfolios valued at $11M, and life insurance policies. They have $600,000 in debts and want to know their estate tax exposure as a married couple with portability.',
        inputs: { totalAssets: '18500000', debtsDeductions: '600000', filingStatus: 'married', stateResidence: 'CT' },
        result: 'Adjusted gross estate: $17.9M. Federal exemption (married with portability): $30M. Federal taxable estate: $0. Connecticut exemption: $15M. CT taxable estate: $2.9M. Estimated CT estate tax: approximately $174,000. Net to heirs: roughly $17.73M.',
        insight: 'The Sullivans benefit from the married exemption, which doubles the federal exemption to $30M — far above their $17.9M adjusted estate. However, Connecticut\'s estate tax matches the federal exemption ($15M in 2026) but does not allow portability at the state level (each spouse\'s CT exemption is not transferable). This means at the second death, the entire $17.9M faces the Connecticut estate tax with only a single $15M exemption. This scenario highlights why wealthy couples in state-estate-tax jurisdictions need careful planning — the federal exemption may shield you, but state taxes can still take a substantial bite. Credit shelter trusts (bypass trusts) are a common tool to preserve both spouses\' state exemptions.',
      },
    ],

    proTips: [
      'If you are married, make sure the executor of the first spouse\'s estate files IRS Form 706 to elect portability — even if no tax is owed. Without this election, the deceased spouse\'s unused exemption (up to $15M) is permanently lost. The return is due 9 months after death (6-month automatic extension available), and Rev. Proc. 2022-32 allows a late portability-only filing up to the fifth anniversary of death.',
      'The annual gift exclusion ($19,000 per recipient in 2026) lets you reduce your estate tax-free over time without touching your lifetime exemption. A married couple with three children can gift $114,000 per year ($19,000 × 2 parents × 3 children) without filing a gift tax return — that is over $1M removed from the estate over a decade.',
      'Life insurance proceeds are included in your gross estate if you own the policy at death. To exclude them, place the policy in an Irrevocable Life Insurance Trust (ILIT) — the trust owns the policy, not you, so the death benefit passes to heirs outside your taxable estate.',
      'The One Big Beautiful Bill Act permanently set the federal exemption at $15M per person starting in 2026, so the previously-planned sunset to ~$7M no longer applies. If your estate is well above $15M ($30M married), large lifetime gifts, ILITs, and other trust strategies still matter for reducing what is exposed to the 40% top rate — the IRS has confirmed it will not claw back gifts made under a higher prior-year exemption.',
    ],

    quickReference: [
      { label: 'Federal Exemption (2026 Individual)', value: '$15,000,000 — applies to estate + lifetime gifts combined' },
      { label: 'Federal Exemption (2026 Married)', value: '$30,000,000 — with portability election on first spouse\'s Form 706' },
      { label: 'Top Federal Estate Tax Rate', value: '40% — applied only to the portion above the exemption' },
      { label: 'Lowest State Exemption', value: 'Oregon: $1,000,000 (Rhode Island: ~$1.84M, Massachusetts: $2,000,000, Minnesota/Washington: $3,000,000)' },
      { label: 'Estates Owing Federal Tax', value: 'A very small fraction of all estates (well under 1%)' },
      { label: 'Annual Gift Exclusion (2026)', value: '$19,000 per recipient per year (does not count against lifetime exemption)' },
      { label: 'Unlimited Marital Deduction', value: 'Spouses who are US citizens inherit unlimited amounts free of federal estate tax' },
      { label: 'OBBBA Permanence', value: 'The $15M exemption is now permanent (indexed for inflation) — the previously-scheduled sunset to ~$7M no longer applies' },
    ],

    limitations: [
      'This calculator uses the 2026 federal exemption of $15M, made permanent (and inflation-indexed) by the One Big Beautiful Bill Act. Always verify the current exemption amount before making planning decisions, since future legislation could still change it.',
      'State estate tax is a rough planning estimate: half of the state\'s top rate applied to the estate above its exemption (a convention of this calculator, not a statutory figure). Actual state estate taxes use graduated schedules, and many states have special credits, cliffs (New York), or different rules for non-residents with property in the state; state exemptions are also indexed and some sources disagree on the 2026 figures, so confirm with your state revenue department.',
      'Federal tax is computed on the estate after deducting the estimated state estate tax (IRC §2058). For married couples the calculator assumes the first spouse\'s full exemption was ported to the survivor, and assumes the combined estate is taxed at the second death.',
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
