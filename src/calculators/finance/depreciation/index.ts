import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import DepreciationPanel from './DepreciationPanel';

function calcStraightLine(cost: number, salvage: number, life: number) {
  const annualDep = (cost - salvage) / life;
  const schedule: Array<{ year: number; depreciationExpense: number; accumulatedDepreciation: number; bookValue: number }> = [];
  let accumulated = 0;

  for (let yr = 1; yr <= life; yr++) {
    accumulated += annualDep;
    schedule.push({
      year: yr,
      depreciationExpense: annualDep,
      accumulatedDepreciation: accumulated,
      bookValue: cost - accumulated,
    });
  }

  return { annualDep, schedule, totalDep: cost - salvage };
}

/**
 * MACRS (IRS Pub. 946, Table A-1 method): half-year convention, salvage value ignored.
 * Lives up to 10 years use 200% declining balance, longer lives 150% DB (the IRS 15- and 20-year classes),
 * and 25+ years straight line. Declining balance switches to straight line over the remaining recovery
 * period (which includes the half year) as soon as that gives a larger deduction.
 */
export function calcMACRS(cost: number, life: number) {
  const straightLine = life >= 25;
  const rate = straightLine ? 1 / life : (life > 10 ? 1.5 : 2) / life;
  let bookValue = cost;
  const schedule: Array<{ year: number; depreciationExpense: number; accumulatedDepreciation: number; bookValue: number }> = [];
  const totalYears = life + 1; // half-year convention extends recovery by 1 year

  for (let yr = 1; yr <= totalYears; yr++) {
    if (bookValue <= 0) break;

    let dep: number;
    if (yr === 1) {
      dep = cost * rate * 0.5; // half-year convention
    } else if (straightLine) {
      dep = yr === totalYears ? cost * rate * 0.5 : cost * rate;
    } else {
      const db = bookValue * rate;
      const sl = bookValue / (life - yr + 1.5); // remaining recovery period incl. the half year
      dep = Math.max(db, sl);
    }

    dep = Math.min(Math.max(dep, 0), bookValue);
    if (yr === totalYears) dep = bookValue; // clear the last rounding crumbs

    const accumulated = cost - bookValue + dep;
    schedule.push({
      year: yr,
      depreciationExpense: dep,
      accumulatedDepreciation: accumulated,
      bookValue: cost - accumulated,
    });

    bookValue -= dep;
  }

  const firstYearDep = schedule.length > 0 ? schedule[0].depreciationExpense : 0;
  return { firstYearDep, schedule, totalDep: cost };
}

const depreciationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'assetCost',
      label: 'Asset Cost',
      type: 'number',
      placeholder: '50,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Purchase price or capitalized cost of the asset.',
    },
    {
      id: 'salvageValue',
      label: 'Salvage Value (estimated residual value)',
      type: 'number',
      placeholder: '5,000',
      prefix: '$',
      min: 0,
      step: 500,
      required: false,
      helpText: 'Estimated value at the end of useful life. Enter 0 if fully depreciated.',
    },
    {
      id: 'usefulLife',
      label: 'Useful Life',
      type: 'number',
      placeholder: '5',
      unit: 'years',
      inputMode: 'decimal',
      min: 1,
      max: 40,
      step: 1,
      required: true,
      helpText: 'Number of years the asset is expected to be in service.',
    },
    {
      id: 'method',
      label: 'Depreciation Method',
      type: 'select',
      required: true,
      options: [
        { label: 'Straight Line — Equal annual deductions', value: 'straight-line' },
        { label: 'MACRS — 200% Declining Balance with half-year convention', value: 'macrs' },
      ],
      helpText: 'Straight Line spreads deductions evenly; MACRS accelerates them for greater tax savings early on.',
    },
  ],

  calculate: (values) => {
    const assetCost = parseFloat(values.assetCost);
    const salvageValue = parseFloat(values.salvageValue) || 0;
    const usefulLife = parseInt(values.usefulLife, 10);
    const method = values.method || 'straight-line';

    if (isNaN(assetCost) || isNaN(usefulLife) || assetCost <= 0 || usefulLife < 1) return [];
    if (salvageValue < 0 || salvageValue >= assetCost) return [];

    const depreciableBasis = assetCost - salvageValue;
    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (method === 'straight-line') {
      const { annualDep, schedule, totalDep } = calcStraightLine(assetCost, salvageValue, usefulLife);
      const lastScheduleEntry = schedule[schedule.length - 1];

      return [
        {
          id: 'annualDepreciation',
          label: 'Annual Depreciation Expense',
          value: `$${fmt(annualDep)} / year`,
          highlight: true,
          color: 'positive' as const,
          interpretation: `Straight-line spreads the $${fmt(depreciableBasis)} depreciable basis evenly across ${usefulLife} years — same deduction every year, easiest to plan around. It's a paper expense, not a cash outflow; useful life and salvage value are estimates, and tax rules may require a different method (like MACRS) for actual filings.`,
        },
        {
          id: 'totalDepreciation',
          label: 'Total Depreciation Over Life',
          value: `$${fmt(totalDep)}`,
          color: 'neutral' as const,
        },
        {
          id: 'depreciableBasis',
          label: 'Depreciable Basis (Cost − Salvage)',
          value: `$${fmt(depreciableBasis)}`,
          color: 'neutral' as const,
        },
        {
          id: '_schedule',
          label: '_schedule',
          value: JSON.stringify(schedule),
        },
        {
          id: 'bookValue',
          label: 'Ending Book Value',
          value: `$${fmt(lastScheduleEntry?.bookValue ?? 0)}`,
          color: 'neutral' as const,
        },
        {
          id: 'method',
          label: 'Depreciation Method',
          value: 'Straight Line',
          color: 'neutral' as const,
        },
      ];
    }

    // MACRS
    const { firstYearDep, schedule, totalDep } = calcMACRS(assetCost, usefulLife);
    const lastScheduleEntry = schedule[schedule.length - 1];

    return [
      {
        id: 'annualDepreciation',
        label: 'Year 1 Depreciation (half-year convention)',
        value: `$${fmt(firstYearDep)}`,
        highlight: true,
        color: 'positive' as const,
        interpretation: `MACRS depreciates the full $${fmt(assetCost)} cost over ${schedule.length} tax years (${usefulLife} + 1 for the half-year convention) and ignores salvage value${salvageValue > 0 ? `, so the $${fmt(salvageValue)} salvage you entered has no effect here` : ''}. It front-loads deductions, which defers tax. Use the schedule below on your return only for assets in an IRS property class (3, 5, 7, 10, 15 or 20 years).`,
      },
      {
        id: 'totalDepreciation',
        label: 'Total Depreciation Over Life',
        value: `$${fmt(totalDep)}`,
        color: 'neutral' as const,
      },
      {
        id: 'depreciableBasis',
        label: 'Depreciable Basis (full cost — MACRS ignores salvage)',
        value: `$${fmt(assetCost)}`,
        color: 'neutral' as const,
      },
      {
        id: '_schedule',
        label: '_schedule',
        value: JSON.stringify(schedule),
      },
      {
        id: 'bookValue',
        label: 'Ending Book Value',
        value: `$${fmt(lastScheduleEntry?.bookValue ?? 0)}`,
        color: 'neutral' as const,
      },
      {
        id: 'method',
        label: 'Depreciation Method',
        value: usefulLife >= 25 ? 'MACRS (straight line, half-year convention)' : `MACRS (${usefulLife > 10 ? '150%' : '200%'} DB with half-year convention)`,
        color: 'neutral' as const,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DepreciationPanel, { values, results });
  },

  educational: {
    formula: 'Straight Line: (Cost − Salvage) / Useful Life | MACRS: 200% DB (150% DB for 15-20 yr) with half-year convention, salvage ignored',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Depreciation: Asset Value Over Time</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Straight Line vs. MACRS — different timing (MACRS ignores salvage)</text><g transform="translate(35,60)"><!-- Y-axis --><text x="-10" y="120" text-anchor="middle" font-size="10" fill="var(--svg-64748b)" transform="rotate(-90,-10,120)">Book Value ($)</text><!-- Grid lines --><line x1="30" y1="20" x2="370" y2="20" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="24" text-anchor="end" font-size="9" fill="var(--svg-64748b)">$50K</text><line x1="30" y1="68" x2="370" y2="68" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="72" text-anchor="end" font-size="9" fill="var(--svg-64748b)">$38K</text><line x1="30" y1="116" x2="370" y2="116" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="120" text-anchor="end" font-size="9" fill="var(--svg-64748b)">$25K</text><line x1="30" y1="164" x2="370" y2="164" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="168" text-anchor="end" font-size="9" fill="var(--svg-64748b)">$13K</text><line x1="30" y1="212" x2="370" y2="212" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="216" text-anchor="end" font-size="9" fill="var(--svg-64748b)">$5K</text><line x1="30" y1="20" x2="30" y2="212" stroke="var(--svg-cbd5e1)" stroke-width="1"/><!-- Straight Line (blue straight line) --><line x1="50" y1="25" x2="370" y2="205" stroke="var(--svg-3b82f6)" stroke-width="3" stroke-linecap="round"/><text x="310" y="100" font-size="10" fill="var(--svg-3b82f6)" font-weight="bold">Straight Line</text><text x="310" y="115" font-size="8" fill="var(--svg-64748b)">Equal $9K/yr</text><!-- MACRS (purple declining curve) --><path d="M 50,25 Q 100,35 140,75 Q 190,115 240,145 Q 290,170 340,190 Q 355,197 370,205" fill="none" stroke="var(--svg-8b5cf6)" stroke-width="3" stroke-linecap="round"/><text x="180" y="65" font-size="10" fill="var(--svg-8b5cf6)" font-weight="bold">MACRS</text><text x="180" y="80" font-size="8" fill="var(--svg-64748b)">Accelerated early</text><!-- X-axis labels --><text x="50" y="226" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Yr 1</text><text x="114" y="226" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Yr 2</text><text x="178" y="226" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Yr 3</text><text x="242" y="226" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Yr 4</text><text x="306" y="226" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Yr 5</text><text x="370" y="226" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Yr 6</text></g><!-- Key insight --><g transform="translate(40,250)"><rect x="10" y="0" width="370" height="50" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">SL depreciates cost minus salvage; MACRS the full cost</text><text x="195" y="36" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">MACRS front-loads deductions for tax savings now; Straight Line spreads evenly</text></g><g transform="translate(40,315)"><text x="180" y="10" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Depreciation = (Cost − Salvage) / Life (Straight Line)</text></g></svg>',
      alt: 'Line chart comparing Straight Line (straight blue line) versus MACRS (declining purple curve) depreciation methods over a 5-year asset life',
      caption: 'Straight Line distributes depreciation evenly; MACRS accelerates deductions to earlier years for greater tax savings up front',
    },
    formulaDescription:
      'Straight Line spreads the depreciable amount evenly over the asset\'s useful life. MACRS (Modified Accelerated Cost Recovery System) uses 200% Declining Balance for 3-, 5-, 7- and 10-year property (150% for 15- and 20-year property) with a half-year convention — year 1 gets half the normal rate, and the recovery period extends by one year. MACRS switches to Straight Line when SL over the remaining recovery period produces a larger deduction, ensuring the asset is fully depreciated, and it ignores salvage value, so the entire cost is recovered. The results match the IRS percentage tables in Publication 946 (Table A-1) for the standard classes.',
    variables: [
      {
        symbol: 'Cost',
        name: 'Asset Cost',
        description: 'The purchase price or capitalized cost of the asset. For tax purposes, this typically includes shipping, installation, and any costs to prepare the asset for use.',
      },
      {
        symbol: 'Salvage',
        name: 'Salvage Value',
        description: 'Estimated residual value of the asset at the end of useful life. Under MACRS, salvage value is generally ignored for tax depreciation — the full cost is depreciated.',
      },
      {
        symbol: 'n',
        name: 'Useful Life',
        description: 'Number of years over which the asset is depreciated. The IRS assigns recovery periods to asset classes (e.g., 5-year for computers and vehicles, 7-year for office equipment, 27.5-year for residential rentals).',
      },
      {
        symbol: '200% DB',
        name: '200% Declining Balance',
        description: 'An accelerated method that doubles the straight-line rate and applies it to the declining book value each year. This produces the largest deductions in the earliest years.',
      },
      {
        symbol: 'Half-Year',
        name: 'Half-Year Convention',
        description: 'Under MACRS, year 1 (and year n+1) receive only half the normal depreciation, reflecting mid-year asset placement. This effectively extends the recovery period by one year beyond the stated useful life.',
      },
    ],
    howToUse: [
      'Enter the original purchase cost of the asset, including any capitalized costs.',
      'Enter the estimated salvage value at end of life (use 0 if none). Straight Line uses it; MACRS ignores it, as the IRS does.',
      'Set the useful life in years (e.g., 5–7 years for equipment, 27.5–39 for real estate).',
      'Select Straight Line for equal annual deductions, or MACRS for accelerated tax depreciation with half-year convention.',
      'Review the bar chart and year-by-year schedule to compare methods side by side.',
    ],
    commonUses: [
      'Calculate annual depreciation deductions for business equipment using Straight Line or MACRS methods for tax reporting.',
      'Compare different depreciation methods side by side to determine which strategy minimizes taxable income in early asset years.',
      'Project the declining book value of assets over their useful life for accurate financial statements and budget planning.',
    ],
    explanation:
      'Depreciation allows businesses to recover the cost of long-term assets over their useful lives. Straight Line is the simplest method — equal deductions every year. MACRS is the IRS-prescribed system for most tangible property used in business. It uses 200% Declining Balance (150% for 15- and 20-year property) with a half-year convention, meaning you get a larger deduction in the early years and a smaller one later. The half-year convention assumes the asset was placed in service mid-year, so year 1 gets half the normal DB amount and the recovery period extends by one year. MACRS automatically switches to Straight Line in later years when SL produces a larger deduction — this is called the "SL switch" and prevents the asset from being under-depreciated. For tax planning, MACRS is usually preferred because accelerating deductions defers tax payments, and the time value of money makes earlier deductions more valuable than later ones.',
    faqs: [
      {
        question: 'What is the half-year convention?',
        answer:
          'The half-year convention assumes an asset is placed in service at the midpoint of the year, regardless of when it was actually purchased. This means year 1 depreciation is half of the full first-year amount. The recovery period extends by one year at the end to compensate. For example, a 5-year asset under MACRS actually generates depreciation deductions over 6 tax years.',
      },
      {
        question: 'When should I use MACRS vs. Straight Line?',
        answer:
          'Most businesses must use MACRS for tax depreciation under IRS rules. Straight Line is typically used for book/GAAP financial reporting. If you are estimating tax deductions, use MACRS. If you want simplicity and equal annual expenses for internal budgeting, use Straight Line. Some businesses use both — MACRS for their tax return and Straight Line for their financial statements.',
      },
      {
        question: 'Does MACRS apply to real estate?',
        answer:
          'Yes, but real estate uses different recovery periods: 27.5 years for residential rental property and 39 years for commercial property. Real estate also uses Straight Line under MACRS, not 200% DB. This calculator allows up to 40 years of useful life for such cases. Note that land cannot be depreciated — only the building and improvements.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    
    workedExamples: [
      {
        scenario: 'Rebecca runs a graphic design studio in Austin, TX and purchased new computer equipment for $12,000. She expects it to have a salvage value of $1,500 after its 5-year useful life. She enters these values to compare Straight Line vs. MACRS depreciation.',
        inputs: { assetCost: '12000', salvageValue: '1500', usefulLife: '5', method: 'straight-line' },
        result: 'Straight Line annual depreciation: $2,100/year. Depreciable basis: $10,500 (cost minus salvage). After 5 years, the equipment has a book value of exactly $1,500 — the salvage value. Total depreciation matches the depreciable basis.',
        insight: 'Rebecca\'s equipment depreciates by an equal $2,100 each year under Straight Line. This method is simple and predictable — perfect for internal budgeting and GAAP financial statements. If she switches to MACRS, her Year 1 deduction jumps to $2,400 (double the SL rate with half-year convention), giving her a larger tax deduction upfront. The choice between methods depends on whether she prioritizes simplicity (Straight Line) or accelerating tax deductions (MACRS). Note that MACRS ignores salvage value for tax purposes — the entire $12,000 cost is depreciated, which this calculator reflects.',
      },
      {
        scenario: 'Carlos owns a fabrication shop in Phoenix, AZ and bought a $55,000 machine classed as 7-year property, with an estimated $5,000 salvage value. He uses MACRS to maximize early-year tax deductions.',
        inputs: { assetCost: '55000', salvageValue: '5000', usefulLife: '7', method: 'macrs' },
        result: 'MACRS Year 1 depreciation: $7,857.14 (200% DB with half-year convention applied to $55,000), then $13,469.39, $9,620.99 and so on over 8 tax years. Total depreciation: $55,000 — MACRS ignores the $5,000 salvage, so the book value ends at $0.',
        insight: 'MACRS front-loads Carlos\'s deductions — Year 1 at $7,857 is about 10% more than Straight Line would give him on cost minus salvage ($7,143/year), and Year 2 is far larger at $13,469. This acceleration matters because a dollar saved on taxes today is worth more than a dollar saved five years from now, thanks to the time value of money. The half-year convention spreads his 7-year asset across 8 tax years, with Year 1 and Year 8 each getting roughly half the normal amount. For a business with high upfront equipment costs, MACRS is almost always the right choice for tax filing because the accelerated deductions improve near-term cash flow.',
      },
    ],

    proTips: [
      'MACRS almost always beats Straight Line for tax purposes because it front-loads deductions. The time value of money means a $10,000 deduction this year is worth more than the same deduction spread evenly over 5 years — use MACRS unless you have a specific reason not to.',
      'The half-year convention means a "5-year" MACRS asset actually generates deductions across 6 tax years. Plan your asset purchases accordingly — under the half-year convention the month you place an asset in service does not change your Year 1 deduction, unless more than 40% of the depreciable property you place in service that year lands in the last quarter, which triggers the less favorable mid-quarter convention.',
      'Section 179 expensing allows you to deduct the FULL cost of qualifying equipment (up to $2,560,000 for 2026, reduced dollar for dollar once equipment placed in service exceeds $4,090,000 — Rev. Proc. 2025-32) in the year of purchase instead of depreciating over time. Always compare Section 179 against MACRS — for smaller purchases under the limit, immediate expensing is usually the best tax strategy.',
      'For real estate, MACRS uses Straight Line (not accelerated): 27.5 years for residential rental property and 39 years for commercial property. Land is never depreciable — only the building and capital improvements. This calculator supports useful lives up to 40 years for these cases.',
    ],

    quickReference: [
      { label: 'Straight Line Formula', value: '(Cost − Salvage Value) ÷ Useful Life — equal annual deductions' },
      { label: 'MACRS Rate', value: '200% DB (150% DB for 15- and 20-year property) with half-year convention, auto-switches to SL when optimal; salvage ignored' },
      { label: 'IRS 5-Year Property', value: 'Computers, office machinery, cars and light trucks, construction equipment' },
      { label: 'IRS 7-Year Property', value: 'Office furniture, fixtures, agricultural equipment' },
      { label: 'IRS 27.5-Year Property', value: 'Residential rental real estate (Straight Line only under MACRS)' },
      { label: 'IRS 39-Year Property', value: 'Commercial real estate (Straight Line only under MACRS)' },
      { label: 'Section 179 Limit (2026)', value: 'Up to $2,560,000 immediate expensing, phasing out above $4,090,000 of equipment placed in service' },
      { label: 'Half-Year Convention', value: 'Year 1 gets 50% of normal depreciation regardless of purchase month' },
    ],

    limitations: [
      'MACRS here uses the half-year convention with the automatic SL switch, which reproduces the IRS percentage tables (Publication 946, Table A-1) for 3-, 5-, 7-, 10-, 15- and 20-year property to within rounding. It does not model the mid-quarter or mid-month conventions. Real property (27.5 and 39 years) uses straight line with the mid-month convention, so for 25+ year lives this calculator is an approximation.',
      'This calculator applies to tangible personal property only. Intangible assets (patents, copyrights, goodwill) use amortization under Section 197 (15-year straight line) rather than depreciation. Land, inventory, and personal-use property are not depreciable.',
      'It does not account for bonus depreciation (the One Big Beautiful Bill Act restored 100% bonus depreciation, permanently, for qualified property acquired after January 19, 2025). Bonus depreciation can take the whole cost in the first year instead of the MACRS schedule.',
      'State depreciation rules may differ from federal MACRS. Some states decouple from federal bonus depreciation or have different recovery periods. Always verify state treatment separately when planning tax strategy.',
    ],
citations: [
      { source: 'Internal Revenue Service (Publication 946)', url: 'https://www.irs.gov/publications/p946' },
      { source: 'Investopedia', url: 'https://www.investopedia.com/terms/d/depreciation.asp' },
    ],
  },
};

export default depreciationConfig;
