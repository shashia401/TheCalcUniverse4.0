import { CalculatorConfig, CalculatorResult, ExplainStep } from '../../../types/calculator';
import { createElement } from 'react';
import CPMCPCPanel from './CPMCPCPanel';

const cpmCpcConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      required: true,
      options: [
        { label: 'Calculate CPM from spend & impressions', value: 'cpm-from-spend' },
        { label: 'Calculate CPC from spend & clicks', value: 'cpc-from-spend' },
        { label: 'Reverse — find budget from target CPM', value: 'reverse-budget' },
      ],
    },
    {
      id: 'adSpend',
      label: 'Ad Spend',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'Total amount spent on the advertising campaign',
    },
    {
      id: 'impressions',
      label: 'Impressions',
      type: 'number',
      placeholder: '50000',
      min: 0,
      step: 1,
      helpText: 'Required for CPM calculation',
      showWhen: (values) => values.mode !== 'reverse-budget',
    },
    {
      id: 'clicks',
      label: 'Clicks',
      type: 'number',
      placeholder: '1200',
      min: 0,
      step: 1,
      helpText: 'Required for CPC calculation',
      showWhen: (values) => values.mode !== 'reverse-budget',
    },
    {
      id: 'targetCpm',
      label: 'Target CPM ($)',
      type: 'number',
      placeholder: '12',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'Your target cost per 1000 impressions',
      showWhen: (values) => values.mode === 'reverse-budget',
    },
    {
      id: 'desiredImpressions',
      label: 'Desired Impressions',
      type: 'number',
      placeholder: '100000',
      min: 0,
      step: 1,
      required: true,
      helpText: 'How many impressions you want to reach',
      showWhen: (values) => values.mode === 'reverse-budget',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'cpm-from-spend';
    const adSpend = parseFloat(values.adSpend);
    const impressions = parseFloat(values.impressions);
    const clicks = parseFloat(values.clicks);
    const targetCpm = parseFloat(values.targetCpm);
    const desiredImpressions = parseFloat(values.desiredImpressions);

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtInt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    // ── Reverse Budget Mode ──────────────────────────────────────────────
    if (mode === 'reverse-budget') {
      if (!Number.isFinite(targetCpm) || targetCpm < 0 || !Number.isFinite(desiredImpressions) || desiredImpressions <= 0) {
        return [];
      }
      const requiredBudget = (targetCpm * desiredImpressions) / 1000;
      return [
        {
          id: 'requiredBudget',
          label: 'Required Ad Spend',
          value: `$${fmt(requiredBudget)}`,
          highlight: true,
          interpretation: `This assumes you actually achieve your target CPM — real auction prices shift with competition, audience size, and season, so treat this as a planning estimate rather than a guarantee. Budget some cushion above this figure for testing and optimization before results stabilize.`,
          color: 'positive',
        },
        {
          id: 'targetCpmResult',
          label: 'Target CPM',
          value: `$${fmt(targetCpm)}`,
          color: 'neutral',
        },
        {
          id: 'desiredImpressionsResult',
          label: 'Desired Impressions',
          value: fmtInt(desiredImpressions),
          color: 'neutral',
        },
      ];
    }

    // ── Standard Modes ───────────────────────────────────────────────────
    if (!Number.isFinite(adSpend) || adSpend < 0) return [];
    if (mode === 'cpm-from-spend' && (isNaN(impressions) || impressions <= 0)) return [];
    if (mode === 'cpc-from-spend' && (isNaN(clicks) || clicks <= 0)) return [];

    const results: CalculatorResult[] = [];

    if (mode === 'cpm-from-spend' && impressions > 0) {
      const cpm = (adSpend / impressions) * 1000;
      results.push({
        id: 'cpm',
        label: 'CPM (Cost Per Mille)',
        value: `$${fmt(cpm)}`,
        highlight: true,
        color: 'neutral',
      });
    }

    if (mode === 'cpc-from-spend' && clicks > 0) {
      const cpc = adSpend / clicks;
      results.push({
        id: 'cpc',
        label: 'CPC (Cost Per Click)',
        value: `$${fmt(cpc)}`,
        highlight: true,
        color: 'neutral',
      });
    }

    // Compute additional metrics from available data
    if (mode === 'cpm-from-spend' && clicks > 0 && !isNaN(clicks) && clicks >= 0) {
      const cpc = clicks > 0 ? adSpend / clicks : 0;
      results.push({
        id: 'cpc',
        label: 'CPC (Cost Per Click)',
        value: `$${fmt(cpc)}`,
        color: 'neutral',
      });
    }

    if (mode === 'cpc-from-spend' && impressions > 0 && !isNaN(impressions)) {
      const cpm = (adSpend / impressions) * 1000;
      results.push({
        id: 'cpm',
        label: 'CPM (Cost Per Mille)',
        value: `$${fmt(cpm)}`,
        color: 'neutral',
      });
    }

    // CTR — shown whenever both clicks and impressions are available
    const hasClicks = clicks > 0 && !isNaN(clicks);
    const hasImpressions = impressions > 0 && !isNaN(impressions);
    if (hasClicks && hasImpressions) {
      const ctr = (clicks / impressions) * 100;
      results.push({
        id: 'ctr',
        label: 'CTR (Click-Through Rate)',
        value: `${ctr.toFixed(2)}%`,
        color: 'neutral',
      });
    }

    if (results.length === 0) return [];

    // Ad spend summary
    results.push({
      id: 'totalSpend',
      label: 'Total Ad Spend',
      value: `$${fmt(adSpend)}`,
      color: 'neutral',
    });

    // CTR above 100% is impossible (a click needs an impression): flag it on the first row
    if (hasClicks && hasImpressions && clicks > impressions) {
      results[0] = {
        ...results[0],
        warning: 'Clicks exceed impressions, which would mean a click-through rate above 100%. Check that both figures cover the same campaign and period.',
      };
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CPMCPCPanel, { values, results });
  },
  explainSteps: (values) => {
    const mode = values.mode || 'cpm-from-spend';
    const adSpend = parseFloat(values.adSpend);
    const impressions = parseFloat(values.impressions);
    const clicks = parseFloat(values.clicks);
    const targetCpm = parseFloat(values.targetCpm);
    const desiredImpressions = parseFloat(values.desiredImpressions);

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtInt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    // per-impression costs are tiny, so keep up to 6 decimals
    const fmtTiny = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });

    if (mode === 'reverse-budget') {
      if (!Number.isFinite(targetCpm) || targetCpm < 0 || !Number.isFinite(desiredImpressions) || desiredImpressions <= 0) return [];
      const budget = (targetCpm * desiredImpressions) / 1000;
      if (!Number.isFinite(budget)) return [];
      return [
        {
          label: 'Count your impressions in thousands',
          expr: `${fmtInt(desiredImpressions)} ÷ 1,000 = ${fmt(desiredImpressions / 1000)} thousand impressions`,
          note: 'CPM is the price for every 1,000 impressions.',
        },
        {
          label: 'Cost of a single impression at your target CPM',
          expr: `$${fmt(targetCpm)} ÷ 1,000 = $${fmtTiny(targetCpm / 1000)} per impression`,
        },
        {
          label: 'Multiply the thousands by the target CPM',
          expr: `${fmt(desiredImpressions / 1000)} × $${fmt(targetCpm)} = $${fmt(budget)}`,
        },
      ];
    }

    if (!Number.isFinite(adSpend) || adSpend < 0) return [];
    if (mode === 'cpm-from-spend' && (isNaN(impressions) || impressions <= 0)) return [];
    if (mode === 'cpc-from-spend' && (isNaN(clicks) || clicks <= 0)) return [];
    if (mode !== 'cpm-from-spend' && mode !== 'cpc-from-spend') return [];

    const hasClicks = clicks > 0;
    const hasImpressions = impressions > 0;
    const cpm = hasImpressions ? (adSpend / impressions) * 1000 : null;
    const cpc = hasClicks ? adSpend / clicks : null;
    const ctr = hasClicks && hasImpressions ? (clicks / impressions) * 100 : null;
    if (![cpm, cpc, ctr].every((x) => x === null || Number.isFinite(x))) return [];

    const cpmSteps: ExplainStep[] = hasImpressions
      ? [
          { label: 'Cost of a single impression', expr: `$${fmt(adSpend)} ÷ ${fmtInt(impressions)} impressions = $${fmtTiny(adSpend / impressions)}` },
          { label: 'Scale up to 1,000 impressions (CPM)', expr: `$${fmt(adSpend)} ÷ ${fmtInt(impressions)} × 1,000 = $${fmt(cpm!)}` },
        ]
      : [];
    const cpcStep: ExplainStep[] = hasClicks
      ? [{ label: 'Cost per click (CPC)', expr: `$${fmt(adSpend)} ÷ ${fmtInt(clicks)} clicks = $${fmt(cpc!)}` }]
      : [];
    const ctrStep: ExplainStep[] =
      ctr !== null
        ? [{
            label: 'Click-through rate (CTR)',
            expr: `${fmtInt(clicks)} clicks ÷ ${fmtInt(impressions)} impressions × 100 = ${ctr.toFixed(2)}%`,
            note: clicks > impressions ? 'Clicks above impressions would mean a CTR over 100%, so check that both figures cover the same campaign and period.' : undefined,
          }]
        : [];
    const summary: ExplainStep = {
      label: 'Put it together',
      expr: [
        cpm !== null ? `CPM $${fmt(cpm)}` : '',
        cpc !== null ? `CPC $${fmt(cpc)}` : '',
        ctr !== null ? `CTR ${ctr.toFixed(2)}%` : '',
        `total spend $${fmt(adSpend)}`,
      ].filter(Boolean).join(' · '),
    };

    if (mode === 'cpm-from-spend') return [...cpmSteps, ...cpcStep, ...ctrStep, summary];
    // cpc-from-spend: show the CPC first, then check it, then whatever the impressions add
    return [
      ...cpcStep,
      { label: 'Check: clicks × CPC gives back the spend', expr: `${fmtInt(clicks)} clicks × $${fmt(cpc!)} ≈ $${fmt(adSpend)}` },
      ...(hasImpressions ? [...cpmSteps.slice(1), ...ctrStep] : []),
      summary,
    ];
  },
  educational: {
    formula: 'CPM = Ad Spend ÷ Impressions × 1000 | CPC = Ad Spend ÷ Clicks | CTR = Clicks ÷ Impressions × 100 | Budget = Target CPM × Desired Impressions ÷ 1000',
    formulaDescription:
      'CPM (Cost Per Mille) measures the cost of 1,000 ad impressions. CPC (Cost Per Click) measures the cost per individual click. CTR (Click-Through Rate) measures the percentage of viewers who clicked the ad. The reverse budget formula calculates the ad spend needed to reach a target CPM for a desired number of impressions.',
    diagram: {
      svg: '<svg viewBox="0 0 460 120" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Ad Metrics Flow</text><rect x="10" y="30" width="80" height="36" rx="6" fill="var(--svg-3b82f6)" opacity="0.15" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="50" y="46" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">Ad Spend</text><text x="50" y="58" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">$5,000</text><text x="95" y="50" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-94a3b8)">→</text><rect x="115" y="28" width="90" height="28" rx="4" fill="var(--svg-22c55e)" opacity="0.2" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="160" y="46" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">Impressions</text><rect x="115" y="65" width="90" height="24" rx="4" fill="var(--svg-f59e0b)" opacity="0.8"/><text x="160" y="81" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">CPM = $10.00</text><text x="210" y="50" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-94a3b8)">→</text><rect x="230" y="28" width="90" height="28" rx="4" fill="var(--svg-3b82f6)" opacity="0.2" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="275" y="46" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">Clicks</text><rect x="230" y="65" width="90" height="24" rx="4" fill="var(--svg-8b5cf6)" opacity="0.8"/><text x="275" y="81" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">CPC = $2.00</text></svg>',
      alt: 'Flow diagram of ad spend to impressions and clicks, with CPM and CPC results',
      caption: 'CPM is cost per 1,000 impressions; CPC is cost per click. Example: $5,000 spend, CPM $10 (500,000 impressions), CPC $2.',
    },
    variables: [
      { symbol: 'CPM', name: 'Cost Per Mille', description: 'The cost per 1,000 ad impressions. Lower CPM means more impressions per dollar spent. Real CPMs vary widely by platform, audience, placement and season, so benchmark against your own history.' },
      { symbol: 'CPC', name: 'Cost Per Click', description: 'The cost for each individual click on an ad. Lower CPC means more traffic per dollar. CPCs vary enormously by industry, keyword competition and platform.' },
      { symbol: 'CTR', name: 'Click-Through Rate', description: 'The percentage of people who saw the ad and clicked on it. A good CTR depends heavily on platform and placement: search-intent ads typically get far higher CTRs than display or social feed ads.' },
    ],
    howToUse: [
      'Select your calculation mode: CPM from spend & impressions, CPC from spend & clicks, or reverse budget from target CPM.',
      'Enter your ad spend and the available metrics (impressions, clicks, or both).',
      'Review the calculated CPM, CPC, and CTR, and compare them against your own previous campaigns on the same platform.',
    ],
    explanation:
      'CPM (Cost Per Mille) and CPC (Cost Per Click) are the two most important metrics in digital advertising. CPM tells you how efficiently you are reaching an audience — a lower CPM means you are getting more impressions per dollar spent. CPC tells you how efficiently you are driving traffic. The relationship between these metrics is driven by your click-through rate (CTR): CPM = CPC × CTR × 10. If your CPM is $10 and your CTR is 2%, your effective CPC is $0.50. This inverse relationship is crucial: a high-CPM campaign might still be efficient if the CTR is proportionally higher, while a low-CPM campaign with poor CTR may actually drive clicks at a higher cost. Understanding both metrics together helps advertisers optimize campaigns holistically rather than optimizing for a single number. For example, an advertiser paying a $12 CPM with a 2% CTR pays $0.60 per click, while one paying a $3 CPM with a 0.2% CTR pays $1.50 per click: the cheaper CPM is the more expensive click. The right metric to optimize depends on your campaign goal: brand awareness campaigns focus on CPM, while direct response campaigns focus on CPC or CPA (cost per acquisition). Costs also differ by industry: sectors with high customer lifetime value (finance, legal) tend to be bid up by advertisers, which raises CPMs and CPCs.',
    commonUses: [
      'Measuring advertising campaign efficiency by calculating CPM and CPC from ad spend, impressions, and clicks',
      'Planning ad budgets by reverse-calculating the spend required to reach a target number of impressions at a given CPM',
      'Comparing ad performance across campaigns, platforms and periods to spot optimization opportunities',
    ],
    faqs: [
      {
        question: 'What is a good CPM for my industry?',
        answer: 'There is no single number: CPM depends on targeting precision, ad format, platform (Google vs. Facebook vs. TikTok), seasonality, geography and how competitive your audience is. Niche B2B and high-lifetime-value audiences usually cost more to reach. The most reliable benchmark is your own past campaigns on the same platform and audience.',
      },
      {
        question: 'How is CPM different from CPC?',
        answer: 'CPM charges per 1,000 impressions (whether anyone clicks or not), while CPC charges per click. CPM is typically used for brand awareness campaigns where the goal is visibility. CPC is used for performance/direct response campaigns where the goal is traffic or conversions. Most display and social media platforms offer both pricing models. The relationship: CPM = CPC × CTR × 10. For example, if your CPC is $0.50 and your CTR is 2%, your implied CPM is $0.50 × 2 × 10 = $10.00.',
      },
      {
        question: 'How do I calculate my advertising budget from a target CPM?',
        answer: 'Use the formula: Budget = (Target CPM × Desired Impressions) / 1000. For example, if your target CPM is $12 and you want 500,000 impressions: ($12 × 500,000) / 1000 = $6,000. This tells you how much to allocate to reach your visibility goals. Remember to account for the platform\'s fee structure — some platforms charge additional platform fees on top of the media cost.',
      },
      {
        question: 'What is a good CTR for my ad campaigns?',
        answer: 'Good CTR depends on the platform, ad format and intent: people searching for something click far more often than people scrolling a feed or seeing a banner, so compare like with like (same platform, format and audience). Platform-published and industry benchmarks differ by source and year, so treat them as rough. More importantly, CTR alone doesn\'t determine success — focus on the cost per conversion (CPA) as the ultimate metric.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Cost per Mille', url: 'https://en.wikipedia.org/wiki/Cost_per_mille' },
      { source: 'Investopedia', title: 'CPM vs. CPC', url: 'https://www.investopedia.com/ask/answers/12/cpm-vs-cpc.asp' },
    ],
  },
};

export default cpmCpcConfig;
