import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import EngagementRatePanel from './EngagementRatePanel';

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
      helpText: 'Used for TikTok (shares) and X (reposts) calculations',
      showWhen: (values) => values.platform === 'tiktok' || values.platform === 'x',
    },
    {
      id: 'saves',
      label: 'Saves',
      type: 'number',
      placeholder: '20',
      min: 0,
      step: 1,
      helpText: 'Saves are used in TikTok engagement rate calculation',
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

    if (isNaN(followers) || followers <= 0) return [];
    if (isNaN(likes) || likes < 0) return [];
    if (isNaN(comments) || comments < 0) return [];

    let engagementRate = 0;
    let totalEngagements = 0;

    if (platform === 'instagram') {
      totalEngagements = likes + comments;
    } else if (platform === 'tiktok') {
      totalEngagements = likes + comments + shares + saves;
    } else if (platform === 'x') {
      totalEngagements = likes + comments + shares;
    }

    engagementRate = (totalEngagements / followers) * 100;

    const fmtInt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    // Benchmark gauge
    let benchmark = '';
    let benchmarkColor: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (engagementRate < 1) {
      benchmark = 'Low engagement';
      benchmarkColor = 'negative';
    } else if (engagementRate <= 3.5) {
      benchmark = 'Average engagement';
      benchmarkColor = 'neutral';
    } else {
      benchmark = 'High engagement';
      benchmarkColor = 'positive';
    }

    // Influencer tier
    let tier = '';
    if (followers < 10000) {
      tier = 'Nano Influencer';
    } else if (followers < 100000) {
      tier = 'Micro Influencer';
    } else if (followers < 1000000) {
      tier = 'Macro Influencer';
    } else {
      tier = 'Mega Influencer';
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
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(EngagementRatePanel, { values, results });
  },
  educational: {
    formula: 'Instagram ER = (Likes + Comments) ÷ Followers × 100 | TikTok ER = (Likes + Comments + Shares + Saves) ÷ Followers × 100 | X ER = (Likes + Comments + Reposts) ÷ Followers × 100',
    formulaDescription:
      'Engagement rate measures how actively an audience interacts with content as a percentage of total followers. Each platform counts engagement signals differently, so cross-platform comparisons should be done with caution.',
    diagram: {
      svg: '<svg viewBox="0 0 440 120" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Engagement Rate Benchmarks</text><text x="70" y="85" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Instagram</text><text x="170" y="85" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">TikTok</text><text x="270" y="85" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">X (Twitter)</text><text x="370" y="85" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">LinkedIn</text><!-- Bars --><rect x="30" y="40" width="80" height="38" rx="4" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="70" y="63" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">1.5%</text><rect x="130" y="25" width="80" height="53" rx="4" fill="var(--svg-22c55e)" opacity="0.8"/><text x="170" y="55" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">3.2%</text><rect x="230" y="48" width="80" height="30" rx="4" fill="var(--svg-f59e0b)" opacity="0.8"/><text x="270" y="67" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">0.9%</text><rect x="330" y="52" width="80" height="26" rx="4" fill="var(--svg-ef4444)" opacity="0.8"/><text x="370" y="68" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">0.5%</text><!-- Zones --><rect x="30" y="90" width="380" height="6" rx="3" fill="var(--svg-e2e8f0)"/><rect x="30" y="90" width="80" height="6" rx="3" fill="var(--svg-ef4444)"/><rect x="110" y="90" width="180" height="6" rx="3" fill="var(--svg-f59e0b)"/><rect x="290" y="90" width="120" height="6" rx="3" fill="var(--svg-22c55e)"/><text x="25" y="112" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)">Low &lt;1%</text><text x="155" y="112" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)">Avg 1-3.5%</text><text x="330" y="112" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)">High &gt;3.5%</text></svg>',
      alt: 'Bar chart comparing engagement rates across Instagram, TikTok, X, and LinkedIn with benchmark zones',
      caption: 'TikTok typically has the highest engagement rates (3.2% avg), followed by Instagram (1.5%), X (0.9%), and LinkedIn (0.5%). Rates above 3.5% are considered high.',
    },
    variables: [
      { symbol: 'ER', name: 'Engagement Rate', description: 'The percentage of followers who interact with a post. The industry benchmark is 1-3.5%. Rates above 3.5% indicate highly engaged audiences.' },
      { symbol: 'Followers', name: 'Follower Count', description: 'The total number of followers or subscribers on the platform. Used as the denominator in the engagement rate formula.' },
      { symbol: 'Engagements', name: 'Total Interactions', description: 'The sum of likes, comments, shares, and saves (platform-dependent). Instagram uses likes + comments; TikTok adds shares + saves; X uses likes + comments + reposts.' },
    ],
    howToUse: [
      'Select the social media platform (Instagram, TikTok, or X).',
      'Enter your follower count and engagement metrics (likes, comments, and platform-specific interactions).',
      'Review your engagement rate, benchmark comparison, and influencer tier classification.',
    ],
    explanation:
      'Engagement rate is the most important metric for social media content performance. It measures how effectively your content resonates with your audience — a high engagement rate means your followers are actively interacting, not just passively scrolling. The formula varies by platform because each platform captures different interaction types. Instagram counts likes and comments as primary engagement signals (though saves are important for algorithmic reach). TikTok uses likes, comments, shares, and saves to calculate engagement, reflecting its multi-dimensional interaction model. X (formerly Twitter) counts likes, comments, and reposts. Engagement rate is a better measure of content quality than vanity metrics like follower count. A creator with 5,000 followers and a 10% engagement rate has a more valuable audience than one with 100,000 followers and 0.5% engagement, because the highly engaged audience is more likely to convert to customers. Brands and marketers use engagement rate to evaluate influencer partnerships, typically looking for rates above 2% for macro-influencers and above 3% for micro and nano influencers. For platform algorithms, higher engagement rates signal quality content, leading to increased organic reach. Understanding your engagement rate helps you optimize posting strategy, content format, and timing to maximize audience connection.',
    commonUses: [
      'Measuring social media content performance by calculating what percentage of followers actively engage with each post',
      'Evaluating influencer partnership opportunities by checking audience engagement rates before negotiating sponsorships',
      'Comparing content strategy effectiveness across platforms like Instagram, TikTok, and X to focus efforts where engagement is highest',
      'Tracking engagement trends over time to see if content quality and audience connection are improving month over month',
    ],
    faqs: [
      {
        question: 'What is a good engagement rate on Instagram?',
        answer: 'For Instagram, a good engagement rate is typically 1-3.5%. Nano influencers (under 10K followers) often see 3-5% because of closer audience connections. Macro influencers (100K-1M) typically see 1-2%, and mega influencers (1M+) often see 0.5-1.5% due to broader, less targeted audiences. Video content (Reels) generally outperforms static posts and carousels.',
      },
      {
        question: 'How is TikTok engagement rate different from Instagram?',
        answer: 'TikTok engagement rate includes shares and saves in addition to likes and comments, making it a more comprehensive measure. TikTok\'s For You Page algorithm also means a significant portion of engagement can come from non-followers, so your engagement rate can appear higher relative to follower count. TikTok benchmarks are typically higher, with good rates ranging from 3-10% for organic content.',
      },
      {
        question: 'Why does engagement rate matter for influencer marketing?',
        answer: 'Brands use engagement rate to identify authentic influence rather than just reach. A high engagement rate indicates an active, trusting audience that is likely to act on recommendations. Many brands now require minimum engagement rates (often 2-3%) before partnering. An influencer with high engagement can command higher rates because their audience is more likely to convert. Fake followers and engagement pods artificially inflate follower counts without genuine interaction, which is why engagement rate is a more reliable metric.',
      },
      {
        question: 'How can I improve my engagement rate?',
        answer: 'To improve engagement: post consistently (3-5 times per week), use platform-native features (Reels, Stories, polls), optimize posting times when your audience is active, create interactive content (questions, quizzes, challenges), respond to comments to build community, use trending audio and hashtags, and experiment with different content formats. Quality over quantity — one highly engaging post outperforms ten mediocre ones.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Engagement Rate', url: 'https://en.wikipedia.org/wiki/Engagement_rate' },
      { source: 'Sprout Social', title: 'Engagement Rate Calculator', url: 'https://sproutsocial.com/glossary/engagement-rate/' },
    ],
  },
};

export default engagementRateConfig;
