import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult, ExplainStep } from '../../../types/calculator';
import BettingOddsPanel from './BettingOddsPanel';
import { decimalToAmerican, decimalToFraction, oddsInfo } from './oddsMath';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';

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
      helpText: 'Enter +100 or higher (underdog) or -100 or lower (favorite). American odds between -100 and +100 do not exist.',
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
      id: 'otherOdds',
      label: 'Opposite Outcome Odds (optional)',
      type: 'text',
      placeholder: '-110',
      helpText: 'Odds of the other side of a two-way market, in the same format as above. Enter it to see the bookmaker overround and the margin-free probability.',
    },
    {
      id: 'stake',
      label: 'Stake ($)',
      type: 'number',
      placeholder: '100',
      min: 0,
      max: 10000000,
      helpText: 'Amount you plan to wager',
    },
  ],
  calculate: (values) => {
    const o = oddsInfo(values);
    if (!o) return [];
    const americanOddsStr = decimalToAmerican(o.decimal);
    const fmtD = (n: number) => n.toFixed(2);
    const pct = (p: number) => `${(p * 100).toFixed(2)}%`;

    const results: CalculatorResult[] = [
      {
        id: 'americanOddsOut',
        label: 'American Odds',
        value: americanOddsStr,
        highlight: true,
        color: americanOddsStr === '—' ? 'neutral' : parseFloat(americanOddsStr) >= 0 ? 'positive' : 'negative',
      },
      { id: 'decimalOddsOut', label: 'Decimal Odds', value: o.decimal.toFixed(3), highlight: true, color: 'neutral' },
      { id: 'fractionalOddsOut', label: 'Fractional Odds', value: decimalToFraction(o.decimal - 1), highlight: true, color: 'neutral' },
      {
        id: 'impliedProbability',
        label: 'Implied Probability',
        value: pct(o.implied),
        color: 'neutral',
        interpretation: 'Includes the bookmaker margin: 1 ÷ decimal odds. Add the opposite outcome below to see the margin.',
      },
      { id: 'payout', label: 'Total Payout', value: `$${fmtD(o.payout)}`, color: 'positive' },
      { id: 'profit', label: 'Profit', value: `$${fmtD(o.profit)}`, color: o.profit >= 0 ? 'positive' : 'negative' },
      { id: 'stakeReturned', label: 'Stake Returned', value: `$${fmtD(o.stake)}`, color: 'neutral' },
    ];
    if (o.overround !== null && o.fairProb !== null && o.otherImplied !== null) {
      results.push(
        {
          id: 'overround',
          label: 'Overround (Bookmaker Margin)',
          value: `${(o.overround * 100).toFixed(2)}%`,
          color: o.overround > 0 ? 'negative' : 'neutral',
          interpretation: `Implied probabilities ${pct(o.implied)} + ${pct(o.otherImplied)} = ${pct(o.implied + o.otherImplied)}; the excess over 100% is the margin.${o.overround < 0 ? ' A total below 100% would be an arbitrage between these two prices.' : ''}`,
        },
        { id: 'fairProbability', label: 'Margin-Free Probability', value: pct(o.fairProb), color: 'neutral', interpretation: 'Implied probability divided by the total, i.e. with the margin removed proportionally (the simplest de-vig method).' },
      );
    }
    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BettingOddsPanel, { values, results });
  },
  explainSteps: (values) => {
    const o = oddsInfo(values);
    if (!o) return [];
    const results = bettingOddsConfig.calculate(values);
    const val = (id: string) => resultValue(results, id) ?? '';
    const pct = (x: number) => `${(x * 100).toFixed(2)}%`;
    const format = values.oddsFormat || 'American';
    const dec = o.decimal.toFixed(3);
    let conversion: string;
    if (format === 'American') {
      const a = Number(values.americanOdds);
      conversion = a > 0 ? `+${a} → ${a} ÷ 100 + 1 = ${dec}` : `${a} → 100 ÷ ${Math.abs(a)} + 1 = ${dec}`;
    } else if (format === 'Fractional') {
      const [num, den] = values.fractionalOdds.split('/').map((s) => Number(s.trim()));
      conversion = `${num}/${den} → ${num} ÷ ${den} + 1 = ${dec}`;
    } else {
      conversion = `${Number(values.decimalOdds)} is already decimal odds (shown as ${dec})`;
    }
    const steps: ExplainStep[] = [
      {
        label: 'Convert the odds to decimal odds',
        expr: conversion,
        note: Math.abs(o.decimal - Number(dec)) > 1e-9 ? 'Decimal odds are shown to 3 places; the calculation keeps full precision.' : undefined,
      },
      { label: 'Implied probability', expr: `1 ÷ ${dec} = ${val('impliedProbability')}`, note: 'Includes the bookmaker margin.' },
      {
        label: 'Payout and profit on your stake',
        expr: `${val('stakeReturned')} × ${dec} = ${val('payout')}; profit = ${val('payout')} − ${val('stakeReturned')} = ${val('profit')}`,
      },
    ];
    if (o.otherImplied !== null && o.fairProb !== null) {
      const total = o.implied + o.otherImplied;
      steps.push(
        {
          label: 'Add the implied probability of the opposite outcome',
          expr: `${pct(o.implied)} + ${pct(o.otherImplied)} = ${pct(total)}, so the overround is ${val('overround')}`,
          note: 'The excess over 100% is the bookmaker margin.',
        },
        { label: 'Remove the margin proportionally', expr: `${pct(o.implied)} ÷ ${pct(total)} = ${val('fairProbability')}` },
      );
    }
    return finiteSteps(steps);
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
      'Optionally enter the opposite outcome\'s odds (same format) to get the bookmaker overround and the margin-free probability of your outcome.',
      'Compare odds across different bookmakers by converting them to a common format.',
    ],
    explanation:
      'Odds conversion is an essential skill for any sports bettor. Understanding how odds translate between formats allows you to shop for the best lines across different sportsbooks, regardless of the format each book uses. American odds (also called Moneyline odds) are the standard in the United States and show either how much you need to bet to win $100 (negative odds for favorites) or how much you win on a $100 bet (positive odds for underdogs). Decimal odds are the most intuitive format — simply multiply your stake by the decimal to get your total return. They are widely used in Europe, Australia, and Canada. Fractional odds are traditional in the UK and Ireland, showing the ratio of profit to stake. The implied probability is perhaps the most important derived metric: it tells you what percentage chance the odds represent. If you believe an outcome is more likely than the implied probability suggests, you have found a value bet. Professional bettors regularly convert odds to implied probabilities to identify mispriced lines. The overround (also called vig or juice) is the bookmaker\'s commission built into the odds. In a fair market with two equally likely outcomes, both would have implied probabilities of 50% each, summing to 100%. In reality, sportsbooks build in a margin so the probabilities sum to over 100% (two -110 prices sum to 104.76%). This vig is how sportsbooks make their profit regardless of the outcome. Understanding these concepts is fundamental to making informed betting decisions and managing your bankroll effectively over the long term.',
    faqs: [
      {
        question: 'What is the difference between +200 and -200 American odds?',
        answer: 'Positive American odds (+200) indicate an underdog — a $100 bet wins $200 in profit. Negative American odds (-200) indicate a favorite — you must bet $200 to win $100 in profit. The absolute value tells you about the perceived likelihood: +200 has a ~33% implied probability while -200 has a ~67% implied probability.',
      },
      {
        question: 'Why do implied probabilities from a bookmaker add up to more than 100%?',
        answer: 'That extra percentage is the overround or vig (vigorish), which is the bookmaker\'s built-in profit margin. If a market has two outcomes each priced at -110 (52.38% implied probability each), the total is 104.76%. The extra 4.76% is the overround (the bookmaker\'s margin relative to the total stake, about 4.5% of all money bet if both sides are balanced). Enter the opposite outcome\'s odds above to compute it. This is how sportsbooks make money regardless of which side wins.',
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
