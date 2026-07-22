export const BASE_URL = 'https://thecalcuniverse.com';
export const SITE_NAME = 'TheCalcUniverse';

export const SOCIAL_LINKS = {
  about: `${BASE_URL}/about/`,
} as const;

export const SOCIAL_SAME_AS = Object.values(SOCIAL_LINKS);

export const CATEGORY_EMOJIS: Record<string, string> = {
  finance: '💰',
  health: '❤️',
  everyday: '📱',
  ecommerce: '🛒',
  math: '📐',
  diy: '🔧',
  automotive: '🚗',
  engineering: '⚡',
  industrial: '🏭',
  devtools: '💻',
  realestate: '🏠',
};
