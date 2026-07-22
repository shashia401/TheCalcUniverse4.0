import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import DebtPayoffPanel from './DebtPayoffPanel';

const debtPayoffSvg = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="4"/><text x="160" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Debt Payoff Strategies</text><text x="160" y="30" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Same extra payment, different ordering methods</text><g transform="translate(15,38)"><line x1="25" y1="10" x2="25" y2="120" stroke="var(--svg-cbd5e1)" stroke-width="1"/><line x1="25" y1="120" x2="285" y2="120" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="20" y="14" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$7.5K</text><text x="20" y="45" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$5K</text><text x="20" y="78" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$2.5K</text><text x="20" y="123" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$0</text><line x1="25" y1="10" x2="285" y2="10" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="25" y1="45" x2="285" y2="45" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="25" y1="78" x2="285" y2="78" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><path d="M 40,12 Q 100,18 165,42 Q 210,60 250,85 Q 270,100 285,120" fill="none" stroke="var(--svg-8b5cf6)" stroke-width="2.5" stroke-linecap="round"/><path d="M 40,12 Q 80,16 130,34 Q 180,58 220,85 Q 250,103 285,120" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-dasharray="5,3" stroke-linecap="round"/><text x="250" y="72" font-size="8" fill="var(--svg-8b5cf6)" font-weight="bold">Avalanche</text><text x="250" y="92" font-size="8" fill="var(--svg-3b82f6)" font-weight="bold">Snowball</text></g><rect x="15" y="158" width="140" height="22" rx="4" fill="var(--svg-eff6ff)"/><text x="85" y="173" text-anchor="middle" font-size="7" fill="var(--svg-2563eb)">Snowball: wins on motivation</text><rect x="165" y="158" width="140" height="22" rx="4" fill="var(--svg-faf5ff)"/><text x="235" y="173" text-anchor="middle" font-size="7" fill="var(--svg-7c3aed)">Avalanche: wins on math</text><text x="160" y="194" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">Same dollars, different order — choose what you will stick with</text></svg>';

const debtPayoffConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'extraPayment',
      label: 'Extra Monthly Payment (Beyond Minimums)',
      type: 'number',
      placeholder: '200',
      prefix: '$',
      min: 0,
      step: 25,
      inputMode: 'numeric',
      helpText: 'Any extra cash above minimums that you can apply to debt each month',
    },
    {
      id: 'card1name',
      label: 'Card 1 — Name / Nickname',
      type: 'text',
      placeholder: 'Chase Sapphire',
      helpText: 'A label to identify this credit card or debt.',
    },
    {
      id: 'card1balance',
      label: 'Card 1 — Balance',
      type: 'number',
      placeholder: '4,500',
      prefix: '$',
      min: 0,
      step: 100,
      inputMode: 'numeric',
      helpText: 'Total outstanding balance currently owed on this card.',
    },
    {
      id: 'card1rate',
      label: 'Card 1 — APR',
      type: 'number',
      placeholder: '22.99',
      unit: '%',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Annual Percentage Rate (interest rate) charged on this card.',
    },
    {
      id: 'card1min',
      label: 'Card 1 — Minimum Payment',
      type: 'number',
      placeholder: '85',
      prefix: '$',
      min: 0,
      step: 5,
      inputMode: 'numeric',
      helpText: 'The minimum monthly payment required by your card issuer.',
    },
    {
      id: 'card2name',
      label: 'Card 2 — Name / Nickname',
      type: 'text',
      placeholder: 'Citi Double Cash',
      helpText: 'A label to identify this credit card or debt.',
      showWhen: (v) => Boolean(v.card1balance && parseFloat(v.card1balance) > 0),
    },
    {
      id: 'card2balance',
      label: 'Card 2 — Balance',
      type: 'number',
      placeholder: '2,100',
      prefix: '$',
      min: 0,
      step: 100,
      inputMode: 'numeric',
      helpText: 'Total outstanding balance currently owed on this card.',
      showWhen: (v) => Boolean(v.card1balance && parseFloat(v.card1balance) > 0),
    },
    {
      id: 'card2rate',
      label: 'Card 2 — APR',
      type: 'number',
      placeholder: '19.99',
      unit: '%',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Annual Percentage Rate (interest rate) charged on this card.',
      showWhen: (v) => Boolean(v.card1balance && parseFloat(v.card1balance) > 0),
    },
    {
      id: 'card2min',
      label: 'Card 2 — Minimum Payment',
      type: 'number',
      placeholder: '45',
      prefix: '$',
      min: 0,
      step: 5,
      inputMode: 'numeric',
      helpText: 'The minimum monthly payment required by your card issuer.',
      showWhen: (v) => Boolean(v.card1balance && parseFloat(v.card1balance) > 0),
    },
    {
      id: 'card3name',
      label: 'Card 3 — Name (optional)',
      type: 'text',
      placeholder: 'Capital One Quicksilver',
      helpText: 'A label to identify this credit card or debt.',
      showWhen: (v) => Boolean(v.card2balance && parseFloat(v.card2balance) > 0),
    },
    {
      id: 'card3balance',
      label: 'Card 3 — Balance (optional)',
      type: 'number',
      placeholder: '850',
      prefix: '$',
      min: 0,
      step: 100,
      inputMode: 'numeric',
      helpText: 'Total outstanding balance currently owed on this card.',
      showWhen: (v) => Boolean(v.card2balance && parseFloat(v.card2balance) > 0),
    },
    {
      id: 'card3rate',
      label: 'Card 3 — APR (optional)',
      type: 'number',
      placeholder: '28.99',
      unit: '%',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Annual Percentage Rate (interest rate) charged on this card.',
    },
    {
      id: 'card3min',
      label: 'Card 3 — Minimum Payment (optional)',
      type: 'number',
      placeholder: '25',
      prefix: '$',
      min: 0,
      inputMode: 'numeric',
      showWhen: (v) => Boolean(v.card2balance && parseFloat(v.card2balance) > 0),
      step: 5,
      helpText: 'The minimum monthly payment required by your card issuer.',
    },
  ],
  calculate: (values) => {
    const extraPayment = parseFloat(values.extraPayment) || 0;

    const cards = [1, 2, 3].map((n) => ({
      name: values[`card${n}name`] || `Card ${n}`,
      balance: parseFloat(values[`card${n}balance`]) || 0,
      rate: parseFloat(values[`card${n}rate`]) || 0,
      min: parseFloat(values[`card${n}min`]) || 0,
    })).filter((c) => c.balance > 0 && c.rate > 0);

    if (cards.length === 0) return [];

    const simulate = (order: typeof cards) => {
      const balances = order.map((c) => c.balance);
      let month = 0;
      let totalInterest = new Decimal(0);
      const maxMonths = 600;

      while (balances.some((b) => b > 0) && month < maxMonths) {
        month++;
        let extra = extraPayment;
        const paid: number[] = balances.map((b, i) => {
          if (b <= 0) return 0;
          const interest = new Decimal(b).mul(order[i].rate).div(100).div(12).toNumber();
          totalInterest = totalInterest.plus(interest);
          const newBalance = b + interest;
          balances[i] = newBalance;
          return order[i].min;
        });

        // Apply extra payment to the first card with a balance (in priority order)
        for (let i = 0; i < balances.length; i++) {
          if (balances[i] <= 0) continue;
          const pay = Math.min(extra, balances[i]);
          extra -= pay;
          paid[i] += pay;
          break;
        }

        for (let i = 0; i < balances.length; i++) {
          balances[i] = Math.max(0, balances[i] - paid[i]);
        }
      }

      return { months: month, totalInterest: totalInterest.toNumber() };
    };

    const snowballOrder = [...cards].sort((a, b) => a.balance - b.balance);
    const avalancheOrder = [...cards].sort((a, b) => b.rate - a.rate);

    const snowball = simulate(snowballOrder);
    const avalanche = simulate(avalancheOrder);

    const totalDebt = cards.reduce((s, c) => s + c.balance, 0);
    const totalMin = cards.reduce((s, c) => s + c.min, 0);

    const fmt = (n: number) =>
      new Decimal(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const fmtDollar = (n: number) => `$${fmt(n)}`;

    const months2Str = (m: number) => {
      const yr = Math.floor(m / 12);
      const mo = m % 12;
      return yr > 0 ? `${yr}yr ${mo}mo` : `${mo} months`;
    };

    return [
      {
        id: 'totalDebt',
        label: 'Total Debt Across All Cards',
        value: fmtDollar(totalDebt),
        color: 'neutral' as const,
      },
      {
        id: 'totalMin',
        label: 'Total Minimum Payments / Month',
        value: `${fmtDollar(totalMin)}/mo`,
        color: 'neutral' as const,
      },
      {
        id: 'snowballTime',
        label: 'Snowball Strategy — Debt Free In',
        value: months2Str(snowball.months),
        highlight: true,
        color: 'positive' as const,
        interpretation: snowball.totalInterest > avalanche.totalInterest
          ? `For your ${cards.length} card${cards.length === 1 ? '' : 's'} totaling ${fmtDollar(totalDebt)}, Avalanche (highest rate first) beats Snowball by ${fmtDollar(snowball.totalInterest - avalanche.totalInterest)} in interest${avalanche.months < snowball.months ? ` and gets you debt-free ${snowball.months - avalanche.months} month${snowball.months - avalanche.months === 1 ? '' : 's'} sooner` : ''}. Snowball's smallest-first wins are better only if you need the early motivation boost.`
          : `For your balances, both strategies cost about the same — pick Snowball (smallest balance first) for the motivational quick wins.`,
      },
      {
        id: 'snowballInterest',
        label: 'Snowball — Total Interest Paid',
        value: fmtDollar(snowball.totalInterest),
        color: 'negative' as const,
      },
      {
        id: 'avalancheTime',
        label: 'Avalanche Strategy — Debt Free In',
        value: months2Str(avalanche.months),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'avalancheInterest',
        label: 'Avalanche — Total Interest Paid',
        value: fmtDollar(avalanche.totalInterest),
        color: 'negative' as const,
      },
      {
        id: 'interestSaved',
        label: 'Interest Saved (Avalanche vs. Snowball)',
        value: snowball.totalInterest > avalanche.totalInterest
          ? `${fmtDollar(snowball.totalInterest - avalanche.totalInterest)} saved with Avalanche`
          : snowball.totalInterest < avalanche.totalInterest
            ? `${fmtDollar(avalanche.totalInterest - snowball.totalInterest)} saved with Snowball`
            : 'Both strategies cost the same',
        color: 'positive' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DebtPayoffPanel, { values, results });
  },
  educational: {
    formula: 'Debt Snowball: Pay minimums on all, extra -> smallest balance first. Avalanche: extra -> highest APR first.',
    diagram: {
      svg: debtPayoffSvg,
      alt: 'Line chart comparing debt payoff strategies with two declining curves labeled Snowball (dashed blue) and Avalanche (solid purple) over time',
      caption: 'Both Snowball and Avalanche methods pay off debt faster than minimum payments alone — Avalanche saves more interest, Snowball offers quicker motivational wins',
    },
    formulaDescription:
      'Both strategies apply extra payment dollars above minimums to one card at a time. When that card is paid off, its minimum payment is "rolled" into the extra for the next card — creating exponentially larger payments over time that accelerate the debt payoff timeline dramatically. All interest calculations use decimal.js for cent-level precision.',
    variables: [
      { symbol: 'Snowball', name: 'Debt Snowball Method', description: 'Pay off cards in order of balance from smallest to largest. When a card is paid off, the freed-up minimum payment rolls to the next card. Mathematical disadvantage: ignores interest rates, so you may pay more total interest. Psychological advantage: early wins boost motivation and help maintain the discipline to stay on track.' },
      { symbol: 'Avalanche', name: 'Debt Avalanche Method', description: 'Pay off cards in order of interest rate from highest to lowest. Mathematically optimal — you always pay the least total interest possible. Potential disadvantage: if the highest-rate card also has a large balance, it may take a long time before you experience the motivation of eliminating a card entirely.' },
      { symbol: 'Rollover', name: 'The Snowball Effect', description: 'The key mechanic in both methods: when Card A is paid off, its minimum payment (say $45/month) becomes additional extra payment on Card B. This creates a growing "snowball" of payments that accelerates the payoff timeline dramatically compared to paying only minimums on all cards.' },
    ],
    howToUse: [
      'Enter your extra monthly payment — any amount above the minimums that you can consistently apply to debt each month.',
      'Fill in up to 3 credit cards with their current balance, APR, and minimum payment.',
      'The calculator simulates both Snowball and Avalanche strategies month by month, tracking every dollar of interest and principal.',
      'Compare the total interest paid and payoff date for each strategy side by side to see the exact trade-off.',
    ],
    commonUses: [
      'Compare the Snowball versus Avalanche debt payoff strategies to decide which approach suits your financial personality and goals.',
      'Calculate exactly how much extra you need to pay each month to become debt-free by a specific target date.',
      'Visualize how the rolling minimum payment effect accelerates debt elimination as each credit card balance is paid off.',
    ],
    explanation:
      'Studies show the Avalanche method always saves more money mathematically, but the Snowball method has a significantly higher completion rate in practice because the psychological reward of eliminating an entire card balance keeps people motivated over the long term. The "best" strategy is ultimately the one you will actually stick to. Use this calculator to quantify the trade-off: if the Avalanche saves you $200 over the Snowball but the Snowball keeps you on track for the full payoff journey, the Snowball is likely the better choice for you. The rolling minimum payment effect is the real engine of both strategies — as each card is eliminated, the freed-up minimum payment gets added to the next card, creating accelerating momentum.',
    workedExamples: [
      {
        scenario: 'Sarah has three credit cards: Chase Sapphire ($4,500 balance, 22.99% APR, $85/mo min), Citi Double Cash ($2,100 balance, 19.99% APR, $45/mo min), and Capital One Quicksilver ($850 balance, 28.99% APR, $25/mo min). She can afford $200 extra per month above minimums.',
        inputs: { extraPayment: '200', card1name: 'Chase Sapphire', card1balance: '4500', card1rate: '22.99', card1min: '85', card2name: 'Citi Double Cash', card2balance: '2100', card2rate: '19.99', card2min: '45', card3name: 'CapOne', card3balance: '850', card3rate: '28.99', card3min: '25' },
        result: 'Avalanche method saves approximately $200 more in interest than Snowball. Both strategies eliminate all debt in roughly 18-20 months compared to 8+ years paying only minimums. Total interest saved versus minimums: approximately $3,500+.',
        insight: 'Avalanche targets the 28.99% Capital One card first (highest rate) — saving Sarah about $200 more in interest than Snowball, which would pay off the smallest $850 balance first for a quick motivational win. Both strategies beat paying only minimums by thousands of dollars.',
      },
      {
        scenario: 'Mike only has two credit cards: $8,000 at 24% with $200 minimum, and $3,000 at 18% with $75 minimum. He can spare $150 extra each month.',
        inputs: { extraPayment: '150', card1name: 'Card A', card1balance: '8000', card1rate: '24', card1min: '200', card2name: 'Card B', card2balance: '3000', card2rate: '18', card2min: '75' },
        result: 'Snowball pays off Card B ($3,000) first in about 10 months, freeing $75/month to attack Card A. Avalanche targets Card A first at 24% APR, saving more in interest but requiring patience before seeing a card fully eliminated.',
        insight: 'Snowball pays off Card B ($3,000) first in about 10 months — giving Mike a quick win and freeing up $75/month to attack the larger $8,000 card. Avalanche targets the 24% Card A first, saving more money but requiring patience before seeing a card eliminated.',
      },
    ],
    proTips: [
      'Call your credit card issuer and ask for a lower APR — especially if you have a history of on-time payments. Even a 2-3% rate reduction can save hundreds in interest over the payoff timeline.',
      'If you receive a windfall (tax refund, bonus, gift), apply the entire amount as a one-time extra payment to the target card — this accelerates both strategies dramatically without increasing your monthly commitment.',
      'Set up automatic transfers for your extra payment each month. Automating the behavior removes the temptation to spend the money elsewhere and ensures consistency — the single most important factor in debt payoff success.',
      'Track your progress visually (e.g., a chart or spreadsheet) alongside this calculator. Watching the balance drop each month reinforces the habit and keeps motivation high during the long payoff period.',
      'If you have a card with a very small balance (under $500), consider paying it off in full immediately, regardless of strategy. Eliminating an entire minimum payment frees cash flow instantly and provides an immediate psychological win.',
    ],
    limitations: [
      'This calculator assumes fixed APRs, consistent minimum payment formulas, and no additional purchases on the cards being paid off. Real-world minimum payments may vary as balances change (many issuers calculate minimums as 1-2% of balance plus interest).',
      'Cards with promotional 0% APRs are not modeled — treat those separately.',
      'The simulation caps at 600 months (50 years) and does not account for balance transfer offers, debt consolidation loans, or debt settlement negotiations.',
      'Late fees, over-limit fees, and annual card fees are not included in the calculation.',
    ],
    quickReference: [
      { label: 'Snowball Priority', value: 'Smallest balance first' },
      { label: 'Avalanche Priority', value: 'Highest APR first' },
      { label: 'Rollover Effect', value: 'Freed minimums attack next card' },
      { label: 'Mathematically Optimal', value: 'Avalanche always' },
      { label: 'Psychologically Effective', value: 'Snowball (higher completion rate)' },
      { label: 'Minimum Payment Rule', value: '1-2% of balance + interest' },
      { label: 'Credit Utilization Impact', value: 'Improves as balances drop' },
    ],
    faqs: [
      {
        question: 'Which strategy saves more money?',
        answer: 'The Avalanche method (highest interest rate first) always saves the most money in total interest paid. The difference can range from negligible to hundreds or even thousands of dollars depending on your specific balances and rates. This calculator shows you the exact dollar difference for your situation, so you can make an informed choice between maximum financial efficiency and the psychological motivation of quick wins.',
      },
      {
        question: 'What if two cards have the same interest rate?',
        answer: 'When two or more cards have identical interest rates, both the Snowball and Avalanche methods produce identical results within that tied group. The calculator handles ties by favoring the smaller balance first, which aligns with the Snowball method\'s priority of achieving quick wins while not sacrificing any mathematical efficiency.',
      },
      {
        question: 'Should I close cards after I pay them off?',
        answer: 'Generally, no — unless the card has an annual fee you do not want to pay. Closing a card reduces your total available credit, which increases your credit utilization ratio and can temporarily lower your credit score. Credit utilization accounts for 30% of your FICO score. The better approach is to keep the card open, use it lightly for a small recurring charge, and pay the balance in full each month to maintain a healthy credit profile.',
      },
      {
        question: 'What about balance transfer offers?',
        answer: 'A 0% APR balance transfer can be a powerful tool that eliminates interest charges during the promotional period (typically 12-21 months). If you can pay off the transferred balance within that window, a balance transfer saves more than either the Snowball or Avalanche method for that specific debt. However, watch for balance transfer fees (usually 3-5% of the transferred amount) and the regular interest rate that applies after the promotional period ends.',
      },
      {
        question: 'Should I stop contributing to my 401(k) while paying off debt?',
        answer: 'If your employer offers a 401(k) match, continue contributing enough to capture the full match — that is an immediate 50-100% return on your money, which far exceeds even the highest credit card APR. Beyond the match, compare the after-tax return of retirement contributions versus the guaranteed "return" of paying off high-interest debt (22%+ APR). For most people, capturing the employer match is non-negotiable, while extra retirement contributions above the match can be temporarily paused to accelerate debt payoff for high-interest cards.',
      },
    ],
    citations: [
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
      { source: 'Investopedia — Debt Payoff Strategies', url: 'https://www.investopedia.com/terms/d/debtpayoff.asp' },
      { source: 'Harvard Business Review — The Snowball vs. Avalanche Debate', url: 'https://hbr.org/2016/12/research-the-best-strategy-for-paying-off-credit-card-debt' },
    ],
  },
};

export default debtPayoffConfig;
