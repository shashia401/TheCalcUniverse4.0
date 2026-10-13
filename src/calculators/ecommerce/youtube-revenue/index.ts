import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { createElement } from 'react';
import YouTubeRevenuePanel from './YouTubeRevenuePanel';
import { NICHE_RANGES, DEFAULT_AD_RATE_PCT, DAYS_PER_YEAR, computeYouTube, nicheMidCpm } from './youtubeMath';

const youtubeRevenueConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'dailyViews',
      label: 'Daily Views',
      type: 'number',
      placeholder: '10000',
      min: 0,
      max: 1000000000,
      step: 1,
      inputMode: 'numeric',
      required: true,
      helpText: 'Average number of views your videos get per day. Check YouTube Studio Analytics for your channel\'s 28-day average daily views.',
    },
    {
      id: 'niche',
      label: 'Content Niche',
      type: 'select',
      required: true,
      options: Object.entries(NICHE_RANGES).map(([value, r]) => ({ label: r.label, value })),
      helpText: 'Sets a rough planning CPM (the midpoint of an estimated range, not a YouTube-published figure). CPM varies a lot with audience country, season and video length, so override it below if you know your own.',
    },
    {
      id: 'cpm',
      label: 'Custom CPM (optional override)',
      type: 'number',
      placeholder: 'Leave blank for niche default',
      prefix: '$',
      min: 0,
      max: 500,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Override the default CPM for your niche with your own estimate or the CPM shown in YouTube Studio.',
    },
    {
      id: 'adRate',
      label: 'Views That Show an Ad (optional)',
      type: 'percentage',
      placeholder: String(DEFAULT_AD_RATE_PCT),
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      inputMode: 'decimal',
      helpText: `Share of views that actually show a monetized ad (ad blockers, non-monetized views, limited ads reduce it). Blank uses ${DEFAULT_AD_RATE_PCT}%, a placeholder assumption, not a YouTube statistic.`,
    },
    {
      id: 'watchTimeHours',
      label: 'Avg Watch Time per View (optional)',
      type: 'number',
      placeholder: '0',
      unit: 'min',
      min: 0,
      max: 10000,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Average minutes watched per view (not used in the revenue estimate). Gives your total daily watch time.',
    },
    {
      id: 'engagementRate',
      label: 'Engagement Rate (optional)',
      type: 'percentage',
      placeholder: '0',
      min: 0,
      max: 100,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Like/comment/share rate as a percentage of views (not used in the revenue estimate). Gives your daily engagements.',
    },
  ],

  calculate: (values) => {
    const dailyViews = parseFloat(values.dailyViews);
    const nicheInfo = values.niche ? NICHE_RANGES[values.niche] : undefined;
    const customCpm = values.cpm !== undefined && values.cpm !== '' ? parseFloat(values.cpm) : NaN;
    const adRaw = values.adRate !== undefined && values.adRate !== '' ? parseFloat(values.adRate) : DEFAULT_AD_RATE_PCT;

    if (!Number.isFinite(dailyViews) || dailyViews <= 0 || !nicheInfo) return [];
    if (!Number.isFinite(adRaw) || adRaw < 0 || adRaw > 100) return [];

    const effectiveCpm = Number.isFinite(customCpm) && customCpm > 0 ? customCpm : nicheMidCpm(values.niche);
    const f = computeYouTube(dailyViews, effectiveCpm, adRaw);

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const int = (n: number) => Math.round(n).toLocaleString(undefined);

    const results: CalculatorResult[] = [
      { id: 'dailyRevenue', label: 'Estimated Daily Revenue', value: `$${fmt(f.daily)}`, highlight: false, color: 'neutral' },
      {
        id: 'monthlyRevenue',
        label: 'Estimated Monthly Revenue',
        value: `$${fmt(f.monthly)}`,
        highlight: true,
        color: 'positive',
        interpretation: `This is a rough estimate of creator ad revenue only (55% of ad revenue on long-form videos) from a planning CPM and an assumed ${adRaw}% of views showing ads. Real RPM swings widely with audience country, season and niche; treat the result as an order of magnitude, and check YouTube Studio for your actual figures. Sponsorships, memberships and affiliate links are not included.`,
      },
      { id: 'yearlyRevenue', label: 'Estimated Yearly Revenue', value: `$${fmt(f.yearly)}`, highlight: true, color: 'positive' },
      { id: 'effectiveCpm', label: 'CPM Used', value: `$${fmt(effectiveCpm)}`, color: 'neutral' },
      { id: 'rpm', label: 'Estimated RPM (creator revenue per 1,000 views)', value: `$${fmt(f.rpm)}`, color: 'neutral' },
      { id: 'fillRate', label: 'Views Showing an Ad (assumed)', value: `${adRaw}%`, color: 'neutral' },
      { id: 'niche', label: 'Niche', value: nicheInfo.label, color: 'neutral' },
      { id: 'dailyViews', label: 'Daily Views', value: int(dailyViews), color: 'neutral' },
      { id: 'monthlyViews', label: 'Monthly Views', value: int((dailyViews * DAYS_PER_YEAR) / 12), color: 'neutral' },
    ];

    const watchTime = parseFloat(values.watchTimeHours);
    if (Number.isFinite(watchTime) && watchTime > 0) {
      results.push({
        id: 'watchTimeResult',
        label: 'Daily Watch Time',
        value: `${((dailyViews * watchTime) / 60).toFixed(1)} hrs`,
        color: 'neutral',
      });
    }

    const engagement = parseFloat(values.engagementRate);
    if (Number.isFinite(engagement) && engagement > 0) {
      results.push({
        id: 'engagementResult',
        label: 'Daily Engagements',
        value: int((dailyViews * engagement) / 100),
        color: 'neutral',
      });
    }

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(YouTubeRevenuePanel, { values, results });
  },

  educational: {
    formula: 'Revenue = Views ÷ 1,000 × (Share of Views Showing an Ad) × CPM × 55% creator share',
    formulaSource:
      'YouTube Partner Program: creators receive 55% of ad revenue on long-form watch pages (YouTube Help, "Revenue sharing"). The niche CPM ranges and the 50% ad-view share are rough planning assumptions of this calculator, not YouTube statistics.',
    diagram: {
      svg: '<svg viewBox="0 0 440 200" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="10" y="70" width="90" height="60" fill="var(--svg-3b82f6)" rx="8"/><text x="55" y="98" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Views</text><text x="55" y="114" text-anchor="middle" font-size="11" fill="var(--svg-bfdbfe)">100K</text><polygon points="108,95 120,100 108,105" fill="var(--svg-666666)"/><rect x="125" y="70" width="90" height="60" fill="var(--svg-8b5cf6)" rx="8"/><text x="170" y="98" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Ad views</text><text x="170" y="114" text-anchor="middle" font-size="11" fill="var(--svg-ddd6fe)">50K (assumed)</text><polygon points="223,95 235,100 223,105" fill="var(--svg-666666)"/><rect x="240" y="70" width="90" height="60" fill="var(--svg-f59e0b)" rx="8"/><text x="285" y="98" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Ad revenue</text><text x="285" y="114" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)">at $10 CPM: $500</text><polygon points="338,95 350,100 338,105" fill="var(--svg-666666)"/><rect x="355" y="70" width="80" height="60" fill="var(--svg-22c55e)" rx="8"/><text x="395" y="98" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">You (55%)</text><text x="395" y="114" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)">$275</text></svg>',
      alt: 'Pipeline from 100K views to 50K ad views to $500 of advertiser spend at a $10 CPM to $275 creator revenue after the 55% share',
      caption: 'Views to ad views to advertiser spend to creator revenue (example: 100K views, 50% showing ads, $10 CPM)',
    },
    formulaDescription:
      'CPM (cost per mille) is what advertisers pay per 1,000 ad impressions. Not every view shows an ad, so only a share of views earn anything, and YouTube pays creators 55% of the ad revenue on long-form videos. RPM (revenue per mille) is what you earn per 1,000 total views: RPM = share of views showing ads × CPM × 55%.',
    variables: [
      { symbol: 'CPM', name: 'Cost Per Mille', description: 'What advertisers pay per 1,000 ad impressions. It varies a lot by niche, viewer country, season and video format. The niche defaults here are rough planning midpoints, not YouTube-published numbers.' },
      { symbol: 'Ad share', name: 'Views That Show an Ad', description: 'The fraction of views that actually show a monetized ad. Ad blockers, non-monetized or limited-ads videos and some audiences lower it; mid-roll ads in longer videos can raise ad impressions per view. This calculator assumes 50% unless you enter your own.' },
      { symbol: 'RPM', name: 'Revenue Per Mille', description: 'Your estimated earnings per 1,000 total views after YouTube\'s 45% share: RPM = ad share × CPM × 0.55. YouTube Studio reports your real RPM once you are monetized.' },
    ],
    howToUse: [
      'Enter your average daily views (YouTube Studio > Analytics, 28-day average).',
      'Select your niche for a planning CPM, or enter your own CPM override.',
      'Optionally change the share of views that show an ad if you know it.',
      'Read the estimated daily, monthly and yearly ad revenue and RPM. Compare with the RPM in YouTube Studio if you are monetized.',
    ],
    explanation:
      'Ad revenue scales with views, with the CPM advertisers pay, with how many views carry an ad, and with the creator share. For example 10,000 daily views at a $14 CPM with 50% of views showing ads give 10,000 ÷ 1,000 × 0.50 × $14 = $70 of advertiser spend, of which the creator receives 55% = $38.50 per day. Advertisers pay more to reach audiences with high purchase intent (finance, business, education, technology) than for broad entertainment or music, and more for viewers in countries with strong ad markets, which is why the same view count can earn very different amounts. CPMs also move through the year with advertiser budgets. This calculator is a planning tool for order-of-magnitude estimates; it does not include sponsorships, memberships, Shorts revenue, affiliate income or merchandise, which can be a large share of a creator\'s income.',
    commonUses: [
      'Estimating potential ad revenue from a channel based on daily views and niche',
      'Comparing how niche and audience location change earnings for the same view count',
      'Projecting monthly and annual ad earnings for content planning',
      'Understanding the difference between CPM and RPM',
      'Modeling scenarios such as "what if my views double?"',
    ],
    faqs: [
      {
        question: 'What is the difference between CPM and RPM?',
        answer: 'CPM is what advertisers pay per 1,000 ad impressions; RPM is what you earn per 1,000 total views. RPM is lower because not every view shows an ad and YouTube keeps 45% of the ad revenue. Here RPM = ad share × CPM × 55%: for a $20 CPM and 50% of views showing ads, RPM = 0.50 × $20 × 0.55 = $5.50.',
      },
      {
        question: 'Why does Finance earn more than Gaming?',
        answer: 'Advertisers in finance, insurance, software and similar categories value each customer highly and bid more to reach them, while mass-entertainment audiences are valued lower. Audience country also matters: viewers in countries with large advertising markets are worth more to advertisers. The niche CPMs used here are rough planning ranges, so use your own CPM when you have it.',
      },
      {
        question: 'How accurate are these estimates?',
        answer: 'Treat them as order-of-magnitude. Real earnings depend on viewer location, video length (mid-roll ads on longer videos), season, advertiser demand, ad-blocker use, monetization status and content category. For your real numbers use YouTube Studio Analytics > Revenue.',
      },
      {
        question: 'How many views do I need to make $1,000 per month?',
        answer: 'It is $1,000 ÷ (monthly views ÷ 1,000 × RPM) in reverse: views needed per month = $1,000 ÷ RPM × 1,000. With this calculator\'s defaults (50% of views showing ads, 55% creator share) a $20 CPM gives an RPM of $5.50, so about 182,000 views a month (roughly 6,000 a day); a $14 CPM gives $3.85 RPM and about 260,000 views a month; a $2 CPM gives $0.55 RPM and about 1.8 million. Your real RPM, set mostly by audience country, can be far higher or lower.',
      },
      {
        question: 'When can I start earning from ads?',
        answer: 'You need to be in the YouTube Partner Program. The standard requirements are 1,000 subscribers plus either 4,000 public watch hours in the past 12 months or 10 million public Shorts views in 90 days; YouTube also offers an earlier tier for fan funding with lower thresholds. Check YouTube Help for the current requirements in your country.',
      },
      {
        question: 'Do mid-roll ads change the estimate?',
        answer: 'They can. Longer videos can show mid-roll ads, so more ads can run per view, which raises revenue per view. This calculator caps the "views that show an ad" input at 100%, so to model heavy mid-roll use enter a higher CPM override (or your Studio RPM ÷ 0.55 ÷ ad share). YouTube sets the eligibility rules for mid-roll ads and they change over time, so check YouTube Help.',
      },
      {
        question: 'How are Shorts and memberships paid?',
        answer: 'Shorts ad revenue is pooled and shared differently from long-form ad revenue and typically pays far less per view, so this calculator\'s estimate is for long-form videos. Channel memberships are paid out separately, with YouTube retaining a share of membership revenue. Both are outside this calculator.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Small Finance Channel: 5,000 Daily Views',
        inputs: { dailyViews: '5000', niche: 'finance-crypto' },
        result: 'CPM used (Finance midpoint): $20.00. RPM = 0.50 × $20 × 0.55 = $5.50. Daily revenue: 5,000 ÷ 1,000 × $5.50 = $27.50. Monthly: $836.46. Yearly: $10,037.50. Monthly views: 152,083.',
        insight: 'A year is 365 days, so monthly figures use 365 ÷ 12 days. For the same views a channel whose audience is mostly in low-CPM countries could earn much less, and a US-heavy audience much more; override the CPM with your own figure to see that.',
      },
      {
        scenario: 'Large Gaming Channel: 200,000 Daily Views',
        inputs: { dailyViews: '200000', niche: 'gaming' },
        result: 'CPM used (Gaming midpoint): $3.50. RPM = 0.50 × $3.50 × 0.55 = $0.96. Daily revenue: 200,000 ÷ 1,000 × $0.9625 = $192.50. Monthly: $5,855.21. Yearly: $70,262.50. Monthly views: 6,083,333.',
        insight: 'Large view counts in low-CPM niches earn less per view, which is why many gaming creators rely on sponsorships, memberships and merchandise as well as ads.',
      },
      {
        scenario: 'Education Channel Growing from 10K to 50K Daily Views',
        inputs: { dailyViews: '10000', niche: 'education' },
        result: 'CPM used (Education midpoint): $14.00. RPM = 0.50 × $14 × 0.55 = $3.85. At 10K daily views: $38.50 per day, $1,171.04 per month, $14,052.50 per year. At 50K: $192.50 per day, $5,855.21 per month, $70,262.50 per year.',
        insight: 'Revenue scales linearly with views at a fixed RPM, so 5x the views is 5x the ad revenue. In practice RPM shifts as your audience mix and video lengths change.',
      },
    ],
    proTips: [
      'Use your own numbers where you can: YouTube Studio shows your real CPM and RPM once monetized, which beats any niche default.',
      'Audience country matters as much as niche. Check Analytics > Audience > Geography and enter a CPM that reflects where your viewers actually are.',
      'Longer videos can carry mid-roll ads, which can raise revenue per view, but only if viewers stay; do not pad content.',
      'Expect CPM to vary through the year with advertiser budgets, so do not annualize a single month blindly.',
      'Do not rely on ads alone: sponsorships, memberships, affiliate links and your own products are separate income streams that this calculator does not include.',
    ],
    limitations: [
      'The niche CPM ranges and the 50% default share of views showing an ad are rough planning assumptions, not YouTube-published numbers. Real values vary by 2x or more even within a niche.',
      'Seasonality, viewer geography, video length, ad format and ad-blocker use are not modeled individually.',
      'Applies to long-form ad revenue with the 55% creator share. Shorts, memberships, Super Chat, sponsorships, affiliate and merchandise income are not included.',
      'Assumes stable daily views; real views fluctuate. Estimates are before tax.',
    ],
    quickReference: [
      { label: 'Creator share of long-form ad revenue', value: '55%' },
      { label: 'RPM', value: 'Ad share × CPM × 0.55' },
      { label: 'Views for $1,000 / month', value: '$1,000 ÷ RPM × 1,000' },
      { label: 'Days per year used', value: '365 (month = 365 ÷ 12)' },
      { label: 'Default share of views showing an ad', value: '50% (assumption)' },
      { label: 'YPP (standard) subscribers', value: '1,000' },
      { label: 'YPP (standard) watch hours', value: '4,000 in 12 months' },
    ],
    citations: [
      { source: 'YouTube Help -- YouTube Partner Program overview & eligibility', url: 'https://support.google.com/youtube/answer/72851' },
      { source: 'YouTube Help -- Revenue sharing', url: 'https://support.google.com/youtube/answer/72902' },
    ],
  },
};

export default youtubeRevenueConfig;
