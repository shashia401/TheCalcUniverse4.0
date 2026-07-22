import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import AnnuityPanel from './AnnuityPanel';

const annuitySvg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto">
  <rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/>
  <text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)" font-family="system-ui,sans-serif">Making Your Money Last</text>
  <line x1="35" y1="165" x2="285" y2="165" stroke="var(--svg-cbd5e1)" stroke-width="1"/>
  <line x1="35" y1="165" x2="35" y2="30" stroke="var(--svg-cbd5e1)" stroke-width="1"/>
  <path d="M 35,30 Q 95,38 170,75 Q 230,115 285,165" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 35,30 Q 95,38 170,75 Q 230,115 285,165 L 285,165 Z" fill="var(--svg-3b82f6)" opacity="0.08"/>
  <line x1="35" y1="30" x2="200" y2="165" stroke="var(--svg-ef4444)" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="195" y="175" text-anchor="start" font-size="8" fill="var(--svg-ef4444)" font-family="system-ui,sans-serif">Without interest</text>
  <text x="195" y="80" font-size="9" fill="var(--svg-3b82f6)" font-weight="bold" font-family="system-ui,sans-serif">With interest</text>
  <line x1="120" y1="95" x2="170" y2="95" stroke="var(--svg-94a3b8)" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="145" y="108" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Interest extends payout</text>
  <text x="160" y="185" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">PMT = P x r / [1 - (1+r)^-n]  or  solve for n</text>
  <text x="160" y="196" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Earning returns while withdrawing stretches your savings</text>
</svg>`;

const annuityPayoutConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'solveFor',
      label: 'I Want To Calculate...',
      type: 'select',
      required: true,
      options: [
        { label: 'Monthly Payout Amount (given a fixed timeframe)', value: 'payout' },
        { label: 'How Long My Money Will Last (given a fixed payout)', value: 'duration' },
      ],
      helpText: 'Choose whether to calculate the payout amount or how long your money will last.',
    },
    {
      id: 'principal',
      label: 'Starting Principal / Lump Sum',
      type: 'number',
      placeholder: '500,000',
      prefix: '$',
      inputMode: 'numeric',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'The total amount you are starting with — inheritance, retirement savings, home sale proceeds, etc.',
    },
    {
      id: 'annualReturn',
      label: 'Expected Annual Rate of Return',
      type: 'number',
      placeholder: '5.00',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 20,
      step: 0.1,
      required: true,
      helpText: 'The return your remaining balance earns while being paid out. Conservative estimate: 4-6%.',
    },
    {
      id: 'payoutFrequency',
      label: 'Payout Frequency',
      type: 'select',
      required: true,
      options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Annually', value: 'annually' },
      ],
      helpText: 'How often you want to receive payouts from your principal.',
    },
    {
      id: 'payoutAmount',
      label: 'Fixed Payout Amount',
      type: 'number',
      placeholder: '2,500',
      prefix: '$',
      inputMode: 'numeric',
      min: 0,
      step: 100,
      helpText: 'Required when solving for "How long will money last"',
      showWhen: (v) => v.solveFor === 'duration',
    },
    {
      id: 'desiredYears',
      label: 'Desired Payout Duration',
      type: 'number',
      placeholder: '20',
      unit: 'years',
      inputMode: 'numeric',
      min: 1,
      max: 50,
      step: 1,
      helpText: 'Required when solving for "Monthly Payout Amount"',
      showWhen: (v) => v.solveFor === 'payout',
    },
    {
      id: 'inflationAdjust',
      label: 'Inflation Adjustment',
      type: 'select',
      required: true,
      options: [
        { label: 'Show nominal values (no adjustment)', value: 'nominal' },
        { label: 'Adjust for 3% annual inflation', value: 'adjusted' },
      ],
      helpText: 'Toggle whether results account for 3% annual inflation erosion.',
    },
  ],

  calculate: (values) => {
    const solveFor = values.solveFor || 'payout';
    const principal = parseFloat(values.principal);
    const annualReturn = parseFloat(values.annualReturn) / 100;
    const frequency = values.payoutFrequency || 'monthly';
    const payoutAmount = parseFloat(values.payoutAmount) || 0;
    const desiredYears = parseFloat(values.desiredYears) || 0;
    const inflationAdjust = values.inflationAdjust || 'nominal';

    if (isNaN(principal) || isNaN(annualReturn) || principal <= 0) return [];

    const periodsPerYear = frequency === 'monthly' ? 12 : 1;
    const rPeriod = annualReturn / periodsPerYear;
    const freqLabel = frequency === 'monthly' ? '/mo' : '/yr';

    const fmtD = (n: number) =>
      new Decimal(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const fmtK = (n: number) =>
      n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${new Decimal(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

    const results: Array<{ id: string; label: string; value: string; highlight?: boolean; color: 'positive' | 'negative' | 'neutral' }> = [];

    if (solveFor === 'payout') {
      if (desiredYears <= 0) return [];
      const n = desiredYears * periodsPerYear;

      let pmt: number;
      if (rPeriod === 0) {
        pmt = principal / n;
      } else {
        const rD = new Decimal(rPeriod);
        const denom = new Decimal(1).minus(new Decimal(1).plus(rD).pow(-n));
        pmt = new Decimal(principal).times(rD).div(denom).toNumber();
      }

      const totalPayout = new Decimal(pmt).times(n).toNumber();
      const totalInterestEarned = new Decimal(totalPayout).minus(principal).toNumber();

      results.push(
        { id: 'pmt', label: `${frequency === 'monthly' ? 'Monthly' : 'Annual'} Payout Amount`, value: `$${fmtD(pmt)}${freqLabel}`, highlight: true, color: 'positive' as const },
        { id: 'duration', label: 'Payout Duration', value: `${desiredYears} years (${n.toFixed(0)} ${frequency === 'monthly' ? 'monthly payments' : 'annual payments'})`, color: 'neutral' as const },
        { id: 'totalPayout', label: 'Total Amount Received', value: fmtK(totalPayout), color: 'positive' as const },
        { id: 'principal', label: 'Your Original Principal', value: fmtK(principal), color: 'neutral' as const },
        { id: 'interest', label: 'Interest Earned During Payout Phase', value: totalInterestEarned > 0 ? fmtK(totalInterestEarned) : '$0', color: totalInterestEarned > 0 ? 'positive' as const : 'neutral' as const },
        { id: 'interestBoost', label: 'Interest as % of Total Received', value: totalPayout > 0 ? `${new Decimal(totalInterestEarned).div(totalPayout).times(100).toFixed(1)}%` : '0%', color: 'positive' as const },
      );
    } else {
      if (payoutAmount <= 0) return [];

      let months: number;
      let totalPaid: number;
      let totalInterest: number;

      if (rPeriod === 0) {
        months = principal / payoutAmount;
        totalPaid = new Decimal(payoutAmount).times(months).toNumber();
        totalInterest = 0;
      } else {
        if (payoutAmount <= principal * rPeriod) {
          return [
            {
              id: 'infinite',
              label: 'Great News!',
              value: `Your money will last indefinitely — interest earnings ($${fmtD(principal * rPeriod)}${freqLabel}) exceed your withdrawal rate.`,
              highlight: true,
              color: 'positive' as const,
            },
          ];
        }
        const rD = new Decimal(rPeriod);
        const pD = new Decimal(payoutAmount);
        const num = pD;
        const den = pD.minus(new Decimal(principal).times(rPeriod));
        months = Decimal.ln(num.div(den)).div(Decimal.ln(new Decimal(1).plus(rPeriod))).toNumber();
        totalPaid = new Decimal(payoutAmount).times(months).toNumber();
        totalInterest = new Decimal(totalPaid).minus(principal).toNumber();
      }

      const years = Math.floor(months / periodsPerYear);
      const remainingPeriods = Math.round(months % periodsPerYear);
      const durationStr = frequency === 'monthly'
        ? `${years} year${years !== 1 ? 's' : ''} and ${remainingPeriods} month${remainingPeriods !== 1 ? 's' : ''}`
        : `${years} year${years !== 1 ? 's' : ''}`;

      results.push(
        { id: 'duration', label: 'Your Money Will Last', value: durationStr, highlight: true, color: 'positive' as const },
        { id: 'pmt', label: `Fixed ${frequency === 'monthly' ? 'Monthly' : 'Annual'} Payout`, value: `$${fmtD(payoutAmount)}${freqLabel}`, color: 'neutral' as const },
        { id: 'totalPayout', label: 'Total Amount You Will Receive', value: fmtK(totalPaid), color: 'positive' as const },
        { id: 'principal', label: 'Your Original Principal', value: fmtK(principal), color: 'neutral' as const },
        { id: 'interest', label: 'Interest Earned During Payout', value: totalInterest > 0 ? fmtK(totalInterest) : '$0', color: totalInterest > 0 ? 'positive' as const : 'neutral' as const },
      );
    }

    if (inflationAdjust === 'adjusted') {
      if (solveFor === 'payout') {
        const n = desiredYears * periodsPerYear;
        let pmt: number;
        if (rPeriod === 0) {
          pmt = principal / n;
        } else {
          const rD = new Decimal(rPeriod);
          const denom = new Decimal(1).minus(new Decimal(1).plus(rD).pow(-n));
          pmt = new Decimal(principal).times(rD).div(denom).toNumber();
        }
        const infAdj = new Decimal(pmt).div(
          new Decimal(1).plus(new Decimal(0.03).div(periodsPerYear)).pow(n)
        );
        results.push({ id: 'infAdjPmt', label: 'Inflation-Adjusted Payout (3% annual inflation)', value: `$${fmtD(infAdj.toNumber())}${freqLabel}`, color: 'neutral' as const });
      }
    }

    results.push({ id: 'methodology', label: 'Methodology & Assumptions', value: 'This calculator uses the standard annuity payout formula assuming a fixed annual rate of return. It does not account for sequence-of-returns risk, variable market conditions, taxes, or fees. All figures are nominal unless inflation adjustment is enabled. The inflation adjustment assumes a constant 3% annual inflation rate for illustrative purposes. All computations use decimal.js for precision.', color: 'neutral' as const });
    return results;
  },

  extraPanel: (values, results) => {
    const solveFor = values.solveFor || 'payout';
    const principal = parseFloat(values.principal);
    const annualReturn = parseFloat(values.annualReturn) / 100;
    const frequency = values.payoutFrequency || 'monthly';
    const payoutAmount = parseFloat(values.payoutAmount) || 0;
    const desiredYears = parseFloat(values.desiredYears) || 0;

    if (!results.length || isNaN(principal) || principal <= 0) return null;
    if (results[0].id === 'infinite') return null;

    return createElement(AnnuityPanel, { solveFor, principal, annualReturn, frequency, payoutAmount, desiredYears, results });
  },

  educational: {
    formula: 'PMT = P x r / [1 - (1 + r)^-n]   .   n = ln[PMT / (PMT - P x r)] / ln(1 + r)',
    diagram: {
      svg: annuitySvg,
      alt: 'Declining balance curve showing account depletion over time with interest (curved blue line) vs without interest (straight red dashed line)',
      caption: 'Earning returns on your remaining balance while withdrawing stretches how long your savings last',
    },
    formulaDescription:
      'The first formula calculates the fixed periodic payment that will deplete a starting principal to exactly zero over n periods. The second formula isolates n — solving for how many periods a given fixed payment amount will last before the principal is exhausted. All math uses decimal.js for high precision, critical when computing the log-based duration formula.',
    formulaSource:
      'The annuity payout formula is derived from the present value of an ordinary annuity: PV = PMT x (1 - (1+r)^-n) / r. Solving for PMT gives the payout formula; solving for n uses natural logarithms. This is the same math underlying mortgage amortization, only reversed — instead of paying off a loan, you are depleting an asset.',
    variables: [
      { symbol: 'PMT', name: 'Periodic Payment', description: 'The fixed withdrawal amount each period (monthly or annually). The annuity payout formula is designed so that the balance reaches exactly zero at the end of the specified term, assuming a constant rate of return.' },
      { symbol: 'r', name: 'Period Rate', description: 'The annual rate of return divided by the number of periods per year (divided by 12 for monthly payouts, or 1 for annual payouts).' },
      { symbol: 'P', name: 'Principal', description: 'The starting lump sum. The calculator models how this balance declines over time as you make regular withdrawals while earning returns on the remaining balance.' },
      { symbol: '4% Rule', name: 'Safe Withdrawal Rate Benchmark', description: 'A widely cited guideline from the Trinity Study: withdrawing 4% of your portfolio in year one, then adjusting for inflation, has historically provided a 95%+ success rate over 30-year retirements. On $500,000, that is $20,000/year or approximately $1,667/month.' },
    ],
    howToUse: [
      'Select "Monthly Payout" or "How Long" mode depending on what you want to calculate.',
      'Enter your starting principal, expected annual rate of return, and payout frequency.',
      'Review the depletion chart to compare how long your money lasts with and without investment returns.',
    ],
    commonUses: [
      'Determine how much income you can safely withdraw from a lump-sum retirement account without outliving your savings.',
      'Compare different payout frequencies and investment return assumptions to find the right annuity strategy for your retirement.',
      'Plan the transition from accumulation to decumulation by modeling how long your nest egg will last under various scenarios.',
    ],
    workedExamples: [
      {
        scenario: 'You have $500,000 in retirement savings and want it to last 30 years with a 5% annual return. How much can you withdraw monthly?',
        inputs: { solveFor: 'payout', principal: '500000', annualReturn: '5', payoutFrequency: 'monthly', desiredYears: '30', inflationAdjust: 'adjusted' },
        result: 'Monthly payout: $2,684.11/month. Inflation-adjusted: $1,093.05/month in today\'s dollars.',
        insight: 'The $2,684/month nominal payout sounds comfortable, but after 3% annual inflation over 30 years, it is worth only $1,093/month in today\'s purchasing power. This is the "inflation trap" of fixed annuities — your check stays the same while prices rise. This is exactly why the 4% Rule includes an annual inflation adjustment: start at $1,667/month ($500K x 4% / 12) and increase by inflation each year.',
      },
      {
        scenario: 'You plan to withdraw $3,000/month from a $400,000 portfolio earning 6% annually. How long will your money last?',
        inputs: { solveFor: 'duration', principal: '400000', annualReturn: '6', payoutFrequency: 'monthly', payoutAmount: '3000', inflationAdjust: 'nominal' },
        result: 'Money lasts approximately 15 years and 2 months.',
        insight: 'At $3,000/month, you are withdrawing $36,000/year from $400,000 — a 9% withdrawal rate. Even at a 6% return, that is unsustainable long-term. The 4% rule would suggest $16,000/year or $1,333/month. To make $3,000/month last 30 years at 6%, you would need approximately $546,000 — nearly 37% more saved.',
      },
      {
        scenario: 'You inherit $250,000 at age 55 and want to know: if you earn 4%, what monthly payout would last exactly 20 years?',
        inputs: { solveFor: 'payout', principal: '250000', annualReturn: '4', payoutFrequency: 'monthly', desiredYears: '20', inflationAdjust: 'nominal' },
        result: 'Monthly payout: $1,514.87/month for 20 years.',
        insight: 'Simple division would tell you $250,000 / 240 months = $1,041.67/month. But because the remaining balance earns 4% while being withdrawn, you can actually take $1,515/month — 45% more. The $473/month difference is the "interest boost" that makes annuities and systematic withdrawals more powerful than naive division suggests.',
      },
    ],
    proTips: [
      'Use a conservative return assumption (4-5%) rather than historical averages (7-10%) — the payout phase is far more sensitive to low returns than the accumulation phase due to sequence-of-returns risk.',
      'If the calculator shows your money lasts "indefinitely," you have achieved financial independence — your withdrawals are lower than your annual returns, meaning you will never drain the principal.',
      'Pair this calculator with the 4% Rule: take your total savings, multiply by 0.04, divide by 12 — that is your sustainable monthly withdrawal. Compare that result against this calculator set to a 30-year duration.',
      'For early retirement (before 60), use a lower withdrawal rate (3-3.5%) to account for the longer horizon — the Trinity Study was for 30 years, not 50+ years.',
      'The inflation toggle is critical: a fixed $2,684/month seems fine today, but in 25 years at 3% inflation, it has only 48% of today\'s purchasing power. Always check the inflation-adjusted number.',
    ],
    limitations: [
      'Constant return assumption: real portfolios experience volatility. A market crash in the first 5 years of withdrawals (sequence-of-returns risk) can dramatically shorten the payout period even if the long-term average return is met.',
      'The calculator models a fixed withdrawal amount — it does not support the 4% Rule style of inflation-adjusted increasing withdrawals, which is what most financial planners recommend for retirement.',
      'Taxes and fees are not modeled. Required Minimum Distributions (RMDs) may force larger withdrawals than you planned. Consult the RMD Calculator for age-based mandatory withdrawals.',
      'Life expectancy uncertainty: the calculator shows exactly when money runs out under given assumptions, but in reality both investment returns and your lifespan are unknown variables.',
    ],
    quickReference: [
      { label: '4% Rule on $500K', value: '$1,667/month for 30 years' },
      { label: '4% Rule on $1M', value: '$3,333/month for 30 years' },
      { label: 'Indefinite Threshold', value: 'Withdrawal rate < Annual return %' },
      { label: 'Trinity Study (1998)', value: '4% withdrawal, 95%+ success, 30yr' },
      { label: 'Conservative WR (early retire)', value: '3.0-3.5% for 40-50yr horizons' },
    ],
    explanation:
      'An annuity payout calculator answers one of the most anxiety-inducing questions in retirement planning: "Will I outlive my money?" The key insight is that your remaining balance continues to earn investment returns even as you make regular withdrawals. A $500,000 portfolio earning 5% annually can generate $2,688/month for 25 years before reaching zero — significantly more than the simple division of $500,000 divided by 300 months which only gives $1,667/month with no investment return. The difference between a 0% return and a 5% return on the same starting principal is enormous: it can add 10 or more years of payout duration. This calculator also accounts for the self-sustaining threshold — if your withdrawal rate is low enough that it does not exceed the interest earned, your principal can last indefinitely.',
    faqs: [
      {
        question: 'What is a realistic expected rate of return for a retirement portfolio?',
        answer: 'The expected return depends entirely on your asset allocation. A conservative portfolio (heavy in bonds and cash): 3-4%. A balanced portfolio (60% stocks / 40% bonds): 5-6%. A growth-oriented portfolio (80%+ equities): 6-8%. The return during the payout phase matters even more than the accumulation phase return because of sequence-of-returns risk — a market downturn early in retirement can be devastating if you are simultaneously withdrawing funds. Many financial advisors recommend using a conservative 4-5% expected return for planning purposes.',
      },
      {
        question: 'What is the 4% rule and is it still valid?',
        answer: 'The 4% rule, derived from the Trinity Study, found that withdrawing 4% of a balanced portfolio in year one and adjusting for inflation each subsequent year had a 95%+ historical success rate over 30-year retirements in US market data. Critics note that the current low interest rate environment and historically high market valuations may reduce future expected returns. Many retirement planners now suggest 3.5% to 4% as a more conservative "safe withdrawal rate," especially for those retiring before age 60.',
      },
      {
        question: 'What happens if my withdrawal exceeds my earnings?',
        answer: 'When your periodic withdrawal exceeds the interest earned on the remaining balance, you are drawing down principal. Your balance declines each period until it eventually reaches zero. This calculator precisely models that depletion curve. If your withdrawal is less than or equal to the interest your balance earns, your principal is self-sustaining and will last indefinitely — meaning you are living entirely off the investment returns without ever touching the original principal.',
      },
      {
        question: 'What is sequence-of-returns risk and why does it matter for annuities?',
        answer: 'Sequence-of-returns risk is the danger that poor investment returns occur early in the withdrawal phase, which disproportionately shortens portfolio longevity. Imagine two retirees, both with $500,000 earning a 6% average return over 25 years. Retiree A experiences -15% returns in years 1-2 then strong recovery; Retiree B gets the bad years later. Despite the same average return, Retiree A may run out of money years earlier because withdrawals during downturns lock in losses. This is why conservative return assumptions and flexible spending plans are critical for retirement.',
      },
      {
        question: 'Should I take the lump sum or the annuity payment from my pension?',
        answer: 'This calculator helps answer that by showing you what monthly payout the lump sum can generate. If your employer offers a $500,000 lump sum OR $2,500/month for life: plug in $500,000 as principal, your life expectancy as years, and a conservative return (e.g., 4-5%). If the calculator shows a sustainable payout above $2,500/month, the lump sum may be more flexible and leave money for heirs. If it shows less, the guaranteed pension annuity is the better deal. Also consider: employer pension is guaranteed, while self-managed lump sum carries market risk and requires discipline.',
      },
    ],
    citations: [
      { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
      { source: 'Investopedia — Annuities', url: 'https://www.investopedia.com/terms/a/annuity.asp' },
      { source: 'Trinity Study (Cooley, Hubbard, Walz 1998)', url: 'https://www.aaii.com/journal/article/retirement-savings-choosing-a-withdrawal-rate-that-is-sustainable' },
    ],
  },
};

export default annuityPayoutConfig;
