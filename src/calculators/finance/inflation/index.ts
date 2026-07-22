import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import InflationPanel from './InflationPanel';
import { CPI_DATA, MIN_YEAR, MAX_YEAR } from './cpiData';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => {
  const y = MIN_YEAR + i;
  return { label: String(y), value: String(y) };
});

const inflationSvg = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="4"/><text x="160" y="14" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Inflation: The Silent Thief</text><text x="160" y="28" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">At 3% inflation, $100 loses purchasing power over time</text><g transform="translate(15,35)"><line x1="30" y1="5" x2="30" y2="115" stroke="var(--svg-cbd5e1)" stroke-width="1"/><line x1="30" y1="115" x2="290" y2="115" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="25" y="9" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$100</text><text x="25" y="34" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$75</text><text x="25" y="59" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$50</text><text x="25" y="84" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$25</text><text x="25" y="119" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$0</text><line x1="30" y1="5" x2="290" y2="5" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="30" x2="290" y2="30" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="55" x2="290" y2="55" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="80" x2="290" y2="80" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><path d="M 40,7 Q 90,10 140,25 Q 175,40 210,60 Q 235,78 260,100 Q 275,110 290,115" fill="none" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-linecap="round"/><path d="M 40,7 Q 90,10 140,25 Q 175,40 210,60 Q 235,78 260,100 Q 275,110 290,115 L 290,115 L 40,115 Z" fill="var(--svg-ef4444)" opacity="0.08"/><circle cx="40" cy="7" r="3" fill="var(--svg-ef4444)"/><text x="40" y="1" text-anchor="middle" font-size="7" fill="var(--svg-ef4444)" font-weight="bold">$100</text><circle cx="140" cy="25" r="3" fill="var(--svg-ef4444)"/><text x="140" y="19" text-anchor="middle" font-size="7" fill="var(--svg-ef4444)" font-weight="bold">$74</text><circle cx="210" cy="60" r="3" fill="var(--svg-ef4444)"/><text x="210" y="54" text-anchor="middle" font-size="7" fill="var(--svg-ef4444)" font-weight="bold">$55</text><circle cx="260" cy="100" r="3" fill="var(--svg-ef4444)"/><text x="260" y="94" text-anchor="middle" font-size="7" fill="var(--svg-ef4444)" font-weight="bold">$41</text></g><rect x="15" y="160" width="290" height="20" rx="6" fill="var(--svg-f1f5f9)"/><text x="160" y="174" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ef4444)">Adjusted Value = Original x CPI2 / CPI1</text><text x="160" y="194" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">$100 loses half its purchasing power every ~24 years at 3%</text></svg>';

const inflationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'amount',
      label: 'Starting Amount',
      type: 'number',
      placeholder: '100',
      prefix: '$',
      min: 0,
      step: 1,
      inputMode: 'decimal',
      required: true,
      helpText: 'The dollar amount you want to adjust for inflation.',
    },
    {
      id: 'startYear',
      label: 'Starting Year',
      type: 'select',
      required: true,
      options: years,
      helpText: `CPI data from ${MIN_YEAR} to ${MAX_YEAR} (Bureau of Labor Statistics)`,
    },
    {
      id: 'endYear',
      label: 'Target Year',
      type: 'select',
      required: true,
      options: years.slice().reverse(),
      helpText: 'The year to adjust the amount to, showing inflation impact over time.',
    },
  ],
  calculate: (values) => {
    const amount = parseFloat(values.amount);
    const startYear = parseInt(values.startYear || String(1980));
    const endYear = parseInt(values.endYear || String(currentYear));

    if (isNaN(amount) || amount <= 0) return [];
    if (!CPI_DATA[startYear] || !CPI_DATA[endYear]) return [];

    const cpiStart = CPI_DATA[startYear];
    const cpiEnd = CPI_DATA[endYear];
    const adjustedAmount = (amount / cpiStart) * cpiEnd;
    const cumulativeRate = ((cpiEnd - cpiStart) / cpiStart) * 100;
    const years = Math.abs(endYear - startYear);
    const avgAnnualRate = years > 0
      ? (Math.pow(cpiEnd / cpiStart, 1 / years) - 1) * 100
      : 0;
    const direction = endYear > startYear ? 'future' : 'past';

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const results = [
      {
        id: 'adjustedAmount',
        label: endYear > startYear
          ? `$${amount.toLocaleString()} in ${startYear} equals in ${endYear}`
          : `$${amount.toLocaleString()} in ${startYear} was worth in ${endYear}`,
        value: fmt(adjustedAmount),
        highlight: true,
        color: endYear > startYear ? ('neutral' as const) : ('positive' as const),
        interpretation: years > 0
          ? `Prices ${cumulativeRate >= 0 ? 'rose' : 'fell'} ${Math.abs(cumulativeRate).toFixed(0)}% over these ${years} years (${avgAnnualRate.toFixed(1)}%/yr average, per official CPI data). ${avgAnnualRate > 3.5 ? 'That is above the Fed\'s 2% target — cash sitting idle lost real value quickly in this period.' : avgAnnualRate >= 0 ? `At this pace, money loses roughly half its purchasing power every ${Math.max(1, Math.round(72 / Math.max(avgAnnualRate, 0.1)))} years — which is why long-term savings need to earn more than ${avgAnnualRate.toFixed(1)}% just to break even.` : 'This was a rare deflationary period — cash actually gained purchasing power.'}`
          : undefined,
      },
      {
        id: 'cumulativeRate',
        label: `Cumulative Inflation ${startYear}–${endYear}`,
        value: `${cumulativeRate >= 0 ? '+' : ''}${cumulativeRate.toFixed(2)}%`,
        color: cumulativeRate >= 0 && endYear > startYear ? ('negative' as const) : ('positive' as const),
      },
      {
        id: 'avgAnnualRate',
        label: 'Average Annual Inflation Rate',
        value: `${avgAnnualRate.toFixed(3)}% per year`,
        color: 'neutral' as const,
      },
      {
        id: 'purchasingPower',
        label: direction === 'future'
          ? `Purchasing Power Loss — $${amount.toFixed(0)} buys less in ${endYear}`
          : `Purchasing Power — $${amount.toFixed(0)} in ${startYear} had more buying power`,
        value: direction === 'future'
          ? `${(((amount - adjustedAmount) / adjustedAmount) * 100).toFixed(1)}% less today`
          : `${(((adjustedAmount - amount) / amount) * 100).toFixed(1)}% more then`,
        color: direction === 'future' ? ('negative' as const) : ('positive' as const),
      },
      {
        id: 'cpiStart',
        label: `CPI in ${startYear} (Bureau of Labor Statistics)`,
        value: cpiStart.toFixed(1),
        color: 'neutral' as const,
      },
      {
        id: 'cpiEnd',
        label: `CPI in ${endYear} (Bureau of Labor Statistics)`,
        value: cpiEnd.toFixed(1),
        color: 'neutral' as const,
      },
    ];

    return results;
  },
  extraPanel: (values, results) => {
    const amount = parseFloat(values.amount);
    const startYear = parseInt(values.startYear || String(1980));
    const endYear = parseInt(values.endYear || String(currentYear));

    if (!results.length || isNaN(amount) || amount <= 0) return null;
    if (!CPI_DATA[startYear] || !CPI_DATA[endYear]) return null;

    return createElement(InflationPanel, { amount, startYear, endYear });
  },
  educational: {
    formula: 'Adjusted Value = (Original Amount / CPI₁) × CPI₂',
    formulaSource: 'US Bureau of Labor Statistics (BLS) — Consumer Price Index (CPI) methodology. The BLS calculates the CPI by measuring the average change in prices paid by urban consumers for a fixed market basket of goods and services, weighted by typical consumer spending patterns derived from the Consumer Expenditure Survey.',
    diagram: {
      svg: inflationSvg,
      alt: 'Line chart showing the exponential decline of alt: 00 purchasing power over decades at 3% annual inflation with data milestones at alt: 00, $74, $55, and $41',
      caption: 'Inflation erodes purchasing power exponentially over time - at 3% annual inflation, the value of money halves approximately every 24 years',
    },
    formulaDescription:
      'The adjusted value is calculated by dividing the original amount by the starting CPI, then multiplying by the ending CPI. This converts the dollar value based on actual Bureau of Labor Statistics data. The result tells you how much money you would need in the target year to have the same purchasing power as the original amount had in the starting year.',
    variables: [
      { symbol: 'CPI₁', name: 'Starting CPI', description: 'Consumer Price Index in the starting year, sourced from official Bureau of Labor Statistics annual average data. This reflects the general price level in the economy at the time the original amount was valued.' },
      { symbol: 'CPI₂', name: 'Ending CPI', description: 'Consumer Price Index in the target year, also from BLS data. The ratio CPI₂/CPI₁ directly measures the cumulative inflation that occurred between the two years.' },
      { symbol: 'CPI', name: 'Consumer Price Index', description: 'A measure of the average change in prices paid by urban consumers for a market basket of goods and services. The CPI basket includes food, housing, energy, transportation, medical care, education, and recreation weighted by typical consumer spending patterns.' },
      { symbol: 'Cumulative Inflation', name: 'Total Price Change', description: 'The percentage change in CPI from the starting year to the target year. If cumulative inflation is 50%, it means prices overall have increased by 50% — so $100 buys what $66.67 bought before.' },
      { symbol: 'Purchasing Power', name: 'Real Buying Power', description: 'The real value of money after adjusting for inflation. At 3% annual inflation, $100 loses half its purchasing power in roughly 24 years. This erosion is exponential, making early retirement planning critical for maintaining lifestyle.' },
    ],
    howToUse: [
      'Enter a dollar amount and select the starting year when that amount had its original purchasing power.',
      'Select the target year to see the inflation-adjusted equivalent based on official BLS CPI data.',
      'Review the cumulative and average annual inflation rates to understand how price levels changed over the selected period.',
    ],
    commonUses: [
      'Calculate how much a dollar amount from a past year is worth today after accounting for cumulative inflation using official CPI data.',
      'Project the future purchasing power of your savings to understand how inflation erodes your retirement nest egg over time.',
      'Compare the cumulative and average annual inflation rates between any two years from 1913 to the present.',
    ],
    explanation:
      'The Consumer Price Index (CPI) is published monthly by the US Bureau of Labor Statistics. It tracks the price of a fixed "basket" of goods and services — food, housing, clothing, transportation, medical care, and more. This calculator uses annual average CPI values from 1913 to present. The math is straightforward: if prices in year B are 50% higher than in year A, then $100 in year A has the same purchasing power as $150 in year B. Inflation is often called the "silent thief" because it slowly erodes purchasing power over time without people noticing. At 3% average annual inflation, $100 loses half its purchasing power in about 24 years. This has profound implications for retirement planning: a retiree who needs $40,000/year today will need approximately $80,000/year in 24 years just to maintain the same standard of living.',
    faqs: [
      {
        question: 'What is the Consumer Price Index (CPI)?',
        answer: 'The CPI measures the average price level of a fixed basket of goods and services purchased by urban consumers. It is the most widely used measure of inflation in the United States, published monthly by the Bureau of Labor Statistics. The basket is periodically updated to reflect changing consumption patterns — for example, it now includes streaming services and smartphones that did not exist in earlier iterations.',
      },
      {
        question: 'Is this the official BLS inflation calculator?',
        answer: 'This calculator uses the same official CPI data from the Bureau of Labor Statistics (BLS). The math is identical to the official BLS inflation calculator at bls.gov. Annual average CPI values are used for each year. For precise month-to-month calculations, the BLS provides monthly CPI data that allows you to calculate inflation within a specific year.',
      },
      {
        question: 'What causes inflation?',
        answer: 'Inflation is generally caused by demand-pull (too much money chasing too few goods, often from stimulus or low interest rates), cost-push (rising production costs like wages or energy being passed to consumers), or monetary expansion (central banks increasing money supply faster than economic output). The Federal Reserve targets 2% annual inflation as its mandate — low enough to preserve purchasing power but high enough to avoid deflation, which can be even more economically destructive.',
      },
      {
        question: 'Why does inflation matter for retirement planning?',
        answer: 'Inflation is one of the biggest risks to retirement security because it compounds over decades. At 3% annual inflation, a retirement portfolio loses half its purchasing power every 24 years — meaning someone retiring at 65 and living to 89 could see their income cut in half in real terms. This is why retirement planners recommend investing in assets that historically outpace inflation, like stocks and real estate, rather than holding large amounts of cash or bonds that may not keep up with rising prices over the long run.',
      },
      {
        question: 'How has the US inflation rate changed historically?',
        answer: 'US inflation has varied dramatically over time. The highest peacetime inflation occurred in the late 1970s and early 1980s, with the CPI annual rate peaking at 13.5% in 1980 under Federal Reserve Chair Paul Volcker, who subsequently raised interest rates to nearly 20% to break the cycle. Since the mid-1980s, inflation has generally remained moderate at 2-4%. More recently, inflation spiked to around 8-9% in 2022 due to pandemic-era supply chain disruptions, fiscal stimulus, and energy shocks — the highest sustained rate since the early 1980s. The BLS has tracked the CPI continuously since 1913, providing over a century of data.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Maria inherited $10,000 in 1990 and wants to know how much that is worth in today\'s dollars to fairly compare it to current savings.',
        inputs: { amount: '10000', startYear: '1990', endYear: '2024' },
        result: 'The adjusted value is approximately $24,000 in 2024 dollars.',
        insight: 'A dollar in 1990 had more than double the purchasing power of a dollar today. This demonstrates why salary comparisons across decades can be misleading without adjusting for inflation — a $50,000 salary in 1990 had the same real value as roughly $120,000 today.',
      },
      {
        scenario: 'James is planning for retirement in 20 years and wants to understand how much his $500,000 savings will be eroded by a projected 3% inflation rate.',
        inputs: { amount: '500000', startYear: '2024', endYear: '2044' },
        result: 'The purchasing power drops to roughly $277,000 in today\'s dollars after 20 years at 3% inflation.',
        insight: 'Even at the Fed\'s target 2% inflation rate, a 30-year retirement horizon erodes purchasing power by nearly 45%. This is why retirement portfolios should maintain significant equity exposure even after retirement — fixed-income assets often fail to keep pace with inflation over multi-decade retirement periods.',
      },
    ],
    proTips: [
      'When comparing historical prices to today, always adjust for inflation first. A $3,000 car in 1970 sounds cheap, but that is equivalent to nearly $24,000 today — roughly the price of a modern economy car.',
      'For retirement planning, assume a 3% long-term inflation rate as your baseline, then stress-test at 4% and 5% to see the impact of higher-than-expected inflation on your nest egg.',
      'Use the average annual rate as a "rule of 24" shortcut: at 3% inflation, the purchasing power rule is that money halves roughly every 24 years (72 ÷ inflation rate). This is the inflation version of the "Rule of 72" used for investment doubling.',
      'Social Security benefits receive annual Cost of Living Adjustments (COLAs) based on CPI-W, which helps protect retirees. However, Medicare premiums are deducted from Social Security, and healthcare costs often rise faster than general inflation, partially offsetting the COLA benefit.',
    ],
    limitations: [
      'CPI data reflects national averages and may not perfectly match your personal inflation experience, which depends on your specific spending mix — for example, a renter experiences different inflation than a commuter who drives.',
      'This calculator uses annual average CPI, which smooths out month-to-month price changes. For precise calculations involving specific months, consult the BLS monthly CPI tables.',
      'CPI does not directly account for quality improvements in goods over time. A car built today costs more but includes safety features, fuel efficiency, and technology that a 1990 car did not have — these hedonic adjustments are partially addressed by BLS methodology but remain imperfect.',
      'Future inflation is projected using historical data patterns, but actual future inflation may differ significantly due to monetary policy changes, geopolitical events, or economic shocks that are impossible to predict.',
    ],
  citations: [
    { source: 'US Bureau of Labor Statistics', url: 'https://www.bls.gov/cpi' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/i/inflation.asp' },
  ],
  },
};

export default inflationConfig;
