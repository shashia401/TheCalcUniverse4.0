import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import EngagementRatePanel from './EngagementRatePanel';
import { computeEngagement } from './engagementMath';
import { finiteSteps } from '../../../utils/explainGuard';
import type { ExplainStep } from '../../../types/calculator';

const engagementRateConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'platform',
      label: 'Platform',
      type: 'select',
      required: true,
      options: [
        { label: 'Instagram', value: 'instagram' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'X (Twitter)', value: 'x' },
      ],
    },
    {
      id: 'followers',
      label: 'Followers / Subscribers',
      type: 'number',
      placeholder: '10000',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Total follower count — used as the denominator for engagement rate',
    },
    {
      id: 'likes',
      label: 'Likes',
      type: 'number',
      placeholder: '500',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Number of likes on the post — included on all platforms',
    },
    {
      id: 'comments',
      label: 'Comments',
      type: 'number',
      placeholder: '25',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Number of comments on the post — included on all platforms',
    },
    {
      id: 'shares',
      label: 'Shares / Reposts',
      type: 'number',
      placeholder: '30',
      min: 0,
      step: 1,
      helpText: 'Shares / reposts of the post. Optional; leave blank if unknown.',
    },
    {
      id: 'saves',
      label: 'Saves',
      type: 'number',
      placeholder: '20',
      min: 0,
      step: 1,
      helpText: 'Saves / bookmarks of the post. Optional; X does not show public saves, so it is ignored there.',
      showWhen: (values) => values.platform === 'tiktok' || values.platform === 'instagram',
    },
  ],
  calculate: (values) => {
    const platform = values.platform || 'instagram';
    const followers = parseFloat(values.followers);
    const likes = parseFloat(values.likes);
    const comments = parseFloat(values.comments);
    const shares = parseFloat(values.shares) || 0;
    const saves = parseFloat(values.saves) || 0;

    if (!Number.isFinite(followers) || followers <= 0) return [];
    if (!Number.isFinite(likes) || likes < 0) return [];
    if (!Number.isFinite(comments) || comments < 0) return [];

    const { totalEngagements, ratePct } = computeEngagement(platform, followers, likes, comments, Math.max(0, shares), Math.max(0, saves));
    // classify on the displayed (2 dp) rate
    const engagementRate = Math.round(ratePct * 100) / 100;

    const fmtInt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    // Benchmark gauge
    let benchmark = '';
    let benchmarkColor: 'positive' | 'neutral' | 'negative' = 'neutral';
    // Rule-of-thumb bands (vary by platform and source): under 1% low, 1-3.5% typical, over 3.5% high
    if (engagementRate < 1) {
      benchmark = 'Low engagement';
      benchmarkColor = 'negative';
    } else if (engagementRate <= 3.5) {
      benchmark = 'Typical engagement';
      benchmarkColor = 'neutral';
    } else {
      benchmark = 'High engagement';
      benchmarkColor = 'positive';
    }

    // Influencer tier
    let tier = '';
    if (followers < 10000) {
      tier = 'Nano Influencer (under 10K)';
    } else if (followers < 100000) {
      tier = 'Micro Influencer (10K-100K)';
    } else if (followers < 1000000) {
      tier = 'Macro Influencer (100K-1M)';
    } else {
      tier = 'Mega Influencer (1M+)';
    }

    return [
      {
        id: 'engagementRate',
        label: 'Engagement Rate',
        value: `${engagementRate.toFixed(2)}%`,
        highlight: true,
        interpretation: `Engagement rate tends to fall as follower count rises — a smaller, more niche account often out-engages a mega-influencer, which is exactly why brands increasingly value this metric over raw follower count. Compare against accounts of similar size and niche, not against every account, since "good" varies a lot by platform and audience.`,
        color: benchmarkColor,
      },
      {
        id: 'totalEngagements',
        label: 'Total Engagements',
        value: fmtInt(totalEngagements),
        color: 'neutral',
      },
      {
        id: 'followersUsed',
        label: 'Followers',
        value: fmtInt(followers),
        color: 'neutral',
      },
      {
        id: 'benchmark',
        label: 'Benchmark',
        value: benchmark,
        color: benchmarkColor,
      },
      {
        id: 'influencerTier',
        label: 'Influencer Tier',
        value: tier,
        color: 'neutral',
      },
    ];
  },
  explainSteps: (values) => {
    const platform = values.platform || 'instagram';
    const followers = parseFloat(values.followers);
    const likes = parseFloat(values.likes);
    const comments = parseFloat(values.comments);
    const shares = Math.max(0, parseFloat(values.shares) || 0);
    const saves = Math.max(0, parseFloat(values.saves) || 0);
    if (!Number.isFinite(followers) || followers <= 0) return [];
    if (!Number.isFinite(likes) || likes < 0) return [];
    if (!Number.isFinite(comments) || comments < 0) return [];
    const { totalEngagements, ratePct } = computeEngagement(platform, followers, likes, comments, shares, saves);
    const n = (x: number) => x.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const ignoreSaves = platform === 'x';
    const parts = [`${n(likes)} likes`, `${n(comments)} comments`, `${n(shares)} shares`, ...(ignoreSaves ? [] : [`${n(saves)} saves`])];
    const steps: ExplainStep[] = [
      {
        label: 'Add up the engagements',
        expr: `${parts.join(' + ')} = ${n(totalEngagements)}`,
        note: ignoreSaves ? 'X does not show public saves, so they are left out.' : undefined,
      },
      {
        label: 'Engagement rate = engagements ÷ followers × 100',
        expr: `${n(totalEngagements)} ÷ ${n(followers)} × 100 = ${(Math.round(ratePct * 100) / 100).toFixed(2)}%`,
        note: 'Compare with accounts of a similar size and niche; what counts as good varies by platform.',
      },
    ];
    return finiteSteps(steps);
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(EngagementRatePanel, { values, results });
  },
  educational: {
    formula: 'Engagement Rate = (Likes + Comments + Shares + Saves) ÷ Followers × 100  (X: saves are not public, so Likes + Comments + Reposts)',
    formulaDescription:
      'Engagement rate measures how actively an audience interacts with content as a percentage of total followers. This is the "by followers" definition; some tools divide by reach or impressions instead, which gives a different (usually higher) number, so only compare rates computed the same way.',
    diagram: {
      svg: '<svg viewBox="0 0 440 90" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="20" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Engagement Rate</text><rect x="20" y="34" width="400" height="34" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)"/><text x="220" y="56" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-1e293b)" text-anchor="middle">(Likes + Comments + Shares + Saves) ÷ Followers × 100</text></svg>',
      alt: 'Engagement rate formula: likes plus comments plus shares plus saves, divided by followers, times 100',
      caption: 'Engagement rate by followers. As a rough rule of thumb under 1% is low and over 3.5% is high, but norms vary by platform and account size.',
    },
    variables: [
      { symbol: 'ER', name: 'Engagement Rate', description: 'The percentage of followers who interact with a post. A common rule of thumb treats 1-3.5% as typical and above 3.5% as high, but norms differ by platform, niche and account size.' },
      { symbol: 'Followers', name: 'Follower Count', description: 'The total number of followers or subscribers on the platform. Used as the denominator in the engagement rate formula.' },
      { symbol: 'Engagements', name: 'Total Interactions', description: 'The sum of likes, comments, shares and saves. On X, saves are not public, so only likes, comments and reposts are counted.' },
    ],
    howToUse: [
      'Select the social media platform (Instagram, TikTok, or X).',
      'Enter your follower count and the post\'s likes, comments, shares and saves (shares and saves are optional).',
      'Review your engagement rate, benchmark comparison, and influencer tier classification.',
    ],
    explanation:
      'Engagement rate is the most important metric for social media content performance. It measures how effectively your content resonates with your audience — a high engagement rate means your followers are actively interacting, not just passively scrolling. This calculator counts likes, comments, shares and saves against follower count (X has no public saves, so they are ignored there). Engagement rate says more about content quality than raw follower count does, but it is a rate, not a size: 5,000 followers at 10% and 100,000 followers at 0.5% both produce 500 engagements, so judge reach and rate together. Brands and marketers use engagement rate to evaluate influencer partnerships, usually alongside audience fit and authenticity. For platform algorithms, higher engagement rates signal quality content, leading to increased organic reach. Understanding your engagement rate helps you optimize posting strategy, content format, and timing to maximize audience connection.',
    commonUses: [
      'Measuring social media content performance by calculating what percentage of followers actively engage with each post',
      'Evaluating influencer partnership opportunities by checking audience engagement rates before negotiating sponsorships',
      'Comparing content strategy effectiveness across platforms like Instagram, TikTok, and X to focus efforts where engagement is highest',
      'Tracking engagement trends over time to see if content quality and audience connection are improving month over month',
    ],
    faqs: [
      {
        question: 'What is a good engagement rate?',
        answer: 'A widely used rule of thumb is that 1-3.5% is typical and above 3.5% is high, but there is no official benchmark: published averages differ by platform, niche, account size, post format and how the rate is calculated. Smaller accounts usually show higher rates than very large ones. Compare against similar accounts and your own history.',
      },
      {
        question: 'Why do different tools give different engagement rates?',
        answer: 'Tools differ on which interactions count (saves and shares are often left out), whether they divide by followers, reach or impressions, and whether they average over many posts. Dividing by reach gives a higher rate than dividing by followers. This calculator divides one post\'s likes + comments + shares + saves by followers.',
      },
      {
        question: 'Why does engagement rate matter for influencer marketing?',
        answer: 'Brands use engagement rate to identify authentic influence rather than just reach. A high engagement rate indicates an active, trusting audience that is likely to act on recommendations. Some brands set minimum engagement rates before partnering. An influencer with high engagement can command higher rates because their audience is more likely to convert. Fake followers and engagement pods artificially inflate follower counts without genuine interaction, which is why engagement rate is a more reliable metric.',
      },
      {
        question: 'How can I improve my engagement rate?',
        answer: 'To improve engagement: post consistently, use platform-native features (Reels, Stories, polls), optimize posting times when your audience is active, create interactive content (questions, quizzes, challenges), respond to comments to build community, use trending audio and hashtags, and experiment with different content formats. Quality over quantity — one highly engaging post outperforms ten mediocre ones.',
      },
    ],
    citations: [
      { source: 'Sprout Social', title: 'Engagement Rate Calculator', url: 'https://sproutsocial.com/glossary/engagement-rate/' },
    ],
  },
};

export default engagementRateConfig;
