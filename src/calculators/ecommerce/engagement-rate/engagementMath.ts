/** Engagement-rate math shared by index.ts and EngagementRatePanel.tsx (the panel must never re-parse formatted result strings). */
export function computeEngagement(
  platform: string,
  followers: number,
  likes: number,
  comments: number,
  shares = 0,
  saves = 0,
): { totalEngagements: number; ratePct: number } {
  // X has no public saves, so they are ignored there
  const totalEngagements = likes + comments + shares + (platform === 'x' ? 0 : saves);
  return { totalEngagements, ratePct: (totalEngagements / followers) * 100 };
}
