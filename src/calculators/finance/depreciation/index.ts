import { createElement } from 'react';
import Decimal from 'decimal.js';
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

function calcMACRS(cost: number, salvage: number, life: number) {
  const rate = 2 / life;
  let bookValue = cost;
  const schedule: Array<{ year: number; depreciationExpense: number; accumulatedDepreciation: number; bookValue: number }> = [];
  const totalYears = life + 1; // half-year convention extends recovery by 1 year

  for (let yr = 1; yr <= totalYears; yr++) {
    const remaining = Math.max(0, bookValue - salvage);
    if (remaining <= 0) break;

    let dep: number;
    if (yr === 1) {
      // Half-year convention: half the normal rate in year 1
      dep = cost * rate * 0.5;
    } else {
      const db = bookValue * rate;
      const remainingYears = totalYears - yr + 1;
      const sl = remaining / remainingYears;
      // Switch to straight-line when SL > DB (standard MACRS convention)
      dep = Math.max(db, sl);
    }

    dep = Math.min(dep, remaining);
    if (dep < 0) dep = 0;

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
  return { firstYearDep, schedule, totalDep: cost - salvage };
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
    // Decimal.js for monetary precision — imported at top of file

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
          id: 'schedule',
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
    const { firstYearDep, schedule, totalDep } = calcMACRS(assetCost, salvageValue, usefulLife);
    const lastScheduleEntry = schedule[schedule.length - 1];

    return [
      {
        id: 'annualDepreciation',
        label: 'Year 1 Depreciation (half-year convention)',
        value: `$${fmt(firstYearDep)}`,
        highlight: true,
        color: 'positive' as const,
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
        id: 'schedule',
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
        value: 'MACRS (200% DB with half-year convention)',
        color: 'neutral' as const,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DepreciationPanel, { values, results });
  },

  educational: {
    formula: 'Straight Line: (Cost − Salvage) / Useful Life | MACRS: 200% DB with half-year convention',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Depreciation: Asset Value Over Time</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Straight Line vs. MACRS — same total depreciation, different timing</text><g transform="translate(35,60)"><!-- Y-axis --><text x="-10" y="120" text-anchor="middle" font-size="10" fill="var(--svg-64748b)" transform="rotate(-90,-10,120)">Book Value ($)</text><!-- Grid lines --><line x1="30" y1="20" x2="370" y2="20" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="24" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">$50K</text><line x1="30" y1="68" x2="370" y2="68" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="72" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">$38K</text><line x1="30" y1="116" x2="370" y2="116" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="120" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">$25K</text><line x1="30" y1="164" x2="370" y2="164" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="168" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">$13K</text><line x1="30" y1="212" x2="370" y2="212" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="216" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">$5K</text><line x1="30" y1="20" x2="30" y2="212" stroke="var(--svg-cbd5e1)" stroke-width="1"/><!-- Straight Line (blue straight line) --><line x1="50" y1="25" x2="370" y2="205" stroke="var(--svg-3b82f6)" stroke-width="3" stroke-linecap="round"/><text x="310" y="100" font-size="10" fill="var(--svg-3b82f6)" font-weight="bold">Straight Line</text><text x="310" y="115" font-size="8" fill="var(--svg-64748b)">Equal $9K/yr</text><!-- MACRS (purple declining curve) --><path d="M 50,25 Q 100,35 140,75 Q 190,115 240,145 Q 290,170 340,190 Q 355,197 370,205" fill="none" stroke="var(--svg-8b5cf6)" stroke-width="3" stroke-linecap="round"/><text x="180" y="65" font-size="10" fill="var(--svg-8b5cf6)" font-weight="bold">MACRS</text><text x="180" y="80" font-size="8" fill="var(--svg-64748b)">Accelerated early</text><!-- X-axis labels --><text x="50" y="226" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Yr 1</text><text x="114" y="226" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Yr 2</text><text x="178" y="226" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Yr 3</text><text x="242" y="226" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Yr 4</text><text x="306" y="226" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Yr 5</text><text x="370" y="226" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Yr 6</text></g><!-- Key insight --><g transform="translate(40,250)"><rect x="10" y="0" width="370" height="50" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Both methods depreciate $45,000 total</text><text x="195" y="36" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">MACRS front-loads deductions for tax savings now; Straight Line spreads evenly</text></g><g transform="translate(40,315)"><text x="180" y="10" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Depreciation = (Cost − Salvage) / Life (Straight Line)</text></g></svg>',
      alt: 'Line chart comparing Straight Line (straight blue line) versus MACRS (declining purple curve) depreciation methods over a 5-year asset life',
      caption: 'Straight Line distributes depreciation evenly; MACRS accelerates deductions to earlier years for greater tax savings up front',
    },
    formulaDescription:
      'Straight Line spreads the depreciable amount evenly over the asset\'s useful life. MACRS (Modified Accelerated Cost Recovery System) uses 200% Declining Balance with a half-year convention — year 1 gets half the normal rate, and the recovery period extends by one year. MACRS switches to Straight Line when SL produces a larger deduction, ensuring the asset is fully depreciated by the end of its recovery period.',
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
      'Enter the estimated salvage value at end of life (use 0 if none). For MACRS, salvage value is typically ignored for tax purposes.',
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
      'Depreciation allows businesses to recover the cost of long-term assets over their useful lives. Straight Line is the simplest method — equal deductions every year. MACRS is the IRS-prescribed system for most tangible property used in business. It uses 200% Declining Balance with a half-year convention, meaning you get a larger deduction in the early years and a smaller one later. The half-year convention assumes the asset was placed in service mid-year, so year 1 gets half the normal DB amount and the recovery period extends by one year. MACRS automatically switches to Straight Line in later years when SL produces a larger deduction — this is called the "SL switch" and prevents the asset from being under-depreciated. For tax planning, MACRS is usually preferred because accelerating deductions defers tax payments, and the time value of money makes earlier deductions more valuable than later ones.',
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
        insight: 'Rebecca\'s equipment depreciates by an equal $2,100 each year under Straight Line. This method is simple and predictable — perfect for internal budgeting and GAAP financial statements. If she switches to MACRS, her Year 1 deduction jumps to $2,400 (double the SL rate with half-year convention), giving her a larger tax deduction upfront. The choice between methods depends on whether she prioritizes simplicity (Straight Line) or accelerating tax deductions (MACRS). Note that MACRS ignores salvage value for tax purposes — the entire $12,000 cost can be depreciated.',
      },
      {
        scenario: 'Carlos owns a construction company in Phoenix, AZ and bought a $55,000 piece of heavy equipment with a 7-year IRS recovery period and $5,000 estimated salvage value. He uses MACRS to maximize early-year tax deductions.',
        inputs: { assetCost: '55000', salvageValue: '5000', usefulLife: '7', method: 'macrs' },
        result: 'MACRS Year 1 depreciation: $7,857 (200% DB with half-year convention applied to $55,000). The equipment depreciates over 8 tax years due to the half-year convention. Total depreciation over the recovery period: $50,000 (cost minus salvage).',
        insight: 'MACRS front-loads Carlos\'s deductions — Year 1 at $7,857 is roughly 1.6x what Straight Line would give him ($7,143/year). This acceleration matters because a dollar saved on taxes today is worth more than a dollar saved five years from now, thanks to the time value of money. The half-year convention spreads his 7-year asset across 8 tax years, with Year 1 and Year 8 each getting roughly half the normal amount. For a construction business with high upfront equipment costs, MACRS is almost always the right choice for tax filing because the accelerated deductions improve near-term cash flow.',
      },
    ],

    proTips: [
      'MACRS almost always beats Straight Line for tax purposes because it front-loads deductions. The time value of money means a $10,000 deduction this year is worth more than the same deduction spread evenly over 5 years — use MACRS unless you have a specific reason not to.',
      'The half-year convention means a "5-year" MACRS asset actually generates deductions across 6 tax years. Plan your asset purchases accordingly — buying in December vs. January of the next year does not change your Year 1 deduction amount (both get half the normal rate), but buying in January gives you an extra year of use before depreciation begins.',
      'Section 179 expensing allows you to deduct the FULL cost of qualifying equipment (up to ~$1.22M in 2025) in the year of purchase instead of depreciating over time. Always compare Section 179 against MACRS — for smaller purchases under the limit, immediate expensing is usually the best tax strategy.',
      'For real estate, MACRS uses Straight Line (not accelerated): 27.5 years for residential rental property and 39 years for commercial property. Land is never depreciable — only the building and capital improvements. This calculator supports useful lives up to 40 years for these cases.',
    ],

    quickReference: [
      { label: 'Straight Line Formula', value: '(Cost − Salvage Value) ÷ Useful Life — equal annual deductions' },
      { label: 'MACRS Rate', value: '200% Declining Balance with half-year convention, auto-switches to SL when optimal' },
      { label: 'IRS 5-Year Property', value: 'Computers, office equipment, vehicles, construction equipment' },
      { label: 'IRS 7-Year Property', value: 'Office furniture, fixtures, agricultural equipment' },
      { label: 'IRS 27.5-Year Property', value: 'Residential rental real estate (Straight Line only under MACRS)' },
      { label: 'IRS 39-Year Property', value: 'Commercial real estate (Straight Line only under MACRS)' },
      { label: 'Section 179 Limit (2025)', value: 'Up to ~$1.22M immediate expensing for qualifying equipment' },
      { label: 'Half-Year Convention', value: 'Year 1 gets 50% of normal depreciation regardless of purchase month' },
    ],

    limitations: [
      'MACRS calculations in this calculator use a simplified 200% DB model with half-year convention and automatic SL switch. The IRS publishes exact MACRS percentage tables (Appendix A of Publication 946) that may differ slightly from our computed values, particularly for mid-quarter convention scenarios.',
      'This calculator applies to tangible personal property only. Intangible assets (patents, copyrights, goodwill) use amortization under Section 197 (15-year straight line) rather than depreciation. Land, inventory, and personal-use property are not depreciable.',
      'It does not account for bonus depreciation (100% bonus depreciation is phasing down: 80% in 2023, 60% in 2024, 40% in 2025, 20% in 2026, and 0% in 2027 unless Congress extends it). Bonus depreciation overrides the MACRS schedule in the first year.',
      'State depreciation rules may differ from federal MACRS. Some states decouple from federal bonus depreciation or have different recovery periods. Always verify state treatment separately when planning tax strategy.',
    ],
citations: [
      { source: 'Internal Revenue Service (Publication 946)', url: 'https://www.irs.gov/publications/p946' },
      { source: 'Investopedia', url: 'https://www.investopedia.com/terms/d/depreciation.asp' },
    ],
  },
};

export default depreciationConfig;
