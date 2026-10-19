import { CalculatorConfig, CalculatorResult, ExplainStep } from '../../../types/calculator';
import { createElement } from 'react';
import ROASPanel from './ROASPanel';
import { computeRoas } from './roasMath';

const roasConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'adSpend',
      label: 'Total Ad Spend',
      type: 'number',
      placeholder: '5,000',
      prefix: '$',
      min: 0,
      step: 1,
      required: true,
      inputMode: 'decimal',
      helpText: 'Total amount spent on advertising in the period',
    },
    {
      id: 'revenue',
      label: 'Revenue from Ads',
      type: 'number',
      placeholder: '20,000',
      prefix: '$',
      min: 0,
      step: 1,
      required: true,
      inputMode: 'decimal',
      helpText: 'Total revenue attributed to the advertising campaign',
    },
    {
      id: 'orders',
      label: 'Orders from Ads (optional)',
      type: 'number',
      placeholder: '400',
      min: 0,
      max: 1000000000,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Number of purchases the ads drove — enter it to see cost per acquisition',
    },
    {
      id: 'grossMargin',
      label: 'Gross Margin %',
      type: 'number',
      placeholder: '60',
      unit: '%',
      min: 0,
      max: 100,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Your product gross margin — used to calculate minimum viable ROAS',
    },
  ],
  calculate: (values) => {
    const adSpend = parseFloat(values.adSpend);
    const revenue = parseFloat(values.revenue);
    const grossMarginPct = parseFloat(values.grossMargin);

    if (![adSpend, revenue].every(Number.isFinite) || adSpend <= 0 || revenue < 0) return [];

    const orders = parseFloat(values.orders);
    const f = computeRoas(adSpend, revenue, grossMarginPct, orders);
    const { roas } = f;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // With a margin, colour by break-even ROAS (the only meaningful threshold); without one, stay neutral.
    const roasColor =
      f.status === null ? ('neutral' as const) : f.status === 'above' ? ('positive' as const) : f.status === 'at' ? ('neutral' as const) : ('negative' as const);

    const results: CalculatorResult[] = [
      {
        id: 'roas',
        label: 'Return on Ad Spend (ROAS)',
        value: `${roas.toFixed(2)}x`,
        highlight: true,
        interpretation: `ROAS is revenue, not profit — a 4x ROAS can still lose money if your product margin is thin, since it doesn't subtract cost of goods or overhead. Enter your gross margin to compare against the break-even ROAS (1 ÷ margin); use ROAS to compare campaigns against each other, not as a standalone profit signal.`,
        color: roasColor,
      },
    ];
    if (f.cpa !== null) {
      results.push({ id: 'cpa', label: 'Cost per Acquisition', value: `$${fmt(f.cpa)}`, color: 'neutral' });
    }
    results.push({
      id: 'profitFromAds',
      label: 'Revenue Minus Ad Spend',
      value: `$${fmt(f.revenueMinusSpend)}`,
      color: f.revenueMinusSpend > 0 ? 'positive' : 'negative',
    });

    if (f.breakEvenRoas !== null) {
      const word = f.status === 'above' ? 'Profitable' : f.status === 'at' ? 'Break-even' : 'Unprofitable';
      results.push({
        id: 'minROAS',
        label: `Minimum Break-Even ROAS (${grossMarginPct}% margin)`,
        value: `${f.breakEvenRoas.toFixed(2)}x — ${word}`,
        color: roasColor,
      });
      results.push({
        id: 'profitAfterAds',
        label: 'Gross Profit After Ad Spend',
        value: `$${fmt(f.profitAfterAds!)}`,
        color: f.profitAfterAds! > 0 ? 'positive' : f.profitAfterAds! < 0 ? 'negative' : 'neutral',
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ROASPanel, { values, results });
  },
  explainSteps: (values) => {
    const adSpend = parseFloat(values.adSpend);
    const revenue = parseFloat(values.revenue);
    const grossMarginPct = parseFloat(values.grossMargin);
    if (![adSpend, revenue].every(Number.isFinite) || adSpend <= 0 || revenue < 0) return [];

    const orders = parseFloat(values.orders);
    const f = computeRoas(adSpend, revenue, grossMarginPct, orders);
    if (![f.roas, f.revenueMinusSpend].every(Number.isFinite)) return [];

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const $ = (n: number) => `$${fmt(n)}`;

    const steps: ExplainStep[] = [
      {
        label: 'Divide revenue by ad spend',
        expr: `ROAS = ${$(revenue)} ÷ ${$(adSpend)} = ${f.roas.toFixed(2)}x`,
        note: 'ROAS is revenue, not profit: it does not subtract the cost of the goods you sold.',
      },
      {
        label: 'Read it per dollar',
        expr: `${f.roas.toFixed(2)}x means ${$(f.roas)} of revenue for every $1.00 spent on ads`,
      },
    ];
    if (f.cpa !== null) {
      steps.push({ label: 'Cost per order', expr: `${$(adSpend)} ÷ ${orders.toLocaleString()} orders = ${$(f.cpa)}` });
    }
    steps.push({ label: 'Revenue minus ad spend', expr: `${$(revenue)} − ${$(adSpend)} = ${$(f.revenueMinusSpend)}` });
    if (f.breakEvenRoas !== null && f.profitAfterAds !== null && Number.isFinite(f.profitAfterAds)) {
      const verdict = f.status === 'above' ? 'above break-even, so the ads cover their cost' : f.status === 'at' ? 'at break-even' : 'below break-even, so the ads do not cover their cost';
      steps.push(
        {
          label: 'Find the break-even ROAS for your margin',
          expr: `1 ÷ (${grossMarginPct}% ÷ 100) = ${f.breakEvenRoas.toFixed(2)}x; your ${f.roas.toFixed(2)}x is ${verdict}`,
          note: 'At break-even ROAS the gross profit on the ad revenue exactly repays the ad spend.',
        },
        {
          label: 'Gross profit after ad spend',
          expr: `${$(revenue)} × ${grossMarginPct}% − ${$(adSpend)} = ${$(f.profitAfterAds)}`,
        },
      );
    }
    return steps;
  },
  educational: {
    formula: 'ROAS = Revenue from Ads ÷ Ad Spend | Break-Even ROAS = 1 ÷ Gross Margin %',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="80" y="100" width="100" height="200" fill="var(--svg-ef4444)" rx="4"/><rect x="230" y="40" width="100" height="260" fill="var(--svg-22c55e)" rx="4"/><line x1="80" y1="300" x2="330" y2="300" stroke="var(--svg-666666)" stroke-width="2"/><text x="130" y="320" text-anchor="middle" font-size="14" fill="var(--svg-333333)">Ad Spend</text><text x="280" y="320" text-anchor="middle" font-size="14" fill="var(--svg-333333)">Revenue</text><text x="130" y="90" text-anchor="middle" font-size="12" fill="var(--svg-ef4444)">$5K</text><text x="280" y="30" text-anchor="middle" font-size="12" fill="var(--svg-22c55e)">$20K</text></svg>',
      alt: 'Bar chart comparing ad spend to revenue showing ROAS profit',
      caption: 'Revenue vs Ad Spend — ROAS measures return per dollar spent',
    },
    formulaDescription:
      'ROAS measures how much revenue is generated for every dollar spent on advertising. The break-even ROAS tells you the minimum multiple needed just to cover your product costs.',
    variables: [
      { symbol: 'ROAS', name: 'Return on Ad Spend', description: 'Revenue divided by ad spend. A ROAS of 4x means $4 in revenue for every $1 spent on ads. The ROAS you need depends on your margin and other costs (see break-even ROAS).' },
      { symbol: 'Break-Even ROAS', name: 'Minimum Profitable ROAS', description: '1 divided by gross margin. If margin is 50%, you need at least 2x ROAS to break even on ad spend. If margin is 25%, you need 4x just to cover product costs.' },
      { symbol: 'CPA', name: 'Cost Per Acquisition', description: 'Ad spend divided by number of conversions. A complementary metric to ROAS that helps you understand per-customer acquisition costs.' },
    ],
    howToUse: [
      'Enter your total advertising spend for the period.',
      'Enter the revenue attributed to those ads.',
      'Optionally enter your gross margin to calculate your minimum viable ROAS.',
      'A ROAS above your break-even ROAS means advertising is profitable.',
      'Compare ROAS across your own campaigns and channels; the right target depends on your margin, not on a universal benchmark.',
    ],
    explanation:
      'ROAS is the e-commerce equivalent of ROI for advertising. A 4x ROAS means $4 revenue per $1 spent. But ROAS alone doesn\'t tell you if you\'re profitable — a 4x ROAS with a 20% gross margin is actually losing money (break-even ROAS = 5x). The minimum viable ROAS is always 1 divided by your gross margin percentage. There is no universal "good" ROAS: it depends on your margin and goals, and brand campaigns may accept a lower ROAS for awareness value. A common real-world scenario: a clothing brand spending $5,000 on Facebook Ads generates $20,000 in revenue at a 4x ROAS. With a 50% gross margin, gross profit is $10,000, meaning net ad profit is $5,000. If margins slip to 30%, the same 4x ROAS only yields $1,000 in net profit. Always model ROAS relative to margin, not in isolation.',
    commonUses: [
      'Measuring advertising campaign profitability by comparing revenue generated to ad dollars spent',
      'Determining the minimum ROAS needed to break even given your product gross margin before scaling ad spend',
      'Comparing ROAS across advertising channels (search, shopping, social) to allocate budget to the best-performing platforms',
      'Evaluating whether increased ad spending will generate incremental profit or just higher costs at diminishing returns',
    ],
    faqs: [
      {
        question: 'Is a higher ROAS always better?',
        answer: 'Not necessarily. An extremely high ROAS may indicate you are under-investing in ads and leaving profitable revenue on the table. The goal is to maximize total profit, not ROAS ratio. A 2x ROAS on $100,000 spend generates more profit than a 10x ROAS on $10,000 spend if margins are healthy.',
      },
      {
        question: 'What is the difference between ROAS and ROI?',
        answer: 'ROAS measures revenue relative to ad spend. ROI measures profit relative to total investment. ROAS ignores cost of goods and other expenses. ROI is a more complete profitability measure, calculated as (Revenue − Ad Spend − COGS) / Ad Spend × 100.',
      },
      {
        question: 'What is a realistic ROAS target for a new brand?',
        answer: 'There is no standard number. Early campaigns are usually less efficient while you build audiences and test creatives, and established brands with strong customer lists tend to do better. What matters is whether ROAS is above your break-even (1 ÷ gross margin) once you allow for the learning period; if it stays below break-even for months, reassess pricing, targeting or the funnel conversion rate.',
      },
      {
        question: 'How does attribution modeling affect ROAS?',
        answer: 'Different attribution models can change your reported ROAS a lot. Last-click attribution tends to under-credit upper-funnel channels. Consider data-driven attribution or media mix modeling for a more complete picture, and compare platform-reported ROAS with blended business metrics (total revenue ÷ total ad spend).',
      },
      {
        question: 'What is the difference between ROAS and blended ROAS?',
        answer: 'Blended ROAS includes all advertising channels together, while channel-specific ROAS isolates performance per platform. A blended 4x ROAS can mask one channel at 2x and another at 8x. Always drill into channel-level ROAS to identify which platforms are truly driving profitable returns and which need optimization.',
      },
      {
        question: 'Why does my break-even ROAS go up when I run a discount?',
        answer: 'Discounts reduce your effective gross margin, which directly increases the ROAS needed to break even. Take a $100 product with a $50 cost: at full price the margin is 50% and break-even ROAS is 2.0x. At 20% off ($80 price) the margin is 37.5% ($30 ÷ $80) and break-even ROAS rises to 2.67x, which is 33% more revenue per dollar of ad spend. Before running a sale, recalculate break-even ROAS at the discounted margin.',
      },
      {
        question: 'How does iOS 14+ / ATT impact affect my measured ROAS?',
        answer: 'Apple\'s App Tracking Transparency (ATT) and other privacy changes limit how well ad platforms can track conversions, so platform-reported ROAS can be under-counted. Platforms such as Meta recommend modeled conversions and server-side tracking (e.g. the Conversions API) to fill gaps. As a sanity check, compare platform-reported ROAS with blended business metrics (total revenue ÷ total ad spend).',
      },
      {
        question: 'Should I use ROAS or profit-per-order for bidding decisions?',
        answer: 'Use profit-per-order for bid optimization when you have accurate margin data per product. ROAS can be misleading because a 5x ROAS on a 15% margin product yields less profit than a 3x ROAS on a 60% margin product. For example: $100 ad spend generating $500 at 15% margin = $75 gross profit minus $100 ad = $25 loss. Same $100 ad spend generating $300 at 60% margin = $180 gross profit minus $100 ad = $80 profit. Always optimize for profit, not revenue multiples.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Priya runs a DTC apparel brand spending $5,000/month on Facebook Ads. Her ads generate $20,000 in attributed revenue. Her gross margin is 50%. She wants to know if her ads are profitable and what would happen if she increases spend.',
        inputs: { adSpend: '5000', revenue: '20000', grossMargin: '50' },
        result: 'ROAS = 4.00x, Break-even ROAS = 2.00x — Profitable',
        insight: 'ROAS = $20,000 ÷ $5,000 = 4.0x. Break-even ROAS at 50% margin = 1 ÷ 0.50 = 2.0x. Since 4.0x > 2.0x, ads are profitable. Revenue minus ad spend = $15,000. After COGS ($10,000 at 50% margin), gross profit is $10,000, minus $5,000 ad spend = $5,000 net contribution. If Priya scales to $15,000 spend at a 3.5x ROAS (slightly lower due to audience saturation), revenue = $52,500, gross profit after COGS = $26,250, minus $15,000 ad spend = $11,250 net. More absolute dollars even at lower ROAS.',
      },
      {
        scenario: 'Carlos sells electronics accessories with 20% gross margins. He spends $10,000/month on Google Shopping at a 3.5x ROAS. He thinks 3.5x sounds good but wants to verify profitability.',
        inputs: { adSpend: '10000', revenue: '35000', grossMargin: '20' },
        result: 'ROAS = 3.50x, Break-even ROAS = 5.00x — Unprofitable',
        insight: 'ROAS = 3.5x. Break-even ROAS at 20% margin = 1 ÷ 0.20 = 5.0x. Carlos is actually losing money — his ads generate $35,000 in revenue with $28,000 COGS ($7,000 gross profit), and he spends $10,000 on ads, creating a $3,000 net loss. He needs at least 5.0x ROAS to break even, meaning $50,000 revenue on $10,000 spend. Carlos decides to shift budget to higher-margin accessories (40%+ margin) and reduce low-margin electronics spend.',
      },
      {
        scenario: 'Fatima runs a beauty brand at 65% gross margin. She spends $8,000/month across Google ($3K at 5x ROAS), Facebook ($3K at 3.5x ROAS), and TikTok ($2K at 2.5x ROAS). She wants channel-level analysis.',
        inputs: { adSpend: '3000', revenue: '15000', grossMargin: '65' },
        result: 'ROAS = 5.00x, Break-even ROAS = 1.54x — Profitable (Google channel)',
        insight: 'At 65% margin, break-even ROAS = 1.54x. All three channels are above break-even but with very different efficiency. Google at 5x yields $15,000 revenue, $9,750 gross profit, $6,750 net. Facebook at 3.5x yields $10,500 revenue, $6,825 gross profit, $3,825 net. TikTok at 2.5x yields $5,000 revenue, $3,250 gross profit, $1,250 net. Rather than cutting TikTok, Fatima keeps it as a brand awareness channel and shifts an extra $1,000 from Facebook to Google where marginal ROAS is highest.',
      },
    ],
    proTips: [
      'Always compare your ROAS to break-even ROAS (1 ÷ Gross Margin %). A 3x ROAS that looks great can be unprofitable if your margin is under 33%. This is the single most common mistake in e-commerce advertising — judging ROAS in isolation without margin context.',
      'Track ROAS trends weekly, not daily: day-to-day ROAS is noisy. A sustained drop usually signals ad fatigue, audience saturation or more competition in the auction.',
      'Calculate ROAS separately for new customer acquisition vs. retargeting. Retargeting normally shows a much higher ROAS because those users already know you, and blending the two inflates your overall ROAS and hides whether cold-traffic acquisition is profitable.',
      'Consider incrementality: some of your attributed revenue would have happened without ads. Run holdout tests (geographic or audience-based) to measure true incremental ROAS, which is lower than platform-reported ROAS.',
      'When scaling spend, expect ROAS to decline. Track the relationship between spend and ROAS: once the revenue from each additional $100 of spend falls below your break-even ROAS (e.g. $200 at a 50% margin), the extra spend loses money.',
    ],
    limitations: [
      'ROAS measures revenue relative to ad spend and does not account for product costs, fulfillment, returns, or taxes. Always use break-even ROAS alongside raw ROAS to determine profitability.',
      'Ad platform attribution (especially last-click) may over-report or under-report revenue impact depending on your attribution window and tracking setup. iOS privacy changes, ad blockers, and cross-device shopping behavior further reduce attribution accuracy.',
      'ROAS does not capture the lifetime value of acquired customers — a customer acquired at a 1.5x ROAS may generate 5x lifetime revenue through repeat purchases. Short-term ROAS does not measure brand-building effects or organic halo.',
      'For accurate channel comparison, use a consistent attribution model across platforms and validate against blended financial metrics. This is a planning tool only — do not rely on it for GAAP financial reporting.',
    ],
    quickReference: [
      { label: '70% Margin → BE ROAS', value: '1.43x' },
      { label: '60% Margin → BE ROAS', value: '1.67x' },
      { label: '50% Margin → BE ROAS', value: '2.0x' },
      { label: '40% Margin → BE ROAS', value: '2.5x' },
      { label: '30% Margin → BE ROAS', value: '3.33x' },
      { label: '20% Margin → BE ROAS', value: '5.0x' },
      { label: '10% Margin → BE ROAS', value: '10.0x' },
    ],
    citations: [

      { source: 'Shopify', title: 'What is ROAS?', url: 'https://www.shopify.com/blog/roas' },
    ],
  },
};

export default roasConfig;
