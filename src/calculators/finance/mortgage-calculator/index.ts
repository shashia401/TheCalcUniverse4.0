import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, CalculatorResult, ExplainStep } from '../../../types/calculator';
import AmortizationPanel from '../../../components/calculator/AmortizationPanel';
import { pmt } from '../../../utils/financial';
import { finiteSteps } from '../../../utils/explainGuard';
import { hasAnswer, resultValue } from '../../../utils/explainResults';
import { parseMortgage, PMI_ANNUAL_RATE } from '../../realestate/mortgage-amortization/mortgageMath';
import { monthsToEightyPercentLtv } from '../down-payment/index';
import { DEFAULT_INSURANCE_ANNUAL, DEFAULT_PROPERTY_TAX_PCT } from '../../../utils/affordability';

const MAX_YEARS = 50;
const nonNegative = (raw: string | undefined): number => {
  const x = parseFloat(raw ?? '');
  return Number.isFinite(x) && x > 0 ? x : 0;
};

/**
 * Every figure behind the result rows and the worked solution (single source of truth). Null when the inputs are unusable.
 * Parsing and the "% overrides $" down-payment rule come from the shared mortgage model; the level payment uses the shared `pmt`.
 * Each monthly amount is rounded to the cent (as on a lender's statement) and the totals are built from those rounded amounts,
 * so every number on the page adds up. Nothing here reads the date.
 */
export function mortgageFigures(values: Record<string, string>) {
  const m = parseMortgage(values);
  if (!m || m.downPayment < 0 || m.annualRate < 0 || m.years > MAX_YEARS) return null;

  const price = new Decimal(m.homePrice);
  const downPayment = new Decimal(m.downPayment).toDP(2);
  const loanAmount = price.minus(downPayment);
  if (loanAmount.lte(0)) return null;

  const months = m.numPayments;
  const monthlyRate = new Decimal(m.monthlyRate);
  const exactPayment = pmt(loanAmount.toNumber(), m.monthlyRate, months);
  if (!Number.isFinite(exactPayment)) return null;

  const taxRatePct = nonNegative(values.propertyTax);
  const insuranceAnnual = nonNegative(values.homeInsurance);
  const downPct = downPayment.div(price).mul(100);
  const hasPmi = downPct.toDP(6).lt(20);

  const monthlyPI = new Decimal(exactPayment).toDP(2);
  const monthlyTax = price.mul(taxRatePct).div(100).div(12).toDP(2);
  const monthlyInsurance = new Decimal(insuranceAnnual).div(12).toDP(2);
  const monthlyPmi = hasPmi ? loanAmount.mul(PMI_ANNUAL_RATE).div(12).toDP(2) : new Decimal(0);
  const monthlyHoa = new Decimal(nonNegative(values.hoaFee)).toDP(2);
  const totalMonthly = monthlyPI.plus(monthlyTax).plus(monthlyInsurance).plus(monthlyPmi).plus(monthlyHoa);

  const pmiMonths = hasPmi ? monthsToEightyPercentLtv(m.homePrice, loanAmount.toNumber(), parseFloat(values.interestRate), m.years) : 0;
  const zeroRate = monthlyRate.isZero();
  const totalPI = zeroRate ? loanAmount : monthlyPI.mul(months);
  const totalInterest = totalPI.minus(loanAmount);
  const escrowMonthly = monthlyTax.plus(monthlyInsurance).plus(monthlyHoa);
  const totalPaid = totalPI.plus(escrowMonthly.mul(months)).plus(monthlyPmi.mul(pmiMonths));

  return {
    price, downPayment, downPct, loanAmount, years: m.years, months, rate: new Decimal(m.annualRate), monthlyRate, zeroRate,
    taxRatePct, insuranceAnnual, hasPmi, pmiMonths, monthlyPI, monthlyTax, monthlyInsurance, monthlyPmi, monthlyHoa,
    totalMonthly, totalPI, totalInterest, escrowMonthly, totalPaid, panel: m,
  };
}

const usd = (d: Decimal): string => `$${d.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
const pct = (d: Decimal, dp = 2): string => `${+d.toFixed(dp)}%`;
const yearsMonths = (months: number): string => {
  const y = Math.floor(months / 12);
  const mo = months % 12;
  return [y ? `${y} yr` : '', mo ? `${mo} mo` : ''].filter(Boolean).join(' ');
};

const mortgageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homePrice',
      label: 'Home Price',
      type: 'number',
      placeholder: '400,000',
      prefix: '$',
      min: 0,
      step: 1000,
      inputMode: 'numeric',
      required: true,
      helpText: 'The purchase price. 400,000 is only an example.',
    },
    {
      id: 'downPayment',
      label: 'Down Payment ($)',
      type: 'number',
      placeholder: '80,000',
      prefix: '$',
      min: 0,
      step: 1000,
      inputMode: 'numeric',
      required: false,
      helpText: 'Cash you put down. Leave the % box below empty to use this amount.',
    },
    {
      id: 'downPaymentPct',
      label: 'Down Payment (%)',
      type: 'number',
      placeholder: 'Optional',
      unit: '%',
      min: 0,
      max: 100,
      step: 0.5,
      inputMode: 'decimal',
      required: false,
      helpText: 'Optional. When filled, this replaces the dollar amount. Under 20% adds estimated PMI.',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      defaultValue: '30',
      required: true,
      options: [
        { label: '10 years', value: '10' },
        { label: '15 years', value: '15' },
        { label: '20 years', value: '20' },
        { label: '30 years', value: '30' },
      ],
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      type: 'number',
      placeholder: '6.8',
      unit: '%',
      min: 0,
      max: 30,
      step: 0.01,
      inputMode: 'decimal',
      required: true,
      helpText: 'Use the rate on your lender\'s quote for a fixed-rate loan. 6.8% is only an example.',
    },
    {
      id: 'propertyTax',
      label: 'Property Tax (% of price per year)',
      type: 'number',
      placeholder: String(DEFAULT_PROPERTY_TAX_PCT),
      unit: '%',
      min: 0,
      max: 10,
      step: 0.01,
      inputMode: 'decimal',
      required: false,
      helpText: 'Annual tax as a share of the home price. It varies by county; check the local assessor for the real rate.',
    },
    {
      id: 'homeInsurance',
      label: 'Home Insurance (per year)',
      type: 'number',
      placeholder: String(DEFAULT_INSURANCE_ANNUAL),
      prefix: '$',
      min: 0,
      step: 100,
      inputMode: 'numeric',
      required: false,
      helpText: 'Annual homeowners premium. Use a quote for your home.',
    },
    {
      id: 'hoaFee',
      label: 'HOA Fee (per month)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      min: 0,
      step: 10,
      inputMode: 'numeric',
      required: false,
      helpText: 'Monthly homeowners-association dues, if any.',
    },
  ],
  calculate: (values) => {
    const f = mortgageFigures(values);
    if (!f) return [];
    const piShare = f.monthlyPI.div(f.totalMonthly).mul(100);

    const results: CalculatorResult[] = [
      {
        id: 'totalMonthly',
        label: 'Total Monthly Payment',
        value: usd(f.totalMonthly),
        highlight: true,
        color: 'neutral',
        interpretation: `Principal and interest is ${pct(piShare, 0)} of this payment; the rest is property tax, insurance${f.hasPmi ? ', estimated PMI' : ''}${f.monthlyHoa.gt(0) ? ' and HOA dues' : ''}. Taxes, insurance and PMI are estimates, not quotes.`,
      },
      { id: 'monthlyPI', label: 'Principal & Interest', value: usd(f.monthlyPI), color: 'neutral' },
      { id: 'monthlyTax', label: 'Property Tax', value: usd(f.monthlyTax), color: 'neutral' },
      { id: 'monthlyInsurance', label: 'Home Insurance', value: usd(f.monthlyInsurance), color: 'neutral' },
      { id: 'monthlyPmi', label: 'PMI (estimate)', value: usd(f.monthlyPmi), color: f.hasPmi ? 'negative' : 'positive' },
      { id: 'monthlyHoa', label: 'HOA', value: usd(f.monthlyHoa), color: 'neutral' },
      { id: 'loanAmount', label: 'Loan Amount', value: usd(f.loanAmount), color: 'neutral' },
      { id: 'downPaymentLine', label: 'Down Payment', value: `${usd(f.downPayment)} (${pct(f.downPct)})`, color: f.hasPmi ? 'negative' : 'positive' },
      { id: 'totalInterest', label: 'Total Interest Over the Loan', value: usd(f.totalInterest), color: 'negative' },
      { id: 'totalPaid', label: 'Total Paid Over the Loan (excl. down payment)', value: usd(f.totalPaid), color: 'neutral' },
      {
        id: 'pmiEnds',
        label: 'PMI Ends (balance reaches 80% of price)',
        value: f.hasPmi ? `After payment ${f.pmiMonths} (${yearsMonths(f.pmiMonths)})` : 'No PMI needed (20% or more down)',
        color: f.hasPmi ? 'negative' : 'positive',
      },
    ];
    return results;
  },
  explainSteps: (values) => {
    const f = mortgageFigures(values);
    if (!f) return [];
    const rows = mortgageConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const val = (id: string) => resultValue(rows, id) ?? '';

    const steps: ExplainStep[] = [
      {
        label: 'Loan amount and down payment',
        expr: `${usd(f.price)} − ${usd(f.downPayment)} = ${usd(f.loanAmount)} · ${usd(f.downPayment)} ÷ ${usd(f.price)} = ${pct(f.downPct)} down`,
        note: f.hasPmi ? 'Under 20% down, so the calculator adds an estimated PMI below.' : '20% or more down, so no PMI is added.',
      },
      {
        label: 'Monthly rate and number of payments',
        expr: `r = ${pct(f.rate.mul(100), 4)} ÷ 12 = ${pct(f.monthlyRate.mul(100), 4)} per month · n = ${+(f.months / 12).toFixed(2)} years × 12 = ${f.months} payments`,
      },
    ];
    if (f.zeroRate) {
      steps.push({ label: 'No interest, so divide the loan evenly', expr: `M = ${usd(f.loanAmount)} ÷ ${f.months} = ${val('monthlyPI')}` });
    } else {
      const factor = f.monthlyRate.plus(1).pow(f.months);
      steps.push({
        label: 'Principal and interest payment',
        expr: `(1 + r)ⁿ = ${factor.toFixed(4)} · M = ${usd(f.loanAmount)} × (r × (1 + r)ⁿ) ÷ ((1 + r)ⁿ − 1) = ${val('monthlyPI')}`,
        note: 'The one fixed payment that pays the interest and retires the loan exactly at the last month.',
      });
    }
    if (f.monthlyTax.gt(0)) {
      steps.push({
        label: 'Property tax',
        expr: `${usd(f.price)} × ${+f.taxRatePct.toFixed(4)}% ÷ 12 = ${val('monthlyTax')} a month`,
        note: 'An estimate from the rate you entered; your county sets the real bill.',
      });
    }
    if (f.monthlyInsurance.gt(0)) {
      steps.push({ label: 'Home insurance', expr: `${usd(new Decimal(f.insuranceAnnual))} ÷ 12 = ${val('monthlyInsurance')} a month` });
    }
    if (f.hasPmi) {
      steps.push(
        {
          label: 'Estimated PMI',
          expr: `${usd(f.loanAmount)} × ${pct(new Decimal(PMI_ANNUAL_RATE).mul(100), 2)} ÷ 12 = ${val('monthlyPmi')} a month`,
          note: 'The yearly PMI rate is an assumption; real quotes vary with credit score and down payment.',
        },
        {
          label: 'When PMI would stop',
          expr: `80% × ${usd(f.price)} = ${usd(f.price.mul(0.8))} · the balance falls to that after payment ${f.pmiMonths} (${yearsMonths(f.pmiMonths)})`,
          note: 'Standard rule: you can ask to drop PMI once the balance reaches 80% of the original price.',
        },
      );
    }
    if (f.monthlyHoa.gt(0)) {
      steps.push({ label: 'HOA dues', expr: `${val('monthlyHoa')} a month, added as entered` });
    }
    const parts = [val('monthlyPI')];
    if (f.monthlyTax.gt(0)) parts.push(`${val('monthlyTax')} tax`);
    if (f.monthlyInsurance.gt(0)) parts.push(`${val('monthlyInsurance')} insurance`);
    if (f.hasPmi) parts.push(`${val('monthlyPmi')} PMI`);
    if (f.monthlyHoa.gt(0)) parts.push(`${val('monthlyHoa')} HOA`);
    steps.push({ label: 'Total monthly payment', expr: `${parts.join(' + ')} = ${val('totalMonthly')}` });

    steps.push({
      label: 'Total interest over the loan',
      expr: f.zeroRate ? 'No interest rate, so no interest is paid: $0.00' : `${val('monthlyPI')} × ${f.months} − ${usd(f.loanAmount)} = ${val('totalInterest')}`,
    });
    const paidTerms = [f.zeroRate ? usd(f.loanAmount) : `${val('monthlyPI')} × ${f.months}`];
    if (f.escrowMonthly.gt(0)) paidTerms.push(`${usd(f.escrowMonthly)} × ${f.months}`);
    if (f.hasPmi) paidTerms.push(`${val('monthlyPmi')} × ${f.pmiMonths}`);
    steps.push({
      label: 'Total paid over the loan',
      expr: `${paidTerms.join(' + ')} = ${val('totalPaid')}`,
      note: 'Tax, insurance and HOA are held flat for the whole loan and PMI is paid only until it ends; in real life these change.',
    });
    return finiteSteps(steps);
  },
  extraPanel: (values, results) => {
    const f = mortgageFigures(values);
    if (!results.length || !f) return null;
    return createElement(AmortizationPanel, {
      loanAmount: f.loanAmount.toNumber(),
      annualRate: f.panel.annualRate,
      years: f.years,
      monthlyPayment: f.monthlyPI.toNumber(),
      totalInterest: f.totalInterest.toNumber(),
      monthlyBreakdown: {
        principalAndInterest: f.monthlyPI.toNumber(),
        propertyTax: f.monthlyTax.toNumber(),
        homeInsurance: f.monthlyInsurance.toNumber(),
        pmi: f.monthlyPmi.toNumber(),
        hoa: f.monthlyHoa.toNumber(),
        other: 0,
        total: f.totalMonthly.toNumber(),
      },
    });
  },
  educational: {
    formula: 'M = P × [r(1+r)^n] / [(1+r)^n − 1]  ·  Total = M + tax/12 + insurance/12 + PMI + HOA',
    formulaDescription:
      'The monthly principal-and-interest payment M comes from the standard fixed-rate amortization formula, where P is the loan (price minus down payment), r is the annual rate divided by 12, and n is the number of monthly payments. The full monthly payment adds one-twelfth of the yearly property tax and insurance, an estimated PMI when you put down less than 20%, and any HOA dues. PMI is estimated at ' +
      `${+(PMI_ANNUAL_RATE * 100).toFixed(2)}% of the loan per year until the balance reaches 80% of the original price. Every monthly amount is rounded to the cent, as on a lender's statement. Tax, insurance and PMI are estimates, not quotes.`,
    variables: [
      { symbol: 'P', name: 'Loan amount', description: 'The home price minus your down payment. This is what you borrow and what interest is charged on.' },
      { symbol: 'r', name: 'Monthly interest rate', description: 'The annual rate divided by 12. A 6.8% annual rate is about 0.5667% per month.' },
      { symbol: 'n', name: 'Number of payments', description: 'Years times 12: 120, 180, 240 or 360 payments for 10, 15, 20 and 30 years.' },
      { symbol: 'M', name: 'Principal & interest payment', description: 'The fixed amount that covers the interest each month and pays the loan off exactly at payment n.' },
      { symbol: 'Tax', name: 'Property tax', description: 'Home price times your yearly tax rate, divided by 12. Lenders usually collect it monthly in an escrow account.' },
      { symbol: 'PMI', name: 'Private mortgage insurance', description: 'Charged on conventional loans with less than 20% down. This calculator estimates it as a flat share of the original loan per year and stops it when the balance reaches 80% of the home price.' },
    ],
    howToUse: [
      'Enter the home price.',
      'Enter your down payment as dollars, or fill the % box to use a percentage instead (the percentage wins when both are filled).',
      'Pick the loan term and enter the interest rate from your lender\'s quote.',
      'Enter the yearly property tax rate, the yearly home insurance premium and any monthly HOA dues.',
      'Read the total monthly payment first, then the breakdown, the total interest and, if you put down less than 20%, when PMI would end.',
    ],
    commonUses: [
      'See the real monthly cost of a home, not just principal and interest.',
      'Compare what 5%, 10% and 20% down does to the payment and to PMI.',
      'Compare a 15-year and a 30-year loan: higher payment against far less total interest.',
      'Check a payment against a monthly budget before talking to a lender.',
    ],
    explanation:
      'A mortgage payment has more parts than most people expect. The loan payment itself (principal and interest) is fixed for a fixed-rate loan. On top of it sit property tax and homeowners insurance, which lenders usually collect each month and pay for you, plus private mortgage insurance if you borrowed more than 80% of the price, plus any HOA dues you pay directly. Early in the loan most of each payment is interest; the share that reduces the balance grows slowly, which is why the balance falls to 80% of the price later than many buyers expect. This page shows the whole picture in one number, then breaks it into its parts and shows what the loan costs in total.',
    workedExamples: [
      {
        scenario: 'Example numbers only: a $400,000 home, $80,000 (20%) down, 30 years at 6.8%, property tax 1.1% a year, insurance $1,500 a year, no HOA.',
        inputs: { homePrice: '400000', downPayment: '80000', downPaymentPct: '', loanTerm: '30', interestRate: '6.8', propertyTax: '1.1', homeInsurance: '1500', hoaFee: '0' },
        result: 'Loan $320,000. Principal and interest $2,086.16, tax $366.67, insurance $125.00, no PMI. Total monthly payment $2,577.83. Total interest $431,017.60.',
        insight: '20% down means no PMI. About 81% of the payment is principal and interest; the rest is tax and insurance that the lender collects with it.',
      },
      {
        scenario: 'Example numbers only: the same $400,000 home with 5% down ($20,000), 30 years at 6.8%, tax 1.1%, insurance $1,500, no HOA.',
        inputs: { homePrice: '400000', downPayment: '20000', downPaymentPct: '5', loanTerm: '30', interestRate: '6.8', propertyTax: '1.1', homeInsurance: '1500', hoaFee: '0' },
        result: 'Loan $380,000. Principal and interest $2,477.32, estimated PMI $253.33, total monthly payment $3,222.32. PMI would end after payment 127 (10 yr 7 mo), about $32,172.91 in PMI in all.',
        insight: 'Putting down $60,000 less raises the monthly payment by about $644, and PMI alone is about $253 of that.',
      },
      {
        scenario: 'Example numbers only: the $400,000 home with 20% down at 6.8%, comparing 15 years with 30 years (tax 1.1%, insurance $1,500).',
        inputs: { homePrice: '400000', downPayment: '80000', downPaymentPct: '', loanTerm: '15', interestRate: '6.8', propertyTax: '1.1', homeInsurance: '1500', hoaFee: '0' },
        result: '15 years: principal and interest $2,840.59, total monthly payment $3,332.26, total interest $191,306.20. Against 30 years: $2,577.83 a month and $431,017.60 in interest.',
        insight: 'The 15-year loan costs about $754 more each month but saves about $239,711 in interest. In practice lenders also quote a lower rate for shorter terms, which this example does not apply.',
      },
    ],
    proTips: [
      'Compare quotes using the same down payment and term, and ask lenders for a Loan Estimate so the numbers are comparable.',
      'Get a real insurance quote and your county\'s tax rate before you rely on the total; they are the least certain parts of this estimate.',
      'If you are close to 20% down, check what it costs to reach it: removing PMI can be worth more than the extra cash earns elsewhere.',
      'Budget for maintenance and utilities too; they are not part of a mortgage payment.',
    ],
    limitations: [
      'Property tax, insurance and PMI are estimates from the rates you enter. They are held flat for the whole loan, but real tax and insurance bills usually change.',
      `PMI uses a flat ${+(PMI_ANNUAL_RATE * 100).toFixed(2)}% of the loan per year. Real PMI depends on your credit score and down payment, and FHA, VA and USDA loans use different insurance or fees that are not modeled here.`,
      'This covers a fixed-rate loan with monthly payments. It does not model adjustable rates, interest-only periods, points, closing costs or lender fees.',
      'Totals use each monthly amount rounded to the cent, so they can differ from a lender\'s schedule by a small amount.',
    ],
    faqs: [
      {
        question: 'What does this mortgage calculator include?',
        answer: 'It includes principal and interest, property tax, homeowners insurance, estimated PMI when you put down less than 20%, and monthly HOA dues. It also shows the loan amount, total interest, the total paid over the loan, and when PMI would end.',
      },
      {
        question: 'What does it leave out?',
        answer: 'Closing costs, points, mortgage insurance on FHA, VA or USDA loans, maintenance, utilities, flood or earthquake insurance, and any changes in tax or insurance over time. Adjustable-rate loans are not modeled.',
      },
      {
        question: 'How is this different from the mortgage amortization calculator?',
        answer: 'This page answers one question: what will my monthly payment be, and what does the loan cost in total? The mortgage amortization calculator is built for schedules, payoff dates and the effect of extra payments. Use this one to size the payment, then the amortization page to plan paying it down.',
      },
      {
        question: 'When is PMI required, and when does it stop?',
        answer: 'Lenders usually require private mortgage insurance on a conventional loan when you put down less than 20%. Under federal rules for most loans you can ask to cancel it once your balance reaches 80% of the original value, and it must end automatically when the scheduled balance reaches 78%. This calculator shows the 80% point and uses a flat PMI estimate, so check your lender\'s terms.',
      },
      {
        question: 'Should I enter the down payment in dollars or percent?',
        answer: 'Either. Fill the dollar box, or fill the % box to use a percentage of the price. If both are filled, the percentage is used.',
      },
      {
        question: 'Why is my lender\'s payment different from this estimate?',
        answer: 'Your lender knows your exact rate, tax bill, insurance premium and mortgage insurance cost. Small rounding differences also exist. The Loan Estimate your lender provides is the document to rely on.',
      },
    ],
    citations: [
      { source: 'Consumer Financial Protection Bureau: Owning a Home', url: 'https://www.consumerfinance.gov/owning-a-home/' },
      { source: 'CFPB: What is private mortgage insurance?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-private-mortgage-insurance-en-122/' },
      { source: 'CFPB: When can I remove PMI from my loan?', url: 'https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/' },
    ],
  },
};

export default mortgageConfig;
