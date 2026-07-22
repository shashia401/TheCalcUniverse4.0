import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import CapitalGainsPanel from './CapitalGainsPanel';

interface LTCGBracket {
  min: number;
  max: number;
  rate: number;
}

function getLTCGBrackets(filingStatus: string): LTCGBracket[] {
  const brackets: Record<string, LTCGBracket[]> = {
    Single: [
      { min: 0, max: 47025, rate: 0 },
      { min: 47026, max: 518900, rate: 15 },
      { min: 518901, max: Infinity, rate: 20 },
    ],
    'Married Filing Jointly': [
      { min: 0, max: 94050, rate: 0 },
      { min: 94051, max: 583750, rate: 15 },
      { min: 583751, max: Infinity, rate: 20 },
    ],
    'Head of Household': [
      { min: 0, max: 63000, rate: 0 },
      { min: 63001, max: 551350, rate: 15 },
      { min: 551351, max: Infinity, rate: 20 },
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

function daysBetween(d1: Date, d2: Date): number {
  const ms = d2.getTime() - d1.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
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
  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const purchaseDateStr = values.purchaseDate;
    const saleDateStr = values.saleDate;
    const costBasis = parseFloat(values.costBasis);
    const saleProceeds = parseFloat(values.saleProceeds);
    const annualIncome = parseFloat(values.annualIncome);
    const filingStatus = values.filingStatus || 'Single';
    const stateTaxRate = parseFloat(values.stateTaxRate) || 0;

    if (
      !purchaseDateStr || !saleDateStr ||
      isNaN(costBasis) || isNaN(saleProceeds) || isNaN(annualIncome) ||
      costBasis <= 0 || saleProceeds <= 0 || annualIncome <= 0
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
    const isShortTerm = holdingPeriod <= 365;
    const gain = saleProceeds - costBasis;

    if (gain <= 0) {
      // Capital loss
      return [
        {
          id: 'gainLoss',
          label: 'Capital Gain / Loss',
          value: `$${gain.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
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
          value: isShortTerm ? 'Short-Term (&le; 365 days)' : 'Long-Term (&gt; 365 days)',
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

    let federalTaxRate: number;
    let federalTax: number;

    if (isShortTerm) {
      // Short-term: taxed as ordinary income
      // Use the filing-status-appropriate 2026 brackets to determine marginal rate
      const stBrackets: Record<string, { threshold: number; rate: number }[]> = {
        Single: [
          { threshold: 11925, rate: 10 },
          { threshold: 48475, rate: 12 },
          { threshold: 103350, rate: 22 },
          { threshold: 197300, rate: 24 },
          { threshold: 250525, rate: 32 },
          { threshold: 626350, rate: 35 },
          { threshold: Infinity, rate: 37 },
        ],
        'Married Filing Jointly': [
          { threshold: 23850, rate: 10 },
          { threshold: 96950, rate: 12 },
          { threshold: 206700, rate: 22 },
          { threshold: 394600, rate: 24 },
          { threshold: 501050, rate: 32 },
          { threshold: 751600, rate: 35 },
          { threshold: Infinity, rate: 37 },
        ],
        'Head of Household': [
          { threshold: 17000, rate: 10 },
          { threshold: 64850, rate: 12 },
          { threshold: 103350, rate: 22 },
          { threshold: 197300, rate: 24 },
          { threshold: 250525, rate: 32 },
          { threshold: 626350, rate: 35 },
          { threshold: Infinity, rate: 37 },
        ],
      };
      const bracketSet = stBrackets[filingStatus] || stBrackets.Single;
      let rate = 37;
      for (const b of bracketSet) {
        if (annualIncome <= b.threshold) {
          rate = b.rate;
          break;
        }
      }
      federalTaxRate = rate;
      federalTax = gain * (federalTaxRate / 100);
    } else {
      // Long-term: use LTCG brackets
      const totalIncome = gain + annualIncome;
      const brackets = getLTCGBrackets(filingStatus);
      // Determine the LTCG rate based on total income
      // The LTCG rate is determined by the total taxable income
      // More precise: check which bracket the ordinary income falls in + gains stack on top
      // Gains are stacked on top of ordinary income
      let ltcgRate: number;
      if (totalIncome >= brackets[2].min) {
        ltcgRate = 20;
      } else if (totalIncome >= brackets[1].min) {
        ltcgRate = 15;
      } else {
        ltcgRate = 0;
      }

      federalTaxRate = ltcgRate;
      federalTax = gain * (ltcgRate / 100);
    }

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
        value: isShortTerm ? 'Short-Term (&le; 365 days)' : 'Long-Term (&gt; 365 days)',
        color: isShortTerm ? 'negative' : 'positive',
      },
      {
        id: 'federalTax',
        label: `Federal Tax${isShortTerm ? ` (${federalTaxRate}% ordinary rate)` : ` (${federalTaxRate}% LTCG rate)`}`,
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
    diagram: {
      svg: '<svg viewBox="0 0 460 140" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">2026 Long-Term Capital Gains Tax Brackets (Single Filer)</text><!-- 0% bracket --><rect x="20" y="35" width="140" height="28" rx="5" fill="var(--svg-22c55e)" opacity="0.2" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="90" y="53" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">0% rate</text><text x="90" y="73" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">$0 — $47,025</text><!-- 15% bracket --><rect x="170" y="35" width="160" height="28" rx="5" fill="var(--svg-f59e0b)" opacity="0.2" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="250" y="53" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">15% rate</text><text x="250" y="73" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">$47,026 — $518,900</text><!-- 20% bracket --><rect x="340" y="35" width="100" height="28" rx="5" fill="var(--svg-ef4444)" opacity="0.2" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="390" y="53" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">20% rate</text><text x="390" y="73" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">$518,901+</text><!-- NIIT note --><rect x="70" y="90" width="320" height="22" rx="5" fill="var(--svg-f1f5f9)" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="230" y="104" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" text-anchor="middle">+3.8% NIIT if AGI &gt; $200k (single) or &gt; $250k (MFJ)</text><!-- Short-term note --><text x="230" y="126" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Short-term (&le;365 days): taxed at ordinary income rates (10%-37%) | Holding period starts day after purchase</text></svg>',
      alt: 'Diagram of 2026 long-term capital gains tax brackets for single filers: 0% up to $47,025, 15% from $47,026 to $518,900, and 20% above $518,901',
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
        description: 'Preferential tax rates of 0%, 15%, or 20% for assets held more than one year. The rate depends on your total taxable income and filing status. In 2026, 0% rate applies up to $47,025 for single filers.',
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
      'Capital gains tax is one of the most important considerations for investors when selling assets. The tax treatment depends primarily on how long you held the asset before selling. Short-term capital gains (assets held for 365 days or less) are taxed as ordinary income at your marginal tax rate, which can be as high as 37%. This is a significant tax disadvantage compared to long-term gains, which benefit from preferential rates of 0%, 15%, or 20% depending on your income level. The difference is substantial: a high-income earner in the 37% bracket pays nearly twice the tax on short-term gains compared to long-term gains. This tax preference is a key reason why financial advisors recommend a "buy and hold" investment strategy. For 2026, the 0% long-term capital gains rate applies to single filers with total taxable income up to $47,025, married filing jointly up to $94,050, and heads of household up to $63,000. The 15% rate applies to most middle-income taxpayers, and the 20% rate applies to high-income earners. The Net Investment Income Tax (NIIT) adds an additional 3.8% for single filers with modified AGI exceeding $200,000 ($250,000 for married filing jointly). This surtax was introduced as part of the Affordable Care Act to help fund Medicare and applies to the lesser of your net investment income or the excess over the threshold. State taxes vary widely — some states like Texas, Florida, and Nevada have no state income tax, while others like California (up to 13.3%) and New York (up to 10.9%) can significantly increase the total tax burden on capital gains. Understanding these rules allows investors to make tax-aware decisions about when to sell assets and how to structure their investment portfolio.',
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
        scenario: 'Elena in Seattle, WA sold Apple stock that she bought on January 15, 2023 for $12,500 (including commissions) and sold on March 20, 2025 for $31,000. As a single filer with $92,000 in ordinary income, she wants to know her capital gains tax liability.',
        inputs: { assetType: 'Stocks', purchaseDate: '2023-01-15', saleDate: '2025-03-20', costBasis: '12500', saleProceeds: '31000', annualIncome: '92000', filingStatus: 'Single', stateTaxRate: '0' },
        result: 'Holding period: 795 days (Long-Term). Capital gain: $18,500. Total income ($92,000 + $18,500 = $110,500) falls in the 15% LTCG bracket. Federal tax: $2,775 (15%). Washington has no state income tax. Elena keeps $28,225 after federal tax.',
        insight: 'Elena held her Apple shares for just over two years, qualifying for the preferential long-term capital gains rate. Her $18,500 gain was taxed at only 15% instead of her ordinary income marginal rate of 22% (her $92,000 income falls in the 22% single-filer bracket, up to $103,350), saving her approximately $1,295 in federal taxes compared to selling before the one-year holding period. The difference is real: short-term treatment would have cost her 22% — about $4,070 — making the long-term holding period worth the wait.',
      },
      {
        scenario: 'James and Maria Johnson in Portland, OR are a married couple filing jointly with $175,000 in combined ordinary income. They bought Bitcoin on November 5, 2023 for $8,000 and sold it on October 1, 2024 for $22,000. Oregon has a 9.9% state income tax.',
        inputs: { assetType: 'Crypto', purchaseDate: '2023-11-05', saleDate: '2024-10-01', costBasis: '8000', saleProceeds: '22000', annualIncome: '175000', filingStatus: 'Married Filing Jointly', stateTaxRate: '9.9' },
        result: 'Holding period: 331 days (Short-Term). Capital gain: $14,000. Because the holding period is 331 days (< 365), the gain is taxed as ordinary income. Their $175,000 ordinary income places them in the 22% MFJ marginal bracket for 2026. Federal tax: $3,080 (22% of $14,000). State tax: $1,386 (9.9% of $14,000). Total tax: $4,466. After-tax proceeds: $17,534.',
        insight: 'The Johnsons missed long-term capital gains treatment by just 34 days. Had they waited until November 6, 2024, their gain would have been taxed at the 15% LTCG rate instead of their 22% ordinary rate — saving $980 in federal taxes. This example illustrates why timing matters enormously in crypto and stock sales: holding just 34 more days would have cut their federal tax bill by nearly a third. For high-income taxpayers in states like Oregon with high state taxes, the combined short-term burden still exceeds 30% of the gain even at the 22% federal bracket.',
      },
    ],

    proTips: [
      'The holding period clock starts the day AFTER purchase. If you bought on January 15, the one-year mark is January 16 of the following year — sell on January 15 and you have held for exactly 365 days (short-term). Wait one more day for long-term treatment.',
      'Tax-loss harvesting: sell losing positions before year-end to offset gains. Up to $3,000 of net losses can offset ordinary income, with the remainder carried forward indefinitely. This is one of the few free lunches in tax planning.',
      'If you are in the 0% LTCG bracket (single filers with total income under $47,025 in 2025), consider realizing gains up to the top of the 0% bracket each year — it is essentially a tax-free step-up in cost basis that reduces future tax liability.',
      'The 3.8% Net Investment Income Tax applies to single filers above $200,000 and married couples above $250,000. If you are near the threshold, timing income across tax years — or maximizing pre-tax retirement contributions to reduce MAGI — can avoid the surtax on capital gains.',
    ],

    quickReference: [
      { label: 'Short-Term (≤365 days)', value: 'Taxed as ordinary income (10%–37%)' },
      { label: 'Long-Term (>365 days)', value: '0%, 15%, or 20% based on total taxable income' },
      { label: '0% LTCG Rate (Single 2025)', value: 'Total income up to $47,025' },
      { label: '15% LTCG Rate (Single 2025)', value: 'Total income $47,026–$518,900' },
      { label: '20% LTCG Rate (Single 2025)', value: 'Total income $518,901+' },
      { label: 'NIIT Threshold (Single)', value: 'MAGI > $200,000 (additional 3.8%)' },
      { label: 'NIIT Threshold (MFJ)', value: 'MAGI > $250,000 (additional 3.8%)' },
      { label: 'Annual Capital Loss Deduction', value: 'Up to $3,000 against ordinary income ($1,500 MFS)' },
    ],

    limitations: [
      'The holding period calculation counts calendar days and starts the day after purchase. The calculator treats 365 days as short-term per IRS rules (must exceed 365 days for long-term). However, weekends, holidays, and market closures are not considered — the actual trade settlement date may differ from your entered dates.',
      'The short-term tax rate uses a simplified marginal bracket lookup based on annual ordinary income alone. Real tax calculations consider deductions, credits, phase-outs, and the stacking of capital gains on top of ordinary income. The actual marginal rate may differ by one bracket.',
      'State tax treatment is simplified to a flat rate. Many states have graduated brackets, special capital gains exclusions (like the home sale exclusion), or exemption thresholds. Consult your state\'s tax authority for precise rates.',
      'This calculator does not handle wash sales (selling and repurchasing the same security within 30 days), which disallow loss deductions under IRS rules. It also does not model the qualified small business stock exclusion (Section 1202) or opportunity zone deferrals.',
    ],
citations: [
      { source: 'Wikipedia', title: 'Capital Gains Tax', url: 'https://en.wikipedia.org/wiki/Capital_gains_tax' },
      { source: 'IRS', title: 'Capital Gains and Losses', url: 'https://www.irs.gov/taxtopics/tc409' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CapitalGainsPanel, { values, results });
  },
};

export default capitalGainsTaxConfig;
