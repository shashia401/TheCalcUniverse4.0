import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, ExplainStep } from '../../../types/calculator';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';
import NYMortgagePanel from './NYMortgagePanel';

/**
 * NY mortgage recording tax (MRT), % of mortgage amount. Source: NYS Dept. of Taxation and Finance,
 * Form MT-15 (rev. 1/25), rate tables: basic $.50 + special additional $.25 + additional ($.30 in the
 * MCTD, $.25 elsewhere) + local tax, per $100. The special additional tax ($.25) is owed by the LENDER
 * on mortgages of 1-6 family property (Tax Law 253(1-a); TSB-M-92(4)R), so the borrower's share is
 * the total minus 0.25%.
 */
export const MRT_LENDER_SHARE = 0.0025;
export const MRT_REGIONS: Record<string, { label: string; total: (loan: number) => number }> = {
  // Table 4: all mortgages < $500K 2.05%; 1-3 family / individual condo >= $500K 2.175%
  nyc: { label: 'New York City (5 boroughs)', total: (loan) => (loan >= 500000 ? 0.02175 : 0.0205) },
  // Table 1 (MCTD counties imposing basic + special additional + additional tax only): 1.05%
  mctd: { label: 'Nassau, Suffolk, Orange, Putnam or Dutchess County', total: () => 0.0105 },
  // Table 5: Westchester County (outside Yonkers) and Rockland County 1.30%
  westchester: { label: 'Westchester (outside Yonkers) or Rockland County', total: () => 0.013 },
  // Table 2: upstate counties imposing basic + special additional + additional tax (Erie, Monroe, Onondaga, ...) 1.00%
  upstate: { label: 'Upstate — most counties (Erie, Monroe, Onondaga, Niagara, Oneida, ...)', total: () => 0.01 },
};

/** Mortgage amount is rounded to the nearest $100 on the MT-15 return. */
export function mortgageRecordingTax(loan: number, region: string) {
  const r = MRT_REGIONS[region] ?? MRT_REGIONS.nyc;
  const base = Math.round(loan / 100) * 100;
  const total = base * r.total(loan);
  const lender = base * MRT_LENDER_SHARE;
  return { total, lender, borrower: total - lender };
}

/** NY State mansion tax (Tax Law 1402-a): 1% of the consideration, paid by the buyer, on residential sales of $1,000,000 or more. */
export const MANSION_TAX_THRESHOLD = 1_000_000;
export const MANSION_TAX_RATE = 0.01;

/** This calculator's own assumptions (kept as named constants so the worked solution quotes the same numbers). */
const PMI_ANNUAL_RATE = 0.005;
const SCHOOL_TAX_SHARE = 0.6;
const STAR_EXEMPT: Record<string, number> = { basic: 30000, enhanced: 88500 };

const nyMortgageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homePrice',
      label: 'Home Price',
      type: 'number',
      placeholder: '500,000',
      prefix: '$',
      min: 0,
      step: 1000,
      inputMode: 'numeric',
      required: true,
      helpText: 'New York median home price is ~$500,000 (higher in NYC metro)',
    },
    {
      id: 'downPayment',
      label: 'Down Payment',
      type: 'number',
      placeholder: '100,000',
      prefix: '$',
      min: 0,
      step: 1000,
      inputMode: 'numeric',
      required: true,
      helpText: '20% down avoids PMI. NY offers first-time homebuyer programs through SONYMA.',
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      type: 'percentage',
      placeholder: '6.7',
      min: 0,
      max: 15,
      step: 0.125,
      inputMode: 'decimal',
      required: true,
      helpText: 'Use the rate on your Loan Estimate or lender quote.',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      placeholder: '30',
      options: [
        { value: '15', label: '15 years' },
        { value: '20', label: '20 years' },
        { value: '30', label: '30 years' },
      ],
      required: true,
    },
    {
      id: 'propertyTaxRate',
      label: 'Property Tax Rate',
      type: 'percentage',
      placeholder: '1.3',
      min: 0,
      max: 4,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'NY statewide average is about 1.3% of home value (Tax Foundation, 2024 ACS) — NYC counties are well under 1%, some upstate counties exceed 2.4%.',
    },
    {
      id: 'starEligible',
      label: 'STAR Program Eligible?',
      type: 'select',
      options: [
        { value: 'none', label: 'No — Do not qualify for STAR' },
        { value: 'basic', label: 'Basic STAR (income ≤ $500K credit / $250K exemption, primary residence)' },
        { value: 'enhanced', label: 'Enhanced STAR (age 65+, income ≤ $110,750 for 2026-27)' },
      ],
      helpText: 'STAR reduces school property taxes. Basic STAR covers the first $30,000 of full value; Enhanced STAR the first $88,500 (2026-27). Savings here are an estimate.',
    },
    {
      id: 'mrtRegion',
      label: 'Where is the property? (mortgage recording tax)',
      type: 'select',
      options: Object.entries(MRT_REGIONS).map(([value, r]) => ({ value, label: r.label })),
      helpText: 'Recording tax varies by county. Other counties differ (0.75%-1.25% total outside the downstate region); see Form MT-15.',
    },
  ],
  calculate: (values) => {
    const homePriceNum = parseFloat(values.homePrice);
    const downPaymentNum = parseFloat(values.downPayment);
    const interestRateNum = parseFloat(values.interestRate);
    const taxRateNum = parseFloat(values.propertyTaxRate);
    if (isNaN(homePriceNum) || isNaN(interestRateNum)) return [];
    if (homePriceNum <= 0 || isNaN(downPaymentNum) || downPaymentNum < 0 || downPaymentNum >= homePriceNum) return [];

    const homePrice = new Decimal(homePriceNum);
    const downPayment = new Decimal(downPaymentNum);
    const rate = new Decimal(interestRateNum).div(100);
    const term = parseInt(values.loanTerm) || 30;
    const taxRate = isNaN(taxRateNum) ? new Decimal(0) : new Decimal(taxRateNum).div(100);
    const star = values.starEligible || 'none';

    const loanAmount = homePrice.minus(downPayment);
    const downPct = downPayment.div(homePrice).mul(100).toFixed(1);
    const months = term * 12;
    const monthlyRate = rate.div(12);

    let basePayment: Decimal;
    if (monthlyRate.gt(0)) {
      const factor = monthlyRate.plus(1).pow(months);
      basePayment = loanAmount.mul(monthlyRate.mul(factor)).div(factor.minus(1));
    } else {
      basePayment = loanAmount.div(months);
    }

    const monthlyTax = homePrice.mul(taxRate).div(12);
    // Exact comparison: a 19.96% down payment displays as "20.0%" but is still under 20%.
    const hasPmi = downPayment.div(homePrice).lt(0.2);
    const monthlyPmi = hasPmi ? loanAmount.mul(PMI_ANNUAL_RATE).div(12) : new Decimal(0);
    const totalMonthly = basePayment.plus(monthlyTax).plus(monthlyPmi);
    const totalInterest = basePayment.mul(months).minus(loanAmount);
    const totalCost = loanAmount.plus(totalInterest);

    // STAR savings (assumes school tax is ~60% of total property tax; exempt full value per tax.ny.gov, 2026-27)
    const annualSchoolTax = monthlyTax.mul(12).mul(SCHOOL_TAX_SHARE);
    let starSavings = new Decimal(0);
    if (star === 'basic') {
      // Basic STAR: $30K off assessed value. Multiply by the school tax rate.
      // School tax rate = annual school tax / home price
      const schoolTaxRate = annualSchoolTax.div(homePrice);
      starSavings = new Decimal(STAR_EXEMPT.basic).mul(schoolTaxRate);
    } else if (star === 'enhanced') {
      const schoolTaxRate = annualSchoolTax.div(homePrice);
      starSavings = new Decimal(STAR_EXEMPT.enhanced).mul(schoolTaxRate);
    }

    // Mortgage Recording Tax (paid at closing, not monthly): borrower's share, see mortgageRecordingTax().
    const mrt = mortgageRecordingTax(loanAmount.toNumber(), values.mrtRegion || 'nyc');
    const recordingTax = new Decimal(mrt.borrower);
    const mansionTax = homePrice.gte(MANSION_TAX_THRESHOLD) ? homePrice.mul(MANSION_TAX_RATE) : new Decimal(0);

    const fmtDollar = (d: Decimal, decimals = 2): string =>
      `$${d.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    const fmtInt = (d: Decimal): string =>
      fmtDollar(d, 0);

    return [
      { id: 'monthlyPayment', label: 'Monthly Payment (Principal & Interest)', value: fmtDollar(basePayment), highlight: true, color: 'positive' },
      { id: 'totalMonthly', label: 'Monthly with Taxes & PMI', value: fmtDollar(totalMonthly), highlight: true, color: 'neutral' },
      { id: 'loanAmount', label: 'Loan Amount', value: fmtInt(loanAmount), color: 'neutral' },
      { id: 'downPercent', label: 'Down Payment', value: `${downPct}% (${fmtInt(downPayment)})`, color: hasPmi ? 'negative' : 'positive' },
      { id: 'totalInterest', label: 'Total Interest Paid', value: fmtInt(totalInterest), color: 'neutral' },
      { id: 'totalCost', label: 'Total Cost of Loan', value: fmtInt(totalCost), color: 'neutral' },
      { id: 'propertyTaxNote', label: 'Annual Property Taxes', value: `${fmtInt(monthlyTax.mul(12))}/yr`, color: 'neutral' },
      { id: 'starSavings', label: 'Estimated STAR Annual Savings', value: starSavings.gt(0) ? `${fmtInt(starSavings)}/yr` : 'Not eligible', color: 'positive' },
      {
        id: 'recordingTax',
        label: 'Mortgage Recording Tax — Your Share (at closing)',
        value: fmtDollar(recordingTax),
        color: 'negative',
        interpretation: `Total tax on this mortgage is ${fmtDollar(new Decimal(mrt.total))}; the lender pays ${fmtDollar(new Decimal(mrt.lender))} of it (the 0.25% special additional tax). Based on the NYS Form MT-15 rate tables for ${(MRT_REGIONS[values.mrtRegion || 'nyc'] ?? MRT_REGIONS.nyc).label}; the $10,000 one-/two-family exclusion on the additional tax (about $30) is not applied.`,
      },
      {
        id: 'mansionTax',
        label: 'NY State Mansion Tax (buyer, at closing)',
        value: mansionTax.gt(0) ? fmtDollar(mansionTax) : 'Not applicable (price under $1,000,000)',
        color: mansionTax.gt(0) ? 'negative' : 'neutral',
        interpretation: mansionTax.gt(0)
          ? 'Statewide 1% tax on residential purchases of $1,000,000 or more, paid by the buyer. New York City adds a supplemental tax on purchases of $2,000,000 or more that this calculator does not include.'
          : undefined,
      },
      { id: '_nyData', label: '', value: JSON.stringify({ loanAmount: loanAmount.toNumber(), downPct, hasPmi, monthlyTax: monthlyTax.toNumber(), monthlyPmi: monthlyPmi.toNumber(), term }) },
    ];
  },
  explainSteps: (values) => {
    const rows = nyMortgageConfig.calculate(values);
    const raw = resultValue(rows, '_nyData');
    if (!raw) return [];
    const d = JSON.parse(raw) as { loanAmount: number; downPct: string; hasPmi: boolean; monthlyTax: number; monthlyPmi: number; term: number };
    if (Object.values(d).some((x) => x === null)) return []; // JSON turns Infinity into null
    const price = parseFloat(values.homePrice);
    const down = parseFloat(values.downPayment);
    const rate = parseFloat(values.interestRate);
    const taxRate = isNaN(parseFloat(values.propertyTaxRate)) ? 0 : parseFloat(values.propertyTaxRate);
    const star = values.starEligible || 'none';
    const region = values.mrtRegion || 'nyc';
    const n = d.term * 12;
    const r = rate / 100 / 12;
    const m = (x: number) => `$${x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const pc = (x: number) => `${+(x * 100).toFixed(4)}%`;
    const steps: ExplainStep[] = [
      { label: 'Work out the loan', expr: `${m(price)} − ${m(down)} down = ${resultValue(rows, 'loanAmount')} (down payment ${resultValue(rows, 'downPercent')})` },
      {
        label: 'Monthly principal and interest',
        expr: r === 0
          ? `M = ${m(d.loanAmount)} ÷ ${n} = ${resultValue(rows, 'monthlyPayment')}`
          : `r = ${rate}% ÷ 12 = ${r.toFixed(8)} · n = ${n} · M = L × r(1+r)ⁿ ÷ ((1+r)ⁿ − 1) = ${resultValue(rows, 'monthlyPayment')}`,
      },
      {
        label: 'Add property tax and, under 20% down, PMI',
        expr: `Tax: ${m(price)} × ${taxRate}% ÷ 12 = ${m(d.monthlyTax)} · PMI: ${
          d.hasPmi ? `${m(d.loanAmount)} × ${pc(PMI_ANNUAL_RATE)} ÷ 12 = ${m(d.monthlyPmi)}` : `${m(0)} (20% or more down)`
        } → ${resultValue(rows, 'totalMonthly')}`,
        note: `PMI uses this calculator's assumed ${pc(PMI_ANNUAL_RATE)} a year; your lender's rate will differ.`,
      },
      { label: 'Total interest over the term', expr: `M × ${n} − loan = ${resultValue(rows, 'totalInterest')}` },
    ];
    if (STAR_EXEMPT[star]) {
      steps.push({
        label: 'Estimate the STAR saving',
        expr: `School tax ≈ ${pc(SCHOOL_TAX_SHARE)} of ${m(d.monthlyTax * 12)} = ${m(d.monthlyTax * 12 * SCHOOL_TAX_SHARE)} a year · school rate = ${m(d.monthlyTax * 12 * SCHOOL_TAX_SHARE)} ÷ ${m(price)} = ${pc((d.monthlyTax * 12 * SCHOOL_TAX_SHARE) / price)} · × ${m(STAR_EXEMPT[star])} exempt = ${resultValue(rows, 'starSavings')}`,
        note: 'An estimate: the real school share of your tax bill varies by district.',
      });
    }
    const mrt = mortgageRecordingTax(d.loanAmount, region);
    const base = Math.round(d.loanAmount / 100) * 100;
    steps.push({
      label: 'Mortgage recording tax (your share, paid at closing)',
      expr: `${m(base)} (loan rounded to $100) × ${pc(mrt.total / (base || 1))} = ${m(mrt.total)} total − lender's ${pc(MRT_LENDER_SHARE)} (${m(mrt.lender)}) = ${resultValue(rows, 'recordingTax')}`,
      note: (MRT_REGIONS[region] ?? MRT_REGIONS.nyc).label,
    });
    steps.push({
      label: 'Mansion tax check',
      expr: price >= MANSION_TAX_THRESHOLD ? `${m(price)} × ${pc(MANSION_TAX_RATE)} = ${resultValue(rows, 'mansionTax')}` : `Price is under ${m(MANSION_TAX_THRESHOLD)} → ${m(0)}`,
    });
    return finiteSteps(steps);
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(NYMortgagePanel, { values, results });
  },
  educational: {
    formula: 'M = P * [r(1+r)^n] / [(1+r)^n - 1]',
    formulaDescription: 'Standard monthly mortgage payment formula. New York has moderate-to-high property taxes (about 1.3% of home value on average, from well under 1% in NYC to over 2.4% in some upstate counties), a state income tax (4-10.9% brackets), the STAR program that offers school tax relief for homeowners, and a unique mortgage recording tax paid at closing. All calculations use decimal.js for precise financial math.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-333333)">NY Housing Cost Components</text><rect x="20" y="35" width="280" height="24" rx="4" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="160" y="51" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">Principal + Interest (monthly mortgage)</text><rect x="20" y="65" width="200" height="24" rx="4" fill="var(--svg-ef4444)" opacity="0.7"/><text x="120" y="81" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">Property Tax (~1.3% average)</text><rect x="20" y="95" width="150" height="24" rx="4" fill="var(--svg-ef4444)" opacity="0.5"/><text x="95" y="111" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">State Income Tax (4-10.9%)</text><rect x="20" y="125" width="120" height="24" rx="4" fill="var(--svg-3b82f6)" opacity="0.5"/><text x="80" y="141" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">Mortgage Recording Tax</text><line x1="20" y1="158" x2="300" y2="158" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="175" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-555555)">NY has BOTH property + income tax</text><text x="160" y="191" text-anchor="middle" font-size="9" fill="var(--svg-555555)">STAR program: school-tax relief (Enhanced: first $88.5K)</text></svg>',
      alt: 'Breakdown of New York housing cost components including mortgage, property tax, income tax, and recording tax',
      caption: 'New York homeowners pay both property tax (about 1.3% on average) and state income tax (4-10.9%), plus a mortgage recording tax at closing.',
    },
    variables: [
      { symbol: 'M', name: 'Monthly Payment', description: 'Your monthly principal and interest. New York also has a mortgage recording tax (not included in monthly payment) that adds roughly 0.75%-1.925% of the loan amount for the borrower at closing, depending on the region.' },
      { symbol: 'STAR', name: 'STAR Property Tax Exemption', description: 'New York\'s School Tax Relief program provides a partial exemption from school property taxes. Basic STAR covers the first $30,000 of full value (income up to $500,000 for the STAR credit, $250,000 for the exemption). Enhanced STAR covers the first $88,500 of full value for owners 65+ with income up to $110,750 (2026-27 school year). New homeowners register for the STAR credit rather than the exemption.' },
      { symbol: 'NY MRT', name: 'Mortgage Recording Tax', description: 'New York is one of the few states with a mortgage recording tax (NYS Form MT-15: 1.00%-2.80% in total depending on county). In NYC the total is 2.05% for loans under $500K and 2.175% for 1-3 family homes and condos at $500K+; the lender pays 0.25% of that, so the borrower pays 1.80% / 1.925%. Paid at closing, not monthly.' },
      { symbol: 'SONYMA', name: 'State of New York Mortgage Agency', description: 'Offers below-market-rate mortgages and down payment assistance (generally up to 3% of the purchase price, capped at $15,000) for qualifying first-time homebuyers. Additional grants available for specific counties and professions (teachers, first responders).' },
    ],
    howToUse: [
      'Enter the New York home price — use $500,000 as a starting point for statewide median.',
      'Enter your down payment. First-time buyers can explore SONYMA (State of New York Mortgage Agency) programs.',
      'Select your loan term. 30-year fixed is most common in New York.',
      'Enter the property tax rate. NY averages ~1.3% (Tax Foundation) but varies from under 1% in NYC to over 2.4% in some upstate counties.',
      'Select your STAR eligibility status to see estimated annual property tax savings.',
      'Review the results — remember New York also has state income tax (unlike Texas), which affects your overall housing budget.',
    ],
    commonUses: [
      'Estimate monthly mortgage payments on a New York home including property taxes, mortgage recording tax, and state income tax impact.',
      'Compare housing costs across New York City, suburban, and upstate markets with location-specific property tax rate assumptions.',
      'Plan your home purchase by evaluating SONYMA down payment assistance and the STAR school tax relief program benefits.',
    ],
    explanation: 'New York\'s housing market is defined by extreme regional variation. New York City and its suburbs have among the highest home prices in the nation, while upstate cities like Buffalo, Rochester, and Syracuse remain relatively affordable. Property taxes in New York average about 1.3% of home value annually (Tax Foundation, 2024 ACS), but this varies dramatically by county — the five NYC counties are lowest (Brooklyn about 0.56%) while upstate counties like Monroe (Rochester, about 2.4%) are among the highest. New York is also one of the few states with a mortgage recording tax (1.00%-2.80% of the loan amount depending on county, paid at closing) and charges a 1% mansion tax on residential purchases of $1,000,000 or more. The STAR (School Tax Relief) program covers the first $30,000 (Basic) or $88,500 (Enhanced, age 65+, income up to $110,750) of full value. Unlike Texas, New York has both property tax AND state income tax (ranging from 4% to 10.9%), so the total tax burden is significantly higher.',
    workedExamples: [
      {
        scenario: 'Maria is buying a $400,000 condo in Queens, NYC with 20% down ($80,000), a 30-year fixed mortgage at 6.7%, and NYC property tax rate of 0.9%. She qualifies for Basic STAR.',
        inputs: { homePrice: '400000', downPayment: '80000', interestRate: '6.7', loanTerm: '30', propertyTaxRate: '0.9', starEligible: 'basic', mrtRegion: 'nyc' },
        result: 'Monthly P&I is approximately $2,065, plus $300/month property tax — total $2,365/month. STAR saves roughly $162/year on school taxes. Mortgage recording tax at closing: $5,760 (1.80% of the $320,000 loan; the 2.05% total of $6,560 includes $800 paid by the lender).',
        insight: 'Maria\'s monthly P&I is about $2,065, plus $300/month in property tax — total ~$2,365/month before STAR savings. Her share of the mortgage recording tax adds $5,760 at closing. STAR saves her roughly $162/year on school taxes. State income tax on top means her true housing burden is higher than the mortgage alone suggests.',
      },
      {
        scenario: 'The Johnsons are buying a $250,000 home in Rochester (Monroe County) with 10% down ($25,000), a 30-year fixed at 6.7%, and a Monroe County property tax rate of 2.4%. They are first-time buyers using SONYMA.',
        inputs: { homePrice: '250000', downPayment: '25000', interestRate: '6.7', loanTerm: '30', propertyTaxRate: '2.4', starEligible: 'basic', mrtRegion: 'upstate' },
        result: 'Monthly P&I is approximately $1,452, plus $500/month property tax and $94/month PMI — total $2,046/month. Mortgage recording tax at closing: $1,688 (0.75% of the $225,000 loan; the lender pays the other 0.25%). Upstate NY property taxes at 2.4% add more to the monthly payment than PMI, making property tax the single largest cost after P&I.',
        insight: 'With only 10% down, the Johnsons pay PMI (~$94/month) on top of $1,452 P&I and $500/month in property tax — total ~$2,046/month. Upstate NY property taxes at 2.4% add more to the monthly payment than PMI. The high property tax is the single largest cost after principal and interest.',
      },
    ],
    proTips: [
      'Apply for STAR through the NYS Tax Department immediately after closing — the exemption is not automatic. You need to register online at tax.ny.gov/star or call 518-457-2036.',
      'Check SONYMA\'s "Achieving the Dream" program for a below-market interest rate if you meet its income limits.',
      'NYC buyers: co-ops have lower closing costs than condos because you are buying shares, not real property. The mortgage recording tax does not apply to co-op loans in NYC.',
      'Factor the mortgage recording tax into your closing cost budget — on a $500K 1-3 family or condo mortgage in NYC, your share is $9,625 (1.925%; the total is 2.175% or $10,875, and the lender pays 0.25%). It is paid at closing. Also budget the 1% mansion tax on purchases of $1,000,000 or more.',
      'Upstate buyers: negotiate property tax assessments with your town assessor. Many upstate NY assessments are outdated, and a successful grievance can reduce your tax bill permanently.',
    ],
    limitations: [
      'Mortgage recording tax uses the NYS Form MT-15 totals for four regions (NYC, Nassau/Suffolk/Orange/Putnam/Dutchess, Westchester/Rockland, and most upstate counties); some upstate counties charge 0.75% or 1.25% in total, Yonkers 1.80%. Co-op loans and the $10,000 one-/two-family exclusion are not modelled, and the mansion tax is the statewide 1% (NYC supplemental rates above $2 million are not included).',
      'STAR savings are estimated based on school taxes being ~60% of total property taxes; actual savings depend on your specific school district and assessment.',
      'Co-op and condo common charges are not included. Mello-Roos and special district taxes common in some NY developments are not modeled.',
      'SONYMA program eligibility requirements (income limits, purchase price caps) vary by county. State income tax impact on your overall budget is mentioned but not calculated here.',
    ],
    quickReference: [
      { label: 'NY Property Tax Avg', value: '~1.3% statewide (NYC under 1%, some upstate counties over 2.4%)' },
      { label: 'NY Income Tax Range', value: '4% - 10.9%' },
      { label: 'Basic STAR', value: 'First $30,000 of full value (credit income limit $500K)' },
      { label: 'Enhanced STAR (2026-27)', value: 'First $88,500 of full value (age 65+, income ≤ $110,750)' },
      { label: 'NYC mortgage recording tax', value: '2.05% (<$500K) / 2.175% ($500K+, 1-3 family or condo); lender pays 0.25%' },
      { label: 'NY mansion tax', value: '1% of price, buyer pays, residential $1M+' },
      { label: 'SONYMA Down Payment Help', value: 'Generally up to 3% of price, max $15,000' },
          ],
    faqs: [
      { question: 'How do NY property taxes compare to other states?', answer: 'New York has some of the highest combined tax burdens in the US. Property taxes average about 1.3% of home value (Tax Foundation), plus state income tax of 4-10.9%. Unlike Texas which has no income tax, New York homeowners pay both property and income taxes — factor this into your affordability calculation.' },
      { question: 'What is the STAR program?', answer: 'The School Tax Relief (STAR) program offers a partial exemption from school property taxes. Basic STAR covers the first $30,000 of your home\'s full value (household income up to $500,000 for the STAR credit, or $250,000 for the exemption). Enhanced STAR (for owners 65+) covers the first $88,500 for household income up to $110,750 (2026-27 school year). New homeowners register for the STAR credit through the NYS Tax Department at tax.ny.gov/star.' },
      { question: 'What is SONYMA?', answer: 'The State of New York Mortgage Agency (SONYMA) offers below-market-rate mortgages and down payment assistance (generally up to 3% of the purchase price, capped at $15,000) for first-time homebuyers with qualifying income limits. Additional programs exist for specific professions: teachers, nurses, police officers, firefighters, and veterans. SONYMA also offers a "RemodelNY" program that finances both the home purchase and renovations in a single mortgage.' },
      { question: 'What is the mortgage recording tax?', answer: 'New York is one of the few states that charges a mortgage recording tax. Per NYS Form MT-15 the total is 2.05% in NYC for loans under $500K and 2.175% for 1-3 family homes and condos at $500K+, 1.05% in Nassau, Suffolk, Orange, Putnam and Dutchess, 1.30% in Westchester and Rockland, and 0.75%-1.25% in upstate counties. The lender pays 0.25% of it, so on a $400,000 mortgage in NYC the borrower pays about $7,200 (1.80%) at closing, with the lender paying $1,000 more. It is paid at closing and is generally not deductible as mortgage interest.' },
      { question: 'Are co-ops cheaper to buy than condos in NYC?', answer: 'Co-ops typically have lower purchase prices than comparable condos and significantly lower closing costs because the mortgage recording tax does not apply to co-op loans (you are buying shares in a corporation, not real property). However, co-ops require board approval, have stricter financial requirements (often 20-25% down minimum, 2+ years of post-closing liquidity), and may have restrictions on subletting, renovations, and pied-a-terre use. Condos offer more flexibility but higher costs.' },
    ],
    citations: [
      { source: 'NY STAR Program', url: 'https://www.tax.ny.gov/pit/property/star/' },
      { source: 'SONYMA — First-Time Homebuyers', url: 'https://hcr.ny.gov/sonyma' },
      { source: 'NYC Department of Finance — Mortgage Recording Tax', url: 'https://www.nyc.gov/site/finance/taxes/mortgage-recording-tax.page' },
    ],
  },
};
export default nyMortgageConfig;
