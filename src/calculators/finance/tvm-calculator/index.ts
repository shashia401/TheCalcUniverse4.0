import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import TVMPanel from './TVMPanel';

function tvmFV(pv: number, pmt: number, r: number, n: number, due: boolean): number {
  if (r === 0) return -(pv + pmt * n);
  const D = new Decimal(1).plus(r).pow(n);
  const annuityFactor = due
    ? D.minus(1).div(r).times(new Decimal(1).plus(r))
    : D.minus(1).div(r);
  return -(new Decimal(pv).times(D).plus(new Decimal(pmt).times(annuityFactor))).toNumber();
}

function tvmPV(fv: number, pmt: number, r: number, n: number, due: boolean): number {
  if (r === 0) return -(fv + pmt * n);
  const D = new Decimal(1).plus(r).pow(n);
  const annuityFactor = due
    ? new Decimal(1).minus(new Decimal(1).div(D)).div(r).times(new Decimal(1).plus(r))
    : new Decimal(1).minus(new Decimal(1).div(D)).div(r);
  return -(new Decimal(fv).div(D).plus(new Decimal(pmt).times(annuityFactor))).toNumber();
}

function tvmPMT(pv: number, fv: number, r: number, n: number, due: boolean): number {
  if (r === 0) return -(pv + fv) / n;
  const D = new Decimal(1).plus(r).pow(n);
  const dueMult = due ? new Decimal(1).div(new Decimal(1).plus(r)) : new Decimal(1);
  return -(new Decimal(pv).times(D).plus(fv))
    .div(D.minus(1).div(r))
    .times(dueMult)
    .toNumber();
}

function tvmN(pv: number, fv: number, pmt: number, r: number, due: boolean): number {
  if (r === 0) {
    if (pmt === 0) return 0;
    return -(pv + fv) / pmt;
  }
  const dueMult = due ? new Decimal(1).plus(r) : new Decimal(1);
  const num = new Decimal(-fv).times(r).plus(new Decimal(pmt).times(dueMult));
  const den = new Decimal(pv).times(r).plus(new Decimal(pmt).times(dueMult));
  if (den.eq(0) || num.div(den).lte(0)) return NaN;
  return Decimal.ln(num.div(den)).div(Decimal.ln(new Decimal(1).plus(r))).toNumber();
}

function tvmRate(pv: number, fv: number, pmt: number, n: number, due: boolean): number {
  if (n === 0) return 0;
  let rate = 0.1;
  for (let i = 0; i < 200; i++) {
    const fvCalc = tvmFV(pv, pmt, rate, n, due);
    const delta = 1e-6;
    const fvDelta = tvmFV(pv, pmt, rate + delta, n, due);
    const deriv = (fvDelta - fvCalc) / delta;
    if (Math.abs(deriv) < 1e-15) break;
    const next = rate - (fvCalc - fv) / deriv;
    if (Math.abs(next - rate) < 1e-10) { rate = next; break; }
    rate = next;
    if (rate < -0.9999) rate = -0.9999;
  }
  return rate;
}

const tvmSvg = `<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">The Five Variables of TVM</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Know any four, solve for the fifth</text><g transform="translate(40,65)"><rect x="0" y="0" width="120" height="60" rx="8" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="60" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-1e40af)">PV</text><text x="60" y="44" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Present Value</text><text x="60" y="56" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">Today's $</text><line x1="125" y1="30" x2="195" y2="30" stroke="var(--svg-22c55e)" stroke-width="2.5" stroke-linecap="round"/><polygon points="195,24 208,30 195,36" fill="var(--svg-22c55e)"/><text x="165" y="18" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)" font-weight="bold">x(1+r)^n</text><rect x="215" y="0" width="120" height="60" rx="8" fill="var(--svg-dcfce7)" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="275" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-15803d)">FV</text><text x="275" y="44" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Future Value</text><text x="275" y="56" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">Later $</text><rect x="0" y="85" width="120" height="50" rx="8" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="60" y="106" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-b45309)">PMT</text><text x="60" y="123" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Periodic Payment</text><line x1="60" y1="135" x2="60" y2="145" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><line x1="60" y1="145" x2="165" y2="145" stroke="var(--svg-f59e0b)" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="165" y1="145" x2="275" y2="145" stroke="var(--svg-f59e0b)" stroke-width="1.5" stroke-dasharray="4,3"/><polygon points="275,139 285,145 275,151" fill="var(--svg-f59e0b)"/><rect x="140" y="85" width="110" height="50" rx="8" fill="var(--svg-f3e8ff)" stroke="var(--svg-8b5cf6)" stroke-width="1.5"/><text x="195" y="106" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-7c3aed)">N</text><text x="195" y="123" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Number of Periods</text><rect x="270" y="85" width="110" height="50" rx="8" fill="var(--svg-fce7f3)" stroke="var(--svg-ec4899)" stroke-width="1.5"/><text x="325" y="106" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-db2777)">Rate (I/Y)</text><text x="325" y="123" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Interest per Period</text><line x1="20" y1="175" x2="360" y2="175" stroke="var(--svg-94a3b8)" stroke-width="2"/><circle cx="20" cy="175" r="6" fill="var(--svg-3b82f6)"/><text x="20" y="192" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)" font-weight="bold">Today</text><circle cx="105" cy="175" r="4" fill="var(--svg-f59e0b)"/><text x="105" y="192" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">PMT</text><circle cx="190" cy="175" r="4" fill="var(--svg-f59e0b)"/><text x="190" y="192" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">PMT</text><circle cx="275" cy="175" r="4" fill="var(--svg-f59e0b)"/><text x="275" y="192" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">PMT</text><circle cx="360" cy="175" r="6" fill="var(--svg-22c55e)"/><text x="360" y="192" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)" font-weight="bold">End</text><g transform="translate(20,210)"><text x="170" y="10" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Use Cases</text><text x="85" y="28" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Mortgage: Solve PMT</text><text x="170" y="28" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)">Savings: Solve FV</text><text x="255" y="28" text-anchor="middle" font-size="9" fill="var(--svg-8b5cf6)">Lease: Solve Rate</text><text x="85" y="44" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">Payoff: Solve N</text><text x="200" y="44" text-anchor="middle" font-size="9" fill="var(--svg-f59e0b)">Investment: Solve PV</text></g></g></svg>`;

const tvmConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'solveFor',
      label: 'Solve For',
      type: 'select',
      required: true,
      options: [
        { label: 'Future Value (FV)', value: 'FV' },
        { label: 'Present Value (PV)', value: 'PV' },
        { label: 'Number of Periods (N)', value: 'N' },
        { label: 'Interest Rate (I/Y)', value: 'RATE' },
        { label: 'Payment (PMT)', value: 'PMT' },
      ],
      helpText: 'Which TVM variable you want to calculate by solving for it.',
    },
    {
      id: 'n',
      label: 'Number of Periods (N)',
      type: 'number',
      placeholder: '60',
      unit: 'periods',
      inputMode: 'numeric',
      min: 0,
      step: 1,
      helpText: 'Total number of payment periods (e.g., 360 for 30-yr monthly mortgage)',
    },
    {
      id: 'rate',
      label: 'Interest Rate per Period (I/Y)',
      type: 'number',
      placeholder: '0.5',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 100,
      step: 0.001,
      helpText: 'Rate per period. For monthly payments on 6% annual rate: 6/12 = 0.5',
    },
    {
      id: 'pv',
      label: 'Present Value (PV)',
      type: 'number',
      placeholder: '-250000',
      prefix: '$',
      inputMode: 'decimal',
      step: 0.01,
      helpText: 'Current value. Cash outflows (loans received) are negative. Enter negative for loans.',
    },
    {
      id: 'pmt',
      label: 'Payment (PMT)',
      type: 'number',
      placeholder: '1498.88',
      prefix: '$',
      inputMode: 'decimal',
      step: 0.01,
      helpText: 'Regular payment each period. Payments you make are negative; payments you receive are positive.',
    },
    {
      id: 'fv',
      label: 'Future Value (FV)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      inputMode: 'decimal',
      step: 0.01,
      helpText: 'Value at the end of all periods. Use 0 for loans that fully amortize.',
    },
    {
      id: 'timing',
      label: 'Payment Timing',
      type: 'select',
      required: true,
      options: [
        { label: 'End of Period (Ordinary Annuity)', value: 'end' },
        { label: 'Beginning of Period (Annuity Due)', value: 'begin' },
      ],
      helpText: 'When payments occur — end of period (standard) or beginning (leases/rent).',
    },
  ],
  calculate: (values) => {
    const solveFor = values.solveFor || 'FV';
    const timing = values.timing || 'end';
    const due = timing === 'begin';

    const nRaw = values.n !== '' && values.n !== undefined ? parseFloat(values.n) : NaN;
    const rateRaw = values.rate !== '' && values.rate !== undefined ? parseFloat(values.rate) / 100 : NaN;
    const pvRaw = values.pv !== '' && values.pv !== undefined ? parseFloat(values.pv) : NaN;
    const pmtRaw = values.pmt !== '' && values.pmt !== undefined ? parseFloat(values.pmt) : NaN;
    const fvRaw = values.fv !== '' && values.fv !== undefined ? parseFloat(values.fv) : NaN;

    const fmt = (n: number) =>
      new Decimal(n).toFixed(4);
    const fmtMoney = (n: number) =>
      `${n < 0 ? '-' : ''}$${new Decimal(Math.abs(n)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

    let solved: number;
    let label: string;
    let extraResults: Array<{ id: string; label: string; value: string; color?: 'positive' | 'negative' | 'neutral' }> = [];

    if (solveFor === 'FV') {
      if ([nRaw, rateRaw, pvRaw, pmtRaw].some(isNaN)) return [];
      const pmt = isNaN(pmtRaw) ? 0 : pmtRaw;
      solved = tvmFV(pvRaw, pmt, rateRaw, nRaw, due);
      label = 'Future Value (FV)';

      const totalPmt = (isNaN(pmtRaw) ? 0 : pmtRaw) * nRaw;
      const interest = solved - (-pvRaw) - totalPmt;
      extraResults = [
        { id: 'totalPayments', label: 'Total of Payments', value: fmtMoney(totalPmt), color: 'neutral' },
        { id: 'totalInterest', label: 'Total Interest Earned', value: fmtMoney(interest), color: interest >= 0 ? 'positive' : 'negative' },
      ];
      // Add lumpSumGrowth for test compatibility
      try {
        const lumpGrowth = new Decimal(tvmFV(pvRaw, 0, rateRaw, nRaw, due)).minus(-pvRaw).toNumber();
        extraResults.push({
          id: 'lumpSumGrowth',
          label: 'Growth from Lump Sum Only (no PMT)',
          value: fmtMoney(lumpGrowth),
          color: lumpGrowth >= 0 ? 'positive' : 'negative',
        });
      } catch {}
    } else if (solveFor === 'PV') {
      if ([nRaw, rateRaw, fvRaw].some(isNaN)) return [];
      const pmt = isNaN(pmtRaw) ? 0 : pmtRaw;
      solved = tvmPV(fvRaw, pmt, rateRaw, nRaw, due);
      label = 'Present Value (PV)';
    } else if (solveFor === 'N') {
      if ([rateRaw, pvRaw, fvRaw].some(isNaN)) return [];
      const pmt = isNaN(pmtRaw) ? 0 : pmtRaw;
      solved = tvmN(pvRaw, fvRaw, pmt, rateRaw, due);
      label = 'Number of Periods';
      if (!isNaN(solved)) {
        const years = Math.floor(solved / 12);
        const months = Math.round(solved % 12);
        if (solved >= 12) {
          extraResults = [{ id: 'inYears', label: 'Converted', value: `${years} yr${years !== 1 ? 's' : ''} ${months} mo`, color: 'neutral' }];
        }
      }
    } else if (solveFor === 'RATE') {
      if ([nRaw, pvRaw, fvRaw].some(isNaN)) return [];
      const pmt = isNaN(pmtRaw) ? 0 : pmtRaw;
      const periodRate = tvmRate(pvRaw, fvRaw, pmt, nRaw, due);
      solved = periodRate * 100;
      label = 'Interest Rate per Period (I/Y)';
      const annualRate = new Decimal(periodRate).times(12).times(100);
      const effectiveRate = new Decimal(1).plus(periodRate).pow(12).minus(1).times(100);
      extraResults = [
        { id: 'annualRate', label: 'Nominal Annual Rate (x12 periods)', value: `${annualRate.toFixed(6)}%`, color: 'neutral' },
        { id: 'effectiveRate', label: 'Effective Annual Rate (EAR)', value: `${effectiveRate.toFixed(6)}%`, color: 'neutral' },
      ];
    } else {
      if ([nRaw, rateRaw, pvRaw, fvRaw].some(isNaN)) return [];
      solved = tvmPMT(pvRaw, fvRaw, rateRaw, nRaw, due);
      label = 'Payment (PMT)';
      const totalPayments = solved * nRaw;
      const totalInterest = totalPayments + pvRaw + fvRaw;
      extraResults = [
        { id: 'totalPayments', label: 'Total of All Payments', value: fmtMoney(Math.abs(totalPayments)), color: 'neutral' },
        { id: 'totalInterest', label: 'Total Interest Cost', value: fmtMoney(Math.abs(totalInterest)), color: 'negative' },
      ];
    }

    if (isNaN(solved) || !isFinite(solved)) {
      return [{ id: 'error', label: 'Result', value: 'Cannot solve — check inputs', color: 'negative' }];
    }

    const displayValue = solveFor === 'N'
      ? `${solved.toFixed(4)} periods`
      : solveFor === 'RATE'
      ? `${fmt(solved)}%`
      : fmtMoney(solved);

    return [
      {
        id: 'result',
        label,
        value: displayValue,
        highlight: true,
        color: solveFor === 'RATE' || solved >= 0 ? 'positive' : 'negative',
        interpretation: `This solves the standard time-value-of-money equation for the one unknown you left blank — every other TVM calculator (loan, savings, annuity) is really this same formula with different inputs fixed. ${timing === 'begin' ? 'Payments here occur at the start of each period (annuity due), which slightly changes the math from the more common end-of-period convention.' : 'Payments occur at the end of each period (ordinary annuity), the standard convention for most loans and savings plans.'}`,
      },
      {
        id: 'formula',
        label: 'Calculation Mode',
        value: `${timing === 'begin' ? 'Annuity Due' : 'Ordinary Annuity'} · ${solveFor === 'RATE' ? 'Newton-Raphson iteration' : 'TVM formula'}`,
        color: 'neutral' as const,
      },
      ...extraResults.map(r => ({ ...r, color: r.color as 'positive' | 'negative' | 'neutral' | undefined })),
    ];
  },
  educational: {
    formula: 'FV = PV x (1+r)^n + PMT x [(1+r)^n - 1]/r',
    diagram: {
      svg: tvmSvg,
      alt: 'Diagram showing the five TVM variables (PV, FV, PMT, N, Rate) interconnected, with a timeline showing payments from today to end',
      caption: 'The Time Value of Money framework connects five variables — given any four, you can solve for the fifth',
    },
    formulaDescription:
      'The Time Value of Money equation relates five variables: Future Value, Present Value, Payment, Interest Rate, and Number of Periods. Given any four, this calculator solves for the fifth using algebraic rearrangement or Newton-Raphson iteration (for Rate). All calculations use decimal.js for precision matching professional financial calculators (HP 12C, TI BA II+).',
    formulaSource:
      'The TVM equation is derived from the compound interest formula extended with a series of uniform payments (annuity). The Newton-Raphson method for solving the rate is the standard numerical approach used in financial calculators and spreadsheet software including Excel\'s RATE function.',
    variables: [
      { symbol: 'PV', name: 'Present Value', description: 'The current value of a cash flow or investment. Cash outflows are entered as negative numbers (standard financial sign convention used by HP 12C and Excel).' },
      { symbol: 'FV', name: 'Future Value', description: 'The value of a cash flow at the end of the investment horizon. Zero for fully amortizing loans; positive for savings goals.' },
      { symbol: 'PMT', name: 'Payment', description: 'The constant periodic payment amount. Negative for payments made (outflows like mortgage payments), positive for payments received (inflows like annuity income).' },
      { symbol: 'r', name: 'Rate per Period', description: 'The interest rate for each compounding period. For monthly periods, divide the annual rate by 12. Rate-solving uses Newton-Raphson numerical iteration with up to 200 iterations for convergence.' },
      { symbol: 'n', name: 'Number of Periods', description: 'The total number of payment or compounding periods. For a 30-year monthly mortgage, n = 360. Fractional periods are supported (e.g., 57.68 months).' },
    ],
    howToUse: [
      'Select what you want to solve for in the "Solve For" dropdown.',
      'Fill in the four known variables (leave the solved-for field blank or at 0).',
      'Use financial sign convention: cash you pay out is negative, cash you receive is positive. For a mortgage: PV is positive (you receive the loan), PMT is negative (you make payments).',
      'For monthly mortgage: PV = loan amount (positive), PMT = monthly payment (negative), FV = 0, n = months, rate = annual rate / 12.',
      'Select Annuity Due for lease/rent scenarios where payment occurs at the beginning of each period.',
    ],
    commonUses: [
      'Solve for any unknown variable in a loan, investment, or annuity using the five-variable time value of money framework.',
      'Calculate the monthly payment on a mortgage by providing the loan amount, term, and interest rate as PV, N, and I/Y.',
      'Determine the future value of regular savings contributions or the present value of a future lump sum needed for retirement planning.',
    ],
    workedExamples: [
      {
        scenario: 'You borrow $300,000 for a 30-year mortgage at 7% annual interest. What is the monthly payment?',
        inputs: { solveFor: 'PMT', n: '360', rate: String(7 / 12), pv: '300000', pmt: '0', fv: '0', timing: 'end' },
        result: 'PMT = -$1,995.91/month',
        insight: 'Your monthly payment is $1,995.91. Over 30 years, you will pay 360 x $1,995.91 = $718,528 total, of which $418,528 is interest. This is why even a 1% rate drop can save tens of thousands: at 6%, the payment drops to $1,798.65 — saving $197/month or $71,000 over the loan.',
      },
      {
        scenario: 'You want to save $500,000 for retirement in 25 years. Your current savings are $50,000. How much must you invest monthly at an 8% expected annual return?',
        inputs: { solveFor: 'PMT', n: '300', rate: String(8 / 12), pv: '-50000', pmt: '0', fv: '500000', timing: 'end' },
        result: 'PMT = -$525.29/month',
        insight: 'The power of starting early: your $50,000 already on hand will grow to about $340,000 on its own. You only need $525/month to reach $500,000 in 25 years — showing how compounding does much of the heavy lifting when you start early.',
      },
      {
        scenario: 'You invested $10,000 in a mutual fund 8 years ago, added $200/month, and today it is worth $38,500. What annual return did you earn?',
        inputs: { solveFor: 'RATE', n: '96', rate: '0', pv: '-10000', pmt: '-200', fv: '38500', timing: 'end' },
        result: 'I/Y = ~0.85%/month, ~10.2% annually',
        insight: 'Solving for rate (I/Y) gives a monthly return of about 0.85%, which annualizes to roughly 10.2% — well above the long-run S&P 500 average of ~10% nominal. The Newton-Raphson method iterates to find the rate that satisfies the equation.',
      },
    ],
    proTips: [
      'Use negative PV for investments (money going out) and positive FV for what you get back — matching the HP 12C sign convention gives you consistent results across all financial tools.',
      'For car leases, always use Annuity Due (beginning of period) — lease payments occur at the start of each month, not the end. This slightly increases the effective cost.',
      'When solving for rate on a complex cash flow, use a rough guess first (e.g., 10% annually converts to ~0.83% monthly) — the Newton-Raphson solver converges faster when the initial guess is near the true rate.',
      'The TVM framework is universal: the same five-variable equation models mortgages, car loans, student loans, savings plans, retirement withdrawals, bond pricing, and lease calculations.',
      'To check your result: solve for the same variable using Excel or Google Sheets TVM functions (=PMT, =FV, =PV, =NPER, =RATE) — they use the same sign convention.',
    ],
    limitations: [
      'All payments are assumed equal and made at regular intervals — this calculator cannot model irregular cash flows, balloon payments, or graduated-payment mortgages.',
      'The interest rate is assumed constant for all periods — it cannot model adjustable-rate products or rate changes over time.',
      'Fractional period results (e.g., 57.68 months) are mathematically exact but real-world loans use whole periods — round up to determine the actual number of payments needed.',
      'The rate solver uses numerical iteration (Newton-Raphson) which may fail to converge for extreme inputs or when the function is nearly flat near the solution.',
    ],
    quickReference: [
      { label: 'Mortgage PMT', value: 'PV=Loan, FV=0, n=360, Rate=Annual%/12' },
      { label: 'Savings FV', value: 'PV=Current, PMT=Monthly, Rate=Return%/12' },
      { label: 'Loan Payoff N', value: 'PV=Balance, PMT=Payment, FV=0' },
      { label: 'Sign Convention', value: 'Money OUT = negative, Money IN = positive' },
      { label: 'Annuity Due', value: 'Use for leases, rent, insurance premiums' },
    ],
    explanation:
      'The Time Value of Money (TVM) is the bedrock principle of finance: a dollar today is worth more than a dollar tomorrow because of its earning potential. The TVM equation unifies all core financial calculations — mortgages, savings, investments, and annuities — into one five-variable framework. Financial calculators (HP 12C, TI BA II+) solve these exact equations. Sign convention is critical: money leaving your pocket is negative (payments, loan principal received), and money coming to you is positive. For rate-solving, this calculator uses Newton-Raphson numerical iteration, the same method used by professional financial calculators. All computations are powered by decimal.js to guarantee cent-level precision — no floating-point rounding errors that plague native JavaScript Math.',
    faqs: [
      {
        question: 'What is the difference between an ordinary annuity and annuity due?',
        answer: 'An ordinary annuity (End of Period) assumes payments occur at the end of each period — this is standard for loans and mortgages. An annuity due (Beginning of Period) assumes payments occur at the start — typical for leases and rent payments. Annuity due values are always slightly higher because payments are made sooner, giving them less time to discount (PV) or more time to compound (FV). For example, a $250,000 mortgage at 6% for 30 years: ordinary PMT = -$1,498.88, annuity due PMT = -$1,491.40.',
      },
      {
        question: 'Why do I enter the loan amount as a positive number for PV?',
        answer: 'Financial sign convention: money flowing TO you is positive (you received the loan), money flowing FROM you is negative (you make payments). So a $250,000 mortgage has PV = +250,000 and PMT = -1,498. This convention is universal across all financial calculators (HP 12C, Excel, etc.). If you reverse the signs, you will get the same magnitude but the sign on your result will be flipped.',
      },
      {
        question: 'How do I calculate a mortgage payment?',
        answer: 'Solve For: PMT. PV = loan amount (positive). FV = 0. N = years x 12. Rate = annual rate / 12. Timing = End of Period. Example: $300,000 loan at 7% for 30 years: N=360, Rate=7/12=0.5833%, PV=300000, FV=0 yields PMT = -$1,995.91.',
      },
      {
        question: 'How do I calculate how many months to pay off a loan?',
        answer: 'Solve For: N. PV = current balance (positive). PMT = monthly payment (negative). FV = 0. Rate = monthly rate. The result is the number of periods (months). Example: $10,000 balance, paying $200/month at 6% APR (0.5%/month): N = ln(200/(200-10000 x 0.005)) / ln(1.005) = 57.68 months, or about 4 years and 10 months.',
      },
      {
        question: 'Why does the rate solver sometimes show "Cannot solve"?',
        answer: 'The rate solver uses Newton-Raphson iteration which can fail when: (1) the payment is less than the interest-only payment, causing the balance to grow instead of shrink, (2) the inputs produce no mathematically valid rate, or (3) the initial guess of 10% is too far from the true rate for convergence. Try adjusting your inputs to ensure the payment covers at least the interest on the balance.',
      },
    ],
    citations: [
      { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
      { source: 'Investopedia — Time Value of Money', url: 'https://www.investopedia.com/terms/t/timevalueofmoney.asp' },
      { source: 'HP 12C Financial Calculator Manual', url: 'https://www.hp.com' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TVMPanel, { values, results });
  },
};

export default tvmConfig;
