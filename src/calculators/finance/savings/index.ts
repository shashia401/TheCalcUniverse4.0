import { createElement } from 'react';
import { CalculatorConfig, ExplainStep } from '../../../types/calculator';
import SavingsPanel from './SavingsPanel';
import { fvAnnuity, fvLumpSum } from '../../../utils/financial';
import { finalBalance as fvBalance, monthlyForGoal, monthlyRateFromApy, wholeMonths } from './savingsMath';

const savingsConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'solveFor',
      label: 'I Want To Know…',
      type: 'select',
      required: true,
      options: [
        { label: 'How much will I have? (Final Balance)', value: 'balance' },
        { label: 'How much do I need to save monthly? (Goal)', value: 'goal' },
      ],
      helpText: 'Choose whether to calculate your future balance or required monthly savings.',
    },
    {
      id: 'initialDeposit',
      slider: { min: 0, max: 100000, step: 1000 },
      label: 'Initial Deposit / Current Savings',
      type: 'number',
      defaultValue: '5000',
      placeholder: '5,000',
      prefix: '$',
      min: 0,
      step: 100,
      helpText: 'Starting balance — can be $0 if starting from scratch',
    },
    {
      id: 'monthlyContribution',
      slider: { min: 0, max: 5000, step: 25 },
      label: 'Monthly Contribution',
      type: 'number',
      defaultValue: '500',
      placeholder: '500',
      prefix: '$',
      min: 0,
      step: 25,
      helpText: 'Required when solving for final balance',
    },
    {
      id: 'savingsGoal',
      label: 'Savings Goal ($)',
      type: 'number',
      placeholder: '25,000',
      prefix: '$',
      min: 0,
      step: 500,
      helpText: 'Required when solving for monthly contribution',
    },
    {
      id: 'timePeriod',
      label: 'Time to Grow',
      type: 'number',
      defaultValue: '5',
      placeholder: '5',
      min: 0,
      max: 1200,
      step: 0.25,
      required: true,
      helpText: 'Length of time your savings will be invested and growing.',
    },
    {
      id: 'timeUnit',
      label: 'Time Unit',
      type: 'select',
      required: true,
      options: [
        { label: 'Years', value: 'years' },
        { label: 'Months', value: 'months' },
      ],
      helpText: 'Unit of time for the growth period — years or months.',
    },
    {
      id: 'apy',
      slider: { min: 0, max: 10, step: 0.05 },
      label: 'Annual Percentage Yield (APY)',
      type: 'number',
      defaultValue: '5',
      placeholder: '5.00',
      unit: '%',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
      helpText: 'Top high-yield savings accounts pay up to about 4.5% APY in late 2026; the FDIC national average savings rate is 0.37%.',
    },
  ],
  explainSteps: (values) => {
    const solveFor = values.solveFor || 'balance';
    const P = parseFloat(values.initialDeposit) || 0;
    const monthlyContrib = parseFloat(values.monthlyContribution) || 0;
    const goal = parseFloat(values.savingsGoal) || 0;
    const timePeriod = parseFloat(values.timePeriod);
    const timeUnit = values.timeUnit || 'years';
    const apy = parseFloat(values.apy) / 100;
    if (isNaN(timePeriod) || isNaN(apy) || timePeriod <= 0) return [];

    const months = wholeMonths(timePeriod, timeUnit);
    const i = monthlyRateFromApy(apy);
    const growth = Math.pow(1 + i, months);
    const fmtD = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtK = (n: number) =>
      n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    const rateStep = {
      label: 'Convert the APY to a monthly rate',
      expr: `i = (1 + ${(apy * 100).toFixed(2)}%)^(1/12) − 1 = ${(i * 100).toFixed(4)}% = ${i.toFixed(6)}`,
      note: 'APY already includes compounding, so we take the 12th root instead of dividing by 12.',
    };
    const monthsStep = {
      label: 'Count the months',
      expr: `n = ${timeUnit === 'years' ? `${timePeriod} years × 12 = ` : ''}${months} months`,
    };

    if (solveFor === 'balance') {
      const finalBalance = fvBalance(P, monthlyContrib, apy, months);
      if (!(finalBalance > 0)) return [];
      const lumpPart = fvLumpSum(P, i, months);
      const steps: ExplainStep[] = [rateStep, monthsStep];
      if (P > 0) {
        steps.push({
          label: 'Grow your starting deposit',
          expr: `$${fmtD(P)} × (1 + ${i.toFixed(6)})^${months} = $${fmtD(lumpPart)}`,
        });
      }
      if (monthlyContrib > 0) {
        steps.push({
          label: 'Grow your monthly deposits',
          expr: i === 0
            ? `$${fmtD(monthlyContrib)} × ${months} = $${fmtD(fvAnnuity(monthlyContrib, i, months))}`
            : `$${fmtD(monthlyContrib)} × [((1 + ${i.toFixed(6)})^${months} − 1) ÷ ${i.toFixed(6)}] = $${fmtD(fvAnnuity(monthlyContrib, i, months))}`,
          note: 'Each deposit lands at the end of its month, so it earns interest only on the months that follow.',
        });
      }
      steps.push({
        label: 'Add the pieces for your final balance',
        expr: `${[P > 0 ? `$${fmtD(lumpPart)}` : '', monthlyContrib > 0 ? `$${fmtD(fvAnnuity(monthlyContrib, i, months))}` : ''].filter(Boolean).join(' + ')} = ${fmtK(finalBalance)}`,
      });
      return steps;
    }

    if (goal <= 0) return [];
    const futureP = P * growth;
    const remaining = goal - futureP;
    if (remaining <= 0) return [];
    const needed = monthlyForGoal(P, goal, apy, months);
    return [
      rateStep,
      monthsStep,
      {
        label: 'Grow what you already have',
        expr: `$${fmtD(P)} × (1 + ${i.toFixed(6)})^${months} = $${fmtD(futureP)}`,
      },
      {
        label: 'Find the gap left to fill',
        expr: `${fmtK(goal)} goal − $${fmtD(futureP)} = $${fmtD(remaining)}`,
      },
      {
        label: 'Work out the monthly deposit that closes the gap',
        expr: i === 0
          ? `$${fmtD(remaining)} ÷ ${months} = $${fmtD(needed)}/mo`
          : `$${fmtD(remaining)} × ${i.toFixed(6)} ÷ ((1 + ${i.toFixed(6)})^${months} − 1) = $${fmtD(needed)}/mo`,
        note: 'The deposits themselves earn interest, so this is less than the gap divided by the months.',
      },
    ];
  },
  calculate: (values) => {
    const solveFor = values.solveFor || 'balance';
    const P = parseFloat(values.initialDeposit) || 0;
    const monthlyContrib = parseFloat(values.monthlyContribution) || 0;
    const goal = parseFloat(values.savingsGoal) || 0;
    const timePeriod = parseFloat(values.timePeriod);
    const timeUnit = values.timeUnit || 'years';
    const apy = parseFloat(values.apy) / 100;

    if (isNaN(timePeriod) || isNaN(apy) || timePeriod <= 0) return [];

    const months = wholeMonths(timePeriod, timeUnit);
    const monthlyRate = monthlyRateFromApy(apy);
    const longWarn = months > 1200 ? 'A horizon longer than 100 years is purely theoretical; shorten it for a realistic plan.' : undefined;

    const fmtD = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtK = (n: number) =>
      n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    if (solveFor === 'balance') {
      const finalBalance = fvBalance(P, monthlyContrib, apy, months);
      if (!(finalBalance > 0)) return [];
      const totalPrincipal = P + monthlyContrib * months;
      const totalInterest = finalBalance - totalPrincipal;
      const timeLabel = timeUnit === 'years'
        ? `${months / 12} year${months !== 12 ? 's' : ''}`
        : `${months} month${months !== 1 ? 's' : ''}`;

      return [
        {
          id: 'finalBalance',
          warning: longWarn,
          label: `Final Balance after ${timeLabel}`,
          value: fmtK(finalBalance),
          highlight: true,
          color: 'positive' as const,
          interpretation: totalPrincipal > 0
            ? `You deposit $${fmtD(totalPrincipal)} over ${timeLabel}; interest adds another $${fmtD(totalInterest)} — ${((totalInterest / finalBalance) * 100).toFixed(0)}% of the balance. At ${(apy * 100).toFixed(2)}% APY, leaving money in longer compounds faster than topping it up.`
            : undefined,
        },
        {
          id: 'totalPrincipal',
          label: 'Total Principal Deposited',
          value: `$${fmtD(totalPrincipal)}`,
          color: 'neutral' as const,
        },
        {
          id: 'totalInterest',
          label: 'Total Interest Earned',
          value: `$${fmtD(totalInterest)}`,
          color: 'positive' as const,
        },
        {
          id: 'interestPct',
          label: 'Interest as % of Final Balance',
          value: `${((totalInterest / finalBalance) * 100).toFixed(1)}%`,
          color: 'positive' as const,
        },
      ];
    } else {
      if (goal <= 0) return [];

      const futureP = P * Math.pow(1 + monthlyRate, months);
      const remaining = goal - futureP;

      if (remaining <= 0) {
        return [
          {
            id: 'alreadyThere',
            label: 'Great News!',
            value: 'Your initial deposit alone will reach your goal — no additional contributions needed.',
            color: 'positive' as const,
            highlight: true,
          },
          {
            id: 'projected',
            label: 'Projected Balance',
            value: fmtK(futureP),
            color: 'positive' as const,
          },
        ];
      }

      const requiredMonthly = monthlyForGoal(P, goal, apy, months);

      const totalDeposited = P + requiredMonthly * months;
      const totalInterest = goal - totalDeposited;

      return [
        {
          id: 'requiredMonthly',
          warning: longWarn,
          label: 'Required Monthly Contribution',
          value: `$${fmtD(requiredMonthly)}/mo`,
          highlight: true,
          color: 'positive' as const,
          interpretation: totalInterest > 0
            ? `Save that each month and interest covers $${fmtD(totalInterest)} of your ${fmtK(goal)} goal — you only deposit $${fmtD(totalDeposited)} yourself.`
            : `To hit ${fmtK(goal)} in ${months} months you deposit $${fmtD(totalDeposited)}; over this short horizon interest barely moves the needle.`,
        },
        {
          id: 'savingsGoal',
          label: 'Savings Goal',
          value: fmtK(goal),
          color: 'neutral' as const,
        },
        {
          id: 'totalDeposited',
          label: 'Total You Deposit (Principal)',
          value: `$${fmtD(totalDeposited)}`,
          color: 'neutral' as const,
        },
        {
          id: 'totalInterest',
          label: 'Total Interest Working for You',
          value: `$${fmtD(totalInterest)}`,
          color: totalInterest > 0 ? 'positive' as const : 'neutral' as const,
        },
        {
          id: 'weeklyEquiv',
          label: 'Weekly Equivalent',
          value: `$${fmtD(requiredMonthly / 4.333)}/wk`,
          color: 'neutral' as const,
        },
      ];
    }
  },
  extraPanel: (values, results) => {
    const solveFor = values.solveFor || 'balance';
    const P = parseFloat(values.initialDeposit) || 0;
    const monthlyContrib = parseFloat(values.monthlyContribution) || 0;
    const goal = parseFloat(values.savingsGoal) || 0;
    const timePeriod = parseFloat(values.timePeriod);
    const timeUnit = values.timeUnit || 'years';
    const apy = parseFloat(values.apy) / 100;

    if (!results.length || isNaN(timePeriod) || isNaN(apy) || timePeriod <= 0) return null;

    return createElement(SavingsPanel, { solveFor, initialDeposit: P, monthlyContribution: monthlyContrib, goal, timePeriod, timeUnit, apy });
  },
  educational: {
    formula: 'FV = P×(1+r)^n + PMT×[(1+r)^n − 1]/r   ·   PMT = (Goal − P×(1+r)^n) × r / [(1+r)^n − 1]',
    formulaDescription:
      'The first formula calculates the future value of your savings. The second algebraically isolates the required monthly contribution needed to reach a specific goal — the reverse of the first.',
    diagram: {
      svg: '<svg viewBox="0 0 420 230" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<line x1="40" y1="200" x2="400" y2="200" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
        '<text x="400" y="218" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="end">Time (years)</text>' +
        '<line x1="40" y1="200" x2="40" y2="20" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
        '<text x="40" y="16" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Balance</text>' +
        '<!-- 3 growth curves at different rates -->' +
        '<path d="M40,195 Q120,190 200,170 Q280,130 360,70" fill="none" stroke="var(--svg-f59e0b)" stroke-width="2.5" stroke-linecap="round"/>' +
        '<text x="365" y="70" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-f59e0b)">10%</text>' +
        '<path d="M40,195 Q120,192 200,180 Q280,155 360,115" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-linecap="round"/>' +
        '<text x="365" y="115" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-3b82f6)">7%</text>' +
        '<path d="M40,195 Q120,194 200,188 Q280,175 360,155" fill="none" stroke="var(--svg-22c55e)" stroke-width="2.5" stroke-linecap="round"/>' +
        '<text x="365" y="155" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-22c55e)">4%</text>' +
        '<text x="210" y="50" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">Higher returns = faster growth</text>' +
        '</svg>',
      alt: 'Line chart comparing savings growth at 4%, 7%, and 10% annual returns over time',
      caption: 'Small differences in annual return compound into large differences over decades',
    },
    variables: [
      { symbol: 'Contributions', name: 'Your Deposits', description: 'Both your initial deposit (P) and ongoing monthly contributions (PMT) form the total principal you invest. The initial deposit starts the growth, but consistent monthly contributions often matter more over time — a regular savings habit beats a one-time lump sum.' },
      { symbol: 'r', name: 'Monthly Rate', description: '(1 + APY)^(1/12) − 1. The APY (Annual Percentage Yield) is the effective annual return after compounding, so the monthly rate is its twelfth root, not APY ÷ 12. For example, 5% APY is 0.4074% per month, and $5,000 grows to exactly $5,250 in a year.' },
      { symbol: 'n', name: 'Number of Months', description: 'The total duration in months.' },
    ],
    howToUse: [
      'Select "How much will I have?" to project a future balance, or "How much do I need to save?" to solve for the monthly contribution required to reach a specific goal.',
      'Enter your starting balance, time horizon, and current APY (check HYSA rates — they fluctuate).',
      'The bar chart below shows how your balance grows month by month.',
    ],
    commonUses: [
      'Project how much your savings will grow over time with regular deposits and compound interest from a high-yield savings account.',
      'Determine how much you need to save each month to reach a specific financial goal within your target timeframe.',
      'Compare the growth difference between a traditional savings account and a high-yield savings account with current market APY rates.',
    ],
    explanation:
      'A savings calculator is the foundation of any financial goal. Whether saving for an emergency fund (3–6 months of expenses), a down payment, a vacation, or a car, the math is the same: initial deposit + regular contributions + interest = goal. The power of high-yield savings accounts (up to about 4.5% APY in late 2026) vs. the FDIC national average savings rate (0.37%) is large even over a 2–3 year horizon. Putting $500/month into a 0.01% account vs. a 4.5% HYSA for 5 years is a difference of roughly $3,500 in interest.',
    faqs: [
      {
        question: 'What is APY vs. interest rate?',
        answer: 'APY (Annual Percentage Yield) already accounts for compounding — it is the actual annual return you earn, including the effect of how often interest is credited. An interest rate of 4.89% compounded monthly has an APY of approximately 5.00%. For savings accounts, always compare APY, not the nominal rate.',
      },
      {
        question: 'What are current high-yield savings account rates?',
        answer: 'In late 2026 the best online high-yield savings accounts (HYSA) pay up to about 4.5% APY, while the FDIC national average savings rate is only 0.37% and many traditional bank accounts pay as little as 0.01%. Rates move with the Federal Reserve, so check a current rate tracker. The difference is large: $10,000 at 5% APY for 5 years earns $2,763 in interest ($10,000 × (1.05^5 − 1)); at 0.01% it earns only about $5.',
      },
      {
        question: 'How much should I have in an emergency fund?',
        answer: 'Most financial planners recommend 3–6 months of essential living expenses. If your monthly expenses are $4,000, target $12,000–$24,000 in an easily accessible high-yield savings account. Use this calculator: set the goal to your target emergency fund, the time to how quickly you want to reach it, and it tells you the monthly contribution required.',
      },
    ],
  citations: [
    { source: 'FDIC', url: 'https://www.fdic.gov' },
    { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
  ],
  },
};

export default savingsConfig;
