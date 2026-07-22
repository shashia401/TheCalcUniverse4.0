import { CategoryInfo } from '../types/calculator';

/**
 * Lightweight category metadata — safe to import from layout components
 * (Header, Footer) that render on every page.
 *
 * IMPORTANT: do NOT import anything from './registry' here. The registry
 * pulls in metadata for all ~366 calculators (~350 KB) and importing it
 * from an always-rendered component drags that into the initial bundle.
 * test/calculators/categories-sync.test.ts guards the static values below
 * against drift from the real registry.
 */

export const categoryMeta: Record<string, Omit<CategoryInfo, 'count' | 'icon'>> = {
  finance: {
    name: 'Finance',
    slug: 'finance',
    description: 'Personal finance, investments, loans, and real estate finance calculators.',
  },
  health: {
    name: 'Health & Fitness',
    slug: 'health',
    description: 'BMI, calorie, body fat, pregnancy, and wellness calculators.',
  },
  everyday: {
    name: 'Everyday',
    slug: 'everyday',
    description: 'Age, percentage, tip, word count, and everyday utility tools.',
  },
  ecommerce: {
    name: 'E-Commerce',
    slug: 'ecommerce',
    description: 'Profit margin, Amazon FBA, ROAS, break-even, and business calculators.',
  },
  math: {
    name: 'Mathematics',
    slug: 'math',
    description: 'Algebra, geometry, statistics, and number theory tools.',
  },
  diy: {
    name: 'Home DIY',
    slug: 'diy',
    description: 'Paint, tile, concrete, lumber, and renovation estimation tools.',
  },
  automotive: {
    name: 'Automotive',
    slug: 'automotive',
    description: 'Auto loan, MPG, depreciation, lease vs. buy, and vehicle calculators.',
  },
  engineering: {
    name: 'Engineering',
    slug: 'engineering',
    description: "Ohm's law, voltage drop, wire sizing, MTBF, and fluid mechanics tools.",
  },
  industrial: {
    name: 'Industrial & Trades',
    slug: 'industrial',
    description: 'Pressure, torque, energy, electrical, and industrial unit converters.',
  },
  devtools: {
    name: 'Developer Tools',
    slug: 'devtools',
    description: 'JSON formatter, regex tester, UUID generator, and other developer utilities.',
  },
};

export const CATEGORY_ICONS: Record<string, string> = {
  finance: 'TrendingUp',
  health: 'Heart',
  everyday: 'Calculator',
  ecommerce: 'ShoppingCart',
  math: 'BarChart3',
  diy: 'Wrench',
  automotive: 'Car',
  engineering: 'Zap',
  industrial: 'Gauge',
  devtools: 'Code2',
};

/** Static total — guarded against registry drift by categories-sync test */
export const TOTAL_CALCULATOR_COUNT = 343;

/** Category list without per-category counts (no registry dependency). */
export const getCategoryList = (): Omit<CategoryInfo, 'count'>[] =>
  Object.values(categoryMeta).map((meta) => ({
    ...meta,
    icon: CATEGORY_ICONS[meta.slug] ?? 'Calculator',
  }));
