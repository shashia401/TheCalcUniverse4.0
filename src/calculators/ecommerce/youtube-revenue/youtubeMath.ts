/**
 * YouTube ad-revenue math shared by index.ts and YouTubeRevenuePanel.tsx
 * (the panel must never re-parse formatted result strings).
 *
 * Revenue = views x (share of views that show an ad) / 1000 x CPM x creator share.
 * Creator share is 55% of ad revenue on long-form watch pages (YouTube Partner Program terms).
 * NICHE_RANGES are rough planning ranges, NOT figures published by YouTube: real CPM depends on audience country,
 * season, advertiser demand and video length, so treat the result as an order-of-magnitude estimate.
 */
export const CREATOR_SHARE = 0.55;
export const DEFAULT_AD_RATE_PCT = 50;
export const DAYS_PER_YEAR = 365;

export const NICHE_RANGES: Record<string, { min: number; max: number; label: string }> = {
  'finance-crypto': { min: 15, max: 25, label: 'Finance / Crypto' },
  education: { min: 10, max: 18, label: 'Education' },
  tech: { min: 8, max: 15, label: 'Tech' },
  entertainment: { min: 3, max: 8, label: 'Entertainment' },
  gaming: { min: 2, max: 5, label: 'Gaming' },
  vlogging: { min: 3, max: 8, label: 'Vlogging' },
  music: { min: 1, max: 3, label: 'Music' },
};

export function nicheMidCpm(niche: string): number {
  const r = NICHE_RANGES[niche];
  return r ? (r.min + r.max) / 2 : 0;
}

export interface YouTubeFigures {
  daily: number;
  /** A year / 12 (about 30.4 days). */
  monthly: number;
  yearly: number;
  /** Creator revenue per 1,000 total views. */
  rpm: number;
}

export function computeYouTube(dailyViews: number, cpm: number, adRatePct: number): YouTubeFigures {
  const rpm = (adRatePct / 100) * cpm * CREATOR_SHARE;
  const daily = (dailyViews / 1000) * rpm;
  return { daily, monthly: (daily * DAYS_PER_YEAR) / 12, yearly: daily * DAYS_PER_YEAR, rpm };
}
