import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import YouTubeRevenuePanel from './YouTubeRevenuePanel';

const NICHE_RANGES: Record<string, { min: number; max: number; label: string }> = {
  'finance-crypto': { min: 15, max: 25, label: 'Finance / Crypto' },
  'education': { min: 10, max: 18, label: 'Education' },
  'tech': { min: 8, max: 15, label: 'Tech' },
  'entertainment': { min: 3, max: 8, label: 'Entertainment' },
  'gaming': { min: 2, max: 5, label: 'Gaming' },
  'vlogging': { min: 3, max: 8, label: 'Vlogging' },
  'music': { min: 1, max: 3, label: 'Music' },
};

function getDefaultCpm(niche: string): number {
  const range = NICHE_RANGES[niche];
  if (!range) return 0;
  return (range.min + range.max) / 2;
}

const youtubeRevenueConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'dailyViews',
      label: 'Daily Views',
      type: 'number',
      placeholder: '10000',
      min: 0,
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
      options: [
        { label: 'Finance / Crypto', value: 'finance-crypto' },
        { label: 'Education', value: 'education' },
        { label: 'Tech', value: 'tech' },
        { label: 'Entertainment', value: 'entertainment' },
        { label: 'Gaming', value: 'gaming' },
        { label: 'Vlogging', value: 'vlogging' },
        { label: 'Music', value: 'music' },
      ],
      helpText: 'CPM varies significantly by niche. Finance/Crypto pays the most ($15-25 CPM). Music pays the least ($1-3 CPM).',
    },
    {
      id: 'cpm',
      label: 'Custom CPM (optional override)',
      type: 'number',
      placeholder: 'Leave blank for niche default',
      prefix: '$',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Override the default CPM for your niche. Enter your actual CPM from YouTube Studio if you are already monetized, or a custom estimate.',
    },
    {
      id: 'watchTimeHours',
      label: 'Avg Watch Time per View (optional)',
      type: 'number',
      placeholder: '0',
      unit: 'min',
      min: 0,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Average minutes watched per view. Longer average watch time signals to YouTube that your content is engaging, which can improve recommendations.',
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
      helpText: 'Like/comment/share rate as a percentage of views. High engagement correlates with better algorithmic promotion and higher RPM.',
    },
  ],

  calculate: (values) => {
    const dailyViews = parseFloat(values.dailyViews);
    const niche = values.niche;
    const nicheInfo = niche ? NICHE_RANGES[niche] : undefined;
    const customCpm = values.cpm !== undefined && values.cpm !== '' ? parseFloat(values.cpm) : NaN;

    if (isNaN(dailyViews) || dailyViews <= 0 || !nicheInfo) return [];

    const effectiveCpm = !isNaN(customCpm) && customCpm > 0 ? customCpm : getDefaultCpm(niche);
    const fillRate = 0.5; // 50% ad fill rate
    const dailyRevenue = dailyViews * fillRate / 1000 * effectiveCpm;
    const monthlyRevenue = dailyRevenue * 30;
    const yearlyRevenue = monthlyRevenue * 12;
    const rpm = dailyRevenue / dailyViews * 1000;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const results = [
      {
        id: 'dailyRevenue',
        label: 'Estimated Daily Revenue',
        value: `$${fmt(dailyRevenue)}`,
        highlight: false,
        color: 'neutral' as const,
      },
      {
        id: 'monthlyRevenue',
        label: 'Estimated Monthly Revenue',
        value: `$${fmt(monthlyRevenue)}`,
        highlight: true,
        color: 'positive' as const,
        interpretation: `This is ad revenue only (YouTube's typical ~55% creator share of AdSense) and RPM swings widely by niche, season, and audience location — finance and tech content earns multiples of what gaming or vlogs typically see. Most established creators earn more from sponsorships, memberships, and affiliate links than from ads alone.`,
      },
      {
        id: 'yearlyRevenue',
        label: 'Estimated Yearly Revenue',
        value: `$${fmt(yearlyRevenue)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'effectiveCpm',
        label: 'Effective CPM',
        value: `$${fmt(effectiveCpm)}`,
        color: 'neutral' as const,
      },
      {
        id: 'rpm',
        label: 'RPM (Revenue per 1,000 Views)',
        value: `$${fmt(rpm)}`,
        color: 'neutral' as const,
      },
      {
        id: 'fillRate',
        label: 'Ad Fill Rate',
        value: '50%',
        color: 'neutral' as const,
      },
      {
        id: 'niche',
        label: 'Niche',
        value: nicheInfo.label,
        color: 'neutral' as const,
      },
      {
        id: 'dailyViews',
        label: 'Daily Views',
        value: dailyViews.toLocaleString(undefined),
        color: 'neutral' as const,
      },
      {
        id: 'monthlyViews',
        label: 'Monthly Views',
        value: (dailyViews * 30).toLocaleString(undefined),
        color: 'neutral' as const,
      },
    ];

    const watchTime = parseFloat(values.watchTimeHours);
    if (!isNaN(watchTime) && watchTime > 0) {
      const totalWatchMinutes = dailyViews * watchTime;
      results.push({
        id: 'watchTimeResult',
        label: 'Daily Watch Time',
        value: `${(totalWatchMinutes / 60).toFixed(1)} hrs`,
        color: 'neutral' as const,
      });
    }

    const engagement = parseFloat(values.engagementRate);
    if (!isNaN(engagement) && engagement > 0) {
      results.push({
        id: 'engagementResult',
        label: 'Daily Engagements',
        value: Math.round(dailyViews * engagement / 100).toLocaleString(undefined),
        color: 'neutral' as const,
      });
    }

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(YouTubeRevenuePanel, { values, results });
  },

  educational: {
    formula: 'Revenue = Views × Fill Rate ÷ 1,000 × CPM | RPM = Revenue ÷ Views × 1,000',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="30" y="140" width="100" height="60" fill="var(--svg-3b82f6)" rx="8"/><text x="80" y="168" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Views</text><text x="80" y="183" text-anchor="middle" font-size="11" fill="var(--svg-bfdbfe)">100K</text><line x1="130" y1="170" x2="170" y2="170" stroke="var(--svg-666666)" stroke-width="2"/><polygon points="170,165 180,170 170,175" fill="var(--svg-666666)"/><rect x="185" y="140" width="100" height="60" fill="var(--svg-8b5cf6)" rx="8"/><text x="235" y="168" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Ad Views</text><text x="235" y="183" text-anchor="middle" font-size="11" fill="var(--svg-ddd6fe)">50K</text><line x1="285" y1="170" x2="325" y2="170" stroke="var(--svg-666666)" stroke-width="2"/><polygon points="325,165 335,170 325,175" fill="var(--svg-666666)"/><rect x="340" y="140" width="80" height="60" fill="var(--svg-22c55e)" rx="8"/><text x="380" y="168" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Revenue</text><text x="380" y="183" text-anchor="middle" font-size="11" fill="var(--svg-bbf7d0)">$250</text></svg>',
      alt: 'Pipeline flow from views through ad views to revenue',
      caption: 'YouTube revenue pipeline — views to ad impressions to earnings',
    },
    formulaDescription:
      'YouTube ad revenue depends on your CPM (Cost Per Mille -- the amount advertisers pay per 1,000 ad impressions) and the ad fill rate (the percentage of views that actually show ads). Not every view generates ad revenue. The ad fill rate is typically 40-60% because: some viewers use ad blockers, some views are from countries with low advertiser demand, some videos are not advertiser-friendly (demonetized or limited monetization), and shorter videos may not trigger mid-roll ads. YouTube keeps 45% of the ad revenue and pays the creator 55% -- this is the standard revenue share for the YouTube Partner Program.',
    variables: [
      { symbol: 'CPM', name: 'Cost Per Mille', description: 'The amount advertisers pay per 1,000 ad impressions. Varies wildly by niche from $1 (Music) to $25 (Finance/Crypto). This is the advertiser-side metric -- what Google charges the advertiser. CPM also varies by: viewer geography (US/UK/Canada/Australia pay the highest), time of year (Q4/November-December CPMs are 30-80% higher than Q1/January CPMs), and video content category (finance, business, and tech content commands premium CPMs). CPM is NOT what you earn -- that\'s RPM.' },
      { symbol: 'RPM', name: 'Revenue Per Mille', description: 'Your actual earnings per 1,000 total views after YouTube\'s 45% cut. RPM = (total earnings / total views) x 1,000. Because RPM accounts for YouTube\'s share AND the ad fill rate, RPM is always lower than CPM. Typically RPM is 45-55% of CPM, but can be as low as 30% for channels with low fill rates (young audiences, non-US viewers, ad-block heavy demographics). A finance channel with a $20 CPM might see an RPM of $8-12. A gaming channel with a $5 CPM might see an RPM of $1.50-2.50.' },
      { symbol: 'Fill Rate', name: 'Ad Fill Rate', description: 'The percentage of views that result in ad impressions. Typically 40-60% due to ad blockers (used by 25-40% of desktop viewers depending on demographic), viewer location (views from developing countries have fewer advertisers, resulting in lower fill rates), and video monetization status. Longer videos (8+ minutes) can include mid-roll ads, which increases effective fill rate because multiple ads can appear per view. This calculator uses a default fill rate of 50%, which is the industry midpoint for established monetized channels.' },
    ],
    howToUse: [
      'Enter your average daily views. Find this in YouTube Studio under Analytics > Overview > "Views" -- use the 28-day average for a stable number, not a single viral day.',
      'Select your content niche for the default CPM range. If you are already monetized, check your actual CPM in YouTube Studio under Analytics > Revenue > "CPM."',
      'Optionally enter a custom CPM if you know your actual CPM from YouTube Studio, or if you want to model different CPM scenarios.',
      'Optionally enter average watch time and engagement rate for deeper analytics. Find these in YouTube Studio under Analytics > Engagement.',
      'View estimated daily, monthly, and yearly revenue projections. These are gross AdSense estimates before tax withholding.',
    ],
    explanation:
      'YouTube ad revenue is driven by CPM (Cost Per Mille), which is what advertisers pay per 1,000 ad impressions. However, your actual earnings depend on the RPM (Revenue Per Mille), which accounts for YouTube\'s 45% cut and the fact that only 40-60% of views show ads. Finance and education niches command the highest CPMs because advertisers are willing to pay more for highly targeted, high-intent audiences -- a financial services company might pay $20-$25 CPM to reach people searching for investment advice, because a single customer conversion is worth thousands. Gaming and music have the lowest CPMs due to younger audiences with less purchasing power and higher supply of content. This is why a finance channel with 100K views can earn $500-$1,000 in ad revenue while a gaming channel with 1M views might earn only $350-$700. Beyond ad revenue, successful YouTubers diversify with sponsorships (typically $15-$50 CPM equivalent, paid directly by brands and not subject to YouTube\'s 45% cut), merchandise, affiliate marketing (Amazon Associates, affiliate networks), channel memberships (YouTube takes 30% of membership revenue), and Super Chat/Stickers during live streams. Many established creators report that AdSense represents only 20-40% of their total YouTube income, with sponsorships and affiliate marketing making up the majority. The CPM also varies dramatically by season: Q4 (October-December) typically sees 30-80% higher CPMs than the rest of the year because advertisers spend their remaining annual budgets for holiday campaigns. Conversely, January CPMs are typically the lowest of the year as advertising budgets reset. A channel earning $2,000/month in December might earn $1,200-$1,400 in January from the same view count.',
    commonUses: [
      'Estimating potential ad revenue from a YouTube channel based on daily views and content niche before reaching monetization',
      'Comparing earnings across different content categories like finance, gaming, education, and entertainment to choose a profitable niche',
      'Projecting monthly and annual YouTube ad earnings for content planning, channel growth strategy, and financial forecasting',
      'Understanding the difference between CPM and RPM to set realistic revenue expectations as a content creator',
      'Modeling revenue scenarios (e.g., "If I double my views to 100K/day, how much will I earn?") for growth goal-setting',
    ],
    faqs: [
      {
        question: 'What is the difference between CPM and RPM?',
        answer: 'CPM (Cost Per Mille) is what advertisers pay Google per 1,000 ad impressions -- it is the advertiser-side metric. RPM (Revenue Per Mille) is what you, the creator, actually earn per 1,000 total views. RPM = (total earnings / total views) x 1,000. RPM is always lower than CPM because: (1) YouTube takes 45% of the ad revenue, leaving you 55%, and (2) RPM is calculated against TOTAL views, not just monetized views, so views without ads (ad-blocked, non-monetizable, limited ads) dilute the RPM. Typically RPM is 45-55% of CPM for established channels, but can be as low as 25-35% for new channels or channels with young/ad-block-heavy audiences. Example: a finance channel with a $20 CPM and 50% fill rate would earn approximately: revenue = 1,000 views x 50% fill / 1,000 x $20 = $10, YouTube takes $4.50, creator gets $5.50, so RPM = ($5.50 / 1,000) x 1,000 = $5.50. The RPM ($5.50) is 27.5% of the CPM ($20) in this case, not 55%, because RPM accounts for both YouTube\'s cut AND the fill rate.',
      },
      {
        question: 'Why does Finance content earn so much more than Gaming?',
        answer: 'Finance content attracts high-value audiences -- professionals and investors with significant disposable income who are actively researching financial decisions. Advertisers in finance, insurance, real estate, and B2B SaaS pay premium CPMs ($15-$25) to reach these viewers because a single customer conversion can be worth $500-$5,000+. In contrast, gaming content attracts younger audiences (teens to early 20s) with less purchasing power, who also use ad blockers at higher rates. Gaming advertisers (game publishers, energy drinks, gaming peripherals) pay lower CPMs ($2-$5) because the customer lifetime value is lower and the audience is less targeted. This creates an extreme revenue gap: a finance channel with 500K monthly views can earn $2,500-$6,250 in AdSense, while a gaming channel with the exact same 500K monthly views might earn only $500-$1,250. Additionally, the finance audience is concentrated in high-CPM countries (US, UK, Canada, Australia), while gaming has a more globally distributed audience including lower-CPM regions.',
      },
      {
        question: 'How accurate are these estimates?',
        answer: 'These are estimates based on typical industry ranges. Actual earnings vary based on multiple factors not captured in a simple CPM x views calculation: (1) Viewer location -- US viewers generate 3-5x higher CPMs than viewers from developing countries. (2) Video length -- videos over 8 minutes can include mid-roll ads, potentially doubling or tripling ad impressions per view. (3) Season -- Q4 (October-December) CPMs are typically 30-80% higher than Q1 (January-March). (4) Advertiser demand -- CPMs fluctuate weekly based on advertiser budgets, current events, and market conditions. (5) Content type -- some specific topics within a niche may have higher or lower CPM than the niche average. (6) Ad blocker usage -- varies by audience demographic from 15-60%. (7) Monetization status -- yellow icon/limited monetization videos earn significantly less. For the most accurate individual estimate, check your actual CPM and RPM in YouTube Studio Analytics. Beyond AdSense, many creators earn 2-5x more from sponsorships alone, which is not included in this calculator.',
      },
      {
        question: 'How many views do I need to make $1,000 per month?',
        answer: 'It depends entirely on your niche and audience location. Using this calculator\'s estimates with a 50% fill rate: Finance ($20 CPM): $1,000/month requires approximately 3,335 daily views (100K monthly). Education ($14 CPM): approximately 4,765 daily views (143K monthly). Tech ($11.50 CPM): approximately 5,800 daily views (174K monthly). Entertainment ($5.50 CPM): approximately 12,120 daily views (364K monthly). Gaming ($3.50 CPM): approximately 19,050 daily views (571K monthly). Music ($2.00 CPM): approximately 33,335 daily views (1M monthly). These are rough estimates assuming a US/UK-heavy audience. A channel with primarily Indian or Southeast Asian viewers will need 5-10x more views to earn the same amount because CPMs in those regions are $0.50-$2.00. This is why "views" alone is a poor metric for revenue -- a finance channel with 100K monthly views can outearn a gaming channel with 500K monthly views. For reference, YouTube\'s monetization threshold requires 1,000 subscribers AND 4,000 watch hours in the past 12 months to join the YouTube Partner Program.',
      },
      {
        question: 'How do sponsorships compare to AdSense revenue?',
        answer: 'Sponsorships typically pay significantly more than AdSense on a per-view basis, and they are not subject to YouTube\'s 45% cut. A sponsor pays the creator directly, typically $15-$50 per 1,000 views (CPM-equivalent), compared to an AdSense RPM of $2-$12 per 1,000 views. For a mid-sized tech channel with 500K monthly views: AdSense might generate $2,500-$5,500/month (at $5-$11 RPM), while a single 60-second integrated sponsorship in each video might generate $3,000-$8,000/month (at $15-$30 CPM-equivalent for a dedicated segment). Many established creators report that sponsorships represent 50-70% of their total YouTube income. Sponsorship rates depend on: niche (finance and tech command the highest rates), audience demographics (US/UK viewers are most valuable), engagement rate (high comment and like rates indicate an engaged audience), and average views per video (not total channel views -- sponsors care about the views a single video reliably gets in the first 30 days). Sponsorship platforms like GrapeVillage, FameBit, and direct outreach from brands are the primary ways to secure sponsorships. At scale (1M+ subscribers), top creators can negotiate $50,000-$500,000+ per brand deal for multi-video integrations.',
      },
      {
        question: 'How do mid-roll ads increase revenue?',
        answer: 'Mid-roll ads (ads that play during the video, not just before it) are the single biggest lever for increasing AdSense revenue. YouTube allows mid-roll ads on videos 8 minutes or longer. A 10-minute video can fit 1 mid-roll ad, doubling the potential ad impressions per view (pre-roll + 1 mid-roll). A 20-minute video can fit 2-3 mid-roll ads, tripling or quadrupling ad impressions. Creators who strategically extend their videos past the 8-minute mark often see 50-100% higher RPM compared to sub-8-minute videos with the same view count, all else being equal. YouTube can also automatically place mid-roll ads, though manual placement at natural break points in the content (between segments, after a cliffhanger) yields better viewer retention than auto-placement. The trade-off: too many mid-roll ads annoy viewers and increase video abandonment. The sweet spot for most creators is 1 ad per 6-8 minutes of content. For example, a 16-minute video with 2 mid-roll ads (at 6:00 and 12:00 marks) is generally well-tolerated, while a 10-minute video with 4 mid-roll ads (every 2-3 minutes) will likely drive viewers away. Many creators structure their content around the 8-minute mark specifically to unlock mid-roll ads -- this is sometimes called "the 10-minute rule" in creator circles.',
      },
      {
        question: 'How do channel memberships affect total revenue?',
        answer: 'Channel memberships (formerly "Sponsorships" or "Join" button) allow viewers to pay a monthly fee (typically $0.99 to $99.99, set by the creator in tiers) for perks like exclusive badges, emoji, members-only content, early access to videos, and members-only live streams. YouTube takes 30% of membership revenue on desktop (creators keep 70%), but on mobile (iOS/Android), Apple and Google take their standard 15-30% in-app purchase cut first, and then YouTube takes 30% of the remainder -- meaning mobile membership revenue pays creators only 49-60% net. For a channel with 500 loyal members at $4.99/month: gross membership revenue = $2,495/month. Desktop memberships (assume 60% of members): 300 x $4.99 = $1,497, creator gets $1,048 (70%). Mobile memberships (40%): 200 x $4.99 = $998, creator gets approximately $500-$600 after double fees. Total = approximately $1,550-$1,650/month. While memberships alone rarely match AdSense for most channels, they provide stable, recurring monthly revenue that is less affected by CPM seasonality. The membership model works best for channels with strong community engagement -- tutorial channels, live streamers, and personality-driven content convert viewers to members at higher rates than purely informational content. For many creators, memberships represent 5-15% of total YouTube income but are the most predictable and reliable portion.',
      },
      {
        question: 'Is YouTube Shorts revenue significant compared to long-form videos?',
        answer: 'YouTube Shorts monetization is fundamentally different from long-form video monetization and pays significantly less per view. Instead of sharing ad revenue from individual videos, YouTube pools all Shorts ad revenue into a "Creator Pool" and distributes it to Shorts creators based on their share of total Shorts views. The effective RPM for Shorts is typically $0.02-$0.07 per 1,000 views (yes, 2 to 7 cents per thousand views), compared to $2-$12 RPM for long-form videos -- roughly 100x less per view. A Shorts video with 1 million views might earn $20-$70, while a long-form video with 1 million views might earn $2,000-$12,000. However, Shorts can reach vastly more viewers (it is common for Shorts to get 500K-5M views) and serve as a funnel to long-form content. A common strategy: use Shorts to attract subscribers and drive viewers to your long-form content, where the real monetization happens. Creators who are Shorts-only face significant revenue challenges -- 10 million monthly Shorts views might generate only $200-$700, which is not sustainable as a primary income source. The YouTube Shorts Fund (a $100 million pool to reward Shorts creators, separate from ad revenue) was replaced by the ad revenue sharing model in February 2023, so Shorts creators now earn from the ad revenue pool rather than a fixed fund.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Small Finance Channel: 5,000 Daily Views, Monetized for 6 Months',
        inputs: { dailyViews: '5000', niche: 'finance-crypto' },
        result: 'Effective CPM (Finance midpoint): $20.00. Daily revenue: 5,000 x 0.50 / 1,000 x $20.00 = $50.00. Monthly: $1,500.00. Yearly: $18,000.00. RPM: $10.00 per 1,000 views. Monthly views: 150,000.',
        insight: 'A finance channel with only 5,000 daily views (150K monthly) earning $1,500/month in AdSense illustrates why finance is the most lucrative niche. At this view level, the channel is likely also attracting sponsorship interest -- a single sponsored video integration for a fintech app (e.g., Robinhood, Webull, Acorns) could pay $500-$1,500 per video, potentially doubling revenue. The key to reaching this level: consistent uploads (2-3x/week), search-optimized titles targeting specific finance questions ("How to Open a Roth IRA in 2025," "Best High-Yield Savings Accounts"), and building topical authority. At 150K monthly views, the channel likely has 15K-50K subscribers if content quality is high. The CPM for this channel will fluctuate significantly by season: expect $2,500-$3,000/month in December and $1,000-$1,200 in January from the same view count.',
      },
      {
        scenario: 'Large Gaming Channel: 200,000 Daily Views, Variety Streamer',
        inputs: { dailyViews: '200000', niche: 'gaming' },
        result: 'Effective CPM (Gaming midpoint): $3.50. Daily revenue: 200,000 x 0.50 / 1,000 x $3.50 = $350.00. Monthly: $10,500.00. Yearly: $126,000.00. RPM: $1.75 per 1,000 views. Monthly views: 6,000,000.',
        insight: 'A gaming channel with 6 million monthly views earning $10,500/month highlights the view-to-revenue disparity across niches. This channel needs 6M monthly views to earn roughly what a finance channel earns with 300K monthly views. However, gaming channels have unique monetization advantages: (1) live streaming on Twitch/YouTube Live generates direct donations, subscriptions, and bits revenue (often $500-$2,000/month for mid-sized streamers), (2) gaming peripheral and energy drink sponsorships pay well ($2,000-$8,000 per dedicated video), (3) game publishers pay for sponsored gameplay ($1,000-$5,000 per video for a new game release), and (4) merchandise (gaming-themed apparel, branded mousepads) sells well to gaming audiences. The effective total revenue for this channel including AdSense + sponsorships + memberships + streaming could be $25,000-$40,000/month. AdSense alone undercounts total gaming creator income by a factor of 3-4x. Also, gaming audiences skew young and male, with high ad-block usage (30-50%), which depresses AdSense RPM but does not affect sponsorship value as much since sponsors pay for integrated mentions, not ad impressions.',
      },
      {
        scenario: 'Education Channel Growing from 10K to 50K Daily Views Over 12 Months',
        inputs: { dailyViews: '10000', niche: 'education' },
        result: 'At 10K views: Effective CPM $14.00. Daily revenue: $70.00. Monthly: $2,100.00. Yearly: $25,200.00. At 50K views: Daily revenue: $350.00. Monthly: $10,500.00. Yearly: $126,000.00.',
        insight: 'An education channel experiencing 5x growth in daily views (from 10K to 50K) over 12 months sees AdSense grow from $2,100/month to $10,500/month. This growth trajectory is realistic for a channel that: (1) uploads consistently (1-2x/week), (2) targets searchable evergreen topics ("Learn Calculus in 30 Days," "Python for Beginners Full Course"), and (3) builds a course or membership offering by month 6-8. Education channels have a unique superpower: content remains relevant for years (unlike news or trending topics), creating a compounding back-catalog effect where older videos continue generating views passively. An education channel with 200 videos averaging 1,000 views/month each generates 200K passive monthly views regardless of new uploads. The real revenue opportunity for education channels is not AdSense but digital products: an online course priced at $49-$199 converting 1-3% of viewers can generate $10,000-$50,000 in launch month from an email list built through YouTube. Successful education creators often report that courses/products generate 3-10x their AdSense revenue. Additionally, education RPM is relatively stable year-round (less seasonal than finance) because education advertisers (universities, online learning platforms, SaaS tools) spend consistently throughout the year.',
      },
    ],
    proTips: [
      'Upload videos longer than 8 minutes to unlock mid-roll ads. A single 10-minute video with 1 mid-roll ad effectively doubles your ad impressions per view compared to a 7-minute video with only pre-roll and post-roll ads. Structure your content to naturally reach the 8-minute threshold -- add deeper examples, case studies, or viewer Q&A segments. But do not pad content just to hit 8 minutes; viewers notice and retention drops. The ideal video length for maximizing revenue while maintaining retention is 10-18 minutes with 1-3 mid-roll ads placed at natural break points.',
      'Your video thumbnail and title are more important for revenue than any other single factor. A 1% improvement in CTR (click-through rate) at 100K impressions per month translates to 1,000 more views -- which at a $5 RPM equals $5/month. Scale that across a year and 10 videos, and a small thumbnail improvement can mean hundreds or thousands in additional revenue. Invest time in A/B testing thumbnails (YouTube\'s built-in "Test and Compare" feature lets you test up to 3 thumbnails per video). High-CTR thumbnails typically have: faces showing emotion, high contrast (dark background + bright subject), minimal text (3-5 words max), and a clear focal point.',
      'Target high-CPM viewer geographies with your content topics. US, UK, Canada, Australia, New Zealand, Germany, Switzerland, and Norway have the highest CPMs ($10-$25 depending on niche). India, Indonesia, Philippines, Brazil, and most of Africa have CPMs of $0.50-$3.00 -- 5-20x lower. If your content is in English and targets topics relevant to US/UK audiences (US tax strategies, UK-specific finance, American pop culture), your RPM will be dramatically higher than broad international content. Check your YouTube Studio Analytics > Audience > Geography to see where your viewers are located, and consider creating content specifically for high-CPM regions if revenue is a priority.',
      'Q4 (October through December) is when you should upload your best, highest-effort content. Advertisers spend 30-80% more in Q4 to capture holiday shopping budgets -- Black Friday through Christmas is the golden window. A video uploaded in late November can earn 2-3x more per view than the same video uploaded in January. Plan your content calendar to have your strongest, most clickable videos ready for October-December. Many creators report that December alone generates 15-25% of their annual AdSense revenue. Conversely, January and February are the lowest-CPM months -- this is a good time to experiment with new content formats and build audience, rather than worrying about immediate revenue.',
      'Diversify revenue beyond AdSense from day one. AdSense should be viewed as one revenue stream among many, not the primary one. Affiliate marketing (Amazon Associates, ShareASale, Impact) can generate $500-$5,000/month for a channel in a product-review niche. Sponsorships pay $15-$50 CPM-equivalent with no 45% YouTube cut. Digital products (courses, templates, presets, e-books) have 80-95% profit margins and scale infinitely. Channel memberships provide recurring monthly income. A healthy creator revenue split target: 30-40% AdSense, 30-40% sponsorships, 20-30% products/affiliates. Channels overly dependent on AdSense (70%+) are vulnerable to CPM fluctuations, algorithm changes, and monetization issues.',
      'Monitor your RPM trends in YouTube Studio monthly. If your RPM is dropping while views are stable or growing, investigate: (a) Is your audience shifting to lower-CPM countries? (b) Are a significant portion of your recent videos "limited monetization" (yellow icon)? (c) Is your average view duration decreasing (shorter views = fewer mid-roll ads triggered)? (d) Has your content category shifted (e.g., from finance topics to general lifestyle)? RPM is a leading indicator of channel health -- a declining RPM often precedes declining views by 1-2 months because it signals the algorithm is showing your content to different (lower-value) audiences.',
    ],
    limitations: [
      'CPM and RPM estimates are midpoints of broad ranges. Actual CPM can vary by 50-200% within the same niche depending on audience geography, content category, and season. The Finance/Crypto niche CPM range of $15-$25 means a US-focused crypto channel might achieve $22-$28 CPM while an India-focused finance channel might achieve $5-$10. Always check your actual CPM in YouTube Studio for the most accurate calculation.',
      'Seasonal CPM variation is not modeled. YouTube CPMs follow a predictable annual cycle: Q1 (Jan-Mar) is the lowest, Q2 (Apr-Jun) is moderate, Q3 (Jul-Sep) is moderate-high, and Q4 (Oct-Dec) is the highest. A channel earning $2,000/month on average may earn $1,200 in January and $3,500 in December from the same view count. This calculator shows the annual average -- for monthly budgeting, factor in the seasonal cycle.',
      'Ad blocker impact is not individually modeled. Ad blocker usage varies dramatically by audience: tech-savvy audiences (developers, gamers) may have 40-60% ad blocker usage, while older, less technical audiences may have 5-15% usage. Mobile viewers (who represent 60-70% of YouTube traffic) have lower ad blocker usage because blocking ads in the YouTube app requires technical workarounds. This calculator\'s 50% fill rate assumption averages across all demographics and devices.',
      'Sponsorship, affiliate, membership, merchandise, Super Chat, and other non-AdSense revenue streams are NOT included. These often represent 50-80% of a creator\'s total income. This calculator estimates AdSense revenue only. To estimate total creator income, multiply the AdSense estimate by 2x-5x depending on your niche and sponsorship-readiness. For example, a tech review channel may earn 3-4x AdSense from sponsorships + affiliates, while a gaming channel may earn 2-3x from memberships + donations + sponsorships.',
      'YouTube algorithm changes can dramatically affect views and revenue. A channel\'s view count can drop 30-50% overnight due to algorithm updates, and recovery is not guaranteed. This calculator assumes stable daily views -- real-world view counts fluctuate due to: algorithm shifts, competitor content, current events, seasonal viewing patterns (views drop in summer, rise in fall/winter), and content fatigue. Treat revenue projections as directional estimates, not guaranteed income.',
    ],
    quickReference: [
      { label: 'Finance/Crypto CPM', value: '$15-25' },
      { label: 'Education CPM', value: '$10-18' },
      { label: 'Tech CPM', value: '$8-15' },
      { label: 'Entertainment CPM', value: '$3-8' },
      { label: 'Gaming CPM', value: '$2-5' },
      { label: 'Music CPM', value: '$1-3' },
      { label: 'YouTube revenue share', value: 'Creator 55% / YouTube 45%' },
      { label: 'Typical ad fill rate', value: '40-60%' },
      { label: 'YPP eligibility (subscribers)', value: '1,000' },
      { label: 'YPP eligibility (watch hours)', value: '4,000 in 12 months' },
      { label: 'Mid-roll ads threshold', value: '8+ minute videos' },
      { label: 'Q4 CPM multiplier vs Q1', value: '1.3-1.8x' },
      { label: 'Shorts RPM (per 1,000 views)', value: '$0.02-$0.07' },
      { label: 'Long-form RPM (per 1,000 views)', value: '$2-$12+' },
    ],
    citations: [
      { source: 'YouTube Creator Academy -- Revenue Basics', url: 'https://creatoracademy.youtube.com/page/lesson/revenue' },
      { source: 'Google AdSense Help', url: 'https://support.google.com/adsense/answer/1705824' },
      { source: 'YouTube Partner Program Overview & Policies', url: 'https://support.google.com/youtube/answer/72851' },
      { source: 'Social Blade -- YouTube Statistics & Analytics', url: 'https://socialblade.com/youtube/' },
    ],
  },
};

export default youtubeRevenueConfig;
