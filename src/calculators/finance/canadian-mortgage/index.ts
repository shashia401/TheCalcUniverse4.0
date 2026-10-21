import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult, ExplainStep } from '../../../types/calculator';
import { finiteSteps } from '../../../utils/explainGuard';
import { hasAnswer, resultValue } from '../../../utils/explainResults';
import { pmt } from '../../../utils/financial';
import CanadianMortgagePanel from './CanadianMortgagePanel';
import { money2dp as fmt } from '../../../lib/format';

/// ─── CMHC Insurance Premium Tiers ─────────────────────────────────────
function cmhcPremiumRate(loanToValue: number): number {
  if (loanToValue <= 0.65) return 0.006;
  if (loanToValue <= 0.75) return 0.017;
  if (loanToValue <= 0.80) return 0.024;
  if (loanToValue <= 0.85) return 0.028;
  if (loanToValue <= 0.90) return 0.031;
  if (loanToValue <= 0.95) return 0.04;
  return 0.04;
}

/// ─── Provincial Land Transfer Tax (LTT) Rates (verified against provincial/city sources, 2026) ───
interface LTTBracket { min: number; max: number; rate: number }
interface LTTData {
  provincial: LTTBracket[];
  municipal?: { city: string; rates: LTTBracket[]; rebate?: number }[];
  firstTimeRebate?: number;
  description: string;
}

const LAND_TRANSFER_TAXES: Record<string, LTTData> = {
  alberta: { description: 'No land transfer tax. Land Titles registration fees apply instead: $50 + $5 per $5,000 of value for the transfer, and the same formula on the mortgage amount (since Oct. 20, 2024).', provincial: [] },
  bc: {
    description: '1% on first $200K, 2% on $200K–$2M, 3% on $2M–$3M, 5% above $3M. Eligible first-time buyers are exempt from up to $8,000 of tax on homes up to $835,000 (phasing out to $0 at $860,000).',
    provincial: [
      { min: 0, max: 200000, rate: 0.01 },
      { min: 200000, max: 2000000, rate: 0.02 },
      { min: 2000000, max: 3000000, rate: 0.03 },
      { min: 3000000, max: Infinity, rate: 0.05 },
    ],
    firstTimeRebate: 8000,
  },
  manitoba: {
    description: '0% on first $30K, 0.5% on $30K–$90K, 1% on $90K–$150K, 1.5% on $150K–$200K, 2% above $200K.',
    provincial: [
      { min: 0, max: 30000, rate: 0 },
      { min: 30000, max: 90000, rate: 0.005 },
      { min: 90000, max: 150000, rate: 0.01 },
      { min: 150000, max: 200000, rate: 0.015 },
      { min: 200000, max: Infinity, rate: 0.02 },
    ],
  },
  newfoundland: {
    description: 'No land transfer tax. Deed registration fee of $100 + $0.40 per $100 above $500 (about 0.4% of value); a mortgage registration fee on the same formula applies separately and is not included.',
    provincial: [{ min: 500, max: Infinity, rate: 0.004 }],
  },
  'nova-scotia': { description: 'Deed transfer tax is set by each municipality (typically 0.5%–1.5%). Estimate uses Halifax and many other municipalities at 1.5%; check your municipality.', provincial: [{ min: 0, max: Infinity, rate: 0.015 }] },
  'new-brunswick': { description: 'Flat 1% of the purchase price.', provincial: [{ min: 0, max: Infinity, rate: 0.01 }] },
  ontario: {
    description: '0.5% on first $55K, 1% on $55K–$250K, 1.5% on $250K–$400K, 2% on $400K–$2M, 2.5% above $2M. First-time buyers get up to $4,000 rebate. Toronto adds a municipal tax (up to $4,475 first-time buyer refund); for homes with one or two single-family residences, Toronto municipal rate rises on the part of the price above $3M (4.40% to 8.60%, graduated) from April 1, 2026, as adopted by City Council on December 17, 2025 (City of Toronto MLTT rates page). These upper-band rates are applied to every Toronto purchase here, so a multi-unit property over $3M may be taxed differently.',
    provincial: [
      { min: 0, max: 55000, rate: 0.005 },
      { min: 55000, max: 250000, rate: 0.01 },
      { min: 250000, max: 400000, rate: 0.015 },
      { min: 400000, max: 2000000, rate: 0.02 },
      { min: 2000000, max: Infinity, rate: 0.025 },
    ],
    municipal: [{
      city: 'Toronto',
      rates: [
        { min: 0, max: 55000, rate: 0.005 },
        { min: 55000, max: 250000, rate: 0.01 },
        { min: 250000, max: 400000, rate: 0.015 },
        { min: 400000, max: 2000000, rate: 0.02 },
        { min: 2000000, max: 3000000, rate: 0.025 },
        // Graduated high-value rates effective April 1, 2026 (1-2 single-family residences)
        { min: 3000000, max: 4000000, rate: 0.044 },
        { min: 4000000, max: 5000000, rate: 0.0545 },
        { min: 5000000, max: 10000000, rate: 0.065 },
        { min: 10000000, max: 20000000, rate: 0.0755 },
        { min: 20000000, max: Infinity, rate: 0.086 },
      ],
      rebate: 4475,
    }],
    firstTimeRebate: 4000,
  },
  'prince-edward-island': {
    description: '1% of the greater of purchase price or assessed value. Qualifying first-time buyers (residency and prior-ownership conditions apply) can have the tax waived.',
    provincial: [{ min: 0, max: Infinity, rate: 0.01 }],
    firstTimeRebate: Infinity,
  },
  quebec: {
    description: 'Welcome tax (2026 brackets): 0.5% on first $62,900, 1% on $62,900–$315,000, 1.5% above $315,000. Brackets are indexed yearly; some municipalities (e.g. Montréal) charge higher rates on the slice above $500,000. First-time buyers receive at most an $875 tax credit, not modelled here.',
    provincial: [
      { min: 0, max: 62900, rate: 0.005 },
      { min: 62900, max: 315000, rate: 0.01 },
      { min: 315000, max: Infinity, rate: 0.015 },
    ],
  },
  saskatchewan: { description: 'No land transfer tax. A land titles transfer fee of roughly 0.3%–0.4% of value applies instead (confirm the current ISC fee schedule); not included here.', provincial: [] },
};

function provinceLabel(slug: string): string {
  const m: Record<string, string> = {
    alberta: 'Alberta', bc: 'British Columbia', manitoba: 'Manitoba',
    'new-brunswick': 'New Brunswick', newfoundland: 'Newfoundland & Labrador',
    'nova-scotia': 'Nova Scotia', ontario: 'Ontario',
    'prince-edward-island': 'Prince Edward Island', quebec: 'Québec',
    saskatchewan: 'Saskatchewan',
  };
  return m[slug] || slug;
}

function calculateLTT(price: number, province: string, firstTimeBuyer: string, municipal?: string): { total: number; breakdown: { label: string; amount: number }[] } {
  const data = LAND_TRANSFER_TAXES[province];
  if (!data || data.provincial.length === 0) return { total: 0, breakdown: [] };
  const taxOn = (brackets: LTTBracket[]) =>
    brackets.reduce((sum, b) => sum + Math.max(0, Math.min(price, b.max) - b.min) * b.rate, 0);
  const isFtb = firstTimeBuyer === 'yes';
  const breakdown: { label: string; amount: number }[] = [];

  const provincialTax = taxOn(data.provincial);
  breakdown.push({ label: `${provinceLabel(province)} LTT`, amount: provincialTax });

  // Municipal tax (Toronto) - its own first-time-buyer refund applies to the municipal tax only
  let municipalTax = 0;
  const cityData = municipal && data.municipal ? data.municipal.find((m) => m.city === municipal) : undefined;
  if (cityData) {
    municipalTax = taxOn(cityData.rates);
    breakdown.push({ label: `${municipal} Municipal LTT`, amount: municipalTax });
  }

  let total = provincialTax + municipalTax;
  if (isFtb) {
    // BC: exemption of up to $8,000 (tax on first $500K) for FMV <= $835K, phasing out linearly to $0 at $860K
    const provRebateMax = province === 'bc'
      ? 8000 * Math.min(1, Math.max(0, (860000 - price) / 25000))
      : data.firstTimeRebate ?? 0;
    const provRebate = Math.min(provRebateMax, provincialTax);
    if (provRebate > 0) {
      total -= provRebate;
      breakdown.push({ label: 'First-Time Buyer Rebate', amount: -provRebate });
    }
    if (cityData?.rebate) {
      const muniRebate = Math.min(cityData.rebate, municipalTax);
      if (muniRebate > 0) {
        total -= muniRebate;
        breakdown.push({ label: `${municipal} First-Time Buyer Refund`, amount: -muniRebate });
      }
    }
  }
  return { total, breakdown };
}

const canadianMortgageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'price',
      label: 'Property Price (Asking Price)',
      type: 'number',
      placeholder: '750,000',
      prefix: '$',
      required: true,
      helpText: 'The purchase price of the home.',
    },
    {
      id: 'downPayment',
      label: 'Down Payment',
      type: 'number',
      placeholder: '75,000',
      prefix: '$',
      required: true,
      helpText: 'Min 5% on first $500K, 10% on portion above (homes of $1.5M or more need 20%). Under 20% triggers CMHC.',
    },
    {
      id: 'province',
      label: 'Province (for Land Transfer Tax Estimate)',
      type: 'select',
      required: false,
      options: [
        { label: 'Alberta (no provincial LTT)', value: 'alberta' },
        { label: 'British Columbia', value: 'bc' },
        { label: 'Manitoba', value: 'manitoba' },
        { label: 'New Brunswick', value: 'new-brunswick' },
        { label: 'Newfoundland & Labrador', value: 'newfoundland' },
        { label: 'Nova Scotia', value: 'nova-scotia' },
        { label: 'Ontario', value: 'ontario' },
        { label: 'Prince Edward Island', value: 'prince-edward-island' },
        { label: 'Québec', value: 'quebec' },
        { label: 'Saskatchewan', value: 'saskatchewan' },
      ],
      helpText: 'Select your province for a dynamic Land Transfer Tax estimate. Alberta has none.',
    },
    {
      id: 'municipality',
      label: 'Municipality (Ontario only)',
      type: 'select',
      required: false,
      options: [
        { label: 'Not in Toronto', value: 'none' },
        { label: 'Toronto (additional municipal LTT)', value: 'Toronto' },
      ],
      showWhen: (v) => v.province === 'ontario',
      helpText: 'Toronto charges an additional municipal Land Transfer Tax on top of Ontario\'s provincial tax.',
    },
    {
      id: 'firstTimeBuyer',
      label: 'First-Time Home Buyer?',
      type: 'select',
      required: false,
      options: [
        { label: 'No', value: 'no' },
        { label: 'Yes (eligible for LTT rebate)', value: 'yes' },
      ],
      helpText: 'Some provinces offer LTT rebates. Select "Yes" to apply.',
    },
    {
      id: 'amortization',
      label: 'Amortization Period',
      type: 'select',
      required: true,
      options: [
        { label: '15 years', value: '15' },
        { label: '20 years', value: '20' },
        { label: '25 years (max for insured)', value: '25' },
        { label: '30 years (uninsured, or insured for first-time / new-build buyers)', value: '30' },
      ],
      helpText: 'Total time to repay the mortgage. Insured mortgages (<20% down) are capped at 25 years, or 30 for first-time buyers and new builds.',
    },
    {
      id: 'rate',
      label: 'Annual Interest Rate (Fixed)',
      type: 'number',
      placeholder: '5.25',
      unit: '%',
      step: 0.01,
      required: true,
      helpText: 'Canadian fixed-rate mortgages are compounded semi-annually by law.',
    },
    {
      id: 'frequency',
      label: 'Payment Frequency',
      type: 'select',
      required: true,
      options: [
        { label: 'Monthly (12 / year)', value: 'monthly' },
        { label: 'Semi-Monthly (24 / year)', value: 'semimonthly' },
        { label: 'Bi-Weekly (26 / year)', value: 'biweekly' },
        { label: 'Accelerated Bi-Weekly (26 / year)', value: 'accelbiweekly' },
      ],
      helpText: 'How often you make payments. Accelerated Bi-Weekly saves the most interest over time.',
    },
    {
      id: 'stressTest',
      label: 'Apply Mortgage Stress Test?',
      type: 'select',
      required: false,
      options: [
        { label: 'No — use quoted rate only', value: 'no' },
        { label: 'Yes — qualify at rate + 2%', value: 'plus2' },
        { label: 'Yes — qualify at 5.25% floor (B-20)', value: 'floor525' },
      ],
      helpText: 'B-20 stress test: qualify at greater of contract rate + 2% OR 5.25%. This affects max affordable price.',
    },
  ],

  explainSteps: (values) => {
    const rows = canadianMortgageConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const price = parseFloat(values.price);
    const down = parseFloat(values.downPayment);
    const years = parseInt(values.amortization, 10) || 25;
    const annualRate = parseFloat(values.rate);
    const freq = values.frequency || 'monthly';
    const m = (n: number) => `$${fmt(n)}`;
    const baseLoan = price - down;
    const ltv = baseLoan / price;
    const r = annualRate / 100;
    const effectiveAnnual = Math.pow(1 + r / 2, 2) - 1;
    const monthlyRate = Math.pow(1 + effectiveAnnual, 1 / 12) - 1;
    const n = years * 12;
    const insured = ltv > 0.8;
    const cmhcRate = insured ? cmhcPremiumRate(ltv) + (years > 25 ? 0.002 : 0) : 0;
    const principal = baseLoan + baseLoan * cmhcRate;
    const monthlyPayment = pmt(principal, monthlyRate, n);
    const growth = Math.pow(1 + monthlyRate, n);
    const steps: ExplainStep[] = [
      {
        label: 'Find the base mortgage and loan-to-value',
        expr: `${m(price)} − ${m(down)} down = ${m(baseLoan)} · LTV = ${m(baseLoan)} ÷ ${m(price)} = ${(ltv * 100).toFixed(1)}%`,
        note: 'Less than 20% down (LTV above 80%) means the mortgage must be insured.',
      },
      insured
        ? {
            label: 'Add the mortgage insurance premium to the principal',
            expr: `${m(baseLoan)} × ${(cmhcRate * 100).toFixed(2)}% (tier for ${(ltv * 100).toFixed(1)}% LTV${years > 25 ? ', +0.20% for an amortization over 25 years' : ''}) = ${resultValue(rows, 'cmhc')} → principal ${resultValue(rows, 'principal')}`,
          }
        : { label: 'Check whether mortgage insurance applies', expr: `${(ltv * 100).toFixed(1)}% LTV is 80% or less → ${resultValue(rows, 'cmhc')} · principal ${resultValue(rows, 'principal')}` },
      {
        label: 'Convert the quoted rate (compounded semi-annually, as Canadian law requires)',
        expr: `Effective annual rate = (1 + ${annualRate}% ÷ 2)² − 1 = ${resultValue(rows, 'effRate')}`,
        note: 'US mortgages compound monthly; Canadian fixed-rate mortgages compound twice a year.',
      },
      {
        label: 'Turn the effective rate into a monthly rate',
        expr: `i = (1 + ${(effectiveAnnual * 100).toFixed(4)}%)^(1/12) − 1 = ${(monthlyRate * 100).toFixed(6)}% per month`,
      },
      {
        label: 'Solve for the monthly payment',
        expr: monthlyRate === 0
          ? `M = ${m(principal)} ÷ ${n} = ${m(monthlyPayment)}`
          : `M = P × i(1 + i)ⁿ ÷ ((1 + i)ⁿ − 1) = ${m(principal)} × ${monthlyRate.toFixed(8)} × ${growth.toFixed(6)} ÷ (${growth.toFixed(6)} − 1) = ${m(monthlyPayment)} (n = ${years} × 12 = ${n})`,
      },
      {
        label: 'Convert it to your payment frequency',
        expr:
          freq === 'monthly' ? `Monthly: ${m(monthlyPayment)}`
          : freq === 'semimonthly' ? `Semi-monthly: ${m(monthlyPayment)} ÷ 2 = ${resultValue(rows, 'payment')}`
          : freq === 'biweekly' ? `Bi-weekly: ${m(monthlyPayment)} × 12 ÷ 26 = ${resultValue(rows, 'payment')}`
          : `Accelerated bi-weekly: ${m(monthlyPayment)} ÷ 2 = ${resultValue(rows, 'payment')} (26 payments = 13 monthly payments a year)`,
      },
      {
        label: 'Run the payments to the end to total the interest',
        expr: `Interest ${resultValue(rows, 'totalInterest')} · total paid ${resultValue(rows, 'totalPaid')} · paid off in ${resultValue(rows, 'yearsActual')}`,
        note: 'Each payment first covers the interest on the balance, and the rest reduces the principal.',
      },
    ];
    const savedInterest = resultValue(rows, 'savedInterest');
    if (savedInterest) {
      steps.push({
        label: 'Compare with a standard monthly schedule',
        expr: `Interest saved ${savedInterest} · years saved ${resultValue(rows, 'savedYears')}`,
      });
    }
    const stress = resultValue(rows, 'stressTestQualifying');
    if (stress) {
      const maxPrice = resultValue(rows, 'stressTestMaxPrice');
      steps.push({
        label: 'Stress test: re-price the same mortgage at the qualifying rate',
        expr: `${stress}${maxPrice ? ` · largest home that payment would support at that rate: ${maxPrice}` : ''}`,
        note: 'Lenders check that you could still pay if rates were higher.',
      });
    }
    const lttTotal = rows.find((x) => x.id === 'lttTotal');
    if (lttTotal) {
      const detail = rows.filter((x) => x.id.startsWith('ltt_')).map((x) => `${x.label.replace('LTT Detail:', '').trim()} ${x.value}`);
      steps.push({
        label: 'Add the land transfer tax due at closing',
        expr: detail.length ? `${detail.join(' · ')} → ${lttTotal.value}` : lttTotal.value,
        note: "Taken from the calculator's own provincial tax bands; it is a closing cost, not part of the mortgage.",
      });
    }
    return finiteSteps(steps);
  },

  calculate: (values) => {
    const price = parseFloat(values.price);
    const down = parseFloat(values.downPayment);
    const years = parseInt(values.amortization, 10) || 25;
    const annualRate = parseFloat(values.rate);
    const freq = values.frequency || 'monthly';
    const stressTest = values.stressTest || 'no';
    const province = values.province || 'alberta';
    const municipality = values.municipality || 'none';

    if (isNaN(price) || isNaN(down) || isNaN(annualRate) || price <= 0 || down < 0 || annualRate < 0 || annualRate > 30) return [];

    const baseLoan = price - down;
    if (baseLoan <= 0) return [];
    const ltv = baseLoan / price;
    const downPct = (down / price) * 100;

    // Minimum down payment check
    let minDown: number;
    // Insured-mortgage price cap raised from $1M to $1.5M on Dec. 15, 2024
    if (price >= 1_500_000) { minDown = price * 0.20; }
    else if (price > 500_000) { minDown = 500_000 * 0.05 + (price - 500_000) * 0.10; }
    else { minDown = price * 0.05; }
    if (down < minDown - 0.01) {
      return [{ id: 'error', label: 'Down Payment Below Canadian Minimum', value: `Minimum: $${fmt(minDown)} (${((minDown / price) * 100).toFixed(2)}%). ${price >= 1_500_000 ? '$1.5M+ requires 20%.' : '5% on first $500K, 10% above.'}`, color: 'negative' as const, highlight: true }];
    }

    // CMHC Insurance
    let cmhcRate = 0, cmhcPremium = 0;
    let principal = baseLoan;
    if (ltv > 0.80) {
      // Since Dec. 15, 2024 insured 30-year amortizations are allowed for first-time buyers and buyers of new builds
      if (years > 25 && values.firstTimeBuyer !== 'yes') return [{ id: 'error', label: 'CMHC Error', value: 'CMHC-insured mortgages (<20% down) are capped at 25-year amortization, except for first-time buyers (select "Yes" above) and buyers of new builds.', color: 'negative' as const, highlight: true }];
      // CMHC adds a 0.20% premium surcharge when the amortization is longer than 25 years
      cmhcRate = cmhcPremiumRate(ltv) + (years > 25 ? 0.002 : 0);
      cmhcPremium = baseLoan * cmhcRate;
      principal = baseLoan + cmhcPremium;
    }

    // Semi-annual compounding
    const r = annualRate / 100;
    const effectiveAnnual = Math.pow(1 + r / 2, 2) - 1;
    const periodsPerYear: Record<string, number> = { monthly: 12, semimonthly: 24, biweekly: 26, accelbiweekly: 26 };
    const m = periodsPerYear[freq];
    const periodicRate = Math.pow(1 + effectiveAnnual, 1 / m) - 1;
    const monthlyRate = Math.pow(1 + effectiveAnnual, 1 / 12) - 1;
    const monthlyPayment = pmt(principal, monthlyRate, years * 12);

    let payment: number, displayLabel: string;
    if (freq === 'monthly') { payment = monthlyPayment; displayLabel = 'Monthly Payment'; }
    else if (freq === 'semimonthly') { payment = monthlyPayment / 2; displayLabel = 'Semi-Monthly Payment'; }
    else if (freq === 'biweekly') { payment = (monthlyPayment * 12) / 26; displayLabel = 'Bi-Weekly Payment'; }
    else { payment = monthlyPayment / 2; displayLabel = 'Accelerated Bi-Weekly Payment'; }

    // Amortization simulation
    let balance = principal, periods = 0, totalInterest = 0, totalPaid = 0;
    const maxPeriods = years * m;
    while (balance > 0.01 && periods < maxPeriods) {
      const interest = balance * periodicRate;
      let pp = payment - interest;
      if (pp <= 0) break;
      let ap = payment;
      if (pp > balance) { pp = balance; ap = pp + interest; }
      totalInterest += interest; totalPaid += ap; balance -= pp; periods++;
    }
    const yearsActual = periods / m;
    const stdTotalInterest = monthlyPayment * years * 12 - principal;
    const interestSaved = stdTotalInterest - totalInterest;
    const yearsSaved = years - yearsActual;

    // Land Transfer Tax
    const lttResult = province && province !== 'alberta' ? calculateLTT(price, province, values.firstTimeBuyer || 'no', municipality) : { total: 0, breakdown: [] };

    // Stress Test
    let stressTestPaymentDisplay = '';
    let maxAffordablePrice = 0;
    if (stressTest !== 'no') {
      const contractRate = annualRate;
      const floorRate = 5.25;
      let qualifyingRate: number;
      if (stressTest === 'plus2') {
        qualifyingRate = contractRate + 2;
      } else {
        qualifyingRate = Math.max(contractRate + 2, floorRate);
      }
      const qr = qualifyingRate / 100;
      const qEffectiveAnnual = Math.pow(1 + qr / 2, 2) - 1;
      const qMonthlyRate = Math.pow(1 + qEffectiveAnnual, 1 / 12) - 1;
      const qMonthlyPmt = pmt(principal, qMonthlyRate, years * 12);
      stressTestPaymentDisplay = `$${fmt(qMonthlyPmt)}/month (qualifying at ${qualifyingRate.toFixed(2)}%)`;
      if (qMonthlyRate > 0) {
        const maxLoan = monthlyPayment / (qMonthlyRate / (1 - Math.pow(1 + qMonthlyRate, -years * 12)));
        maxAffordablePrice = maxLoan + down;
      }
    }

    // Build results
    const results: CalculatorResult[] = [
      { id: 'payment', label: displayLabel, value: `$${fmt(payment)}`, highlight: true, color: 'neutral' as const },
      { id: 'principal', label: 'Total Mortgage Principal', value: `$${fmt(principal)}`, color: 'neutral' as const },
    ];

    if (cmhcPremium > 0) {
      results.push({ id: 'cmhc', label: `CMHC Premium (${(cmhcRate * 100).toFixed(2)}% on ${(ltv * 100).toFixed(1)}% LTV)`, value: `+$${fmt(cmhcPremium)} added to principal`, color: 'negative' as const });
    } else {
      results.push({ id: 'cmhc', label: 'CMHC Insurance', value: `Not required (${downPct.toFixed(1)}% down)`, color: 'positive' as const });
    }

    results.push(
      { id: 'effRate', label: 'Effective Annual Rate (semi-annual compounding)', value: `${(effectiveAnnual * 100).toFixed(4)}%`, color: 'neutral' as const },
      { id: 'totalInterest', label: 'Total Interest Paid Over Life of Loan', value: `$${fmt(totalInterest)}`, color: 'negative' as const },
      { id: 'totalPaid', label: 'Total Cost (Principal + Interest)', value: `$${fmt(totalPaid)}`, color: 'negative' as const },
      { id: 'yearsActual', label: 'Actual Time to Payoff', value: `${yearsActual.toFixed(2)} years`, color: 'neutral' as const },
    );

    if (freq === 'accelbiweekly') {
      results.push(
        { id: 'savedInterest', label: 'Interest Saved vs. Standard Monthly', value: `$${fmt(interestSaved)}`, color: 'positive' as const },
        { id: 'savedYears', label: 'Years Saved vs. Standard Monthly', value: `${yearsSaved.toFixed(2)} years`, color: 'positive' as const },
      );
    }

    // Stress Test Results
    if (stressTest !== 'no' && stressTestPaymentDisplay) {
      results.push({ id: 'stressTestQualifying', label: 'Stress Test — Qualifying Payment (monthly equivalent)', value: stressTestPaymentDisplay, color: 'neutral' as const });
      if (maxAffordablePrice > 0) {
        results.push({ id: 'stressTestMaxPrice', label: 'Stress Test — Max Affordable Price at Current Payment', value: `~$${fmt(maxAffordablePrice)}`, color: 'positive' as const });
      }
    }

    // Land Transfer Tax Results
    if (lttResult.total > 0) {
      results.push({ id: 'lttTotal', label: 'Estimated Land Transfer Tax (closing cost)', value: `$${fmt(lttResult.total)}`, color: 'negative' as const });
      for (const item of lttResult.breakdown) {
        results.push({
          id: `ltt_${item.label.replace(/\s+/g, '_')}`,
          label: `  LTT Detail: ${item.label}`,
          value: item.amount < 0 ? `−$${fmt(Math.abs(item.amount))}` : `$${fmt(item.amount)}`,
          color: item.amount < 0 ? 'positive' as const : 'neutral' as const,
        });
      }
    } else if (province === 'alberta' || province === 'saskatchewan') {
      results.push({ id: 'lttTotal', label: `Land Transfer Tax (${provinceLabel(province)})`, value: 'No provincial LTT ($0) — land titles registration fees apply separately', color: 'positive' as const });
    }

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CanadianMortgagePanel, { values, results });
  },
  educational: {
    formula: 'Effective Annual = (1 + r/2)² − 1 | Periodic Rate = (1 + Effective Annual)^(1/m) − 1 | Stress Test Rate = max(Contract + 2%, 5.25%)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Canadian Mortgage Essentials</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Semi-annual compounding, stress test, and land transfer tax</text><g transform="translate(30,65)"><!-- House icon --><polygon points="170,0 220,15 220,32 120,32 120,15" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><rect x="143" y="10" width="55" height="22" rx="3" fill="var(--svg-f1f5f9)"/><text x="170" y="26" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e40af)">$750K</text><text x="170" y="48" text-anchor="middle" font-size="9" fill="var(--svg-475569)">Property Price</text><!-- Down payment bar --><rect x="30" y="55" width="100" height="28" rx="4" fill="var(--svg-f59e0b)"/><text x="80" y="73" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">Down: $75K (10%)</text><rect x="135" y="55" width="245" height="28" rx="4" fill="var(--svg-3b82f6)"/><text x="257" y="73" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Base Mortgage: $675,000</text><!-- CMHC if applicable --><rect x="135" y="88" width="245" height="22" rx="4" fill="var(--svg-ef4444)"/><text x="257" y="103" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">+ CMHC Insurance (3.1%): $20,925</text><text x="170" y="120" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-dc2626)">Total Principal: $695,925</text></g><!-- Key differences --><g transform="translate(40,135)"><rect x="10" y="0" width="370" height="95" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">How Canada Differs from the US</text><text x="65" y="36" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Semi-annual compounding</text><text x="65" y="50" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">vs US monthly compounding</text><text x="65" y="66" text-anchor="middle" font-size="9" fill="var(--svg-8b5cf6)">B-20 Stress Test:</text><text x="65" y="80" text-anchor="middle" font-size="9" fill="var(--svg-8b5cf6)">qualify at rate+2% or 5.25%</text><text x="290" y="36" text-anchor="middle" font-size="9" fill="var(--svg-f59e0b)">CMHC insurance for <20% down</text><text x="290" y="50" text-anchor="middle" font-size="9" fill="var(--svg-f59e0b)">premium 0.6%-4.0% of loan</text><text x="290" y="66" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">Land Transfer Tax (LTT)</text><text x="290" y="80" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">progressive, provincial+municipal</text></g><!-- Accelerated Bi-Weekly savings --><g transform="translate(40,245)"><rect x="10" y="0" width="370" height="82" rx="10" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-b45309)">The Biggest "Free Win": Accelerated Bi-Weekly</text><text x="80" y="38" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Standard Monthly: $4,147/mo</text><text x="80" y="52" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)">Accelerated Bi-Weekly: $2,074/2wk</text><text x="80" y="68" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">= 13 payments/yr (1 extra principal-only payment)</text><text x="300" y="38" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)">Saves ~3.6 years</text><text x="300" y="52" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)">Saves ~$66K</text><text x="300" y="68" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">on $500K at 5.25%, 25 yr</text></g></svg>',
      alt: 'Canadian mortgage diagram showing property price ($750K) split into down payment ($75K) and base mortgage ($675K) plus CMHC insurance ($20,925), with key differences from US mortgages and accelerated bi-weekly savings',
      caption: 'Canadian mortgages are compounded semi-annually (not monthly like the US), require a stress test to qualify, and may include costly Land Transfer Tax at closing',
    },
    formulaDescription:
      'Canadian fixed-rate mortgages are compounded semi-annually not in advance by law (Interest Act, Section 6). This differs fundamentally from US mortgages (monthly compounding), making US calculators inaccurate for Canadian mortgages. The B-20 stress test determines how much you can borrow (you qualify at the higher rate but pay the lower contract rate). Land Transfer Tax is a provincial/municipal progressive-bracket closing cost.',
    variables: [
      { symbol: 'r', name: 'Stated Annual Rate', description: 'The advertised mortgage rate (e.g. 5.25%).' },
      { symbol: 'Effective Annual', name: 'Effective Annual Rate', description: 'True annualized rate after semi-annual compounding.' },
      { symbol: 'm', name: 'Payments Per Year', description: 'Monthly = 12, semi-monthly = 24, bi-weekly = 26.' },
      { symbol: 'CMHC', name: 'CMHC Insurance', description: 'Default insurance for <20% down (0.6%–4.0% of loan).' },
      { symbol: 'LTV', name: 'Loan-to-Value', description: 'Loan ÷ Property. >80% = insured mortgage.' },
      { symbol: 'Stress Test', name: 'Stress Test Rate', description: 'Qualifying rate = max(Contract + 2%, 5.25%).' },
      { symbol: 'LTT', name: 'Land Transfer Tax', description: 'Progressive provincial/municipal tax paid at closing.' },
    ],
    howToUse: [
      'Enter the property price and your down payment.',
      'Select your province for a dynamic Land Transfer Tax estimate.',
      'Pick an amortization period (max 25 years if <20% down).',
      'Enter your quoted fixed interest rate.',
      'Choose a payment frequency — compare Monthly vs Accelerated Bi-Weekly to see savings.',
      'Toggle the Mortgage Stress Test to see your qualifying rate and max affordable price.',
      'Review the Land Transfer Tax breakdown — a significant closing cost.',
    ],
    commonUses: [
      'Calculate monthly mortgage payments for a Canadian home including semi-annual compounding, land transfer tax, and provincial rules.',
      'Compare standard monthly payments versus accelerated bi-weekly payments to see how much interest and time you save over the amortization.',
      'Determine your maximum affordable home price under the Canadian mortgage stress test using the contract rate plus qualifying rate.',
    ],
    explanation:
      'Accelerated bi-weekly payments are the single biggest "free win" in Canadian mortgages. By paying half your monthly amount every two weeks, you make 26 half-payments = 13 full monthly payments per year — one extra principal-only payment. On a $500K mortgage at 5.25% over 25 years, this saves about 3.6 years and roughly $66,000 in interest. The stress test determines how much you can borrow, not what you pay. Land Transfer Tax is a major closing cost (e.g., about $12,475 in Ontario on an $800K home) that first-time buyers often underestimate.',
    faqs: [
      {
        question: 'Why are Canadian mortgages compounded semi-annually?',
        answer: 'Section 6 of the federal Interest Act of Canada requires mortgage rates to be compounded no more than semi-annually. A quoted 5% Canadian rate is cheaper than a 5% US rate (monthly compounding) because the effective annual rate is lower. Always use a Canadian-specific calculator.',
      },
      {
        question: 'How does the Mortgage Stress Test work?',
        answer: 'B-20 requires lenders to qualify borrowers at max(contract rate + 2%, 5.25%). If your rate is 4.5%, qualifying rate = 6.5%. You pay 4.5% but must prove you could afford 6.5%. This reduces your max affordable price. Toggle the Stress Test on to see this.',
      },
      {
        question: 'What is Land Transfer Tax and how much is it?',
        answer: 'LTT is a provincial (sometimes municipal) tax on property purchase, calculated with progressive brackets. On an $800K Ontario home: $12,475 provincial + up to $12,475 Toronto municipal = about $25K. First-time buyers in Ontario get up to $4,000 back (plus up to $4,475 in Toronto), and in BC up to $8,000 on homes up to $835,000. Select your province for a precise estimate.',
      },
      {
        question: 'Accelerated bi-weekly or regular bi-weekly?',
        answer: 'Accelerated. Regular divides annual total by 26 (same total cost). Accelerated is half your monthly payment every 2 weeks = 13 monthly payments/year. The extra payment goes 100% to principal, saving roughly 3.6 years and $66,000 in interest on a $500K, 25-year mortgage at 5.25%.',
      },
      {
        question: 'When is CMHC insurance required?',
        answer: 'When down payment < 20%. Premiums range from 2.8% (15–19.99% down) to 4.0% (5–9.99% down), plus a 0.20% surcharge when the amortization is longer than 25 years. The premium is added to the mortgage principal — no lump-sum payment required. CMHC protects the lender, not you.',
      },
    ],
    citations: [
      { source: 'Canada Mortgage and Housing Corporation (CMHC)', url: 'https://www.cmhc-schl.gc.ca' },
      { source: 'Financial Consumer Agency of Canada', url: 'https://www.canada.ca/en/financial-consumer-agency.html' },
    ],
  },
};

export default canadianMortgageConfig;