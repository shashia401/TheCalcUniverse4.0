import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult, ExplainStep } from '../../../types/calculator';
import { finiteSteps } from '../../../utils/explainGuard';
import { hasAnswer, resultValue } from '../../../utils/explainResults';
import { FEDERAL_BRACKETS } from '../../../utils/taxData';
import CapitalGainsPanel from './CapitalGainsPanel';

interface LTCGBracket {
  min: number;
  max: number;
  rate: number;
}

// 2026 LTCG brackets per IRS Revenue Procedure 2025-32 (same source as the
// shared ordinary-income brackets in utils/taxData.ts — kept in sync with
// that filing year rather than hardcoded to an older year's thresholds).
function getLTCGBrackets(filingStatus: string): LTCGBracket[] {
  const brackets: Record<string, LTCGBracket[]> = {
    Single: [
      { min: 0, max: 49450, rate: 0 },
      { min: 49451, max: 545500, rate: 15 },
      { min: 545501, max: Infinity, rate: 20 },
    ],
    'Married Filing Jointly': [
      { min: 0, max: 98900, rate: 0 },
      { min: 98901, max: 613700, rate: 15 },
      { min: 613701, max: Infinity, rate: 20 },
    ],
    'Head of Household': [
      { min: 0, max: 66200, rate: 0 },
      { min: 66201, max: 579600, rate: 15 },
      { min: 579601, max: Infinity, rate: 20 },
    ],
  };
  return brackets[filingStatus] || brackets.Single;
}

function getNIITThreshold(filingStatus: string): number {
  const thresholds: Record<string, number> = {
    Single: 200000,
    'Married Filing Jointly': 250000,
    'Head of Household': 200000,
  };
  return thresholds[filingStatus] || 200000;
}

// IRS: long-term means held MORE than one year. The holding period starts the day
// after acquisition, so the first long-term sale date is the day after the next
// calendar anniversary (Feb 29 acquisitions use Feb 28). Counting 365 days instead
// misclassifies sales that span a leap day (e.g. Mar 1 2023 -> Mar 1 2024 is 366 days
// but exactly one year, so still short-term). Dates are 'YYYY-MM-DD' = UTC midnight.
function isLongTerm(purchase: Date, sale: Date): boolean {
  const y = purchase.getUTCFullYear() + 1;
  const m = purchase.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const anniversary = Date.UTC(y, m, Math.min(purchase.getUTCDate(), lastDay));
  return sale.getTime() > anniversary;
}

function daysBetween(d1: Date, d2: Date): number {
  const ms = d2.getTime() - d1.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// Gains stack on top of ordinary income, so each dollar of gain is taxed at
// the rate of the bracket it falls into — not one flat rate for the whole
// gain. Walks the brackets from where ordinary income leaves off, taxing
// only the slice of `gainAmount` inside each one. Returns the total tax and
// the highest marginal rate the gain touched (for the result label).
function stackedBracketTax(
  gainAmount: number,
  ordinaryIncome: number,
  brackets: { ceiling: number; rate: number }[]
): { tax: number; topRate: number; slices: { amount: number; rate: number }[] } {
  const slices: { amount: number; rate: number }[] = [];
  let remaining = gainAmount;
  let floor = ordinaryIncome;
  let prevCeiling = 0;
  let tax = 0;
  let topRate = 0;
  for (const b of brackets) {
    if (remaining <= 0) break;
    if (floor < b.ceiling) {
      const amountInBracket = Math.min(remaining, b.ceiling - Math.max(floor, prevCeiling));
      if (amountInBracket > 0) {
        tax += amountInBracket * (b.rate / 100);
        slices.push({ amount: amountInBracket, rate: b.rate });
        topRate = b.rate;
        remaining -= amountInBracket;
        floor += amountInBracket;
      }
    }
    prevCeiling = b.ceiling;
  }
  return { tax, topRate, slices };
}

/**
 * Federal tax on a positive gain: short-term gains and collectibles use the ordinary brackets
 * (collectibles capped at 28%), long-term gains use the LTCG brackets. Shared by calculate() and explainSteps().
 */
function federalGainTax(gain: number, annualIncome: number, filingStatus: string, assetType: string, isShortTerm: boolean) {
  if (isShortTerm || assetType === 'Collectibles') {
    // Pull the filing-status brackets from the shared, actively-maintained utils/taxData.ts (same fix as
    // income-tax/taxData.ts) instead of a local hardcoded copy.
    const ST_STATUS_MAP: Record<string, keyof typeof FEDERAL_BRACKETS> = {
      Single: 'single',
      'Married Filing Jointly': 'mfj',
      'Head of Household': 'hoh',
    };
    const bracketSet = FEDERAL_BRACKETS[ST_STATUS_MAP[filingStatus] || 'single']
      .map((b) => ({ threshold: b.to, rate: isShortTerm ? b.rate * 100 : Math.min(b.rate * 100, 28) }));
    // Short-term gains stack on top of ordinary income and are taxed bracket-by-bracket like ordinary income.
    return { ...stackedBracketTax(gain, annualIncome, bracketSet.map((b) => ({ ceiling: b.threshold, rate: b.rate }))), kind: isShortTerm ? 'ordinary' as const : 'collectibles' as const };
  }
  // Long-term: only the slice of the gain in each LTCG bracket is taxed at that bracket's rate.
  const brackets = getLTCGBrackets(filingStatus);
  return { ...stackedBracketTax(gain, annualIncome, brackets.map((b) => ({ ceiling: b.max, rate: b.rate }))), kind: 'ltcg' as const };
}


const capitalGainsTaxConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'assetType',
      label: 'Asset Type',
      type: 'select',
      options: [
        { label: 'Stocks', value: 'Stocks' },
        { label: 'Bonds', value: 'Bonds' },
        { label: 'Crypto', value: 'Crypto' },
        { label: 'Real Estate', value: 'Real Estate' },
        { label: 'Collectibles', value: 'Collectibles' },
      ],
      helpText: 'Type of asset being sold. Different asset types may have special tax rules.',
    },
    {
      id: 'purchaseDate',
      label: 'Purchase Date',
      type: 'date',
      required: true,
      helpText: 'Date you acquired the asset. Used to determine if the gain is short-term or long-term.',
    },
    {
      id: 'saleDate',
      label: 'Sale Date',
      type: 'date',
      required: true,
      helpText: 'Date you sold or plan to sell the asset.',
    },
    {
      id: 'costBasis',
      label: 'Cost Basis ($)',
      type: 'number',
      placeholder: '10000',
      inputMode: 'decimal',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'What you originally paid for the asset, including commissions and fees.',
    },
    {
      id: 'saleProceeds',
      label: 'Sale Proceeds ($)',
      type: 'number',
      placeholder: '25000',
      inputMode: 'decimal',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'Total amount received from the sale before taxes.',
    },
    {
      id: 'annualIncome',
      label: 'Annual Ordinary Income ($)',
      type: 'number',
      placeholder: '80000',
      inputMode: 'decimal',
      min: 0,
      required: true,
      helpText: 'Your taxable ordinary income for the year. Used to determine the correct LTCG bracket.',
    },
    {
      id: 'filingStatus',
      label: 'Filing Status',
      type: 'select',
      options: [
        { label: 'Single', value: 'Single' },
        { label: 'Married Filing Jointly', value: 'Married Filing Jointly' },
        { label: 'Head of Household', value: 'Head of Household' },
      ],
      helpText: 'Your tax filing status determines the income thresholds for each capital gains bracket.',
    },
    {
      id: 'stateTaxRate',
      label: 'State Tax Rate (%)',
      type: 'number',
      placeholder: '0',
      defaultValue: '0',
      inputMode: 'decimal',
      min: 0,
      max: 15,
      step: 0.1,
      helpText: 'Your state\'s capital gains tax rate. Enter 0 if your state has no income tax.',
    },
  ],
  explainSteps: (values) => {
    const rows = capitalGainsTaxConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const costBasis = parseFloat(values.costBasis);
    const saleProceeds = parseFloat(values.saleProceeds);
    const annualIncome = parseFloat(values.annualIncome);
    const filingStatus = values.filingStatus || 'Single';
    const assetType = values.assetType || 'Stocks';
    const stateTaxRate = parseFloat(values.stateTaxRate) || 0;
    const gain = saleProceeds - costBasis;
    const m = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const isShortTerm = !isLongTerm(new Date(values.purchaseDate), new Date(values.saleDate));
    const holding = {
      label: 'Count the holding period',
      expr: `${values.purchaseDate} → ${values.saleDate} = ${resultValue(rows, 'holdingPeriod')} → ${isShortTerm ? 'short-term (held one year or less)' : 'long-term (held more than one year)'}`,
      note: 'The IRS counts a year from the day after you acquired the asset: only a sale after the next anniversary is long-term.',
    };
    const gainStep = {
      label: gain >= 0 ? 'Work out the capital gain' : 'Work out the capital loss',
      expr: `${m(saleProceeds)} proceeds − ${m(costBasis)} cost basis = ${gain < 0 ? '−' : ''}${m(Math.abs(gain))}`,
    };
    if (gain <= 0) {
      return finiteSteps([
        gainStep,
        holding,
        {
          label: 'No tax is due on this sale',
          expr: gain === 0 ? 'A $0.00 gain is nothing to tax' : 'A loss creates no capital gains tax; it can offset other capital gains',
          note: 'See the capital loss note under the result for how losses carry over.',
        },
      ]);
    }
    const { tax, slices, kind } = federalGainTax(gain, annualIncome, filingStatus, assetType, isShortTerm);
    const basisLabel =
      kind === 'ltcg' ? `the 2026 long-term capital gains brackets for ${filingStatus} (0% / 15% / 20%)`
      : kind === 'collectibles' ? `the 2026 ordinary brackets for ${filingStatus}, capped at 28% for collectibles`
      : `the 2026 ordinary income brackets for ${filingStatus}`;
    const steps: ExplainStep[] = [
      gainStep,
      holding,
      {
        label: 'Stack the gain on top of your ordinary income and tax each slice',
        expr: `${slices.map((x) => `${m(x.amount)} × ${x.rate}%`).join(' + ')} = ${resultValue(rows, 'federalTax')} (${m(tax)}) — using ${basisLabel}, with ${m(annualIncome)} of ordinary income filling the lower brackets first`,
        note: 'Only the part of the gain that falls inside each bracket is taxed at the rate of the bracket it falls in, not the whole gain at one rate.',
      },
    ];
    const modifiedAGI = gain + annualIncome;
    const niitThreshold = getNIITThreshold(filingStatus);
    const niit = resultValue(rows, 'niitTax');
    steps.push({
      label: 'Check the 3.8% Net Investment Income Tax',
      expr: niit
        ? `Income + gain = ${m(modifiedAGI)} is over the ${m(niitThreshold)} threshold → 3.8% × min(${m(gain)}, ${m(modifiedAGI - niitThreshold)}) = ${niit}`
        : `Income + gain = ${m(modifiedAGI)} does not exceed the ${m(niitThreshold)} threshold → $0.00`,
      note: 'The threshold depends on filing status and is not adjusted for inflation.',
    });
    if (stateTaxRate > 0) {
      steps.push({ label: 'Add state tax', expr: `${m(gain)} × ${stateTaxRate}% = ${resultValue(rows, 'stateTax')}` });
    }
    steps.push({
      label: 'Add everything up',
      expr: `Federal + NIIT + state = ${resultValue(rows, 'totalTax')} · ÷ ${m(gain)} gain = ${resultValue(rows, 'effectiveRate')} effective rate · you keep ${resultValue(rows, 'afterTaxProceeds')}`,
    });
    return finiteSteps(steps);
  },

  calculate: (values) => {
    const purchaseDateStr = values.purchaseDate;
    const saleDateStr = values.saleDate;
    const costBasis = parseFloat(values.costBasis);
    const saleProceeds = parseFloat(values.saleProceeds);
    const annualIncome = parseFloat(values.annualIncome);
    const filingStatus = values.filingStatus || 'Single';
    const assetType = values.assetType || 'Stocks';
    const stateTaxRate = parseFloat(values.stateTaxRate) || 0;

    if (
      !purchaseDateStr || !saleDateStr ||
      isNaN(costBasis) || isNaN(saleProceeds) || isNaN(annualIncome) ||
      costBasis <= 0 || saleProceeds <= 0 || annualIncome < 0
    ) {
      return [];
    }

    const purchaseDate = new Date(purchaseDateStr);
    const saleDate = new Date(saleDateStr);

    if (isNaN(purchaseDate.getTime()) || isNaN(saleDate.getTime())) {
      return [];
    }

    if (saleDate <= purchaseDate) {
      return [];
    }

    const holdingPeriod = daysBetween(purchaseDate, saleDate);
    const isShortTerm = !isLongTerm(purchaseDate, saleDate);
    const gain = saleProceeds - costBasis;

    if (gain <= 0) {
      // Capital loss
      return [
        {
          id: 'gainLoss',
          label: 'Capital Gain / Loss',
          value: `${gain < 0 ? '-' : ''}$${Math.abs(gain).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          highlight: true,
          color: 'negative',
        },
        {
          id: 'holdingPeriod',
          label: 'Holding Period',
          value: `${holdingPeriod} days (${isShortTerm ? 'Short-Term' : 'Long-Term'})`,
          color: 'neutral',
        },
        {
          id: 'holdingPeriodType',
          label: 'Holding Period Type',
          value: isShortTerm ? 'Short-Term (held one year or less)' : 'Long-Term (held more than one year)',
          color: 'neutral',
        },
        {
          id: 'lossNote',
          label: 'Capital Loss Information',
          value: `You realized a capital loss of $${Math.abs(gain).toLocaleString(undefined, { maximumFractionDigits: 2 })}. Capital losses can offset capital gains dollar-for-dollar. If losses exceed gains, you may deduct up to $3,000 ($1,500 if married filing separately) against ordinary income, with remaining losses carried forward to future tax years.`,
          color: 'neutral',
        },
      ];
    }

    const { tax: federalTax, topRate: federalTaxRate } = federalGainTax(gain, annualIncome, filingStatus, assetType, isShortTerm);

    // Net Investment Income Tax (NIIT)
    const modifiedAGI = gain + annualIncome;
    const niitThreshold = getNIITThreshold(filingStatus);
    let niitTax = 0;
    if (modifiedAGI > niitThreshold && gain > 0) {
      const niitBase = Math.min(gain, modifiedAGI - niitThreshold);
      niitTax = Math.max(0, niitBase * 0.038);
    }

    // State tax
    const stateTax = gain * (stateTaxRate / 100);

    const totalTax = federalTax + niitTax + stateTax;
    const effectiveRate = gain > 0 ? (totalTax / gain) * 100 : 0;

    const fmtMoney = (n: number) =>
      `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const fmtPct = (n: number) => `${n.toFixed(2)}%`;

    const results: CalculatorResult[] = [
      {
        id: 'gainLoss',
        label: 'Capital Gain',
        value: fmtMoney(gain),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'holdingPeriod',
        label: 'Holding Period',
        value: `${holdingPeriod} days`,
        color: 'neutral',
      },
      {
        id: 'holdingPeriodType',
        label: 'Holding Period Type',
        value: isShortTerm ? 'Short-Term (held one year or less)' : 'Long-Term (held more than one year)',
        color: isShortTerm ? 'negative' : 'positive',
      },
      {
        id: 'federalTax',
        label: `Federal Tax${isShortTerm ? ` (up to ${federalTaxRate}% ordinary rate)` : assetType === 'Collectibles' ? ` (up to ${federalTaxRate}% collectibles rate, 28% max)` : ` (up to ${federalTaxRate}% LTCG rate)`}`,
        value: fmtMoney(federalTax),
        color: 'negative',
      },
    ];

    if (niitTax > 0) {
      results.push({
        id: 'niitTax',
        label: 'Net Investment Income Tax (3.8%)',
        value: fmtMoney(niitTax),
        color: 'negative',
      });
    }

    if (stateTax > 0) {
      results.push({
        id: 'stateTax',
        label: `State Tax (${stateTaxRate}%)`,
        value: fmtMoney(stateTax),
        color: 'negative',
      });
    }

    results.push(
      {
        id: 'totalTax',
        label: 'Total Tax Liability',
        interpretation: `You held this asset ${isShortTerm ? 'under a year, so the gain is taxed as ordinary income at your marginal rate' : 'over a year, which qualifies for the lower long-term capital gains rate'} — that's an effective rate of ${effectiveRate.toFixed(1)}%. Waiting past the one-year mark before selling can meaningfully cut this bill if you're close to the line.`,
        value: fmtMoney(totalTax),
        highlight: true,
        color: 'negative',
      },
      {
        id: 'effectiveRate',
        label: 'Effective Tax Rate',
        value: fmtPct(effectiveRate),
        color: 'neutral',
      },
      {
        id: 'afterTaxProceeds',
        label: 'After-Tax Proceeds',
        value: fmtMoney(saleProceeds - totalTax),
        color: 'positive',
      },
    );

    return results;
  },
  educational: {
    formula: 'Gain = Proceeds − Cost Basis  |  LTCG Rate = 0%/15%/20% based on income  |  NIIT = 3.8% on investment income above threshold',
    formulaDescription:
      'Capital gains tax is calculated based on the holding period (short-term vs. long-term), your total taxable income, and filing status. Short-term gains are taxed at ordinary income rates, while long-term gains benefit from preferential rates of 0%, 15%, or 20%. An additional 3.8% Net Investment Income Tax (NIIT) may apply for high-income taxpayers.',
    formulaSource: 'IRS Revenue Procedure 2025-32 (2026 capital gains rate thresholds and ordinary brackets); IRS Topic 409 (Capital gains and losses); IRC section 1411 (3.8% NIIT, thresholds $200,000 single / $250,000 joint, not indexed).',
    diagram: {
      svg: '<svg viewBox="0 0 460 140" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">2026 Long-Term Capital Gains Tax Brackets (Single Filer)</text><!-- 0% bracket --><rect x="20" y="35" width="140" height="28" rx="5" fill="var(--svg-22c55e)" opacity="0.2" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="90" y="53" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">0% rate</text><text x="90" y="73" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">$0 — $49,450</text><!-- 15% bracket --><rect x="170" y="35" width="160" height="28" rx="5" fill="var(--svg-f59e0b)" opacity="0.2" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="250" y="53" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">15% rate</text><text x="250" y="73" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">$49,451 — $545,500</text><!-- 20% bracket --><rect x="340" y="35" width="100" height="28" rx="5" fill="var(--svg-ef4444)" opacity="0.2" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="390" y="53" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">20% rate</text><text x="390" y="73" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">$545,501+</text><!-- NIIT note --><rect x="70" y="90" width="320" height="22" rx="5" fill="var(--svg-f1f5f9)" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="230" y="104" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" text-anchor="middle">+3.8% NIIT if AGI &gt; $200k (single) or &gt; $250k (MFJ)</text><!-- Short-term note --><text x="230" y="126" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Short-term (&le;365 days): taxed at ordinary income rates (10%-37%) | Holding period starts day after purchase</text></svg>',
      alt: 'Diagram of 2026 long-term capital gains tax brackets for single filers: 0% up to $49,450, 15% from $49,451 to $545,500, and 20% above $545,501',
      caption: 'Long-term gains (held >365 days) get preferential rates. Short-term gains are taxed as ordinary income. NIIT adds 3.8% above income thresholds.',
    },
    variables: [
      {
        symbol: 'Holding Period',
        name: 'Holding Period',
        description: 'The number of days between purchase and sale. Assets held 365 days or less are short-term; assets held longer than 365 days are long-term and qualify for lower tax rates.',
      },
      {
        symbol: 'Cost Basis',
        name: 'Cost Basis',
        description: 'The original purchase price of the asset, including commissions, fees, and improvements (for real estate). A higher cost basis reduces your taxable gain.',
      },
      {
        symbol: 'LTCG Rate',
        name: 'Long-Term Capital Gains Rate',
        description: 'Preferential tax rates of 0%, 15%, or 20% for assets held more than one year. The rate depends on your total taxable income and filing status. In 2026, 0% rate applies up to $49,450 for single filers.',
      },
      {
        symbol: 'NIIT',
        name: 'Net Investment Income Tax',
        description: 'An additional 3.8% tax on the lesser of net investment income or the excess of modified adjusted gross income over threshold amounts ($200,000 single, $250,000 married filing jointly).',
      },
      {
        symbol: 'Effective Rate',
        name: 'Effective Tax Rate',
        description: 'The total tax paid (federal + NIIT + state) divided by the total capital gain. This represents your true blended tax rate on the investment gain.',
      },
    ],
    howToUse: [
      'Select the asset type (stocks, bonds, crypto, real estate, or collectibles).',
      'Enter the purchase and sale dates to calculate the holding period.',
      'Enter your cost basis (what you paid) and sale proceeds.',
      'Provide your annual ordinary income and filing status to determine the correct tax bracket.',
      'Optionally enter your state capital gains tax rate for a complete picture of your tax liability.',
    ],
    commonUses: [
      'Estimate your federal and state capital gains tax liability before selling stocks, real estate, or other appreciated investments.',
      'Compare the tax impact of short-term versus long-term holding periods to decide the optimal time to sell an asset.',
      'Plan tax-loss harvesting strategies by modeling how realized gains and losses offset each other in a given tax year.',
      'Evaluate the after-tax return of an investment sale to make informed decisions about portfolio rebalancing.',
    ],
    explanation:
      'Capital gains tax is one of the most important considerations for investors when selling assets. The tax treatment depends primarily on how long you held the asset before selling. Short-term capital gains (assets held for 365 days or less) are taxed as ordinary income at your marginal tax rate, which can be as high as 37%. This is a significant tax disadvantage compared to long-term gains, which benefit from preferential rates of 0%, 15%, or 20% depending on your income level. The difference is substantial: a high-income earner in the 37% bracket pays nearly twice the tax on short-term gains compared to long-term gains. This tax preference is a key reason why financial advisors recommend a "buy and hold" investment strategy. For 2026, the 0% long-term capital gains rate applies to single filers with total taxable income up to $49,450, married filing jointly up to $98,900, and heads of household up to $66,200. The 15% rate applies to most middle-income taxpayers, and the 20% rate applies to high-income earners. The Net Investment Income Tax (NIIT) adds an additional 3.8% for single filers with modified AGI exceeding $200,000 ($250,000 for married filing jointly). This surtax was introduced as part of the Affordable Care Act to help fund Medicare and applies to the lesser of your net investment income or the excess over the threshold. State taxes vary widely — some states like Texas, Florida, and Nevada have no state income tax, while others like California (up to 13.3%) and New York (up to 10.9%) can significantly increase the total tax burden on capital gains. Understanding these rules allows investors to make tax-aware decisions about when to sell assets and how to structure their investment portfolio.',
    faqs: [
      {
        question: 'What is the difference between short-term and long-term capital gains?',
        answer: 'Short-term capital gains are profits from assets held for 365 days or less and are taxed at your ordinary income tax rate (up to 37%). Long-term capital gains are from assets held more than 365 days and are taxed at preferential rates of 0%, 15%, or 20%. This difference can result in paying nearly half the tax on long-term gains compared to short-term gains for high-income earners.',
      },
      {
        question: 'What is the Net Investment Income Tax (NIIT) and who pays it?',
        answer: 'The NIIT is an additional 3.8% surtax on net investment income that applies to individuals with modified adjusted gross income exceeding $200,000 ($250,000 for married filing jointly). It was introduced by the Affordable Care Act and applies to interest, dividends, capital gains, rental income, and other passive investment income. The tax is 3.8% of the lesser of your net investment income or the excess over the threshold.',
      },
      {
        question: 'Can I offset capital gains with capital losses?',
        answer: 'Yes, capital losses can offset capital gains dollar-for-dollar. If your losses exceed your gains, you can deduct up to $3,000 ($1,500 if married filing separately) of net capital losses against ordinary income each year. Remaining losses carry forward to future tax years indefinitely. This strategy, known as tax-loss harvesting, is commonly used to reduce taxable gains.',
      },
      {
        question: 'How do state taxes affect my capital gains tax bill?',
        answer: 'State capital gains tax rates vary widely. Some states (Texas, Florida, Nevada, South Dakota, Tennessee, Wyoming, Alaska, New Hampshire) have no state income tax. Others tax capital gains as ordinary income, with top rates from about 4% to 13.3%. A few states have special rates for capital gains. Enter your state\'s rate to see the combined federal-state tax impact.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    
    workedExamples: [
      {
        scenario: 'Elena in Seattle, WA sold Apple stock that she bought on January 15, 2023 for $12,500 (including commissions) and sold on March 20, 2026 for $31,000. As a single filer with $92,000 in ordinary income, she wants to know her capital gains tax liability.',
        inputs: { assetType: 'Stocks', purchaseDate: '2023-01-15', saleDate: '2026-03-20', costBasis: '12500', saleProceeds: '31000', annualIncome: '92000', filingStatus: 'Single', stateTaxRate: '0' },
        result: 'Holding period: 1,160 days (Long-Term). Capital gain: $18,500. Total income ($92,000 + $18,500 = $110,500) falls in the 15% LTCG bracket. Federal tax: $2,775 (15%). Washington has no state income tax. Elena keeps $28,225 after federal tax.',
        insight: 'Elena held her Apple shares for more than three years, qualifying for the preferential long-term capital gains rate. Her $18,500 gain was taxed at only 15% instead of stacking on top of her ordinary income at the short-term rate, saving her approximately $1,391 in federal taxes compared to selling before the one-year holding period. Short-term treatment would have pushed part of the gain into the 24% bracket (her $92,000 income plus the $18,500 gain crosses the $105,700 top of the 22% bracket for single filers in 2026), costing about $4,166 in federal tax versus $2,775 long-term — making the long-term holding period worth the wait.',
      },
      {
        scenario: 'James and Maria Johnson in Portland, OR are a married couple filing jointly with $175,000 in combined ordinary income. They bought Bitcoin on November 5, 2025 for $8,000 and sold it on October 1, 2026 for $22,000. Oregon has a 9.9% state income tax.',
        inputs: { assetType: 'Crypto', purchaseDate: '2025-11-05', saleDate: '2026-10-01', costBasis: '8000', saleProceeds: '22000', annualIncome: '175000', filingStatus: 'Married Filing Jointly', stateTaxRate: '9.9' },
        result: 'Holding period: 330 days (Short-Term). Capital gain: $14,000. Because the holding period is 330 days (under one year), the gain is taxed as ordinary income. Their $175,000 ordinary income places them in the 22% MFJ marginal bracket for 2026. Federal tax: $3,080 (22% of $14,000). State tax: $1,386 (9.9% of $14,000). Total tax: $4,466. After-tax proceeds: $17,534.',
        insight: 'The Johnsons missed long-term capital gains treatment by just 36 days. Had they waited until November 6, 2026, their gain would have been taxed at the 15% LTCG rate instead of their 22% ordinary rate — saving $980 in federal taxes. This example illustrates why timing matters enormously in crypto and stock sales: holding just 36 more days would have cut their federal tax bill by nearly a third. For high-income taxpayers in states like Oregon with high state taxes, the combined short-term burden still exceeds 30% of the gain even at the 22% federal bracket.',
      },
    ],

    proTips: [
      'The holding period clock starts the day AFTER purchase. If you bought on January 15, the one-year mark is January 16 of the following year — sell on January 15 and you have held for exactly 365 days (short-term). Wait one more day for long-term treatment.',
      'Tax-loss harvesting: sell losing positions before year-end to offset gains. Up to $3,000 of net losses can offset ordinary income, with the remainder carried forward indefinitely. This is one of the few free lunches in tax planning.',
      'If you are in the 0% LTCG bracket (single filers with total income under $49,450 in 2026), consider realizing gains up to the top of the 0% bracket each year — it is essentially a tax-free step-up in cost basis that reduces future tax liability.',
      'The 3.8% Net Investment Income Tax applies to single filers above $200,000 and married couples above $250,000. If you are near the threshold, timing income across tax years — or maximizing pre-tax retirement contributions to reduce MAGI — can avoid the surtax on capital gains.',
    ],

    quickReference: [
      { label: 'Short-Term (≤365 days)', value: 'Taxed as ordinary income (10%–37%)' },
      { label: 'Long-Term (>365 days)', value: '0%, 15%, or 20% based on total taxable income' },
      { label: '0% LTCG Rate (Single 2026)', value: 'Total income up to $49,450' },
      { label: '15% LTCG Rate (Single 2026)', value: 'Total income $49,451–$545,500' },
      { label: '20% LTCG Rate (Single 2026)', value: 'Total income $545,501+' },
      { label: 'NIIT Threshold (Single)', value: 'MAGI > $200,000 (additional 3.8%)' },
      { label: 'NIIT Threshold (MFJ)', value: 'MAGI > $250,000 (additional 3.8%)' },
      { label: 'Annual Capital Loss Deduction', value: 'Up to $3,000 against ordinary income ($1,500 MFS)' },
    ],

    limitations: [
      'The holding period calculation counts calendar days and starts the day after purchase. A sale is long-term only if it happens after the one-year anniversary of the purchase date (so a sale spanning a leap day can take 366 days). However, weekends, holidays, and market closures are not considered — the actual trade settlement date may differ from your entered dates.',
      'Enter your taxable income (after the standard or itemized deduction), not gross income. The gain is stacked on top of it bracket by bracket, but credits, phase-outs, and the NIIT base (which uses modified AGI) are simplified, so the real result can differ.',
      'State tax treatment is simplified to a flat rate. Many states have graduated brackets, special capital gains exclusions (like the home sale exclusion), or exemption thresholds. Consult your state\'s tax authority for precise rates.',
      'This calculator does not handle wash sales (selling and repurchasing the same security within 30 days), which disallow loss deductions under IRS rules. It also does not model the qualified small business stock exclusion (Section 1202), opportunity zone deferrals, the home-sale exclusion (up to $250,000 single / $500,000 joint on a primary residence), or the 25% rate on unrecaptured Section 1250 real estate depreciation. Long-term collectibles gains are taxed at your ordinary rate capped at 28%.',
    ],
citations: [
      { source: 'Wikipedia', title: 'Capital Gains Tax', url: 'https://en.wikipedia.org/wiki/Capital_gains_tax' },
      { source: 'IRS', title: 'Capital Gains and Losses', url: 'https://www.irs.gov/taxtopics/tc409' },
      { source: 'IRS', title: 'Revenue Procedure 2025-32 (2026 inflation adjustments)', url: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CapitalGainsPanel, { values, results });
  },
};

export default capitalGainsTaxConfig;
