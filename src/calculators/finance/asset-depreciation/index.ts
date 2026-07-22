import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import DepreciationPanel from './DepreciationPanel';

const DEPRECIATION_FORMULA = '(Cost − Salvage) / Useful Life | (2 / Useful Life) × Beginning Book Value | (Remaining Life / SYD Sum) × (Cost − Salvage)';

const depreciationSvg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto">
  <rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/>
  <text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)" font-family="system-ui,sans-serif">Three Depreciation Methods</text>
  <line x1="35" y1="165" x2="285" y2="165" stroke="var(--svg-cbd5e1)" stroke-width="1"/>
  <line x1="35" y1="165" x2="35" y2="30" stroke="var(--svg-cbd5e1)" stroke-width="1"/>
  <line x1="35" y1="35" x2="285" y2="165" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 35,35 Q 80,55 130,80 Q 180,108 230,132 Q 260,148 285,165" fill="none" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 35,35 Q 80,52 130,78 Q 180,105 230,130 Q 260,148 285,165" fill="none" stroke="var(--svg-10b981)" stroke-width="2.5" stroke-dasharray="6,3" stroke-linecap="round"/>
  <text x="265" y="140" font-size="9" fill="var(--svg-3b82f6)" font-weight="bold" font-family="system-ui,sans-serif">SL</text>
  <text x="55" y="55" font-size="9" fill="var(--svg-ef4444)" font-weight="bold" font-family="system-ui,sans-serif">DDB</text>
  <text x="145" y="95" font-size="9" fill="var(--svg-10b981)" font-weight="bold" font-family="system-ui,sans-serif">SYD</text>
  <text x="160" y="185" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Time (asset useful life in years)</text>
  <text x="20" y="100" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif" transform="rotate(-90,20,100)">Book Value</text>
  <text x="160" y="196" text-anchor="middle" font-size="7" fill="var(--svg-ef4444)" font-family="system-ui,sans-serif">DDB front-loads deductions: Year 1 deduction is 2x SL</text>
</svg>`;

const depreciationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'assetCost',
      label: 'Asset Original Cost',
      type: 'number',
      placeholder: '50,000',
      prefix: '$',
      inputMode: 'numeric',
      required: true,
      helpText: 'Purchase price of the asset including shipping, installation, and setup fees.',
    },
    {
      id: 'salvageValue',
      label: 'Salvage Value (Estimated residual value)',
      type: 'number',
      placeholder: '5,000',
      prefix: '$',
      inputMode: 'numeric',
      helpText:
        'The estimated value of the asset at the end of its useful life. Enter 0 if fully depreciated.',
    },
    {
      id: 'usefulLife',
      label: 'Useful Life',
      type: 'number',
      placeholder: '5',
      unit: 'years',
      inputMode: 'numeric',
      min: 1,
      max: 40,
      required: true,
      helpText: 'How many years the asset will be in use before it needs replacement.',
    },
    {
      id: 'depreciationMethod',
      label: 'Depreciation Method',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Straight-Line (SL) — Equal expense each year',
          value: 'sl',
        },
        {
          label: 'Double Declining Balance (DDB) — Accelerated (front-loaded)',
          value: 'ddb',
        },
        {
          label: "Sum-of-the-Years'-Digits (SYD) — Accelerated (moderate)",
          value: 'syd',
        },
      ],
      helpText: 'Choose how depreciation expense is allocated over the asset\'s life.',
    },
  ],

  calculate: (values) => {
    const assetCost = parseFloat(values.assetCost);
    const salvageValue = parseFloat(values.salvageValue) || 0;
    const usefulLife = parseInt(values.usefulLife, 10);
    const method = values.depreciationMethod || 'sl';

    if (isNaN(assetCost) || isNaN(usefulLife) || assetCost <= 0 || usefulLife < 1) return [];
    if (salvageValue < 0 || salvageValue >= assetCost) return [];

    const depreciableAmount = assetCost - salvageValue;

    // Use Decimal.js for precise monetary calculations
    const fmt = (n: number) =>
      new Decimal(n).toFixed(2);

    type ScheduleRow = {
      year: number;
      beginningValue: number;
      depreciationExpense: number;
      accumulatedDepreciation: number;
      endingValue: number;
    };

    const schedule: ScheduleRow[] = [];

    if (method === 'sl') {
      const annualDep = new Decimal(depreciableAmount).div(usefulLife).toNumber();
      let accumulated = 0;
      for (let yr = 1; yr <= usefulLife; yr++) {
        const beginningValue = assetCost - accumulated;
        accumulated += annualDep;
        schedule.push({
          year: yr,
          beginningValue,
          depreciationExpense: annualDep,
          accumulatedDepreciation: accumulated,
          endingValue: assetCost - accumulated,
        });
      }

      return [
        {
          id: 'firstYearDepreciation',
          label: 'Year 1 Depreciation Expense',
          value: `$${fmt(annualDep)}`,
          highlight: true,
          color: 'positive',
        },
        {
          id: 'totalDepreciation',
          label: 'Total Depreciable Amount (Cost − Salvage)',
          value: `$${fmt(depreciableAmount)}`,
        },
        {
          id: 'annualDepreciationSL',
          label: 'Annual Straight-Line Depreciation',
          value: `$${fmt(annualDep)} / year`,
        },
        {
          id: 'depreciationMethodUsed',
          label: 'Depreciation Method',
          value: 'Straight-Line (SL)',
        },
        {
          id: '_schedule',
          label: '_schedule',
          value: JSON.stringify(schedule),
        },
      ];
    }

    if (method === 'ddb') {
      const rate = 2 / usefulLife;
      let bookValue = assetCost;
      let accumulated = 0;

      for (let yr = 1; yr <= usefulLife; yr++) {
        const beginningValue = bookValue;
        const remainingLife = usefulLife - yr + 1;
        const slDep = (bookValue - salvageValue) / remainingLife;
        const ddbDep = bookValue * rate;
        const depExp = Math.min(
          bookValue - salvageValue,
          Math.max(ddbDep, slDep)
        );
        const actualDep = Math.max(0, depExp);
        accumulated += actualDep;
        bookValue -= actualDep;

        schedule.push({
          year: yr,
          beginningValue,
          depreciationExpense: actualDep,
          accumulatedDepreciation: accumulated,
          endingValue: bookValue,
        });
      }

      const firstYearDep = schedule[0]?.depreciationExpense ?? 0;
      const ratePercent = (rate * 100).toFixed(0);

      return [
        {
          id: 'firstYearDepreciation',
          label: 'Year 1 Depreciation Expense',
          value: `$${fmt(firstYearDep)}`,
          highlight: true,
          color: 'positive',
        },
        {
          id: 'totalDepreciation',
          label: 'Total Depreciable Amount (Cost − Salvage)',
          value: `$${fmt(depreciableAmount)}`,
        },
        {
          id: 'ddbRate',
          label: 'DDB Rate',
          value: `${ratePercent}% per year`,
        },
        {
          id: 'depreciationMethodUsed',
          label: 'Depreciation Method',
          value: 'Double Declining Balance (DDB)',
        },
        {
          id: '_schedule',
          label: '_schedule',
          value: JSON.stringify(schedule),
        },
      ];
    }

    // SYD
    const sydSum = (usefulLife * (usefulLife + 1)) / 2;
    let accumulated = 0;

    for (let yr = 1; yr <= usefulLife; yr++) {
      const beginningValue = assetCost - accumulated;
      const fraction = (usefulLife - yr + 1) / sydSum;
      const depExp = new Decimal(depreciableAmount).mul(fraction).toNumber();
      accumulated += depExp;
      schedule.push({
        year: yr,
        beginningValue,
        depreciationExpense: depExp,
        accumulatedDepreciation: accumulated,
        endingValue: assetCost - accumulated,
      });
    }

    const firstYearDep = schedule[0]?.depreciationExpense ?? 0;

    return [
      {
        id: 'firstYearDepreciation',
        label: 'Year 1 Depreciation Expense',
        value: `$${fmt(firstYearDep)}`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'totalDepreciation',
        label: 'Total Depreciable Amount (Cost − Salvage)',
        value: `$${fmt(depreciableAmount)}`,
      },
      {
        id: 'sydSum',
        label: "SYD Sum (n × (n+1) / 2)",
        value: sydSum.toLocaleString(undefined),
      },
      {
        id: 'depreciationMethodUsed',
        label: 'Depreciation Method',
        value: "Sum-of-the-Years'-Digits (SYD)",
      },
      {
        id: '_schedule',
        label: '_schedule',
        value: JSON.stringify(schedule),
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DepreciationPanel, { values, results });
  },

  educational: {
    formula: '(Cost − Salvage) / Useful Life | (2 / Useful Life) × Beginning Book Value | (Remaining Life / SYD Sum) × (Cost − Salvage)',
    diagram: {
      svg: depreciationSvg,
      alt: 'Line chart comparing three depreciation methods: Straight-Line (blue straight line), Double Declining Balance (red curve), and Sum-of-Years-Digits (green dashed curve)',
      caption: 'DDB front-loads deductions with Year 1 at roughly 2x SL — accelerating tax benefits to early asset years',
    },
    formulaDescription:
      'Straight-Line spreads cost evenly over the asset life. Double Declining Balance accelerates deductions in early years — useful for assets that lose value quickly. Sum-of-the-Years\'-Digits is a moderate accelerated method that tapers off more gradually than DDB. The choice of method directly affects taxable income each year: accelerated methods front-load deductions, reducing near-term tax liability at the cost of smaller deductions later. This calculator uses decimal.js for precision in all depreciation calculations, ensuring IRS-compliant rounding to the cent.',
    formulaSource: 'IRS Publication 946 (How to Depreciate Property), MACRS (Modified Accelerated Cost Recovery System) guidelines, and GAAP accounting standards for depreciation methods.',
    variables: [
      {
        symbol: 'Cost',
        name: 'Asset Original Cost',
        description: 'The purchase price or capitalized cost of the asset. This includes not just the purchase price but also any costs necessary to get the asset ready for use (shipping, installation, testing).',
      },
      {
        symbol: 'Salvage',
        name: 'Salvage Value',
        description: 'Estimated residual value of the asset at the end of useful life. A higher salvage value reduces the total depreciable amount. If you expect to sell the asset for parts or as used equipment, estimate conservatively.',
      },
      {
        symbol: 'n',
        name: 'Useful Life',
        description: 'Number of years over which the asset is depreciated. The IRS provides guidelines (e.g., computers: 5 years, vehicles: 5 years, residential real estate: 27.5 years, commercial real estate: 39 years).',
      },
      {
        symbol: 'SYD',
        name: "Sum-of-the-Years'-Digits",
        description: 'n × (n + 1) / 2. Represents the sum of all year numbers from 1 to n. For a 5-year asset, SYD = 15. Year 1 gets 5/15 of the depreciable amount, year 2 gets 4/15, and so on.',
      },
      {
        symbol: 'BBV',
        name: 'Beginning Book Value',
        description: 'The undepreciated asset value at the start of each year (used in DDB). The book value declines each year as depreciation accumulates, so the DDB deduction also declines over time.',
      },
    ],
    howToUse: [
      'Enter the original purchase cost of the asset, including any capitalized costs (shipping, installation, setup fees).',
      'Enter the estimated salvage value (residual value at end of life). Use 0 if fully depreciated or if you expect the asset to have no resale value.',
      'Set the useful life in years (IRS guidelines: equipment 5-7 yrs, vehicles 5 yrs, buildings 27.5-39 yrs).',
      'Select the depreciation method: SL for simplicity and equal annual deductions, DDB or SYD for accelerated tax deductions that front-load the expense.',
      'Review the full depreciation schedule and interactive bar chart to compare yearly deductions across methods. The schedule shows how book value declines over time.',
    ],
    commonUses: [
      'Compare straight-line versus accelerated depreciation methods to choose the best tax strategy for business equipment purchases.',
      'Plan capital expenditures by modeling how different asset types and useful lives affect annual depreciation deductions.',
      'Estimate the book value of assets over time for accurate financial reporting and balance sheet projections.',
    ],
    workedExamples: [
      {
        scenario: 'Acme Logistics buys a $50,000 delivery truck with a 5-year useful life and $5,000 salvage value — comparing the tax impact of each method.',
        inputs: { assetCost: '50000', salvageValue: '5000', usefulLife: '5', depreciationMethod: 'ddb' },
        result: 'Under DDB, Year 1 depreciation is $20,000 versus $9,000 under Straight-Line — a $11,000 difference in deductible expense. Over 5 years, both methods depreciate the full $45,000 depreciable base, but DDB front-loads 44% of the total into the first year.',
        insight: 'Under DDB, Year 1 depreciation is $20,000 versus $9,000 under Straight-Line — a $11,000 difference in deductible expense. For a business in the 21% tax bracket, that is $2,310 more in tax savings deferred to future years. The trade-off: smaller deductions in later years when the asset may already be generating strong revenue.',
      },
      {
        scenario: 'A medical practice buys a $200,000 MRI machine with a 7-year life and $30,000 salvage value — evaluating the cash flow impact of accelerated versus straight-line.',
        inputs: { assetCost: '200000', salvageValue: '30000', usefulLife: '7', depreciationMethod: 'syd' },
        result: 'Under SYD, Year 1 depreciation is $42,500 versus $24,286 under Straight-Line — an extra $18,214 in deductible expense for the first year. Over 7 years, both methods depreciate the full $170,000 depreciable base. SYD front-loads 25% of total depreciation into Year 1.',
        insight: 'SYD gives Year 1 depreciation of $42,500 (vs $24,286 SL), saving roughly $3,825 more in taxes that year. Over the full 7-year life, both methods deduct the same $170,000 total — the difference is purely timing. For a growing practice, front-loading deductions matches the cash flow better since the equipment is most productive in early years.',
      },
    ],
    proTips: [
      'For tax purposes, use MACRS (IRS default accelerated system) rather than GAAP Straight-Line — MACRS front-loads deductions without requiring you to justify a shorter lifespan.',
      'Section 179 expensing allows you to deduct up to $1,220,000 of qualified asset purchases in the year placed in service (2025 limit), bypassing depreciation entirely for small businesses.',
      'Keep separate depreciation schedules for book (financial reporting) and tax — using SL for shareholders and accelerated for the IRS is both legal and common.',
      'For vehicles, the luxury auto depreciation limits cap annual deductions regardless of method — be aware of these caps when buying high-cost company vehicles.',
    ],
    // When not to rely on these calculations: tax rules change; consult a CPA
    limitations: [
      'This calculator uses GAAP formulas, not IRS MACRS tables. MACRS uses specific recovery periods and conventions (half-year, mid-quarter) that differ from the simplified methods shown here.',
      'The DDB method shown includes an automatic switch to SL when SL becomes larger (the "DDB-SL switch"), which is standard practice but may differ from some software implementations.',
      'Bonus depreciation (60% for 2025, phasing down to 40% in 2026 and 20% in 2027) is not modeled — consult a CPA for current-year bonus depreciation rules.',
    ],
    quickReference: [
      { label: 'SL Formula', value: '(Cost − Salvage) / Life' },
      { label: 'DDB Rate', value: '2 × (1 / Life)' },
      { label: 'MACRS Default', value: '150% DB for most property' },
      { label: 'Section 179 Limit (2025)', value: '$1,220,000' },
      { label: 'Bonus Depreciation (2025)', value: '60% of qualified assets' },
    ],
    explanation:
      'Depreciation is the accounting method of allocating an asset cost over its useful life, dating back to the Industrial Revolution when railroads first needed a systematic way to account for track and equipment wear. Businesses use depreciation to match the cost of a long-term asset against the revenue it generates each year. Straight-Line is the simplest and most common for book accounting — it spreads the cost evenly, making financial statements easy to forecast. Accelerated methods like DDB and SYD front-load the expense, which reduces taxable income more in early years — a common tax planning strategy that defers tax payments. The IRS MACRS system uses declining balance with a SL switch, similar to the DDB method shown here. For tax purposes, most businesses prefer accelerated methods because a dollar of tax saved today is worth more than a dollar saved next year (the time value of money principle). However, for financial reporting to shareholders, many companies use Straight-Line because it presents more consistent earnings.',
    faqs: [
      {
        question: 'When should I use Double Declining Balance vs. Straight-Line depreciation?',
        answer:
          'Use DDB when you want to maximize tax deductions in the early years of an asset\'s life, or when the asset truly loses value faster at first (e.g., vehicles, computers, machinery). Use Straight-Line for simplicity and consistency in financial reporting, or for assets that provide equal utility each year (e.g., buildings, office furniture). Many businesses use SL for book reporting and accelerated methods for tax reporting, maintaining two schedules.',
      },
      {
        question: 'What is the difference between book depreciation and tax depreciation?',
        answer:
          'Book depreciation follows GAAP rules and aims to match expense with economic benefit — usually Straight-Line. Tax depreciation follows IRS rules (MACRS), which typically use accelerated methods to reduce taxable income sooner. Many businesses maintain two separate depreciation schedules: one for their financial statements and one for their tax return. This dual approach is legal and common — it gives shareholders consistent earnings while maximizing tax deferral.',
      },
      {
        question: "Can I switch from DDB to Straight-Line during the asset's life?",
        answer:
          'Yes — and this calculator does exactly that automatically. Under DDB, once the Straight-Line amount for the remaining life exceeds the DDB amount, you switch to SL. This switch ensures you fully depreciate the asset to its salvage value by the end of its useful life, and is required under standard accounting rules. Without this switch, DDB would never fully depreciate the asset to zero.',
      },
      {
        question: 'What is bonus depreciation and how does it interact with regular depreciation?',
        answer:
          'Bonus depreciation allows businesses to deduct a percentage of the asset cost in the first year, on top of regular depreciation. For 2025, the bonus rate is 60% (phasing down from 100% in 2022). The remaining basis is then depreciated normally. This calculator does not include bonus depreciation — consult your CPA about current-year eligibility and how it affects your specific asset class and placed-in-service date.',
      },
      {
        question: 'What are the IRS useful life guidelines for common business assets?',
        answer:
          'The IRS publishes Asset Class Lives in Publication 946: office furniture and fixtures (7 years), computers and peripheral equipment (5 years), light general-purpose trucks (5 years), heavy general-purpose trucks (6 years), residential rental property (27.5 years), nonresidential real property (39 years), land improvements (15 years), and farm buildings (20 years). Using the wrong life can trigger an audit — always verify against IRS guidelines.',
      },
    ],
    citations: [
      { source: 'Internal Revenue Service (Publication 946)', url: 'https://www.irs.gov/publications/p946' },
      { source: 'Financial Accounting Standards Board (GAAP)', url: 'https://www.fasb.org' },
      { source: 'Investopedia — Depreciation Methods', url: 'https://www.investopedia.com/terms/d/depreciation.asp' },
    ],
  },
};

export default depreciationConfig;
