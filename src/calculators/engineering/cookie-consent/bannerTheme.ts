/** Colour tokens and HTML escaping shared by the cookie-banner generator (index.ts) and its live preview (panel). */
export interface BannerTheme {
  bg: string;
  text: string;
  /** Primary-button background; paired with `btnText` for WCAG AA contrast (>= 4.5:1). */
  accent: string;
  btnText: string;
  border: string;
  /** Secondary text on `bg` (AA contrast). */
  muted: string;
  /** Link colour on `bg` (AA contrast). */
  link: string;
}

export function bannerTheme(colorTheme: string): BannerTheme {
  if (colorTheme === 'Dark') return { bg: '#1e293b', text: '#f1f5f9', accent: '#2563eb', btnText: '#ffffff', border: '#475569', muted: '#cbd5e1', link: '#93c5fd' };
  if (colorTheme === 'Custom') return { bg: '#0f172a', text: '#e2e8f0', accent: '#06b6d4', btnText: '#0f172a', border: '#334155', muted: '#cbd5e1', link: '#67e8f9' };
  return { bg: '#ffffff', text: '#1e293b', accent: '#2563eb', btnText: '#ffffff', border: '#cbd5e1', muted: '#475569', link: '#1d4ed8' };
}

/** Escape text for safe insertion into the generated HTML (the site name is user input). */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
