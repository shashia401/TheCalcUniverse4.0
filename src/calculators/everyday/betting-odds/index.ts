import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import BettingOddsPanel from './BettingOddsPanel';

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function decimalToFraction(value: number): string {
  if (value <= 0) return '0/1';
  const tolerance = 1.0e-6;
  let numerator = 1;
  let denominator = 1;
  let bestNum = 1;
  let bestDen = 1;
  let bestErr = Math.abs(value - numerator / denominator);

  for (denominator = 1; denominator <= 1000; denominator++) {
    numerator = Math.round(value * denominator);
    const err = Math.abs(value - numerator / denominator);
    if (err < bestErr) {
      bestErr = err;
      bestNum = numerator;
      bestDen = denominator;
      if (err < tolerance) break;
    }
  }

  const g = gcd(bestNum, bestDen);
  return `${bestNum / g}/${bestDen / g}`;
}

const bettingOddsConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'oddsFormat',
      label: 'Odds Format',
      type: 'select',
      helpText: 'The format of the odds you want to convert',
      options: [
        { label: 'American', value: 'American' },
        { label: 'Decimal', value: 'Decimal' },
        { label: 'Fractional', value: 'Fractional' },
      ],
    },
    {
      id: 'americanOdds',
      label: 'American Odds',
      type: 'number',
      placeholder: '+200',
      helpText: 'Enter positive (underdog) or negative (favorite) odds',
      showWhen: (values) => values.oddsFormat === 'American',
    },
    {
      id: 'decimalOdds',
      label: 'Decimal Odds',
      type: 'number',
      placeholder: '3.00',
      step: 0.01,
      min: 1,
      helpText: 'Total return per unit staked (e.g., 3.00 means 3x your stake)',
      showWhen: (values) => values.oddsFormat === 'Decimal',
    },
    {
      id: 'fractionalOdds',
      label: 'Fractional Odds',
      type: 'text',
      placeholder: '2/1',
      helpText: 'Enter as numerator/denominator (e.g., 2/1 or 7/2)',
      showWhen: (values) => values.oddsFormat === 'Fractional',
    },
    {
      id: 'stake',
      label: 'Stake ($)',
      type: 'number',
      placeholder: '100',
      min: 0,
      helpText: 'Amount you plan to wager',
    },
  ],
  calculate: (values) => {
    const oddsFormat = values.oddsFormat || 'American';
    const stake = values.stake !== undefined && values.stake !== ''
      ? parseFloat(values.stake)
      : 100;

    if (isNaN(stake) || stake <= 0) return [];

    let decimalOdds: number;

    if (oddsFormat === 'American') {
      const american = parseFloat(values.americanOdds);
      if (isNaN(american) || american === 0) return [];
      decimalOdds = american >= 0
        ? american / 100 + 1
        : 100 / Math.abs(american) + 1;
    } else if (oddsFormat === 'Decimal') {
      decimalOdds = parseFloat(values.decimalOdds);
      if (isNaN(decimalOdds) || decimalOdds < 1) return [];
    } else if (oddsFormat === 'Fractional') {
      const frac = values.fractionalOdds || '';
      const parts = frac.split('/').map((s) => s.trim());
      if (parts.length !== 2) return [];
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (isNaN(num) || isNaN(den) || den === 0) return [];
      decimalOdds = num / den + 1;
    } else {
      return [];
    }

    // Convert to American
    let americanOddsStr: string;
    if (decimalOdds === 1) {
      americanOddsStr = '—'; // em dash — no meaningful American odds representation
    } else if (decimalOdds >= 2) {
      americanOddsStr = `+${((decimalOdds - 1) * 100).toFixed(0)}`;
    } else {
      americanOddsStr = `${Math.round(-100 / (decimalOdds - 1))}`;
    }

    // Convert to Fractional
    const fractionalOddsStr = decimalToFraction(decimalOdds - 1);

    const impliedProbability = (1 / decimalOdds) * 100;
    const payout = stake * decimalOdds;
    const profit = payout - stake;

    const fmtD = (n: number) => n.toFixed(2);

    return [
      {
        id: 'americanOddsOut',
        label: 'American Odds',
        value: americanOddsStr,
        highlight: true,
        color: americanOddsStr === '—' ? 'neutral' : parseFloat(americanOddsStr) >= 0 ? 'positive' : 'negative',
      },
      {
        id: 'decimalOddsOut',
        label: 'Decimal Odds',
        value: decimalOdds.toFixed(3),
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'fractionalOddsOut',
        label: 'Fractional Odds',
        value: fractionalOddsStr,
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'impliedProbability',
        label: 'Implied Probability',
        value: `${impliedProbability.toFixed(2)}%`,
        color: 'neutral',
      },
      {
        id: 'payout',
        label: 'Total Payout',
        value: `$${fmtD(payout)}`,
        color: 'positive',
      },
      {
        id: 'profit',
        label: 'Profit',
        value: `$${fmtD(profit)}`,
        color: profit >= 0 ? 'positive' : 'negative',
      },
      {
        id: 'stakeReturned',
        label: 'Stake Returned',
        value: `$${fmtD(stake)}`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BettingOddsPanel, { values, results });
  },
  educational: {
    formula:
      'Decimal = American(positive) ÷ 100 + 1  |  Decimal = 100 ÷ |American(negative)| + 1  |  Implied Probability = 1 ÷ Decimal × 100',
    formulaDescription:
      'Betting odds are converted between American, Decimal, and Fractional formats using straightforward arithmetic. The implied probability represents the bookmaker\'s assessment of the likelihood of an outcome occurring, before accounting for their profit margin (overround).',
    diagram: {
      svg: '<svg viewBox="0 0 460 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Odds Format Conversion</text><!-- American --><rect x="20" y="30" width="120" height="42" rx="6" fill="var(--svg-3b82f6)" opacity="0.12" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="80" y="48" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-3b82f6)" font-weight="700" text-anchor="middle">American</text><text x="80" y="64" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">+200</text><!-- Decimal --><rect x="170" y="30" width="120" height="42" rx="6" fill="var(--svg-22c55e)" opacity="0.12" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="230" y="48" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-22c55e)" font-weight="700" text-anchor="middle">Decimal</text><text x="230" y="64" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">3.00</text><!-- Fractional --><rect x="320" y="30" width="120" height="42" rx="6" fill="var(--svg-f59e0b)" opacity="0.12" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="380" y="48" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-f59e0b)" font-weight="700" text-anchor="middle">Fractional</text><text x="380" y="64" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">2/1</text><!-- Arrows between them --><text x="147" y="52" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-94a3b8)">↔</text><text x="297" y="52" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-94a3b8)">↔</text><!-- Bottom: implied probability --><rect x="90" y="85" width="280" height="30" rx="6" fill="var(--svg-f1f5f9)" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="230" y="100" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">Implied Probability = 1 ÷ Decimal × 100</text><text x="230" y="114" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Decimal 3.00 → 33.3% | American +200 → 33.3% | Fractional 2/1 → 33.3%</text><line x1="230" y1="75" x2="230" y2="83" stroke="var(--svg-94a3b8)" stroke-width="1.5"/></svg>',
      alt: 'Conversion diagram showing bidirectional arrows between American, Decimal, and Fractional odds formats, with implied probability below',
      caption: 'All three formats express the same probability. +200 = 3.00 = 2/1, all imply a 33.3% chance. Higher positive American odds mean lower implied probability.',
    },
    variables: [
      {
        symbol: 'American Odds',
        name: 'American Odds',
        description: 'Also known as Moneyline odds. Positive odds (+200) show profit on a $100 stake. Negative odds (-150) show the stake needed to win $100.',
      },
      {
        symbol: 'Decimal Odds',
        name: 'Decimal Odds',
        description: 'The total return per unit staked, including the original stake. Decimal odds of 3.00 mean a $100 bet returns $300 total ($200 profit + $100 stake).',
      },
      {
        symbol: 'Fractional Odds',
        name: 'Fractional Odds',
        description: 'Traditional UK odds format showing profit relative to stake. Odds of 2/1 mean you win $2 for every $1 staked, plus your stake back.',
      },
      {
        symbol: 'Implied Probability',
        name: 'Implied Probability',
        description: 'The percentage chance implied by the odds. Calculated as 1 ÷ Decimal Odds × 100. Lower odds mean higher implied probability.',
      },
      {
        symbol: 'Overround',
        name: 'Overround (Vig/Juice)',
        description: 'The bookmaker\'s built-in profit margin. The sum of implied probabilities across all outcomes in a market exceeds 100%, and the excess is the overround.',
      },
    ],
    commonUses: [
      'Converting betting odds between American, Decimal, and Fractional formats to compare lines across sportsbooks',
      'Calculating potential payout and profit on a wager based on your chosen stake amount',
      'Determining the implied probability of an outcome to identify value bets or mispriced lines',
      'Understanding the bookmaker\'s overround (vig) across all outcomes in a betting market',
    ],
    howToUse: [
      'Select the odds format you have (American, Decimal, or Fractional).',
      'Enter the odds in your chosen format. The other two formats will be calculated automatically.',
      'Optionally enter a stake amount to see your potential payout and profit.',
      'Review the implied probability to understand the likelihood the odds represent.',
      'Compare odds across different bookmakers by converting them to a common format.',
    ],
    explanation:
      'Odds conversion is an essential skill for any sports bettor. Understanding how odds translate between formats allows you to shop for the best lines across different sportsbooks, regardless of the format each book uses. American odds (also called Moneyline odds) are the standard in the United States and show either how much you need to bet to win $100 (negative odds for favorites) or how much you win on a $100 bet (positive odds for underdogs). Decimal odds are the most intuitive format — simply multiply your stake by the decimal to get your total return. They are widely used in Europe, Australia, and Canada. Fractional odds are traditional in the UK and Ireland, showing the ratio of profit to stake. The implied probability is perhaps the most important derived metric: it tells you what percentage chance the odds represent. If you believe an outcome is more likely than the implied probability suggests, you have found a value bet. Professional bettors regularly convert odds to implied probabilities to identify mispriced lines. The overround (also called vig or juice) is the bookmaker\'s commission built into the odds. In a fair market with two equally likely outcomes, both would have implied probabilities of 50% each, summing to 100%. In reality, sportsbooks build in a margin so the probabilities sum to over 100%, typically 102—108%. This vig is how sportsbooks make their profit regardless of the outcome. Understanding these concepts is fundamental to making informed betting decisions and managing your bankroll effectively over the long term.',
    faqs: [
      {
        question: 'What is the difference between +200 and -200 American odds?',
        answer: 'Positive American odds (+200) indicate an underdog — a $100 bet wins $200 in profit. Negative American odds (-200) indicate a favorite — you must bet $200 to win $100 in profit. The absolute value tells you about the perceived likelihood: +200 has a ~33% implied probability while -200 has a ~67% implied probability.',
      },
      {
        question: 'Why do implied probabilities from a bookmaker add up to more than 100%?',
        answer: 'That extra percentage is the overround or vig (vigorish), which is the bookmaker\'s built-in profit margin. If a market has two outcomes each priced at -110 (52.4% implied probability each), the total is 104.8%. The extra 4.8% is the bookmaker\'s theoretical commission. This is how sportsbooks make money regardless of which side wins.',
      },
      {
        question: 'Can I use this calculator for non-sports betting?',
        answer: 'Yes, odds conversion works for any type of betting — horse racing, political elections, financial markets, entertainment awards, and more. The mathematics of implied probability and payout calculation are universal across all betting markets.',
      },
      {
        question: 'How do I calculate my payout including my original stake?',
        answer: 'For Decimal odds, simply multiply your stake by the decimal odds. For example, $100 at 3.50 returns $350 ($250 profit + $100 stake). For American odds, if the odds are +250, multiply your stake by 2.5 to get profit. If the odds are -200, divide your stake by 2 to get profit. Add your stake back to get the total payout.',
      },
      {
        question: 'What do fractional odds like 7/2 or 10/11 mean?',
        answer: 'Fractional odds show the profit relative to your stake. 7/2 (read "seven to two") means you win $7 for every $2 you bet, plus your stake back. 10/11 ("ten to eleven") means you win $10 for every $11 bet — this is odds-on, meaning the outcome is favored. The first number (numerator) is your profit, the second (denominator) is your stake.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Odds', url: 'https://en.wikipedia.org/wiki/Odds' },
      { source: 'Wolfram MathWorld', title: 'Probability', url: 'https://mathworld.wolfram.com/Probability.html' },
    ],
  },
};

export default bettingOddsConfig;
